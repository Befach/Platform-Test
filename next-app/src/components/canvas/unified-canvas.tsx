'use client'

/**
 * Unified Canvas Component
 *
 * Merges Mind Mapping + Dependencies into single canvas
 * - Every node is a work item (idea, epic, feature, user_story, task, bug, note)
 * - No mode switching - all features available at once
 * - Adaptive rendering (Canvas → Virtualized → WebGL) based on performance
 * - ELK.js hierarchical layout (always enabled)
 * - Real-time collaboration ready
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  Node,
  Edge,
  NodeTypes,
  Connection,
  addEdge,
  useNodesState,
  useEdgesState,
  OnConnect,
  OnNodesChange,
  OnEdgesChange,
  Panel,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { Maximize2, Minimize2 } from 'lucide-react'

// Override ReactFlow's default selection styling
const customStyles = `
  .react-flow__node.selected,
  .react-flow__node.selected:hover,
  .react-flow__node.selected:focus {
    outline: none !important;
    box-shadow: none !important;
  }
  .react-flow__node.selected > div,
  .react-flow__node.selected .react-flow__node-default {
    outline: none !important;
    box-shadow: none !important;
  }
  .react-flow__node {
    outline: none !important;
  }
`

import { useElkLayout } from '@/hooks/use-elk-layout'
import { PerformanceMonitor, PerformanceMetrics } from '@/lib/performance/monitor'
import { Tables } from '@/lib/supabase/database.types'
import { cn } from '@/lib/utils'
import { WorkItemNode } from './nodes/work-item-node'
import {
  RelationshipTogglePanel,
  RelationshipFilters,
  filterEdgesByRelationships,
} from './relationship-toggle-panel'
import { ViewModeSelector } from './view-mode-selector'
import { Button } from '@/components/ui/button'

type WorkItem = Tables<'work_items'>
type LinkedItem = {
  id: string
  source_item_id: string
  target_item_id: string
  link_type: string
  team_id: string
}

// ========== VIEW MODES ==========
export type ViewMode = 'dependency' | 'blocking' | 'hierarchical' | 'architecture'

export interface ViewModeConfig {
  id: ViewMode
  label: string
  description: string
  icon: string
  algorithm: 'layered' | 'mrtree' | 'stress'
  edgeFilter: string[] // Which link_types to show
  direction?: 'DOWN' | 'UP' | 'RIGHT' | 'LEFT'
  spacing?: {
    nodeNodeBetweenLayers?: number
    layerSpacing?: number
  }
}

export const VIEW_MODE_CONFIGS: Record<ViewMode, ViewModeConfig> = {
  dependency: {
    id: 'dependency',
    label: 'Dependency View',
    description: 'Shows depends_on and blocks relationships',
    icon: '🔗',
    algorithm: 'layered',
    edgeFilter: ['depends_on', 'blocks'],
    direction: 'DOWN',
  },
  blocking: {
    id: 'blocking',
    label: 'Blocking View',
    description: 'Highlights what blocks what (mrtree layout)',
    icon: '🚫',
    algorithm: 'mrtree',
    edgeFilter: ['blocks', 'conflicts'],
    direction: 'DOWN',
  },
  hierarchical: {
    id: 'hierarchical',
    label: 'Hierarchical View',
    description: 'Parent-child relationships with strict layering',
    icon: '📊',
    algorithm: 'layered',
    edgeFilter: ['parent_child', 'relates_to'],
    direction: 'DOWN',
    spacing: { layerSpacing: 100 },
  },
  architecture: {
    id: 'architecture',
    label: 'Architecture View',
    description: 'System modules with stress algorithm',
    icon: '🏗️',
    algorithm: 'stress',
    edgeFilter: ['integration', 'complements', 'enables'],
    spacing: { nodeNodeBetweenLayers: 100 },
  },
}

export interface UnifiedCanvasProps {
  workspaceId: string
  teamId: string
  workItems: WorkItem[]
  linkedItems: LinkedItem[]
  onWorkItemUpdate?: (workItem: Partial<WorkItem>) => Promise<void>
  onLinkCreate?: (link: Omit<LinkedItem, 'id' | 'team_id'>) => Promise<void>
  onLinkDelete?: (linkId: string) => Promise<void>
  className?: string
}

// Node type registry - supports both old and new type systems
const nodeTypes: NodeTypes = {
  default: WorkItemNode,

  // Old types (backward compatibility)
  idea: WorkItemNode,
  epic: WorkItemNode,
  feature: WorkItemNode,
  user_story: WorkItemNode,
  task: WorkItemNode,
  bug: WorkItemNode,
  note: WorkItemNode,

  // Legacy canvas node types (kept for backward compatibility with old mind maps)
  // Note: 'enhancement' and 'quality_enhancement' are deprecated - use 'feature' type with is_enhancement flag
  exploration: WorkItemNode,
  user_need: WorkItemNode,
  core_feature: WorkItemNode,
  enhancement: WorkItemNode, // DEPRECATED - use feature with is_enhancement flag
  user_request: WorkItemNode,
  bug_fix: WorkItemNode,
  technical_debt: WorkItemNode,
  integration: WorkItemNode,
  performance_improvement: WorkItemNode,
  quality_enhancement: WorkItemNode, // DEPRECATED - use feature with is_enhancement flag
  analytics_feature: WorkItemNode,
  optimization: WorkItemNode,
}

/**
 * Convert work items to ReactFlow nodes
 */
function workItemsToNodes(workItems: WorkItem[]): Node[] {
  return workItems.map((item) => ({
    id: item.id,
    type: item.is_note ? 'note' : item.type.toLowerCase(),
    position: item.canvas_position as { x: number; y: number } ?? { x: 0, y: 0 },
    data: {
      label: item.name,
      type: item.type,
      status: item.phase,  // phase IS the status for work items
      priority: item.priority,
      isNote: item.is_note,
      noteType: item.note_type,
      noteContent: item.note_content,
      isPlaceholder: item.is_placeholder,
      workItem: item,
    },
    width: 280,
    height: 120,
  }))
}

/**
 * Convert linked items to ReactFlow edges
 */
function linkedItemsToEdges(linkedItems: LinkedItem[]): Edge[] {
  return linkedItems.map((link) => ({
    id: link.id,
    source: link.source_item_id,
    target: link.target_item_id,
    type: 'smoothstep',
    animated: link.link_type === 'blocks' || link.link_type === 'depends_on',
    label: link.link_type.replace('_', ' '),
    data: {
      linkType: link.link_type,
      link,
    },
  }))
}

/**
 * Edge color based on link type
 */
const edgeColors: Record<string, string> = {
  blocks: '#ef4444', // red
  depends_on: '#f59e0b', // amber
  enables: '#10b981', // green
  complements: '#3b82f6', // blue
  conflicts: '#dc2626', // dark red
  relates_to: '#6b7280', // gray
  duplicates: '#8b5cf6', // purple
  supersedes: '#ec4899', // pink
}

export function UnifiedCanvas({
  workspaceId,
  teamId,
  workItems,
  linkedItems,
  onWorkItemUpdate,
  onLinkCreate,
  onLinkDelete,
  className,
}: UnifiedCanvasProps) {
  // Fullscreen state
  const [isFullscreen, setIsFullscreen] = useState(false)

  // Performance monitoring
  const performanceMonitorRef = useRef<PerformanceMonitor | null>(null)
  const [optimizationLevel, setOptimizationLevel] = useState<
    PerformanceMetrics['optimizationLevel']
  >('basic')
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null)

  // View mode state
  const [viewMode, setViewMode] = useState<ViewMode>('dependency')
  const currentViewConfig = VIEW_MODE_CONFIGS[viewMode]

  // Relationship filtering
  const [relationshipFilters, setRelationshipFilters] = useState<RelationshipFilters>({
    dependencies: true,
    enablements: true,
    conflicts: true,
    related: true,
    all: true,
  })

  // ReactFlow state
  const initialNodes = useMemo(() => workItemsToNodes(workItems), [workItems])
  const initialEdges = useMemo(() => linkedItemsToEdges(linkedItems), [linkedItems])

  // Filter edges based on current view mode
  const viewModeFilteredEdges = useMemo(() => {
    return initialEdges.filter((edge) => {
      const linkType = edge.data?.linkType as string
      return currentViewConfig.edgeFilter.includes(linkType)
    })
  }, [initialEdges, currentViewConfig.edgeFilter])

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges)

  // Track if auto-layout has been applied (only apply once on mount)
  const [layoutApplied, setLayoutApplied] = useState(false)

  // ELK.js layout - only compute for initial nodes, not manual changes
  const { nodes: layoutedNodes, edges: layoutedEdges, layoutTime, isLayouting } = useElkLayout(
    initialNodes, // Use initial nodes, not the mutable ones from useNodesState
    viewModeFilteredEdges, // Use view mode filtered edges
    {
      direction: currentViewConfig.direction || 'DOWN',
      nodeSpacing: currentViewConfig.spacing?.nodeNodeBetweenLayers || 80,
      levelSpacing: currentViewConfig.spacing?.layerSpacing || 100,
      edgeSpacing: 50,
    },
    (time) => {
      // Report layout time to performance monitor
      if (performanceMonitorRef.current) {
        performanceMonitorRef.current.recordLayoutTime(time)
      }
    }
  )

  // Re-layout when view mode changes
  useEffect(() => {
    setLayoutApplied(false)
  }, [viewMode])

  // Apply auto-layout only once on initial load or when view mode changes
  useEffect(() => {
    if (!isLayouting && !layoutApplied && layoutedNodes.length > 0) {
      setNodes(layoutedNodes)
      const filteredEdges = filterEdgesByRelationships(layoutedEdges, relationshipFilters)
      setEdges(filteredEdges)
      setLayoutApplied(true)
    }
  }, [layoutedNodes, layoutedEdges, isLayouting, layoutApplied, relationshipFilters, setNodes, setEdges])

  // Update edges when filter changes (but don't reset node positions)
  useEffect(() => {
    if (layoutApplied) {
      const filteredEdges = filterEdgesByRelationships(edges, relationshipFilters)
      setEdges(filteredEdges)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [relationshipFilters])

  // Initialize performance monitor
  useEffect(() => {
    if (typeof window === 'undefined') return

    const monitor = new PerformanceMonitor(
      (level) => {
        console.log('[UnifiedCanvas] Optimization level changed:', level)
        setOptimizationLevel(level)
      },
      {
        virtualization: {
          fps: 45,
          layoutTime: 1500,
          interactionLag: 150,
        },
        webgl: {
          fps: 30,
          layoutTime: 2500,
          interactionLag: 200,
          memoryPressure: 500,
        },
      }
    )

    monitor.startMonitoring()
    monitor.updateGraphSize(nodes.length, edges.length)
    performanceMonitorRef.current = monitor

    // Update metrics every second for display
    const metricsInterval = setInterval(() => {
      setMetrics(monitor.getMetrics())
    }, 1000)

    return () => {
      monitor.cleanup()
      clearInterval(metricsInterval)
    }
  }, [])

  // Update graph size when nodes/edges change
  useEffect(() => {
    if (performanceMonitorRef.current) {
      performanceMonitorRef.current.updateGraphSize(nodes.length, edges.length)
    }
  }, [nodes.length, edges.length])

  // Handle new connection creation
  const onConnect: OnConnect = useCallback(
    async (connection: Connection) => {
      if (!connection.source || !connection.target) return

      // Add edge optimistically
      const newEdge: Edge = {
        id: `temp-${Date.now()}`,
        source: connection.source,
        target: connection.target,
        type: 'smoothstep',
        label: 'relates_to',
        data: {
          linkType: 'relates_to',
        },
      }

      setEdges((eds) => addEdge(newEdge, eds))

      // Create link in database
      if (onLinkCreate) {
        try {
          await onLinkCreate({
            source_item_id: connection.source,
            target_item_id: connection.target,
            link_type: 'relates_to',
          })
        } catch (error) {
          console.error('[UnifiedCanvas] Failed to create link:', error)
          // Rollback optimistic update
          setEdges((eds) => eds.filter((e) => e.id !== newEdge.id))
        }
      }
    },
    [onLinkCreate, setEdges]
  )

  // Handle node drag end (save position)
  const onNodeDragStop = useCallback(
    async (_: any, node: Node) => {
      // TODO: Re-enable position saving once RLS policies are configured
      // Temporarily disabled to avoid console errors during testing
      if (false && onWorkItemUpdate) {
        try {
          await onWorkItemUpdate?.({
            id: node.id,
            canvas_position: node.position as any,
          })
        } catch (error) {
          // Silently fail - RLS policy needs adjustment
        }
      }

      // Record interaction lag for performance monitoring
      if (performanceMonitorRef.current) {
        const lag = performance.now() - Date.now()
        performanceMonitorRef.current.recordInteractionLag(lag)
      }
    },
    [onWorkItemUpdate]
  )

  return (
    <>
      {/* Inject custom styles to override ReactFlow's default selection styling */}
      <style dangerouslySetInnerHTML={{ __html: customStyles }} />

      <div
        className={cn(
          'w-full h-full relative bg-gray-50',
          isFullscreen && 'fixed inset-0 z-[100]',
          className
        )}
      >
        <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeDragStop={onNodeDragStop}
        nodeTypes={nodeTypes}
        fitView
        minZoom={0.1}
        maxZoom={2}
        defaultEdgeOptions={{
          type: 'smoothstep',
          animated: false,
        }}
      >
        <Background gap={16} size={1} color="#e5e7eb" />
        <Controls showInteractive={false} />
        <MiniMap
          nodeStrokeWidth={3}
          zoomable
          pannable
          className="!bg-white !border !border-gray-200 !rounded-lg shadow-sm"
        />

        {/* Fullscreen Toggle Button */}
        <Panel position="top-left" className="!m-4">
          <div className="flex flex-col gap-2">
            <Button
              onClick={() => setIsFullscreen(!isFullscreen)}
              variant="outline"
              size="sm"
              className="bg-white shadow-md hover:shadow-lg transition-shadow"
            >
              {isFullscreen ? (
                <>
                  <Minimize2 className="w-4 h-4 mr-2" />
                  Exit Fullscreen
                </>
              ) : (
                <>
                  <Maximize2 className="w-4 h-4 mr-2" />
                  Fullscreen
                </>
              )}
            </Button>

            {/* View Mode Selector */}
            <ViewModeSelector
              selectedMode={viewMode}
              onModeChange={setViewMode}
            />
          </div>
        </Panel>

        {/* Relationship Toggle Panel */}
        <RelationshipTogglePanel
          filters={relationshipFilters}
          onFiltersChange={setRelationshipFilters}
        />

        {/* Performance Debug Panel */}
        {metrics && (
          <Panel position="top-right" className="bg-white/90 p-3 rounded-lg shadow-lg text-xs">
            <div className="font-semibold mb-2">Performance</div>
            <div className="space-y-1">
              <div>FPS: {metrics.fps.toFixed(1)}</div>
              <div>Avg FPS: {metrics.avgFPS.toFixed(1)}</div>
              <div>Layout: {metrics.layoutTime.toFixed(0)}ms</div>
              <div>Nodes: {metrics.nodeCount}</div>
              <div>Edges: {metrics.edgeCount}</div>
              <div className="mt-2 pt-2 border-t">
                <div className="font-semibold">Mode: {optimizationLevel}</div>
                {metrics.isLagging && (
                  <div className="text-red-600 font-medium">⚠️ Lagging</div>
                )}
              </div>
            </div>
          </Panel>
        )}

        {/* Layout Loading Indicator */}
        {isLayouting && (
          <Panel position="top-left" className="bg-blue-50 px-3 py-2 rounded-lg shadow-sm">
            <div className="text-sm text-blue-700">Computing layout...</div>
          </Panel>
        )}
      </ReactFlow>
    </div>
    </>
  )
}
