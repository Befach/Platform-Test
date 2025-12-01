'use client'

/**
 * Feedback Tab
 *
 * Displays feedback linked to this work item with:
 * - Feedback list with source, priority, status badges
 * - Inline triage actions (implement/defer/reject)
 * - Add feedback dialog
 * - Empty state for no feedback
 */

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  MessageSquare,
  Plus,
  User,
  Mail,
  Building2,
  AlertCircle,
  CheckCircle,
  XCircle,
  Clock,
  Loader2,
  Filter,
  ArrowUpDown,
  ExternalLink,
  MoreHorizontal,
  Inbox,
  Lightbulb,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { useToast } from '@/hooks/use-toast'
import { useWorkItemDetailContext } from '../shared/detail-context'
import { FeedbackTriageDialog } from '@/components/feedback/feedback-triage-dialog'
import { InsightsSubTab } from './insights-sub-tab'
import type { FeedbackWithRelations } from '@/lib/types/feedback'
import { cn } from '@/lib/utils'

// ============================================================================
// Types & Constants
// ============================================================================

type FeedbackStatus = 'pending' | 'triaged' | 'implemented' | 'deferred' | 'rejected'
type FeedbackPriority = 'critical' | 'high' | 'medium' | 'low'
type FeedbackSource = 'user' | 'stakeholder' | 'internal' | 'support' | 'analytics'

const STATUS_CONFIG: Record<FeedbackStatus, { label: string; color: string; icon: React.ElementType }> = {
  pending: { label: 'Pending', color: 'bg-amber-100 text-amber-700', icon: Clock },
  triaged: { label: 'Triaged', color: 'bg-blue-100 text-blue-700', icon: CheckCircle },
  implemented: { label: 'Implemented', color: 'bg-green-100 text-green-700', icon: CheckCircle },
  deferred: { label: 'Deferred', color: 'bg-slate-100 text-slate-700', icon: Clock },
  rejected: { label: 'Rejected', color: 'bg-red-100 text-red-700', icon: XCircle },
}

const PRIORITY_CONFIG: Record<FeedbackPriority, { label: string; color: string }> = {
  critical: { label: 'Critical', color: 'bg-red-100 text-red-700 border-red-200' },
  high: { label: 'High', color: 'bg-orange-100 text-orange-700 border-orange-200' },
  medium: { label: 'Medium', color: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
  low: { label: 'Low', color: 'bg-green-100 text-green-700 border-green-200' },
}

const SOURCE_CONFIG: Record<FeedbackSource, { label: string; icon: React.ElementType }> = {
  user: { label: 'User', icon: User },
  stakeholder: { label: 'Stakeholder', icon: Building2 },
  internal: { label: 'Internal', icon: Mail },
  support: { label: 'Support', icon: MessageSquare },
  analytics: { label: 'Analytics', icon: AlertCircle },
}

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
// Helper Functions
// ============================================================================

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7) return `${diffDays} days ago`
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`
  return formatDate(dateString)
}

// ============================================================================
// Feedback Card Component
// ============================================================================

interface FeedbackCardProps {
  feedback: FeedbackWithRelations
  onTriage: (feedback: FeedbackWithRelations) => void
}

function FeedbackCard({ feedback, onTriage }: FeedbackCardProps) {
  const statusConfig = STATUS_CONFIG[feedback.status as FeedbackStatus] || STATUS_CONFIG.pending
  const priorityConfig = PRIORITY_CONFIG[feedback.priority as FeedbackPriority] || PRIORITY_CONFIG.medium
  const sourceConfig = SOURCE_CONFIG[feedback.source as FeedbackSource] || SOURCE_CONFIG.user
  const StatusIcon = statusConfig.icon
  const SourceIcon = sourceConfig.icon

  return (
    <motion.div variants={itemVariants}>
      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          <div className="flex items-start gap-4">
            {/* Source Avatar */}
            <div className="flex-shrink-0">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <SourceIcon className="h-5 w-5 text-primary" />
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              {/* Header */}
              <div className="flex items-start justify-between gap-2 mb-2">
                <div>
                  <p className="font-medium text-sm">{feedback.source_name}</p>
                  {feedback.source_role && (
                    <p className="text-xs text-muted-foreground">{feedback.source_role}</p>
                  )}
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Badge variant="outline" className={cn('text-xs', priorityConfig.color)}>
                    {priorityConfig.label}
                  </Badge>
                  <Badge variant="secondary" className={cn('text-xs', statusConfig.color)}>
                    <StatusIcon className="h-3 w-3 mr-1" />
                    {statusConfig.label}
                  </Badge>
                </div>
              </div>

              {/* Feedback Content */}
              <p className="text-sm text-foreground line-clamp-3 mb-2">
                {feedback.content}
              </p>

              {/* Context if available */}
              {feedback.context && (
                <p className="text-xs text-muted-foreground italic line-clamp-1 mb-2">
                  Context: {feedback.context}
                </p>
              )}

              {/* Footer */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span title={formatDate(feedback.received_at)}>
                    {formatRelativeTime(feedback.received_at)}
                  </span>
                  <Badge variant="outline" className="text-xs">
                    {sourceConfig.label}
                  </Badge>
                </div>

                {/* Actions */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-7 w-7">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onTriage(feedback)}>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Triage Feedback
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem>
                      <ExternalLink className="h-4 w-4 mr-2" />
                      View Full Details
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Decision info if triaged */}
              {feedback.decision && (
                <div className="mt-3 pt-3 border-t">
                  <p className="text-xs text-muted-foreground">
                    <span className="font-medium capitalize">{feedback.decision}</span>
                    {feedback.decision_reason && `: ${feedback.decision_reason}`}
                  </p>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

// ============================================================================
// Empty State
// ============================================================================

function EmptyState() {
  return (
    <Card className="border-dashed">
      <CardContent className="flex flex-col items-center justify-center py-12">
        <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
          <Inbox className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-medium mb-2">No Feedback Yet</h3>
        <p className="text-sm text-muted-foreground text-center max-w-sm mb-4">
          Feedback from users, stakeholders, and team members will appear here.
          Add feedback to track suggestions and issues for this work item.
        </p>
        <Button variant="outline" size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Add Feedback
        </Button>
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
            <div className="flex items-start gap-4">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
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
  pending: number
  triaged: number
  statusFilter: string
  onStatusFilterChange: (value: string) => void
}

function StatsHeader({ total, pending, triaged, statusFilter, onStatusFilterChange }: StatsHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center gap-6">
        <div>
          <p className="text-2xl font-bold">{total}</p>
          <p className="text-xs text-muted-foreground">Total Feedback</p>
        </div>
        <div className="h-8 border-l" />
        <div className="flex gap-4">
          <div className="text-center">
            <p className="text-lg font-semibold text-amber-600">{pending}</p>
            <p className="text-xs text-muted-foreground">Pending</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-semibold text-blue-600">{triaged}</p>
            <p className="text-xs text-muted-foreground">Triaged</p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Select value={statusFilter} onValueChange={onStatusFilterChange}>
          <SelectTrigger className="w-[140px] h-8">
            <Filter className="h-3.5 w-3.5 mr-2" />
            <SelectValue placeholder="Filter" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="triaged">Triaged</SelectItem>
            <SelectItem value="implemented">Implemented</SelectItem>
            <SelectItem value="deferred">Deferred</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}

// ============================================================================
// Feedback Content Component (internal)
// ============================================================================

function FeedbackContent() {
  const { workItem } = useWorkItemDetailContext()
  const router = useRouter()
  const { toast } = useToast()

  // State
  const [feedbackList, setFeedbackList] = useState<FeedbackWithRelations[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('all')
  const [selectedFeedback, setSelectedFeedback] = useState<FeedbackWithRelations | null>(null)
  const [triageDialogOpen, setTriageDialogOpen] = useState(false)

  // Fetch feedback for this work item
  const fetchFeedback = useCallback(async () => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams({ work_item_id: workItem.id })
      if (statusFilter !== 'all') {
        params.set('status', statusFilter)
      }

      const response = await fetch(`/api/feedback?${params}`)
      if (!response.ok) throw new Error('Failed to fetch feedback')

      const data = await response.json()
      setFeedbackList(data.feedback || [])
    } catch (error) {
      console.error('Failed to fetch feedback:', error)
      toast({
        title: 'Error',
        description: 'Failed to load feedback',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }, [workItem.id, statusFilter, toast])

  useEffect(() => {
    fetchFeedback()
  }, [fetchFeedback])

  // Handle triage
  const handleTriage = useCallback((feedback: FeedbackWithRelations) => {
    setSelectedFeedback(feedback)
    setTriageDialogOpen(true)
  }, [])

  const handleTriageSuccess = useCallback(() => {
    setTriageDialogOpen(false)
    setSelectedFeedback(null)
    fetchFeedback()
    router.refresh()
  }, [fetchFeedback, router])

  // Calculate stats
  const pendingCount = feedbackList.filter((f) => f.status === 'pending').length
  const triagedCount = feedbackList.filter((f) => ['triaged', 'implemented', 'deferred', 'rejected'].includes(f.status)).length

  // Filter feedback
  const filteredFeedback = statusFilter === 'all'
    ? feedbackList
    : feedbackList.filter((f) => f.status === statusFilter)

  return (
    <div className="space-y-6">
      {/* Header with Stats */}
      <StatsHeader
        total={feedbackList.length}
        pending={pendingCount}
        triaged={triagedCount}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
      />

      {/* Feedback List */}
      {isLoading ? (
        <LoadingState />
      ) : filteredFeedback.length === 0 ? (
        <EmptyState />
      ) : (
        <motion.div
          variants={listVariants}
          initial="hidden"
          animate="visible"
          className="space-y-4"
        >
          {filteredFeedback.map((feedback) => (
            <FeedbackCard
              key={feedback.id}
              feedback={feedback}
              onTriage={handleTriage}
            />
          ))}
        </motion.div>
      )}

      {/* Triage Dialog */}
      <FeedbackTriageDialog
        feedback={selectedFeedback}
        open={triageDialogOpen}
        onOpenChange={setTriageDialogOpen}
        onSuccess={handleTriageSuccess}
      />
    </div>
  )
}

// ============================================================================
// Main Feedback Tab Component (with Insights sub-tab)
// ============================================================================

export function FeedbackTab() {
  const [activeSubTab, setActiveSubTab] = useState<'feedback' | 'insights'>('feedback')

  return (
    <div className="space-y-4">
      {/* Sub-tab Toggle */}
      <Tabs value={activeSubTab} onValueChange={(v) => setActiveSubTab(v as 'feedback' | 'insights')}>
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="feedback" className="gap-2">
            <MessageSquare className="h-4 w-4" />
            Feedback
          </TabsTrigger>
          <TabsTrigger value="insights" className="gap-2">
            <Lightbulb className="h-4 w-4" />
            Insights
          </TabsTrigger>
        </TabsList>

        <TabsContent value="feedback" className="mt-6">
          <FeedbackContent />
        </TabsContent>

        <TabsContent value="insights" className="mt-6">
          <InsightsSubTab />
        </TabsContent>
      </Tabs>
    </div>
  )
}
