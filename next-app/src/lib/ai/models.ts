/**
 * AI Model Configurations
 *
 * Supports multiple AI models via OpenRouter with different capabilities and pricing.
 * Users can select their preferred model for dependency suggestions.
 */

export interface AIModel {
  id: string // OpenRouter model ID (with :nitro suffix for throughput optimization)
  name: string // Display name
  provider: string // Provider (Anthropic, xAI, Moonshot, Minimax, etc.)
  description: string // Short description
  capabilities: string[] // What this model is good at
  costPer1M: {
    input: number // Cost per 1M input tokens (USD)
    output: number // Cost per 1M output tokens (USD)
  }
  speed: 'fast' | 'medium' | 'slow' // Relative speed
  maxTokens: number // Maximum context window
  isDefault?: boolean // Default model
  excludeProviders?: string[] // Providers to exclude from routing (e.g., ['MoonshotAI/Turbo'])
}

/**
 * Available AI models for dependency suggestions
 * All models use :nitro routing for maximum throughput (30-50% faster)
 */
export const AI_MODELS: Record<string, AIModel> = {
  'claude-haiku-45': {
    id: 'anthropic/claude-haiku-4.5:nitro',
    name: 'Claude Haiku 4.5',
    provider: 'Anthropic',
    description: 'Best reasoning, fastest via nitro (DEFAULT)',
    capabilities: [
      'Semantic analysis',
      'Dependency detection',
      'Structured output',
      'High accuracy',
    ],
    costPer1M: {
      input: 1.0,
      output: 5.0,
    },
    speed: 'fast',
    maxTokens: 200000,
    isDefault: true,
  },

  'grok-4-fast': {
    id: 'x-ai/grok-4-fast:nitro',
    name: 'Grok 4 Fast',
    provider: 'xAI',
    description: 'Real-time reasoning, 2M context, fastest via nitro',
    capabilities: [
      'Advanced reasoning',
      'Real-time information',
      'Multimodal understanding',
      'Large context window',
    ],
    costPer1M: {
      input: 0.2, // $0.05 cached (above 128k)
      output: 0.5,
    },
    speed: 'fast',
    maxTokens: 2000000, // 2M token context
  },

  'kimi-k2-thinking': {
    id: 'moonshotai/kimi-k2-thinking:nitro',
    name: 'Kimi K2 Thinking',
    provider: 'Moonshot',
    description: 'Deep reasoning with thinking traces, fastest via nitro (CHEAPEST)',
    capabilities: [
      'Deep reasoning',
      'Thinking traces',
      'Complex analysis',
      'Cost-effective',
    ],
    costPer1M: {
      input: 0.15,
      output: 2.5,
    },
    speed: 'fast',
    maxTokens: 256000,
    excludeProviders: ['MoonshotAI/Turbo'], // Exclude turbo provider
  },

  'minimax-m2': {
    id: 'minimax/minimax-m2:nitro',
    name: 'Minimax M2',
    provider: 'Minimax',
    description: 'Balanced reasoning and speed via nitro',
    capabilities: [
      'Code generation',
      'Agentic workflows',
      'Tool use',
      'Multi-step tasks',
    ],
    costPer1M: {
      input: 0.5,
      output: 1.5,
    },
    speed: 'fast',
    maxTokens: 230000,
  },
}

/**
 * Get default AI model (Claude Haiku 4.5)
 */
export function getDefaultModel(): AIModel {
  return AI_MODELS['claude-haiku-45']
}

/**
 * Get AI model by ID
 */
export function getModelById(modelId: string): AIModel | undefined {
  return Object.values(AI_MODELS).find((model) => model.id === modelId)
}

/**
 * Get AI model by key
 */
export function getModelByKey(key: string): AIModel | undefined {
  return AI_MODELS[key]
}

/**
 * Get all available models as array
 */
export function getAllModels(): AIModel[] {
  return Object.values(AI_MODELS)
}

/**
 * Calculate estimated cost for a request
 */
export function calculateCost(
  model: AIModel,
  inputTokens: number,
  outputTokens: number
): number {
  const inputCost = (inputTokens / 1_000_000) * model.costPer1M.input
  const outputCost = (outputTokens / 1_000_000) * model.costPer1M.output
  return inputCost + outputCost
}

/**
 * Format cost as USD string
 */
export function formatCost(cost: number): string {
  if (cost < 0.01) {
    return `$${(cost * 100).toFixed(4)}¢`
  }
  return `$${cost.toFixed(4)}`
}

/**
 * Get model recommendation based on use case
 */
export function recommendModel(useCase: 'speed' | 'quality' | 'cost' | 'thinking'): AIModel {
  switch (useCase) {
    case 'speed':
      return AI_MODELS['grok-4-fast'] // 2M context, real-time data, fastest
    case 'quality':
      return AI_MODELS['claude-haiku-45'] // Best reasoning (default)
    case 'cost':
      return AI_MODELS['kimi-k2-thinking'] // $0.15/M input, cheapest
    case 'thinking':
      return AI_MODELS['kimi-k2-thinking'] // Deep reasoning with traces
    default:
      return getDefaultModel()
  }
}
