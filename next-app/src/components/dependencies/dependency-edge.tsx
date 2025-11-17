'use client'

import { memo } from 'react'
import {
  BaseEdge,
  EdgeLabelRenderer,
  EdgeProps,
  getBezierPath,
} from '@xyflow/react'
import type { DependencyEdgeData } from '@/lib/types/dependencies'
import { CONNECTION_TYPE_CONFIGS } from '@/lib/types/dependencies'

export const DependencyEdge = memo(
  ({
    id,
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    data,
    selected,
  }: EdgeProps<any>) => {
    const { connection, isOnCriticalPath } = data || {}

    const [edgePath, labelX, labelY] = getBezierPath({
      sourceX,
      sourceY,
      sourcePosition,
      targetX,
      targetY,
      targetPosition,
    })

    // Get connection type config
    const connectionType = (connection?.connection_type || 'relates_to') as keyof typeof CONNECTION_TYPE_CONFIGS
    const config = CONNECTION_TYPE_CONFIGS[connectionType]

    // Determine edge style
    const edgeColor = isOnCriticalPath ? '#ef4444' : config.color
    const edgeWidth = isOnCriticalPath ? 3 : selected ? 2 : 1.5
    const animated = isOnCriticalPath

    return (
      <>
        <BaseEdge
          id={id}
          path={edgePath}
          style={{
            stroke: edgeColor,
            strokeWidth: edgeWidth,
          }}
          markerEnd="url(#arrow)"
        />

        {/* Edge Label */}
        <EdgeLabelRenderer>
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              pointerEvents: 'all',
            }}
            className="nodrag nopan"
          >
            <div
              className={`
                px-2 py-1 rounded text-xs font-medium
                bg-white border shadow-sm
                ${selected ? 'ring-2 ring-blue-500' : ''}
                ${isOnCriticalPath ? 'ring-2 ring-red-500' : ''}
              `}
              style={{
                borderColor: edgeColor,
                color: edgeColor,
              }}
            >
              <div className="flex items-center gap-1">
                <span>{config.icon}</span>
                <span>{config.label}</span>
                {connection?.strength && connection.strength < 1.0 && (
                  <span className="text-[10px] opacity-70">
                    {Math.round(connection.strength * 100)}%
                  </span>
                )}
              </div>
            </div>
          </div>
        </EdgeLabelRenderer>
      </>
    )
  }
)

DependencyEdge.displayName = 'DependencyEdge'
