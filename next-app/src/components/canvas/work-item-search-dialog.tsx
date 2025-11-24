'use client'

/**
 * Work Item Search Dialog
 *
 * Allows users to search for and select work items to add as reference nodes
 * in the freeform canvas. Displays work item details (status, timeline, assignee).
 */

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Loader2, Search, CheckCircle2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface WorkItem {
  id: string
  title: string
  description?: string
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'BLOCKED'
  timeline?: 'MVP' | 'SHORT' | 'LONG'
  assignee_name?: string
  assignee_email?: string
}

export interface WorkItemSearchDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  workspaceId: string
  onWorkItemSelect: (workItem: WorkItem) => void
}

const statusConfig = {
  NOT_STARTED: { label: 'Not Started', color: 'bg-gray-200 text-gray-700' },
  IN_PROGRESS: { label: 'In Progress', color: 'bg-blue-200 text-blue-700' },
  COMPLETED: { label: 'Completed', color: 'bg-green-200 text-green-700' },
  BLOCKED: { label: 'Blocked', color: 'bg-red-200 text-red-700' },
}

const timelineConfig = {
  MVP: { label: 'MVP', color: 'bg-purple-100 text-purple-700' },
  SHORT: { label: 'Short Term', color: 'bg-amber-100 text-amber-700' },
  LONG: { label: 'Long Term', color: 'bg-green-100 text-green-700' },
}

export function WorkItemSearchDialog({
  open,
  onOpenChange,
  workspaceId,
  onWorkItemSelect,
}: WorkItemSearchDialogProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [workItems, setWorkItems] = useState<WorkItem[]>([])
  const [filteredWorkItems, setFilteredWorkItems] = useState<WorkItem[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [selectedWorkItemId, setSelectedWorkItemId] = useState<string | null>(null)

  // Fetch work items when dialog opens
  useEffect(() => {
    if (open && workspaceId) {
      fetchWorkItems()
    }
  }, [open, workspaceId])

  // Filter work items based on search query
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredWorkItems(workItems)
    } else {
      const query = searchQuery.toLowerCase()
      const filtered = workItems.filter(
        (item) =>
          item.title.toLowerCase().includes(query) ||
          item.description?.toLowerCase().includes(query) ||
          item.assignee_name?.toLowerCase().includes(query)
      )
      setFilteredWorkItems(filtered)
    }
  }, [searchQuery, workItems])

  const fetchWorkItems = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/workspaces/${workspaceId}/work-items`)
      if (!response.ok) throw new Error('Failed to fetch work items')
      const data = await response.json()
      setWorkItems(data)
      setFilteredWorkItems(data)
    } catch (error) {
      console.error('Error fetching work items:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleWorkItemClick = (workItem: WorkItem) => {
    setSelectedWorkItemId(workItem.id)
  }

  const handleAddWorkItem = () => {
    const selectedWorkItem = workItems.find((item) => item.id === selectedWorkItemId)
    if (selectedWorkItem) {
      onWorkItemSelect(selectedWorkItem)
      onOpenChange(false)
      setSearchQuery('')
      setSelectedWorkItemId(null)
    }
  }

  const getInitials = (name?: string, email?: string) => {
    if (name) {
      return name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    }
    if (email) {
      return email.slice(0, 2).toUpperCase()
    }
    return '??'
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Add Work Item Reference</DialogTitle>
          <DialogDescription>
            Search for and select a work item to add as a reference node on your canvas
          </DialogDescription>
        </DialogHeader>

        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search work items by title, description, or assignee..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Work Items List */}
        <ScrollArea className="flex-1 -mx-6 px-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredWorkItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Search className="h-12 w-12 text-muted-foreground mb-3" />
              <p className="text-sm text-muted-foreground">
                {searchQuery ? 'No work items found matching your search' : 'No work items found'}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredWorkItems.map((workItem) => {
                const isSelected = selectedWorkItemId === workItem.id

                return (
                  <button
                    key={workItem.id}
                    onClick={() => handleWorkItemClick(workItem)}
                    className={cn(
                      'w-full text-left p-4 rounded-lg border-2 transition-all',
                      'hover:border-blue-300 hover:bg-blue-50/50',
                      isSelected
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 bg-white'
                    )}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start gap-2 mb-2">
                          <h4 className="font-semibold text-sm text-gray-900 line-clamp-1">
                            {workItem.title}
                          </h4>
                          {isSelected && (
                            <CheckCircle2 className="h-4 w-4 text-blue-600 flex-shrink-0 mt-0.5" />
                          )}
                        </div>

                        {workItem.description && (
                          <p className="text-xs text-gray-600 line-clamp-2 mb-3">
                            {workItem.description}
                          </p>
                        )}

                        <div className="flex flex-wrap items-center gap-2">
                          <Badge
                            variant="secondary"
                            className={cn('text-xs', statusConfig[workItem.status].color)}
                          >
                            {statusConfig[workItem.status].label}
                          </Badge>

                          {workItem.timeline && (
                            <Badge
                              variant="secondary"
                              className={cn('text-xs', timelineConfig[workItem.timeline].color)}
                            >
                              {timelineConfig[workItem.timeline].label}
                            </Badge>
                          )}

                          {workItem.assignee_name && (
                            <div className="flex items-center gap-1.5">
                              <Avatar className="w-5 h-5">
                                <AvatarFallback className="text-xs">
                                  {getInitials(workItem.assignee_name, workItem.assignee_email)}
                                </AvatarFallback>
                              </Avatar>
                              <span className="text-xs text-gray-600">
                                {workItem.assignee_name}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </ScrollArea>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-4 border-t">
          <p className="text-sm text-muted-foreground">
            {filteredWorkItems.length} work item{filteredWorkItems.length !== 1 ? 's' : ''} found
          </p>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleAddWorkItem}
              disabled={!selectedWorkItemId}
            >
              Add Reference
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
