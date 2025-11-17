import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type {
  FeatureConnection,
  CreateConnectionRequest,
  UpdateConnectionRequest,
  ListConnectionsResponse,
} from '@/lib/types/dependencies'

// Query keys
const dependencyKeys = {
  all: ['dependencies'] as const,
  lists: () => [...dependencyKeys.all, 'list'] as const,
  list: (workspaceId: string) => [...dependencyKeys.lists(), workspaceId] as const,
  details: () => [...dependencyKeys.all, 'detail'] as const,
  detail: (id: string) => [...dependencyKeys.details(), id] as const,
}

// ============================================================================
// Query Hooks
// ============================================================================

/**
 * Get all dependencies for a workspace
 */
export function useDependencies(workspaceId: string) {
  return useQuery({
    queryKey: dependencyKeys.list(workspaceId),
    queryFn: async () => {
      const response = await fetch(`/api/dependencies?workspace_id=${workspaceId}`)
      if (!response.ok) throw new Error('Failed to fetch dependencies')
      const data: ListConnectionsResponse = await response.json()
      return data.connections
    },
    enabled: !!workspaceId,
  })
}

/**
 * Get single dependency by ID
 */
export function useDependency(id: string) {
  return useQuery({
    queryKey: dependencyKeys.detail(id),
    queryFn: async () => {
      const response = await fetch(`/api/dependencies/${id}`)
      if (!response.ok) throw new Error('Failed to fetch dependency')
      const data: { connection: FeatureConnection } = await response.json()
      return data.connection
    },
    enabled: !!id,
  })
}

// ============================================================================
// Mutation Hooks
// ============================================================================

/**
 * Create new dependency
 */
export function useCreateDependency() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (params: CreateConnectionRequest & { workspace_id: string }) => {
      const response = await fetch('/api/dependencies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create dependency')
      }
      return response.json()
    },
    onSuccess: (_, variables) => {
      // Invalidate list for this workspace
      queryClient.invalidateQueries({
        queryKey: dependencyKeys.list(variables.workspace_id),
      })
    },
  })
}

/**
 * Update dependency
 */
export function useUpdateDependency() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      id,
      workspace_id,
      ...updates
    }: UpdateConnectionRequest & { id: string; workspace_id: string }) => {
      const response = await fetch(`/api/dependencies/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update dependency')
      }
      return response.json()
    },
    onSuccess: (_, variables) => {
      // Invalidate detail view
      queryClient.invalidateQueries({
        queryKey: dependencyKeys.detail(variables.id),
      })
      // Invalidate list
      queryClient.invalidateQueries({
        queryKey: dependencyKeys.list(variables.workspace_id),
      })
    },
  })
}

/**
 * Delete dependency
 */
export function useDeleteDependency() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id }: { id: string; workspace_id: string }) => {
      const response = await fetch(`/api/dependencies/${id}`, {
        method: 'DELETE',
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to delete dependency')
      }
      return response.json()
    },
    onMutate: async (variables) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({
        queryKey: dependencyKeys.list(variables.workspace_id),
      })

      // Snapshot the previous value
      const previousData = queryClient.getQueryData(
        dependencyKeys.list(variables.workspace_id)
      )

      // Optimistically update to remove the dependency
      queryClient.setQueryData(
        dependencyKeys.list(variables.workspace_id),
        (old: FeatureConnection[] | undefined) => {
          if (!old) return old
          return old.filter((conn) => conn.id !== variables.id)
        }
      )

      return { previousData, workspace_id: variables.workspace_id }
    },
    onError: (err, variables, context) => {
      // If the mutation fails, roll back to previous data
      if (context?.previousData) {
        queryClient.setQueryData(
          dependencyKeys.list(context.workspace_id),
          context.previousData
        )
      }
    },
    onSettled: (_, __, variables) => {
      // Always refetch after error or success to ensure sync with server
      queryClient.invalidateQueries({
        queryKey: dependencyKeys.list(variables.workspace_id),
      })
    },
  })
}

/**
 * Batch delete dependencies
 */
export function useBatchDeleteDependencies() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ ids, workspace_id }: { ids: string[]; workspace_id: string }) => {
      const results = await Promise.allSettled(
        ids.map((id) =>
          fetch(`/api/dependencies/${id}`, {
            method: 'DELETE',
          })
        )
      )

      const failed = results.filter((r) => r.status === 'rejected')
      if (failed.length > 0) {
        throw new Error(`Failed to delete ${failed.length} dependencies`)
      }

      return { deleted: ids.length }
    },
    onSuccess: (_, variables) => {
      // Invalidate list
      queryClient.invalidateQueries({
        queryKey: dependencyKeys.list(variables.workspace_id),
      })
    },
  })
}
