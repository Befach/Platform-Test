/**
 * Strategy Types - Product Strategy (OKRs/Pillars) Module
 *
 * Types for the hierarchical strategy system with:
 * - Pillar > Objective > Key Result > Initiative hierarchy
 * - Hybrid progress (auto-calculated + manual override)
 * - Work item alignment (primary + additional)
 */

// ============================================================================
// ENUMS & CONSTANTS
// ============================================================================

export const STRATEGY_TYPES = [
  'pillar',      // Top-level strategic pillar (e.g., "Revenue Growth")
  'objective',   // Objective under a pillar (e.g., "Increase MRR by 50%")
  'key_result',  // Measurable key result (e.g., "Acquire 100 new customers")
  'initiative',  // Initiative/project to achieve KRs (e.g., "Launch referral program")
] as const;

export type StrategyType = typeof STRATEGY_TYPES[number];

export const STRATEGY_STATUSES = [
  'draft',      // Not yet active
  'active',     // Currently being worked on
  'completed',  // Successfully achieved
  'cancelled',  // Abandoned
  'on_hold',    // Temporarily paused
] as const;

export type StrategyStatus = typeof STRATEGY_STATUSES[number];

export const PROGRESS_MODES = ['auto', 'manual'] as const;
export type ProgressMode = typeof PROGRESS_MODES[number];

export const ALIGNMENT_STRENGTHS = [
  'weak',    // Minor contribution
  'medium',  // Moderate contribution
  'strong',  // Major contribution
] as const;

export type AlignmentStrength = typeof ALIGNMENT_STRENGTHS[number];

// Type hierarchy order (for validation)
export const STRATEGY_TYPE_ORDER: Record<StrategyType, number> = {
  pillar: 0,
  objective: 1,
  key_result: 2,
  initiative: 3,
};

// Default colors by type
export const STRATEGY_TYPE_COLORS: Record<StrategyType, string> = {
  pillar: '#6366f1',     // Indigo
  objective: '#8b5cf6',  // Purple
  key_result: '#06b6d4', // Cyan
  initiative: '#10b981', // Emerald
};

// ============================================================================
// CORE TYPES
// ============================================================================

/**
 * ProductStrategy - Core strategy entity
 */
export interface ProductStrategy {
  id: string;
  team_id: string;
  workspace_id: string | null;
  type: StrategyType;
  parent_id: string | null;
  title: string;
  description: string | null;
  start_date: string | null;
  target_date: string | null;
  status: StrategyStatus;
  // Hybrid progress
  progress: number;
  progress_mode: ProgressMode;
  calculated_progress: number;
  // Metrics (primarily for Key Results)
  metric_name: string | null;
  metric_current: number | null;
  metric_target: number | null;
  metric_unit: string | null;
  // Context fields (primarily for Pillars)
  user_stories: string[];
  user_examples: string[];
  case_studies: string[];
  // Ownership & display
  owner_id: string | null;
  color: string;
  sort_order: number;
  // Timestamps
  created_at: string;
  updated_at: string;
}

/**
 * Strategy with owner details
 */
export interface ProductStrategyWithOwner extends ProductStrategy {
  owner?: {
    id: string;
    name: string;
    email: string;
    avatar_url?: string;
  } | null;
}

/**
 * Strategy with children (for tree view)
 */
export interface StrategyWithChildren extends ProductStrategyWithOwner {
  children: StrategyWithChildren[];
  aligned_work_items_count?: number;
}

/**
 * Flattened strategy for list views (with computed fields)
 */
export interface StrategyListItem extends ProductStrategyWithOwner {
  depth: number;
  has_children: boolean;
  parent_title?: string;
  aligned_work_items_count: number;
}

// ============================================================================
// ALIGNMENT TYPES
// ============================================================================

/**
 * WorkItemStrategy - Junction table for additional alignments
 */
export interface WorkItemStrategy {
  id: string;
  work_item_id: string;
  strategy_id: string;
  alignment_strength: AlignmentStrength;
  notes: string | null;
  created_at: string;
}

/**
 * WorkItemStrategy with strategy details
 */
export interface WorkItemStrategyWithDetails extends WorkItemStrategy {
  strategy: ProductStrategy;
}

/**
 * WorkItemStrategy with work item details
 */
export interface WorkItemStrategyWithWorkItem extends WorkItemStrategy {
  work_item: {
    id: string;
    name: string;
    type: string;
    status: string;
  };
}

/**
 * Complete alignment info for a work item
 */
export interface WorkItemAlignments {
  primary: ProductStrategy | null;
  additional: WorkItemStrategyWithDetails[];
}

// ============================================================================
// API REQUEST/RESPONSE TYPES
// ============================================================================

/**
 * Create strategy request
 */
export interface CreateStrategyRequest {
  team_id: string;
  workspace_id?: string;
  type: StrategyType;
  parent_id?: string;
  title: string;
  description?: string;
  start_date?: string;
  target_date?: string;
  status?: StrategyStatus;
  progress_mode?: ProgressMode;
  metric_name?: string;
  metric_current?: number;
  metric_target?: number;
  metric_unit?: string;
  // Context fields (primarily for Pillars)
  user_stories?: string[];
  user_examples?: string[];
  case_studies?: string[];
  owner_id?: string;
  color?: string;
  sort_order?: number;
}

/**
 * Update strategy request
 */
export interface UpdateStrategyRequest {
  title?: string;
  description?: string;
  parent_id?: string | null;
  start_date?: string | null;
  target_date?: string | null;
  status?: StrategyStatus;
  progress?: number;
  progress_mode?: ProgressMode;
  metric_name?: string | null;
  metric_current?: number | null;
  metric_target?: number | null;
  metric_unit?: string | null;
  // Context fields (primarily for Pillars)
  user_stories?: string[];
  user_examples?: string[];
  case_studies?: string[];
  owner_id?: string | null;
  color?: string;
  sort_order?: number;
}

/**
 * List strategies request (query params)
 */
export interface ListStrategiesParams {
  team_id: string;
  workspace_id?: string;
  type?: StrategyType;
  status?: StrategyStatus;
  parent_id?: string | null; // null = root strategies only
}

/**
 * Strategy tree response
 */
export interface StrategyTreeResponse {
  data: StrategyWithChildren[];
  total_count: number;
}

/**
 * Single strategy response (with children and alignments)
 */
export interface StrategyDetailResponse {
  data: StrategyWithChildren;
  aligned_work_items: WorkItemStrategyWithWorkItem[];
}

/**
 * Align work item request
 */
export interface AlignWorkItemRequest {
  work_item_id: string;
  alignment_strength?: AlignmentStrength;
  notes?: string;
  is_primary?: boolean; // If true, sets strategy_id on work_item
}

/**
 * Remove alignment request
 */
export interface RemoveAlignmentRequest {
  work_item_id: string;
  remove_primary?: boolean; // If true, also clears strategy_id on work_item
}

// ============================================================================
// UI STATE TYPES
// ============================================================================

/**
 * Strategy tree node (for UI rendering)
 */
export interface StrategyTreeNode {
  id: string;
  title: string;
  type: StrategyType;
  status: StrategyStatus;
  progress: number;
  progressMode: ProgressMode;
  calculatedProgress: number;
  color: string;
  isExpanded: boolean;
  isSelected: boolean;
  depth: number;
  children: StrategyTreeNode[];
  hasMetrics: boolean;
  alignedCount: number;
}

/**
 * Strategy filter state
 */
export interface StrategyFilterState {
  search: string;
  type: StrategyType | 'all';
  status: StrategyStatus | 'all';
  showCompleted: boolean;
}

/**
 * Strategy selector state (for alignment picker)
 */
export interface StrategySelectorState {
  selectedIds: string[];
  expandedIds: string[];
  searchQuery: string;
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Get display progress (respects progress_mode)
 */
export function getDisplayProgress(strategy: ProductStrategy): number {
  return strategy.progress_mode === 'auto'
    ? strategy.calculated_progress
    : strategy.progress;
}

/**
 * Get strategy type label for UI
 */
export function getStrategyTypeLabel(type: StrategyType): string {
  const labels: Record<StrategyType, string> = {
    pillar: 'Pillar',
    objective: 'Objective',
    key_result: 'Key Result',
    initiative: 'Initiative',
  };
  return labels[type];
}

/**
 * Get strategy type short label for badges
 */
export function getStrategyTypeShortLabel(type: StrategyType): string {
  const labels: Record<StrategyType, string> = {
    pillar: 'P',
    objective: 'O',
    key_result: 'KR',
    initiative: 'I',
  };
  return labels[type];
}

/**
 * Get strategy status label for UI
 */
export function getStrategyStatusLabel(status: StrategyStatus): string {
  const labels: Record<StrategyStatus, string> = {
    draft: 'Draft',
    active: 'Active',
    completed: 'Completed',
    cancelled: 'Cancelled',
    on_hold: 'On Hold',
  };
  return labels[status];
}

/**
 * Get alignment strength label for UI
 */
export function getAlignmentStrengthLabel(strength: AlignmentStrength): string {
  const labels: Record<AlignmentStrength, string> = {
    weak: 'Weak',
    medium: 'Medium',
    strong: 'Strong',
  };
  return labels[strength];
}

/**
 * Check if a strategy type can be a child of another type
 */
export function canBeChildOf(childType: StrategyType, parentType: StrategyType): boolean {
  return STRATEGY_TYPE_ORDER[childType] > STRATEGY_TYPE_ORDER[parentType];
}

/**
 * Get valid child types for a parent type
 */
export function getValidChildTypes(parentType: StrategyType): StrategyType[] {
  const parentOrder = STRATEGY_TYPE_ORDER[parentType];
  return STRATEGY_TYPES.filter(type => STRATEGY_TYPE_ORDER[type] > parentOrder);
}

/**
 * Get valid parent types for a child type
 */
export function getValidParentTypes(childType: StrategyType): StrategyType[] {
  const childOrder = STRATEGY_TYPE_ORDER[childType];
  return STRATEGY_TYPES.filter(type => STRATEGY_TYPE_ORDER[type] < childOrder);
}

/**
 * Calculate metric progress percentage
 */
export function calculateMetricProgress(current: number | null, target: number | null): number {
  if (!target || target === 0 || current === null) return 0;
  return Math.min(100, Math.max(0, Math.round((current / target) * 100)));
}

/**
 * Get progress bar color based on status and progress
 */
export function getProgressColor(progress: number, status: StrategyStatus): string {
  if (status === 'completed') return 'bg-green-500';
  if (status === 'cancelled') return 'bg-gray-400';
  if (status === 'on_hold') return 'bg-yellow-500';
  if (progress >= 70) return 'bg-green-500';
  if (progress >= 40) return 'bg-yellow-500';
  return 'bg-red-500';
}

// =============================================================================
// DASHBOARD STATS TYPES
// =============================================================================

/**
 * Alignment coverage metrics
 */
export interface AlignmentCoverage {
  workItemsTotal: number;
  workItemsWithPrimary: number;
  workItemsWithAny: number;
  coveragePercent: number;
}

/**
 * Progress aggregation by strategy type
 */
export interface ProgressByType {
  type: StrategyType;
  avgProgress: number;
  count: number;
}

/**
 * Top strategy with alignment count
 */
export interface TopStrategyItem {
  id: string;
  title: string;
  type: StrategyType;
  alignedCount: number;
}

/**
 * Complete strategy stats for dashboard
 */
export interface StrategyStats {
  byType: Record<StrategyType, number>;
  byStatus: Record<StrategyStatus, number>;
  alignmentCoverage: AlignmentCoverage;
  progressByType: ProgressByType[];
  topStrategiesByAlignment: TopStrategyItem[];
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Build tree from flat list of strategies
 */
export function buildStrategyTree(
  strategies: ProductStrategyWithOwner[],
  alignmentCounts?: Map<string, number>
): StrategyWithChildren[] {
  const map = new Map<string, StrategyWithChildren>();
  const roots: StrategyWithChildren[] = [];

  // First pass: create nodes
  strategies.forEach(strategy => {
    map.set(strategy.id, {
      ...strategy,
      children: [],
      aligned_work_items_count: alignmentCounts?.get(strategy.id) || 0,
    });
  });

  // Second pass: build tree
  strategies.forEach(strategy => {
    const node = map.get(strategy.id)!;
    if (strategy.parent_id && map.has(strategy.parent_id)) {
      map.get(strategy.parent_id)!.children.push(node);
    } else {
      roots.push(node);
    }
  });

  // Sort children by sort_order, then by title
  const sortChildren = (nodes: StrategyWithChildren[]) => {
    nodes.sort((a, b) => {
      if (a.sort_order !== b.sort_order) return a.sort_order - b.sort_order;
      return a.title.localeCompare(b.title);
    });
    nodes.forEach(node => sortChildren(node.children));
  };

  sortChildren(roots);
  return roots;
}
