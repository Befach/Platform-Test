'use client'

import { useDraggable } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import { cn } from '@/lib/utils'
import { useState } from 'react'

interface DraggableTimelineBarProps {
  id: string
  name: string
  phase: string
  status: string
  durationDays: number
  barStyle: { left: string; width: string }
  phaseColor: string
  statusColor: string
  onDragEnd: (itemId: string, deltaPixels: number) => void
  disabled?: boolean
  isCritical?: boolean
}

export function DraggableTimelineBar({
  id,
  name,
  phase,
  status,
  durationDays,
  barStyle,
  phaseColor,
  statusColor,
  onDragEnd,
  disabled = false,
  isCritical = false,
}: DraggableTimelineBarProps) {
  const [isDragging, setIsDragging] = useState(false)

  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id,
    disabled,
  })

  // Only apply horizontal translation
  const style = transform
    ? {
        ...barStyle,
        transform: `translateX(${transform.x}px)`,
        transition: isDragging ? 'none' : 'transform 200ms ease',
      }
    : barStyle

  const handleDragStart = () => {
    setIsDragging(true)
  }

  const handleDragEnd = () => {
    setIsDragging(false)
    if (transform) {
      onDragEnd(id, transform.x)
    }
  }

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'absolute top-1/2 -translate-y-1/2 h-8 rounded border-2 flex items-center justify-center transition-all',
        disabled ? 'cursor-not-allowed opacity-50' : 'cursor-grab active:cursor-grabbing hover:shadow-md',
        isDragging && 'shadow-lg ring-2 ring-blue-400 z-10',
        isCritical && 'ring-2 ring-yellow-400 ring-offset-2 shadow-lg shadow-yellow-200 animate-pulse',
        phaseColor,
        statusColor
      )}
      style={style}
      title={`${name}\n${durationDays} days${isCritical ? '\n⚡ CRITICAL PATH' : ''}\n${disabled ? 'Set dates to enable dragging' : 'Drag to reschedule'}`}
      {...attributes}
      {...listeners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <span className="text-xs font-medium text-white truncate px-2 flex items-center gap-1">
        {isCritical && <span className="text-yellow-300">⚡</span>}
        {durationDays}d
      </span>
    </div>
  )
}
