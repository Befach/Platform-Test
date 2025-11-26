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
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useRouter } from 'next/navigation'
import { Plus, ChevronLeft, ChevronRight, Check, AlertCircle } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  getPhaseItemTypes,
  getItemLabel,
  getItemIcon,
  getItemDescription,
  getPhaseHelperText,
  type WorkspacePhase,
  type WorkItemType,
  WORK_ITEM_TYPES,
} from '@/lib/constants/work-item-types'
import { TagSelector } from './tag-selector'
import { PhaseSelect, type PhasePermission } from './phase-select'
import { usePhasePermissions } from '@/hooks/use-phase-permissions'
import { WORKSPACE_PHASES } from '@/lib/constants/workspace-phases'
import {
  getDefaultPhase,
  saveRecentPhase,
  getRecentPhases,
  validatePhaseSelection,
  type PhaseContext,
} from '@/lib/utils/phase-context'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { cn } from '@/lib/utils'
import { PhaseContextBadge } from '@/components/work-items/phase-context-badge'

interface CreateFeatureDialogProps {
  workspaceId: string
  teamId: string
  currentUserId: string
  workspacePhase: WorkspacePhase
  defaultType?: string | 'all'
}

interface FormData {
  // Step 1: Parent Feature Details
  name: string
  type: string
  phase: WorkspacePhase | undefined
  priority: string
  purpose: string
  tags: string[]

  // Step 2: Timeline Breakdown
  mvp: {
    description: string
    difficulty: string
    integration: string
  }
  short: {
    description: string
    difficulty: string
    integration: string
  }
  long: {
    description: string
    difficulty: string
    integration: string
  }
}

export function CreateFeatureDialog({
  workspaceId,
  teamId,
  currentUserId,
  workspacePhase,
  defaultType,
}: CreateFeatureDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [showAllTypes, setShowAllTypes] = useState(false)
  const [selectOpen, setSelectOpen] = useState(false)
  const [step, setStep] = useState(1)
  const [phaseWorkload, setPhaseWorkload] = useState<Record<WorkspacePhase, number>>({} as any)

  // Fetch phase permissions
  const {
    permissions,
    canEdit,
    isLoading: permissionsLoading,
  } = usePhasePermissions({ workspaceId, teamId })

  // Get user's assigned phases (where they can edit)
  const userAssignedPhases = WORKSPACE_PHASES
    .filter((p) => canEdit(p.id))
    .map((p) => p.id)

  // Calculate smart default phase
  const getSmartDefaultPhase = (): WorkspacePhase | undefined => {
    const recentPhases = getRecentPhases(currentUserId, workspaceId)

    const context: PhaseContext = {
      workspaceId,
      currentActivePhase: workspacePhase,
      userAssignedPhases,
      userRecentPhases: recentPhases,
    }

    return getDefaultPhase(context) || undefined
  }

  // Get all 4 work item types (all types available in all phases)
  const allTypes = Object.values(WORK_ITEM_TYPES)
  const initialItemType = defaultType && defaultType !== 'all' ? defaultType : allTypes[0]

  // Consolidated form state
  const [formData, setFormData] = useState<FormData>({
    name: '',
    type: initialItemType,
    phase: undefined, // Will be set after permissions load
    priority: 'medium',
    purpose: '',
    tags: [],
    mvp: {
      description: '',
      difficulty: 'medium',
      integration: ''
    },
    short: {
      description: '',
      difficulty: 'medium',
      integration: ''
    },
    long: {
      description: '',
      difficulty: 'medium',
      integration: ''
    }
  })

  // All 4 types available in all phases (4-type system)
  const availableTypes = allTypes

  const router = useRouter()
  const supabase = createClient()

  // Set default phase after permissions load
  useEffect(() => {
    if (!permissionsLoading && !formData.phase && userAssignedPhases.length > 0) {
      const defaultPhase = getSmartDefaultPhase()
      if (defaultPhase) {
        setFormData((prev) => ({ ...prev, phase: defaultPhase }))
      }
    }
  }, [permissionsLoading, userAssignedPhases.length])

  // Fetch phase workload for display
  useEffect(() => {
    const fetchWorkload = async () => {
      const { data } = await supabase
        .from('phase_workload_cache')
        .select('phase, total_count')
        .eq('workspace_id', workspaceId)

      if (data) {
        const workloadMap: Record<WorkspacePhase, number> = {} as any
        data.forEach((item) => {
          workloadMap[item.phase as WorkspacePhase] = item.total_count
        })
        setPhaseWorkload(workloadMap)
      }
    }

    if (open) {
      fetchWorkload()
    }
  }, [open, workspaceId])

  // Phase change handler (4-type system: all types available in all phases)
  const handlePhaseChange = (newPhase: WorkspacePhase) => {
    setFormData((prev) => ({ ...prev, phase: newPhase }))
  }

  // Type change handler (4-type system: all types available in all phases)
  const handleTypeChange = (newType: string) => {
    setFormData((prev) => ({ ...prev, type: newType }))
  }

  // Validation functions
  const validateStep1 = (): boolean => {
    if (!formData.name.trim()) {
      alert(`${getItemLabel(formData.type)} name is required`)
      return false
    }

    // Validate phase selection
    const phaseValidation = validatePhaseSelection(formData.phase ?? null, userAssignedPhases)
    if (!phaseValidation.valid) {
      alert(phaseValidation.error ||'Phase is required')
      return false
    }

    return true
  }

  const validateStep2 = (): boolean => {
    if (!formData.mvp.description.trim()) {
      alert('MVP description is required')
      return false
    }
    return true
  }

  // Navigation functions
  const handleNext = () => {
    if (validateStep1()) {
      setStep(2)
    }
  }

  const handleBack = () => {
    setStep(1)
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()

    // If on step 1, move to step 2
    if (step === 1) {
      handleNext()
      return
    }

    // If on step 2, validate and create
    if (!validateStep2()) return

    setLoading(true)

    try {

      const workItemId = `work_item_${Date.now()}`

      // Validate phase one more time before creation
      if (!formData.phase) {
        throw new Error('Phase is required')
      }

      // Create work item
      const { error: workItemError } = await supabase.from('work_items').insert({
        id: workItemId,
        workspace_id: workspaceId,
        team_id: teamId,
        name: formData.name.trim(),
        type: formData.type,
        phase: formData.phase, // Explicit phase assignment
        purpose: formData.purpose.trim() || null,
        priority: formData.priority,
        status: 'not_started',
        created_by: currentUserId,
      })

      if (workItemError) throw workItemError

      // Save this phase to user's recent phases
      saveRecentPhase(currentUserId, workspaceId, formData.phase)

      // Create timeline items
      const timelineItems = []

      // MVP (required)
      timelineItems.push({
        id: `timeline_${Date.now()}_mvp`,
        work_item_id: workItemId,
        workspace_id: workspaceId,
        team_id: teamId,
        timeline: 'MVP',
        difficulty: formData.mvp.difficulty,
        description: formData.mvp.description.trim(),
        integration_type: formData.mvp.integration.trim() || null,
      })

      // SHORT (optional)
      if (formData.short.description.trim()) {
        timelineItems.push({
          id: `timeline_${Date.now()}_short`,
          work_item_id: workItemId,
          workspace_id: workspaceId,
          team_id: teamId,
          timeline: 'SHORT',
          difficulty: formData.short.difficulty,
          description: formData.short.description.trim(),
          integration_type: formData.short.integration.trim() || null,
        })
      }

      // LONG (optional)
      if (formData.long.description.trim()) {
        timelineItems.push({
          id: `timeline_${Date.now()}_long`,
          work_item_id: workItemId,
          workspace_id: workspaceId,
          team_id: teamId,
          timeline: 'LONG',
          difficulty: formData.long.difficulty,
          description: formData.long.description.trim(),
          integration_type: formData.long.integration.trim() || null,
        })
      }

      const { error: timelineError } = await supabase
        .from('timeline_items')
        .insert(timelineItems)

      if (timelineError) throw timelineError

      // Save tags if any selected
      if (formData.tags.length > 0) {
        // Get tag IDs from names
        const { data: tagData } = await supabase
          .from('tags')
          .select('id, name')
          .eq('team_id', teamId)
          .in('name', formData.tags)

        if (tagData && tagData.length > 0) {
          const workItemTags = tagData.map(tag => ({
            work_item_id: workItemId,
            tag_id: tag.id
          }))

          const { error: tagsError } = await supabase
            .from('work_item_tags')
            .insert(workItemTags)

          if (tagsError) console.error('Error saving tags:', tagsError)
        }
      }

      // Reset form
      const resetDefaultPhase = getSmartDefaultPhase()
      setFormData({
        name: '',
        type: initialItemType,
        phase: resetDefaultPhase,
        priority: 'medium',
        purpose: '',
        tags: [],
        mvp: {
          description: '',
          difficulty: 'medium',
          integration: ''
        },
        short: {
          description: '',
          difficulty: 'medium',
          integration: ''
        },
        long: {
          description: '',
          difficulty: 'medium',
          integration: ''
        }
      })
      setStep(1)
      setOpen(false)

      // Refresh the page
      router.refresh()
    } catch (error: any) {
      console.error(`Error creating ${getItemLabel(formData.type).toLowerCase()}:`, error)
      alert(error.message || `Failed to create ${getItemLabel(formData.type).toLowerCase()}`)
    } finally {
      setLoading(false)
    }
  }

  const buttonLabel = defaultType && defaultType !== 'all'
    ? `New ${getItemLabel(defaultType)}`
    : 'New Work Item'

  // Prepare phase permissions for PhaseSelect component
  const phasePermissions: PhasePermission[] = WORKSPACE_PHASES.map((phase) => ({
    phase: phase.id,
    canAssign: canEdit(phase.id),
    canView: permissions?.[phase.id]?.can_view || false,
    workloadCount: phaseWorkload[phase.id] || 0,
  }))

  // Show error if user has no phase permissions at all
  const hasAnyEditPermission = userAssignedPhases.length > 0

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button disabled={!hasAnyEditPermission && !permissionsLoading}>
          <Plus className="h-4 w-4 mr-2" />
          {buttonLabel}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[700px]">
        <form onSubmit={handleCreate}>
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle>Add Work Item</DialogTitle>
              <span className="text-sm font-medium text-muted-foreground">
                {step === 1 ? 'Step 1: Parent Details' : 'Step 2: Timeline Breakdown'}
              </span>
            </div>
            <div className="space-y-2">
              <PhaseContextBadge phase={workspacePhase} showFieldCount={false} />
              <DialogDescription>
                {getPhaseHelperText(workspacePhase)}
              </DialogDescription>
            </div>
          </DialogHeader>

          <div className="grid gap-4 py-4 max-h-[600px] overflow-y-auto">
            {/* STEP 1: Parent Feature Details */}
            {step === 1 && (
              <>
                {/* No Edit Permission Warning */}
                {!hasAnyEditPermission && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      You don't have permission to create work items. Contact your team admin to get phase access.
                    </AlertDescription>
                  </Alert>
                )}

                <div className="grid gap-2">
                  <Label htmlFor="name">
                    Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder={`e.g., ${getItemLabel(formData.type)} name...`}
                    required
                  />
                </div>

                {/* Phase Selection */}
                <PhaseSelect
                  value={formData.phase}
                  onValueChange={handlePhaseChange}
                  permissions={phasePermissions}
                  disabled={!hasAnyEditPermission || permissionsLoading}
                  required
                  showWorkload
                />

                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="type">Type</Label>
                    <div className="flex items-center gap-2">
                      <Select
                        value={formData.type}
                        onValueChange={handleTypeChange}
                        open={selectOpen}
                        onOpenChange={setSelectOpen}
                      >
                        <SelectTrigger id="type">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {availableTypes.map((itemType) => (
                            <SelectItem key={itemType} value={itemType}>
                              <div className="flex items-center gap-2">
                                <span>{getItemIcon(itemType)}</span>
                                <span>{getItemLabel(itemType)}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button
                        type="button"
                        variant={showAllTypes ? 'default' : 'outline'}
                        size="icon"
                        onClick={() => {
                          setShowAllTypes(!showAllTypes)
                          setSelectOpen(true)
                        }}
                        className="h-9 w-9 shrink-0"
                        title={showAllTypes ? 'Showing all types' : 'Show all available types'}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {getItemDescription(formData.type)}
                      {showAllTypes && (
                        <span className="text-blue-600"> • Showing all types</span>
                      )}
                    </p>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="priority">Priority</Label>
                    <Select value={formData.priority} onValueChange={(value) => setFormData({ ...formData, priority: value })}>
                      <SelectTrigger id="priority">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="critical">Critical</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="purpose">Purpose / Goal</Label>
                  <Textarea
                    id="purpose"
                    value={formData.purpose}
                    onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
                    placeholder="What problem does this solve? What business value does it provide?"
                    rows={3}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="tags">Tags / Categories</Label>
                  <TagSelector
                    teamId={teamId}
                    selectedTags={formData.tags}
                    onTagsChange={(tags) => setFormData({ ...formData, tags })}
                  />
                </div>
              </>
            )}

            {/* STEP 2: Timeline Breakdown */}
            {step === 2 && (
              <>
                <Tabs defaultValue="mvp" className="w-full">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="mvp">MVP *</TabsTrigger>
                    <TabsTrigger value="short">SHORT</TabsTrigger>
                    <TabsTrigger value="long">LONG</TabsTrigger>
                  </TabsList>

                  <TabsContent value="mvp" className="space-y-3">
                    <p className="text-sm text-muted-foreground">
                      Must-have for launch (required)
                    </p>
                    <div className="grid gap-2">
                      <Label htmlFor="mvp-desc">
                        What to build <span className="text-red-500">*</span>
                      </Label>
                      <Textarea
                        id="mvp-desc"
                        value={formData.mvp.description}
                        onChange={(e) => setFormData({
                          ...formData,
                          mvp: { ...formData.mvp, description: e.target.value }
                        })}
                        placeholder="e.g., Basic email/password login with session management"
                        rows={2}
                        required
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="mvp-difficulty">Difficulty</Label>
                      <Select
                        value={formData.mvp.difficulty}
                        onValueChange={(value) => setFormData({
                          ...formData,
                          mvp: { ...formData.mvp, difficulty: value }
                        })}
                      >
                        <SelectTrigger id="mvp-difficulty">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="easy">Easy</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="hard">Hard</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="mvp-integration">How / Integration Type</Label>
                      <Textarea
                        id="mvp-integration"
                        value={formData.mvp.integration}
                        onChange={(e) => setFormData({
                          ...formData,
                          mvp: { ...formData.mvp, integration: e.target.value }
                        })}
                        placeholder="e.g., Using Supabase Auth with JWT tokens and bcrypt password hashing"
                        rows={2}
                      />
                      <p className="text-xs text-muted-foreground">
                        Tools, libraries, or approach for implementation (helps AI context)
                      </p>
                    </div>
                  </TabsContent>

                  <TabsContent value="short" className="space-y-3">
                    <p className="text-sm text-muted-foreground">
                      Near-term enhancements (3-6 months, optional)
                    </p>
                    <div className="grid gap-2">
                      <Label htmlFor="short-desc">What to build</Label>
                      <Textarea
                        id="short-desc"
                        value={formData.short.description}
                        onChange={(e) => setFormData({
                          ...formData,
                          short: { ...formData.short, description: e.target.value }
                        })}
                        placeholder="e.g., Add Google and GitHub OAuth, 2FA"
                        rows={2}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="short-difficulty">Difficulty</Label>
                      <Select
                        value={formData.short.difficulty}
                        onValueChange={(value) => setFormData({
                          ...formData,
                          short: { ...formData.short, difficulty: value }
                        })}
                      >
                        <SelectTrigger id="short-difficulty">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="easy">Easy</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="hard">Hard</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="short-integration">How / Integration Type</Label>
                      <Textarea
                        id="short-integration"
                        value={formData.short.integration}
                        onChange={(e) => setFormData({
                          ...formData,
                          short: { ...formData.short, integration: e.target.value }
                        })}
                        placeholder="e.g., Using Passport.js for OAuth providers and Authy/Twilio for 2FA"
                        rows={2}
                      />
                      <p className="text-xs text-muted-foreground">
                        Tools, libraries, or approach for implementation (helps AI context)
                      </p>
                    </div>
                  </TabsContent>

                  <TabsContent value="long" className="space-y-3">
                    <p className="text-sm text-muted-foreground">
                      Future vision (6-12+ months, optional)
                    </p>
                    <div className="grid gap-2">
                      <Label htmlFor="long-desc">What to build</Label>
                      <Textarea
                        id="long-desc"
                        value={formData.long.description}
                        onChange={(e) => setFormData({
                          ...formData,
                          long: { ...formData.long, description: e.target.value }
                        })}
                        placeholder="e.g., Biometric authentication, passwordless login, SSO"
                        rows={2}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="long-difficulty">Difficulty</Label>
                      <Select
                        value={formData.long.difficulty}
                        onValueChange={(value) => setFormData({
                          ...formData,
                          long: { ...formData.long, difficulty: value }
                        })}
                      >
                        <SelectTrigger id="long-difficulty">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="easy">Easy</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="hard">Hard</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="long-integration">How / Integration Type</Label>
                      <Textarea
                        id="long-integration"
                        value={formData.long.integration}
                        onChange={(e) => setFormData({
                          ...formData,
                          long: { ...formData.long, integration: e.target.value }
                        })}
                        placeholder="e.g., Using WebAuthn API for biometrics, SAML/OpenID Connect for SSO"
                        rows={2}
                      />
                      <p className="text-xs text-muted-foreground">
                        Tools, libraries, or approach for implementation (helps AI context)
                      </p>
                    </div>
                  </TabsContent>
                </Tabs>
              </>
            )}
          </div>

          <DialogFooter>
            {step === 2 && (
              <Button
                type="button"
                variant="outline"
                onClick={handleBack}
                disabled={loading}
                size="sm"
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Back
              </Button>
            )}
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
              size="sm"
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading} size="sm">
              {loading ? (
                'Creating...'
              ) : step === 1 ? (
                <>
                  Next
                  <ChevronRight className="h-4 w-4 ml-1" />
                </>
              ) : (
                <>
                  <Check className="h-4 w-4 mr-1" />
                  Create {getItemLabel(formData.type)}
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
