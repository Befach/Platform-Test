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
  Workflow,
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
  | 'concept-workflow'

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
  /** Function to determine if tab should be visible based on work item type */
  isVisibleForType?: (type: string) => boolean
}

/**
 * Complete tab configuration for the 9-tab structure
 *
 * Tab Visibility Matrix (4-Phase System):
 * | Tab              | design | build | refine | launch | Type-Specific |
 * |------------------|:------:|:-----:|:------:|:------:|:-------------:|
 * | Summary          | ✓      | ✓     | ✓      | ✓      | -             |
 * | Inspiration      | ✓      | -     | -      | -      | -             |
 * | Resources        | ✓      | ✓     | ✓      | ✓      | -             |
 * | Scope            | ✓      | ✓     | ✓      | ✓      | -             |
 * | Tasks            | -      | ✓     | ✓      | ✓      | -             |
 * | Feedback         | -      | ✓     | ✓      | ✓      | -             |
 * | Metrics          | -      | ✓     | ✓      | ✓      | -             |
 * | AI Copilot       | ✓      | ✓     | ✓      | ✓      | -             |
 * | Concept Workflow | ✓      | ✓     | ✓      | ✓      | concept only  |
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
    id: 'concept-workflow',
    label: 'Concept Workflow',
    icon: Workflow,
    description: 'Manage concept lifecycle and phase transitions',
    visibleInPhases: ['design', 'build', 'refine', 'launch'],
    isVisibleForType: (type: string) => type === 'concept',
  },
]

/**
 * Get visible tabs for a given phase
 * Supports both new and legacy phase values
 */
export function getVisibleTabs(phase: WorkspacePhase | string, workItemType?: string): TabConfig[] {
  const normalizedPhase = migratePhase(phase)
  return TAB_CONFIG.filter((tab) => {
    // Check phase visibility
    if (!tab.visibleInPhases.includes(normalizedPhase)) {
      return false
    }
    // Check type-specific visibility
    if (tab.isVisibleForType && workItemType) {
      return tab.isVisibleForType(workItemType)
    }
    // If no type filter, show tab (unless it has a type filter but no type provided)
    return !tab.isVisibleForType
  })
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
