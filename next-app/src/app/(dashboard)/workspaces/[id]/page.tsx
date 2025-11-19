import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { cookies } from 'next/headers'
import { AcmeSidebar } from '@/components/layout/acme-sidebar'
import { AcmeTopBar } from '@/components/layout/acme-top-bar'
import { WorkspaceContent } from './_components/workspace-content'
import { calculatePhaseDistribution } from '@/lib/constants/workspace-phases'
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar'

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

    // User profile
    supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single(),
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

  // Prepare user data for sidebar
  const currentUser = {
    id: user.id,
    email: user.email!,
    name: userProfile?.name || null,
    avatar_url: userProfile?.avatar_url || null,
  }

  // Get section name based on current view
  const getSectionName = () => {
    switch (view) {
      case 'dashboard': return 'Dashboard'
      case 'mind-map': return 'Mind Map'
      case 'features': return 'Features'
      case 'timeline': return 'Timeline'
      case 'dependencies': return 'Dependencies'
      case 'analytics': return 'Analytics'
      case 'team': return 'Team'
      default: return 'Dashboard'
    }
  }

  // Get sidebar state from cookies for SSR persistence
  const cookieStore = await cookies()
  const defaultOpen = cookieStore.get('sidebar_state')?.value !== 'false'

  return (
    <SidebarProvider defaultOpen={defaultOpen}>
      <AcmeSidebar
        workspaceId={workspace.id}
        workspaceName={workspace.name}
        workspaces={workspaces || []}
        userEmail={user.email!}
        userName={userProfile?.full_name || undefined}
      />

      <SidebarInset>
        {/* Acme-Style Top Bar with Sidebar Trigger */}
        <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <div className="flex flex-1 items-center justify-between">
            <h1 className="text-lg font-semibold">{getSectionName()}</h1>
            <div className="flex items-center gap-2">
              {/* User info or other header elements can go here */}
            </div>
          </div>
        </header>

        {/* Main Content with View Router */}
        <main className="flex-1 overflow-auto bg-slate-50">
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
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
