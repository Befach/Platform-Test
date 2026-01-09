/**
 * OpenRouter API Client
 *
 * Multi-model AI client with :nitro routing for maximum throughput.
 * Supports Claude Haiku 4.5, Grok 4 Fast, Kimi K2 Thinking, and Minimax M2.
 * Handles streaming responses, token tracking, cost calculation, and provider exclusions.
 */

import { AIModel, calculateCost } from './models'

/**
 * OpenRouter API configuration
 */
const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions'
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY

if (!OPENROUTER_API_KEY) {
  console.warn('OPENROUTER_API_KEY not set - AI features will not work')
}

/**
 * Message format for OpenRouter
 */
export interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

/**
 * OpenRouter request options
 */
export interface OpenRouterOptions {
  model: AIModel // AI model to use
  messages: ChatMessage[] // Conversation messages
  temperature?: number // 0.0-1.0 (default: 0.7)
  maxTokens?: number // Maximum tokens to generate (default: 2000)
  stream?: boolean // Enable streaming (default: false)
  topP?: number // Nucleus sampling (default: 1.0)
  frequencyPenalty?: number // -2.0 to 2.0 (default: 0)
  presencePenalty?: number // -2.0 to 2.0 (default: 0)
}

/**
 * OpenRouter response (non-streaming)
 */
export interface OpenRouterResponse {
  id: string
  model: string
  choices: Array<{
    message: ChatMessage
    finishReason: string
  }>
  usage: {
    promptTokens: number
    completionTokens: number
    totalTokens: number
  }
  costUsd: number // Calculated cost
}

/**
 * OpenRouter streaming chunk
 */
export interface OpenRouterStreamChunk {
  id: string
  model: string
  choices: Array<{
    delta: {
      role?: string
      content?: string
    }
    finishReason?: string
  }>
  usage?: {
    promptTokens: number
    completionTokens: number
    totalTokens: number
  }
}

/**
 * Call OpenRouter API (non-streaming)
 */
export async function callOpenRouter(
  options: OpenRouterOptions
): Promise<OpenRouterResponse> {
  if (!OPENROUTER_API_KEY) {
    throw new Error('OPENROUTER_API_KEY not configured')
  }

  const {
    model,
    messages,
    temperature = 0.7,
    maxTokens = 2000,
    topP = 1.0,
    frequencyPenalty = 0,
    presencePenalty = 0,
  } = options

  try {
    // Build request body
    const requestBody: {
      model: string;
      messages: ChatMessage[];
      temperature: number;
      max_tokens: number;
      top_p: number;
      frequency_penalty: number;
      presence_penalty: number;
      stream: boolean;
      provider?: { ignore: string[] };
    } = {
      model: model.id, // Already includes :nitro suffix for throughput optimization
      messages,
      temperature,
      max_tokens: maxTokens,
      top_p: topP,
      frequency_penalty: frequencyPenalty,
      presence_penalty: presencePenalty,
      stream: false,
    }

    // Handle provider exclusions (e.g., Kimi K2 excludes MoonshotAI/Turbo)
    if (model.excludeProviders && model.excludeProviders.length > 0) {
      requestBody.provider = {
        ignore: model.excludeProviders,
      }
    }

    const response = await fetch(OPENROUTER_API_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
        'X-Title': 'Product Lifecycle Platform',
      },
      body: JSON.stringify(requestBody),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(
        error.error?.message || `OpenRouter API error: ${response.statusText}`
      )
    }

    const data = await response.json() as {
      id: string;
      model: string;
      choices: Array<{
        message: ChatMessage;
        finish_reason: string;
      }>;
      usage: {
        prompt_tokens: number;
        completion_tokens: number;
        total_tokens: number;
      };
    }

    // Calculate cost
    const costUsd = calculateCost(
      model,
      data.usage.prompt_tokens,
      data.usage.completion_tokens
    )

    return {
      id: data.id,
      model: data.model,
      choices: data.choices.map((choice) => ({
        message: choice.message,
        finishReason: choice.finish_reason,
      })),
      usage: {
        promptTokens: data.usage.prompt_tokens,
        completionTokens: data.usage.completion_tokens,
        totalTokens: data.usage.total_tokens,
      },
      costUsd,
    }
  } catch (error: unknown) {
    console.error('OpenRouter API error:', error)
    const message = error instanceof Error ? error.message : 'Unknown error'
    throw new Error(`Failed to call OpenRouter API: ${message}`)
  }
}

/**
 * Call OpenRouter API with streaming
 */
export async function streamOpenRouter(
  options: OpenRouterOptions
): Promise<ReadableStream<Uint8Array>> {
  if (!OPENROUTER_API_KEY) {
    throw new Error('OPENROUTER_API_KEY not configured')
  }

  const {
    model,
    messages,
    temperature = 0.7,
    maxTokens = 2000,
    topP = 1.0,
    frequencyPenalty = 0,
    presencePenalty = 0,
  } = options

  try {
    // Build request body
    const requestBody: {
      model: string;
      messages: ChatMessage[];
      temperature: number;
      max_tokens: number;
      top_p: number;
      frequency_penalty: number;
      presence_penalty: number;
      stream: boolean;
      provider?: { ignore: string[] };
    } = {
      model: model.id, // Already includes :nitro suffix for throughput optimization
      messages,
      temperature,
      max_tokens: maxTokens,
      top_p: topP,
      frequency_penalty: frequencyPenalty,
      presence_penalty: presencePenalty,
      stream: true,
    }

    // Handle provider exclusions (e.g., Kimi K2 excludes MoonshotAI/Turbo)
    if (model.excludeProviders && model.excludeProviders.length > 0) {
      requestBody.provider = {
        ignore: model.excludeProviders,
      }
    }

    const response = await fetch(OPENROUTER_API_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
        'X-Title': 'Product Lifecycle Platform',
      },
      body: JSON.stringify(requestBody),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(
        error.error?.message || `OpenRouter API error: ${response.statusText}`
      )
    }

    if (!response.body) {
      throw new Error('No response body')
    }

    return response.body
  } catch (error: unknown) {
    console.error('OpenRouter streaming error:', error)
    const message = error instanceof Error ? error.message : 'Unknown error'
    throw new Error(`Failed to stream from OpenRouter API: ${message}`)
  }
}

/**
 * Parse Server-Sent Events (SSE) stream
 */
export async function* parseSSEStream(
  stream: ReadableStream<Uint8Array>
): AsyncGenerator<OpenRouterStreamChunk> {
  const reader = stream.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })

      const lines = buffer.split('\n')
      buffer = lines.pop() || ''

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6).trim()

          if (data === '[DONE]') {
            return
          }

          try {
            const chunk = JSON.parse(data)
            yield chunk
          } catch {
            console.warn('Failed to parse SSE chunk:', data)
          }
        }
      }
    }
  } finally {
    reader.releaseLock()
  }
}

/** Usage data from streaming response */
interface StreamUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

/**
 * Extract text content from streaming response
 */
export async function extractStreamText(
  stream: ReadableStream<Uint8Array>
): Promise<{ text: string; usage?: StreamUsage }> {
  let fullText = ''
  let usage: StreamUsage | null = null

  for await (const chunk of parseSSEStream(stream)) {
    const delta = chunk.choices[0]?.delta
    if (delta?.content) {
      fullText += delta.content
    }
    if (chunk.usage) {
      usage = {
        promptTokens: chunk.usage.promptTokens,
        completionTokens: chunk.usage.completionTokens,
        totalTokens: chunk.usage.totalTokens,
      }
    }
  }

  return { text: fullText, usage: usage ?? undefined }
}

/**
 * Generate dependency suggestions using AI
 *
 * @deprecated Use the AI SDK version `suggestDependenciesWithSDK` instead.
 * This function uses manual JSON parsing which is fragile.
 * The new version uses generateObject() with Zod schemas for type-safe responses.
 */
export async function suggestDependencies(
  workItems: Array<{ id: string; name: string; purpose: string }>,
  model: AIModel
): Promise<Array<{ sourceId: string; targetId: string; reason: string; confidence: number }>> {
  const systemPrompt = `You are an expert at analyzing software features and identifying dependencies.

Given a list of features, identify which features depend on others. A feature A depends on feature B if:
- Feature A requires data or functionality from feature B
- Feature B must be completed before feature A can start
- Feature A builds upon or extends feature B

Respond with a JSON array of dependencies. Each dependency should have:
- sourceId: The ID of the feature that depends on another
- targetId: The ID of the feature it depends on
- reason: Brief explanation (1 sentence)
- confidence: 0.0-1.0 (how confident you are in this dependency)

Only include dependencies with confidence >= 0.6. Be conservative - it's better to miss a dependency than suggest incorrect ones.`

  const userPrompt = `Analyze these features and identify dependencies:\n\n${workItems
    .map((item) => `ID: ${item.id}\nName: ${item.name}\nPurpose: ${item.purpose}\n`)
    .join('\n---\n')}\n\nReturn JSON array of dependencies.`

  const response = await callOpenRouter({
    model,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    temperature: 0.3, // Lower temperature for more consistent results
    maxTokens: 2000,
  })

  const content = response.choices[0].message.content

  try {
    // Try to parse JSON from response
    const jsonMatch = content.match(/\[[\s\S]*\]/)
    if (!jsonMatch) {
      throw new Error('No JSON array found in response')
    }

    const dependencies = JSON.parse(jsonMatch[0])

    // Validate structure
    if (!Array.isArray(dependencies)) {
      throw new Error('Response is not an array')
    }

    // Type for parsed dependency objects
    interface ParsedDependency {
      sourceId?: string;
      targetId?: string;
      reason?: string;
      confidence?: number;
    }

    return dependencies.filter(
      (dep: ParsedDependency): dep is { sourceId: string; targetId: string; reason: string; confidence: number } =>
        typeof dep.sourceId === 'string' &&
        typeof dep.targetId === 'string' &&
        typeof dep.reason === 'string' &&
        typeof dep.confidence === 'number' &&
        dep.confidence >= 0.6
    )
  } catch (error: unknown) {
    console.error('Failed to parse AI response:', error)
    const message = error instanceof Error ? error.message : 'Unknown error'
    throw new Error(`Invalid AI response format: ${message}`)
  }
}

// =============================================================================
// AI SDK VERSIONS (Recommended)
// =============================================================================

import { generateObject } from 'ai'
import { z } from 'zod'
import { getModelFromConfig } from './ai-sdk-client'

/**
 * Schema for dependency suggestions using AI SDK
 */
const SimpleDependencySchema = z.object({
  dependencies: z.array(
    z.object({
      sourceId: z.string().describe('ID of the feature that depends on another'),
      targetId: z.string().describe('ID of the feature it depends on'),
      reason: z.string().max(200).describe('Brief explanation (1 sentence)'),
      confidence: z.number().min(0).max(1).describe('Confidence score (0.0-1.0)'),
    })
  ),
})

/**
 * Generate dependency suggestions using AI SDK (Recommended)
 *
 * Uses generateObject() with Zod schemas for type-safe, validated responses.
 * No manual JSON parsing needed - AI SDK handles validation and retries.
 *
 * @example
 * const suggestions = await suggestDependenciesWithSDK(workItems, getDefaultModel())
 */
export async function suggestDependenciesWithSDK(
  workItems: Array<{ id: string; name: string; purpose: string }>,
  model: AIModel
): Promise<Array<{ sourceId: string; targetId: string; reason: string; confidence: number }>> {
  const aiModel = getModelFromConfig(model.id)

  const result = await generateObject({
    model: aiModel,
    schema: SimpleDependencySchema,
    system: `You are an expert at analyzing software features and identifying dependencies.

Given a list of features, identify which features depend on others. A feature A depends on feature B if:
- Feature A requires data or functionality from feature B
- Feature B must be completed before feature A can start
- Feature A builds upon or extends feature B

Only include dependencies with confidence >= 0.6. Be conservative - it's better to miss a dependency than suggest incorrect ones.`,
    prompt: `Analyze these features and identify dependencies:\n\n${workItems
      .map((item) => `ID: ${item.id}\nName: ${item.name}\nPurpose: ${item.purpose}\n`)
      .join('\n---\n')}`,
    temperature: 0.3,
  })

  // Filter by confidence threshold
  return result.object.dependencies.filter((dep) => dep.confidence >= 0.6)
}

// =============================================================================
// RELIABILITY UTILITIES (5-Layer Stack)
// =============================================================================

/**
 * Request-level timeout wrapper (280s < 300s Vercel limit)
 * Layer 3 of reliability stack - prevents hanging requests
 *
 * Uses 280s timeout to leave 20s buffer before Vercel's 300s hard limit.
 * This ensures we can return a graceful response even on timeout.
 *
 * @example
 * ```typescript
 * const result = await streamWithTimeout(
 *   (signal) => streamText({ model, prompt, abortSignal: signal }),
 *   280_000
 * )
 * ```
 */
export async function streamWithTimeout<T>(
  streamFn: (signal: AbortSignal) => Promise<T>,
  timeoutMs: number = 280_000
): Promise<T> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), timeoutMs)

  try {
    return await streamFn(controller.signal)
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error(`Request timed out after ${timeoutMs}ms`)
    }
    throw error
  } finally {
    clearTimeout(timeout)
  }
}

/**
 * Retry logic with exponential backoff for rate limits (429 errors)
 *
 * Default: 3 retries with 1s, 2s, 4s delays
 * Only retries on rate limit (429) errors, not other failures.
 *
 * @example
 * ```typescript
 * const result = await callWithRetry(() => generateText({ model, prompt }))
 * ```
 */
export async function callWithRetry<T>(
  fn: () => Promise<T>,
  options: { maxRetries?: number; baseDelay?: number } = {}
): Promise<T> {
  const { maxRetries = 3, baseDelay = 1000 } = options

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn()
    } catch (error: unknown) {
      // Check multiple error formats for rate limiting
      const isRateLimit =
        (error as { status?: number }).status === 429 ||
        (error instanceof Error && error.message?.includes('rate limit')) ||
        (error instanceof Error && error.message?.includes('429'))

      if (isRateLimit && attempt < maxRetries - 1) {
        const delay = baseDelay * Math.pow(2, attempt)
        console.warn(
          `[AI_RATE_LIMIT] Attempt ${attempt + 1}/${maxRetries} - Retrying in ${delay}ms...`
        )
        await new Promise((r) => setTimeout(r, delay))
        continue
      }
      throw error
    }
  }
  throw new Error('Max retries exceeded')
}

/**
 * Redact sensitive ID for logging (shows first 4 chars + length)
 * Prevents full workspace IDs from appearing in logs
 * Example: "abc123xyz" -> "abc1...(9)"
 */
export function redactId(id: string): string {
  if (!id) return '***'
  if (id.length <= 4) return id // Show short IDs fully
  return `${id.substring(0, 4)}...(${id.length})`
}

/**
 * Monitoring for slow requests (Layer 6 - Observability)
 * Logs warning for requests taking longer than 60 seconds.
 * Workspace ID is redacted for security (only first 4 chars shown).
 *
 * @example
 * ```typescript
 * const startTime = Date.now()
 * const result = await streamText({ model, prompt })
 * logSlowRequest('z-ai/glm-4.7', Date.now() - startTime, result.usage, workspaceId)
 * ```
 */
export function logSlowRequest(
  modelId: string,
  duration: number,
  usage: { promptTokens?: number; completionTokens?: number } | null,
  workspaceId: string
): void {
  if (duration > 60_000) {
    console.warn(
      '[AI_SLOW_REQUEST] %s took %dms',
      modelId,
      duration,
      {
        model: modelId,
        tokens: usage,
        workspaceId: redactId(workspaceId), // Redacted for security
        durationMs: duration,
      }
    )
  }
}
