/**
 * Feature Table Utility Functions
 *
 * Reusable utility functions for working with work items and timeline data.
 * All functions are pure and well-documented for AI assistance.
 *
 * @module features/utils
 */

import type { WorkItem, TimelineItem, FilterState } from '@/lib/types/work-items'
import type { LinkedItem } from './types'

/**
 * Filter work items based on filter state
 *
 * @param items - Array of work items to filter
 * @param filters - Filter configuration
 * @returns Filtered array of work items
 *
 * @example
 * const filtered = filterWorkItems(allItems, {
 *   search: 'login',
 *   status: 'in_progress',
 *   priority: 'all'
 * })
 */
export function filterWorkItems(
  items: WorkItem[],
  filters: FilterState
): WorkItem[] {
  return items.filter((item) => {
    // Search filter - matches name, purpose, or tags
    if (filters.search) {
      const searchLower = filters.search.toLowerCase()
      const matchesName = item.name.toLowerCase().includes(searchLower)
      const matchesPurpose = item.purpose?.toLowerCase().includes(searchLower)
      const matchesTags = item.tags?.some((tag) =>
        tag.toLowerCase().includes(searchLower)
      )

      if (!matchesName && !matchesPurpose && !matchesTags) {
        return false
      }
    }

    // Phase filter
    if (filters.phase !== 'all' && item.phase !== filters.phase) {
      return false
    }

    // Priority filter
    if (filters.priority !== 'all' && item.priority !== filters.priority) {
      return false
    }

    return true
  })
}

/**
 * Get timeline items for a specific work item
 *
 * @param workItemId - Work item ID to get timelines for
 * @param timelineItems - All timeline items
 * @returns Array of timeline items for the work item
 *
 * @example
 * const timelines = getTimelinesForWorkItem('work_123', allTimelineItems)
 * console.log(timelines) // [{ timeline: 'MVP', ... }, { timeline: 'SHORT', ... }]
 */
export function getTimelinesForWorkItem(
  workItemId: string,
  timelineItems: TimelineItem[]
): TimelineItem[] {
  return timelineItems.filter((t) => t.work_item_id === workItemId)
}

/**
 * Calculate linked work items count from timeline links
 *
 * This function:
 * 1. Finds all timeline items for the work item
 * 2. Finds all linked timeline items
 * 3. Maps back to unique work items
 * 4. Returns the count of unique linked work items
 *
 * @param workItemId - Work item ID to calculate links for
 * @param timelineItems - All timeline items
 * @param linkedItems - All linked items
 * @returns Count of unique linked work items
 *
 * @example
 * const count = calculateLinkedItemsCount('work_123', allTimelines, allLinks)
 * console.log(count) // 3 (means this work item is linked to 3 other work items)
 */
export function calculateLinkedItemsCount(
  workItemId: string,
  timelineItems: TimelineItem[],
  linkedItems: LinkedItem[]
): number {
  // Get all timeline items for this work item
  const workItemTimelines = timelineItems.filter(
    (t) => t.work_item_id === workItemId
  )
  const timelineIds = new Set(workItemTimelines.map((t) => t.id))

  // Find all linked timeline items
  const linkedWorkItems = new Set<string>()

  linkedItems.forEach((link) => {
    const isSource = timelineIds.has(link.source_item_id)
    const isTarget = timelineIds.has(link.target_item_id)

    if (isSource) {
      // Find the work item ID for the target timeline
      const targetTimeline = timelineItems.find(
        (t) => t.id === link.target_item_id
      )
      if (targetTimeline) {
        linkedWorkItems.add(targetTimeline.work_item_id)
      }
    }

    if (isTarget) {
      // Find the work item ID for the source timeline
      const sourceTimeline = timelineItems.find(
        (t) => t.id === link.source_item_id
      )
      if (sourceTimeline) {
        linkedWorkItems.add(sourceTimeline.work_item_id)
      }
    }
  })

  return linkedWorkItems.size
}

/**
 * Sort work items by a field
 *
 * @param items - Array of work items to sort
 * @param field - Field to sort by
 * @param direction - Sort direction ('asc' or 'desc')
 * @returns Sorted array (does not mutate original)
 *
 * @example
 * const sorted = sortWorkItems(items, 'priority', 'desc')
 * // Returns items sorted by priority (critical, high, medium, low)
 */
export function sortWorkItems<K extends keyof WorkItem>(
  items: WorkItem[],
  field: K,
  direction: 'asc' | 'desc' = 'asc'
): WorkItem[] {
  return [...items].sort((a, b) => {
    const aVal = a[field]
    const bVal = b[field]

    // Handle null/undefined
    if (aVal == null && bVal == null) return 0
    if (aVal == null) return direction === 'asc' ? 1 : -1
    if (bVal == null) return direction === 'asc' ? -1 : 1

    // Compare values
    if (aVal < bVal) return direction === 'asc' ? -1 : 1
    if (aVal > bVal) return direction === 'asc' ? 1 : -1
    return 0
  })
}

/**
 * Group work items by a field
 *
 * @param items - Array of work items to group
 * @param field - Field to group by
 * @returns Map of field values to work items
 *
 * @example
 * const grouped = groupWorkItems(items, 'status')
 * console.log(grouped.get('in_progress')) // All in-progress items
 */
export function groupWorkItems<K extends keyof WorkItem>(
  items: WorkItem[],
  field: K
): Map<WorkItem[K], WorkItem[]> {
  const groups = new Map<WorkItem[K], WorkItem[]>()

  items.forEach((item) => {
    const key = item[field]
    if (!groups.has(key)) {
      groups.set(key, [])
    }
    groups.get(key)!.push(item)
  })

  return groups
}

/**
 * Calculate statistics for work items
 *
 * @param items - Array of work items
 * @returns Statistics object
 *
 * @example
 * const stats = calculateWorkItemStats(items)
 * console.log(stats.byStatus.in_progress) // 5
 * console.log(stats.byPriority.high) // 3
 */
export function calculateWorkItemStats(items: WorkItem[]) {
  const stats = {
    total: items.length,
    byPhase: {} as Record<string, number>,
    byPriority: {} as Record<string, number>,
    byType: {} as Record<string, number>,
    withLinks: 0, // Would need to query linked_items table separately
    withoutLinks: items.length,
    withTags: items.filter((i) => i.tags && i.tags.length > 0).length,
    withoutTags: items.filter((i) => !i.tags || i.tags.length === 0).length,
  }

  items.forEach((item) => {
    // Count by phase
    if (item.phase) {
      stats.byPhase[item.phase] = (stats.byPhase[item.phase] || 0) + 1
    }

    // Count by priority
    if (item.priority) {
      stats.byPriority[item.priority] = (stats.byPriority[item.priority] || 0) + 1
    }

    // Count by type
    if (item.type) {
      stats.byType[item.type] = (stats.byType[item.type] || 0) + 1
    }
  })

  return stats
}

/**
 * Generate a unique text-based ID (timestamp + random)
 *
 * This matches the database ID generation strategy.
 * Use this when creating new work items or timeline items client-side.
 *
 * @returns Unique text ID
 *
 * @example
 * const newItem = {
 *   id: generateTextId(),
 *   name: 'New Feature',
 *   ...
 * }
 */
export function generateTextId(): string {
  return `${Date.now()}${Math.floor(Math.random() * 1000000)}`
}

/**
 * Format a date string for display
 *
 * @param dateString - ISO 8601 date string
 * @param format - Format type
 * @returns Formatted date string
 *
 * @example
 * formatDate('2025-01-13T10:30:00Z', 'short') // "Jan 13, 2025"
 * formatDate('2025-01-13T10:30:00Z', 'relative') // "2 days ago"
 */
export function formatDate(
  dateString: string,
  format: 'short' | 'long' | 'relative' = 'short'
): string {
  const date = new Date(dateString)

  if (format === 'short') {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  if (format === 'long') {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    })
  }

  if (format === 'relative') {
    const now = Date.now()
    const diff = now - date.getTime()
    const seconds = Math.floor(diff / 1000)
    const minutes = Math.floor(seconds / 60)
    const hours = Math.floor(minutes / 60)
    const days = Math.floor(hours / 24)

    if (seconds < 60) return 'just now'
    if (minutes < 60) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`
    if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`
    if (days < 30) return `${days} day${days > 1 ? 's' : ''} ago`
    return formatDate(dateString, 'short')
  }

  return date.toLocaleDateString()
}

/**
 * Validate a work item object
 *
 * @param item - Work item to validate
 * @returns Validation result with errors (if any)
 *
 * @example
 * const result = validateWorkItem(item)
 * if (!result.isValid) {
 *   console.error('Validation errors:', result.errors)
 * }
 */
export function validateWorkItem(item: Partial<WorkItem>): {
  isValid: boolean
  errors: string[]
} {
  const errors: string[] = []

  if (!item.name || item.name.trim().length === 0) {
    errors.push('Name is required')
  }

  if (!item.type || item.type.trim().length === 0) {
    errors.push('Type is required')
  }

  if (!item.phase || item.phase.trim().length === 0) {
    errors.push('Phase is required')
  }

  if (!item.priority || item.priority.trim().length === 0) {
    errors.push('Priority is required')
  }

  if (item.name && item.name.length > 200) {
    errors.push('Name must be 200 characters or less')
  }

  if (item.purpose && item.purpose.length > 1000) {
    errors.push('Purpose must be 1000 characters or less')
  }

  return {
    isValid: errors.length === 0,
    errors,
  }
}

/**
 * Deep clone a work item (for immutable updates)
 *
 * @param item - Work item to clone
 * @returns Cloned work item
 *
 * @example
 * const original = { id: '123', name: 'Original', ... }
 * const copy = cloneWorkItem(original)
 * copy.name = 'Modified' // Does not affect original
 */
export function cloneWorkItem(item: WorkItem): WorkItem {
  return {
    ...item,
    tags: item.tags ? [...item.tags] : null,
  }
}

/**
 * Merge work item updates (immutable)
 *
 * @param item - Original work item
 * @param updates - Fields to update
 * @returns New work item with updates applied
 *
 * @example
 * const updated = mergeWorkItem(item, { status: 'completed', priority: 'high' })
 */
export function mergeWorkItem(
  item: WorkItem,
  updates: Partial<WorkItem>
): WorkItem {
  return {
    ...cloneWorkItem(item),
    ...updates,
    updated_at: new Date().toISOString(),
  }
}

/**
 * Export work items to CSV format
 *
 * @param items - Work items to export
 * @returns CSV string
 *
 * @example
 * const csv = exportToCSV(items)
 * const blob = new Blob([csv], { type: 'text/csv' })
 * const url = URL.createObjectURL(blob)
 * // Create download link with url
 */
export function exportToCSV(items: WorkItem[]): string {
  const headers = [
    'ID',
    'Name',
    'Type',
    'Phase',
    'Priority',
    'Purpose',
    'Tags',
    'Linked Items',
    'Created At',
  ]

  const rows = items.map((item) => [
    item.id,
    item.name,
    item.type,
    item.phase || '',
    item.priority,
    item.purpose || '',
    item.tags?.join('; ') || '',
    '-', // linkedItemsCount requires separate query to linked_items table
    item.created_at ? formatDate(item.created_at, 'short') : '',
  ])

  const csvLines = [
    headers.join(','),
    ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
  ]

  return csvLines.join('\n')
}
