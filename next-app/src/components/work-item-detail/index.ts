/**
 * Work Item Detail Page Components
 *
 * 9-Tab interface for detailed work item management:
 * - Summary: Overview, status, quick stats
 * - Inspiration: Research links, competitor analysis (Phase 3)
 * - Resources: Figma, GitHub, docs (Phase 3)
 * - Scope: Timeline breakdown (MVP/SHORT/LONG)
 * - Tasks: Execution checklist
 * - Feedback: User/stakeholder input (Phase 2)
 * - Metrics: Performance tracking (Phase 4, Pro)
 * - AI Copilot: Context-aware AI (Phase 4, Pro)
 * - Versions: Version history and enhanced iterations (conditional)
 */

// Main shell component
export {
  WorkItemDetailShell,
  type WorkItemDetailShellProps,
  type WorkItemData,
  type TimelineItemData,
} from './work-item-detail-shell'

// Header component
export {
  WorkItemDetailHeader,
  WorkItemDetailHeaderStandalone,
} from './work-item-detail-header'

// Tabs navigation
export {
  WorkItemDetailTabs,
  WorkItemDetailTabsStandalone,
} from './work-item-detail-tabs'

// Context and types
export {
  WorkItemDetailProvider,
  useWorkItemDetailContext,
  type DetailTab,
  type TabConfig,
  type TabVisibilityContext,
  type DetailPreferences,
  type TabViewMode,
} from './shared/detail-context'

// Tab visibility utilities
export {
  TAB_CONFIG,
  getVisibleTabs,
  getVisibleTabsWithContext,
  getDefaultTab,
  isTabVisible,
  getTabConfig,
  getVisibleTabCount,
  shouldShowVersionsTab,
} from './shared/tab-visibility'

// Individual tab components
export { SummaryTab } from './tabs/summary-tab'
export { ScopeTab } from './tabs/scope-tab'
export { TasksTab } from './tabs/tasks-tab'
export { FeedbackTab } from './tabs/feedback-tab'
export { VersionsTab } from './tabs/versions-tab'

// Tracking sidebar
export { TrackingSidebar, CollapsedSidebarToggle } from './tracking-sidebar'
