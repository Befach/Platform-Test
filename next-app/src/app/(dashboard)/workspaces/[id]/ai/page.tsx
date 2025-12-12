import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { AIPageClient } from './_components/ai-page-client'
import fs from 'fs/promises'

const DEBUG_ENDPOINT = 'http://127.0.0.1:7242/ingest/ebdf2fd5-9696-479e-b2f1-d72537069b93'
const DEBUG_LOG_PATH = 'c:\\Users\\harsh\\Downloads\\Platform Test\\.cursor\\debug.log'

async function sendDebug(payload: {
  sessionId?: string
  runId?: string
  hypothesisId?: string
  location: string
  message: string
  data?: Record<string, unknown>
  timestamp?: number
}) {
  const body = {
    sessionId: 'debug-session',
    runId: 'pre-fix2',
    timestamp: Date.now(),
    ...payload,
  }

  try {
    await fetch(DEBUG_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
  } catch (err) {
    try {
      await fs.appendFile(DEBUG_LOG_PATH, `${JSON.stringify(body)}\n`)
    } catch {
      // swallow secondary errors
    }
  }
}

export default async function AIPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  // #region agent log
  await sendDebug({
    hypothesisId: 'H10',
    location: 'workspaces/[id]/ai/page.tsx:entry',
    message: 'AIPage invoked',
  })
  // #endregion

  const { id } = await params
  const supabase = await createClient()

  // Check authentication
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // #region agent log
  await sendDebug({
    hypothesisId: 'H10',
    location: 'workspaces/[id]/ai/page.tsx:getUser',
    message: 'AIPage fetched auth user',
    data: { hasUser: !!user },
  })
  // #endregion

  if (!user) {
    redirect('/login')
  }

  // Get workspace with phase
  const { data: workspace, error } = await supabase
    .from('workspaces')
    .select('id, name, team_id, phase')
    .eq('id', id)
    .single()

  // #region agent log
  await sendDebug({
    hypothesisId: 'H11',
    location: 'workspaces/[id]/ai/page.tsx:getWorkspace',
    message: 'AIPage workspace fetch result',
    data: { hasWorkspace: !!workspace, teamId: workspace?.team_id, error: !!error },
  })
  // #endregion

  if (error || !workspace) {
    notFound()
  }

  // Check if user has access to this workspace's team
  const { data: teamMember } = await supabase
    .from('team_members')
    .select('role')
    .eq('team_id', workspace.team_id)
    .eq('user_id', user.id)
    .single()

  // #region agent log
  await sendDebug({
    hypothesisId: 'H12',
    location: 'workspaces/[id]/ai/page.tsx:getMembership',
    message: 'AIPage membership result',
    data: { hasMember: !!teamMember, role: teamMember?.role },
  })
  // #endregion

  if (!teamMember) {
    redirect('/dashboard')
  }

  // Get team info
  const { data: team } = await supabase
    .from('teams')
    .select('name, subscription_plan')
    .eq('id', workspace.team_id)
    .single()

  // #region agent log
  await sendDebug({
    hypothesisId: 'H11',
    location: 'workspaces/[id]/ai/page.tsx:getTeam',
    message: 'AIPage team fetch result',
    data: { teamName: team?.name, plan: team?.subscription_plan },
  })
  // #endregion

  return (
    <AIPageClient
      workspaceId={workspace.id}
      teamId={workspace.team_id}
      workspaceName={workspace.name}
      workspacePhase={workspace.phase || undefined}
      teamName={team?.name || 'Team'}
      userRole={teamMember.role}
    />
  )
}
