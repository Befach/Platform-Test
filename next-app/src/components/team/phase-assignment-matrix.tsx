'use client'

import { useState, useEffect } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Loader2, Eye, Lock, Unlock, Crown, Shield, Edit2, AlertTriangle } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { PHASE_CONFIG, PHASE_ORDER, type WorkspacePhase } from '@/lib/constants/workspace-phases'
import type { TeamMember, TeamMemberWithPhases, UserPhaseAssignment } from '@/lib/types/team'
import { EditMemberPhasesDialog } from './edit-member-phases-dialog'

interface PhaseAssignmentMatrixProps {
  workspaceId: string
  workspaceName: string
  teamId: string
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Optional: Pre-select a specific member */
  selectedMemberId?: string
}

interface MemberWithAssignments extends TeamMember {
  assignments: Record<WorkspacePhase, UserPhaseAssignment | null>
}

export function PhaseAssignmentMatrix({
  workspaceId,
  workspaceName,
  teamId,
  open,
  onOpenChange,
  selectedMemberId,
}: PhaseAssignmentMatrixProps) {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [editingMember, setEditingMember] = useState<TeamMemberWithPhases | null>(null)

  // Fetch team members with phase assignments
  const { data: membersResponse, isLoading: loadingMembers } = useQuery({
    queryKey: ['team-members', teamId],
    queryFn: async () => {
      const response = await fetch(`/api/team/members?team_id=${teamId}`)
      if (!response.ok) {
        throw new Error('Failed to fetch team members')
      }
      const data = await response.json()
      return data as { data: TeamMemberWithPhases[] }
    },
    enabled: open,
  })

  const members = membersResponse?.data || []

  // Fetch phase assignments for this workspace
  const { data: assignmentsResponse, isLoading: loadingAssignments } = useQuery({
    queryKey: ['phase-assignments', workspaceId],
    queryFn: async () => {
      const response = await fetch(`/api/team/phase-assignments?workspace_id=${workspaceId}`)
      if (!response.ok) {
        throw new Error('Failed to fetch phase assignments')
      }
      const data = await response.json()
      return data as { data: UserPhaseAssignment[] }
    },
    enabled: open,
  })

  const assignments = assignmentsResponse?.data || []

  // Calculate lead counts per phase
  const leadCounts: Record<WorkspacePhase, number> = {
    research: 0,
    planning: 0,
    execution: 0,
    review: 0,
    complete: 0,
  }

  assignments.forEach((assignment) => {
    if (assignment.is_lead) {
      leadCounts[assignment.phase]++
    }
  })

  // Merge members with their assignments
  const membersWithAssignments: MemberWithAssignments[] =
    members.map((member) => {
      const memberAssignments = assignments.filter((a) => a.user_id === member.user_id) || []

      const assignmentMap: Record<WorkspacePhase, UserPhaseAssignment | null> = {
        research: null,
        planning: null,
        execution: null,
        review: null,
        complete: null,
      }

      memberAssignments.forEach((assignment) => {
        assignmentMap[assignment.phase] = assignment
      })

      return {
        ...member,
        assignments: assignmentMap,
      }
    })

  // Helper to get phase badge label
  const getPhaseBadge = (assignment: UserPhaseAssignment | null) => {
    if (!assignment) return null
    if (assignment.is_lead) return { label: 'Lead', variant: 'default' as const, className: 'bg-purple-100 text-purple-700' }
    if (assignment.can_edit) return { label: 'Contributor', variant: 'secondary' as const, className: 'bg-blue-100 text-blue-700' }
    return { label: 'View', variant: 'outline' as const, className: '' }
  }

  // Handle edit dialog success
  const handleEditSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ['team-members', teamId] })
    queryClient.invalidateQueries({ queryKey: ['phase-assignments', workspaceId] })
    setEditingMember(null)
  }

  const getInitials = (name: string | null, email: string) => {
    if (name) {
      return name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    }
    return email.slice(0, 2).toUpperCase()
  }

  const loading = loadingMembers || loadingAssignments

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Phase Permissions - {workspaceName}</DialogTitle>
          <DialogDescription>
            Manage which team members can edit items in each phase. Owners and admins have access
            to all phases automatically.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : membersWithAssignments.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <p>No team members found</p>
          </div>
        ) : (
          <>
            {/* Desktop View - Table */}
            <div className="hidden md:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[220px]">Member</TableHead>
                    {PHASE_ORDER.map((phase) => {
                      const config = PHASE_CONFIG[phase]
                      const count = leadCounts[phase]
                      return (
                        <TableHead key={phase} className="text-center">
                          <div className="flex flex-col items-center gap-1">
                            <span className="text-lg">{config.icon}</span>
                            <span className="text-xs font-medium">{config.name}</span>
                            {count > 0 && (
                              <Badge variant="outline" className="text-xs">
                                {count} {count === 1 ? 'lead' : 'leads'}
                              </Badge>
                            )}
                            {count >= 2 && (
                              <AlertTriangle className="h-3 w-3 text-amber-500" />
                            )}
                          </div>
                        </TableHead>
                      )
                    })}
                    <TableHead className="w-[80px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {membersWithAssignments.map((member) => {
                    const displayName =
                      member.users?.name || member.users?.email?.split('@')[0] || 'Unknown'
                    const initials = member.users
                      ? getInitials(member.users.name, member.users.email)
                      : 'U'
                    const hasFullAccess = member.role === 'owner' || member.role === 'admin'

                    return (
                      <TableRow key={member.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback className="bg-blue-100 text-blue-600 text-xs">
                                {initials}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex flex-col">
                              <div className="flex items-center gap-1.5">
                                <span className="font-medium text-sm">{displayName}</span>
                                {member.role === 'owner' && (
                                  <Crown className="h-3 w-3 text-purple-600" />
                                )}
                                {member.role === 'admin' && (
                                  <Shield className="h-3 w-3 text-blue-600" />
                                )}
                              </div>
                              <span className="text-xs text-muted-foreground">
                                {member.users?.email}
                              </span>
                            </div>
                          </div>
                        </TableCell>

                        {PHASE_ORDER.map((phase) => {
                          const assignment = member.assignments[phase]
                          const badge = getPhaseBadge(assignment)

                          return (
                            <TableCell key={phase} className="text-center">
                              {hasFullAccess ? (
                                <Badge variant="secondary" className="bg-slate-100 text-slate-700">
                                  <Eye className="mr-1 h-3 w-3" />
                                  Full Access
                                </Badge>
                              ) : badge ? (
                                <Badge variant={badge.variant} className={badge.className}>
                                  {badge.label}
                                </Badge>
                              ) : (
                                <span className="text-xs text-muted-foreground">-</span>
                              )}
                            </TableCell>
                          )
                        })}

                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setEditingMember(member as TeamMemberWithPhases)}
                            disabled={hasFullAccess}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>

            {/* Mobile View - Cards */}
            <div className="md:hidden space-y-4">
              {membersWithAssignments.map((member) => {
                const displayName =
                  member.users?.name || member.users?.email?.split('@')[0] || 'Unknown'
                const initials = member.users
                  ? getInitials(member.users.name, member.users.email)
                  : 'U'
                const hasFullAccess = member.role === 'owner' || member.role === 'admin'

                return (
                  <div key={member.id} className="border rounded-lg p-4 space-y-3">
                    {/* Member Info */}
                    <div className="flex items-center gap-2">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-blue-100 text-blue-600 text-xs">
                          {initials}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center gap-1.5">
                          <span className="font-medium text-sm">{displayName}</span>
                          {member.role === 'owner' && <Crown className="h-3 w-3 text-purple-600" />}
                          {member.role === 'admin' && <Shield className="h-3 w-3 text-blue-600" />}
                        </div>
                        <span className="text-xs text-muted-foreground">{member.users?.email}</span>
                      </div>
                    </div>

                    {/* Phase Assignments */}
                    {hasFullAccess ? (
                      <>
                        <Badge variant="secondary" className="w-full justify-center">
                          <Eye className="mr-1 h-3 w-3" />
                          Full Access ({member.role})
                        </Badge>
                        <p className="text-xs text-muted-foreground text-center">
                          Owners and admins have access to all phases
                        </p>
                      </>
                    ) : (
                      <>
                        <div className="grid grid-cols-2 gap-2">
                          {PHASE_ORDER.map((phase) => {
                            const config = PHASE_CONFIG[phase]
                            const assignment = member.assignments[phase]
                            const badge = getPhaseBadge(assignment)

                            return (
                              <div key={phase} className="flex flex-col items-center gap-1 p-2 border rounded">
                                <span className="text-lg">{config.icon}</span>
                                <span className="text-xs font-medium">{config.name}</span>
                                {badge ? (
                                  <Badge variant={badge.variant} className={`text-xs ${badge.className}`}>
                                    {badge.label}
                                  </Badge>
                                ) : (
                                  <span className="text-xs text-muted-foreground">No Access</span>
                                )}
                              </div>
                            )
                          })}
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setEditingMember(member as TeamMemberWithPhases)}
                          className="w-full mt-2"
                        >
                          <Edit2 className="mr-2 h-4 w-4" />
                          Edit Phase Access
                        </Button>
                      </>
                    )}
                  </div>
                )
              })}
            </div>

            {/* Legend */}
            <div className="mt-4 pt-4 border-t">
              <p className="text-sm text-muted-foreground font-medium mb-2">Legend:</p>
              <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <Badge variant="default" className="bg-purple-100 text-purple-700 text-xs">Lead</Badge>
                  <span>Can edit & manage team in this phase</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Badge variant="secondary" className="bg-blue-100 text-blue-700 text-xs">Contributor</Badge>
                  <span>Can edit items in this phase</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Badge variant="secondary" className="bg-slate-100 text-slate-700 text-xs">
                    <Eye className="mr-1 h-3 w-3" />
                    Full Access
                  </Badge>
                  <span>Owner/Admin (all phases)</span>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Everyone can view all phases. Click <Edit2 className="h-3 w-3 inline" /> to edit a member's phase access.
              </p>
            </div>
          </>
        )}
      </DialogContent>

      {/* Edit Member Phases Dialog */}
      {editingMember && (
        <EditMemberPhasesDialog
          member={editingMember}
          workspaceId={workspaceId}
          workspaceName={workspaceName}
          teamId={teamId}
          open={!!editingMember}
          onOpenChange={(open) => !open && setEditingMember(null)}
          onSuccess={handleEditSuccess}
        />
      )}
    </Dialog>
  )
}
