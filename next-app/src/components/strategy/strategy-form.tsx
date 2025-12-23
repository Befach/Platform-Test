'use client'

/**
 * StrategyForm Component
 *
 * Form for creating/editing strategies with:
 * - Parent selector (hierarchical)
 * - Conditional metric fields for Key Results
 * - Color picker
 * - Progress mode toggle
 */

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Calendar, Calculator, Pencil, Loader2, Users, BookOpen, FileText } from 'lucide-react'
import {
  STRATEGY_TYPES,
  STRATEGY_STATUSES,
  STRATEGY_TYPE_COLORS,
  getStrategyTypeLabel,
  getStrategyStatusLabel,
  getValidParentTypes,
} from '@/lib/types/strategy'
import type {
  ProductStrategy,
  StrategyWithChildren,
  CreateStrategyRequest,
  UpdateStrategyRequest,
  StrategyType,
  StrategyStatus,
  ProgressMode,
} from '@/lib/types/strategy'

interface StrategyFormProps {
  mode: 'create' | 'edit'
  strategy?: ProductStrategy
  parentStrategies?: StrategyWithChildren[]
  defaultParentId?: string
  defaultType?: StrategyType
  teamId: string
  workspaceId?: string
  onSubmit: (data: CreateStrategyRequest | UpdateStrategyRequest) => Promise<void>
  onCancel: () => void
  isLoading?: boolean
}

interface FormValues {
  title: string
  description: string
  type: StrategyType
  parent_id: string
  status: StrategyStatus
  start_date: string
  target_date: string
  progress_mode: ProgressMode
  progress: number
  metric_name: string
  metric_current: string
  metric_target: string
  metric_unit: string
  // Pillar context fields (newline-separated, converted to array on submit)
  user_stories: string
  user_examples: string
  case_studies: string
  owner_id: string
  color: string
}

// Predefined color palette
const COLOR_PALETTE = [
  '#6366f1', // Indigo (default)
  '#8b5cf6', // Purple
  '#06b6d4', // Cyan
  '#10b981', // Emerald
  '#f59e0b', // Amber
  '#ef4444', // Red
  '#ec4899', // Pink
  '#3b82f6', // Blue
]

export function StrategyForm({
  mode,
  strategy,
  parentStrategies = [],
  defaultParentId,
  defaultType,
  teamId,
  workspaceId,
  onSubmit,
  onCancel,
  isLoading = false,
}: StrategyFormProps) {
  const [selectedType, setSelectedType] = useState<StrategyType>(
    strategy?.type || defaultType || 'objective'
  )

  const form = useForm<FormValues>({
    defaultValues: {
      title: strategy?.title || '',
      description: strategy?.description || '',
      type: strategy?.type || defaultType || 'objective',
      parent_id: strategy?.parent_id || defaultParentId || '',
      status: strategy?.status || 'active',
      start_date: strategy?.start_date || '',
      target_date: strategy?.target_date || '',
      progress_mode: strategy?.progress_mode || 'auto',
      progress: strategy?.progress || 0,
      metric_name: strategy?.metric_name || '',
      metric_current: strategy?.metric_current?.toString() || '',
      metric_target: strategy?.metric_target?.toString() || '',
      metric_unit: strategy?.metric_unit || '',
      // Pillar context fields (join arrays to newline-separated strings)
      user_stories: strategy?.user_stories?.join('\n') || '',
      user_examples: strategy?.user_examples?.join('\n') || '',
      case_studies: strategy?.case_studies?.join('\n') || '',
      owner_id: strategy?.owner_id || '',
      color: strategy?.color || STRATEGY_TYPE_COLORS[defaultType || 'objective'],
    },
  })

  // Update color when type changes (only in create mode)
  useEffect(() => {
    if (mode === 'create') {
      form.setValue('color', STRATEGY_TYPE_COLORS[selectedType])
    }
  }, [selectedType, mode, form])

  // Filter parent options based on selected type
  const validParentTypes = getValidParentTypes(selectedType)
  const availableParents = flattenStrategies(parentStrategies).filter(
    s => validParentTypes.includes(s.type) && s.id !== strategy?.id
  )

  const handleSubmit = async (values: FormValues) => {
    const data: CreateStrategyRequest | UpdateStrategyRequest = {
      title: values.title,
      description: values.description || undefined,
      parent_id: values.parent_id || undefined,
      start_date: values.start_date || undefined,
      target_date: values.target_date || undefined,
      status: values.status,
      progress_mode: values.progress_mode,
      color: values.color,
    }

    if (mode === 'create') {
      (data as CreateStrategyRequest).team_id = teamId
      if (workspaceId) (data as CreateStrategyRequest).workspace_id = workspaceId
      ;(data as CreateStrategyRequest).type = values.type
    }

    // Handle progress (only if manual mode)
    if (values.progress_mode === 'manual') {
      data.progress = values.progress
    }

    // Handle metrics (only for key_result type)
    if (values.type === 'key_result' || strategy?.type === 'key_result') {
      data.metric_name = values.metric_name || undefined
      data.metric_current = values.metric_current ? parseFloat(values.metric_current) : undefined
      data.metric_target = values.metric_target ? parseFloat(values.metric_target) : undefined
      data.metric_unit = values.metric_unit || undefined
    }

    // Handle pillar context fields (convert newline-separated to arrays)
    if (values.type === 'pillar' || strategy?.type === 'pillar') {
      data.user_stories = values.user_stories?.split('\n').filter(Boolean) || []
      data.user_examples = values.user_examples?.split('\n').filter(Boolean) || []
      data.case_studies = values.case_studies?.split('\n').filter(Boolean) || []
    }

    await onSubmit(data)
  }

  const showMetricFields = selectedType === 'key_result' || strategy?.type === 'key_result'
  const showPillarFields = selectedType === 'pillar' || strategy?.type === 'pillar'

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        {/* Title */}
        <FormField
          control={form.control}
          name="title"
          rules={{ required: 'Title is required' }}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Title *</FormLabel>
              <FormControl>
                <Input placeholder="Enter strategy title..." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Type (create mode only) */}
        {mode === 'create' && (
          <FormField
            control={form.control}
            name="type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Type *</FormLabel>
                <Select
                  value={field.value}
                  onValueChange={(value: StrategyType) => {
                    field.onChange(value)
                    setSelectedType(value)
                  }}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {STRATEGY_TYPES.map(type => (
                      <SelectItem key={type} value={type}>
                        <div className="flex items-center gap-2">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: STRATEGY_TYPE_COLORS[type] }}
                          />
                          {getStrategyTypeLabel(type)}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormDescription>
                  {selectedType === 'pillar' && 'Top-level strategic pillar'}
                  {selectedType === 'objective' && 'Objective under a pillar'}
                  {selectedType === 'key_result' && 'Measurable key result with metrics'}
                  {selectedType === 'initiative' && 'Project or initiative to achieve KRs'}
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        {/* Parent selector */}
        {selectedType !== 'pillar' && (
          <FormField
            control={form.control}
            name="parent_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Parent Strategy</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select parent..." />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="">No parent</SelectItem>
                    {Object.entries(groupByType(availableParents)).map(([type, items]) => (
                      <SelectGroup key={type}>
                        <SelectLabel>{getStrategyTypeLabel(type as StrategyType)}s</SelectLabel>
                        {items.map(item => (
                          <SelectItem key={item.id} value={item.id}>
                            <span style={{ paddingLeft: `${item.depth * 12}px` }}>
                              {item.title}
                            </span>
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        {/* Description */}
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Describe this strategy..."
                  className="min-h-[80px]"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Status */}
        <FormField
          control={form.control}
          name="status"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Status</FormLabel>
              <Select value={field.value} onValueChange={field.onChange}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {STRATEGY_STATUSES.map(status => (
                    <SelectItem key={status} value={status}>
                      {getStrategyStatusLabel(status)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Dates */}
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="start_date"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Start Date</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input type="date" className="pl-9" {...field} />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="target_date"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Target Date</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input type="date" className="pl-9" {...field} />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Metric fields (for Key Results) */}
        {showMetricFields && (
          <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
            <Label className="text-sm font-medium">Key Result Metrics</Label>

            <FormField
              control={form.control}
              name="metric_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs">Metric Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Monthly Active Users" {...field} />
                  </FormControl>
                </FormItem>
              )}
            />

            <div className="grid grid-cols-3 gap-3">
              <FormField
                control={form.control}
                name="metric_current"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs">Current</FormLabel>
                    <FormControl>
                      <Input type="number" step="any" placeholder="0" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="metric_target"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs">Target</FormLabel>
                    <FormControl>
                      <Input type="number" step="any" placeholder="100" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="metric_unit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs">Unit</FormLabel>
                    <FormControl>
                      <Input placeholder="users, %, $" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
          </div>
        )}

        {/* Pillar context fields (for Pillars) */}
        {showPillarFields && (
          <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
            <Label className="text-sm font-medium flex items-center gap-2">
              <Users className="h-4 w-4 text-indigo-500" />
              Pillar Context
            </Label>
            <FormDescription className="text-xs">
              Add user stories, case studies, and examples to provide context for this strategic pillar.
            </FormDescription>

            <FormField
              control={form.control}
              name="user_stories"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs flex items-center gap-1.5">
                    <Users className="h-3.5 w-3.5" />
                    User Stories
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="As a product manager, I want to track feature progress...&#10;As a developer, I need clear requirements..."
                      className="min-h-[80px] text-sm"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription className="text-xs">
                    One user story per line
                  </FormDescription>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="case_studies"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs flex items-center gap-1.5">
                    <BookOpen className="h-3.5 w-3.5" />
                    Case Studies
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Spotify's squad model for team autonomy...&#10;Amazon's two-pizza team approach..."
                      className="min-h-[80px] text-sm"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription className="text-xs">
                    Reference case studies for inspiration (one per line)
                  </FormDescription>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="user_examples"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs flex items-center gap-1.5">
                    <FileText className="h-3.5 w-3.5" />
                    Real Examples
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Customer ABC reduced planning time by 40%...&#10;Team XYZ improved delivery predictability..."
                      className="min-h-[80px] text-sm"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription className="text-xs">
                    Real user examples demonstrating value (one per line)
                  </FormDescription>
                </FormItem>
              )}
            />
          </div>
        )}

        {/* Progress mode */}
        <FormField
          control={form.control}
          name="progress_mode"
          render={({ field }) => (
            <FormItem className="flex items-center justify-between rounded-lg border p-3">
              <div className="space-y-0.5">
                <FormLabel className="text-base flex items-center gap-2">
                  {field.value === 'auto' ? (
                    <Calculator className="h-4 w-4 text-blue-500" />
                  ) : (
                    <Pencil className="h-4 w-4 text-purple-500" />
                  )}
                  {field.value === 'auto' ? 'Auto-calculated' : 'Manual'} Progress
                </FormLabel>
                <FormDescription>
                  {field.value === 'auto'
                    ? 'Progress computed from children or metrics'
                    : 'Manually set progress value'}
                </FormDescription>
              </div>
              <FormControl>
                <Switch
                  checked={field.value === 'manual'}
                  onCheckedChange={(checked) =>
                    field.onChange(checked ? 'manual' : 'auto')
                  }
                />
              </FormControl>
            </FormItem>
          )}
        />

        {/* Manual progress slider */}
        {form.watch('progress_mode') === 'manual' && (
          <FormField
            control={form.control}
            name="progress"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Progress: {field.value}%</FormLabel>
                <FormControl>
                  <Input
                    type="range"
                    min="0"
                    max="100"
                    step="5"
                    {...field}
                    onChange={e => field.onChange(parseInt(e.target.value))}
                  />
                </FormControl>
              </FormItem>
            )}
          />
        )}

        {/* Color picker */}
        <FormField
          control={form.control}
          name="color"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Color</FormLabel>
              <div className="flex items-center gap-2">
                {COLOR_PALETTE.map(color => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => field.onChange(color)}
                    className={cn(
                      'w-6 h-6 rounded-full transition-transform hover:scale-110',
                      field.value === color && 'ring-2 ring-offset-2 ring-primary'
                    )}
                    style={{ backgroundColor: color }}
                  />
                ))}
                <Input
                  type="color"
                  value={field.value}
                  onChange={e => field.onChange(e.target.value)}
                  className="w-8 h-8 p-0 border-0 cursor-pointer"
                />
              </div>
            </FormItem>
          )}
        />

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {mode === 'create' ? 'Create Strategy' : 'Save Changes'}
          </Button>
        </div>
      </form>
    </Form>
  )
}

// Helper to flatten tree with depth info
interface FlatStrategy {
  id: string
  title: string
  type: StrategyType
  depth: number
}

function flattenStrategies(
  strategies: StrategyWithChildren[],
  depth = 0
): FlatStrategy[] {
  return strategies.flatMap(s => [
    { id: s.id, title: s.title, type: s.type, depth },
    ...flattenStrategies(s.children, depth + 1),
  ])
}

// Group by type for organized dropdown
function groupByType(items: FlatStrategy[]): Record<StrategyType, FlatStrategy[]> {
  const result: Record<StrategyType, FlatStrategy[]> = {
    pillar: [],
    objective: [],
    key_result: [],
    initiative: [],
  }
  items.forEach(item => {
    result[item.type].push(item)
  })
  return result
}
