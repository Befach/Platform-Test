/**
 * POST /api/ai/agent/approve
 *
 * Approve one or more pending actions.
 * Supports both single and batch approval.
 *
 * Request body (single):
 * {
 *   actionId: string     - ID of the action to approve
 * }
 *
 * Request body (batch):
 * {
 *   actionIds: string[]  - Array of action IDs to approve
 * }
 *
 * Response (single):
 * {
 *   success: boolean
 *   actionId: string
 *   status: 'completed' | 'failed'
 *   result?: unknown
 *   error?: string
 * }
 *
 * Response (batch):
 * {
 *   approved: string[]
 *   failed: Array<{ id: string, error: string }>
 *   totalApproved: number
 *   totalFailed: number
 * }
 */

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { agentExecutor } from '@/lib/ai/agent-executor'
import { z } from 'zod'

// Import tools to ensure they are registered in the tool registry
// These are side-effect imports that register tools when loaded
import '@/lib/ai/tools/creation-tools'
import '@/lib/ai/tools/analysis-tools'
import '@/lib/ai/tools/optimization-tools'
import '@/lib/ai/tools/strategy-tools'

const ApproveRequestSchema = z.union([
  z.object({
    actionId: z.string().describe('Single action to approve'),
  }),
  z.object({
    actionIds: z.array(z.string()).min(1).describe('Multiple actions to approve'),
  }),
])

export const maxDuration = 300 // Match vercel.json for AI routes

export async function POST(request: Request) {
  try {
    // Authenticate user
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Parse request body
    const body = await request.json()
    const parsed = ApproveRequestSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: 'Invalid request: provide either actionId or actionIds',
          details: parsed.error.flatten(),
        },
        { status: 400 }
      )
    }

    // Handle single approval
    if ('actionId' in parsed.data) {
      const { actionId } = parsed.data

      // Verify user has access to this action
      const { data: action, error: actionError } = await supabase
        .from('ai_action_history')
        .select('team_id, status')
        .eq('id', actionId)
        .single()

      if (actionError || !action) {
        return NextResponse.json(
          { error: 'Action not found' },
          { status: 404 }
        )
      }

      if (action.status !== 'pending') {
        return NextResponse.json(
          { error: `Action is not pending (current status: ${action.status})` },
          { status: 400 }
        )
      }

      // Verify user is team member
      const { data: member, error: memberError } = await supabase
        .from('team_members')
        .select('role')
        .eq('team_id', action.team_id)
        .eq('user_id', user.id)
        .single()

      if (memberError || !member) {
        return NextResponse.json(
          { error: 'Access denied' },
          { status: 403 }
        )
      }

      // Approve the action
      const result = await agentExecutor.approve(actionId, user.id)
      return NextResponse.json(result)
    }

    // Handle batch approval
    const { actionIds } = parsed.data

    // Verify all actions exist and user has access
    const { data: actions, error: actionsError } = await supabase
      .from('ai_action_history')
      .select('id, team_id, status')
      .in('id', actionIds)

    if (actionsError) {
      return NextResponse.json(
        { error: 'Failed to fetch actions' },
        { status: 500 }
      )
    }

    if (!actions || actions.length === 0) {
      return NextResponse.json(
        { error: 'No actions found' },
        { status: 404 }
      )
    }

    // Get unique team IDs and verify access
    const teamIds = [...new Set(actions.map(a => a.team_id))]
    const { data: memberships } = await supabase
      .from('team_members')
      .select('team_id')
      .eq('user_id', user.id)
      .in('team_id', teamIds)

    const accessibleTeams = new Set(memberships?.map(m => m.team_id) || [])

    // Filter to only pending actions the user has access to
    const approvalIds = actions
      .filter(a => a.status === 'pending' && accessibleTeams.has(a.team_id))
      .map(a => a.id)

    if (approvalIds.length === 0) {
      return NextResponse.json({
        approved: [],
        failed: actionIds.map(id => ({
          id,
          error: 'Action not found, not pending, or access denied',
        })),
        totalApproved: 0,
        totalFailed: actionIds.length,
      })
    }

    // Approve all accessible pending actions
    const result = await agentExecutor.approveAll(approvalIds, user.id)

    // Add actions that weren't in approvalIds to failed
    const skippedIds = actionIds.filter(id => !approvalIds.includes(id))
    const allFailed = [
      ...result.failed,
      ...skippedIds.map(id => ({
        id,
        error: 'Action not found, not pending, or access denied',
      })),
    ]

    return NextResponse.json({
      approved: result.approved,
      failed: allFailed,
      totalApproved: result.approved.length,
      totalFailed: allFailed.length,
    })
  } catch (error) {
    console.error('[Agent Approve] Error:', error)

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    )
  }
}
