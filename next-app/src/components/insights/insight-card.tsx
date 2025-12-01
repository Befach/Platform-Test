'use client'

/**
 * Insight Card Component
 *
 * Displays a customer insight with:
 * - Title, quote, and pain point
 * - Source and sentiment badges
 * - Voting (upvote/downvote)
 * - Link count indicator
 * - Customer info
 * - Actions (edit, delete, link)
 */

import { useState } from 'react'
import {
  MoreHorizontal,
  Pencil,
  Trash2,
  Link2,
  ExternalLink,
  User,
  Building2,
  Calendar,
  MessageSquare,
  HeadphonesIcon,
  Users,
  ClipboardList,
  Share2,
  BarChart3,
  FileText,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import type { CustomerInsightWithMeta, VoteType, InsightSource, InsightSentiment, InsightStatus } from '@/lib/types/customer-insight'
import { InsightVoteGroup } from './insight-vote-button'

// Source icon mapping
const sourceIcons: Record<InsightSource, React.ElementType> = {
  feedback: MessageSquare,
  support: HeadphonesIcon,
  interview: Users,
  survey: ClipboardList,
  social: Share2,
  analytics: BarChart3,
  other: FileText,
}

// Source colors
const sourceColors: Record<InsightSource, string> = {
  feedback: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  support: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  interview: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  survey: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400',
  social: 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400',
  analytics: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400',
  other: 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400',
}

// Sentiment colors
const sentimentColors: Record<InsightSentiment, string> = {
  positive: 'bg-green-100 text-green-700 border-green-300 dark:bg-green-900/30 dark:text-green-400 dark:border-green-700',
  neutral: 'bg-gray-100 text-gray-700 border-gray-300 dark:bg-gray-900/30 dark:text-gray-400 dark:border-gray-700',
  negative: 'bg-red-100 text-red-700 border-red-300 dark:bg-red-900/30 dark:text-red-400 dark:border-red-700',
  mixed: 'bg-yellow-100 text-yellow-700 border-yellow-300 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-700',
}

// Status colors
const statusColors: Record<InsightStatus, string> = {
  new: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  reviewed: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  actionable: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  addressed: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  archived: 'bg-gray-100 text-gray-500 dark:bg-gray-900/30 dark:text-gray-500',
}

// Source labels
const sourceLabels: Record<InsightSource, string> = {
  feedback: 'Feedback',
  support: 'Support',
  interview: 'Interview',
  survey: 'Survey',
  social: 'Social',
  analytics: 'Analytics',
  other: 'Other',
}

// Sentiment labels
const sentimentLabels: Record<InsightSentiment, string> = {
  positive: 'Positive',
  neutral: 'Neutral',
  negative: 'Negative',
  mixed: 'Mixed',
}

// Status labels
const statusLabels: Record<InsightStatus, string> = {
  new: 'New',
  reviewed: 'Reviewed',
  actionable: 'Actionable',
  addressed: 'Addressed',
  archived: 'Archived',
}

interface InsightCardProps {
  insight: CustomerInsightWithMeta
  userVote?: VoteType | null
  onVote?: (voteType: VoteType) => Promise<void>
  onEdit?: (insight: CustomerInsightWithMeta) => void
  onDelete?: (insight: CustomerInsightWithMeta) => void
  onLink?: (insight: CustomerInsightWithMeta) => void
  onView?: (insight: CustomerInsightWithMeta) => void
  showActions?: boolean
  showVoting?: boolean
  isCompact?: boolean
  className?: string
}

export function InsightCard({
  insight,
  userVote = null,
  onVote,
  onEdit,
  onDelete,
  onLink,
  onView,
  showActions = true,
  showVoting = true,
  isCompact = false,
  className,
}: InsightCardProps) {
  const SourceIcon = sourceIcons[insight.source]

  const handleVote = async (voteType: VoteType) => {
    if (onVote) {
      await onVote(voteType)
    }
  }

  const handleOpenSource = () => {
    if (insight.source_url) {
      window.open(insight.source_url, '_blank', 'noopener,noreferrer')
    }
  }

  return (
    <Card
      className={cn(
        'group relative overflow-hidden transition-all hover:shadow-md',
        insight.status === 'archived' && 'opacity-60',
        className
      )}
    >
      <CardContent className={cn('p-4', isCompact && 'p-3')}>
        <div className="space-y-3">
          {/* Header: Title + Actions */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <h4
                className={cn(
                  'font-semibold cursor-pointer hover:text-primary transition-colors',
                  isCompact ? 'text-sm' : 'text-base'
                )}
                onClick={() => onView?.(insight)}
              >
                {insight.title}
              </h4>
            </div>

            {/* Actions Dropdown */}
            {showActions && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {onView && (
                    <DropdownMenuItem onClick={() => onView(insight)}>
                      <FileText className="h-4 w-4 mr-2" />
                      View Details
                    </DropdownMenuItem>
                  )}
                  {onLink && (
                    <DropdownMenuItem onClick={() => onLink(insight)}>
                      <Link2 className="h-4 w-4 mr-2" />
                      Link to Work Item
                    </DropdownMenuItem>
                  )}
                  {insight.source_url && (
                    <DropdownMenuItem onClick={handleOpenSource}>
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Open Source URL
                    </DropdownMenuItem>
                  )}
                  {onEdit && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => onEdit(insight)}>
                        <Pencil className="h-4 w-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                    </>
                  )}
                  {onDelete && insight.status !== 'archived' && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => onDelete(insight)}
                        className="text-destructive focus:text-destructive"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>

          {/* Quote (if exists) */}
          {insight.quote && !isCompact && (
            <blockquote className="text-sm text-muted-foreground italic border-l-2 border-primary/30 pl-3 py-1">
              "{insight.quote}"
            </blockquote>
          )}

          {/* Pain Point */}
          {insight.pain_point && !isCompact && (
            <p className="text-sm text-muted-foreground line-clamp-2">
              {insight.pain_point}
            </p>
          )}

          {/* Customer Info (if available) */}
          {(insight.customer_name || insight.customer_company) && !isCompact && (
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              {insight.customer_name && (
                <div className="flex items-center gap-1">
                  <User className="h-3 w-3" />
                  <span>{insight.customer_name}</span>
                </div>
              )}
              {insight.customer_company && (
                <div className="flex items-center gap-1">
                  <Building2 className="h-3 w-3" />
                  <span>{insight.customer_company}</span>
                </div>
              )}
              {insight.source_date && (
                <div className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  <span>{new Date(insight.source_date).toLocaleDateString()}</span>
                </div>
              )}
            </div>
          )}

          {/* Tags */}
          {insight.tags && insight.tags.length > 0 && !isCompact && (
            <div className="flex flex-wrap gap-1">
              {insight.tags.slice(0, 3).map((tag) => (
                <Badge key={tag} variant="outline" className="text-xs py-0 px-1.5">
                  {tag}
                </Badge>
              ))}
              {insight.tags.length > 3 && (
                <Badge variant="outline" className="text-xs py-0 px-1.5">
                  +{insight.tags.length - 3}
                </Badge>
              )}
            </div>
          )}

          {/* Footer: Badges + Voting + Link Count */}
          <div className="flex items-center justify-between gap-2 pt-1">
            {/* Left: Source, Sentiment, Status badges */}
            <div className="flex items-center gap-1.5 flex-wrap">
              {/* Source Badge */}
              <Badge
                variant="secondary"
                className={cn('text-xs gap-1', sourceColors[insight.source])}
              >
                <SourceIcon className="h-3 w-3" />
                {sourceLabels[insight.source]}
              </Badge>

              {/* Sentiment Badge */}
              <Badge
                variant="outline"
                className={cn('text-xs', sentimentColors[insight.sentiment])}
              >
                {sentimentLabels[insight.sentiment]}
              </Badge>

              {/* Status Badge (if not "new") */}
              {insight.status !== 'new' && (
                <Badge
                  variant="secondary"
                  className={cn('text-xs', statusColors[insight.status])}
                >
                  {statusLabels[insight.status]}
                </Badge>
              )}

              {/* Impact Score */}
              {insight.impact_score > 0 && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Badge variant="outline" className="text-xs">
                        Impact: {insight.impact_score}/10
                      </Badge>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Impact score (higher = more critical)</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}

              {/* Linked Work Items Count */}
              {insight.linked_work_items_count !== undefined && insight.linked_work_items_count > 0 && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Link2 className="h-3 w-3" />
                        <span>{insight.linked_work_items_count}</span>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>
                        Linked to {insight.linked_work_items_count} work item
                        {insight.linked_work_items_count !== 1 && 's'}
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>

            {/* Right: Voting */}
            {showVoting && onVote && (
              <InsightVoteGroup
                insightId={insight.id}
                upvoteCount={insight.upvote_count || 0}
                downvoteCount={insight.downvote_count || 0}
                currentVote={userVote}
                onVote={handleVote}
                size="sm"
              />
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// ============================================================================
// COMPACT INSIGHT ITEM (for lists and linking)
// ============================================================================

interface InsightItemProps {
  insight: CustomerInsightWithMeta
  onRemove?: () => void
  onClick?: () => void
  showRemove?: boolean
  className?: string
}

export function InsightItem({
  insight,
  onRemove,
  onClick,
  showRemove = false,
  className,
}: InsightItemProps) {
  const SourceIcon = sourceIcons[insight.source]

  return (
    <div
      className={cn(
        'flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors group cursor-pointer',
        className
      )}
      onClick={onClick}
    >
      {/* Source Icon */}
      <div className={cn(
        'h-8 w-8 rounded flex items-center justify-center shrink-0',
        sourceColors[insight.source]
      )}>
        <SourceIcon className="h-4 w-4" />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{insight.title}</p>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>{sentimentLabels[insight.sentiment]}</span>
          {insight.customer_name && (
            <>
              <span>•</span>
              <span>{insight.customer_name}</span>
            </>
          )}
        </div>
      </div>

      {/* Vote count */}
      <div className="flex items-center gap-1 text-xs text-muted-foreground">
        <span className={cn(
          (insight.vote_count || 0) > 0 && 'text-green-600',
          (insight.vote_count || 0) < 0 && 'text-red-600'
        )}>
          {(insight.vote_count || 0) >= 0 ? '+' : ''}{insight.vote_count || 0}
        </span>
      </div>

      {/* Remove Button */}
      {showRemove && onRemove && (
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
          onClick={(e) => {
            e.stopPropagation()
            onRemove()
          }}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      )}
    </div>
  )
}
