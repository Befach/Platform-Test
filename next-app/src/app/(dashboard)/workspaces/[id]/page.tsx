import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { WorkspaceContent } from './_components/workspace-content'
import { calculatePhaseDistribution } from '@/lib/constants/workspace-phases'
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
    // Fallback to file append if the ingest endpoint is unreachable
    try {
      await fs.appendFile(DEBUG_LOG_PATH, `${JSON.stringify(body)}\n`)
    } catch {
      // swallow secondary errors to avoid affecting user flow
    }
  }
}

export default async function WorkspacePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ view?: string }>
}) {
  // #region agent log
  await sendDebug({
    hypothesisId: 'H6',
    location: 'workspaces/[id]/page.tsx:entry',
    message: 'WorkspacePage invoked',
  })
  // #endregion

  const { id } = await params
  const { view = 'dashboard' } = await searchParams
  const supabase = await createClient()

  // Check authentication
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // #region agent log
  await fetch('http://127.0.0.1:7242/ingest/ebdf2fd5-9696-479e-b2f1-d72537069b93', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      sessionId: 'debug-session',
      runId: 'pre-fix',
      hypothesisId: 'H2',
      location: 'workspaces/[id]/page.tsx:getUser',
      message: 'Fetched auth user',
      data: { hasUser: !!user },
      timestamp: Date.now(),
    }),
  }).catch(() => {})
  // #endregion

  // #region agent log
  await sendDebug({
    hypothesisId: 'H2',
    location: 'workspaces/[id]/page.tsx:getUser',
    message: 'Fetched auth user (fallback logger)',
    data: { hasUser: !!user },
  })
  // #endregion

  if (!user) {
    redirect('/login')
  }

  // Get workspace
  const { data: workspace, error } = await supabase
    .from('workspaces')
    .select('*')
    .eq('id', id)
    .single()

  // #region agent log
  await fetch('http://127.0.0.1:7242/ingest/ebdf2fd5-9696-479e-b2f1-d72537069b93', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      sessionId: 'debug-session',
      runId: 'pre-fix',
      hypothesisId: 'H1',
      location: 'workspaces/[id]/page.tsx:getWorkspace',
      message: 'Workspace fetch result',
      data: { hasWorkspace: !!workspace, teamId: workspace?.team_id, error: !!error },
      timestamp: Date.now(),
    }),
  }).catch(() => {})
  // #endregion

  // #region agent log
  await sendDebug({
    hypothesisId: 'H1',
    location: 'workspaces/[id]/page.tsx:getWorkspace',
    message: 'Workspace fetch result (fallback logger)',
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
  await fetch('http://127.0.0.1:7242/ingest/ebdf2fd5-9696-479e-b2f1-d72537069b93', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      sessionId: 'debug-session',
      runId: 'pre-fix',
      hypothesisId: 'H3',
      location: 'workspaces/[id]/page.tsx:getMembership',
      message: 'Team membership fetch result',
      data: { hasMember: !!teamMember, role: teamMember?.role },
      timestamp: Date.now(),
    }),
  }).catch(() => {})
  // #endregion

  // #region agent log
  await sendDebug({
    hypothesisId: 'H3',
    location: 'workspaces/[id]/page.tsx:getMembership',
    message: 'Team membership fetch result (fallback logger)',
    data: { hasMember: !!teamMember, role: teamMember?.role },
  })
  // #endregion

  if (!teamMember) {
    redirect('/dashboard')
  }

  // Parallel data fetching (consolidated)
  const [
    { data: team },
    { data: workspaces },
    { data: workItems },
    { data: timelineItems },
    { data: linkedItems },
    { data: mindMaps },
    { data: workItemTagRels },
    { data: tags },
    { data: departments },
    { count: teamSize },
    { data: userProfile },
  ] = await Promise.all([
    // Team info
    supabase
      .from('teams')
      .select('name, subscription_plan')
      .eq('id', workspace.team_id)
      .single(),

    // All workspaces for this team (for workspace switcher)
    supabase
      .from('workspaces')
      .select('id, name, team_id, teams!inner(subscription_plan)')
      .eq('team_id', workspace.team_id)
      .order('name'),

    // Work items (with department join for timeline swimlanes)
    supabase
      .from('work_items')
      .select('*, department:departments(id, name, color, icon)')
      .eq('workspace_id', id)
      .eq('team_id', workspace.team_id)
      .order('updated_at', { ascending: false }),

    // Timeline items - fetch via work_items relationship using the foreign key
    // The FK constraint is named 'timeline_items_feature_id_fkey' (legacy name)
    // but the column is 'work_item_id' referencing 'work_items.id'
    supabase
      .from('timeline_items')
      .select('*, work_items!inner(workspace_id)')
      .eq('work_items.workspace_id', id)
      .order('created_at', { ascending: true }),

    // Linked items (dependencies)
    supabase
      .from('linked_items')
      .select('*'),

    // Mind maps
    supabase
      .from('mind_maps')
      .select('*')
      .eq('workspace_id', id),

    // Work item tags relationships
    supabase
      .from('work_item_tags')
      .select('work_item_id, tag_id'),

    // Tags
    supabase
      .from('tags')
      .select('*')
      .eq('team_id', workspace.team_id),

    // Departments (for timeline swimlanes)
    supabase
      .from('departments')
      .select('*')
      .eq('team_id', workspace.team_id)
      .order('sort_order'),

    // Team size
    supabase
      .from('team_members')
      .select('*', { count: 'exact', head: true })
      .eq('team_id', workspace.team_id),

    // User profile
    supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single(),
  ])

  // #region agent log
  await fetch('http://127.0.0.1:7242/ingest/ebdf2fd5-9696-479e-b2f1-d72537069b93', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      sessionId: 'debug-session',
      runId: 'pre-fix',
      hypothesisId: 'H4',
      location: 'workspaces/[id]/page.tsx:dataFetch',
      message: 'Parallel data fetch summary',
      data: {
        workItems: workItems?.length ?? null,
        timelineItems: timelineItems?.length ?? null,
        linkedItems: linkedItems?.length ?? null,
        mindMaps: mindMaps?.length ?? null,
        tags: tags?.length ?? null,
        departments: departments?.length ?? null,
        teamSize: teamSize ?? null,
      },
      timestamp: Date.now(),
    }),
  }).catch(() => {})
  // #endregion

  // #region agent log
  await sendDebug({
    hypothesisId: 'H4',
    location: 'workspaces/[id]/page.tsx:dataFetch',
    message: 'Parallel data fetch summary (fallback logger)',
    data: {
      workItems: workItems?.length ?? null,
      timelineItems: timelineItems?.length ?? null,
      linkedItems: linkedItems?.length ?? null,
      mindMaps: mindMaps?.length ?? null,
      tags: tags?.length ?? null,
      departments: departments?.length ?? null,
      teamSize: teamSize ?? null,
    },
  })
  // #endregion

  // Calculate phase distribution and stats
  const phaseDistribution = calculatePhaseDistribution(workItems || [])

  // Calculate onboarding state
  const onboardingState = {
    hasWorkItems: (workItems?.length || 0) > 0,
    hasMindMaps: (mindMaps?.length || 0) > 0,
    hasTimeline: (timelineItems?.length || 0) > 0,
    hasDependencies: (linkedItems?.length || 0) > 0,
    teamSize: teamSize || 0,
    completionPercentage:
      workItems && workItems.length > 0
        ? Math.round(
          ((workItems.filter((item) => item.status === 'completed').length || 0) /
            workItems.length) *
          100
        )
        : 0,
  }

  return (
    <WorkspaceContent
      view={view}
      workspace={workspace}
      team={team}
      workItems={workItems || []}
      timelineItems={timelineItems || []}
      linkedItems={linkedItems || []}
      mindMaps={mindMaps || []}
      tags={tags || []}
      departments={departments || []}
      teamSize={teamSize || 0}
      phaseDistribution={phaseDistribution}
      onboardingState={onboardingState}
      currentUserId={user.id}
      userEmail={user.email}
      userName={userProfile?.name || user.user_metadata?.full_name}
    />
  )
}
