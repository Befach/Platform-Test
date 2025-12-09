'use client'

/**
 * Chat Thread Persistence Hooks
 *
 * Provides hooks for managing chat threads and messages with Supabase.
 * Features:
 * - Thread CRUD operations
 * - Message persistence
 * - Real-time subscriptions
 * - Optimistic updates
 *
 * Integrates with assistant-ui's runtime for thread management.
 */

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js'

// =============================================================================
// TYPES
// =============================================================================

export interface ChatThread {
  id: string
  team_id: string
  workspace_id: string
  title: string | null
  created_at: string
  updated_at: string
  metadata: Record<string, unknown>
  created_by: string | null
  status: 'active' | 'archived' | 'deleted'
}

export interface ChatMessage {
  id: string
  thread_id: string
  role: 'user' | 'assistant' | 'system'
  content: string | null
  parts: Array<{
    type: string
    text?: string
    [key: string]: unknown
  }> | null
  tool_invocations: Array<{
    toolName: string
    state: string
    args?: unknown
    result?: unknown
  }> | null
  model_used: string | null
  metadata: Record<string, unknown>
  created_at: string
}

interface UseThreadsOptions {
  teamId: string
  workspaceId: string
  limit?: number
}

interface UseMessagesOptions {
  threadId: string | null
  enabled?: boolean
}

// =============================================================================
// HELPER: Generate ID
// =============================================================================

function generateId(): string {
  return Date.now().toString()
}

// =============================================================================
// HOOK: useThreads
// =============================================================================

/**
 * Hook for managing chat threads in a workspace.
 * Provides CRUD operations and real-time updates.
 */
export function useThreads({ teamId, workspaceId, limit = 50 }: UseThreadsOptions) {
  const [threads, setThreads] = useState<ChatThread[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const supabase = createClient()

  // Fetch threads
  const fetchThreads = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)

      const { data, error: fetchError } = await supabase
        .from('chat_threads')
        .select('*')
        .eq('team_id', teamId)
        .eq('workspace_id', workspaceId)
        .eq('status', 'active')
        .order('updated_at', { ascending: false })
        .limit(limit)

      if (fetchError) throw fetchError

      setThreads((data || []) as ChatThread[])
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch threads'))
    } finally {
      setIsLoading(false)
    }
  }, [supabase, teamId, workspaceId, limit])

  // Create new thread
  const createThread = useCallback(
    async (title?: string): Promise<ChatThread | null> => {
      try {
        const newThread = {
          id: generateId(),
          team_id: teamId,
          workspace_id: workspaceId,
          title: title || null,
          status: 'active' as const,
          metadata: {},
        }

        const { data, error: insertError } = await supabase
          .from('chat_threads')
          .insert(newThread)
          .select()
          .single()

        if (insertError) throw insertError

        const thread = data as ChatThread

        // Optimistic update
        setThreads((prev) => [thread, ...prev])

        return thread
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to create thread'))
        return null
      }
    },
    [supabase, teamId, workspaceId]
  )

  // Update thread title
  const updateThreadTitle = useCallback(
    async (threadId: string, title: string): Promise<boolean> => {
      try {
        const { error: updateError } = await supabase
          .from('chat_threads')
          .update({ title })
          .eq('id', threadId)
          .eq('team_id', teamId)

        if (updateError) throw updateError

        // Optimistic update
        setThreads((prev) =>
          prev.map((t) => (t.id === threadId ? { ...t, title } : t))
        )

        return true
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to update thread'))
        return false
      }
    },
    [supabase, teamId]
  )

  // Archive thread (soft delete)
  const archiveThread = useCallback(
    async (threadId: string): Promise<boolean> => {
      try {
        const { error: updateError } = await supabase
          .from('chat_threads')
          .update({ status: 'archived' })
          .eq('id', threadId)
          .eq('team_id', teamId)

        if (updateError) throw updateError

        // Remove from list
        setThreads((prev) => prev.filter((t) => t.id !== threadId))

        return true
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to archive thread'))
        return false
      }
    },
    [supabase, teamId]
  )

  // Real-time subscription
  useEffect(() => {
    fetchThreads()

    // Subscribe to changes
    const channel = supabase
      .channel(`threads:${workspaceId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'chat_threads',
          filter: `workspace_id=eq.${workspaceId}`,
        },
        (payload: RealtimePostgresChangesPayload<ChatThread>) => {
          if (payload.eventType === 'INSERT') {
            setThreads((prev) => [payload.new as ChatThread, ...prev])
          } else if (payload.eventType === 'UPDATE') {
            setThreads((prev) =>
              prev.map((t) =>
                t.id === (payload.new as ChatThread).id
                  ? (payload.new as ChatThread)
                  : t
              )
            )
          } else if (payload.eventType === 'DELETE') {
            setThreads((prev) =>
              prev.filter((t) => t.id !== (payload.old as ChatThread).id)
            )
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase, workspaceId, fetchThreads])

  return {
    threads,
    isLoading,
    error,
    createThread,
    updateThreadTitle,
    archiveThread,
    refetch: fetchThreads,
  }
}

// =============================================================================
// HOOK: useMessages
// =============================================================================

/**
 * Hook for managing messages within a thread.
 * Provides message loading, saving, and real-time updates.
 */
export function useMessages({ threadId, enabled = true }: UseMessagesOptions) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const supabase = createClient()

  // Fetch messages for thread
  const fetchMessages = useCallback(async () => {
    if (!threadId || !enabled) return

    try {
      setIsLoading(true)
      setError(null)

      const { data, error: fetchError } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('thread_id', threadId)
        .order('created_at', { ascending: true })

      if (fetchError) throw fetchError

      setMessages((data || []) as ChatMessage[])
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch messages'))
    } finally {
      setIsLoading(false)
    }
  }, [supabase, threadId, enabled])

  // Add message to thread
  const addMessage = useCallback(
    async (message: Omit<ChatMessage, 'id' | 'thread_id' | 'created_at'>): Promise<ChatMessage | null> => {
      if (!threadId) return null

      try {
        const newMessage = {
          id: generateId(),
          thread_id: threadId,
          ...message,
        }

        const { data, error: insertError } = await supabase
          .from('chat_messages')
          .insert(newMessage)
          .select()
          .single()

        if (insertError) throw insertError

        const msg = data as ChatMessage

        // Optimistic update
        setMessages((prev) => [...prev, msg])

        return msg
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to add message'))
        return null
      }
    },
    [supabase, threadId]
  )

  // Batch add messages (for initial thread creation)
  const addMessages = useCallback(
    async (messageList: Array<Omit<ChatMessage, 'id' | 'thread_id' | 'created_at'>>): Promise<boolean> => {
      if (!threadId) return false

      try {
        const newMessages = messageList.map((msg) => ({
          id: generateId(),
          thread_id: threadId,
          ...msg,
        }))

        const { error: insertError } = await supabase
          .from('chat_messages')
          .insert(newMessages)

        if (insertError) throw insertError

        // Refetch to get proper timestamps
        await fetchMessages()

        return true
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to add messages'))
        return false
      }
    },
    [supabase, threadId, fetchMessages]
  )

  // Clear messages (for thread reset)
  const clearMessages = useCallback(() => {
    setMessages([])
  }, [])

  // Real-time subscription
  useEffect(() => {
    if (!threadId || !enabled) {
      setMessages([])
      return
    }

    fetchMessages()

    // Subscribe to new messages
    const channel = supabase
      .channel(`messages:${threadId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `thread_id=eq.${threadId}`,
        },
        (payload: RealtimePostgresChangesPayload<ChatMessage>) => {
          setMessages((prev) => {
            // Avoid duplicates
            const exists = prev.some((m) => m.id === (payload.new as ChatMessage).id)
            if (exists) return prev
            return [...prev, payload.new as ChatMessage]
          })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase, threadId, enabled, fetchMessages])

  return {
    messages,
    isLoading,
    error,
    addMessage,
    addMessages,
    clearMessages,
    refetch: fetchMessages,
  }
}

// =============================================================================
// HOOK: useCurrentThread
// =============================================================================

/**
 * Composite hook for managing the current active thread.
 * Combines thread and message management.
 */
export function useCurrentThread({
  teamId,
  workspaceId,
}: {
  teamId: string
  workspaceId: string
}) {
  const [currentThreadId, setCurrentThreadId] = useState<string | null>(null)

  const {
    threads,
    isLoading: threadsLoading,
    createThread,
    updateThreadTitle,
    archiveThread,
  } = useThreads({ teamId, workspaceId })

  const {
    messages,
    isLoading: messagesLoading,
    addMessage,
    addMessages,
    clearMessages,
  } = useMessages({
    threadId: currentThreadId,
    enabled: !!currentThreadId,
  })

  // Select a thread
  const selectThread = useCallback((threadId: string | null) => {
    setCurrentThreadId(threadId)
  }, [])

  // Create and select new thread
  const startNewThread = useCallback(async (): Promise<ChatThread | null> => {
    const thread = await createThread()
    if (thread) {
      setCurrentThreadId(thread.id)
    }
    return thread
  }, [createThread])

  // Get current thread data
  const currentThread = currentThreadId
    ? threads.find((t) => t.id === currentThreadId) || null
    : null

  return {
    // Thread state
    currentThread,
    currentThreadId,
    threads,

    // Message state
    messages,

    // Loading states
    isLoading: threadsLoading || messagesLoading,
    threadsLoading,
    messagesLoading,

    // Thread actions
    selectThread,
    startNewThread,
    createThread,
    updateThreadTitle,
    archiveThread,

    // Message actions
    addMessage,
    addMessages,
    clearMessages,
  }
}

// =============================================================================
// EXPORTS
// =============================================================================

export type { UseThreadsOptions, UseMessagesOptions }
