import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { MindMap, MindMapNode, MindMapEdge, NodeType } from '@/lib/types/mind-map'

// Types for API responses
interface MindMapListResponse {
  mindMaps: MindMap[]
}

interface MindMapDetailResponse {
  mindMap: MindMap
  nodes: MindMapNode[]
  edges: MindMapEdge[]
}

interface CreateMindMapParams {
  workspace_id: string
  name: string
  description?: string
}

interface UpdateMindMapParams {
  id: string
  name?: string
  description?: string
  canvas_data?: any
}

interface CreateNodeParams {
  mind_map_id: string
  node_type: NodeType
  title: string
  description?: string
  position?: { x: number; y: number }
}

interface UpdateNodeParams {
  mind_map_id: string
  node_id: string
  node_type?: NodeType
  title?: string
  description?: string
  position?: { x: number; y: number }
  data?: Record<string, any>
  style?: Record<string, any>
}

interface CreateEdgeParams {
  mind_map_id: string
  source_node_id: string
  target_node_id: string
  edge_type?: string
  label?: string
  style?: Record<string, any>
}

// Query keys
const mindMapKeys = {
  all: ['mind-maps'] as const,
  lists: () => [...mindMapKeys.all, 'list'] as const,
  list: (workspaceId: string) => [...mindMapKeys.lists(), workspaceId] as const,
  details: () => [...mindMapKeys.all, 'detail'] as const,
  detail: (id: string) => [...mindMapKeys.details(), id] as const,
}

// ============================================================================
// Query Hooks
// ============================================================================

/**
 * Get all mind maps for a workspace
 */
export function useMindMaps(workspaceId: string) {
  return useQuery({
    queryKey: mindMapKeys.list(workspaceId),
    queryFn: async () => {
      const response = await fetch(`/api/mind-maps?workspace_id=${workspaceId}`)
      if (!response.ok) throw new Error('Failed to fetch mind maps')
      const data: MindMapListResponse = await response.json()
      return data.mindMaps
    },
    enabled: !!workspaceId,
  })
}

/**
 * Get single mind map with all nodes and edges
 */
export function useMindMap(id: string) {
  return useQuery({
    queryKey: mindMapKeys.detail(id),
    queryFn: async () => {
      const response = await fetch(`/api/mind-maps/${id}`)
      if (!response.ok) throw new Error('Failed to fetch mind map')
      const data: MindMapDetailResponse = await response.json()
      return data
    },
    enabled: !!id,
  })
}

// ============================================================================
// Mutation Hooks - Mind Maps
// ============================================================================

/**
 * Create new mind map
 */
export function useCreateMindMap() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (params: CreateMindMapParams) => {
      const response = await fetch('/api/mind-maps', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      })
      if (!response.ok) throw new Error('Failed to create mind map')
      return response.json()
    },
    onSuccess: (_, variables) => {
      // Invalidate list for this workspace
      queryClient.invalidateQueries({
        queryKey: mindMapKeys.list(variables.workspace_id),
      })
    },
  })
}

/**
 * Update mind map (name, description, canvas_data)
 */
export function useUpdateMindMap() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, ...updates }: UpdateMindMapParams) => {
      const response = await fetch(`/api/mind-maps/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      })
      if (!response.ok) throw new Error('Failed to update mind map')
      return response.json()
    },
    onSuccess: (_, variables) => {
      // Invalidate detail view
      queryClient.invalidateQueries({
        queryKey: mindMapKeys.detail(variables.id),
      })
    },
  })
}

/**
 * Delete mind map
 */
export function useDeleteMindMap() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/mind-maps/${id}`, {
        method: 'DELETE',
      })
      if (!response.ok) throw new Error('Failed to delete mind map')
      return response.json()
    },
    onSuccess: () => {
      // Invalidate all mind map lists
      queryClient.invalidateQueries({
        queryKey: mindMapKeys.lists(),
      })
    },
  })
}

// ============================================================================
// Mutation Hooks - Nodes
// ============================================================================

/**
 * Create new node
 */
export function useCreateNode() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ mind_map_id, ...nodeData }: CreateNodeParams) => {
      const response = await fetch(`/api/mind-maps/${mind_map_id}/nodes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(nodeData),
      })
      if (!response.ok) throw new Error('Failed to create node')
      return response.json()
    },
    onMutate: async (variables) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({
        queryKey: mindMapKeys.detail(variables.mind_map_id),
      })

      // Snapshot the previous value
      const previousData = queryClient.getQueryData(
        mindMapKeys.detail(variables.mind_map_id)
      )

      return { previousData }
    },
    onError: (err, variables, context) => {
      // If the mutation fails, roll back to previous data
      if (context?.previousData) {
        queryClient.setQueryData(
          mindMapKeys.detail(variables.mind_map_id),
          context.previousData
        )
      }
    },
    onSettled: (_, __, variables) => {
      // Always refetch after error or success to get latest data from server
      queryClient.invalidateQueries({
        queryKey: mindMapKeys.detail(variables.mind_map_id),
      })
    },
  })
}

/**
 * Update node
 */
export function useUpdateNode() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      mind_map_id,
      node_id,
      ...updates
    }: UpdateNodeParams) => {
      const response = await fetch(
        `/api/mind-maps/${mind_map_id}/nodes/${node_id}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updates),
        }
      )
      if (!response.ok) throw new Error('Failed to update node')
      return response.json()
    },
    onSuccess: (_, variables) => {
      // Invalidate mind map detail to refetch nodes
      queryClient.invalidateQueries({
        queryKey: mindMapKeys.detail(variables.mind_map_id),
      })
    },
  })
}

/**
 * Delete node
 */
export function useDeleteNode() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      mind_map_id,
      node_id,
    }: {
      mind_map_id: string
      node_id: string
    }) => {
      const response = await fetch(
        `/api/mind-maps/${mind_map_id}/nodes/${node_id}`,
        {
          method: 'DELETE',
        }
      )
      if (!response.ok) throw new Error('Failed to delete node')
      return response.json()
    },
    onMutate: async (variables) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({
        queryKey: mindMapKeys.detail(variables.mind_map_id),
      })

      // Snapshot the previous value
      const previousData = queryClient.getQueryData(
        mindMapKeys.detail(variables.mind_map_id)
      )

      // Optimistically update to remove the node
      queryClient.setQueryData(
        mindMapKeys.detail(variables.mind_map_id),
        (old: any) => {
          if (!old) return old
          return {
            ...old,
            nodes: old.nodes.filter((node: any) => node.id !== variables.node_id),
            edges: old.edges.filter(
              (edge: any) =>
                edge.source_node_id !== variables.node_id &&
                edge.target_node_id !== variables.node_id
            ),
          }
        }
      )

      return { previousData }
    },
    onError: (err, variables, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousData) {
        queryClient.setQueryData(
          mindMapKeys.detail(variables.mind_map_id),
          context.previousData
        )
      }
    },
    onSettled: (_, __, variables) => {
      // Always refetch after error or success to ensure sync with server
      queryClient.invalidateQueries({
        queryKey: mindMapKeys.detail(variables.mind_map_id),
      })
    },
  })
}

/**
 * Convert node to work item (feature)
 */
export function useConvertNodeToWorkItem() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      mind_map_id,
      node_id,
    }: {
      mind_map_id: string
      node_id: string
    }) => {
      const response = await fetch(
        `/api/mind-maps/${mind_map_id}/nodes/${node_id}/convert`,
        {
          method: 'POST',
        }
      )
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to convert node')
      }
      return response.json()
    },
    onSuccess: (_, variables) => {
      // Invalidate mind map detail to refetch nodes with updated conversion status
      queryClient.invalidateQueries({
        queryKey: mindMapKeys.detail(variables.mind_map_id),
      })
      // Also invalidate work items list for the workspace
      queryClient.invalidateQueries({
        queryKey: ['work-items'],
      })
    },
  })
}

// ============================================================================
// Mutation Hooks - Edges
// ============================================================================

/**
 * Create new edge (connection)
 */
export function useCreateEdge() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ mind_map_id, ...edgeData }: CreateEdgeParams) => {
      const response = await fetch(`/api/mind-maps/${mind_map_id}/edges`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(edgeData),
      })
      if (!response.ok) throw new Error('Failed to create edge')
      return response.json()
    },
    onSuccess: (_, variables) => {
      // Invalidate mind map detail to refetch edges
      queryClient.invalidateQueries({
        queryKey: mindMapKeys.detail(variables.mind_map_id),
      })
    },
  })
}

/**
 * Delete edge
 */
export function useDeleteEdge() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      mind_map_id,
      edge_id,
    }: {
      mind_map_id: string
      edge_id: string
    }) => {
      const response = await fetch(
        `/api/mind-maps/${mind_map_id}/edges/${edge_id}`,
        {
          method: 'DELETE',
        }
      )
      if (!response.ok) throw new Error('Failed to delete edge')
      return response.json()
    },
    onSuccess: (_, variables) => {
      // Invalidate mind map detail to refetch edges
      queryClient.invalidateQueries({
        queryKey: mindMapKeys.detail(variables.mind_map_id),
      })
    },
  })
}

// ============================================================================
// Helper Hooks
// ============================================================================

/**
 * Apply template to mind map
 */
export function useApplyTemplate() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      mind_map_id,
      template_id,
    }: {
      mind_map_id: string
      template_id: string
    }) => {
      const response = await fetch(
        `/api/mind-maps/${mind_map_id}/apply-template`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ template_id }),
        }
      )
      if (!response.ok) throw new Error('Failed to apply template')
      return response.json()
    },
    onSuccess: (_, variables) => {
      // Invalidate mind map detail to refetch nodes and edges
      queryClient.invalidateQueries({
        queryKey: mindMapKeys.detail(variables.mind_map_id),
      })
    },
  })
}

/**
 * Debounced auto-save hook for canvas changes
 */
export function useAutoSaveMindMap(mindMapId: string, delay = 2000) {
  const updateMindMap = useUpdateMindMap()
  let timeoutId: NodeJS.Timeout | null = null

  const debouncedSave = (canvas_data: any) => {
    if (timeoutId) clearTimeout(timeoutId)

    timeoutId = setTimeout(() => {
      updateMindMap.mutate({
        id: mindMapId,
        canvas_data,
      })
    }, delay)
  }

  return {
    save: debouncedSave,
    isSaving: updateMindMap.isPending,
    isError: updateMindMap.isError,
  }
}
