'use client'

import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/hooks/use-toast'
import { useRouter } from 'next/navigation'
import {
  TimelineItemStatus,
  STATUS_METADATA,
  TIMELINE_ITEM_STATUSES
} from '@/lib/constants/work-item-types'
import { Loader2 } from 'lucide-react'

interface TimelineItem {
  id: string
  timeline: 'MVP' | 'SHORT' | 'LONG'
  status: TimelineItemStatus
  work_item_id: string
}

interface TimelineStatusManagerProps {
  workItemId: string
  timelineItems: TimelineItem[]
}

export function TimelineStatusManager({ workItemId, timelineItems }: TimelineStatusManagerProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  async function updateStatus(timelineItemId: string, newStatus: TimelineItemStatus) {
    try {
      setUpdatingId(timelineItemId)
      const supabase = createClient()

      const { error } = await supabase
        .from('timeline_items')
        .update({
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', timelineItemId)

      if (error) throw error

      toast({
        title: 'Status updated',
        description: `Timeline status changed to ${STATUS_METADATA[newStatus].label}`,
      })

      router.refresh()
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update status',
        variant: 'destructive',
      })
    } finally {
      setUpdatingId(null)
    }
  }

  function getStatusColor(status: TimelineItemStatus): string {
    const colorMap: Record<TimelineItemStatus, string> = {
      not_started: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
      planning: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      in_progress: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      blocked: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
      review: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
      completed: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      on_hold: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
      cancelled: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200 line-through',
    }
    return colorMap[status] || colorMap.not_started
  }

  // Group timeline items by timeline
  const timelineMap = {
    MVP: timelineItems.find(item => item.timeline === 'MVP'),
    SHORT: timelineItems.find(item => item.timeline === 'SHORT'),
    LONG: timelineItems.find(item => item.timeline === 'LONG'),
  }

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-medium">Timeline Status</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {(['MVP', 'SHORT', 'LONG'] as const).map((timeline) => {
          const item = timelineMap[timeline]

          return (
            <div key={timeline} className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">{timeline}</span>
                {item && (
                  <Badge className={getStatusColor(item.status)}>
                    {STATUS_METADATA[item.status].label}
                  </Badge>
                )}
              </div>

              {item ? (
                <Select
                  value={item.status}
                  onValueChange={(value) => updateStatus(item.id, value as TimelineItemStatus)}
                  disabled={updatingId === item.id}
                >
                  <SelectTrigger className="w-full">
                    {updatingId === item.id ? (
                      <span className="flex items-center">
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Updating...
                      </span>
                    ) : (
                      <SelectValue />
                    )}
                  </SelectTrigger>
                  <SelectContent>
                    {Object.values(TIMELINE_ITEM_STATUSES).map((status) => (
                      <SelectItem key={status} value={status}>
                        <span className="flex items-center gap-2">
                          <Badge className={getStatusColor(status)}>
                            {STATUS_METADATA[status].label}
                          </Badge>
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <p className="text-sm text-muted-foreground">No timeline item</p>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
