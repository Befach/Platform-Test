/**
 * Phase-Based Tab Visibility Configuration
 *
 * Updated 2025-12-13: Migrated to 4-phase system
 * - design (was research/planning)
 * - build (was execution)
 * - refine (was review)
 * - launch (was complete)
 *
 * Uses progressive disclosure - tabs appear as work progresses
 * through the lifecycle: design → build → refine → launch
 */

import type { WorkspacePhase } from '@/lib/constants/workspace-phases'
import { migratePhase } from '@/lib/constants/workspace-phases'
import {
  FileText,
  Lightbulb,
  Link2,
  Target,
  CheckSquare,
  MessageSquare,
  BarChart3,
  Bot,
  History,
  type LucideIcon,
} from 'lucide-react'

/**
 * Tab identifiers for the 9-tab structure
 */
export type DetailTab =
  | 'summary'
  | 'inspiration'
  | 'resources'
  | 'scope'
  | 'tasks'
  | 'feedback'
  | 'metrics'
  | 'ai-copilot'
  | 'versions'

/**
 * Tab configuration with metadata
 */
export interface TabConfig {
  id: DetailTab
  label: string
  icon: LucideIcon
  description: string
  /** Phases where this tab is visible */
  visibleInPhases: WorkspacePhase[]
  /** Whether this is a Pro-tier feature */
  isPro?: boolean
  /** Whether visibility requires additional context (e.g., version history exists) */
  conditionalVisibility?: boolean
}

/**
 * Complete tab configuration for the 9-tab structure
 *
 * Tab Visibility Matrix (4-Phase System):
 * | Tab         | design | build | refine | launch | Notes           |
 * |-------------|:------:|:-----:|:------:|:------:|-----------------|
 * | Summary     | ✓      | ✓     | ✓      | ✓      |                 |
 * | Inspiration | ✓      | -     | -      | -      |                 |
 * | Resources   | ✓      | ✓     | ✓      | ✓      |                 |
 * | Scope       | ✓      | ✓     | ✓      | ✓      |                 |
 * | Tasks       | -      | ✓     | ✓      | ✓      |                 |
 * | Feedback    | -      | ✓     | ✓      | ✓      |                 |
 * | Metrics     | -      | ✓     | ✓      | ✓      | Pro tier        |
 * | AI Copilot  | ✓      | ✓     | ✓      | ✓      | Pro tier        |
 * | Versions    | ✓      | ✓     | ✓      | ✓      | Conditional*    |
 *
 * *Versions tab only visible when version history exists (version > 1 or has enhancements)
 */
export const TAB_CONFIG: TabConfig[] = [
  {
    id: 'summary',
    label: 'Summary',
    icon: FileText,
    description: 'Overview, status, and health indicators',
    visibleInPhases: ['design', 'build', 'refine', 'launch'],
  },
  {
    id: 'inspiration',
    label: 'Inspiration',
    icon: Lightbulb,
    description: 'Research links, competitor analysis, user quotes',
    visibleInPhases: ['design'], // Only in Design phase
  },
  {
    id: 'resources',
    label: 'Resources',
    icon: Link2,
    description: 'Figma, GitHub, docs, API specs',
    visibleInPhases: ['design', 'build', 'refine', 'launch'],
  },
  {
    id: 'scope',
    label: 'Scope',
    icon: Target,
    description: 'Timeline breakdown: MVP, Short-term, Long-term',
    visibleInPhases: ['design', 'build', 'refine', 'launch'],
  },
  {
    id: 'tasks',
    label: 'Tasks',
    icon: CheckSquare,
    description: 'Execution checklist and task tracking',
    visibleInPhases: ['build', 'refine', 'launch'],
  },
  {
    id: 'feedback',
    label: 'Feedback',
    icon: MessageSquare,
    description: 'User feedback and stakeholder input',
    visibleInPhases: ['build', 'refine', 'launch'],
  },
  {
    id: 'metrics',
    label: 'Metrics',
    icon: BarChart3,
    description: 'Performance tracking and analytics',
    visibleInPhases: ['build', 'refine', 'launch'],
    isPro: true,
  },
  {
    id: 'ai-copilot',
    label: 'AI Copilot',
    icon: Bot,
    description: 'Context-aware AI assistant',
    visibleInPhases: ['design', 'build', 'refine', 'launch'],
    isPro: true,
  },
  {
    id: 'versions',
    label: 'Versions',
    icon: History,
    description: 'Version history and enhanced iterations',
    visibleInPhases: ['design', 'build', 'refine', 'launch'],
    conditionalVisibility: true, // Only show when version history exists
  },
]

/**
 * Get visible tabs for a given phase
 * Supports both new and legacy phase values
 */
export function getVisibleTabs(phase: WorkspacePhase | string): TabConfig[] {
  const normalizedPhase = migratePhase(phase)
  return TAB_CONFIG.filter((tab) => tab.visibleInPhases.includes(normalizedPhase))
}

/**
 * Check if a specific tab is visible in the given phase
 * Supports both new and legacy phase values
 */
export function isTabVisible(tabId: DetailTab, phase: WorkspacePhase | string): boolean {
  const normalizedPhase = migratePhase(phase)
  const tab = TAB_CONFIG.find((t) => t.id === tabId)
  return tab ? tab.visibleInPhases.includes(normalizedPhase) : false
}

/**
 * Get the default tab for a given phase
 * Returns 'summary' which is always visible
 */
export function getDefaultTab(): DetailTab {
  return 'summary'
}

/**
 * Get tab config by ID
 */
export function getTabConfig(tabId: DetailTab): TabConfig | undefined {
  return TAB_CONFIG.find((t) => t.id === tabId)
}

/**
 * Get total count of visible tabs for a phase
 * Supports both new and legacy phase values
 */
export function getVisibleTabCount(phase: WorkspacePhase | string): number {
  return getVisibleTabs(phase).length
}

/**
 * Context for conditional tab visibility
 */
export interface TabVisibilityContext {
  /** Work item version (>1 means has history) */
  version?: number
  /** ID of work item this enhances */
  enhancesWorkItemId?: string | null
  /** Whether this item has been enhanced by others */
  hasEnhancements?: boolean
}

/**
 * Get visible tabs for a given phase with context
 * Handles conditional visibility (e.g., versions tab)
 *
 * @param phase - Current work item phase
 * @param context - Additional context for conditional tabs
 */
export function getVisibleTabsWithContext(
  phase: WorkspacePhase | string,
  context?: TabVisibilityContext
): TabConfig[] {
  const normalizedPhase = migratePhase(phase)

  return TAB_CONFIG.filter((tab) => {
    // First check if tab is visible in this phase
    if (!tab.visibleInPhases.includes(normalizedPhase)) {
      return false
    }

    // Handle conditional visibility
    if (tab.conditionalVisibility) {
      // For versions tab, check if version history exists
      if (tab.id === 'versions') {
        if (!context) return false
        const hasVersionHistory =
          (context.version && context.version > 1) ||
          !!context.enhancesWorkItemId ||
          !!context.hasEnhancements
        return hasVersionHistory
      }
    }

    return true
  })
}

/**
 * Check if versions tab should be visible
 */
export function shouldShowVersionsTab(context: TabVisibilityContext): boolean {
  return !!(
    (context.version && context.version > 1) ||
    context.enhancesWorkItemId ||
    context.hasEnhancements
  )
}
