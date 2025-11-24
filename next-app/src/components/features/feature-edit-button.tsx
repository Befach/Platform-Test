'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Pencil } from 'lucide-react'
import { EditWorkItemDialog } from '@/components/work-items/edit-work-item-dialog'
import { WorkspacePhase } from '@/lib/constants/work-item-types'

interface FeatureEditButtonProps {
  featureId: string
  workspaceId: string
  phase: WorkspacePhase
}

/**
 * Feature Edit Button
 *
 * Client component that handles the edit functionality for features.
 * Opens the EditWorkItemDialog with proper phase context.
 *
 * @example
 * ```tsx
 * <FeatureEditButton
 *   featureId="feature_123"
 *   workspaceId="workspace_456"
 *   phase="planning"
 * />
 * ```
 */
export function FeatureEditButton({
  featureId,
  workspaceId,
  phase,
}: FeatureEditButtonProps) {
  const [editDialogOpen, setEditDialogOpen] = useState(false)

  return (
    <>
      <Button onClick={() => setEditDialogOpen(true)} variant="outline">
        <Pencil className="mr-2 h-4 w-4" />
        Edit
      </Button>

      <EditWorkItemDialog
        workItemId={featureId}
        workspaceId={workspaceId}
        phase={phase}
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
      />
    </>
  )
}
