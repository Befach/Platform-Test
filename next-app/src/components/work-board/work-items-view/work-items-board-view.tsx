'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
} from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import {
  GripVertical,
  Plus,
  CheckSquare,
  Sparkles,
  Bug,
  Zap,
  Lightbulb,
  StickyNote,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  WORK_ITEM_STATUSES,
  statusDisplayMap,
  typeDisplayMap,
  priorityDisplayMap,
  type WorkItemStatus,
} from '../shared/filter-context'
import { BoardColumnEmptyState } from '../shared/empty-state'
import { columnContainerVariants, boardCardVariants } from '../shared/animation-variants'

// Types
interface WorkItem {
  id: string
  name: string
  type: string
  status: string | null
  priority: string | null
  owner: string | null
  created_at: string | null
  purpose?: string | null
  [key: string]: unknown
}

interface TimelineItem {
  id: string
  work_item_id: string
  description: string | null
  timeline: string
  phase: string | null
  status: string | null
  [key: string]: unknown
}

interface WorkItemsBoardViewProps {
  workItems: WorkItem[]
  timelineItems: TimelineItem[]
  workspaceId: string
  onStatusChange?: (itemId: string, newStatus: WorkItemStatus) => Promise<void>
  onItemClick?: (item: WorkItem) => void
  onTaskCountClick?: (workItemId: string, workItemName: string) => void
  onAddItem?: (status: WorkItemStatus) => void
  taskCounts?: Record<string, number> // Map of work_item_id -> task count
  className?: string
}

// Column configuration
const columnConfig: Record<WorkItemStatus, { label: string; color: string; bgColor: string }> = {
  planned: { label: 'Planned', color: 'text-slate-600', bgColor: 'bg-slate-50' },
  in_progress: { label: 'In Progress', color: 'text-blue-600', bgColor: 'bg-blue-50' },
  completed: { label: 'Completed', color: 'text-green-600', bgColor: 'bg-green-50' },
  on_hold: { label: 'On Hold', color: 'text-orange-600', bgColor: 'bg-orange-50' },
}

// Type icon map
const typeIcons: Record<string, typeof Sparkles> = {
  feature: Sparkles,
  bug: Bug,
  concept: Lightbulb,
  note: StickyNote,
}

export function WorkItemsBoardView({
  workItems,
  timelineItems,
  workspaceId,
  onStatusChange,
  onItemClick,
  onTaskCountClick,
  onAddItem,
  taskCounts = {},
  className,
}: WorkItemsBoardViewProps) {
  const [activeId, setActiveId] = useState<string | null>(null)
  const [isMoving, setIsMoving] = useState(false)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  )

  // Group work items by status
  const columns = useMemo(() => {
    const grouped: Record<WorkItemStatus, WorkItem[]> = {
      planned: [],
      in_progress: [],
      completed: [],
      on_hold: [],
    }

    workItems.forEach((item) => {
      const status = (item.status as WorkItemStatus) || 'planned'
      if (grouped[status]) {
        grouped[status].push(item)
      } else {
        grouped.planned.push(item)
      }
    })

    return grouped
  }, [workItems])

  // Get timeline items for a work item
  const getTimelineProgress = (workItemId: string) => {
    const itemTimelines = timelineItems.filter(t => t.work_item_id === workItemId)
    if (itemTimelines.length === 0) return null

    const mvp = itemTimelines.find(t => t.timeline === 'MVP')
    const short = itemTimelines.find(t => t.timeline === 'SHORT')
    const long = itemTimelines.find(t => t.timeline === 'LONG')

    return { mvp, short, long, total: itemTimelines.length }
  }

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string)
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event

    if (!over) {
      setActiveId(null)
      return
    }

    const activeItem = workItems.find(item => item.id === active.id)
    if (!activeItem) {
      setActiveId(null)
      return
    }

    // Find which column the item was dropped on
    let targetStatus: WorkItemStatus | null = null

    // Check if dropped on a column
    if (WORK_ITEM_STATUSES.includes(over.id as WorkItemStatus)) {
      targetStatus = over.id as WorkItemStatus
    } else {
      // Find which column contains the item we dropped over
      for (const status of WORK_ITEM_STATUSES) {
        if (columns[status].some(item => item.id === over.id)) {
          targetStatus = status
          break
        }
      }
    }

    if (targetStatus && activeItem.status !== targetStatus && onStatusChange) {
      setIsMoving(true)
      try {
        await onStatusChange(activeItem.id, targetStatus)
      } catch (error) {
        console.error('Failed to move item:', error)
      } finally {
        setIsMoving(false)
      }
    }

    setActiveId(null)
  }

  const activeItem = activeId ? workItems.find(item => item.id === activeId) : null

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className={cn('grid grid-cols-4 gap-4 h-full', className)}>
        {WORK_ITEM_STATUSES.map((status) => (
          <BoardColumn
            key={status}
            status={status}
            items={columns[status]}
            timelineItems={timelineItems}
            workspaceId={workspaceId}
            getTimelineProgress={getTimelineProgress}
            onItemClick={onItemClick}
            onTaskCountClick={onTaskCountClick}
            onAddItem={onAddItem}
            taskCounts={taskCounts}
          />
        ))}
      </div>

      <DragOverlay>
        {activeItem && (
          <WorkItemCard
            item={activeItem}
            timelineProgress={getTimelineProgress(activeItem.id)}
            isDragging
          />
        )}
      </DragOverlay>

      {/* Loading overlay during move */}
      {isMoving && (
        <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-50">
          <div className="bg-background rounded-lg p-4 shadow-lg">
            <p className="text-sm">Moving item...</p>
          </div>
        </div>
      )}
    </DndContext>
  )
}

// Board Column Component
interface BoardColumnProps {
  status: WorkItemStatus
  items: WorkItem[]
  timelineItems: TimelineItem[]
  workspaceId: string
  getTimelineProgress: (workItemId: string) => { mvp?: TimelineItem; short?: TimelineItem; long?: TimelineItem; total: number } | null
  onItemClick?: (item: WorkItem) => void
  onTaskCountClick?: (workItemId: string, workItemName: string) => void
  onAddItem?: (status: WorkItemStatus) => void
  taskCounts?: Record<string, number>
}

function BoardColumn({
  status,
  items,
  timelineItems,
  workspaceId,
  getTimelineProgress,
  onItemClick,
  onTaskCountClick,
  onAddItem,
  taskCounts = {},
}: BoardColumnProps) {
  const config = columnConfig[status]

  return (
    <SortableContext
      id={status}
      items={items.map(item => item.id)}
      strategy={verticalListSortingStrategy}
    >
      <div className={cn('flex flex-col h-full rounded-lg', config.bgColor)}>
        {/* Column Header */}
        <div className={cn('flex items-center justify-between p-3 border-b', config.bgColor)}>
          <div className="flex items-center gap-2">
            <h3 className={cn('font-semibold text-sm', config.color)}>
              {config.label}
            </h3>
            <Badge variant="secondary" className="text-xs">
              {items.length}
            </Badge>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={() => onAddItem?.(status)}
            title={`Add work item to ${config.label}`}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        {/* Column Content */}
        <motion.div
          className="flex-1 p-2 space-y-2 overflow-y-auto min-h-[300px]"
          variants={columnContainerVariants}
          initial="hidden"
          animate="visible"
          key={`column-${status}-${items.length}`} // Re-animate when items change
        >
          {items.length === 0 ? (
            <BoardColumnEmptyState
              onAction={onAddItem ? () => onAddItem(status) : undefined}
              className="h-full"
            />
          ) : (
            items.map((item) => (
              <motion.div key={item.id} variants={boardCardVariants}>
                <SortableWorkItemCard
                  item={item}
                  timelineProgress={getTimelineProgress(item.id)}
                  workspaceId={workspaceId}
                  onClick={() => onItemClick?.(item)}
                  onTaskCountClick={onTaskCountClick}
                  taskCount={taskCounts[item.id] || 0}
                />
              </motion.div>
            ))
          )}
        </motion.div>
      </div>
    </SortableContext>
  )
}

// Sortable Work Item Card
interface SortableWorkItemCardProps {
  item: WorkItem
  timelineProgress: { mvp?: TimelineItem; short?: TimelineItem; long?: TimelineItem; total: number } | null
  workspaceId: string
  onClick?: () => void
  onTaskCountClick?: (workItemId: string, workItemName: string) => void
  taskCount?: number
}

function SortableWorkItemCard({ item, timelineProgress, workspaceId, onClick, onTaskCountClick, taskCount = 0 }: SortableWorkItemCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div ref={setNodeRef} style={style}>
      <WorkItemCard
        item={item}
        timelineProgress={timelineProgress}
        workspaceId={workspaceId}
        isDragging={isDragging}
        dragHandleProps={{ ...attributes, ...listeners }}
        onClick={onClick}
        onTaskCountClick={onTaskCountClick}
        taskCount={taskCount}
      />
    </div>
  )
}

// Work Item Card Component
interface WorkItemCardProps {
  item: WorkItem
  timelineProgress: { mvp?: TimelineItem; short?: TimelineItem; long?: TimelineItem; total: number } | null
  workspaceId?: string
  isDragging?: boolean
  dragHandleProps?: Record<string, unknown>
  onClick?: () => void
  onTaskCountClick?: (workItemId: string, workItemName: string) => void
  taskCount?: number
}

function WorkItemCard({
  item,
  timelineProgress,
  workspaceId,
  isDragging,
  dragHandleProps,
  onClick,
  onTaskCountClick,
  taskCount = 0,
}: WorkItemCardProps) {
  const TypeIcon = typeIcons[item.type] || Sparkles
  const typeConfig = typeDisplayMap[item.type] || { label: item.type, color: 'bg-gray-100 text-gray-700' }
  const priorityConfig = item.priority ? priorityDisplayMap[item.priority] : null

  // Calculate timeline completion
  const getTimelineStatus = (timeline?: TimelineItem) => {
    if (!timeline) return 'empty'
    if (timeline.status === 'complete') return 'complete'
    if (timeline.status === 'in_progress') return 'in_progress'
    return 'planned'
  }

  return (
    <Card
      className={cn(
        'cursor-pointer hover:shadow-md bg-background',
        // Smooth drag animation with scale and elevated shadow
        'transition-[transform,box-shadow] duration-200',
        isDragging && 'scale-[1.02] shadow-[0_14px_28px_rgba(0,0,0,0.12),0_10px_10px_rgba(0,0,0,0.08)]'
      )}
      style={{
        transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)',
      }}
      onClick={onClick}
    >
      <CardHeader className="p-3 pb-2">
        <div className="flex items-start gap-2">
          {/* Drag Handle */}
          {dragHandleProps && (
            <div
              {...dragHandleProps}
              className="cursor-grab active:cursor-grabbing p-1 hover:bg-accent rounded -ml-1"
            >
              <GripVertical className="h-4 w-4 text-muted-foreground" />
            </div>
          )}

          <div className="flex-1 min-w-0">
            {workspaceId ? (
              <Link
                href={`/workspaces/${workspaceId}/work-items/${item.id}`}
                className="text-sm font-medium line-clamp-2 hover:text-primary hover:underline transition-colors"
                onClick={(e) => e.stopPropagation()}
              >
                {item.name}
              </Link>
            ) : (
              <CardTitle className="text-sm font-medium line-clamp-2">
                {item.name}
              </CardTitle>
            )}
            {item.purpose && (
              <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                {item.purpose as string}
              </p>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-3 pt-0 space-y-2">
        {/* Type and Priority badges */}
        <div className="flex items-center gap-1 flex-wrap">
          <Badge
            variant="outline"
            className={cn('text-xs px-1.5 py-0', typeConfig.color)}
          >
            <TypeIcon className="h-3 w-3 mr-1" />
            {typeConfig.label}
          </Badge>
          {priorityConfig && (
            <Badge
              variant="outline"
              className={cn('text-xs px-1.5 py-0', priorityConfig.color)}
            >
              {priorityConfig.label}
            </Badge>
          )}
        </div>

        {/* Timeline Progress */}
        {timelineProgress && timelineProgress.total > 0 && (
          <div className="space-y-1">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <span>Timeline</span>
            </div>
            <div className="flex gap-1">
              {/* MVP */}
              <TimelineProgressPill
                label="MVP"
                status={getTimelineStatus(timelineProgress.mvp)}
              />
              {/* SHORT */}
              <TimelineProgressPill
                label="S"
                status={getTimelineStatus(timelineProgress.short)}
              />
              {/* LONG */}
              <TimelineProgressPill
                label="L"
                status={getTimelineStatus(timelineProgress.long)}
              />
            </div>
          </div>
        )}

        {/* Footer: Task count and assignee */}
        <div className="flex items-center justify-between pt-1">
          <button
            className={cn(
              'flex items-center gap-1 text-xs',
              taskCount > 0 ? 'text-blue-600 hover:text-blue-700' : 'text-muted-foreground',
              onTaskCountClick && taskCount > 0 && 'cursor-pointer hover:underline'
            )}
            onClick={(e) => {
              if (onTaskCountClick && taskCount > 0) {
                e.stopPropagation()
                onTaskCountClick(item.id, item.name)
              }
            }}
            disabled={!onTaskCountClick || taskCount === 0}
            title={taskCount > 0 ? `View ${taskCount} task${taskCount !== 1 ? 's' : ''} for "${item.name}"` : 'No tasks yet'}
          >
            <CheckSquare className="h-3 w-3" />
            <span>{taskCount} task{taskCount !== 1 ? 's' : ''}</span>
          </button>
          {item.owner && (
            <Avatar className="h-5 w-5">
              <AvatarFallback className="text-[10px]">
                {String(item.owner).slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

// Timeline Progress Pill
interface TimelineProgressPillProps {
  label: string
  status: 'empty' | 'planned' | 'in_progress' | 'complete'
}

function TimelineProgressPill({ label, status }: TimelineProgressPillProps) {
  const statusColors = {
    empty: 'bg-gray-100 text-gray-400',
    planned: 'bg-slate-100 text-slate-600',
    in_progress: 'bg-blue-100 text-blue-600',
    complete: 'bg-green-100 text-green-600',
  }

  return (
    <div
      className={cn(
        'flex-1 text-center text-[10px] font-medium py-0.5 px-1 rounded',
        statusColors[status]
      )}
    >
      {label}
    </div>
  )
}
