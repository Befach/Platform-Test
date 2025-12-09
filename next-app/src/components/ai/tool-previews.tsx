'use client'

/**
 * Tool Preview Components
 *
 * Rich visual previews for AI tool actions. These show what will be
 * created/modified before the user confirms, making the AI's proposals
 * transparent and editable.
 *
 * Preview Types:
 * - WorkItemPreview: Card-style preview of feature/bug/enhancement
 * - TaskPreview: Task card with parent context
 * - DependencyPreview: Visual connection between two items
 * - TimelineItemPreview: Timeline entry preview
 * - InsightPreview: Customer insight card
 */

import { useState, useCallback } from 'react'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
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
import {
  Card,
  CardContent,
  CardHeader,
} from '@/components/ui/card'
import {
  FileText,
  Bug,
  Sparkles,
  Lightbulb,
  CheckSquare,
  ArrowRight,
  Calendar,
  MessageSquare,
  Tag,
  AlertCircle,
  Clock,
  User,
  Link2,
  Pencil,
} from 'lucide-react'

// =============================================================================
// TYPES
// =============================================================================

export interface PreviewProps<T = Record<string, unknown>> {
  params: T
  isEditing?: boolean
  onChange?: (params: T) => void
  className?: string
}

// Work Item types
interface WorkItemParams {
  name: string
  type: 'concept' | 'feature' | 'bug' | 'enhancement'
  purpose?: string
  priority?: 'critical' | 'high' | 'medium' | 'low'
  tags?: string[]
  phase?: string
}

// Task types
interface TaskParams {
  name: string
  description?: string
  workItemId: string
  workItemName?: string
  priority?: 'critical' | 'high' | 'medium' | 'low'
  assigneeId?: string
  assigneeName?: string
  dueDate?: string
}

// Dependency types
interface DependencyParams {
  sourceId: string
  sourceName?: string
  targetId: string
  targetName?: string
  connectionType: 'blocks' | 'depends_on' | 'related_to' | 'duplicates'
  reason?: string
  strength?: number
}

// Timeline types
interface TimelineItemParams {
  name: string
  workItemId: string
  workItemName?: string
  timeframe: 'mvp' | 'short' | 'long'
  description?: string
  priority?: number
}

// Insight types
interface InsightParams {
  title: string
  content: string
  source?: string
  sentiment?: 'positive' | 'neutral' | 'negative'
  tags?: string[]
  linkedWorkItemId?: string
  linkedWorkItemName?: string
}

// =============================================================================
// HELPER COMPONENTS
// =============================================================================

const typeIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  concept: Lightbulb,
  feature: Sparkles,
  bug: Bug,
  enhancement: FileText,
}

const typeColors: Record<string, string> = {
  concept: 'bg-purple-100 text-purple-700 border-purple-200',
  feature: 'bg-blue-100 text-blue-700 border-blue-200',
  bug: 'bg-red-100 text-red-700 border-red-200',
  enhancement: 'bg-green-100 text-green-700 border-green-200',
}

const priorityColors: Record<string, string> = {
  critical: 'bg-red-500 text-white',
  high: 'bg-orange-500 text-white',
  medium: 'bg-yellow-500 text-black',
  low: 'bg-gray-400 text-white',
}

const timeframeLabels: Record<string, { label: string; color: string }> = {
  mvp: { label: 'MVP', color: 'bg-green-100 text-green-700' },
  short: { label: 'Short-term', color: 'bg-blue-100 text-blue-700' },
  long: { label: 'Long-term', color: 'bg-purple-100 text-purple-700' },
}

const connectionLabels: Record<string, { label: string; color: string }> = {
  blocks: { label: 'Blocks', color: 'bg-red-100 text-red-700' },
  depends_on: { label: 'Depends On', color: 'bg-orange-100 text-orange-700' },
  related_to: { label: 'Related To', color: 'bg-blue-100 text-blue-700' },
  duplicates: { label: 'Duplicates', color: 'bg-gray-100 text-gray-700' },
}

function EditableField({
  label,
  value,
  onChange,
  isEditing,
  type = 'text',
  options,
  placeholder,
  multiline = false,
}: {
  label: string
  value: string | undefined
  onChange: (value: string) => void
  isEditing: boolean
  type?: 'text' | 'select'
  options?: Array<{ value: string; label: string }>
  placeholder?: string
  multiline?: boolean
}) {
  if (!isEditing) {
    return (
      <div className="text-sm">
        <span className="text-muted-foreground">{label}:</span>{' '}
        <span className="font-medium">{value || '—'}</span>
      </div>
    )
  }

  if (type === 'select' && options) {
    return (
      <div className="space-y-1">
        <Label className="text-xs text-muted-foreground">{label}</Label>
        <Select value={value || ''} onValueChange={onChange}>
          <SelectTrigger className="h-8">
            <SelectValue placeholder={placeholder || `Select ${label.toLowerCase()}`} />
          </SelectTrigger>
          <SelectContent>
            {options.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    )
  }

  if (multiline) {
    return (
      <div className="space-y-1">
        <Label className="text-xs text-muted-foreground">{label}</Label>
        <Textarea
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="min-h-[60px] text-sm"
        />
      </div>
    )
  }

  return (
    <div className="space-y-1">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <Input
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-8"
      />
    </div>
  )
}

// =============================================================================
// WORK ITEM PREVIEW
// =============================================================================

export function WorkItemPreview({
  params,
  isEditing = false,
  onChange,
  className,
}: PreviewProps<WorkItemParams>) {
  const IconComponent = typeIcons[params.type] || FileText
  const typeColor = typeColors[params.type] || typeColors.feature

  const handleChange = useCallback(
    (key: keyof WorkItemParams, value: unknown) => {
      onChange?.({ ...params, [key]: value })
    },
    [params, onChange]
  )

  return (
    <Card className={cn('overflow-hidden', className)}>
      {/* Type indicator bar */}
      <div className={cn('h-1', typeColor.split(' ')[0])} />

      <CardHeader className="pb-2 pt-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 flex-1">
            <div className={cn('p-1.5 rounded', typeColor)}>
              <IconComponent className="h-4 w-4" />
            </div>
            {isEditing ? (
              <Input
                value={params.name}
                onChange={(e) => handleChange('name', e.target.value)}
                className="h-8 font-semibold"
                placeholder="Work item name"
              />
            ) : (
              <h3 className="font-semibold text-sm">{params.name}</h3>
            )}
          </div>
          {isEditing && (
            <Badge variant="outline" className="gap-1 text-xs">
              <Pencil className="h-3 w-3" />
              Editing
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-3 pb-3">
        {/* Type & Priority Row */}
        <div className="flex gap-3">
          <div className="flex-1">
            <EditableField
              label="Type"
              value={params.type}
              onChange={(v) => handleChange('type', v)}
              isEditing={isEditing}
              type="select"
              options={[
                { value: 'concept', label: 'Concept' },
                { value: 'feature', label: 'Feature' },
                { value: 'bug', label: 'Bug' },
                { value: 'enhancement', label: 'Enhancement' },
              ]}
            />
          </div>
          <div className="flex-1">
            <EditableField
              label="Priority"
              value={params.priority}
              onChange={(v) => handleChange('priority', v)}
              isEditing={isEditing}
              type="select"
              options={[
                { value: 'critical', label: 'Critical' },
                { value: 'high', label: 'High' },
                { value: 'medium', label: 'Medium' },
                { value: 'low', label: 'Low' },
              ]}
            />
          </div>
        </div>

        {/* Purpose */}
        <EditableField
          label="Purpose"
          value={params.purpose}
          onChange={(v) => handleChange('purpose', v)}
          isEditing={isEditing}
          multiline
          placeholder="What is the purpose of this work item?"
        />

        {/* Tags */}
        {(params.tags?.length || isEditing) && (
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground flex items-center gap-1">
              <Tag className="h-3 w-3" />
              Tags
            </Label>
            {isEditing ? (
              <Input
                value={params.tags?.join(', ') || ''}
                onChange={(e) =>
                  handleChange(
                    'tags',
                    e.target.value.split(',').map((t) => t.trim()).filter(Boolean)
                  )
                }
                placeholder="tag1, tag2, tag3"
                className="h-8"
              />
            ) : (
              <div className="flex flex-wrap gap-1">
                {params.tags?.map((tag, i) => (
                  <Badge key={i} variant="secondary" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Preview badge */}
        {!isEditing && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground pt-2 border-t">
            <AlertCircle className="h-3 w-3" />
            <span>Preview - This will be created when you confirm</span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// =============================================================================
// TASK PREVIEW
// =============================================================================

export function TaskPreview({
  params,
  isEditing = false,
  onChange,
  className,
}: PreviewProps<TaskParams>) {
  const handleChange = useCallback(
    (key: keyof TaskParams, value: unknown) => {
      onChange?.({ ...params, [key]: value })
    },
    [params, onChange]
  )

  return (
    <Card className={cn('overflow-hidden', className)}>
      <div className="h-1 bg-blue-500" />

      <CardHeader className="pb-2 pt-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 flex-1">
            <div className="p-1.5 rounded bg-blue-100 text-blue-700">
              <CheckSquare className="h-4 w-4" />
            </div>
            {isEditing ? (
              <Input
                value={params.name}
                onChange={(e) => handleChange('name', e.target.value)}
                className="h-8 font-semibold"
                placeholder="Task name"
              />
            ) : (
              <h3 className="font-semibold text-sm">{params.name}</h3>
            )}
          </div>
          {params.priority && (
            <Badge className={cn('text-xs', priorityColors[params.priority])}>
              {params.priority}
            </Badge>
          )}
        </div>

        {/* Parent work item */}
        {params.workItemName && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
            <FileText className="h-3 w-3" />
            <span>For: {params.workItemName}</span>
          </div>
        )}
      </CardHeader>

      <CardContent className="space-y-3 pb-3">
        {/* Description */}
        <EditableField
          label="Description"
          value={params.description}
          onChange={(v) => handleChange('description', v)}
          isEditing={isEditing}
          multiline
          placeholder="Task description"
        />

        {/* Assignee & Due Date Row */}
        <div className="flex gap-3">
          <div className="flex-1">
            {isEditing ? (
              <EditableField
                label="Assignee"
                value={params.assigneeName}
                onChange={(v) => handleChange('assigneeName', v)}
                isEditing={isEditing}
                placeholder="Assignee name"
              />
            ) : params.assigneeName ? (
              <div className="flex items-center gap-1 text-sm">
                <User className="h-3 w-3 text-muted-foreground" />
                <span>{params.assigneeName}</span>
              </div>
            ) : null}
          </div>
          <div className="flex-1">
            {isEditing ? (
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Due Date</Label>
                <Input
                  type="date"
                  value={params.dueDate || ''}
                  onChange={(e) => handleChange('dueDate', e.target.value)}
                  className="h-8"
                />
              </div>
            ) : params.dueDate ? (
              <div className="flex items-center gap-1 text-sm">
                <Clock className="h-3 w-3 text-muted-foreground" />
                <span>{new Date(params.dueDate).toLocaleDateString()}</span>
              </div>
            ) : null}
          </div>
        </div>

        {/* Preview badge */}
        {!isEditing && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground pt-2 border-t">
            <AlertCircle className="h-3 w-3" />
            <span>Preview - This task will be created when you confirm</span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// =============================================================================
// DEPENDENCY PREVIEW
// =============================================================================

export function DependencyPreview({
  params,
  isEditing = false,
  onChange,
  className,
}: PreviewProps<DependencyParams>) {
  const connectionInfo = connectionLabels[params.connectionType] || connectionLabels.related_to

  const handleChange = useCallback(
    (key: keyof DependencyParams, value: unknown) => {
      onChange?.({ ...params, [key]: value })
    },
    [params, onChange]
  )

  return (
    <Card className={cn('overflow-hidden', className)}>
      <div className="h-1 bg-orange-500" />

      <CardHeader className="pb-2 pt-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded bg-orange-100 text-orange-700">
            <Link2 className="h-4 w-4" />
          </div>
          <h3 className="font-semibold text-sm">New Dependency</h3>
        </div>
      </CardHeader>

      <CardContent className="space-y-3 pb-3">
        {/* Visual connection */}
        <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
          <div className="flex-1 p-2 bg-background rounded border text-center">
            <span className="text-sm font-medium">
              {params.sourceName || `Item ${params.sourceId?.slice(-6)}`}
            </span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <ArrowRight className="h-4 w-4 text-muted-foreground" />
            <Badge className={cn('text-xs', connectionInfo.color)}>
              {connectionInfo.label}
            </Badge>
          </div>
          <div className="flex-1 p-2 bg-background rounded border text-center">
            <span className="text-sm font-medium">
              {params.targetName || `Item ${params.targetId?.slice(-6)}`}
            </span>
          </div>
        </div>

        {/* Connection type selector */}
        {isEditing && (
          <EditableField
            label="Connection Type"
            value={params.connectionType}
            onChange={(v) => handleChange('connectionType', v)}
            isEditing={isEditing}
            type="select"
            options={[
              { value: 'blocks', label: 'Blocks' },
              { value: 'depends_on', label: 'Depends On' },
              { value: 'related_to', label: 'Related To' },
              { value: 'duplicates', label: 'Duplicates' },
            ]}
          />
        )}

        {/* Reason */}
        <EditableField
          label="Reason"
          value={params.reason}
          onChange={(v) => handleChange('reason', v)}
          isEditing={isEditing}
          multiline
          placeholder="Why are these items linked?"
        />

        {/* Preview badge */}
        {!isEditing && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground pt-2 border-t">
            <AlertCircle className="h-3 w-3" />
            <span>Preview - This dependency will be created when you confirm</span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// =============================================================================
// TIMELINE ITEM PREVIEW
// =============================================================================

export function TimelineItemPreview({
  params,
  isEditing = false,
  onChange,
  className,
}: PreviewProps<TimelineItemParams>) {
  const timeframeInfo = timeframeLabels[params.timeframe] || timeframeLabels.short

  const handleChange = useCallback(
    (key: keyof TimelineItemParams, value: unknown) => {
      onChange?.({ ...params, [key]: value })
    },
    [params, onChange]
  )

  return (
    <Card className={cn('overflow-hidden', className)}>
      <div className={cn('h-1', timeframeInfo.color.split(' ')[0])} />

      <CardHeader className="pb-2 pt-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 flex-1">
            <div className={cn('p-1.5 rounded', timeframeInfo.color)}>
              <Calendar className="h-4 w-4" />
            </div>
            {isEditing ? (
              <Input
                value={params.name}
                onChange={(e) => handleChange('name', e.target.value)}
                className="h-8 font-semibold"
                placeholder="Timeline item name"
              />
            ) : (
              <h3 className="font-semibold text-sm">{params.name}</h3>
            )}
          </div>
          <Badge className={cn('text-xs', timeframeInfo.color)}>
            {timeframeInfo.label}
          </Badge>
        </div>

        {/* Parent work item */}
        {params.workItemName && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
            <FileText className="h-3 w-3" />
            <span>For: {params.workItemName}</span>
          </div>
        )}
      </CardHeader>

      <CardContent className="space-y-3 pb-3">
        {/* Timeframe selector */}
        {isEditing && (
          <EditableField
            label="Timeframe"
            value={params.timeframe}
            onChange={(v) => handleChange('timeframe', v)}
            isEditing={isEditing}
            type="select"
            options={[
              { value: 'mvp', label: 'MVP' },
              { value: 'short', label: 'Short-term' },
              { value: 'long', label: 'Long-term' },
            ]}
          />
        )}

        {/* Description */}
        <EditableField
          label="Description"
          value={params.description}
          onChange={(v) => handleChange('description', v)}
          isEditing={isEditing}
          multiline
          placeholder="Timeline item description"
        />

        {/* Preview badge */}
        {!isEditing && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground pt-2 border-t">
            <AlertCircle className="h-3 w-3" />
            <span>Preview - This timeline item will be created when you confirm</span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// =============================================================================
// INSIGHT PREVIEW
// =============================================================================

export function InsightPreview({
  params,
  isEditing = false,
  onChange,
  className,
}: PreviewProps<InsightParams>) {
  const sentimentColors: Record<string, string> = {
    positive: 'bg-green-100 text-green-700',
    neutral: 'bg-gray-100 text-gray-700',
    negative: 'bg-red-100 text-red-700',
  }

  const handleChange = useCallback(
    (key: keyof InsightParams, value: unknown) => {
      onChange?.({ ...params, [key]: value })
    },
    [params, onChange]
  )

  return (
    <Card className={cn('overflow-hidden', className)}>
      <div className="h-1 bg-amber-500" />

      <CardHeader className="pb-2 pt-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 flex-1">
            <div className="p-1.5 rounded bg-amber-100 text-amber-700">
              <MessageSquare className="h-4 w-4" />
            </div>
            {isEditing ? (
              <Input
                value={params.title}
                onChange={(e) => handleChange('title', e.target.value)}
                className="h-8 font-semibold"
                placeholder="Insight title"
              />
            ) : (
              <h3 className="font-semibold text-sm">{params.title}</h3>
            )}
          </div>
          {params.sentiment && (
            <Badge className={cn('text-xs', sentimentColors[params.sentiment])}>
              {params.sentiment}
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-3 pb-3">
        {/* Content */}
        <EditableField
          label="Content"
          value={params.content}
          onChange={(v) => handleChange('content', v)}
          isEditing={isEditing}
          multiline
          placeholder="What is the insight?"
        />

        {/* Source & Sentiment Row */}
        <div className="flex gap-3">
          <div className="flex-1">
            <EditableField
              label="Source"
              value={params.source}
              onChange={(v) => handleChange('source', v)}
              isEditing={isEditing}
              placeholder="Where did this come from?"
            />
          </div>
          {isEditing && (
            <div className="flex-1">
              <EditableField
                label="Sentiment"
                value={params.sentiment}
                onChange={(v) => handleChange('sentiment', v)}
                isEditing={isEditing}
                type="select"
                options={[
                  { value: 'positive', label: 'Positive' },
                  { value: 'neutral', label: 'Neutral' },
                  { value: 'negative', label: 'Negative' },
                ]}
              />
            </div>
          )}
        </div>

        {/* Linked work item */}
        {params.linkedWorkItemName && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <FileText className="h-3 w-3" />
            <span>Linked to: {params.linkedWorkItemName}</span>
          </div>
        )}

        {/* Tags */}
        {(params.tags?.length || isEditing) && (
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground flex items-center gap-1">
              <Tag className="h-3 w-3" />
              Tags
            </Label>
            {isEditing ? (
              <Input
                value={params.tags?.join(', ') || ''}
                onChange={(e) =>
                  handleChange(
                    'tags',
                    e.target.value.split(',').map((t) => t.trim()).filter(Boolean)
                  )
                }
                placeholder="tag1, tag2, tag3"
                className="h-8"
              />
            ) : (
              <div className="flex flex-wrap gap-1">
                {params.tags?.map((tag, i) => (
                  <Badge key={i} variant="secondary" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Preview badge */}
        {!isEditing && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground pt-2 border-t">
            <AlertCircle className="h-3 w-3" />
            <span>Preview - This insight will be created when you confirm</span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// =============================================================================
// PREVIEW RENDERER (Auto-selects based on tool name)
// =============================================================================

export interface ToolPreviewRendererProps {
  toolName: string
  params: Record<string, unknown>
  isEditing?: boolean
  onChange?: (params: Record<string, unknown>) => void
  className?: string
}

export function ToolPreviewRenderer({
  toolName,
  params,
  isEditing = false,
  onChange,
  className,
}: ToolPreviewRendererProps) {
  // Cast helpers to handle generic params safely
  const handleChange = <T,>(handler: ((p: T) => void) | undefined) =>
    handler ? (p: T) => handler(p) : undefined

  switch (toolName) {
    case 'createWorkItem':
      return (
        <WorkItemPreview
          params={params as unknown as WorkItemParams}
          isEditing={isEditing}
          onChange={handleChange<WorkItemParams>(onChange as unknown as ((p: WorkItemParams) => void) | undefined)}
          className={className}
        />
      )
    case 'createTask':
      return (
        <TaskPreview
          params={params as unknown as TaskParams}
          isEditing={isEditing}
          onChange={handleChange<TaskParams>(onChange as unknown as ((p: TaskParams) => void) | undefined)}
          className={className}
        />
      )
    case 'createDependency':
      return (
        <DependencyPreview
          params={params as unknown as DependencyParams}
          isEditing={isEditing}
          onChange={handleChange<DependencyParams>(onChange as unknown as ((p: DependencyParams) => void) | undefined)}
          className={className}
        />
      )
    case 'createTimelineItem':
      return (
        <TimelineItemPreview
          params={params as unknown as TimelineItemParams}
          isEditing={isEditing}
          onChange={handleChange<TimelineItemParams>(onChange as unknown as ((p: TimelineItemParams) => void) | undefined)}
          className={className}
        />
      )
    case 'createInsight':
      return (
        <InsightPreview
          params={params as unknown as InsightParams}
          isEditing={isEditing}
          onChange={handleChange<InsightParams>(onChange as unknown as ((p: InsightParams) => void) | undefined)}
          className={className}
        />
      )
    default:
      // Fallback to generic key-value display
      return null
  }
}

// =============================================================================
// EXPORTS
// =============================================================================

export type {
  WorkItemParams,
  TaskParams,
  DependencyParams,
  TimelineItemParams,
  InsightParams,
}
