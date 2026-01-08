/**
 * AI Note Analysis API
 *
 * Analyzes placeholder notes and suggests conversion to work items.
 * Uses Vercel AI SDK with generateObject() for type-safe structured output.
 *
 * Migration: Replaced manual OpenRouter calls with AI SDK generateObject()
 * Benefits: Type-safe responses, automatic validation, no manual JSON parsing
 */

import { NextRequest, NextResponse } from 'next/server'
import { generateObject } from 'ai'
import { createClient } from '@/lib/supabase/server'
import { aiModels, getModelFromConfig } from '@/lib/ai/ai-sdk-client'
import { SuggestedWorkItemSchema, type SuggestedWorkItem } from '@/lib/ai/schemas'
import { getModelByKey } from '@/lib/ai/models'

export const maxDuration = 300 // Match vercel.json for AI routes

interface AnalyzeNoteRequest {
  noteContent: string
  workspaceContext?: {
    existingTypes: string[]
    existingTags: string[]
  }
  model?: string // Optional model key (default: claude-haiku-45)
}

interface AnalyzeNoteResponse {
  success: boolean
  suggestion: SuggestedWorkItem
  model: string
  usage?: {
    inputTokens: number
    outputTokens: number
    totalTokens: number
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Parse request body
    const body: AnalyzeNoteRequest = await request.json()
    const { noteContent, workspaceContext, model: modelKey = 'claude-haiku-45' } = body

    if (!noteContent || noteContent.trim().length === 0) {
      return NextResponse.json({ error: 'Note content is required' }, { status: 400 })
    }

    // Get AI model
    const configModel = getModelByKey(modelKey)
    const aiModel = configModel
      ? getModelFromConfig(configModel.id)
      : aiModels.claudeHaiku

    // Build context prompt
    const contextInfo = workspaceContext
      ? `
## Workspace Context:
- Existing work item types: ${workspaceContext.existingTypes.join(', ') || 'None'}
- Existing tags: ${workspaceContext.existingTags.join(', ') || 'None'}

Consider reusing existing tags when appropriate.
`
      : ''

    // Use generateObject for type-safe structured output
    const result = await generateObject({
      model: aiModel,
      schema: SuggestedWorkItemSchema,
      system: `You are an AI assistant that analyzes placeholder notes and suggests how to convert them into proper work items for a product lifecycle management system.

## Work Item Types:
- **idea**: High-level concept or brainstorming note
- **epic**: Large body of work spanning multiple features
- **feature**: User-facing functionality
- **user_story**: Specific user need or requirement (format: "As a [user], I want [goal] so that [benefit]")
- **task**: Technical implementation work
- **bug**: Issue or defect to fix

## Priority Levels:
- **critical**: Blocking other work, security issues, data loss risk
- **high**: Important for next release, significant user impact
- **medium**: Standard priority, normal development flow
- **low**: Nice to have, can be deferred

## Guidelines:
1. Choose the most specific type that fits (prefer feature over idea if it's clearly defined)
2. Write concise names (3-8 words) that describe the outcome
3. Purpose should explain WHY this matters, not just WHAT it is
4. Acceptance criteria should be specific and testable
5. Only estimate hours if you have enough context
6. Set confidence based on how well the note describes the work
${contextInfo}`,
      prompt: `Analyze this note and suggest how to convert it to a work item:

---
${noteContent}
---

Provide a structured suggestion with appropriate type, name, purpose, priority, tags, and acceptance criteria.`,
      temperature: 0.3, // Lower temperature for consistent results
    })

    // Build response
    const response: AnalyzeNoteResponse = {
      success: true,
      suggestion: result.object,
      model: configModel?.name || 'Claude Haiku 4.5',
      usage: result.usage
        ? {
            inputTokens: result.usage.inputTokens ?? 0,
            outputTokens: result.usage.outputTokens ?? 0,
            totalTokens: result.usage.totalTokens ?? 0,
          }
        : undefined,
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('[AI Note Analysis] Error:', error)

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
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
