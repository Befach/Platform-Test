'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
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
import { useRouter } from 'next/navigation'
import { Trash2, Eye, Edit } from 'lucide-react'
import Link from 'next/link'

interface Feature {
  id: string
  name: string
  type: string
  purpose: string | null
  phase: string // Phase IS the status for work items
  priority: string
  tags: string[] | null
  created_at: string
  updated_at: string
  created_by: string
}

interface WorkItemsListProps {
  features: Feature[]
  workspaceId: string
  currentUserId: string
}

export function WorkItemsList({
  features,
  workspaceId,
  currentUserId,
}: WorkItemsListProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const router = useRouter()
  const supabase = createClient()

  const handleDelete = async () => {
    if (!deletingId) return

    setLoading(true)
    try {
      const { error } = await supabase
        .from('work_items')
        .delete()
        .eq('id', deletingId)

      if (error) throw error

      setDeletingId(null)
      router.refresh()
    } catch (error: any) {
      console.error('Error deleting work item:', error)
      alert(error.message || 'Failed to delete work item')
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'planned':
        return 'bg-gray-100 text-gray-700 border-gray-300'
      case 'in_progress':
        return 'bg-blue-100 text-blue-700 border-blue-300'
      case 'completed':
        return 'bg-green-100 text-green-700 border-green-300'
      case 'on_hold':
        return 'bg-orange-100 text-orange-700 border-orange-300'
      case 'cancelled':
        return 'bg-red-100 text-red-700 border-red-300'
      default:
        return 'bg-gray-100 text-gray-700 border-gray-300'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'low':
        return 'bg-slate-100 text-slate-700 border-slate-300'
      case 'medium':
        return 'bg-blue-100 text-blue-700 border-blue-300'
      case 'high':
        return 'bg-orange-100 text-orange-700 border-orange-300'
      case 'critical':
        return 'bg-red-100 text-red-700 border-red-300'
      default:
        return 'bg-slate-100 text-slate-700 border-slate-300'
    }
  }

  return (
    <>
      <div className="space-y-4">
        {features.map((feature) => (
          <div
            key={feature.id}
            className="border rounded-lg p-4 hover:border-blue-300 transition-colors"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <h3 className="text-lg font-semibold mb-1">{feature.name}</h3>
                {feature.purpose && (
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {feature.purpose}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2 ml-4">
                <Link href={`/workspaces/${workspaceId}/features/${feature.id}`}>
                  <Button variant="ghost" size="icon" title="View details">
                    <Eye className="h-4 w-4" />
                  </Button>
                </Link>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setDeletingId(feature.id)}
                  title="Delete work item"
                >
                  <Trash2 className="h-4 w-4 text-red-600" />
                </Button>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Badge className={getStatusColor(feature.phase)} variant="outline">
                {feature.phase.replace('_', ' ')}
              </Badge>
              <Badge className={getPriorityColor(feature.priority)} variant="outline">
                {feature.priority}
              </Badge>
              <Badge variant="outline" className="bg-blue-100 text-blue-700 border-blue-300">
                {feature.type}
              </Badge>
              <span className="text-xs text-muted-foreground ml-auto">
                {new Date(feature.created_at).toLocaleDateString()}
              </span>
            </div>

            {feature.tags && feature.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {feature.tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="text-xs">
                    #{tag}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      <AlertDialog
        open={deletingId !== null}
        onOpenChange={(open) => !open && setDeletingId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Work Item</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this feature? This will also
              delete all associated timeline items and dependencies. This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={loading}
              className="bg-red-600 hover:bg-red-700"
            >
              {loading ? 'Deleting...' : 'Delete Work Item'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
