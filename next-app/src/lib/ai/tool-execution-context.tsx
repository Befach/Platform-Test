'use client'

/**
 * Tool Execution Context
 *
 * Provides workspace/team context to tool UIs so they can call
 * the execute endpoint with proper authorization.
 */

import { createContext, useContext, useCallback, type ReactNode } from 'react'

interface ToolExecutionContextValue {
  teamId: string
  workspaceId: string
  executeToolAction: (
    toolName: string,
    params: Record<string, unknown>
  ) => Promise<ExecutionResult>
}

interface ExecutionResult {
  success: boolean
  actionId?: string
  status: 'pending' | 'completed' | 'failed'
  result?: unknown
  error?: string
}

const ToolExecutionContext = createContext<ToolExecutionContextValue | null>(null)

export function useToolExecution() {
  const context = useContext(ToolExecutionContext)
  if (!context) {
    throw new Error('useToolExecution must be used within ToolExecutionProvider')
  }
  return context
}

interface ToolExecutionProviderProps {
  teamId: string
  workspaceId: string
  children: ReactNode
}

export function ToolExecutionProvider({
  teamId,
  workspaceId,
  children,
}: ToolExecutionProviderProps) {
  const executeToolAction = useCallback(
    async (
      toolName: string,
      params: Record<string, unknown>
    ): Promise<ExecutionResult> => {
      try {
        // Step 1: Call execute endpoint
        const response = await fetch('/api/ai/agent/execute', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            toolName,
            params,
            workspaceId,
            teamId,
          }),
        })

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          return {
            success: false,
            status: 'failed',
            error: errorData.error || `HTTP ${response.status}`,
          }
        }

        const result = await response.json()

        // Step 2: If pending (requires approval), auto-approve since user already confirmed
        if (result.status === 'pending' && result.actionId) {
          console.log('[Tool Execution] Auto-approving pending action:', result.actionId)

          const approveResponse = await fetch('/api/ai/agent/approve', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              actionId: result.actionId,
            }),
          })

          if (!approveResponse.ok) {
            const errorData = await approveResponse.json().catch(() => ({}))
            return {
              success: false,
              actionId: result.actionId,
              status: 'failed',
              error: errorData.error || `Approval failed: HTTP ${approveResponse.status}`,
            }
          }

          const approveResult = await approveResponse.json()
          return approveResult
        }

        return result
      } catch (error) {
        console.error('[Tool Execution] Error:', error)
        return {
          success: false,
          status: 'failed',
          error: error instanceof Error ? error.message : 'Unknown error',
        }
      }
    },
    [teamId, workspaceId]
  )

  return (
    <ToolExecutionContext.Provider
      value={{
        teamId,
        workspaceId,
        executeToolAction,
      }}
    >
      {children}
    </ToolExecutionContext.Provider>
  )
}

export type { ExecutionResult }
