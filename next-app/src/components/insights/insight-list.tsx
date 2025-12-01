'use client'

/**
 * Insight List Component
 *
 * Displays a filterable, sortable list of customer insights.
 * Includes search, filters, and pagination.
 */

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { useToast } from '@/hooks/use-toast'
import {
  Search,
  Filter,
  SlidersHorizontal,
  Plus,
  RefreshCcw,
  Loader2,
  Lightbulb,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type {
  CustomerInsightWithMeta,
  InsightSource,
  InsightSentiment,
  InsightStatus,
  VoteType,
} from '@/lib/types/customer-insight'
import {
  INSIGHT_SOURCES,
  INSIGHT_SENTIMENTS,
  INSIGHT_STATUSES,
} from '@/lib/types/customer-insight'
import { InsightCard } from './insight-card'

interface InsightListProps {
  teamId: string
  workspaceId?: string
  showCreateButton?: boolean
  onCreateNew?: () => void
  onEdit?: (insight: CustomerInsightWithMeta) => void
  onDelete?: (insight: CustomerInsightWithMeta) => void
  onLink?: (insight: CustomerInsightWithMeta) => void
  onView?: (insight: CustomerInsightWithMeta) => void
  className?: string
}

const ITEMS_PER_PAGE = 20

export function InsightList({
  teamId,
  workspaceId,
  showCreateButton = true,
  onCreateNew,
  onEdit,
  onDelete,
  onLink,
  onView,
  className,
}: InsightListProps) {
  const router = useRouter()
  const { toast } = useToast()

  // State
  const [insights, setInsights] = useState<CustomerInsightWithMeta[]>([])
  const [userVotes, setUserVotes] = useState<Record<string, VoteType | null>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Pagination
  const [total, setTotal] = useState(0)
  const [offset, setOffset] = useState(0)

  // Filters
  const [search, setSearch] = useState('')
  const [sourceFilter, setSourceFilter] = useState<InsightSource | 'all'>('all')
  const [sentimentFilter, setSentimentFilter] = useState<InsightSentiment | 'all'>('all')
  const [statusFilter, setStatusFilter] = useState<InsightStatus | 'all'>('all')
  const [sortBy, setSortBy] = useState<string>('created_at')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')

  // Fetch insights
  const fetchInsights = useCallback(async (refresh = false) => {
    if (refresh) {
      setIsRefreshing(true)
    } else {
      setIsLoading(true)
    }
    setError(null)

    try {
      const params = new URLSearchParams({
        team_id: teamId,
        limit: ITEMS_PER_PAGE.toString(),
        offset: offset.toString(),
        sort_by: sortBy,
        sort_dir: sortDir,
      })

      if (workspaceId) params.set('workspace_id', workspaceId)
      if (search) params.set('search', search)
      if (sourceFilter !== 'all') params.set('source', sourceFilter)
      if (sentimentFilter !== 'all') params.set('sentiment', sentimentFilter)
      if (statusFilter !== 'all') params.set('status', statusFilter)

      const response = await fetch(`/api/insights?${params}`)

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to fetch insights')
      }

      const data = await response.json()
      setInsights(data.data || [])
      setTotal(data.pagination?.total || 0)

      // Initialize user votes (would need separate API call or include in main response)
      const votes: Record<string, VoteType | null> = {}
      data.data?.forEach((insight: CustomerInsightWithMeta) => {
        votes[insight.id] = null // Will be populated by individual vote checks if needed
      })
      setUserVotes(votes)
    } catch (err: any) {
      setError(err.message || 'Failed to load insights')
      console.error('Error fetching insights:', err)
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }, [teamId, workspaceId, offset, sortBy, sortDir, search, sourceFilter, sentimentFilter, statusFilter])

  // Initial fetch and refetch on filter changes
  useEffect(() => {
    fetchInsights()
  }, [fetchInsights])

  // Reset offset when filters change
  useEffect(() => {
    setOffset(0)
  }, [search, sourceFilter, sentimentFilter, statusFilter])

  // Handle vote
  const handleVote = useCallback(async (insightId: string, voteType: VoteType) => {
    try {
      const response = await fetch(`/api/insights/${insightId}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vote_type: voteType }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to vote')
      }

      const data = await response.json()

      // Update local state
      setUserVotes((prev) => ({
        ...prev,
        [insightId]: data.data.vote_type,
      }))

      // Refresh to get updated counts
      fetchInsights(true)
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.message || 'Failed to record vote',
        variant: 'destructive',
      })
    }
  }, [fetchInsights, toast])

  // Handle delete
  const handleDelete = async (insight: CustomerInsightWithMeta) => {
    if (!confirm(`Are you sure you want to delete "${insight.title}"?`)) {
      return
    }

    try {
      const response = await fetch(`/api/insights/${insight.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to delete insight')
      }

      toast({
        title: 'Insight deleted',
        description: 'The insight has been removed',
      })

      fetchInsights(true)
      onDelete?.(insight)
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.message || 'Failed to delete insight',
        variant: 'destructive',
      })
    }
  }

  // Pagination
  const totalPages = Math.ceil(total / ITEMS_PER_PAGE)
  const currentPage = Math.floor(offset / ITEMS_PER_PAGE) + 1
  const hasNextPage = offset + ITEMS_PER_PAGE < total
  const hasPrevPage = offset > 0

  const goToNextPage = () => {
    if (hasNextPage) {
      setOffset(offset + ITEMS_PER_PAGE)
    }
  }

  const goToPrevPage = () => {
    if (hasPrevPage) {
      setOffset(Math.max(0, offset - ITEMS_PER_PAGE))
    }
  }

  // Clear filters
  const clearFilters = () => {
    setSearch('')
    setSourceFilter('all')
    setSentimentFilter('all')
    setStatusFilter('all')
    setSortBy('created_at')
    setSortDir('desc')
  }

  const hasActiveFilters =
    search !== '' ||
    sourceFilter !== 'all' ||
    sentimentFilter !== 'all' ||
    statusFilter !== 'all'

  return (
    <div className={cn('space-y-4', className)}>
      {/* Header: Search + Filters + Create */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search insights..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Filter Dropdowns */}
        <div className="flex items-center gap-2">
          {/* Source Filter */}
          <Select
            value={sourceFilter}
            onValueChange={(value) => setSourceFilter(value as InsightSource | 'all')}
          >
            <SelectTrigger className="w-[130px]">
              <SelectValue placeholder="Source" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Sources</SelectItem>
              {INSIGHT_SOURCES.map((source) => (
                <SelectItem key={source} value={source}>
                  {source.charAt(0).toUpperCase() + source.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Sentiment Filter */}
          <Select
            value={sentimentFilter}
            onValueChange={(value) => setSentimentFilter(value as InsightSentiment | 'all')}
          >
            <SelectTrigger className="w-[130px]">
              <SelectValue placeholder="Sentiment" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Sentiments</SelectItem>
              {INSIGHT_SENTIMENTS.map((sentiment) => (
                <SelectItem key={sentiment} value={sentiment}>
                  {sentiment.charAt(0).toUpperCase() + sentiment.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Status Filter */}
          <Select
            value={statusFilter}
            onValueChange={(value) => setStatusFilter(value as InsightStatus | 'all')}
          >
            <SelectTrigger className="w-[130px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              {INSIGHT_STATUSES.map((status) => (
                <SelectItem key={status} value={status}>
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Sort */}
          <Select
            value={`${sortBy}-${sortDir}`}
            onValueChange={(value) => {
              const [field, dir] = value.split('-')
              setSortBy(field)
              setSortDir(dir as 'asc' | 'desc')
            }}
          >
            <SelectTrigger className="w-[150px]">
              <SlidersHorizontal className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="created_at-desc">Newest First</SelectItem>
              <SelectItem value="created_at-asc">Oldest First</SelectItem>
              <SelectItem value="impact_score-desc">Highest Impact</SelectItem>
              <SelectItem value="impact_score-asc">Lowest Impact</SelectItem>
              <SelectItem value="updated_at-desc">Recently Updated</SelectItem>
            </SelectContent>
          </Select>

          {/* Clear Filters */}
          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              Clear
            </Button>
          )}

          {/* Refresh */}
          <Button
            variant="outline"
            size="icon"
            onClick={() => fetchInsights(true)}
            disabled={isRefreshing}
          >
            <RefreshCcw className={cn('h-4 w-4', isRefreshing && 'animate-spin')} />
          </Button>

          {/* Create New */}
          {showCreateButton && onCreateNew && (
            <Button onClick={onCreateNew}>
              <Plus className="h-4 w-4 mr-2" />
              New Insight
            </Button>
          )}
        </div>
      </div>

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm text-muted-foreground">Filters:</span>
          {search && (
            <Badge variant="secondary" className="gap-1">
              Search: "{search}"
            </Badge>
          )}
          {sourceFilter !== 'all' && (
            <Badge variant="secondary" className="gap-1">
              Source: {sourceFilter}
            </Badge>
          )}
          {sentimentFilter !== 'all' && (
            <Badge variant="secondary" className="gap-1">
              Sentiment: {sentimentFilter}
            </Badge>
          )}
          {statusFilter !== 'all' && (
            <Badge variant="secondary" className="gap-1">
              Status: {statusFilter}
            </Badge>
          )}
        </div>
      )}

      {/* Content */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <p className="text-destructive mb-4">{error}</p>
          <Button variant="outline" onClick={() => fetchInsights()}>
            Try Again
          </Button>
        </div>
      ) : insights.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Lightbulb className="h-12 w-12 text-muted-foreground/50 mb-4" />
          <h3 className="text-lg font-semibold mb-2">No insights yet</h3>
          <p className="text-sm text-muted-foreground mb-4 max-w-md">
            {hasActiveFilters
              ? 'No insights match your current filters. Try adjusting your search criteria.'
              : 'Customer insights help you track voice-of-customer feedback. Create your first insight to get started.'}
          </p>
          {showCreateButton && onCreateNew && !hasActiveFilters && (
            <Button onClick={onCreateNew}>
              <Plus className="h-4 w-4 mr-2" />
              Create First Insight
            </Button>
          )}
        </div>
      ) : (
        <>
          {/* Results count */}
          <p className="text-sm text-muted-foreground">
            Showing {offset + 1}-{Math.min(offset + ITEMS_PER_PAGE, total)} of {total} insights
          </p>

          {/* Insight Cards */}
          <div className="space-y-3">
            {insights.map((insight) => (
              <InsightCard
                key={insight.id}
                insight={insight}
                userVote={userVotes[insight.id]}
                onVote={(voteType) => handleVote(insight.id, voteType)}
                onEdit={onEdit ? () => onEdit(insight) : undefined}
                onDelete={onDelete ? () => handleDelete(insight) : undefined}
                onLink={onLink ? () => onLink(insight) : undefined}
                onView={onView ? () => onView(insight) : undefined}
              />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-4">
              <p className="text-sm text-muted-foreground">
                Page {currentPage} of {totalPages}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={goToPrevPage}
                  disabled={!hasPrevPage}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={goToNextPage}
                  disabled={!hasNextPage}
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
