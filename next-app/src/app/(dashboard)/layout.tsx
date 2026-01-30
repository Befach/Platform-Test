import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar'
import { AppSidebar } from '@/components/layout/app-sidebar'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Fetch user profile
  const { data: userProfile } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single()

  // Fetch user's team membership to get team ID
  const { data: membership } = await supabase
    .from('team_members')
    .select('team_id')
    .eq('user_id', user.id)
    .single()

  if (!membership) {
    // Handle case where user has no team (shouldn't happen in normal flow)
    return <>{children}</>
  }

  // Fetch workspaces for the sidebar
  const { data: workspaces } = await supabase
    .from('workspaces')
    .select('id, name, team_id')
    .eq('team_id', membership.team_id)
    .order('name')

  // Determine default workspace (first one)
  const defaultWorkspace = workspaces?.[0]

  // Get sidebar state from cookies
  const cookieStore = await cookies()
  const defaultOpen = cookieStore.get('sidebar_state')?.value !== 'false'

  return (
    <SidebarProvider defaultOpen={defaultOpen}>
      <AppSidebar
        workspaceId={defaultWorkspace?.id || ''}
        workspaceName={defaultWorkspace?.name || 'Workspace'}
        workspaces={workspaces || []}
        teamId={membership.team_id}
        userEmail={user.email ?? ''}
        userName={userProfile?.name || user.user_metadata?.full_name || ''}
      />
      <SidebarInset>
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
