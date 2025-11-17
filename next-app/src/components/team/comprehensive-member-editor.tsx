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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Loader2, AlertTriangle, Crown, Shield, User, Check } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Checkbox } from '@/components/ui/checkbox'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { PHASE_CONFIG, PHASE_ORDER, type WorkspacePhase } from '@/lib/constants/workspace-phases'
import { useRouter } from 'next/navigation'

interface TeamMemberData {
  id: string
  user_id: string
  team_id: string
  role: 'owner' | 'admin' | 'member'
  users: {
    id: string
    email: string
    name: string | null
  } | null
}

interface ComprehensiveMemberEditorProps {
  member: TeamMemberData
  workspaceId: string
  workspaceName: string
  currentUserRole: 'owner' | 'admin' | 'member'
  open: boolean
  onOpenChange: (open: boolean) => void
}

interface PhaseAssignmentState {
  assigned: boolean
  access: 'none' | 'contributor' | 'lead'
  assignment_id?: string
}

export function ComprehensiveMemberEditor({
  member,
  workspaceId,
  workspaceName,
  currentUserRole,
  open,
  onOpenChange,
}: ComprehensiveMemberEditorProps) {
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedRole, setSelectedRole] = useState<'admin' | 'member'>(
    member.role === 'owner' ? 'admin' : (member.role as 'admin' | 'member')
  )
  const [phaseStates, setPhaseStates] = useState<Record<WorkspacePhase, PhaseAssignmentState>>({} as Record<WorkspacePhase, PhaseAssignmentState>)
  const [leadCounts, setLeadCounts] = useState<Record<WorkspacePhase, number>>({} as Record<WorkspacePhase, number>)

  const router = useRouter()
  const supabase = createClient()

  const isOwner = member.role === 'owner'
  const canChangeRole = currentUserRole === 'owner' && !isOwner
  const canEditPhases = currentUserRole === 'owner' || currentUserRole === 'admin'

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
      const states: Record<WorkspacePhase, PhaseAssignmentState> = {} as Record<WorkspacePhase, PhaseAssignmentState>
      PHASE_ORDER.forEach(phase => {
        const assignment = assignments?.find(a => a.phase === phase)
        states[phase] = {
          assigned: !!assignment,
          access: assignment?.is_lead ? 'lead' : assignment?.can_edit ? 'contributor' : 'none',
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
      PHASE_ORDER.forEach(phase => {
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
        access: value as 'none' | 'contributor' | 'lead'
      }
    }))
  }

  const handleSave = async () => {
    setSaving(true)
    setError(null)

    try {
      // Update role if changed and allowed
      if (canChangeRole && selectedRole !== member.role) {
        const { error: roleError } = await supabase
          .from('team_members')
          .update({ role: selectedRole })
          .eq('id', member.id)

        if (roleError) throw roleError
      }

      // Process each phase
      for (const phase of PHASE_ORDER) {
        const state = phaseStates[phase]
        const currentCount = leadCounts[phase]

        // If user is being made a lead, check the limit
        if (state.assigned && state.access === 'lead') {
          const willExceedLimit = state.assignment_id
            ? currentCount > 2 // Existing assignment being upgraded
            : currentCount >= 2 // New lead assignment

          if (willExceedLimit) {
            throw new Error(
              `Cannot add another lead to ${PHASE_CONFIG[phase].name} phase. Maximum 2 leads per phase.`
            )
          }
        }

        if (state.assigned && state.access !== 'none') {
          if (state.assignment_id) {
            // Update existing assignment
            const { error: updateError } = await supabase
              .from('user_phase_assignments')
              .update({
                can_edit: state.access === 'contributor' || state.access === 'lead',
                is_lead: state.access === 'lead'
              })
              .eq('id', state.assignment_id)

            if (updateError) throw updateError
          } else {
            // Create new assignment
            const { error: insertError } = await supabase
              .from('user_phase_assignments')
              .insert({
                id: `assignment_${Date.now()}_${Math.random().toString(36).substring(7)}`,
                team_id: member.team_id,
                workspace_id: workspaceId,
                user_id: member.user_id,
                phase,
                can_edit: state.access === 'contributor' || state.access === 'lead',
                is_lead: state.access === 'lead',
                assigned_at: new Date().toISOString(),
                assigned_by: (await supabase.auth.getUser()).data.user?.id || ''
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
      router.refresh()
      onOpenChange(false)

    } catch (err: any) {
      console.error('Error saving member permissions:', err)
      setError(err.message || 'Failed to save member permissions')
    } finally {
      setSaving(false)
    }
  }

  const displayName = member.users?.name || member.users?.email?.split('@')[0] || 'Unknown User'

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Member Permissions</DialogTitle>
          <DialogDescription>
            Manage role and phase access for {displayName} in {workspaceName}
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

            {/* Role Selection */}
            {canChangeRole && (
              <div className="space-y-3">
                <Label className="text-base font-semibold">Team Role</Label>
                <Select value={selectedRole} onValueChange={(value: 'admin' | 'member') => setSelectedRole(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="member">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        Member - Standard access
                      </div>
                    </SelectItem>
                    <SelectItem value="admin">
                      <div className="flex items-center gap-2">
                        <Shield className="h-4 w-4" />
                        Admin - Full workspace access
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Admins have full access to all phases and can manage team members.
                </p>
              </div>
            )}

            {/* Phase Assignments */}
            {canEditPhases && selectedRole === 'member' && (
              <div className="space-y-4">
                <div>
                  <Label className="text-base font-semibold">Phase Access</Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    Everyone can view all phases. Assign specific permissions for editing and leading.
                  </p>
                </div>

                {PHASE_ORDER.map(phase => {
                  const phaseConfig = PHASE_CONFIG[phase]
                  const currentValue = phaseStates[phase]?.access || 'none'
                  const currentLeadCount = leadCounts[phase]

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
                          <Label htmlFor={`${phase}-none`} className="font-normal cursor-pointer flex items-center gap-2">
                            No Access (View Only)
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="contributor" id={`${phase}-contributor`} />
                          <Label htmlFor={`${phase}-contributor`} className="font-normal cursor-pointer flex items-center gap-2">
                            <Check className="h-4 w-4 text-blue-600" />
                            Contributor (Can Edit)
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="lead" id={`${phase}-lead`} />
                          <Label htmlFor={`${phase}-lead`} className="font-normal cursor-pointer flex items-center gap-2">
                            <Crown className="h-4 w-4 text-purple-600" />
                            Phase Lead (Can Edit & Manage Team)
                          </Label>
                        </div>
                      </RadioGroup>

                      {currentLeadCount >= 2 && currentValue === 'lead' && (
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
            )}

            {selectedRole === 'admin' && (
              <Alert className="bg-blue-50 border-blue-200">
                <Shield className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-blue-800 text-sm">
                  Admins automatically have full access to all phases. Phase-specific permissions only apply to members.
                </AlertDescription>
              </Alert>
            )}

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
