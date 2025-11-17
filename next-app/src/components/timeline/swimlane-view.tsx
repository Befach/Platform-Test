'use client'

import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ChevronDown, ChevronRight } from 'lucide-react'
import { format, addDays } from 'date-fns'
import { cn } from '@/lib/utils'
import { DndContext, DragEndEvent, PointerSensor, useSensor, useSensors, DragOverlay } from '@dnd-kit/core'
import { DraggableTimelineBar } from './draggable-timeline-bar'
import { ZoomLevel, TimelineWorkItem } from './timeline-view'

interface SwimlaneViewProps {
  workItems: TimelineWorkItem[]
  groupBy: 'status' | 'priority' | 'phase' | 'assignee'
  zoomLevel: ZoomLevel
  timeIntervals: Array<{ date: Date; label: string; width: number }>
  totalWidth: number
  onItemMove: (itemId: string, fromGroup: string, toGroup: string, deltaPixels?: number) => void
  getBarStyle: (item: TimelineWorkItem) => { left: string; width: string } | null
  getPhaseColor: (phase: string) => string
  getStatusColor: (status: string) => string
  criticalPathItemIds?: Set<string>
}

interface Swimlane {
  id: string
  title: string
  color: string
  items: TimelineWorkItem[]
}

export function SwimlaneView({
  workItems,
  groupBy,
  zoomLevel,
  timeIntervals,
  totalWidth,
  onItemMove,
  getBarStyle,
  getPhaseColor,
  getStatusColor,
  criticalPathItemIds = new Set(),
}: SwimlaneViewProps) {
  const [collapsedLanes, setCollapsedLanes] = useState<Set<string>>(new Set())
  const [activeId, setActiveId] = useState<string | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  )

  // Group work items into swimlanes
  const swimlanes = useMemo<Swimlane[]>(() => {
    const itemsWithDates = workItems.filter(item => item.start_date && item.end_date)
    const groups = new Map<string, TimelineWorkItem[]>()

    itemsWithDates.forEach(item => {
      let groupKey: string
      switch (groupBy) {
        case 'status':
          groupKey = item.status || 'unknown'
          break
        case 'priority':
          groupKey = item.priority || 'none'
          break
        case 'phase':
          groupKey = item.timeline_phase
          break
        case 'assignee':
          groupKey = item.assignee || 'unassigned'
          break
        default:
          groupKey = 'other'
      }

      if (!groups.has(groupKey)) {
        groups.set(groupKey, [])
      }
      groups.get(groupKey)?.push(item)
    })

    // Convert to swimlane format with colors
    const lanes: Swimlane[] = []
    groups.forEach((items, key) => {
      lanes.push({
        id: key,
        title: formatGroupTitle(key, groupBy),
        color: getGroupColor(key, groupBy),
        items,
      })
    })

    // Sort lanes by predefined order
    return lanes.sort((a, b) => {
      const order = getLaneOrder(groupBy)
      const aIndex = order.indexOf(a.id)
      const bIndex = order.indexOf(b.id)
      if (aIndex === -1 && bIndex === -1) return 0
      if (aIndex === -1) return 1
      if (bIndex === -1) return -1
      return aIndex - bIndex
    })
  }, [workItems, groupBy])

  // Format group title
  function formatGroupTitle(key: string, groupBy: string): string {
    if (groupBy === 'status') {
      const statusLabels: Record<string, string> = {
        planned: 'Planned',
        in_progress: 'In Progress',
        completed: 'Completed',
        on_hold: 'On Hold',
      }
      return statusLabels[key] || key
    }
    if (groupBy === 'phase') {
      const phaseLabels: Record<string, string> = {
        MVP: 'MVP',
        SHORT: 'Short Term',
        LONG: 'Long Term',
      }
      return phaseLabels[key] || key
    }
    if (groupBy === 'priority') {
      return key.charAt(0).toUpperCase() + key.slice(1)
    }
    return key.charAt(0).toUpperCase() + key.slice(1)
  }

  // Get color for group header
  function getGroupColor(key: string, groupBy: string): string {
    if (groupBy === 'status') {
      const statusColors: Record<string, string> = {
        planned: 'bg-gray-100 text-gray-700',
        in_progress: 'bg-blue-100 text-blue-700',
        completed: 'bg-green-100 text-green-700',
        on_hold: 'bg-orange-100 text-orange-700',
      }
      return statusColors[key] || 'bg-slate-100 text-slate-700'
    }
    if (groupBy === 'phase') {
      const phaseColors: Record<string, string> = {
        MVP: 'bg-green-100 text-green-700',
        SHORT: 'bg-blue-100 text-blue-700',
        LONG: 'bg-purple-100 text-purple-700',
      }
      return phaseColors[key] || 'bg-slate-100 text-slate-700'
    }
    if (groupBy === 'priority') {
      const priorityColors: Record<string, string> = {
        high: 'bg-red-100 text-red-700',
        medium: 'bg-yellow-100 text-yellow-700',
        low: 'bg-blue-100 text-blue-700',
        none: 'bg-gray-100 text-gray-700',
      }
      return priorityColors[key] || 'bg-slate-100 text-slate-700'
    }
    return 'bg-slate-100 text-slate-700'
  }

  // Get predefined lane order
  function getLaneOrder(groupBy: string): string[] {
    if (groupBy === 'status') {
      return ['planned', 'in_progress', 'on_hold', 'completed']
    }
    if (groupBy === 'phase') {
      return ['MVP', 'SHORT', 'LONG']
    }
    if (groupBy === 'priority') {
      return ['high', 'medium', 'low', 'none']
    }
    return []
  }

  // Toggle lane collapse
  const toggleLane = (laneId: string) => {
    setCollapsedLanes(prev => {
      const next = new Set(prev)
      if (next.has(laneId)) {
        next.delete(laneId)
      } else {
        next.add(laneId)
      }
      return next
    })
  }

  // Handle drag end
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over, delta } = event
    setActiveId(null)

    if (!over || !delta) return

    const itemId = active.id as string
    const targetLaneId = over.id as string

    // Find source lane
    const sourceLane = swimlanes.find(lane =>
      lane.items.some(item => item.id === itemId)
    )

    if (!sourceLane) return

    // If dropped on different lane, move item
    if (targetLaneId !== sourceLane.id && swimlanes.some(lane => lane.id === targetLaneId)) {
      onItemMove(itemId, sourceLane.id, targetLaneId)
    } else if (delta.x !== 0) {
      // If dragged horizontally in same lane, reschedule
      onItemMove(itemId, sourceLane.id, sourceLane.id, delta.x)
    }
  }

  const activeItem = activeId ? workItems.find(item => item.id === activeId) : null

  return (
    <DndContext sensors={sensors} onDragStart={({ active }) => setActiveId(active.id as string)} onDragEnd={handleDragEnd}>
      <div className="space-y-1">
        {swimlanes.map(lane => {
          const isCollapsed = collapsedLanes.has(lane.id)

          return (
            <Card key={lane.id} className="overflow-hidden">
              <CardHeader
                className={cn('py-2 px-4 cursor-pointer hover:opacity-80 transition-opacity', lane.color)}
                onClick={() => toggleLane(lane.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {isCollapsed ? (
                      <ChevronRight className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                    <CardTitle className="text-sm font-semibold">{lane.title}</CardTitle>
                    <Badge variant="secondary" className="text-xs">
                      {lane.items.length}
                    </Badge>
                  </div>
                </div>
              </CardHeader>

              {!isCollapsed && (
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <div className="min-w-full inline-block">
                      {/* Date Headers */}
                      <div className="sticky top-0 z-10 bg-white border-b">
                        <div className="flex">
                          <div className="w-64 flex-shrink-0 px-4 py-2 text-xs font-medium border-r bg-slate-50">
                            Work Item
                          </div>
                          <div className="flex" style={{ width: `${totalWidth}px` }}>
                            {timeIntervals.map((interval, index) => (
                              <div
                                key={index}
                                className="border-r px-2 py-2 text-xs font-medium text-center bg-slate-50"
                                style={{ width: `${interval.width}px` }}
                              >
                                {interval.label}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Work Item Rows */}
                      <div className="min-h-[60px]">
                        {lane.items.length === 0 ? (
                          <div className="flex items-center justify-center h-16 text-sm text-muted-foreground border-b">
                            No items in this swimlane
                          </div>
                        ) : (
                          lane.items.map(item => {
                            const barStyle = getBarStyle(item)

                            return (
                              <div key={item.id} className="flex border-b hover:bg-slate-50 transition-colors">
                                {/* Item Name Column */}
                                <div className="w-64 flex-shrink-0 px-4 py-2 border-r">
                                  <div className="font-medium text-xs truncate">{item.name}</div>
                                  <div className="flex items-center gap-1 mt-1">
                                    <Badge variant="outline" className={cn('text-[10px] px-1 py-0', getPhaseColor(item.timeline_phase))}>
                                      {item.timeline_phase}
                                    </Badge>
                                    {item.priority && (
                                      <span className="text-[10px] text-muted-foreground">{item.priority}</span>
                                    )}
                                  </div>
                                </div>

                                {/* Timeline Bar Column */}
                                <div className="relative py-2" style={{ width: `${totalWidth}px` }}>
                                  {barStyle && (
                                    <DraggableTimelineBar
                                      id={item.id}
                                      name={item.name}
                                      phase={item.timeline_phase}
                                      status={item.status}
                                      durationDays={item.duration_days || 0}
                                      barStyle={barStyle}
                                      phaseColor={getPhaseColor(item.timeline_phase)}
                                      statusColor={getStatusColor(item.status)}
                                      onDragEnd={() => {}} // Handled by DndContext
                                      disabled={false}
                                      isCritical={criticalPathItemIds.has(item.id)}
                                    />
                                  )}
                                </div>
                              </div>
                            )
                          })
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              )}
            </Card>
          )
        })}
      </div>

      {/* Drag Overlay */}
      <DragOverlay>
        {activeItem && activeId ? (
          <div className="bg-white rounded-lg shadow-xl border-2 border-primary p-2">
            <div className="font-medium text-sm">{activeItem.name}</div>
            <div className="text-xs text-muted-foreground">{activeItem.timeline_phase}</div>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  )
}
