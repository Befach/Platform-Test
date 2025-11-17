'use client'

import { useCallback, useState, useEffect, useMemo } from 'react'
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Edge,
  Node,
  Panel,
  NodeTypes,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'

import { MindMapNodeData, MindMapReactFlowNode, MindMapReactFlowEdge } from '@/lib/types/mind-map'
import { IdeaNode } from './node-types/idea-node'
import { ProblemNode } from './node-types/problem-node'
import { SolutionNode } from './node-types/solution-node'
import { FeatureNode } from './node-types/feature-node'
import { QuestionNode } from './node-types/question-node'
import { Badge } from '@/components/ui/badge'
import { Loader2 } from 'lucide-react'

interface MindMapCanvasProps {
  mindMapId: string
  initialNodes: MindMapReactFlowNode[]
  initialEdges: MindMapReactFlowEdge[]
  onNodesChange?: (nodes: Node<MindMapNodeData>[]) => void
  onEdgesChange?: (edges: Edge[]) => void
  onEditNode?: (nodeId: string) => void
  onDeleteNode?: (nodeId: string) => void
  onConvertNode?: (nodeId: string) => void
  readOnly?: boolean
}

// Define custom node types
const nodeTypes: any = {
  idea: IdeaNode,
  problem: ProblemNode,
  solution: SolutionNode,
  feature: FeatureNode,
  question: QuestionNode,
}

export function MindMapCanvas({
  mindMapId,
  initialNodes,
  initialEdges,
  onNodesChange,
  onEdgesChange,
  onEditNode,
  onDeleteNode,
  onConvertNode,
  readOnly = false,
}: MindMapCanvasProps) {
  const [nodes, setNodes, handleNodesChange] = useNodesState(initialNodes)
  const [edges, setEdges, handleEdgesChange] = useEdgesState(initialEdges)
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'error'>('saved')
  const [lastSaved, setLastSaved] = useState<Date>(new Date())

  // Update nodes when initialNodes change
  useEffect(() => {
    setNodes(initialNodes)
  }, [initialNodes, setNodes])

  // Update edges when initialEdges change
  useEffect(() => {
    setEdges(initialEdges)
  }, [initialEdges, setEdges])

  // Handle new connections
  const onConnect = useCallback(
    (connection: Connection) => {
      if (readOnly) return

      const newEdge: any = {
        ...connection,
        id: `edge-${Date.now()}`,
        type: 'smoothstep',
        animated: false,
        style: { stroke: '#94a3b8', strokeWidth: 2 },
      }

      setEdges((eds) => addEdge(newEdge, eds))

      // Notify parent of edge creation
      onEdgesChange?.(addEdge(newEdge, edges))
    },
    [readOnly, setEdges, edges, onEdgesChange]
  )

  // Handle node deletion (keyboard: Delete key)
  const onNodesDelete = useCallback(
    (deleted: Node<MindMapNodeData>[]) => {
      if (readOnly) return
      deleted.forEach((node) => onDeleteNode?.(node.id))
    },
    [readOnly, onDeleteNode]
  )

  // Handle edge deletion
  const onEdgesDelete = useCallback(
    (deleted: Edge[]) => {
      if (readOnly) return
      // Notify parent of edge deletions
      const remainingEdges = edges.filter(
        (edge) => !deleted.find((d) => d.id === edge.id)
      )
      onEdgesChange?.(remainingEdges)
    },
    [readOnly, edges, onEdgesChange]
  )

  // Wrap nodes with custom callbacks
  const wrappedNodes = useMemo(() => {
    return nodes.map((node) => ({
      ...node,
      data: {
        ...node.data,
        onEdit: onEditNode,
        onDelete: onDeleteNode,
        onConvert: onConvertNode,
      },
    }))
  }, [nodes, onEditNode, onDeleteNode, onConvertNode])

  // Auto-save on changes (debounced)
  useEffect(() => {
    if (readOnly) return

    const saveTimer = setTimeout(() => {
      setSaveStatus('saving')

      // Call parent handlers
      onNodesChange?.(nodes)
      onEdgesChange?.(edges)

      // Simulate save completion
      setTimeout(() => {
        setSaveStatus('saved')
        setLastSaved(new Date())
      }, 500)
    }, 2000) // Debounce: save 2 seconds after last change

    return () => clearTimeout(saveTimer)
  }, [nodes, edges, readOnly, onNodesChange, onEdgesChange])

  return (
    <div className="w-full h-full relative">
      <ReactFlow
        nodes={wrappedNodes}
        edges={edges}
        onNodesChange={handleNodesChange}
        onEdgesChange={handleEdgesChange}
        onConnect={onConnect}
        onNodesDelete={onNodesDelete}
        onEdgesDelete={onEdgesDelete}
        nodeTypes={nodeTypes}
        fitView
        minZoom={0.1}
        maxZoom={2}
        defaultEdgeOptions={{
          type: 'smoothstep',
          animated: false,
          style: { stroke: '#94a3b8', strokeWidth: 2 },
        }}
        proOptions={{ hideAttribution: true }}
        deleteKeyCode="Delete"
        multiSelectionKeyCode="Shift"
      >
        <Background
          gap={16}
          size={1}
          color="#e2e8f0"
        />
        <Controls
          showInteractive={false}
        />
        <MiniMap
          nodeStrokeWidth={3}
          zoomable
          pannable
        />

        {/* Save Status Panel */}
        {!readOnly && (
          <Panel position="top-right" className="bg-white/90 rounded-lg shadow-md px-3 py-2">
            <div className="flex items-center gap-2 text-sm">
              {saveStatus === 'saving' && (
                <>
                  <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                  <span className="text-blue-600">Saving...</span>
                </>
              )}
              {saveStatus === 'saved' && (
                <>
                  <div className="h-2 w-2 rounded-full bg-green-500" />
                  <span className="text-slate-600">
                    Saved {lastSaved.toLocaleTimeString()}
                  </span>
                </>
              )}
              {saveStatus === 'error' && (
                <>
                  <div className="h-2 w-2 rounded-full bg-red-500" />
                  <span className="text-red-600">Save failed</span>
                </>
              )}
            </div>
          </Panel>
        )}

        {/* Instructions Panel */}
        <Panel position="bottom-left" className="bg-white/90 rounded-lg shadow-md px-3 py-2">
          <div className="text-xs text-slate-600 space-y-1">
            <div><strong>Pan:</strong> Click & drag canvas</div>
            <div><strong>Zoom:</strong> Mouse wheel / Controls</div>
            <div><strong>Connect:</strong> Drag from handle to handle</div>
            <div><strong>Edit:</strong> Double-click title or click edit icon</div>
            <div><strong>Delete:</strong> Select node + press Delete</div>
          </div>
        </Panel>
      </ReactFlow>
    </div>
  )
}
