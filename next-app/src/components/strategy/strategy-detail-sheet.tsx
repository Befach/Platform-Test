'use client'

/**
 * StrategyDetailSheet Component
 *
 * Slide-over panel showing full strategy details including:
 * - Type and status badges
 * - Progress with mode indicator
 * - Metrics (for Key Results)
 * - Owner information
 * - Linked work items with unlink functionality
 * - Action buttons (Edit, Add Child, Delete)
 */

import { useState } from 'react'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { useToast } from '@/hooks/use-toast'
import {
  Pencil,
  Plus,
  Trash2,
  Link2,
  Calendar,
  User,
  Target,
  TrendingUp,
  Flag,
  Lightbulb,
  Loader2,
  ChevronRight,
  BarChart3,
  FileText,
  Rocket,
  Bug,
  Zap,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { StrategyProgress } from './strategy-progress'
import {
  getStrategyTypeLabel,
  getStrategyStatusLabel,
  STRATEGY_TYPE_COLORS,
  calculateMetricProgress,
} from '@/lib/types/strategy'
import type {
  StrategyWithChildren,
  WorkItemStrategyWithWorkItem,
  StrategyStatus,
} from '@/lib/types/strategy'

// Type icon mapping
const typeIcons: Record<string, React.ElementType> = {
  pillar: Flag,
  objective: Target,
  key_result: TrendingUp,
  initiative: Lightbulb,
}

// Work item type icons
const workItemTypeIcons: Record<string, React.ElementType> = {
  concept: Lightbulb,
  feature: Rocket,
  bug: Bug,
  research: FileText,
}

// Status badge styles
const statusBadgeStyles: Record<StrategyStatus, string> = {
  draft: 'border-gray-300 text-gray-500 bg-gray-50',
  active: 'border-blue-300 text-blue-700 bg-blue-50',
  completed: 'border-green-300 text-green-700 bg-green-50',
  cancelled: 'border-gray-300 text-gray-500 bg-gray-50',
  on_hold: 'border-yellow-300 text-yellow-700 bg-yellow-50',
}

interface StrategyDetailSheetProps {
  strategy: StrategyWithChildren | null
  open: boolean
  onOpenChange: (open: boolean) => void
  // Loading state
  isLoading?: boolean
  // Actions
  onEdit?: (strategy: StrategyWithChildren) => void
  onDelete?: (strategy: StrategyWithChildren) => void
  onAddChild?: (parent: StrategyWithChildren) => void
  onNavigateToChild?: (childId: string) => void
  // Related data
  alignedWorkItems?: WorkItemStrategyWithWorkItem[]
  onUnlinkWorkItem?: (workItemId: string, strategyId: string) => Promise<void>
  onLinkWorkItem?: (strategy: StrategyWithChildren) => void
  isLoadingWorkItems?: boolean
}

export function StrategyDetailSheet({
  strategy,
  open,
  onOpenChange,
  isLoading = false,
  onEdit,
  onDelete,
  onAddChild,
  onNavigateToChild,
  alignedWorkItems = [],
  onUnlinkWorkItem,
  onLinkWorkItem,
  isLoadingWorkItems = false,
}: StrategyDetailSheetProps) {
  const { toast } = useToast()
  const [isUnlinking, setIsUnlinking] = useState<string | null>(null)

  if (!strategy) return null

  const TypeIcon = typeIcons[strategy.type] || Target

  // Format date
  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return null
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  // Get owner initials
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  // Handle unlink
  const handleUnlink = async (workItemId: string) => {
    if (!onUnlinkWorkItem) return

    setIsUnlinking(workItemId)
    try {
      await onUnlinkWorkItem(workItemId, strategy.id)
      toast({
        title: 'Unlinked',
        description: 'Work item unlinked from strategy',
      })
    } catch (error: unknown) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to unlink',
        variant: 'destructive',
      })
    } finally {
      setIsUnlinking(null)
    }
  }

  // Calculate metric progress percentage
  const metricProgress =
    strategy.type === 'key_result' && strategy.metric_target
      ? calculateMetricProgress(strategy.metric_current, strategy.metric_target)
      : null

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader className="space-y-3">
          {/* Badges Row */}
          <div className="flex items-center gap-2 flex-wrap">
            <Badge
              variant="secondary"
              className="gap-1"
              style={{
                backgroundColor: `${STRATEGY_TYPE_COLORS[strategy.type]}20`,
                color: STRATEGY_TYPE_COLORS[strategy.type],
              }}
            >
              <TypeIcon className="h-3 w-3" />
              {getStrategyTypeLabel(strategy.type)}
            </Badge>
            <Badge
              variant="outline"
              className={cn(statusBadgeStyles[strategy.status])}
            >
              {getStrategyStatusLabel(strategy.status)}
            </Badge>
          </div>

          <SheetTitle className="text-lg font-semibold pr-8">
            {strategy.title}
          </SheetTitle>

          {/* Date range */}
          {(strategy.start_date || strategy.target_date) && (
            <SheetDescription className="flex items-center gap-1 text-xs">
              <Calendar className="h-3 w-3" />
              {formatDate(strategy.start_date)}
              {strategy.start_date && strategy.target_date && ' → '}
              {formatDate(strategy.target_date)}
            </SheetDescription>
          )}
        </SheetHeader>

        <Tabs defaultValue="overview" className="mt-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="metrics" disabled={strategy.type !== 'key_result'}>
              Metrics
            </TabsTrigger>
            <TabsTrigger value="alignments">
              Alignments ({alignedWorkItems.length})
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="mt-4 space-y-6">
            {/* Description */}
            {strategy.description && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-muted-foreground">Description</h4>
                <p className="text-sm">{strategy.description}</p>
              </div>
            )}

            {/* Progress Section */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-muted-foreground">Progress</h4>
              <StrategyProgress
                progress={strategy.progress}
                calculatedProgress={strategy.calculated_progress}
                progressMode={strategy.progress_mode}
                status={strategy.status}
                showMode
                showPercentage
                size="lg"
              />
            </div>

            <Separator />

            {/* Owner */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                <User className="h-3 w-3" />
                Owner
              </h4>
              {strategy.owner ? (
                <div className="flex items-center gap-2">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="text-sm bg-primary/10">
                      {getInitials(strategy.owner.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium">{strategy.owner.name}</p>
                    <p className="text-xs text-muted-foreground">{strategy.owner.email}</p>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground italic">No owner assigned</p>
              )}
            </div>

            <Separator />

            {/* Children */}
            {strategy.children && strategy.children.length > 0 && (
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-muted-foreground">
                  Child Strategies ({strategy.children.length})
                </h4>
                <div className="space-y-2">
                  {strategy.children.map((child) => {
                    const ChildIcon = typeIcons[child.type] || Target
                    return (
                      <div
                        key={child.id}
                        className="flex items-center justify-between p-2 rounded-lg bg-muted/50 hover:bg-muted transition-colors cursor-pointer group"
                        onClick={() => onNavigateToChild?.(child.id)}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <div
                            className="p-1 rounded"
                            style={{ backgroundColor: `${STRATEGY_TYPE_COLORS[child.type]}20` }}
                          >
                            <ChildIcon
                              className="h-3 w-3"
                              style={{ color: STRATEGY_TYPE_COLORS[child.type] }}
                            />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium truncate">{child.title}</p>
                            <p className="text-xs text-muted-foreground">
                              {getStrategyTypeLabel(child.type)}
                            </p>
                          </div>
                        </div>
                        <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </TabsContent>

          {/* Metrics Tab (Key Results only) */}
          <TabsContent value="metrics" className="mt-4 space-y-6">
            {strategy.type === 'key_result' && (
              <>
                {strategy.metric_name ? (
                  <div className="space-y-4">
                    <div className="p-4 rounded-lg bg-muted/50 space-y-4">
                      <div>
                        <h4 className="text-sm font-medium">{strategy.metric_name}</h4>
                        <p className="text-xs text-muted-foreground">
                          {strategy.metric_unit || 'units'}
                        </p>
                      </div>

                      <div className="flex items-end justify-between">
                        <div>
                          <p className="text-3xl font-bold">
                            {strategy.metric_current ?? 0}
                          </p>
                          <p className="text-xs text-muted-foreground">Current</p>
                        </div>
                        <div className="text-right">
                          <p className="text-3xl font-bold text-muted-foreground">
                            {strategy.metric_target ?? 0}
                          </p>
                          <p className="text-xs text-muted-foreground">Target</p>
                        </div>
                      </div>

                      {metricProgress !== null && (
                        <div className="space-y-1">
                          <div className="flex justify-between text-xs">
                            <span className="text-muted-foreground">Progress</span>
                            <span className="font-medium">{metricProgress}%</span>
                          </div>
                          <div className="h-2 bg-muted rounded-full overflow-hidden">
                            <div
                              className={cn(
                                'h-full transition-all',
                                metricProgress >= 70
                                  ? 'bg-green-500'
                                  : metricProgress >= 40
                                  ? 'bg-yellow-500'
                                  : 'bg-red-500'
                              )}
                              style={{ width: `${metricProgress}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <BarChart3 className="h-12 w-12 text-muted-foreground/50 mb-3" />
                    <p className="text-sm text-muted-foreground">
                      No metrics configured for this Key Result
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Edit this strategy to add metrics
                    </p>
                  </div>
                )}
              </>
            )}
          </TabsContent>

          {/* Alignments Tab */}
          <TabsContent value="alignments" className="mt-4 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                <Link2 className="h-3 w-3" />
                Aligned Work Items
              </h4>
              {onLinkWorkItem && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onLinkWorkItem(strategy)}
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Link
                </Button>
              )}
            </div>

            {isLoadingWorkItems ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-14 bg-muted animate-pulse rounded-lg" />
                ))}
              </div>
            ) : alignedWorkItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Link2 className="h-12 w-12 text-muted-foreground/50 mb-3" />
                <p className="text-sm text-muted-foreground">
                  No work items aligned yet
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Link work items to track how they contribute to this strategy
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {alignedWorkItems.map((alignment) => {
                  const WorkItemIcon =
                    workItemTypeIcons[alignment.work_item.type] || FileText
                  return (
                    <div
                      key={alignment.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors group"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <WorkItemIcon className="h-4 w-4 text-muted-foreground shrink-0" />
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">
                            {alignment.work_item.name}
                          </p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span className="capitalize">{alignment.work_item.type}</span>
                            <span>•</span>
                            <span className="capitalize">{alignment.work_item.status.replace('_', ' ')}</span>
                            <span>•</span>
                            <Badge variant="outline" className="text-xs py-0">
                              {alignment.alignment_strength}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      {onUnlinkWorkItem && (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={() => handleUnlink(alignment.work_item.id)}
                                disabled={isUnlinking === alignment.work_item.id}
                              >
                                {isUnlinking === alignment.work_item.id ? (
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                ) : (
                                  <Link2 className="h-3 w-3" />
                                )}
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Unlink</TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>

        <SheetFooter className="mt-6 flex-row gap-2">
          {onAddChild && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onAddChild(strategy)}
            >
              <Plus className="h-4 w-4 mr-1" />
              Add Child
            </Button>
          )}
          {onEdit && (
            <Button variant="outline" size="sm" onClick={() => onEdit(strategy)}>
              <Pencil className="h-4 w-4 mr-1" />
              Edit
            </Button>
          )}
          {onDelete && strategy.status !== 'completed' && (
            <Button
              variant="outline"
              size="sm"
              className="text-destructive hover:text-destructive"
              onClick={() => onDelete(strategy)}
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Delete
            </Button>
          )}
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
