'use client'

import { useState, useEffect } from 'react'
import { Plus, X, Link2, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

interface LinkManagementModalProps {
  workItemId: string
  workItemName: string
  workspaceId: string
  trigger?: React.ReactNode
}

interface LinkedItem {
  id: string
  sourceItemId: string
  targetItemId: string
  relationshipType: string
  targetWorkItemId: string
  targetWorkItemName: string
  targetTimelineName: string
}

interface WorkItem {
  id: string
  name: string
  type: string
}

interface TimelineItem {
  id: string
  work_item_id: string
  timeline: string
  description: string | null
}

export function LinkManagementModal({
  workItemId,
  workItemName,
  workspaceId,
  trigger,
}: LinkManagementModalProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [existingLinks, setExistingLinks] = useState<LinkedItem[]>([])
  const [availableWorkItems, setAvailableWorkItems] = useState<WorkItem[]>([])
  const [timelineItems, setTimelineItems] = useState<TimelineItem[]>([])
  const [selectedWorkItemId, setSelectedWorkItemId] = useState<string>('')
  const [selectedTimelineId, setSelectedTimelineId] = useState<string>('')
  const [selectedRelationship, setSelectedRelationship] = useState<string>('relates_to')

  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    if (open) {
      loadData()
    }
  }, [open, workItemId])

  const loadData = async () => {
    setLoading(true)
    try {
      // Get timeline items for this work item
      const { data: currentTimelineItems } = await supabase
        .from('timeline_items')
        .select('id')
        .eq('work_item_id', workItemId)

      const currentTimelineIds = currentTimelineItems?.map((t) => t.id) || []

      // Get all linked items
      if (currentTimelineIds.length > 0) {
        const { data: links } = await supabase
          .from('linked_items')
          .select('id, source_item_id, target_item_id, relationship_type')
          .or(
            `source_item_id.in.(${currentTimelineIds.join(',')}),target_item_id.in.(${currentTimelineIds.join(',')})`
          )

        // Get all timeline items to resolve work item info
        const allTimelineIds = new Set<string>()
        links?.forEach((link) => {
          allTimelineIds.add(link.source_item_id)
          allTimelineIds.add(link.target_item_id)
        })

        const { data: allTimelines } = await supabase
          .from('timeline_items')
          .select('id, work_item_id, timeline')
          .in('id', Array.from(allTimelineIds))

        // Get all work items
        const workItemIds = new Set(allTimelines?.map((t) => t.work_item_id) || [])
        const { data: allWorkItems } = await supabase
          .from('work_items')
          .select('id, name')
          .in('id', Array.from(workItemIds))

        // Map the links
        const mappedLinks: LinkedItem[] = []
        links?.forEach((link) => {
          const isSource = currentTimelineIds.includes(link.source_item_id)
          const linkedTimelineId = isSource ? link.target_item_id : link.source_item_id

          const linkedTimeline = allTimelines?.find((t) => t.id === linkedTimelineId)
          const linkedWorkItem = allWorkItems?.find((w) => w.id === linkedTimeline?.work_item_id)

          if (linkedWorkItem && linkedTimeline) {
            mappedLinks.push({
              id: link.id,
              sourceItemId: link.source_item_id,
              targetItemId: link.target_item_id,
              relationshipType: link.relationship_type,
              targetWorkItemId: linkedWorkItem.id,
              targetWorkItemName: linkedWorkItem.name,
              targetTimelineName: linkedTimeline.timeline,
            })
          }
        })

        setExistingLinks(mappedLinks)
      }

      // Get all work items in this workspace (excluding current)
      const { data: workItems } = await supabase
        .from('work_items')
        .select('id, name, type')
        .eq('workspace_id', workspaceId)
        .neq('id', workItemId)

      setAvailableWorkItems(workItems || [])

      // Get all timeline items for the workspace
      const { data: allTimelineItems } = await supabase
        .from('timeline_items')
        .select('*')
        .eq('workspace_id', workspaceId)

      setTimelineItems(allTimelineItems || [])
    } catch (error) {
      console.error('Error loading link data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateLink = async () => {
    if (!selectedTimelineId || !selectedRelationship) return

    setLoading(true)
    try {
      // Get a timeline item from the current work item
      const { data: currentTimeline } = await supabase
        .from('timeline_items')
        .select('id')
        .eq('work_item_id', workItemId)
        .limit(1)
        .single()

      if (!currentTimeline) {
        alert('No timeline items found for this work item')
        return
      }

      // Create the link
      const { error } = await supabase.from('linked_items').insert({
        source_item_id: currentTimeline.id,
        target_item_id: selectedTimelineId,
        relationship_type: selectedRelationship,
        direction: 'outgoing',
        user_id: (await supabase.auth.getUser()).data.user?.id || '',
      })

      if (error) throw error

      // Reset form
      setSelectedWorkItemId('')
      setSelectedTimelineId('')
      setSelectedRelationship('relates_to')

      // Reload data
      await loadData()
      router.refresh()
    } catch (error: any) {
      console.error('Error creating link:', error)
      alert(error.message || 'Failed to create link')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteLink = async (linkId: string) => {
    setLoading(true)
    try {
      const { error } = await supabase.from('linked_items').delete().eq('id', linkId)

      if (error) throw error

      await loadData()
      router.refresh()
    } catch (error: any) {
      console.error('Error deleting link:', error)
      alert(error.message || 'Failed to delete link')
    } finally {
      setLoading(false)
    }
  }

  const getRelationshipColor = (relationship: string) => {
    switch (relationship) {
      case 'blocks':
        return 'bg-red-100 text-red-700 border-red-300'
      case 'depends_on':
        return 'bg-orange-100 text-orange-700 border-orange-300'
      case 'relates_to':
        return 'bg-blue-100 text-blue-700 border-blue-300'
      case 'complements':
        return 'bg-green-100 text-green-700 border-green-300'
      default:
        return 'bg-gray-100 text-gray-700 border-gray-300'
    }
  }

  const filteredTimelineItems = selectedWorkItemId
    ? timelineItems.filter((t) => t.work_item_id === selectedWorkItemId)
    : []

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="ghost" size="sm">
            <Link2 className="h-4 w-4 mr-2" />
            Manage Links
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Manage Links: {workItemName}</DialogTitle>
          <DialogDescription>
            Create and manage dependencies and relationships between work items
          </DialogDescription>
        </DialogHeader>

        {/* Existing Links */}
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-semibold mb-2">Existing Links ({existingLinks.length})</h3>
            {existingLinks.length > 0 ? (
              <div className="space-y-2">
                {existingLinks.map((link) => (
                  <div
                    key={link.id}
                    className="flex items-center justify-between p-3 border rounded-lg bg-slate-50"
                  >
                    <div className="flex items-center gap-3">
                      <Link2 className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <div className="font-medium text-sm">{link.targetWorkItemName}</div>
                        <div className="text-xs text-muted-foreground">
                          {link.targetTimelineName} phase
                        </div>
                      </div>
                      <Badge
                        variant="outline"
                        className={`${getRelationshipColor(link.relationshipType)} text-xs`}
                      >
                        {link.relationshipType.replace('_', ' ')}
                      </Badge>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteLink(link.id)}
                      disabled={loading}
                    >
                      <Trash2 className="h-4 w-4 text-red-600" />
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground py-4 text-center border rounded-lg">
                No links yet. Create one below.
              </p>
            )}
          </div>

          {/* Create New Link */}
          <div className="border-t pt-4">
            <h3 className="text-sm font-semibold mb-3">Create New Link</h3>
            <div className="space-y-3">
              <div className="grid gap-2">
                <Label htmlFor="target-work-item">Target Work Item</Label>
                <Select value={selectedWorkItemId} onValueChange={setSelectedWorkItemId}>
                  <SelectTrigger id="target-work-item">
                    <SelectValue placeholder="Select work item" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableWorkItems.map((item) => (
                      <SelectItem key={item.id} value={item.id}>
                        {item.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedWorkItemId && (
                <div className="grid gap-2">
                  <Label htmlFor="target-timeline">Target Timeline Phase</Label>
                  <Select value={selectedTimelineId} onValueChange={setSelectedTimelineId}>
                    <SelectTrigger id="target-timeline">
                      <SelectValue placeholder="Select timeline phase" />
                    </SelectTrigger>
                    <SelectContent>
                      {filteredTimelineItems.map((item) => (
                        <SelectItem key={item.id} value={item.id}>
                          {item.timeline} - {item.description || 'No description'}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="grid gap-2">
                <Label htmlFor="relationship-type">Relationship Type</Label>
                <Select value={selectedRelationship} onValueChange={setSelectedRelationship}>
                  <SelectTrigger id="relationship-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="relates_to">Relates To</SelectItem>
                    <SelectItem value="depends_on">Depends On</SelectItem>
                    <SelectItem value="blocks">Blocks</SelectItem>
                    <SelectItem value="complements">Complements</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button
                onClick={handleCreateLink}
                disabled={!selectedTimelineId || loading}
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Link
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
