'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { useToast } from '@/hooks/use-toast'
import { Loader2, ArrowRight, Lightbulb, Zap, Bug, Sparkles } from 'lucide-react'
import type { ProductTaskWithRelations } from '@/lib/types/product-tasks'

type WorkItemType = 'concept' | 'feature' | 'bug'

const WORK_ITEM_TYPES: { value: WorkItemType; label: string; icon: React.ComponentType<{ className?: string }>; description: string }[] = [
  {
    value: 'concept',
    label: 'Concept',
    icon: Lightbulb,
    description: 'An unvalidated idea that needs exploration',
  },
  {
    value: 'feature',
    label: 'Feature',
    icon: Zap,
    description: 'New functionality to be built (use is_enhancement flag for iterations)',
  },
  {
    value: 'bug',
    label: 'Bug',
    icon: Bug,
    description: 'Something that needs fixing',
  },
]

interface ConvertTaskDialogProps {
  task: ProductTaskWithRelations
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function ConvertTaskDialog({
  task,
  open,
  onOpenChange,
  onSuccess,
}: ConvertTaskDialogProps) {
  const { toast } = useToast()
  const [isConverting, setIsConverting] = useState(false)
  const [workItemType, setWorkItemType] = useState<WorkItemType>('feature')
  const [keepTask, setKeepTask] = useState(false)

  const handleConvert = async () => {
    setIsConverting(true)
    try {
      const response = await fetch(`/api/product-tasks/${task.id}/convert`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: workItemType,
          keep_task: keepTask,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to convert task')
      }

      const data = await response.json()

      toast({
        title: 'Task converted',
        description: keepTask
          ? `"${task.title}" has been converted to a work item and linked.`
          : `"${task.title}" has been converted to a work item.`,
      })

      onOpenChange(false)
      onSuccess?.()
    } catch (error) {
      toast({
        title: 'Conversion failed',
        description: error instanceof Error ? error.message : 'Failed to convert task',
        variant: 'destructive',
      })
    } finally {
      setIsConverting(false)
    }
  }

  const selectedType = WORK_ITEM_TYPES.find((t) => t.value === workItemType)!

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Convert to Work Item
            <ArrowRight className="h-4 w-4 text-muted-foreground" />
          </DialogTitle>
          <DialogDescription>
            Promote this task to a full work item for better tracking and planning.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Task being converted */}
          <div className="p-3 bg-muted rounded-lg">
            <p className="text-sm font-medium">{task.title}</p>
            {task.description && (
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                {task.description}
              </p>
            )}
          </div>

          {/* Work item type selection */}
          <div className="space-y-2">
            <Label>Work Item Type</Label>
            <Select
              value={workItemType}
              onValueChange={(v) => setWorkItemType(v as WorkItemType)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                {WORK_ITEM_TYPES.map((type) => {
                  const Icon = type.icon
                  return (
                    <SelectItem key={type.value} value={type.value}>
                      <div className="flex items-center gap-2">
                        <Icon className="h-4 w-4" />
                        {type.label}
                      </div>
                    </SelectItem>
                  )
                })}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">{selectedType.description}</p>
          </div>

          {/* Keep task option */}
          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div className="space-y-0.5">
              <Label htmlFor="keep-task" className="text-sm font-medium">
                Keep original task
              </Label>
              <p className="text-xs text-muted-foreground">
                Link the task to the new work item instead of deleting it
              </p>
            </div>
            <Switch
              id="keep-task"
              checked={keepTask}
              onCheckedChange={setKeepTask}
            />
          </div>

          {/* What will happen */}
          <div className="p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg text-sm">
            <p className="font-medium text-blue-800 dark:text-blue-200 mb-1">
              What will happen:
            </p>
            <ul className="text-blue-700 dark:text-blue-300 text-xs space-y-1">
              <li>
                - A new {selectedType.label.toLowerCase()} work item will be created
              </li>
              <li>- Title, description, and priority will be copied</li>
              {keepTask ? (
                <li>- The task will be linked to the new work item</li>
              ) : (
                <li>- The original task will be deleted</li>
              )}
            </ul>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleConvert} disabled={isConverting}>
            {isConverting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Convert to Work Item
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
