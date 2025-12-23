/**
 * Zod Schemas for AI SDK Structured Outputs
 *
 * These schemas define the expected structure of AI responses.
 * Used with generateObject() for type-safe, validated AI outputs.
 *
 * Benefits:
 * - Compile-time type safety
 * - Runtime validation (AI SDK retries if schema fails)
 * - No manual JSON parsing needed
 * - Self-documenting API contracts
 */

import { z } from 'zod'

// =============================================================================
// WORK ITEM TYPES
// =============================================================================

/**
 * Valid work item types
 */
export const WorkItemTypeSchema = z.enum([
  'idea',
  'epic',
  'feature',
  'user_story',
  'task',
  'bug',
])

export type WorkItemType = z.infer<typeof WorkItemTypeSchema>

/**
 * Valid priority levels
 */
export const PrioritySchema = z.enum(['critical', 'high', 'medium', 'low'])

export type Priority = z.infer<typeof PrioritySchema>

// =============================================================================
// NOTE ANALYSIS SCHEMA
// =============================================================================

/**
 * Schema for AI-suggested work item from note analysis
 *
 * Used by: POST /api/ai/analyze-note
 */
export const SuggestedWorkItemSchema = z.object({
  type: WorkItemTypeSchema.describe(
    'The most appropriate work item type based on the note content'
  ),
  name: z
    .string()
    .min(3)
    .max(100)
    .describe('Concise name for the work item (3-8 words)'),
  purpose: z
    .string()
    .min(10)
    .max(500)
    .describe('1-2 sentences explaining why this work item matters'),
  priority: PrioritySchema.describe(
    'Priority level based on apparent urgency and importance'
  ),
  tags: z
    .array(z.string().max(30))
    .max(5)
    .describe('Relevant tags for categorization (max 5)'),
  acceptanceCriteria: z
    .array(z.string().max(200))
    .min(1)
    .max(5)
    .describe('Specific, testable criteria for completion (1-5 items)'),
  estimatedHours: z
    .number()
    .min(0.5)
    .max(200)
    .optional()
    .describe('Estimated hours to complete (only if inferable from content)'),
  confidence: z
    .number()
    .min(0)
    .max(100)
    .describe('Confidence in this classification (0-100)'),
  reasoning: z
    .string()
    .max(300)
    .describe('Brief explanation of why you chose this type and priority'),
})

export type SuggestedWorkItem = z.infer<typeof SuggestedWorkItemSchema>

// =============================================================================
// DEPENDENCY SUGGESTION SCHEMA
// =============================================================================

/**
 * Valid dependency connection types
 * Matches the types used in dependency-suggestion.ts prompts
 */
export const ConnectionTypeSchema = z.enum([
  'dependency', // Source depends on target (target must be done first)
  'blocks', // Source blocks target (source must be done first)
  'complements', // Features work better together but don't strictly depend
  'relates_to', // General relationship, shared concepts
])

export type ConnectionType = z.infer<typeof ConnectionTypeSchema>

/**
 * Schema for a single dependency suggestion
 */
export const DependencySuggestionSchema = z.object({
  sourceId: z.string().describe('ID of the source work item'),
  targetId: z.string().describe('ID of the target work item'),
  connectionType: ConnectionTypeSchema.describe('Type of dependency relationship'),
  reason: z
    .string()
    .min(10)
    .max(300)
    .describe('Brief explanation of why this dependency exists'),
  confidence: z
    .number()
    .min(0)
    .max(1)
    .describe('Confidence in this suggestion (0.0-1.0)'),
  strength: z
    .number()
    .min(0)
    .max(1)
    .optional()
    .default(0.7)
    .describe('Strength of the dependency (0.0-1.0)'),
})

export type DependencySuggestion = z.infer<typeof DependencySuggestionSchema>

/**
 * Schema for array of dependency suggestions
 *
 * Used by: POST /api/ai/dependencies/suggest
 */
export const DependencySuggestionsSchema = z.object({
  suggestions: z
    .array(DependencySuggestionSchema)
    .describe('Array of suggested dependencies between work items'),
  analysis: z
    .string()
    .max(500)
    .optional()
    .describe('Brief overall analysis of the dependency structure'),
})

export type DependencySuggestions = z.infer<typeof DependencySuggestionsSchema>

// =============================================================================
// MIND MAP NODE SUGGESTION SCHEMA
// =============================================================================

/**
 * Schema for AI-suggested mind map nodes
 *
 * Used for: AI-assisted mind mapping features
 */
export const MindMapNodeSuggestionSchema = z.object({
  label: z.string().min(1).max(100).describe('Node label/title'),
  description: z.string().max(300).optional().describe('Optional description'),
  nodeType: z
    .enum(['concept', 'feature', 'task', 'question', 'idea'])
    .describe('Type of node'),
  parentId: z.string().optional().describe('ID of parent node if applicable'),
  position: z
    .object({
      x: z.number(),
      y: z.number(),
    })
    .optional()
    .describe('Suggested position'),
})

export type MindMapNodeSuggestion = z.infer<typeof MindMapNodeSuggestionSchema>

export const MindMapExpansionSchema = z.object({
  nodes: z
    .array(MindMapNodeSuggestionSchema)
    .describe('Suggested nodes to add to the mind map'),
  reasoning: z.string().max(300).describe('Explanation of the suggestions'),
})

export type MindMapExpansion = z.infer<typeof MindMapExpansionSchema>

// =============================================================================
// FEATURE PRIORITIZATION SCHEMA
// =============================================================================

/**
 * Schema for feature prioritization analysis
 */
export const FeaturePrioritizationSchema = z.object({
  featureId: z.string().describe('ID of the feature being analyzed'),
  score: z.number().min(0).max(100).describe('Priority score (0-100)'),
  factors: z.object({
    impact: z.number().min(0).max(10).describe('Business impact (0-10)'),
    effort: z.number().min(0).max(10).describe('Implementation effort (0-10)'),
    risk: z.number().min(0).max(10).describe('Risk level (0-10)'),
    urgency: z.number().min(0).max(10).describe('Time sensitivity (0-10)'),
  }),
  recommendation: z
    .enum(['must_have', 'should_have', 'nice_to_have', 'defer'])
    .describe('Prioritization recommendation'),
  reasoning: z.string().max(300).describe('Explanation of the prioritization'),
})

export type FeaturePrioritization = z.infer<typeof FeaturePrioritizationSchema>

export const FeaturePrioritizationResultsSchema = z.object({
  priorities: z.array(FeaturePrioritizationSchema),
  summary: z.string().max(500).describe('Overall prioritization summary'),
})

export type FeaturePrioritizationResults = z.infer<
  typeof FeaturePrioritizationResultsSchema
>

// =============================================================================
// CHAT INTENT CLASSIFICATION SCHEMA
// =============================================================================

/**
 * Schema for classifying user intent in chat
 */
export const ChatIntentSchema = z.object({
  intent: z
    .enum([
      'question', // User is asking a question
      'command', // User wants to perform an action
      'research', // User wants research/analysis
      'create', // User wants to create something
      'modify', // User wants to modify something
      'explain', // User wants an explanation
      'other', // Other intent
    ])
    .describe('The primary intent of the user message'),
  entities: z
    .array(
      z.object({
        type: z.string().describe('Entity type (e.g., "feature", "workspace")'),
        value: z.string().describe('Entity value'),
      })
    )
    .optional()
    .describe('Extracted entities from the message'),
  confidence: z.number().min(0).max(1).describe('Confidence in classification'),
  suggestedTools: z
    .array(z.string())
    .optional()
    .describe('Tools that might be useful for this intent'),
})

export type ChatIntent = z.infer<typeof ChatIntentSchema>

// =============================================================================
// STRATEGY ALIGNMENT SUGGESTION SCHEMA
// =============================================================================

/**
 * Valid alignment strength levels
 */
export const AlignmentStrengthSchema = z.enum(['weak', 'medium', 'strong'])

export type AlignmentStrengthAI = z.infer<typeof AlignmentStrengthSchema>

/**
 * Schema for a single alignment suggestion
 *
 * Used by: POST /api/ai/strategies/suggest
 */
export const AlignmentSuggestionSchema = z.object({
  workItemId: z.string().describe('ID of the work item to align'),
  strategyId: z.string().describe('ID of the strategy to align to'),
  confidence: z
    .number()
    .min(0)
    .max(1)
    .describe('Confidence in this suggestion (0.0-1.0)'),
  reason: z
    .string()
    .min(10)
    .max(300)
    .describe('Brief explanation of why this work item aligns with this strategy'),
  alignmentStrength: AlignmentStrengthSchema.describe(
    'How strongly the work item aligns: weak (tangential), medium (supports), strong (directly contributes)'
  ),
})

export type AlignmentSuggestionAI = z.infer<typeof AlignmentSuggestionSchema>

/**
 * Schema for array of alignment suggestions
 *
 * Used by: POST /api/ai/strategies/suggest
 */
export const AlignmentSuggestionsSchema = z.object({
  suggestions: z
    .array(AlignmentSuggestionSchema)
    .describe('Array of suggested work item to strategy alignments'),
  analysis: z
    .string()
    .max(500)
    .optional()
    .describe('Brief overall analysis of the alignment coverage'),
})

export type AlignmentSuggestionsAI = z.infer<typeof AlignmentSuggestionsSchema>

// =============================================================================
// METHODOLOGY SUGGESTION SCHEMA
// =============================================================================

/**
 * Valid Design Thinking frameworks
 */
export const DesignThinkingFrameworkSchema = z.enum([
  'stanford',
  'double-diamond',
  'ideo',
  'ibm',
])

export type DesignThinkingFrameworkAI = z.infer<typeof DesignThinkingFrameworkSchema>

/**
 * Schema for a single method/tool suggestion
 */
export const SuggestedMethodSchema = z.object({
  toolId: z.string().describe('ID of the recommended Design Thinking tool'),
  toolName: z.string().describe('Name of the tool'),
  reason: z
    .string()
    .max(200)
    .describe('Why this tool is recommended for the current context'),
  priority: z
    .enum(['high', 'medium', 'low'])
    .describe('Priority of using this tool'),
})

export type SuggestedMethod = z.infer<typeof SuggestedMethodSchema>

/**
 * Schema for methodology suggestion response
 *
 * Used by: POST /api/ai/methodology/suggest
 */
export const MethodologySuggestionSchema = z.object({
  primaryFramework: DesignThinkingFrameworkSchema.describe(
    'Recommended primary Design Thinking framework'
  ),
  frameworkReason: z
    .string()
    .max(300)
    .describe('Why this framework fits the work item and current phase'),
  suggestedMethods: z
    .array(SuggestedMethodSchema)
    .min(1)
    .max(5)
    .describe('Specific tools/methods to use (1-5 recommendations)'),
  nextSteps: z
    .array(z.string().max(150))
    .min(1)
    .max(3)
    .describe('Actionable next steps the team should take (1-3 items)'),
  relevantCaseStudies: z
    .array(z.string())
    .max(3)
    .describe('IDs of relevant case studies for inspiration'),
  phaseSpecificTips: z
    .array(z.string().max(150))
    .max(3)
    .describe('Tips tailored to the current phase'),
})

export type MethodologySuggestion = z.infer<typeof MethodologySuggestionSchema>
