/**
 * Model-Agnostic Configuration
 *
 * This is the ONLY file to change when adding/removing/updating models.
 * The rest of the platform uses capabilities, not model names.
 *
 * Architecture:
 * - Platform logic requests capabilities (e.g., 'large_context')
 * - This registry returns the appropriate model
 * - OpenRouter handles provider routing, failover, and rate limiting
 *
 * Multi-Model Orchestration:
 * - Invisible routing: Users don't see model switching
 * - Two-step vision: Gemini analyzes images → chat model responds
 * - Capability-based: Route by need (tools, reasoning, context size)
 *
 * @see https://openrouter.ai/docs for provider-level features
 */

// =============================================================================
// TYPES
// =============================================================================

/**
 * Model capabilities for routing decisions
 *
 * Platform code should request capabilities, NOT specific models.
 * This ensures the platform remains model-agnostic.
 */
export type ModelCapability =
  | "default" // The default model for new sessions
  | "large_context" // Can handle >500K tokens (for overflow fallback)
  | "tool_use" // Excels at tool calling / agentic workflows
  | "quality" // Premium quality responses
  | "cost_effective" // Optimized for cost
  | "speed" // Optimized for speed / low latency
  | "reasoning" // Deep reasoning capability
  | "realtime" // Real-time data access
  | "vision"; // Can analyze images (for internal use)

/**
 * Provider configuration
 *
 * Currently OpenRouter only, but designed for future multi-provider support.
 */
export type ModelProvider = "openrouter";

/**
 * Routing priority configuration
 *
 * Lower number = higher priority for that capability.
 * Used by message analyzer to select optimal model.
 */
export interface RoutingPriority {
  /** Priority for vision tasks (1 = best for vision) */
  vision: number;
  /** Priority for tool use (1 = best for tools) */
  tools: number;
  /** Priority for deep reasoning (1 = best for reasoning) */
  reasoning: number;
  /** Priority as default model (1 = first choice) */
  default: number;
}

/**
 * Complete model configuration
 *
 * Each model declares its capabilities, limits, and costs.
 * The router uses this to make intelligent decisions.
 */
export interface ModelConfig {
  /** Unique identifier (used in session state, NOT the model ID) */
  key: string;

  /** Provider for this model */
  provider: ModelProvider;

  /** Provider-specific model ID (e.g., 'anthropic/claude-haiku-4.5:nitro') */
  modelId: string;

  /** Display name for UI */
  displayName: string;

  /** Emoji icon for UI */
  icon: string;

  /** What this model is good at */
  capabilities: ModelCapability[];

  /** Maximum context window in tokens */
  contextLimit: number;

  /** Trigger context compacting at this token count (typically 80% of limit) */
  compactAt: number;

  /** Cost per 1M tokens (USD) */
  costPer1M: {
    input: number;
    output: number;
  };

  /** Is this the default model for new sessions? */
  isDefault?: boolean;

  /** Provider-specific settings (passed to OpenRouter) */
  providerSettings?: Record<string, unknown>;

  // ─────────────────────────────────────────────────────────────────────────
  // NEW: Capability flags for intelligent routing
  // ─────────────────────────────────────────────────────────────────────────

  /** Can this model analyze images? (Only Gemini Flash currently) */
  supportsVision: boolean;

  /** Is this model optimized for tool calling? */
  supportsTools: boolean;

  /** Does this model support extended thinking / deep reasoning? */
  supportsReasoning: boolean;

  /** Should we show "Deep thinking..." indicator? (for slow models like DeepSeek) */
  isSlowModel: boolean;

  /** Routing priority - lower number = higher priority for each capability */
  priority: RoutingPriority;

  /**
   * Model role in the system
   * - 'chat': User-facing responses (Kimi K2, Claude, DeepSeek, Grok)
   * - 'vision': Internal image analysis only (Gemini Flash)
   */
  role: "chat" | "vision";
}

// =============================================================================
// MODEL REGISTRY
// =============================================================================

/**
 * Central Model Registry
 *
 * To add a new model:
 * 1. Add entry here with capabilities
 * 2. That's it! The platform auto-discovers it.
 *
 * To remove a model:
 * 1. Remove the entry (or comment out)
 * 2. Ensure another model has 'default' capability
 *
 * To change the default:
 * 1. Set `isDefault: true` on the new default
 * 2. Remove `isDefault` from the old default
 */
export const MODEL_REGISTRY: ModelConfig[] = [
  // ─────────────────────────────────────────────────────────────────────────
  // Kimi K2 Thinking - CHEAPEST, good reasoning, handles tools well
  // DEFAULT model for all chat responses
  // ─────────────────────────────────────────────────────────────────────────
  {
    key: "kimi-k2",
    provider: "openrouter",
    modelId: "moonshotai/kimi-k2-thinking:nitro",
    displayName: "Kimi K2 Thinking",
    icon: "🧠",
    capabilities: ["default", "cost_effective", "reasoning", "tool_use"],
    contextLimit: 262_000,
    compactAt: 210_000, // 80% of 262K
    costPer1M: { input: 0.15, output: 2.5 },
    isDefault: true,
    providerSettings: { data_collection: "deny" },
    // NEW: Capability flags
    supportsVision: false,
    supportsTools: true,
    supportsReasoning: true,
    isSlowModel: false,
    priority: { vision: 99, tools: 2, reasoning: 2, default: 1 },
    role: "chat",
  },

  // ─────────────────────────────────────────────────────────────────────────
  // Claude Haiku 4.5 - Fast, reliable, BEST for tool use (agentic mode)
  // Routes here when tools are needed
  // ─────────────────────────────────────────────────────────────────────────
  {
    key: "claude-haiku",
    provider: "openrouter",
    modelId: "anthropic/claude-haiku-4.5:nitro",
    displayName: "Claude Haiku 4.5",
    icon: "⚡",
    capabilities: ["quality", "tool_use", "speed"],
    contextLimit: 200_000,
    compactAt: 160_000, // 80% of 200K
    costPer1M: { input: 1.0, output: 5.0 },
    // Anthropic doesn't train on API data by default
    // NEW: Capability flags
    supportsVision: false,
    supportsTools: true,
    supportsReasoning: false,
    isSlowModel: false,
    priority: { vision: 99, tools: 1, reasoning: 3, default: 2 }, // Best for tools
    role: "chat",
  },

  // ─────────────────────────────────────────────────────────────────────────
  // DeepSeek V3.2 - Deep reasoning (SLOW - shows "Deep thinking..." indicator)
  // Routes here for complex analysis requests
  // ─────────────────────────────────────────────────────────────────────────
  {
    key: "deepseek-v3",
    provider: "openrouter",
    modelId: "deepseek/deepseek-v3.2:nitro",
    displayName: "DeepSeek V3.2",
    icon: "🔮",
    capabilities: ["reasoning"],
    contextLimit: 163_000,
    compactAt: 130_000, // 80% of 163K
    costPer1M: { input: 0.28, output: 0.4 },
    providerSettings: { data_collection: "deny" },
    // NEW: Capability flags
    supportsVision: false,
    supportsTools: false, // Too slow for tool loops
    supportsReasoning: true,
    isSlowModel: true, // Shows "Deep thinking..." indicator
    priority: { vision: 99, tools: 99, reasoning: 1, default: 4 }, // Best for reasoning
    role: "chat",
  },

  // ─────────────────────────────────────────────────────────────────────────
  // Grok 4.1 Fast - LARGEST context (2M), real-time data
  // Routes here when context exceeds 200K tokens
  // ─────────────────────────────────────────────────────────────────────────
  {
    key: "grok-4.1",
    provider: "openrouter",
    modelId: "x-ai/grok-4.1-fast:nitro",
    displayName: "Grok 4.1 Fast",
    icon: "🚀",
    capabilities: ["large_context", "speed", "realtime"],
    contextLimit: 2_000_000,
    compactAt: 1_600_000, // 80% of 2M
    costPer1M: { input: 0.2, output: 0.5 },
    // No data_collection setting - xAI doesn't train on API data
    // NEW: Capability flags
    supportsVision: false,
    supportsTools: true,
    supportsReasoning: false,
    isSlowModel: false,
    priority: { vision: 99, tools: 3, reasoning: 4, default: 3 },
    role: "chat",
  },

  // ─────────────────────────────────────────────────────────────────────────
  // GLM 4.7 - BEST Strategic Reasoning + Agentic (NEW - Phase 6)
  // Top HLE/GPQA scores, excellent tool use, interleaved thinking
  // ─────────────────────────────────────────────────────────────────────────
  {
    key: "glm-4.7",
    provider: "openrouter",
    modelId: "z-ai/glm-4.7",
    displayName: "GLM 4.7",
    icon: "🎯",
    capabilities: ["reasoning", "tool_use", "quality"],
    contextLimit: 128_000,
    compactAt: 102_400, // 80% of 128K
    costPer1M: { input: 0.4, output: 1.5 },
    providerSettings: {
      data_collection: "deny",
      reasoning: { include: true, effort: "high" },
    },
    supportsVision: false,
    supportsTools: true,
    supportsReasoning: true,
    isSlowModel: false,
    priority: { vision: 99, tools: 2, reasoning: 1, default: 2 }, // Best for reasoning (priority 1), tools priority 2 (tied with Kimi K2, after Claude Haiku's priority 1)
    role: "chat",
  },

  // ─────────────────────────────────────────────────────────────────────────
  // MiniMax M2.1 - BEST Coding (NEW - Phase 6)
  // Top coding benchmarks, fast execution
  // ─────────────────────────────────────────────────────────────────────────
  {
    key: "minimax-m2.1",
    provider: "openrouter",
    modelId: "minimax/minimax-m2.1",
    displayName: "MiniMax M2.1",
    icon: "💻",
    capabilities: ["cost_effective", "speed"],
    contextLimit: 128_000,
    compactAt: 102_400, // 80% of 128K
    costPer1M: { input: 0.3, output: 1.2 },
    providerSettings: { data_collection: "deny" },
    supportsVision: false,
    supportsTools: true,
    supportsReasoning: false,
    isSlowModel: false,
    priority: { vision: 99, tools: 4, reasoning: 5, default: 5 },
    role: "chat",
  },

  // ─────────────────────────────────────────────────────────────────────────
  // Gemini 3 Flash - Multimodal Chat (NEW - Phase 6)
  // 1M context, vision + chat capable, fast multimodal responses
  // Used in MODEL_ROUTING fallback chains for user-facing capabilities
  // ─────────────────────────────────────────────────────────────────────────
  {
    key: "gemini-3-flash",
    provider: "openrouter",
    modelId: "google/gemini-3-flash-preview",
    displayName: "Gemini 3 Flash",
    icon: "✨",
    capabilities: ["vision", "large_context", "speed"],
    contextLimit: 1_000_000,
    compactAt: 800_000, // 80% of 1M
    costPer1M: { input: 0.5, output: 3.0 },
    providerSettings: { data_collection: "deny" },
    supportsVision: true,
    supportsTools: true,
    supportsReasoning: false,
    isSlowModel: false,
    priority: { vision: 1, tools: 3, reasoning: 3, default: 4 },
    role: "chat", // User-facing multimodal chat (NOT internal vision-only)
  },

  // ─────────────────────────────────────────────────────────────────────────
  // Gemini 2.5 Flash - Vision Fallback (NEW - Phase 6)
  // Vision-capable fallback for when Gemini 3 Flash fails
  // 1M context, multimodal, used as visual_reasoning fallback
  // ─────────────────────────────────────────────────────────────────────────
  {
    key: "gemini-2.5-flash",
    provider: "openrouter",
    modelId: "google/gemini-2.5-flash-preview",
    displayName: "Gemini 2.5 Flash",
    icon: "👁️",
    capabilities: ["vision", "large_context", "speed"],
    contextLimit: 1_000_000,
    compactAt: 800_000, // 80% of 1M
    costPer1M: { input: 0.15, output: 0.6 },
    providerSettings: { data_collection: "deny" },
    supportsVision: true,
    supportsTools: true,
    supportsReasoning: false,
    isSlowModel: false,
    priority: { vision: 2, tools: 5, reasoning: 5, default: 6 }, // Vision fallback (priority 2)
    role: "chat",
  },
];

// =============================================================================
// MODEL ROUTING CONFIGURATION
// =============================================================================

/**
 * Capability-based model routing with fallback chains
 *
 * NOTE: This is DIFFERENT from ModelConfig.priority:
 * - priority: Used for auto-selection in unified-chat (lower = better)
 * - MODEL_ROUTING: Used for executeWithFallback() in specific capability chains
 *
 * Example: agentic_tool_use uses GLM 4.7 as primary (best for complex multi-step
 * workflows), with Claude Haiku as fallback (faster for simpler tool calls).
 * This is intentional even though Claude Haiku has tools priority=1.
 *
 * When primary model fails (rate limit, error, etc.), automatically
 * falls back to the next model in the chain.
 *
 * Usage:
 * ```typescript
 * import { MODEL_ROUTING } from '@/lib/ai/models-config'
 * const routing = MODEL_ROUTING['strategic_reasoning']
 * // routing.primary = 'z-ai/glm-4.7'
 * // routing.fallback = 'deepseek/deepseek-v3.2:nitro'
 * // routing.tertiary = 'google/gemini-3-flash-preview'
 * ```
 */
export const MODEL_ROUTING = {
  /** Strategic reasoning - complex analysis, planning, decision-making */
  strategic_reasoning: {
    primary: "z-ai/glm-4.7",
    fallback: "deepseek/deepseek-v3.2:nitro",
    tertiary: "google/gemini-3-flash-preview",
  },
  /** Agentic tool use - multi-step workflows, tool calling */
  agentic_tool_use: {
    primary: "z-ai/glm-4.7",
    fallback: "anthropic/claude-haiku-4.5:nitro", // Chat model with supportsTools: true
    tertiary: "minimax/minimax-m2.1",
  },
  /** Coding tasks - code generation, debugging, refactoring */
  coding: {
    primary: "minimax/minimax-m2.1",
    fallback: "z-ai/glm-4.7",
    tertiary: "moonshotai/kimi-k2-thinking:nitro",
  },
  /** Visual reasoning - image analysis, diagrams, charts
   * NOTE: Fallbacks must also support vision for true image analysis fallback.
   * Gemini 2.5 Flash is the vision-capable fallback when Gemini 3 Flash fails.
   * Grok 4.1 is tertiary (text-only, for follow-up when image context exists).
   */
  visual_reasoning: {
    primary: "google/gemini-3-flash-preview",
    fallback: "google/gemini-2.5-flash-preview", // Vision-capable fallback
    tertiary: "x-ai/grok-4.1-fast:nitro", // Text-only (for follow-up responses)
  },
  /** Large context - documents >200K tokens */
  large_context: {
    primary: "x-ai/grok-4.1-fast:nitro",
    fallback: "google/gemini-3-flash-preview",
    tertiary: "moonshotai/kimi-k2-thinking:nitro",
  },
  /** Default chat - general conversation */
  default: {
    primary: "moonshotai/kimi-k2-thinking:nitro",
    fallback: "z-ai/glm-4.7",
    tertiary: "minimax/minimax-m2.1",
  },
} as const;

/** Type for routing capabilities */
export type RoutingCapability = keyof typeof MODEL_ROUTING;

// =============================================================================
// HELPER FUNCTIONS (Capability-Based, NOT Model-Based)
// =============================================================================

/**
 * Get the default model for new sessions
 *
 * Usage:
 * ```typescript
 * const model = getDefaultModel()
 * // Returns: Kimi K2 (cheapest, isDefault: true)
 * ```
 */
export function getDefaultModel(): ModelConfig {
  return MODEL_REGISTRY.find((m) => m.isDefault) || MODEL_REGISTRY[0];
}

/**
 * Get model by its unique key
 *
 * Usage:
 * ```typescript
 * const model = getModelByKey('grok-4')
 * // Returns: Grok 4 config
 * ```
 */
export function getModelByKey(key: string): ModelConfig | undefined {
  return MODEL_REGISTRY.find((m) => m.key === key);
}

/**
 * Get first model with a specific capability
 *
 * Usage:
 * ```typescript
 * const model = getModelByCapability('large_context')
 * // Returns: Grok 4 (2M context)
 * ```
 *
 * This is the primary API for model selection.
 * Platform code should request capabilities, NOT specific models.
 */
export function getModelByCapability(
  capability: ModelCapability,
): ModelConfig | undefined {
  return MODEL_REGISTRY.find((m) => m.capabilities.includes(capability));
}

/**
 * Get all models with a specific capability
 *
 * Usage:
 * ```typescript
 * const reasoningModels = getModelsByCapability('reasoning')
 * // Returns: [Kimi K2, DeepSeek V3, Claude Haiku]
 * ```
 */
export function getModelsByCapability(
  capability: ModelCapability,
): ModelConfig[] {
  return MODEL_REGISTRY.filter((m) => m.capabilities.includes(capability));
}

/**
 * Get all available models (for UI model selector)
 */
export function getAllModels(): ModelConfig[] {
  return MODEL_REGISTRY;
}

/**
 * Get all model keys (for type-safe usage)
 */
export function getAllModelKeys(): string[] {
  return MODEL_REGISTRY.map((m) => m.key);
}

// =============================================================================
// INTELLIGENT ROUTING HELPERS
// =============================================================================

/**
 * Get all chat-facing models (excludes vision-only models)
 *
 * Usage:
 * ```typescript
 * const chatModels = getChatModels()
 * // Returns: [Kimi K2, Claude Haiku, DeepSeek, Grok] - NOT Gemini
 * ```
 */
export function getChatModels(): ModelConfig[] {
  return MODEL_REGISTRY.filter((m) => m.role === "chat");
}

/**
 * Get the best vision model (for image analysis)
 *
 * Returns the model with highest vision priority (lowest priority.vision number).
 * Currently returns Gemini 3 Flash which handles both vision and chat.
 *
 * Usage:
 * ```typescript
 * const visionModel = getVisionModel()
 * // Returns: Gemini 3 Flash
 * ```
 */
export function getVisionModel(): ModelConfig | undefined {
  const visionModels = MODEL_REGISTRY.filter((m) => m.supportsVision);
  if (visionModels.length === 0) return undefined;
  // Return the model with lowest (best) vision priority
  return visionModels.reduce(
    (best, current) =>
      current.priority.vision < best.priority.vision ? current : best,
    visionModels[0]
  );
}

/**
 * Get the best model for a specific capability based on priority
 *
 * Usage:
 * ```typescript
 * const toolModel = getBestModelForCapability('tools')
 * // Returns: Claude Haiku (priority.tools = 1)
 *
 * const reasoningModel = getBestModelForCapability('reasoning')
 * // Returns: DeepSeek V3.2 (priority.reasoning = 1)
 * ```
 */
export function getBestModelForCapability(
  capability: keyof RoutingPriority,
): ModelConfig {
  const chatModels = getChatModels();
  return chatModels.reduce(
    (best, current) =>
      current.priority[capability] < best.priority[capability] ? current : best,
    chatModels[0],
  );
}

/**
 * Get model for large context overflow (>200K tokens)
 *
 * Usage:
 * ```typescript
 * const largeContextModel = getLargeContextModel()
 * // Returns: Grok 4 (2M context)
 * ```
 */
export function getLargeContextModel(): ModelConfig | undefined {
  return MODEL_REGISTRY.find((m) => m.capabilities.includes("large_context"));
}

/**
 * Check if a model shows the slow indicator
 */
export function isSlowModel(modelKey: string): boolean {
  const model = getModelByKey(modelKey);
  return model?.isSlowModel ?? false;
}

/**
 * Dev accounts that see the debug panel
 */
export const DEV_EMAILS = ["harsha@befach.com"];

/**
 * Check if user is in dev mode
 */
export function isDevMode(email: string | null | undefined): boolean {
  return email ? DEV_EMAILS.includes(email) : false;
}

// =============================================================================
// UI HELPERS
// =============================================================================

/**
 * Model options for UI dropdowns
 *
 * Includes "Auto" option at the top for smart selection.
 */
export interface ModelOption {
  id: string;
  name: string;
  description: string;
  icon: string;
}

/**
 * Get model options for UI model selector
 *
 * Returns models formatted for dropdown, with "Auto" at the top.
 */
export function getModelOptionsForUI(): ModelOption[] {
  const autoOption: ModelOption = {
    id: "auto",
    name: "Auto",
    description: "Smart selection (recommended)",
    icon: "🤖",
  };

  const modelOptions: ModelOption[] = MODEL_REGISTRY.map((m) => ({
    id: m.key,
    name: m.displayName,
    description: `${Math.round(m.contextLimit / 1000)}K context`,
    icon: m.icon,
  }));

  return [autoOption, ...modelOptions];
}

// =============================================================================
// COST HELPERS
// =============================================================================

/**
 * Calculate estimated cost for a request
 */
export function calculateCost(
  model: ModelConfig,
  inputTokens: number,
  outputTokens: number,
): number {
  const inputCost = (inputTokens / 1_000_000) * model.costPer1M.input;
  const outputCost = (outputTokens / 1_000_000) * model.costPer1M.output;
  return inputCost + outputCost;
}

/**
 * Format cost as USD string
 */
export function formatCost(cost: number): string {
  if (cost < 0.01) {
    return `$${(cost * 100).toFixed(4)}¢`;
  }
  return `$${cost.toFixed(4)}`;
}

// =============================================================================
// TYPE EXPORTS
// =============================================================================

export type ModelKey = (typeof MODEL_REGISTRY)[number]["key"];
