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
  type: 'concept' | 'feature' | 'bug'
  purpose?: string
  priority?: 'critical' | 'high' | 'medium' | 'low'
  tags?: string[]
  phase?: string
  is_enhancement?: boolean
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
// PREMIUM STYLE CONSTANTS
// =============================================================================

/**
 * Premium glassmorphism card wrapper styles
 */
export const premiumCardStyles = {
  base: cn(
    // Glassmorphism effect
    'relative overflow-hidden rounded-xl',
    'bg-gradient-to-br from-background/95 via-background/90 to-background/80',
    'backdrop-blur-xl',
    // Border with subtle glow
    'border border-white/10',
    // Shadow
    'shadow-lg shadow-black/5',
    // Hover effect
    'transition-all duration-300',
    'hover:shadow-xl hover:scale-[1.01]',
    'hover:border-white/20'
  ),
}

/**
 * Category-specific premium styles
 */
const categoryStyles = {
  creation: {
    gradient: 'from-emerald-500/10 via-green-500/5 to-transparent',
    border: 'border-emerald-500/30',
    glow: 'shadow-emerald-500/10',
    iconBg: 'bg-gradient-to-br from-emerald-500/20 to-green-500/10',
    iconColor: 'text-emerald-400',
    accentBar: 'bg-gradient-to-r from-emerald-500 to-green-500',
  },
  analysis: {
    gradient: 'from-blue-500/10 via-cyan-500/5 to-transparent',
    border: 'border-blue-500/30',
    glow: 'shadow-blue-500/10',
    iconBg: 'bg-gradient-to-br from-blue-500/20 to-cyan-500/10',
    iconColor: 'text-blue-400',
    accentBar: 'bg-gradient-to-r from-blue-500 to-cyan-500',
  },
  optimization: {
    gradient: 'from-amber-500/10 via-orange-500/5 to-transparent',
    border: 'border-amber-500/30',
    glow: 'shadow-amber-500/10',
    iconBg: 'bg-gradient-to-br from-amber-500/20 to-orange-500/10',
    iconColor: 'text-amber-400',
    accentBar: 'bg-gradient-to-r from-amber-500 to-orange-500',
  },
  strategy: {
    gradient: 'from-purple-500/10 via-violet-500/5 to-transparent',
    border: 'border-purple-500/30',
    glow: 'shadow-purple-500/10',
    iconBg: 'bg-gradient-to-br from-purple-500/20 to-violet-500/10',
    iconColor: 'text-purple-400',
    accentBar: 'bg-gradient-to-r from-purple-500 to-violet-500',
  },
}

// =============================================================================
// HELPER COMPONENTS
// =============================================================================

const typeIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  concept: Lightbulb,
  feature: Sparkles,
  bug: Bug,
}

/**
 * Premium type styles with gradients
 */
const typeStyles = {
  concept: {
    iconBg: 'bg-gradient-to-br from-purple-500/20 to-violet-500/10 border border-purple-500/30',
    iconColor: 'text-purple-400',
    accentBar: 'bg-gradient-to-r from-purple-500 to-violet-500',
    badgeClass: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
  },
  feature: {
    iconBg: 'bg-gradient-to-br from-blue-500/20 to-cyan-500/10 border border-blue-500/30',
    iconColor: 'text-blue-400',
    accentBar: 'bg-gradient-to-r from-blue-500 to-cyan-500',
    badgeClass: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
  },
  bug: {
    iconBg: 'bg-gradient-to-br from-red-500/20 to-rose-500/10 border border-red-500/30',
    iconColor: 'text-red-400',
    accentBar: 'bg-gradient-to-r from-red-500 to-rose-500',
    badgeClass: 'bg-red-500/10 text-red-400 border-red-500/30',
  },
}

// Legacy flat colors (for backward compatibility)
const typeColors: Record<string, string> = {
  concept: 'bg-purple-100 text-purple-700 border-purple-200',
  feature: 'bg-blue-100 text-blue-700 border-blue-200',
  bug: 'bg-red-100 text-red-700 border-red-200',
}

/**
 * Premium priority styles with gradients and glows
 */
const priorityStyles = {
  critical: {
    badge: 'bg-gradient-to-r from-red-500 to-rose-500 text-white shadow-sm shadow-red-500/30',
    glow: 'shadow-red-500/20',
  },
  high: {
    badge: 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-sm shadow-orange-500/30',
    glow: 'shadow-orange-500/20',
  },
  medium: {
    badge: 'bg-gradient-to-r from-yellow-500 to-amber-400 text-black shadow-sm shadow-yellow-500/30',
    glow: 'shadow-yellow-500/20',
  },
  low: {
    badge: 'bg-gradient-to-r from-slate-400 to-zinc-400 text-white shadow-sm shadow-slate-500/20',
    glow: 'shadow-slate-500/20',
  },
}

// Legacy flat priority colors (for backward compatibility)
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
  const styles = typeStyles[params.type] || typeStyles.feature
  const prioStyles = params.priority ? priorityStyles[params.priority] : null

  const handleChange = useCallback(
    (key: keyof WorkItemParams, value: unknown) => {
      onChange?.({ ...params, [key]: value })
    },
    [params, onChange]
  )

  return (
    <div
      className={cn(
        // Premium glassmorphism card
        'relative overflow-hidden rounded-xl',
        'bg-gradient-to-br from-background/95 via-background/90 to-background/80',
        'backdrop-blur-xl',
        'border border-white/10',
        'shadow-lg shadow-black/5',
        'transition-all duration-300',
        'hover:shadow-xl hover:scale-[1.01]',
        'hover:border-white/20',
        prioStyles?.glow,
        className
      )}
    >
      {/* Premium gradient accent bar */}
      <div className={cn('h-1 w-full', styles.accentBar)} />

      {/* Subtle gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent pointer-events-none" />

      <CardHeader className="relative pb-2 pt-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 flex-1">
            {/* Premium icon with glow */}
            <div className={cn('p-2 rounded-lg', styles.iconBg)}>
              <IconComponent className={cn('h-4 w-4', styles.iconColor)} />
            </div>
            {isEditing ? (
              <Input
                value={params.name}
                onChange={(e) => handleChange('name', e.target.value)}
                className="h-8 font-semibold bg-background/50 border-white/10 focus:border-primary/50"
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

      <CardContent className="relative space-y-3 pb-3">
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

        {/* Tags with premium pill badges */}
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
                className="h-8 bg-background/50 border-white/10"
              />
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {params.tags?.map((tag, i) => (
                  <Badge
                    key={i}
                    variant="outline"
                    className="text-xs px-2 py-0.5 bg-white/5 border-white/10 hover:bg-white/10 transition-colors"
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Preview badge with premium styling */}
        {!isEditing && (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground pt-2 border-t border-white/5">
            <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
            <span>Preview - This will be created when you confirm</span>
          </div>
        )}
      </CardContent>
    </div>
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
  const prioStyles = params.priority ? priorityStyles[params.priority] : null

  const handleChange = useCallback(
    (key: keyof TaskParams, value: unknown) => {
      onChange?.({ ...params, [key]: value })
    },
    [params, onChange]
  )

  return (
    <div
      className={cn(
        // Premium glassmorphism card
        'relative overflow-hidden rounded-xl',
        'bg-gradient-to-br from-background/95 via-background/90 to-background/80',
        'backdrop-blur-xl',
        'border border-white/10',
        'shadow-lg shadow-black/5',
        'transition-all duration-300',
        'hover:shadow-xl hover:scale-[1.01]',
        'hover:border-white/20',
        prioStyles?.glow,
        className
      )}
    >
      {/* Premium gradient accent bar */}
      <div className="h-1 w-full bg-gradient-to-r from-blue-500 to-cyan-500" />

      {/* Subtle gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-cyan-500/5 pointer-events-none" />

      <CardHeader className="relative pb-2 pt-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 flex-1">
            {/* Premium icon */}
            <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500/20 to-cyan-500/10 border border-blue-500/30">
              <CheckSquare className="h-4 w-4 text-blue-400" />
            </div>
            {isEditing ? (
              <Input
                value={params.name}
                onChange={(e) => handleChange('name', e.target.value)}
                className="h-8 font-semibold bg-background/50 border-white/10"
                placeholder="Task name"
              />
            ) : (
              <h3 className="font-semibold text-sm">{params.name}</h3>
            )}
          </div>
          {params.priority && prioStyles && (
            <Badge className={cn('text-xs', prioStyles.badge)}>
              {params.priority}
            </Badge>
          )}
        </div>

        {/* Parent work item */}
        {params.workItemName && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1.5">
            <FileText className="h-3 w-3" />
            <span>For: {params.workItemName}</span>
          </div>
        )}
      </CardHeader>

      <CardContent className="relative space-y-3 pb-3">
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
              <div className="flex items-center gap-1.5 text-sm">
                <div className="p-1 rounded bg-white/5">
                  <User className="h-3 w-3 text-muted-foreground" />
                </div>
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
                  className="h-8 bg-background/50 border-white/10"
                />
              </div>
            ) : params.dueDate ? (
              <div className="flex items-center gap-1.5 text-sm">
                <div className="p-1 rounded bg-white/5">
                  <Clock className="h-3 w-3 text-muted-foreground" />
                </div>
                <span>{new Date(params.dueDate).toLocaleDateString()}</span>
              </div>
            ) : null}
          </div>
        </div>

        {/* Preview badge */}
        {!isEditing && (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground pt-2 border-t border-white/5">
            <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
            <span>Preview - This task will be created when you confirm</span>
          </div>
        )}
      </CardContent>
    </div>
  )
}

// =============================================================================
// DEPENDENCY PREVIEW
// =============================================================================

/**
 * Premium connection type styles
 */
const connectionStyles = {
  blocks: {
    badge: 'bg-red-500/10 text-red-400 border-red-500/30',
    glow: 'shadow-red-500/10',
    accentBar: 'bg-gradient-to-r from-red-500 to-rose-500',
  },
  depends_on: {
    badge: 'bg-orange-500/10 text-orange-400 border-orange-500/30',
    glow: 'shadow-orange-500/10',
    accentBar: 'bg-gradient-to-r from-orange-500 to-amber-500',
  },
  related_to: {
    badge: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
    glow: 'shadow-blue-500/10',
    accentBar: 'bg-gradient-to-r from-blue-500 to-cyan-500',
  },
  duplicates: {
    badge: 'bg-slate-500/10 text-slate-400 border-slate-500/30',
    glow: 'shadow-slate-500/10',
    accentBar: 'bg-gradient-to-r from-slate-500 to-zinc-500',
  },
}

export function DependencyPreview({
  params,
  isEditing = false,
  onChange,
  className,
}: PreviewProps<DependencyParams>) {
  const connectionInfo = connectionLabels[params.connectionType] || connectionLabels.related_to
  const connStyles = connectionStyles[params.connectionType] || connectionStyles.related_to

  const handleChange = useCallback(
    (key: keyof DependencyParams, value: unknown) => {
      onChange?.({ ...params, [key]: value })
    },
    [params, onChange]
  )

  return (
    <div
      className={cn(
        // Premium glassmorphism card
        'relative overflow-hidden rounded-xl',
        'bg-gradient-to-br from-background/95 via-background/90 to-background/80',
        'backdrop-blur-xl',
        'border border-white/10',
        'shadow-lg shadow-black/5',
        'transition-all duration-300',
        'hover:shadow-xl hover:scale-[1.01]',
        'hover:border-white/20',
        connStyles.glow,
        className
      )}
    >
      {/* Premium gradient accent bar */}
      <div className={cn('h-1 w-full', connStyles.accentBar)} />

      {/* Subtle gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 via-transparent to-orange-500/5 pointer-events-none" />

      <CardHeader className="relative pb-2 pt-3">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-gradient-to-br from-amber-500/20 to-orange-500/10 border border-amber-500/30">
            <Link2 className="h-4 w-4 text-amber-400" />
          </div>
          <h3 className="font-semibold text-sm">New Dependency</h3>
        </div>
      </CardHeader>

      <CardContent className="relative space-y-3 pb-3">
        {/* Premium visual connection */}
        <div className="flex items-center gap-2 p-3 bg-white/5 rounded-lg border border-white/10">
          <div className="flex-1 p-2.5 bg-background/50 rounded-lg border border-white/10 text-center">
            <span className="text-sm font-medium">
              {params.sourceName || `Item ${params.sourceId?.slice(-6)}`}
            </span>
          </div>
          <div className="flex flex-col items-center gap-1.5">
            <ArrowRight className="h-4 w-4 text-amber-400" />
            <Badge variant="outline" className={cn('text-xs', connStyles.badge)}>
              {connectionInfo.label}
            </Badge>
          </div>
          <div className="flex-1 p-2.5 bg-background/50 rounded-lg border border-white/10 text-center">
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
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground pt-2 border-t border-white/5">
            <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
            <span>Preview - This dependency will be created when you confirm</span>
          </div>
        )}
      </CardContent>
    </div>
  )
}

// =============================================================================
// TIMELINE ITEM PREVIEW
// =============================================================================

/**
 * Premium timeframe styles
 */
const timeframeStyles = {
  mvp: {
    iconBg: 'bg-gradient-to-br from-emerald-500/20 to-green-500/10 border border-emerald-500/30',
    iconColor: 'text-emerald-400',
    badge: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    accentBar: 'bg-gradient-to-r from-emerald-500 to-green-500',
  },
  short: {
    iconBg: 'bg-gradient-to-br from-blue-500/20 to-cyan-500/10 border border-blue-500/30',
    iconColor: 'text-blue-400',
    badge: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
    accentBar: 'bg-gradient-to-r from-blue-500 to-cyan-500',
  },
  long: {
    iconBg: 'bg-gradient-to-br from-purple-500/20 to-violet-500/10 border border-purple-500/30',
    iconColor: 'text-purple-400',
    badge: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
    accentBar: 'bg-gradient-to-r from-purple-500 to-violet-500',
  },
}

export function TimelineItemPreview({
  params,
  isEditing = false,
  onChange,
  className,
}: PreviewProps<TimelineItemParams>) {
  const timeframeInfo = timeframeLabels[params.timeframe] || timeframeLabels.short
  const tfStyles = timeframeStyles[params.timeframe] || timeframeStyles.short

  const handleChange = useCallback(
    (key: keyof TimelineItemParams, value: unknown) => {
      onChange?.({ ...params, [key]: value })
    },
    [params, onChange]
  )

  return (
    <div
      className={cn(
        // Premium glassmorphism card
        'relative overflow-hidden rounded-xl',
        'bg-gradient-to-br from-background/95 via-background/90 to-background/80',
        'backdrop-blur-xl',
        'border border-white/10',
        'shadow-lg shadow-black/5',
        'transition-all duration-300',
        'hover:shadow-xl hover:scale-[1.01]',
        'hover:border-white/20',
        className
      )}
    >
      {/* Premium gradient accent bar */}
      <div className={cn('h-1 w-full', tfStyles.accentBar)} />

      {/* Subtle gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent pointer-events-none" />

      <CardHeader className="relative pb-2 pt-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 flex-1">
            <div className={cn('p-2 rounded-lg', tfStyles.iconBg)}>
              <Calendar className={cn('h-4 w-4', tfStyles.iconColor)} />
            </div>
            {isEditing ? (
              <Input
                value={params.name}
                onChange={(e) => handleChange('name', e.target.value)}
                className="h-8 font-semibold bg-background/50 border-white/10"
                placeholder="Timeline item name"
              />
            ) : (
              <h3 className="font-semibold text-sm">{params.name}</h3>
            )}
          </div>
          <Badge variant="outline" className={cn('text-xs', tfStyles.badge)}>
            {timeframeInfo.label}
          </Badge>
        </div>

        {/* Parent work item */}
        {params.workItemName && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1.5">
            <FileText className="h-3 w-3" />
            <span>For: {params.workItemName}</span>
          </div>
        )}
      </CardHeader>

      <CardContent className="relative space-y-3 pb-3">
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
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground pt-2 border-t border-white/5">
            <div className={cn('w-1.5 h-1.5 rounded-full animate-pulse', tfStyles.iconColor.replace('text-', 'bg-'))} />
            <span>Preview - This timeline item will be created when you confirm</span>
          </div>
        )}
      </CardContent>
    </div>
  )
}

// =============================================================================
// INSIGHT PREVIEW
// =============================================================================

/**
 * Premium sentiment styles with gradients and glows
 */
const sentimentStyles = {
  positive: {
    iconBg: 'bg-gradient-to-br from-emerald-500/20 to-green-500/10 border border-emerald-500/30',
    iconColor: 'text-emerald-400',
    badge: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    accentBar: 'bg-gradient-to-r from-emerald-500 to-green-500',
    glow: 'shadow-emerald-500/10',
    overlay: 'from-emerald-500/5 via-transparent to-green-500/5',
    pulseColor: 'bg-emerald-500',
  },
  neutral: {
    iconBg: 'bg-gradient-to-br from-slate-500/20 to-zinc-500/10 border border-slate-500/30',
    iconColor: 'text-slate-400',
    badge: 'bg-slate-500/10 text-slate-400 border-slate-500/30',
    accentBar: 'bg-gradient-to-r from-slate-500 to-zinc-500',
    glow: 'shadow-slate-500/10',
    overlay: 'from-slate-500/5 via-transparent to-zinc-500/5',
    pulseColor: 'bg-slate-500',
  },
  negative: {
    iconBg: 'bg-gradient-to-br from-red-500/20 to-rose-500/10 border border-red-500/30',
    iconColor: 'text-red-400',
    badge: 'bg-red-500/10 text-red-400 border-red-500/30',
    accentBar: 'bg-gradient-to-r from-red-500 to-rose-500',
    glow: 'shadow-red-500/10',
    overlay: 'from-red-500/5 via-transparent to-rose-500/5',
    pulseColor: 'bg-red-500',
  },
}

// Default style when no sentiment is set (amber/insight color)
const defaultInsightStyle = {
  iconBg: 'bg-gradient-to-br from-amber-500/20 to-orange-500/10 border border-amber-500/30',
  iconColor: 'text-amber-400',
  badge: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
  accentBar: 'bg-gradient-to-r from-amber-500 to-orange-500',
  glow: 'shadow-amber-500/10',
  overlay: 'from-amber-500/5 via-transparent to-orange-500/5',
  pulseColor: 'bg-amber-500',
}

export function InsightPreview({
  params,
  isEditing = false,
  onChange,
  className,
}: PreviewProps<InsightParams>) {
  // Get styles based on sentiment, or default amber style
  const styles = params.sentiment
    ? sentimentStyles[params.sentiment]
    : defaultInsightStyle

  const handleChange = useCallback(
    (key: keyof InsightParams, value: unknown) => {
      onChange?.({ ...params, [key]: value })
    },
    [params, onChange]
  )

  return (
    <div
      className={cn(
        // Premium glassmorphism card
        'relative overflow-hidden rounded-xl',
        'bg-gradient-to-br from-background/95 via-background/90 to-background/80',
        'backdrop-blur-xl',
        'border border-white/10',
        'shadow-lg shadow-black/5',
        'transition-all duration-300',
        'hover:shadow-xl hover:scale-[1.01]',
        'hover:border-white/20',
        styles.glow,
        className
      )}
    >
      {/* Premium gradient accent bar */}
      <div className={cn('h-1 w-full', styles.accentBar)} />

      {/* Subtle gradient overlay */}
      <div className={cn('absolute inset-0 bg-gradient-to-br pointer-events-none', styles.overlay)} />

      <CardHeader className="relative pb-2 pt-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 flex-1">
            {/* Premium icon with gradient */}
            <div className={cn('p-2 rounded-lg', styles.iconBg)}>
              <MessageSquare className={cn('h-4 w-4', styles.iconColor)} />
            </div>
            {isEditing ? (
              <Input
                value={params.title}
                onChange={(e) => handleChange('title', e.target.value)}
                className="h-8 font-semibold bg-background/50 border-white/10 focus:border-primary/50"
                placeholder="Insight title"
              />
            ) : (
              <h3 className="font-semibold text-sm">{params.title}</h3>
            )}
          </div>
          {params.sentiment && (
            <Badge variant="outline" className={cn('text-xs', styles.badge)}>
              {params.sentiment}
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="relative space-y-3 pb-3">
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
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground p-2 bg-white/5 rounded-lg border border-white/10">
            <FileText className="h-3 w-3" />
            <span>Linked to: <span className="font-medium">{params.linkedWorkItemName}</span></span>
          </div>
        )}

        {/* Tags with premium pill badges */}
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
                className="h-8 bg-background/50 border-white/10"
              />
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {params.tags?.map((tag, i) => (
                  <Badge
                    key={i}
                    variant="outline"
                    className="text-xs px-2 py-0.5 bg-white/5 border-white/10 hover:bg-white/10 transition-colors"
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Preview badge with animated indicator */}
        {!isEditing && (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground pt-2 border-t border-white/5">
            <div className={cn('w-1.5 h-1.5 rounded-full animate-pulse', styles.pulseColor)} />
            <span>Preview - This insight will be created when you confirm</span>
          </div>
        )}
      </CardContent>
    </div>
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
