/**
 * POST /api/ai/agent/execute
 *
 * Execute an AI tool with approval workflow.
 *
 * For tools requiring approval:
 * - Creates a pending record
 * - Returns actionId with status: 'pending'
 * - User must call /approve endpoint to complete
 *
 * For tools not requiring approval:
 * - Executes immediately
 * - Returns result with status: 'completed'
 *
 * Request body:
 * {
 *   toolName: string      - Name of the tool to execute
 *   params: object        - Tool parameters
 *   workspaceId: string   - Workspace context
 *   teamId: string        - Team for multi-tenancy
 *   sessionId?: string    - Optional session grouping
 * }
 *
 * Response:
 * {
 *   success: boolean
 *   actionId: string
 *   status: 'pending' | 'completed' | 'failed'
 *   result?: unknown      - For completed actions
 *   error?: string        - For failed actions
 * }
 */

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { agentExecutor } from '@/lib/ai/agent-executor'
import { ExecuteToolRequestSchema } from '@/lib/ai/schemas/agentic-schemas'

// Import tools to ensure they are registered in the tool registry
// These are side-effect imports that register tools when loaded
import '@/lib/ai/tools/creation-tools'
import '@/lib/ai/tools/analysis-tools'
import '@/lib/ai/tools/optimization-tools'
import '@/lib/ai/tools/strategy-tools'

export const maxDuration = 60 // Allow up to 60 seconds for tool execution

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
    const parsed = ExecuteToolRequestSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: 'Invalid request',
          details: parsed.error.flatten(),
        },
        { status: 400 }
      )
    }

    const { toolName, params, workspaceId, teamId, sessionId } = parsed.data

    // Verify user has access to the team
    const { data: member, error: memberError } = await supabase
      .from('team_members')
      .select('role')
      .eq('team_id', teamId)
      .eq('user_id', user.id)
      .single()

    if (memberError || !member) {
      return NextResponse.json(
        { error: 'Access denied: Not a member of this team' },
        { status: 403 }
      )
    }

    // Verify workspace belongs to team
    const { data: workspace, error: workspaceError } = await supabase
      .from('workspaces')
      .select('id')
      .eq('id', workspaceId)
      .eq('team_id', teamId)
      .single()

    if (workspaceError || !workspace) {
      return NextResponse.json(
        { error: 'Workspace not found or access denied' },
        { status: 404 }
      )
    }

    // Execute the tool
    const result = await agentExecutor.execute(toolName, params, {
      teamId,
      workspaceId,
      userId: user.id,
      sessionId: sessionId || Date.now().toString(),
      actionId: Date.now().toString(),
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error('[Agent Execute] Error:', error)

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Internal server error',
        success: false,
      },
      { status: 500 }
    )
  }
}
