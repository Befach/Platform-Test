import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { WorkspaceContent } from './_components/workspace-content'
import { calculatePhaseDistribution } from '@/lib/constants/workspace-phases'

export default async function WorkspacePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ view?: string }>
}) {
  const { id } = await params
  const { view = 'dashboard' } = await searchParams
  const supabase = await createClient()

  // Check authentication
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Get workspace
  const { data: workspace, error } = await supabase
    .from('workspaces')
    .select('*')
    .eq('id', id)
    .single()

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

  if (!teamMember) {
    redirect('/dashboard')
  }

  // Parallel data fetching (consolidated)
  const [
    { data: team },
    { data: _workspaces },
    { data: workItems },
    { data: timelineItems },
    { data: linkedItems },
    { data: mindMaps },
    { data: _workItemTagRels },
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

  // Calculate phase distribution and stats
  const phaseDistribution = calculatePhaseDistribution(workItems || [])

  // Calculate onboarding state - Use 'phase' field (phase IS the status)
  const onboardingState = {
    hasWorkItems: (workItems?.length || 0) > 0,
    hasMindMaps: (mindMaps?.length || 0) > 0,
    hasTimeline: (timelineItems?.length || 0) > 0,
    hasDependencies: (linkedItems?.length || 0) > 0,
    teamSize: teamSize || 0,
    completionPercentage:
      workItems && workItems.length > 0
        ? Math.round(
          ((workItems.filter((item) => item.phase === 'launch' || item.phase === 'verified' || item.phase === 'validated').length || 0) /
            workItems.length) *
          100
        )
        : 0,
  }

  // Construct team object from query result
  const teamData = {
    id: workspace.team_id,
    name: team?.name || 'Unknown Team',
    created_at: new Date().toISOString(),
    owner_id: user.id,
    plan: (team?.subscription_plan as 'free' | 'pro' | null) || 'free',
  }

  // Map work items to include status field (derived from phase for component compatibility)
  const mappedWorkItems = (workItems || []).map((item) => ({
    ...item,
    // Status is derived from phase for backward compatibility with components
    status: item.phase || 'design',
    owner: item.assigned_to || null,
  }))

  // Map timeline items to include title and required fields
  const mappedTimelineItems = (timelineItems || []).map((item) => ({
    ...item,
    title: item.name || '',
    work_item_id: item.work_item_id || '',
    timeline: item.timeline || 'MVP',
  }))

  // Map linked items to include required fields
  const mappedLinkedItems = (linkedItems || []).map((item) => ({
    ...item,
    link_type: item.relationship_type || 'relates_to',
    source_id: item.source_item_id || '',
    target_id: item.target_item_id || '',
  }))

  return (
    <WorkspaceContent
      view={view}
      workspace={workspace}
      team={teamData}
      workItems={mappedWorkItems}
      timelineItems={mappedTimelineItems}
      linkedItems={mappedLinkedItems}
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
