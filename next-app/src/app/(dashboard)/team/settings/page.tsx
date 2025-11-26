'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { Loader2 } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { TeamGeneralSettings } from '@/components/team/settings/team-general-settings'
import { TeamBillingSettings } from '@/components/team/settings/team-billing-settings'
import type { TeamRole } from '@/lib/types/team'

interface Team {
  id: string
  name: string
  plan: string
  created_at: string
}

export default function TeamSettingsPage() {
  const [currentUserRole, setCurrentUserRole] = useState<TeamRole>('member')
  const [teamId, setTeamId] = useState<string | null>(null)
  const supabase = createClient()

  // Get current user and team
  useQuery({
    queryKey: ['current-user-team'],
    queryFn: async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      // Get user's team membership
      const { data: membership, error } = await supabase
        .from('team_members')
        .select('team_id, role')
        .eq('user_id', user.id)
        .single()

      if (error || !membership) throw new Error('No team found')

      setTeamId(membership.team_id)
      setCurrentUserRole(membership.role)

      return membership
    },
  })

  // Fetch team details
  const {
    data: team,
    isLoading: loadingTeam,
    error: teamError,
  } = useQuery({
    queryKey: ['team-details', teamId],
    queryFn: async () => {
      if (!teamId) return null
      const { data, error } = await supabase
        .from('teams')
        .select('*')
        .eq('id', teamId)
        .single()

      if (error) throw error
      return data as Team
    },
    enabled: !!teamId,
  })

  if (!teamId || loadingTeam) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (teamError || !team) {
    return (
      <div className="container max-w-5xl py-8">
        <div className="text-center py-12">
          <p className="text-red-600">Failed to load team settings</p>
          <p className="text-sm text-muted-foreground mt-1">
            {teamError instanceof Error ? teamError.message : 'Unknown error'}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="container max-w-5xl py-8 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Organization Settings</h1>
          <p className="text-muted-foreground mt-2">
            Manage your organization&apos;s configuration and subscription
          </p>
        </div>
      </div>

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList>
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="billing">Billing</TabsTrigger>
          <TabsTrigger value="integrations" disabled>Integrations</TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <TeamGeneralSettings team={team} currentUserRole={currentUserRole} />
        </TabsContent>

        <TabsContent value="billing">
          <TeamBillingSettings team={team} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
