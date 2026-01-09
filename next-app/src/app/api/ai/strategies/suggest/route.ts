/**
 * AI Strategy Alignment Suggestion API
 *
 * Analyzes unaligned work items and suggests strategy alignments.
 * Uses Vercel AI SDK with generateObject() for type-safe structured output.
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
  AlignmentSuggestionsSchema,
  type AlignmentSuggestionAI,
} from '@/lib/ai/schemas'

export const maxDuration = 300 // Match vercel.json for AI routes

/**
 * System prompt for alignment analysis
 */
const ALIGNMENT_SYSTEM_PROMPT = `You are an expert product strategist analyzing how product features and work items align with business strategy.

Your task is to suggest alignments between work items (features, bugs, enhancements) and strategies (pillars, objectives, key results, initiatives).

Strategy Hierarchy:
- **Pillar**: High-level strategic themes (e.g., "Improve User Engagement")
- **Objective**: Specific goals under a pillar (e.g., "Reduce onboarding friction")
- **Key Result**: Measurable outcomes (e.g., "Increase DAU by 20%")
- **Initiative**: Tactical programs (e.g., "Redesign onboarding flow")

Alignment Guidelines:
1. **Strong alignment**: Work item directly contributes to the strategy's success
2. **Medium alignment**: Work item supports the strategy indirectly
3. **Weak alignment**: Work item is tangentially related

Rules:
1. **Prefer specificity**: Align to the most specific level (Key Result > Objective > Pillar)
2. **One primary**: Each work item should have one primary (strongest) alignment
3. **Be conservative**: Only suggest alignments with high confidence (>= 0.6)
4. **Consider scope**: Bugs typically align to initiatives, features to objectives/KRs
5. **Match domain**: Align based on shared domain (e.g., "auth feature" -> "security pillar")

Only include suggestions with confidence >= 0.6.`

/**
 * Generate prompt for work items and strategies
 */
function generateAlignmentPrompt(
  workItems: Array<{ id: string; name: string; type: string; purpose?: string }>,
  strategies: Array<{ id: string; title: string; type: string; description?: string }>
): string {
  const workItemsText = workItems
    .map((w) => `- [${w.id}] "${w.name}" (${w.type})${w.purpose ? `: ${w.purpose}` : ''}`)
    .join('\n')

  const strategiesText = strategies
    .map((s) => `- [${s.id}] "${s.title}" (${s.type})${s.description ? `: ${s.description}` : ''}`)
    .join('\n')

  return `Analyze the following work items and strategies. Suggest alignments between unaligned work items and the most appropriate strategies.

## Work Items (need alignment):
${workItemsText}

## Strategies (available targets):
${strategiesText}

For each work item, suggest the best strategy alignment based on:
- Semantic similarity between work item and strategy
- Type matching (features -> objectives, bugs -> initiatives)
- Domain alignment

Return your suggestions in the required JSON format.`
}

/**
 * POST /api/ai/strategies/suggest - Generate AI alignment suggestions
 *
 * Request body:
 * - team_id: string (required)
 * - workspace_id: string (optional)
 * - work_item_id: string (optional, analyze single work item)
 * - model_key: string (optional, default: 'claude-haiku-45')
 *
 * Returns:
 * - suggestions: Array of AI-generated alignment suggestions
 * - model: Model used for analysis
 * - usage: Token usage and cost
 */
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const {
      team_id,
      workspace_id,
      work_item_id,
      model_key = 'claude-haiku-45',
    } = body

    if (!team_id) {
      return NextResponse.json(
        { error: 'team_id is required' },
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

    // Check if user has access to this team
    const { data: teamMember } = await supabase
      .from('team_members')
      .select('role')
      .eq('team_id', team_id)
      .eq('user_id', user.id)
      .single()

    if (!teamMember) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Get AI model configuration
    const configModel: AIModel = getModelByKey(model_key) || getDefaultModel()
    const aiModel = getModelFromConfig(configModel.id)

    // Build work items query - get unaligned items (no strategy_id)
    let workItemsQuery = supabase
      .from('work_items')
      .select('id, name, purpose, type, status')
      .eq('team_id', team_id)

    if (workspace_id) {
      workItemsQuery = workItemsQuery.eq('workspace_id', workspace_id)
    }

    if (work_item_id) {
      // Analyze single work item
      workItemsQuery = workItemsQuery.eq('id', work_item_id)
    } else {
      // Get unaligned work items (no primary strategy)
      workItemsQuery = workItemsQuery.is('strategy_id', null)
    }

    // Limit to reasonable number for analysis
    workItemsQuery = workItemsQuery.limit(50)

    const { data: workItems, error: workItemsError } = await workItemsQuery

    if (workItemsError) {
      console.error('Error fetching work items:', workItemsError)
      return NextResponse.json({ error: workItemsError.message }, { status: 500 })
    }

    if (!workItems || workItems.length === 0) {
      return NextResponse.json({
        suggestions: [],
        message: 'No unaligned work items found',
      })
    }

    // Get strategies for this team/workspace
    let strategiesQuery = supabase
      .from('product_strategies')
      .select('id, title, description, type, status')
      .eq('team_id', team_id)
      .not('status', 'in', '("completed","cancelled")')

    if (workspace_id) {
      strategiesQuery = strategiesQuery.eq('workspace_id', workspace_id)
    }

    const { data: strategies, error: strategiesError } = await strategiesQuery

    if (strategiesError) {
      console.error('Error fetching strategies:', strategiesError)
      return NextResponse.json({ error: strategiesError.message }, { status: 500 })
    }

    if (!strategies || strategies.length === 0) {
      return NextResponse.json({
        suggestions: [],
        message: 'No active strategies found to align with',
      })
    }

    // Get existing alignments to avoid duplicates
    const workItemIds = workItems.map((w) => w.id)
    const { data: existingAlignments } = await supabase
      .from('work_item_strategies')
      .select('work_item_id, strategy_id')
      .in('work_item_id', workItemIds)

    const existingAlignmentSet = new Set(
      existingAlignments?.map(
        (a) => `${a.work_item_id}->${a.strategy_id}`
      ) || []
    )

    // Generate user prompt
    const userPrompt = generateAlignmentPrompt(workItems, strategies)

    // Use generateObject for type-safe structured output
    const result = await generateObject({
      model: aiModel,
      schema: AlignmentSuggestionsSchema,
      system: ALIGNMENT_SYSTEM_PROMPT,
      prompt: userPrompt,
      temperature: 0.3, // Lower temperature for consistent results
    })

    // Filter and validate suggestions
    const validSuggestions = result.object.suggestions.filter(
      (suggestion: AlignmentSuggestionAI) => {
        // Validate IDs exist
        const workItemExists = workItems.some((item) => item.id === suggestion.workItemId)
        const strategyExists = strategies.some((s) => s.id === suggestion.strategyId)
        if (!workItemExists || !strategyExists) {
          return false
        }

        // Filter out existing alignments
        const alignmentKey = `${suggestion.workItemId}->${suggestion.strategyId}`
        if (existingAlignmentSet.has(alignmentKey)) {
          return false
        }

        // Only include high-confidence suggestions
        return suggestion.confidence >= 0.6
      }
    )

    // Enhance suggestions with entity details
    const enhancedSuggestions = validSuggestions.map(
      (suggestion: AlignmentSuggestionAI) => {
        const workItem = workItems.find((item) => item.id === suggestion.workItemId)
        const strategy = strategies.find((s) => s.id === suggestion.strategyId)

        return {
          workItemId: suggestion.workItemId,
          strategyId: suggestion.strategyId,
          confidence: suggestion.confidence,
          reason: suggestion.reason,
          alignmentStrength: suggestion.alignmentStrength,
          workItem: workItem
            ? {
                id: workItem.id,
                name: workItem.name,
                type: workItem.type,
              }
            : null,
          strategy: strategy
            ? {
                id: strategy.id,
                title: strategy.title,
                type: strategy.type,
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
        team_id: team_id,
        workspace_id: workspace_id || null,
        user_id: user.id,
        model_key: model_key,
        model_id: configModel.id,
        model_name: configModel.name,
        provider: configModel.provider,
        feature_type: 'alignment_suggestion',
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
      availableStrategies: strategies.length,
    })
  } catch (error: unknown) {
    console.error('Error in POST /api/ai/strategies/suggest:', error)

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
