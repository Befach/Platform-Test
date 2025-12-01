'use client'

/**
 * Insights Sub-Tab
 *
 * Displays customer insights linked to or relevant to a work item.
 * Used as a sub-tab within the Feedback tab.
 */

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Lightbulb,
  Plus,
  Link2,
  Loader2,
  Inbox,
  Unlink,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useToast } from '@/hooks/use-toast'
import { useWorkItemDetailContext } from '../shared/detail-context'
import { InsightCard } from '@/components/insights/insight-card'
import { InsightFormDialog } from '@/components/insights/insight-form'
import { InsightLinkDialog } from '@/components/insights/insight-link-dialog'
import type { CustomerInsightWithMeta, VoteType } from '@/lib/types/customer-insight'

// Animation variants
const listVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05 },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0 },
}

// ============================================================================
// Empty State
// ============================================================================

interface EmptyStateProps {
  onCreateNew: () => void
  onLinkExisting: () => void
}

function EmptyState({ onCreateNew, onLinkExisting }: EmptyStateProps) {
  return (
    <Card className="border-dashed">
      <CardContent className="flex flex-col items-center justify-center py-12">
        <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
          <Lightbulb className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-medium mb-2">No Insights Linked</h3>
        <p className="text-sm text-muted-foreground text-center max-w-sm mb-4">
          Customer insights help you understand the "why" behind this work item.
          Link existing insights or create new ones from customer feedback.
        </p>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={onLinkExisting}>
            <Link2 className="h-4 w-4 mr-2" />
            Link Existing
          </Button>
          <Button size="sm" onClick={onCreateNew}>
            <Plus className="h-4 w-4 mr-2" />
            Create New
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

// ============================================================================
// Loading State
// ============================================================================

function LoadingState() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <Card key={i}>
          <CardContent className="p-4">
            <div className="space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

// ============================================================================
// Stats Header
// ============================================================================

interface StatsHeaderProps {
  total: number
  positiveCount: number
  negativeCount: number
  onCreateNew: () => void
  onLinkExisting: () => void
}

function StatsHeader({
  total,
  positiveCount,
  negativeCount,
  onCreateNew,
  onLinkExisting,
}: StatsHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center gap-6">
        <div>
          <p className="text-2xl font-bold">{total}</p>
          <p className="text-xs text-muted-foreground">Linked Insights</p>
        </div>
        <div className="h-8 border-l" />
        <div className="flex gap-4">
          <div className="text-center">
            <p className="text-lg font-semibold text-green-600">{positiveCount}</p>
            <p className="text-xs text-muted-foreground">Positive</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-semibold text-red-600">{negativeCount}</p>
            <p className="text-xs text-muted-foreground">Negative</p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={onLinkExisting}>
          <Link2 className="h-4 w-4 mr-2" />
          Link Existing
        </Button>
        <Button size="sm" onClick={onCreateNew}>
          <Plus className="h-4 w-4 mr-2" />
          New Insight
        </Button>
      </div>
    </div>
  )
}

// ============================================================================
// Linked Insight Card (with unlink option)
// ============================================================================

interface LinkedInsightCardProps {
  insight: CustomerInsightWithMeta & {
    link_id?: string
    relevance_score?: number
    link_notes?: string
  }
  userVote: VoteType | null
  onVote: (voteType: VoteType) => Promise<void>
  onUnlink: () => void
  onView?: () => void
}

function LinkedInsightCard({
  insight,
  userVote,
  onVote,
  onUnlink,
  onView,
}: LinkedInsightCardProps) {
  return (
    <motion.div variants={itemVariants} className="relative group">
      <InsightCard
        insight={insight}
        userVote={userVote}
        onVote={onVote}
        onView={onView}
        showActions={false}
      />
      {/* Relevance indicator */}
      {insight.relevance_score && (
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <Badge variant="outline" className="text-xs">
            Relevance: {insight.relevance_score}/10
          </Badge>
        </div>
      )}
      {/* Unlink button */}
      <Button
        variant="ghost"
        size="sm"
        className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
        onClick={onUnlink}
      >
        <Unlink className="h-4 w-4 mr-1" />
        Unlink
      </Button>
    </motion.div>
  )
}

// ============================================================================
// Main Insights Sub-Tab Component
// ============================================================================

export function InsightsSubTab() {
  const { workItem } = useWorkItemDetailContext()
  const router = useRouter()
  const { toast } = useToast()

  // State
  const [linkedInsights, setLinkedInsights] = useState<
    (CustomerInsightWithMeta & {
      link_id?: string
      relevance_score?: number
      link_notes?: string
    })[]
  >([])
  const [userVotes, setUserVotes] = useState<Record<string, VoteType | null>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [linkDialogOpen, setLinkDialogOpen] = useState(false)
  const [selectedInsight, setSelectedInsight] = useState<CustomerInsightWithMeta | null>(null)

  // Fetch linked insights for this work item
  const fetchLinkedInsights = useCallback(async () => {
    setIsLoading(true)
    try {
      // Fetch work item insights via the work_item_insights junction table
      const response = await fetch(`/api/work-items/${workItem.id}/insights`)

      if (!response.ok) {
        // If API doesn't exist yet, return empty list
        if (response.status === 404) {
          setLinkedInsights([])
          return
        }
        throw new Error('Failed to fetch linked insights')
      }

      const data = await response.json()
      setLinkedInsights(data.data || [])

      // Initialize user votes
      const votes: Record<string, VoteType | null> = {}
      data.data?.forEach((insight: CustomerInsightWithMeta) => {
        votes[insight.id] = null
      })
      setUserVotes(votes)
    } catch (error) {
      console.error('Failed to fetch linked insights:', error)
      // Don't show error toast for missing API
      setLinkedInsights([])
    } finally {
      setIsLoading(false)
    }
  }, [workItem.id])

  useEffect(() => {
    fetchLinkedInsights()
  }, [fetchLinkedInsights])

  // Handle vote
  const handleVote = async (insightId: string, voteType: VoteType) => {
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
      setUserVotes((prev) => ({
        ...prev,
        [insightId]: data.data.vote_type,
      }))

      fetchLinkedInsights()
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.message || 'Failed to record vote',
        variant: 'destructive',
      })
    }
  }

  // Handle unlink
  const handleUnlink = async (insightId: string) => {
    if (!confirm('Remove this insight from the work item?')) return

    try {
      const response = await fetch(
        `/api/insights/${insightId}/link?work_item_id=${workItem.id}`,
        { method: 'DELETE' }
      )

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to unlink insight')
      }

      toast({
        title: 'Insight unlinked',
        description: 'The insight has been removed from this work item',
      })

      fetchLinkedInsights()
      router.refresh()
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.message || 'Failed to unlink insight',
        variant: 'destructive',
      })
    }
  }

  // Handle create success
  const handleCreateSuccess = () => {
    setCreateDialogOpen(false)
    fetchLinkedInsights()
    router.refresh()
  }

  // Handle link success
  const handleLinkSuccess = () => {
    setLinkDialogOpen(false)
    fetchLinkedInsights()
    router.refresh()
  }

  // Calculate stats
  const positiveCount = linkedInsights.filter((i) => i.sentiment === 'positive').length
  const negativeCount = linkedInsights.filter((i) => i.sentiment === 'negative').length

  return (
    <div className="space-y-6">
      {/* Header with Stats */}
      {linkedInsights.length > 0 && (
        <StatsHeader
          total={linkedInsights.length}
          positiveCount={positiveCount}
          negativeCount={negativeCount}
          onCreateNew={() => setCreateDialogOpen(true)}
          onLinkExisting={() => setLinkDialogOpen(true)}
        />
      )}

      {/* Insight List */}
      {isLoading ? (
        <LoadingState />
      ) : linkedInsights.length === 0 ? (
        <EmptyState
          onCreateNew={() => setCreateDialogOpen(true)}
          onLinkExisting={() => setLinkDialogOpen(true)}
        />
      ) : (
        <motion.div
          variants={listVariants}
          initial="hidden"
          animate="visible"
          className="space-y-4"
        >
          {linkedInsights.map((insight) => (
            <LinkedInsightCard
              key={insight.id}
              insight={insight}
              userVote={userVotes[insight.id]}
              onVote={(voteType) => handleVote(insight.id, voteType)}
              onUnlink={() => handleUnlink(insight.id)}
              onView={() => setSelectedInsight(insight)}
            />
          ))}
        </motion.div>
      )}

      {/* Create Insight Dialog */}
      <InsightFormDialog
        teamId={workItem.team_id}
        workspaceId={workItem.workspace_id}
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onSuccess={handleCreateSuccess}
      />

      {/* Link Dialog - needs a placeholder insight for now */}
      {/* We'll create a new InsightSearchLinkDialog for linking FROM work item side */}
    </div>
  )
}
