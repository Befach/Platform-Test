/**
 * Image Analyzer - Two-Step Vision Pipeline
 *
 * Step 1: Gemini Flash analyzes image(s) internally
 * Step 2: Description injected into chat model context
 *
 * Key Insight: Gemini Flash is a "vision tool", NOT a chat model.
 * Users always see responses from the routed chat model (Kimi K2, Claude, etc.)
 *
 * Flow:
 * User uploads image → Gemini analyzes (internal) → stores imageContext →
 * Chat model (Kimi K2) responds with image context
 */

import { createOpenRouter } from '@openrouter/ai-sdk-provider'
import { generateText } from 'ai'
import { getVisionModel } from './models-config'

// =============================================================================
// TYPES
// =============================================================================

/**
 * Image data for analysis
 */
export interface ImageData {
  /** Base64-encoded image data or URL */
  data: string
  /** MIME type (image/png, image/jpeg, etc.) */
  mimeType: string
  /** Optional filename for context */
  filename?: string
}

/**
 * Result of image analysis
 */
export interface ImageAnalysisResult {
  /** Whether analysis succeeded */
  success: boolean
  /** Detailed description from Gemini */
  description: string
  /** Timestamp of analysis */
  timestamp: number
  /** Processing time in ms */
  processingTime: number
  /** Error message if failed */
  error?: string
}

/**
 * Stored image context for thread
 */
export interface ImageContext {
  /** Message ID that included the image */
  messageId: string
  /** Analysis description */
  description: string
  /** When image was analyzed */
  timestamp: number
  /** Original filename if provided */
  filename?: string
}

// =============================================================================
// VISION ANALYSIS PROMPT
// =============================================================================

const IMAGE_ANALYSIS_SYSTEM_PROMPT = `You are a precise image analyzer. Your job is to provide detailed, accurate descriptions of images that will be used by another AI to answer user questions.

Instructions:
1. Describe what you see in detail, including:
   - Main subjects/objects
   - Text visible in the image (OCR)
   - Colors, layout, composition
   - Any charts, diagrams, or data visualizations
   - Context clues about what the image represents

2. For screenshots/UI:
   - Describe the interface elements
   - List any visible text, labels, buttons
   - Note the application or website if identifiable

3. For documents/text:
   - Extract all readable text
   - Preserve formatting where relevant
   - Note any tables, lists, or structured data

4. For code screenshots:
   - Extract the code as accurately as possible
   - Note the programming language if identifiable
   - Mention any visible file names or paths

5. Be factual and objective - don't interpret or assume beyond what's visible.

Output format:
Provide a clear, structured description that another AI can use to answer questions about this image.`

// =============================================================================
// MAIN ANALYZER FUNCTION
// =============================================================================

/**
 * Analyze an image using Gemini Flash
 *
 * This is an INTERNAL function - output is never shown to users.
 * The description is injected into the chat model's system prompt.
 *
 * @param image Image data (base64 or URL)
 * @returns Analysis result with description
 */
export async function analyzeImage(image: ImageData): Promise<ImageAnalysisResult> {
  const startTime = Date.now()

  try {
    const visionModel = getVisionModel()
    if (!visionModel) {
      return {
        success: false,
        description: '',
        timestamp: startTime,
        processingTime: 0,
        error: 'Vision model not configured',
      }
    }

    const openrouter = createOpenRouter({
      apiKey: process.env.OPENROUTER_API_KEY,
    })

    // Construct image content based on data type
    const imageContent =
      image.data.startsWith('data:') || image.data.startsWith('http')
        ? { type: 'image' as const, image: image.data }
        : { type: 'image' as const, image: `data:${image.mimeType};base64,${image.data}` }

    const { text } = await generateText({
      model: openrouter(visionModel.modelId),
      system: IMAGE_ANALYSIS_SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: [
            imageContent,
            {
              type: 'text',
              text: image.filename
                ? `Analyze this image (filename: ${image.filename}):`
                : 'Analyze this image:',
            },
          ],
        },
      ],
      // Note: maxTokens removed - using model default for image analysis
    })

    return {
      success: true,
      description: text,
      timestamp: startTime,
      processingTime: Date.now() - startTime,
    }
  } catch (error) {
    console.error('[ImageAnalyzer] Failed to analyze image:', error)
    return {
      success: false,
      description: '',
      timestamp: startTime,
      processingTime: Date.now() - startTime,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Analyze multiple images and combine descriptions
 */
export async function analyzeImages(images: ImageData[]): Promise<ImageAnalysisResult[]> {
  // Process images in parallel for speed
  const results = await Promise.all(images.map(analyzeImage))
  return results
}

// =============================================================================
// CONTEXT MANAGEMENT
// =============================================================================

/**
 * Format image contexts for injection into system prompt
 *
 * @param contexts Array of image contexts from the thread
 * @returns Formatted string to append to system prompt
 */
export function formatImageContextForPrompt(contexts: ImageContext[]): string {
  if (contexts.length === 0) return ''

  const header = '\n\n## Image Context\nThe following images were shared in this conversation:\n'

  const descriptions = contexts
    .map((ctx, i) => {
      const label = ctx.filename ? `Image ${i + 1} (${ctx.filename})` : `Image ${i + 1}`
      return `### ${label}\n${ctx.description}`
    })
    .join('\n\n')

  return header + descriptions
}

/**
 * Create image context from analysis result
 */
export function createImageContext(
  messageId: string,
  result: ImageAnalysisResult,
  filename?: string
): ImageContext {
  return {
    messageId,
    description: result.description,
    timestamp: result.timestamp,
    filename,
  }
}

// =============================================================================
// STORAGE HELPERS (for thread metadata)
// =============================================================================

/**
 * Thread metadata structure with image contexts
 */
export interface ThreadImageMetadata {
  imageContexts: ImageContext[]
}

/**
 * Add image context to thread metadata
 */
export function addImageContextToMetadata(
  metadata: Record<string, unknown>,
  context: ImageContext
): Record<string, unknown> {
  const existingContexts = (metadata.imageContexts as ImageContext[]) || []
  return {
    ...metadata,
    imageContexts: [...existingContexts, context],
  }
}

/**
 * Get image contexts from thread metadata
 */
export function getImageContextsFromMetadata(
  metadata: Record<string, unknown>
): ImageContext[] {
  return (metadata.imageContexts as ImageContext[]) || []
}

/**
 * Clear old image contexts (keep last N)
 */
export function pruneImageContexts(
  contexts: ImageContext[],
  maxContexts: number = 10
): ImageContext[] {
  if (contexts.length <= maxContexts) return contexts
  // Keep most recent
  return contexts.slice(-maxContexts)
}
