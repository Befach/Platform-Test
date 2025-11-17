'use client'

import { useRef, useEffect, useState } from 'react'
import { cn } from '@/lib/utils'

interface TimelineMinimapProps {
  totalWidth: number
  containerWidth: number
  scrollLeft: number
  onScrollTo: (position: number) => void
  workItems: Array<{
    id: string
    name: string
    barStyle: { left: string; width: string }
  }>
  className?: string
}

export function TimelineMinimap({
  totalWidth,
  containerWidth,
  scrollLeft,
  onScrollTo,
  workItems,
  className,
}: TimelineMinimapProps) {
  const minimapRef = useRef<HTMLDivElement>(null)
  const [isDragging, setIsDragging] = useState(false)

  // Minimap dimensions
  const minimapWidth = 200 // Fixed width for minimap
  const minimapHeight = 60 // Fixed height for minimap
  const scale = minimapWidth / totalWidth

  // Viewport dimensions in minimap coordinates
  const viewportWidth = containerWidth * scale
  const viewportLeft = scrollLeft * scale

  const handleMinimapClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!minimapRef.current) return

    const rect = minimapRef.current.getBoundingClientRect()
    const clickX = e.clientX - rect.left

    // Center the viewport on the click position
    const targetScrollLeft = (clickX / scale) - (containerWidth / 2)
    const maxScroll = totalWidth - containerWidth
    const clampedScroll = Math.max(0, Math.min(maxScroll, targetScrollLeft))

    onScrollTo(clampedScroll)
  }

  const handleViewportDragStart = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation()
    setIsDragging(true)
  }

  const handleViewportDrag = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging || !minimapRef.current) return

    const rect = minimapRef.current.getBoundingClientRect()
    const dragX = e.clientX - rect.left

    // Calculate new scroll position
    const targetScrollLeft = dragX / scale
    const maxScroll = totalWidth - containerWidth
    const clampedScroll = Math.max(0, Math.min(maxScroll, targetScrollLeft))

    onScrollTo(clampedScroll)
  }

  const handleViewportDragEnd = () => {
    setIsDragging(false)
  }

  useEffect(() => {
    if (isDragging) {
      const handleMouseMove = (e: MouseEvent) => {
        if (!minimapRef.current) return

        const rect = minimapRef.current.getBoundingClientRect()
        const dragX = e.clientX - rect.left

        const targetScrollLeft = dragX / scale
        const maxScroll = totalWidth - containerWidth
        const clampedScroll = Math.max(0, Math.min(maxScroll, targetScrollLeft))

        onScrollTo(clampedScroll)
      }

      const handleMouseUp = () => {
        setIsDragging(false)
      }

      window.addEventListener('mousemove', handleMouseMove)
      window.addEventListener('mouseup', handleMouseUp)

      return () => {
        window.removeEventListener('mousemove', handleMouseMove)
        window.removeEventListener('mouseup', handleMouseUp)
      }
    }
  }, [isDragging, scale, totalWidth, containerWidth, onScrollTo])

  return (
    <div
      className={cn(
        'border rounded-lg bg-slate-50 dark:bg-slate-900 p-2 shadow-sm',
        className
      )}
    >
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
          Timeline Overview
        </span>
        <span className="text-xs text-slate-500 dark:text-slate-500">
          {workItems.length} items
        </span>
      </div>

      <div
        ref={minimapRef}
        className="relative bg-white dark:bg-slate-800 rounded border cursor-pointer"
        style={{
          width: `${minimapWidth}px`,
          height: `${minimapHeight}px`,
        }}
        onClick={handleMinimapClick}
      >
        {/* Render miniature work items */}
        {workItems.map((item) => {
          const left = parseFloat(item.barStyle.left)
          const width = parseFloat(item.barStyle.width)

          return (
            <div
              key={item.id}
              className="absolute top-1/2 -translate-y-1/2 bg-blue-400 dark:bg-blue-600 rounded-sm opacity-70"
              style={{
                left: `${left * scale}px`,
                width: `${Math.max(2, width * scale)}px`, // Minimum 2px width
                height: '4px',
              }}
              title={item.name}
            />
          )
        })}

        {/* Viewport indicator */}
        <div
          className={cn(
            'absolute top-0 bottom-0 border-2 border-blue-500 bg-blue-500/10 rounded cursor-move transition-colors',
            isDragging && 'bg-blue-500/20 border-blue-600'
          )}
          style={{
            left: `${viewportLeft}px`,
            width: `${viewportWidth}px`,
          }}
          onMouseDown={handleViewportDragStart}
          title="Drag to pan timeline"
        >
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-xs font-medium text-blue-600 dark:text-blue-400 select-none">
              ⬌
            </div>
          </div>
        </div>
      </div>

      <div className="mt-1 text-xs text-slate-500 dark:text-slate-500 text-center">
        Click or drag to navigate
      </div>
    </div>
  )
}
