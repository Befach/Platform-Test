import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { getDefaultModel, getModelByKey, AIModel } from '@/lib/ai/models'
import { callOpenRouter } from '@/lib/ai/openrouter'
import {
  DEPENDENCY_ANALYSIS_SYSTEM_PROMPT,
  generateDependencyAnalysisPrompt,
} from '@/lib/ai/prompts/dependency-suggestion'

/**
 * POST /api/ai/dependencies/suggest - Generate AI dependency suggestions
 *
 * Available AI models (2025 - all with :nitro routing for 30-50% faster throughput):
 * - claude-haiku-45: Best reasoning, 73% SWE-bench (DEFAULT)
 * - grok-4-fast: 2M context, real-time data, 86% cheaper
 * - kimi-k2-thinking: Deep reasoning traces, cheapest input cost ($0.15/M)
 * - minimax-m2: Code generation, agentic workflows
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

    // Get AI model
    const aiModel: AIModel = getModelByKey(model_key) || getDefaultModel()

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
      .from('feature_connections')
      .select('source_feature_id, target_feature_id, connection_type')
      .eq('workspace_id', workspace_id)
      .eq('status', 'active')

    const existingConnectionsSet = new Set(
      existingConnections?.map(
        (conn) => `${conn.source_feature_id}->${conn.target_feature_id}-${conn.connection_type}`
      ) || []
    )

    // Generate AI prompt
    const userPrompt = generateDependencyAnalysisPrompt(workItems)

    // Call AI model
    const response = await callOpenRouter({
      model: aiModel,
      messages: [
        { role: 'system', content: DEPENDENCY_ANALYSIS_SYSTEM_PROMPT },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.3, // Lower temperature for consistent results
      maxTokens: 3000,
    })

    const content = response.choices[0].message.content

    // Parse AI response (extract JSON array)
    let suggestions: any[] = []
    try {
      const jsonMatch = content.match(/\[[\s\S]*\]/)
      if (jsonMatch) {
        suggestions = JSON.parse(jsonMatch[0])
      }
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError)
      return NextResponse.json(
        { error: 'Failed to parse AI response' },
        { status: 500 }
      )
    }

    // Validate and filter suggestions
    const validSuggestions = suggestions.filter((suggestion: any) => {
      // Validate structure
      if (
        !suggestion.sourceId ||
        !suggestion.targetId ||
        !suggestion.connectionType ||
        !suggestion.reason ||
        typeof suggestion.confidence !== 'number'
      ) {
        return false
      }

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
    })

    // Enhance suggestions with work item details
    const enhancedSuggestions = validSuggestions.map((suggestion: any) => {
      const sourceItem = workItems.find((item) => item.id === suggestion.sourceId)
      const targetItem = workItems.find((item) => item.id === suggestion.targetId)

      return {
        sourceId: suggestion.sourceId,
        targetId: suggestion.targetId,
        connectionType: suggestion.connectionType,
        reason: suggestion.reason,
        confidence: suggestion.confidence,
        strength: suggestion.strength || 0.7, // Default strength if not provided
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
    })

    // Sort by confidence (highest first)
    enhancedSuggestions.sort((a, b) => b.confidence - a.confidence)

    // Track AI usage in database
    try {
      await supabase.from('ai_usage').insert({
        id: Date.now().toString(),
        team_id: workspace.team_id,
        workspace_id: workspace_id,
        user_id: user.id,
        model_key: model_key,
        model_id: aiModel.id,
        model_name: aiModel.name,
        provider: aiModel.provider,
        feature_type: 'dependency_suggestion',
        prompt_tokens: response.usage.promptTokens,
        completion_tokens: response.usage.completionTokens,
        total_tokens: response.usage.totalTokens,
        cost_usd: response.costUsd,
        suggestions_generated: enhancedSuggestions.length,
      })
    } catch (trackingError) {
      // Don't fail the request if tracking fails
      console.error('Failed to track AI usage:', trackingError)
    }

    return NextResponse.json({
      suggestions: enhancedSuggestions,
      model: {
        key: model_key,
        name: aiModel.name,
        provider: aiModel.provider,
      },
      usage: {
        promptTokens: response.usage.promptTokens,
        completionTokens: response.usage.completionTokens,
        totalTokens: response.usage.totalTokens,
        costUsd: response.costUsd,
      },
      totalSuggestions: enhancedSuggestions.length,
      analyzedWorkItems: workItems.length,
    })
  } catch (error: any) {
    console.error('Error in POST /api/ai/dependencies/suggest:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
