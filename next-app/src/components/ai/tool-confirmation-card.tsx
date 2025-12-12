'use client'

/**
 * ToolConfirmationCard Component
 *
 * Displays an inline confirmation card in the chat when the AI proposes an action.
 * Shows a rich visual preview of what will be created and provides
 * [Confirm] [Edit] [Cancel] buttons.
 *
 * Features:
 * - Rich visual previews for each tool type (work items, tasks, dependencies, etc.)
 * - Inline editing mode with form fields
 * - Real-time preview updates as user edits
 * - Clear confirmation/rejection flow
 *
 * Used in the chat-first AI experience to preview tool actions before execution.
 */

import { useState, useCallback } from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from '@/components/ui/card'
import {
  Check,
  X,
  Pencil,
  Loader2,
  FileText,
  CheckSquare,
  Link2,
  Calendar,
  Lightbulb,
  AlertTriangle,
  Eye,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'
import type { ToolCategory as ToolCategoryType } from '@/lib/ai/schemas/agentic-schemas'
import { ToolPreviewRenderer } from './tool-previews'

// =============================================================================
// TYPES
// =============================================================================

export interface ConfirmationParams {
  [key: string]: unknown
}

export interface ToolConfirmationData {
  toolName: string
  displayName: string
  category: ToolCategoryType
  params: ConfirmationParams
  description: string
  warnings?: string[]
}

export interface ToolConfirmationCardProps {
  data: ToolConfirmationData
  onConfirm: (params: ConfirmationParams) => void
  onEdit: (params: ConfirmationParams) => void
  onCancel: () => void
  isLoading?: boolean
  className?: string
}

// =============================================================================
// PREMIUM STYLE CONSTANTS
// =============================================================================

/**
 * Premium category styles with gradients, glows, and accents
 */
const categoryConfig: Record<ToolCategoryType, {
  // Legacy colors (still used for badges)
  color: string
  bgColor: string
  borderColor: string
  // Premium gradient styles
  iconBg: string
  iconColor: string
  accentBar: string
  glow: string
  overlay: string
  badgeClass: string
  buttonGradient: string
  buttonHover: string
  buttonGlow: string
}> = {
  creation: {
    color: 'text-emerald-500',
    bgColor: 'bg-emerald-500/5',
    borderColor: 'border-emerald-500',
    iconBg: 'bg-gradient-to-br from-emerald-500/20 to-green-500/10 border border-emerald-500/30',
    iconColor: 'text-emerald-400',
    accentBar: 'bg-gradient-to-r from-emerald-500 to-green-500',
    glow: 'shadow-emerald-500/10',
    overlay: 'from-emerald-500/5 via-transparent to-green-500/5',
    badgeClass: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    buttonGradient: 'bg-gradient-to-r from-emerald-500 to-green-500',
    buttonHover: 'hover:from-emerald-400 hover:to-green-400',
    buttonGlow: 'hover:shadow-lg hover:shadow-emerald-500/25',
  },
  analysis: {
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/5',
    borderColor: 'border-blue-500',
    iconBg: 'bg-gradient-to-br from-blue-500/20 to-cyan-500/10 border border-blue-500/30',
    iconColor: 'text-blue-400',
    accentBar: 'bg-gradient-to-r from-blue-500 to-cyan-500',
    glow: 'shadow-blue-500/10',
    overlay: 'from-blue-500/5 via-transparent to-cyan-500/5',
    badgeClass: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
    buttonGradient: 'bg-gradient-to-r from-blue-500 to-cyan-500',
    buttonHover: 'hover:from-blue-400 hover:to-cyan-400',
    buttonGlow: 'hover:shadow-lg hover:shadow-blue-500/25',
  },
  optimization: {
    color: 'text-amber-500',
    bgColor: 'bg-amber-500/5',
    borderColor: 'border-amber-500',
    iconBg: 'bg-gradient-to-br from-amber-500/20 to-orange-500/10 border border-amber-500/30',
    iconColor: 'text-amber-400',
    accentBar: 'bg-gradient-to-r from-amber-500 to-orange-500',
    glow: 'shadow-amber-500/10',
    overlay: 'from-amber-500/5 via-transparent to-orange-500/5',
    badgeClass: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
    buttonGradient: 'bg-gradient-to-r from-amber-500 to-orange-500',
    buttonHover: 'hover:from-amber-400 hover:to-orange-400',
    buttonGlow: 'hover:shadow-lg hover:shadow-amber-500/25',
  },
  strategy: {
    color: 'text-purple-500',
    bgColor: 'bg-purple-500/5',
    borderColor: 'border-purple-500',
    iconBg: 'bg-gradient-to-br from-purple-500/20 to-violet-500/10 border border-purple-500/30',
    iconColor: 'text-purple-400',
    accentBar: 'bg-gradient-to-r from-purple-500 to-violet-500',
    glow: 'shadow-purple-500/10',
    overlay: 'from-purple-500/5 via-transparent to-violet-500/5',
    badgeClass: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
    buttonGradient: 'bg-gradient-to-r from-purple-500 to-violet-500',
    buttonHover: 'hover:from-purple-400 hover:to-violet-400',
    buttonGlow: 'hover:shadow-lg hover:shadow-purple-500/25',
  },
}

// =============================================================================
// HELPERS
// =============================================================================

const toolIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  createWorkItem: FileText,
  createTask: CheckSquare,
  createDependency: Link2,
  createTimelineItem: Calendar,
  createInsight: Lightbulb,
}

function getToolIcon(toolName: string) {
  return toolIcons[toolName] || FileText
}

function formatParamLabel(key: string): string {
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (str) => str.toUpperCase())
    .replace('Id', 'ID')
}

function formatParamValue(value: unknown): string {
  if (value === null || value === undefined) return '—'
  if (Array.isArray(value)) return value.join(', ') || '—'
  if (typeof value === 'object') return JSON.stringify(value)
  return String(value)
}

// Check if a tool has a rich preview component
function hasRichPreview(toolName: string): boolean {
  return [
    'createWorkItem',
    'createTask',
    'createDependency',
    'createTimelineItem',
    'createInsight',
  ].includes(toolName)
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function ToolConfirmationCard({
  data,
  onConfirm,
  onEdit,
  onCancel,
  isLoading = false,
  className,
}: ToolConfirmationCardProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editedParams, setEditedParams] = useState<ConfirmationParams>(data.params)
  const [showRawParams, setShowRawParams] = useState(false)

  const styles = categoryConfig[data.category]
  const IconComponent = getToolIcon(data.toolName)
  const hasPreview = hasRichPreview(data.toolName)

  // Filter out internal params that shouldn't be displayed
  const displayParams = Object.entries(data.params).filter(
    ([key]) => !['workspaceId', 'teamId'].includes(key)
  )

  const handleConfirm = useCallback(() => {
    if (isEditing) {
      onConfirm(editedParams)
    } else {
      onConfirm(data.params)
    }
  }, [isEditing, editedParams, data.params, onConfirm])

  const handleToggleEdit = useCallback(() => {
    if (isEditing) {
      // Cancel edit - reset to original
      setEditedParams(data.params)
    }
    setIsEditing(!isEditing)
  }, [isEditing, data.params])

  const handleParamChange = useCallback((newParams: Record<string, unknown>) => {
    setEditedParams((prev) => ({ ...prev, ...newParams }))
  }, [])

  return (
    <div
      className={cn(
        'w-full max-w-lg',
        // Premium glassmorphism card
        'relative overflow-hidden rounded-xl',
        'bg-gradient-to-br from-background/95 via-background/90 to-background/80',
        'backdrop-blur-xl',
        'border border-white/10',
        'shadow-lg shadow-black/5',
        styles.glow,
        // Hover effects
        'transition-all duration-300',
        'hover:shadow-xl',
        'hover:border-white/20',
        className
      )}
    >
      {/* Premium gradient accent bar */}
      <div className={cn('h-1 w-full', styles.accentBar)} />

      {/* Subtle gradient overlay */}
      <div className={cn('absolute inset-0 bg-gradient-to-br pointer-events-none', styles.overlay)} />

      {/* Header */}
      <CardHeader className="relative pb-2 pt-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            {/* Premium icon with gradient background */}
            <div className={cn('p-2 rounded-lg', styles.iconBg)}>
              <IconComponent className={cn('h-4 w-4', styles.iconColor)} />
            </div>
            <div>
              <h3 className="font-semibold text-sm">{data.displayName}</h3>
              <p className="text-xs text-muted-foreground">{data.description}</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            {isEditing && (
              <Badge variant="outline" className="text-xs gap-1 bg-white/5 border-white/20">
                <Pencil className="h-3 w-3" />
                Editing
              </Badge>
            )}
            <Badge variant="outline" className={cn('text-xs', styles.badgeClass)}>
              {data.category}
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="relative pb-3 space-y-3">
        {/* Rich Preview or Fallback */}
        {hasPreview ? (
          <div className="border border-white/10 rounded-lg overflow-hidden bg-background/30">
            <ToolPreviewRenderer
              toolName={data.toolName}
              params={isEditing ? editedParams : data.params}
              isEditing={isEditing}
              onChange={handleParamChange}
            />
          </div>
        ) : (
          // Fallback: Key-value display for tools without rich preview
          <div className="space-y-2 p-3 border border-white/10 rounded-lg bg-background/30">
            {displayParams.map(([key, value]) => (
              <div key={key} className="flex items-start gap-2 text-sm">
                <span className="text-muted-foreground w-28 flex-shrink-0">
                  {formatParamLabel(key)}:
                </span>
                <span className="font-medium">{formatParamValue(value)}</span>
              </div>
            ))}
          </div>
        )}

        {/* Raw Parameters Toggle (for debugging/power users) */}
        {hasPreview && (
          <button
            onClick={() => setShowRawParams(!showRawParams)}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors p-1.5 rounded hover:bg-white/5"
          >
            <Eye className="h-3 w-3" />
            <span>View raw parameters</span>
            {showRawParams ? (
              <ChevronUp className="h-3 w-3" />
            ) : (
              <ChevronDown className="h-3 w-3" />
            )}
          </button>
        )}

        {showRawParams && (
          <div className="p-2.5 bg-black/20 rounded-lg border border-white/10 text-xs font-mono overflow-x-auto">
            <pre className="text-muted-foreground">{JSON.stringify(isEditing ? editedParams : data.params, null, 2)}</pre>
          </div>
        )}

        {/* Warnings with premium styling */}
        {data.warnings && data.warnings.length > 0 && (
          <div className="p-2.5 bg-amber-500/10 rounded-lg border border-amber-500/30">
            {data.warnings.map((warning, index) => (
              <div key={index} className="flex items-start gap-2 text-xs text-amber-400">
                <AlertTriangle className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
                <span>{warning}</span>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      {/* Premium Action Buttons */}
      <CardFooter className="relative pt-0 pb-3 gap-2">
        {/* Confirm Button - Gradient with glow */}
        <Button
          size="sm"
          onClick={handleConfirm}
          disabled={isLoading}
          className={cn(
            'flex-1 text-white border-0',
            styles.buttonGradient,
            styles.buttonHover,
            styles.buttonGlow,
            'transition-all duration-200',
            isLoading && 'opacity-70'
          )}
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
              Creating...
            </>
          ) : (
            <>
              <Check className="h-4 w-4 mr-1.5" />
              {isEditing ? 'Save & Create' : 'Approve'}
            </>
          )}
        </Button>

        {/* Edit Button - Outline with hover */}
        <Button
          size="sm"
          variant="outline"
          onClick={handleToggleEdit}
          disabled={isLoading}
          className="border-white/20 bg-white/5 hover:bg-white/10 hover:border-white/30 transition-all"
        >
          <Pencil className="h-4 w-4 mr-1.5" />
          {isEditing ? 'Cancel' : 'Edit'}
        </Button>

        {/* Reject Button - Ghost with destructive hover */}
        <Button
          size="sm"
          variant="ghost"
          onClick={onCancel}
          disabled={isLoading}
          className="text-muted-foreground hover:text-red-400 hover:bg-red-500/10 transition-all"
        >
          <X className="h-4 w-4 mr-1" />
          Reject
        </Button>
      </CardFooter>
    </div>
  )
}

// =============================================================================
// COMPLETED ACTION CARD (Non-interactive, for completed actions)
// =============================================================================

export interface CompletedActionCardProps {
  toolName: string
  displayName: string
  category: ToolCategoryType
  params: ConfirmationParams
  result?: Record<string, unknown>
  status: 'completed' | 'failed'
  error?: string
  actionId?: string
  className?: string
}

export function CompletedActionCard({
  toolName,
  displayName,
  category,
  params,
  result,
  status,
  error,
  actionId,
  className,
}: CompletedActionCardProps) {
  const styles = categoryConfig[category]
  const IconComponent = getToolIcon(toolName)
  const hasPreview = hasRichPreview(toolName)

  const displayParams = Object.entries(params).filter(
    ([key]) => !['workspaceId', 'teamId'].includes(key)
  )

  // Status-specific premium styles
  const statusStyles = {
    completed: {
      accentBar: 'bg-gradient-to-r from-emerald-500 to-green-500',
      badge: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
      glow: 'shadow-emerald-500/10',
      overlay: 'from-emerald-500/5 via-transparent to-green-500/5',
    },
    failed: {
      accentBar: 'bg-gradient-to-r from-red-500 to-rose-500',
      badge: 'bg-red-500/10 text-red-400 border-red-500/30',
      glow: 'shadow-red-500/10',
      overlay: 'from-red-500/5 via-transparent to-rose-500/5',
    },
  }

  const currentStatus = statusStyles[status]

  return (
    <div
      className={cn(
        'w-full max-w-lg',
        // Premium glassmorphism card
        'relative overflow-hidden rounded-xl',
        'bg-gradient-to-br from-background/95 via-background/90 to-background/80',
        'backdrop-blur-xl',
        'border border-white/10',
        'shadow-lg shadow-black/5',
        currentStatus.glow,
        className
      )}
    >
      {/* Premium status gradient accent bar */}
      <div className={cn('h-1 w-full', currentStatus.accentBar)} />

      {/* Subtle gradient overlay */}
      <div className={cn('absolute inset-0 bg-gradient-to-br pointer-events-none', currentStatus.overlay)} />

      <CardHeader className="relative pb-2 pt-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            {/* Premium icon with gradient background */}
            <div className={cn('p-2 rounded-lg', styles.iconBg)}>
              <IconComponent className={cn('h-4 w-4', styles.iconColor)} />
            </div>
            <h3 className="font-semibold text-sm">{displayName}</h3>
          </div>
          <Badge
            variant="outline"
            className={cn('text-xs gap-1', currentStatus.badge)}
          >
            {status === 'completed' ? (
              <>
                <Check className="h-3 w-3" />
                Created
              </>
            ) : (
              <>
                <X className="h-3 w-3" />
                Failed
              </>
            )}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="relative pb-3 pt-0 space-y-2">
        {/* Error message with premium styling */}
        {status === 'failed' && error && (
          <div className="p-2.5 bg-red-500/10 rounded-lg border border-red-500/30 text-xs text-red-400">
            {error}
          </div>
        )}

        {/* Success: Show mini preview */}
        {status === 'completed' && hasPreview && (
          <div className="border border-white/10 rounded-lg overflow-hidden bg-background/30 opacity-90">
            <ToolPreviewRenderer
              toolName={toolName}
              params={params}
              isEditing={false}
            />
          </div>
        )}

        {/* Fallback for non-preview tools */}
        {status === 'completed' && !hasPreview && (
          <div className="text-xs text-muted-foreground space-y-1 p-2 bg-white/5 rounded-lg">
            {displayParams.slice(0, 3).map(([key, value]) => (
              <div key={key}>
                <span className="font-medium">{formatParamLabel(key)}:</span>{' '}
                {formatParamValue(value)}
              </div>
            ))}
            {displayParams.length > 3 && (
              <div className="text-muted-foreground/70">+{displayParams.length - 3} more fields</div>
            )}
          </div>
        )}

        {/* Action ID with premium styling */}
        {status === 'completed' && actionId && (
          <div className="text-xs text-muted-foreground pt-2 border-t border-white/5 flex items-center gap-1.5">
            <span>ID:</span>
            <span className="font-mono bg-white/5 px-1.5 py-0.5 rounded">{actionId}</span>
          </div>
        )}
      </CardContent>
    </div>
  )
}

// =============================================================================
// EXPORTS
// =============================================================================

export default ToolConfirmationCard
