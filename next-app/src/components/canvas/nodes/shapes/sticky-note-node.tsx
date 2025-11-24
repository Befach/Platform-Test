'use client'

/**
 * Sticky Note Shape Node
 * Post-it style note with gradient background and shadow
 */

import { memo } from 'react'
import { Handle, Position, NodeProps } from '@xyflow/react'
import { cn } from '@/lib/utils'

export interface StickyNoteNodeData {
  title: string
  description?: string
  width?: number
  height?: number
  backgroundColor?: string
}

export const StickyNoteNode = memo(({ data, selected }: NodeProps) => {
  const nodeData = data as unknown as StickyNoteNodeData
  const width = nodeData.width || 180
  const height = nodeData.height || 180
  const bgColor = nodeData.backgroundColor || '#fef3c7' // amber-100

  return (
    <div
      className={cn(
        'rounded-sm shadow-md transition-all',
        'border-t-4 border-l-2 border-r border-b',
        'border-amber-300',
        selected ? 'ring-2 ring-blue-500 ring-offset-2' : ''
      )}
      style={{
        width: `${width}px`,
        height: `${height}px`,
        backgroundColor: bgColor,
        boxShadow: '2px 2px 8px rgba(0, 0, 0, 0.15)',
      }}
    >
      <Handle type="target" position={Position.Top} className="!bg-gray-400" />
      <Handle type="source" position={Position.Bottom} className="!bg-gray-400" />

      <div className="flex flex-col h-full p-4 overflow-hidden">
        <div className="font-handwriting text-base text-gray-900 mb-2 break-words">
          {nodeData.title}
        </div>
        {nodeData.description && (
          <div className="font-handwriting text-sm text-gray-700 break-words line-clamp-4">
            {nodeData.description}
          </div>
        )}
      </div>
    </div>
  )
})

StickyNoteNode.displayName = 'StickyNoteNode'
