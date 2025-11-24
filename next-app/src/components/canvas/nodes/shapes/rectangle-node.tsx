'use client'

/**
 * Rectangle Shape Node
 * Basic rectangle with text content and resizable handles
 */

import { memo } from 'react'
import { Handle, Position, NodeProps } from '@xyflow/react'
import { cn } from '@/lib/utils'

export interface RectangleNodeData {
  title: string
  description?: string
  width?: number
  height?: number
  backgroundColor?: string
  borderColor?: string
}

export const RectangleNode = memo(({ data, selected }: NodeProps) => {
  const nodeData = data as unknown as RectangleNodeData
  const width = nodeData.width || 200
  const height = nodeData.height || 100
  const bgColor = nodeData.backgroundColor || '#ffffff'
  const borderColor = nodeData.borderColor || '#3b82f6'

  return (
    <div
      className={cn(
        'rounded-lg border-2 bg-white shadow-sm transition-all',
        selected ? 'ring-2 ring-blue-500 ring-offset-2' : ''
      )}
      style={{
        width: `${width}px`,
        height: `${height}px`,
        backgroundColor: bgColor,
        borderColor: borderColor,
      }}
    >
      <Handle type="target" position={Position.Top} className="!bg-gray-400" />
      <Handle type="source" position={Position.Bottom} className="!bg-gray-400" />

      <div className="flex flex-col h-full p-3 overflow-hidden">
        <div className="font-semibold text-sm text-gray-900 truncate">{nodeData.title}</div>
        {nodeData.description && (
          <div className="text-xs text-gray-600 mt-1 line-clamp-3">{nodeData.description}</div>
        )}
      </div>
    </div>
  )
})

RectangleNode.displayName = 'RectangleNode'
