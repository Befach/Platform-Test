'use client'

import { memo, useState, useCallback } from 'react'
import { Handle, Position, NodeProps } from '@xyflow/react'
import { MindMapNodeData, NodeTypeConfig } from '@/lib/types/mind-map'
import { Badge } from '@/components/ui/badge'
import { Edit3 } from 'lucide-react'

interface BaseNodeProps extends NodeProps<any> {
  config: NodeTypeConfig
  onEdit?: (nodeId: string) => void
  onDelete?: (nodeId: string) => void
  onConvert?: (nodeId: string) => void
}

export const BaseNode = memo(function BaseNode({
  id,
  data,
  config,
  selected,
  onEdit,
  onDelete,
  onConvert,
}: BaseNodeProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [title, setTitle] = useState(data.title)

  const handleDoubleClick = useCallback(() => {
    setIsEditing(true)
  }, [])

  const handleBlur = useCallback(() => {
    setIsEditing(false)
    // TODO: Save title change via API
  }, [])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      setIsEditing(false)
      // TODO: Save title change via API
    }
    if (e.key === 'Escape') {
      setTitle(data.title)
      setIsEditing(false)
    }
  }, [data.title])

  return (
    <div
      className={`relative group`}
      style={{
        minWidth: '200px',
        maxWidth: '300px',
      }}
    >
      {/* Connection Handles */}
      <Handle
        type="target"
        position={Position.Top}
        className="w-3 h-3 !bg-slate-400 border-2 border-white"
      />
      <Handle
        type="source"
        position={Position.Bottom}
        className="w-3 h-3 !bg-slate-400 border-2 border-white"
      />
      <Handle
        type="target"
        position={Position.Left}
        className="w-3 h-3 !bg-slate-400 border-2 border-white"
      />
      <Handle
        type="source"
        position={Position.Right}
        className="w-3 h-3 !bg-slate-400 border-2 border-white"
      />

      {/* Node Card */}
      <div
        className={`rounded-lg shadow-md transition-all duration-200 ${
          selected ? 'ring-2 ring-offset-2' : ''
        }`}
        style={{
          backgroundColor: config.bgColor,
          borderColor: config.borderColor,
          borderWidth: '2px',
          borderStyle: 'solid',
        }}
      >
        {/* Header */}
        <div
          className="flex items-center gap-2 p-3 rounded-t-lg"
          style={{
            backgroundColor: `${config.bgColor}dd`,
            borderBottom: `1px solid ${config.borderColor}40`,
          }}
        >
          <span className="text-2xl flex-shrink-0">{config.icon}</span>

          {isEditing ? (
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={handleBlur}
              onKeyDown={handleKeyDown}
              className="flex-1 bg-white rounded px-2 py-1 text-sm font-semibold focus:outline-none focus:ring-2"
              style={{ color: config.color }}
              autoFocus
            />
          ) : (
            <h3
              className="flex-1 text-sm font-semibold line-clamp-2 cursor-text"
              style={{ color: config.color }}
              onDoubleClick={handleDoubleClick}
            >
              {data.title}
            </h3>
          )}

          {/* Edit Button */}
          <button
            onClick={() => onEdit?.(id)}
            className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity rounded hover:bg-white/50"
            title="Edit node (or right-click for more options)"
          >
            <Edit3 className="h-4 w-4" style={{ color: config.color }} />
          </button>
        </div>

        {/* Description */}
        {data.description && (
          <div className="p-3 pt-2">
            <p
              className="text-xs line-clamp-3"
              style={{ color: `${config.color}cc` }}
            >
              {data.description}
            </p>
          </div>
        )}

        {/* Converted Badge */}
        {data.convertedToWorkItemId && (
          <div className="px-3 pb-3">
            <Badge
              variant="secondary"
              className="text-xs bg-green-100 text-green-800"
            >
              ✨→📋 Converted to Feature
            </Badge>
          </div>
        )}
      </div>
    </div>
  )
})
