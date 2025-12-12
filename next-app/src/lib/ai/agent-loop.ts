/**
 * Agent Loop for Autonomous Task Execution
 *
 * Executes task plans step by step with:
 * - Progress reporting
 * - Error handling and recovery
 * - Cancellation support
 * - Result aggregation
 *
 * Safety features:
 * - Maximum execution time (5 minutes)
 * - Maximum steps (10)
 * - Cancel at any time
 * - Full execution log
 */

import {
  TaskPlan,
  TaskStep,
  updatePlanStatus,
  updateStepStatus,
  getNextPendingStep,
  formatPlanSummary,
} from './task-planner'
import { toolRegistry } from './tools/tool-registry'

// =============================================================================
// TYPES
// =============================================================================

/**
 * Result of executing a task plan
 */
export interface ExecutionResult {
  /** Did the plan complete successfully? */
  success: boolean
  /** Number of completed steps */
  completedSteps: number
  /** Total steps in the plan */
  totalSteps: number
  /** Results from each step (keyed by step ID) */
  results: Record<string, unknown>
  /** Error messages */
  errors: string[]
  /** Execution time in milliseconds */
  executionTime: number
  /** Final plan state */
  plan: TaskPlan
}

/**
 * Progress callback for UI updates
 */
export type ProgressCallback = (
  step: TaskStep,
  plan: TaskPlan,
  message: string
) => void

/**
 * Cancel signal for stopping execution
 */
export interface CancelSignal {
  cancelled: boolean
}

/**
 * Execution options
 */
export interface ExecutionOptions {
  /** Callback for progress updates */
  onProgress?: ProgressCallback
  /** Cancel signal */
  cancelSignal?: CancelSignal
  /** Maximum execution time in ms (default: 5 minutes) */
  maxExecutionTime?: number
  /** Delay between steps in ms (default: 500) */
  stepDelay?: number
}

// =============================================================================
// CONSTANTS
// =============================================================================

const DEFAULT_MAX_EXECUTION_TIME = 5 * 60 * 1000 // 5 minutes
const DEFAULT_STEP_DELAY = 500 // 500ms between steps
const MAX_RETRIES = 1 // Retry failed steps once

// =============================================================================
// TOOL EXECUTION
// =============================================================================

/**
 * Execute a single tool with parameters
 */
async function executeTool(
  toolName: string,
  params: Record<string, unknown>
): Promise<{ success: boolean; result?: unknown; error?: string }> {
  try {
    console.log(`[AgentLoop] Executing tool: ${toolName}`, params)

    // Get tool from registry
    const tool = toolRegistry.get(toolName)
    if (!tool) {
      return { success: false, error: `Tool not found: ${toolName}` }
    }

    // Execute the tool
    // Note: Tools return confirmation requests, which we auto-approve in agent loop
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const toolWithExecute = tool as any
    if (typeof toolWithExecute.execute !== 'function') {
      return { success: false, error: `Tool ${toolName} does not have an execute function` }
    }

    const result = await toolWithExecute.execute(params, {
      toolCallId: `agent_${Date.now()}`,
      abortSignal: new AbortController().signal,
    })

    // Check if result is a confirmation request
    if (result && typeof result === 'object' && 'needsConfirmation' in result) {
      // In agent loop, we've already approved the plan, so auto-confirm
      console.log(`[AgentLoop] Tool ${toolName} returned confirmation, auto-approving`)

      // If the tool has an execute function for confirmed actions
      if ('executeConfirmed' in result && typeof result.executeConfirmed === 'function') {
        const confirmedResult = await result.executeConfirmed()
        return { success: true, result: confirmedResult }
      }

      // Otherwise return the confirmation data as result
      return { success: true, result: result.data || result }
    }

    return { success: true, result }
  } catch (error) {
    console.error(`[AgentLoop] Tool ${toolName} failed:`, error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

// =============================================================================
// MAIN EXECUTION LOOP
// =============================================================================

/**
 * Execute a task plan
 *
 * @param plan The task plan to execute
 * @param options Execution options
 * @returns Execution result with all step results
 */
export async function executeTaskPlan(
  plan: TaskPlan,
  options: ExecutionOptions = {}
): Promise<ExecutionResult> {
  const {
    onProgress,
    cancelSignal,
    maxExecutionTime = DEFAULT_MAX_EXECUTION_TIME,
    stepDelay = DEFAULT_STEP_DELAY,
  } = options

  const startTime = Date.now()
  let currentPlan = updatePlanStatus(plan, 'executing')
  const results: Record<string, unknown> = {}
  const errors: string[] = []

  console.log(`[AgentLoop] Starting execution of plan: ${plan.id}`)
  console.log(`[AgentLoop] Steps: ${plan.steps.length}, Max time: ${maxExecutionTime}ms`)

  // Main execution loop
  while (true) {
    // Check cancellation
    if (cancelSignal?.cancelled) {
      console.log('[AgentLoop] Execution cancelled by user')
      currentPlan = updatePlanStatus(currentPlan, 'cancelled')
      break
    }

    // Check timeout
    if (Date.now() - startTime > maxExecutionTime) {
      console.log('[AgentLoop] Execution timed out')
      errors.push('Execution timed out after ' + Math.round(maxExecutionTime / 1000) + ' seconds')
      currentPlan = updatePlanStatus(currentPlan, 'failed')
      break
    }

    // Get next step
    const nextStep = getNextPendingStep(currentPlan)
    if (!nextStep) {
      // No more pending steps - check if all completed
      const allCompleted = currentPlan.steps.every(
        s => s.status === 'completed' || s.status === 'skipped'
      )
      if (allCompleted) {
        console.log('[AgentLoop] All steps completed successfully')
        currentPlan = updatePlanStatus(currentPlan, 'completed')
      } else {
        // Some steps failed
        console.log('[AgentLoop] Execution finished with failures')
        currentPlan = updatePlanStatus(currentPlan, 'failed')
      }
      break
    }

    // Update step to running
    currentPlan = updateStepStatus(currentPlan, nextStep.id, 'running')
    onProgress?.(nextStep, currentPlan, `Executing: ${nextStep.description}`)

    // Execute the step
    console.log(`[AgentLoop] Executing step ${nextStep.order}: ${nextStep.description}`)
    let execResult = await executeTool(nextStep.toolName, nextStep.params)

    // Retry on failure
    if (!execResult.success && MAX_RETRIES > 0) {
      console.log(`[AgentLoop] Step ${nextStep.id} failed, retrying...`)
      await new Promise(resolve => setTimeout(resolve, stepDelay))
      execResult = await executeTool(nextStep.toolName, nextStep.params)
    }

    // Update step result
    if (execResult.success) {
      results[nextStep.id] = execResult.result
      currentPlan = updateStepStatus(
        currentPlan,
        nextStep.id,
        'completed',
        execResult.result
      )
      onProgress?.(
        { ...nextStep, status: 'completed' },
        currentPlan,
        `Completed: ${nextStep.description}`
      )
      console.log(`[AgentLoop] Step ${nextStep.order} completed`)
    } else {
      errors.push(`Step ${nextStep.order} (${nextStep.toolName}): ${execResult.error}`)
      currentPlan = updateStepStatus(
        currentPlan,
        nextStep.id,
        'failed',
        undefined,
        execResult.error
      )
      onProgress?.(
        { ...nextStep, status: 'failed', error: execResult.error },
        currentPlan,
        `Failed: ${nextStep.description}`
      )
      console.log(`[AgentLoop] Step ${nextStep.order} failed:`, execResult.error)

      // Stop on first failure (can be changed to continue-on-failure mode)
      currentPlan = updatePlanStatus(currentPlan, 'failed')
      break
    }

    // Delay between steps (for rate limiting and UI updates)
    await new Promise(resolve => setTimeout(resolve, stepDelay))
  }

  // Calculate final stats
  const completedSteps = currentPlan.steps.filter(s => s.status === 'completed').length
  const executionTime = Date.now() - startTime

  // Generate summary
  const summary = formatPlanSummary(currentPlan)
  currentPlan = { ...currentPlan, summary }

  console.log(`[AgentLoop] Execution finished: ${completedSteps}/${currentPlan.steps.length} steps in ${executionTime}ms`)

  return {
    success: currentPlan.status === 'completed',
    completedSteps,
    totalSteps: currentPlan.steps.length,
    results,
    errors,
    executionTime,
    plan: currentPlan,
  }
}

// =============================================================================
// EXECUTION UTILITIES
// =============================================================================

/**
 * Create a cancel signal
 */
export function createCancelSignal(): CancelSignal {
  return { cancelled: false }
}

/**
 * Cancel an execution
 */
export function cancelExecution(signal: CancelSignal): void {
  signal.cancelled = true
}

/**
 * Execute a single step from a plan
 * Useful for step-by-step approval mode
 */
export async function executeStep(
  plan: TaskPlan,
  stepId: string
): Promise<{ success: boolean; plan: TaskPlan; error?: string }> {
  const step = plan.steps.find(s => s.id === stepId)
  if (!step) {
    return { success: false, plan, error: 'Step not found' }
  }

  if (step.status !== 'pending') {
    return { success: false, plan, error: `Step already ${step.status}` }
  }

  // Check dependencies
  const depsCompleted = step.dependsOn.every(depId => {
    const dep = plan.steps.find(s => s.id === depId)
    return dep?.status === 'completed'
  })

  if (!depsCompleted) {
    return { success: false, plan, error: 'Dependencies not completed' }
  }

  // Update to running
  let updatedPlan = updateStepStatus(plan, stepId, 'running')

  // Execute
  const result = await executeTool(step.toolName, step.params)

  // Update result
  if (result.success) {
    updatedPlan = updateStepStatus(updatedPlan, stepId, 'completed', result.result)
  } else {
    updatedPlan = updateStepStatus(updatedPlan, stepId, 'failed', undefined, result.error)
  }

  return {
    success: result.success,
    plan: updatedPlan,
    error: result.error,
  }
}

// =============================================================================
// RESULT FORMATTING
// =============================================================================

/**
 * Format execution results for display
 */
export function formatExecutionResults(result: ExecutionResult): string {
  const lines: string[] = []

  if (result.success) {
    lines.push(`✅ **Plan Completed Successfully**`)
  } else {
    lines.push(`❌ **Plan Execution Failed**`)
  }

  lines.push(``)
  lines.push(`**Progress**: ${result.completedSteps}/${result.totalSteps} steps`)
  lines.push(`**Time**: ${(result.executionTime / 1000).toFixed(1)}s`)

  if (result.errors.length > 0) {
    lines.push(``)
    lines.push(`**Errors**:`)
    for (const error of result.errors) {
      lines.push(`- ${error}`)
    }
  }

  // Summarize created items
  const createdItems = Object.values(result.results).filter(
    r => r && typeof r === 'object' && 'id' in (r as object)
  )
  if (createdItems.length > 0) {
    lines.push(``)
    lines.push(`**Created**: ${createdItems.length} item(s)`)
  }

  return lines.join('\n')
}

/**
 * Get items created during execution (for undo functionality)
 */
export function getCreatedItems(result: ExecutionResult): Array<{ type: string; id: string }> {
  const items: Array<{ type: string; id: string }> = []

  for (const [stepId, stepResult] of Object.entries(result.results)) {
    if (stepResult && typeof stepResult === 'object') {
      const r = stepResult as Record<string, unknown>
      if ('id' in r && typeof r.id === 'string') {
        // Determine type from step
        const step = result.plan.steps.find(s => s.id === stepId)
        let type = 'unknown'
        if (step?.toolName.includes('WorkItem')) type = 'work_item'
        else if (step?.toolName.includes('Task')) type = 'task'
        else if (step?.toolName.includes('Insight')) type = 'insight'
        else if (step?.toolName.includes('Dependency')) type = 'dependency'

        items.push({ type, id: r.id })
      }
    }
  }

  return items
}
