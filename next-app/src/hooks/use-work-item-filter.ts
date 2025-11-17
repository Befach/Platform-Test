'use client'

import { useState, useMemo } from 'react'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import {
  getItemLabel,
  type WorkItemType,
  type WorkspacePhase,
} from '@/lib/constants/work-item-types'

interface Feature {
  id: string
  type: string
  [key: string]: any
}

interface UseWorkItemFilterResult {
  selectedType: string | 'all'
  showAllTypes: boolean
  filteredItems: Feature[]
  setSelectedType: (type: string | 'all') => void
  setShowAllTypes: (show: boolean) => void
  getButtonLabel: () => string
  getPageTitle: () => string
  getEmptyStateText: () => string
  itemCount: number
}

/**
 * Hook for managing work item type filtering with URL sync
 * @param items - Array of work items to filter
 * @param phase - Current workspace phase
 * @returns Filtering state and helper functions
 */
export function useWorkItemFilter(
  items: Feature[],
  phase: WorkspacePhase
): UseWorkItemFilterResult {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()

  // Get initial filter from URL or default to 'all'
  const [selectedType, setSelectedTypeState] = useState<string | 'all'>(
    searchParams.get('type') || 'all'
  )
  const [showAllTypes, setShowAllTypesState] = useState<boolean>(
    searchParams.get('showAll') === 'true'
  )

  // Sync filter to URL
  const setSelectedType = (type: string | 'all') => {
    setSelectedTypeState(type)

    const params = new URLSearchParams(searchParams)
    if (type === 'all') {
      params.delete('type')
    } else {
      params.set('type', type)
    }

    const queryString = params.toString()
    const url = queryString ? `${pathname}?${queryString}` : pathname

    // Use replace to avoid polluting history
    router.replace(url, { scroll: false })
  }

  const setShowAllTypes = (show: boolean) => {
    setShowAllTypesState(show)

    const params = new URLSearchParams(searchParams)
    if (show) {
      params.set('showAll', 'true')
    } else {
      params.delete('showAll')
    }

    const queryString = params.toString()
    const url = queryString ? `${pathname}?${queryString}` : pathname

    router.replace(url, { scroll: false })
  }

  // Filter items based on selected type
  const filteredItems = useMemo(() => {
    if (selectedType === 'all') {
      return items
    }

    return items.filter((item) => item.type === selectedType)
  }, [items, selectedType])

  // Dynamic label helpers
  const getButtonLabel = (): string => {
    if (selectedType === 'all') {
      return 'New Work Item'
    }

    return `New ${getItemLabel(selectedType)}`
  }

  const getPageTitle = (): string => {
    if (selectedType === 'all') {
      return 'Work Items'
    }

    return getItemLabel(selectedType, true)
  }

  const getEmptyStateText = (): string => {
    if (selectedType === 'all') {
      return 'No work items yet'
    }

    const label = getItemLabel(selectedType, true).toLowerCase()
    return `No ${label} yet`
  }

  return {
    selectedType,
    showAllTypes,
    filteredItems,
    setSelectedType,
    setShowAllTypes,
    getButtonLabel,
    getPageTitle,
    getEmptyStateText,
    itemCount: filteredItems.length,
  }
}
