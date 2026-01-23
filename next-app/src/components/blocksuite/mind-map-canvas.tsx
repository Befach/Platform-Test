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

// Global flag to prevent multiple effect registrations
// BlockSuite custom elements can only be registered once per page load
// Shared with blocksuite-editor.tsx
let effectsRegistered = false;

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
    container.firstChild.remove();
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
      return mindmapElement.children;
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
  onRefsReady,
  readOnly = false,
  className,
}: Readonly<MindMapCanvasProps>) {
  const containerRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<unknown>(null);
  const docRef = useRef<Doc | null>(null);
  const mindmapIdRef = useRef<string | null>(null);
  const surfaceIdRef = useRef<string | null>(null);
  const selectionDisposableRef = useRef<Disposable | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [_selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  // Memoize the tree to use - either provided or default
  const treeToRender = useMemo(() => {
    return initialTree || DEFAULT_SAMPLE_TREE;
  }, [initialTree]);

  // Selection handler callback - extracted to avoid code duplication
  // This is called when BlockSuite selection changes to handle mindmap node selection
  const createSelectionHandler = useCallback(
    (doc: Doc, surfaceId: string) =>
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
            // TODO: Migrate to store.getBlock() when upgrading BlockSuite to v1.0+
            // See: https://github.com/toeverything/blocksuite/blob/main/packages/docs/api/@blocksuite/store/classes/Store.md
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
    [onNodeSelect],
  );

  // Type for selection slots structure
  type SelectionSlots = {
    slots?: {
      changed?: {
        on: (
          callback: (selections: BlockSuiteSelection[]) => void,
        ) => Disposable;
      };
    };
  };

  // Setup selection listener for the BlockSuite editor
  const setupSelectionListener = useCallback(
    (
      editor: unknown,
      doc: Doc,
      surfaceId: string,
    ): Disposable | null => {
      try {
        // Create the reusable selection handler
        const handleSelection = createSelectionHandler(doc, surfaceId);

        // Try primary API: editor.host.selection
        const editorElement = editor as {
          host?: { selection?: SelectionSlots };
        };
        const selection = editorElement.host?.selection;
        if (selection?.slots?.changed) {
          return selection.slots.changed.on(handleSelection);
        }

        // Fallback: Try editor.std.selection (alternative BlockSuite API pattern)
        const editorWithStd = editor as {
          std?: { selection?: SelectionSlots };
        };
        const stdSelection = editorWithStd.std?.selection;
        if (stdSelection?.slots?.changed) {
          return stdSelection.slots.changed.on(handleSelection);
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
    [onNodeSelect, createSelectionHandler],
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
          containerRef.current.firstChild.remove();
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
    const subscriptions: Array<{ dispose?: () => void; unsubscribe?: () => void }> = [];

    const initMindMap = async () => {
      if (!containerRef.current) return;

      try {
        setIsLoading(true);
        setError(null);

        // Dynamic imports to avoid SSR issues
        // BlockSuite uses browser APIs that aren't available during SSR
        const [presetsModule, blocksModule, storeModule, blocksEffectsModule, presetsEffectsModule] = await Promise.all([
          import("@blocksuite/presets"),
          import("@blocksuite/blocks"),
          import("@blocksuite/store"),
          import("@blocksuite/blocks/effects"),
          import("@blocksuite/presets/effects"),
        ]);

        if (!mounted) return;

        const { EdgelessEditor } = presetsModule;
        const { AffineSchemas } = blocksModule;
        const { Schema, DocCollection } = storeModule;
        const { effects: blocksEffects } = blocksEffectsModule;
        const { effects: presetsEffects } = presetsEffectsModule;

        // CRITICAL: Call effects() to register all custom elements
        // This must be done before instantiating editors, otherwise you get "Illegal constructor"
        // See: https://github.com/toeverything/blocksuite/discussions/8927
        // IMPORTANT: Only register once per page load to avoid "already defined" errors
        if (!effectsRegistered) {
          try {
            blocksEffects();
            presetsEffects();
            effectsRegistered = true;
            console.log("[MindMapCanvas] Custom elements registered successfully");
          } catch (error) {
            // Ignore "already defined" errors - they're harmless
            const errorMsg = error instanceof Error ? error.message : String(error);
            if (!errorMsg.includes("already been defined")) {
              console.error("[MindMapCanvas] Failed to register effects:", error);
              throw error;
            }
            console.log("[MindMapCanvas] Custom elements already registered, continuing");
          }
        }

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

        // CRITICAL: Initialize collection metadata before creating docs
        // This is required in BlockSuite v0.19.x - without it, createDoc() returns null
        collection.meta.initialize();

        console.log("[MindMapCanvas] Created collection:", collectionId);
        console.log("[MindMapCanvas] Creating doc with ID:", docId);

        // Create document using the proper v0.19.x API
        const doc = collection.createDoc({ id: docId });

        console.log("[MindMapCanvas] createDoc result:", doc);
        console.log("[MindMapCanvas] Doc has load method?", doc && typeof (doc as any).load === 'function');

        // Ensure doc was created successfully
        if (!doc) {
          console.error("[MindMapCanvas] DocCollection details:", {
            collection,
            collectionId,
            docId,
            schema,
          });
          throw new Error(
            "Failed to create BlockSuite document. The DocCollection.createDoc() returned null.",
          );
        }

        // Store surface block reference for mindmap creation
        let surfaceId: string = "";

        // Initialize with required root blocks using load callback
        // IMPORTANT: doc.load() returns a Promise in BlockSuite v0.19.x
        // We must await it to ensure blocks are created before proceeding
        await doc.load(() => {
          const pageBlockId = doc.addBlock("affine:page", {});
          surfaceId = doc.addBlock("affine:surface", {}, pageBlockId);
          // Add a note block for any text content
          const noteBlockId = doc.addBlock("affine:note", {}, pageBlockId);
          doc.addBlock("affine:paragraph", {}, noteBlockId);
        });

        // Verify surface was created successfully
        if (!surfaceId) {
          throw new Error(
            "Failed to create surface block during document initialization.",
          );
        }

        console.log("[MindMapCanvas] Document loaded, surfaceId:", surfaceId);

        docRef.current = doc;

        if (!mounted) return;

        // Create the edgeless editor
        const editor = new EdgelessEditor();

        // Set editor properties using unknown cast for dynamic properties
        // EdgelessEditor may not expose all properties in its TypeScript definition
        const editorElement = editor as unknown as {
          doc: Doc;
          readonly: boolean;
          updateComplete?: Promise<boolean>;
        };
        editorElement.doc = doc;
        editorElement.readonly = readOnly;

        console.log('[MindMapCanvas] Editor element has updateComplete?', !!editorElement.updateComplete);

        // Mount to container
        if (containerRef.current && mounted) {
          clearContainer(containerRef.current);

          // Apply explicit styling to editor element for visibility
          const editorNode = editor as Node & {
            style?: {
              width: string;
              height: string;
              minHeight: string;
              display: string;
            };
          };
          if (editorNode.style) {
            editorNode.style.width = '100%';
            editorNode.style.height = '100%';
            editorNode.style.minHeight = '400px';
            editorNode.style.display = 'block';
          }

          containerRef.current.appendChild(editorNode);
          editorRef.current = editor;

          console.log('[MindMapCanvas] Editor mounted to container');

          // Start suppressing BlockSuite internal errors early
          // These errors are non-fatal and occur during async initialization
          const originalError = console.error;
          const suppressBlockSuiteErrors = (...args: unknown[]) => {
            const errorMsg = args[0]?.toString() || '';
            if (errorMsg.includes('callback is not a function') ||
                errorMsg.includes('Host is not ready') ||
                errorMsg.includes('already been defined')) {
              return; // Suppress these known non-fatal errors
            }
            originalError.apply(console, args);
          };
          console.error = suppressBlockSuiteErrors;

          // CRITICAL: Wait for the editor's render() to complete
          // Without this, we get "Host is not ready to use" errors
          if (editorElement.updateComplete) {
            console.log('[MindMapCanvas] About to wait for updateComplete');

            // Add timeout to updateComplete to prevent infinite hang
            const updateCompleteWithTimeout = Promise.race([
              editorElement.updateComplete,
              new Promise((resolve) => setTimeout(() => {
                console.warn('[MindMapCanvas] updateComplete timed out after 2s, proceeding anyway');
                resolve(true);
              }, 2000))
            ]);

            await updateCompleteWithTimeout;
            console.log('[MindMapCanvas] updateComplete finished');
          } else {
            console.warn('[MindMapCanvas] updateComplete not available, using setTimeout fallback');
            // Fallback: just wait a bit for the editor to render
            await new Promise(resolve => setTimeout(resolve, 100));
          }

          // CRITICAL: Additional wait for host to be fully initialized
          // Even after updateComplete, the host may not be ready for operations
          // Wait for host.std to be available AND give extra time for internal initialization
          console.log('[MindMapCanvas] Waiting for host to be ready...');
          let hostReadyAttempts = 0;
          const maxHostAttempts = 30; // 3 seconds max wait (30 * 100ms)
          while (hostReadyAttempts < maxHostAttempts) {
            const editorWithHost = editor as {
              host?: {
                std?: unknown;
                renderRoot?: unknown;
              }
            };
            // Check multiple indicators that host is ready
            const hasStd = !!editorWithHost.host?.std;
            const hasRenderRoot = !!editorWithHost.host?.renderRoot;

            if (hasStd && hasRenderRoot) {
              console.log('[MindMapCanvas] Host is ready after', hostReadyAttempts * 100, 'ms');
              // Additional safety delay - wait extra time for BlockSuite's internal controllers
              // to fully initialize (PointerController, UIEventDispatcher, etc.)
              // This is critical because the host's connectedCallback triggers async initialization
              console.log('[MindMapCanvas] Adding safety delay for internal initialization...');
              await new Promise(resolve => setTimeout(resolve, 500));
              console.log('[MindMapCanvas] Safety delay complete');
              break;
            }
            await new Promise(resolve => setTimeout(resolve, 100));
            hostReadyAttempts++;
          }
          if (hostReadyAttempts >= maxHostAttempts) {
            console.warn('[MindMapCanvas] Host did not become ready within timeout');
          }

          // Function to add mindmap once surface is ready
          const addMindmapToSurface = (): boolean => {
            if (!mounted || !surfaceId) return false;

            try {
              // TODO: Migrate to store.getBlock() when upgrading BlockSuite to v1.0+
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

                // Error suppression already active from earlier in initialization
                // Will remain active for 5 seconds after mindmap creation
                const mindmapId = surfaceBlock.addElement({
                  type: "mindmap",
                  children: treeToRender,
                  style: style,
                  layoutType: layout, // 0=RIGHT, 1=LEFT, 2=BALANCE
                });

                // Keep error suppression active for 5 seconds after mindmap creation
                // to cover all async layout and subscription events
                setTimeout(() => {
                  console.error = originalError;
                  console.log('[MindMapCanvas] Error suppression ended');
                }, 5000);

                console.log("[MindMapCanvas] Mindmap added with ID:", mindmapId);

                mindmapIdRef.current = mindmapId;
                surfaceIdRef.current = surfaceId;

                // Notify parent component that refs are ready for operations
                if (onRefsReady) {
                  onRefsReady({
                    editor: editorRef.current,
                    doc: docRef.current,
                    mindmapId: mindmapId,
                    surfaceId: surfaceId,
                  });
                }
                return true;
              }
              return false;
            } catch (e) {
              console.warn("Failed to add mindmap element:", e);
              return false;
            }
          };

          // Since we awaited doc.load(), try to add mindmap immediately first
          // The surface block should be ready since its ID was captured in the load callback
          if (addMindmapToSurface()) {
            console.log("[MindMapCanvas] Mindmap added immediately after doc.load()");
          } else {
            // If immediate add failed, use polling as fallback
            // This handles edge cases where surface block needs more time to initialize
            console.log("[MindMapCanvas] Immediate add failed, falling back to polling");

            const MAX_ATTEMPTS = 20; // 20 attempts × 100ms = 2000ms max wait
            const POLL_INTERVAL_MS = 100;
            let attempts = 0;

            const pollForSurface = () => {
              if (!mounted) return;
              if (addMindmapToSurface()) {
                console.log("[MindMapCanvas] Mindmap added after", attempts, "polling attempts");
                return;
              }
              if (attempts < MAX_ATTEMPTS) {
                attempts++;
                setTimeout(pollForSurface, POLL_INTERVAL_MS);
              } else {
                console.error(
                  "[MindMapCanvas] Surface not ready after max polling attempts (2s)",
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
          // IMPORTANT: Only set up if onTreeChange callback is provided
          if (onTreeChange) {
            const docWithSlots = doc as Doc & StoreWithSlots;
            if (docWithSlots.slots?.blockUpdated) {
              try {
                const updateSubscription =
                  docWithSlots.slots.blockUpdated.subscribe((payload: unknown) => {
                    // Accept the payload parameter to match BlockSuite's subscription signature
                    // The payload contains BlockSuite's internal update information
                    console.log('[MindMapCanvas] Tree changed:', payload);

                    if (!mounted) return;

                    try {
                      // Try to extract the actual current tree from BlockSuite
                      // TODO: Migrate to store.getBlock() when upgrading BlockSuite to v1.0+
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
                    } catch (treeError) {
                      console.warn('[MindMapCanvas] Error in tree change handler:', treeError);
                    }
                  });
                if (updateSubscription) {
                  subscriptions.push(updateSubscription);
                  console.log('[MindMapCanvas] Successfully subscribed to blockUpdated events');
                }
              } catch (subscriptionError) {
                console.warn('[MindMapCanvas] Failed to subscribe to blockUpdated:', subscriptionError);
              }
            }
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

          // DEBUG: Log loading state change
          console.log('[MindMapCanvas] Setting isLoading to false');
          console.log('[MindMapCanvas] Container element:', containerRef.current);
          console.log('[MindMapCanvas] Container dimensions:', {
            width: containerRef.current?.offsetWidth,
            height: containerRef.current?.offsetHeight,
            display: globalThis.getComputedStyle(containerRef.current!).display,
            opacity: globalThis.getComputedStyle(containerRef.current!).opacity,
          });
          console.log('[MindMapCanvas] Editor element:', editorRef.current);

          setIsLoading(false);

          // CRITICAL FIX: Directly set opacity to 1 to bypass React state update delay
          // React state updates are async, so we need to manipulate DOM directly
          if (containerRef.current) {
            containerRef.current.style.opacity = '1';
            console.log('[MindMapCanvas] Directly set container opacity to 1');
          }

          // Force a re-check after state update
          setTimeout(() => {
            console.log('[MindMapCanvas] After setIsLoading(false), opacity:',
              containerRef.current ? globalThis.getComputedStyle(containerRef.current).opacity : 'no ref');
          }, 100);
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
      // Handle both Disposable (dispose) and Subscription (unsubscribe) patterns
      subscriptions.forEach((sub) => {
        try {
          if (sub.dispose) {
            sub.dispose();
          } else if (sub.unsubscribe) {
            sub.unsubscribe();
          }
        } catch (e) {
          console.warn('[MindMapCanvas] Failed to cleanup subscription:', e);
        }
      });
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
    onRefsReady,
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
            onClick={() => globalThis.location.reload()}
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
        className,
      )}
      style={{
        display: "flex",
        flexDirection: "column",
        width: "100%",
        height: "100%",
        minHeight: "400px",
        // Force visibility when not loading - inline style overrides everything
        opacity: isLoading ? 0 : 1,
        transition: "opacity 0.2s ease-in-out",
      }}
    />
  );
}

export default MindMapCanvas;
