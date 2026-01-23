import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar'
import { AppSidebar } from '@/components/layout/app-sidebar'
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
  } catch (_err) {
    try {
      await fs.appendFile(DEBUG_LOG_PATH, `${JSON.stringify(body)}\n`)
    } catch {
      // swallow secondary errors
    }
  }
}

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // #region agent log
  await sendDebug({
    hypothesisId: 'H8',
    location: 'layout.tsx:entry',
    message: 'DashboardLayout invoked',
  })
  // #endregion

  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // #region agent log
  await sendDebug({
    hypothesisId: 'H8',
    location: 'layout.tsx:getUser',
    message: 'Layout fetched auth user',
    data: { hasUser: !!user },
  })
  // #endregion

  // TODO: Temporarily disabled for BlockSuite testing - REMOVE BEFORE COMMIT
  // if (!user) {
  //   redirect('/login')
  // }

  // Fetch user profile
  const { data: userProfile } = user ? await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single() : { data: null }

  // Fetch user's team membership to get team ID
  const { data: membership } = user ? await supabase
    .from('team_members')
    .select('team_id')
    .eq('user_id', user.id)
    .single() : { data: null }

  // #region agent log
  await sendDebug({
    hypothesisId: 'H8',
    location: 'layout.tsx:getMembership',
    message: 'Layout membership result',
    data: { hasMembership: !!membership, teamId: membership?.team_id },
  })
  // #endregion

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

  // #region agent log
  await sendDebug({
    hypothesisId: 'H8',
    location: 'layout.tsx:getWorkspaces',
    message: 'Layout workspace list',
    data: { count: workspaces?.length ?? null, firstId: workspaces?.[0]?.id },
  })
  // #endregion

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
        userEmail={user.email}
        userName={userProfile?.name || user.user_metadata?.full_name}
      />
      <SidebarInset>
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
