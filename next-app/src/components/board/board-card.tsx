'use client'

import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical, Calendar, User, Flag } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'

interface BoardCardProps {
  id: string
  title: string
  description?: string | null
  priority?: string
  status?: string
  dueDate?: string | null
  assignee?: {
    name: string
    avatar?: string
  } | null
  type?: string
  selected?: boolean
  onSelect?: (id: string, selected: boolean) => void
}

const priorityColors = {
  high: 'bg-red-100 text-red-700 border-red-300',
  medium: 'bg-yellow-100 text-yellow-700 border-yellow-300',
  low: 'bg-green-100 text-green-700 border-green-300',
}

export function BoardCard({
  id,
  title,
  description,
  priority,
  status,
  dueDate,
  assignee,
  type,
  selected = false,
  onSelect,
}: BoardCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={cn(
        'cursor-pointer hover:shadow-md transition-all',
        isDragging && 'opacity-50 shadow-lg',
        selected && 'ring-2 ring-blue-500'
      )}
      onClick={(e) => {
        if (e.ctrlKey || e.metaKey) {
          onSelect?.(id, !selected)
        }
      }}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start gap-2">
          {/* Drag Handle */}
          <div
            {...attributes}
            {...listeners}
            className="cursor-grab active:cursor-grabbing p-1 hover:bg-accent rounded"
          >
            <GripVertical className="h-4 w-4 text-muted-foreground" />
          </div>

          {/* Checkbox for multi-select */}
          <input
            type="checkbox"
            checked={selected}
            onChange={(e) => {
              e.stopPropagation()
              onSelect?.(id, e.target.checked)
            }}
            className="mt-1 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />

          <div className="flex-1 min-w-0">
            <CardTitle className="text-sm font-medium line-clamp-2">
              {title}
            </CardTitle>
            {description && (
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                {description}
              </p>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0 space-y-2">
        {/* Metadata */}
        <div className="flex items-center gap-2 flex-wrap">
          {priority && (
            <Badge
              variant="outline"
              className={cn('text-xs', priorityColors[priority as keyof typeof priorityColors] || 'bg-gray-100 text-gray-700')}
            >
              <Flag className="h-3 w-3 mr-1" />
              {priority}
            </Badge>
          )}

          {type && (
            <Badge variant="secondary" className="text-xs">
              {type.replace('_', ' ')}
            </Badge>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          {dueDate && (
            <div className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              <span>{new Date(dueDate).toLocaleDateString()}</span>
            </div>
          )}

          {assignee && (
            <Avatar className="h-5 w-5">
              <AvatarFallback className="text-xs">
                {assignee.name.split(' ').map(n => n[0]).join('').toUpperCase()}
              </AvatarFallback>
            </Avatar>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
