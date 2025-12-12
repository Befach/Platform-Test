/**
 * Plan Approval API Endpoint
 *
 * Handles approval and execution of multi-step task plans.
 * Supports both "approve all" and "step-by-step" execution modes.
 *
 * POST /api/ai/agent/plan/approve
 *
 * Request body:
 * {
 *   planId: string
 *   mode: 'all' | 'step'
 *   threadId: string
 * }
 *
 * Response: SSE stream with execution progress events
 */

import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { executeTaskPlan, createCancelSignal, type CancelSignal } from '@/lib/ai/agent-loop'
import type { TaskPlan } from '@/lib/ai/task-planner'

// Store cancel signals by plan ID (for cancellation endpoint)
const activePlanSignals = new Map<string, CancelSignal>()

export async function POST(req: NextRequest) {
  const encoder = new TextEncoder()

  try {
    const body = await req.json()
    const { planId, mode, threadId } = body as {
      planId: string
      mode: 'all' | 'step'
      threadId: string
    }

    if (!planId || !mode || !threadId) {
      return Response.json(
        { error: 'Missing required fields: planId, mode, threadId' },
        { status: 400 }
      )
    }

    // Get user session
    const supabase = await createClient()
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get the plan from thread metadata
    const { data: thread, error: threadError } = await supabase
      .from('chat_threads')
      .select('metadata')
      .eq('id', threadId)
      .single()

    if (threadError || !thread) {
      return Response.json({ error: 'Thread not found' }, { status: 404 })
    }

    const metadata = thread.metadata as Record<string, unknown> | null
    const pendingPlans = (metadata?.pendingPlans || {}) as Record<string, TaskPlan>
    const plan = pendingPlans[planId]

    if (!plan) {
      return Response.json({ error: 'Plan not found' }, { status: 404 })
    }

    // Create cancel signal for this plan
    const cancelSignal = createCancelSignal()
    activePlanSignals.set(planId, cancelSignal)

    // Create SSE stream
    const stream = new ReadableStream({
      async start(controller) {
        const sendEvent = (type: string, data: Record<string, unknown> = {}) => {
          const event = JSON.stringify({ type, ...data })
          controller.enqueue(encoder.encode(`data: ${event}\n\n`))
        }

        try {
          // Update plan status to approved
          plan.status = 'approved'
          sendEvent('plan-approved', { planId })

          if (mode === 'all') {
            // Execute all steps
            plan.status = 'executing'
            sendEvent('execution-started', { planId, totalSteps: plan.steps.length })

            const result = await executeTaskPlan(plan, {
              onProgress: (step, updatedPlan, message) => {
                // Send progress events
                const stepIndex = updatedPlan.steps.findIndex(s => s.id === step.id)
                sendEvent('step-progress', {
                  stepId: step.id,
                  stepIndex,
                  status: step.status,
                  message,
                })
              },
              cancelSignal,
            })

            // Update plan status based on result
            plan.status = result.success ? 'completed' : (cancelSignal.cancelled ? 'cancelled' : 'failed')
            plan.summary = result.success
              ? `Successfully completed ${result.completedSteps} steps`
              : `Failed after ${result.completedSteps} steps`

            // Send completion event
            sendEvent('execution-complete', {
              planId,
              success: result.success,
              completedSteps: result.completedSteps,
              totalSteps: result.totalSteps,
              errors: result.errors,
              executionTime: result.executionTime,
            })

          } else {
            // Step-by-step mode - just mark as approved, let client handle step execution
            sendEvent('step-mode-enabled', { planId, nextStep: 0 })
          }

          // Save updated plan back to thread metadata
          const updatedPlans = { ...pendingPlans, [planId]: plan }
          await supabase
            .from('chat_threads')
            .update({
              metadata: { ...metadata, pendingPlans: updatedPlans },
            })
            .eq('id', threadId)

        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error'
          sendEvent('error', { error: errorMessage })
        } finally {
          // Cleanup
          activePlanSignals.delete(planId)
          controller.close()
        }
      },
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
        'X-Plan-Id': planId,
      },
    })
  } catch (error) {
    console.error('[Plan Approve API] Error:', error)
    return Response.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

// Export for cancel endpoint
export { activePlanSignals }
