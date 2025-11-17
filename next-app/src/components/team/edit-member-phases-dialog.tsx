'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Loader2, AlertTriangle, Crown, Shield, User } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { PHASE_CONFIG, type WorkspacePhase } from '@/lib/constants/workspace-phases'
import type { TeamMemberWithPhases } from '@/lib/types/team'

const PHASES: WorkspacePhase[] = ['research', 'planning', 'execution', 'review', 'complete']

interface PhaseAssignmentState {
  assigned: boolean
  can_edit: boolean
  is_lead: boolean
  assignment_id?: string
}

type PhaseAssignments = Record<WorkspacePhase, PhaseAssignmentState>

interface EditMemberPhasesDialogProps {
  member: TeamMemberWithPhases
  workspaceId: string
  workspaceName: string
  teamId: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function EditMemberPhasesDialog({
  member,
  workspaceId,
  workspaceName,
  teamId,
  open,
  onOpenChange,
  onSuccess,
}: EditMemberPhasesDialogProps) {
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [phaseStates, setPhaseStates] = useState<PhaseAssignments>({} as PhaseAssignments)
  const [leadCounts, setLeadCounts] = useState<Record<WorkspacePhase, number>>({} as Record<WorkspacePhase, number>)
  const [error, setError] = useState<string | null>(null)

  const supabase = createClient()

  // Load existing phase assignments and lead counts
  useEffect(() => {
    if (open) {
      loadPhaseData()
    }
  }, [open, member.user_id, workspaceId])

  const loadPhaseData = async () => {
    setLoading(true)
    setError(null)

    try {
      // Get all phase assignments for this user in this workspace
      const { data: assignments, error: assignmentsError } = await supabase
        .from('user_phase_assignments')
        .select('*')
        .eq('user_id', member.user_id)
        .eq('workspace_id', workspaceId)

      if (assignmentsError) throw assignmentsError

      // Initialize phase states
      const states: PhaseAssignments = {} as PhaseAssignments
      PHASES.forEach(phase => {
        const assignment = assignments?.find(a => a.phase === phase)
        states[phase] = {
          assigned: !!assignment,
          can_edit: assignment?.can_edit ?? false,
          is_lead: assignment?.is_lead ?? false,
          assignment_id: assignment?.id
        }
      })
      setPhaseStates(states)

      // Get lead counts for each phase
      const { data: allAssignments, error: countError } = await supabase
        .from('user_phase_assignments')
        .select('phase, is_lead')
        .eq('workspace_id', workspaceId)
        .eq('is_lead', true)

      if (countError) throw countError

      const counts: Record<WorkspacePhase, number> = {} as Record<WorkspacePhase, number>
      PHASES.forEach(phase => {
        counts[phase] = allAssignments?.filter(a => a.phase === phase).length ?? 0
      })
      setLeadCounts(counts)

    } catch (err: any) {
      console.error('Error loading phase data:', err)
      setError(err.message || 'Failed to load phase assignments')
    } finally {
      setLoading(false)
    }
  }

  const handlePhaseChange = (phase: WorkspacePhase, value: string) => {
    setPhaseStates(prev => ({
      ...prev,
      [phase]: {
        ...prev[phase],
        assigned: value !== 'none',
        can_edit: value === 'contributor' || value === 'lead',
        is_lead: value === 'lead'
      }
    }))
  }

  const getPhaseValue = (phase: WorkspacePhase): string => {
    const state = phaseStates[phase]
    if (!state?.assigned) return 'none'
    if (state.is_lead) return 'lead'
    if (state.can_edit) return 'contributor'
    return 'none'
  }

  const handleSave = async () => {
    setSaving(true)
    setError(null)

    try {
      // Process each phase
      for (const phase of PHASES) {
        const state = phaseStates[phase]
        const currentCount = leadCounts[phase]

        // If user is being made a lead, check the limit
        if (state.assigned && state.is_lead) {
          const willExceedLimit = state.assignment_id
            ? currentCount > 2 // Existing assignment being upgraded
            : currentCount >= 2 // New lead assignment

          if (willExceedLimit) {
            throw new Error(
              `Cannot add another lead to ${PHASE_CONFIG[phase].name} phase. Maximum 2 leads per phase.`
            )
          }
        }

        if (state.assigned) {
          if (state.assignment_id) {
            // Update existing assignment
            const { error: updateError } = await supabase
              .from('user_phase_assignments')
              .update({
                can_edit: state.can_edit,
                is_lead: state.is_lead
              })
              .eq('id', state.assignment_id)

            if (updateError) throw updateError
          } else {
            // Create new assignment
            const { error: insertError } = await supabase
              .from('user_phase_assignments')
              .insert({
                id: `assignment_${Date.now()}_${Math.random().toString(36).substring(7)}`,
                team_id: teamId,
                workspace_id: workspaceId,
                user_id: member.user_id,
                phase,
                can_edit: state.can_edit,
                is_lead: state.is_lead,
                assigned_at: new Date().toISOString()
              })

            if (insertError) throw insertError
          }
        } else if (state.assignment_id) {
          // Remove assignment
          const { error: deleteError } = await supabase
            .from('user_phase_assignments')
            .delete()
            .eq('id', state.assignment_id)

          if (deleteError) throw deleteError
        }
      }

      // Success!
      onSuccess?.()
      onOpenChange(false)

    } catch (err: any) {
      console.error('Error saving phase assignments:', err)
      setError(err.message || 'Failed to save phase assignments')
    } finally {
      setSaving(false)
    }
  }

  const displayName = member.users?.name || member.users?.email?.split('@')[0] || 'Unknown User'

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Phase Access</DialogTitle>
          <DialogDescription>
            Manage which phases {displayName} can access in {workspaceName}
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Member info */}
            <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-lg">
              <div className="h-10 w-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-medium">
                {displayName[0]?.toUpperCase()}
              </div>
              <div className="flex-1">
                <p className="font-medium">{displayName}</p>
                <p className="text-sm text-muted-foreground">{member.users?.email}</p>
              </div>
              <Badge
                variant={member.role === 'owner' ? 'default' : 'secondary'}
                className={`${
                  member.role === 'owner'
                    ? 'bg-purple-100 text-purple-700'
                    : member.role === 'admin'
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-slate-100 text-slate-700'
                }`}
              >
                {member.role === 'owner' && <Crown className="mr-1 h-3 w-3" />}
                {member.role === 'admin' && <Shield className="mr-1 h-3 w-3" />}
                {member.role === 'member' && <User className="mr-1 h-3 w-3" />}
                {member.role.charAt(0).toUpperCase() + member.role.slice(1)}
              </Badge>
            </div>

            {/* Phase assignments */}
            <div className="space-y-4">
              <Label className="text-base font-semibold">Phase Access</Label>
              <p className="text-sm text-muted-foreground">
                Everyone can view all phases. Contributors can edit items, and leads can also manage team members.
              </p>

              {PHASES.map(phase => {
                const phaseConfig = PHASE_CONFIG[phase]
                const currentValue = getPhaseValue(phase)
                const currentLeadCount = leadCounts[phase]
                const wouldBe3rdLead = currentValue === 'lead' && currentLeadCount >= 2 && !phaseStates[phase]?.assignment_id

                return (
                  <div key={phase} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-center gap-2">
                      <div
                        className="h-3 w-3 rounded-full"
                        style={{ backgroundColor: phaseConfig.color }}
                      />
                      <h4 className="font-medium">{phaseConfig.name}</h4>
                      {currentLeadCount > 0 && (
                        <Badge variant="outline" className="text-xs">
                          {currentLeadCount} {currentLeadCount === 1 ? 'lead' : 'leads'}
                        </Badge>
                      )}
                    </div>

                    <RadioGroup value={currentValue} onValueChange={value => handlePhaseChange(phase, value)}>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="none" id={`${phase}-none`} />
                        <Label htmlFor={`${phase}-none`} className="font-normal cursor-pointer">
                          No Access (View Only)
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="contributor" id={`${phase}-contributor`} />
                        <Label htmlFor={`${phase}-contributor`} className="font-normal cursor-pointer">
                          Contributor (Can Edit)
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="lead" id={`${phase}-lead`} />
                        <Label htmlFor={`${phase}-lead`} className="font-normal cursor-pointer">
                          Lead (Can Edit & Manage Team)
                        </Label>
                      </div>
                    </RadioGroup>

                    {currentLeadCount >= 2 && (
                      <Alert variant="default" className="bg-amber-50 border-amber-200">
                        <AlertTriangle className="h-4 w-4 text-amber-600" />
                        <AlertDescription className="text-amber-800 text-sm">
                          This phase already has 2 leads. Consider keeping 1 lead for clarity.
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
                )
              })}
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </div>
        )}

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={saving}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={loading || saving}
          >
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
