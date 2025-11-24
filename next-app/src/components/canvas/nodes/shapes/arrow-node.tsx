'use client'

/**
 * Arrow Shape Node
 * Directional arrow indicator for annotations and flow direction
 */

import { memo } from 'react'
import { NodeProps } from '@xyflow/react'
import { cn } from '@/lib/utils'

export interface ArrowNodeData {
  title?: string
  direction?: 'right' | 'down' | 'left' | 'up'
  width?: number
  height?: number
  color?: string
}

export const ArrowNode = memo(({ data, selected }: NodeProps) => {
  const width = (data as unknown as ArrowNodeData).width || 100
  const height = (data as unknown as ArrowNodeData).height || 50
  const direction = (data as unknown as ArrowNodeData).direction || 'right'
  const color = (data as unknown as ArrowNodeData).color || '#3b82f6'

  const rotationClass = {
    right: 'rotate-0',
    down: 'rotate-90',
    left: 'rotate-180',
    up: '-rotate-90',
  }[direction as 'right' | 'down' | 'left' | 'up']

  return (
    <div
      className={cn(
        'flex items-center justify-center transition-all',
        selected ? 'ring-2 ring-blue-500 ring-offset-2 rounded' : '',
        rotationClass
      )}
      style={{
        width: `${width}px`,
        height: `${height}px`,
      }}
    >
      {/* Arrow SVG */}
      <svg
        viewBox="0 0 100 50"
        className="w-full h-full"
        style={{ fill: color }}
      >
        <polygon points="0,20 70,20 70,5 100,25 70,45 70,30 0,30" />
      </svg>

      {/* Optional label */}
      {(data as unknown as ArrowNodeData).title && (
        <div
          className={cn(
            'absolute text-xs font-medium text-gray-900 whitespace-nowrap',
            '-rotate-0' // Counter-rotate text to keep it horizontal
          )}
          style={{
            transform: direction === 'right' ? 'none' : direction === 'down' ? 'rotate(-90deg)' : direction === 'left' ? 'rotate(-180deg)' : 'rotate(90deg)',
          }}
        >
          {(data as unknown as ArrowNodeData).title}
        </div>
      )}
    </div>
  )
})

ArrowNode.displayName = 'ArrowNode'
