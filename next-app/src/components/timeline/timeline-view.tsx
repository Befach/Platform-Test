'use client'

import { useState, useMemo, useRef, useCallback, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { useToast } from '@/hooks/use-toast'
import { Search, Zap } from 'lucide-react'
import { format, startOfQuarter, endOfQuarter, eachDayOfInterval, eachWeekOfInterval, eachMonthOfInterval, addDays, addMonths } from 'date-fns'
import { cn } from '@/lib/utils'
import { DndContext, DragEndEvent, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import { DraggableTimelineBar } from './draggable-timeline-bar'
import { DependencyArrows } from './dependency-arrows'
import { SwimlaneView } from './swimlane-view'
import { TimelineMinimap } from './timeline-minimap'
import { getCriticalPathItems } from '@/lib/utils/critical-path'

export type ZoomLevel = 'day' | 'week' | 'month' | 'quarter'

export interface TimelineWorkItem {
  id: string
  name: string
  timeline_phase: 'MVP' | 'SHORT' | 'LONG'
  status: string
  priority?: string
  start_date?: string
  end_date?: string
  duration_days?: number
  dependencies: Array<{ targetId: string; type: string }>
  assignee?: string
  team?: string
}

interface TimelineViewProps {
  workItems: TimelineWorkItem[]
  workspaceId: string
  teamId: string
  currentUserId: string
}

export function TimelineView({ workItems: initialWorkItems, workspaceId, teamId, currentUserId }: TimelineViewProps) {
  const [workItems, setWorkItems] = useState(initialWorkItems)
  const { toast } = useToast()

  const [zoomLevel, setZoomLevel] = useState<ZoomLevel>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('timeline-zoom-level') as ZoomLevel) || 'month'
    }
    return 'month'
  })

  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [phaseFilter, setPhaseFilter] = useState<string>('all')
  const [viewMode, setViewMode] = useState<'gantt' | 'swimlane'>('gantt')
  const [groupBy, setGroupBy] = useState<'status' | 'priority' | 'phase' | 'assignee'>('status')
  const [showCriticalPath, setShowCriticalPath] = useState(false)
  const [scrollLeft, setScrollLeft] = useState(0)
  const [containerWidth, setContainerWidth] = useState(0)

  // Refs for tracking bar positions (for dependency arrows)
  const barRefs = useRef<Map<string, HTMLDivElement>>(new Map())
  const containerRef = useRef<HTMLDivElement>(null)
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  // Calculate critical path
  const criticalPathItemIds = useMemo(() => {
    if (!showCriticalPath) return new Set<string>()
    return new Set(getCriticalPathItems(workItems))
  }, [workItems, showCriticalPath])

  // Drag sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // 8px movement required to start drag
      },
    })
  )

  // Get bar position for dependency arrows
  const getBarPosition = useCallback((itemId: string) => {
    const barElement = barRefs.current.get(itemId)
    const container = containerRef.current

    if (!barElement || !container) return null

    const barRect = barElement.getBoundingClientRect()
    const containerRect = container.getBoundingClientRect()

    return {
      x: barRect.left - containerRect.left + (containerRect.left < 0 ? Math.abs(containerRect.left) : 0),
      y: barRect.top - containerRect.top,
      width: barRect.width,
      height: barRect.height,
    }
  }, [])

  // Persist zoom level
  const handleZoomChange = (level: ZoomLevel) => {
    setZoomLevel(level)
    if (typeof window !== 'undefined') {
      localStorage.setItem('timeline-zoom-level', level)
    }
  }

  // Track scroll position for minimap
  useEffect(() => {
    const scrollContainer = scrollContainerRef.current
    if (!scrollContainer) return

    const handleScroll = () => {
      setScrollLeft(scrollContainer.scrollLeft)
    }

    const updateContainerWidth = () => {
      setContainerWidth(scrollContainer.clientWidth)
    }

    handleScroll()
    updateContainerWidth()

    scrollContainer.addEventListener('scroll', handleScroll)
    window.addEventListener('resize', updateContainerWidth)

    return () => {
      scrollContainer.removeEventListener('scroll', handleScroll)
      window.removeEventListener('resize', updateContainerWidth)
    }
  }, [])

  // Scroll to position from minimap
  const handleScrollTo = useCallback((position: number) => {
    const scrollContainer = scrollContainerRef.current
    if (!scrollContainer) return

    scrollContainer.scrollTo({
      left: position,
      behavior: 'smooth',
    })
  }, [])

  // Filter work items
  const filteredWorkItems = useMemo(() => {
    return workItems.filter((item) => {
      const matchesSearch = !searchQuery || item.name.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesStatus = statusFilter === 'all' || item.status === statusFilter
      const matchesPhase = phaseFilter === 'all' || item.timeline_phase === phaseFilter

      return matchesSearch && matchesStatus && matchesPhase
    })
  }, [workItems, searchQuery, statusFilter, phaseFilter])

  // Calculate date range from work items
  const dateRange = useMemo(() => {
    const itemsWithDates = filteredWorkItems.filter(item => item.start_date && item.end_date)

    if (itemsWithDates.length === 0) {
      // Default to current quarter
      const now = new Date()
      return {
        start: startOfQuarter(now),
        end: endOfQuarter(now),
      }
    }

    const startDates = itemsWithDates.map(item => new Date(item.start_date!))
    const endDates = itemsWithDates.map(item => new Date(item.end_date!))

    const minDate = new Date(Math.min(...startDates.map(d => d.getTime())))
    const maxDate = new Date(Math.max(...endDates.map(d => d.getTime())))

    // Add some padding
    return {
      start: addDays(minDate, -7),
      end: addDays(maxDate, 7),
    }
  }, [filteredWorkItems])

  // Generate time intervals based on zoom level
  const timeIntervals = useMemo(() => {
    switch (zoomLevel) {
      case 'day':
        return eachDayOfInterval(dateRange).map(date => ({
          date,
          label: format(date, 'MMM d'),
          width: 80, // pixels per day
        }))
      case 'week':
        return eachWeekOfInterval(dateRange).map(date => ({
          date,
          label: format(date, 'MMM d'),
          width: 100, // pixels per week
        }))
      case 'month':
        return eachMonthOfInterval(dateRange).map(date => ({
          date,
          label: format(date, 'MMM yyyy'),
          width: 120, // pixels per month
        }))
      case 'quarter':
        const quarters = []
        let current = startOfQuarter(dateRange.start)
        while (current <= dateRange.end) {
          quarters.push({
            date: current,
            label: `Q${Math.floor(current.getMonth() / 3) + 1} ${format(current, 'yyyy')}`,
            width: 200, // pixels per quarter
          })
          current = addMonths(current, 3)
        }
        return quarters
      default:
        return []
    }
  }, [dateRange, zoomLevel])

  const totalWidth = timeIntervals.reduce((sum, interval) => sum + interval.width, 0)

  // Calculate position and width for a work item bar
  const getBarStyle = (item: TimelineWorkItem) => {
    if (!item.start_date || !item.end_date) return null

    const start = new Date(item.start_date)
    const end = new Date(item.end_date)

    // Find starting position
    let leftPosition = 0
    for (const interval of timeIntervals) {
      if (start >= interval.date) {
        leftPosition += interval.width
      } else {
        break
      }
    }

    // Calculate width based on duration
    const durationMs = end.getTime() - start.getTime()
    const durationDays = Math.ceil(durationMs / (1000 * 60 * 60 * 24))
    const pixelsPerDay = zoomLevel === 'day' ? 80 : zoomLevel === 'week' ? 14 : zoomLevel === 'month' ? 4 : 1.5
    const barWidth = durationDays * pixelsPerDay

    return {
      left: `${leftPosition}px`,
      width: `${Math.max(barWidth, 40)}px`, // Minimum 40px width
    }
  }

  // Get color based on timeline phase
  const getPhaseColor = (phase: string) => {
    switch (phase) {
      case 'MVP':
        return 'bg-green-500'
      case 'SHORT':
        return 'bg-blue-500'
      case 'LONG':
        return 'bg-purple-500'
      default:
        return 'bg-gray-400'
    }
  }

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'border-green-600'
      case 'in_progress':
        return 'border-blue-600'
      case 'planned':
        return 'border-gray-400'
      case 'on_hold':
        return 'border-orange-600'
      default:
        return 'border-gray-300'
    }
  }

  // Get pixels per day based on zoom level
  const getPixelsPerDay = () => {
    switch (zoomLevel) {
      case 'day':
        return 80
      case 'week':
        return 14 // 100px per week / 7 days
      case 'month':
        return 4 // 120px per month / 30 days (approx)
      case 'quarter':
        return 1.5 // 200px per quarter / ~90 days (approx)
      default:
        return 4
    }
  }

  // Handle drag end - calculate new dates and update
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, delta } = event

    if (!delta || delta.x === 0) return

    const itemId = active.id as string
    const item = workItems.find(i => i.id === itemId)

    if (!item || !item.start_date || !item.end_date) return

    // Calculate date shift
    const pixelsPerDay = getPixelsPerDay()
    const daysDelta = Math.round(delta.x / pixelsPerDay)

    if (daysDelta === 0) return

    // Calculate new dates
    const oldStartDate = new Date(item.start_date)
    const oldEndDate = new Date(item.end_date)
    const newStartDate = addDays(oldStartDate, daysDelta)
    const newEndDate = addDays(oldEndDate, daysDelta)

    // Optimistic update
    setWorkItems(prev =>
      prev.map(i =>
        i.id === itemId
          ? {
              ...i,
              start_date: format(newStartDate, 'yyyy-MM-dd'),
              end_date: format(newEndDate, 'yyyy-MM-dd'),
            }
          : i
      )
    )

    // API call
    try {
      const response = await fetch(`/api/work-items/${itemId}/dates`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          start_date: format(newStartDate, 'yyyy-MM-dd'),
          end_date: format(newEndDate, 'yyyy-MM-dd'),
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to update dates')
      }

      const updatedItem = await response.json()

      // Update with server response
      setWorkItems(prev =>
        prev.map(i => (i.id === itemId ? { ...i, ...updatedItem } : i))
      )

      toast({
        title: 'Dates updated',
        description: `${item.name} rescheduled by ${Math.abs(daysDelta)} day${Math.abs(daysDelta) > 1 ? 's' : ''}`,
      })
    } catch (error: any) {
      // Rollback on error
      setWorkItems(prev =>
        prev.map(i =>
          i.id === itemId
            ? {
                ...i,
                start_date: item.start_date,
                end_date: item.end_date,
              }
            : i
        )
      )

      toast({
        title: 'Error',
        description: error.message || 'Failed to update dates',
        variant: 'destructive',
      })
    }
  }

  // Handle swimlane item move - change status/priority/phase when dragging between lanes
  const handleSwimlaneItemMove = async (
    itemId: string,
    fromGroup: string,
    toGroup: string,
    deltaPixels?: number
  ) => {
    const item = workItems.find(i => i.id === itemId)
    if (!item) return

    // If deltaPixels provided, it's a horizontal drag (date reschedule)
    if (deltaPixels && deltaPixels !== 0 && item.start_date && item.end_date) {
      const pixelsPerDay = getPixelsPerDay()
      const daysDelta = Math.round(deltaPixels / pixelsPerDay)

      if (daysDelta === 0) return

      const oldStartDate = new Date(item.start_date)
      const oldEndDate = new Date(item.end_date)
      const newStartDate = addDays(oldStartDate, daysDelta)
      const newEndDate = addDays(oldEndDate, daysDelta)

      // Optimistic update
      setWorkItems(prev =>
        prev.map(i =>
          i.id === itemId
            ? {
                ...i,
                start_date: format(newStartDate, 'yyyy-MM-dd'),
                end_date: format(newEndDate, 'yyyy-MM-dd'),
              }
            : i
        )
      )

      try {
        const response = await fetch(`/api/work-items/${itemId}/dates`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            start_date: format(newStartDate, 'yyyy-MM-dd'),
            end_date: format(newEndDate, 'yyyy-MM-dd'),
          }),
        })

        if (!response.ok) throw new Error('Failed to update dates')

        const updatedItem = await response.json()
        setWorkItems(prev =>
          prev.map(i => (i.id === itemId ? { ...i, ...updatedItem } : i))
        )

        toast({
          title: 'Dates updated',
          description: `${item.name} rescheduled by ${Math.abs(daysDelta)} day${Math.abs(daysDelta) > 1 ? 's' : ''}`,
        })
      } catch (error: any) {
        // Rollback
        setWorkItems(prev =>
          prev.map(i =>
            i.id === itemId
              ? { ...i, start_date: item.start_date, end_date: item.end_date }
              : i
          )
        )

        toast({
          title: 'Error',
          description: error.message || 'Failed to update dates',
          variant: 'destructive',
        })
      }

      return
    }

    // Vertical drag - change group (status/priority/phase/assignee)
    if (fromGroup === toGroup) return // No change

    // Determine which field to update based on groupBy
    const updateField = groupBy === 'status' ? 'status'
                      : groupBy === 'priority' ? 'priority'
                      : groupBy === 'phase' ? 'timeline_phase'
                      : groupBy === 'assignee' ? 'assignee'
                      : null

    if (!updateField) return

    const oldValue = (item as any)[updateField]

    // Optimistic update
    setWorkItems(prev =>
      prev.map(i => (i.id === itemId ? { ...i, [updateField]: toGroup } : i))
    )

    try {
      const response = await fetch(`/api/work-items/${itemId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [updateField]: toGroup }),
      })

      if (!response.ok) throw new Error(`Failed to update ${groupBy}`)

      const updatedItem = await response.json()
      setWorkItems(prev =>
        prev.map(i => (i.id === itemId ? { ...i, ...updatedItem } : i))
      )

      toast({
        title: `${groupBy.charAt(0).toUpperCase() + groupBy.slice(1)} updated`,
        description: `${item.name} moved to ${toGroup}`,
      })
    } catch (error: any) {
      // Rollback
      setWorkItems(prev =>
        prev.map(i => (i.id === itemId ? { ...i, [updateField]: oldValue } : i))
      )

      toast({
        title: 'Error',
        description: error.message || `Failed to update ${groupBy}`,
        variant: 'destructive',
      })
    }
  }

  const itemsWithDates = filteredWorkItems.filter(item => item.start_date && item.end_date)
  const itemsWithoutDates = filteredWorkItems.filter(item => !item.start_date || !item.end_date)

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      <div className="space-y-6">
        {/* Toolbar */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div>
                <CardTitle>Timeline {viewMode === 'gantt' ? 'Gantt Chart' : 'Swimlane View'}</CardTitle>
                <CardDescription>
                  {viewMode === 'gantt'
                    ? 'Drag work items to reschedule dates'
                    : `Grouped by ${groupBy} - drag to move between groups`}
                </CardDescription>
              </div>

              <div className="flex items-center gap-3">
                {/* View Mode Toggle */}
                <div className="flex items-center gap-1 p-1 bg-muted rounded-lg">
                  <Button
                    size="sm"
                    variant={viewMode === 'gantt' ? 'default' : 'ghost'}
                    onClick={() => setViewMode('gantt')}
                    className="text-xs h-7"
                  >
                    Gantt
                  </Button>
                  <Button
                    size="sm"
                    variant={viewMode === 'swimlane' ? 'default' : 'ghost'}
                    onClick={() => setViewMode('swimlane')}
                    className="text-xs h-7"
                  >
                    Swimlane
                  </Button>
                </div>

                {/* Zoom Controls */}
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant={zoomLevel === 'day' ? 'default' : 'outline'}
                    onClick={() => handleZoomChange('day')}
                  >
                    Day
                  </Button>
                  <Button
                    size="sm"
                    variant={zoomLevel === 'week' ? 'default' : 'outline'}
                    onClick={() => handleZoomChange('week')}
                  >
                    Week
                  </Button>
                  <Button
                    size="sm"
                    variant={zoomLevel === 'month' ? 'default' : 'outline'}
                    onClick={() => handleZoomChange('month')}
                  >
                    Month
                  </Button>
                  <Button
                    size="sm"
                    variant={zoomLevel === 'quarter' ? 'default' : 'outline'}
                    onClick={() => handleZoomChange('quarter')}
                  >
                    Quarter
                  </Button>
                </div>

                {/* Critical Path Toggle */}
                <Button
                  size="sm"
                  variant={showCriticalPath ? 'default' : 'outline'}
                  onClick={() => setShowCriticalPath(!showCriticalPath)}
                  className="gap-2"
                >
                  <Zap className="h-4 w-4" />
                  Critical Path
                </Button>
              </div>
            </div>
          </CardHeader>

          <CardContent>
            <div className="flex items-center gap-4">
              {/* Search */}
              <div className="relative flex-1 max-w-xs">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search work items..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Status Filter */}
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="planned">Planned</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="on_hold">On Hold</SelectItem>
                </SelectContent>
              </Select>

              {/* Phase Filter */}
              <Select value={phaseFilter} onValueChange={setPhaseFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by phase" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Phases</SelectItem>
                  <SelectItem value="MVP">MVP</SelectItem>
                  <SelectItem value="SHORT">Short Term</SelectItem>
                  <SelectItem value="LONG">Long Term</SelectItem>
                </SelectContent>
              </Select>

              {/* Group By (Swimlane Mode Only) */}
              {viewMode === 'swimlane' && (
                <Select value={groupBy} onValueChange={(value: any) => setGroupBy(value)}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Group by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="status">Group by Status</SelectItem>
                    <SelectItem value="phase">Group by Phase</SelectItem>
                    <SelectItem value="priority">Group by Priority</SelectItem>
                    <SelectItem value="assignee">Group by Assignee</SelectItem>
                  </SelectContent>
                </Select>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Mini-map Navigation */}
        {itemsWithDates.length > 0 && viewMode === 'gantt' && (
          <div className="flex justify-end mb-4">
            <TimelineMinimap
              totalWidth={totalWidth}
              containerWidth={containerWidth}
              scrollLeft={scrollLeft}
              onScrollTo={handleScrollTo}
              workItems={itemsWithDates.map((item) => ({
                id: item.id,
                name: item.name,
                barStyle: getBarStyle(item)!,
              }))}
            />
          </div>
        )}

        {/* Timeline View - Gantt or Swimlane */}
        {itemsWithDates.length > 0 ? (
          viewMode === 'gantt' ? (
            /* Gantt Chart View */
            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto" ref={scrollContainerRef}>
                  <div className="min-w-full inline-block relative" ref={containerRef}>
                    {/* Date Headers */}
                    <div className="sticky top-0 z-10 bg-white border-b">
                      <div className="flex">
                        <div className="w-64 flex-shrink-0 px-4 py-3 font-semibold border-r bg-slate-50">
                          Work Item
                        </div>
                        <div className="flex" style={{ width: `${totalWidth}px` }}>
                          {timeIntervals.map((interval, index) => (
                            <div
                              key={index}
                              className="border-r px-2 py-3 text-sm font-medium text-center bg-slate-50"
                              style={{ width: `${interval.width}px` }}
                            >
                              {interval.label}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Work Item Rows */}
                    <div>
                      {itemsWithDates.map((item) => {
                        const barStyle = getBarStyle(item)

                        return (
                          <div key={item.id} className="flex border-b hover:bg-slate-50 transition-colors">
                            {/* Item Name Column */}
                            <div className="w-64 flex-shrink-0 px-4 py-3 border-r">
                              <div className="font-medium text-sm truncate">{item.name}</div>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge variant="outline" className={cn('text-xs', getPhaseColor(item.timeline_phase))}>
                                  {item.timeline_phase}
                                </Badge>
                                {item.priority && (
                                  <span className="text-xs text-muted-foreground">{item.priority}</span>
                                )}
                              </div>
                            </div>

                            {/* Timeline Bar Column */}
                            <div className="relative py-3" style={{ width: `${totalWidth}px` }}>
                              {barStyle && (
                                <div
                                  ref={(el) => {
                                    if (el) barRefs.current.set(item.id, el)
                                  }}
                                >
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
                                </div>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>

                    {/* Dependency Arrows Overlay */}
                    <DependencyArrows
                      workItems={itemsWithDates}
                      getBarPosition={getBarPosition}
                      containerWidth={totalWidth + 256} // Add left column width
                      containerHeight={itemsWithDates.length * 56} // Approximate row height
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            /* Swimlane View */
            <SwimlaneView
              workItems={itemsWithDates}
              groupBy={groupBy}
              zoomLevel={zoomLevel}
              timeIntervals={timeIntervals}
              totalWidth={totalWidth}
              onItemMove={handleSwimlaneItemMove}
              getBarStyle={getBarStyle}
              getPhaseColor={getPhaseColor}
              getStatusColor={getStatusColor}
              criticalPathItemIds={criticalPathItemIds}
            />
          )
        ) : (
          <Card>
            <CardContent className="py-12">
              <div className="text-center">
                <div className="text-6xl mb-4">📅</div>
                <h3 className="text-lg font-semibold mb-2">No timeline data yet</h3>
                <p className="text-muted-foreground mb-4">
                  Work items need start and end dates to appear on the timeline
                </p>
                {itemsWithoutDates.length > 0 && (
                  <p className="text-sm text-muted-foreground">
                    {itemsWithoutDates.length} work item{itemsWithoutDates.length > 1 ? 's' : ''} without dates
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Items Without Dates */}
        {itemsWithoutDates.length > 0 && itemsWithDates.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Unscheduled Items</CardTitle>
              <CardDescription>These items don't have start/end dates set</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {itemsWithoutDates.map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <div className="font-medium text-sm">{item.name}</div>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-xs">{item.timeline_phase}</Badge>
                        <span className="text-xs text-muted-foreground">{item.status}</span>
                      </div>
                    </div>
                    <Button size="sm" variant="outline">
                      Set Dates
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DndContext>
  )
}
