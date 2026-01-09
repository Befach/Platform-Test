/**
 * AI SDK Chat API
 *
 * Modern chat endpoint using Vercel AI SDK with:
 * - OpenRouter as the LLM provider (300+ models)
 * - Parallel AI as the tool layer (search, extract, research)
 * - Built-in streaming via AI SDK's streamText()
 * - Compatible with useChat() hook on the frontend
 *
 * Architecture:
 * User → useChat() → This Route → OpenRouter → AI Model
 *                                      ↓ (tool calls)
 *                               Parallel AI APIs
 */

import { streamText, convertToCoreMessages, type UIMessage, type LanguageModel } from 'ai'
import { createClient } from '@/lib/supabase/server'
import { openrouter, aiModels, getModelFromConfig } from '@/lib/ai/ai-sdk-client'
import { parallelAITools, parallelAIQuickTools } from '@/lib/ai/tools/parallel-ai-tools'
import { getModelByKey } from '@/lib/ai/models'
import { logSlowRequest } from '@/lib/ai/openrouter'

// Match vercel.json functions config for app/api/ai/**/*.ts
export const maxDuration = 300

/**
 * System prompt for the AI assistant
 */
const DEFAULT_SYSTEM_PROMPT = `You are an AI assistant for the Product Lifecycle Platform. You help users with:
- Product planning and roadmap creation
- Feature prioritization and dependency analysis
- Mind mapping and ideation
- Research and competitive analysis
- Task management and execution tracking

You have access to tools for web search, content extraction, and deep research. Use them when:
- The user asks about current events, trends, or real-time information
- You need to look up documentation or technical references
- Complex research questions require comprehensive analysis

Be concise, helpful, and provide actionable insights. When citing information from web searches, mention the source.`

/**
 * POST /api/ai/sdk-chat
 *
 * Handles chat requests with streaming responses.
 * Compatible with the AI SDK's useChat() hook.
 *
 * Request body:
 * - messages: Message[] - Conversation history
 * - model?: string - OpenRouter model ID or key (default: claude-haiku-45)
 * - enableTools?: boolean - Enable Parallel AI tools (default: true)
 * - quickMode?: boolean - Use only quick tools, no deep research (default: false)
 * - systemPrompt?: string - Custom system prompt
 * - workspaceContext?: object - Context about current workspace
 */
export async function POST(request: Request) {
  try {
    const supabase = await createClient()

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return new Response('Unauthorized', { status: 401 })
    }

    // Parse request body
    const body = await request.json()
    const {
      messages,
      model: modelInput,
      enableTools = true,
      quickMode = false,
      systemPrompt,
      workspaceContext,
    } = body as {
      messages: UIMessage[]
      model?: string
      enableTools?: boolean
      quickMode?: boolean
      systemPrompt?: string
      workspaceContext?: {
        workspaceId?: string
        workspaceName?: string
        workspacePhase?: string
        currentWorkItems?: Array<{ name: string; status: string }>
      }
    }

    if (!messages || messages.length === 0) {
      return new Response('Messages are required', { status: 400 })
    }

    // Determine which model to use
    let aiModel: LanguageModel = aiModels.claudeHaiku // Default
    let resolvedModelId = 'anthropic/claude-haiku-4.5:nitro' // Default model ID for logging

    if (modelInput) {
      // Check if it's a model key from our config (e.g., 'claude-haiku-45')
      const configModel = getModelByKey(modelInput)
      if (configModel) {
        aiModel = getModelFromConfig(configModel.id)
        resolvedModelId = configModel.id // Use the actual OpenRouter model ID
      } else {
        // Assume it's a direct OpenRouter model ID
        aiModel = openrouter(modelInput)
        resolvedModelId = modelInput // Already a model ID
      }
    }

    // Build system prompt with workspace context
    let fullSystemPrompt = systemPrompt || DEFAULT_SYSTEM_PROMPT

    if (workspaceContext) {
      const contextParts: string[] = []

      if (workspaceContext.workspaceName) {
        contextParts.push(`Current workspace: ${workspaceContext.workspaceName}`)
      }
      if (workspaceContext.workspacePhase) {
        contextParts.push(`Current phase: ${workspaceContext.workspacePhase}`)
      }
      if (workspaceContext.currentWorkItems && workspaceContext.currentWorkItems.length > 0) {
        const itemSummary = workspaceContext.currentWorkItems
          .slice(0, 10)
          .map((item) => `- ${item.name} (${item.status})`)
          .join('\n')
        contextParts.push(`Active work items:\n${itemSummary}`)
      }

      if (contextParts.length > 0) {
        fullSystemPrompt += `\n\n## Current Context:\n${contextParts.join('\n')}`
      }
    }

    // Select tool set based on mode
    const tools = enableTools
      ? quickMode
        ? parallelAIQuickTools
        : parallelAITools
      : undefined

    // Track request duration for slow request monitoring
    const streamStartTime = Date.now()

    // Stream the response using AI SDK
    const result = streamText({
      model: aiModel,
      system: fullSystemPrompt,
      messages: convertToCoreMessages(messages),
      tools,
      onFinish({ usage }) {
        const duration = Date.now() - streamStartTime
        if (usage) {
          console.log(`[AI SDK Chat] Usage: ${usage.inputTokens} in, ${usage.outputTokens} out, ${duration}ms`)
          // Log slow requests for monitoring (>60s threshold)
          logSlowRequest(
            resolvedModelId,
            duration,
            { promptTokens: usage.inputTokens, completionTokens: usage.outputTokens },
            workspaceContext?.workspaceId || 'sdk-chat-route'
          )
        }
      },
      // Optional: Handle tool execution errors gracefully
      onStepFinish({ toolCalls }) {
        // Log tool usage for debugging (can be removed in production)
        if (toolCalls && toolCalls.length > 0) {
          console.log('[AI SDK Chat] Tool calls:', toolCalls.map((t) => t.toolName))
        }
      },
    })

    // Return the streaming response in AI SDK format
    return result.toTextStreamResponse()
  } catch (error) {
    console.error('[AI SDK Chat] Error:', error)
    return new Response(
      JSON.stringify({
        error: 'Failed to process chat request',
        details: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  }
}

/**
 * GET /api/ai/sdk-chat
 *
 * Returns information about available models and capabilities.
 */
export async function GET() {
  return Response.json({
    version: '1.0.0',
    provider: 'openrouter',
    defaultModel: 'anthropic/claude-haiku-4.5:nitro',
    availableModels: {
      claudeHaiku: {
        id: 'anthropic/claude-haiku-4.5:nitro',
        name: 'Claude Haiku 4.5',
        description: 'Fast and efficient, great for most tasks',
        speed: 'fast',
      },
      grok4Fast: {
        id: 'x-ai/grok-4-fast:nitro',
        name: 'Grok 4 Fast',
        description: 'Real-time reasoning, 2M context',
        speed: 'fast',
      },
      kimiK2: {
        id: 'moonshotai/kimi-k2-thinking:nitro',
        name: 'Kimi K2 Thinking',
        description: 'Deep reasoning with thinking traces (cheapest)',
        speed: 'medium',
      },
      minimaxM2: {
        id: 'minimax/minimax-m2:nitro',
        name: 'Minimax M2',
        description: 'Balanced for agentic workflows',
        speed: 'fast',
      },
      claudeSonnet: {
        id: 'anthropic/claude-3.5-sonnet',
        name: 'Claude 3.5 Sonnet',
        description: 'Higher capability for complex tasks',
        speed: 'medium',
      },
    },
    tools: {
      webSearch: 'Search the web for current information',
      extractContent: 'Extract content from URLs',
      deepResearch: 'Comprehensive research on complex topics',
      researchStatus: 'Check status of ongoing research',
      quickAnswer: 'Fast AI-generated answers',
    },
    features: [
      'Streaming responses',
      'Tool calling (Parallel AI)',
      'Multi-step reasoning',
      'Workspace context awareness',
    ],
  })
}
