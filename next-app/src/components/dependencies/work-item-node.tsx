'use client'

import { memo } from 'react'
import { Handle, Position, NodeProps } from '@xyflow/react'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { AlertCircle, Link2, TrendingUp } from 'lucide-react'
import type { WorkItemNodeData } from '@/lib/types/dependencies'
import { getItemIcon, getItemLabel } from '@/lib/constants/work-item-types'

// Status color mapping
const STATUS_COLORS = {
  not_started: 'bg-gray-100 text-gray-800',
  planned: 'bg-blue-100 text-blue-800',
  in_progress: 'bg-yellow-100 text-yellow-800',
  completed: 'bg-green-100 text-green-800',
  on_hold: 'bg-orange-100 text-orange-800',
  cancelled: 'bg-red-100 text-red-800',
}

// Priority color mapping
const PRIORITY_COLORS = {
  low: 'bg-gray-100 text-gray-600',
  medium: 'bg-blue-100 text-blue-600',
  high: 'bg-orange-100 text-orange-600',
  critical: 'bg-red-100 text-red-600',
}

export const WorkItemNode = memo(({ data, selected }: NodeProps<any>) => {
  const { workItem, isOnCriticalPath, dependencyCount, dependentCount, riskScore } = data

  return (
    <Card
      className={`
        min-w-[250px] max-w-[300px] p-3
        transition-all duration-200
        ${selected ? 'ring-2 ring-blue-500 shadow-lg' : 'shadow-md'}
        ${isOnCriticalPath ? 'ring-2 ring-red-500' : ''}
      `}
    >
      {/* Handles for connections */}
      <Handle
        type="target"
        position={Position.Top}
        className="w-3 h-3"
        style={{
          background: isOnCriticalPath ? '#ef4444' : '#555',
        }}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        className="w-3 h-3"
        style={{
          background: isOnCriticalPath ? '#ef4444' : '#555',
        }}
      />

      <div className="space-y-2">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1 mb-1">
              <span className="text-lg">{getItemIcon(workItem.type)}</span>
              <h3 className="font-semibold text-sm truncate">{workItem.name}</h3>
            </div>
            {workItem.purpose && (
              <p className="text-xs text-muted-foreground line-clamp-2">
                {workItem.purpose}
              </p>
            )}
          </div>
        </div>

        {/* Badges */}
        <div className="flex flex-wrap gap-1">
          <Badge
            variant="secondary"
            className={`text-xs ${STATUS_COLORS[workItem.status as keyof typeof STATUS_COLORS] || STATUS_COLORS.not_started}`}
          >
            {workItem.status.replace('_', ' ')}
          </Badge>
          <Badge
            variant="secondary"
            className={`text-xs ${PRIORITY_COLORS[workItem.priority as keyof typeof PRIORITY_COLORS] || PRIORITY_COLORS.medium}`}
          >
            {workItem.priority}
          </Badge>
          <Badge variant="outline" className="text-xs">
            {getItemLabel(workItem.type)}
          </Badge>
        </div>

        {/* Stats */}
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-3">
            {dependencyCount > 0 && (
              <div className="flex items-center gap-1" title="Dependencies">
                <TrendingUp className="h-3 w-3" />
                <span>{dependencyCount}</span>
              </div>
            )}
            {dependentCount > 0 && (
              <div className="flex items-center gap-1" title="Dependents">
                <Link2 className="h-3 w-3" />
                <span>{dependentCount}</span>
              </div>
            )}
          </div>
          {riskScore > 0.5 && (
            <div className="flex items-center gap-1 text-red-600" title="High Risk">
              <AlertCircle className="h-3 w-3" />
              <span>Risk</span>
            </div>
          )}
        </div>

        {/* Critical Path Indicator */}
        {isOnCriticalPath && (
          <div className="flex items-center gap-1 text-xs text-red-600 font-semibold">
            <AlertCircle className="h-3 w-3" />
            <span>Critical Path</span>
          </div>
        )}

        {/* Tags */}
        {workItem.tags && workItem.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {workItem.tags.slice(0, 3).map((tag: string) => (
              <Badge
                key={tag}
                variant="outline"
                className="text-xs bg-slate-50"
              >
                {tag}
              </Badge>
            ))}
            {workItem.tags.length > 3 && (
              <Badge variant="outline" className="text-xs">
                +{workItem.tags.length - 3}
              </Badge>
            )}
          </div>
        )}
      </div>
    </Card>
  )
})

WorkItemNode.displayName = 'WorkItemNode'
