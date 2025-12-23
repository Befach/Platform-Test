'use client'

import React, { useState, useCallback } from 'react'
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
  Pencil,
} from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { getItemLabel, getItemIcon } from '@/lib/constants/work-item-types'
import { LinkManagementModal } from './link-management-modal'
import { ViewMode } from './work-items-filter'
import { ColumnVisibility } from './column-visibility-menu'
import {
  getStatusConfig,
  getPriorityConfig,
  getDifficultyConfig,
  TIMELINE_PHASE_CONFIG,
} from '@/lib/work-items/table-config'
import { EditWorkItemDialog } from '@/components/work-items/edit-work-item-dialog'
import { WorkspacePhase } from '@/lib/constants/workspace-phases'
import { DepartmentBadge } from '@/components/departments/department-badge'
import {
  InlineStatusEditor,
  InlinePriorityEditor,
  InlineTypeEditor,
} from '@/components/inline-editors'
import { useToast } from '@/hooks/use-toast'

interface WorkItem {
  id: string
  name: string
  type: string
  purpose: string | null
  phase: string
  priority: string
  tags: string[] | null
  linkedItemsCount: number
  created_at: string
  updated_at: string
  created_by: string
  department_id?: string | null
  department?: {
    id: string
    name: string
    color: string
    icon: string
  } | null
}

interface TimelineItem {
  id: string
  work_item_id: string
  timeline: 'MVP' | 'SHORT' | 'LONG'
  description: string | null
  difficulty: string
  status: string | null // Timeline items have separate status field for task execution
}

interface WorkItemsTableViewProps {
  workItems: WorkItem[]
  timelineItems: TimelineItem[]
  workspaceId: string
  workspacePhase?: WorkspacePhase  // Now optional - will be removed in F.5
  onDelete: (id: string) => void
  viewMode: ViewMode
  columnVisibility: ColumnVisibility
}

export function WorkItemsTableView({
  workItems,
  timelineItems,
  workspaceId,
  workspacePhase,
  onDelete,
  viewMode,
  columnVisibility,
}: WorkItemsTableViewProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [selectedWorkItem, setSelectedWorkItem] = useState<string | null>(null)

  // Inline edit handler
  const handleInlineUpdate = useCallback(async (
    workItemId: string,
    field: string,
    value: string
  ) => {
    try {
      const response = await fetch(`/api/work-items/${workItemId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [field]: value }),
      })

      if (!response.ok) throw new Error('Failed to update')

      toast({
        title: 'Updated',
        description: `${field.charAt(0).toUpperCase() + field.slice(1)} changed successfully`,
      })
      router.refresh()
    } catch {
      toast({
        title: 'Error',
        description: `Failed to update ${field}`,
        variant: 'destructive',
      })
    }
  }, [router, toast])

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
      <TableRow key={item.id} className="h-11 hover:bg-muted/50 transition-colors border-b">
        {/* Task Name */}
        <TableCell className="font-medium px-3 py-2">
          <div className="flex items-center gap-2">
            <span className="text-base">{getItemIcon(item.type)}</span>
            <span className="font-medium text-sm">{item.name}</span>
          </div>
        </TableCell>

        {/* Type - Inline Editable */}
        {columnVisibility.type && (
          <TableCell className="px-3 py-2">
            <InlineTypeEditor
              value={item.type}
              onValueChange={(value) => handleInlineUpdate(item.id, 'type', value)}
              variant="badge"
            />
          </TableCell>
        )}

        {/* Timeline - Aggregated badges */}
        {columnVisibility.timeline && (
          <TableCell className="px-3 py-2">
            <div className="flex flex-col gap-1.5">
              {/* Timeline phases and difficulty */}
              <div className="flex flex-wrap gap-1">
                {mvpTimeline && (
                  <Badge variant="outline" className={`${TIMELINE_PHASE_CONFIG.MVP.color} px-1.5 py-0.5 text-[10px] font-medium`}>
                    {TIMELINE_PHASE_CONFIG.MVP.label} · {getDifficultyConfig(mvpTimeline.difficulty).label}
                  </Badge>
                )}
                {shortTimeline && (
                  <Badge variant="outline" className={`${TIMELINE_PHASE_CONFIG.SHORT.color} px-1.5 py-0.5 text-[10px] font-medium`}>
                    {TIMELINE_PHASE_CONFIG.SHORT.label} · {getDifficultyConfig(shortTimeline.difficulty).label}
                  </Badge>
                )}
                {longTimeline && (
                  <Badge variant="outline" className={`${TIMELINE_PHASE_CONFIG.LONG.color} px-1.5 py-0.5 text-[10px] font-medium`}>
                    {TIMELINE_PHASE_CONFIG.LONG.label} · {getDifficultyConfig(longTimeline.difficulty).label}
                  </Badge>
                )}
                {timelines.length === 0 && (
                  <span className="text-[11px] text-muted-foreground">No phases</span>
                )}
              </div>

              {/* Timeline status badges - compact format */}
              {timelines.length > 0 && timelines.some(t => t.status) && (
                <div className="flex flex-wrap gap-1">
                  {mvpTimeline?.status && (
                    <Badge
                      variant="outline"
                      className={`${getStatusConfig(mvpTimeline.status).badgeColor} px-1.5 py-0.5 text-[10px] font-medium`}
                    >
                      {React.createElement(getStatusConfig(mvpTimeline.status).icon, { className: 'h-2 w-2 mr-0.5 inline' })}
                      MVP: {getStatusConfig(mvpTimeline.status).label}
                    </Badge>
                  )}
                  {shortTimeline?.status && (
                    <Badge
                      variant="outline"
                      className={`${getStatusConfig(shortTimeline.status).badgeColor} px-1.5 py-0.5 text-[10px] font-medium`}
                    >
                      {React.createElement(getStatusConfig(shortTimeline.status).icon, { className: 'h-2 w-2 mr-0.5 inline' })}
                      Short: {getStatusConfig(shortTimeline.status).label}
                    </Badge>
                  )}
                  {longTimeline?.status && (
                    <Badge
                      variant="outline"
                      className={`${getStatusConfig(longTimeline.status).badgeColor} px-1.5 py-0.5 text-[10px] font-medium`}
                    >
                      {React.createElement(getStatusConfig(longTimeline.status).icon, { className: 'h-2 w-2 mr-0.5 inline' })}
                      Long: {getStatusConfig(longTimeline.status).label}
                    </Badge>
                  )}
                </div>
              )}
            </div>
          </TableCell>
        )}

        {/* Phase - Inline Editable (Phase IS the status) */}
        {columnVisibility.phase && (
          <TableCell className="px-3 py-2">
            <InlineStatusEditor
              value={item.phase}
              onValueChange={(value) => handleInlineUpdate(item.id, 'phase', value)}
              variant="badge"
            />
          </TableCell>
        )}

        {/* Priority - Inline Editable */}
        {columnVisibility.priority && (
          <TableCell className="px-3 py-2">
            <InlinePriorityEditor
              value={item.priority}
              onValueChange={(value) => handleInlineUpdate(item.id, 'priority', value)}
              variant="badge"
            />
          </TableCell>
        )}

        {/* Department */}
        {columnVisibility.department && (
          <TableCell className="px-3 py-2">
            {item.department ? (
              <DepartmentBadge
                department={item.department}
                size="sm"
              />
            ) : (
              <span className="text-[11px] text-muted-foreground">No dept</span>
            )}
          </TableCell>
        )}

        {/* Purpose */}
        {columnVisibility.purpose && (
          <TableCell className="px-3 py-2">
            <div className="text-xs text-muted-foreground line-clamp-1 max-w-xs">
              {item.purpose || 'No description'}
            </div>
          </TableCell>
        )}

        {/* Integration */}
        {columnVisibility.integration && (
          <TableCell className="px-3 py-2">
            <div className="text-xs">
              <span className="text-[11px] text-muted-foreground">-</span>
            </div>
          </TableCell>
        )}

        {/* Tags */}
        {columnVisibility.tags && (
          <TableCell className="px-3 py-2">
            {item.tags && item.tags.length > 0 ? (
              <div className="flex flex-wrap gap-1">
                {item.tags.slice(0, 2).map((tag) => (
                  <Badge key={tag} variant="secondary" className="px-1.5 py-0.5 text-[10px] font-medium">
                    {tag}
                  </Badge>
                ))}
                {item.tags.length > 2 && (
                  <Badge variant="secondary" className="px-1.5 py-0.5 text-[10px] font-medium">
                    +{item.tags.length - 2}
                  </Badge>
                )}
              </div>
            ) : (
              <span className="text-[11px] text-muted-foreground">No tags</span>
            )}
          </TableCell>
        )}

        {/* Links */}
        {columnVisibility.links && (
          <TableCell className="px-3 py-2">
            <LinkManagementModal
              workItemId={item.id}
              workItemName={item.name}
              workspaceId={workspaceId}
              trigger={
                item.linkedItemsCount > 0 ? (
                  <Button variant="ghost" size="sm" className="h-6 px-2">
                    <Link2 className="h-3 w-3 mr-1" />
                    <Badge variant="outline" className="px-1 py-0 text-[10px]">
                      {item.linkedItemsCount}
                    </Badge>
                  </Button>
                ) : (
                  <Button variant="ghost" size="sm" className="h-6 px-2">
                    <Link2 className="h-3 w-3 mr-1" />
                    <span className="text-[10px]">Add</span>
                  </Button>
                )
              }
            />
          </TableCell>
        )}

        {/* Date */}
        {columnVisibility.date && (
          <TableCell className="px-3 py-2">
            <div className="text-[11px] text-muted-foreground">
              {new Date(item.created_at).toLocaleDateString()}
            </div>
          </TableCell>
        )}

        {/* Actions */}
        <TableCell className="text-right px-3 py-2">
          <div className="flex items-center justify-end gap-0.5">
            <Link href={`/workspaces/${workspaceId}/features/${item.id}`}>
              <Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-muted">
                <Eye className="h-3.5 w-3.5" />
              </Button>
            </Link>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                setSelectedWorkItem(item.id)
                setEditDialogOpen(true)
              }}
              className="h-7 w-7 hover:bg-muted"
            >
              <Pencil className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onDelete(item.id)}
              className="h-7 w-7 hover:bg-red-50 hover:text-red-600"
            >
              <Trash2 className="h-3.5 w-3.5" />
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
        <TableRow className="h-11 hover:bg-muted/50 transition-colors border-b">
          {/* Expand/Collapse Button + Task Name */}
          <TableCell className="font-medium px-3 py-2">
            <div className="flex items-center gap-2">
              {timelines.length > 0 ? (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => toggleRowExpansion(item.id)}
                  className="h-5 w-5 p-0 hover:bg-muted"
                >
                  {isExpanded ? (
                    <ChevronDown className="h-3.5 w-3.5" />
                  ) : (
                    <ChevronRight className="h-3.5 w-3.5" />
                  )}
                </Button>
              ) : (
                <div className="w-5" />
              )}
              <span className="text-base">{getItemIcon(item.type)}</span>
              <span className="font-medium text-sm">{item.name}</span>
            </div>
          </TableCell>

          {/* Type - Inline Editable */}
          {columnVisibility.type && (
            <TableCell className="px-3 py-2">
              <InlineTypeEditor
                value={item.type}
                onValueChange={(value) => handleInlineUpdate(item.id, 'type', value)}
                variant="badge"
              />
            </TableCell>
          )}

          {/* Timeline - Summary */}
          {columnVisibility.timeline && (
            <TableCell className="px-3 py-2">
              <div className="text-xs text-muted-foreground">
                {timelines.length > 0 ? `${timelines.length} phase${timelines.length > 1 ? 's' : ''}` : 'No phases'}
              </div>
            </TableCell>
          )}

          {/* Phase - Inline Editable */}
          {columnVisibility.phase && (
            <TableCell className="px-3 py-2">
              <InlineStatusEditor
                value={item.phase}
                onValueChange={(value) => handleInlineUpdate(item.id, 'phase', value)}
                variant="badge"
              />
            </TableCell>
          )}

          {/* Priority - Inline Editable */}
          {columnVisibility.priority && (
            <TableCell className="px-3 py-2">
              <InlinePriorityEditor
                value={item.priority}
                onValueChange={(value) => handleInlineUpdate(item.id, 'priority', value)}
                variant="badge"
              />
            </TableCell>
          )}

          {/* Department */}
          {columnVisibility.department && (
            <TableCell className="px-3 py-2">
              {item.department ? (
                <DepartmentBadge
                  department={item.department}
                  size="sm"
                />
              ) : (
                <span className="text-[11px] text-muted-foreground">No dept</span>
              )}
            </TableCell>
          )}

          {/* Purpose */}
          {columnVisibility.purpose && (
            <TableCell className="px-3 py-2">
              <div className="text-xs text-muted-foreground line-clamp-1 max-w-xs">
                {item.purpose || 'No description'}
              </div>
            </TableCell>
          )}

          {/* Integration */}
          {columnVisibility.integration && (
            <TableCell className="px-3 py-2">
              <span className="text-[11px] text-muted-foreground">See phases</span>
            </TableCell>
          )}

          {/* Tags */}
          {columnVisibility.tags && (
            <TableCell className="px-3 py-2">
              {item.tags && item.tags.length > 0 ? (
                <div className="flex flex-wrap gap-1">
                  {item.tags.slice(0, 2).map((tag) => (
                    <Badge key={tag} variant="secondary" className="px-1.5 py-0.5 text-[10px] font-medium">
                      {tag}
                    </Badge>
                  ))}
                  {item.tags.length > 2 && (
                    <Badge variant="secondary" className="px-1.5 py-0.5 text-[10px] font-medium">
                      +{item.tags.length - 2}
                    </Badge>
                  )}
                </div>
              ) : (
                <span className="text-[11px] text-muted-foreground">No tags</span>
              )}
            </TableCell>
          )}

          {/* Links */}
          {columnVisibility.links && (
            <TableCell className="px-3 py-2">
              <LinkManagementModal
                workItemId={item.id}
                workItemName={item.name}
                workspaceId={workspaceId}
                trigger={
                  item.linkedItemsCount > 0 ? (
                    <Button variant="ghost" size="sm" className="h-6 px-2">
                      <Link2 className="h-3 w-3 mr-1" />
                      <Badge variant="outline" className="px-1 py-0 text-[10px]">
                        {item.linkedItemsCount}
                      </Badge>
                    </Button>
                  ) : (
                    <Button variant="ghost" size="sm" className="h-6 px-2">
                      <Link2 className="h-3 w-3 mr-1" />
                      <span className="text-[10px]">Add</span>
                    </Button>
                  )
                }
              />
            </TableCell>
          )}

          {/* Date */}
          {columnVisibility.date && (
            <TableCell className="px-3 py-2">
              <div className="text-[11px] text-muted-foreground">
                {new Date(item.created_at).toLocaleDateString()}
              </div>
            </TableCell>
          )}

          {/* Actions */}
          <TableCell className="text-right px-3 py-2">
            <div className="flex items-center justify-end gap-0.5">
              <Link href={`/workspaces/${workspaceId}/features/${item.id}`}>
                <Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-muted">
                  <Eye className="h-3.5 w-3.5" />
                </Button>
              </Link>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  setSelectedWorkItem(item.id)
                  setEditDialogOpen(true)
                }}
                className="h-7 w-7 hover:bg-muted"
              >
                <Pencil className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onDelete(item.id)}
                className="h-7 w-7 hover:bg-red-50 hover:text-red-600"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          </TableCell>
        </TableRow>

        {/* Child Rows - Timeline Phases */}
        {isExpanded &&
          timelines.map((timeline) => (
            <TableRow
              key={timeline.id}
              className="h-10 bg-muted/20 hover:bg-muted/30 transition-colors border-b"
            >
              {/* Indented Phase Name */}
              <TableCell className="font-medium pl-10 px-3 py-2">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-px bg-border" />
                  <Badge
                    variant="outline"
                    className={`${TIMELINE_PHASE_CONFIG[timeline.timeline as keyof typeof TIMELINE_PHASE_CONFIG].color} px-1.5 py-0.5 text-[10px] font-medium`}
                  >
                    {TIMELINE_PHASE_CONFIG[timeline.timeline as keyof typeof TIMELINE_PHASE_CONFIG].label}
                  </Badge>
                  <Badge
                    variant="outline"
                    className={`${getDifficultyConfig(timeline.difficulty).color} px-1.5 py-0.5 text-[10px] font-medium`}
                  >
                    {getDifficultyConfig(timeline.difficulty).label}
                  </Badge>
                </div>
              </TableCell>

              {/* Type */}
              {columnVisibility.type && <TableCell className="px-3 py-2"></TableCell>}

              {/* Timeline Description */}
              {columnVisibility.timeline && (
                <TableCell className="px-3 py-2">
                  <div className="text-[11px] text-muted-foreground line-clamp-1">
                    {timeline.description || 'No description'}
                  </div>
                </TableCell>
              )}

              {/* Phase - Empty for child rows */}
              {columnVisibility.phase && <TableCell className="px-3 py-2"></TableCell>}

              {/* Priority - Empty for child rows */}
              {columnVisibility.priority && <TableCell className="px-3 py-2"></TableCell>}

              {/* Department - Empty for child rows */}
              {columnVisibility.department && <TableCell className="px-3 py-2"></TableCell>}

              {/* Purpose - Empty for child rows */}
              {columnVisibility.purpose && <TableCell className="px-3 py-2"></TableCell>}

              {/* Integration */}
              {columnVisibility.integration && (
                <TableCell className="px-3 py-2">
                  <div className="text-xs">
                    <span className="text-[11px] text-muted-foreground">-</span>
                  </div>
                </TableCell>
              )}

              {/* Tags - Empty for child rows */}
              {columnVisibility.tags && <TableCell className="px-3 py-2"></TableCell>}

              {/* Links - Empty for child rows */}
              {columnVisibility.links && <TableCell className="px-3 py-2"></TableCell>}

              {/* Date - Empty for child rows */}
              {columnVisibility.date && <TableCell className="px-3 py-2"></TableCell>}

              {/* Actions - Empty for child rows */}
              <TableCell className="px-3 py-2"></TableCell>
            </TableRow>
          ))}
      </React.Fragment>
    )
  }

  return (
    <div className="rounded-lg border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="h-9 bg-muted/40 hover:bg-muted/40 border-b">
            <TableHead className="font-semibold text-xs px-3 py-2">Work Item</TableHead>
            {columnVisibility.type && <TableHead className="font-semibold text-xs px-3 py-2">Type</TableHead>}
            {columnVisibility.timeline && (
              <TableHead className="font-semibold text-xs px-3 py-2">
                {viewMode === 'collapsed' ? 'Timeline' : 'Timeline / Phase'}
              </TableHead>
            )}
            {columnVisibility.phase && <TableHead className="font-semibold text-xs px-3 py-2">Phase</TableHead>}
            {columnVisibility.priority && <TableHead className="font-semibold text-xs px-3 py-2">Priority</TableHead>}
            {columnVisibility.department && <TableHead className="font-semibold text-xs px-3 py-2">Department</TableHead>}
            {columnVisibility.purpose && <TableHead className="font-semibold text-xs px-3 py-2">Purpose</TableHead>}
            {columnVisibility.integration && <TableHead className="font-semibold text-xs px-3 py-2">Integration</TableHead>}
            {columnVisibility.tags && <TableHead className="font-semibold text-xs px-3 py-2">Tags</TableHead>}
            {columnVisibility.links && <TableHead className="font-semibold text-xs px-3 py-2">Links</TableHead>}
            {columnVisibility.date && <TableHead className="font-semibold text-xs px-3 py-2">Date</TableHead>}
            <TableHead className="text-right font-semibold text-xs px-3 py-2">Actions</TableHead>
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
            <TableRow className="h-32">
              <TableCell
                colSpan={
                  1 +
                  (columnVisibility.type ? 1 : 0) +
                  (columnVisibility.timeline ? 1 : 0) +
                  (columnVisibility.phase ? 1 : 0) +
                  (columnVisibility.priority ? 1 : 0) +
                  (columnVisibility.department ? 1 : 0) +
                  (columnVisibility.purpose ? 1 : 0) +
                  (columnVisibility.integration ? 1 : 0) +
                  (columnVisibility.tags ? 1 : 0) +
                  (columnVisibility.links ? 1 : 0) +
                  (columnVisibility.date ? 1 : 0) +
                  1
                }
                className="text-center"
              >
                <div className="text-4xl mb-3">📋</div>
                <h3 className="text-sm font-semibold mb-1">No work items found</h3>
                <p className="text-xs text-muted-foreground">
                  Try adjusting your filters or create a new work item
                </p>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      {/* Edit Work Item Dialog */}
      {/* Updated 2025-12-13: 'execution' → 'build' in 4-phase system */}
      {selectedWorkItem && (
        <EditWorkItemDialog
          workItemId={selectedWorkItem}
          workspaceId={workspaceId}
          phase={workspacePhase || 'build'}  // Default to build (all fields visible)
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          onSuccess={() => {
            // Refresh the data
            router.refresh()
          }}
        />
      )}
    </div>
  )
}
