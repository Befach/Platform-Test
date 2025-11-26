'use client'

import { TaskList } from '@/components/product-tasks'
import { CheckSquare, Info } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'

interface ProductTasksViewProps {
  workspace: {
    id: string
    team_id: string
    name: string
  }
}

export function ProductTasksView({ workspace }: ProductTasksViewProps) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <CheckSquare className="h-6 w-6 text-primary" />
          <h2 className="text-2xl font-bold">Product Tasks</h2>
        </div>
        <p className="text-muted-foreground">
          Quick tasks for product-related work. Tasks can be standalone or linked to work items.
        </p>
      </div>

      {/* Info Alert */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertTitle>Two-Track Task System</AlertTitle>
        <AlertDescription>
          <ul className="list-disc list-inside mt-1 space-y-1 text-sm">
            <li><strong>Standalone tasks</strong>: Quick to-dos not tied to any work item (e.g., "Update screenshots", "Review competitor")</li>
            <li><strong>Linked tasks</strong>: Tasks connected to a work item for tracking and organization</li>
            <li>Tasks can be promoted to full work items if they grow in scope</li>
          </ul>
        </AlertDescription>
      </Alert>

      {/* Task List */}
      <TaskList
        workspaceId={workspace.id}
        teamId={workspace.team_id}
        title="All Product Tasks"
        showStats={true}
        showCreateButton={true}
      />
    </div>
  )
}
