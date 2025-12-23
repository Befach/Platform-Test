/**
 * Workspace Phase Configuration - Type-Aware Phase System
 *
 * Updated 2025-12-16: Migrated to type-aware phases
 *
 * FEATURE PHASES (unchanged):
 * - design → build → refine → launch
 *
 * CONCEPT PHASES (NEW):
 * - ideation → research → validated | rejected
 * - Concepts are for discovery/ideation only
 * - Once validated, they convert to Feature
 *
 * BUG PHASES (SIMPLIFIED):
 * - triage → investigating → fixing → verified
 * - Bugs skip planning - go straight to action
 *
 * ENHANCEMENT PHASES:
 * - Same as Feature (design → build → refine → launch)
 * - Links to parent via enhances_work_item_id
 *
 * Color Psychology Sources:
 * - Smashing Magazine: Psychology of Color in UX (2025)
 * - High-contrast accessibility standards
 */

import {
    Pencil,
    Hammer,
    Sparkles,
    Rocket,
    Lightbulb,
    Search,
    CheckCircle2,
    XCircle,
    AlertTriangle,
    Bug,
    Wrench,
    ShieldCheck,
    type LucideIcon
} from 'lucide-react';

// =============================================================================
// TYPE-SPECIFIC PHASE DEFINITIONS
// =============================================================================

/**
 * Feature phases (full lifecycle)
 */
export type FeaturePhase = 'design' | 'build' | 'refine' | 'launch';

/**
 * Concept phases (discovery/validation flow)
 */
export type ConceptPhase = 'ideation' | 'research' | 'validated' | 'rejected';

/**
 * Bug phases (triage/fix flow)
 */
export type BugPhase = 'triage' | 'investigating' | 'fixing' | 'verified';

/**
 * Enhancement phases (same as Feature)
 */
export type EnhancementPhase = FeaturePhase;

/**
 * Union of all possible work item phases
 */
export type AnyWorkItemPhase = FeaturePhase | ConceptPhase | BugPhase;

/**
 * Work item types
 */
export type WorkItemType = 'concept' | 'feature' | 'bug';

/**
 * Map of work item types to their valid phases
 * Note: Enhancement is now a flag on features (is_enhancement), not a separate type
 */
export const TYPE_PHASE_MAP: Record<WorkItemType, readonly string[]> = {
    feature: ['design', 'build', 'refine', 'launch'] as const,
    concept: ['ideation', 'research', 'validated', 'rejected'] as const,
    bug: ['triage', 'investigating', 'fixing', 'verified'] as const,
} as const;

/**
 * Phase order by type (for progression)
 */
export const TYPE_PHASE_ORDER: Record<WorkItemType, readonly string[]> = {
    feature: ['design', 'build', 'refine', 'launch'],
    concept: ['ideation', 'research', 'validated'], // rejected is terminal, not in progression
    bug: ['triage', 'investigating', 'fixing', 'verified'],
} as const;

/**
 * Terminal phases that cannot progress further
 */
export const TERMINAL_PHASES: Record<WorkItemType, readonly string[]> = {
    feature: ['launch'],
    concept: ['validated', 'rejected'],
    bug: ['verified'],
} as const;

// Legacy type alias for backward compatibility
export type WorkspacePhase =
    | 'design'
    | 'build'
    | 'refine'
    | 'launch';

// Legacy phase types for backward compatibility during migration
export type LegacyWorkspacePhase =
    | 'research'
    | 'planning'
    | 'execution'
    | 'review'
    | 'complete';

// =============================================================================
// PHASE CONFIG INTERFACE (Extended for all types)
// =============================================================================

export interface PhaseConfig {
    id: string;             // Phase ID (type-specific)
    name: string;
    tagline: string;        // Short motivational tagline
    description: string;
    color: string;          // Hex color
    bgColor: string;        // Tailwind background class
    textColor: string;      // Tailwind text class
    borderColor: string;    // Tailwind border class
    icon: LucideIcon;       // Lucide icon component
    meaning: string;        // Why this color?
    emoji: string;          // Visual indicator
}

/**
 * 4-Phase System Color Palette:
 *
 * Violet → Emerald → Amber → Green
 * (Design → Build → Refine → Launch)
 */
export const PHASE_CONFIG: Record<WorkspacePhase, PhaseConfig> = {
    design: {
        id: 'design',
        name: 'Design',
        tagline: 'Shape your approach, define your path',
        description: 'Solution architecture, MVP scoping, timeline breakdown, priority setting',
        color: '#8B5CF6',        // Violet-500
        bgColor: 'bg-violet-500',
        textColor: 'text-violet-600',
        borderColor: 'border-violet-500',
        icon: Pencil,
        meaning: 'Violet represents strategic thinking, planning, structure - turning ideas into actionable plans',
        emoji: '📐',
    },
    build: {
        id: 'build',
        name: 'Build',
        tagline: 'Execute with clarity, create with care',
        description: 'Active development, implementation, progress tracking, team coordination',
        color: '#10B981',        // Emerald-500
        bgColor: 'bg-emerald-500',
        textColor: 'text-emerald-600',
        borderColor: 'border-emerald-500',
        icon: Hammer,
        meaning: 'Emerald green represents action, progress, growth - proven by Duolingo for achievement',
        emoji: '🔨',
    },
    refine: {
        id: 'refine',
        name: 'Refine',
        tagline: 'Validate ideas, sharpen solutions',
        description: 'User testing, feedback collection, bug fixing, stakeholder reviews',
        color: '#F59E0B',        // Amber-500
        bgColor: 'bg-amber-500',
        textColor: 'text-amber-600',
        borderColor: 'border-amber-500',
        icon: Sparkles,
        meaning: 'Amber represents attention, warmth, iteration - invites review and refinement',
        emoji: '✨',
    },
    launch: {
        id: 'launch',
        name: 'Launch',
        tagline: 'Release, measure, and evolve',
        description: 'Ship to production, metrics collection, retrospectives, lessons learned',
        color: '#22C55E',        // Green-500
        bgColor: 'bg-green-500',
        textColor: 'text-green-600',
        borderColor: 'border-green-500',
        icon: Rocket,
        meaning: 'Bright green represents success, achievement, completion - universal success signal',
        emoji: '🚀',
    },
};

// =============================================================================
// CONCEPT PHASE CONFIGURATION
// =============================================================================

/**
 * Concept Phase Color Palette:
 * Purple → Indigo → Green → Red
 * (Ideation → Research → Validated → Rejected)
 *
 * Concepts follow a discovery/validation flow, not a build flow.
 */
export const CONCEPT_PHASE_CONFIG: Record<ConceptPhase, PhaseConfig> = {
    ideation: {
        id: 'ideation',
        name: 'Ideation',
        tagline: 'Capture the spark of an idea',
        description: 'Initial idea capture, hypothesis formation, problem identification',
        color: '#A855F7',        // Purple-500
        bgColor: 'bg-purple-500',
        textColor: 'text-purple-600',
        borderColor: 'border-purple-500',
        icon: Lightbulb,
        meaning: 'Purple represents creativity, imagination, and new possibilities',
        emoji: '💡',
    },
    research: {
        id: 'research',
        name: 'Research',
        tagline: 'Validate assumptions, gather evidence',
        description: 'User research, market analysis, feasibility assessment, prototype testing',
        color: '#6366F1',        // Indigo-500
        bgColor: 'bg-indigo-500',
        textColor: 'text-indigo-600',
        borderColor: 'border-indigo-500',
        icon: Search,
        meaning: 'Indigo represents deep thinking, analysis, and investigation',
        emoji: '🔍',
    },
    validated: {
        id: 'validated',
        name: 'Validated',
        tagline: 'Ready to become a feature',
        description: 'Concept proven viable, ready for promotion to feature or enhancement',
        color: '#22C55E',        // Green-500
        bgColor: 'bg-green-500',
        textColor: 'text-green-600',
        borderColor: 'border-green-500',
        icon: CheckCircle2,
        meaning: 'Green represents success, approval, and readiness to proceed',
        emoji: '✅',
    },
    rejected: {
        id: 'rejected',
        name: 'Rejected',
        tagline: 'Not viable at this time',
        description: 'Concept did not pass validation, archived with learnings',
        color: '#EF4444',        // Red-500
        bgColor: 'bg-red-500',
        textColor: 'text-red-600',
        borderColor: 'border-red-500',
        icon: XCircle,
        meaning: 'Red represents a clear decision to not proceed',
        emoji: '❌',
    },
};

// =============================================================================
// BUG PHASE CONFIGURATION
// =============================================================================

/**
 * Bug Phase Color Palette:
 * Amber → Blue → Emerald → Green
 * (Triage → Investigating → Fixing → Verified)
 *
 * Bugs follow a triage/fix flow optimized for quick resolution.
 */
export const BUG_PHASE_CONFIG: Record<BugPhase, PhaseConfig> = {
    triage: {
        id: 'triage',
        name: 'Triage',
        tagline: 'Assess severity and priority',
        description: 'Bug reported, needs reproduction and severity assessment',
        color: '#F59E0B',        // Amber-500
        bgColor: 'bg-amber-500',
        textColor: 'text-amber-600',
        borderColor: 'border-amber-500',
        icon: AlertTriangle,
        meaning: 'Amber represents attention needed, requires assessment',
        emoji: '⚠️',
    },
    investigating: {
        id: 'investigating',
        name: 'Investigating',
        tagline: 'Finding the root cause',
        description: 'Reproducing issue, analyzing logs, identifying root cause',
        color: '#3B82F6',        // Blue-500
        bgColor: 'bg-blue-500',
        textColor: 'text-blue-600',
        borderColor: 'border-blue-500',
        icon: Bug,
        meaning: 'Blue represents focused investigation and analysis',
        emoji: '🔬',
    },
    fixing: {
        id: 'fixing',
        name: 'Fixing',
        tagline: 'Implementing the solution',
        description: 'Active development of fix, code changes in progress',
        color: '#10B981',        // Emerald-500
        bgColor: 'bg-emerald-500',
        textColor: 'text-emerald-600',
        borderColor: 'border-emerald-500',
        icon: Wrench,
        meaning: 'Emerald represents active work and progress',
        emoji: '🔧',
    },
    verified: {
        id: 'verified',
        name: 'Verified',
        tagline: 'Fix confirmed working',
        description: 'Fix deployed and verified, bug resolved',
        color: '#22C55E',        // Green-500
        bgColor: 'bg-green-500',
        textColor: 'text-green-600',
        borderColor: 'border-green-500',
        icon: ShieldCheck,
        meaning: 'Green represents successful resolution and verification',
        emoji: '✔️',
    },
};

/**
 * Phase order for progression visualization
 */
export const PHASE_ORDER: WorkspacePhase[] = [
    'design',
    'build',
    'refine',
    'launch',
];

/**
 * Map legacy phases to new phases for migration
 */
export const LEGACY_PHASE_MAP: Record<LegacyWorkspacePhase, WorkspacePhase> = {
    research: 'design',
    planning: 'design',
    execution: 'build',
    review: 'refine',
    complete: 'launch',
};

/**
 * Convert legacy phase to new phase
 */
export function migratePhase(phase: string): WorkspacePhase {
    if (phase in LEGACY_PHASE_MAP) {
        return LEGACY_PHASE_MAP[phase as LegacyWorkspacePhase];
    }
    if (phase in PHASE_CONFIG) {
        return phase as WorkspacePhase;
    }
    return 'design'; // Default for unknown phases
}

/**
 * Workspace phases array (for components that need id + label)
 */
export const WORKSPACE_PHASES = PHASE_ORDER.map(phase => ({
    id: phase,
    label: PHASE_CONFIG[phase].name,
    color: PHASE_CONFIG[phase].color,
    description: PHASE_CONFIG[phase].description,
    tagline: PHASE_CONFIG[phase].tagline,
    emoji: PHASE_CONFIG[phase].emoji,
}));

/**
 * Calculate which phase a work item is in based on its state
 *
 * NEW 4-Phase Logic (2025-12-13):
 * - design: Initial state, planning, scoping (was research + planning)
 * - build: Active development, in_progress status (was execution)
 * - refine: Review, testing, feedback collection (was review)
 * - launch: Completed, shipped (was complete)
 *
 * Note: Ideation now happens at workspace level (mind maps, not work items)
 */
export function calculateWorkItemPhase(workItem: {
    status?: string;
    phase?: string;           // Direct phase if stored in DB
    has_timeline_breakdown?: boolean;
    assigned_to?: string | null;
    is_mind_map_conversion?: boolean;
    progress_percent?: number;
    actual_start_date?: string | null;
}): WorkspacePhase {
    const {
        status,
        phase,
        has_timeline_breakdown,
        assigned_to,
        progress_percent,
        actual_start_date,
    } = workItem;

    // If phase is explicitly set in DB, use it (after migration)
    if (phase && phase in PHASE_CONFIG) {
        return phase as WorkspacePhase;
    }

    // Handle legacy phases from database
    if (phase && phase in LEGACY_PHASE_MAP) {
        return LEGACY_PHASE_MAP[phase as LegacyWorkspacePhase];
    }

    // Auto-calculate based on status and fields

    // Launch: Completed items
    if (status === 'completed' || status === 'done' || status === 'launched') {
        return 'launch';
    }

    // Refine: Review/testing status
    if (status === 'review' || status === 'in_review' || status === 'pending_review') {
        return 'refine';
    }

    // Build: Active development with significant progress
    if (status === 'in_progress') {
        return 'build';
    }

    // Build: Has actual_start_date or significant progress
    if (actual_start_date || (progress_percent && progress_percent > 0)) {
        return 'build';
    }

    // Build: Assigned and has timeline breakdown
    if (assigned_to && has_timeline_breakdown) {
        return 'build';
    }

    // Design: Everything else (planning, scoping, or new items)
    return 'design';
}

/**
 * Get the next phase in the progression
 */
export function getNextPhase(currentPhase: WorkspacePhase): WorkspacePhase | null {
    const currentIndex = PHASE_ORDER.indexOf(currentPhase);
    if (currentIndex === -1 || currentIndex >= PHASE_ORDER.length - 1) {
        return null;
    }
    return PHASE_ORDER[currentIndex + 1];
}

/**
 * Get the previous phase in the progression
 */
export function getPreviousPhase(currentPhase: WorkspacePhase): WorkspacePhase | null {
    const currentIndex = PHASE_ORDER.indexOf(currentPhase);
    if (currentIndex <= 0) {
        return null;
    }
    return PHASE_ORDER[currentIndex - 1];
}

/**
 * Check if a phase transition is valid (can only move forward or stay)
 */
export function isValidPhaseTransition(from: WorkspacePhase, to: WorkspacePhase): boolean {
    const fromIndex = PHASE_ORDER.indexOf(from);
    const toIndex = PHASE_ORDER.indexOf(to);
    // Can move forward or stay in same phase
    return toIndex >= fromIndex;
}

/**
 * Calculate phase distribution from work items
 * Returns count and percentage for each phase
 */
export function calculatePhaseDistribution(workItems: Array<{
    status?: string;
    phase?: string;
    has_timeline_breakdown?: boolean;
    assigned_to?: string | null;
    is_mind_map_conversion?: boolean;
    progress_percent?: number;
    actual_start_date?: string | null;
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
 * Get phase config by ID (with legacy support)
 */
export function getPhaseConfig(phase: string): PhaseConfig | null {
    // Direct match
    if (phase in PHASE_CONFIG) {
        return PHASE_CONFIG[phase as WorkspacePhase];
    }
    // Legacy phase - migrate and return
    if (phase in LEGACY_PHASE_MAP) {
        const newPhase = LEGACY_PHASE_MAP[phase as LegacyWorkspacePhase];
        return PHASE_CONFIG[newPhase];
    }
    return null;
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

// =============================================================================
// TYPE-AWARE PHASE HELPER FUNCTIONS
// =============================================================================

/**
 * Get phase config by work item type and phase
 * Returns the appropriate config based on the type's phase system
 */
export function getTypePhaseConfig(type: WorkItemType, phase: string): PhaseConfig | null {
    switch (type) {
        case 'concept':
            return phase in CONCEPT_PHASE_CONFIG
                ? CONCEPT_PHASE_CONFIG[phase as ConceptPhase]
                : null;
        case 'bug':
            return phase in BUG_PHASE_CONFIG
                ? BUG_PHASE_CONFIG[phase as BugPhase]
                : null;
        case 'feature':
            return phase in PHASE_CONFIG
                ? PHASE_CONFIG[phase as WorkspacePhase]
                : null;
        default:
            return null;
    }
}

/**
 * Get all valid phases for a work item type
 */
export function getValidPhasesForType(type: WorkItemType): readonly string[] {
    return TYPE_PHASE_MAP[type] || [];
}

/**
 * Check if a phase is valid for a work item type
 */
export function isValidPhaseForType(type: WorkItemType, phase: string): boolean {
    return TYPE_PHASE_MAP[type]?.includes(phase) || false;
}

/**
 * Get the next phase for a work item type
 * Returns null if at terminal phase
 */
export function getNextPhaseForType(type: WorkItemType, currentPhase: string): string | null {
    const phases = TYPE_PHASE_ORDER[type];
    if (!phases) return null;

    const currentIndex = phases.indexOf(currentPhase);
    if (currentIndex === -1 || currentIndex >= phases.length - 1) {
        return null;
    }
    return phases[currentIndex + 1];
}

/**
 * Get the previous phase for a work item type
 * Returns null if at first phase
 */
export function getPreviousPhaseForType(type: WorkItemType, currentPhase: string): string | null {
    const phases = TYPE_PHASE_ORDER[type];
    if (!phases) return null;

    const currentIndex = phases.indexOf(currentPhase);
    if (currentIndex <= 0) {
        return null;
    }
    return phases[currentIndex - 1];
}

/**
 * Check if a phase transition is valid for a work item type
 * Special handling for concept rejection (can reject from any phase)
 */
export function isValidTypePhaseTransition(
    type: WorkItemType,
    from: string,
    to: string
): boolean {
    const phases = TYPE_PHASE_ORDER[type];
    if (!phases) return false;

    // Special case: concepts can be rejected from any phase
    if (type === 'concept' && to === 'rejected') {
        return true;
    }

    const fromIndex = phases.indexOf(from);
    const toIndex = phases.indexOf(to);

    // Both phases must be valid for this type
    if (fromIndex === -1 || toIndex === -1) return false;

    // Can only move forward or stay in same phase
    return toIndex >= fromIndex;
}

/**
 * Get the default (initial) phase for a work item type
 */
export function getDefaultPhaseForType(type: WorkItemType): string {
    const phases = TYPE_PHASE_ORDER[type];
    return phases?.[0] || 'design';
}

/**
 * Check if a phase is terminal (cannot progress further)
 */
export function isTerminalPhase(type: WorkItemType, phase: string): boolean {
    const terminals = TERMINAL_PHASES[type];
    return terminals?.includes(phase) || false;
}

/**
 * Get phase progress percentage for visualization
 * Returns 0-100 based on position in phase progression
 */
export function getPhaseProgress(type: WorkItemType, phase: string): number {
    const phases = TYPE_PHASE_ORDER[type];
    if (!phases) return 0;

    const currentIndex = phases.indexOf(phase);
    if (currentIndex === -1) return 0;

    // Calculate percentage (e.g., phase 2 of 4 = 50%)
    return Math.round(((currentIndex + 1) / phases.length) * 100);
}

/**
 * Get phase index for a type (useful for sorting)
 */
export function getPhaseIndex(type: WorkItemType, phase: string): number {
    const phases = TYPE_PHASE_ORDER[type];
    if (!phases) return -1;
    return phases.indexOf(phase);
}

/**
 * Universal phase config getter that works for any type
 * Useful when you have a work item and need its phase config
 */
export function getUniversalPhaseConfig(workItem: {
    type: string;
    phase: string;
}): PhaseConfig | null {
    return getTypePhaseConfig(workItem.type as WorkItemType, workItem.phase);
}

/**
 * Calculate type-aware phase distribution from work items
 * Groups work items by type, then by phase within each type
 */
export function calculateTypeAwarePhaseDistribution(workItems: Array<{
    type: string;
    phase?: string;
}>): Record<WorkItemType, Record<string, { count: number; percentage: number }>> {
    const result: Record<WorkItemType, Record<string, { count: number; percentage: number }>> = {
        feature: {},
        concept: {},
        bug: {},
    };

    // Group by type
    const byType = workItems.reduce((acc, item) => {
        const type = item.type as WorkItemType;
        if (!acc[type]) acc[type] = [];
        acc[type].push(item);
        return acc;
    }, {} as Record<WorkItemType, typeof workItems>);

    // Calculate distribution for each type
    for (const type of Object.keys(TYPE_PHASE_MAP) as WorkItemType[]) {
        const items = byType[type] || [];
        const total = items.length;
        const phases = TYPE_PHASE_MAP[type];

        for (const phase of phases) {
            const count = items.filter(i => i.phase === phase).length;
            result[type][phase] = {
                count,
                percentage: total > 0 ? Math.round((count / total) * 100) : 0,
            };
        }
    }

    return result;
}
