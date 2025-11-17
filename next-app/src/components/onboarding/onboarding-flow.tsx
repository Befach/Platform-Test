'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Loader2, Rocket, Users, Layers, Check } from 'lucide-react'

interface OnboardingFlowProps {
  user: any
}

export function OnboardingFlow({ user }: OnboardingFlowProps) {
  const [step, setStep] = useState<'welcome' | 'team' | 'workspace'>('welcome')
  const [loading, setLoading] = useState(false)
  const [teamName, setTeamName] = useState('')
  const [workspaceName, setWorkspaceName] = useState('')
  const [workspaceDescription, setWorkspaceDescription] = useState('')
  const router = useRouter()
  const supabase = createClient()

  const handleCreateTeamAndWorkspace = async () => {
    setLoading(true)
    try {
      // Create team
      const teamId = `team_${Date.now()}`
      const { error: teamError } = await supabase.from('teams').insert({
        id: teamId,
        name: teamName,
        owner_id: user.id,
        plan: 'pro', // Default to pro for new users
        created_at: new Date().toISOString(),
      })

      if (teamError) throw teamError

      // Add user as team owner
      const { error: memberError } = await supabase.from('team_members').insert({
        id: `member_${Date.now()}`,
        team_id: teamId,
        user_id: user.id,
        role: 'owner',
        joined_at: new Date().toISOString(),
      })

      if (memberError) throw memberError

      // Create workspace
      const workspaceId = `workspace_${Date.now()}`
      const { error: workspaceError } = await supabase.from('workspaces').insert({
        id: workspaceId,
        team_id: teamId,
        name: workspaceName,
        description: workspaceDescription || null,
        phase: 'research',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })

      if (workspaceError) throw workspaceError

      // Redirect to the new workspace
      router.push(`/workspaces/${workspaceId}`)
      router.refresh()
    } catch (error: any) {
      console.error('Error creating team and workspace:', error)
      alert(error.message || 'Failed to create team and workspace')
    } finally {
      setLoading(false)
    }
  }

  if (step === 'welcome') {
    return (
      <Card className="max-w-2xl w-full shadow-2xl border-0">
        <CardHeader className="text-center pb-8 pt-12">
          <div className="flex justify-center mb-6">
            <div className="h-20 w-20 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <Rocket className="h-10 w-10 text-white" />
            </div>
          </div>
          <CardTitle className="text-4xl font-bold mb-4">
            Welcome to Product Lifecycle Platform
          </CardTitle>
          <CardDescription className="text-lg">
            Manage your entire product journey from ideation to launch with AI-powered
            tools, phase-based workflows, and real-time collaboration.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 pb-8">
          <div className="grid gap-4">
            <div className="flex items-start gap-4 p-4 rounded-lg bg-blue-50 border border-blue-100">
              <div className="h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center shrink-0">
                <Layers className="h-5 w-5 text-white" />
              </div>
              <div>
                <h4 className="font-semibold mb-1">Phase-Based Workflows</h4>
                <p className="text-sm text-muted-foreground">
                  Organize your product through Research, Planning, Execution, Review, and
                  Completion phases with granular team permissions.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-4 rounded-lg bg-purple-50 border border-purple-100">
              <div className="h-10 w-10 rounded-full bg-purple-500 flex items-center justify-center shrink-0">
                <Users className="h-5 w-5 text-white" />
              </div>
              <div>
                <h4 className="font-semibold mb-1">Team Collaboration</h4>
                <p className="text-sm text-muted-foreground">
                  Invite team members, assign roles, and set phase-specific permissions to
                  control who can view and edit at each stage.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-4 rounded-lg bg-green-50 border border-green-100">
              <div className="h-10 w-10 rounded-full bg-green-500 flex items-center justify-center shrink-0">
                <Check className="h-5 w-5 text-white" />
              </div>
              <div>
                <h4 className="font-semibold mb-1">AI-Powered Features</h4>
                <p className="text-sm text-muted-foreground">
                  Mind mapping, web search, analytics, and intelligent insights to help you
                  make better product decisions.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-center pb-12">
          <Button
            size="lg"
            className="px-8"
            onClick={() => setStep('team')}
          >
            Get Started
          </Button>
        </CardFooter>
      </Card>
    )
  }

  if (step === 'team') {
    return (
      <Card className="max-w-md w-full shadow-2xl border-0">
        <CardHeader>
          <CardTitle>Create Your Team</CardTitle>
          <CardDescription>
            Teams are organizations that contain multiple workspaces. You can invite
            teammates later.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="teamName">Team Name *</Label>
            <Input
              id="teamName"
              placeholder="e.g., Acme Inc, My Startup"
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              disabled={loading}
            />
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button
            variant="outline"
            onClick={() => setStep('welcome')}
            disabled={loading}
          >
            Back
          </Button>
          <Button
            onClick={() => setStep('workspace')}
            disabled={!teamName.trim() || loading}
          >
            Continue
          </Button>
        </CardFooter>
      </Card>
    )
  }

  return (
    <Card className="max-w-md w-full shadow-2xl border-0">
      <CardHeader>
        <CardTitle>Create Your First Workspace</CardTitle>
        <CardDescription>
          Workspaces are individual products or projects. Each workspace has its own
          features, timeline, and team assignments.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="workspaceName">Workspace Name *</Label>
          <Input
            id="workspaceName"
            placeholder="e.g., Mobile App v2.0, SaaS Platform"
            value={workspaceName}
            onChange={(e) => setWorkspaceName(e.target.value)}
            disabled={loading}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="workspaceDescription">Description (Optional)</Label>
          <Textarea
            id="workspaceDescription"
            placeholder="Describe what you're building..."
            value={workspaceDescription}
            onChange={(e) => setWorkspaceDescription(e.target.value)}
            disabled={loading}
            rows={3}
          />
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button
          variant="outline"
          onClick={() => setStep('team')}
          disabled={loading}
        >
          Back
        </Button>
        <Button
          onClick={handleCreateTeamAndWorkspace}
          disabled={!workspaceName.trim() || loading}
        >
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Create & Launch
        </Button>
      </CardFooter>
    </Card>
  )
}
