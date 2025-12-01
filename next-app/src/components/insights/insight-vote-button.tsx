'use client'

/**
 * Insight Vote Button Component
 *
 * Toggle voting (upvote/downvote) on customer insights.
 * Supports both authenticated team members and external voters.
 */

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { ThumbsUp, ThumbsDown, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { VoteType } from '@/lib/types/customer-insight'

interface InsightVoteButtonProps {
  insightId: string
  voteType: 'upvote' | 'downvote'
  currentVote: VoteType | null
  count: number
  onVote: (voteType: VoteType) => Promise<void>
  disabled?: boolean
  size?: 'sm' | 'default'
}

export function InsightVoteButton({
  insightId,
  voteType,
  currentVote,
  count,
  onVote,
  disabled = false,
  size = 'default',
}: InsightVoteButtonProps) {
  const [isLoading, setIsLoading] = useState(false)
  const isActive = currentVote === voteType
  const Icon = voteType === 'upvote' ? ThumbsUp : ThumbsDown

  const handleClick = async () => {
    if (disabled || isLoading) return
    setIsLoading(true)
    try {
      await onVote(voteType)
    } finally {
      setIsLoading(false)
    }
  }

  const tooltipText =
    voteType === 'upvote'
      ? isActive
        ? 'Remove upvote'
        : 'Upvote this insight'
      : isActive
        ? 'Remove downvote'
        : 'Downvote this insight'

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size={size === 'sm' ? 'sm' : 'default'}
            className={cn(
              'gap-1.5 transition-colors',
              size === 'sm' ? 'h-7 px-2' : 'h-8 px-3',
              voteType === 'upvote' && isActive && 'text-green-600 hover:text-green-700 bg-green-50 hover:bg-green-100 dark:bg-green-950 dark:hover:bg-green-900',
              voteType === 'downvote' && isActive && 'text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 dark:bg-red-950 dark:hover:bg-red-900'
            )}
            onClick={handleClick}
            disabled={disabled || isLoading}
          >
            {isLoading ? (
              <Loader2 className={cn('animate-spin', size === 'sm' ? 'h-3.5 w-3.5' : 'h-4 w-4')} />
            ) : (
              <Icon
                className={cn(
                  size === 'sm' ? 'h-3.5 w-3.5' : 'h-4 w-4',
                  isActive && 'fill-current'
                )}
              />
            )}
            <span className={cn('font-medium', size === 'sm' ? 'text-xs' : 'text-sm')}>
              {count}
            </span>
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>{tooltipText}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

// ============================================================================
// INLINE VOTE BUTTONS (compact version for cards)
// ============================================================================

interface InsightVoteGroupProps {
  insightId: string
  upvoteCount: number
  downvoteCount: number
  currentVote: VoteType | null
  onVote: (voteType: VoteType) => Promise<void>
  disabled?: boolean
  size?: 'sm' | 'default'
  showNetScore?: boolean
}

export function InsightVoteGroup({
  insightId,
  upvoteCount,
  downvoteCount,
  currentVote,
  onVote,
  disabled = false,
  size = 'sm',
  showNetScore = false,
}: InsightVoteGroupProps) {
  const netScore = upvoteCount - downvoteCount

  return (
    <div className="flex items-center gap-1">
      <InsightVoteButton
        insightId={insightId}
        voteType="upvote"
        currentVote={currentVote}
        count={upvoteCount}
        onVote={onVote}
        disabled={disabled}
        size={size}
      />
      <InsightVoteButton
        insightId={insightId}
        voteType="downvote"
        currentVote={currentVote}
        count={downvoteCount}
        onVote={onVote}
        disabled={disabled}
        size={size}
      />
      {showNetScore && (
        <span
          className={cn(
            'text-xs font-medium ml-1',
            netScore > 0 && 'text-green-600',
            netScore < 0 && 'text-red-600',
            netScore === 0 && 'text-muted-foreground'
          )}
        >
          ({netScore >= 0 ? '+' : ''}{netScore})
        </span>
      )}
    </div>
  )
}
