import type { WorkItem } from '@/lib/types/work-items'
import type { WorkItemConnection } from '@/lib/types/dependencies'

export interface CriticalPathNode {
  workItemId: string
  workItem: WorkItem
  earliestStart: number // Days from project start
  latestStart: number // Latest time this can start without delaying project
  slack: number // latestStart - earliestStart (0 means on critical path)
  isOnCriticalPath: boolean
  dependencyCount: number // Number of dependencies this item has
  dependentCount: number // Number of items depending on this
  riskScore: number // 0-1, higher means more critical
}

export interface CriticalPathResult {
  nodes: CriticalPathNode[]
  criticalPath: string[] // Ordered list of work item IDs on critical path
  projectDuration: number // Total days
  bottlenecks: string[] // Work items with most dependencies
  healthScore: number // 0-100, overall project health
  hasCycles: boolean
  warnings: string[]
}

/**
 * Calculate critical path using topological sort and longest path algorithm
 */
export function calculateCriticalPath(
  workItems: WorkItem[],
  connections: WorkItemConnection[]
): CriticalPathResult {
  // Build adjacency lists
  const graph = new Map<string, string[]>() // workItemId -> [dependent workItemIds]
  const reverseGraph = new Map<string, string[]>() // workItemId -> [dependency workItemIds]
  const inDegree = new Map<string, number>()
  const outDegree = new Map<string, number>()

  // Initialize
  workItems.forEach((item) => {
    graph.set(item.id, [])
    reverseGraph.set(item.id, [])
    inDegree.set(item.id, 0)
    outDegree.set(item.id, 0)
  })

  // Build graph from connections (only active dependencies and blocks)
  connections
    .filter((conn) => conn.status === 'active' && ['dependency', 'blocks'].includes(conn.connection_type))
    .forEach((conn) => {
      // Source depends on target (target must finish before source starts)
      graph.get(conn.target_work_item_id)?.push(conn.source_work_item_id)
      reverseGraph.get(conn.source_work_item_id)?.push(conn.target_work_item_id)
      inDegree.set(conn.source_work_item_id, (inDegree.get(conn.source_work_item_id) || 0) + 1)
      outDegree.set(conn.target_work_item_id, (outDegree.get(conn.target_work_item_id) || 0) + 1)
    })

  // Detect cycles using DFS
  const visited = new Set<string>()
  const recursionStack = new Set<string>()
  let hasCycles = false

  function detectCycle(nodeId: string): boolean {
    visited.add(nodeId)
    recursionStack.add(nodeId)

    const neighbors = graph.get(nodeId) || []
    for (const neighbor of neighbors) {
      if (!visited.has(neighbor)) {
        if (detectCycle(neighbor)) return true
      } else if (recursionStack.has(neighbor)) {
        return true
      }
    }

    recursionStack.delete(nodeId)
    return false
  }

  for (const item of workItems) {
    if (!visited.has(item.id)) {
      if (detectCycle(item.id)) {
        hasCycles = true
        break
      }
    }
  }

  if (hasCycles) {
    return {
      nodes: [],
      criticalPath: [],
      projectDuration: 0,
      bottlenecks: [],
      healthScore: 0,
      hasCycles: true,
      warnings: ['Circular dependencies detected. Please resolve cycles before calculating critical path.'],
    }
  }

  // Topological sort using Kahn's algorithm
  const topologicalOrder: string[] = []
  const queue: string[] = []

  // Start with nodes that have no dependencies
  workItems.forEach((item) => {
    if (inDegree.get(item.id) === 0) {
      queue.push(item.id)
    }
  })

  const tempInDegree = new Map(inDegree)

  while (queue.length > 0) {
    const current = queue.shift()!
    topologicalOrder.push(current)

    const neighbors = graph.get(current) || []
    neighbors.forEach((neighbor) => {
      const degree = tempInDegree.get(neighbor)! - 1
      tempInDegree.set(neighbor, degree)
      if (degree === 0) {
        queue.push(neighbor)
      }
    })
  }

  // Calculate earliest start times (forward pass)
  const earliestStart = new Map<string, number>()
  const workItemMap = new Map(workItems.map((item) => [item.id, item]))

  topologicalOrder.forEach((itemId) => {
    const item = workItemMap.get(itemId)!
    const dependencies = reverseGraph.get(itemId) || []

    if (dependencies.length === 0) {
      earliestStart.set(itemId, 0)
    } else {
      const maxDepEnd = Math.max(
        ...dependencies.map((depId) => {
          const depEarliestStart = earliestStart.get(depId) || 0
          const depDuration = getWorkItemDuration(workItemMap.get(depId)!)
          return depEarliestStart + depDuration
        })
      )
      earliestStart.set(itemId, maxDepEnd)
    }
  })

  // Calculate project duration
  const projectDuration = Math.max(
    ...Array.from(earliestStart.entries()).map(([itemId, start]) => {
      const item = workItemMap.get(itemId)!
      return start + getWorkItemDuration(item)
    })
  )

  // Calculate latest start times (backward pass)
  const latestStart = new Map<string, number>()

  // Start from the end nodes
  topologicalOrder.reverse().forEach((itemId) => {
    const item = workItemMap.get(itemId)!
    const dependents = graph.get(itemId) || []

    if (dependents.length === 0) {
      const earliest = earliestStart.get(itemId)!
      const duration = getWorkItemDuration(item)
      latestStart.set(itemId, projectDuration - duration)
    } else {
      const minDependentStart = Math.min(
        ...dependents.map((depId) => latestStart.get(depId) || projectDuration)
      )
      latestStart.set(itemId, minDependentStart - getWorkItemDuration(item))
    }
  })

  // Calculate slack and identify critical path
  const nodes: CriticalPathNode[] = workItems.map((item) => {
    const earliest = earliestStart.get(item.id) || 0
    const latest = latestStart.get(item.id) || 0
    const slack = latest - earliest
    const dependencyCount = reverseGraph.get(item.id)?.length || 0
    const dependentCount = graph.get(item.id)?.length || 0

    // Calculate risk score (0-1)
    const slackFactor = Math.max(0, 1 - slack / 10) // Less slack = higher risk
    const complexityFactor = (dependencyCount + dependentCount) / 10 // More connections = higher risk
    const riskScore = Math.min(1, (slackFactor * 0.6 + complexityFactor * 0.4))

    return {
      workItemId: item.id,
      workItem: item,
      earliestStart: earliest,
      latestStart: latest,
      slack,
      isOnCriticalPath: slack === 0,
      dependencyCount,
      dependentCount,
      riskScore,
    }
  })

  // Extract critical path
  const criticalPath = nodes
    .filter((node) => node.isOnCriticalPath)
    .sort((a, b) => a.earliestStart - b.earliestStart)
    .map((node) => node.workItemId)

  // Identify bottlenecks (items with most connections)
  const bottlenecks = nodes
    .filter((node) => node.dependencyCount + node.dependentCount > 3)
    .sort((a, b) => (b.dependencyCount + b.dependentCount) - (a.dependencyCount + a.dependentCount))
    .slice(0, 5)
    .map((node) => node.workItemId)

  // Calculate health score
  const avgSlack = nodes.reduce((sum, node) => sum + node.slack, 0) / nodes.length
  const criticalPathRatio = criticalPath.length / nodes.length
  const bottleneckRatio = bottlenecks.length / nodes.length
  const healthScore = Math.round(
    Math.max(0, Math.min(100, 100 - criticalPathRatio * 30 - bottleneckRatio * 20 + avgSlack * 2))
  )

  // Generate warnings
  const warnings: string[] = []
  if (criticalPath.length > nodes.length * 0.5) {
    warnings.push('Over 50% of work items are on the critical path. Consider parallelizing tasks.')
  }
  if (bottlenecks.length > 5) {
    warnings.push(`${bottlenecks.length} bottleneck items detected. These items may delay the project.`)
  }
  if (avgSlack < 2) {
    warnings.push('Very low slack detected. Project timeline is tight with little room for delays.')
  }

  return {
    nodes,
    criticalPath,
    projectDuration,
    bottlenecks,
    healthScore,
    hasCycles: false,
    warnings,
  }
}

/**
 * Get estimated duration for a work item (in days)
 */
function getWorkItemDuration(item: WorkItem): number {
  // Estimate based on type and complexity
  // Default estimates (in days)
  const typeEstimates: Record<string, number> = {
    epic: 30,
    feature: 14,
    user_story: 5,
    task: 3,
    bug: 2,
  }

  const baseEstimate = typeEstimates[item.type] || 5

  // Adjust by priority
  const priorityMultiplier: Record<string, number> = {
    critical: 0.8, // Critical items often get more resources
    high: 1.0,
    medium: 1.2,
    low: 1.5,
  }

  return Math.round(baseEstimate * (priorityMultiplier[item.priority || 'medium'] || 1.0))
}

/**
 * Find the longest path in a DAG (for critical path analysis)
 */
export function findLongestPath(
  graph: Map<string, string[]>,
  workItemMap: Map<string, WorkItem>
): { path: string[]; duration: number } {
  const visited = new Set<string>()
  const memo = new Map<string, { path: string[]; duration: number }>()

  function dfs(nodeId: string): { path: string[]; duration: number } {
    if (memo.has(nodeId)) return memo.get(nodeId)!

    visited.add(nodeId)
    const neighbors = graph.get(nodeId) || []

    if (neighbors.length === 0) {
      const result = { path: [nodeId], duration: getWorkItemDuration(workItemMap.get(nodeId)!) }
      memo.set(nodeId, result)
      return result
    }

    let longestPath: string[] = []
    let maxDuration = 0

    neighbors.forEach((neighbor) => {
      if (!visited.has(neighbor)) {
        const { path, duration } = dfs(neighbor)
        if (duration > maxDuration) {
          longestPath = path
          maxDuration = duration
        }
      }
    })

    const currentDuration = getWorkItemDuration(workItemMap.get(nodeId)!)
    const result = {
      path: [nodeId, ...longestPath],
      duration: currentDuration + maxDuration,
    }
    memo.set(nodeId, result)
    return result
  }

  let globalLongestPath: string[] = []
  let globalMaxDuration = 0

  Array.from(graph.keys()).forEach((nodeId) => {
    if (!visited.has(nodeId)) {
      const { path, duration } = dfs(nodeId)
      if (duration > globalMaxDuration) {
        globalLongestPath = path
        globalMaxDuration = duration
      }
    }
  })

  return { path: globalLongestPath, duration: globalMaxDuration }
}
