'use client'

import { useState, useMemo, Fragment } from 'react'
import Link from 'next/link'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  ChevronRight,
  ChevronDown,
  MoreHorizontal,
  Sparkles,
  Bug,
  Zap,
  Lightbulb,
  StickyNote,
  // Priority icons
  AlertTriangle,
  ArrowUp,
  Minus,
  ArrowDown,
  // Status icons
  Circle,
  Clock,
  CheckCircle2,
  PauseCircle,
  CircleDot,
  // Link icon
  ExternalLink,
  Link2,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  statusDisplayMap,
  typeDisplayMap,
  priorityDisplayMap,
  timelineDisplayMap,
  type TimelineType,
  type WorkItemStatus,
  TIMELINE_TYPES,
} from '../shared/filter-context'
import { WorkItemContextMenu } from './work-item-context-menu'
import { WorkItemsEmptyState } from '../shared/empty-state'

// Types
interface WorkItem {
  id: string
  name: string
  type: string
  status: string | null
  priority: string | null
  owner: string | null
  created_at: string | null
  implementation_approach?: string | null
  purpose?: string | null
  tags?: string[]
  [key: string]: unknown
}

interface TimelineItem {
  id: string
  work_item_id: string
  description: string | null
  timeline: string
  phase: string | null
  status: string | null
  links?: string[]
  [key: string]: unknown
}

interface NestedWorkItemsTableProps {
  workItems: WorkItem[]
  timelineItems: TimelineItem[]
  workspaceId: string
  columnVisibility?: Record<string, boolean>
  onStatusChange?: (itemId: string, newStatus: WorkItemStatus) => Promise<void>
  onEditWorkItem?: (item: WorkItem) => void
  onDeleteWorkItem?: (item: WorkItem) => void
  onConvertToTimeline?: (item: WorkItem) => void
  onEditTimelineItem?: (item: TimelineItem) => void
  onDeleteTimelineItem?: (item: TimelineItem) => void
  onAddItem?: () => void
  onClearFilters?: () => void
  hasActiveFilters?: boolean
  className?: string
}

// Type icon map
const typeIcons: Record<string, typeof Sparkles> = {
  feature: Sparkles,
  bug: Bug,
  concept: Lightbulb,
  note: StickyNote,
}

// Priority icon map (Notion-style)
const priorityIcons: Record<string, typeof AlertTriangle> = {
  critical: AlertTriangle,
  high: ArrowUp,
  medium: Minus,
  low: ArrowDown,
}

// Status icon map
const statusIcons: Record<string, typeof Circle> = {
  planned: Circle,
  in_progress: Clock,
  completed: CheckCircle2,
  on_hold: PauseCircle,
  todo: CircleDot,
  done: CheckCircle2,
}

// Timeline order for display
const TIMELINE_ORDER: TimelineType[] = ['MVP', 'SHORT', 'LONG']

// Default columns matching context defaults
const DEFAULT_COLUMNS = {
  // Work Item Level (merged/rowspan) - LEFT side
  owner: true,
  priority: true,
  tags: true,
  // Timeline Item Level (per-row) - RIGHT side
  timeline: true,
  status: true,
  notes: true,
  links: true,
}

// Max tags to show before overflow
const MAX_VISIBLE_TAGS = 2

export function NestedWorkItemsTable({
  workItems,
  timelineItems,
  workspaceId,
  columnVisibility = DEFAULT_COLUMNS,
  onStatusChange,
  onEditWorkItem,
  onDeleteWorkItem,
  onConvertToTimeline,
  onEditTimelineItem,
  onDeleteTimelineItem,
  onAddItem,
  onClearFilters,
  hasActiveFilters = false,
  className,
}: NestedWorkItemsTableProps) {
  // Global expand/collapse state - single boolean controls all items
  const [isAllExpanded, setIsAllExpanded] = useState(false)

  // Toggle all expand/collapse
  const toggleAllExpanded = () => setIsAllExpanded(prev => !prev)

  // Group timeline items by work item
  const timelinesByWorkItem = useMemo(() => {
    const grouped: Record<string, TimelineItem[]> = {}

    timelineItems.forEach(item => {
      if (!grouped[item.work_item_id]) {
        grouped[item.work_item_id] = []
      }
      grouped[item.work_item_id].push(item)
    })

    // Sort timelines within each group by TIMELINE_ORDER
    Object.keys(grouped).forEach(workItemId => {
      grouped[workItemId].sort((a, b) => {
        const aIndex = TIMELINE_ORDER.indexOf(a.timeline as TimelineType)
        const bIndex = TIMELINE_ORDER.indexOf(b.timeline as TimelineType)
        return aIndex - bIndex
      })
    })

    return grouped
  }, [timelineItems, workItems])

  // Check if column is visible
  const isVisible = (col: string) => columnVisibility[col] !== false

  // Get type icon component
  const TypeIcon = (type: string) => typeIcons[type] || Sparkles

  // Render status badge with icon (Notion-style)
  const renderStatusBadge = (status: string | null) => {
    if (!status) return <span className="text-muted-foreground text-xs">-</span>
    const config = statusDisplayMap[status]
    const StatusIcon = statusIcons[status] || Circle
    if (!config) return <Badge variant="outline">{status}</Badge>
    return (
      <Badge variant="outline" className={cn('text-xs gap-1', config.color)}>
        <StatusIcon className="h-3 w-3" />
        {config.label}
      </Badge>
    )
  }

  // Render priority badge with icon (Notion-style: icon + colored badge)
  const renderPriorityBadge = (priority: string | null) => {
    if (!priority) return <span className="text-muted-foreground text-xs">-</span>
    const config = priorityDisplayMap[priority]
    const PriorityIcon = priorityIcons[priority] || Minus
    if (!config) return <Badge variant="outline">{priority}</Badge>
    return (
      <Badge variant="outline" className={cn('text-xs gap-1', config.color)}>
        <PriorityIcon className="h-3 w-3" />
        {config.label}
      </Badge>
    )
  }

  // Render tags with overflow (Notion-style: show N tags + "+X more")
  const renderTagsBadges = (tags: string[] | undefined) => {
    if (!tags || tags.length === 0) {
      return <span className="text-muted-foreground text-xs">-</span>
    }

    const visibleTags = tags.slice(0, MAX_VISIBLE_TAGS)
    const overflowCount = tags.length - MAX_VISIBLE_TAGS

    return (
      <div className="flex flex-wrap items-center gap-1">
        {visibleTags.map((tag, index) => (
          <Badge
            key={index}
            variant="secondary"
            className="text-[10px] px-1.5 py-0 h-5 font-normal"
          >
            {tag}
          </Badge>
        ))}
        {overflowCount > 0 && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Badge
                  variant="outline"
                  className="text-[10px] px-1.5 py-0 h-5 font-normal cursor-help"
                >
                  +{overflowCount}
                </Badge>
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-[200px]">
                <div className="flex flex-wrap gap-1">
                  {tags.slice(MAX_VISIBLE_TAGS).map((tag, index) => (
                    <Badge key={index} variant="secondary" className="text-[10px]">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>
    )
  }

  // Render links for timeline items
  const renderLinks = (links: string[] | undefined) => {
    if (!links || links.length === 0) {
      return <span className="text-muted-foreground text-xs">-</span>
    }

    return (
      <div className="flex items-center gap-1">
        {links.slice(0, 2).map((link, index) => (
          <a
            key={index}
            href={link}
            target="_blank"
            rel="noopener noreferrer"
            className="text-muted-foreground hover:text-primary transition-colors"
            title={link}
          >
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        ))}
        {links.length > 2 && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="text-[10px] text-muted-foreground cursor-help">
                  +{links.length - 2}
                </span>
              </TooltipTrigger>
              <TooltipContent side="top">
                <div className="flex flex-col gap-1 text-xs">
                  {links.slice(2).map((link, index) => (
                    <a
                      key={index}
                      href={link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-400 hover:underline flex items-center gap-1"
                    >
                      <Link2 className="h-3 w-3" />
                      {new URL(link).hostname}
                    </a>
                  ))}
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>
    )
  }

  // Render timeline badge
  const renderTimelineBadge = (timeline: string) => {
    const config = timelineDisplayMap[timeline as TimelineType]
    if (!config) return <Badge variant="outline">{timeline}</Badge>
    return (
      <Badge variant="outline" className={cn('text-xs font-medium', config.color)}>
        {config.label}
      </Badge>
    )
  }

  // Render owner avatar
  const renderOwner = (owner: string | null) => {
    if (!owner) return <span className="text-muted-foreground text-xs">-</span>
    return (
      <Avatar className="h-6 w-6">
        <AvatarFallback className="text-[10px] bg-primary/10">
          {owner.slice(0, 2).toUpperCase()}
        </AvatarFallback>
      </Avatar>
    )
  }

  // Calculate visible column count for empty state colspan
  // Base columns: work item (1) + actions (1) = 2
  // + visible columns from columnVisibility
  const visibleColumnCount = Object.entries(columnVisibility).filter(([_, visible]) => visible).length
  const totalColspan = 2 + visibleColumnCount

  return (
    <div className={cn('relative w-full', className)}>
      {/* Expand/Collapse toggle - positioned to the left of the table */}
      <Button
        variant="ghost"
        size="sm"
        className="absolute -left-8 top-2 h-6 w-6 p-0"
        onClick={toggleAllExpanded}
        title={isAllExpanded ? 'Collapse all' : 'Expand all'}
      >
        {isAllExpanded ? (
          <ChevronDown className="h-4 w-4" />
        ) : (
          <ChevronRight className="h-4 w-4" />
        )}
      </Button>

      {/* Table */}
      <div className="rounded-md border">
        <Table className="w-full table-fixed">
          <TableHeader>
            <TableRow className="bg-muted/50">
              {/* Work Item column - always visible */}
              <TableHead className="min-w-[200px] pl-4">Work Item</TableHead>

            {/* === WORK ITEM LEVEL COLUMNS (LEFT) - Merged/Rowspan === */}

            {/* Owner column */}
            {isVisible('owner') && (
              <TableHead className="w-[80px]">Owner</TableHead>
            )}

            {/* Priority column (NEW) */}
            {isVisible('priority') && (
              <TableHead className="w-[100px]">Priority</TableHead>
            )}

            {/* Tags column (NEW) */}
            {isVisible('tags') && (
              <TableHead className="w-[150px]">Tags</TableHead>
            )}

            {/* === TIMELINE ITEM LEVEL COLUMNS (RIGHT) - Per Row === */}

            {/* Timeline column */}
            {isVisible('timeline') && (
              <TableHead className="w-[100px]">Timeline</TableHead>
            )}

            {/* Status column */}
            {isVisible('status') && (
              <TableHead className="w-[120px]">Status</TableHead>
            )}

            {/* Notes column (implementation_approach / description) */}
            {isVisible('notes') && (
              <TableHead className="min-w-[180px]">Notes</TableHead>
            )}

            {/* Links column (NEW) */}
            {isVisible('links') && (
              <TableHead className="w-[80px]">Links</TableHead>
            )}

            {/* Actions column */}
            <TableHead className="w-10"></TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {workItems.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={totalColspan}
                className="p-0"
              >
                <WorkItemsEmptyState
                  hasFilters={hasActiveFilters}
                  onAction={onAddItem}
                  onClearFilters={onClearFilters}
                />
              </TableCell>
            </TableRow>
          ) : (
            workItems.map(workItem => {
              const timelines = timelinesByWorkItem[workItem.id] || []
              const hasTimelines = timelines.length > 0
              const rowSpan = isAllExpanded && hasTimelines ? timelines.length : 1
              const IconComponent = TypeIcon(workItem.type)

              // If no timelines or collapsed, render a single row
              if (!hasTimelines || !isAllExpanded) {
                return (
                  <TableRow key={workItem.id} className="group hover:bg-muted/50">
                    {/* Work Item name - always visible, clickable link to detail page */}
                    <TableCell className="py-2 pl-4">
                      <div className="flex items-center gap-2">
                        <IconComponent className="h-4 w-4 text-muted-foreground shrink-0" />
                        <Link
                          href={`/workspaces/${workspaceId}/work-items/${workItem.id}`}
                          className="font-medium text-foreground hover:text-primary hover:underline transition-colors"
                        >
                          {workItem.name}
                        </Link>
                      </div>
                    </TableCell>

                    {/* === WORK ITEM LEVEL (LEFT) === */}

                    {/* Owner */}
                    {isVisible('owner') && (
                      <TableCell className="py-2">
                        {renderOwner(workItem.owner)}
                      </TableCell>
                    )}

                    {/* Priority (NEW) */}
                    {isVisible('priority') && (
                      <TableCell className="py-2">
                        {renderPriorityBadge(workItem.priority)}
                      </TableCell>
                    )}

                    {/* Tags (NEW) */}
                    {isVisible('tags') && (
                      <TableCell className="py-2">
                        {renderTagsBadges(workItem.tags)}
                      </TableCell>
                    )}

                    {/* === TIMELINE ITEM LEVEL (RIGHT) === */}

                    {/* Timeline */}
                    {isVisible('timeline') && (
                      <TableCell className="py-2">
                        {hasTimelines ? (
                          <div className="flex gap-1">
                            {timelines.slice(0, 3).map(t => (
                              <div
                                key={t.timeline}
                                className={cn(
                                  'w-2 h-2 rounded-full',
                                  t.timeline === 'MVP' && 'bg-purple-500',
                                  t.timeline === 'SHORT' && 'bg-blue-500',
                                  t.timeline === 'LONG' && 'bg-teal-500'
                                )}
                                title={t.timeline}
                              />
                            ))}
                          </div>
                        ) : (
                          <Badge variant="secondary" className="text-[10px]">
                            Standard
                          </Badge>
                        )}
                      </TableCell>
                    )}

                    {/* Status */}
                    {isVisible('status') && (
                      <TableCell className="py-2">
                        {renderStatusBadge(workItem.status)}
                      </TableCell>
                    )}

                    {/* Notes */}
                    {isVisible('notes') && (
                      <TableCell className="py-2">
                        <span className="text-sm text-muted-foreground line-clamp-1">
                          {(workItem.implementation_approach as string) || workItem.purpose || '-'}
                        </span>
                      </TableCell>
                    )}

                    {/* Links (NEW) - Show dash for collapsed view */}
                    {isVisible('links') && (
                      <TableCell className="py-2">
                        <span className="text-muted-foreground text-xs">-</span>
                      </TableCell>
                    )}

                    {/* Actions */}
                    <TableCell className="py-2">
                      <WorkItemContextMenu
                        workItem={workItem}
                        hasTimelines={hasTimelines}
                        onEdit={() => onEditWorkItem?.(workItem)}
                        onDelete={() => onDeleteWorkItem?.(workItem)}
                        onConvertToTimeline={() => onConvertToTimeline?.(workItem)}
                      />
                    </TableCell>
                  </TableRow>
                )
              }

              // Expanded state with timelines - render multiple rows
              return (
                <Fragment key={workItem.id}>
                  {timelines.map((timeline, index) => (
                    <TableRow
                      key={timeline.id}
                      className={cn(
                        'group hover:bg-muted/50',
                        index === 0 && 'border-t-2',
                        index === timelines.length - 1 && 'border-b'
                      )}
                    >
                      {/* Work Item name - rowspan merged, always visible, clickable link */}
                      {index === 0 ? (
                        <TableCell className="py-2 pl-4 align-top" rowSpan={rowSpan}>
                          <div className="flex items-start gap-2">
                            <IconComponent className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                            <Link
                              href={`/workspaces/${workspaceId}/work-items/${workItem.id}`}
                              className="font-medium text-foreground hover:text-primary hover:underline transition-colors"
                            >
                              {workItem.name}
                            </Link>
                          </div>
                        </TableCell>
                      ) : null}

                      {/* === WORK ITEM LEVEL (LEFT) - Merged === */}

                      {/* Owner - rowspan merged */}
                      {index === 0 && isVisible('owner') ? (
                        <TableCell className="py-2 align-top" rowSpan={rowSpan}>
                          {renderOwner(workItem.owner)}
                        </TableCell>
                      ) : null}

                      {/* Priority - rowspan merged (NEW) */}
                      {index === 0 && isVisible('priority') ? (
                        <TableCell className="py-2 align-top" rowSpan={rowSpan}>
                          {renderPriorityBadge(workItem.priority)}
                        </TableCell>
                      ) : null}

                      {/* Tags - rowspan merged (NEW) */}
                      {index === 0 && isVisible('tags') ? (
                        <TableCell className="py-2 align-top" rowSpan={rowSpan}>
                          {renderTagsBadges(workItem.tags)}
                        </TableCell>
                      ) : null}

                      {/* === TIMELINE ITEM LEVEL (RIGHT) - Per Row === */}

                      {/* Timeline - shows each timeline item */}
                      {isVisible('timeline') && (
                        <TableCell className="py-2">
                          {renderTimelineBadge(timeline.timeline)}
                        </TableCell>
                      )}

                      {/* Status - shows timeline status */}
                      {isVisible('status') && (
                        <TableCell className="py-2">
                          {renderStatusBadge(timeline.status)}
                        </TableCell>
                      )}

                      {/* Notes - shows timeline description */}
                      {isVisible('notes') && (
                        <TableCell className="py-2">
                          <span className="text-sm line-clamp-1">{timeline.description || '-'}</span>
                        </TableCell>
                      )}

                      {/* Links - per timeline row (NEW) */}
                      {isVisible('links') && (
                        <TableCell className="py-2">
                          {renderLinks(timeline.links)}
                        </TableCell>
                      )}

                      {/* Actions - context menu for work item on first row, timeline on others */}
                      <TableCell className="py-2">
                        {index === 0 ? (
                          <WorkItemContextMenu
                            workItem={workItem}
                            hasTimelines={hasTimelines}
                            onEdit={() => onEditWorkItem?.(workItem)}
                            onDelete={() => onDeleteWorkItem?.(workItem)}
                            onConvertToTimeline={() => onConvertToTimeline?.(workItem)}
                          />
                        ) : (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100"
                            onClick={() => onEditTimelineItem?.(timeline)}
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </Fragment>
              )
            })
          )}
        </TableBody>
      </Table>
      </div>
    </div>
  )
}

export type { WorkItem, TimelineItem, NestedWorkItemsTableProps }
