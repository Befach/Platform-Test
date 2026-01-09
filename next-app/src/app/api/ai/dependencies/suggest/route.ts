/**
 * AI Dependency Suggestion API
 *
 * Analyzes work items and suggests dependencies between them.
 * Uses Vercel AI SDK with generateObject() for type-safe structured output.
 *
 * Migration: Replaced callOpenRouter() with AI SDK generateObject()
 * Benefits: Type-safe responses, automatic validation, no manual JSON parsing
 *
 * Available AI models (2025 - all with :nitro routing for 30-50% faster throughput):
 * - claude-haiku-45: Best reasoning, 73% SWE-bench (DEFAULT)
 * - grok-4-fast: 2M context, real-time data, 86% cheaper
 * - kimi-k2-thinking: Deep reasoning traces, cheapest input cost ($0.15/M)
 * - minimax-m2: Code generation, agentic workflows
 */

import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { generateObject } from 'ai'
import { getDefaultModel, getModelByKey, type AIModel } from '@/lib/ai/models'
import { getModelFromConfig } from '@/lib/ai/ai-sdk-client'
import {
  DependencySuggestionsSchema,
  type DependencySuggestion,
} from '@/lib/ai/schemas'
import { generateDependencyAnalysisPrompt } from '@/lib/ai/prompts/dependency-suggestion'

export const maxDuration = 300 // Match vercel.json for AI routes

/**
 * System prompt for dependency analysis
 * Moved inline for clarity and to leverage Zod schema descriptions
 */
const DEPENDENCY_SYSTEM_PROMPT = `You are an expert software architect analyzing product features and their dependencies.

Your task is to identify logical dependencies between features where:
- Feature A has **dependency** on Feature B if A requires B's data, functionality, or completion before A can start
- Feature A **blocks** Feature B if B cannot proceed until A is complete
- Features **complement** each other if they work better together but don't strictly depend on one another
- Features **relate_to** each other if they share similar concepts or domains but have no strict dependency

Guidelines:
1. **Be conservative**: Only suggest dependencies with high confidence (>= 0.6)
2. **Avoid false positives**: Better to miss a dependency than suggest an incorrect one
3. **Consider timing**: Dependencies should reflect implementation order
4. **Think technical**: Consider APIs, databases, authentication, infrastructure
5. **User flows**: Features in the same user journey often depend on each other

Only include suggestions with confidence >= 0.6.`

/**
 * POST /api/ai/dependencies/suggest - Generate AI dependency suggestions
 *
 * Request body:
 * - workspace_id: string (required)
 * - model_key: string (optional, default: 'claude-haiku-45')
 * - connection_type: string (optional, filter by dependency type)
 *
 * Returns:
 * - suggestions: Array of AI-generated dependency connections
 * - model: Model used for analysis
 * - usage: Token usage and cost
 */
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { workspace_id, model_key = 'claude-haiku-45', connection_type } = body

    if (!workspace_id) {
      return NextResponse.json(
        { error: 'workspace_id is required' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get workspace to verify access
    const { data: workspace } = await supabase
      .from('workspaces')
      .select('team_id')
      .eq('id', workspace_id)
      .single()

    if (!workspace) {
      return NextResponse.json({ error: 'Workspace not found' }, { status: 404 })
    }

    // Check if user has access to this workspace's team
    const { data: teamMember } = await supabase
      .from('team_members')
      .select('role')
      .eq('team_id', workspace.team_id)
      .eq('user_id', user.id)
      .single()

    if (!teamMember) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Get AI model configuration
    const configModel: AIModel = getModelByKey(model_key) || getDefaultModel()
    const aiModel = getModelFromConfig(configModel.id)

    // Get all work items for this workspace
    const { data: workItems, error: workItemsError } = await supabase
      .from('work_items')
      .select('id, name, purpose, type, timeline, status')
      .eq('team_id', workspace.team_id)
      .eq('workspace_id', workspace_id)

    if (workItemsError) {
      console.error('Error fetching work items:', workItemsError)
      return NextResponse.json({ error: workItemsError.message }, { status: 500 })
    }

    if (!workItems || workItems.length < 2) {
      return NextResponse.json({
        suggestions: [],
        message: 'Need at least 2 work items to suggest dependencies',
      })
    }

    // Get existing connections to avoid duplicates
    const { data: existingConnections } = await supabase
      .from('work_item_connections')
      .select('source_work_item_id, target_work_item_id, connection_type')
      .eq('workspace_id', workspace_id)
      .eq('status', 'active')

    const existingConnectionsSet = new Set(
      existingConnections?.map(
        (conn) =>
          `${conn.source_work_item_id}->${conn.target_work_item_id}-${conn.connection_type}`
      ) || []
    )

    // Generate user prompt with work items
    const userPrompt = generateDependencyAnalysisPrompt(workItems)

    // Use generateObject for type-safe structured output
    const result = await generateObject({
      model: aiModel,
      schema: DependencySuggestionsSchema,
      system: DEPENDENCY_SYSTEM_PROMPT,
      prompt: userPrompt,
      temperature: 0.3, // Lower temperature for consistent results
    })

    // Filter and validate suggestions
    const validSuggestions = result.object.suggestions.filter(
      (suggestion: DependencySuggestion) => {
        // Validate IDs exist in work items
        const sourceExists = workItems.some((item) => item.id === suggestion.sourceId)
        const targetExists = workItems.some((item) => item.id === suggestion.targetId)
        if (!sourceExists || !targetExists) {
          return false
        }

        // Filter out existing connections
        const connectionKey = `${suggestion.sourceId}->${suggestion.targetId}-${suggestion.connectionType}`
        if (existingConnectionsSet.has(connectionKey)) {
          return false
        }

        // Filter by connection type if specified
        if (connection_type && suggestion.connectionType !== connection_type) {
          return false
        }

        // Only include high-confidence suggestions
        return suggestion.confidence >= 0.6
      }
    )

    // Enhance suggestions with work item details
    const enhancedSuggestions = validSuggestions.map(
      (suggestion: DependencySuggestion) => {
        const sourceItem = workItems.find((item) => item.id === suggestion.sourceId)
        const targetItem = workItems.find((item) => item.id === suggestion.targetId)

        return {
          sourceId: suggestion.sourceId,
          targetId: suggestion.targetId,
          connectionType: suggestion.connectionType,
          reason: suggestion.reason,
          confidence: suggestion.confidence,
          strength: suggestion.strength || 0.7,
          sourceWorkItem: sourceItem
            ? {
                id: sourceItem.id,
                name: sourceItem.name,
                type: sourceItem.type,
              }
            : null,
          targetWorkItem: targetItem
            ? {
                id: targetItem.id,
                name: targetItem.name,
                type: targetItem.type,
              }
            : null,
        }
      }
    )

    // Sort by confidence (highest first)
    enhancedSuggestions.sort((a, b) => b.confidence - a.confidence)

    // Calculate estimated cost from usage
    const estimatedCost = result.usage
      ? ((result.usage.inputTokens ?? 0) / 1_000_000) * configModel.costPer1M.input +
        ((result.usage.outputTokens ?? 0) / 1_000_000) * configModel.costPer1M.output
      : 0

    // Track AI usage in database
    try {
      await supabase.from('ai_usage').insert({
        id: Date.now().toString(),
        team_id: workspace.team_id,
        workspace_id: workspace_id,
        user_id: user.id,
        model_key: model_key,
        model_id: configModel.id,
        model_name: configModel.name,
        provider: configModel.provider,
        feature_type: 'dependency_suggestion',
        prompt_tokens: result.usage?.inputTokens || 0,
        completion_tokens: result.usage?.outputTokens || 0,
        total_tokens: result.usage?.totalTokens || 0,
        cost_usd: estimatedCost,
        suggestions_generated: enhancedSuggestions.length,
      })
    } catch (trackingError) {
      // Don't fail the request if tracking fails
      console.error('Failed to track AI usage:', trackingError)
    }

    return NextResponse.json({
      suggestions: enhancedSuggestions,
      analysis: result.object.analysis,
      model: {
        key: model_key,
        name: configModel.name,
        provider: configModel.provider,
      },
      usage: result.usage
        ? {
            inputTokens: result.usage.inputTokens ?? 0,
            outputTokens: result.usage.outputTokens ?? 0,
            totalTokens: result.usage.totalTokens ?? 0,
            costUsd: estimatedCost,
          }
        : undefined,
      totalSuggestions: enhancedSuggestions.length,
      analyzedWorkItems: workItems.length,
    })
  } catch (error: unknown) {
    console.error('Error in POST /api/ai/dependencies/suggest:', error)

    // Handle AI SDK specific errors
    if (error instanceof Error) {
      if (error.message.includes('validation')) {
        return NextResponse.json(
          {
            error: 'AI response validation failed',
            details: error.message,
          },
          { status: 500 }
        )
      }
    }

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
