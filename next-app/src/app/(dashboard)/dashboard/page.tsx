import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { CreateWorkspaceDialog } from '@/components/workspaces/create-workspace-dialog'
import { WorkspaceCard } from '@/components/workspaces/workspace-card'

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
    .select(
      `
      team_id,
      role,
      teams (
        id,
        name,
        plan,
        created_at
      )
    `
    )
    .eq('user_id', user.id)

  // Get workspaces for user's teams
  const teamIds = teamMembers?.map((tm: any) => tm.team_id) || []
  const { data: workspaces } = await supabase
    .from('workspaces')
    .select('*')
    .in('team_id', teamIds)
    .order('created_at', { ascending: false })

  const handleSignOut = async () => {
    'use server'
    const supabase = await createClient()
    await supabase.auth.signOut()
    redirect('/login')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <header className="border-b bg-white">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold">Product Lifecycle Platform</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">
              {user.email}
            </span>
            <form action={handleSignOut}>
              <Button variant="outline" type="submit">
                Sign Out
              </Button>
            </form>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">Welcome back!</h2>
          <p className="text-muted-foreground">
            Here's an overview of your teams and workspaces
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
          <Card>
            <CardHeader>
              <CardTitle>Teams</CardTitle>
              <CardDescription>Organizations you're part of</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold">{teamMembers?.length || 0}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Workspaces</CardTitle>
              <CardDescription>Active projects</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold">{workspaces?.length || 0}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Plan</CardTitle>
              <CardDescription>Current subscription</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold capitalize">
                {((teamMembers?.[0]?.teams as any)?.plan) || 'Free'}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="mb-6 flex justify-between items-center">
          <div>
            <h3 className="text-2xl font-bold">Your Workspaces</h3>
            <p className="text-muted-foreground">
              Manage your product roadmap projects
            </p>
          </div>
          {teamMembers && teamMembers.length > 0 && (
            <CreateWorkspaceDialog teamId={teamMembers[0].team_id} />
          )}
        </div>

        {workspaces && workspaces.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
            {workspaces.map((workspace: any) => (
              <WorkspaceCard key={workspace.id} workspace={workspace} />
            ))}
          </div>
        ) : (
          <Card className="mb-8">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <div className="text-6xl mb-4">🚀</div>
              <h3 className="text-xl font-semibold mb-2">No workspaces yet</h3>
              <p className="text-muted-foreground mb-6 text-center max-w-md">
                Create your first workspace to start managing your product roadmap
                with phase-based workflows and AI-powered features.
              </p>
              {teamMembers && teamMembers.length > 0 && (
                <CreateWorkspaceDialog teamId={teamMembers[0].team_id} />
              )}
            </CardContent>
          </Card>
        )}

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Your Teams</CardTitle>
            <CardDescription>Organizations you belong to</CardDescription>
          </CardHeader>
          <CardContent>
            {teamMembers && teamMembers.length > 0 ? (
              <div className="space-y-4">
                {teamMembers.map((member: any) => (
                  <div
                    key={member.team_id}
                    className="border rounded-lg p-4 flex justify-between items-center"
                  >
                    <div>
                      <h3 className="font-semibold">{member.teams.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        Role: <span className="capitalize">{member.role}</span>
                      </p>
                    </div>
                    <Link href={`/teams/${member.team_id}`}>
                      <Button variant="outline">Manage</Button>
                    </Link>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <p>No teams yet</p>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
