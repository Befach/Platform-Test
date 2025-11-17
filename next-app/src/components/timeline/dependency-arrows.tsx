'use client'

import { useMemo, useState } from 'react'
import { cn } from '@/lib/utils'

interface WorkItem {
  id: string
  name: string
  start_date?: string
  end_date?: string
  dependencies: Array<{ targetId: string; type: string }>
}

interface DependencyArrowsProps {
  workItems: WorkItem[]
  getBarPosition: (itemId: string) => { x: number; y: number; width: number; height: number } | null
  containerWidth: number
  containerHeight: number
}

interface ArrowPath {
  sourceId: string
  targetId: string
  type: string
  path: string
  color: string
}

export function DependencyArrows({
  workItems,
  getBarPosition,
  containerWidth,
  containerHeight,
}: DependencyArrowsProps) {
  const [hoveredArrow, setHoveredArrow] = useState<string | null>(null)

  // Calculate arrow paths
  const arrowPaths = useMemo<ArrowPath[]>(() => {
    const paths: ArrowPath[] = []

    workItems.forEach((source) => {
      if (!source.dependencies || source.dependencies.length === 0) return

      const sourcePos = getBarPosition(source.id)
      if (!sourcePos) return

      source.dependencies.forEach((dep) => {
        const target = workItems.find(item => item.id === dep.targetId)
        if (!target) return

        const targetPos = getBarPosition(dep.targetId)
        if (!targetPos) return

        // Calculate arrow path
        // Start from right edge of source bar, end at left edge of target bar
        const startX = sourcePos.x + sourcePos.width
        const startY = sourcePos.y + sourcePos.height / 2

        const endX = targetPos.x
        const endY = targetPos.y + targetPos.height / 2

        // Create curved path with control points
        const midX = (startX + endX) / 2
        const path = `M ${startX} ${startY} C ${midX} ${startY}, ${midX} ${endY}, ${endX} ${endY}`

        // Get color based on dependency type
        const color = getArrowColor(dep.type)

        paths.push({
          sourceId: source.id,
          targetId: dep.targetId,
          type: dep.type,
          path,
          color,
        })
      })
    })

    return paths
  }, [workItems, getBarPosition])

  // Get arrow color based on relationship type
  function getArrowColor(type: string): string {
    switch (type) {
      case 'blocks':
        return '#ef4444' // red
      case 'requires':
        return '#3b82f6' // blue
      case 'relates_to':
        return '#8b5cf6' // purple
      default:
        return '#6b7280' // gray
    }
  }

  // Get stroke width based on hover state
  const getStrokeWidth = (arrowId: string) => {
    return hoveredArrow === arrowId ? 3 : 2
  }

  // Create unique ID for each arrow
  const getArrowId = (sourceId: string, targetId: string) => {
    return `${sourceId}-${targetId}`
  }

  if (arrowPaths.length === 0) return null

  return (
    <svg
      className="absolute inset-0 pointer-events-none"
      style={{
        width: `${containerWidth}px`,
        height: `${containerHeight}px`,
      }}
    >
      <defs>
        {/* Arrow markers for each color */}
        {['#ef4444', '#3b82f6', '#8b5cf6', '#6b7280'].map((color) => (
          <marker
            key={color}
            id={`arrowhead-${color.replace('#', '')}`}
            markerWidth="10"
            markerHeight="10"
            refX="9"
            refY="3"
            orient="auto"
            markerUnits="strokeWidth"
          >
            <path d="M0,0 L0,6 L9,3 z" fill={color} />
          </marker>
        ))}
      </defs>

      {/* Render arrows */}
      {arrowPaths.map((arrow) => {
        const arrowId = getArrowId(arrow.sourceId, arrow.targetId)
        const isHovered = hoveredArrow === arrowId

        return (
          <g key={arrowId}>
            {/* Invisible hitbox for hover */}
            <path
              d={arrow.path}
              fill="none"
              stroke="transparent"
              strokeWidth="12"
              className="pointer-events-auto cursor-pointer"
              onMouseEnter={() => setHoveredArrow(arrowId)}
              onMouseLeave={() => setHoveredArrow(null)}
              onClick={() => {
                // TODO: Open edit dialog for this dependency
                console.log('Edit dependency:', arrow)
              }}
            />

            {/* Visible arrow */}
            <path
              d={arrow.path}
              fill="none"
              stroke={arrow.color}
              strokeWidth={getStrokeWidth(arrowId)}
              strokeDasharray={arrow.type === 'relates_to' ? '4 4' : '0'}
              markerEnd={`url(#arrowhead-${arrow.color.replace('#', '')})`}
              className={cn(
                'transition-all pointer-events-none',
                isHovered && 'drop-shadow-lg'
              )}
              opacity={isHovered ? 1 : 0.6}
            />

            {/* Tooltip on hover */}
            {isHovered && (
              <foreignObject
                x={(parseFloat(arrow.path.split(' ')[1]) + parseFloat(arrow.path.split(' ')[10])) / 2 - 60}
                y={(parseFloat(arrow.path.split(' ')[2]) + parseFloat(arrow.path.split(' ')[11])) / 2 - 30}
                width="120"
                height="60"
                className="pointer-events-none"
              >
                <div className="bg-slate-900 text-white text-xs rounded px-2 py-1 shadow-lg">
                  <div className="font-semibold capitalize">{arrow.type.replace('_', ' ')}</div>
                  <div className="text-slate-300 text-[10px]">Click to edit</div>
                </div>
              </foreignObject>
            )}
          </g>
        )
      })}
    </svg>
  )
}
