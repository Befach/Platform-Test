/**
 * POST /api/ai/agent/preview
 *
 * Get a preview of what a tool will do without executing.
 * Used to show users what will happen before they approve.
 *
 * Request body:
 * {
 *   toolName: string      - Name of the tool to preview
 *   params: object        - Tool parameters
 *   workspaceId: string   - Workspace context
 *   teamId: string        - Team for multi-tenancy
 * }
 *
 * Response:
 * {
 *   toolName: string
 *   displayName: string
 *   category: string
 *   requiresApproval: boolean
 *   isReversible: boolean
 *   preview: {
 *     action: 'create' | 'update' | 'delete'
 *     entityType: string
 *     data: object
 *     description: string
 *     affectedItems: array
 *     warnings: string[]
 *   }
 * }
 */

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { agentExecutor } from '@/lib/ai/agent-executor'
import { PreviewToolRequestSchema } from '@/lib/ai/schemas/agentic-schemas'

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
    const parsed = PreviewToolRequestSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: 'Invalid request',
          details: parsed.error.flatten(),
        },
        { status: 400 }
      )
    }

    const { toolName, params, workspaceId, teamId } = parsed.data

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

    // Get preview from executor
    const preview = await agentExecutor.preview(toolName, params, {
      teamId,
      workspaceId,
      userId: user.id,
      sessionId: Date.now().toString(),
      actionId: Date.now().toString(),
    })

    return NextResponse.json(preview)
  } catch (error) {
    console.error('[Agent Preview] Error:', error)

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    )
  }
}
