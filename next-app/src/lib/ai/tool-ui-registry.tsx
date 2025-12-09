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
import { Loader2, Search, CheckCircle2, XCircle, ExternalLink } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

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
          status: executionResult.status === 'pending' ? 'completed' : executionResult.status,
          result: executionResult.result,
          error: executionResult.error,
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

  // Tool completed - show completion card
  if (result) {
    if (result.cancelled) {
      return (
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-zinc-800/50 text-zinc-400 text-sm">
          <XCircle className="h-4 w-4" />
          <span>{config.displayName} cancelled</span>
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
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-900/20 text-red-400 text-sm">
          <XCircle className="h-4 w-4" />
          <span>Error: {executeError}</span>
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
      // Still running - show loading state
      if (status.type === 'running') {
        return (
          config.renderRunning?.(args) || (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-zinc-800/50 text-sm">
              <Loader2 className="h-4 w-4 animate-spin text-blue-400" />
              <span className="text-zinc-300">{config.displayName}...</span>
            </div>
          )
        )
      }

      // Completed - show result
      if (result) {
        return (
          config.renderResult?.(result) || (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-green-900/20 text-sm">
              <CheckCircle2 className="h-4 w-4 text-green-400" />
              <span className="text-green-300">{config.displayName} completed</span>
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
      <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-900/20 text-sm">
        <Search className="h-4 w-4 animate-pulse text-blue-400" />
        <span className="text-blue-300">Searching: &quot;{args.query}&quot;</span>
      </div>
    ),
    renderResult: (result) => (
      <div className="space-y-2 rounded-lg bg-zinc-800/50 p-3">
        <div className="flex items-center gap-2 text-sm text-zinc-400">
          <Search className="h-4 w-4" />
          <span>Found {result.totalResults} results</span>
        </div>
        <div className="space-y-1.5">
          {result.results.slice(0, 3).map((item, i) => (
            <a
              key={i}
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block p-2 rounded bg-zinc-900/50 hover:bg-zinc-700/50 transition-colors"
            >
              <div className="flex items-center gap-2 text-blue-400 text-sm font-medium">
                <ExternalLink className="h-3 w-3" />
                {item.title}
              </div>
              <p className="text-xs text-zinc-500 mt-1 line-clamp-2">{item.snippet}</p>
            </a>
          ))}
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
      <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-purple-900/20 text-sm">
        <Loader2 className="h-4 w-4 animate-spin text-purple-400" />
        <span className="text-purple-300">Extracting from: {args.url}</span>
      </div>
    ),
    renderResult: (result) => (
      <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-purple-900/20 text-sm">
        {result.success ? (
          <>
            <CheckCircle2 className="h-4 w-4 text-green-400" />
            <span className="text-green-300">Data extracted successfully</span>
          </>
        ) : (
          <>
            <XCircle className="h-4 w-4 text-red-400" />
            <span className="text-red-300">Extraction failed</span>
          </>
        )}
      </div>
    ),
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
      <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-900/20 text-sm">
        <Loader2 className="h-4 w-4 animate-spin text-amber-400" />
        <span className="text-amber-300">Analyzing feedback...</span>
      </div>
    ),
    renderResult: (result) => (
      <div className="space-y-2 rounded-lg bg-zinc-800/50 p-3">
        <p className="text-sm text-zinc-300">{result.summary}</p>
        <div className="flex gap-2">
          <Badge variant="outline" className="text-green-400 border-green-800">
            +{result.sentimentBreakdown.positive}
          </Badge>
          <Badge variant="outline" className="text-zinc-400 border-zinc-700">
            ~{result.sentimentBreakdown.neutral}
          </Badge>
          <Badge variant="outline" className="text-red-400 border-red-800">
            -{result.sentimentBreakdown.negative}
          </Badge>
        </div>
        {result.topThemes.length > 0 && (
          <div className="flex flex-wrap gap-1 pt-1">
            {result.topThemes.map((theme, i) => (
              <Badge key={i} variant="secondary" className="text-xs">
                {theme}
              </Badge>
            ))}
          </div>
        )}
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
