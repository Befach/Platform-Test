'use client'

/**
 * ModeAwareDashboard Component
 *
 * Renders mode-specific widgets based on workspace mode.
 * Each mode shows different widgets relevant to its lifecycle stage.
 */

import { useMemo } from 'react'
import { WorkspaceMode, WORKSPACE_MODE_CONFIG } from '@/lib/types/workspace-mode'
import { type WorkspacePhase } from '@/lib/constants/workspace-phases'
import {
  getModeDashboardWidgets,
  DashboardWidget,
} from '@/lib/workspace-modes/mode-config'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { WorkspaceStatsGrid } from '@/components/workspaces/workspace-stats-grid'
import { MultiPhaseProgressBar } from '@/components/workspaces/multi-phase-progress-bar'
import { ActivityFeed } from '@/components/workspaces/activity-feed'
import { QuickActionsWidget } from './mode-widgets/quick-actions-widget'
import { BlockersWidget } from './mode-widgets/blockers-widget'
import { FeedbackSummaryWidget } from './mode-widgets/feedback-summary-widget'
import { TechDebtWidget } from './mode-widgets/tech-debt-widget'
import { WorkspaceHealthCard } from '@/components/workspace/workspace-health-card'

// ============================================================================
// TYPES
// ============================================================================

interface WorkItem {
  id: string
  name: string
  type: string
  status: string
  phase: string
  priority?: string
  blockers?: string
  department_id?: string
  tags?: string[]
  created_at?: string
  updated_at?: string
}

/** Phase data with count and percentage */
interface PhaseData {
  count: number
  percentage: number
}

/** Distribution of work items across phases */
type PhaseDistribution = Record<WorkspacePhase, PhaseData>

interface ModeAwareDashboardProps {
  mode: WorkspaceMode
  workspaceId: string
  workItems: WorkItem[]
  teamSize: number
  phaseDistribution: PhaseDistribution
  feedbackStats?: {
    total: number
    positive: number
    neutral: number
    negative: number
    topRequests: { id: string; title: string; votes: number }[]
    recentFeedback: { id: string; title: string; sentiment: string; source?: string }[]
  }
  className?: string
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function getBlockers(workItems: WorkItem[]) {
  return workItems
    .filter((item) => item.blockers || item.status === 'blocked')
    .map((item) => ({
      id: item.id,
      name: item.name,
      type: item.type,
      priority: item.priority || 'medium',
      blockedBy: item.blockers,
      daysBlocked: item.created_at
        ? Math.floor((Date.now() - new Date(item.created_at).getTime()) / (1000 * 60 * 60 * 24))
        : undefined,
    }))
}

function getTechDebtItems(workItems: WorkItem[]) {
  const techDebtItems = workItems.filter(
    (item) =>
      item.type === 'enhancement' ||
      item.tags?.includes('tech-debt') ||
      item.tags?.includes('refactoring')
  )

  return {
    total: techDebtItems.length,
    resolved: techDebtItems.filter((i) => i.status === 'completed').length,
    items: techDebtItems.slice(0, 10).map((item) => ({
      id: item.id,
      name: item.name,
      category: getCategoryFromTags(item.tags || []),
      priority: item.priority || 'medium',
      effort: getEffortFromPriority(item.priority),
      age: item.created_at
        ? Math.floor((Date.now() - new Date(item.created_at).getTime()) / (1000 * 60 * 60 * 24))
        : undefined,
    })),
  }
}

function getCategoryFromTags(tags: string[]): 'code' | 'test' | 'docs' | 'deps' | 'other' {
  if (tags.includes('test') || tags.includes('testing')) return 'test'
  if (tags.includes('docs') || tags.includes('documentation')) return 'docs'
  if (tags.includes('deps') || tags.includes('dependencies')) return 'deps'
  if (tags.includes('refactoring') || tags.includes('code-quality')) return 'code'
  return 'other'
}

function getEffortFromPriority(priority?: string): 'low' | 'medium' | 'high' {
  if (priority === 'critical' || priority === 'high') return 'high'
  if (priority === 'low') return 'low'
  return 'medium'
}

// ============================================================================
// COMPONENT
// ============================================================================

export function ModeAwareDashboard({
  mode,
  workspaceId,
  workItems,
  teamSize,
  phaseDistribution,
  feedbackStats,
  className,
}: ModeAwareDashboardProps) {
  const modeConfig = WORKSPACE_MODE_CONFIG[mode]
  const widgets = getModeDashboardWidgets(mode)

  // Calculate stats
  const totalWorkItems = workItems.length
  const completedWorkItems = workItems.filter((item) => item.status === 'completed').length
  const inProgressWorkItems = workItems.filter((item) => item.status === 'in_progress').length
  const completionPercentage = totalWorkItems > 0
    ? Math.round((completedWorkItems / totalWorkItems) * 100)
    : 0

  // Get mode-specific data
  const blockers = useMemo(() => getBlockers(workItems), [workItems])
  const techDebtStats = useMemo(() => getTechDebtItems(workItems), [workItems])

  // Default feedback stats if not provided
  const defaultFeedbackStats = {
    total: 0,
    positive: 0,
    neutral: 0,
    negative: 0,
    topRequests: [],
    recentFeedback: [],
  }

  // Render widget based on type
  const renderWidget = (widget: DashboardWidget) => {
    switch (widget) {
      case 'stats-grid':
        return (
          <WorkspaceStatsGrid
            key={widget}
            totalWorkItems={totalWorkItems}
            completedWorkItems={completedWorkItems}
            inProgressWorkItems={inProgressWorkItems}
            completionPercentage={completionPercentage}
            teamSize={teamSize}
          />
        )

      case 'phase-progress':
        return (
          <MultiPhaseProgressBar
            key={widget}
            distribution={phaseDistribution}
            totalItems={totalWorkItems}
          />
        )

      case 'quick-create':
        return (
          <QuickActionsWidget
            key={widget}
            mode={mode}
            workspaceId={workspaceId}
          />
        )

      case 'activity-feed':
        return <ActivityFeed key={widget} workItems={workItems} />

      case 'blockers-panel':
        return (
          <BlockersWidget
            key={widget}
            blockers={blockers}
            onViewBlocker={(id) => window.location.href = `/workspaces/${workspaceId}/work-items/${id}`}
            onViewAll={() => window.location.href = `/workspaces/${workspaceId}?view=work-items&filter=blocked`}
          />
        )

      case 'feedback-summary':
        return (
          <FeedbackSummaryWidget
            key={widget}
            stats={feedbackStats || defaultFeedbackStats}
            onViewInsight={(id) => window.location.href = `/insights/${id}`}
            onViewAll={() => window.location.href = `/insights`}
          />
        )

      case 'tech-debt':
        return (
          <TechDebtWidget
            key={widget}
            stats={techDebtStats}
            onViewItem={(id) => window.location.href = `/workspaces/${workspaceId}/work-items/${id}`}
            onViewAll={() => window.location.href = `/workspaces/${workspaceId}?view=work-items&tag=tech-debt`}
          />
        )

      case 'workspace-health':
        return (
          <WorkspaceHealthCard
            key={widget}
            workspaceId={workspaceId}
          />
        )

      // Placeholder widgets for future implementation
      case 'launch-countdown':
      case 'critical-path':
      case 'team-workload':
      case 'feature-requests':
      case 'analytics-overview':
      case 'bug-queue':
      case 'stability-metrics':
      case 'onboarding':
      case 'recent-items':
        return (
          <Card key={widget}>
            <CardHeader className="pb-2">
              <CardTitle className="text-base capitalize">
                {widget.replace(/-/g, ' ')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center h-32 text-muted-foreground">
                Coming soon
              </div>
            </CardContent>
          </Card>
        )

      default:
        return null
    }
  }

  return (
    <div className={className}>
      {/* Mode Indicator */}
      <div className="flex items-center gap-2 mb-4">
        <Badge
          variant="outline"
          style={{ borderColor: modeConfig.color, color: modeConfig.color }}
        >
          {modeConfig.name} Mode
        </Badge>
        <span className="text-sm text-muted-foreground">
          Dashboard optimized for {modeConfig.name.toLowerCase()} phase
        </span>
      </div>

      {/* Widgets Grid */}
      <div className="space-y-6">
        {widgets.map((widget) => renderWidget(widget))}
      </div>
    </div>
  )
}

export default ModeAwareDashboard
