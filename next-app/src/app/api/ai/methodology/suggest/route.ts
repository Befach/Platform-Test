/**
 * AI Methodology Suggestion API
 *
 * Provides AI-powered Design Thinking methodology recommendations
 * based on work item context and current phase.
 *
 * POST /api/ai/methodology/suggest
 *
 * Request body:
 * - work_item_id: string (required)
 * - team_id: string (required)
 * - workspace_id: string (optional)
 * - current_phase: WorkspacePhase (required)
 * - work_item_context: { name, purpose, type, progress_percent?, blockers?, tags? }
 * - model_key: string (optional, default: 'claude-haiku-45')
 *
 * Returns:
 * - suggestion: MethodologySuggestion (framework, methods, nextSteps, caseStudies, tips)
 * - model: Model used for analysis
 * - usage: Token usage and cost
 */

import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { generateObject } from 'ai'
import { getDefaultModel, getModelByKey, type AIModel } from '@/lib/ai/models'
import { getModelFromConfig } from '@/lib/ai/ai-sdk-client'
import { MethodologySuggestionSchema, type MethodologySuggestion } from '@/lib/ai/schemas'
import {
  METHODOLOGY_SYSTEM_PROMPT,
  generateMethodologyPrompt,
  getValidToolIds,
  getValidCaseStudyIds,
} from '@/lib/ai/prompts/methodology-suggestion'
import type { WorkspacePhase } from '@/lib/constants/workspace-phases'
import { getToolById, getCaseStudyById } from '@/lib/design-thinking'

export const maxDuration = 60 // Allow up to 60s for AI analysis

/**
 * POST /api/ai/methodology/suggest - Generate AI methodology recommendations
 */
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const {
      work_item_id,
      team_id,
      workspace_id,
      current_phase,
      work_item_context,
      model_key = 'claude-haiku-45',
    } = body

    // Validate required fields
    if (!work_item_id) {
      return NextResponse.json(
        { error: 'work_item_id is required' },
        { status: 400 }
      )
    }

    if (!team_id) {
      return NextResponse.json(
        { error: 'team_id is required' },
        { status: 400 }
      )
    }

    if (!current_phase) {
      return NextResponse.json(
        { error: 'current_phase is required' },
        { status: 400 }
      )
    }

    // Validate phase value
    const validPhases: WorkspacePhase[] = ['design', 'build', 'refine', 'launch']
    if (!validPhases.includes(current_phase)) {
      return NextResponse.json(
        { error: `Invalid phase. Must be one of: ${validPhases.join(', ')}` },
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

    // Fetch work item if not provided in context
    let workItemData = work_item_context
    if (!workItemData || !workItemData.name) {
      const { data: workItem, error: workItemError } = await supabase
        .from('work_items')
        .select('id, name, purpose, type, phase, progress_percent, blockers, acceptance_criteria, tags')
        .eq('id', work_item_id)
        .eq('team_id', team_id)
        .single()

      if (workItemError || !workItem) {
        return NextResponse.json(
          { error: 'Work item not found or access denied' },
          { status: 404 }
        )
      }

      workItemData = {
        id: workItem.id,
        name: workItem.name,
        purpose: workItem.purpose,
        type: workItem.type,
        phase: workItem.phase || current_phase,
        progress_percent: workItem.progress_percent,
        blockers: workItem.blockers,
        acceptance_criteria: workItem.acceptance_criteria,
        tags: workItem.tags,
      }
    }

    // Build context for prompt
    const promptContext = {
      id: work_item_id,
      name: workItemData.name || 'Unnamed work item',
      purpose: workItemData.purpose,
      type: workItemData.type || 'feature',
      phase: current_phase as WorkspacePhase,
      progress_percent: workItemData.progress_percent,
      blockers: workItemData.blockers,
      acceptance_criteria: workItemData.acceptance_criteria,
      tags: workItemData.tags,
    }

    // Generate user prompt
    const userPrompt = generateMethodologyPrompt(promptContext)

    // Use generateObject for type-safe structured output
    const result = await generateObject({
      model: aiModel,
      schema: MethodologySuggestionSchema,
      system: METHODOLOGY_SYSTEM_PROMPT,
      prompt: userPrompt,
      temperature: 0.4, // Slightly higher for creative suggestions
    })

    // Validate and enhance suggestions
    const validToolIds = getValidToolIds()
    const validCaseStudyIds = getValidCaseStudyIds()

    // Filter suggested methods to valid tool IDs where possible
    const enhancedMethods = result.object.suggestedMethods.map((method) => {
      const tool = getToolById(method.toolId)
      return {
        ...method,
        toolName: tool?.name || method.toolName,
        toolDescription: tool?.description,
        duration: tool?.duration,
        participants: tool?.participants,
      }
    })

    // Enhance case studies with full data
    const enhancedCaseStudies = result.object.relevantCaseStudies
      .filter((id) => validCaseStudyIds.includes(id))
      .map((id) => {
        const caseStudy = getCaseStudyById(id)
        return caseStudy || { id }
      })

    // Build enhanced response
    const enhancedSuggestion = {
      ...result.object,
      suggestedMethods: enhancedMethods,
      relevantCaseStudies: enhancedCaseStudies,
    }

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
        feature_type: 'methodology_suggestion',
        prompt_tokens: result.usage?.inputTokens || 0,
        completion_tokens: result.usage?.outputTokens || 0,
        total_tokens: result.usage?.totalTokens || 0,
        cost_usd: estimatedCost,
        suggestions_generated: enhancedMethods.length,
      })
    } catch (trackingError) {
      // Don't fail the request if tracking fails
      console.error('Failed to track AI usage:', trackingError)
    }

    return NextResponse.json({
      suggestion: enhancedSuggestion,
      workItem: {
        id: work_item_id,
        name: workItemData.name,
        type: workItemData.type,
        phase: current_phase,
      },
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
    })
  } catch (error: unknown) {
    console.error('Error in POST /api/ai/methodology/suggest:', error)

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
