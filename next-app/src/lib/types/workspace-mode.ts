/**
 * Workspace Mode Types - Lifecycle Context
 *
 * Types and configuration for workspace lifecycle modes:
 * - development: Building something new from scratch
 * - launch: Racing toward first release
 * - growth: Iterating based on user feedback
 * - maintenance: Stability and sustainability
 */

// ============================================================================
// CONSTANTS
// ============================================================================

/**
 * All available workspace modes
 */
export const WORKSPACE_MODES = ['development', 'launch', 'growth', 'maintenance'] as const;

export type WorkspaceMode = typeof WORKSPACE_MODES[number];

/**
 * Configuration for each workspace mode
 */
export interface WorkspaceModeConfig {
  id: WorkspaceMode;
  name: string;
  description: string;
  color: string;
  bgColor: string;
  borderColor: string;
  icon: string;
  emphasis: string;
}

/**
 * Complete configuration for all workspace modes
 */
export const WORKSPACE_MODE_CONFIG: Record<WorkspaceMode, WorkspaceModeConfig> = {
  development: {
    id: 'development',
    name: 'Development',
    description: 'Building something new from scratch',
    color: '#6366f1',
    bgColor: '#eef2ff',
    borderColor: '#c7d2fe',
    icon: 'code-2',
    emphasis: 'Feature completion, MVP scope',
  },
  launch: {
    id: 'launch',
    name: 'Launch',
    description: 'Racing toward first release',
    color: '#f97316',
    bgColor: '#fff7ed',
    borderColor: '#fed7aa',
    icon: 'rocket',
    emphasis: 'Shipping fast, blocking issues',
  },
  growth: {
    id: 'growth',
    name: 'Growth',
    description: 'Iterating based on user feedback',
    color: '#10b981',
    bgColor: '#ecfdf5',
    borderColor: '#a7f3d0',
    icon: 'trending-up',
    emphasis: 'User satisfaction, adoption',
  },
  maintenance: {
    id: 'maintenance',
    name: 'Maintenance',
    description: 'Stability and sustainability',
    color: '#64748b',
    bgColor: '#f8fafc',
    borderColor: '#cbd5e1',
    icon: 'shield',
    emphasis: 'Bug fixes, tech debt, stability',
  },
};

// ============================================================================
// TYPES FOR MODE SETTINGS (JSONB)
// ============================================================================

/**
 * Type weights for work item prioritization by mode
 * Higher values = more emphasis on that type
 * Note: Enhancement is a flag on features, not a separate type - use feature weight
 */
export interface ModeTypeWeights {
  concept: number;
  feature: number;
  bug: number;
}

/**
 * Phase emphasis configuration
 */
export type PhaseEmphasis = 'high' | 'medium' | 'low';

/**
 * AI personality settings for mode-specific behavior
 */
export interface ModeAIPersonality {
  bias: 'ship_fast' | 'user_driven' | 'stability' | 'balanced';
  suggestion_frequency: 'high' | 'medium' | 'low';
}

/**
 * Complete mode settings structure (stored in JSONB)
 */
export interface WorkspaceModeSettings {
  type_weights?: Partial<ModeTypeWeights>;
  phase_emphasis?: Record<string, PhaseEmphasis>;
  dashboard_widgets?: string[];
  ai_personality?: ModeAIPersonality;
}

/**
 * Default mode settings for each mode
 */
export const DEFAULT_MODE_SETTINGS: Record<WorkspaceMode, WorkspaceModeSettings> = {
  development: {
    type_weights: { concept: 9, feature: 10, bug: 3 },
    ai_personality: { bias: 'balanced', suggestion_frequency: 'medium' },
  },
  launch: {
    type_weights: { concept: 2, feature: 8, bug: 10 },
    ai_personality: { bias: 'ship_fast', suggestion_frequency: 'high' },
  },
  growth: {
    type_weights: { concept: 5, feature: 9, bug: 6 }, // Feature weight increased to account for enhancements
    ai_personality: { bias: 'user_driven', suggestion_frequency: 'high' },
  },
  maintenance: {
    type_weights: { concept: 2, feature: 5, bug: 10 }, // Feature weight increased to account for enhancements
    ai_personality: { bias: 'stability', suggestion_frequency: 'low' },
  },
};

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Get mode configuration by mode id
 */
export function getWorkspaceModeConfig(mode: WorkspaceMode): WorkspaceModeConfig {
  return WORKSPACE_MODE_CONFIG[mode];
}

/**
 * Check if a string is a valid workspace mode
 */
export function isValidWorkspaceMode(mode: string): mode is WorkspaceMode {
  return WORKSPACE_MODES.includes(mode as WorkspaceMode);
}

/**
 * Get the default mode for new workspaces
 */
export function getDefaultWorkspaceMode(): WorkspaceMode {
  return 'development';
}

/**
 * Get mode icon as emoji for fallback display
 */
export function getWorkspaceModeEmoji(mode: WorkspaceMode): string {
  const emojiMap: Record<WorkspaceMode, string> = {
    development: '🛠️',
    launch: '🚀',
    growth: '📈',
    maintenance: '🛡️',
  };
  return emojiMap[mode];
}

/**
 * Get suggested next mode based on current mode
 * Returns null if maintenance (end of typical lifecycle)
 */
export function getSuggestedNextMode(currentMode: WorkspaceMode): WorkspaceMode | null {
  const transitions: Record<WorkspaceMode, WorkspaceMode | null> = {
    development: 'launch',
    launch: 'growth',
    growth: 'maintenance',
    maintenance: null,
  };
  return transitions[currentMode];
}
