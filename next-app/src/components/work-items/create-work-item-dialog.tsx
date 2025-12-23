'use client'

import { useState } from 'react'
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
import { Plus, ChevronLeft, ChevronRight, Check } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Checkbox } from '@/components/ui/checkbox'
import {
  getItemLabel,
  getItemIcon,
  WORK_ITEM_TYPES,
  LIFECYCLE_STATUSES,
  LIFECYCLE_STATUS_METADATA,
  LifecycleStatus,
} from '@/lib/constants/work-item-types'
import { TagSelector } from './tag-selector'
import { EnhancementCheckbox } from './enhancement-checkbox'
import { ParentFeatureSelector } from './parent-feature-selector'

// Type-specific placeholders (only placeholders change, not labels)
const TYPE_PLACEHOLDERS = {
  concept: {
    name: 'e.g., User authentication concept',
    purpose: 'Why is this worth exploring? What problem might it solve?',
    description: 'Describe the concept to explore...',
    approach: 'Notes on how to validate this concept...',
  },
  feature: {
    name: 'e.g., Dark mode support',
    purpose: 'What problem does this solve? What value does it provide?',
    description: 'Describe what to build...',
    approach: 'Technical approach or dependencies...',
  },
  bug: {
    name: 'e.g., Login button not responding',
    purpose: 'What is the expected behavior? What is happening instead?',
    description: 'Describe the bug and expected fix...',
    approach: 'Steps to reproduce or fix strategy...',
  },
  enhancement: {
    name: 'e.g., Faster search results',
    purpose: 'What improvement does this bring? How will users benefit?',
    description: 'Describe the improvement...',
    approach: 'How to implement the enhancement...',
  },
} as const

const getPlaceholder = (type: string, field: keyof typeof TYPE_PLACEHOLDERS.concept): string => {
  return TYPE_PLACEHOLDERS[type as keyof typeof TYPE_PLACEHOLDERS]?.[field] || TYPE_PLACEHOLDERS.feature[field]
}

interface CreateWorkItemDialogProps {
  workspaceId: string
  teamId: string
  currentUserId: string
  defaultType?: string | 'all'
  // Controlled mode props (optional - if not provided, uses internal state)
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

interface TimelineData {
  description: string
  difficulty: string
  integration: string
  status: LifecycleStatus
}

interface FormData {
  // Step 1: Parent Work Item Details
  name: string
  type: string
  priority: string
  purpose: string
  tags: string[]
  skipTimeline: boolean

  // Enhancement fields (for features/enhancements)
  isEnhancement: boolean
  enhancesWorkItemId: string | null
  version: number

  // Step 2: Timeline Breakdown (optional based on skipTimeline)
  mvp: TimelineData
  short: TimelineData
  long: TimelineData
}

export function CreateWorkItemDialog({
  workspaceId,
  teamId,
  currentUserId,
  defaultType,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
}: CreateWorkItemDialogProps) {
  // Support both controlled and uncontrolled modes
  const [internalOpen, setInternalOpen] = useState(false)
  const isControlled = controlledOpen !== undefined
  const open = isControlled ? controlledOpen : internalOpen
  const setOpen = isControlled
    ? (value: boolean) => controlledOnOpenChange?.(value)
    : setInternalOpen

  const [loading, setLoading] = useState(false)
  const [showAllTypes, setShowAllTypes] = useState(false)
  const [selectOpen, setSelectOpen] = useState(false)
  const [step, setStep] = useState(1)

  // Get all 4 work item types
  const allTypes = Object.values(WORK_ITEM_TYPES)
  const initialItemType = defaultType && defaultType !== 'all' ? defaultType : allTypes[0]

  // Default to skip timeline for bugs (quick entry)
  const getDefaultSkipTimeline = (type: string) => type === WORK_ITEM_TYPES.BUG

  // Consolidated form state
  // Updated 2025-12-13: Migrated to 4-phase system (PLANNING/RESEARCH → DESIGN)
  const [formData, setFormData] = useState<FormData>({
    name: '',
    type: initialItemType,
    priority: 'medium',
    purpose: '',
    tags: [],
    skipTimeline: getDefaultSkipTimeline(initialItemType),
    // Enhancement fields
    isEnhancement: false,
    enhancesWorkItemId: null,
    version: 1,
    mvp: {
      description: '',
      difficulty: 'medium',
      integration: '',
      status: LIFECYCLE_STATUSES.DESIGN,
    },
    short: {
      description: '',
      difficulty: 'medium',
      integration: '',
      status: LIFECYCLE_STATUSES.DESIGN,
    },
    long: {
      description: '',
      difficulty: 'medium',
      integration: '',
      status: LIFECYCLE_STATUSES.DESIGN,
    }
  })

  // All 4 types available
  const availableTypes = allTypes

  const router = useRouter()
  const supabase = createClient()

  // Type change handler - also update skipTimeline default and reset enhancement fields
  const handleTypeChange = (newType: string) => {
    const isEnhancementType = newType === 'feature' || newType === 'enhancement'
    setFormData((prev) => ({
      ...prev,
      type: newType,
      skipTimeline: getDefaultSkipTimeline(newType),
      // Reset enhancement fields when switching away from feature/enhancement types
      isEnhancement: isEnhancementType ? prev.isEnhancement : false,
      enhancesWorkItemId: isEnhancementType ? prev.enhancesWorkItemId : null,
      version: isEnhancementType ? prev.version : 1,
    }))
  }

  // Validation functions
  const validateStep1 = (): boolean => {
    if (!formData.name.trim()) {
      alert(`${getItemLabel(formData.type)} name is required`)
      return false
    }
    // Require parent feature when enhancement flag is checked
    if (formData.isEnhancement && !formData.enhancesWorkItemId) {
      alert('Please select a parent feature for this enhancement')
      return false
    }
    return true
  }

  const validateStep2 = (): boolean => {
    // If skipping timeline, no validation needed for timeline fields
    if (formData.skipTimeline) {
      return true
    }
    // MVP description required when not skipping timeline
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

    // If on step 1 and not skipping timeline, move to step 2
    if (step === 1 && !formData.skipTimeline) {
      handleNext()
      return
    }

    // If on step 1 and skipping timeline, validate step 1 only
    if (step === 1 && formData.skipTimeline) {
      if (!validateStep1()) return
    }

    // If on step 2, validate step 2
    if (step === 2 && !validateStep2()) return

    setLoading(true)

    try {
      const workItemId = `work_item_${Date.now()}`

      // Create work item (no phase at work item level)
      const { error: workItemError } = await supabase.from('work_items').insert({
        id: workItemId,
        workspace_id: workspaceId,
        team_id: teamId,
        name: formData.name.trim(),
        type: formData.type,
        purpose: formData.purpose.trim() || null,
        priority: formData.priority,
        status: 'not_started',
        created_by: currentUserId,
        // Enhancement fields
        is_enhancement: formData.isEnhancement,
        enhances_work_item_id: formData.enhancesWorkItemId,
        version: formData.version,
      })

      if (workItemError) throw workItemError

      // Create timeline items only if not skipping
      if (!formData.skipTimeline) {
        const timelineItems = []

        // MVP (required when not skipping)
        if (formData.mvp.description.trim()) {
          timelineItems.push({
            id: `timeline_${Date.now()}_mvp`,
            work_item_id: workItemId,
            workspace_id: workspaceId,
            team_id: teamId,
            timeline: 'MVP',
            difficulty: formData.mvp.difficulty,
            description: formData.mvp.description.trim(),
            integration_type: formData.mvp.integration.trim() || null,
            phase: formData.mvp.status, // Status stored in phase column
          })
        }

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
            phase: formData.short.status, // Status stored in phase column
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
            phase: formData.long.status, // Status stored in phase column
          })
        }

        if (timelineItems.length > 0) {
          const { error: timelineError } = await supabase
            .from('timeline_items')
            .insert(timelineItems)

          if (timelineError) throw timelineError
        }
      }

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

      // Reset form - Updated 2025-12-13: PLANNING/RESEARCH → DESIGN
      setFormData({
        name: '',
        type: initialItemType,
        priority: 'medium',
        purpose: '',
        tags: [],
        skipTimeline: getDefaultSkipTimeline(initialItemType),
        // Reset enhancement fields
        isEnhancement: false,
        enhancesWorkItemId: null,
        version: 1,
        mvp: {
          description: '',
          difficulty: 'medium',
          integration: '',
          status: LIFECYCLE_STATUSES.DESIGN,
        },
        short: {
          description: '',
          difficulty: 'medium',
          integration: '',
          status: LIFECYCLE_STATUSES.DESIGN,
        },
        long: {
          description: '',
          difficulty: 'medium',
          integration: '',
          status: LIFECYCLE_STATUSES.DESIGN,
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

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
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
                {formData.skipTimeline
                  ? 'Quick Entry'
                  : step === 1
                    ? 'Step 1: Details'
                    : 'Step 2: Timeline'}
              </span>
            </div>
            <DialogDescription>
              Add a work item to track and plan your project work
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4 max-h-[600px] overflow-y-auto">
            {/* STEP 1: Work Item Details */}
            {step === 1 && (
              <>
                <div className="grid gap-2">
                  <Label htmlFor="name">
                    Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder={getPlaceholder(formData.type, 'name')}
                    required
                  />
                </div>

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
                    {showAllTypes && (
                      <p className="text-xs text-blue-600">
                        Showing all work item types
                      </p>
                    )}
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
                    placeholder={getPlaceholder(formData.type, 'purpose')}
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

                {/* Enhancement Flag (only for feature/enhancement types) */}
                <EnhancementCheckbox
                  type={formData.type}
                  checked={formData.isEnhancement}
                  onCheckedChange={(checked) => {
                    setFormData({
                      ...formData,
                      isEnhancement: checked,
                      // Reset parent selection when unchecking
                      enhancesWorkItemId: checked ? formData.enhancesWorkItemId : null,
                      version: checked ? formData.version : 1,
                    })
                  }}
                />

                {/* Parent Feature Selector (only when enhancement is checked) */}
                {formData.isEnhancement && (
                  <ParentFeatureSelector
                    teamId={teamId}
                    workspaceId={workspaceId}
                    selectedFeatureId={formData.enhancesWorkItemId}
                    onFeatureChange={(featureId, nextVersion) => {
                      setFormData({
                        ...formData,
                        enhancesWorkItemId: featureId,
                        version: nextVersion,
                      })
                    }}
                  />
                )}

                {/* Skip Timeline Checkbox */}
                <div className="flex items-center space-x-2 pt-2 border-t">
                  <Checkbox
                    id="skip-timeline"
                    checked={formData.skipTimeline}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, skipTimeline: checked === true })
                    }
                  />
                  <div className="grid gap-0.5 leading-none">
                    <label
                      htmlFor="skip-timeline"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                    >
                      Skip timeline breakdown
                    </label>
                    <p className="text-xs text-muted-foreground">
                      Create without MVP/SHORT/LONG breakdown (faster for bugs, quick tasks)
                    </p>
                  </div>
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
                        Description <span className="text-red-500">*</span>
                      </Label>
                      <Textarea
                        id="mvp-desc"
                        value={formData.mvp.description}
                        onChange={(e) => setFormData({
                          ...formData,
                          mvp: { ...formData.mvp, description: e.target.value }
                        })}
                        placeholder={getPlaceholder(formData.type, 'description')}
                        rows={2}
                        required
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
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
                        <Label htmlFor="mvp-status">Status</Label>
                        <Select
                          value={formData.mvp.status}
                          onValueChange={(value) => setFormData({
                            ...formData,
                            mvp: { ...formData.mvp, status: value as LifecycleStatus }
                          })}
                        >
                          <SelectTrigger id="mvp-status">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.values(LIFECYCLE_STATUSES).map((status) => (
                              <SelectItem key={status} value={status}>
                                {LIFECYCLE_STATUS_METADATA[status].label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="mvp-integration">Approach / Notes</Label>
                      <Textarea
                        id="mvp-integration"
                        value={formData.mvp.integration}
                        onChange={(e) => setFormData({
                          ...formData,
                          mvp: { ...formData.mvp, integration: e.target.value }
                        })}
                        placeholder={getPlaceholder(formData.type, 'approach')}
                        rows={2}
                      />
                      <p className="text-xs text-muted-foreground">
                        Implementation notes, dependencies, or technical approach
                      </p>
                    </div>
                  </TabsContent>

                  <TabsContent value="short" className="space-y-3">
                    <p className="text-sm text-muted-foreground">
                      Near-term enhancements (3-6 months, optional)
                    </p>
                    <div className="grid gap-2">
                      <Label htmlFor="short-desc">Description</Label>
                      <Textarea
                        id="short-desc"
                        value={formData.short.description}
                        onChange={(e) => setFormData({
                          ...formData,
                          short: { ...formData.short, description: e.target.value }
                        })}
                        placeholder={getPlaceholder(formData.type, 'description')}
                        rows={2}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
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
                        <Label htmlFor="short-status">Status</Label>
                        <Select
                          value={formData.short.status}
                          onValueChange={(value) => setFormData({
                            ...formData,
                            short: { ...formData.short, status: value as LifecycleStatus }
                          })}
                        >
                          <SelectTrigger id="short-status">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.values(LIFECYCLE_STATUSES).map((status) => (
                              <SelectItem key={status} value={status}>
                                {LIFECYCLE_STATUS_METADATA[status].label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="short-integration">Approach / Notes</Label>
                      <Textarea
                        id="short-integration"
                        value={formData.short.integration}
                        onChange={(e) => setFormData({
                          ...formData,
                          short: { ...formData.short, integration: e.target.value }
                        })}
                        placeholder={getPlaceholder(formData.type, 'approach')}
                        rows={2}
                      />
                      <p className="text-xs text-muted-foreground">
                        Implementation notes, dependencies, or technical approach
                      </p>
                    </div>
                  </TabsContent>

                  <TabsContent value="long" className="space-y-3">
                    <p className="text-sm text-muted-foreground">
                      Future vision (6-12+ months, optional)
                    </p>
                    <div className="grid gap-2">
                      <Label htmlFor="long-desc">Description</Label>
                      <Textarea
                        id="long-desc"
                        value={formData.long.description}
                        onChange={(e) => setFormData({
                          ...formData,
                          long: { ...formData.long, description: e.target.value }
                        })}
                        placeholder={getPlaceholder(formData.type, 'description')}
                        rows={2}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
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
                        <Label htmlFor="long-status">Status</Label>
                        <Select
                          value={formData.long.status}
                          onValueChange={(value) => setFormData({
                            ...formData,
                            long: { ...formData.long, status: value as LifecycleStatus }
                          })}
                        >
                          <SelectTrigger id="long-status">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.values(LIFECYCLE_STATUSES).map((status) => (
                              <SelectItem key={status} value={status}>
                                {LIFECYCLE_STATUS_METADATA[status].label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="long-integration">Approach / Notes</Label>
                      <Textarea
                        id="long-integration"
                        value={formData.long.integration}
                        onChange={(e) => setFormData({
                          ...formData,
                          long: { ...formData.long, integration: e.target.value }
                        })}
                        placeholder={getPlaceholder(formData.type, 'approach')}
                        rows={2}
                      />
                      <p className="text-xs text-muted-foreground">
                        Implementation notes, dependencies, or technical approach
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
              ) : step === 1 && !formData.skipTimeline ? (
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
