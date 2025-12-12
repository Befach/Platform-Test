/**
 * Task Planner for Multi-Step Autonomous Execution
 *
 * Decomposes user requests into executable task plans.
 * Works with the agent loop to execute plans with user approval.
 *
 * Features:
 * - LLM-based task decomposition
 * - Dependency tracking between steps
 * - Plan validation and safety checks
 * - Progress estimation
 */

import { generateObject } from 'ai'
import { createOpenRouter } from '@openrouter/ai-sdk-provider'
import { z } from 'zod'
import { getDefaultModel } from './models-config'
import { toolRegistry } from './tools/tool-registry'

// =============================================================================
// TYPES
// =============================================================================

/**
 * A single step in a task plan
 */
export interface TaskStep {
  /** Unique step ID */
  id: string
  /** Execution order (1-based) */
  order: number
  /** Human-readable description */
  description: string
  /** Tool to execute */
  toolName: string
  /** Parameters for the tool */
  params: Record<string, unknown>
  /** Step IDs this depends on (for parallel execution) */
  dependsOn: string[]
  /** Current status */
  status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped'
  /** Result after execution */
  result?: unknown
  /** Error message if failed */
  error?: string
}

/**
 * Complete task plan
 */
export interface TaskPlan {
  /** Unique plan ID */
  id: string
  /** Original user goal */
  goal: string
  /** Ordered steps to execute */
  steps: TaskStep[]
  /** Estimated duration */
  estimatedDuration: 'fast' | 'medium' | 'slow'
  /** Does this plan need user approval? */
  requiresApproval: boolean
  /** Plan creation timestamp */
  createdAt: number
  /** Current plan status */
  status: 'draft' | 'approved' | 'executing' | 'completed' | 'failed' | 'cancelled'
  /** Summary after completion */
  summary?: string
}

/**
 * Options for creating a task plan
 */
export interface CreatePlanOptions {
  /** User's message/request */
  userMessage: string
  /** Team ID for tool execution */
  teamId: string
  /** Workspace ID for context */
  workspaceId: string
  /** Conversation context for better understanding */
  conversationContext?: string
  /** Maximum steps allowed */
  maxSteps?: number
}

/**
 * Result of plan creation
 */
export interface CreatePlanResult {
  success: boolean
  plan?: TaskPlan
  error?: string
}

// =============================================================================
// MULTI-STEP DETECTION
// =============================================================================

/**
 * Patterns that indicate multi-step tasks
 */
const MULTI_STEP_PATTERNS = [
  // Sequential indicators
  /and\s+then/i,
  /after\s+that/i,
  /first[,.]?\s+.*then/i,
  /next[,.]?\s+/i,
  /finally[,.]?\s+/i,
  /step\s+\d/i,

  // Action combinations
  /analyze.*(?:and|then).*create/i,
  /research.*(?:and|then).*summarize/i,
  /find.*(?:and|then).*update/i,
  /search.*(?:and|then).*create/i,
  /review.*(?:and|then).*prioritize/i,
  /gather.*(?:and|then).*organize/i,

  // Quantity indicators
  /(?:create|add|make)\s+(?:multiple|several|all|each|\d+)/i,
  /for\s+(?:each|every|all)/i,
  /batch\s+/i,

  // Complex request patterns
  /(?:based\s+on|using)\s+.*(?:create|generate|make)/i,
  /compare.*(?:and|then)/i,
]

/**
 * Detect if a message requires multi-step execution
 */
export function isMultiStepTask(message: string): boolean {
  // Check against patterns
  const matchesPattern = MULTI_STEP_PATTERNS.some(pattern => pattern.test(message))
  if (matchesPattern) return true

  // Check for multiple tool mentions
  const availableTools = toolRegistry.getAll()
  const toolNames = availableTools.map(t => t.metadata.name.toLowerCase())
  const mentionedTools = toolNames.filter((name: string) =>
    message.toLowerCase().includes(name.replace(/_/g, ' '))
  )

  // If 2+ tools are mentioned, likely multi-step
  if (mentionedTools.length >= 2) return true

  // Check for enumeration (1. 2. 3. or - - -)
  if (/(?:^|\n)\s*(?:\d+[.):]|\-|\*)\s+\w/m.test(message)) return true

  return false
}

/**
 * Get the complexity level of a multi-step task
 */
export function getTaskComplexity(message: string): 'simple' | 'medium' | 'complex' {
  const wordCount = message.split(/\s+/).length

  // Check for multiple goals
  const goalIndicators = (message.match(/(?:and|also|plus|as well as)/gi) || []).length

  if (wordCount > 100 || goalIndicators >= 3) return 'complex'
  if (wordCount > 50 || goalIndicators >= 1) return 'medium'
  return 'simple'
}

// =============================================================================
// PLAN CREATION
// =============================================================================

/**
 * Schema for LLM-generated plan
 */
const PlanSchema = z.object({
  goal: z.string().describe('The main goal of the task plan'),
  steps: z.array(z.object({
    description: z.string().describe('What this step does'),
    toolName: z.string().describe('The tool to use'),
    params: z.record(z.string(), z.unknown()).describe('Parameters for the tool'),
    dependsOn: z.array(z.string()).default([]).describe('IDs of steps this depends on'),
  })).describe('Ordered steps to execute'),
  estimatedDuration: z.enum(['fast', 'medium', 'slow']).describe('How long this will take'),
})

/**
 * System prompt for task planning
 */
function buildPlannerPrompt(availableTools: string[]): string {
  return `You are a task planner that breaks down user requests into executable steps.

## Available Tools
${availableTools.join('\n')}

## Rules
1. Break down the request into clear, atomic steps
2. Each step should use exactly one tool
3. Order steps logically - dependencies before dependents
4. Use tool names exactly as listed above
5. Provide all required parameters for each tool
6. Keep plans under 10 steps (if more needed, focus on essentials)
7. Estimate duration based on step count: 1-3 steps = fast, 4-6 = medium, 7+ = slow

## Parameter Guidelines
- For createWorkItem: always include name, type (feature/bug/enhancement), and description
- For webSearch: include query and optionally limit results
- For createTask: include title, workItemId (use "TBD" if depends on createWorkItem), and description
- For analyzeFeedback: include the text to analyze

## Example
User: "Research our competitors and create work items for key findings"

Plan:
- Step 1: webSearch for competitor analysis
- Step 2: extractContent from top results
- Step 3: createWorkItem for Competitor A findings
- Step 4: createWorkItem for Competitor B findings

Generate a plan for the user's request.`
}

/**
 * Create a task plan from user message
 */
export async function createTaskPlan(options: CreatePlanOptions): Promise<CreatePlanResult> {
  const {
    userMessage,
    teamId,
    workspaceId,
    conversationContext,
    maxSteps = 10,
  } = options

  try {
    // Get available tools
    const availableTools = toolRegistry.getAll()
    const toolDescriptions = availableTools.map(t =>
      `- ${t.metadata.name}: ${t.metadata.description}`
    )

    // Create OpenRouter client
    const openrouter = createOpenRouter({
      apiKey: process.env.OPENROUTER_API_KEY,
    })

    const model = getDefaultModel()

    // Generate plan using LLM
    const { object: planData } = await generateObject({
      model: openrouter(model.modelId),
      schema: PlanSchema,
      system: buildPlannerPrompt(toolDescriptions),
      prompt: conversationContext
        ? `Context:\n${conversationContext}\n\nUser request: ${userMessage}`
        : `User request: ${userMessage}`,
    })

    // Validate and enhance the plan
    const planId = `plan_${Date.now()}`
    const steps: TaskStep[] = planData.steps.slice(0, maxSteps).map((step, index) => ({
      id: `step_${index + 1}`,
      order: index + 1,
      description: step.description,
      toolName: step.toolName,
      params: {
        ...step.params,
        teamId,
        workspaceId,
      },
      dependsOn: step.dependsOn || [],
      status: 'pending' as const,
    }))

    // Validate tool names
    const validToolNames = new Set(availableTools.map(t => t.metadata.name))
    const invalidSteps = steps.filter(s => !validToolNames.has(s.toolName))
    if (invalidSteps.length > 0) {
      console.warn('[TaskPlanner] Invalid tools in plan:', invalidSteps.map(s => s.toolName))
      // Try to map common variations
      for (const step of steps) {
        if (!validToolNames.has(step.toolName)) {
          // Try to find a close match
          const match = availableTools.find(t =>
            t.metadata.name.toLowerCase().includes(step.toolName.toLowerCase()) ||
            step.toolName.toLowerCase().includes(t.metadata.name.toLowerCase())
          )
          if (match) {
            step.toolName = match.metadata.name
          }
        }
      }
    }

    const plan: TaskPlan = {
      id: planId,
      goal: planData.goal,
      steps,
      estimatedDuration: planData.estimatedDuration,
      requiresApproval: true, // Always require approval for now
      createdAt: Date.now(),
      status: 'draft',
    }

    console.log('[TaskPlanner] Created plan:', plan.id, 'with', plan.steps.length, 'steps')

    return { success: true, plan }
  } catch (error) {
    console.error('[TaskPlanner] Failed to create plan:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create plan',
    }
  }
}

// =============================================================================
// PLAN VALIDATION
// =============================================================================

/**
 * Validate a task plan before execution
 */
export function validatePlan(plan: TaskPlan): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  // Check step count
  if (plan.steps.length === 0) {
    errors.push('Plan has no steps')
  }
  if (plan.steps.length > 10) {
    errors.push('Plan exceeds maximum of 10 steps')
  }

  // Check for circular dependencies
  const stepIds = new Set(plan.steps.map(s => s.id))
  for (const step of plan.steps) {
    for (const depId of step.dependsOn) {
      if (!stepIds.has(depId)) {
        errors.push(`Step ${step.id} depends on non-existent step ${depId}`)
      }
      if (depId === step.id) {
        errors.push(`Step ${step.id} depends on itself`)
      }
    }
  }

  // Check for valid tool names
  const availableTools = toolRegistry.getAll()
  const validToolNames = new Set(availableTools.map(t => t.metadata.name))
  for (const step of plan.steps) {
    if (!validToolNames.has(step.toolName)) {
      errors.push(`Step ${step.id} uses unknown tool: ${step.toolName}`)
    }
  }

  return { valid: errors.length === 0, errors }
}

// =============================================================================
// PLAN STATE MANAGEMENT
// =============================================================================

/**
 * Update plan status
 */
export function updatePlanStatus(
  plan: TaskPlan,
  status: TaskPlan['status'],
  summary?: string
): TaskPlan {
  return {
    ...plan,
    status,
    summary: summary || plan.summary,
  }
}

/**
 * Update step status
 */
export function updateStepStatus(
  plan: TaskPlan,
  stepId: string,
  status: TaskStep['status'],
  result?: unknown,
  error?: string
): TaskPlan {
  return {
    ...plan,
    steps: plan.steps.map(step =>
      step.id === stepId
        ? { ...step, status, result, error }
        : step
    ),
  }
}

/**
 * Get plan progress percentage
 */
export function getPlanProgress(plan: TaskPlan): number {
  if (plan.steps.length === 0) return 0
  const completed = plan.steps.filter(s => s.status === 'completed').length
  return Math.round((completed / plan.steps.length) * 100)
}

/**
 * Get next pending step
 */
export function getNextPendingStep(plan: TaskPlan): TaskStep | null {
  // Find first pending step whose dependencies are all completed
  for (const step of plan.steps) {
    if (step.status !== 'pending') continue

    const depsCompleted = step.dependsOn.every(depId => {
      const dep = plan.steps.find(s => s.id === depId)
      return dep?.status === 'completed'
    })

    if (depsCompleted) return step
  }
  return null
}

// =============================================================================
// PLAN FORMATTING
// =============================================================================

/**
 * Format plan for display
 */
export function formatPlanForDisplay(plan: TaskPlan): string {
  const lines: string[] = [
    `📋 **Task Plan**: ${plan.goal}`,
    ``,
    `**Steps** (${plan.steps.length}):`,
  ]

  for (const step of plan.steps) {
    const statusIcon = {
      pending: '⏳',
      running: '🔄',
      completed: '✅',
      failed: '❌',
      skipped: '⏭️',
    }[step.status]

    lines.push(`${step.order}. ${statusIcon} ${step.description}`)
  }

  lines.push(``)
  lines.push(`⏱️ Estimated: ${plan.estimatedDuration}`)

  return lines.join('\n')
}

/**
 * Format plan result summary
 */
export function formatPlanSummary(plan: TaskPlan): string {
  const completed = plan.steps.filter(s => s.status === 'completed').length
  const failed = plan.steps.filter(s => s.status === 'failed').length
  const total = plan.steps.length

  if (plan.status === 'completed') {
    return `✅ Completed ${completed}/${total} steps successfully.`
  } else if (plan.status === 'failed') {
    return `❌ Plan failed. Completed ${completed}/${total} steps. ${failed} failed.`
  } else if (plan.status === 'cancelled') {
    return `⏹️ Plan cancelled. Completed ${completed}/${total} steps.`
  }
  return `Plan status: ${plan.status}`
}
