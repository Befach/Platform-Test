/**
 * Workspace Analysis Service
 *
 * Analyzes workspace health by examining all work items and calculating:
 * - Phase distribution balance
 * - Individual item readiness (via Session 1's calculator)
 * - Freshness (recently updated items)
 * - Flow (items advancing through phases)
 *
 * Health Score Algorithm (Hybrid: Components + Penalties):
 * - Distribution: 30 points max
 * - Readiness: 30 points max
 * - Freshness: 20 points max
 * - Flow: 20 points max
 * - Penalties: -5 per stuck item, -10 per critical blocker
 *
 * @module lib/workspace/analyzer-service
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import type { WorkspacePhase } from '@/lib/constants/workspace-phases'
import { calculatePhaseDistribution, PHASE_ORDER } from '@/lib/constants/workspace-phases'
import {
  calculatePhaseReadiness,
  getPhaseTransitionConfig,
  type WorkItemForReadiness,
} from '@/lib/phase/readiness-calculator'
import {
  type WorkspaceAnalysis,
  type WorkItemForAnalysis,
  type MismatchedItem,
  type UpgradeOpportunity,
  type StaleItem,
  type HealthBreakdown,
  type AnalysisConfig,
  DEFAULT_ANALYSIS_CONFIG,
} from './analyzer-types'

// ============================================================================
// MAIN ANALYSIS FUNCTION
// ============================================================================

/**
 * Analyze a workspace and return comprehensive health metrics
 *
 * @param workspaceId - The workspace to analyze
 * @param teamId - Team ID for authorization
 * @param supabase - Supabase client instance
 * @param config - Optional configuration overrides
 * @returns Complete workspace analysis
 */
export async function analyzeWorkspace(
  workspaceId: string,
  teamId: string,
  supabase: SupabaseClient,
  config: Partial<AnalysisConfig> = {}
): Promise<WorkspaceAnalysis> {
  const analysisConfig = { ...DEFAULT_ANALYSIS_CONFIG, ...config }

  // Fetch all work items for the workspace
  const { data: workItems, error } = await supabase
    .from('work_items')
    .select('*')
    .eq('workspace_id', workspaceId)
    .eq('team_id', teamId)
    .order('updated_at', { ascending: false })

  if (error) {
    throw new Error(`Failed to fetch work items: ${error.message}`)
  }

  const items = (workItems || []) as WorkItemForAnalysis[]

  // Handle empty workspace
  if (items.length === 0) {
    return createEmptyAnalysis(workspaceId)
  }

  // Fetch timeline items count per work item (for readiness calculation)
  const { data: timelineCounts } = await supabase
    .from('timeline_items')
    .select('work_item_id')
    .eq('team_id', teamId)
    .in(
      'work_item_id',
      items.map((i) => i.id)
    )

  const timelineCountMap = new Map<string, number>()
  if (timelineCounts) {
    for (const tc of timelineCounts) {
      const current = timelineCountMap.get(tc.work_item_id) || 0
      timelineCountMap.set(tc.work_item_id, current + 1)
    }
  }

  // Calculate phase distribution
  // Transform items to match calculatePhaseDistribution's expected type
  // (converts null to undefined for progress_percent)
  const itemsForDistribution = items.map((item) => ({
    ...item,
    progress_percent: item.progress_percent ?? undefined,
    actual_start_date: item.actual_start_date ?? undefined,
    actual_end_date: item.actual_end_date ?? undefined,
  }))
  const phaseDistribution = calculatePhaseDistribution(itemsForDistribution)

  // Calculate all components
  const distributionScore = calculateDistributionScore(phaseDistribution)
  const { score: readinessScore, opportunities } = await calculateReadinessScoreAndOpportunities(
    items,
    timelineCountMap,
    analysisConfig.upgradeReadinessThreshold
  )
  const { score: freshnessScore, staleItems } = calculateFreshnessScore(
    items,
    analysisConfig.staleThresholdDays
  )
  const flowScore = calculateFlowScore(items, analysisConfig.flowLookbackDays)

  // Detect mismatches
  const mismatchedItems = detectMismatches(items)

  // Calculate penalties
  const stuckPenalty = calculateStuckPenalty(items, analysisConfig.stuckThresholdDays)

  // Calculate final health score
  const baseScore = distributionScore + readinessScore + freshnessScore + flowScore
  const healthScore = Math.max(0, Math.min(100, baseScore - stuckPenalty))

  const healthBreakdown: HealthBreakdown = {
    distribution: distributionScore,
    readiness: readinessScore,
    freshness: freshnessScore,
    flow: flowScore,
  }

  // Generate recommendations
  const recommendations = generateRecommendations({
    phaseDistribution,
    mismatchedItems,
    upgradeOpportunities: opportunities,
    staleItems,
    healthBreakdown,
    totalItems: items.length,
  })

  return {
    workspaceId,
    analyzedAt: new Date().toISOString(),
    totalItems: items.length,
    phaseDistribution,
    mismatchedItems,
    upgradeOpportunities: opportunities,
    staleItems,
    healthScore: Math.round(healthScore),
    healthBreakdown,
    recommendations,
  }
}

// ============================================================================
// SCORE CALCULATION FUNCTIONS
// ============================================================================

/**
 * Calculate distribution balance score (0-30 points)
 *
 * Penalizes workspaces where >50% of items are in a single phase.
 * Exception: If all items are in "launch", that's fine (project complete).
 */
function calculateDistributionScore(
  distribution: Record<WorkspacePhase, { count: number; percentage: number }>
): number {
  const MAX_SCORE = 30

  // Check if all items are in launch (completed project)
  if (distribution.launch.percentage === 100) {
    return MAX_SCORE // Perfect score for completed projects
  }

  // Find the highest concentration
  const maxPercentage = Math.max(
    distribution.design.percentage,
    distribution.build.percentage,
    distribution.refine.percentage,
    distribution.launch.percentage
  )

  // Ideal distribution: 25% in each phase
  // Penalty starts when any phase has >40% of items
  if (maxPercentage <= 40) {
    return MAX_SCORE
  }

  // Linear penalty: lose 0.5 points per percentage point over 40%
  const overage = maxPercentage - 40
  const penalty = overage * 0.5

  return Math.max(0, MAX_SCORE - penalty)
}

/**
 * Calculate readiness score (0-30 points) and find upgrade opportunities
 *
 * Uses Session 1's readiness calculator to determine average readiness
 * across all non-launch items.
 */
async function calculateReadinessScoreAndOpportunities(
  items: WorkItemForAnalysis[],
  timelineCountMap: Map<string, number>,
  upgradeThreshold: number
): Promise<{ score: number; opportunities: UpgradeOpportunity[] }> {
  const MAX_SCORE = 30
  const opportunities: UpgradeOpportunity[] = []

  // Filter out items in launch phase (can't upgrade further)
  const upgradableItems = items.filter((item) => item.phase !== 'launch')

  if (upgradableItems.length === 0) {
    // All items in launch = high readiness
    return { score: MAX_SCORE, opportunities: [] }
  }

  let totalReadiness = 0

  for (const item of upgradableItems) {
    const workItemForReadiness: WorkItemForReadiness = {
      id: item.id,
      name: item.name,
      purpose: item.purpose || null,
      type: item.type,
      phase: item.phase,
      target_release: item.target_release,
      acceptance_criteria: item.acceptance_criteria,
      business_value: item.business_value,
      customer_impact: item.customer_impact,
      strategic_alignment: item.strategic_alignment,
      estimated_hours: item.estimated_hours,
      priority: item.priority,
      actual_start_date: item.actual_start_date,
      actual_end_date: item.actual_end_date,
      actual_hours: item.actual_hours,
      progress_percent: item.progress_percent,
      quality_approved: item.quality_approved,
    }

    const timelineCount = timelineCountMap.get(item.id) || 0
    const readiness = calculatePhaseReadiness(workItemForReadiness, timelineCount)

    totalReadiness += readiness.readinessPercent

    // Track upgrade opportunities
    if (readiness.readinessPercent >= upgradeThreshold && readiness.nextPhase) {
      opportunities.push({
        workItemId: item.id,
        workItemName: item.name,
        currentPhase: item.phase,
        canUpgradeTo: readiness.nextPhase,
        readinessPercent: readiness.readinessPercent,
        missingFields: readiness.missingFields.map((f) => f.label),
      })
    }
  }

  // Average readiness scaled to 30 points
  const averageReadiness = totalReadiness / upgradableItems.length
  const score = (averageReadiness / 100) * MAX_SCORE

  // Sort opportunities by readiness (highest first)
  opportunities.sort((a, b) => b.readinessPercent - a.readinessPercent)

  return { score: Math.round(score), opportunities }
}

/**
 * Calculate freshness score (0-20 points) and identify stale items
 *
 * Items updated within the threshold days contribute to freshness.
 */
function calculateFreshnessScore(
  items: WorkItemForAnalysis[],
  staleThresholdDays: number
): { score: number; staleItems: StaleItem[] } {
  const MAX_SCORE = 20
  const now = new Date()
  const staleItems: StaleItem[] = []

  let freshCount = 0

  for (const item of items) {
    const updatedAt = item.updated_at ? new Date(item.updated_at) : new Date(item.created_at)
    const daysSinceUpdate = Math.floor(
      (now.getTime() - updatedAt.getTime()) / (1000 * 60 * 60 * 24)
    )

    if (daysSinceUpdate <= staleThresholdDays) {
      freshCount++
    } else {
      staleItems.push({
        workItemId: item.id,
        workItemName: item.name,
        daysSinceUpdate,
        phase: item.phase,
      })
    }
  }

  // Score based on percentage of fresh items
  const freshPercentage = (freshCount / items.length) * 100
  const score = (freshPercentage / 100) * MAX_SCORE

  // Sort stale items by days since update (most stale first)
  staleItems.sort((a, b) => b.daysSinceUpdate - a.daysSinceUpdate)

  return { score: Math.round(score), staleItems }
}

/**
 * Calculate flow score (0-20 points)
 *
 * Rewards workspaces where items are advancing through phases.
 * Looks at phase_changed_at to find recently advanced items.
 */
function calculateFlowScore(items: WorkItemForAnalysis[], lookbackDays: number): number {
  const MAX_SCORE = 20
  const now = new Date()
  const lookbackMs = lookbackDays * 24 * 60 * 60 * 1000

  // Count items that advanced phase recently
  let advancedCount = 0

  for (const item of items) {
    if (item.phase_changed_at && item.previous_phase) {
      const changedAt = new Date(item.phase_changed_at)
      const timeSinceChange = now.getTime() - changedAt.getTime()

      if (timeSinceChange <= lookbackMs) {
        // Check if it was a forward movement
        const previousIndex = PHASE_ORDER.indexOf(item.previous_phase as WorkspacePhase)
        const currentIndex = PHASE_ORDER.indexOf(item.phase as WorkspacePhase)

        if (currentIndex > previousIndex) {
          advancedCount++
        }
      }
    }
  }

  // Also count items in launch as "flowed through"
  const launchCount = items.filter((i) => i.phase === 'launch').length

  // Score: combination of recent advances and completed items
  const flowPercentage = ((advancedCount + launchCount * 0.5) / items.length) * 100
  const score = Math.min(MAX_SCORE, (flowPercentage / 50) * MAX_SCORE)

  return Math.round(score)
}

/**
 * Calculate penalty for stuck items
 *
 * Items stuck in the same phase for too long get penalized.
 */
function calculateStuckPenalty(items: WorkItemForAnalysis[], stuckThresholdDays: number): number {
  const PENALTY_PER_ITEM = 5
  const now = new Date()
  const thresholdMs = stuckThresholdDays * 24 * 60 * 60 * 1000

  let stuckCount = 0

  for (const item of items) {
    // Skip items in launch (they're done)
    if (item.phase === 'launch') continue

    // Check how long in current phase
    const phaseChangedAt = item.phase_changed_at
      ? new Date(item.phase_changed_at)
      : new Date(item.created_at)

    const timeInPhase = now.getTime() - phaseChangedAt.getTime()

    if (timeInPhase > thresholdMs) {
      stuckCount++
    }
  }

  return stuckCount * PENALTY_PER_ITEM
}

// ============================================================================
// MISMATCH DETECTION
// ============================================================================

/**
 * Detect items that appear to be in the wrong phase based on their data
 */
function detectMismatches(items: WorkItemForAnalysis[]): MismatchedItem[] {
  const mismatches: MismatchedItem[] = []

  for (const item of items) {
    const mismatch = detectItemMismatch(item)
    if (mismatch) {
      mismatches.push(mismatch)
    }
  }

  return mismatches
}

/**
 * Check if a single item appears to be in the wrong phase
 */
function detectItemMismatch(item: WorkItemForAnalysis): MismatchedItem | null {
  const { phase, progress_percent, actual_start_date, actual_end_date } = item

  // Design phase mismatches
  if (phase === 'design') {
    // Has significant progress but still in design
    if (progress_percent && progress_percent >= 30) {
      return {
        workItemId: item.id,
        workItemName: item.name,
        currentPhase: phase,
        suggestedPhase: 'build',
        reason: `Has ${progress_percent}% progress but still in Design phase`,
      }
    }
    // Has start date but still in design
    if (actual_start_date) {
      return {
        workItemId: item.id,
        workItemName: item.name,
        currentPhase: phase,
        suggestedPhase: 'build',
        reason: 'Work has started (has start date) but still in Design phase',
      }
    }
  }

  // Build phase mismatches
  if (phase === 'build') {
    // Very high progress, should be in refine
    if (progress_percent && progress_percent >= 90) {
      return {
        workItemId: item.id,
        workItemName: item.name,
        currentPhase: phase,
        suggestedPhase: 'refine',
        reason: `Has ${progress_percent}% progress - ready for review/refinement`,
      }
    }
  }

  // Refine phase mismatches
  if (phase === 'refine') {
    // Has end date, should be in launch
    if (actual_end_date && progress_percent === 100) {
      return {
        workItemId: item.id,
        workItemName: item.name,
        currentPhase: phase,
        suggestedPhase: 'launch',
        reason: 'Work is complete (100% progress, has end date) - ready to launch',
      }
    }
  }

  return null
}

// ============================================================================
// RECOMMENDATION GENERATION
// ============================================================================

interface RecommendationContext {
  phaseDistribution: Record<WorkspacePhase, { count: number; percentage: number }>
  mismatchedItems: MismatchedItem[]
  upgradeOpportunities: UpgradeOpportunity[]
  staleItems: StaleItem[]
  healthBreakdown: HealthBreakdown
  totalItems: number
}

/**
 * Generate actionable recommendations based on analysis
 */
function generateRecommendations(context: RecommendationContext): string[] {
  const recommendations: string[] = []
  const {
    phaseDistribution,
    mismatchedItems,
    upgradeOpportunities,
    staleItems,
    healthBreakdown,
    totalItems,
  } = context

  // Distribution recommendations
  if (healthBreakdown.distribution < 20) {
    const dominant = Object.entries(phaseDistribution).reduce((a, b) =>
      a[1].percentage > b[1].percentage ? a : b
    )
    if (dominant[0] !== 'launch') {
      recommendations.push(
        `${dominant[1].percentage.toFixed(0)}% of items are in "${dominant[0]}" - consider advancing some items`
      )
    }
  }

  // Upgrade opportunities
  if (upgradeOpportunities.length > 0) {
    recommendations.push(
      `${upgradeOpportunities.length} item${upgradeOpportunities.length > 1 ? 's are' : ' is'} ready to advance to the next phase`
    )
  }

  // Stale items
  if (staleItems.length > 0) {
    recommendations.push(
      `${staleItems.length} item${staleItems.length > 1 ? 's haven\'t' : ' hasn\'t'} been updated in 7+ days`
    )
  }

  // Mismatched items
  if (mismatchedItems.length > 0) {
    recommendations.push(
      `${mismatchedItems.length} item${mismatchedItems.length > 1 ? 's appear' : ' appears'} to be in the wrong phase`
    )
  }

  // Freshness recommendation
  if (healthBreakdown.freshness < 10 && totalItems > 0) {
    recommendations.push('Most items are stale - consider reviewing and updating work items')
  }

  // Flow recommendation
  if (healthBreakdown.flow < 10 && totalItems > 3) {
    recommendations.push('Low flow rate - items may be stuck. Review blockers and dependencies')
  }

  // Empty design phase (for non-new workspaces)
  if (phaseDistribution.design.count === 0 && totalItems > 5) {
    recommendations.push('No items in Design phase - consider planning new features')
  }

  return recommendations.slice(0, 5) // Limit to top 5 recommendations
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Create an empty analysis result for workspaces with no items
 */
function createEmptyAnalysis(workspaceId: string): WorkspaceAnalysis {
  return {
    workspaceId,
    analyzedAt: new Date().toISOString(),
    totalItems: 0,
    phaseDistribution: {
      design: { count: 0, percentage: 0 },
      build: { count: 0, percentage: 0 },
      refine: { count: 0, percentage: 0 },
      launch: { count: 0, percentage: 0 },
    },
    mismatchedItems: [],
    upgradeOpportunities: [],
    staleItems: [],
    healthScore: 0,
    healthBreakdown: {
      distribution: 0,
      readiness: 0,
      freshness: 0,
      flow: 0,
    },
    recommendations: ['Add work items to start tracking workspace health'],
  }
}
