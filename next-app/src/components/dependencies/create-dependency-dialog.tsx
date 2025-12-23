'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { useCreateDependency } from '@/lib/hooks/use-dependencies'
import { useToast } from '@/hooks/use-toast'
import type { WorkItem } from '@/lib/types/work-items'
import type { ConnectionType } from '@/lib/types/dependencies'
import { CONNECTION_TYPE_CONFIGS } from '@/lib/types/dependencies'
import { Plus, Loader2 } from 'lucide-react'
import { getItemLabel } from '@/lib/constants/work-item-types'

interface CreateDependencyDialogProps {
  workspaceId: string
  workItems: WorkItem[]
  trigger?: React.ReactNode
}

export function CreateDependencyDialog({
  workspaceId,
  workItems,
  trigger,
}: CreateDependencyDialogProps) {
  const [open, setOpen] = useState(false)
  const [sourceWorkItemId, setSourceWorkItemId] = useState<string>('')
  const [targetWorkItemId, setTargetWorkItemId] = useState<string>('')
  const [connectionType, setConnectionType] = useState<ConnectionType>('dependency')
  const [reason, setReason] = useState('')

  const createDependency = useCreateDependency()
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!sourceWorkItemId || !targetWorkItemId) {
      toast({
        title: 'Validation Error',
        description: 'Please select both source and target work items',
        variant: 'destructive',
      })
      return
    }

    if (sourceWorkItemId === targetWorkItemId) {
      toast({
        title: 'Validation Error',
        description: 'Cannot create dependency to itself',
        variant: 'destructive',
      })
      return
    }

    try {
      await createDependency.mutateAsync({
        workspace_id: workspaceId,
        source_work_item_id: sourceWorkItemId,
        target_work_item_id: targetWorkItemId,
        connection_type: connectionType,
        reason: reason || undefined,
      })

      toast({
        title: 'Success',
        description: 'Dependency created successfully',
      })

      // Reset form
      setSourceWorkItemId('')
      setTargetWorkItemId('')
      setConnectionType('dependency')
      setReason('')
      setOpen(false)
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create dependency',
        variant: 'destructive',
      })
    }
  }

  const sourceWorkItem = workItems.find((item) => item.id === sourceWorkItemId)
  const targetWorkItem = workItems.find((item) => item.id === targetWorkItemId)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Dependency
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Create Dependency</DialogTitle>
            <DialogDescription>
              Link two work items together to define their relationship
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {/* Source Work Item */}
            <div className="grid gap-2">
              <Label htmlFor="source">Source Work Item</Label>
              <Select value={sourceWorkItemId} onValueChange={setSourceWorkItemId}>
                <SelectTrigger id="source">
                  <SelectValue placeholder="Select source work item" />
                </SelectTrigger>
                <SelectContent>
                  {workItems.map((item) => (
                    <SelectItem
                      key={item.id}
                      value={item.id}
                      disabled={item.id === targetWorkItemId}
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{item.name}</span>
                        <span className="text-xs text-muted-foreground">
                          ({getItemLabel(item.type)})
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Connection Type */}
            <div className="grid gap-2">
              <Label htmlFor="type">Relationship Type</Label>
              <Select
                value={connectionType}
                onValueChange={(value) => setConnectionType(value as ConnectionType)}
              >
                <SelectTrigger id="type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(CONNECTION_TYPE_CONFIGS).map(([key, config]) => (
                    <SelectItem key={key} value={key}>
                      <div className="flex items-center gap-2">
                        <span>{config.icon}</span>
                        <span>{config.label}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {connectionType && (
                <p className="text-xs text-muted-foreground">
                  {CONNECTION_TYPE_CONFIGS[connectionType].description}
                </p>
              )}
            </div>

            {/* Target Work Item */}
            <div className="grid gap-2">
              <Label htmlFor="target">Target Work Item</Label>
              <Select value={targetWorkItemId} onValueChange={setTargetWorkItemId}>
                <SelectTrigger id="target">
                  <SelectValue placeholder="Select target work item" />
                </SelectTrigger>
                <SelectContent>
                  {workItems.map((item) => (
                    <SelectItem
                      key={item.id}
                      value={item.id}
                      disabled={item.id === sourceWorkItemId}
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{item.name}</span>
                        <span className="text-xs text-muted-foreground">
                          ({getItemLabel(item.type)})
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Reason */}
            <div className="grid gap-2">
              <Label htmlFor="reason">Reason (Optional)</Label>
              <Textarea
                id="reason"
                placeholder="Explain why this dependency exists..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={3}
              />
            </div>

            {/* Preview */}
            {sourceWorkItem && targetWorkItem && (
              <div className="rounded-lg border p-3 bg-muted/50">
                <p className="text-sm font-medium mb-2">Preview:</p>
                <div className="flex items-center gap-2 text-sm">
                  <span className="font-medium">{sourceWorkItem.name}</span>
                  <span className="text-muted-foreground">
                    {CONNECTION_TYPE_CONFIGS[connectionType].icon}
                    {CONNECTION_TYPE_CONFIGS[connectionType].label}
                  </span>
                  <span className="font-medium">{targetWorkItem.name}</span>
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={createDependency.isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={createDependency.isPending}>
              {createDependency.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Create Dependency
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
