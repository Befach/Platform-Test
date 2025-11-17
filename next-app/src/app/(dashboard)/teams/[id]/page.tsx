import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import Link from 'next/link'
import { InviteMemberDialog } from '@/components/teams/invite-member-dialog'
import { TeamMembersList } from '@/components/teams/team-members-list'
import { PendingInvitationsList } from '@/components/teams/pending-invitations-list'

export default async function TeamSettingsPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  // Check authentication
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Get team details
  const { data: team, error: teamError } = await supabase
    .from('teams')
    .select('*')
    .eq('id', id)
    .single()

  if (teamError || !team) {
    notFound()
  }

  // Check if user is a member of this team
  const { data: membership } = await supabase
    .from('team_members')
    .select('role')
    .eq('team_id', id)
    .eq('user_id', user.id)
    .single()

  if (!membership) {
    redirect('/dashboard')
  }

  // Get all team members with user details
  const { data: members } = await supabase
    .from('team_members')
    .select(
      `
      id,
      role,
      joined_at,
      user_id,
      users:user_id (
        id,
        email,
        name,
        avatar_url
      )
    `
    )
    .eq('team_id', id)
    .order('joined_at', { ascending: true })

  // Get pending invitations
  const { data: invitations } = await supabase
    .from('invitations')
    .select('*')
    .eq('team_id', id)
    .is('accepted_at', null)
    .gt('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false })

  // Get workspace count
  const { count: workspaceCount } = await supabase
    .from('workspaces')
    .select('id', { count: 'exact', head: true })
    .eq('team_id', id)

  const isAdmin = membership.role === 'owner' || membership.role === 'admin'

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <header className="border-b bg-white">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Link href="/dashboard">
              <Button variant="ghost" size="sm">
                ← Back
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold">{team.name}</h1>
              <p className="text-sm text-muted-foreground">Team Settings</p>
            </div>
          </div>
          <Badge variant="outline" className="capitalize">
            {team.plan}
          </Badge>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid gap-6 md:grid-cols-3 mb-8">
          <Card>
            <CardHeader>
              <CardTitle>Team Members</CardTitle>
              <CardDescription>Active members</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{members?.length || 0}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Workspaces</CardTitle>
              <CardDescription>Active projects</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{workspaceCount || 0}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Plan</CardTitle>
              <CardDescription>Current subscription</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-lg font-semibold capitalize">{team.plan}</div>
              {team.plan === 'free' && (
                <p className="text-xs text-muted-foreground mt-1">
                  Upgrade for unlimited features
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        <Card className="mb-8">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Team Members</CardTitle>
              <CardDescription>
                Manage your team members and their roles
              </CardDescription>
            </div>
            {isAdmin && <InviteMemberDialog teamId={id} />}
          </CardHeader>
          <CardContent>
            <TeamMembersList
              members={(members as any) || []}
              currentUserId={user.id}
              currentUserRole={membership.role}
              teamId={id}
            />
          </CardContent>
        </Card>

        {isAdmin && invitations && Array.isArray(invitations) && invitations.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Pending Invitations</CardTitle>
              <CardDescription>
                Invitations waiting to be accepted
              </CardDescription>
            </CardHeader>
            <CardContent>
              <PendingInvitationsList invitations={invitations} teamId={id} />
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  )
}
