'use client'

import { useEffect, useRef, useCallback, useState, useMemo } from 'react'
import * as Y from 'yjs'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { HybridProvider } from './hybrid-provider'
import { loadYjsState } from './storage-client'
import { LoadingSkeleton } from './loading-skeleton'

// Types for BlockSuite modules (dynamically imported)
type Doc = import('@blocksuite/store').Doc

// Global flag to prevent multiple effect registrations
let effectsRegistered = false

export interface SimpleCanvasProps {
  /** Document ID from blocksuite_documents table */
  documentId: string
  /** Team ID for RLS and storage path */
  teamId: string
  /** Document type determines editor mode */
  documentType?: 'mindmap' | 'document' | 'canvas'
  /** Whether the canvas is read-only */
  readOnly?: boolean
  /** Additional CSS classes */
  className?: string
  /** Callback when document is ready */
  onReady?: () => void
  /** Callback when save status changes */
  onSaveStatusChange?: (hasUnsavedChanges: boolean) => void
}

/**
 * SimpleCanvas - Standalone BlockSuite editor with automatic persistence
 *
 * This is a simplified wrapper around BlockSuite that:
 * - Uses HybridProvider for Yjs + Supabase persistence
 * - Supports mindmap, document, and canvas modes
 * - Automatically saves changes
 * - Handles real-time collaboration
 *
 * @example
 * ```tsx
 * <SimpleCanvas
 *   documentId="1234567890"
 *   teamId="team-123"
 *   documentType="mindmap"
 * />
 * ```
 */
export function SimpleCanvas({
  documentId,
  teamId,
  documentType = 'mindmap',
  readOnly = false,
  className,
  onReady,
  onSaveStatusChange,
}: SimpleCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const editorRef = useRef<unknown>(null)
  const providerRef = useRef<HybridProvider | null>(null)
  const docRef = useRef<Y.Doc | null>(null)

  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isConnected, setIsConnected] = useState(false)

  // Memoize supabase client
  const supabase = useMemo(() => createClient(), [])

  // Determine editor mode based on document type
  const editorMode = documentType === 'document' ? 'page' : 'edgeless'

  // Cleanup function
  const cleanup = useCallback(() => {
    if (providerRef.current) {
      providerRef.current.destroy()
      providerRef.current = null
    }
    if (editorRef.current && containerRef.current) {
      try {
        const editor = editorRef.current as { remove?: () => void }
        if (typeof editor.remove === 'function') {
          editor.remove()
        } else if (containerRef.current.firstChild) {
          containerRef.current.removeChild(containerRef.current.firstChild)
        }
      } catch (e) {
        console.warn('[SimpleCanvas] Cleanup warning:', e)
      }
      editorRef.current = null
    }
    docRef.current = null
  }, [])

  // Initialize editor with persistence
  useEffect(() => {
    if (!documentId || !teamId) {
      setError('Missing documentId or teamId')
      setIsLoading(false)
      return
    }

    let mounted = true

    const initEditor = async () => {
      if (!containerRef.current) return

      try {
        setIsLoading(true)
        setError(null)

        // Dynamic imports for SSR safety
        const [presetsModule, blocksModule, storeModule, blocksEffectsModule, presetsEffectsModule] = await Promise.all([
          import('@blocksuite/presets'),
          import('@blocksuite/blocks'),
          import('@blocksuite/store'),
          import('@blocksuite/blocks/effects'),
          import('@blocksuite/presets/effects'),
        ])

        if (!mounted) return

        const { EdgelessEditor, PageEditor } = presetsModule
        const { AffineSchemas } = blocksModule
        const { Schema, DocCollection } = storeModule
        const { effects: blocksEffects } = blocksEffectsModule
        const { effects: presetsEffects } = presetsEffectsModule

        // Register custom elements (only once)
        if (!effectsRegistered) {
          try {
            blocksEffects()
            presetsEffects()
            effectsRegistered = true
          } catch (err) {
            const errorMsg = err instanceof Error ? err.message : String(err)
            if (!errorMsg.includes('already been defined')) {
              throw err
            }
          }
        }

        // Create Yjs doc for persistence
        const yjsDoc = new Y.Doc()
        docRef.current = yjsDoc

        // Set up schema and collection
        const schema = new Schema()
        schema.register(AffineSchemas)

        const collection = new DocCollection({
          schema,
          id: `canvas-${documentId}`,
        })

        collection.meta.initialize()
        const doc = collection.createDoc({ id: documentId })

        // Try to load existing state from storage
        const existingState = await loadYjsState(supabase, teamId, documentId)

        if (existingState) {
          // Apply existing state
          Y.applyUpdate(yjsDoc, existingState)
        }

        // Initialize document with required blocks
        await doc.load(() => {
          // Only add blocks if doc is empty
          if (!doc.root) {
            const pageBlockId = doc.addBlock('affine:page', {})
            doc.addBlock('affine:surface', {}, pageBlockId)
            const noteBlockId = doc.addBlock('affine:note', {}, pageBlockId)
            doc.addBlock('affine:paragraph', {}, noteBlockId)
          }
        })

        if (!mounted) return

        // Create HybridProvider for persistence
        const provider = new HybridProvider(yjsDoc, {
          documentId,
          teamId,
          supabase,
          debounceMs: 2000,
          onConnectionChange: (connected) => {
            setIsConnected(connected)
          },
          onSyncError: (err) => {
            console.error('[SimpleCanvas] Sync error:', err)
          },
        })

        providerRef.current = provider
        await provider.load()

        if (!mounted) return

        // Create editor
        const EditorClass = editorMode === 'page' ? PageEditor : EdgelessEditor
        const editor = new EditorClass()

        const editorElement = editor as {
          doc: Doc
          readonly: boolean
          updateComplete: Promise<boolean>
        }
        editorElement.doc = doc as unknown as Doc
        editorElement.readonly = readOnly

        // Mount editor
        if (containerRef.current && mounted) {
          while (containerRef.current.firstChild) {
            containerRef.current.removeChild(containerRef.current.firstChild)
          }
          containerRef.current.appendChild(editor as Node)
          editorRef.current = editor

          await editorElement.updateComplete

          setIsLoading(false)
          onReady?.()

          // Set up save status polling
          const checkInterval = setInterval(() => {
            if (providerRef.current) {
              onSaveStatusChange?.(providerRef.current.hasUnsavedChanges)
            }
          }, 1000)

          // Store interval for cleanup
          ;(editorRef.current as { _checkInterval?: ReturnType<typeof setInterval> })._checkInterval = checkInterval
        }
      } catch (e) {
        console.error('[SimpleCanvas] Failed to initialize:', e)
        if (mounted) {
          setError(e instanceof Error ? e.message : 'Failed to load canvas')
          setIsLoading(false)
        }
      }
    }

    initEditor()

    return () => {
      mounted = false
      const editor = editorRef.current as { _checkInterval?: ReturnType<typeof setInterval> } | null
      if (editor?._checkInterval) {
        clearInterval(editor._checkInterval)
      }
      cleanup()
    }
  }, [documentId, teamId, editorMode, readOnly, supabase, cleanup, onReady, onSaveStatusChange])

  // Error state
  if (error) {
    return (
      <div className={cn('flex items-center justify-center h-full min-h-[400px] bg-destructive/10 rounded-lg', className)}>
        <div className="text-center p-4">
          <p className="text-destructive font-medium">Failed to load canvas</p>
          <p className="text-sm text-muted-foreground mt-1">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
          >
            Reload Page
          </button>
        </div>
      </div>
    )
  }

  // Loading state
  if (isLoading) {
    return <LoadingSkeleton className={className} />
  }

  return (
    <div className={cn('simple-canvas-container relative w-full h-full', className)}>
      {/* Connection indicator */}
      <div className="absolute top-2 right-2 z-10 flex items-center gap-2">
        <div
          className={cn(
            'w-2 h-2 rounded-full',
            isConnected ? 'bg-green-500' : 'bg-yellow-500'
          )}
          title={isConnected ? 'Connected' : 'Connecting...'}
        />
      </div>

      {/* Editor container */}
      <div
        ref={containerRef}
        className="w-full h-full min-h-[400px]"
        style={{ display: 'flex', flexDirection: 'column' }}
      />
    </div>
  )
}

export default SimpleCanvas
