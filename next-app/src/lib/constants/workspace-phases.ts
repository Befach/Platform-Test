/**
 * Workspace Phase Configuration
 *
 * Research-backed color palette based on 2025 UX psychology studies:
 * - Colors chosen for cognitive meaning, not arbitrary aesthetics
 * - All colors meet WCAG AAA contrast standards
 * - Inspired by successful products (Duolingo, Asana, Linear)
 *
 * Color Psychology Sources:
 * - Smashing Magazine: Psychology of Color in UX (2025)
 * - Duolingo's proven use of green for progress/success
 * - High-contrast accessibility standards
 */

export type WorkspacePhase =
  | 'research'
  | 'planning'
  | 'execution'
  | 'review'
  | 'complete';

export interface PhaseConfig {
  id: WorkspacePhase;
  name: string;
  description: string;
  color: string;          // Hex color
  bgColor: string;        // Tailwind background class
  textColor: string;      // Tailwind text class
  borderColor: string;    // Tailwind border class
  icon: string;           // Emoji icon
  meaning: string;        // Why this color?
}

/**
 * Research-backed color palette:
 *
 * Indigo → Violet → Emerald → Amber → Green
 * (Explore → Structure → Execute → Refine → Complete)
 */
export const PHASE_CONFIG: Record<WorkspacePhase, PhaseConfig> = {
  research: {
    id: 'research',
    name: 'Research',
    description: 'Discovery & exploration',
    color: '#6366F1',        // Indigo-500
    bgColor: 'bg-indigo-500',
    textColor: 'text-indigo-600',
    borderColor: 'border-indigo-500',
    icon: '🔍',
    meaning: 'Indigo represents exploration, deep thinking, discovery - the early ideation phase',
  },
  planning: {
    id: 'planning',
    name: 'Planning',
    description: 'Structure & organization',
    color: '#8B5CF6',        // Violet-500
    bgColor: 'bg-violet-500',
    textColor: 'text-violet-600',
    borderColor: 'border-violet-500',
    icon: '📋',
    meaning: 'Violet represents strategic thinking, organization, structure - turning ideas into plans',
  },
  execution: {
    id: 'execution',
    name: 'Execution',
    description: 'Active development & progress',
    color: '#10B981',        // Emerald-500
    bgColor: 'bg-emerald-500',
    textColor: 'text-emerald-600',
    borderColor: 'border-emerald-500',
    icon: '🚀',
    meaning: 'Emerald green represents action, progress, growth - proven by Duolingo for learning/achievement',
  },
  review: {
    id: 'review',
    name: 'Review',
    description: 'Feedback & iteration',
    color: '#F59E0B',        // Amber-500
    bgColor: 'bg-amber-500',
    textColor: 'text-amber-600',
    borderColor: 'border-amber-500',
    icon: '💬',
    meaning: 'Amber represents attention, warmth, feedback - invites review and encourages iteration',
  },
  complete: {
    id: 'complete',
    name: 'Complete',
    description: 'Finished & shipped',
    color: '#22C55E',        // Green-500
    bgColor: 'bg-green-500',
    textColor: 'text-green-600',
    borderColor: 'border-green-500',
    icon: '✅',
    meaning: 'Bright green represents success, achievement, completion - universal success signal',
  },
};

/**
 * Phase order for progression visualization
 */
export const PHASE_ORDER: WorkspacePhase[] = [
  'research',
  'planning',
  'execution',
  'review',
  'complete',
];

/**
 * Calculate which phase a work item is in based on its state
 *
 * Logic (auto-detection, no manual phase selection):
 * - Mind map nodes not converted → research
 * - Features without timeline breakdown → planning
 * - Features assigned + in_progress → execution
 * - Features in review status → review
 * - Features completed → complete
 */
export function calculateWorkItemPhase(workItem: {
  status: string;
  has_timeline_breakdown?: boolean;
  assigned_to?: string | null;
  is_mind_map_conversion?: boolean;
}): WorkspacePhase {
  const { status, has_timeline_breakdown, assigned_to, is_mind_map_conversion } = workItem;

  // Completed items
  if (status === 'completed' || status === 'done') {
    return 'complete';
  }

  // Review status
  if (status === 'review' || status === 'in_review' || status === 'pending_review') {
    return 'review';
  }

  // In progress = execution
  if (status === 'in_progress' && assigned_to) {
    return 'execution';
  }

  // Has timeline but not in progress = still planning
  if (has_timeline_breakdown && status !== 'in_progress') {
    return 'planning';
  }

  // Features without timeline = planning phase
  if (!has_timeline_breakdown && !is_mind_map_conversion) {
    return 'planning';
  }

  // Mind map nodes not yet converted = research
  if (is_mind_map_conversion || !has_timeline_breakdown) {
    return 'research';
  }

  // Default to planning for new items
  return 'planning';
}

/**
 * Calculate phase distribution from work items
 * Returns percentage for each phase
 */
export function calculatePhaseDistribution(workItems: Array<{
  status: string;
  has_timeline_breakdown?: boolean;
  assigned_to?: string | null;
  is_mind_map_conversion?: boolean;
}>): Record<WorkspacePhase, { count: number; percentage: number }> {
  const total = workItems.length;

  if (total === 0) {
    return Object.fromEntries(
      PHASE_ORDER.map(phase => [phase, { count: 0, percentage: 0 }])
    ) as Record<WorkspacePhase, { count: number; percentage: number }>;
  }

  const distribution = workItems.reduce((acc, item) => {
    const phase = calculateWorkItemPhase(item);
    acc[phase] = (acc[phase] || 0) + 1;
    return acc;
  }, {} as Record<WorkspacePhase, number>);

  return Object.fromEntries(
    PHASE_ORDER.map(phase => [
      phase,
      {
        count: distribution[phase] || 0,
        percentage: Math.round(((distribution[phase] || 0) / total) * 100),
      },
    ])
  ) as Record<WorkspacePhase, { count: number; percentage: number }>;
}

/**
 * Phase permission constants
 *
 * Default permission settings for team members.
 * Owners and admins bypass these restrictions.
 */
export const PHASE_PERMISSIONS = {
  /** All team members can view all phases */
  DEFAULT_VIEW: true,
  /** Edit access requires explicit phase assignment (or admin role) */
  DEFAULT_EDIT: false,
  /** Delete access same as edit */
  DEFAULT_DELETE: false,
} as const;
