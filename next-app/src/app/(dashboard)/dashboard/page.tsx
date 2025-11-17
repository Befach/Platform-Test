import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function DashboardPage() {
  const supabase = await createClient()

  // Check authentication
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Get user's teams
  const { data: teamMembers } = await supabase
    .from('team_members')
    .select('team_id')
    .eq('user_id', user.id)
    .limit(1)

  if (!teamMembers || teamMembers.length === 0) {
    // No teams - redirect to onboarding (we'll create this page)
    redirect('/onboarding')
  }

  // Get most recent workspace
  const { data: workspaces } = await supabase
    .from('workspaces')
    .select('id')
    .eq('team_id', teamMembers[0].team_id)
    .order('updated_at', { ascending: false })
    .limit(1)

  if (workspaces && workspaces.length > 0) {
    // Redirect to most recent workspace
    redirect(`/workspaces/${workspaces[0].id}`)
  }

  // No workspaces - redirect to onboarding
  redirect('/onboarding')
}
