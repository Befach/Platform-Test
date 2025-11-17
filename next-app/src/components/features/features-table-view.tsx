'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Eye,
  Trash2,
  Link2,
  ChevronRight,
  ChevronDown,
} from 'lucide-react'
import Link from 'next/link'
import { getItemLabel, getItemIcon } from '@/lib/constants/work-item-types'
import { LinkManagementModal } from './link-management-modal'
import { ViewMode } from './work-items-filter'
import { ColumnVisibility } from './column-visibility-menu'
import {
  getStatusConfig,
  getPriorityConfig,
  getDifficultyConfig,
  TIMELINE_PHASE_CONFIG,
} from '@/lib/features/table-config'

interface WorkItem {
  id: string
  name: string
  type: string
  purpose: string | null
  status: string
  priority: string
  tags: string[] | null
  linkedItemsCount: number
  created_at: string
  updated_at: string
  created_by: string
}

interface TimelineItem {
  id: string
  work_item_id: string
  timeline: 'MVP' | 'SHORT' | 'LONG'
  description: string | null
  difficulty: string
  integration_system?: string | null
  integration_complexity?: string | null
  implementation_approach?: string | null
  implementation_tech_stack?: string[] | null
  implementation_estimated_duration?: string | null
}

interface FeaturesTableViewProps {
  workItems: WorkItem[]
  timelineItems: TimelineItem[]
  workspaceId: string
  onDelete: (id: string) => void
  viewMode: ViewMode
  columnVisibility: ColumnVisibility
}

export function FeaturesTableView({
  workItems,
  timelineItems,
  workspaceId,
  onDelete,
  viewMode,
  columnVisibility,
}: FeaturesTableViewProps) {
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())

  const toggleRowExpansion = (workItemId: string) => {
    setExpandedRows((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(workItemId)) {
        newSet.delete(workItemId)
      } else {
        newSet.add(workItemId)
      }
      return newSet
    })
  }

  const getTimelinesForWorkItem = (workItemId: string) => {
    return timelineItems.filter((t) => t.work_item_id === workItemId)
  }

  // Collapsed mode rendering: One row per work item with aggregated timeline info
  const renderCollapsedRow = (item: WorkItem) => {
    const timelines = getTimelinesForWorkItem(item.id)
    const mvpTimeline = timelines.find((t) => t.timeline === 'MVP')
    const shortTimeline = timelines.find((t) => t.timeline === 'SHORT')
    const longTimeline = timelines.find((t) => t.timeline === 'LONG')

    return (
      <TableRow key={item.id} className="hover:bg-slate-50/50 border-b border-slate-100">
        {/* Task Name */}
        <TableCell className="font-medium">
          <div className="flex items-center gap-2">
            <span className="text-lg">{getItemIcon(item.type)}</span>
            <span className="font-semibold">{item.name}</span>
          </div>
        </TableCell>

        {/* Type */}
        {columnVisibility.type && (
          <TableCell>
            <Badge variant="outline" className="text-xs">
              {getItemLabel(item.type)}
            </Badge>
          </TableCell>
        )}

        {/* Timeline - Aggregated badges */}
        {columnVisibility.timeline && (
          <TableCell>
            <div className="flex flex-wrap gap-1">
              {mvpTimeline && (
                <Badge variant="outline" className={`${TIMELINE_PHASE_CONFIG.MVP.color} text-xs`}>
                  {TIMELINE_PHASE_CONFIG.MVP.label} · {getDifficultyConfig(mvpTimeline.difficulty).label}
                </Badge>
              )}
              {shortTimeline && (
                <Badge variant="outline" className={`${TIMELINE_PHASE_CONFIG.SHORT.color} text-xs`}>
                  {TIMELINE_PHASE_CONFIG.SHORT.label} · {getDifficultyConfig(shortTimeline.difficulty).label}
                </Badge>
              )}
              {longTimeline && (
                <Badge variant="outline" className={`${TIMELINE_PHASE_CONFIG.LONG.color} text-xs`}>
                  {TIMELINE_PHASE_CONFIG.LONG.label} · {getDifficultyConfig(longTimeline.difficulty).label}
                </Badge>
              )}
              {timelines.length === 0 && (
                <span className="text-xs text-muted-foreground">No phases</span>
              )}
            </div>
          </TableCell>
        )}

        {/* Status */}
        {columnVisibility.status && (
          <TableCell>
            <Badge variant="outline" className={getStatusConfig(item.status).badgeColor}>
              {React.createElement(getStatusConfig(item.status).icon, { className: 'h-3 w-3 mr-1' })}
              {getStatusConfig(item.status).label}
            </Badge>
          </TableCell>
        )}

        {/* Priority */}
        {columnVisibility.priority && (
          <TableCell>
            <Badge variant="outline" className={getPriorityConfig(item.priority).badgeColor}>
              {React.createElement(getPriorityConfig(item.priority).icon, { className: 'h-3 w-3 mr-1' })}
              {getPriorityConfig(item.priority).label}
            </Badge>
          </TableCell>
        )}

        {/* Purpose */}
        {columnVisibility.purpose && (
          <TableCell>
            <div className="text-sm text-muted-foreground line-clamp-2 max-w-xs">
              {item.purpose || 'No description'}
            </div>
          </TableCell>
        )}

        {/* Integration */}
        {columnVisibility.integration && (
          <TableCell>
            <div className="text-xs">
              {mvpTimeline?.integration_system ? (
                <Badge variant="secondary" className="text-xs">
                  {mvpTimeline.integration_system}
                </Badge>
              ) : (
                <span className="text-muted-foreground">None</span>
              )}
            </div>
          </TableCell>
        )}

        {/* Tags */}
        {columnVisibility.tags && (
          <TableCell>
            {item.tags && item.tags.length > 0 ? (
              <div className="flex flex-wrap gap-1">
                {item.tags.slice(0, 2).map((tag) => (
                  <Badge key={tag} variant="secondary" className="text-xs">
                    {tag}
                  </Badge>
                ))}
                {item.tags.length > 2 && (
                  <Badge variant="secondary" className="text-xs">
                    +{item.tags.length - 2}
                  </Badge>
                )}
              </div>
            ) : (
              <span className="text-xs text-muted-foreground">No tags</span>
            )}
          </TableCell>
        )}

        {/* Links */}
        {columnVisibility.links && (
          <TableCell>
            <LinkManagementModal
              workItemId={item.id}
              workItemName={item.name}
              workspaceId={workspaceId}
              trigger={
                item.linkedItemsCount > 0 ? (
                  <Button variant="ghost" size="sm" className="h-7 px-2">
                    <Link2 className="h-3 w-3 mr-1" />
                    <Badge variant="outline" className="text-xs">
                      {item.linkedItemsCount}
                    </Badge>
                  </Button>
                ) : (
                  <Button variant="ghost" size="sm" className="h-7 px-2">
                    <Link2 className="h-3 w-3 mr-1" />
                    <span className="text-xs">Add</span>
                  </Button>
                )
              }
            />
          </TableCell>
        )}

        {/* Date */}
        {columnVisibility.date && (
          <TableCell>
            <div className="text-xs text-muted-foreground">
              {new Date(item.created_at).toLocaleDateString()}
            </div>
          </TableCell>
        )}

        {/* Actions */}
        <TableCell className="text-right">
          <div className="flex items-center justify-end gap-1">
            <Link href={`/workspaces/${workspaceId}/features/${item.id}`}>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <Eye className="h-4 w-4" />
              </Button>
            </Link>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onDelete(item.id)}
              className="h-8 w-8"
            >
              <Trash2 className="h-4 w-4 text-red-600" />
            </Button>
          </div>
        </TableCell>
      </TableRow>
    )
  }

  // Expanded mode rendering: Parent row + child rows for each timeline phase
  const renderExpandedRows = (item: WorkItem) => {
    const timelines = getTimelinesForWorkItem(item.id)
    const isExpanded = expandedRows.has(item.id)

    return (
      <React.Fragment key={item.id}>
        {/* Parent Row */}
        <TableRow className="hover:bg-slate-50/50 border-b border-slate-100">
          {/* Expand/Collapse Button + Task Name */}
          <TableCell className="font-medium">
            <div className="flex items-center gap-2">
              {timelines.length > 0 ? (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => toggleRowExpansion(item.id)}
                  className="h-6 w-6 p-0"
                >
                  {isExpanded ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </Button>
              ) : (
                <div className="w-6" />
              )}
              <span className="text-lg">{getItemIcon(item.type)}</span>
              <span className="font-semibold">{item.name}</span>
            </div>
          </TableCell>

          {/* Type */}
          {columnVisibility.type && (
            <TableCell>
              <Badge variant="outline" className="text-xs">
                {getItemLabel(item.type)}
              </Badge>
            </TableCell>
          )}

          {/* Timeline - Summary */}
          {columnVisibility.timeline && (
            <TableCell>
              <div className="text-sm text-muted-foreground">
                {timelines.length > 0 ? `${timelines.length} phase${timelines.length > 1 ? 's' : ''}` : 'No phases'}
              </div>
            </TableCell>
          )}

          {/* Status */}
          {columnVisibility.status && (
            <TableCell>
              <Badge variant="outline" className={getStatusConfig(item.status).badgeColor}>
                {React.createElement(getStatusConfig(item.status).icon, { className: 'h-3 w-3 mr-1' })}
                {getStatusConfig(item.status).label}
              </Badge>
            </TableCell>
          )}

          {/* Priority */}
          {columnVisibility.priority && (
            <TableCell>
              <Badge variant="outline" className={getPriorityConfig(item.priority).badgeColor}>
                {React.createElement(getPriorityConfig(item.priority).icon, { className: 'h-3 w-3 mr-1' })}
                {getPriorityConfig(item.priority).label}
              </Badge>
            </TableCell>
          )}

          {/* Purpose */}
          {columnVisibility.purpose && (
            <TableCell>
              <div className="text-sm text-muted-foreground line-clamp-2 max-w-xs">
                {item.purpose || 'No description'}
              </div>
            </TableCell>
          )}

          {/* Integration */}
          {columnVisibility.integration && (
            <TableCell>
              <span className="text-xs text-muted-foreground">See phases</span>
            </TableCell>
          )}

          {/* Tags */}
          {columnVisibility.tags && (
            <TableCell>
              {item.tags && item.tags.length > 0 ? (
                <div className="flex flex-wrap gap-1">
                  {item.tags.slice(0, 2).map((tag) => (
                    <Badge key={tag} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                  {item.tags.length > 2 && (
                    <Badge variant="secondary" className="text-xs">
                      +{item.tags.length - 2}
                    </Badge>
                  )}
                </div>
              ) : (
                <span className="text-xs text-muted-foreground">No tags</span>
              )}
            </TableCell>
          )}

          {/* Links */}
          {columnVisibility.links && (
            <TableCell>
              <LinkManagementModal
                workItemId={item.id}
                workItemName={item.name}
                workspaceId={workspaceId}
                trigger={
                  item.linkedItemsCount > 0 ? (
                    <Button variant="ghost" size="sm" className="h-7 px-2">
                      <Link2 className="h-3 w-3 mr-1" />
                      <Badge variant="outline" className="text-xs">
                        {item.linkedItemsCount}
                      </Badge>
                    </Button>
                  ) : (
                    <Button variant="ghost" size="sm" className="h-7 px-2">
                      <Link2 className="h-3 w-3 mr-1" />
                      <span className="text-xs">Add</span>
                    </Button>
                  )
                }
              />
            </TableCell>
          )}

          {/* Date */}
          {columnVisibility.date && (
            <TableCell>
              <div className="text-xs text-muted-foreground">
                {new Date(item.created_at).toLocaleDateString()}
              </div>
            </TableCell>
          )}

          {/* Actions */}
          <TableCell className="text-right">
            <div className="flex items-center justify-end gap-1">
              <Link href={`/workspaces/${workspaceId}/features/${item.id}`}>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <Eye className="h-4 w-4" />
                </Button>
              </Link>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onDelete(item.id)}
                className="h-8 w-8"
              >
                <Trash2 className="h-4 w-4 text-red-600" />
              </Button>
            </div>
          </TableCell>
        </TableRow>

        {/* Child Rows - Timeline Phases */}
        {isExpanded &&
          timelines.map((timeline) => (
            <TableRow
              key={timeline.id}
              className="bg-slate-50/30 hover:bg-slate-50/50 border-b border-slate-100"
            >
              {/* Indented Phase Name */}
              <TableCell className="font-medium pl-12">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-px bg-slate-300" />
                  <Badge
                    variant="outline"
                    className={`${TIMELINE_PHASE_CONFIG[timeline.timeline as keyof typeof TIMELINE_PHASE_CONFIG].color} text-xs`}
                  >
                    {TIMELINE_PHASE_CONFIG[timeline.timeline as keyof typeof TIMELINE_PHASE_CONFIG].label}
                  </Badge>
                  <Badge
                    variant="outline"
                    className={`${getDifficultyConfig(timeline.difficulty).color} text-xs`}
                  >
                    {getDifficultyConfig(timeline.difficulty).label}
                  </Badge>
                </div>
              </TableCell>

              {/* Type */}
              {columnVisibility.type && <TableCell></TableCell>}

              {/* Timeline Description */}
              {columnVisibility.timeline && (
                <TableCell>
                  <div className="text-xs text-muted-foreground line-clamp-2">
                    {timeline.description || 'No description'}
                  </div>
                </TableCell>
              )}

              {/* Status - Empty for child rows */}
              {columnVisibility.status && <TableCell></TableCell>}

              {/* Priority - Empty for child rows */}
              {columnVisibility.priority && <TableCell></TableCell>}

              {/* Purpose - Empty for child rows */}
              {columnVisibility.purpose && <TableCell></TableCell>}

              {/* Integration */}
              {columnVisibility.integration && (
                <TableCell>
                  <div className="space-y-1">
                    {timeline.integration_system && (
                      <Badge variant="secondary" className="text-xs">
                        {timeline.integration_system}
                      </Badge>
                    )}
                    {timeline.integration_complexity && (
                      <div className="text-xs text-muted-foreground">
                        {timeline.integration_complexity}
                      </div>
                    )}
                  </div>
                </TableCell>
              )}

              {/* Tags - Empty for child rows */}
              {columnVisibility.tags && <TableCell></TableCell>}

              {/* Links - Empty for child rows */}
              {columnVisibility.links && <TableCell></TableCell>}

              {/* Date - Empty for child rows */}
              {columnVisibility.date && <TableCell></TableCell>}

              {/* Actions - Empty for child rows */}
              <TableCell></TableCell>
            </TableRow>
          ))}
      </React.Fragment>
    )
  }

  return (
    <div className="rounded-lg border bg-white overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-slate-50 hover:bg-slate-50">
            <TableHead className="font-semibold">Task</TableHead>
            {columnVisibility.type && <TableHead className="font-semibold">Type</TableHead>}
            {columnVisibility.timeline && (
              <TableHead className="font-semibold">
                {viewMode === 'collapsed' ? 'Timeline' : 'Timeline / Phase'}
              </TableHead>
            )}
            {columnVisibility.status && <TableHead className="font-semibold">Status</TableHead>}
            {columnVisibility.priority && <TableHead className="font-semibold">Priority</TableHead>}
            {columnVisibility.purpose && <TableHead className="font-semibold">Purpose</TableHead>}
            {columnVisibility.integration && <TableHead className="font-semibold">Integration</TableHead>}
            {columnVisibility.tags && <TableHead className="font-semibold">Tags</TableHead>}
            {columnVisibility.links && <TableHead className="font-semibold">Links</TableHead>}
            {columnVisibility.date && <TableHead className="font-semibold">Date</TableHead>}
            <TableHead className="text-right font-semibold">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {workItems.length > 0 ? (
            <>
              {workItems.map((item) =>
                viewMode === 'collapsed' ? renderCollapsedRow(item) : renderExpandedRows(item)
              )}
            </>
          ) : (
            <TableRow>
              <TableCell
                colSpan={
                  1 +
                  (columnVisibility.type ? 1 : 0) +
                  (columnVisibility.timeline ? 1 : 0) +
                  (columnVisibility.status ? 1 : 0) +
                  (columnVisibility.priority ? 1 : 0) +
                  (columnVisibility.purpose ? 1 : 0) +
                  (columnVisibility.integration ? 1 : 0) +
                  (columnVisibility.tags ? 1 : 0) +
                  (columnVisibility.links ? 1 : 0) +
                  (columnVisibility.date ? 1 : 0) +
                  1
                }
                className="text-center py-12"
              >
                <div className="text-6xl mb-4">📋</div>
                <h3 className="text-lg font-semibold mb-2">No work items found</h3>
                <p className="text-muted-foreground">
                  Try adjusting your filters or create a new work item
                </p>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  )
}
