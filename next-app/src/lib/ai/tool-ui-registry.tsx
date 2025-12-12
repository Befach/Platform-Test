'use client'

/**
 * Tool UI Registry for assistant-ui
 *
 * Provides scalable, type-safe tool UI components using assistant-ui's
 * makeAssistantToolUI pattern. Supports:
 * - Human-in-the-Loop confirmations via addResult()
 * - Actual execution via /api/ai/agent/execute endpoint
 * - Streaming tool states (running, complete)
 * - Category-based styling
 * - Easy registration of new tools
 *
 * @see https://www.assistant-ui.com/docs/advanced/ToolUI
 */

import { useState } from 'react'
import { makeAssistantToolUI } from '@assistant-ui/react'
import { ToolConfirmationCard, CompletedActionCard } from '@/components/ai/tool-confirmation-card'
import { useToolExecution } from './tool-execution-context'
import type {
  ToolCategory,
  CreateWorkItemParams,
  CreateTaskParams,
  CreateDependencyParams,
  CreateTimelineItemParams,
  CreateInsightParams,
} from './schemas/agentic-schemas'
import { Loader2, Search, CheckCircle2, XCircle, ExternalLink, Ban } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

// =============================================================================
// PREMIUM STYLE CONSTANTS FOR STREAMING TOOLS
// =============================================================================

/**
 * Premium streaming tool state styles
 */
const streamingStyles = {
  running: {
    base: cn(
      'relative overflow-hidden rounded-xl',
      'bg-gradient-to-br from-background/95 via-background/90 to-background/80',
      'backdrop-blur-xl',
      'border border-white/10',
      'shadow-lg shadow-black/5'
    ),
    blue: {
      accentBar: 'bg-gradient-to-r from-blue-500 to-cyan-500',
      overlay: 'from-blue-500/5 via-transparent to-cyan-500/5',
      glow: 'shadow-blue-500/10',
      iconBg: 'bg-gradient-to-br from-blue-500/20 to-cyan-500/10 border border-blue-500/30',
      iconColor: 'text-blue-400',
      textColor: 'text-blue-300',
    },
    purple: {
      accentBar: 'bg-gradient-to-r from-purple-500 to-violet-500',
      overlay: 'from-purple-500/5 via-transparent to-violet-500/5',
      glow: 'shadow-purple-500/10',
      iconBg: 'bg-gradient-to-br from-purple-500/20 to-violet-500/10 border border-purple-500/30',
      iconColor: 'text-purple-400',
      textColor: 'text-purple-300',
    },
    amber: {
      accentBar: 'bg-gradient-to-r from-amber-500 to-orange-500',
      overlay: 'from-amber-500/5 via-transparent to-orange-500/5',
      glow: 'shadow-amber-500/10',
      iconBg: 'bg-gradient-to-br from-amber-500/20 to-orange-500/10 border border-amber-500/30',
      iconColor: 'text-amber-400',
      textColor: 'text-amber-300',
    },
  },
  success: {
    accentBar: 'bg-gradient-to-r from-emerald-500 to-green-500',
    overlay: 'from-emerald-500/5 via-transparent to-green-500/5',
    glow: 'shadow-emerald-500/10',
    iconBg: 'bg-gradient-to-br from-emerald-500/20 to-green-500/10 border border-emerald-500/30',
    iconColor: 'text-emerald-400',
    textColor: 'text-emerald-300',
  },
  error: {
    accentBar: 'bg-gradient-to-r from-red-500 to-rose-500',
    overlay: 'from-red-500/5 via-transparent to-rose-500/5',
    glow: 'shadow-red-500/10',
    iconBg: 'bg-gradient-to-br from-red-500/20 to-rose-500/10 border border-red-500/30',
    iconColor: 'text-red-400',
    textColor: 'text-red-300',
  },
  cancelled: {
    accentBar: 'bg-gradient-to-r from-slate-500 to-zinc-500',
    overlay: 'from-slate-500/5 via-transparent to-zinc-500/5',
    glow: 'shadow-slate-500/10',
    iconBg: 'bg-gradient-to-br from-slate-500/20 to-zinc-500/10 border border-slate-500/30',
    iconColor: 'text-slate-400',
    textColor: 'text-slate-300',
  },
}

// =============================================================================
// TYPES
// =============================================================================

interface ToolUIConfig<TArgs, TResult> {
  displayName: string
  category: ToolCategory
  description?: string
  renderResult?: (result: TResult) => React.ReactNode
  renderRunning?: (args: TArgs) => React.ReactNode
}

interface ConfirmationResult {
  confirmed: boolean
  params?: Record<string, unknown>
  cancelled?: boolean
  executionResult?: {
    success: boolean
    actionId?: string
    status: 'completed' | 'failed'
    result?: unknown
    error?: string
  }
}

// =============================================================================
// CONFIRMATION TOOL WRAPPER COMPONENT
// =============================================================================

/**
 * Wrapper component that handles tool execution.
 * This allows us to use hooks (useToolExecution) inside the render function.
 */
function ConfirmationToolWrapper<TArgs extends Record<string, unknown>>({
  toolName,
  config,
  args,
  result,
  addResult,
}: {
  toolName: string
  config: ToolUIConfig<TArgs, ConfirmationResult>
  args: TArgs
  result: ConfirmationResult | undefined
  addResult: (result: ConfirmationResult) => void
}) {
  const [isExecuting, setIsExecuting] = useState(false)
  const [executeError, setExecuteError] = useState<string | null>(null)

  // Try to get execution context - may fail if not wrapped in provider
  let executeToolAction: ((toolName: string, params: Record<string, unknown>) => Promise<{
    success: boolean
    actionId?: string
    status: 'pending' | 'completed' | 'failed'
    result?: unknown
    error?: string
  }>) | null = null

  try {
    const context = useToolExecution()
    executeToolAction = context.executeToolAction
  } catch {
    // Context not available - will show error on confirm
  }

  const handleConfirm = async (params: Record<string, unknown>) => {
    if (!executeToolAction) {
      setExecuteError('Tool execution context not available')
      addResult({
        confirmed: true,
        params,
        executionResult: {
          success: false,
          status: 'failed',
          error: 'Tool execution context not available',
        },
      })
      return
    }

    setIsExecuting(true)
    setExecuteError(null)

    try {
      const executionResult = await executeToolAction(toolName, params)

      addResult({
        confirmed: true,
        params,
        executionResult: {
          success: executionResult.success,
          actionId: executionResult.actionId,
          // If status is still 'pending' after auto-approval, something went wrong
          status: executionResult.status === 'pending' ? 'failed' : executionResult.status,
          result: executionResult.result,
          error: executionResult.error || (executionResult.status === 'pending' ? 'Approval incomplete' : undefined),
        },
      })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      setExecuteError(errorMessage)
      addResult({
        confirmed: true,
        params,
        executionResult: {
          success: false,
          status: 'failed',
          error: errorMessage,
        },
      })
    } finally {
      setIsExecuting(false)
    }
  }

  const handleCancel = () => {
    addResult({ confirmed: false, cancelled: true })
  }

  // Check if this is a USER confirmation result (from addResult) vs TOOL preview result
  // Tool preview result has: { requiresApproval, preview, toolCallId }
  // User confirmation result has: { confirmed, executionResult, params, cancelled }
  const isUserConfirmationResult = result && ('confirmed' in result || 'cancelled' in result)

  // Tool completed by user - show completion card
  if (isUserConfirmationResult && result) {
    if (result.cancelled) {
      return (
        <div className={cn(streamingStyles.running.base, streamingStyles.cancelled.glow)}>
          {/* Cancelled accent bar */}
          <div className={cn('h-1 w-full', streamingStyles.cancelled.accentBar)} />
          {/* Overlay */}
          <div className={cn('absolute inset-0 bg-gradient-to-br pointer-events-none', streamingStyles.cancelled.overlay)} />
          {/* Content */}
          <div className="relative flex items-center gap-2.5 px-3 py-2.5">
            <div className={cn('p-1.5 rounded-lg', streamingStyles.cancelled.iconBg)}>
              <Ban className={cn('h-4 w-4', streamingStyles.cancelled.iconColor)} />
            </div>
            <span className={cn('text-sm', streamingStyles.cancelled.textColor)}>{config.displayName} cancelled</span>
          </div>
        </div>
      )
    }

    const execResult = result.executionResult
    const success = execResult?.success ?? result.confirmed

    return (
      <CompletedActionCard
        toolName={toolName}
        displayName={config.displayName}
        category={config.category}
        params={result.params || (args as Record<string, unknown>)}
        status={success ? 'completed' : 'failed'}
        error={execResult?.error}
        actionId={execResult?.actionId}
      />
    )
  }

  // Show error if any
  if (executeError) {
    return (
      <div className="space-y-2">
        <div className={cn(streamingStyles.running.base, streamingStyles.error.glow)}>
          {/* Error accent bar */}
          <div className={cn('h-1 w-full', streamingStyles.error.accentBar)} />
          {/* Overlay */}
          <div className={cn('absolute inset-0 bg-gradient-to-br pointer-events-none', streamingStyles.error.overlay)} />
          {/* Content */}
          <div className="relative flex items-center gap-2.5 px-3 py-2.5">
            <div className={cn('p-1.5 rounded-lg', streamingStyles.error.iconBg)}>
              <XCircle className={cn('h-4 w-4', streamingStyles.error.iconColor)} />
            </div>
            <span className={cn('text-sm', streamingStyles.error.textColor)}>Error: {executeError}</span>
          </div>
        </div>
        <ToolConfirmationCard
          data={{
            toolName,
            displayName: config.displayName,
            category: config.category,
            params: args as Record<string, unknown>,
            description: config.description || `Confirm ${config.displayName.toLowerCase()}`,
          }}
          onConfirm={handleConfirm}
          onEdit={handleConfirm}
          onCancel={handleCancel}
          isLoading={isExecuting}
        />
      </div>
    )
  }

  // Tool is running/waiting for confirmation - show confirmation card
  return (
    <ToolConfirmationCard
      data={{
        toolName,
        displayName: config.displayName,
        category: config.category,
        params: args as Record<string, unknown>,
        description: config.description || `Confirm ${config.displayName.toLowerCase()}`,
      }}
      onConfirm={handleConfirm}
      onEdit={handleConfirm}
      onCancel={handleCancel}
      isLoading={isExecuting}
    />
  )
}

// =============================================================================
// FACTORY: Confirmation Tool UI
// =============================================================================

/**
 * Factory function to create confirmation-based tool UIs.
 * Uses Human-in-the-Loop pattern with addResult() for user approval.
 * Actually executes the tool via /api/ai/agent/execute on confirmation.
 */
function createConfirmationToolUI<TArgs extends Record<string, unknown>>(
  toolName: string,
  config: ToolUIConfig<TArgs, ConfirmationResult>
) {
  return makeAssistantToolUI<TArgs, ConfirmationResult>({
    toolName,
    render: function ConfirmationToolUIRender({ args, result, addResult }) {
      return (
        <ConfirmationToolWrapper
          toolName={toolName}
          config={config}
          args={args}
          result={result}
          addResult={addResult}
        />
      )
    },
  })
}

// =============================================================================
// FACTORY: Streaming Tool UI (No Confirmation)
// =============================================================================

/**
 * Factory function for tools that execute immediately without confirmation.
 * Shows loading state while running, then displays results.
 */
function createStreamingToolUI<TArgs extends Record<string, unknown>, TResult>(
  toolName: string,
  config: ToolUIConfig<TArgs, TResult>
) {
  return makeAssistantToolUI<TArgs, TResult>({
    toolName,
    render: function StreamingToolUIRender({ args, result, status }) {
      // Still running - show premium loading state
      if (status.type === 'running') {
        return (
          config.renderRunning?.(args) || (
            <div className={cn(streamingStyles.running.base, streamingStyles.running.blue.glow)}>
              {/* Running accent bar */}
              <div className={cn('h-1 w-full', streamingStyles.running.blue.accentBar)} />
              {/* Overlay */}
              <div className={cn('absolute inset-0 bg-gradient-to-br pointer-events-none', streamingStyles.running.blue.overlay)} />
              {/* Content */}
              <div className="relative flex items-center gap-2.5 px-3 py-2.5">
                <div className={cn('p-1.5 rounded-lg', streamingStyles.running.blue.iconBg)}>
                  <Loader2 className={cn('h-4 w-4 animate-spin', streamingStyles.running.blue.iconColor)} />
                </div>
                <span className={cn('text-sm', streamingStyles.running.blue.textColor)}>{config.displayName}...</span>
              </div>
            </div>
          )
        )
      }

      // Completed - show premium result
      if (result) {
        return (
          config.renderResult?.(result) || (
            <div className={cn(streamingStyles.running.base, streamingStyles.success.glow)}>
              {/* Success accent bar */}
              <div className={cn('h-1 w-full', streamingStyles.success.accentBar)} />
              {/* Overlay */}
              <div className={cn('absolute inset-0 bg-gradient-to-br pointer-events-none', streamingStyles.success.overlay)} />
              {/* Content */}
              <div className="relative flex items-center gap-2.5 px-3 py-2.5">
                <div className={cn('p-1.5 rounded-lg', streamingStyles.success.iconBg)}>
                  <CheckCircle2 className={cn('h-4 w-4', streamingStyles.success.iconColor)} />
                </div>
                <span className={cn('text-sm', streamingStyles.success.textColor)}>{config.displayName} completed</span>
              </div>
            </div>
          )
        )
      }

      // Fallback
      return null
    },
  })
}

// =============================================================================
// CREATION TOOLS (Require Confirmation)
// =============================================================================

export const CreateWorkItemToolUI = createConfirmationToolUI<CreateWorkItemParams>(
  'createWorkItem',
  {
    displayName: 'Create Work Item',
    category: 'creation',
    description: 'Create a new work item (feature, bug, enhancement, or concept)',
  }
)

export const CreateTaskToolUI = createConfirmationToolUI<CreateTaskParams>(
  'createTask',
  {
    displayName: 'Create Task',
    category: 'creation',
    description: 'Create a new task for a work item',
  }
)

export const CreateDependencyToolUI = createConfirmationToolUI<CreateDependencyParams>(
  'createDependency',
  {
    displayName: 'Create Dependency',
    category: 'creation',
    description: 'Link two work items with a dependency relationship',
  }
)

export const CreateTimelineItemToolUI = createConfirmationToolUI<CreateTimelineItemParams>(
  'createTimelineItem',
  {
    displayName: 'Create Timeline Item',
    category: 'creation',
    description: 'Add a timeline breakdown (MVP/Short/Long term)',
  }
)

export const CreateInsightToolUI = createConfirmationToolUI<CreateInsightParams>(
  'createInsight',
  {
    displayName: 'Create Customer Insight',
    category: 'creation',
    description: 'Record a customer insight or feedback',
  }
)

// =============================================================================
// RESEARCH TOOLS (No Confirmation - Immediate Execution)
// =============================================================================

interface WebSearchArgs {
  query: string
  maxResults?: number
  [key: string]: unknown
}

interface WebSearchResult {
  results: Array<{
    title: string
    url: string
    snippet: string
  }>
  totalResults: number
}

export const WebSearchToolUI = createStreamingToolUI<WebSearchArgs, WebSearchResult>(
  'webSearch',
  {
    displayName: 'Web Search',
    category: 'analysis',
    renderRunning: (args) => (
      <div className={cn(streamingStyles.running.base, streamingStyles.running.blue.glow)}>
        {/* Running accent bar */}
        <div className={cn('h-1 w-full', streamingStyles.running.blue.accentBar)} />
        {/* Overlay */}
        <div className={cn('absolute inset-0 bg-gradient-to-br pointer-events-none', streamingStyles.running.blue.overlay)} />
        {/* Content */}
        <div className="relative flex items-center gap-2.5 px-3 py-2.5">
          <div className={cn('p-1.5 rounded-lg', streamingStyles.running.blue.iconBg)}>
            <Search className={cn('h-4 w-4 animate-pulse', streamingStyles.running.blue.iconColor)} />
          </div>
          <span className={cn('text-sm', streamingStyles.running.blue.textColor)}>Searching: &quot;{args.query}&quot;</span>
        </div>
      </div>
    ),
    renderResult: (result) => (
      <div className={cn(streamingStyles.running.base, streamingStyles.success.glow)}>
        {/* Success accent bar */}
        <div className={cn('h-1 w-full', streamingStyles.success.accentBar)} />
        {/* Overlay */}
        <div className={cn('absolute inset-0 bg-gradient-to-br pointer-events-none', streamingStyles.success.overlay)} />
        {/* Content */}
        <div className="relative p-3 space-y-2.5">
          <div className="flex items-center gap-2 text-sm">
            <div className={cn('p-1.5 rounded-lg', streamingStyles.success.iconBg)}>
              <Search className={cn('h-4 w-4', streamingStyles.success.iconColor)} />
            </div>
            <span className={cn(streamingStyles.success.textColor)}>Found {result.totalResults} results</span>
          </div>
          <div className="space-y-1.5">
            {result.results.slice(0, 3).map((item, i) => (
              <a
                key={i}
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block p-2.5 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all"
              >
                <div className="flex items-center gap-2 text-blue-400 text-sm font-medium">
                  <ExternalLink className="h-3 w-3" />
                  {item.title}
                </div>
                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{item.snippet}</p>
              </a>
            ))}
          </div>
        </div>
      </div>
    ),
  }
)

interface ExtractDataArgs {
  url: string
  objective: string
  [key: string]: unknown
}

interface ExtractDataResult {
  success: boolean
  data: Record<string, unknown>
  source: string
}

export const ExtractDataToolUI = createStreamingToolUI<ExtractDataArgs, ExtractDataResult>(
  'extractData',
  {
    displayName: 'Extract Data',
    category: 'analysis',
    renderRunning: (args) => (
      <div className={cn(streamingStyles.running.base, streamingStyles.running.purple.glow)}>
        {/* Running accent bar */}
        <div className={cn('h-1 w-full', streamingStyles.running.purple.accentBar)} />
        {/* Overlay */}
        <div className={cn('absolute inset-0 bg-gradient-to-br pointer-events-none', streamingStyles.running.purple.overlay)} />
        {/* Content */}
        <div className="relative flex items-center gap-2.5 px-3 py-2.5">
          <div className={cn('p-1.5 rounded-lg', streamingStyles.running.purple.iconBg)}>
            <Loader2 className={cn('h-4 w-4 animate-spin', streamingStyles.running.purple.iconColor)} />
          </div>
          <span className={cn('text-sm', streamingStyles.running.purple.textColor)}>Extracting from: {args.url}</span>
        </div>
      </div>
    ),
    renderResult: (result) => {
      const styles = result.success ? streamingStyles.success : streamingStyles.error
      return (
        <div className={cn(streamingStyles.running.base, styles.glow)}>
          {/* Result accent bar */}
          <div className={cn('h-1 w-full', styles.accentBar)} />
          {/* Overlay */}
          <div className={cn('absolute inset-0 bg-gradient-to-br pointer-events-none', styles.overlay)} />
          {/* Content */}
          <div className="relative flex items-center gap-2.5 px-3 py-2.5">
            <div className={cn('p-1.5 rounded-lg', styles.iconBg)}>
              {result.success ? (
                <CheckCircle2 className={cn('h-4 w-4', styles.iconColor)} />
              ) : (
                <XCircle className={cn('h-4 w-4', styles.iconColor)} />
              )}
            </div>
            <span className={cn('text-sm', styles.textColor)}>
              {result.success ? 'Data extracted successfully' : 'Extraction failed'}
            </span>
          </div>
        </div>
      )
    },
  }
)

// =============================================================================
// ANALYSIS TOOLS
// =============================================================================

interface AnalyzeFeedbackArgs {
  workspaceId: string
  timeRange?: string
  [key: string]: unknown
}

interface AnalyzeFeedbackResult {
  summary: string
  sentimentBreakdown: {
    positive: number
    neutral: number
    negative: number
  }
  topThemes: string[]
}

export const AnalyzeFeedbackToolUI = createStreamingToolUI<AnalyzeFeedbackArgs, AnalyzeFeedbackResult>(
  'analyzeFeedback',
  {
    displayName: 'Analyze Feedback',
    category: 'analysis',
    renderRunning: () => (
      <div className={cn(streamingStyles.running.base, streamingStyles.running.amber.glow)}>
        {/* Running accent bar */}
        <div className={cn('h-1 w-full', streamingStyles.running.amber.accentBar)} />
        {/* Overlay */}
        <div className={cn('absolute inset-0 bg-gradient-to-br pointer-events-none', streamingStyles.running.amber.overlay)} />
        {/* Content */}
        <div className="relative flex items-center gap-2.5 px-3 py-2.5">
          <div className={cn('p-1.5 rounded-lg', streamingStyles.running.amber.iconBg)}>
            <Loader2 className={cn('h-4 w-4 animate-spin', streamingStyles.running.amber.iconColor)} />
          </div>
          <span className={cn('text-sm', streamingStyles.running.amber.textColor)}>Analyzing feedback...</span>
        </div>
      </div>
    ),
    renderResult: (result) => (
      <div className={cn(streamingStyles.running.base, streamingStyles.running.amber.glow)}>
        {/* Success accent bar */}
        <div className={cn('h-1 w-full', streamingStyles.running.amber.accentBar)} />
        {/* Overlay */}
        <div className={cn('absolute inset-0 bg-gradient-to-br pointer-events-none', streamingStyles.running.amber.overlay)} />
        {/* Content */}
        <div className="relative p-3 space-y-2.5">
          <p className="text-sm text-foreground/90">{result.summary}</p>
          <div className="flex gap-2">
            <Badge
              variant="outline"
              className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
            >
              +{result.sentimentBreakdown.positive}
            </Badge>
            <Badge
              variant="outline"
              className="bg-slate-500/10 text-slate-400 border-slate-500/30"
            >
              ~{result.sentimentBreakdown.neutral}
            </Badge>
            <Badge
              variant="outline"
              className="bg-red-500/10 text-red-400 border-red-500/30"
            >
              -{result.sentimentBreakdown.negative}
            </Badge>
          </div>
          {result.topThemes.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {result.topThemes.map((theme, i) => (
                <Badge
                  key={i}
                  variant="outline"
                  className="text-xs bg-white/5 border-white/10 hover:bg-white/10"
                >
                  {theme}
                </Badge>
              ))}
            </div>
          )}
        </div>
      </div>
    ),
  }
)

// =============================================================================
// TOOL UI REGISTRY
// =============================================================================

/**
 * All registered tool UIs.
 * Import this array and pass to AssistantRuntimeProvider's tools prop.
 */
export const toolUIRegistry = [
  // Creation tools (require confirmation)
  CreateWorkItemToolUI,
  CreateTaskToolUI,
  CreateDependencyToolUI,
  CreateTimelineItemToolUI,
  CreateInsightToolUI,

  // Research tools (immediate execution)
  WebSearchToolUI,
  ExtractDataToolUI,

  // Analysis tools
  AnalyzeFeedbackToolUI,
]

/**
 * Get tool UI by name for dynamic registration
 */
export function getToolUI(toolName: string) {
  return toolUIRegistry.find((ui) => {
    // Access the toolName from the component's config
    // This is a simplified lookup - in production you might use a Map
    return (ui as { toolName?: string }).toolName === toolName
  })
}

// =============================================================================
// EXPORTS
// =============================================================================

export {
  createConfirmationToolUI,
  createStreamingToolUI,
}

export type { ToolUIConfig, ConfirmationResult }
