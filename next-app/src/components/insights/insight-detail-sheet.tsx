'use client'

/**
 * Insight Detail Sheet Component
 *
 * Slide-over panel showing full insight details including:
 * - Title and metadata
 * - Quote and pain point
 * - Customer information
 * - Tags
 * - Voting controls
 * - Linked work items
 * - Status change and action buttons
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { useToast } from '@/hooks/use-toast'
import {
  Pencil,
  Link2,
  Trash2,
  ExternalLink,
  User,
  Building2,
  Calendar,
  Tag,
  MessageSquare,
  HeadphonesIcon,
  Users,
  ClipboardList,
  Share2,
  BarChart3,
  FileText,
  Loader2,
  Rocket,
  Bug,
  Zap,
  Lightbulb,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { InsightVoteGroup } from './insight-vote-button'
import type {
  CustomerInsightWithMeta,
  InsightSource,
  InsightSentiment,
  InsightStatus,
  VoteType,
} from '@/lib/types/customer-insight'
import { INSIGHT_STATUSES } from '@/lib/types/customer-insight'

// Reuse color mappings from insight-card
const sourceIcons: Record<InsightSource, React.ElementType> = {
  feedback: MessageSquare,
  support: HeadphonesIcon,
  interview: Users,
  survey: ClipboardList,
  social: Share2,
  analytics: BarChart3,
  other: FileText,
}

const sourceColors: Record<InsightSource, string> = {
  feedback: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  support: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  interview: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  survey: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400',
  social: 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400',
  analytics: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400',
  other: 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400',
}

const sentimentColors: Record<InsightSentiment, string> = {
  positive: 'bg-green-100 text-green-700 border-green-300 dark:bg-green-900/30 dark:text-green-400',
  neutral: 'bg-gray-100 text-gray-700 border-gray-300 dark:bg-gray-900/30 dark:text-gray-400',
  negative: 'bg-red-100 text-red-700 border-red-300 dark:bg-red-900/30 dark:text-red-400',
  mixed: 'bg-yellow-100 text-yellow-700 border-yellow-300 dark:bg-yellow-900/30 dark:text-yellow-400',
}

const statusLabels: Record<InsightStatus, string> = {
  new: 'New',
  reviewed: 'Reviewed',
  actionable: 'Actionable',
  addressed: 'Addressed',
  archived: 'Archived',
}

const sourceLabels: Record<InsightSource, string> = {
  feedback: 'Feedback',
  support: 'Support',
  interview: 'Interview',
  survey: 'Survey',
  social: 'Social',
  analytics: 'Analytics',
  other: 'Other',
}

const sentimentLabels: Record<InsightSentiment, string> = {
  positive: 'Positive',
  neutral: 'Neutral',
  negative: 'Negative',
  mixed: 'Mixed',
}

// Work item type icons
const workItemTypeIcons: Record<string, React.ElementType> = {
  concept: Lightbulb,
  feature: Rocket,
  bug: Bug,
  research: FileText,
}

interface LinkedWorkItem {
  id: string
  name: string
  type: string
  status: string
  relevance_score?: number
}

interface InsightDetailSheetProps {
  insight: CustomerInsightWithMeta | null
  open: boolean
  onOpenChange: (open: boolean) => void
  // Actions
  onEdit?: (insight: CustomerInsightWithMeta) => void
  onDelete?: (insight: CustomerInsightWithMeta) => void
  onLink?: (insight: CustomerInsightWithMeta) => void
  onStatusChange?: (insight: CustomerInsightWithMeta, status: InsightStatus) => Promise<void>
  // Voting
  userVote?: VoteType | null
  onVote?: (voteType: VoteType) => Promise<void>
  // Related data
  linkedWorkItems?: LinkedWorkItem[]
  onUnlinkWorkItem?: (workItemId: string) => Promise<void>
  isLoadingWorkItems?: boolean
}

export function InsightDetailSheet({
  insight,
  open,
  onOpenChange,
  onEdit,
  onDelete,
  onLink,
  onStatusChange,
  userVote,
  onVote,
  linkedWorkItems = [],
  onUnlinkWorkItem,
  isLoadingWorkItems = false,
}: InsightDetailSheetProps) {
  const { toast } = useToast()
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false)
  const [isUnlinking, setIsUnlinking] = useState<string | null>(null)

  if (!insight) return null

  const SourceIcon = sourceIcons[insight.source]

  const handleStatusChange = async (newStatus: InsightStatus) => {
    if (!onStatusChange) return

    setIsUpdatingStatus(true)
    try {
      await onStatusChange(insight, newStatus)
      toast({
        title: 'Status updated',
        description: `Insight marked as "${statusLabels[newStatus]}"`,
      })
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update status',
        variant: 'destructive',
      })
    } finally {
      setIsUpdatingStatus(false)
    }
  }

  const handleUnlink = async (workItemId: string) => {
    if (!onUnlinkWorkItem) return

    setIsUnlinking(workItemId)
    try {
      await onUnlinkWorkItem(workItemId)
      toast({
        title: 'Unlinked',
        description: 'Work item unlinked from insight',
      })
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to unlink',
        variant: 'destructive',
      })
    } finally {
      setIsUnlinking(null)
    }
  }

  const handleOpenSource = () => {
    if (insight.source_url) {
      window.open(insight.source_url, '_blank', 'noopener,noreferrer')
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader className="space-y-3">
          {/* Badges Row */}
          <div className="flex items-center gap-2 flex-wrap">
            <Badge
              variant="secondary"
              className={cn('gap-1', sourceColors[insight.source])}
            >
              <SourceIcon className="h-3 w-3" />
              {sourceLabels[insight.source]}
            </Badge>
            <Badge
              variant="outline"
              className={cn(sentimentColors[insight.sentiment])}
            >
              {sentimentLabels[insight.sentiment]}
            </Badge>
            {insight.impact_score > 0 && (
              <Badge variant="outline">Impact: {insight.impact_score}/10</Badge>
            )}
          </div>

          <SheetTitle className="text-lg font-semibold pr-8">
            {insight.title}
          </SheetTitle>

          {insight.source_date && (
            <SheetDescription className="flex items-center gap-1 text-xs">
              <Calendar className="h-3 w-3" />
              {new Date(insight.source_date).toLocaleDateString()}
            </SheetDescription>
          )}
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Quote */}
          {insight.quote && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-muted-foreground">Quote</h4>
              <blockquote className="text-sm italic border-l-2 border-primary/30 pl-3 py-1">
                "{insight.quote}"
              </blockquote>
            </div>
          )}

          {/* Pain Point */}
          {insight.pain_point && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-muted-foreground">Pain Point</h4>
              <p className="text-sm">{insight.pain_point}</p>
            </div>
          )}

          {/* Context */}
          {insight.context && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-muted-foreground">Context</h4>
              <p className="text-sm text-muted-foreground">{insight.context}</p>
            </div>
          )}

          <Separator />

          {/* Customer Information */}
          {(insight.customer_name || insight.customer_company || insight.customer_email) && (
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-muted-foreground">Customer</h4>
              <div className="space-y-2">
                {insight.customer_name && (
                  <div className="flex items-center gap-2 text-sm">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span>{insight.customer_name}</span>
                  </div>
                )}
                {insight.customer_company && (
                  <div className="flex items-center gap-2 text-sm">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    <span>{insight.customer_company}</span>
                  </div>
                )}
                {insight.customer_segment && (
                  <Badge variant="outline" className="text-xs">
                    {insight.customer_segment}
                  </Badge>
                )}
              </div>
            </div>
          )}

          {/* Tags */}
          {insight.tags && insight.tags.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                <Tag className="h-3 w-3" />
                Tags
              </h4>
              <div className="flex flex-wrap gap-1">
                {insight.tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          <Separator />

          {/* Voting Section */}
          {onVote && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-muted-foreground">Voting</h4>
              <div className="flex items-center justify-between">
                <InsightVoteGroup
                  insightId={insight.id}
                  upvoteCount={insight.upvote_count || 0}
                  downvoteCount={insight.downvote_count || 0}
                  currentVote={userVote || null}
                  onVote={onVote}
                  size="default"
                  showNetScore
                />
                <span className="text-sm text-muted-foreground">
                  Net: {(insight.upvote_count || 0) - (insight.downvote_count || 0)}
                </span>
              </div>
            </div>
          )}

          {/* Status Change */}
          {onStatusChange && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-muted-foreground">Status</h4>
              <Select
                value={insight.status}
                onValueChange={(value) => handleStatusChange(value as InsightStatus)}
                disabled={isUpdatingStatus}
              >
                <SelectTrigger className="w-[180px]">
                  {isUpdatingStatus ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <SelectValue />
                  )}
                </SelectTrigger>
                <SelectContent>
                  {INSIGHT_STATUSES.map((status) => (
                    <SelectItem key={status} value={status}>
                      {statusLabels[status]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <Separator />

          {/* Linked Work Items */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                <Link2 className="h-3 w-3" />
                Linked Work Items ({linkedWorkItems.length})
              </h4>
              {onLink && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onLink(insight)}
                >
                  <Link2 className="h-3 w-3 mr-1" />
                  Link
                </Button>
              )}
            </div>

            {isLoadingWorkItems ? (
              <div className="space-y-2">
                {[1, 2].map((i) => (
                  <div key={i} className="h-12 bg-muted animate-pulse rounded" />
                ))}
              </div>
            ) : linkedWorkItems.length === 0 ? (
              <p className="text-sm text-muted-foreground italic">
                No work items linked yet
              </p>
            ) : (
              <div className="space-y-2">
                {linkedWorkItems.map((workItem) => {
                  const TypeIcon = workItemTypeIcons[workItem.type] || FileText
                  return (
                    <div
                      key={workItem.id}
                      className="flex items-center justify-between p-2 rounded-lg bg-muted/50 hover:bg-muted transition-colors group"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <TypeIcon className="h-4 w-4 text-muted-foreground shrink-0" />
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{workItem.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {workItem.type} • {workItem.status}
                            {workItem.relevance_score && (
                              <span> • Relevance: {workItem.relevance_score}/10</span>
                            )}
                          </p>
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
                                onClick={() => handleUnlink(workItem.id)}
                                disabled={isUnlinking === workItem.id}
                              >
                                {isUnlinking === workItem.id ? (
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
          </div>
        </div>

        <SheetFooter className="mt-6 flex-row gap-2">
          {insight.source_url && (
            <Button variant="outline" size="sm" onClick={handleOpenSource}>
              <ExternalLink className="h-4 w-4 mr-1" />
              Source
            </Button>
          )}
          {onEdit && (
            <Button variant="outline" size="sm" onClick={() => onEdit(insight)}>
              <Pencil className="h-4 w-4 mr-1" />
              Edit
            </Button>
          )}
          {onDelete && insight.status !== 'archived' && (
            <Button
              variant="outline"
              size="sm"
              className="text-destructive hover:text-destructive"
              onClick={() => onDelete(insight)}
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
