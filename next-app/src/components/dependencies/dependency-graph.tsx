'use client'

import { useCallback, useState, useMemo, useEffect } from 'react'
import {
  ReactFlow,
  Node,
  Edge,
  Controls,
  MiniMap,
  Background,
  BackgroundVariant,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  ReactFlowProvider,
  useReactFlow,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import dagre from 'dagre'
import { toPng } from 'html-to-image'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import {
  LayoutGrid,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Plus,
  Filter,
  Download,
  AlertCircle,
  Activity,
  Loader2,
  Sparkles,
  X,
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import type { WorkItem } from '@/lib/types/work-items'
import type {
  WorkItemConnection,
  DependencyGraphNode,
  DependencyGraphEdge,
} from '@/lib/types/dependencies'
import type { CriticalPathNode } from '@/lib/algorithms/critical-path'
import type { Cycle } from '@/lib/algorithms/cycle-detection'
import { WorkItemNode } from './work-item-node'
import { DependencyEdge } from './dependency-edge'
import { CreateDependencyDialog } from './create-dependency-dialog'
import { CriticalPathPanel } from './critical-path-panel'
import { AISuggestionsPanel } from './ai-suggestions-panel'
import { useDependencies, useDeleteDependency, useCreateDependency } from '@/lib/hooks/use-dependencies'

interface DependencyGraphProps {
  workspaceId: string
  teamId: string
  initialWorkItems: WorkItem[]
  initialConnections: WorkItemConnection[]
}

// Define custom node types
const nodeTypes: any = {
  workItem: WorkItemNode,
}

// Define custom edge types
const edgeTypes: any = {
  dependency: DependencyEdge,
}

interface AnalysisResult {
  hasCycles: boolean
  cycles: Cycle[]
  totalCycles: number
  affectedWorkItems: string[]
  criticalPath: string[]
  projectDuration: number
  nodes: CriticalPathNode[]
  bottlenecks: string[]
  healthScore: number
  warnings: string[]
}

function DependencyGraphInner({
  workspaceId,
  teamId,
  initialWorkItems,
  initialConnections,
}: DependencyGraphProps) {
  const [showMinimap, setShowMinimap] = useState(true)
  const [showGrid, setShowGrid] = useState(true)
  const [showAnalysisPanel, setShowAnalysisPanel] = useState(false)
  const [showAIPanel, setShowAIPanel] = useState(false)
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)

  // Filter state
  const [connectionTypeFilters, setConnectionTypeFilters] = useState<Set<string>>(
    new Set(['dependency', 'blocks', 'complements', 'relates_to', 'enables', 'conflicts', 'duplicates', 'supersedes'])
  )
  const [statusFilters, setStatusFilters] = useState<Set<string>>(
    new Set(['planned', 'in_progress', 'completed', 'blocked', 'on_hold'])
  )
  const [priorityFilters, setPriorityFilters] = useState<Set<string>>(
    new Set(['low', 'medium', 'high', 'critical'])
  )

  const { toast } = useToast()
  const reactFlowInstance = useReactFlow()
  const deleteDependency = useDeleteDependency()
  const createDependency = useCreateDependency()

  // Fetch dependencies with React Query (will auto-refresh on mutations)
  const { data: connections = initialConnections } = useDependencies(workspaceId)

  // Convert work items to ReactFlow nodes
  const initialNodes: DependencyGraphNode[] = useMemo(() => {
    return initialWorkItems.map((workItem, index) => ({
      id: workItem.id,
      type: 'workItem',
      position: {
        x: (index % 5) * 300,
        y: Math.floor(index / 5) * 150,
      },
      data: {
        workItem,
        isOnCriticalPath: false,
        dependencyCount: 0,
        dependentCount: 0,
        riskScore: 0,
      },
    }))
  }, [initialWorkItems])

  // Convert feature connections to ReactFlow edges
  const initialEdges: DependencyGraphEdge[] = useMemo(() => {
    return connections.map((connection) => ({
      id: connection.id,
      source: connection.source_work_item_id,
      target: connection.target_work_item_id,
      type: 'dependency',
      animated: false,
      data: {
        connection,
        isOnCriticalPath: false,
      },
    }))
  }, [connections])

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges)

  // Apply filters to nodes and edges
  useEffect(() => {
    // First update nodes with filter status
    let updatedNodes: typeof nodes = []
    setNodes((nds) => {
      updatedNodes = nds.map((node) => {
        const workItem = node.data.workItem
        const statusMatch = statusFilters.has(workItem.phase || 'design')
        const priorityMatch = priorityFilters.has(workItem.priority || 'medium')
        return {
          ...node,
          hidden: !statusMatch || !priorityMatch,
        }
      })
      return updatedNodes
    })

    // Then update edges based on connection type and node visibility
    setEdges((eds) =>
      eds.map((edge) => {
        const connection = edge.data?.connection
        const typeMatch = connection ? connectionTypeFilters.has(connection.connection_type) : true

        // Check if source or target nodes are hidden
        const sourceNode = updatedNodes.find((n) => n.id === edge.source)
        const targetNode = updatedNodes.find((n) => n.id === edge.target)
        const nodesVisible = !sourceNode?.hidden && !targetNode?.hidden

        return {
          ...edge,
          hidden: !typeMatch || !nodesVisible,
        }
      })
    )
  }, [connectionTypeFilters, statusFilters, priorityFilters, setNodes, setEdges])

  // Update nodes and edges when analysis changes
  useEffect(() => {
    if (analysisResult && !analysisResult.hasCycles) {
      // Update nodes with critical path data
      setNodes((nds) =>
        nds.map((node) => {
          const analysisNode = analysisResult.nodes.find((n) => n.workItemId === node.id)
          if (analysisNode) {
            return {
              ...node,
              data: {
                ...node.data,
                isOnCriticalPath: analysisNode.isOnCriticalPath,
                dependencyCount: analysisNode.dependencyCount,
                dependentCount: analysisNode.dependentCount,
                riskScore: analysisNode.riskScore,
              },
            }
          }
          return node
        })
      )

      // Update edges with critical path data
      setEdges((eds) =>
        eds.map((edge) => {
          const isOnCriticalPath =
            analysisResult.criticalPath.includes(edge.source) &&
            analysisResult.criticalPath.includes(edge.target)
          return {
            ...edge,
            data: {
              ...(edge.data || {}),
              isOnCriticalPath,
            },
            animated: isOnCriticalPath,
          }
        })
      )
    }
  }, [analysisResult, setNodes, setEdges])

  // Handle connection creation (drag from node to node)
  const onConnect = useCallback(
    (params: Connection) => {
      // TODO: Call API to create connection
      setEdges((eds) => addEdge(params, eds))
    },
    [setEdges]
  )

  // Handle AI suggestion approval
  const handleApproveAISuggestions = async (suggestions: any[]) => {
    try {
      // Create connections for all approved suggestions
      await Promise.all(
        suggestions.map((suggestion) =>
          createDependency.mutateAsync({
            workspace_id: workspaceId,
            source_work_item_id: suggestion.sourceId,
            target_work_item_id: suggestion.targetId,
            connection_type: suggestion.connectionType,
            strength: suggestion.strength,
            reason: suggestion.reason,
          })
        )
      )

      toast({
        title: 'Dependencies Created',
        description: `Successfully added ${suggestions.length} dependency connection${suggestions.length > 1 ? 's' : ''}`,
      })
    } catch (error: any) {
      console.error('Error creating dependencies:', error)
      throw error
    }
  }

  // Run critical path analysis
  const handleAnalyze = async () => {
    try {
      setIsAnalyzing(true)
      const response = await fetch('/api/dependencies/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workspace_id: workspaceId }),
      })

      if (!response.ok) {
        throw new Error('Failed to analyze dependencies')
      }

      const data: AnalysisResult = await response.json()
      setAnalysisResult(data)
      setShowAnalysisPanel(true)

      if (data.hasCycles) {
        toast({
          title: 'Circular Dependencies Detected',
          description: `Found ${data.totalCycles} circular ${
            data.totalCycles === 1 ? 'dependency' : 'dependencies'
          }. Please resolve these first.`,
          variant: 'destructive',
        })
      } else {
        toast({
          title: 'Analysis Complete',
          description: `Health Score: ${data.healthScore}/100`,
        })
      }
    } catch (error: any) {
      console.error('Analysis error:', error)
      toast({
        title: 'Analysis Failed',
        description: error.message || 'Failed to analyze dependencies',
        variant: 'destructive',
      })
    } finally {
      setIsAnalyzing(false)
    }
  }

  // Handle cycle fix application
  const handleApplyFix = async (fix: any) => {
    try {
      if (fix.action === 'remove_connection') {
        await deleteDependency.mutateAsync({
          id: fix.connectionId,
          workspace_id: workspaceId,
        })
        toast({
          title: 'Fix Applied',
          description: 'Dependency removed successfully',
        })
        // Re-run analysis
        setTimeout(() => handleAnalyze(), 500)
      }
      // TODO: Handle other fix types (reverse, change type)
    } catch (error: any) {
      toast({
        title: 'Fix Failed',
        description: error.message || 'Failed to apply fix',
        variant: 'destructive',
      })
    }
  }

  // Handle work item click from panel
  const handleWorkItemClick = (workItemId: string) => {
    const node = nodes.find((n) => n.id === workItemId)
    if (node && reactFlowInstance) {
      reactFlowInstance.setCenter(node.position.x + 150, node.position.y + 75, {
        zoom: 1.5,
        duration: 800,
      })
    }
  }

  // Zoom controls
  const handleZoomIn = useCallback(() => {
    reactFlowInstance.zoomIn({ duration: 300 })
  }, [reactFlowInstance])

  const handleZoomOut = useCallback(() => {
    reactFlowInstance.zoomOut({ duration: 300 })
  }, [reactFlowInstance])

  const handleFitView = useCallback(() => {
    reactFlowInstance.fitView({ padding: 0.2, duration: 800 })
  }, [reactFlowInstance])

  // Auto-layout using dagre
  const handleAutoLayout = useCallback(() => {
    const dagreGraph = new dagre.graphlib.Graph()
    dagreGraph.setDefaultEdgeLabel(() => ({}))

    // Configure graph layout
    dagreGraph.setGraph({
      rankdir: 'TB', // Top to Bottom
      align: 'UL', // Align nodes to upper left
      nodesep: 100, // Horizontal spacing between nodes
      ranksep: 150, // Vertical spacing between ranks
      marginx: 50,
      marginy: 50,
    })

    // Add nodes to dagre graph with dimensions
    const nodeWidth = 280
    const nodeHeight = 120

    nodes.forEach((node) => {
      dagreGraph.setNode(node.id, { width: nodeWidth, height: nodeHeight })
    })

    // Add edges to dagre graph
    edges.forEach((edge) => {
      dagreGraph.setEdge(edge.source, edge.target)
    })

    // Calculate layout
    dagre.layout(dagreGraph)

    // Update node positions based on dagre layout
    const layoutedNodes = nodes.map((node) => {
      const nodeWithPosition = dagreGraph.node(node.id)
      return {
        ...node,
        position: {
          x: nodeWithPosition.x - nodeWidth / 2,
          y: nodeWithPosition.y - nodeHeight / 2,
        },
      }
    })

    setNodes(layoutedNodes)

    // Fit view after layout with animation
    setTimeout(() => {
      reactFlowInstance.fitView({
        padding: 0.2,
        duration: 800,
      })
    }, 10)

    toast({
      title: 'Layout Applied',
      description: 'Dependency graph has been organized automatically',
    })
  }, [nodes, edges, setNodes, reactFlowInstance, toast])

  // Export graph as PNG
  const exportAsPNG = useCallback(async () => {
    const reactFlowElement = document.querySelector('.react-flow') as HTMLElement
    if (!reactFlowElement) {
      toast({
        title: 'Export Failed',
        description: 'Could not find the graph element',
        variant: 'destructive',
      })
      return
    }

    try {
      const dataUrl = await toPng(reactFlowElement, {
        backgroundColor: '#ffffff',
        width: reactFlowElement.offsetWidth,
        height: reactFlowElement.offsetHeight,
        pixelRatio: 2, // Higher quality
      })

      // Download the image
      const link = document.createElement('a')
      link.download = `dependency-graph-${Date.now()}.png`
      link.href = dataUrl
      link.click()

      toast({
        title: 'Export Successful',
        description: 'Dependency graph exported as PNG',
      })
    } catch (error) {
      console.error('PNG export error:', error)
      toast({
        title: 'Export Failed',
        description: 'Failed to export as PNG',
        variant: 'destructive',
      })
    }
  }, [toast])

  // Export graph as SVG
  const exportAsSVG = useCallback(() => {
    try {
      // Get the current viewport
      const viewport = reactFlowInstance.getViewport()
      const bounds = {
        x: Infinity,
        y: Infinity,
        x2: -Infinity,
        y2: -Infinity,
      }

      // Calculate bounds of all nodes
      nodes.forEach((node) => {
        bounds.x = Math.min(bounds.x, node.position.x)
        bounds.y = Math.min(bounds.y, node.position.y)
        bounds.x2 = Math.max(bounds.x2, node.position.x + 280)
        bounds.y2 = Math.max(bounds.y2, node.position.y + 120)
      })

      const width = bounds.x2 - bounds.x + 100
      const height = bounds.y2 - bounds.y + 100

      // Create SVG content
      let svgContent = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="${bounds.x - 50} ${bounds.y - 50} ${width} ${height}">
  <rect width="100%" height="100%" fill="white"/>
  <g id="edges">`

      // Add edges
      edges.forEach((edge) => {
        const sourceNode = nodes.find((n) => n.id === edge.source)
        const targetNode = nodes.find((n) => n.id === edge.target)
        if (sourceNode && targetNode) {
          const x1 = sourceNode.position.x + 140
          const y1 = sourceNode.position.y + 120
          const x2 = targetNode.position.x + 140
          const y2 = targetNode.position.y

          svgContent += `
    <line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"
          stroke="#94a3b8" stroke-width="2"
          marker-end="url(#arrowhead)" />`
        }
      })

      svgContent += `
  </g>
  <g id="nodes">`

      // Add nodes
      nodes.forEach((node) => {
        const workItem = node.data.workItem
        svgContent += `
    <g transform="translate(${node.position.x}, ${node.position.y})">
      <rect width="280" height="120" rx="8" fill="white" stroke="#e2e8f0" stroke-width="2"/>
      <text x="140" y="30" text-anchor="middle" font-size="14" font-weight="600">${workItem.name}</text>
      <text x="140" y="60" text-anchor="middle" font-size="12" fill="#64748b">${workItem.type || 'Feature'}</text>
      <text x="140" y="90" text-anchor="middle" font-size="12" fill="#64748b">${workItem.phase || 'design'}</text>
    </g>`
      })

      svgContent += `
  </g>
  <defs>
    <marker id="arrowhead" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
      <polygon points="0 0, 10 3, 0 6" fill="#94a3b8" />
    </marker>
  </defs>
</svg>`

      // Download SVG
      const blob = new Blob([svgContent], { type: 'image/svg+xml' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.download = `dependency-graph-${Date.now()}.svg`
      link.href = url
      link.click()
      URL.revokeObjectURL(url)

      toast({
        title: 'Export Successful',
        description: 'Dependency graph exported as SVG',
      })
    } catch (error) {
      console.error('SVG export error:', error)
      toast({
        title: 'Export Failed',
        description: 'Failed to export as SVG',
        variant: 'destructive',
      })
    }
  }, [reactFlowInstance, nodes, edges, toast])

  // Filter toggle functions
  const toggleConnectionType = useCallback((type: string) => {
    setConnectionTypeFilters((prev) => {
      const next = new Set(prev)
      if (next.has(type)) {
        next.delete(type)
      } else {
        next.add(type)
      }
      return next
    })
  }, [])

  const toggleStatus = useCallback((status: string) => {
    setStatusFilters((prev) => {
      const next = new Set(prev)
      if (next.has(status)) {
        next.delete(status)
      } else {
        next.add(status)
      }
      return next
    })
  }, [])

  const togglePriority = useCallback((priority: string) => {
    setPriorityFilters((prev) => {
      const next = new Set(prev)
      if (next.has(priority)) {
        next.delete(priority)
      } else {
        next.add(priority)
      }
      return next
    })
  }, [])

  const resetFilters = useCallback(() => {
    setConnectionTypeFilters(
      new Set(['dependency', 'blocks', 'complements', 'relates_to', 'enables', 'conflicts', 'duplicates', 'supersedes'])
    )
    setStatusFilters(new Set(['planned', 'in_progress', 'completed', 'blocked', 'on_hold']))
    setPriorityFilters(new Set(['low', 'medium', 'high', 'critical']))
    toast({
      title: 'Filters Reset',
      description: 'All filters have been cleared',
    })
  }, [toast])

  // Stats
  const stats = useMemo(() => {
    return {
      totalWorkItems: nodes.length,
      totalConnections: edges.length,
      orphans: nodes.filter(
        (node) =>
          !edges.some(
            (edge) => edge.source === node.id || edge.target === node.id
          )
      ).length,
    }
  }, [nodes, edges])

  return (
    <Card className="h-full overflow-hidden relative">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-10 bg-white border-b p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h2 className="text-lg font-semibold">Dependency Graph</h2>
            <div className="flex items-center gap-2">
              <Badge variant="secondary">
                {stats.totalWorkItems} work items
              </Badge>
              <Badge variant="secondary">
                {stats.totalConnections} connections
              </Badge>
              {stats.orphans > 0 && (
                <Badge variant="outline" className="text-orange-600">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  {stats.orphans} orphans
                </Badge>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant={showAIPanel ? 'default' : 'outline'}
              size="sm"
              onClick={() => setShowAIPanel(!showAIPanel)}
            >
              <Sparkles className="h-4 w-4 mr-2" />
              AI Suggestions
            </Button>
            <Button
              variant={analysisResult ? 'default' : 'outline'}
              size="sm"
              onClick={handleAnalyze}
              disabled={isAnalyzing}
            >
              {isAnalyzing ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Activity className="h-4 w-4 mr-2" />
              )}
              {isAnalyzing ? 'Analyzing...' : 'Analyze'}
            </Button>
            <Button variant="outline" size="sm" onClick={handleAutoLayout}>
              <LayoutGrid className="h-4 w-4 mr-2" />
              Auto Layout
            </Button>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm">
                  <Filter className="h-4 w-4 mr-2" />
                  Filter
                  {(connectionTypeFilters.size < 8 || statusFilters.size < 5 || priorityFilters.size < 4) && (
                    <Badge variant="secondary" className="ml-2 h-5 px-1">
                      Active
                    </Badge>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80" align="end">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold text-sm">Filters</h4>
                    <Button variant="ghost" size="sm" onClick={resetFilters}>
                      Reset All
                    </Button>
                  </div>

                  {/* Connection Type Filters */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Connection Type</Label>
                    <div className="grid grid-cols-2 gap-2">
                      {['dependency', 'blocks', 'complements', 'relates_to', 'enables', 'conflicts', 'duplicates', 'supersedes'].map((type) => (
                        <div key={type} className="flex items-center space-x-2">
                          <Checkbox
                            id={`type-${type}`}
                            checked={connectionTypeFilters.has(type)}
                            onCheckedChange={() => toggleConnectionType(type)}
                          />
                          <label
                            htmlFor={`type-${type}`}
                            className="text-sm font-normal leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 capitalize"
                          >
                            {type.replace(/_/g, ' ')}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Status Filters */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Status</Label>
                    <div className="grid grid-cols-2 gap-2">
                      {['planned', 'in_progress', 'completed', 'blocked', 'on_hold'].map((status) => (
                        <div key={status} className="flex items-center space-x-2">
                          <Checkbox
                            id={`status-${status}`}
                            checked={statusFilters.has(status)}
                            onCheckedChange={() => toggleStatus(status)}
                          />
                          <label
                            htmlFor={`status-${status}`}
                            className="text-sm font-normal leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 capitalize"
                          >
                            {status.replace(/_/g, ' ')}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Priority Filters */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Priority</Label>
                    <div className="grid grid-cols-2 gap-2">
                      {['low', 'medium', 'high', 'critical'].map((priority) => (
                        <div key={priority} className="flex items-center space-x-2">
                          <Checkbox
                            id={`priority-${priority}`}
                            checked={priorityFilters.has(priority)}
                            onCheckedChange={() => togglePriority(priority)}
                          />
                          <label
                            htmlFor={`priority-${priority}`}
                            className="text-sm font-normal leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 capitalize"
                          >
                            {priority}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Filter Summary */}
                  <div className="pt-2 border-t">
                    <p className="text-xs text-muted-foreground">
                      Showing {nodes.filter(n => !n.hidden).length} of {nodes.length} work items,{' '}
                      {edges.filter(e => !e.hidden).length} of {edges.length} connections
                    </p>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
            <CreateDependencyDialog
              workspaceId={workspaceId}
              workItems={initialWorkItems}
              trigger={
                <Button variant="outline" size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Connection
                </Button>
              }
            />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={exportAsPNG}>
                  Export as PNG
                </DropdownMenuItem>
                <DropdownMenuItem onClick={exportAsSVG}>
                  Export as SVG
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* ReactFlow Canvas */}
      <div className="h-full pt-20">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          fitView
          attributionPosition="bottom-left"
        >
          <Controls
            showZoom={true}
            showFitView={true}
            showInteractive={false}
          />
          {showMinimap && (
            <MiniMap
              nodeStrokeWidth={3}
              zoomable
              pannable
              position="bottom-right"
            />
          )}
          {showGrid && (
            <Background variant={BackgroundVariant.Dots} gap={20} size={1} />
          )}
        </ReactFlow>
      </div>

      {/* Controls */}
      <div className="absolute bottom-4 left-4 z-10 flex flex-col gap-2">
        <Button
          variant="outline"
          size="icon"
          className="bg-white"
          onClick={handleZoomIn}
        >
          <ZoomIn className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          className="bg-white"
          onClick={handleZoomOut}
        >
          <ZoomOut className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          className="bg-white"
          onClick={handleFitView}
        >
          <Maximize2 className="h-4 w-4" />
        </Button>
        <Button
          variant={showMinimap ? 'default' : 'outline'}
          size="icon"
          className="bg-white"
          onClick={() => setShowMinimap(!showMinimap)}
          title="Toggle Minimap"
        >
          M
        </Button>
        <Button
          variant={showGrid ? 'default' : 'outline'}
          size="icon"
          className="bg-white"
          onClick={() => setShowGrid(!showGrid)}
          title="Toggle Grid"
        >
          G
        </Button>
      </div>

      {/* Empty State */}
      {nodes.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/80 z-20">
          <div className="text-center">
            <h3 className="text-lg font-semibold mb-2">No Work Items Yet</h3>
            <p className="text-muted-foreground mb-4">
              Create work items in the Features module to see them here
            </p>
            <Button>Go to Features</Button>
          </div>
        </div>
      )}

      {/* Critical Path Analysis Panel */}
      <CriticalPathPanel
        isOpen={showAnalysisPanel}
        onClose={() => setShowAnalysisPanel(false)}
        analysis={analysisResult}
        isLoading={isAnalyzing}
        onWorkItemClick={handleWorkItemClick}
        onApplyFix={handleApplyFix}
      />

      {/* AI Suggestions Panel */}
      {showAIPanel && (
        <div className="absolute top-20 right-4 bottom-4 z-20 w-[500px] bg-white border rounded-lg shadow-lg overflow-hidden flex flex-col">
          <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-purple-50 to-blue-50">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-purple-600" />
              <h3 className="font-semibold text-lg">AI Suggestions</h3>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowAIPanel(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex-1 overflow-y-auto p-4">
            <AISuggestionsPanel
              workspaceId={workspaceId}
              onApprove={handleApproveAISuggestions}
              disabled={false}
            />
          </div>
        </div>
      )}
    </Card>
  )
}

export function DependencyGraph(props: DependencyGraphProps) {
  return (
    <ReactFlowProvider>
      <DependencyGraphInner {...props} />
    </ReactFlowProvider>
  )
}
