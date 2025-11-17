'use client'

import { useState, useCallback, useMemo } from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
  useMindMap,
  useCreateNode,
  useUpdateNode,
  useDeleteNode,
  useCreateEdge,
  useDeleteEdge,
  useConvertNodeToWorkItem,
  useApplyTemplate,
} from '@/lib/hooks/use-mind-map'
import { MindMapCanvas } from '@/components/mind-map/mind-map-canvas'
import { MindMapToolbar } from '@/components/mind-map/mind-map-toolbar'
import { NodeEditDialog } from '@/components/mind-map/node-edit-dialog'
import { TemplateSelectorDialog } from '@/components/mind-map/template-selector-dialog'
import { Button } from '@/components/ui/button'
import { NodeType, MindMapNode, MindMapReactFlowNode, MindMapReactFlowEdge } from '@/lib/types/mind-map'
import { MindMapTemplate } from '@/lib/templates/mind-map-templates'
import { ArrowLeft, Loader2, Save, Check, Sparkles } from 'lucide-react'
import { toPng } from 'html-to-image'
import { useReactFlow, ReactFlowProvider } from '@xyflow/react'

function MindMapCanvasPageContent() {
  const params = useParams()
  const router = useRouter()
  const workspaceId = params.id as string
  const mindMapId = params.mindMapId as string

  const { data, isLoading, error } = useMindMap(mindMapId)
  const createNode = useCreateNode()
  const updateNode = useUpdateNode()
  const deleteNode = useDeleteNode()
  const createEdge = useCreateEdge()
  const deleteEdge = useDeleteEdge()
  const convertNode = useConvertNodeToWorkItem()
  const applyTemplate = useApplyTemplate()

  const [selectedNode, setSelectedNode] = useState<MindMapNode | null>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isTemplateDialogOpen, setIsTemplateDialogOpen] = useState(false)
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving'>('saved')

  const reactFlowInstance = useReactFlow()

  // Convert database nodes to ReactFlow format
  const reactFlowNodes: MindMapReactFlowNode[] = useMemo(() => {
    if (!data?.nodes) return []
    return data.nodes.map((node) => ({
      id: node.id,
      type: node.node_type,
      position: node.position,
      data: {
        title: node.title,
        description: node.description,
        nodeType: node.node_type,
        convertedToWorkItemId: node.converted_to_work_item_id,
        onEdit: (nodeId: string) => {
          const nodeToEdit = data.nodes.find((n) => n.id === nodeId)
          if (nodeToEdit) {
            setSelectedNode(nodeToEdit)
            setIsEditDialogOpen(true)
          }
        },
        onDelete: (nodeId: string) => handleDeleteNode(nodeId),
        onConvert: (nodeId: string) => handleConvertNode(nodeId),
      },
    }))
  }, [data?.nodes])

  // Convert database edges to ReactFlow format
  const reactFlowEdges: MindMapReactFlowEdge[] = useMemo(() => {
    if (!data?.edges) return []
    return data.edges.map((edge) => ({
      id: edge.id,
      source: edge.source_node_id,
      target: edge.target_node_id,
      type: edge.edge_type || 'smoothstep',
      label: edge.label,
      style: edge.style,
    }))
  }, [data?.edges])

  // Handle adding a new node
  const handleAddNode = useCallback(
    async (nodeType: NodeType) => {
      if (!reactFlowInstance) return

      // Get viewport center
      const { x, y, zoom } = reactFlowInstance.getViewport()
      const centerX = -x / zoom + 250
      const centerY = -y / zoom + 250

      try {
        await createNode.mutateAsync({
          mind_map_id: mindMapId,
          node_type: nodeType,
          title: `New ${nodeType} node`,
          description: '',
          position: { x: centerX, y: centerY },
        })
      } catch (error) {
        console.error('Failed to create node:', error)
        alert('Failed to create node')
      }
    },
    [mindMapId, createNode, reactFlowInstance]
  )

  // Handle node updates (position, data)
  const handleNodesChange = useCallback(
    async (changes: any[]) => {
      for (const change of changes) {
        if (change.type === 'position' && change.position && !change.dragging) {
          setSaveStatus('saving')
          try {
            await updateNode.mutateAsync({
              mind_map_id: mindMapId,
              node_id: change.id,
              position: change.position,
            })
            setTimeout(() => setSaveStatus('saved'), 500)
          } catch (error) {
            console.error('Failed to update node position:', error)
          }
        }
      }
    },
    [mindMapId, updateNode]
  )

  // Handle edge creation
  const handleEdgesChange = useCallback(
    async (connection: any) => {
      if (connection.source && connection.target) {
        try {
          await createEdge.mutateAsync({
            mind_map_id: mindMapId,
            source_node_id: connection.source,
            target_node_id: connection.target,
            edge_type: 'smoothstep',
          })
        } catch (error) {
          console.error('Failed to create edge:', error)
          alert('Failed to create connection')
        }
      }
    },
    [mindMapId, createEdge]
  )

  // Handle node save from edit dialog
  const handleSaveNode = useCallback(
    async (nodeId: string, updates: Partial<MindMapNode>) => {
      try {
        await updateNode.mutateAsync({
          mind_map_id: mindMapId,
          node_id: nodeId,
          ...updates,
        })
      } catch (error) {
        console.error('Failed to update node:', error)
        throw error
      }
    },
    [mindMapId, updateNode]
  )

  // Handle node delete
  const handleDeleteNode = useCallback(
    async (nodeId: string) => {
      if (!confirm('Delete this node?')) return

      try {
        await deleteNode.mutateAsync({
          mind_map_id: mindMapId,
          node_id: nodeId,
        })
      } catch (error) {
        console.error('Failed to delete node:', error)
        alert('Failed to delete node')
      }
    },
    [mindMapId, deleteNode]
  )

  // Handle node conversion to work item
  const handleConvertNode = useCallback(
    async (nodeId: string) => {
      if (!confirm('Convert this node to a feature?')) return

      try {
        await convertNode.mutateAsync({
          mind_map_id: mindMapId,
          node_id: nodeId,
        })
        alert('Node converted to feature successfully!')
      } catch (error: any) {
        console.error('Failed to convert node:', error)
        alert(error.message || 'Failed to convert node')
      }
    },
    [mindMapId, convertNode]
  )

  // Handle template application
  const handleSelectTemplate = useCallback(
    async (template: MindMapTemplate) => {
      try {
        await applyTemplate.mutateAsync({
          mind_map_id: mindMapId,
          template_id: template.id,
        })
        alert(`Template "${template.name}" applied successfully!`)
      } catch (error) {
        console.error('Failed to apply template:', error)
        alert('Failed to apply template')
      }
    },
    [mindMapId, applyTemplate]
  )

  // Export as PNG
  const handleExportPNG = useCallback(async () => {
    const element = document.querySelector('.react-flow') as HTMLElement
    if (!element) return

    try {
      const dataUrl = await toPng(element, {
        backgroundColor: '#ffffff',
        width: element.offsetWidth,
        height: element.offsetHeight,
      })

      const link = document.createElement('a')
      link.download = `${data?.mindMap.name || 'mind-map'}.png`
      link.href = dataUrl
      link.click()
    } catch (error) {
      console.error('Failed to export PNG:', error)
      alert('Failed to export PNG')
    }
  }, [data?.mindMap.name])

  // Export as JSON
  const handleExportJSON = useCallback(() => {
    if (!data) return

    const exportData = {
      mindMap: data.mindMap,
      nodes: data.nodes,
      edges: data.edges,
    }

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json',
    })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.download = `${data.mindMap.name || 'mind-map'}.json`
    link.href = url
    link.click()
    URL.revokeObjectURL(url)
  }, [data])

  // Zoom controls
  const handleZoomIn = useCallback(() => {
    reactFlowInstance?.zoomIn()
  }, [reactFlowInstance])

  const handleZoomOut = useCallback(() => {
    reactFlowInstance?.zoomOut()
  }, [reactFlowInstance])

  const handleFitView = useCallback(() => {
    reactFlowInstance?.fitView({ padding: 0.2 })
  }, [reactFlowInstance])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-12 w-12 animate-spin text-slate-400" />
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="flex flex-col items-center justify-center h-screen gap-4">
        <p className="text-red-600">Failed to load mind map</p>
        <Button onClick={() => router.push(`/workspaces/${workspaceId}/mind-map`)}>
          Go Back
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-white border-b border-slate-200">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push(`/workspaces/${workspaceId}/mind-map`)}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push(`/workspaces/${workspaceId}/features`)}
            >
              <Sparkles className="mr-2 h-4 w-4" />
              Features
            </Button>
          </div>
          <div>
            <h1 className="text-xl font-bold">{data.mindMap.name}</h1>
            {data.mindMap.description && (
              <p className="text-sm text-slate-600">{data.mindMap.description}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {saveStatus === 'saving' ? (
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <Loader2 className="h-4 w-4 animate-spin" />
              Saving...
            </div>
          ) : (
            <div className="flex items-center gap-2 text-sm text-green-600">
              <Check className="h-4 w-4" />
              Saved
            </div>
          )}
        </div>
      </div>

      {/* Toolbar */}
      <MindMapToolbar
        onAddNode={handleAddNode}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onFitView={handleFitView}
        onExportPNG={handleExportPNG}
        onExportJSON={handleExportJSON}
        onOpenTemplates={() => setIsTemplateDialogOpen(true)}
      />

      {/* Canvas */}
      <div className="flex-1 bg-slate-50">
        <MindMapCanvas
          mindMapId={mindMapId}
          initialNodes={reactFlowNodes}
          initialEdges={reactFlowEdges}
          onNodesChange={handleNodesChange}
          onEdgesChange={handleEdgesChange}
        />
      </div>

      {/* Edit Dialog */}
      <NodeEditDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        node={selectedNode}
        onSave={handleSaveNode}
        onDelete={handleDeleteNode}
        onConvert={handleConvertNode}
      />

      {/* Template Dialog */}
      <TemplateSelectorDialog
        open={isTemplateDialogOpen}
        onOpenChange={setIsTemplateDialogOpen}
        onSelectTemplate={handleSelectTemplate}
      />
    </div>
  )
}

export default function MindMapCanvasPage() {
  return (
    <ReactFlowProvider>
      <MindMapCanvasPageContent />
    </ReactFlowProvider>
  )
}
