'use client'

/**
 * Mind Maps List Component
 *
 * Displays a grid of mind map cards with:
 * - Canvas type (Work Items Visualization or Freeform)
 * - Last updated timestamp
 * - Actions: View, Edit, Duplicate, Delete
 */

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Badge } from '@/components/ui/badge'
import { MoreHorizontal, Eye, Edit, Copy, Trash2, Loader2 } from 'lucide-react'
import { MindMap, CANVAS_TYPE_CONFIGS } from '@/lib/types/mind-map'
import { formatDistanceToNow } from 'date-fns'

export interface MindMapsListProps {
  mindMaps: MindMap[]
  workspaceId: string
  teamId: string
}

export function MindMapsList({ mindMaps, workspaceId, teamId }: MindMapsListProps) {
  const router = useRouter()
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [duplicatingId, setDuplicatingId] = useState<string | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedMindMap, setSelectedMindMap] = useState<MindMap | null>(null)

  const handleDelete = async (mindMapId: string) => {
    setDeletingId(mindMapId)
    try {
      const response = await fetch(`/api/mind-maps/${mindMapId}`, {
        method: 'DELETE',
      })

      if (!response.ok) throw new Error('Failed to delete mind map')

      router.refresh()
    } catch (error) {
      console.error('Error deleting mind map:', error)
    } finally {
      setDeletingId(null)
      setDeleteDialogOpen(false)
      setSelectedMindMap(null)
    }
  }

  const handleDuplicate = async (mindMap: MindMap) => {
    setDuplicatingId(mindMap.id)
    try {
      const response = await fetch(`/api/mind-maps`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workspace_id: workspaceId,
          name: `${mindMap.name} (Copy)`,
          description: mindMap.description,
          canvas_type: mindMap.canvas_type,
        }),
      })

      if (!response.ok) throw new Error('Failed to duplicate mind map')

      const newMindMap = await response.json()

      // Copy nodes and edges (in a real implementation, you'd do this on the backend)
      // For now, just redirect to the new mind map
      router.push(`/workspaces/${workspaceId}/mind-maps/${newMindMap.id}`)
    } catch (error) {
      console.error('Error duplicating mind map:', error)
    } finally {
      setDuplicatingId(null)
    }
  }

  const openDeleteDialog = (mindMap: MindMap) => {
    setSelectedMindMap(mindMap)
    setDeleteDialogOpen(true)
  }

  if (mindMaps.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
          <span className="text-3xl">🗺️</span>
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">No mind maps yet</h3>
        <p className="text-sm text-muted-foreground mb-4 max-w-md">
          Create your first mind map to visualize work items or brainstorm ideas
        </p>
        <Link href={`/workspaces/${workspaceId}/mind-maps/new`}>
          <Button>Create Mind Map</Button>
        </Link>
      </div>
    )
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {mindMaps.map((mindMap) => {
          const config = CANVAS_TYPE_CONFIGS[mindMap.canvas_type]
          const isDeleting = deletingId === mindMap.id
          const isDuplicating = duplicatingId === mindMap.id

          return (
            <Card key={mindMap.id} className="group hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xl">{config.icon}</span>
                      <Badge variant="secondary" className="text-xs">
                        {config.label}
                      </Badge>
                    </div>
                    <CardTitle className="text-base line-clamp-1">
                      {mindMap.name}
                    </CardTitle>
                  </div>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                        <Link
                          href={`/workspaces/${workspaceId}/mind-maps/${mindMap.id}`}
                          className="flex items-center gap-2"
                        >
                          <Eye className="h-4 w-4" />
                          View
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link
                          href={`/workspaces/${workspaceId}/mind-maps/${mindMap.id}/edit`}
                          className="flex items-center gap-2"
                        >
                          <Edit className="h-4 w-4" />
                          Edit
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleDuplicate(mindMap)}
                        disabled={isDuplicating}
                        className="flex items-center gap-2"
                      >
                        {isDuplicating ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                        Duplicate
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => openDeleteDialog(mindMap)}
                        disabled={isDeleting}
                        className="flex items-center gap-2 text-red-600 focus:text-red-600"
                      >
                        {isDeleting ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                {mindMap.description && (
                  <CardDescription className="line-clamp-2">
                    {mindMap.description}
                  </CardDescription>
                )}
              </CardHeader>

              <CardContent>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>
                    Updated{' '}
                    {formatDistanceToNow(new Date(mindMap.updated_at), {
                      addSuffix: true,
                    })}
                  </span>
                </div>

                <Link
                  href={`/workspaces/${workspaceId}/mind-maps/${mindMap.id}`}
                  className="mt-4 block"
                >
                  <Button variant="outline" className="w-full">
                    Open Mind Map
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Mind Map?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{selectedMindMap?.name}"? This action cannot be
              undone. All nodes and connections will be permanently removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => selectedMindMap && handleDelete(selectedMindMap.id)}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete Mind Map
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
