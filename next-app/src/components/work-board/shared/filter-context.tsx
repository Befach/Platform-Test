'use client'

import { createContext, useContext, useState, useCallback, useMemo, ReactNode, useEffect } from 'react'

// Types
export type PrimaryTab = 'tasks' | 'work-items'
export type ViewMode = 'table' | 'board' | 'timeline'

// Work Item statuses
export type WorkItemStatus = 'planned' | 'in_progress' | 'completed' | 'on_hold'
export const WORK_ITEM_STATUSES: WorkItemStatus[] = ['planned', 'in_progress', 'completed', 'on_hold']

// Task statuses
export type TaskStatus = 'todo' | 'in_progress' | 'done'
export const TASK_STATUSES: TaskStatus[] = ['todo', 'in_progress', 'done']

// Work Item types (enhancement is now a flag on features)
export type WorkItemType = 'feature' | 'bug' | 'concept' | 'note'
export const WORK_ITEM_TYPES: WorkItemType[] = ['feature', 'bug', 'concept', 'note']

// Task types
export type TaskType = 'research' | 'design' | 'development' | 'qa' | 'marketing' | 'ops' | 'admin'
export const TASK_TYPES: TaskType[] = ['research', 'design', 'development', 'qa', 'marketing', 'ops', 'admin']

// Priority levels
export type Priority = 'critical' | 'high' | 'medium' | 'low'
export const PRIORITIES: Priority[] = ['critical', 'high', 'medium', 'low']

// Timeline types
export type TimelineType = 'MVP' | 'SHORT' | 'LONG'
export const TIMELINE_TYPES: TimelineType[] = ['MVP', 'SHORT', 'LONG']

// Filter state interface
export interface FilterState {
  search: string
  status: string | null
  type: string | null
  priority: string | null
  assignee: string | null
  timeline: TimelineType | null
  standalone: boolean | null // For tasks: filter standalone vs linked
  workItemId: string | null // For cross-view navigation: filter tasks by work item
}

// Navigation state for cross-view highlighting
export interface NavigationState {
  highlightWorkItemId: string | null
  highlightTaskId: string | null
}

// Work Board preferences (persisted to localStorage)
export interface WorkBoardPreferences {
  primaryTab: PrimaryTab
  viewMode: ViewMode
  columnVisibility: Record<string, boolean>
  sortColumn: string | null
  sortDirection: 'asc' | 'desc'
}

const defaultFilters: FilterState = {
  search: '',
  status: null,
  type: null,
  priority: null,
  assignee: null,
  timeline: null,
  standalone: null,
  workItemId: null,
}

const defaultNavigationState: NavigationState = {
  highlightWorkItemId: null,
  highlightTaskId: null,
}

const defaultPreferences: WorkBoardPreferences = {
  primaryTab: 'work-items',
  viewMode: 'table',
  columnVisibility: {
    // Work Item Level (merged/rowspan) - LEFT side
    owner: true,
    priority: true,
    tags: true,
    // Timeline Item Level (per-row) - RIGHT side
    timeline: true,
    status: true,
    notes: true,
    links: true,
  },
  sortColumn: null,
  sortDirection: 'asc',
}

// Context value interface
interface WorkBoardContextValue {
  // Current tab and view
  primaryTab: PrimaryTab
  viewMode: ViewMode
  setPrimaryTab: (tab: PrimaryTab) => void
  setViewMode: (mode: ViewMode) => void

  // Filters
  filters: FilterState
  setFilters: (filters: Partial<FilterState>) => void
  clearFilters: () => void
  hasActiveFilters: boolean

  // Preferences
  preferences: WorkBoardPreferences
  setPreferences: (prefs: Partial<WorkBoardPreferences>) => void

  // Column visibility
  toggleColumnVisibility: (column: string) => void
  isColumnVisible: (column: string) => boolean

  // Sort
  setSorting: (column: string | null, direction?: 'asc' | 'desc') => void

  // Helper to get status/type options based on current tab
  statusOptions: readonly string[]
  typeOptions: readonly string[]

  // Cross-view navigation
  navigationState: NavigationState
  navigateToWorkItem: (workItemId: string) => void
  navigateToTasksForWorkItem: (workItemId: string, workItemName?: string) => void
  clearNavigation: () => void
}

const WorkBoardContext = createContext<WorkBoardContextValue | null>(null)

// Hook to use the context
export function useWorkBoardContext() {
  const context = useContext(WorkBoardContext)
  if (!context) {
    throw new Error('useWorkBoardContext must be used within a WorkBoardProvider')
  }
  return context
}

// Provider props
interface WorkBoardProviderProps {
  workspaceId: string
  children: ReactNode
  defaultTab?: PrimaryTab
  defaultView?: ViewMode
}

// Local storage key
const getStorageKey = (workspaceId: string) => `work-board-preferences-${workspaceId}`

export function WorkBoardProvider({
  workspaceId,
  children,
  defaultTab = 'work-items',
  defaultView = 'table',
}: WorkBoardProviderProps) {
  // Track if component has mounted (to avoid hydration mismatch)
  const [hasMounted, setHasMounted] = useState(false)

  // Initialize with defaults to avoid hydration mismatch
  const [preferences, setPreferencesState] = useState<WorkBoardPreferences>({
    ...defaultPreferences,
    primaryTab: defaultTab,
    viewMode: defaultView,
  })

  const [filters, setFiltersState] = useState<FilterState>(defaultFilters)
  const [navigationState, setNavigationState] = useState<NavigationState>(defaultNavigationState)

  // Load preferences from localStorage AFTER mount (client-only)
  useEffect(() => {
    setHasMounted(true)
    try {
      const stored = localStorage.getItem(getStorageKey(workspaceId))
      if (stored) {
        const parsed = JSON.parse(stored)
        setPreferencesState({ ...defaultPreferences, ...parsed })
      }
    } catch {
      // Ignore localStorage errors
    }
  }, [workspaceId])

  // Persist preferences to localStorage (skip initial mount to avoid unnecessary writes)
  useEffect(() => {
    if (!hasMounted) return
    try {
      localStorage.setItem(getStorageKey(workspaceId), JSON.stringify(preferences))
    } catch {
      // Ignore localStorage errors
    }
  }, [preferences, workspaceId, hasMounted])

  // Tab and view setters
  const setPrimaryTab = useCallback((tab: PrimaryTab) => {
    setPreferencesState(prev => ({ ...prev, primaryTab: tab }))
    // Clear filters when switching tabs since status/type options differ
    setFiltersState(defaultFilters)
  }, [])

  const setViewMode = useCallback((mode: ViewMode) => {
    setPreferencesState(prev => ({ ...prev, viewMode: mode }))
  }, [])

  // Filter setters
  const setFilters = useCallback((newFilters: Partial<FilterState>) => {
    setFiltersState(prev => ({ ...prev, ...newFilters }))
  }, [])

  const clearFilters = useCallback(() => {
    setFiltersState(defaultFilters)
  }, [])

  // Check if any filters are active
  const hasActiveFilters = useMemo(() => {
    return (
      filters.search.length > 0 ||
      filters.status !== null ||
      filters.type !== null ||
      filters.priority !== null ||
      filters.assignee !== null ||
      filters.timeline !== null ||
      filters.standalone !== null ||
      filters.workItemId !== null
    )
  }, [filters])

  // Preference setters
  const setPreferences = useCallback((newPrefs: Partial<WorkBoardPreferences>) => {
    setPreferencesState(prev => ({ ...prev, ...newPrefs }))
  }, [])

  // Column visibility
  const toggleColumnVisibility = useCallback((column: string) => {
    setPreferencesState(prev => ({
      ...prev,
      columnVisibility: {
        ...prev.columnVisibility,
        [column]: !prev.columnVisibility[column],
      },
    }))
  }, [])

  const isColumnVisible = useCallback(
    (column: string) => {
      return preferences.columnVisibility[column] ?? true
    },
    [preferences.columnVisibility]
  )

  // Sorting
  const setSorting = useCallback((column: string | null, direction?: 'asc' | 'desc') => {
    setPreferencesState(prev => ({
      ...prev,
      sortColumn: column,
      sortDirection: direction ?? (prev.sortColumn === column && prev.sortDirection === 'asc' ? 'desc' : 'asc'),
    }))
  }, [])

  // Get status/type options based on current tab
  const statusOptions = useMemo(() => {
    return preferences.primaryTab === 'tasks' ? TASK_STATUSES : WORK_ITEM_STATUSES
  }, [preferences.primaryTab])

  const typeOptions = useMemo(() => {
    return preferences.primaryTab === 'tasks' ? TASK_TYPES : WORK_ITEM_TYPES
  }, [preferences.primaryTab])

  // Cross-view navigation functions
  const navigateToWorkItem = useCallback((workItemId: string) => {
    // Switch to Work Items tab and highlight the target work item
    setPreferencesState(prev => ({ ...prev, primaryTab: 'work-items' }))
    setFiltersState(defaultFilters) // Clear any filters to ensure item is visible
    setNavigationState({ highlightWorkItemId: workItemId, highlightTaskId: null })
    // Auto-clear highlight after animation completes (3 seconds)
    setTimeout(() => {
      setNavigationState(prev => ({ ...prev, highlightWorkItemId: null }))
    }, 3000)
  }, [])

  const navigateToTasksForWorkItem = useCallback((workItemId: string, workItemName?: string) => {
    // Switch to Tasks tab with workItemId filter active
    setPreferencesState(prev => ({ ...prev, primaryTab: 'tasks' }))
    setFiltersState({ ...defaultFilters, workItemId })
    setNavigationState(defaultNavigationState)
  }, [])

  const clearNavigation = useCallback(() => {
    setNavigationState(defaultNavigationState)
    setFiltersState(prev => ({ ...prev, workItemId: null }))
  }, [])

  const value = useMemo<WorkBoardContextValue>(
    () => ({
      primaryTab: preferences.primaryTab,
      viewMode: preferences.viewMode,
      setPrimaryTab,
      setViewMode,
      filters,
      setFilters,
      clearFilters,
      hasActiveFilters,
      preferences,
      setPreferences,
      toggleColumnVisibility,
      isColumnVisible,
      setSorting,
      statusOptions,
      typeOptions,
      // Cross-view navigation
      navigationState,
      navigateToWorkItem,
      navigateToTasksForWorkItem,
      clearNavigation,
    }),
    [
      preferences,
      filters,
      hasActiveFilters,
      setPrimaryTab,
      setViewMode,
      setFilters,
      clearFilters,
      setPreferences,
      toggleColumnVisibility,
      isColumnVisible,
      setSorting,
      statusOptions,
      typeOptions,
      navigationState,
      navigateToWorkItem,
      navigateToTasksForWorkItem,
      clearNavigation,
    ]
  )

  return <WorkBoardContext.Provider value={value}>{children}</WorkBoardContext.Provider>
}

// Export display helpers for status/type/priority badges
export const statusDisplayMap: Record<string, { label: string; color: string }> = {
  // Work Item statuses
  not_started: { label: 'Not Started', color: 'bg-gray-100 text-gray-700' },
  planned: { label: 'Planned', color: 'bg-slate-100 text-slate-700' },
  in_progress: { label: 'In Progress', color: 'bg-blue-100 text-blue-700' },
  completed: { label: 'Completed', color: 'bg-green-100 text-green-700' },
  on_hold: { label: 'On Hold', color: 'bg-orange-100 text-orange-700' },
  // Task statuses
  todo: { label: 'To Do', color: 'bg-slate-100 text-slate-700' },
  done: { label: 'Done', color: 'bg-green-100 text-green-700' },
}

export const typeDisplayMap: Record<string, { label: string; icon: string; color: string }> = {
  // Work Item types
  feature: { label: 'Feature', icon: 'Sparkles', color: 'bg-purple-100 text-purple-700' },
  bug: { label: 'Bug', icon: 'Bug', color: 'bg-red-100 text-red-700' },
  concept: { label: 'Concept', icon: 'Lightbulb', color: 'bg-yellow-100 text-yellow-700' },
  note: { label: 'Note', icon: 'StickyNote', color: 'bg-gray-100 text-gray-700' },
  // Task types
  research: { label: 'Research', icon: 'Search', color: 'bg-indigo-100 text-indigo-700' },
  design: { label: 'Design', icon: 'Palette', color: 'bg-pink-100 text-pink-700' },
  development: { label: 'Development', icon: 'Code', color: 'bg-emerald-100 text-emerald-700' },
  qa: { label: 'QA', icon: 'TestTube', color: 'bg-cyan-100 text-cyan-700' },
  marketing: { label: 'Marketing', icon: 'Megaphone', color: 'bg-orange-100 text-orange-700' },
  ops: { label: 'Ops', icon: 'Settings', color: 'bg-gray-100 text-gray-700' },
  admin: { label: 'Admin', icon: 'Shield', color: 'bg-slate-100 text-slate-700' },
}

export const priorityDisplayMap: Record<string, { label: string; color: string; icon: string }> = {
  critical: { label: 'Critical', color: 'bg-red-100 text-red-700', icon: 'AlertTriangle' },
  high: { label: 'High', color: 'bg-orange-100 text-orange-700', icon: 'ArrowUp' },
  medium: { label: 'Medium', color: 'bg-yellow-100 text-yellow-700', icon: 'Minus' },
  low: { label: 'Low', color: 'bg-green-100 text-green-700', icon: 'ArrowDown' },
}

export const timelineDisplayMap: Record<TimelineType, { label: string; color: string }> = {
  MVP: { label: 'MVP', color: 'bg-purple-100 text-purple-700' },
  SHORT: { label: 'Short Term', color: 'bg-blue-100 text-blue-700' },
  LONG: { label: 'Long Term', color: 'bg-teal-100 text-teal-700' },
}
