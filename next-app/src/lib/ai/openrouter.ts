/**
 * OpenRouter API Client
 *
 * Multi-model AI client with :nitro routing for maximum throughput.
 * Supports Claude Haiku 4.5, Grok 4 Fast, Kimi K2 Thinking, and Minimax M2.
 * Handles streaming responses, token tracking, cost calculation, and provider exclusions.
 */

import { AIModel, getModelById, calculateCost } from './models'

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
    const requestBody: any = {
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

    const data = await response.json()

    // Calculate cost
    const costUsd = calculateCost(
      model,
      data.usage.prompt_tokens,
      data.usage.completion_tokens
    )

    return {
      id: data.id,
      model: data.model,
      choices: data.choices.map((choice: any) => ({
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
  } catch (error: any) {
    console.error('OpenRouter API error:', error)
    throw new Error(`Failed to call OpenRouter API: ${error.message}`)
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
    const requestBody: any = {
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
  } catch (error: any) {
    console.error('OpenRouter streaming error:', error)
    throw new Error(`Failed to stream from OpenRouter API: ${error.message}`)
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
          } catch (e) {
            console.warn('Failed to parse SSE chunk:', data)
          }
        }
      }
    }
  } finally {
    reader.releaseLock()
  }
}

/**
 * Extract text content from streaming response
 */
export async function extractStreamText(
  stream: ReadableStream<Uint8Array>
): Promise<{ text: string; usage?: any }> {
  let fullText = ''
  let usage: any = null

  for await (const chunk of parseSSEStream(stream)) {
    const delta = chunk.choices[0]?.delta
    if (delta?.content) {
      fullText += delta.content
    }
    if (chunk.usage) {
      usage = chunk.usage
    }
  }

  return { text: fullText, usage }
}

/**
 * Generate dependency suggestions using AI
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

    return dependencies.filter(
      (dep: any) =>
        dep.sourceId &&
        dep.targetId &&
        dep.reason &&
        typeof dep.confidence === 'number' &&
        dep.confidence >= 0.6
    )
  } catch (error: any) {
    console.error('Failed to parse AI response:', error)
    throw new Error(`Invalid AI response format: ${error.message}`)
  }
}
