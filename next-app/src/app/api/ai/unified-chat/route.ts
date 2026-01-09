/**
 * Unified AI Chat API
 *
 * Chat-first AI endpoint that combines:
 * - Parallel AI tools (search, research, extraction)
 * - Agentic tools (create work items, analyze, optimize)
 *
 * The AI can freely converse AND execute actions via tools.
 * Agentic tools return confirmation requests that the frontend
 * displays for user approval before execution.
 *
 * Architecture:
 * User → useChat() → This Route → OpenRouter → AI Model
 *                                      ↓ (tool calls)
 *                    ┌─────────────────┴─────────────────┐
 *                    │                                   │
 *              Parallel AI APIs                  Agentic Tools
 *              (search, research)          (return confirmation requests)
 */

import { streamText, convertToModelMessages, type UIMessage } from 'ai'
import { createClient } from '@/lib/supabase/server'
import { parallelAITools, parallelAIQuickTools } from '@/lib/ai/tools/parallel-ai-tools'
import { chatAgenticTools } from '@/lib/ai/tools/chat-agentic-tools'
import { optimizationTools } from '@/lib/ai/tools/optimization-tools'
import { strategyTools } from '@/lib/ai/tools/strategy-tools'
import { toolRegistry } from '@/lib/ai/tools/tool-registry'
import { routeRequest, formatRoutingLog, type SessionState } from '@/lib/ai/session-router'
import { getDefaultModel, isDevMode } from '@/lib/ai/models-config'
import {
  analyzeMessage,
  getRoutingDebugInfo,
  type FileAttachment,
  type ChatMode,
} from '@/lib/ai/message-analyzer'
import {
  analyzeImages,
  createImageContext,
  getImageContextsFromMetadata,
  addImageContextToMetadata,
  type ImageData,
} from '@/lib/ai/image-analyzer'
import { buildContext, buildSystemPrompt as buildContextSystemPrompt } from '@/lib/ai/context-builder'
import { createTaskPlan } from '@/lib/ai/task-planner'
import { logSlowRequest } from '@/lib/ai/openrouter'

// Import tool files to trigger registration (side-effects)
import '@/lib/ai/tools/creation-tools'
import '@/lib/ai/tools/analysis-tools'
import '@/lib/ai/tools/optimization-tools'
import '@/lib/ai/tools/strategy-tools'

// Match vercel.json functions config for app/api/ai/**/*.ts
export const maxDuration = 300

/**
 * Base system prompt for chat-first agentic AI
 */
const BASE_SYSTEM_PROMPT = `You are an AI assistant for the Product Lifecycle Platform. You help users with:
- Product planning, roadmaps, and feature management
- Creating work items, tasks, dependencies, and timeline breakdowns
- Analyzing feedback, identifying risks, and optimizing priorities
- Research, competitive analysis, and strategic planning

## Research Tools (execute immediately):
- webSearch: Search the web for current information
- extractContent: Extract content from URLs
- deepResearch: Comprehensive research on complex topics

## Guidelines

1. **Chat First**: Start with conversation. Ask clarifying questions if needed.

2. **Infer from Context**: When users say things like:
   - "Create a feature for user authentication" → Extract name="User Authentication", type="feature"
   - "Add a bug for the login issue" → Extract type="bug"
   - "This needs to be high priority" → Set priority="high"

3. **Show Confirmation**: For agentic tools, return the confirmation request.
   The frontend will display it for user approval.

4. **Be Helpful**: If you can't determine required parameters, ask the user.
   Never guess critical information like work item names.

5. **One Action at a Time**: Don't try to create multiple items in one message.
   Complete one confirmation, then proceed to the next if needed.`

/**
 * Get tool examples for system prompt injection
 *
 * Uses the tool registry to dynamically generate tool descriptions
 * with input examples that improve AI tool selection accuracy.
 *
 * Based on Anthropic's Tool Use Best Practices:
 * - Providing examples improves accuracy from ~72% to ~90%
 * - Examples help the AI understand user intent patterns
 */
function getToolExamplesForPrompt(): string {
  // Get COMPACT examples from registered tools to reduce token count
  // Full examples were causing ~5000+ extra tokens and significant latency
  const toolExamples = toolRegistry.getToolExamplesCompact()

  if (!toolExamples || Object.keys(toolExamples).length === 0) {
    return ''
  }

  // Format compact examples into a brief section
  const toolLines = Object.entries(toolExamples)
    .map(([name, { description, example }]) => {
      const line = `- **${name}**: ${description}`
      return example ? `${line}\n  Example: ${example}` : line
    })
    .join('\n')

  return `\n\n## Agentic Tools (require user confirmation)\n${toolLines}`
}

/**
 * Build the full system prompt with tool examples
 */
function buildUnifiedSystemPrompt(): string {
  return BASE_SYSTEM_PROMPT + getToolExamplesForPrompt()
}

/**
 * Build context-enhanced system prompt
 */
function buildSystemPrompt(
  basePrompt: string,
  workspaceContext?: {
    workspaceId?: string
    workspaceName?: string
    workspacePhase?: string
    teamId?: string
    currentWorkItems?: Array<{ id: string; name: string; type: string; status: string }>
  }
): string {
  if (!workspaceContext) return basePrompt

  const contextParts: string[] = []

  if (workspaceContext.workspaceName) {
    contextParts.push(`**Workspace**: ${workspaceContext.workspaceName}`)
  }
  if (workspaceContext.workspacePhase) {
    contextParts.push(`**Phase**: ${workspaceContext.workspacePhase}`)
  }
  if (workspaceContext.currentWorkItems && workspaceContext.currentWorkItems.length > 0) {
    const itemSummary = workspaceContext.currentWorkItems
      .slice(0, 15)
      .map((item) => `- [${item.id}] ${item.name} (${item.type}, ${item.status})`)
      .join('\n')
    contextParts.push(`**Work Items**:\n${itemSummary}`)
  }

  if (contextParts.length === 0) return basePrompt

  return `${basePrompt}

## Current Context
${contextParts.join('\n')}

Use the workspace ID "${workspaceContext.workspaceId}" and team ID "${workspaceContext.teamId}" when calling agentic tools.`
}

/**
 * Combine Parallel AI tools with Chat Agentic tools + Optimization + Strategy
 */
function getUnifiedTools(quickMode: boolean = false) {
  const researchTools = quickMode ? parallelAIQuickTools : parallelAITools

  return {
    ...researchTools,
    ...chatAgenticTools,
    ...optimizationTools,
    ...strategyTools,
  }
}

/**
 * POST /api/ai/unified-chat
 *
 * Handles chat requests with intelligent model routing, vision support, and RAG integration.
 * Compatible with the AI SDK's useChat() hook.
 *
 * Request body:
 * - messages: UIMessage[] - Conversation history
 * - model?: string - Model key or 'auto' for intelligent routing (default: 'auto')
 * - mode?: 'chat' | 'agentic' - Chat mode (default: 'chat')
 * - quickMode?: boolean - Use only quick tools (default: false)
 * - systemPrompt?: string - Custom system prompt (merged with base)
 * - workspaceContext?: object - Context about current workspace
 * - session?: SessionState - Session state for model persistence
 * - files?: FileAttachment[] - Uploaded files (images supported)
 * - threadMetadata?: object - Thread metadata including image contexts
 * - devOverride?: string - Dev mode model override (only for dev accounts)
 *
 * Response headers:
 * - X-Session-State: JSON-encoded session state for client-side storage
 * - X-Model-Used: The model that was actually used for this request
 * - X-Routing-Reason: Why this model was selected
 * - X-Routing-Debug: Full routing debug info (dev mode only)
 * - X-Is-Slow-Model: Whether the model shows "Deep thinking..." indicator
 * - X-Image-Analyzed: Whether images were analyzed in this request
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

    // Check if user is in dev mode
    const userIsDevMode = isDevMode(user.email)

    // Parse request body
    const body = await request.json()
    const {
      messages,
      model: _modelInput, // Accepted in API but routing uses analysisResult.selectedModel
      mode = 'chat',
      quickMode = false,
      systemPrompt: customSystemPrompt,
      workspaceContext,
      session,
      files = [],
      threadMetadata = {},
      devOverride,
    } = body as {
      messages: UIMessage[]
      model?: string
      mode?: ChatMode
      quickMode?: boolean
      systemPrompt?: string
      workspaceContext?: {
        workspaceId?: string
        workspaceName?: string
        workspacePhase?: string
        teamId?: string
        currentWorkItems?: Array<{ id: string; name: string; type: string; status: string }>
      }
      session?: SessionState
      files?: FileAttachment[]
      threadMetadata?: Record<string, unknown>
      devOverride?: string
    }

    if (!messages || messages.length === 0) {
      return new Response('Messages are required', { status: 400 })
    }

    // Get the latest user message for analysis
    // In AI SDK v5, UIMessage uses 'parts' array instead of 'content'
    const latestUserMessage = messages.filter(m => m.role === 'user').pop()
    const messageText = latestUserMessage?.parts
      ?.filter((p): p is { type: 'text'; text: string } => p.type === 'text')
      .map(p => p.text)
      .join('\n') || ''

    // Debug: Log received messages
    console.log('[Unified Chat] Received messages:', messages.length, 'files:', files.length)

    // ─────────────────────────────────────────────────────────────────────────
    // INTELLIGENT MESSAGE ANALYSIS & ROUTING
    // ─────────────────────────────────────────────────────────────────────────

    // Estimate current context tokens
    // In AI SDK v5, UIMessage uses 'parts' array instead of 'content'
    const contextTokens = messages.reduce((sum, m) => {
      const textContent = m.parts
        ?.filter((p): p is { type: 'text'; text: string } => p.type === 'text')
        .map(p => p.text)
        .join('\n') || ''
      return sum + Math.ceil(textContent.length / 4)
    }, 0)

    // Analyze message for routing decision
    // Only allow dev override for dev accounts
    const validDevOverride = userIsDevMode && devOverride ? devOverride : undefined
    const analysisResult = analyzeMessage(
      messageText,
      files,
      mode,
      contextTokens,
      validDevOverride
    )

    const routingDebugInfo = getRoutingDebugInfo(analysisResult)
    console.log('[Unified Chat] Routing:', routingDebugInfo.explanation)

    // ─────────────────────────────────────────────────────────────────────────
    // MULTI-STEP TASK DETECTION (Plan-based Execution)
    // When a multi-step task is detected in agentic mode, create a plan
    // and return it for user approval before autonomous execution.
    // ─────────────────────────────────────────────────────────────────────────

    if (analysisResult.isMultiStepTask && mode === 'agentic') {
      console.log('[Unified Chat] Multi-step task detected, creating plan...')
      console.log('[Unified Chat] Task complexity:', analysisResult.multiStepComplexity)

      try {
        const planResult = await createTaskPlan({
          userMessage: messageText,
          teamId: workspaceContext?.teamId || '',
          workspaceId: workspaceContext?.workspaceId || '',
          conversationContext: messages
            .slice(-5) // Last 5 messages for context
            .map(m => {
              const text = m.parts
                ?.filter((p): p is { type: 'text'; text: string } => p.type === 'text')
                .map(p => p.text)
                .join('\n') || ''
              return `${m.role}: ${text}`
            })
            .join('\n'),
        })

        if (planResult.success && planResult.plan) {
          console.log('[Unified Chat] Plan created:', planResult.plan.id, 'with', planResult.plan.steps.length, 'steps')

          // Return plan for UI approval instead of streaming chat
          return new Response(
            JSON.stringify({
              type: 'plan-created',
              plan: planResult.plan,
            }),
            {
              status: 200,
              headers: {
                'Content-Type': 'application/json',
                'X-Plan-Created': 'true',
                'X-Plan-Id': planResult.plan.id,
                'X-Plan-Steps': String(planResult.plan.steps.length),
                'X-Task-Complexity': analysisResult.multiStepComplexity,
              },
            }
          )
        } else {
          // Plan creation failed - fall through to normal chat
          console.warn('[Unified Chat] Plan creation failed:', planResult.error)
        }
      } catch (planError) {
        console.error('[Unified Chat] Plan creation error:', planError)
        // Fall through to normal chat on error
      }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // VISION PIPELINE (TWO-STEP)
    // Step 1: Gemini Flash analyzes images (internal)
    // Step 2: Chat model responds with image context
    // ─────────────────────────────────────────────────────────────────────────

    let updatedThreadMetadata = { ...threadMetadata }
    let imageAnalysisPerformed = false

    if (analysisResult.hasImages && analysisResult.images.length > 0) {
      console.log('[Unified Chat] Analyzing', analysisResult.images.length, 'image(s) with Gemini Flash')

      // Convert FileAttachment to ImageData format
      const imageDataArray: ImageData[] = analysisResult.images.map((file) => ({
        data: file.data,
        mimeType: file.type,
        filename: file.name,
      }))

      // Analyze images in parallel
      const imageResults = await analyzeImages(imageDataArray)

      // Store successful analyses in thread metadata
      const messageId = Date.now().toString()
      for (let i = 0; i < imageResults.length; i++) {
        const result = imageResults[i]
        if (result.success) {
          const imageContext = createImageContext(
            messageId,
            result,
            analysisResult.images[i]?.name
          )
          updatedThreadMetadata = addImageContextToMetadata(updatedThreadMetadata, imageContext)
          imageAnalysisPerformed = true
          console.log(`[Unified Chat] Image ${i + 1} analyzed in ${result.processingTime}ms`)
        } else {
          console.error(`[Unified Chat] Image ${i + 1} analysis failed:`, result.error)
        }
      }
    }

    // Get all image contexts (existing + new)
    const imageContexts = getImageContextsFromMetadata(updatedThreadMetadata)

    // ─────────────────────────────────────────────────────────────────────────
    // CONTEXT BUILDING (RAG + Platform + Images)
    // ─────────────────────────────────────────────────────────────────────────

    let builtContext = null
    if (workspaceContext?.teamId) {
      try {
        builtContext = await buildContext({
          query: messageText,
          workspaceId: workspaceContext.workspaceId,
          teamId: workspaceContext.teamId,
          imageContexts,
          maxRagTokens: 2000,
          includePlatformContext: true,
          similarityThreshold: 0.6,
        })
        console.log('[Unified Chat] Context built:', {
          ragUsed: builtContext.ragUsed,
          ragItems: builtContext.ragStats?.itemCount || 0,
          totalTokens: builtContext.totalTokens,
        })
      } catch (error) {
        console.error('[Unified Chat] Context building failed:', error)
        // Continue without RAG context - not fatal
      }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // MODEL SELECTION & TOOLS
    // ─────────────────────────────────────────────────────────────────────────

    // Get unified tool set (only in agentic mode)
    const tools = mode === 'agentic' ? getUnifiedTools(quickMode) : {}
    const hasToolUse = Object.keys(tools).length > 0

    // Convert messages for the AI SDK
    console.log('[Unified Chat] Converting messages, count:', messages.length)
    const coreMessages = convertToModelMessages(messages)

    // Use the existing session router for model initialization
    // But override with our analyzed model selection
    const routingDecision = await routeRequest({
      messages: coreMessages,
      userModelKey: analysisResult.selectedModel.key, // Use our analyzed model
      session,
      hasToolUse,
    })

    // Log routing decision
    console.log(formatRoutingLog(routingDecision))

    // ─────────────────────────────────────────────────────────────────────────
    // SYSTEM PROMPT CONSTRUCTION
    // ─────────────────────────────────────────────────────────────────────────

    // Build system prompt with dynamic tool examples
    const unifiedPrompt = buildUnifiedSystemPrompt()
    const basePrompt = customSystemPrompt
      ? `${unifiedPrompt}\n\n## Additional Instructions\n${customSystemPrompt}`
      : unifiedPrompt

    // Add workspace context (legacy method)
    const legacyContextPrompt = buildSystemPrompt(basePrompt, workspaceContext)

    // Add RAG + image context if available
    const fullSystemPrompt = builtContext
      ? buildContextSystemPrompt(builtContext, legacyContextPrompt)
      : legacyContextPrompt

    // ─────────────────────────────────────────────────────────────────────────
    // STREAM RESPONSE (with reliability monitoring)
    // ─────────────────────────────────────────────────────────────────────────

    // Track request duration for slow request monitoring
    const streamStartTime = Date.now()

    // Stream the response using the routed model and messages
    const result = streamText({
      model: routingDecision.languageModel,
      system: fullSystemPrompt,
      messages: routingDecision.messages, // May be compacted
      tools: hasToolUse ? tools : undefined,
      onFinish({ toolCalls, usage }) {
        const duration = Date.now() - streamStartTime

        if (toolCalls && toolCalls.length > 0) {
          console.log('[Unified Chat] Tool calls:', toolCalls.map((t) => t.toolName))
        }
        if (usage) {
          console.log(`[Unified Chat] Usage: ${usage.inputTokens} in, ${usage.outputTokens} out, ${duration}ms`)

          // Log slow requests for monitoring (>60s threshold)
          // Use routingDecision.model.modelId (not analysisResult) because the router
          // may switch models due to context overflow or capability requirements
          logSlowRequest(
            routingDecision.model.modelId,
            duration,
            { promptTokens: usage.inputTokens, completionTokens: usage.outputTokens },
            workspaceContext?.workspaceId || 'unknown'
          )
        }
      },
    })

    // Return response with session state in headers
    // AI SDK v5: Use toUIMessageStreamResponse() for useChat hook compatibility
    // sendReasoning: true enables reasoning content from models like Kimi K2, DeepSeek
    const response = result.toUIMessageStreamResponse({
      sendReasoning: true,
    })

    // ─────────────────────────────────────────────────────────────────────────
    // RESPONSE HEADERS (Including Dev Mode Debug Info)
    // ─────────────────────────────────────────────────────────────────────────

    // Core routing headers
    response.headers.set('X-Session-State', JSON.stringify(routingDecision.session))
    response.headers.set('X-Model-Used', analysisResult.selectedModel.displayName)
    response.headers.set('X-Routing-Reason', analysisResult.routingReason)
    response.headers.set('X-Is-Slow-Model', String(analysisResult.selectedModel.isSlowModel))

    // Image analysis header
    if (imageAnalysisPerformed) {
      response.headers.set('X-Image-Analyzed', 'true')
      response.headers.set('X-Thread-Metadata', JSON.stringify(updatedThreadMetadata))
    }

    // Context compaction headers
    if (routingDecision.compaction?.wasCompacted) {
      response.headers.set('X-Context-Compacted', 'true')
      response.headers.set('X-Messages-Summarized', String(routingDecision.compaction.summarizedCount))
    }

    // RAG context headers
    if (builtContext?.ragUsed) {
      response.headers.set('X-RAG-Used', 'true')
      response.headers.set('X-RAG-Items', String(builtContext.ragStats?.itemCount || 0))
    }

    // Dev mode: Include full routing debug info
    if (userIsDevMode) {
      response.headers.set('X-Routing-Debug', JSON.stringify(routingDebugInfo))
    }

    return response
  } catch (error) {
    console.error('[Unified Chat] Error:', error)
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
 * GET /api/ai/unified-chat
 *
 * Returns information about the unified chat API.
 */
export async function GET() {
  const defaultModel = getDefaultModel()

  return Response.json({
    version: '3.0.0',
    name: 'Unified AI Chat',
    description: 'Multi-model AI orchestration with intelligent routing, vision support, and RAG integration',
    provider: 'openrouter',
    routing: {
      default: 'auto',
      defaultModel: {
        key: defaultModel.key,
        name: defaultModel.displayName,
        modelId: defaultModel.modelId,
      },
      capabilities: ['default', 'large_context', 'tool_use', 'quality', 'cost_effective', 'speed', 'reasoning', 'realtime', 'vision'],
      models: {
        'kimi-k2': 'Default model - cost-effective, good reasoning',
        'claude-haiku': 'Best for tool use (agentic mode)',
        'deepseek-v3': 'Deep reasoning (shows "Deep thinking..." indicator)',
        'grok-4.1': 'Large context (2M tokens), real-time data',
        'glm-4.7': 'Strategic reasoning + agentic (top HLE/GPQA)',
        'minimax-m2.1': 'Best for coding tasks',
        'gemini-3-flash': 'Vision + large context (1M tokens)',
      },
      decisionTree: [
        '1. Has images? → Gemini 3 Flash analyzes → chat model responds',
        '2. Agentic mode? → Claude Haiku (best for tools)',
        '3. Deep reasoning? → DeepSeek V3.2 (slow)',
        '4. Large context (>200K)? → Grok 4.1',
        '5. Default → Kimi K2',
      ],
    },
    vision: {
      enabled: true,
      supportedTypes: ['image/png', 'image/jpeg', 'image/gif', 'image/webp'],
      pipeline: 'Two-step: Gemini Flash analyzes → Chat model responds',
      note: 'Image context persists in thread for follow-up questions',
    },
    rag: {
      enabled: true,
      layers: ['L2 (summaries)', 'L3 (topics)', 'L4 (concepts)'],
      maxTokens: 2000,
      similarityThreshold: 0.6,
    },
    tools: {
      research: {
        webSearch: 'Search the web for current information',
        extractContent: 'Extract content from URLs',
        deepResearch: 'Comprehensive research on complex topics',
      },
      agentic: {
        creation: [
          'createWorkItem',
          'createTask',
          'createDependency',
          'createTimelineItem',
          'createInsight',
        ],
        analysis: [
          'analyzeFeedback',
          'suggestDependencies',
        ],
      },
    },
    features: [
      'Invisible model routing - users don\'t see model switching',
      'Two-step vision pipeline - Gemini analyzes, chat model responds',
      'RAG integration - knowledge base context injection',
      'Dev mode debug panel - for harsha@befach.com',
      'Deep thinking indicator - shown for DeepSeek',
      'Session model persistence',
      'Context compaction before overflow',
      'Natural language to tool parameters',
      'Confirmation before execution',
    ],
    responseHeaders: {
      'X-Session-State': 'JSON-encoded session state for client-side storage',
      'X-Model-Used': 'The model that was actually used for this request',
      'X-Routing-Reason': 'Why this model was selected',
      'X-Is-Slow-Model': 'Whether to show "Deep thinking..." indicator',
      'X-Image-Analyzed': 'Whether images were analyzed in this request',
      'X-Thread-Metadata': 'Updated thread metadata (includes image contexts)',
      'X-RAG-Used': 'Whether RAG context was injected',
      'X-RAG-Items': 'Number of RAG items included',
      'X-Routing-Debug': 'Full routing debug info (dev mode only)',
      'X-Context-Compacted': 'Whether context was compacted (true/false)',
      'X-Messages-Summarized': 'Number of messages that were summarized',
    },
    devMode: {
      accounts: ['harsha@befach.com'],
      features: [
        'X-Routing-Debug header with full analysis',
        'devOverride parameter to force specific model',
      ],
    },
  })
}
