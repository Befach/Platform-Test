'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Loader2, UserPlus, Users } from 'lucide-react'
import { InviteMemberDialog } from '@/components/team/invite-member-dialog'
import { TeamMemberRow } from '@/components/team/team-member-row'
import { PendingInvitationCard } from '@/components/team/pending-invitation-card'
import { PhaseAssignmentMatrix } from '@/components/team/phase-assignment-matrix'
import type { TeamMember, TeamRole } from '@/lib/types/team'

interface PendingInvitation {
  id: string
  email: string
  role: 'admin' | 'member'
  created_at: string
  expires_at: string
  invited_by_user?: {
    name: string | null
    email: string
  } | null
}

interface Workspace {
  id: string
  name: string
}

export default function TeamMembersPage() {
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [currentUserRole, setCurrentUserRole] = useState<TeamRole>('member')
  const [teamId, setTeamId] = useState<string | null>(null)
  const [phaseMatrixOpen, setPhaseMatrixOpen] = useState(false)
  const [selectedWorkspace, setSelectedWorkspace] = useState<Workspace | null>(null)

  const supabase = createClient()

  // Get current user and team
  useQuery({
    queryKey: ['current-user-team'],
    queryFn: async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      setCurrentUserId(user.id)

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

  // Fetch team members
  const {
    data: members,
    isLoading: loadingMembers,
    error: membersError,
  } = useQuery({
    queryKey: ['team-members', teamId],
    queryFn: async () => {
      if (!teamId) return []
      const response = await fetch(`/api/team/members?team_id=${teamId}`)
      if (!response.ok) {
        throw new Error('Failed to fetch team members')
      }
      return response.json() as Promise<TeamMember[]>
    },
    enabled: !!teamId,
  })

  // Fetch pending invitations
  const {
    data: invitations,
    isLoading: loadingInvitations,
    error: invitationsError,
  } = useQuery({
    queryKey: ['pending-invitations', teamId],
    queryFn: async () => {
      if (!teamId) return []
      const response = await fetch(`/api/team/invitations?team_id=${teamId}`)
      if (!response.ok) {
        throw new Error('Failed to fetch invitations')
      }
      return response.json() as Promise<PendingInvitation[]>
    },
    enabled: !!teamId && (currentUserRole === 'owner' || currentUserRole === 'admin'),
  })

  // Fetch workspaces for phase access
  const { data: workspaces } = useQuery({
    queryKey: ['team-workspaces', teamId],
    queryFn: async () => {
      if (!teamId) return []
      const response = await fetch(`/api/team/workspaces?team_id=${teamId}`)
      if (!response.ok) {
        throw new Error('Failed to fetch workspaces')
      }
      return response.json() as Promise<Workspace[]>
    },
    enabled: !!teamId,
  })

  const canManage = currentUserRole === 'owner' || currentUserRole === 'admin'

  const handlePhaseAccessClick = (member: TeamMember) => {
    if (workspaces && workspaces.length > 0) {
      setSelectedWorkspace(workspaces[0])
      setPhaseMatrixOpen(true)
    }
  }

  if (!teamId) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="container max-w-5xl py-8 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Team Members</h1>
          <p className="text-muted-foreground mt-2">
            Manage your team members and their permissions
          </p>
        </div>
        {canManage && teamId && (
          <InviteMemberDialog
            teamId={teamId}
            trigger={
              <Button>
                <UserPlus className="mr-2 h-4 w-4" />
                Invite Member
              </Button>
            }
          />
        )}
      </div>

      {/* Team Members Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Active Members
          </CardTitle>
          <CardDescription>
            {members?.length || 0} {members?.length === 1 ? 'member' : 'members'} in your team
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loadingMembers ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : membersError ? (
            <div className="text-center py-12">
              <p className="text-red-600">Failed to load team members</p>
              <p className="text-sm text-muted-foreground mt-1">
                {membersError instanceof Error ? membersError.message : 'Unknown error'}
              </p>
            </div>
          ) : !members || members.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No team members found</p>
            </div>
          ) : (
            <div className="space-y-2">
              {members.map((member) => (
                <TeamMemberRow
                  key={member.id}
                  member={member}
                  currentUserId={currentUserId || undefined}
                  currentUserRole={currentUserRole}
                  teamId={teamId}
                  onPhaseAccessClick={canManage ? handlePhaseAccessClick : undefined}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pending Invitations Card */}
      {canManage && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5" />
              Pending Invitations
            </CardTitle>
            <CardDescription>
              {invitations?.length || 0} pending{' '}
              {invitations?.length === 1 ? 'invitation' : 'invitations'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loadingInvitations ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : invitationsError ? (
              <div className="text-center py-12">
                <p className="text-red-600">Failed to load invitations</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {invitationsError instanceof Error ? invitationsError.message : 'Unknown error'}
                </p>
              </div>
            ) : !invitations || invitations.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <UserPlus className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No pending invitations</p>
                <p className="text-sm mt-1">Invite team members to get started</p>
              </div>
            ) : (
              <div className="space-y-3">
                {invitations.map((invitation) => (
                  <PendingInvitationCard
                    key={invitation.id}
                    invitation={invitation}
                    teamId={teamId}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Phase Assignment Matrix Dialog */}
      {selectedWorkspace && (
        <PhaseAssignmentMatrix
          workspaceId={selectedWorkspace.id}
          workspaceName={selectedWorkspace.name}
          teamId={teamId}
          open={phaseMatrixOpen}
          onOpenChange={setPhaseMatrixOpen}
        />
      )}
    </div>
  )
}
