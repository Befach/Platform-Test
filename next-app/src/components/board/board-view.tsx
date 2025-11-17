'use client'

import { useState } from 'react'
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
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { BoardCard } from './board-card'
import { cn } from '@/lib/utils'

interface BoardColumn {
  id: string
  title: string
  color?: string
  items: BoardItem[]
}

interface BoardItem {
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
  columnId: string
}

interface BoardViewProps {
  columns: BoardColumn[]
  onItemMove: (itemId: string, fromColumn: string, toColumn: string) => Promise<void>
  onItemsSelect?: (selectedIds: string[]) => void
  className?: string
}

export function BoardView({
  columns,
  onItemMove,
  onItemsSelect,
  className,
}: BoardViewProps) {
  const [activeId, setActiveId] = useState<string | null>(null)
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set())
  const [isMoving, setIsMoving] = useState(false)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  )

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string)
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event

    if (!over) {
      setActiveId(null)
      return
    }

    const activeItem = columns
      .flatMap(col => col.items)
      .find(item => item.id === active.id)

    const overColumn = columns.find(col =>
      col.id === over.id || col.items.some(item => item.id === over.id)
    )

    if (!activeItem || !overColumn) {
      setActiveId(null)
      return
    }

    // If dropped on a different column
    if (activeItem.columnId !== overColumn.id) {
      setIsMoving(true)
      try {
        await onItemMove(activeItem.id, activeItem.columnId, overColumn.id)
      } catch (error) {
        console.error('Failed to move item:', error)
      } finally {
        setIsMoving(false)
      }
    }

    setActiveId(null)
  }

  const handleItemSelect = (itemId: string, selected: boolean) => {
    const newSelected = new Set(selectedItems)
    if (selected) {
      newSelected.add(itemId)
    } else {
      newSelected.delete(itemId)
    }
    setSelectedItems(newSelected)
    onItemsSelect?.(Array.from(newSelected))
  }

  const activeItem = activeId
    ? columns.flatMap(col => col.items).find(item => item.id === activeId)
    : null

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className={cn('grid gap-4', className)}>
        {columns.map((column) => (
          <SortableContext
            key={column.id}
            id={column.id}
            items={column.items.map(item => item.id)}
            strategy={verticalListSortingStrategy}
          >
            <Card className="h-fit">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-semibold flex items-center gap-2">
                    {column.color && (
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: column.color }}
                      />
                    )}
                    {column.title}
                  </CardTitle>
                  <Badge variant="secondary" className="text-xs">
                    {column.items.length}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="space-y-2">
                {column.items.length === 0 ? (
                  <div className="text-center py-8 text-sm text-muted-foreground border-2 border-dashed rounded-lg">
                    Drop items here
                  </div>
                ) : (
                  column.items.map((item) => (
                    <BoardCard
                      key={item.id}
                      id={item.id}
                      title={item.title}
                      description={item.description}
                      priority={item.priority}
                      status={item.status}
                      dueDate={item.dueDate}
                      assignee={item.assignee}
                      type={item.type}
                      selected={selectedItems.has(item.id)}
                      onSelect={handleItemSelect}
                    />
                  ))
                )}
              </CardContent>
            </Card>
          </SortableContext>
        ))}
      </div>

      <DragOverlay>
        {activeItem && (
          <BoardCard
            id={activeItem.id}
            title={activeItem.title}
            description={activeItem.description}
            priority={activeItem.priority}
            status={activeItem.status}
            dueDate={activeItem.dueDate}
            assignee={activeItem.assignee}
            type={activeItem.type}
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
