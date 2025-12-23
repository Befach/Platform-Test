/**
 * Concept Workflow Logic
 *
 * Manages concept phase transitions, validation, and workflow state.
 * Concepts follow: ideation → research → validated | rejected
 */

import { Lightbulb, Search, CheckCircle2, XCircle, type LucideIcon } from 'lucide-react'

// =============================================================================
// TYPES & CONSTANTS
// =============================================================================

export const CONCEPT_PHASES = ['ideation', 'research', 'validated', 'rejected'] as const
export type ConceptPhase = typeof CONCEPT_PHASES[number]

/**
 * Concept Phase UI Configuration
 */
interface ConceptPhaseUIConfig {
  name: string
  emoji: string
  tagline: string
  color: string
  bgColor: string
  textColor: string
  borderColor: string
  icon: LucideIcon
}

const CONCEPT_PHASE_CONFIG: Record<ConceptPhase, ConceptPhaseUIConfig> = {
  ideation: {
    name: 'Ideation',
    emoji: '💡',
    tagline: 'Explore ideas and hypotheses',
    color: '#A855F7', // Purple-500
    bgColor: 'bg-purple-500',
    textColor: 'text-purple-600',
    borderColor: 'border-purple-500',
    icon: Lightbulb,
  },
  research: {
    name: 'Research',
    emoji: '🔍',
    tagline: 'Validate through research',
    color: '#6366F1', // Indigo-500
    bgColor: 'bg-indigo-500',
    textColor: 'text-indigo-600',
    borderColor: 'border-indigo-500',
    icon: Search,
  },
  validated: {
    name: 'Validated',
    emoji: '✅',
    tagline: 'Proven and ready',
    color: '#22C55E', // Green-500
    bgColor: 'bg-green-500',
    textColor: 'text-green-600',
    borderColor: 'border-green-500',
    icon: CheckCircle2,
  },
  rejected: {
    name: 'Rejected',
    emoji: '❌',
    tagline: 'Not viable',
    color: '#EF4444', // Red-500
    bgColor: 'bg-red-500',
    textColor: 'text-red-600',
    borderColor: 'border-red-500',
    icon: XCircle,
  },
}

/**
 * Valid phase transitions for concepts
 * - ideation → research (after initial exploration)
 * - research → validated (concept proven) OR → rejected (not viable)
 * - Can reject from ANY phase (special rule)
 * - validated → (terminal, triggers promotion to feature)
 * - rejected → (terminal, archived with learnings)
 */
export const CONCEPT_TRANSITIONS: Record<ConceptPhase, ConceptPhase[]> = {
  ideation: ['research', 'rejected'], // Can research or reject early
  research: ['validated', 'rejected'], // Can validate or reject after research
  validated: [], // Terminal - should trigger promotion
  rejected: [], // Terminal - archived
}

/**
 * Phase configuration for UI display and guidance
 */
export interface ConceptPhaseDefinition {
  id: ConceptPhase
  label: string
  emoji: string
  description: string
  color: string
  bgColor: string
  textColor: string
  borderColor: string
  icon: LucideIcon
  guidance: string[]
  isTerminal: boolean
  actions: {
    primary?: {
      label: string
      targetPhase: ConceptPhase
      requiresConfirmation?: boolean
    }
    secondary?: {
      label: string
      targetPhase: ConceptPhase
      requiresConfirmation: boolean
    }
  }
}

// =============================================================================
// PHASE CONFIGURATION
// =============================================================================

/**
 * Get phase configuration with all UI and workflow details
 */
export function getConceptPhaseConfig(phase: ConceptPhase): ConceptPhaseDefinition | null {
  const config = CONCEPT_PHASE_CONFIG[phase]
  if (!config) return null

  const baseConfig = {
    id: phase,
    label: config.name,
    emoji: config.emoji,
    description: config.tagline,
    color: config.color,
    bgColor: config.bgColor,
    textColor: config.textColor,
    borderColor: config.borderColor,
    icon: config.icon,
  }

  switch (phase) {
    case 'ideation':
      return {
        ...baseConfig,
        guidance: [
          'Capture initial ideas and hypotheses',
          'Identify problem space and potential users',
          'Gather inspiration and similar solutions',
          'Define initial success criteria',
        ],
        isTerminal: false,
        actions: {
          primary: {
            label: 'Advance to Research',
            targetPhase: 'research',
          },
          secondary: {
            label: 'Reject Concept',
            targetPhase: 'rejected',
            requiresConfirmation: true,
          },
        },
      }

    case 'research':
      return {
        ...baseConfig,
        guidance: [
          'Conduct user research and interviews',
          'Analyze market and competitive landscape',
          'Validate technical feasibility',
          'Refine value proposition',
        ],
        isTerminal: false,
        actions: {
          primary: {
            label: 'Validate Concept',
            targetPhase: 'validated',
            requiresConfirmation: true,
          },
          secondary: {
            label: 'Reject Concept',
            targetPhase: 'rejected',
            requiresConfirmation: true,
          },
        },
      }

    case 'validated':
      return {
        ...baseConfig,
        guidance: [
          'Concept has been validated through research',
          'Ready to promote to feature for implementation',
          'Use the promotion dialog to create feature work item',
        ],
        isTerminal: true,
        actions: {},
      }

    case 'rejected':
      return {
        ...baseConfig,
        guidance: [
          'Concept rejected based on research findings',
          'Review rejection reason below',
          'Consider archiving if no longer relevant',
        ],
        isTerminal: true,
        actions: {},
      }
  }
}

// =============================================================================
// PHASE TRANSITION HELPERS
// =============================================================================

/**
 * Check if transition from current to target phase is valid
 */
export function canTransitionConcept(
  currentPhase: ConceptPhase,
  targetPhase: ConceptPhase
): boolean {
  return CONCEPT_TRANSITIONS[currentPhase]?.includes(targetPhase) ?? false
}

/**
 * Get the next phase in the forward direction
 */
export function getNextPhase(currentPhase: ConceptPhase): ConceptPhase | null {
  const currentIndex = CONCEPT_PHASES.indexOf(currentPhase)
  if (currentIndex === -1 || currentIndex >= CONCEPT_PHASES.length - 1) {
    return null
  }
  // Skip 'rejected' in normal progression
  const nextPhase = CONCEPT_PHASES[currentIndex + 1]
  return nextPhase === 'rejected' ? null : nextPhase
}

/**
 * Get the previous phase (for going back)
 */
export function getPreviousPhase(currentPhase: ConceptPhase): ConceptPhase | null {
  const currentIndex = CONCEPT_PHASES.indexOf(currentPhase)
  if (currentIndex <= 0) {
    return null
  }
  return CONCEPT_PHASES[currentIndex - 1]
}

/**
 * Check if phase is terminal (validated or rejected)
 */
export function isConceptTerminal(phase: ConceptPhase): boolean {
  return phase === 'validated' || phase === 'rejected'
}

/**
 * Get phase index (0-3)
 */
export function getPhaseIndex(phase: ConceptPhase): number {
  return CONCEPT_PHASES.indexOf(phase)
}

/**
 * Get progress percentage based on phase (0-100)
 */
export function getPhaseProgress(phase: ConceptPhase): number {
  const index = getPhaseIndex(phase)
  if (index === -1) return 0

  switch (phase) {
    case 'ideation':
      return 25
    case 'research':
      return 50
    case 'validated':
      return 100
    case 'rejected':
      return 0 // Rejected doesn't count as progress
    default:
      return 0
  }
}

/**
 * Get all allowed transitions from current phase
 */
export function getAllowedTransitions(currentPhase: ConceptPhase): ConceptPhase[] {
  return CONCEPT_TRANSITIONS[currentPhase] ?? []
}

// =============================================================================
// COLOR MAPPING (Avoiding Tailwind Purge Issues)
// =============================================================================

/**
 * Explicit color classes for Tailwind (prevents purging)
 */
export const CONCEPT_COLOR_MAP: Record<ConceptPhase, {
  bg: string
  text: string
  border: string
  ring: string
}> = {
  ideation: {
    bg: 'bg-purple-100',
    text: 'text-purple-600',
    border: 'border-purple-500',
    ring: 'ring-purple-500',
  },
  research: {
    bg: 'bg-indigo-100',
    text: 'text-indigo-600',
    border: 'border-indigo-500',
    ring: 'ring-indigo-500',
  },
  validated: {
    bg: 'bg-green-100',
    text: 'text-green-600',
    border: 'border-green-500',
    ring: 'ring-green-500',
  },
  rejected: {
    bg: 'bg-red-100',
    text: 'text-red-600',
    border: 'border-red-500',
    ring: 'ring-red-500',
  },
}

/**
 * Get color classes for a phase
 */
export function getConceptColors(phase: ConceptPhase) {
  return CONCEPT_COLOR_MAP[phase]
}
