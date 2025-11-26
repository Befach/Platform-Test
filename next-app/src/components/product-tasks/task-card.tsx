'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useToast } from '@/hooks/use-toast'
import {
  MoreHorizontal,
  Calendar,
  Clock,
  Link2,
  Trash2,
  Edit,
  CheckCircle,
  Circle,
  Loader2,
  ArrowUp,
  ArrowDown,
  Minus,
  AlertTriangle,
  Target,
} from 'lucide-react'
import {
  ProductTaskWithRelations,
  TaskStatus,
  TaskPriority,
  TASK_TYPE_CONFIG,
  TASK_STATUS_CONFIG,
  TASK_PRIORITY_CONFIG,
} from '@/lib/types/product-tasks'

interface TaskCardProps {
  task: ProductTaskWithRelations
  onEdit?: (task: ProductTaskWithRelations) => void
  onDelete?: (taskId: string) => void
  onStatusChange?: (taskId: string, newStatus: TaskStatus) => void
}

const priorityIcons: Record<TaskPriority, React.ComponentType<{ className?: string }>> = {
  low: ArrowDown,
  medium: Minus,
  high: ArrowUp,
  critical: AlertTriangle,
}

const statusIcons: Record<TaskStatus, React.ComponentType<{ className?: string }>> = {
  todo: Circle,
  in_progress: Clock,
  done: CheckCircle,
}

export function TaskCard({ task, onEdit, onDelete, onStatusChange }: TaskCardProps) {
  const { toast } = useToast()
  const [isUpdating, setIsUpdating] = useState(false)

  const typeConfig = TASK_TYPE_CONFIG[task.task_type]
  const statusConfig = TASK_STATUS_CONFIG[task.status]
  const priorityConfig = TASK_PRIORITY_CONFIG[task.priority]
  const StatusIcon = statusIcons[task.status]
  const PriorityIcon = priorityIcons[task.priority]

  const isOverdue = task.due_date && new Date(task.due_date) < new Date() && task.status !== 'done'

  const handleStatusChange = async (newStatus: TaskStatus) => {
    if (newStatus === task.status) return

    setIsUpdating(true)
    try {
      const response = await fetch(`/api/product-tasks/${task.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })

      if (!response.ok) {
        throw new Error('Failed to update status')
      }

      toast({
        title: 'Status updated',
        description: `Task moved to ${TASK_STATUS_CONFIG[newStatus].label}`,
      })

      onStatusChange?.(task.id, newStatus)
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update task status',
        variant: 'destructive',
      })
    } finally {
      setIsUpdating(false)
    }
  }

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this task?')) return

    try {
      const response = await fetch(`/api/product-tasks/${task.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete task')
      }

      toast({
        title: 'Task deleted',
        description: 'The task has been removed.',
      })

      onDelete?.(task.id)
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete task',
        variant: 'destructive',
      })
    }
  }

  const formatDueDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffDays = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

    if (diffDays < 0) return `${Math.abs(diffDays)}d overdue`
    if (diffDays === 0) return 'Due today'
    if (diffDays === 1) return 'Due tomorrow'
    if (diffDays <= 7) return `Due in ${diffDays}d`
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  return (
    <Card
      className={cn(
        'group transition-all hover:shadow-md',
        task.status === 'done' && 'opacity-60',
        isOverdue && 'border-red-300'
      )}
    >
      <CardHeader className="p-3 pb-0">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <button
              onClick={() => {
                const nextStatus: Record<TaskStatus, TaskStatus> = {
                  todo: 'in_progress',
                  in_progress: 'done',
                  done: 'todo',
                }
                handleStatusChange(nextStatus[task.status])
              }}
              disabled={isUpdating}
              className="flex-shrink-0 hover:scale-110 transition-transform"
              title={`Mark as ${task.status === 'done' ? 'todo' : task.status === 'todo' ? 'in progress' : 'done'}`}
            >
              {isUpdating ? (
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              ) : (
                <StatusIcon
                  className={cn(
                    'h-5 w-5',
                    task.status === 'done' && 'text-green-500',
                    task.status === 'in_progress' && 'text-blue-500',
                    task.status === 'todo' && 'text-gray-400'
                  )}
                />
              )}
            </button>
            <h3
              className={cn(
                'font-medium text-sm truncate',
                task.status === 'done' && 'line-through text-muted-foreground'
              )}
              title={task.title}
            >
              {task.title}
            </h3>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100"
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit?.(task)}>
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => handleStatusChange('todo')}>
                <Circle className="mr-2 h-4 w-4" />
                Mark as To Do
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleStatusChange('in_progress')}>
                <Clock className="mr-2 h-4 w-4" />
                Mark as In Progress
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleStatusChange('done')}>
                <CheckCircle className="mr-2 h-4 w-4" />
                Mark as Done
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleDelete} className="text-red-600">
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>

      <CardContent className="p-3 pt-2">
        {task.description && (
          <p className="text-xs text-muted-foreground line-clamp-2 mb-2">{task.description}</p>
        )}

        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline" className={cn('text-xs', typeConfig.color)}>
            {typeConfig.label}
          </Badge>

          <div className="flex items-center gap-1" title={`Priority: ${priorityConfig.label}`}>
            <PriorityIcon className={cn('h-3 w-3', priorityConfig.color)} />
          </div>

          {task.work_item && (
            <Badge variant="secondary" className="text-xs gap-1">
              <Link2 className="h-3 w-3" />
              {task.work_item.name}
            </Badge>
          )}

          {task.timeline_item && (
            <Badge variant="outline" className="text-xs gap-1 bg-violet-50 text-violet-700 border-violet-200">
              <Target className="h-3 w-3" />
              {task.timeline_item.timeframe?.toUpperCase() || 'Timeline'}
            </Badge>
          )}

          {task.due_date && (
            <div
              className={cn(
                'flex items-center gap-1 text-xs',
                isOverdue ? 'text-red-600 font-medium' : 'text-muted-foreground'
              )}
            >
              <Calendar className="h-3 w-3" />
              {formatDueDate(task.due_date)}
            </div>
          )}

          {task.estimated_hours && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              {task.estimated_hours}h
            </div>
          )}
        </div>

        {task.assigned_user && (
          <div className="flex items-center gap-2 mt-2 pt-2 border-t">
            <Avatar className="h-5 w-5">
              <AvatarImage src={task.assigned_user.avatar_url || ''} />
              <AvatarFallback className="text-[10px]">
                {task.assigned_user.name?.[0] || task.assigned_user.email[0].toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <span className="text-xs text-muted-foreground truncate">
              {task.assigned_user.name || task.assigned_user.email}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
