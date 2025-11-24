'use client'

/**
 * Freeform Canvas Component
 *
 * User-created mind map canvas with shapes and work item references:
 * - 7 shape types (Semantic, Rectangle, Circle, Sticky Note, Text, Arrow, Work Item Reference)
 * - Shape toolbar with formatting controls
 * - Work item search and reference
 * - Drag-and-drop nodes and connections
 * - Auto-save to database
 */

import { useCallback, useState, useMemo, useRef, useEffect } from 'react'
import {
  ReactFlow,
  Node,
  Edge,
  addEdge,
  Connection,
  useNodesState,
  useEdgesState,
  Controls,
  Background,
  MiniMap,
  Panel,
  NodeTypes,
  ConnectionMode,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Save, Loader2, Plus, Trash2 } from 'lucide-react'
import { ShapeToolbar } from './shape-toolbar'
import { WorkItemSearchDialog } from './work-item-search-dialog'
import { RectangleNode } from './nodes/shapes/rectangle-node'
import { CircleNode } from './nodes/shapes/circle-node'
import { CircleNode as SemanticNode } from './nodes/shapes/circle-node'
import { StickyNoteNode } from './nodes/shapes/sticky-note-node'
import { TextNode } from './nodes/shapes/text-node'
import { ArrowNode } from './nodes/shapes/arrow-node'
import { WorkItemReferenceNode } from './nodes/shapes/work-item-reference-node'
import { ShapeType, SHAPE_TYPE_CONFIGS, NodeType } from '@/lib/types/mind-map'
import { cn } from '@/lib/utils'

export interface FreeformCanvasProps {
  mindMapId: string
  workspaceId: string
  teamId: string
  initialNodes?: Node[]
  initialEdges?: Edge[]
  onSave?: () => void
  className?: string
}

// Register all node types
const nodeTypes = {
  semantic: SemanticNode,
  rectangle: RectangleNode,
  circle: CircleNode,
  sticky_note: StickyNoteNode,
  text: TextNode,
  arrow: ArrowNode,
  work_item_reference: WorkItemReferenceNode,
} as NodeTypes

export function FreeformCanvas({
  mindMapId,
  workspaceId,
  teamId,
  initialNodes = [],
  initialEdges = [],
  onSave,
  className,
}: FreeformCanvasProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges)

  const [selectedShape, setSelectedShape] = useState<ShapeType>('rectangle')
  const [backgroundColor, setBackgroundColor] = useState('#ffffff')
  const [borderColor, setBorderColor] = useState('#3b82f6')
  const [fontSize, setFontSize] = useState<'sm' | 'base' | 'lg' | 'xl'>('base')
  const [textAlign, setTextAlign] = useState<'left' | 'center' | 'right'>('left')
  const [fontWeight, setFontWeight] = useState<'normal' | 'semibold' | 'bold'>('normal')

  const [workItemDialogOpen, setWorkItemDialogOpen] = useState(false)
  const [nodeDialogOpen, setNodeDialogOpen] = useState(false)
  const [nodeTitle, setNodeTitle] = useState('')
  const [nodeDescription, setNodeDescription] = useState('')
  const [pendingNodePosition, setPendingNodePosition] = useState<{ x: number; y: number } | null>(null)

  const [isSaving, setIsSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null)

  const reactFlowWrapper = useRef<HTMLDivElement>(null)
  const [reactFlowInstance, setReactFlowInstance] = useState<any>(null)

  // Auto-save every 30 seconds
  useEffect(() => {
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current)
    }

    autoSaveTimerRef.current = setTimeout(() => {
      handleSave()
    }, 30000) // 30 seconds

    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current)
      }
    }
  }, [nodes, edges])

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  )

  const onPaneClick = useCallback(
    (event: React.MouseEvent) => {
      if (!reactFlowInstance) return

      // Get click position in canvas coordinates
      const bounds = reactFlowWrapper.current?.getBoundingClientRect()
      if (!bounds) return

      const position = reactFlowInstance.screenToFlowPosition({
        x: event.clientX - bounds.left,
        y: event.clientY - bounds.top,
      })

      setPendingNodePosition(position)

      // Open work item dialog if work_item_reference is selected
      if (selectedShape === 'work_item_reference') {
        setWorkItemDialogOpen(true)
      } else {
        // Open node creation dialog
        setNodeDialogOpen(true)
      }
    },
    [reactFlowInstance, selectedShape]
  )

  const handleAddNode = useCallback(() => {
    if (!pendingNodePosition) return

    const config = SHAPE_TYPE_CONFIGS[selectedShape]
    const newNode: Node = {
      id: Date.now().toString(),
      type: selectedShape,
      position: pendingNodePosition,
      data: {
        title: nodeTitle || 'New Node',
        description: nodeDescription,
        width: config.defaultWidth,
        height: config.defaultHeight,
        backgroundColor: selectedShape !== 'text' && selectedShape !== 'arrow' ? backgroundColor : undefined,
        borderColor: selectedShape !== 'text' && selectedShape !== 'arrow' ? borderColor : undefined,
        fontSize: selectedShape === 'text' ? fontSize : undefined,
        textAlign: selectedShape === 'text' ? textAlign : undefined,
        fontWeight: selectedShape === 'text' ? fontWeight : undefined,
        nodeType: selectedShape === 'semantic' ? 'idea' as NodeType : undefined,
      },
    }

    setNodes((nds) => [...nds, newNode])
    setNodeDialogOpen(false)
    setNodeTitle('')
    setNodeDescription('')
    setPendingNodePosition(null)
  }, [
    pendingNodePosition,
    selectedShape,
    nodeTitle,
    nodeDescription,
    backgroundColor,
    borderColor,
    fontSize,
    textAlign,
    fontWeight,
    setNodes,
  ])

  const handleAddWorkItemReference = useCallback(
    (workItem: any) => {
      if (!pendingNodePosition) return

      const config = SHAPE_TYPE_CONFIGS['work_item_reference']
      const newNode: Node = {
        id: Date.now().toString(),
        type: 'work_item_reference',
        position: pendingNodePosition,
        data: {
          workItemId: workItem.id,
          title: workItem.title,
          status: workItem.status,
          timeline: workItem.timeline,
          assigneeName: workItem.assignee_name,
          assigneeInitials: workItem.assignee_name
            ?.split(' ')
            .map((n: string) => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2),
          width: config.defaultWidth,
          height: config.defaultHeight,
        },
      }

      setNodes((nds) => [...nds, newNode])
      setPendingNodePosition(null)
    },
    [pendingNodePosition, setNodes]
  )

  const handleDeleteSelected = useCallback(() => {
    setNodes((nds) => nds.filter((node) => !node.selected))
    setEdges((eds) => eds.filter((edge) => !edge.selected))
  }, [setNodes, setEdges])

  const handleSave = useCallback(async () => {
    setIsSaving(true)
    try {
      // Save nodes
      await Promise.all(
        nodes.map(async (node) => {
          const nodeData = {
            mind_map_id: mindMapId,
            team_id: teamId,
            node_type: node.data.nodeType || 'idea',
            shape_type: node.type as ShapeType,
            title: node.data.title,
            description: node.data.description,
            position: node.position,
            width: node.data.width || SHAPE_TYPE_CONFIGS[node.type as ShapeType]?.defaultWidth || 150,
            height: node.data.height || SHAPE_TYPE_CONFIGS[node.type as ShapeType]?.defaultHeight || 100,
            referenced_work_item_id: node.data.workItemId || null,
            data: node.data,
          }

          // Check if node exists (has DB ID) or is new (timestamp ID)
          if (node.id.length > 20) {
            // Existing node - update
            await fetch(`/api/mind-maps/${mindMapId}/nodes/${node.id}`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(nodeData),
            })
          } else {
            // New node - create
            await fetch(`/api/mind-maps/${mindMapId}/nodes`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(nodeData),
            })
          }
        })
      )

      // Save edges
      await Promise.all(
        edges.map(async (edge) => {
          const edgeData = {
            mind_map_id: mindMapId,
            team_id: teamId,
            source_node_id: edge.source,
            target_node_id: edge.target,
            label: edge.label,
            style: edge.style,
          }

          if (edge.id.length > 20) {
            // Existing edge - update
            await fetch(`/api/mind-maps/${mindMapId}/edges/${edge.id}`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(edgeData),
            })
          } else {
            // New edge - create
            await fetch(`/api/mind-maps/${mindMapId}/edges`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(edgeData),
            })
          }
        })
      )

      // Save canvas viewport
      if (reactFlowInstance) {
        const viewport = reactFlowInstance.getViewport()
        await fetch(`/api/mind-maps/${mindMapId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            canvas_data: {
              zoom: viewport.zoom,
              position: [viewport.x, viewport.y],
            },
          }),
        })
      }

      setLastSaved(new Date())
      onSave?.()
    } catch (error) {
      console.error('Error saving mind map:', error)
    } finally {
      setIsSaving(false)
    }
  }, [nodes, edges, mindMapId, teamId, reactFlowInstance, onSave])

  return (
    <div ref={reactFlowWrapper} className={cn('relative w-full h-full', className)}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onInit={setReactFlowInstance}
        onPaneClick={onPaneClick}
        nodeTypes={nodeTypes}
        connectionMode={ConnectionMode.Loose}
        fitView
      >
        <Background />
        <Controls />
        <MiniMap />

        {/* Top Toolbar */}
        <Panel position="top-left" className="m-4">
          <ShapeToolbar
            selectedShape={selectedShape}
            onShapeChange={setSelectedShape}
            backgroundColor={backgroundColor}
            onBackgroundColorChange={setBackgroundColor}
            borderColor={borderColor}
            onBorderColorChange={setBorderColor}
            fontSize={fontSize}
            onFontSizeChange={setFontSize}
            textAlign={textAlign}
            onTextAlignChange={setTextAlign}
            fontWeight={fontWeight}
            onFontWeightChange={setFontWeight}
            onAddWorkItemReference={() => setWorkItemDialogOpen(true)}
          />
        </Panel>

        {/* Top Right Actions */}
        <Panel position="top-right" className="m-4 flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleDeleteSelected}
            className="gap-2"
          >
            <Trash2 className="h-4 w-4" />
            Delete Selected
          </Button>
          <Button
            variant="default"
            size="sm"
            onClick={handleSave}
            disabled={isSaving}
            className="gap-2"
          >
            {isSaving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            {isSaving ? 'Saving...' : 'Save'}
          </Button>
        </Panel>

        {/* Auto-save indicator */}
        {lastSaved && (
          <Panel position="bottom-right" className="m-4">
            <div className="text-xs text-muted-foreground bg-white px-3 py-1.5 rounded-md shadow-sm border">
              Last saved: {lastSaved.toLocaleTimeString()}
            </div>
          </Panel>
        )}

        {/* Instructions */}
        <Panel position="bottom-left" className="m-4">
          <div className="text-xs text-muted-foreground bg-white px-3 py-2 rounded-md shadow-sm border max-w-xs">
            <p className="font-semibold mb-1">Getting Started:</p>
            <ul className="space-y-0.5 list-disc list-inside">
              <li>Click anywhere on the canvas to add a node</li>
              <li>Drag from one node to another to create connections</li>
              <li>Select shapes from the toolbar to change node types</li>
              <li>Delete selected nodes with the Delete button</li>
            </ul>
          </div>
        </Panel>
      </ReactFlow>

      {/* Node Creation Dialog */}
      <Dialog open={nodeDialogOpen} onOpenChange={setNodeDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add {SHAPE_TYPE_CONFIGS[selectedShape]?.label}</DialogTitle>
            <DialogDescription>
              Enter the details for your new node
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={nodeTitle}
                onChange={(e) => setNodeTitle(e.target.value)}
                placeholder="Enter title..."
                autoFocus
              />
            </div>

            <div>
              <Label htmlFor="description">Description (Optional)</Label>
              <Input
                id="description"
                value={nodeDescription}
                onChange={(e) => setNodeDescription(e.target.value)}
                placeholder="Enter description..."
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setNodeDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddNode}>Add Node</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Work Item Search Dialog */}
      <WorkItemSearchDialog
        open={workItemDialogOpen}
        onOpenChange={setWorkItemDialogOpen}
        workspaceId={workspaceId}
        onWorkItemSelect={handleAddWorkItemReference}
      />
    </div>
  )
}
