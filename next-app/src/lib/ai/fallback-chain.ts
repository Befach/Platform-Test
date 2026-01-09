/**
 * Fallback Chain Utility
 *
 * Provides model fallback configuration for capability-based routing.
 * When the primary model fails (rate limit, error, etc.), the calling code
 * should try the fallback, then tertiary model.
 *
 * Note: This module provides the routing configuration. The calling code
 * is responsible for implementing retry logic using callWithRetry from openrouter.ts.
 *
 * @see MODEL_ROUTING in models-config.ts for capability definitions
 */

import { getModelFromConfig } from './ai-sdk-client'
import { MODEL_ROUTING, type RoutingCapability } from './models-config'
import type { LanguageModel } from 'ai'

/**
 * Fallback chain with primary, fallback, and tertiary models
 */
export interface FallbackChain {
  primary: LanguageModel
  fallback: LanguageModel
  tertiary: LanguageModel
}

/**
 * Create a fallback chain for a specific capability
 *
 * Returns an object with primary, fallback, and tertiary models.
 * Use with try/catch to implement fallback logic:
 *
 * Usage:
 * ```typescript
 * import { createFallbackChain } from '@/lib/ai/fallback-chain'
 *
 * const chain = createFallbackChain('coding')
 * // chain.primary = minimax-m2.1
 * // chain.fallback = glm-4.7
 * // chain.tertiary = kimi-k2
 *
 * try {
 *   result = await streamText({ model: chain.primary, prompt })
 * } catch (e) {
 *   result = await streamText({ model: chain.fallback, prompt })
 * }
 * ```
 */
export function createFallbackChain(capability: RoutingCapability): FallbackChain {
  const routing = MODEL_ROUTING[capability]
  return {
    // Use getModelFromConfig to apply provider settings (data_collection: 'deny', reasoning, etc.)
    primary: getModelFromConfig(routing.primary),
    fallback: getModelFromConfig(routing.fallback),
    tertiary: getModelFromConfig(routing.tertiary),
  }
}

/**
 * Get the ordered list of model IDs for a capability
 *
 * Useful for displaying fallback options to users or for logging.
 *
 * Usage:
 * ```typescript
 * const models = getFallbackOrder('strategic_reasoning')
 * // Returns: ['z-ai/glm-4.7', 'deepseek/deepseek-v3.2:nitro', 'google/gemini-3-flash-preview']
 * ```
 */
export function getFallbackOrder(capability: RoutingCapability): string[] {
  const routing = MODEL_ROUTING[capability]
  return [routing.primary, routing.fallback, routing.tertiary]
}

/**
 * Get the primary model ID for a capability
 *
 * Usage:
 * ```typescript
 * const modelId = getPrimaryModel('agentic_tool_use')
 * // Returns: 'z-ai/glm-4.7'
 * ```
 */
export function getPrimaryModel(capability: RoutingCapability): string {
  return MODEL_ROUTING[capability].primary
}

/**
 * Check if a model is available as a fallback for any capability
 */
export function isModelInFallbackChain(modelId: string): boolean {
  return Object.values(MODEL_ROUTING).some(
    (routing) =>
      routing.primary === modelId ||
      routing.fallback === modelId ||
      routing.tertiary === modelId
  )
}

/**
 * Execute with fallback chain - tries primary, then fallback, then tertiary
 *
 * Combines the fallback chain with automatic retry on failure.
 * Useful for non-streaming AI calls (e.g., generateText, generateObject).
 *
 * @param capability - The routing capability to use
 * @param executor - Function that takes a LanguageModel and returns a Promise
 * @returns The result from the first successful model
 * @throws Error if all models fail
 *
 * Usage:
 * ```typescript
 * import { executeWithFallback } from '@/lib/ai/fallback-chain'
 * import { generateText } from 'ai'
 *
 * const result = await executeWithFallback('coding', async (model) => {
 *   return generateText({ model, prompt: 'Write a function...' })
 * })
 * ```
 */
export async function executeWithFallback<T>(
  capability: RoutingCapability,
  executor: (model: LanguageModel) => Promise<T>
): Promise<{ result: T; modelUsed: string; attempt: number }> {
  const chain = createFallbackChain(capability)
  const order = getFallbackOrder(capability)
  const models = [chain.primary, chain.fallback, chain.tertiary]

  let lastError: Error | null = null

  for (let attempt = 0; attempt < models.length; attempt++) {
    const model = models[attempt]
    const modelId = order[attempt]

    try {
      console.log(`[Fallback Chain] Attempting ${modelId} (attempt ${attempt + 1}/3)`)
      const result = await executor(model)
      console.log(`[Fallback Chain] Success with ${modelId}`)
      return { result, modelUsed: modelId, attempt: attempt + 1 }
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error))
      console.warn(`[Fallback Chain] ${modelId} failed:`, lastError.message)

      // Continue to next model in chain
      if (attempt < models.length - 1) {
        console.log(`[Fallback Chain] Trying fallback model...`)
      }
    }
  }

  throw new Error(
    `All models in ${capability} chain failed. Last error: ${lastError?.message}`
  )
}
