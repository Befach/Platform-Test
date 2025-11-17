'use client'

import { useState } from 'react'
import { X, Trash2, Tag, Users, Download, CheckCircle2, XCircle, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
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
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'

interface BulkActionBarProps {
  selectedCount: number
  onClearSelection: () => void
  onDelete?: () => Promise<void>
  onChangeStatus?: (status: string) => Promise<void>
  onChangePriority?: (priority: string) => Promise<void>
  onAssign?: (userId: string) => Promise<void>
  onExport?: () => void
  className?: string
}

export function BulkActionBar({
  selectedCount,
  onClearSelection,
  onDelete,
  onChangeStatus,
  onChangePriority,
  onAssign,
  onExport,
  className,
}: BulkActionBarProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  if (selectedCount === 0) return null

  const handleAction = async (
    action: () => Promise<void>,
    successMessage: string
  ) => {
    setIsLoading(true)
    try {
      await action()
      toast({
        title: 'Success',
        description: successMessage,
      })
      onClearSelection()
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to perform action',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = () => {
    if (onDelete) {
      setShowDeleteDialog(true)
    }
  }

  const confirmDelete = async () => {
    if (onDelete) {
      await handleAction(
        onDelete,
        `Successfully deleted ${selectedCount} item${selectedCount > 1 ? 's' : ''}`
      )
    }
    setShowDeleteDialog(false)
  }

  return (
    <>
      <div
        className={cn(
          'fixed bottom-6 left-1/2 -translate-x-1/2 z-50',
          'bg-primary text-primary-foreground rounded-lg shadow-2xl',
          'border border-primary/20',
          'animate-in slide-in-from-bottom-4',
          className
        )}
      >
        <div className="flex items-center gap-4 px-4 py-3">
          {/* Selection count */}
          <div className="flex items-center gap-2 font-medium">
            <CheckCircle2 className="h-4 w-4" />
            <span>{selectedCount} selected</span>
          </div>

          {/* Divider */}
          <div className="h-6 w-px bg-primary-foreground/20" />

          {/* Actions */}
          <div className="flex items-center gap-2">
            {/* Change Status */}
            {onChangeStatus && (
              <Select
                disabled={isLoading}
                onValueChange={(value) =>
                  handleAction(
                    () => onChangeStatus(value),
                    'Status updated successfully'
                  )
                }
              >
                <SelectTrigger className="h-8 w-[140px] bg-primary-foreground/10 border-primary-foreground/20 hover:bg-primary-foreground/20">
                  <SelectValue placeholder="Change status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="not_started">Not Started</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="blocked">Blocked</SelectItem>
                </SelectContent>
              </Select>
            )}

            {/* Change Priority */}
            {onChangePriority && (
              <Select
                disabled={isLoading}
                onValueChange={(value) =>
                  handleAction(
                    () => onChangePriority(value),
                    'Priority updated successfully'
                  )
                }
              >
                <SelectTrigger className="h-8 w-[140px] bg-primary-foreground/10 border-primary-foreground/20 hover:bg-primary-foreground/20">
                  <SelectValue placeholder="Set priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
            )}

            {/* Export */}
            {onExport && (
              <Button
                size="sm"
                variant="ghost"
                disabled={isLoading}
                onClick={onExport}
                className="h-8 bg-primary-foreground/10 hover:bg-primary-foreground/20"
              >
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            )}

            {/* Delete */}
            {onDelete && (
              <Button
                size="sm"
                variant="ghost"
                disabled={isLoading}
                onClick={handleDelete}
                className="h-8 bg-destructive/10 hover:bg-destructive/20 text-destructive-foreground"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4 mr-2" />
                )}
                Delete
              </Button>
            )}
          </div>

          {/* Divider */}
          <div className="h-6 w-px bg-primary-foreground/20" />

          {/* Clear selection */}
          <Button
            size="sm"
            variant="ghost"
            onClick={onClearSelection}
            disabled={isLoading}
            className="h-8 bg-primary-foreground/10 hover:bg-primary-foreground/20"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Delete confirmation dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete {selectedCount} item
              {selectedCount > 1 ? 's' : ''}. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
