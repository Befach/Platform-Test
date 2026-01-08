/**
 * Unified AI Chat API
 *
 * Supports multiple AI providers:
 * - OpenRouter: GPT-4, Claude, Grok, Gemini, DeepSeek (via openrouter.ts)
 * - Parallel AI: Speed/Quality chat models (via parallel-ai.ts)
 *
 * Features:
 * - Streaming responses
 * - Web search integration (Parallel AI Search)
 * - Context enrichment
 * - Usage tracking
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { callOpenRouter, streamOpenRouter, type ChatMessage } from '@/lib/ai/openrouter'
import { ParallelAI, type ParallelChatMessage } from '@/lib/ai/parallel-ai'
import { getModelByKey } from '@/lib/ai/models'

export const maxDuration = 300 // Match vercel.json for AI routes

interface ChatRequest {
  messages: ChatMessage[]
  model?: string // OpenRouter model key (e.g., 'gpt-4o', 'claude-haiku-45')
  provider?: 'openrouter' | 'parallel' // default: 'openrouter'
  parallelModel?: 'speed' | 'quality' // for Parallel AI
  stream?: boolean // default: false
  temperature?: number
  maxTokens?: number
  enableSearch?: boolean // Use Parallel AI Search for context enrichment
  searchQuery?: string // Custom search query (defaults to last user message)
}

interface ChatResponse {
  success: boolean
  message?: string
  model?: string
  provider?: string
  usage?: {
    promptTokens: number
    completionTokens: number
    totalTokens: number
  }
  costUsd?: number
  searchResults?: Array<{
    title: string
    url: string
    content?: string
    snippet?: string
    score?: number
  }>
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
    const body: ChatRequest = await request.json()
    const {
      messages,
      model: modelKey = 'claude-haiku-45',
      provider = 'openrouter',
      parallelModel = 'speed',
      stream = false,
      temperature,
      maxTokens,
      enableSearch = false,
      searchQuery,
    } = body

    if (!messages || messages.length === 0) {
      return NextResponse.json({ error: 'Messages are required' }, { status: 400 })
    }

    // Enrich context with web search if enabled
    const enrichedMessages = [...messages]
    let searchResults: Array<{
      title: string
      url: string
      content?: string
      snippet?: string
      score?: number
    }> = []

    if (enableSearch) {
      const query = searchQuery || messages[messages.length - 1]?.content || ''
      if (query) {
        try {
          const searchResponse = await ParallelAI.search({
            objective: query,
            maxResults: 3,
          })
          searchResults = searchResponse.results || []

          if (searchResults.length > 0) {
            // Add search context as a system message
            const searchContext = searchResults
              .map((r, i) => `[${i + 1}] ${r.title}\n${r.content?.slice(0, 500) || r.snippet || ''}`)
              .join('\n\n')

            // Insert search context after the first system message (or at start)
            const systemIndex = enrichedMessages.findIndex((m) => m.role === 'system')
            if (systemIndex >= 0) {
              enrichedMessages[systemIndex] = {
                ...enrichedMessages[systemIndex],
                content: `${enrichedMessages[systemIndex].content}\n\n## Web Search Context:\n${searchContext}`,
              }
            } else {
              enrichedMessages.unshift({
                role: 'system',
                content: `Use this web search context to inform your response:\n\n${searchContext}`,
              })
            }
          }
        } catch (searchError) {
          console.warn('[AI Chat] Search enrichment failed:', searchError)
          // Continue without search - don't fail the request
        }
      }
    }

    // Route to appropriate provider
    if (provider === 'parallel') {
      // Use Parallel AI Chat
      const parallelMessages: ParallelChatMessage[] = enrichedMessages.map((m) => ({
        role: m.role,
        content: m.content,
      }))

      if (stream) {
        // Streaming response
        const streamBody = await ParallelAI.chatStream({
          model: parallelModel,
          messages: parallelMessages,
          temperature,
          maxTokens,
        })

        return new Response(streamBody, {
          headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            Connection: 'keep-alive',
          },
        })
      }

      // Non-streaming response
      const response = await ParallelAI.chat({
        model: parallelModel,
        messages: parallelMessages,
        temperature,
        maxTokens,
      })

      const result: ChatResponse = {
        success: true,
        message: response.choices[0]?.message?.content || '',
        model: parallelModel,
        provider: 'parallel',
        usage: response.usage
          ? {
              promptTokens: response.usage.prompt_tokens,
              completionTokens: response.usage.completion_tokens,
              totalTokens: response.usage.total_tokens,
            }
          : undefined,
        searchResults: searchResults.length > 0 ? searchResults : undefined,
      }

      return NextResponse.json(result)
    }

    // Use OpenRouter
    const aiModel = getModelByKey(modelKey)
    if (!aiModel) {
      return NextResponse.json(
        { error: `Unknown model: ${modelKey}. Available: gpt-4o, gpt-4o-mini, claude-haiku-45, etc.` },
        { status: 400 }
      )
    }

    if (stream) {
      // Streaming response
      const streamBody = await streamOpenRouter({
        model: aiModel,
        messages: enrichedMessages,
        temperature,
        maxTokens,
        stream: true,
      })

      return new Response(streamBody, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          Connection: 'keep-alive',
        },
      })
    }

    // Non-streaming response
    const response = await callOpenRouter({
      model: aiModel,
      messages: enrichedMessages,
      temperature,
      maxTokens,
    })

    const result: ChatResponse = {
      success: true,
      message: response.choices[0]?.message?.content || '',
      model: aiModel.name,
      provider: 'openrouter',
      usage: {
        promptTokens: response.usage.promptTokens,
        completionTokens: response.usage.completionTokens,
        totalTokens: response.usage.totalTokens,
      },
      costUsd: response.costUsd,
      searchResults: searchResults.length > 0 ? searchResults : undefined,
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('[AI Chat] Error:', error)
    return NextResponse.json(
      {
        error: 'Failed to process chat request',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

/**
 * GET endpoint to list available models
 */
export async function GET() {
  const { getAllModels, AI_MODELS } = await import('@/lib/ai/models')
  const models = getAllModels()

  return NextResponse.json({
    openrouter: models.map((m) => ({
      key: Object.entries(AI_MODELS).find(([, v]) => v.id === m.id)?.[0],
      id: m.id,
      name: m.name,
      provider: m.provider,
      description: m.description,
      speed: m.speed,
      costPer1M: m.costPer1M,
    })),
    parallel: [
      { key: 'speed', name: 'Parallel Speed', description: 'Fast responses' },
      { key: 'quality', name: 'Parallel Quality', description: 'Higher quality' },
    ],
  })
}
