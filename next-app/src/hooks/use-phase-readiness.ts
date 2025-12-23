/**
 * Phase Readiness Hook
 *
 * React hook that computes phase readiness in real-time and manages
 * banner dismissal persistence.
 *
 * @module hooks/use-phase-readiness
 */

'use client'

import { useMemo } from 'react'
import type { WorkspacePhase, WorkItemType } from '@/lib/constants/workspace-phases'
import { getTypePhaseConfig } from '@/lib/constants/workspace-phases'
import {
  calculatePhaseReadiness,
  type PhaseReadiness,
  type WorkItemForReadiness,
} from '@/lib/phase/readiness-calculator'
import {
  getPhaseGuidance,
  getTypePhaseGuidance,
  type PhaseGuidance,
} from '@/lib/phase/guiding-questions'

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * Input props for the hook
 */
export interface UsePhaseReadinessProps {
  workItem: WorkItemForReadiness
  timelineItemsCount?: number
  feedbackStats?: {
    pendingCritical: number
    total: number
  }
}

/**
 * Return type for the hook
 */
export interface UsePhaseReadinessResult {
  /** Phase readiness calculation result */
  readiness: PhaseReadiness
  /** Guidance for current phase */
  guidance: PhaseGuidance
  /** Whether the upgrade banner should be shown (>= 80% readiness) */
  showBanner: boolean
  /** Whether upgrade is possible (all required fields complete) */
  canUpgrade: boolean
  /** List of missing required fields */
  missingRequired: string[]
  /** Progress percentage for visual display */
  progressPercent: number
  /** Next phase label for display */
  nextPhaseLabel: string | null
  /** Current phase label for display */
  currentPhaseLabel: string
}

// ============================================================================
// CONSTANTS
// ============================================================================

/**
 * Phase labels for display (all phase types)
 */
const PHASE_LABELS: Record<string, string> = {
  // Feature/Enhancement phases
  design: 'Design',
  build: 'Build',
  refine: 'Refine',
  launch: 'Launch',
  // Concept phases
  ideation: 'Ideation',
  research: 'Research',
  validated: 'Validated',
  rejected: 'Rejected',
  // Bug phases
  triage: 'Triage',
  investigating: 'Investigating',
  fixing: 'Fixing',
  verified: 'Verified',
}

// ============================================================================
// MAIN HOOK
// ============================================================================

/**
 * Hook for calculating and tracking phase readiness
 *
 * @param props - Work item data and related counts
 * @returns Phase readiness state and derived values
 *
 * @example
 * ```tsx
 * const {
 *   readiness,
 *   showBanner,
 *   canUpgrade,
 *   missingRequired,
 * } = usePhaseReadiness({
 *   workItem: workItemData,
 *   timelineItemsCount: 3,
 *   feedbackStats: { pendingCritical: 0, total: 5 },
 * })
 *
 * if (showBanner) {
 *   return <PhaseUpgradeBanner readiness={readiness} />
 * }
 * ```
 */
export function usePhaseReadiness({
  workItem,
  timelineItemsCount = 0,
  feedbackStats,
}: UsePhaseReadinessProps): UsePhaseReadinessResult {
  // Calculate phase readiness (memoized) - type-aware
  const readiness = useMemo(() => {
    return calculatePhaseReadiness(workItem, timelineItemsCount, feedbackStats)
  }, [workItem, timelineItemsCount, feedbackStats])

  // Get guidance for current phase (memoized) - type-aware
  const guidance = useMemo(() => {
    const workItemType = (workItem.type || 'feature') as WorkItemType
    // Use type-aware guidance if available, fallback to legacy
    try {
      return getTypePhaseGuidance(workItemType, workItem.phase)
    } catch {
      // Fallback to legacy for backward compatibility
      return getPhaseGuidance(workItem.phase as WorkspacePhase)
    }
  }, [workItem.phase, workItem.type])

  // Derive display values (memoized) - type-aware
  const derivedValues = useMemo(() => {
    const showBanner =
      readiness.readinessPercent >= 80 &&
      readiness.nextPhase !== null &&
      !readiness.isTerminal
    const canUpgrade = readiness.canUpgrade
    const missingRequired = readiness.missingFields
      .filter((f) => f.required)
      .map((f) => f.label)
    const progressPercent = readiness.readinessPercent
    // Use type-aware phase labels
    const nextPhaseLabel = readiness.nextPhase
      ? PHASE_LABELS[readiness.nextPhase] || readiness.nextPhase
      : null
    const currentPhaseLabel = PHASE_LABELS[workItem.phase] || workItem.phase

    return {
      showBanner,
      canUpgrade,
      missingRequired,
      progressPercent,
      nextPhaseLabel,
      currentPhaseLabel,
    }
  }, [readiness, workItem.phase])

  return {
    readiness,
    guidance,
    ...derivedValues,
  }
}

// ============================================================================
// DISMISSAL PERSISTENCE UTILITIES
// ============================================================================

const DISMISSAL_KEY_PREFIX = 'phase-upgrade-dismissed'
const DISMISSAL_EXPIRY_MS = 24 * 60 * 60 * 1000 // 24 hours

/**
 * Dismissal record stored in localStorage
 */
interface DismissalRecord {
  dismissedAt: number
  phase: WorkspacePhase
  readinessAtDismissal: number
}

/**
 * Get the localStorage key for dismissal tracking
 */
function getDismissalKey(workItemId: string): string {
  return `${DISMISSAL_KEY_PREFIX}-${workItemId}`
}

/**
 * Check if the banner was recently dismissed
 *
 * Returns true if:
 * - Dismissed within last 24 hours
 * - Still in the same phase
 * - Readiness hasn't increased by 5%+
 *
 * @param workItemId - ID of the work item
 * @param currentPhase - Current phase of the work item
 * @param currentReadiness - Current readiness percentage
 */
export function wasBannerDismissed(
  workItemId: string,
  currentPhase: WorkspacePhase,
  currentReadiness: number
): boolean {
  if (typeof window === 'undefined') return false

  try {
    const key = getDismissalKey(workItemId)
    const stored = localStorage.getItem(key)
    if (!stored) return false

    const record: DismissalRecord = JSON.parse(stored)

    // Check if dismissed for a different phase - show banner again
    if (record.phase !== currentPhase) return false

    // Check if expired (24 hours)
    const now = Date.now()
    if (now - record.dismissedAt > DISMISSAL_EXPIRY_MS) {
      localStorage.removeItem(key)
      return false
    }

    // Check if readiness increased significantly (5%+) since dismissal
    // This re-shows the banner when user makes progress
    if (currentReadiness - record.readinessAtDismissal >= 5) {
      localStorage.removeItem(key)
      return false
    }

    return true
  } catch {
    return false
  }
}

/**
 * Dismiss the banner for a work item
 *
 * Stores dismissal record with:
 * - Current timestamp
 * - Current phase
 * - Current readiness (to detect significant progress)
 *
 * @param workItemId - ID of the work item
 * @param phase - Current phase
 * @param readiness - Current readiness percentage
 */
export function dismissBanner(
  workItemId: string,
  phase: WorkspacePhase,
  readiness: number
): void {
  if (typeof window === 'undefined') return

  try {
    const key = getDismissalKey(workItemId)
    const record: DismissalRecord = {
      dismissedAt: Date.now(),
      phase,
      readinessAtDismissal: readiness,
    }
    localStorage.setItem(key, JSON.stringify(record))
  } catch {
    // Silently fail if localStorage unavailable
  }
}

/**
 * Clear dismissal record for a work item
 *
 * Useful when:
 * - User explicitly wants to see the banner again
 * - Phase was upgraded successfully
 *
 * @param workItemId - ID of the work item
 */
export function clearDismissal(workItemId: string): void {
  if (typeof window === 'undefined') return

  try {
    const key = getDismissalKey(workItemId)
    localStorage.removeItem(key)
  } catch {
    // Silently fail
  }
}

/**
 * Clear all dismissal records (useful for testing/debugging)
 */
export function clearAllDismissals(): void {
  if (typeof window === 'undefined') return

  try {
    const keysToRemove: string[] = []
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key?.startsWith(DISMISSAL_KEY_PREFIX)) {
        keysToRemove.push(key)
      }
    }
    keysToRemove.forEach((key) => localStorage.removeItem(key))
  } catch {
    // Silently fail
  }
}
