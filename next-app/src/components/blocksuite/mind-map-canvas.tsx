"use client";

import { cn } from "@/lib/utils";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type {
  BlockSuiteLayoutType,
  BlockSuiteMindmapNode,
  BlockSuiteMindmapStyle,
  MindMapCanvasProps,
} from "./mindmap-types";
import { DEFAULT_SAMPLE_TREE } from "./mindmap-types";

// Type for BlockSuite Doc (dynamically imported)
type Doc = import("@blocksuite/store").Doc;

// Type for BlockSuite Store with slots (used for ready event)
interface StoreWithSlots {
  slots?: {
    ready?: {
      subscribe: (callback: () => void) => { unsubscribe: () => void };
    };
    blockUpdated?: {
      subscribe: (callback: (payload: unknown) => void) => {
        unsubscribe: () => void;
      };
    };
  };
}

// Type for BlockSuite selection
interface BlockSuiteSelection {
  type: string;
  elements?: string[];
}

// Type for selection disposable
interface Disposable {
  dispose: () => void;
}

/**
 * Safely clears all child nodes from a container element
 * This avoids innerHTML which can be an XSS vector
 */
function clearContainer(container: HTMLElement): void {
  while (container.firstChild) {
    container.removeChild(container.firstChild);
  }
}

/**
 * Extract tree structure from a BlockSuite mindmap element
 * Returns null if extraction fails
 */
function extractMindmapTree(
  surface: unknown,
  mindmapId: string,
): BlockSuiteMindmapNode | null {
  try {
    const surfaceWithElements = surface as {
      getElementById?: (id: string) => {
        tree?: { element?: { text?: string }; children?: unknown[] };
        children?: BlockSuiteMindmapNode;
      } | null;
    };

    if (!surfaceWithElements.getElementById) {
      return null;
    }

    const mindmapElement = surfaceWithElements.getElementById(mindmapId);
    if (!mindmapElement) {
      return null;
    }

    // Try to access the tree structure - BlockSuite stores it in different ways
    // depending on the version
    if (mindmapElement.children) {
      return mindmapElement.children as BlockSuiteMindmapNode;
    }

    if (mindmapElement.tree?.element?.text) {
      // Convert BlockSuite internal format to our format
      const convertNode = (node: {
        element?: { text?: string };
        children?: unknown[];
      }): BlockSuiteMindmapNode => ({
        text: node.element?.text || "Untitled",
        children: node.children?.map((child) =>
          convertNode(
            child as { element?: { text?: string }; children?: unknown[] },
          ),
        ),
      });
      return convertNode(mindmapElement.tree);
    }

    return null;
  } catch (e) {
    console.warn("Failed to extract mindmap tree:", e);
    return null;
  }
}

/**
 * Extract text from a mindmap node element by its ID
 * Returns null if extraction fails
 */
function extractNodeText(surface: unknown, elementId: string): string | null {
  try {
    const surfaceWithElements = surface as {
      getElementById?: (id: string) => {
        tree?: { element?: { text?: string } };
        text?: string;
        xywh?: string;
      } | null;
    };

    if (!surfaceWithElements.getElementById) {
      return null;
    }

    const element = surfaceWithElements.getElementById(elementId);
    if (!element) {
      return null;
    }

    // Try different ways BlockSuite might store the text
    if (element.text) {
      return element.text;
    }
    if (element.tree?.element?.text) {
      return element.tree.element.text;
    }

    return null;
  } catch {
    return null;
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
 * - 4 built-in visual styles (1-4)
 * - 3 layout modes (0=RIGHT, 1=LEFT, 2=BALANCE)
 * - Tree change callbacks via onTreeChange
 * - Node selection events via onNodeSelect callback
 *
 * Limitations:
 * - **Layout/style props are immutable after creation**: BlockSuite creates the mindmap
 *   element once with the specified layout and style. To change these properties,
 *   the component must be unmounted and remounted (e.g., by changing the `key` prop).
 *
 * @example
 * ```tsx
 * import { MindMapCanvas } from '@/components/blocksuite'
 *
 * function MyMindMap() {
 *   const [layout, setLayout] = useState(2)
 *
 *   return (
 *     // Use key to force remount when layout changes
 *     <MindMapCanvas
 *       key={`mindmap-${layout}`}
 *       initialTree={{
 *         text: 'Central Idea',
 *         children: [
 *           { text: 'Branch 1' },
 *           { text: 'Branch 2' },
 *         ]
 *       }}
 *       style={4}  // MindmapStyle.FOUR
 *       layout={layout} // LayoutType: 0=RIGHT, 1=LEFT, 2=BALANCE
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
  onNodeSelect,
  readOnly = false,
  className,
}: MindMapCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<unknown>(null);
  const docRef = useRef<Doc | null>(null);
  const mindmapIdRef = useRef<string | null>(null);
  const surfaceIdRef = useRef<string | null>(null);
  const selectionDisposableRef = useRef<Disposable | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  // Memoize the tree to use - either provided or default
  const treeToRender = useMemo(() => {
    return initialTree || DEFAULT_SAMPLE_TREE;
  }, [initialTree]);

  // Setup selection listener for the BlockSuite editor
  const setupSelectionListener = useCallback(
    (
      editor: unknown,
      doc: Doc,
      surfaceId: string,
    ): Disposable | null => {
      try {
        const editorElement = editor as unknown as {
          host?: {
            selection?: {
              slots?: {
                changed?: {
                  on: (
                    callback: (selections: BlockSuiteSelection[]) => void,
                  ) => Disposable;
                };
              };
              value?: BlockSuiteSelection[];
            };
          };
        };

        const selection = editorElement.host?.selection;
        if (selection?.slots?.changed) {
          const disposable = selection.slots.changed.on(
            (selections: BlockSuiteSelection[]) => {
              // Find surface selection (contains mindmap elements)
              const surfaceSelection = selections.find(
                (sel) => sel.type === "surface",
              );

              if (surfaceSelection?.elements?.length) {
                const elementId = surfaceSelection.elements[0];
                setSelectedNodeId(elementId);

                // Try to get the text of the selected node
                if (onNodeSelect) {
                  const surface = doc.getBlockById(surfaceId);
                  if (surface) {
                    const nodeText = extractNodeText(surface, elementId);
                    onNodeSelect(elementId, nodeText || "Selected Node");
                  } else {
                    onNodeSelect(elementId, "Selected Node");
                  }
                }
              } else {
                setSelectedNodeId(null);
              }
            },
          );

          return disposable;
        }

        // Fallback: Try alternative selection API patterns
        const editorWithStd = editor as unknown as {
          std?: {
            selection?: {
              slots?: {
                changed?: {
                  on: (
                    callback: (selections: BlockSuiteSelection[]) => void,
                  ) => Disposable;
                };
              };
            };
          };
        };

        const stdSelection = editorWithStd.std?.selection;
        if (stdSelection?.slots?.changed) {
          const disposable = stdSelection.slots.changed.on(
            (selections: BlockSuiteSelection[]) => {
              const surfaceSelection = selections.find(
                (sel) => sel.type === "surface",
              );

              if (surfaceSelection?.elements?.length) {
                const elementId = surfaceSelection.elements[0];
                setSelectedNodeId(elementId);

                if (onNodeSelect) {
                  const surface = doc.getBlockById(surfaceId);
                  if (surface) {
                    const nodeText = extractNodeText(surface, elementId);
                    onNodeSelect(elementId, nodeText || "Selected Node");
                  } else {
                    onNodeSelect(elementId, "Selected Node");
                  }
                }
              } else {
                setSelectedNodeId(null);
              }
            },
          );

          return disposable;
        }

        // If no selection API found, log a warning for debugging
        if (onNodeSelect) {
          console.warn(
            "MindMapCanvas: BlockSuite selection API not available. " +
              "Node selection events may not fire. This could be due to BlockSuite version differences.",
          );
        }

        return null;
      } catch (e) {
        console.warn("Failed to setup selection listener:", e);
        return null;
      }
    },
    [onNodeSelect],
  );

  // Cleanup function
  const cleanup = useCallback(() => {
    // Clean up selection listener
    if (selectionDisposableRef.current) {
      try {
        selectionDisposableRef.current.dispose();
      } catch (e) {
        console.warn("Failed to dispose selection listener:", e);
      }
      selectionDisposableRef.current = null;
    }

    if (editorRef.current && containerRef.current) {
      try {
        const editor = editorRef.current as { remove?: () => void };
        if (typeof editor.remove === "function") {
          editor.remove();
        } else if (containerRef.current.firstChild) {
          containerRef.current.removeChild(containerRef.current.firstChild);
        }
      } catch (e) {
        console.warn("MindMapCanvas cleanup warning:", e);
      }
      editorRef.current = null;
    }
    docRef.current = null;
    mindmapIdRef.current = null;
    surfaceIdRef.current = null;
    setSelectedNodeId(null);
  }, []);

  // Initialize editor effect
  useEffect(() => {
    let mounted = true;
    const subscriptions: Array<{ unsubscribe: () => void }> = [];

    const initMindMap = async () => {
      if (!containerRef.current) return;

      try {
        setIsLoading(true);
        setError(null);

        // Dynamic imports to avoid SSR issues
        // BlockSuite uses browser APIs that aren't available during SSR
        const [presetsModule, blocksModule, storeModule] = await Promise.all([
          import("@blocksuite/presets"),
          import("@blocksuite/blocks"),
          import("@blocksuite/store"),
        ]);

        if (!mounted) return;

        const { EdgelessEditor } = presetsModule;
        const { AffineSchemas } = blocksModule;
        const { Schema, DocCollection } = storeModule;

        // Set up schema with Affine blocks
        const schema = new Schema();
        schema.register(AffineSchemas);

        // Create document collection and doc
        const collectionId = `mindmap-collection-${Date.now()}`;
        const docId = documentId || `mindmap-doc-${Date.now()}`;

        const collection = new DocCollection({
          schema,
          id: collectionId,
        });
        const doc = collection.createDoc({ id: docId });

        // Store surface block reference for mindmap creation
        let surfaceId: string = "";

        // Initialize with required root blocks
        doc.load(() => {
          const pageBlockId = doc.addBlock("affine:page", {});
          surfaceId = doc.addBlock("affine:surface", {}, pageBlockId);
          // Add a note block for any text content
          const noteBlockId = doc.addBlock("affine:note", {}, pageBlockId);
          doc.addBlock("affine:paragraph", {}, noteBlockId);
        });

        docRef.current = doc;

        if (!mounted) return;

        // Create the edgeless editor
        const editor = new EdgelessEditor();

        // Set editor properties using unknown cast for dynamic properties
        // EdgelessEditor may not expose all properties in its TypeScript definition
        const editorElement = editor as unknown as {
          doc: Doc;
          readonly: boolean;
        };
        editorElement.doc = doc;
        editorElement.readonly = readOnly;

        // Mount to container
        if (containerRef.current && mounted) {
          clearContainer(containerRef.current);
          containerRef.current.appendChild(editor as Node);
          editorRef.current = editor;

          // Function to add mindmap once surface is ready
          const addMindmapToSurface = () => {
            if (!mounted || !surfaceId) return false;

            try {
              const surface = doc.getBlockById(surfaceId);

              if (surface && "addElement" in surface) {
                // Surface is ready - add mindmap element
                const surfaceBlock = surface as {
                  addElement: (props: {
                    type: string;
                    children?: BlockSuiteMindmapNode;
                    style?: number;
                    layoutType?: number;
                  }) => string;
                };

                const mindmapId = surfaceBlock.addElement({
                  type: "mindmap",
                  children: treeToRender,
                  style: style,
                  layoutType: layout, // 0=RIGHT, 1=LEFT, 2=BALANCE
                });

                mindmapIdRef.current = mindmapId;
                surfaceIdRef.current = surfaceId;
                return true;
              }
              return false;
            } catch (e) {
              console.warn("Failed to add mindmap element:", e);
              return false;
            }
          };

          // Use BlockSuite's store.slots.ready event for proper initialization
          // This is the recommended approach per BlockSuite documentation
          const storeWithSlots = doc as unknown as StoreWithSlots;
          if (storeWithSlots.slots?.ready) {
            const readySubscription = storeWithSlots.slots.ready.subscribe(
              () => {
                if (!mounted) return;

                // Try to add mindmap now that store is ready
                if (!addMindmapToSurface()) {
                  // If surface still not ready (rare edge case), use short polling as fallback
                  // This handles cases where ready fires before surface block is fully initialized
                  const MAX_FALLBACK_ATTEMPTS = 5;
                  const FALLBACK_INTERVAL_MS = 100;
                  let attempts = 0;

                  const fallbackTry = () => {
                    if (!mounted) return;
                    if (addMindmapToSurface()) return;
                    if (attempts < MAX_FALLBACK_ATTEMPTS) {
                      attempts++;
                      setTimeout(fallbackTry, FALLBACK_INTERVAL_MS);
                    } else {
                      console.warn(
                        "Surface not ready after ready event + fallback attempts",
                      );
                      if (mounted) {
                        setError(
                          "Mind map surface failed to initialize. Please try refreshing the page.",
                        );
                      }
                    }
                  };
                  fallbackTry();
                }
              },
            );
            subscriptions.push(readySubscription);
          } else {
            // Fallback for older BlockSuite versions without slots.ready
            // Use polling approach with clear timing rationale
            const MAX_ATTEMPTS = 20; // 20 attempts × 100ms = 2000ms max wait
            const POLL_INTERVAL_MS = 100;
            let attempts = 0;

            const pollForSurface = () => {
              if (!mounted) return;
              if (addMindmapToSurface()) return;
              if (attempts < MAX_ATTEMPTS) {
                attempts++;
                setTimeout(pollForSurface, POLL_INTERVAL_MS);
              } else {
                console.warn(
                  "Surface not ready after max polling attempts (2s)",
                );
                if (mounted) {
                  setError(
                    "Mind map surface failed to initialize. Please try refreshing the page.",
                  );
                }
              }
            };
            pollForSurface();
          }

          // Set up change listener using blockUpdated event
          if (storeWithSlots.slots?.blockUpdated) {
            const updateSubscription =
              storeWithSlots.slots.blockUpdated.subscribe(() => {
                if (onTreeChange && mounted) {
                  // Try to extract the actual current tree from BlockSuite
                  const surface = doc.getBlockById(surfaceId);
                  const mindmapId = mindmapIdRef.current;

                  if (surface && mindmapId) {
                    const extractedTree = extractMindmapTree(
                      surface,
                      mindmapId,
                    );
                    if (extractedTree) {
                      onTreeChange(extractedTree);
                      return;
                    }
                  }

                  // Known limitation: When BlockSuite tree extraction fails, we cannot
                  // retrieve the actual modified tree. Fallback notifies consumers that
                  // a change occurred, but tree data may be stale.
                  console.warn(
                    "Tree extraction failed - returning original tree. Actual changes may differ.",
                  );
                  onTreeChange(treeToRender);
                }
              });
            subscriptions.push(updateSubscription);
          }

          // Set up selection listener for node selection events
          // This is done after editor is mounted and document is ready
          // Use setTimeout to ensure editor host is fully initialized
          setTimeout(() => {
            if (!mounted || !editorRef.current) return;
            const disposable = setupSelectionListener(
              editorRef.current,
              doc,
              surfaceId,
            );
            if (disposable) {
              selectionDisposableRef.current = disposable;
            }
          }, 100);

          setIsLoading(false);
        }
      } catch (e) {
        console.error("Failed to initialize MindMapCanvas:", e);
        if (mounted) {
          setError(
            e instanceof Error ? e.message : "Failed to load mind map editor",
          );
          setIsLoading(false);
        }
      }
    };

    initMindMap();

    return () => {
      mounted = false;
      // Unsubscribe from all BlockSuite event subscriptions
      subscriptions.forEach((sub) => sub.unsubscribe());
      cleanup();
    };
  }, [
    documentId,
    treeToRender,
    style,
    layout,
    readOnly,
    onTreeChange,
    onNodeSelect,
    setupSelectionListener,
    cleanup,
  ]);

  // Expose selectedNodeId for parent components that may need it
  // This is available via the component state and can be observed via onNodeSelect callback

  if (error) {
    return (
      <div
        className={cn(
          `flex items-center justify-center h-full min-h-[400px] bg-destructive/10 rounded-lg`,
          className,
        )}
      >
        <div className="text-center p-4">
          <p className="text-destructive font-medium">
            Failed to load mind map
          </p>
          <p className="text-sm text-muted-foreground mt-1">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
          >
            Reload Page
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={cn(
        "blocksuite-mindmap-container w-full h-full min-h-[400px]",
        isLoading && "opacity-0",
        className,
      )}
      style={{
        display: "flex",
        flexDirection: "column",
      }}
    />
  );
}

export default MindMapCanvas;
