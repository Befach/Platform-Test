/**
 * Workspace Analysis Types
 *
 * Type definitions for the workspace analysis service that calculates
 * health scores, detects phase mismatches, and identifies upgrade opportunities.
 *
 * @module lib/workspace/analyzer-types
 */

import type { WorkspacePhase } from '@/lib/constants/workspace-phases'

// ============================================================================
// ANALYSIS RESULT TYPES
// ============================================================================

/**
 * Item that appears to be in the wrong phase based on its data
 */
export interface MismatchedItem {
  workItemId: string
  workItemName: string
  currentPhase: string // AnyWorkItemPhase
  suggestedPhase: string // AnyWorkItemPhase
  reason: string
}

/**
 * Item that is ready to advance to the next phase
 */
export interface UpgradeOpportunity {
  workItemId: string
  workItemName: string
  currentPhase: string // AnyWorkItemPhase
  canUpgradeTo: string // AnyWorkItemPhase
  readinessPercent: number
  missingFields: string[]
}

/**
 * Item that hasn't been updated recently
 */
export interface StaleItem {
  workItemId: string
  workItemName: string
  daysSinceUpdate: number
  phase: string // AnyWorkItemPhase
}

/**
 * Health score breakdown by component
 * Total: 100 points (30 + 30 + 20 + 20)
 */
export interface HealthBreakdown {
  /** Distribution balance score (0-30): Penalizes concentration in one phase */
  distribution: number
  /** Average readiness score (0-30): Based on Session 1's readiness calculator */
  readiness: number
  /** Freshness score (0-20): Items updated within threshold */
  freshness: number
  /** Flow score (0-20): Items that advanced phase recently */
  flow: number
}

/**
 * Phase distribution with count and percentage
 */
export interface PhaseDistributionEntry {
  count: number
  percentage: number
}

/**
 * Complete workspace analysis result
 */
export interface WorkspaceAnalysis {
  /** Workspace being analyzed */
  workspaceId: string

  /** ISO timestamp of when analysis was performed */
  analyzedAt: string

  /** Total work items in workspace */
  totalItems: number

  /** Distribution of items across phases (type-aware) */
  phaseDistribution: Record<string, PhaseDistributionEntry>

  /** Items that should move to a different phase */
  mismatchedItems: MismatchedItem[]

  /** Items ready to advance (80%+ readiness) */
  upgradeOpportunities: UpgradeOpportunity[]

  /** Items not updated in 7+ days */
  staleItems: StaleItem[]

  /** Overall health score (0-100) */
  healthScore: number

  /** Score breakdown by component */
  healthBreakdown: HealthBreakdown

  /** Actionable suggestions based on analysis */
  recommendations: string[]
}

// ============================================================================
// INPUT TYPES
// ============================================================================

/**
 * Work item data needed for analysis
 */
export interface WorkItemForAnalysis {
  id: string
  name: string
  phase: string // AnyWorkItemPhase
  type: string
  purpose?: string | null
  updated_at: string
  created_at: string
  // Fields for readiness calculation
  target_release?: string | null
  acceptance_criteria?: string | null
  business_value?: string | null
  customer_impact?: string | null
  strategic_alignment?: string | null
  estimated_hours?: number | null
  priority?: string | null
  actual_start_date?: string | null
  actual_end_date?: string | null
  actual_hours?: number | null
  progress_percent?: number | null
  quality_approved?: boolean
  // Phase tracking
  phase_changed_at?: string | null
  previous_phase?: string | null
}

// ============================================================================
// CONFIGURATION TYPES
// ============================================================================

/**
 * Configuration options for analysis
 */
export interface AnalysisConfig {
  /** Days without update to consider item stale (default: 7) */
  staleThresholdDays: number
  /** Days stuck in same phase to apply penalty (default: 14) */
  stuckThresholdDays: number
  /** Minimum readiness % to show as upgrade opportunity (default: 80) */
  upgradeReadinessThreshold: number
  /** Days to look back for flow calculation (default: 30) */
  flowLookbackDays: number
}

/**
 * Default analysis configuration
 */
export const DEFAULT_ANALYSIS_CONFIG: AnalysisConfig = {
  staleThresholdDays: 7,
  stuckThresholdDays: 14,
  upgradeReadinessThreshold: 80,
  flowLookbackDays: 30,
}

// ============================================================================
// SCORE INTERPRETATION
// ============================================================================

/**
 * Health score interpretation thresholds
 */
export const HEALTH_SCORE_THRESHOLDS = {
  HEALTHY: 80,      // 80-100: Green, healthy workspace
  ATTENTION: 60,    // 60-79: Yellow, needs attention
  CONCERNING: 40,   // 40-59: Orange, concerning
  CRITICAL: 0,      // 0-39: Red, critical issues
} as const

/**
 * Get health status label from score
 */
export function getHealthStatus(score: number): {
  label: string
  color: string
  emoji: string
} {
  if (score >= HEALTH_SCORE_THRESHOLDS.HEALTHY) {
    return { label: 'Healthy', color: 'text-green-600', emoji: '✅' }
  }
  if (score >= HEALTH_SCORE_THRESHOLDS.ATTENTION) {
    return { label: 'Needs Attention', color: 'text-yellow-600', emoji: '⚠️' }
  }
  if (score >= HEALTH_SCORE_THRESHOLDS.CONCERNING) {
    return { label: 'Concerning', color: 'text-orange-600', emoji: '🟠' }
  }
  return { label: 'Critical', color: 'text-red-600', emoji: '🔴' }
}
