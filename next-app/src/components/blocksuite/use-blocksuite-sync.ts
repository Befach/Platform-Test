/**
 * BlockSuite Sync Hook
 * Phase 4: Supabase Persistence (Yjs + Real-time)
 *
 * React hook for integrating BlockSuite documents with Supabase persistence.
 * Manages the HybridProvider lifecycle and provides sync status.
 */

'use client'

import { useEffect, useRef, useState, useCallback, useMemo } from 'react'
import type { Doc } from 'yjs'
import { createClient } from '@/lib/supabase/client'
import { HybridProvider } from './hybrid-provider'
import {
  DEFAULT_DEBOUNCE_MS,
  getStoragePath,
  type UseBlockSuiteSyncOptions,
  type UseBlockSuiteSyncReturn,
} from './persistence-types'

/**
 * Hook for syncing BlockSuite Yjs documents with Supabase
 *
 * @param doc - Yjs document from BlockSuite (can be null during initialization)
 * @param options - Sync options including documentId and teamId
 * @returns Sync state and control functions
 *
 * @example
 * ```tsx
 * const { isLoading, isConnected, hasUnsavedChanges, save, error } = useBlockSuiteSync(
 *   editor?.doc.spaceDoc,
 *   {
 *     documentId: mindMapId,
 *     teamId: currentTeamId,
 *     enabled: !!editor,
 *   }
 * )
 * ```
 */
export function useBlockSuiteSync(
  doc: Doc | null,
  options: UseBlockSuiteSyncOptions
): UseBlockSuiteSyncReturn {
  const providerRef = useRef<HybridProvider | null>(null)

  // CRITICAL: Memoize supabase client to prevent effect re-runs on every render
  // Without useMemo, createClient() returns a new instance each render,
  // causing HybridProvider to be destroyed and recreated constantly
  const supabase = useMemo(() => createClient(), [])

  const [isLoading, setIsLoading] = useState(true)
  const [isConnected, setIsConnected] = useState(false)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  // Destructure options for dependency tracking
  const {
    documentId,
    teamId,
    enabled = true,
    debounceMs = DEFAULT_DEBOUNCE_MS,
  } = options

  // Handle disabled/missing deps state separately to avoid sync setState in effect
  const canSync = Boolean(doc && enabled && documentId && teamId)

  // Set up provider when doc is available
  useEffect(() => {
    // Skip if conditions not met - loading state handled by separate effect
    if (!canSync || !doc) {
      return
    }

    // Create provider
    const provider = new HybridProvider(doc, {
      documentId,
      teamId,
      supabase,
      debounceMs,
      onConnectionChange: (connected) => {
        setIsConnected(connected)
      },
      onSyncError: (err) => {
        setError(err)
      },
    })

    providerRef.current = provider

    // Load initial state
    // Note: isConnected is driven by onConnectionChange callback, not load completion
    provider
      .load()
      .then(() => {
        setIsLoading(false)
      })
      .catch((err) => {
        setError(err)
        setIsLoading(false)
      })

    // Poll for unsaved changes (simple approach)
    const checkInterval = setInterval(() => {
      if (providerRef.current) {
        setHasUnsavedChanges(providerRef.current.hasUnsavedChanges)
      }
    }, 1000)

    // Cleanup
    return () => {
      clearInterval(checkInterval)
      provider.destroy()
      providerRef.current = null
      setIsConnected(false)
    }
  }, [canSync, doc, documentId, teamId, debounceMs, supabase])

  // Handle loading state when sync is disabled
  useEffect(() => {
    if (!canSync) {
      // Use microtask to avoid sync setState warning
      queueMicrotask(() => {
        setIsLoading(false)
      })
    }
  }, [canSync])

  /**
   * Force save current state
   */
  const save = useCallback(async () => {
    if (providerRef.current) {
      await providerRef.current.forceSave()
      setHasUnsavedChanges(false)
    }
  }, [])

  return {
    isLoading,
    isConnected,
    hasUnsavedChanges,
    save,
    error,
  }
}

/**
 * Hook for creating and managing a BlockSuite document with persistence
 *
 * This hook handles:
 * 1. Creating the document record in PostgreSQL
 * 2. Setting up sync with the HybridProvider
 * 3. Cleaning up on unmount
 *
 * @param options - Document creation options
 * @returns Document state and sync controls
 */
export function useBlockSuiteDocument(options: {
  workspaceId?: string
  teamId: string
  documentType?: 'mindmap' | 'document' | 'canvas'
  title?: string
  enabled?: boolean
}) {
  // CRITICAL: Memoize supabase client to prevent effect re-runs on every render
  // Without useMemo, createClient() returns a new instance each render,
  // causing repeated database queries and state resets
  const supabase = useMemo(() => createClient(), [])
  const [documentId, setDocumentId] = useState<string | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [createError, setCreateError] = useState<Error | null>(null)

  const {
    workspaceId,
    teamId,
    documentType = 'mindmap',
    title,
    enabled = true,
  } = options

  // Create or load document on mount
  useEffect(() => {
    if (!enabled || !teamId) return

    const initDocument = async () => {
      setIsCreating(true)
      setCreateError(null)

      try {
        // Create new document
        // SECURITY: Use getStoragePath() to sanitize inputs and prevent path traversal
        const id = Date.now().toString()
        const storagePath = getStoragePath(teamId, id)

        const { error } = await supabase.from('blocksuite_documents').insert({
          id,
          team_id: teamId,
          workspace_id: workspaceId ?? null,
          storage_path: storagePath,
          storage_size_bytes: 0,
          document_type: documentType,
          title: title ?? null,
        })

        if (error) {
          throw new Error(error.message)
        }

        setDocumentId(id)
      } catch (err) {
        console.error('[useBlockSuiteDocument] Error:', err)
        setCreateError(err instanceof Error ? err : new Error(String(err)))
      } finally {
        setIsCreating(false)
      }
    }

    initDocument()
  }, [supabase, workspaceId, teamId, documentType, title, enabled])

  return {
    documentId,
    isCreating,
    createError,
    teamId,
  }
}
