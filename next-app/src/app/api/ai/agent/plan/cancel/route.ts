/**
 * Plan Cancel API Endpoint
 *
 * Cancels an executing multi-step task plan.
 * Sets the cancel signal to stop execution after the current step.
 *
 * POST /api/ai/agent/plan/cancel
 *
 * Request body:
 * {
 *   planId: string
 *   threadId: string
 * }
 *
 * Response:
 * {
 *   success: boolean
 *   message: string
 * }
 */

import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { activePlanSignals } from '../approve/route'
import type { TaskPlan } from '@/lib/ai/task-planner'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { planId, threadId } = body as {
      planId: string
      threadId: string
    }

    if (!planId || !threadId) {
      return Response.json(
        { error: 'Missing required fields: planId, threadId' },
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

    // Get the cancel signal for this plan
    const cancelSignal = activePlanSignals.get(planId)

    if (cancelSignal) {
      // Set the cancelled flag to stop execution
      cancelSignal.cancelled = true
      activePlanSignals.delete(planId)

      // Update plan status in thread metadata
      const { data: thread } = await supabase
        .from('chat_threads')
        .select('metadata')
        .eq('id', threadId)
        .single()

      if (thread) {
        const metadata = thread.metadata as Record<string, unknown> | null
        const pendingPlans = (metadata?.pendingPlans || {}) as Record<string, TaskPlan>
        const plan = pendingPlans[planId]

        if (plan) {
          plan.status = 'cancelled'
          const updatedPlans = { ...pendingPlans, [planId]: plan }

          await supabase
            .from('chat_threads')
            .update({
              metadata: { ...metadata, pendingPlans: updatedPlans },
            })
            .eq('id', threadId)
        }
      }

      return Response.json({
        success: true,
        message: 'Plan execution cancelled. Current step will complete before stopping.',
      })
    }

    // Plan not currently executing
    return Response.json({
      success: false,
      message: 'Plan is not currently executing or has already completed.',
    })
  } catch (error) {
    console.error('[Plan Cancel API] Error:', error)
    return Response.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
