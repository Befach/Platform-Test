/**
 * Vercel AI SDK Client with OpenRouter Provider
 *
 * Provides a unified interface for AI operations using the Vercel AI SDK
 * with OpenRouter as the provider layer. This enables:
 * - Access to 300+ models through single endpoint
 * - :nitro routing for maximum throughput
 * - Built-in streaming with `streamText()` / `generateText()`
 * - Tool calling for Parallel AI integration
 * - Type-safe structured output with Zod
 * - Built-in cost tracking via providerMetadata
 */

import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import type { LanguageModel } from "ai";

/**
 * OpenRouter client configuration
 * Uses the same API key as existing openrouter.ts implementation
 */
export const openrouter = createOpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY,
  // Default headers for all requests
  headers: {
    "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
    "X-Title": "Product Lifecycle Platform",
  },
});

/**
 * Default provider preferences for all models
 * data_collection: 'deny' excludes providers that may train on prompts
 * This ensures requests go to privacy-respecting providers only
 */
const defaultProviderSettings = {
  provider: {
    data_collection: "deny" as const,
  },
};

/**
 * Pre-configured AI SDK models matching existing model IDs
 * All models use :nitro routing for 30-50% faster throughput
 * All models exclude data-collecting providers (China first-party endpoints)
 */
export const aiModels = {
  /**
   * Claude Haiku 4.5 (DEFAULT)
   * Best reasoning, fastest via nitro
   * Cost: $1.00/M input, $5.00/M output
   */
  claudeHaiku: openrouter(
    "anthropic/claude-haiku-4.5:nitro",
    defaultProviderSettings,
  ),

  /**
   * Grok 4.1 Fast
   * Real-time reasoning, 2M context, fastest via nitro
   * Cost: $0.20/M input, $0.50/M output
   */
  grok41Fast: openrouter("x-ai/grok-4.1-fast:nitro", defaultProviderSettings),

  /**
   * Kimi K2 Thinking (CHEAPEST)
   * Deep reasoning with thinking traces
   * Cost: $0.15/M input, $2.50/M output
   * Note: data_collection: 'deny' excludes Moonshot's China endpoint
   */
  kimiK2: openrouter(
    "moonshotai/kimi-k2-thinking:nitro",
    defaultProviderSettings,
  ),

  /**
   * DeepSeek V3.2 (NEW - Dec 2025)
   * GPT-5 level reasoning, thinking in tool-use
   * Cost: $0.28/M input, $0.40/M output
   * Context: 163K tokens
   * Note: data_collection: 'deny' excludes DeepSeek's China endpoint
   */
  deepseekV32: openrouter(
    "deepseek/deepseek-v3.2:nitro",
    defaultProviderSettings,
  ),

  /**
   * GLM 4.7 (NEW - Phase 6)
   * Best Strategic Reasoning + Agentic, top HLE/GPQA scores
   * Cost: $0.40/M input, $1.50/M output
   * Context: 128K tokens
   */
  glm47: openrouter("z-ai/glm-4.7", {
    provider: { data_collection: "deny" },
    reasoning: { effort: "high" },
  }),

  /**
   * MiniMax M2.1 (NEW - Phase 6)
   * Best Coding model, top coding benchmarks
   * Cost: $0.30/M input, $1.20/M output
   * Context: 128K tokens
   */
  minimaxM21: openrouter("minimax/minimax-m2.1", defaultProviderSettings),

  /**
   * Gemini 3 Flash (NEW - Phase 6)
   * Upgraded Vision, 1M context, video analysis
   * Cost: $0.50/M input, $3.00/M output
   * Context: 1M tokens
   */
  gemini3Flash: openrouter(
    "google/gemini-3-flash-preview",
    defaultProviderSettings,
  ),

  /**
   * Gemini 2.5 Flash (NEW - Phase 6)
   * Vision fallback for Gemini 3 Flash, 1M context
   * Cost: $0.15/M input, $0.60/M output
   * Context: 1M tokens
   */
  gemini25Flash: openrouter(
    "google/gemini-2.5-flash-preview",
    defaultProviderSettings,
  ),
} as const;

/**
 * Model recommendations by use case
 *
 * Updated Phase 6: Uses cost-effective models (NOT Claude Sonnet)
 * GLM 4.7 for agentic/reasoning, MiniMax M2.1 for coding
 */
export const recommendedModels = {
  /** Fast responses, real-time data (Grok 4.1) */
  speed: aiModels.grok41Fast,

  /** Best reasoning quality (GLM 4.7 - top HLE/GPQA scores) */
  quality: aiModels.glm47,

  /** Lowest cost (Kimi K2) */
  cost: aiModels.kimiK2,

  /** Deep reasoning with thinking traces (DeepSeek V3.2) */
  thinking: aiModels.deepseekV32,

  /** Default model for most tasks (Kimi K2 - cost-effective) */
  default: aiModels.kimiK2,

  /** Agentic workflows with tool calling (GLM 4.7 - best tool benchmarks) */
  agentic: aiModels.glm47,

  /** Complex multi-step tasks (GLM 4.7) */
  complex: aiModels.glm47,

  /** Coding tasks (MiniMax M2.1 - best coding benchmarks) */
  coding: aiModels.minimaxM21,

  /** Vision/image analysis (Gemini 3 Flash) */
  vision: aiModels.gemini3Flash,
} as const;

/**
 * Get model by key name
 */
export function getAIModel(key: keyof typeof aiModels): LanguageModel {
  return aiModels[key];
}

/**
 * Get model by OpenRouter model ID
 * Supports dynamic model selection based on user preferences
 */
export function getModelById(modelId: string): LanguageModel {
  return openrouter(modelId);
}

/**
 * Model ID to AI SDK model mapping
 * Maps existing model IDs from models.ts to AI SDK models
 */
export const modelIdMap: Record<string, LanguageModel> = {
  "anthropic/claude-haiku-4.5:nitro": aiModels.claudeHaiku,
  "x-ai/grok-4.1-fast:nitro": aiModels.grok41Fast,
  "moonshotai/kimi-k2-thinking:nitro": aiModels.kimiK2,
  "deepseek/deepseek-v3.2:nitro": aiModels.deepseekV32,
  // NEW Phase 6 models
  "z-ai/glm-4.7": aiModels.glm47,
  "minimax/minimax-m2.1": aiModels.minimaxM21,
  "google/gemini-3-flash-preview": aiModels.gemini3Flash,
  "google/gemini-2.5-flash-preview": aiModels.gemini25Flash,
};

/**
 * Get AI SDK model from existing AIModel interface
 * Bridges the gap between existing model config and AI SDK
 *
 * Privacy-first: Always applies data_collection: 'deny' even for unmapped models
 */
export function getModelFromConfig(modelId: string): LanguageModel {
  // First check if we have a pre-configured model with full settings
  if (modelIdMap[modelId]) {
    return modelIdMap[modelId];
  }
  // Fallback: Create model with default privacy settings
  return openrouter(modelId, defaultProviderSettings);
}

/**
 * Type for AI SDK model keys
 */
export type AIModelKey = keyof typeof aiModels;

/**
 * Type for recommended use cases
 */
export type AIUseCase = keyof typeof recommendedModels;
