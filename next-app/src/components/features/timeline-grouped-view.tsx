'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'
import { Eye, Trash2, Calendar } from 'lucide-react'
import { getItemIcon, getItemLabel } from '@/lib/constants/work-item-types'
import type { WorkItem, TimelineItem } from '@/lib/features/types'

interface TimelineGroupedViewProps {
  workItems: WorkItem[]
  timelineItems: TimelineItem[]
  workspaceId: string
  onDelete: (id: string) => void
}

export function TimelineGroupedView({
  workItems,
  timelineItems,
  workspaceId,
  onDelete,
}: TimelineGroupedViewProps) {
  // Group timeline items by work item
  const getTimelinesForWorkItem = (workItemId: string) => {
    return timelineItems.filter((t) => t.work_item_id === workItemId)
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy':
        return 'bg-green-100 text-green-700 border-green-300'
      case 'medium':
        return 'bg-yellow-100 text-yellow-700 border-yellow-300'
      case 'hard':
        return 'bg-red-100 text-red-700 border-red-300'
      default:
        return 'bg-gray-100 text-gray-700 border-gray-300'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'not_started':
        return 'bg-gray-100 text-gray-700 border-gray-300'
      case 'in_progress':
        return 'bg-blue-100 text-blue-700 border-blue-300'
      case 'completed':
        return 'bg-green-100 text-green-700 border-green-300'
      case 'on_hold':
        return 'bg-orange-100 text-orange-700 border-orange-300'
      case 'cancelled':
        return 'bg-red-100 text-red-700 border-red-300'
      default:
        return 'bg-gray-100 text-gray-700 border-gray-300'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'low':
        return 'bg-slate-100 text-slate-700 border-slate-300'
      case 'medium':
        return 'bg-blue-100 text-blue-700 border-blue-300'
      case 'high':
        return 'bg-orange-100 text-orange-700 border-orange-300'
      case 'critical':
        return 'bg-red-100 text-red-700 border-red-300'
      default:
        return 'bg-slate-100 text-slate-700 border-slate-300'
    }
  }

  return (
    <div className="space-y-4">
      {workItems.map((item) => {
        const timelines = getTimelinesForWorkItem(item.id)

        return (
          <Card key={item.id}>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xl">{getItemIcon(item.type)}</span>
                    <CardTitle className="text-lg">{item.name}</CardTitle>
                  </div>
                  {item.purpose && (
                    <p className="text-sm text-muted-foreground mt-1">
                      {item.purpose}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2 ml-4">
                  <Link href={`/workspaces/${workspaceId}/features/${item.id}`}>
                    <Button variant="ghost" size="icon" title="View details">
                      <Eye className="h-4 w-4" />
                    </Button>
                  </Link>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onDelete(item.id)}
                    title="Delete work item"
                  >
                    <Trash2 className="h-4 w-4 text-red-600" />
                  </Button>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 mt-3">
                <Badge className={getStatusColor(item.status)} variant="outline">
                  {item.status.replace('_', ' ')}
                </Badge>
                <Badge className={getPriorityColor(item.priority)} variant="outline">
                  {item.priority}
                </Badge>
                <Badge variant="outline" className="bg-purple-100 text-purple-700 border-purple-300">
                  {getItemLabel(item.type)}
                </Badge>
                <span className="text-xs text-muted-foreground ml-auto">
                  Created: {new Date(item.created_at).toLocaleDateString()}
                </span>
              </div>

              {/* Tags */}
              {item.tags && item.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {item.tags.map((tag: string) => (
                    <Badge key={tag} variant="secondary" className="text-xs">
                      #{tag}
                    </Badge>
                  ))}
                </div>
              )}

              {/* Work Item ID for debugging */}
              <div className="mt-2">
                <span className="text-xs text-muted-foreground">
                  ID: {item.id.slice(0, 12)}...
                </span>
              </div>
            </CardHeader>

            {timelines.length > 0 && (
              <CardContent className="space-y-3">
                <div className="border-t pt-3">
                  <h4 className="text-sm font-semibold mb-3 text-muted-foreground">
                    Timeline Breakdown ({timelines.length} phase{timelines.length !== 1 ? 's' : ''})
                  </h4>
                  {timelines
                    .sort((a, b) => {
                      const order = { MVP: 0, SHORT: 1, LONG: 2 }
                      return order[a.timeline] - order[b.timeline]
                    })
                    .map((timeline) => (
                      <div
                        key={timeline.id}
                        className="border rounded-lg p-4 mb-3 bg-gradient-to-r from-slate-50 to-white hover:shadow-sm transition-shadow"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <Badge
                              variant="outline"
                              className={
                                timeline.timeline === 'MVP'
                                  ? 'bg-green-100 text-green-700 border-green-300'
                                  : timeline.timeline === 'SHORT'
                                  ? 'bg-blue-100 text-blue-700 border-blue-300'
                                  : 'bg-purple-100 text-purple-700 border-purple-300'
                              }
                            >
                              {timeline.timeline}
                            </Badge>
                            <Badge
                              variant="outline"
                              className={getDifficultyColor(timeline.difficulty)}
                            >
                              {timeline.difficulty}
                            </Badge>
                          </div>
                        </div>

                        {timeline.description && (
                          <div className="mb-3">
                            <p className="text-sm font-medium text-gray-700 mb-1">Description:</p>
                            <p className="text-sm text-muted-foreground">
                              {timeline.description}
                            </p>
                          </div>
                        )}

                        {/* Integration Information */}
                        {timeline.integration_system && (
                          <div className="mb-2">
                            <p className="text-sm font-medium text-gray-700 mb-1">Integration:</p>
                            <div className="flex items-center gap-2">
                              <Badge variant="secondary" className="text-xs">
                                {timeline.integration_system}
                              </Badge>
                              {timeline.integration_complexity && (
                                <Badge variant="outline" className="text-xs">
                                  {timeline.integration_complexity} complexity
                                </Badge>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Implementation Details */}
                        {timeline.implementation_approach && (
                          <div className="mb-2">
                            <p className="text-sm font-medium text-gray-700 mb-1">Implementation:</p>
                            <p className="text-xs text-muted-foreground">
                              {timeline.implementation_approach}
                            </p>
                          </div>
                        )}

                        {/* Tech Stack */}
                        {timeline.implementation_tech_stack && (
                          <div className="mb-2">
                            <p className="text-sm font-medium text-gray-700 mb-1">Tech Stack:</p>
                            <div className="flex flex-wrap gap-1">
                              {timeline.implementation_tech_stack.map((tech: string) => (
                                <Badge key={tech} variant="outline" className="text-xs">
                                  {tech}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Estimated Duration */}
                        {timeline.implementation_estimated_duration && (
                          <div>
                            <p className="text-sm font-medium text-gray-700 mb-1">Estimated Duration:</p>
                            <p className="text-xs text-muted-foreground">
                              {timeline.implementation_estimated_duration}
                            </p>
                          </div>
                        )}
                      </div>
                    ))}
                </div>
              </CardContent>
            )}

            {timelines.length === 0 && (
              <CardContent>
                <p className="text-sm text-muted-foreground text-center py-2">
                  No timeline breakdown yet
                </p>
              </CardContent>
            )}
          </Card>
        )
      })}

      {workItems.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <div className="text-6xl mb-4">📋</div>
            <h3 className="text-lg font-semibold mb-2">No work items found</h3>
            <p className="text-muted-foreground">
              Try adjusting your filters or create a new work item
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
