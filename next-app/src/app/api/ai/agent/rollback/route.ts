/**
 * POST /api/ai/agent/rollback
 *
 * Rollback (undo) a completed action.
 * Only works for reversible actions with rollback data.
 *
 * Request body:
 * {
 *   actionId: string   - ID of the action to rollback
 *   reason?: string    - Optional reason for rollback
 * }
 *
 * Response:
 * {
 *   success: boolean
 *   actionId: string
 *   message?: string
 *   error?: string
 * }
 */

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { agentExecutor } from '@/lib/ai/agent-executor'
import { RollbackRequestSchema } from '@/lib/ai/schemas/agentic-schemas'

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

    // Parse and validate request body
    const body = await request.json()
    const parsed = RollbackRequestSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: 'Invalid request',
          details: parsed.error.flatten(),
        },
        { status: 400 }
      )
    }

    const { actionId, reason } = parsed.data

    // Get the action to verify access and check if reversible
    const { data: action, error: actionError } = await supabase
      .from('ai_action_history')
      .select('team_id, workspace_id, status, is_reversible, tool_name')
      .eq('id', actionId)
      .single()

    if (actionError || !action) {
      return NextResponse.json(
        { error: 'Action not found' },
        { status: 404 }
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

    // Check if action can be rolled back
    if (action.status !== 'completed') {
      return NextResponse.json(
        {
          error: `Cannot rollback action with status: ${action.status}. Only completed actions can be rolled back.`,
        },
        { status: 400 }
      )
    }

    if (!action.is_reversible) {
      return NextResponse.json(
        {
          error: `Action "${action.tool_name}" is not reversible`,
        },
        { status: 400 }
      )
    }

    // Perform rollback
    const success = await agentExecutor.rollback(actionId, {
      teamId: action.team_id,
      workspaceId: action.workspace_id,
      userId: user.id,
      sessionId: Date.now().toString(),
    })

    if (!success) {
      return NextResponse.json(
        {
          success: false,
          actionId,
          error: 'Rollback failed. The action may have already been rolled back or the data is no longer available.',
        },
        { status: 500 }
      )
    }

    // Log the rollback reason if provided
    if (reason) {
      await supabase
        .from('ai_action_history')
        .update({
          error_message: `Rolled back by user. Reason: ${reason}`,
        })
        .eq('id', actionId)
    }

    return NextResponse.json({
      success: true,
      actionId,
      message: 'Action successfully rolled back',
    })
  } catch (error) {
    console.error('[Agent Rollback] Error:', error)

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    )
  }
}
