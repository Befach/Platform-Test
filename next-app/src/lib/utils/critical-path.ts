/**
 * Critical Path Analysis for Timeline
 * Calculates the critical path through work items based on dependencies
 */

interface WorkItem {
  id: string
  name: string
  start_date?: string
  end_date?: string
  duration_days?: number
  dependencies: Array<{ targetId: string; type: string }>
}

interface CriticalPathNode {
  id: string
  earliestStart: number
  earliestFinish: number
  latestStart: number
  latestFinish: number
  slack: number
  isCritical: boolean
}

/**
 * Calculate critical path using CPM (Critical Path Method)
 * Returns a map of item IDs to their critical path analysis
 */
export function calculateCriticalPath(
  workItems: WorkItem[]
): Map<string, CriticalPathNode> {
  const nodes = new Map<string, CriticalPathNode>()

  // Filter to items with dates
  const itemsWithDates = workItems.filter(
    (item) => item.start_date && item.end_date && item.duration_days
  )

  if (itemsWithDates.length === 0) {
    return nodes
  }

  // Initialize nodes with default values
  itemsWithDates.forEach((item) => {
    nodes.set(item.id, {
      id: item.id,
      earliestStart: 0,
      earliestFinish: item.duration_days || 0,
      latestStart: Infinity,
      latestFinish: Infinity,
      slack: 0,
      isCritical: false,
    })
  })

  // Build dependency map (predecessors)
  const predecessors = new Map<string, string[]>()
  const successors = new Map<string, string[]>()

  itemsWithDates.forEach((item) => {
    if (!predecessors.has(item.id)) {
      predecessors.set(item.id, [])
    }
    if (!successors.has(item.id)) {
      successors.set(item.id, [])
    }

    item.dependencies.forEach((dep) => {
      // Only consider "blocks" and "requires" relationships
      if (dep.type === 'blocks' || dep.type === 'requires') {
        const targetItem = itemsWithDates.find((i) => i.id === dep.targetId)
        if (targetItem) {
          // item depends on dep.targetId
          if (!predecessors.has(item.id)) {
            predecessors.set(item.id, [])
          }
          predecessors.get(item.id)!.push(dep.targetId)

          // dep.targetId is a predecessor of item
          if (!successors.has(dep.targetId)) {
            successors.set(dep.targetId, [])
          }
          successors.get(dep.targetId)!.push(item.id)
        }
      }
    })
  })

  // Forward pass: Calculate earliest start and finish times
  const visited = new Set<string>()
  const calculateEarliestTimes = (itemId: string) => {
    if (visited.has(itemId)) return

    const node = nodes.get(itemId)
    if (!node) return

    const preds = predecessors.get(itemId) || []

    // First, process all predecessors
    preds.forEach((predId) => {
      if (!visited.has(predId)) {
        calculateEarliestTimes(predId)
      }
    })

    // Earliest start is the maximum of all predecessor finish times
    if (preds.length > 0) {
      node.earliestStart = Math.max(
        ...preds.map((predId) => {
          const predNode = nodes.get(predId)
          return predNode ? predNode.earliestFinish : 0
        })
      )
    }

    const item = itemsWithDates.find((i) => i.id === itemId)
    node.earliestFinish = node.earliestStart + (item?.duration_days || 0)

    visited.add(itemId)
  }

  // Process all nodes
  itemsWithDates.forEach((item) => {
    calculateEarliestTimes(item.id)
  })

  // Find project end time (max earliest finish)
  const projectEndTime = Math.max(
    ...Array.from(nodes.values()).map((node) => node.earliestFinish)
  )

  // Backward pass: Calculate latest start and finish times
  const visitedBackward = new Set<string>()
  const calculateLatestTimes = (itemId: string) => {
    if (visitedBackward.has(itemId)) return

    const node = nodes.get(itemId)
    if (!node) return

    const succs = successors.get(itemId) || []

    // First, process all successors
    succs.forEach((succId) => {
      if (!visitedBackward.has(succId)) {
        calculateLatestTimes(succId)
      }
    })

    // If no successors, latest finish is project end time
    if (succs.length === 0) {
      node.latestFinish = projectEndTime
    } else {
      // Latest finish is the minimum of all successor start times
      node.latestFinish = Math.min(
        ...succs.map((succId) => {
          const succNode = nodes.get(succId)
          return succNode ? succNode.latestStart : projectEndTime
        })
      )
    }

    const item = itemsWithDates.find((i) => i.id === itemId)
    node.latestStart = node.latestFinish - (item?.duration_days || 0)

    visitedBackward.add(itemId)
  }

  // Process all nodes backward
  itemsWithDates.forEach((item) => {
    calculateLatestTimes(item.id)
  })

  // Calculate slack and identify critical path
  nodes.forEach((node) => {
    node.slack = node.latestStart - node.earliestStart
    // Critical path items have zero or near-zero slack
    node.isCritical = node.slack < 0.001 // Use small epsilon for floating point comparison
  })

  return nodes
}

/**
 * Get all items on the critical path
 */
export function getCriticalPathItems(workItems: WorkItem[]): string[] {
  const criticalPath = calculateCriticalPath(workItems)
  return Array.from(criticalPath.entries())
    .filter(([_, node]) => node.isCritical)
    .map(([id]) => id)
}

/**
 * Calculate total project duration (in days)
 */
export function getProjectDuration(workItems: WorkItem[]): number {
  const criticalPath = calculateCriticalPath(workItems)
  if (criticalPath.size === 0) return 0

  return Math.max(
    ...Array.from(criticalPath.values()).map((node) => node.earliestFinish)
  )
}
