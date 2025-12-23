import type { WorkItem } from '@/lib/types/work-items'
import type { WorkItemConnection } from '@/lib/types/dependencies'

export interface Cycle {
  path: string[] // Ordered list of work item IDs in the cycle
  workItems: WorkItem[] // Full work item objects
  connections: WorkItemConnection[] // Connections forming the cycle
  severity: 'high' | 'medium' | 'low'
  suggestedFixes: CycleFix[]
}

export interface CycleFix {
  action: 'remove_connection' | 'reverse_connection' | 'change_type'
  connectionId: string
  sourceId: string
  targetId: string
  reason: string
  impact: string
}

export interface CycleDetectionResult {
  hasCycles: boolean
  cycles: Cycle[]
  totalCycles: number
  affectedWorkItems: string[] // All work items involved in any cycle
  healthScore: number // 0-100, 0 = many cycles, 100 = no cycles
}

/**
 * Detect all cycles in the dependency graph using DFS
 */
export function detectCycles(
  workItems: WorkItem[],
  connections: WorkItemConnection[]
): CycleDetectionResult {
  // Build adjacency list (only for dependency and blocks types)
  const graph = new Map<string, { targetId: string; connection: WorkItemConnection }[]>()
  const workItemMap = new Map(workItems.map((item) => [item.id, item]))

  // Initialize graph
  workItems.forEach((item) => {
    graph.set(item.id, [])
  })

  // Add edges (only active dependencies and blocks)
  connections
    .filter((conn) => conn.status === 'active' && ['dependency', 'blocks'].includes(conn.connection_type))
    .forEach((conn) => {
      // Source depends on target (target -> source edge)
      const edges = graph.get(conn.target_work_item_id)
      if (edges) {
        edges.push({ targetId: conn.source_work_item_id, connection: conn })
      }
    })

  // Detect all cycles using modified DFS
  const allCycles: Cycle[] = []
  const visited = new Set<string>()
  const recursionStack = new Map<string, number>() // nodeId -> order in stack
  const currentPath: string[] = []

  function dfs(nodeId: string): void {
    visited.add(nodeId)
    recursionStack.set(nodeId, currentPath.length)
    currentPath.push(nodeId)

    const neighbors = graph.get(nodeId) || []

    for (const { targetId, connection } of neighbors) {
      if (!visited.has(targetId)) {
        dfs(targetId)
      } else if (recursionStack.has(targetId)) {
        // Cycle detected
        const cycleStartIndex = recursionStack.get(targetId)!
        const cyclePath = currentPath.slice(cycleStartIndex)
        cyclePath.push(targetId) // Complete the cycle

        // Extract cycle work items and connections
        const cycleWorkItems = cyclePath.slice(0, -1).map((id) => workItemMap.get(id)!)
        const cycleConnections = getCycleConnections(cyclePath, connections)

        // Calculate severity
        const severity = calculateCycleSeverity(cycleWorkItems, cycleConnections)

        // Generate suggested fixes
        const suggestedFixes = generateCycleFixes(cyclePath, cycleConnections, workItemMap)

        allCycles.push({
          path: cyclePath,
          workItems: cycleWorkItems,
          connections: cycleConnections,
          severity,
          suggestedFixes,
        })
      }
    }

    currentPath.pop()
    recursionStack.delete(nodeId)
  }

  // Run DFS from all unvisited nodes
  workItems.forEach((item) => {
    if (!visited.has(item.id)) {
      dfs(item.id)
    }
  })

  // Remove duplicate cycles (same nodes, different starting points)
  const uniqueCycles = removeDuplicateCycles(allCycles)

  // Calculate affected work items
  const affectedWorkItems = Array.from(
    new Set(uniqueCycles.flatMap((cycle) => cycle.path.slice(0, -1)))
  )

  // Calculate health score
  const healthScore = calculateHealthScore(uniqueCycles.length, workItems.length)

  return {
    hasCycles: uniqueCycles.length > 0,
    cycles: uniqueCycles,
    totalCycles: uniqueCycles.length,
    affectedWorkItems,
    healthScore,
  }
}

/**
 * Get all connections that form a cycle
 */
function getCycleConnections(
  cyclePath: string[],
  allConnections: WorkItemConnection[]
): WorkItemConnection[] {
  const cycleConnections: WorkItemConnection[] = []

  for (let i = 0; i < cyclePath.length - 1; i++) {
    const source = cyclePath[i + 1] // Next node is the source (depends on current)
    const target = cyclePath[i] // Current node is the target

    const connection = allConnections.find(
      (conn) =>
        conn.source_work_item_id === source &&
        conn.target_work_item_id === target &&
        conn.status === 'active'
    )

    if (connection) {
      cycleConnections.push(connection)
    }
  }

  return cycleConnections
}

/**
 * Calculate cycle severity based on work items involved
 */
function calculateCycleSeverity(
  workItems: WorkItem[],
  connections: WorkItemConnection[]
): 'high' | 'medium' | 'low' {
  // High severity if:
  // - Cycle includes critical/high priority items
  // - Cycle involves blocked items or active work phases
  // - Long cycle (> 4 items)

  const hasCriticalItems = workItems.some((item) => item.priority === 'critical')
  const hasBlockedItems = workItems.some((item) => {
    const blockers = item.blockers as any
    return Array.isArray(blockers) && blockers.length > 0
  })
  const hasInProgressItems = workItems.some((item) => {
    const activePhases = ['build', 'fixing', 'investigating', 'refine']
    return activePhases.includes(item.phase || '')
  })
  const isLongCycle = workItems.length > 4

  if (hasCriticalItems || (hasBlockedItems && hasInProgressItems)) {
    return 'high'
  }

  if (hasBlockedItems || hasInProgressItems || isLongCycle) {
    return 'medium'
  }

  return 'low'
}

/**
 * Generate suggested fixes for a cycle
 */
function generateCycleFixes(
  cyclePath: string[],
  connections: WorkItemConnection[],
  workItemMap: Map<string, WorkItem>
): CycleFix[] {
  const fixes: CycleFix[] = []

  // Strategy 1: Remove the weakest connection (lowest strength)
  if (connections.length > 0) {
    const weakestConnection = connections.reduce((min, conn) =>
      conn.strength < min.strength ? conn : min
    )

    const sourceItem = workItemMap.get(weakestConnection.source_work_item_id)
    const targetItem = workItemMap.get(weakestConnection.target_work_item_id)

    fixes.push({
      action: 'remove_connection',
      connectionId: weakestConnection.id,
      sourceId: weakestConnection.source_work_item_id,
      targetId: weakestConnection.target_work_item_id,
      reason: `Remove weakest dependency (${Math.round(weakestConnection.strength * 100)}% strength)`,
      impact: `${sourceItem?.name} will no longer depend on ${targetItem?.name}`,
    })
  }

  // Strategy 2: Remove AI-discovered connections (user-created are more intentional)
  const aiConnection = connections.find((conn) => conn.discovered_by === 'ai')
  if (aiConnection) {
    const sourceItem = workItemMap.get(aiConnection.source_work_item_id)
    const targetItem = workItemMap.get(aiConnection.target_work_item_id)

    fixes.push({
      action: 'remove_connection',
      connectionId: aiConnection.id,
      sourceId: aiConnection.source_work_item_id,
      targetId: aiConnection.target_work_item_id,
      reason: 'Remove AI-suggested dependency (may be incorrect)',
      impact: `${sourceItem?.name} will no longer depend on ${targetItem?.name}`,
    })
  }

  // Strategy 3: Change connection type to non-blocking (relates_to)
  const blockingConnection = connections.find((conn) => conn.connection_type === 'blocks')
  if (blockingConnection) {
    const sourceItem = workItemMap.get(blockingConnection.source_work_item_id)
    const targetItem = workItemMap.get(blockingConnection.target_work_item_id)

    fixes.push({
      action: 'change_type',
      connectionId: blockingConnection.id,
      sourceId: blockingConnection.source_work_item_id,
      targetId: blockingConnection.target_work_item_id,
      reason: 'Change "blocks" to "relates_to" (informational only)',
      impact: `${sourceItem?.name} will relate to ${targetItem?.name} without blocking`,
    })
  }

  // Strategy 4: Reverse the newest connection
  if (connections.length > 0) {
    const newestConnection = connections.reduce((max, conn) =>
      new Date(conn.created_at) > new Date(max.created_at) ? conn : max
    )

    const sourceItem = workItemMap.get(newestConnection.source_work_item_id)
    const targetItem = workItemMap.get(newestConnection.target_work_item_id)

    fixes.push({
      action: 'reverse_connection',
      connectionId: newestConnection.id,
      sourceId: newestConnection.source_work_item_id,
      targetId: newestConnection.target_work_item_id,
      reason: 'Reverse most recent dependency (may have been added incorrectly)',
      impact: `${targetItem?.name} will depend on ${sourceItem?.name} instead`,
    })
  }

  return fixes
}

/**
 * Remove duplicate cycles (cycles with same nodes but different starting points)
 */
function removeDuplicateCycles(cycles: Cycle[]): Cycle[] {
  const uniqueCycles: Cycle[] = []
  const seenCycles = new Set<string>()

  cycles.forEach((cycle) => {
    // Normalize cycle path by sorting and creating signature
    const pathWithoutLast = cycle.path.slice(0, -1)
    const normalizedPath = [...pathWithoutLast].sort().join(',')

    if (!seenCycles.has(normalizedPath)) {
      seenCycles.add(normalizedPath)
      uniqueCycles.push(cycle)
    }
  })

  return uniqueCycles
}

/**
 * Calculate health score based on number of cycles
 */
function calculateHealthScore(cycleCount: number, totalWorkItems: number): number {
  if (cycleCount === 0) return 100

  // Penalize based on cycle ratio
  const cycleRatio = cycleCount / totalWorkItems
  const baseScore = Math.max(0, 100 - cycleCount * 20)
  const ratioScore = Math.max(0, 100 - cycleRatio * 100)

  return Math.round((baseScore + ratioScore) / 2)
}

/**
 * Check if a specific connection would create a cycle
 */
export function wouldCreateCycle(
  sourceId: string,
  targetId: string,
  existingConnections: WorkItemConnection[],
  workItems: WorkItem[]
): boolean {
  // Build graph with existing connections
  const graph = new Map<string, string[]>()
  workItems.forEach((item) => graph.set(item.id, []))

  existingConnections
    .filter((conn) => conn.status === 'active' && ['dependency', 'blocks'].includes(conn.connection_type))
    .forEach((conn) => {
      const edges = graph.get(conn.target_work_item_id)
      if (edges) edges.push(conn.source_work_item_id)
    })

  // Add proposed connection
  const edges = graph.get(targetId)
  if (edges) edges.push(sourceId)

  // Check if cycle exists using DFS
  const visited = new Set<string>()
  const recursionStack = new Set<string>()

  function hasCycle(nodeId: string): boolean {
    visited.add(nodeId)
    recursionStack.add(nodeId)

    const neighbors = graph.get(nodeId) || []
    for (const neighbor of neighbors) {
      if (!visited.has(neighbor)) {
        if (hasCycle(neighbor)) return true
      } else if (recursionStack.has(neighbor)) {
        return true
      }
    }

    recursionStack.delete(nodeId)
    return false
  }

  return hasCycle(targetId)
}
