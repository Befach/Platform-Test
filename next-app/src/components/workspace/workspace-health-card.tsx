'use client'

/**
 * Workspace Health Card
 *
 * Displays workspace health analysis including:
 * - Overall health score gauge (0-100)
 * - Score breakdown by component
 * - Upgrade opportunities list
 * - Recommendations
 *
 * @module components/workspace/workspace-health-card
 */

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  RefreshCw,
  HelpCircle,
  ArrowRight,
  AlertCircle,
  Clock,
  TrendingUp,
  Layers,
  Sparkles,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useWorkspaceAnalysis } from '@/hooks/use-workspace-analysis'
import {
  type WorkspaceAnalysis,
  type HealthBreakdown,
  type UpgradeOpportunity,
  getHealthStatus,
} from '@/lib/workspace/analyzer-types'
import { PHASE_CONFIG, getTypePhaseConfig, type WorkspacePhase, type WorkItemType } from '@/lib/constants/workspace-phases'

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface WorkspaceHealthCardProps {
  workspaceId: string
  className?: string
  /** Compact mode shows only score and top recommendations */
  compact?: boolean
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function WorkspaceHealthCard({
  workspaceId,
  className,
  compact = false,
}: WorkspaceHealthCardProps) {
  const { analysis, isLoading, isRefetching, error, refetch, dataUpdatedAt } =
    useWorkspaceAnalysis(workspaceId)

  const [isExpanded, setIsExpanded] = useState(!compact)

  // Loading state
  if (isLoading) {
    return <HealthCardSkeleton className={className} compact={compact} />
  }

  // Error state
  if (error) {
    return (
      <Card className={cn('p-6', className)}>
        <div className="flex items-center gap-3 text-destructive">
          <AlertCircle className="h-5 w-5" />
          <div>
            <p className="font-medium">Failed to load analysis</p>
            <p className="text-sm text-muted-foreground">{error}</p>
          </div>
        </div>
        <Button variant="outline" size="sm" className="mt-4" onClick={() => refetch()}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Retry
        </Button>
      </Card>
    )
  }

  // No data state
  if (!analysis) {
    return null
  }

  const healthStatus = getHealthStatus(analysis.healthScore)

  return (
    <Card className={cn('overflow-hidden', className)}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle className="text-lg">Workspace Health</CardTitle>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p>
                    Health score measures workspace flow: distribution balance, item
                    readiness, update freshness, and phase progression.
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => refetch()}
              disabled={isRefetching}
            >
              <RefreshCw
                className={cn('h-4 w-4', isRefetching && 'animate-spin')}
              />
            </Button>
            {compact && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsExpanded(!isExpanded)}
              >
                {isExpanded ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Score and Breakdown Row */}
        <div className="flex items-start gap-6">
          <HealthScoreGauge
            score={analysis.healthScore}
            status={healthStatus}
          />
          {(!compact || isExpanded) && (
            <HealthBreakdownBars breakdown={analysis.healthBreakdown} />
          )}
        </div>

        {/* Expandable Content */}
        {(!compact || isExpanded) && (
          <>
            {/* Upgrade Opportunities */}
            {analysis.upgradeOpportunities.length > 0 && (
              <UpgradeOpportunitiesList
                opportunities={analysis.upgradeOpportunities}
                limit={compact ? 3 : 5}
              />
            )}

            {/* Recommendations */}
            {analysis.recommendations.length > 0 && (
              <RecommendationsList recommendations={analysis.recommendations} />
            )}
          </>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-2 border-t text-xs text-muted-foreground">
          <span>
            {analysis.totalItems} item{analysis.totalItems !== 1 ? 's' : ''} analyzed
          </span>
          {dataUpdatedAt && (
            <span>
              Last analyzed:{' '}
              {formatTimeAgo(dataUpdatedAt)}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

/**
 * Health Score Gauge - Circular display of overall score
 */
function HealthScoreGauge({
  score,
  status,
}: {
  score: number
  status: { label: string; color: string; emoji: string }
}) {
  // Calculate stroke for circular progress
  const radius = 40
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (score / 100) * circumference

  // Color based on score
  const getScoreColor = () => {
    if (score >= 80) return 'stroke-green-500'
    if (score >= 60) return 'stroke-yellow-500'
    if (score >= 40) return 'stroke-orange-500'
    return 'stroke-red-500'
  }

  return (
    <div className="flex flex-col items-center">
      <div className="relative h-24 w-24">
        <svg className="h-24 w-24 -rotate-90" viewBox="0 0 100 100">
          {/* Background circle */}
          <circle
            cx="50"
            cy="50"
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth="8"
            className="text-muted/20"
          />
          {/* Progress circle */}
          <circle
            cx="50"
            cy="50"
            r={radius}
            fill="none"
            strokeWidth="8"
            strokeLinecap="round"
            className={cn('transition-all duration-500', getScoreColor())}
            style={{
              strokeDasharray: circumference,
              strokeDashoffset,
            }}
          />
        </svg>
        {/* Score text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold">{score}</span>
          <span className="text-xs text-muted-foreground">/100</span>
        </div>
      </div>
      <Badge variant="secondary" className={cn('mt-2', status.color)}>
        {status.emoji} {status.label}
      </Badge>
    </div>
  )
}

/**
 * Health Breakdown Bars - Shows score components
 */
function HealthBreakdownBars({ breakdown }: { breakdown: HealthBreakdown }) {
  const components = [
    {
      key: 'distribution',
      label: 'Distribution',
      value: breakdown.distribution,
      max: 30,
      icon: Layers,
      tooltip: 'Balance of items across phases',
    },
    {
      key: 'readiness',
      label: 'Readiness',
      value: breakdown.readiness,
      max: 30,
      icon: Sparkles,
      tooltip: 'Average readiness to advance',
    },
    {
      key: 'freshness',
      label: 'Freshness',
      value: breakdown.freshness,
      max: 20,
      icon: Clock,
      tooltip: 'Items updated recently',
    },
    {
      key: 'flow',
      label: 'Flow',
      value: breakdown.flow,
      max: 20,
      icon: TrendingUp,
      tooltip: 'Items advancing through phases',
    },
  ]

  return (
    <div className="flex-1 space-y-2">
      {components.map((comp) => {
        const percentage = (comp.value / comp.max) * 100
        return (
          <TooltipProvider key={comp.key}>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-2">
                  <comp.icon className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span className="w-20 text-xs truncate">{comp.label}</span>
                  <Progress value={percentage} className="h-2 flex-1" />
                  <span className="w-12 text-xs text-muted-foreground text-right">
                    {comp.value}/{comp.max}
                  </span>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>{comp.tooltip}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )
      })}
    </div>
  )
}

/**
 * Upgrade Opportunities List - Items ready to advance
 */
function UpgradeOpportunitiesList({
  opportunities,
  limit = 5,
}: {
  opportunities: UpgradeOpportunity[]
  limit?: number
}) {
  const displayed = opportunities.slice(0, limit)
  const remaining = opportunities.length - limit

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <ArrowRight className="h-4 w-4 text-green-600" />
        <span className="text-sm font-medium">
          Ready to Advance ({opportunities.length})
        </span>
      </div>
      <div className="space-y-1 pl-6">
        {displayed.map((opp) => {
          // Use type-aware phase config, defaulting to 'feature' for backward compatibility
          const currentPhase = getTypePhaseConfig('feature', opp.currentPhase) || PHASE_CONFIG.design
          const nextPhase = getTypePhaseConfig('feature', opp.canUpgradeTo) || PHASE_CONFIG.build

          return (
            <div
              key={opp.workItemId}
              className="flex items-center gap-2 text-sm"
            >
              <span className="truncate flex-1">{opp.workItemName}</span>
              <Badge
                variant="outline"
                className={cn('text-xs', currentPhase.textColor)}
              >
                {currentPhase.name}
              </Badge>
              <ArrowRight className="h-3 w-3 text-muted-foreground" />
              <Badge
                variant="outline"
                className={cn('text-xs', nextPhase.textColor)}
              >
                {nextPhase.name}
              </Badge>
              <span className="text-xs text-muted-foreground">
                {opp.readinessPercent}%
              </span>
            </div>
          )
        })}
        {remaining > 0 && (
          <span className="text-xs text-muted-foreground">
            +{remaining} more
          </span>
        )}
      </div>
    </div>
  )
}

/**
 * Recommendations List - Actionable suggestions
 */
function RecommendationsList({
  recommendations,
}: {
  recommendations: string[]
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <AlertCircle className="h-4 w-4 text-amber-600" />
        <span className="text-sm font-medium">Recommendations</span>
      </div>
      <ul className="space-y-1 pl-6 text-sm text-muted-foreground">
        {recommendations.map((rec, idx) => (
          <li key={idx} className="list-disc list-inside">
            {rec}
          </li>
        ))}
      </ul>
    </div>
  )
}

/**
 * Loading Skeleton
 */
function HealthCardSkeleton({
  className,
  compact,
}: {
  className?: string
  compact?: boolean
}) {
  return (
    <Card className={cn('p-6', className)}>
      <div className="flex items-center justify-between mb-4">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-8 w-8 rounded" />
      </div>
      <div className="flex items-start gap-6">
        <Skeleton className="h-24 w-24 rounded-full" />
        {!compact && (
          <div className="flex-1 space-y-3">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
          </div>
        )}
      </div>
      {!compact && (
        <>
          <Skeleton className="h-20 w-full mt-4" />
          <Skeleton className="h-16 w-full mt-4" />
        </>
      )}
    </Card>
  )
}

// ============================================================================
// UTILITIES
// ============================================================================

/**
 * Format timestamp as relative time
 */
function formatTimeAgo(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000)

  if (seconds < 60) return 'just now'
  if (seconds < 3600) return `${Math.floor(seconds / 60)} min ago`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`
  return `${Math.floor(seconds / 86400)} days ago`
}

// ============================================================================
// EXPORTS
// ============================================================================

export {
  HealthScoreGauge,
  HealthBreakdownBars,
  UpgradeOpportunitiesList,
  RecommendationsList,
}
