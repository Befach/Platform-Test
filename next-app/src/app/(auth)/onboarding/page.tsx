'use client'

import { useState, FormEvent } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { useRouter } from 'next/navigation'

export default function OnboardingPage() {
  const [teamName, setTeamName] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{
    type: 'success' | 'error'
    text: string
  } | null>(null)

  const router = useRouter()
  const supabase = createClient()

  const handleCreateTeam = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)

    try {
      // Get current user
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser()

      if (userError || !user) {
        throw new Error('Not authenticated')
      }

      // Create user profile if it doesn't exist
      const { error: userProfileError } = await supabase.from('users').upsert(
        {
          id: user.id,
          email: user.email!,
          name: user.user_metadata?.full_name || user.email?.split('@')[0],
        },
        { onConflict: 'id' }
      )

      if (userProfileError) throw userProfileError

      // Create team
      const teamId = `team_${Date.now()}`
      const { error: teamError } = await supabase.from('teams').insert({
        id: teamId,
        name: teamName,
        owner_id: user.id,
        plan: 'free',
      })

      if (teamError) throw teamError

      // Add user as team owner
      const memberId = `member_${Date.now()}`
      const { error: memberError } = await supabase.from('team_members').insert({
        id: memberId,
        team_id: teamId,
        user_id: user.id,
        role: 'owner',
      })

      if (memberError) throw memberError

      // Create default workspace
      const workspaceId = `workspace_${Date.now()}`
      const { error: workspaceError } = await supabase.from('workspaces').insert({
        id: workspaceId,
        team_id: teamId,
        name: 'My First Project',
        description: 'Get started by creating features and planning your roadmap',
        phase: 'research',
        enabled_modules: ['research', 'mind_map', 'features', 'timeline'],
      })

      if (workspaceError) throw workspaceError

      setMessage({
        type: 'success',
        text: 'Team created successfully! Redirecting...',
      })

      // Redirect to dashboard
      setTimeout(() => {
        router.push('/dashboard')
      }, 1500)
    } catch (error: any) {
      console.error('Onboarding error:', error)
      setMessage({
        type: 'error',
        text: error.message || 'Failed to create team',
      })
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">Welcome!</CardTitle>
          <CardDescription>
            Let's get you set up. Create your first team to start managing product roadmaps.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {message && (
            <div
              className={`rounded-md p-3 text-sm ${
                message.type === 'success'
                  ? 'bg-green-50 text-green-800 border border-green-200'
                  : 'bg-red-50 text-red-800 border border-red-200'
              }`}
            >
              {message.text}
            </div>
          )}

          <form onSubmit={handleCreateTeam} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="teamName">Team Name</Label>
              <Input
                id="teamName"
                type="text"
                placeholder="Acme Inc, Product Team, etc."
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                required
                disabled={loading}
                minLength={2}
                maxLength={50}
              />
              <p className="text-xs text-muted-foreground">
                This is your organization or team name. You can change it later.
              </p>
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Creating team...' : 'Create Team & Continue'}
            </Button>
          </form>

          <div className="rounded-md bg-blue-50 p-3 text-sm text-blue-800 border border-blue-200">
            <p className="font-medium mb-1">What's next?</p>
            <ul className="list-disc list-inside space-y-1 text-xs">
              <li>We'll create your first workspace</li>
              <li>You can invite team members later</li>
              <li>Start with the free plan (upgrade anytime)</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
