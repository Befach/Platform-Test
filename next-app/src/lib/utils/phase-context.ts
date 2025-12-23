/**
 * Phase Context Utilities
 *
 * Smart default logic for phase assignment based on:
 * 1. Explicit context (creating from specific phase page)
 * 2. Workspace active phase
 * 3. User's recent phases (localStorage tracking)
 * 4. User's assigned phases
 * 5. Fallback to first available phase
 */

import { type WorkspacePhase } from '@/lib/constants/workspace-phases';

// =====================================================
// Types
// =====================================================

export interface PhaseContext {
  workspaceId: string;
  currentActivePhase?: WorkspacePhase;
  sourcePhaseId?: WorkspacePhase; // If creating from phase-specific page
  userAssignedPhases: WorkspacePhase[];
  userRecentPhases?: WorkspacePhase[];
}

export interface RecentPhaseEntry {
  workspaceId: string;
  phase: WorkspacePhase;
  timestamp: number;
}

export interface PhaseLeadInfo {
  userId: string;
  userName: string;
  userEmail: string;
  isLead: boolean;
}

// =====================================================
// Smart Default Selection
// =====================================================

/**
 * Get the default phase for a new work item based on context
 *
 * Priority order:
 * 1. Explicit source phase (if user has access)
 * 2. Current workspace active phase (if user has access)
 * 3. User's most recently used phase in this workspace
 * 4. User's first assigned phase
 * 5. Null (no default)
 */
export function getDefaultPhase(context: PhaseContext): WorkspacePhase | null {
  // 1. Explicit context from source page
  if (context.sourcePhaseId && context.userAssignedPhases.includes(context.sourcePhaseId)) {
    return context.sourcePhaseId;
  }

  // 2. Active workspace phase (if user can assign to it)
  if (context.currentActivePhase && context.userAssignedPhases.includes(context.currentActivePhase)) {
    return context.currentActivePhase;
  }

  // 3. Most recent phase used in this workspace
  if (context.userRecentPhases && context.userRecentPhases.length > 0) {
    const recentAccessible = context.userRecentPhases.find(
      (phase) => context.userAssignedPhases.includes(phase)
    );
    if (recentAccessible) {
      return recentAccessible;
    }
  }

  // 4. First assigned phase
  if (context.userAssignedPhases.length > 0) {
    return context.userAssignedPhases[0];
  }

  // 5. No default
  return null;
}

// =====================================================
// Recent Phase Tracking (LocalStorage)
// =====================================================

const RECENT_PHASES_KEY = 'workspace_recent_phases';
const MAX_RECENT_PHASES = 5; // Keep last 5 phases per workspace

/**
 * Save a phase to user's recent phases for a workspace
 */
export function saveRecentPhase(
  userId: string,
  workspaceId: string,
  phase: WorkspacePhase
): void {
  if (typeof window === 'undefined') return;

  try {
    const key = `${RECENT_PHASES_KEY}_${userId}`;
    const stored = localStorage.getItem(key);
    let recentPhases: RecentPhaseEntry[] = stored ? JSON.parse(stored) : [];

    // Remove existing entry for this workspace+phase combo
    recentPhases = recentPhases.filter(
      (entry) => !(entry.workspaceId === workspaceId && entry.phase === phase)
    );

    // Add new entry at the beginning
    recentPhases.unshift({
      workspaceId,
      phase,
      timestamp: Date.now(),
    });

    // Keep only MAX_RECENT_PHASES per workspace
    const phasesByWorkspace = new Map<string, RecentPhaseEntry[]>();

    for (const entry of recentPhases) {
      if (!phasesByWorkspace.has(entry.workspaceId)) {
        phasesByWorkspace.set(entry.workspaceId, []);
      }
      const workspaceEntries = phasesByWorkspace.get(entry.workspaceId)!;
      if (workspaceEntries.length < MAX_RECENT_PHASES) {
        workspaceEntries.push(entry);
      }
    }

    // Flatten back to array
    const trimmedPhases: RecentPhaseEntry[] = [];
    phasesByWorkspace.forEach((entries) => {
      trimmedPhases.push(...entries);
    });

    // Sort by timestamp descending
    trimmedPhases.sort((a, b) => b.timestamp - a.timestamp);

    localStorage.setItem(key, JSON.stringify(trimmedPhases));
  } catch (error) {
    console.error('Failed to save recent phase:', error);
  }
}

/**
 * Get user's recent phases for a specific workspace
 */
export function getRecentPhases(
  userId: string,
  workspaceId: string
): WorkspacePhase[] {
  if (typeof window === 'undefined') return [];

  try {
    const key = `${RECENT_PHASES_KEY}_${userId}`;
    const stored = localStorage.getItem(key);

    if (!stored) return [];

    const recentPhases: RecentPhaseEntry[] = JSON.parse(stored);

    // Filter to this workspace and map to phase IDs
    return recentPhases
      .filter((entry) => entry.workspaceId === workspaceId)
      .map((entry) => entry.phase)
      .slice(0, MAX_RECENT_PHASES);
  } catch (error) {
    console.error('Failed to get recent phases:', error);
    return [];
  }
}

/**
 * Clear recent phases (e.g., on logout)
 */
export function clearRecentPhases(userId: string): void {
  if (typeof window === 'undefined') return;

  try {
    const key = `${RECENT_PHASES_KEY}_${userId}`;
    localStorage.removeItem(key);
  } catch (error) {
    console.error('Failed to clear recent phases:', error);
  }
}

// =====================================================
// Phase Transition Validation
// =====================================================

export interface PhaseTransitionRule {
  from: WorkspacePhase;
  to: WorkspacePhase;
  requiresOwner?: boolean;
  requiresTimeline?: boolean;
  requiresCompletion?: boolean;
  warningMessage?: string;
}

/**
 * Default phase transition rules
 * Can be extended or overridden per workspace
 */
export const DEFAULT_TRANSITION_RULES: PhaseTransitionRule[] = [
  {
    from: 'design',
    to: 'build',
    requiresTimeline: false,
    warningMessage: 'Moving to Build. Consider adding timeline breakdown.',
  },
  {
    from: 'build',
    to: 'refine',
    requiresOwner: true,
    requiresCompletion: false,
    warningMessage: 'Moving to Refine. Ensure work is ready for review.',
  },
  {
    from: 'refine',
    to: 'launch',
    warningMessage: 'Moving to Launch. Ensure all feedback is addressed.',
  },
];

/**
 * Check if a phase transition is allowed and get warning messages
 */
export function getPhaseTransitionWarnings(
  fromPhase: WorkspacePhase | null,
  toPhase: WorkspacePhase,
  workItemData?: {
    owner?: string | null;
    hasTimeline?: boolean;
    status?: string;
  }
): string[] {
  if (!fromPhase || fromPhase === toPhase) return [];

  const warnings: string[] = [];
  const rule = DEFAULT_TRANSITION_RULES.find(
    (r) => r.from === fromPhase && r.to === toPhase
  );

  if (!rule) {
    // No specific rule, allow transition
    return warnings;
  }

  // Check requirements
  if (rule.requiresOwner && !workItemData?.owner) {
    warnings.push('⚠️ This work item should have an owner before moving to ' + toPhase);
  }

  if (rule.requiresTimeline && !workItemData?.hasTimeline) {
    warnings.push('⚠️ Consider adding timeline breakdown before moving to ' + toPhase);
  }

  if (rule.warningMessage) {
    warnings.push(rule.warningMessage);
  }

  return warnings;
}

/**
 * Check if a user can transition from one phase to another
 * User must have edit permission on BOTH phases
 */
export function canTransitionPhases(
  fromPhase: WorkspacePhase | null,
  toPhase: WorkspacePhase,
  userAssignedPhases: WorkspacePhase[]
): boolean {
  // Can always assign to accessible phase if creating new item
  if (!fromPhase) {
    return userAssignedPhases.includes(toPhase);
  }

  // For transitions, need access to both phases
  return (
    userAssignedPhases.includes(fromPhase) &&
    userAssignedPhases.includes(toPhase)
  );
}

// =====================================================
// Workload Helpers
// =====================================================

export interface PhaseWorkload {
  phase: WorkspacePhase;
  totalCount: number;
  notStartedCount: number;
  inProgressCount: number;
  completedCount: number;
  onHoldCount: number;
}

/**
 * Get workload percentage (how full a phase is)
 * Returns a number between 0-100
 */
export function getPhaseWorkloadPercentage(
  workload: PhaseWorkload,
  maxRecommended: number = 50
): number {
  const percentage = (workload.totalCount / maxRecommended) * 100;
  return Math.min(percentage, 100);
}

/**
 * Get workload status indicator
 */
export function getPhaseWorkloadStatus(
  workload: PhaseWorkload,
  maxRecommended: number = 50
): 'low' | 'medium' | 'high' | 'critical' {
  const percentage = getPhaseWorkloadPercentage(workload, maxRecommended);

  if (percentage >= 90) return 'critical';
  if (percentage >= 70) return 'high';
  if (percentage >= 40) return 'medium';
  return 'low';
}

// =====================================================
// Phase Lead Helpers
// =====================================================

/**
 * Format phase lead info for tooltip display
 */
export function formatPhaseLeadTooltip(leadInfo?: PhaseLeadInfo): string {
  if (!leadInfo) {
    return 'Contact your team admin for access';
  }

  return `Phase Lead: ${leadInfo.userName} (${leadInfo.userEmail})`;
}

// =====================================================
// Validation Helpers
// =====================================================

/**
 * Validate that a phase selection is allowed
 */
export function validatePhaseSelection(
  selectedPhase: WorkspacePhase | null,
  userAssignedPhases: WorkspacePhase[]
): { valid: boolean; error?: string } {
  if (!selectedPhase) {
    return { valid: false, error: 'Phase is required' };
  }

  if (!userAssignedPhases.includes(selectedPhase)) {
    return {
      valid: false,
      error: `You don't have permission to assign work items to the ${selectedPhase} phase. Please select a phase where you have edit access.`,
    };
  }

  return { valid: true };
}

/**
 * Get user-friendly error message for phase validation
 */
export function getPhaseValidationError(
  selectedPhase: WorkspacePhase | null,
  userAssignedPhases: WorkspacePhase[]
): string | null {
  const validation = validatePhaseSelection(selectedPhase, userAssignedPhases);
  return validation.error || null;
}
