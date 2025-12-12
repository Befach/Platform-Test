/**
 * Message Analyzer for Intelligent Model Routing
 *
 * Analyzes user messages to determine:
 * 1. Content type (text, images, files)
 * 2. Required capabilities (tools, reasoning, large context)
 * 3. Optimal model for the request
 *
 * This is a rule-based analyzer - NO API calls.
 * Runs synchronously before the main LLM call.
 */

import {
  ModelConfig,
  getDefaultModel,
  getVisionModel,
  getBestModelForCapability,
  getLargeContextModel,
  getChatModels,
  getModelByKey,
} from './models-config'
import { getTaskComplexity } from './task-planner'

// =============================================================================
// TYPES
// =============================================================================

/**
 * Supported image MIME types for vision analysis
 */
export const SUPPORTED_IMAGE_TYPES = [
  'image/png',
  'image/jpeg',
  'image/jpg',
  'image/gif',
  'image/webp',
]

/**
 * File attachment from the chat interface
 */
export interface FileAttachment {
  name: string
  type: string // MIME type
  size: number
  data: string // base64 or URL
}

/**
 * Chat mode determining tool availability
 */
export type ChatMode = 'chat' | 'agentic'

/**
 * Reason why a specific model was selected
 */
export type RoutingReason =
  | 'default' // No special requirements, using default model
  | 'image_detected' // Has images, using vision pipeline
  | 'tool_required' // Agentic mode with tools enabled
  | 'deep_reasoning' // User requested deep analysis
  | 'large_context' // Context exceeds 200K tokens
  | 'dev_override' // Developer manually selected model

/**
 * Result of message analysis
 */
export interface AnalysisResult {
  /** Does the message contain images? */
  hasImages: boolean

  /** Extracted images for vision processing */
  images: FileAttachment[]

  /** Does the request need tool execution? */
  needsTools: boolean

  /** Does the request need deep reasoning? */
  needsDeepReasoning: boolean

  /** Is this a multi-step task that should generate a plan? */
  isMultiStepTask: boolean

  /** Complexity level of multi-step task */
  multiStepComplexity: 'simple' | 'medium' | 'complex'

  /** Estimated token count for the message */
  estimatedTokens: number

  /** Selected model for chat response (NOT vision) */
  selectedModel: ModelConfig

  /** Why this model was selected */
  routingReason: RoutingReason

  /** Vision model if images detected (for internal analysis) */
  visionModel?: ModelConfig
}

// =============================================================================
// DETECTION PATTERNS
// =============================================================================

/**
 * Keywords that trigger deep reasoning mode
 */
const DEEP_REASONING_PATTERNS = [
  /analyze\s+deeply/i,
  /think\s+(through|carefully|step\s*by\s*step)/i,
  /reason\s+(about|through)/i,
  /in[\s-]depth\s+(analysis|review)/i,
  /comprehensive\s+(analysis|review|assessment)/i,
  /thoroughly\s+(analyze|examine|review)/i,
  /detailed\s+(breakdown|analysis|explanation)/i,
  /complex\s+(problem|question|issue)/i,
  /help\s+me\s+understand\s+deeply/i,
  /explain\s+in\s+detail/i,
]

/**
 * Keywords that indicate multi-step task requiring plan approval
 */
const MULTI_STEP_PATTERNS = [
  /and\s+then/i,
  /after\s+that/i,
  /first[,.]?\s*.*then/i,
  /analyze.*create/i,
  /research.*summarize/i,
  /find.*and.*update/i,
  /multiple|several|all\s+of/i,
  /step\s*by\s*step/i,
  /for\s+each/i,
  /one\s+by\s+one/i,
  /batch/i,
  /bulk/i,
]

/**
 * Context threshold for switching to large context model (200K tokens)
 */
const LARGE_CONTEXT_THRESHOLD = 200_000

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Check if a file is an image
 */
export function isImageFile(file: FileAttachment): boolean {
  return SUPPORTED_IMAGE_TYPES.includes(file.type.toLowerCase())
}

/**
 * Extract images from file attachments
 */
export function extractImages(files: FileAttachment[]): FileAttachment[] {
  return files.filter(isImageFile)
}

/**
 * Estimate token count for a string
 * Rough estimate: ~4 characters per token for English text
 */
export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4)
}

/**
 * Check if message triggers deep reasoning
 */
export function detectDeepReasoning(message: string): boolean {
  return DEEP_REASONING_PATTERNS.some((pattern) => pattern.test(message))
}

/**
 * Check if message is a multi-step task
 */
export function detectMultiStepTask(message: string): boolean {
  // Count how many patterns match
  const matchCount = MULTI_STEP_PATTERNS.filter((p) => p.test(message)).length

  // Need at least 1 strong match or 2 weak matches
  return matchCount >= 1
}

// =============================================================================
// MAIN ANALYZER
// =============================================================================

/**
 * Analyze a message and determine optimal routing
 *
 * Routing Decision Tree:
 * 1. Has images? → Route to vision pipeline (Gemini analyzes → chat model responds)
 * 2. Agentic mode? → Claude Haiku (best for tools)
 * 3. Deep reasoning? → DeepSeek V3.2 (shows "Deep thinking...")
 * 4. Large context? → Grok 4 (2M tokens)
 * 5. Default → Kimi K2 (cheapest, good quality)
 *
 * @param message User message text
 * @param files Attached files
 * @param mode Chat or agentic mode
 * @param contextTokens Current conversation context token count
 * @param devOverrideModel Optional model key from dev override
 */
export function analyzeMessage(
  message: string,
  files: FileAttachment[] = [],
  mode: ChatMode = 'chat',
  contextTokens: number = 0,
  devOverrideModel?: string
): AnalysisResult {
  // Extract images from attachments
  const images = extractImages(files)
  const hasImages = images.length > 0

  // Detect capabilities needed
  const needsTools = mode === 'agentic'
  const needsDeepReasoning = detectDeepReasoning(message)
  const isMultiStepTask = detectMultiStepTask(message) && mode === 'agentic'

  // Estimate tokens (message + context)
  const messageTokens = estimateTokens(message)
  const estimatedTokens = contextTokens + messageTokens

  // Handle dev override first
  if (devOverrideModel) {
    const overrideModel = getModelByKey(devOverrideModel)
    if (overrideModel && overrideModel.role === 'chat') {
      return {
        hasImages,
        images,
        needsTools,
        needsDeepReasoning,
        isMultiStepTask,
        multiStepComplexity: isMultiStepTask ? getTaskComplexity(message) : 'simple',
        estimatedTokens,
        selectedModel: overrideModel,
        routingReason: 'dev_override',
        visionModel: hasImages ? getVisionModel() : undefined,
      }
    }
  }

  // Routing decision tree
  let selectedModel: ModelConfig
  let routingReason: RoutingReason

  // Step 1: Check for large context first (overrides other considerations)
  if (estimatedTokens > LARGE_CONTEXT_THRESHOLD) {
    const largeContextModel = getLargeContextModel()
    if (largeContextModel) {
      selectedModel = largeContextModel
      routingReason = 'large_context'
    } else {
      // Fallback to default if no large context model available
      selectedModel = getDefaultModel()
      routingReason = 'default'
    }
  }
  // Step 2: Agentic mode with tools → Claude Haiku
  else if (needsTools) {
    selectedModel = getBestModelForCapability('tools')
    routingReason = 'tool_required'
  }
  // Step 3: Deep reasoning requested → DeepSeek V3.2
  else if (needsDeepReasoning) {
    selectedModel = getBestModelForCapability('reasoning')
    routingReason = 'deep_reasoning'
  }
  // Step 4: Has images → still use default chat model (vision is internal)
  else if (hasImages) {
    selectedModel = getDefaultModel()
    routingReason = 'image_detected'
  }
  // Step 5: Default → Kimi K2
  else {
    selectedModel = getDefaultModel()
    routingReason = 'default'
  }

  return {
    hasImages,
    images,
    needsTools,
    needsDeepReasoning,
    isMultiStepTask,
    multiStepComplexity: isMultiStepTask ? getTaskComplexity(message) : 'simple',
    estimatedTokens,
    selectedModel,
    routingReason,
    visionModel: hasImages ? getVisionModel() : undefined,
  }
}

// =============================================================================
// ROUTING INFO (for dev debug panel)
// =============================================================================

/**
 * Human-readable routing explanation
 */
export function getRoutingExplanation(result: AnalysisResult): string {
  const model = result.selectedModel

  switch (result.routingReason) {
    case 'dev_override':
      return `Dev override: Using ${model.displayName}`
    case 'image_detected':
      return `Image detected: Gemini Flash analyzes → ${model.displayName} responds`
    case 'tool_required':
      return `Agentic mode: Using ${model.displayName} for tool execution`
    case 'deep_reasoning':
      return `Deep reasoning: Using ${model.displayName} (may take longer)`
    case 'large_context':
      return `Large context (${Math.round(result.estimatedTokens / 1000)}K tokens): Using ${model.displayName}`
    default:
      return `Default routing: ${model.displayName}`
  }
}

/**
 * Get all routing info for dev panel
 */
export interface RoutingDebugInfo {
  selectedModel: string
  modelDisplayName: string
  routingReason: RoutingReason
  explanation: string
  hasImages: boolean
  imageCount: number
  needsTools: boolean
  needsDeepReasoning: boolean
  isMultiStepTask: boolean
  multiStepComplexity: 'simple' | 'medium' | 'complex'
  estimatedTokens: number
  isSlowModel: boolean
}

export function getRoutingDebugInfo(result: AnalysisResult): RoutingDebugInfo {
  return {
    selectedModel: result.selectedModel.key,
    modelDisplayName: result.selectedModel.displayName,
    routingReason: result.routingReason,
    explanation: getRoutingExplanation(result),
    hasImages: result.hasImages,
    imageCount: result.images.length,
    needsTools: result.needsTools,
    needsDeepReasoning: result.needsDeepReasoning,
    isMultiStepTask: result.isMultiStepTask,
    multiStepComplexity: result.multiStepComplexity,
    estimatedTokens: result.estimatedTokens,
    isSlowModel: result.selectedModel.isSlowModel,
  }
}
