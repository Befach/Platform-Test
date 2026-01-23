"use client";

import { cn } from "@/lib/utils";
import { useCallback, useRef, useState } from "react";
import type {
  BlockSuiteLayoutType,
  BlockSuiteMindmapStyle,
  BlockSuiteMindmapNode,
  MindMapCanvasWithToolbarProps,
  MindMapCanvasRefs,
} from "./mindmap-types";
import { MindMapCanvas } from "./mind-map-canvas";
import { MindmapToolbar } from "./mindmap-toolbar";

// Development-only debug logger
const debug =
  process.env.NODE_ENV === "development"
    ? console.log.bind(console)
    : () => {};

// Type for BlockSuite Doc (dynamically imported)
type Doc = import("@blocksuite/store").Doc;

/**
 * Type for mindmap element with node operations
 * Based on BlockSuite MindmapElementModel API
 */
interface MindmapElement {
  id: string;
  tree?: {
    id: string;
    element?: { text?: string };
    children?: Array<{ id: string; element?: { text?: string } }>;
  };
  addTree?: (
    parent: string | null,
    tree: { text: string; children?: Array<{ text: string }> },
  ) => string;
  detachMindmap?: (nodeId: string) => void;
}

/**
 * Type for surface block with element operations
 */
interface SurfaceBlock {
  getElementById?: (id: string) => MindmapElement | null;
  deleteElement?: (id: string) => void;
  addElement?: (props: {
    type: string;
    children?: BlockSuiteMindmapNode;
    style?: number;
    layoutType?: number;
  }) => string;
}

/**
 * MindMapCanvasWithToolbar - MindMapCanvas with integrated toolbar and node operations
 *
 * This component wraps MindMapCanvas and provides a toolbar with fully functional:
 * - Add child node
 * - Add sibling node
 * - Delete node
 * - Undo/Redo
 * - Zoom controls
 * - Style/Layout selection
 *
 * @example
 * ```tsx
 * <MindMapCanvasWithToolbar
 *   initialTree={myTree}
 *   style={4}
 *   layout={2}
 *   onTreeChange={(tree) => console.log('Tree changed:', tree)}
 *   onNodeSelect={(id, text) => console.log('Selected:', id, text)}
 * />
 * ```
 */
export function MindMapCanvasWithToolbar({
  documentId,
  initialTree,
  style: initialStyle = 4 as BlockSuiteMindmapStyle,
  layout: initialLayout = 2 as BlockSuiteLayoutType,
  onTreeChange,
  onNodeSelect,
  readOnly = false,
  className,
  showToolbar = true,
  toolbarPosition = "top",
  toolbarClassName,
}: Readonly<MindMapCanvasWithToolbarProps>) {
  // Refs for BlockSuite internals (set by the canvas via onRefsReady callback)
  const docRef = useRef<Doc | null>(null);
  const editorRef = useRef<unknown>(null);
  const mindmapIdRef = useRef<string | null>(null);
  const surfaceIdRef = useRef<string | null>(null);

  // State for selection and style/layout
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [currentStyle, setCurrentStyle] =
    useState<BlockSuiteMindmapStyle>(initialStyle);
  const [currentLayout, setCurrentLayout] =
    useState<BlockSuiteLayoutType>(initialLayout);
  const [refsReady, setRefsReady] = useState(false);
  const [mindmapId, setMindmapId] = useState<string | null>(null);

  // Key for forcing canvas remount on style/layout change
  const [canvasKey, setCanvasKey] = useState(0);

  /**
   * Handle refs being ready from MindMapCanvas
   */
  const handleRefsReady = useCallback((refs: MindMapCanvasRefs) => {
    editorRef.current = refs.editor;
    docRef.current = refs.doc;
    mindmapIdRef.current = refs.mindmapId;
    surfaceIdRef.current = refs.surfaceId;
    setMindmapId(refs.mindmapId);
    setRefsReady(true);
  }, []);

  /**
   * Get the mindmap element from the surface
   */
  const getMindmapElement = useCallback((): MindmapElement | null => {
    if (
      !refsReady ||
      !docRef.current ||
      !surfaceIdRef.current ||
      !mindmapIdRef.current
    ) {
      return null;
    }

    try {
      // TODO: Migrate to store.getBlock() when upgrading BlockSuite to v1.0+
      // The getBlockById API is deprecated in v0.19.x but still functional.
      // New API: store.getBlock(id) or store.getModelById(id)
      // See: https://github.com/toeverything/blocksuite/blob/main/packages/docs/api/@blocksuite/store/classes/Store.md
      const surface = docRef.current.getBlockById(
        surfaceIdRef.current,
      ) as SurfaceBlock | null;
      if (!surface?.getElementById) {
        return null;
      }

      return surface.getElementById(mindmapIdRef.current);
    } catch (e) {
      console.warn("[MindMapCanvasWithToolbar] Failed to get mindmap:", e);
      return null;
    }
  }, [refsReady]);

  /**
   * Add a child node to the selected node
   */
  const handleAddChild = useCallback(
    (parentNodeId: string) => {
      const mindmap = getMindmapElement();
      if (!mindmap) {
        console.warn(
          "[MindMapCanvasWithToolbar] Cannot add child: mindmap not found",
        );
        return;
      }

      try {
        // Use BlockSuite's addTree method to add a child node
        if (mindmap.addTree) {
          const newNodeId = mindmap.addTree(parentNodeId, {
            text: "New Node",
            children: [],
          });
          debug(
            "[MindMapCanvasWithToolbar] Added child to node:",
            parentNodeId,
            "New node ID:",
            newNodeId,
          );

          // POTENTIAL FIX: Force visibility on newly added BlockSuite elements
          // Try to find and fix opacity on the new node element in the DOM
          setTimeout(() => {
            try {
              if (editorRef.current) {
                const editorEl = (editorRef.current as { host?: { renderRoot?: Element } })?.host?.renderRoot;
                if (editorEl) {
                  // Find all mindmap elements and ensure they have opacity 1
                  const mindmapElements = editorEl.querySelectorAll('[data-block-id]');
                  mindmapElements.forEach((el) => {
                    const htmlEl = el as HTMLElement;
                    const currentOpacity = globalThis.getComputedStyle(htmlEl).opacity;
                    if (currentOpacity !== '1') {
                      console.log('[MindMapCanvasWithToolbar] Fixing opacity on element:', el, 'from', currentOpacity, 'to 1');
                      htmlEl.style.opacity = '1';
                    }
                  });
                }
              }
            } catch (domError) {
              console.warn('[MindMapCanvasWithToolbar] Could not fix element opacity:', domError);
            }
          }, 100);
        } else {
          // Fallback: Try direct tree manipulation
          console.warn(
            "[MindMapCanvasWithToolbar] addTree method not available on mindmap element",
          );
        }
      } catch (e) {
        console.error("[MindMapCanvasWithToolbar] Failed to add child:", e);
      }
    },
    [getMindmapElement],
  );

  /**
   * Add a sibling node next to the selected node
   * For mindmaps, this means adding a child to the parent of the selected node
   */
  const handleAddSibling = useCallback(
    (nodeId: string) => {
      const mindmap = getMindmapElement();
      if (!mindmap) {
        console.warn(
          "[MindMapCanvasWithToolbar] Cannot add sibling: mindmap not found",
        );
        return;
      }

      try {
        // For adding sibling, we need to find the parent of the current node
        // and add a new child to that parent
        // In BlockSuite mindmaps, the tree structure is: mindmap.tree -> children
        if (mindmap.tree && mindmap.addTree) {
          // Find parent of the node
          const findParent = (
            current: {
              id: string;
              children?: Array<{ id: string; children?: unknown[] }>;
            },
            targetId: string,
            parent: { id: string } | null = null,
          ): { id: string } | null => {
            if (current.id === targetId) {
              return parent;
            }
            if (current.children) {
              for (const child of current.children) {
                const found = findParent(
                  child as {
                    id: string;
                    children?: Array<{ id: string; children?: unknown[] }>;
                  },
                  targetId,
                  current,
                );
                if (found) return found;
              }
            }
            return null;
          };

          const parent = findParent(mindmap.tree, nodeId);
          if (parent) {
            const newNodeId = mindmap.addTree(parent.id, {
              text: "New Node",
              children: [],
            });
            debug(
              "[MindMapCanvasWithToolbar] Added sibling to node:",
              nodeId,
              "New node ID:",
              newNodeId,
            );

            // POTENTIAL FIX: Force visibility on newly added BlockSuite elements
            setTimeout(() => {
              try {
                if (editorRef.current) {
                  const editorEl = (editorRef.current as { host?: { renderRoot?: Element } })?.host?.renderRoot;
                  if (editorEl) {
                    const mindmapElements = editorEl.querySelectorAll('[data-block-id]');
                    mindmapElements.forEach((el) => {
                      const htmlEl = el as HTMLElement;
                      const currentOpacity = globalThis.getComputedStyle(htmlEl).opacity;
                      if (currentOpacity !== '1') {
                        console.log('[MindMapCanvasWithToolbar] Fixing opacity on sibling element:', el, 'from', currentOpacity, 'to 1');
                        htmlEl.style.opacity = '1';
                      }
                    });
                  }
                }
              } catch (domError) {
                console.warn('[MindMapCanvasWithToolbar] Could not fix sibling element opacity:', domError);
              }
            }, 100);
          } else {
            console.warn(
              "[MindMapCanvasWithToolbar] Could not find parent for sibling",
            );
          }
        } else {
          console.warn(
            "[MindMapCanvasWithToolbar] Tree structure not available",
          );
        }
      } catch (e) {
        console.error("[MindMapCanvasWithToolbar] Failed to add sibling:", e);
      }
    },
    [getMindmapElement],
  );

  /**
   * Delete the selected node and its children
   */
  const handleDeleteNode = useCallback(
    (nodeId: string) => {
      const mindmap = getMindmapElement();
      if (!mindmap) {
        console.warn(
          "[MindMapCanvasWithToolbar] Cannot delete: mindmap not found",
        );
        return;
      }

      try {
        // Use detachMindmap to remove a node from the mindmap
        if (mindmap.detachMindmap) {
          mindmap.detachMindmap(nodeId);
          setSelectedNodeId(null);
          debug("[MindMapCanvasWithToolbar] Deleted node:", nodeId);
        } else if (docRef.current && surfaceIdRef.current) {
          // Fallback: Try surface deleteElement
          // TODO: Migrate to store.getBlock() when upgrading BlockSuite (see getMindmapElement TODO)
          const surface = docRef.current.getBlockById(
            surfaceIdRef.current,
          ) as SurfaceBlock | null;
          if (surface?.deleteElement) {
            surface.deleteElement(nodeId);
            setSelectedNodeId(null);
            debug(
              "[MindMapCanvasWithToolbar] Deleted node via surface:",
              nodeId,
            );
          }
        }
      } catch (e) {
        console.error("[MindMapCanvasWithToolbar] Failed to delete node:", e);
      }
    },
    [getMindmapElement],
  );

  /**
   * Undo the last operation
   */
  const handleUndo = useCallback(() => {
    if (!refsReady || !docRef.current) {
      console.warn("[MindMapCanvasWithToolbar] Cannot undo: doc not available");
      return;
    }

    try {
      const docWithHistory = docRef.current as unknown as {
        undo?: () => void;
        history?: { undo?: () => void };
      };

      if (docWithHistory.undo) {
        docWithHistory.undo();
        console.log("[MindMapCanvasWithToolbar] Undo executed");
      } else if (docWithHistory.history?.undo) {
        docWithHistory.history.undo();
        console.log("[MindMapCanvasWithToolbar] Undo executed via history");
      } else {
        console.warn("[MindMapCanvasWithToolbar] Undo not available on doc");
      }
    } catch (e) {
      console.error("[MindMapCanvasWithToolbar] Failed to undo:", e);
    }
  }, [refsReady]);

  /**
   * Redo the last undone operation
   */
  const handleRedo = useCallback(() => {
    if (!refsReady || !docRef.current) {
      console.warn("[MindMapCanvasWithToolbar] Cannot redo: doc not available");
      return;
    }

    try {
      const docWithHistory = docRef.current as unknown as {
        redo?: () => void;
        history?: { redo?: () => void };
      };

      if (docWithHistory.redo) {
        docWithHistory.redo();
        console.log("[MindMapCanvasWithToolbar] Redo executed");
      } else if (docWithHistory.history?.redo) {
        docWithHistory.history.redo();
        console.log("[MindMapCanvasWithToolbar] Redo executed via history");
      } else {
        console.warn("[MindMapCanvasWithToolbar] Redo not available on doc");
      }
    } catch (e) {
      console.error("[MindMapCanvasWithToolbar] Failed to redo:", e);
    }
  }, [refsReady]);

  /**
   * Handle node selection from canvas
   */
  const handleNodeSelect = useCallback(
    (nodeId: string, text: string) => {
      setSelectedNodeId(nodeId);
      onNodeSelect?.(nodeId, text);
    },
    [onNodeSelect],
  );

  /**
   * Handle style change - requires canvas remount
   */
  const handleStyleChange = useCallback((newStyle: BlockSuiteMindmapStyle) => {
    setCurrentStyle(newStyle);
    setRefsReady(false);
    setSelectedNodeId(null);
    setMindmapId(null);
    setCanvasKey((prev) => prev + 1); // Force remount
  }, []);

  /**
   * Handle layout change - requires canvas remount
   */
  const handleLayoutChange = useCallback((newLayout: BlockSuiteLayoutType) => {
    setCurrentLayout(newLayout);
    setRefsReady(false);
    setSelectedNodeId(null);
    setMindmapId(null);
    setCanvasKey((prev) => prev + 1); // Force remount
  }, []);

  // Render toolbar
  const toolbar = showToolbar && (
    <MindmapToolbar
      editorRef={editorRef}
      docRef={docRef}
      mindmapId={mindmapId}
      selectedNodeId={selectedNodeId}
      style={currentStyle}
      onStyleChange={handleStyleChange}
      layout={currentLayout}
      onLayoutChange={handleLayoutChange}
      onAddChild={handleAddChild}
      onAddSibling={handleAddSibling}
      onDeleteNode={handleDeleteNode}
      onUndo={handleUndo}
      onRedo={handleRedo}
      readOnly={readOnly}
      className={toolbarClassName}
    />
  );

  return (
    <div className={cn("flex flex-col h-full w-full", className)}>
      {toolbarPosition === "top" && toolbar}

      <div className="flex-1 relative">
        <MindMapCanvas
          key={canvasKey}
          documentId={documentId}
          initialTree={initialTree}
          style={currentStyle}
          layout={currentLayout}
          onTreeChange={onTreeChange}
          onNodeSelect={handleNodeSelect}
          onRefsReady={handleRefsReady}
          readOnly={readOnly}
          className="h-full w-full"
        />
      </div>

      {toolbarPosition === "bottom" && toolbar}
    </div>
  );
}

export default MindMapCanvasWithToolbar;
