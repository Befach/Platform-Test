'use client'

import { useMemo } from 'react'
import { cn } from '@/lib/utils'
import {
  WorkItemDetailProvider,
  useWorkItemDetailContext,
  type WorkItemData,
  type TimelineItemData,
} from './shared/detail-context'
import { WorkItemDetailHeader } from './work-item-detail-header'
import { WorkItemDetailTabs } from './work-item-detail-tabs'
import { SummaryTab } from './tabs/summary-tab'
import { ScopeTab } from './tabs/scope-tab'
import { TasksTab } from './tabs/tasks-tab'
import { FeedbackTab } from './tabs/feedback-tab'
import { InspirationTab } from './tabs/inspiration-tab'
import { ResourcesTab } from './tabs/resources-tab'
import { ConceptWorkflowPanel } from '../work-items/concept-workflow-panel'
import { TrackingSidebar, CollapsedSidebarToggle } from './tracking-sidebar'

// ============================================================================
// Types
// ============================================================================

export interface WorkItemDetailShellProps {
  workItem: WorkItemData
  timelineItems: TimelineItemData[]
  taskCount?: number
  feedbackCount?: number
  className?: string
}

// ============================================================================
// Inner Content Component (uses context)
// ============================================================================

function WorkItemDetailContent({ className }: { className?: string }) {
  const { activeTab, preferences } = useWorkItemDetailContext()

  // Render active tab content
  const renderTabContent = () => {
    switch (activeTab) {
      case 'summary':
        return <SummaryTab />
      case 'inspiration':
        return <InspirationTab />
      case 'resources':
        return <ResourcesTab />
      case 'scope':
        return <ScopeTab />
      case 'tasks':
        return <TasksTab />
      case 'feedback':
        return <FeedbackTab />
      case 'metrics':
        return <MetricsTabPlaceholder />
      case 'ai-copilot':
        return <AICopilotTabPlaceholder />
      case 'concept-workflow':
        return <ConceptWorkflowPanel />
      default:
        return <SummaryTab />
    }
  }

  return (
    <div className={cn('min-h-screen bg-gradient-to-br from-slate-50 to-slate-100', className)}>
      {/* Header */}
      <WorkItemDetailHeader />

      {/* Main content area */}
      <main className="px-6 py-6">
        <div
          className={cn(
            'flex gap-6',
            // When sidebar is visible, adjust layout
            !preferences.sidebarCollapsed && 'lg:pr-80'
          )}
        >
          {/* Main content (tabs + content) */}
          <div className="flex-1 min-w-0">
            {/* Tab navigation */}
            <div className="mb-6">
              <WorkItemDetailTabs />
            </div>

            {/* Tab content */}
            <div className="min-h-[400px]">
              {renderTabContent()}
            </div>
          </div>
        </div>
      </main>

      {/* Tracking Sidebar - Fixed on right */}
      <TrackingSidebar />

      {/* Collapsed Sidebar Toggle */}
      <CollapsedSidebarToggle />
    </div>
  )
}

// ============================================================================
// Placeholder Components (to be implemented in Phase 4)
// ============================================================================

function MetricsTabPlaceholder() {
  return (
    <div className="text-center py-12 text-muted-foreground">
      <p className="text-lg font-medium mb-2">Metrics Tab</p>
      <p className="text-sm">Performance tracking, estimated vs actual, progress charts</p>
      <p className="text-xs mt-4 text-muted-foreground/70">Pro Feature - Coming in Phase 4</p>
    </div>
  )
}

function AICopilotTabPlaceholder() {
  return (
    <div className="text-center py-12 text-muted-foreground">
      <p className="text-lg font-medium mb-2">AI Copilot Tab</p>
      <p className="text-sm">Context-aware AI assistant for this work item</p>
      <p className="text-xs mt-4 text-muted-foreground/70">Pro Feature - Coming in Phase 4</p>
    </div>
  )
}


// ============================================================================
// Main Shell Component (with Provider)
// ============================================================================

export function WorkItemDetailShell({
  workItem,
  timelineItems,
  taskCount = 0,
  feedbackCount = 0,
  className,
}: WorkItemDetailShellProps) {
  return (
    <WorkItemDetailProvider
      workItem={workItem}
      timelineItems={timelineItems}
      taskCount={taskCount}
      feedbackCount={feedbackCount}
    >
      <WorkItemDetailContent className={className} />
    </WorkItemDetailProvider>
  )
}

// ============================================================================
// Re-exports
// ============================================================================

export type { WorkItemData, TimelineItemData } from './shared/detail-context'
