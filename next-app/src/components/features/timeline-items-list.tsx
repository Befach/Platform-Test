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
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { useRouter } from 'next/navigation'
import { Trash2, Check, Clock, Target, ChevronDown, ChevronRight, ListTodo } from 'lucide-react'
import { getPhaseLabel, getPhaseBgColor } from '@/lib/constants/work-item-types'
import { TaskList } from '@/components/product-tasks/task-list'

interface TimelineItem {
  id: string
  title: string
  description: string | null
  timeline: string
  difficulty: string
  phase: string | null
  order_index: number
  estimated_hours: number | null
  actual_hours: number | null
  completed_at: string | null
  created_at: string
}

interface TimelineItemsListProps {
  items: TimelineItem[]
  featureId: string
  workspaceId?: string
  teamId?: string
}

export function TimelineItemsList({ items, featureId, workspaceId, teamId }: TimelineItemsListProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set())

  const toggleTasks = (itemId: string) => {
    setExpandedTasks((prev) => {
      const next = new Set(prev)
      if (next.has(itemId)) {
        next.delete(itemId)
      } else {
        next.add(itemId)
      }
      return next
    })
  }

  const router = useRouter()
  const supabase = createClient()

  const handleDelete = async () => {
    if (!deletingId) return

    setLoading(true)
    try {
      const { error } = await supabase
        .from('timeline_items')
        .delete()
        .eq('id', deletingId)

      if (error) throw error

      setDeletingId(null)
      router.refresh()
    } catch (error: any) {
      console.error('Error deleting timeline item:', error)
      alert(error.message || 'Failed to delete timeline item')
    } finally {
      setLoading(false)
    }
  }

  const handleToggleComplete = async (itemId: string, currentlyCompleted: boolean) => {
    setLoading(true)
    try {
      const { error } = await supabase
        .from('timeline_items')
        .update({
          completed_at: currentlyCompleted ? null : new Date().toISOString(),
        })
        .eq('id', itemId)

      if (error) throw error

      router.refresh()
    } catch (error: any) {
      console.error('Error updating timeline item:', error)
      alert(error.message || 'Failed to update timeline item')
    } finally {
      setLoading(false)
    }
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'EASY':
        return 'bg-green-100 text-green-700 border-green-300'
      case 'MEDIUM':
        return 'bg-yellow-100 text-yellow-700 border-yellow-300'
      case 'HARD':
        return 'bg-red-100 text-red-700 border-red-300'
      default:
        return 'bg-gray-100 text-gray-700 border-gray-300'
    }
  }

  return (
    <>
      <div className="space-y-3">
        {items.map((item) => {
          const isCompleted = !!item.completed_at

          return (
            <div
              key={item.id}
              className={`border rounded-lg p-4 transition-all ${
                isCompleted
                  ? 'bg-green-50 border-green-200'
                  : 'bg-white hover:border-blue-300'
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h4
                      className={`font-medium ${
                        isCompleted ? 'line-through text-muted-foreground' : ''
                      }`}
                    >
                      {item.title}
                    </h4>
                  </div>

                  {item.description && (
                    <p
                      className={`text-sm mb-3 ${
                        isCompleted ? 'text-muted-foreground' : 'text-gray-600'
                      }`}
                    >
                      {item.description}
                    </p>
                  )}

                  <div className="flex flex-wrap items-center gap-2">
                    <Badge
                      className={getDifficultyColor(item.difficulty)}
                      variant="outline"
                    >
                      {item.difficulty}
                    </Badge>

                    {item.phase && (
                      <Badge variant="outline" className={getPhaseBgColor(item.phase)}>
                        <Target className="h-3 w-3 mr-1" />
                        {getPhaseLabel(item.phase)}
                      </Badge>
                    )}

                    {item.estimated_hours && (
                      <Badge variant="outline" className="bg-blue-100 text-blue-700 border-blue-300">
                        <Clock className="h-3 w-3 mr-1" />
                        {item.estimated_hours}h
                      </Badge>
                    )}

                    {isCompleted && (
                      <Badge variant="outline" className="bg-green-100 text-green-700 border-green-300">
                        <Check className="h-3 w-3 mr-1" />
                        Completed
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {workspaceId && teamId && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleTasks(item.id)}
                      title="View tasks"
                      className="gap-1"
                    >
                      <ListTodo className="h-4 w-4" />
                      {expandedTasks.has(item.id) ? (
                        <ChevronDown className="h-3 w-3" />
                      ) : (
                        <ChevronRight className="h-3 w-3" />
                      )}
                    </Button>
                  )}
                  <Button
                    variant={isCompleted ? 'outline' : 'default'}
                    size="icon"
                    onClick={() => handleToggleComplete(item.id, isCompleted)}
                    disabled={loading}
                    title={isCompleted ? 'Mark as incomplete' : 'Mark as complete'}
                  >
                    <Check className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setDeletingId(item.id)}
                    disabled={loading}
                    title="Delete item"
                  >
                    <Trash2 className="h-4 w-4 text-red-600" />
                  </Button>
                </div>
              </div>

              {/* Collapsible Tasks Section */}
              {workspaceId && teamId && expandedTasks.has(item.id) && (
                <div className="mt-4 pt-4 border-t">
                  <TaskList
                    workspaceId={workspaceId}
                    teamId={teamId}
                    timelineItemId={item.id}
                    timelineItemName={item.title}
                    title={`Tasks for "${item.title}"`}
                    showStats={false}
                    showCreateButton={true}
                    className="px-0"
                  />
                </div>
              )}
            </div>
          )
        })}
      </div>

      <AlertDialog
        open={deletingId !== null}
        onOpenChange={(open) => !open && setDeletingId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Timeline Item</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this timeline item? This action
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
              {loading ? 'Deleting...' : 'Delete Item'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
