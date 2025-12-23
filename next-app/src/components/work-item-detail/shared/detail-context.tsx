'use client'

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  useEffect,
  type ReactNode,
} from 'react'
import {
  calculateWorkItemPhase,
  type WorkspacePhase,
} from '@/lib/constants/workspace-phases'
import {
  getVisibleTabs,
  getDefaultTab,
  isTabVisible,
  type DetailTab,
  type TabConfig,
} from './tab-visibility'

// ============================================================================
// Types
// ============================================================================

/**
 * Work item data passed to the context
 */
export interface WorkItemData {
  id: string
  title: string
  description: string | null
  status: string
  priority: string
  type: string
  assigned_to: string | null
  created_by: string
  created_at: string
  updated_at: string | null
  workspace_id: string
  team_id: string
  department_id?: string | null
  // Phase and workflow fields
  phase?: string
  metadata?: unknown
  rejection_reason?: string | null
  archived?: boolean
  review_enabled?: boolean
  review_status?: string | null
  // Relationships loaded from server
  workspace?: {
    id: string
    name: string
    icon: string | null
    phase: string
    team_id: string
  }
  assigned_to_user?: {
    id: string
    name: string | null
    email: string
  } | null
  created_by_user?: {
    id: string
    name: string | null
    email: string
  } | null
  department?: {
    id: string
    name: string
    color: string
    icon: string
  } | null
}

/**
 * Timeline item data
 * Matches the TimelineItem interface in timeline-items-list.tsx
 */
export interface TimelineItemData {
  id: string
  work_item_id: string
  title: string
  description: string | null
  timeline: 'MVP' | 'SHORT' | 'LONG'
  difficulty: string
  phase: string | null
  status: string | null
  order_index: number
  estimated_hours: number | null
  actual_hours: number | null
  completed_at: string | null
  created_at: string
  planned_start_date?: string | null
  planned_end_date?: string | null
}

/**
 * View mode for tabs that support multiple views
 */
export type TabViewMode = 'list' | 'board' | 'timeline' | 'table'

/**
 * Preferences persisted to localStorage
 */
export interface DetailPreferences {
  /** View mode for the scope tab */
  scopeViewMode: TabViewMode
  /** View mode for the tasks tab */
  tasksViewMode: TabViewMode
  /** Whether the tracking sidebar is collapsed */
  sidebarCollapsed: boolean
}

// ============================================================================
// Context Value Interface
// ============================================================================

interface WorkItemDetailContextValue {
  // Work item data
  workItem: WorkItemData
  timelineItems: TimelineItemData[]

  // Phase
  phase: WorkspacePhase

  // Tab navigation
  activeTab: DetailTab
  setActiveTab: (tab: DetailTab) => void
  visibleTabs: TabConfig[]
  isTabVisible: (tabId: DetailTab) => boolean

  // Preferences
  preferences: DetailPreferences
  setPreferences: (prefs: Partial<DetailPreferences>) => void

  // Sidebar
  toggleSidebar: () => void

  // Counts for badges
  counts: {
    timelineItems: number
    mvpItems: number
    shortItems: number
    longItems: number
    tasks: number
    feedback: number
  }

  // Update functions for optimistic updates
  updateWorkItem: (updates: Partial<WorkItemData>) => void
}

// ============================================================================
// Context Creation
// ============================================================================

const WorkItemDetailContext = createContext<WorkItemDetailContextValue | null>(null)

/**
 * Hook to access the work item detail context
 * Must be used within a WorkItemDetailProvider
 */
export function useWorkItemDetailContext() {
  const context = useContext(WorkItemDetailContext)
  if (!context) {
    throw new Error(
      'useWorkItemDetailContext must be used within a WorkItemDetailProvider'
    )
  }
  return context
}

// ============================================================================
// Default Values
// ============================================================================

const defaultPreferences: DetailPreferences = {
  scopeViewMode: 'list',
  tasksViewMode: 'board',
  sidebarCollapsed: false,
}

// ============================================================================
// Provider Props
// ============================================================================

interface WorkItemDetailProviderProps {
  children: ReactNode
  workItem: WorkItemData
  timelineItems: TimelineItemData[]
  /** Initial active tab (defaults to 'summary') */
  defaultTab?: DetailTab
  /** Task count (fetched separately to avoid over-fetching) */
  taskCount?: number
  /** Feedback count (fetched separately) */
  feedbackCount?: number
}

// ============================================================================
// localStorage Key
// ============================================================================

const getStorageKey = (workItemId: string) =>
  `work-item-detail-preferences-${workItemId}`

// ============================================================================
// Provider Component
// ============================================================================

export function WorkItemDetailProvider({
  children,
  workItem: initialWorkItem,
  timelineItems: initialTimelineItems,
  defaultTab = 'summary',
  taskCount = 0,
  feedbackCount = 0,
}: WorkItemDetailProviderProps) {
  // Track if component has mounted (to avoid hydration mismatch with localStorage)
  const [hasMounted, setHasMounted] = useState(false)

  // Work item state (for optimistic updates)
  const [workItem, setWorkItem] = useState<WorkItemData>(initialWorkItem)
  const [timelineItems] = useState<TimelineItemData[]>(initialTimelineItems)

  // Calculate phase based on work item state
  const phase = useMemo<WorkspacePhase>(() => {
    // Check if work item has timeline breakdown
    const hasTimelineBreakdown = initialTimelineItems.length > 0

    return calculateWorkItemPhase({
      status: workItem.status,
      has_timeline_breakdown: hasTimelineBreakdown,
      assigned_to: workItem.assigned_to,
    })
  }, [workItem.status, workItem.assigned_to, initialTimelineItems.length])

  // Visible tabs based on phase
  const visibleTabs = useMemo(() => getVisibleTabs(phase, workItem.type), [phase, workItem.type])

  // Preferences state (persisted to localStorage)
  const [preferences, setPreferencesState] = useState<DetailPreferences>(defaultPreferences)

  // Active tab state
  const [activeTab, setActiveTabState] = useState<DetailTab>(() => {
    // Ensure default tab is visible in current phase
    if (isTabVisible(defaultTab, phase)) {
      return defaultTab
    }
    return getDefaultTab()
  })

  // Load preferences from localStorage AFTER mount (client-only)
  useEffect(() => {
    setHasMounted(true)
    try {
      const stored = localStorage.getItem(getStorageKey(initialWorkItem.id))
      if (stored) {
        const parsed = JSON.parse(stored) as Partial<DetailPreferences>
        setPreferencesState({ ...defaultPreferences, ...parsed })
      }
    } catch {
      // Ignore localStorage errors
    }
  }, [initialWorkItem.id])

  // Persist preferences to localStorage
  useEffect(() => {
    if (!hasMounted) return
    try {
      localStorage.setItem(
        getStorageKey(initialWorkItem.id),
        JSON.stringify(preferences)
      )
    } catch {
      // Ignore localStorage errors
    }
  }, [preferences, initialWorkItem.id, hasMounted])

  // Tab setter with visibility validation
  const setActiveTab = useCallback(
    (tab: DetailTab) => {
      if (isTabVisible(tab, phase)) {
        setActiveTabState(tab)
      }
    },
    [phase]
  )

  // Check if specific tab is visible
  const checkTabVisible = useCallback(
    (tabId: DetailTab) => isTabVisible(tabId, phase),
    [phase]
  )

  // Preferences setter
  const setPreferences = useCallback((newPrefs: Partial<DetailPreferences>) => {
    setPreferencesState((prev) => ({ ...prev, ...newPrefs }))
  }, [])

  // Toggle sidebar
  const toggleSidebar = useCallback(() => {
    setPreferencesState((prev) => ({
      ...prev,
      sidebarCollapsed: !prev.sidebarCollapsed,
    }))
  }, [])

  // Calculate counts for badges
  const counts = useMemo(() => {
    const mvpItems = timelineItems.filter((item) => item.timeline === 'MVP')
    const shortItems = timelineItems.filter((item) => item.timeline === 'SHORT')
    const longItems = timelineItems.filter((item) => item.timeline === 'LONG')

    return {
      timelineItems: timelineItems.length,
      mvpItems: mvpItems.length,
      shortItems: shortItems.length,
      longItems: longItems.length,
      tasks: taskCount,
      feedback: feedbackCount,
    }
  }, [timelineItems, taskCount, feedbackCount])

  // Update work item (optimistic)
  const updateWorkItem = useCallback((updates: Partial<WorkItemData>) => {
    setWorkItem((prev) => ({ ...prev, ...updates }))
  }, [])

  // Build context value
  const value = useMemo<WorkItemDetailContextValue>(
    () => ({
      workItem,
      timelineItems,
      phase,
      activeTab,
      setActiveTab,
      visibleTabs,
      isTabVisible: checkTabVisible,
      preferences,
      setPreferences,
      toggleSidebar,
      counts,
      updateWorkItem,
    }),
    [
      workItem,
      timelineItems,
      phase,
      activeTab,
      setActiveTab,
      visibleTabs,
      checkTabVisible,
      preferences,
      setPreferences,
      toggleSidebar,
      counts,
      updateWorkItem,
    ]
  )

  return (
    <WorkItemDetailContext.Provider value={value}>
      {children}
    </WorkItemDetailContext.Provider>
  )
}

// ============================================================================
// Re-export types for convenience
// ============================================================================

export type { DetailTab, TabConfig } from './tab-visibility'
export { TAB_CONFIG, getVisibleTabs, getDefaultTab } from './tab-visibility'
