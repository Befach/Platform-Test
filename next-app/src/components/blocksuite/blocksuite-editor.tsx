'use client'

import { useEffect, useRef, useCallback, useState, useMemo } from 'react'
import { cn } from '@/lib/utils'
import { safeValidateEditorProps } from './schema'
import { cleanupBlockSuiteEditor, clearContainer } from './editor-utils'

// Types for BlockSuite modules (dynamically imported)
type Doc = import('@blocksuite/store').Doc

// Global flag to prevent multiple effect registrations
// BlockSuite custom elements can only be registered once per page load
let effectsRegistered = false

// Global error suppression for known BlockSuite non-fatal errors
// These errors occur during async initialization and are safe to ignore
if (typeof window !== 'undefined') {
  const originalError = console.error
  console.error = (...args: unknown[]) => {
    const errorMsg = args[0]?.toString() || ''
    // Suppress known non-fatal BlockSuite errors
    if (errorMsg.includes('Host is not ready') ||
        errorMsg.includes('callback is not a function') ||
        errorMsg.includes('already been defined')) {
      return // Silently ignore these errors
    }
    // Pass through all other errors
    originalError.apply(console, args)
  }
}

export interface BlockSuiteEditorProps {
  /** Editor mode: 'page' for document editing, 'edgeless' for canvas/whiteboard */
  mode?: 'page' | 'edgeless'
  /** Additional CSS classes */
  className?: string
  /** Callback when editor is ready with doc */
  onReady?: (doc: Doc) => void
  /** Callback when document content changes */
  onChange?: (doc: Doc) => void
  /** Document ID for persistence */
  documentId?: string
  /** Whether the editor is read-only */
  readOnly?: boolean
}

/**
 * BlockSuite Editor React Wrapper
 *
 * This component wraps BlockSuite's Web Components for use in React.
 * It handles:
 * - Dynamic imports to avoid SSR issues
 * - Schema and DocCollection initialization
 * - Editor mounting/unmounting lifecycle
 * - Change event forwarding
 *
 * @example
 * ```tsx
 * <BlockSuiteEditor
 *   mode="edgeless"
 *   onReady={(doc) => console.log('Ready!', doc.id)}
 *   onChange={(doc) => console.log('Changed', doc)}
 * />
 * ```
 */
export function BlockSuiteEditor({
  mode = 'edgeless',
  className,
  onReady,
  onChange,
  documentId,
  readOnly = false,
}: BlockSuiteEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const editorRef = useRef<unknown>(null)
  const docRef = useRef<Doc | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Validate props at runtime using Zod schema
  const validationResult = useMemo(() => {
    return safeValidateEditorProps({
      mode,
      className,
      onReady,
      onChange,
      documentId,
      readOnly,
    })
  }, [mode, className, onReady, onChange, documentId, readOnly])

  // Cleanup function - must be before useEffect that uses it
  const cleanup = useCallback(() => {
    cleanupBlockSuiteEditor(editorRef, containerRef, '[BlockSuiteEditor]')
    docRef.current = null
  }, [])

  // Initialize editor effect - only runs if validation passes
  useEffect(() => {
    // Skip initialization if validation failed
    if (!validationResult.success) return

    let mounted = true
    let disposable: { dispose: () => void } | null = null

    const initEditor = async () => {
      if (!containerRef.current) return

      try {
        setIsLoading(true)
        setError(null)

        console.log('[BlockSuiteEditor] Starting initialization...', { mode, documentId })

        // Dynamic imports to avoid SSR issues
        // BlockSuite uses browser APIs that aren't available during SSR
        // Note: BlockSuite v0.19.x requires manual Schema/DocCollection setup
        const [presetsModule, blocksModule, storeModule, blocksEffectsModule, presetsEffectsModule] = await Promise.all([
          import('@blocksuite/presets'),
          import('@blocksuite/blocks'),
          import('@blocksuite/store'),
          import('@blocksuite/blocks/effects'),
          import('@blocksuite/presets/effects'),
        ])

        if (!mounted) return

        const { EdgelessEditor, PageEditor, AffineEditorContainer } = presetsModule
        const { AffineSchemas } = blocksModule
        const { Schema, DocCollection, Text } = storeModule
        const { effects: blocksEffects } = blocksEffectsModule
        const { effects: presetsEffects } = presetsEffectsModule

        // CRITICAL: Call effects() to register all custom elements
        // This must be done before instantiating editors, otherwise you get "Illegal constructor"
        // See: https://github.com/toeverything/blocksuite/discussions/8927
        // IMPORTANT: Only register once per page load to avoid "already defined" errors
        if (!effectsRegistered) {
          try {
            blocksEffects()
            presetsEffects()
            effectsRegistered = true
            console.log('[BlockSuiteEditor] Custom elements registered successfully')
          } catch (error) {
            // Ignore "already defined" errors - they're harmless
            const errorMsg = error instanceof Error ? error.message : String(error)
            if (!errorMsg.includes('already been defined')) {
              console.error('[BlockSuiteEditor] Failed to register effects:', error)
              throw error
            }
            console.log('[BlockSuiteEditor] Custom elements already registered, continuing')
          }
        }

        // Set up schema with Affine blocks
        const schema = new Schema()
        schema.register(AffineSchemas)

        // Create document collection (workspace container) and doc
        // Collection ID = workspace identifier, Doc ID = document identifier
        const collectionId = `collection-${Date.now()}`
        const docId = documentId || `doc-${Date.now()}`

        const collection = new DocCollection({
          schema,
          id: collectionId,
        })

        // CRITICAL: Initialize collection metadata before creating docs
        // This is required in BlockSuite v0.19.x - without it, createDoc() returns null
        collection.meta.initialize()

        const doc = collection.createDoc({ id: docId })
        console.log('[BlockSuiteEditor] Doc created:', docId)

        // Initialize with required root blocks
        // IMPORTANT: doc.load() returns a Promise in BlockSuite v0.19.x
        // We must await it to ensure blocks are created before proceeding
        // CRITICAL: Use Text objects for editable content - this enables proper keyboard input
        await doc.load(() => {
          const pageBlockId = doc.addBlock('affine:page', {
            title: new Text(''),
          })
          doc.addBlock('affine:surface', {}, pageBlockId)
          const noteBlockId = doc.addBlock('affine:note', {}, pageBlockId)
          doc.addBlock('affine:paragraph', { text: new Text('') }, noteBlockId)
        })

        docRef.current = doc
        console.log('[BlockSuiteEditor] Doc loaded, root:', doc.root?.id)

        if (!mounted) return

        // Create the appropriate editor
        // Use AffineEditorContainer for full editing experience with toolbars
        // Fall back to individual editors for specific use cases
        console.log('[BlockSuiteEditor] Creating', mode, 'editor')
        let editor: unknown
        let useContainer = true // Use container for better UI

        if (useContainer) {
          // AffineEditorContainer provides full editor UI with mode switching
          const container = new AffineEditorContainer()
          container.doc = doc
          container.mode = mode
          container.autofocus = true
          editor = container
        } else if (mode === 'edgeless') {
          editor = new EdgelessEditor()
        } else {
          editor = new PageEditor()
        }

        // Set editor properties BEFORE mounting to DOM
        const editorElement = editor as {
          doc: Doc
          mode: string
          readonly: boolean
          updateComplete: Promise<boolean>
        }
        if (!useContainer) {
          editorElement.doc = doc
        }
        editorElement.readonly = readOnly

        // Mount to container
        if (containerRef.current && mounted) {
          // Safely clear any existing content using DOM methods
          clearContainer(containerRef.current)

          // Append the editor element
          containerRef.current.appendChild(editor as Node)
          editorRef.current = editor
          console.log('[BlockSuiteEditor] Editor appended to DOM')

          // Start suppressing BlockSuite internal errors early
          // These errors are non-fatal and occur during async initialization
          const originalError = console.error
          const suppressBlockSuiteErrors = (...args: unknown[]) => {
            const errorMsg = args[0]?.toString() || ''
            if (errorMsg.includes('callback is not a function') ||
                errorMsg.includes('Host is not ready') ||
                errorMsg.includes('already been defined')) {
              return // Suppress these known non-fatal errors
            }
            originalError.apply(console, args)
          }
          console.error = suppressBlockSuiteErrors

          // Keep error suppression active for 10 seconds to cover all async initialization
          setTimeout(() => {
            console.error = originalError
          }, 10000)

          // CRITICAL: Wait for the editor's render() to complete with timeout
          // Without this, we get "Host is not ready to use" errors
          try {
            await Promise.race([
              editorElement.updateComplete,
              new Promise<void>((_, reject) => setTimeout(() => reject(new Error('Editor render timeout')), 5000))
            ])
            console.log('[BlockSuiteEditor] Editor rendered successfully')
          } catch (renderError) {
            console.warn('[BlockSuiteEditor] Editor render warning (continuing):', renderError)
            // Continue anyway - editor might still work
          }

          // Set up change listener if doc has slots
          const docWithSlots = doc as Doc & {
            slots?: {
              historyUpdated?: {
                on: (callback: () => void) => { dispose: () => void }
              }
            }
          }
          if (docWithSlots.slots?.historyUpdated) {
            disposable = docWithSlots.slots.historyUpdated.on(() => {
              if (onChange && mounted) {
                onChange(doc)
              }
            })
          }

          setIsLoading(false)

          // Notify ready
          if (onReady && mounted) {
            onReady(doc)
          }
        }
      } catch (e) {
        console.error('[BlockSuiteEditor] Failed to initialize:', e)
        if (mounted) {
          setError(e instanceof Error ? e.message : 'Failed to load editor')
          setIsLoading(false)
        }
      }
    }

    initEditor()

    return () => {
      mounted = false
      if (disposable) {
        disposable.dispose()
      }
      cleanup()
    }
  }, [mode, documentId, readOnly, onReady, onChange, cleanup, validationResult.success])

  // Render validation error - after all hooks
  if (!validationResult.success) {
    const errorMessages = validationResult.error.issues
      .map((e) => `${e.path.join('.')}: ${e.message}`)
      .join(', ')

    return (
      <div className={cn('flex items-center justify-center h-full min-h-[400px] bg-destructive/10 rounded-lg', className)}>
        <div className="text-center p-4">
          <p className="text-destructive font-medium">Invalid Editor Configuration</p>
          <p className="text-sm text-muted-foreground mt-1">{errorMessages}</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={cn('flex items-center justify-center h-full min-h-[400px] bg-destructive/10 rounded-lg', className)}>
        <div className="text-center p-4">
          <p className="text-destructive font-medium">Failed to load editor</p>
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

  return (
    <div
      ref={containerRef}
      className={cn(
        'blocksuite-editor-container w-full h-full min-h-[400px]',
        // Hide the loading state once editor is mounted
        isLoading && 'opacity-0',
        className
      )}
      style={{
        // Ensure the container takes up full space
        display: 'flex',
        flexDirection: 'column',
      }}
    />
  )
}

export default BlockSuiteEditor
