'use client'

import { useState } from 'react'
import { WorkItemsFilter, FilterState, ViewMode } from './work-items-filter'
import { FeaturesTableView } from './features-table-view'
import { ColumnVisibilityMenu, ColumnVisibility } from './column-visibility-menu'
import { useRouter } from 'next/navigation'
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
import { createClient } from '@/lib/supabase/client'
import { calculateWorkItemPhase, type WorkspacePhase } from '@/lib/constants/workspace-phases'

interface WorkItem {
  id: string
  name: string
  type: string
  purpose: string | null
  status: string
  priority: string
  tags: string[] | null
  linkedItemsCount: number
  created_at: string
  updated_at: string
  created_by: string
}

interface TimelineItem {
  id: string
  work_item_id: string
  timeline: 'MVP' | 'SHORT' | 'LONG'
  description: string | null
  difficulty: string
  status: string | null
}

interface FeaturesViewWrapperProps {
  initialWorkItems: WorkItem[]
  timelineItems: TimelineItem[]
  workspaceId: string
  currentUserId: string
  selectedPhase: WorkspacePhase | null
}

export function FeaturesViewWrapper({
  initialWorkItems,
  timelineItems,
  workspaceId,
  currentUserId,
  selectedPhase,
}: FeaturesViewWrapperProps) {
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    status: 'all',
    priority: 'all',
  })
  const [viewMode, setViewMode] = useState<ViewMode>('collapsed')
  const [columnVisibility, setColumnVisibility] = useState<ColumnVisibility>({
    type: true,
    timeline: true,
    status: true,
    priority: true,
    purpose: false,
    integration: false,
    tags: true,
    links: true,
    date: false,
  })
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const router = useRouter()
  const supabase = createClient()

  // Apply filters
  const filteredWorkItems = initialWorkItems.filter((item) => {
    // Phase filter (null = show all phases)
    if (selectedPhase !== null) {
      const itemPhase = calculateWorkItemPhase(item)
      if (itemPhase !== selectedPhase) return false
    }

    // Search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase()
      const matchesName = item.name.toLowerCase().includes(searchLower)
      const matchesPurpose = item.purpose?.toLowerCase().includes(searchLower)
      const matchesTags = item.tags?.some(tag => tag.toLowerCase().includes(searchLower))

      if (!matchesName && !matchesPurpose && !matchesTags) return false
    }

    // Status filter
    if (filters.status !== 'all' && item.status !== filters.status) return false

    // Priority filter
    if (filters.priority !== 'all' && item.priority !== filters.priority) return false

    return true
  })

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

  return (
    <>
      <div className="space-y-6">
        {/* Filter Bar */}
        <WorkItemsFilter
          onFilterChange={setFilters}
          onViewModeChange={setViewMode}
          viewMode={viewMode}
        />

        {/* Work Items Count and Column Visibility */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {filteredWorkItems.length} of {initialWorkItems.length} work item
            {filteredWorkItems.length !== 1 ? 's' : ''}
          </p>
          <ColumnVisibilityMenu onVisibilityChange={setColumnVisibility} />
        </div>

        {/* Table View */}
        <FeaturesTableView
          workItems={filteredWorkItems}
          timelineItems={timelineItems}
          workspaceId={workspaceId}
          workspacePhase={selectedPhase || 'research'}
          onDelete={setDeletingId}
          viewMode={viewMode}
          columnVisibility={columnVisibility}
        />
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={deletingId !== null}
        onOpenChange={(open) => !open && setDeletingId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Work Item</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this work item? This will also
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
