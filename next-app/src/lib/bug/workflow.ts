/**
 * Bug Workflow Logic
 *
 * Manages bug phase transitions, triage data, and workflow state.
 * Bugs follow: triage → investigating → fixing → verified
 */

import {
  AlertTriangle,
  Bug,
  Wrench,
  ShieldCheck,
  type LucideIcon,
} from 'lucide-react'

// =============================================================================
// TYPES & CONSTANTS
// =============================================================================

export const BUG_PHASES = ['triage', 'investigating', 'fixing', 'verified'] as const
export type BugPhase = typeof BUG_PHASES[number]

export const BUG_SEVERITIES = ['critical', 'high', 'medium', 'low'] as const
export type BugSeverity = typeof BUG_SEVERITIES[number]

/**
 * Valid phase transitions for bugs
 * - triage → investigating (after triage complete)
 * - investigating → fixing (root cause found) OR → triage (not a bug)
 * - fixing → verified (fix complete) OR → investigating (fix failed)
 * - verified → (terminal, no transitions)
 */
export const BUG_TRANSITIONS: Record<BugPhase, BugPhase[]> = {
  triage: ['investigating'],
  investigating: ['fixing', 'triage'],
  fixing: ['verified', 'investigating'],
  verified: [],
}

/**
 * Triage data captured during bug assessment
 */
export interface BugTriageData {
  severity: BugSeverity
  reproducible: boolean
  stepsToReproduce?: string
  expectedBehavior?: string
  actualBehavior?: string
  triageCompletedAt?: string
}

/**
 * Extended metadata for bugs stored in work_items.metadata
 */
export interface BugMetadata {
  triage?: BugTriageData
  investigation?: {
    rootCause?: string
    affectedAreas?: string[]
    investigationCompletedAt?: string
  }
  fix?: {
    solution?: string
    prLink?: string
    fixCompletedAt?: string
  }
  verification?: {
    verifiedBy?: string
    verificationNotes?: string
    verifiedAt?: string
  }
}

/**
 * Severity configuration for UI display
 */
export const SEVERITY_CONFIG: Record<BugSeverity, {
  label: string
  color: string
  bgColor: string
  textColor: string
  borderColor: string
  description: string
}> = {
  critical: {
    label: 'Critical',
    color: '#DC2626',
    bgColor: 'bg-red-500',
    textColor: 'text-red-600',
    borderColor: 'border-red-500',
    description: 'System down, data loss, no workaround',
  },
  high: {
    label: 'High',
    color: '#EA580C',
    bgColor: 'bg-orange-500',
    textColor: 'text-orange-600',
    borderColor: 'border-orange-500',
    description: 'Major feature broken, workaround exists',
  },
  medium: {
    label: 'Medium',
    color: '#F59E0B',
    bgColor: 'bg-amber-500',
    textColor: 'text-amber-600',
    borderColor: 'border-amber-500',
    description: 'Feature impaired, acceptable workaround',
  },
  low: {
    label: 'Low',
    color: '#3B82F6',
    bgColor: 'bg-blue-500',
    textColor: 'text-blue-600',
    borderColor: 'border-blue-500',
    description: 'Minor issue, cosmetic, enhancement',
  },
}

/**
 * Bug phase configuration for UI display
 */
export interface BugPhaseConfig {
  id: string
  name: string
  tagline: string
  description: string
  color: string
  bgColor: string
  textColor: string
  borderColor: string
  icon: LucideIcon
  emoji: string
}

export const BUG_PHASE_CONFIG: Record<BugPhase, BugPhaseConfig> = {
  triage: {
    id: 'triage',
    name: 'Triage',
    tagline: 'Assess severity and priority',
    description: 'Bug reported, needs reproduction and severity assessment',
    color: '#F59E0B',
    bgColor: 'bg-amber-500',
    textColor: 'text-amber-600',
    borderColor: 'border-amber-500',
    icon: AlertTriangle,
    emoji: '⚠️',
  },
  investigating: {
    id: 'investigating',
    name: 'Investigating',
    tagline: 'Finding the root cause',
    description: 'Reproducing issue, analyzing logs, identifying root cause',
    color: '#3B82F6',
    bgColor: 'bg-blue-500',
    textColor: 'text-blue-600',
    borderColor: 'border-blue-500',
    icon: Bug,
    emoji: '🔬',
  },
  fixing: {
    id: 'fixing',
    name: 'Fixing',
    tagline: 'Implementing the solution',
    description: 'Active development of fix, code changes in progress',
    color: '#10B981',
    bgColor: 'bg-emerald-500',
    textColor: 'text-emerald-600',
    borderColor: 'border-emerald-500',
    icon: Wrench,
    emoji: '🔧',
  },
  verified: {
    id: 'verified',
    name: 'Verified',
    tagline: 'Fix confirmed working',
    description: 'Fix deployed and verified, bug resolved',
    color: '#22C55E',
    bgColor: 'bg-green-500',
    textColor: 'text-green-600',
    borderColor: 'border-green-500',
    icon: ShieldCheck,
    emoji: '✔️',
  },
}

// =============================================================================
// PHASE TRANSITION HELPERS
// =============================================================================

/**
 * Check if transition from current to target phase is valid
 */
export function canTransitionTo(currentPhase: BugPhase, targetPhase: BugPhase): boolean {
  return BUG_TRANSITIONS[currentPhase]?.includes(targetPhase) ?? false
}

/**
 * Get the next phase in the forward direction
 */
export function getNextPhase(currentPhase: BugPhase): BugPhase | null {
  const currentIndex = BUG_PHASES.indexOf(currentPhase)
  if (currentIndex === -1 || currentIndex >= BUG_PHASES.length - 1) {
    return null
  }
  return BUG_PHASES[currentIndex + 1]
}

/**
 * Get the previous phase (for going back)
 */
export function getPreviousPhase(currentPhase: BugPhase): BugPhase | null {
  const currentIndex = BUG_PHASES.indexOf(currentPhase)
  if (currentIndex <= 0) {
    return null
  }
  return BUG_PHASES[currentIndex - 1]
}

/**
 * Check if phase is terminal (verified)
 */
export function isTerminalPhase(phase: BugPhase): boolean {
  return phase === 'verified'
}

/**
 * Get phase index (0-3)
 */
export function getPhaseIndex(phase: BugPhase): number {
  return BUG_PHASES.indexOf(phase)
}

/**
 * Get progress percentage based on phase (0-100)
 */
export function getPhaseProgress(phase: BugPhase): number {
  const index = getPhaseIndex(phase)
  if (index === -1) return 0
  // Terminal phase = 100%, others proportional
  if (phase === 'verified') return 100
  return Math.round(((index + 1) / BUG_PHASES.length) * 100)
}

/**
 * Get all allowed transitions from current phase
 */
export function getAllowedTransitions(currentPhase: BugPhase): BugPhase[] {
  return BUG_TRANSITIONS[currentPhase] ?? []
}

// =============================================================================
// TRIAGE VALIDATION
// =============================================================================

/**
 * Check if triage data is complete enough to proceed
 */
export function isTriageComplete(triage?: BugTriageData): boolean {
  if (!triage) return false
  // Severity is required
  if (!triage.severity) return false
  // Reproducible flag must be set
  if (triage.reproducible === undefined) return false
  // If reproducible, steps are required
  if (triage.reproducible && !triage.stepsToReproduce?.trim()) return false
  return true
}

/**
 * Get missing triage fields
 */
export function getMissingTriageFields(triage?: BugTriageData): string[] {
  const missing: string[] = []
  if (!triage?.severity) missing.push('Severity')
  if (triage?.reproducible === undefined) missing.push('Reproducible status')
  if (triage?.reproducible && !triage.stepsToReproduce?.trim()) {
    missing.push('Steps to reproduce')
  }
  return missing
}

/**
 * Get triage completion percentage
 */
export function getTriageCompletionPercent(triage?: BugTriageData): number {
  if (!triage) return 0

  let completed = 0
  const total = 5 // severity, reproducible, steps, expected, actual

  if (triage.severity) completed++
  if (triage.reproducible !== undefined) completed++
  if (triage.stepsToReproduce?.trim()) completed++
  if (triage.expectedBehavior?.trim()) completed++
  if (triage.actualBehavior?.trim()) completed++

  return Math.round((completed / total) * 100)
}

// =============================================================================
// PHASE-SPECIFIC VALIDATION
// =============================================================================

/**
 * Check if bug can advance to next phase
 */
export function canAdvancePhase(
  currentPhase: BugPhase,
  metadata?: BugMetadata,
  reviewEnabled?: boolean,
  reviewStatus?: string | null
): { canAdvance: boolean; blockers: string[] } {
  const blockers: string[] = []

  switch (currentPhase) {
    case 'triage':
      if (!isTriageComplete(metadata?.triage)) {
        const missing = getMissingTriageFields(metadata?.triage)
        blockers.push(`Complete triage: ${missing.join(', ')}`)
      }
      break

    case 'investigating':
      if (!metadata?.investigation?.rootCause?.trim()) {
        blockers.push('Document root cause before fixing')
      }
      break

    case 'fixing':
      // Review must be approved if enabled
      if (reviewEnabled && reviewStatus !== 'approved') {
        blockers.push('Review must be approved before verification')
      }
      if (!metadata?.fix?.solution?.trim()) {
        blockers.push('Document the fix solution')
      }
      break

    case 'verified':
      // Terminal - cannot advance
      blockers.push('Bug is already verified (terminal state)')
      break
  }

  return {
    canAdvance: blockers.length === 0,
    blockers,
  }
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Get phase configuration from constants
 */
export function getBugPhaseConfig(phase: BugPhase) {
  return BUG_PHASE_CONFIG[phase]
}

/**
 * Get severity display info
 */
export function getSeverityConfig(severity: BugSeverity) {
  return SEVERITY_CONFIG[severity]
}

/**
 * Create initial triage data with defaults
 */
export function createInitialTriageData(): Partial<BugTriageData> {
  return {
    reproducible: true,
  }
}

/**
 * Create initial bug metadata
 */
export function createInitialBugMetadata(): BugMetadata {
  return {
    triage: createInitialTriageData() as BugTriageData,
  }
}

/**
 * Parse metadata from work item, ensuring bug structure
 */
export function parseBugMetadata(metadata: unknown): BugMetadata {
  if (!metadata || typeof metadata !== 'object') {
    return {}
  }
  return metadata as BugMetadata
}

/**
 * Merge triage updates into existing metadata
 */
export function updateTriageInMetadata(
  existingMetadata: unknown,
  triageUpdates: Partial<BugTriageData>
): BugMetadata {
  const metadata = parseBugMetadata(existingMetadata)
  return {
    ...metadata,
    triage: {
      ...metadata.triage,
      ...triageUpdates,
    } as BugTriageData,
  }
}
