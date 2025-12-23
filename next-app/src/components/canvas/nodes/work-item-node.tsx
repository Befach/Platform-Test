'use client'

/**
 * Work Item Node Component
 *
 * Generic node component for all work item types
 * Adapts styling based on type (idea, epic, feature, user_story, task, bug)
 */

import { memo } from 'react'
import { Handle, Position, NodeProps } from '@xyflow/react'
import { cn } from '@/lib/utils'
import {
  Lightbulb,
  Package,
  Star,
  FileText,
  CheckSquare,
  Bug,
  StickyNote,
  AlertCircle,
  Clock,
  CheckCircle2,
} from 'lucide-react'

interface WorkItemNodeData {
  label: string
  type: string
  status?: string
  priority?: string
  isNote?: boolean
  noteType?: string
  isPlaceholder?: boolean
  workItem: any
}

// Type-specific colors and icons (Figma-inspired flat design)
const typeConfig = {
  // Old types (backward compatibility)
  idea: {
    icon: Lightbulb,
    iconColor: 'text-purple-600',
    borderColor: 'border-purple-200',
    bgColor: 'bg-white',
    accentColor: 'bg-purple-100',
  },
  epic: {
    icon: Package,
    iconColor: 'text-indigo-600',
    borderColor: 'border-indigo-200',
    bgColor: 'bg-white',
    accentColor: 'bg-indigo-100',
  },
  feature: {
    icon: Star,
    iconColor: 'text-blue-600',
    borderColor: 'border-blue-200',
    bgColor: 'bg-white',
    accentColor: 'bg-blue-100',
  },
  user_story: {
    icon: FileText,
    iconColor: 'text-cyan-600',
    borderColor: 'border-cyan-200',
    bgColor: 'bg-white',
    accentColor: 'bg-cyan-100',
  },
  task: {
    icon: CheckSquare,
    iconColor: 'text-green-600',
    borderColor: 'border-green-200',
    bgColor: 'bg-white',
    accentColor: 'bg-green-100',
  },
  bug: {
    icon: Bug,
    iconColor: 'text-red-600',
    borderColor: 'border-red-200',
    bgColor: 'bg-white',
    accentColor: 'bg-red-100',
  },
  note: {
    icon: StickyNote,
    iconColor: 'text-amber-600',
    borderColor: 'border-amber-200',
    bgColor: 'bg-amber-50',
    accentColor: 'bg-amber-100',
  },

  // New phase-aware types
  exploration: {
    icon: Lightbulb,
    iconColor: 'text-violet-600',
    borderColor: 'border-violet-200',
    bgColor: 'bg-white',
    accentColor: 'bg-violet-100',
  },
  user_need: {
    icon: FileText,
    iconColor: 'text-purple-600',
    borderColor: 'border-purple-200',
    bgColor: 'bg-white',
    accentColor: 'bg-purple-100',
  },
  core_feature: {
    icon: Star,
    iconColor: 'text-blue-600',
    borderColor: 'border-blue-200',
    bgColor: 'bg-white',
    accentColor: 'bg-blue-100',
  },
  // Note: enhancement removed - now a flag on features
  // Legacy node types below kept for backward compatibility
  user_request: {
    icon: FileText,
    iconColor: 'text-indigo-600',
    borderColor: 'border-indigo-200',
    bgColor: 'bg-white',
    accentColor: 'bg-indigo-100',
  },
  bug_fix: {
    icon: Bug,
    iconColor: 'text-red-600',
    borderColor: 'border-red-200',
    bgColor: 'bg-white',
    accentColor: 'bg-red-100',
  },
  technical_debt: {
    icon: Package,
    iconColor: 'text-orange-600',
    borderColor: 'border-orange-200',
    bgColor: 'bg-white',
    accentColor: 'bg-orange-100',
  },
  integration: {
    icon: Package,
    iconColor: 'text-emerald-600',
    borderColor: 'border-emerald-200',
    bgColor: 'bg-white',
    accentColor: 'bg-emerald-100',
  },
  performance_improvement: {
    icon: CheckSquare,
    iconColor: 'text-green-600',
    borderColor: 'border-green-200',
    bgColor: 'bg-white',
    accentColor: 'bg-green-100',
  },
  quality_enhancement: {
    icon: CheckSquare,
    iconColor: 'text-teal-600',
    borderColor: 'border-teal-200',
    bgColor: 'bg-white',
    accentColor: 'bg-teal-100',
  },
  analytics_feature: {
    icon: Star,
    iconColor: 'text-pink-600',
    borderColor: 'border-pink-200',
    bgColor: 'bg-white',
    accentColor: 'bg-pink-100',
  },
  optimization: {
    icon: CheckSquare,
    iconColor: 'text-rose-600',
    borderColor: 'border-rose-200',
    bgColor: 'bg-white',
    accentColor: 'bg-rose-100',
  },
}

// Status icons
const statusIcons = {
  backlog: Clock,
  in_progress: AlertCircle,
  in_review: AlertCircle,
  completed: CheckCircle2,
}

// Priority colors
const priorityColors = {
  critical: 'text-red-600',
  high: 'text-orange-600',
  medium: 'text-yellow-600',
  low: 'text-gray-600',
}

export const WorkItemNode = memo(({ data, selected }: NodeProps) => {
  const nodeData = data as unknown as WorkItemNodeData
  const config = typeConfig[nodeData.type as keyof typeof typeConfig] ?? typeConfig.task
  const Icon = config.icon
  const StatusIcon = statusIcons[nodeData.status as keyof typeof statusIcons]

  return (
    <div
      className={cn(
        'relative rounded-xl border-2 transition-all duration-200',
        config.bgColor,
        selected
          ? 'border-blue-500 shadow-lg'
          : cn(config.borderColor, 'shadow-sm hover:shadow-md'),
        nodeData.isPlaceholder && 'opacity-60 border-dashed'
      )}
      style={{
        width: 280,
        height: 120,
      }}
    >
      {/* Connection Handles - Figma-style subtle handles */}
      <Handle
        type="target"
        position={Position.Top}
        className="!bg-blue-500 !w-2 !h-2 !border-2 !border-white !opacity-0 hover:!opacity-100 transition-opacity"
        style={{ top: -4 }}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        className="!bg-blue-500 !w-2 !h-2 !border-2 !border-white !opacity-0 hover:!opacity-100 transition-opacity"
        style={{ bottom: -4 }}
      />

      {/* Content Container */}
      <div className="p-4 h-full flex flex-col gap-2">
        {/* Header Row */}
        <div className="flex items-center gap-2">
          <div className={cn('p-1.5 rounded-lg', config.accentColor)}>
            <Icon className={cn('w-4 h-4', config.iconColor)} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[10px] font-medium text-gray-500 uppercase tracking-wide truncate">
              {nodeData.isNote ? nodeData.noteType ?? 'Note' : nodeData.type.replace('_', ' ')}
            </div>
          </div>
          {nodeData.priority && (
            <div
              className={cn(
                'text-[10px] font-semibold px-2 py-0.5 rounded-md',
                config.accentColor,
                priorityColors[nodeData.priority as keyof typeof priorityColors]
              )}
            >
              {nodeData.priority[0].toUpperCase()}
            </div>
          )}
        </div>

        {/* Title */}
        <div className="font-semibold text-sm text-gray-900 line-clamp-2 leading-snug">
          {nodeData.label}
        </div>

        {/* Status Row */}
        <div className="mt-auto flex items-center justify-between">
          {nodeData.status && StatusIcon ? (
            <div className="flex items-center gap-1.5 text-xs text-gray-500">
              <StatusIcon className="w-3.5 h-3.5" />
              <span className="capitalize">{nodeData.status.replace('_', ' ')}</span>
            </div>
          ) : (
            <div />
          )}

          {/* Placeholder Badge */}
          {nodeData.isPlaceholder && (
            <div className="bg-gray-100 text-gray-600 text-[10px] font-medium px-2 py-0.5 rounded-md">
              Draft
            </div>
          )}
        </div>
      </div>
    </div>
  )
})

WorkItemNode.displayName = 'WorkItemNode'
