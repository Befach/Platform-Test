import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { WorkspaceSidebar } from '@/components/workspaces/workspace-sidebar'
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
    { data: workspaces },
    { data: workItems },
    { data: timelineItems },
    { data: linkedItems },
    { data: mindMaps },
    { data: workItemTagRels },
    { data: tags },
    { count: teamSize },
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
      .select('id, name, team_id, teams(subscription_plan)')
      .eq('team_id', workspace.team_id)
      .order('name'),

    // Work items
    supabase
      .from('work_items')
      .select('*')
      .eq('workspace_id', id)
      .eq('team_id', workspace.team_id)
      .order('updated_at', { ascending: false }),

    // Timeline items
    supabase
      .from('timeline_items')
      .select('*')
      .eq('workspace_id', id)
      .order('order_index', { ascending: true }),

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

    // Team size
    supabase
      .from('team_members')
      .select('*', { count: 'exact', head: true })
      .eq('team_id', workspace.team_id),
  ])

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
    <div className="flex h-screen overflow-hidden bg-slate-50">
      {/* Sidebar */}
      <WorkspaceSidebar
        workspaceId={workspace.id}
        workspaceName={workspace.name}
        teamPlan={(team?.subscription_plan || 'free') as 'free' | 'pro' | 'enterprise'}
        enabledModules={workspace.enabled_modules || []}
        currentView={view}
        workspaces={workspaces || []}
      />

      {/* Main Content with View Router */}
      <WorkspaceContent
        view={view}
        workspace={workspace}
        team={team}
        workItems={workItems || []}
        timelineItems={timelineItems || []}
        linkedItems={linkedItems || []}
        mindMaps={mindMaps || []}
        tags={tags || []}
        teamSize={teamSize || 0}
        phaseDistribution={phaseDistribution}
        onboardingState={onboardingState}
        currentUserId={user.id}
      />
    </div>
  )
}
