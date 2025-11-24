'use client'

/**
 * Work Item Reference Node
 * Links to a work item and displays live data (title, status, timeline, assignee)
 */

import { memo } from 'react'
import { Handle, Position, NodeProps } from '@xyflow/react'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'

export interface WorkItemReferenceNodeData {
  workItemId: string
  title: string
  status?: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'BLOCKED'
  timeline?: 'MVP' | 'SHORT' | 'LONG'
  assigneeName?: string
  assigneeInitials?: string
  width?: number
  height?: number
}

const statusConfig = {
  NOT_STARTED: { label: 'Not Started', color: 'bg-gray-200 text-gray-700' },
  IN_PROGRESS: { label: 'In Progress', color: 'bg-blue-200 text-blue-700' },
  COMPLETED: { label: 'Completed', color: 'bg-green-200 text-green-700' },
  BLOCKED: { label: 'Blocked', color: 'bg-red-200 text-red-700' },
}

const timelineConfig = {
  MVP: { label: 'MVP', color: 'bg-purple-100 text-purple-700' },
  SHORT: { label: 'Short Term', color: 'bg-amber-100 text-amber-700' },
  LONG: { label: 'Long Term', color: 'bg-green-100 text-green-700' },
}

export const WorkItemReferenceNode = memo(({ data, selected }: NodeProps) => {
  const nodeData = data as unknown as WorkItemReferenceNodeData
  const width = nodeData.width || 250
  const height = nodeData.height || 120
  const status = nodeData.status || 'NOT_STARTED'
  const timeline = nodeData.timeline

  return (
    <div
      className={cn(
        'rounded-lg border-2 border-blue-400 bg-white shadow-md transition-all',
        'hover:shadow-lg cursor-pointer',
        selected ? 'ring-2 ring-blue-500 ring-offset-2' : ''
      )}
      style={{
        width: `${width}px`,
        height: `${height}px`,
      }}
    >
      <Handle type="target" position={Position.Top} className="!bg-blue-500" />
      <Handle type="source" position={Position.Bottom} className="!bg-blue-500" />

      <div className="flex flex-col h-full p-3 overflow-hidden">
        {/* Header with work item icon */}
        <div className="flex items-start gap-2 mb-2">
          <div className="flex-shrink-0 w-5 h-5 rounded bg-blue-100 flex items-center justify-center">
            <span className="text-xs">🔗</span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-sm text-gray-900 truncate">
              {nodeData.title}
            </div>
          </div>
        </div>

        {/* Status and Timeline badges */}
        <div className="flex flex-wrap gap-1.5 mb-2">
          <Badge variant="secondary" className={cn('text-xs', statusConfig[status as keyof typeof statusConfig].color)}>
            {statusConfig[status as keyof typeof statusConfig].label}
          </Badge>
          {timeline && (
            <Badge variant="secondary" className={cn('text-xs', timelineConfig[timeline as keyof typeof timelineConfig].color)}>
              {timelineConfig[timeline as keyof typeof timelineConfig].label}
            </Badge>
          )}
        </div>

        {/* Assignee (if exists) */}
        {nodeData.assigneeName && (
          <div className="flex items-center gap-2 mt-auto">
            <Avatar className="w-5 h-5">
              <AvatarFallback className="text-xs">
                {nodeData.assigneeInitials || nodeData.assigneeName.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <span className="text-xs text-gray-600 truncate">{nodeData.assigneeName}</span>
          </div>
        )}
      </div>
    </div>
  )
})

WorkItemReferenceNode.displayName = 'WorkItemReferenceNode'
