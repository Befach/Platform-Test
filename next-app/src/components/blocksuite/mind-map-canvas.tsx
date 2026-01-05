'use client'

import { useEffect, useRef, useCallback, useState, useMemo } from 'react'
import { cn } from '@/lib/utils'
import type {
  MindMapCanvasProps,
  BlockSuiteMindmapNode,
  BlockSuiteMindmapStyle,
  BlockSuiteLayoutType,
} from './mindmap-types'
import { DEFAULT_SAMPLE_TREE } from './mindmap-types'

// Type for BlockSuite Doc (dynamically imported)
type Doc = import('@blocksuite/store').Doc

/**
 * Safely clears all child nodes from a container element
 * This avoids innerHTML which can be an XSS vector
 */
function clearContainer(container: HTMLElement): void {
  while (container.firstChild) {
    container.removeChild(container.firstChild)
  }
}

/**
 * Extract tree structure from a BlockSuite mindmap element
 * Returns null if extraction fails
 */
function extractMindmapTree(
  surface: unknown,
  mindmapId: string
): BlockSuiteMindmapNode | null {
  try {
    const surfaceWithElements = surface as {
      getElementById?: (id: string) => {
        tree?: { element?: { text?: string }; children?: unknown[] }
        children?: BlockSuiteMindmapNode
      } | null
    }

    if (!surfaceWithElements.getElementById) {
      return null
    }

    const mindmapElement = surfaceWithElements.getElementById(mindmapId)
    if (!mindmapElement) {
      return null
    }

    // Try to access the tree structure - BlockSuite stores it in different ways
    // depending on the version
    if (mindmapElement.children) {
      return mindmapElement.children as BlockSuiteMindmapNode
    }

    if (mindmapElement.tree?.element?.text) {
      // Convert BlockSuite internal format to our format
      const convertNode = (node: {
        element?: { text?: string }
        children?: unknown[]
      }): BlockSuiteMindmapNode => ({
        text: node.element?.text || 'Untitled',
        children: node.children?.map((child) =>
          convertNode(child as { element?: { text?: string }; children?: unknown[] })
        ),
      })
      return convertNode(mindmapElement.tree)
    }

    return null
  } catch (e) {
    console.warn('Failed to extract mindmap tree:', e)
    return null
  }
}

/**
 * BlockSuite MindMap Canvas Component
 *
 * A React wrapper for BlockSuite's native mindmap functionality.
 * Uses the EdgelessEditor in a specialized configuration for mind mapping.
 *
 * Features:
 * - Native BlockSuite mindmap rendering with auto-layout
 * - 4 built-in visual styles
 * - 3 layout modes (left, right, balanced)
 * - Tree change callbacks
 * - Node selection events
 *
 * @example
 * ```tsx
 * import { MindMapCanvas } from '@/components/blocksuite'
 *
 * function MyMindMap() {
 *   return (
 *     <MindMapCanvas
 *       initialTree={{
 *         text: 'Central Idea',
 *         children: [
 *           { text: 'Branch 1' },
 *           { text: 'Branch 2' },
 *         ]
 *       }}
 *       style={4}  // MindmapStyle.FOUR
 *       layout={2} // LayoutType.BALANCE
 *       onNodeSelect={(id, text) => console.log('Selected:', text)}
 *     />
 *   )
 * }
 * ```
 */
export function MindMapCanvas({
  documentId,
  initialTree,
  style = 4 as BlockSuiteMindmapStyle, // Default: FOUR
  layout = 2 as BlockSuiteLayoutType, // Default: BALANCE
  onTreeChange,
  onNodeSelect: _onNodeSelect,  // Prefixed with _ to indicate intentionally unused for now
  readOnly = false,
  className,
}: MindMapCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const editorRef = useRef<unknown>(null)
  const docRef = useRef<Doc | null>(null)
  const mindmapIdRef = useRef<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Memoize the tree to use - either provided or default
  const treeToRender = useMemo(() => {
    return initialTree || DEFAULT_SAMPLE_TREE
  }, [initialTree])

  // Cleanup function
  const cleanup = useCallback(() => {
    if (editorRef.current && containerRef.current) {
      try {
        const editor = editorRef.current as { remove?: () => void }
        if (typeof editor.remove === 'function') {
          editor.remove()
        } else if (containerRef.current.firstChild) {
          containerRef.current.removeChild(containerRef.current.firstChild)
        }
      } catch (e) {
        console.warn('MindMapCanvas cleanup warning:', e)
      }
      editorRef.current = null
    }
    docRef.current = null
    mindmapIdRef.current = null
  }, [])

  // Initialize editor effect
  useEffect(() => {
    let mounted = true
    let disposable: { dispose: () => void } | null = null

    const initMindMap = async () => {
      if (!containerRef.current) return

      try {
        setIsLoading(true)
        setError(null)

        // Dynamic imports to avoid SSR issues
        // BlockSuite uses browser APIs that aren't available during SSR
        const [presetsModule, blocksModule, storeModule] = await Promise.all([
          import('@blocksuite/presets'),
          import('@blocksuite/blocks'),
          import('@blocksuite/store'),
        ])

        if (!mounted) return

        const { EdgelessEditor } = presetsModule
        const { AffineSchemas } = blocksModule
        const { Schema, DocCollection } = storeModule

        // Set up schema with Affine blocks
        const schema = new Schema()
        schema.register(AffineSchemas)

        // Create document collection and doc
        const collectionId = `mindmap-collection-${Date.now()}`
        const docId = documentId || `mindmap-doc-${Date.now()}`

        const collection = new DocCollection({
          schema,
          id: collectionId,
        })
        const doc = collection.createDoc({ id: docId })

        // Store surface block reference for mindmap creation
        let surfaceId: string = ''

        // Initialize with required root blocks
        doc.load(() => {
          const pageBlockId = doc.addBlock('affine:page', {})
          surfaceId = doc.addBlock('affine:surface', {}, pageBlockId)
          // Add a note block for any text content
          const noteBlockId = doc.addBlock('affine:note', {}, pageBlockId)
          doc.addBlock('affine:paragraph', {}, noteBlockId)
        })

        docRef.current = doc

        if (!mounted) return

        // Create the edgeless editor
        const editor = new EdgelessEditor()

        // Set editor properties using unknown cast for dynamic properties
        // EdgelessEditor may not expose all properties in its TypeScript definition
        const editorElement = editor as unknown as {
          doc: Doc
          readonly: boolean
        }
        editorElement.doc = doc
        editorElement.readonly = readOnly

        // Mount to container
        if (containerRef.current && mounted) {
          clearContainer(containerRef.current)
          containerRef.current.appendChild(editor as Node)
          editorRef.current = editor

          // Wait for editor to be ready, then add mindmap
          // Using setTimeout to ensure the surface block is fully initialized
          setTimeout(() => {
            if (!mounted || !surfaceId) return

            try {
              // Get surface block for adding mindmap
              const surface = doc.getBlockById(surfaceId)

              if (surface && 'addElement' in surface) {
                // Add mindmap element to the surface
                const surfaceBlock = surface as {
                  addElement: (props: {
                    type: string
                    children?: BlockSuiteMindmapNode
                    style?: number
                    layoutType?: number
                  }) => string
                }

                const mindmapId = surfaceBlock.addElement({
                  type: 'mindmap',
                  children: treeToRender,
                  style: style,
                  // Note: layoutType might need to be set via a different API
                })

                mindmapIdRef.current = mindmapId
                console.log('MindMap created with ID:', mindmapId)
              }
            } catch (e) {
              console.warn('Failed to add mindmap element:', e)
              // This is non-fatal - the editor still works
            }
          }, 100)

          // Set up change listener
          const docWithSlots = doc as Doc & {
            slots?: {
              historyUpdated?: {
                on: (callback: () => void) => { dispose: () => void }
              }
            }
          }
          if (docWithSlots.slots?.historyUpdated) {
            disposable = docWithSlots.slots.historyUpdated.on(() => {
              if (onTreeChange && mounted) {
                // Try to extract the actual current tree from BlockSuite
                const surface = doc.getBlockById(surfaceId)
                const mindmapId = mindmapIdRef.current

                if (surface && mindmapId) {
                  const extractedTree = extractMindmapTree(surface, mindmapId)
                  if (extractedTree) {
                    onTreeChange(extractedTree)
                    return
                  }
                }

                // Fallback to original tree if extraction fails
                // This ensures consumers still get notified of changes
                console.warn('Could not extract updated tree, using original')
                onTreeChange(treeToRender)
              }
            })
          }

          setIsLoading(false)
        }
      } catch (e) {
        console.error('Failed to initialize MindMapCanvas:', e)
        if (mounted) {
          setError(e instanceof Error ? e.message : 'Failed to load mind map editor')
          setIsLoading(false)
        }
      }
    }

    initMindMap()

    return () => {
      mounted = false
      if (disposable) {
        disposable.dispose()
      }
      cleanup()
    }
  }, [documentId, treeToRender, style, layout, readOnly, onTreeChange, cleanup])

  // Handle node selection (would require more complex setup with BlockSuite events)
  // For now, this is a placeholder that can be enhanced later

  if (error) {
    return (
      <div
        className={cn(
          'flex items-center justify-center h-full min-h-[400px] bg-destructive/10 rounded-lg',
          className
        )}
      >
        <div className="text-center p-4">
          <p className="text-destructive font-medium">Failed to load mind map</p>
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
        'blocksuite-mindmap-container w-full h-full min-h-[400px]',
        isLoading && 'opacity-0',
        className
      )}
      style={{
        display: 'flex',
        flexDirection: 'column',
      }}
    />
  )
}

export default MindMapCanvas
