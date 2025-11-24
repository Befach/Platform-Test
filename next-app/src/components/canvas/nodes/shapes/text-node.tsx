'use client'

/**
 * Text Shape Node
 * Plain text box with no border (minimal styling)
 */

import { memo } from 'react'
import { Handle, Position, NodeProps } from '@xyflow/react'
import { cn } from '@/lib/utils'

export interface TextNodeData {
  title: string
  description?: string
  width?: number
  height?: number
  fontSize?: 'sm' | 'base' | 'lg' | 'xl'
  textAlign?: 'left' | 'center' | 'right'
  fontWeight?: 'normal' | 'semibold' | 'bold'
}

export const TextNode = memo(({ data, selected }: NodeProps) => {
  const nodeData = data as unknown as TextNodeData
  const width = nodeData.width || 200
  const height = nodeData.height || 60
  const fontSize = nodeData.fontSize || 'base'
  const textAlign = nodeData.textAlign || 'left'
  const fontWeight = nodeData.fontWeight || 'normal'

  const fontSizeClass = {
    sm: 'text-sm',
    base: 'text-base',
    lg: 'text-lg',
    xl: 'text-xl',
  }[fontSize as 'sm' | 'base' | 'lg' | 'xl']

  const fontWeightClass = {
    normal: 'font-normal',
    semibold: 'font-semibold',
    bold: 'font-bold',
  }[fontWeight as 'normal' | 'semibold' | 'bold']

  return (
    <div
      className={cn(
        'bg-transparent transition-all',
        selected ? 'ring-2 ring-blue-500 ring-offset-2 rounded' : ''
      )}
      style={{
        width: `${width}px`,
        height: `${height}px`,
      }}
    >
      <Handle type="target" position={Position.Top} className="!bg-gray-400 opacity-0 hover:opacity-100" />
      <Handle type="source" position={Position.Bottom} className="!bg-gray-400 opacity-0 hover:opacity-100" />

      <div className={cn('flex flex-col h-full overflow-hidden', `text-${textAlign}`)}>
        <div className={cn(fontSizeClass, fontWeightClass, 'text-gray-900 break-words')}>
          {nodeData.title}
        </div>
        {nodeData.description && (
          <div className="text-sm text-gray-600 mt-1 break-words line-clamp-2">
            {nodeData.description}
          </div>
        )}
      </div>
    </div>
  )
})

TextNode.displayName = 'TextNode'
