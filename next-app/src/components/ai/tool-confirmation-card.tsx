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
// HELPERS
// =============================================================================

const categoryConfig: Record<ToolCategoryType, { color: string; bgColor: string; borderColor: string }> = {
  creation: { color: 'text-green-600', bgColor: 'bg-green-50 dark:bg-green-950/30', borderColor: 'border-green-500' },
  analysis: { color: 'text-blue-600', bgColor: 'bg-blue-50 dark:bg-blue-950/30', borderColor: 'border-blue-500' },
  optimization: { color: 'text-amber-600', bgColor: 'bg-amber-50 dark:bg-amber-950/30', borderColor: 'border-amber-500' },
  strategy: { color: 'text-purple-600', bgColor: 'bg-purple-50 dark:bg-purple-950/30', borderColor: 'border-purple-500' },
}

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

  const { color, bgColor, borderColor } = categoryConfig[data.category]
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
    <Card className={cn(
      'w-full max-w-lg overflow-hidden',
      bgColor,
      'border-l-4',
      borderColor,
      className
    )}>
      {/* Header */}
      <CardHeader className="pb-2 pt-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={cn('p-1.5 rounded', bgColor)}>
              <IconComponent className={cn('h-4 w-4', color)} />
            </div>
            <div>
              <h3 className="font-semibold text-sm">{data.displayName}</h3>
              <p className="text-xs text-muted-foreground">{data.description}</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {isEditing && (
              <Badge variant="secondary" className="text-xs gap-1">
                <Pencil className="h-3 w-3" />
                Editing
              </Badge>
            )}
            <Badge variant="outline" className={cn('text-xs', color)}>
              {data.category}
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pb-3 space-y-3">
        {/* Rich Preview or Fallback */}
        {hasPreview ? (
          <div className="border rounded-lg overflow-hidden bg-background/50">
            <ToolPreviewRenderer
              toolName={data.toolName}
              params={isEditing ? editedParams : data.params}
              isEditing={isEditing}
              onChange={handleParamChange}
            />
          </div>
        ) : (
          // Fallback: Key-value display for tools without rich preview
          <div className="space-y-2 p-3 border rounded-lg bg-background/50">
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
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
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
          <div className="p-2 bg-muted/50 rounded text-xs font-mono overflow-x-auto">
            <pre>{JSON.stringify(isEditing ? editedParams : data.params, null, 2)}</pre>
          </div>
        )}

        {/* Warnings */}
        {data.warnings && data.warnings.length > 0 && (
          <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-md border border-amber-200 dark:border-amber-800">
            {data.warnings.map((warning, index) => (
              <div key={index} className="flex items-start gap-2 text-xs text-amber-800 dark:text-amber-200">
                <AlertTriangle className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
                <span>{warning}</span>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      {/* Action Buttons */}
      <CardFooter className="pt-0 pb-3 gap-2">
        {/* Confirm Button */}
        <Button
          size="sm"
          onClick={handleConfirm}
          disabled={isLoading}
          className="flex-1"
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

        {/* Edit Button */}
        <Button
          size="sm"
          variant="outline"
          onClick={handleToggleEdit}
          disabled={isLoading}
        >
          <Pencil className="h-4 w-4 mr-1.5" />
          {isEditing ? 'Cancel' : 'Edit'}
        </Button>

        {/* Reject Button */}
        <Button
          size="sm"
          variant="ghost"
          onClick={onCancel}
          disabled={isLoading}
          className="text-muted-foreground hover:text-destructive"
        >
          <X className="h-4 w-4 mr-1" />
          Reject
        </Button>
      </CardFooter>
    </Card>
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
  const { color, bgColor } = categoryConfig[category]
  const IconComponent = getToolIcon(toolName)
  const hasPreview = hasRichPreview(toolName)

  const displayParams = Object.entries(params).filter(
    ([key]) => !['workspaceId', 'teamId'].includes(key)
  )

  return (
    <Card className={cn('w-full max-w-lg overflow-hidden', className)}>
      {/* Status bar */}
      <div className={cn(
        'h-1',
        status === 'completed' ? 'bg-green-500' : 'bg-red-500'
      )} />

      <CardHeader className="pb-2 pt-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={cn('p-1.5 rounded', bgColor)}>
              <IconComponent className={cn('h-4 w-4', color)} />
            </div>
            <h3 className="font-semibold text-sm">{displayName}</h3>
          </div>
          <Badge
            variant={status === 'completed' ? 'default' : 'destructive'}
            className="text-xs"
          >
            {status === 'completed' ? '✓ Created' : '✗ Failed'}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="pb-3 pt-0 space-y-2">
        {/* Error message */}
        {status === 'failed' && error && (
          <div className="p-2 bg-red-100 dark:bg-red-900/20 rounded text-xs text-red-700 dark:text-red-400">
            {error}
          </div>
        )}

        {/* Success: Show mini preview */}
        {status === 'completed' && hasPreview && (
          <div className="border rounded-lg overflow-hidden bg-muted/30 opacity-80">
            <ToolPreviewRenderer
              toolName={toolName}
              params={params}
              isEditing={false}
            />
          </div>
        )}

        {/* Fallback for non-preview tools */}
        {status === 'completed' && !hasPreview && (
          <div className="text-xs text-muted-foreground space-y-1">
            {displayParams.slice(0, 3).map(([key, value]) => (
              <div key={key}>
                <span className="font-medium">{formatParamLabel(key)}:</span>{' '}
                {formatParamValue(value)}
              </div>
            ))}
            {displayParams.length > 3 && (
              <div>+{displayParams.length - 3} more fields</div>
            )}
          </div>
        )}

        {/* Action ID */}
        {status === 'completed' && actionId && (
          <div className="text-xs text-muted-foreground pt-1 border-t">
            ID: <span className="font-mono">{actionId}</span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// =============================================================================
// EXPORTS
// =============================================================================

export default ToolConfirmationCard
