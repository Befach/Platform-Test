'use client'

import { useState, useEffect, useCallback } from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Plus, Search, Filter, LayoutGrid, List, RefreshCw } from 'lucide-react'
import { TaskCard } from './task-card'
import { CreateTaskDialog } from './create-task-dialog'
import {
  ProductTaskWithRelations,
  TaskStatus,
  TaskType,
  TaskStats,
  TASK_TYPE_CONFIG,
  TASK_STATUS_CONFIG,
} from '@/lib/types/product-tasks'

interface TaskListProps {
  workspaceId: string
  teamId: string
  workItemId?: string | null // If provided, show only tasks linked to this work item (feature level)
  timelineItemId?: string | null // If provided, show only tasks linked to this timeline item (MVP/SHORT/LONG level)
  timelineItemName?: string | null // For display in create dialog
  title?: string
  showStats?: boolean
  showCreateButton?: boolean
  className?: string
}

export function TaskList({
  workspaceId,
  teamId,
  workItemId,
  timelineItemId,
  timelineItemName,
  title = 'Tasks',
  showStats = true,
  showCreateButton = true,
  className,
}: TaskListProps) {
  const [tasks, setTasks] = useState<ProductTaskWithRelations[]>([])
  const [stats, setStats] = useState<TaskStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<TaskStatus | 'all'>('all')
  const [typeFilter, setTypeFilter] = useState<TaskType | 'all'>('all')
  const [viewMode, setViewMode] = useState<'board' | 'list'>('board')
  const [createDialogOpen, setCreateDialogOpen] = useState(false)

  const fetchTasks = useCallback(async () => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams({
        workspace_id: workspaceId,
        team_id: teamId,
      })
      if (workItemId) {
        params.set('work_item_id', workItemId)
      }
      if (timelineItemId) {
        params.set('timeline_item_id', timelineItemId)
      }

      const response = await fetch(`/api/product-tasks?${params}`)
      if (!response.ok) throw new Error('Failed to fetch tasks')

      const data = await response.json()
      setTasks(data.data || [])
    } catch (error) {
      console.error('Error fetching tasks:', error)
    } finally {
      setIsLoading(false)
    }
  }, [workspaceId, teamId, workItemId, timelineItemId])

  const fetchStats = useCallback(async () => {
    if (!showStats) return
    try {
      const params = new URLSearchParams({
        workspace_id: workspaceId,
        team_id: teamId,
      })

      const response = await fetch(`/api/product-tasks/stats?${params}`)
      if (!response.ok) throw new Error('Failed to fetch stats')

      const data = await response.json()
      setStats(data.data)
    } catch (error) {
      console.error('Error fetching stats:', error)
    }
  }, [workspaceId, teamId, showStats])

  useEffect(() => {
    fetchTasks()
    fetchStats()
  }, [fetchTasks, fetchStats])

  // Filter tasks based on search and filters
  const filteredTasks = tasks.filter((task) => {
    const matchesSearch =
      !searchQuery ||
      task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.description?.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesStatus = statusFilter === 'all' || task.status === statusFilter
    const matchesType = typeFilter === 'all' || task.task_type === typeFilter

    return matchesSearch && matchesStatus && matchesType
  })

  // Group tasks by status for board view
  const tasksByStatus: Record<TaskStatus, ProductTaskWithRelations[]> = {
    todo: filteredTasks.filter((t) => t.status === 'todo'),
    in_progress: filteredTasks.filter((t) => t.status === 'in_progress'),
    done: filteredTasks.filter((t) => t.status === 'done'),
  }

  const handleTaskUpdate = () => {
    fetchTasks()
    fetchStats()
  }

  const handleStatusChange = (taskId: string, newStatus: TaskStatus) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t))
    )
    fetchStats()
  }

  const handleDelete = (taskId: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== taskId))
    fetchStats()
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold">{title}</h2>
          {stats && (
            <Badge variant="secondary">
              {stats.total} tasks ({stats.completion_percentage}% done)
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              fetchTasks()
              fetchStats()
            }}
            title="Refresh"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>

          {showCreateButton && (
            <Button onClick={() => setCreateDialogOpen(true)} size="sm">
              <Plus className="h-4 w-4 mr-1" />
              Add Task
            </Button>
          )}
        </div>
      </div>

      {/* Stats bar */}
      {showStats && stats && stats.total > 0 && (
        <div className="flex gap-4 p-3 bg-muted/50 rounded-lg">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-gray-400" />
            <span className="text-sm text-muted-foreground">
              To Do: {stats.by_status.todo}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-blue-500" />
            <span className="text-sm text-muted-foreground">
              In Progress: {stats.by_status.in_progress}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-green-500" />
            <span className="text-sm text-muted-foreground">
              Done: {stats.by_status.done}
            </span>
          </div>
          {stats.overdue_count > 0 && (
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-red-500" />
              <span className="text-sm text-red-600 font-medium">
                Overdue: {stats.overdue_count}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px] max-w-[300px]">
          <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search tasks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 h-9"
          />
        </div>

        <Select
          value={statusFilter}
          onValueChange={(v) => setStatusFilter(v as TaskStatus | 'all')}
        >
          <SelectTrigger className="w-[140px] h-9">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            {(Object.keys(TASK_STATUS_CONFIG) as TaskStatus[]).map((status) => (
              <SelectItem key={status} value={status}>
                {TASK_STATUS_CONFIG[status].label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={typeFilter}
          onValueChange={(v) => setTypeFilter(v as TaskType | 'all')}
        >
          <SelectTrigger className="w-[140px] h-9">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {(Object.keys(TASK_TYPE_CONFIG) as TaskType[]).map((type) => (
              <SelectItem key={type} value={type}>
                {TASK_TYPE_CONFIG[type].label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="flex items-center border rounded-md">
          <Button
            variant={viewMode === 'board' ? 'secondary' : 'ghost'}
            size="sm"
            className="rounded-r-none"
            onClick={() => setViewMode('board')}
          >
            <LayoutGrid className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === 'list' ? 'secondary' : 'ghost'}
            size="sm"
            className="rounded-l-none"
            onClick={() => setViewMode('list')}
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Task display */}
      {isLoading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      ) : filteredTasks.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <p>No tasks found.</p>
          {showCreateButton && (
            <Button
              variant="link"
              className="mt-2"
              onClick={() => setCreateDialogOpen(true)}
            >
              Create your first task
            </Button>
          )}
        </div>
      ) : viewMode === 'board' ? (
        /* Board view - Kanban style */
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {(Object.keys(tasksByStatus) as TaskStatus[]).map((status) => (
            <div key={status} className="space-y-3">
              <div className="flex items-center gap-2 px-2">
                <div
                  className={cn(
                    'h-2 w-2 rounded-full',
                    status === 'todo' && 'bg-gray-400',
                    status === 'in_progress' && 'bg-blue-500',
                    status === 'done' && 'bg-green-500'
                  )}
                />
                <span className="font-medium text-sm">
                  {TASK_STATUS_CONFIG[status].label}
                </span>
                <Badge variant="outline" className="ml-auto text-xs">
                  {tasksByStatus[status].length}
                </Badge>
              </div>

              <div className="space-y-2 min-h-[100px] p-2 bg-muted/30 rounded-lg">
                {tasksByStatus[status].map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onStatusChange={handleStatusChange}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* List view */
        <div className="space-y-2">
          {filteredTasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onStatusChange={handleStatusChange}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {/* Create dialog */}
      <CreateTaskDialog
        workspaceId={workspaceId}
        teamId={teamId}
        workItemId={workItemId}
        timelineItemId={timelineItemId}
        timelineItemName={timelineItemName}
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onSuccess={handleTaskUpdate}
      />
    </div>
  )
}
