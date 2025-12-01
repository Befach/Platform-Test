'use client'

/**
 * Insight Link Dialog Component
 *
 * Dialog for linking customer insights to work items.
 * Allows searching work items and setting relevance score.
 */

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Slider } from '@/components/ui/slider'
import { Skeleton } from '@/components/ui/skeleton'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useToast } from '@/hooks/use-toast'
import {
  Loader2,
  Link2,
  Search,
  Check,
  Lightbulb,
  Bug,
  Rocket,
  FileText,
  Zap,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { CustomerInsight } from '@/lib/types/customer-insight'

// Work item type icons
const workItemIcons: Record<string, React.ElementType> = {
  concept: Lightbulb,
  feature: Rocket,
  bug: Bug,
  enhancement: Zap,
  research: FileText,
}

// Work item type colors
const workItemColors: Record<string, string> = {
  concept: 'bg-purple-100 text-purple-700',
  feature: 'bg-blue-100 text-blue-700',
  bug: 'bg-red-100 text-red-700',
  enhancement: 'bg-green-100 text-green-700',
  research: 'bg-orange-100 text-orange-700',
}

interface WorkItem {
  id: string
  name: string
  type: string
  status: string
  priority?: string
}

interface InsightLinkDialogProps {
  insight: CustomerInsight | null
  teamId: string
  workspaceId?: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function InsightLinkDialog({
  insight,
  teamId,
  workspaceId,
  open,
  onOpenChange,
  onSuccess,
}: InsightLinkDialogProps) {
  const router = useRouter()
  const { toast } = useToast()

  // State
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [workItems, setWorkItems] = useState<WorkItem[]>([])
  const [selectedWorkItem, setSelectedWorkItem] = useState<WorkItem | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [relevanceScore, setRelevanceScore] = useState(5)
  const [notes, setNotes] = useState('')

  // Search work items
  const searchWorkItems = useCallback(async (query: string) => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams({
        team_id: teamId,
        limit: '20',
      })
      if (workspaceId) params.set('workspace_id', workspaceId)
      if (query) params.set('search', query)

      const response = await fetch(`/api/work-items?${params}`)

      if (!response.ok) {
        throw new Error('Failed to fetch work items')
      }

      const data = await response.json()
      setWorkItems(data.data || data || [])
    } catch (err) {
      console.error('Error searching work items:', err)
      setWorkItems([])
    } finally {
      setIsLoading(false)
    }
  }, [teamId, workspaceId])

  // Load work items when dialog opens
  useEffect(() => {
    if (open) {
      setSelectedWorkItem(null)
      setSearchQuery('')
      setRelevanceScore(5)
      setNotes('')
      searchWorkItems('')
    }
  }, [open, searchWorkItems])

  // Search with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      searchWorkItems(searchQuery)
    }, 300)
    return () => clearTimeout(timer)
  }, [searchQuery, searchWorkItems])

  async function handleLink() {
    if (!insight || !selectedWorkItem) return

    setIsSubmitting(true)

    try {
      const response = await fetch(`/api/insights/${insight.id}/link`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          work_item_id: selectedWorkItem.id,
          relevance_score: relevanceScore,
          notes: notes || undefined,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to link insight')
      }

      toast({
        title: 'Insight linked',
        description: `Linked "${insight.title}" to "${selectedWorkItem.name}"`,
      })

      router.refresh()
      onOpenChange(false)
      onSuccess?.()
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to link insight',
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const getWorkItemIcon = (type: string) => {
    const Icon = workItemIcons[type] || FileText
    return Icon
  }

  if (!insight) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Link2 className="h-5 w-5 text-primary" />
            Link Insight to Work Item
          </DialogTitle>
          <DialogDescription>
            Connect "{insight.title}" to a work item
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 space-y-4 overflow-hidden py-4">
          {/* Search */}
          <div className="space-y-2">
            <Label htmlFor="search">Search Work Items</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="search"
                placeholder="Search by name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          {/* Work Items List */}
          <div className="space-y-2">
            <Label>Select Work Item</Label>
            <ScrollArea className="h-[200px] border rounded-md">
              {isLoading ? (
                <div className="p-4 space-y-2">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </div>
              ) : workItems.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  <p className="text-sm">No work items found</p>
                </div>
              ) : (
                <div className="p-2 space-y-1">
                  {workItems.map((item) => {
                    const Icon = getWorkItemIcon(item.type)
                    const isSelected = selectedWorkItem?.id === item.id

                    return (
                      <button
                        key={item.id}
                        type="button"
                        className={cn(
                          'w-full flex items-center gap-3 p-3 rounded-lg text-left transition-colors',
                          isSelected
                            ? 'bg-primary text-primary-foreground'
                            : 'hover:bg-muted'
                        )}
                        onClick={() => setSelectedWorkItem(item)}
                      >
                        <div
                          className={cn(
                            'h-8 w-8 rounded flex items-center justify-center shrink-0',
                            isSelected
                              ? 'bg-primary-foreground/20'
                              : workItemColors[item.type] || 'bg-gray-100'
                          )}
                        >
                          <Icon className="h-4 w-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{item.name}</p>
                          <div className="flex items-center gap-2 text-xs opacity-70">
                            <span className="capitalize">{item.type}</span>
                            <span>•</span>
                            <span className="capitalize">{item.status}</span>
                          </div>
                        </div>
                        {isSelected && (
                          <Check className="h-5 w-5 shrink-0" />
                        )}
                      </button>
                    )
                  })}
                </div>
              )}
            </ScrollArea>
          </div>

          {/* Relevance Score */}
          {selectedWorkItem && (
            <>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Relevance Score</Label>
                  <span className="text-sm font-medium">{relevanceScore}/10</span>
                </div>
                <Slider
                  value={[relevanceScore]}
                  onValueChange={([value]) => setRelevanceScore(value)}
                  min={1}
                  max={10}
                  step={1}
                  className="w-full"
                />
                <p className="text-xs text-muted-foreground">
                  How relevant is this insight to the selected work item?
                </p>
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <Label htmlFor="notes">Notes (Optional)</Label>
                <Textarea
                  id="notes"
                  placeholder="Explain why this insight is relevant..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                />
              </div>
            </>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleLink}
            disabled={isSubmitting || !selectedWorkItem}
          >
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isSubmitting ? 'Linking...' : 'Link Insight'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
