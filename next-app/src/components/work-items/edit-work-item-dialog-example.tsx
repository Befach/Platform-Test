/**
 * Edit Work Item Dialog - Usage Example
 *
 * This file demonstrates how to integrate the EditWorkItemDialog
 * component into your application.
 */

'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { EditWorkItemDialog } from './edit-work-item-dialog'
import { WorkspacePhase } from '@/lib/constants/work-item-types'
import { Edit } from 'lucide-react'

interface WorkItem {
  id: string
  name: string
  phase: WorkspacePhase
  workspace_id: string
}

interface EditWorkItemButtonProps {
  workItem: WorkItem
  onSuccess?: () => void
}

/**
 * Example: Edit button with dialog
 *
 * Usage in a table row or card:
 * ```tsx
 * <EditWorkItemButton
 *   workItem={item}
 *   onSuccess={() => {
 *     console.log('Work item updated!')
 *     // Optionally refresh data, show notification, etc.
 *   }}
 * />
 * ```
 */
export function EditWorkItemButton({ workItem, onSuccess }: EditWorkItemButtonProps) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(true)}
      >
        <Edit className="h-4 w-4 mr-2" />
        Edit
      </Button>

      <EditWorkItemDialog
        workItemId={workItem.id}
        workspaceId={workItem.workspace_id}
        phase={workItem.phase}
        open={isOpen}
        onOpenChange={setIsOpen}
        onSuccess={onSuccess}
      />
    </>
  )
}

/**
 * Example: Using in a table
 */
export function WorkItemsTable({ workItems }: { workItems: WorkItem[] }) {
  const handleSuccess = () => {
    console.log('Work item updated successfully!')
    // Optionally: refetch data, show toast, etc.
  }

  return (
    <table className="w-full">
      <thead>
        <tr>
          <th>Name</th>
          <th>Phase</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        {workItems.map((item) => (
          <tr key={item.id}>
            <td>{item.name}</td>
            <td>{item.phase}</td>
            <td>
              <EditWorkItemButton
                workItem={item}
                onSuccess={handleSuccess}
              />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

/**
 * Example: Programmatic control
 */
export function ProgrammaticExample() {
  const [isOpen, setIsOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState<WorkItem | null>(null)

  const openEditDialog = (item: WorkItem) => {
    setSelectedItem(item)
    setIsOpen(true)
  }

  return (
    <div>
      <Button onClick={() => openEditDialog({
        id: 'work_item_123',
        name: 'Example Item',
        phase: 'planning',
        workspace_id: 'workspace_456',
      })}>
        Edit Example Item
      </Button>

      {selectedItem && (
        <EditWorkItemDialog
          workItemId={selectedItem.id}
          workspaceId={selectedItem.workspace_id}
          phase={selectedItem.phase}
          open={isOpen}
          onOpenChange={setIsOpen}
          onSuccess={() => {
            console.log('Item updated!')
            setSelectedItem(null)
          }}
        />
      )}
    </div>
  )
}

/**
 * Example: Integration with React Query
 */
/*
import { useQueryClient } from '@tanstack/react-query'

export function EditWithReactQuery({ workItem }: { workItem: WorkItem }) {
  const [isOpen, setIsOpen] = useState(false)
  const queryClient = useQueryClient()

  const handleSuccess = () => {
    // Invalidate relevant queries to refetch data
    queryClient.invalidateQueries({ queryKey: ['work-items', workItem.workspace_id] })
    queryClient.invalidateQueries({ queryKey: ['work-item', workItem.id] })
  }

  return (
    <>
      <Button onClick={() => setIsOpen(true)}>Edit</Button>
      <EditWorkItemDialog
        workItemId={workItem.id}
        workspaceId={workItem.workspace_id}
        phase={workItem.phase}
        open={isOpen}
        onOpenChange={setIsOpen}
        onSuccess={handleSuccess}
      />
    </>
  )
}
*/
