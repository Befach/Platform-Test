/**
 * Graph Analysis Service
 * Performs advanced graph analysis on feature connections
 *
 * Purpose: Critical path, bottleneck detection, circular dependencies, clusters
 * Integration: Works with connection-manager and importance-service
 */

const graphAnalysisService = {
    /**
     * Build graph from features and connections
     * @param {Array} features - Features array
     * @param {Array} connections - Connections array
     * @returns {Object} Graph structure
     */
    buildGraph(features, connections) {
        const graph = {
            nodes: new Map(),
            edges: [],
            adjacencyList: new Map()
        };

        // Initialize nodes
        features.forEach(feature => {
            graph.nodes.set(feature.id, {
                id: feature.id,
                name: feature.name,
                type: feature.type,
                priority: feature.priority || 'medium',
                status: feature.status || 'not_started',
                workflowStage: feature.workflowStage || 'ideation'
            });
            graph.adjacencyList.set(feature.id, []);
        });

        // Add edges
        connections.forEach(conn => {
            if (conn.status === 'active') {
                graph.edges.push({
                    source: conn.sourceFeatureId,
                    target: conn.targetFeatureId,
                    type: conn.connectionType,
                    strength: conn.strength || 0.5
                });

                // Build adjacency list for dependencies
                if (conn.connectionType === 'dependency' || conn.connectionType === 'blocks') {
                    const neighbors = graph.adjacencyList.get(conn.sourceFeatureId) || [];
                    neighbors.push({
                        id: conn.targetFeatureId,
                        type: conn.connectionType,
                        strength: conn.strength
                    });
                    graph.adjacencyList.set(conn.sourceFeatureId, neighbors);
                }
            }
        });

        return graph;
    },

    /**
     * Calculate critical path through the feature graph
     * @param {String} workspaceId - Workspace ID
     * @param {Array} features - Features array
     * @param {Array} connections - Connections array
     * @returns {Object} Critical path analysis
     */
    async calculateCriticalPath(workspaceId, features, connections) {
        const workspaceFeatures = features.filter(f => f.workspaceId === workspaceId);
        const graph = this.buildGraph(workspaceFeatures, connections);

        // Find features with no incoming dependencies (start nodes)
        const startNodes = this.findStartNodes(graph);

        // Find features with no outgoing dependencies (end nodes)
        const endNodes = this.findEndNodes(graph);

        // Calculate longest path from each start node
        const paths = [];
        for (const startNode of startNodes) {
            for (const endNode of endNodes) {
                const path = this.findLongestPath(graph, startNode, endNode);
                if (path && path.length > 0) {
                    paths.push({
                        start: startNode,
                        end: endNode,
                        path: path,
                        length: path.length,
                        totalEffort: this.calculatePathEffort(path, features)
                    });
                }
            }
        }

        // Sort by path length (longest first)
        paths.sort((a, b) => b.length - a.length);

        const criticalPath = paths.length > 0 ? paths[0] : null;

        // Mark features on critical path in importance service
        if (criticalPath) {
            for (const nodeId of criticalPath.path) {
                await importanceService.markCriticalPath(nodeId, true);
            }
        }

        return {
            criticalPath,
            allPaths: paths,
            startNodes,
            endNodes,
            graphStats: this.calculateGraphStats(graph)
        };
    },

    /**
     * Find nodes with no incoming edges
     * @param {Object} graph - Graph structure
     * @returns {Array} Start node IDs
     */
    findStartNodes(graph) {
        const hasIncoming = new Set();

        graph.edges.forEach(edge => {
            if (edge.type === 'dependency' || edge.type === 'blocks') {
                hasIncoming.add(edge.target);
            }
        });

        const startNodes = [];
        graph.nodes.forEach((node, id) => {
            if (!hasIncoming.has(id)) {
                startNodes.push(id);
            }
        });

        return startNodes;
    },

    /**
     * Find nodes with no outgoing edges
     * @param {Object} graph - Graph structure
     * @returns {Array} End node IDs
     */
    findEndNodes(graph) {
        const hasOutgoing = new Set();

        graph.edges.forEach(edge => {
            if (edge.type === 'dependency' || edge.type === 'blocks') {
                hasOutgoing.add(edge.source);
            }
        });

        const endNodes = [];
        graph.nodes.forEach((node, id) => {
            if (!hasOutgoing.has(id)) {
                endNodes.push(id);
            }
        });

        return endNodes;
    },

    /**
     * Find longest path between two nodes using DFS
     * @param {Object} graph - Graph structure
     * @param {String} start - Start node ID
     * @param {String} end - End node ID
     * @returns {Array} Path as array of node IDs
     */
    findLongestPath(graph, start, end) {
        const visited = new Set();
        let longestPath = null;
        let maxLength = 0;

        const dfs = (current, target, path) => {
            if (current === target) {
                if (path.length > maxLength) {
                    maxLength = path.length;
                    longestPath = [...path];
                }
                return;
            }

            visited.add(current);

            const neighbors = graph.adjacencyList.get(current) || [];
            for (const neighbor of neighbors) {
                if (!visited.has(neighbor.id)) {
                    dfs(neighbor.id, target, [...path, neighbor.id]);
                }
            }

            visited.delete(current);
        };

        dfs(start, end, [start]);
        return longestPath;
    },

    /**
     * Calculate total effort for a path
     * @param {Array} path - Path as array of node IDs
     * @param {Array} features - Features array
     * @returns {Number} Total effort estimate
     */
    calculatePathEffort(path, features) {
        let totalEffort = 0;

        path.forEach(nodeId => {
            const feature = features.find(f => f.id === nodeId);
            if (feature) {
                // Use estimated hours or default based on difficulty
                const effort = feature.estimatedHours || this.getDefaultEffort(feature);
                totalEffort += effort;
            }
        });

        return totalEffort;
    },

    /**
     * Get default effort estimate based on difficulty
     * @param {Object} feature - Feature
     * @returns {Number} Effort in hours
     */
    getDefaultEffort(feature) {
        let difficulty = 'Medium';

        if (feature.timelineItems && feature.timelineItems.length > 0) {
            difficulty = feature.timelineItems[0].difficulty || 'Medium';
        }

        const effortMap = {
            Easy: 8,
            Medium: 24,
            Hard: 80
        };

        return effortMap[difficulty] || 24;
    },

    /**
     * Detect bottlenecks in the graph
     * @param {String} workspaceId - Workspace ID
     * @param {Array} features - Features array
     * @param {Array} connections - Connections array
     * @returns {Array} Bottleneck features
     */
    async detectBottlenecks(workspaceId, features, connections) {
        const workspaceFeatures = features.filter(f => f.workspaceId === workspaceId);
        const graph = this.buildGraph(workspaceFeatures, connections);

        const bottlenecks = [];

        // A bottleneck is a node with:
        // 1. Multiple incoming dependencies
        // 2. Multiple outgoing dependencies (blocks many features)
        // 3. Not yet completed

        graph.nodes.forEach((node, id) => {
            const incoming = this.getIncomingEdges(graph, id);
            const outgoing = this.getOutgoingEdges(graph, id);

            // Check if it's blocking other features
            const blockingCount = outgoing.filter(e => e.type === 'blocks').length;
            const dependencyCount = incoming.filter(e => e.type === 'dependency').length;

            const isBottleneck = (
                blockingCount >= 2 ||
                (dependencyCount >= 2 && outgoing.length >= 2) ||
                (blockingCount >= 1 && dependencyCount >= 1 && node.status !== 'completed')
            );

            if (isBottleneck) {
                bottlenecks.push({
                    featureId: id,
                    name: node.name,
                    incomingCount: incoming.length,
                    outgoingCount: outgoing.length,
                    blockingCount,
                    dependencyCount,
                    status: node.status,
                    severity: this.calculateBottleneckSeverity(blockingCount, dependencyCount, node.status)
                });

                // Mark in importance service
                importanceService.markBottleneck(id, true);
            }
        });

        // Sort by severity
        bottlenecks.sort((a, b) => b.severity - a.severity);

        return bottlenecks;
    },

    /**
     * Calculate bottleneck severity score
     * @param {Number} blockingCount - Number of features blocked
     * @param {Number} dependencyCount - Number of dependencies
     * @param {String} status - Feature status
     * @returns {Number} Severity score
     */
    calculateBottleneckSeverity(blockingCount, dependencyCount, status) {
        let severity = blockingCount * 3 + dependencyCount * 2;

        // Increase severity if not started or blocked
        if (status === 'not_started') severity *= 1.5;
        if (status === 'blocked') severity *= 2;

        return Math.round(severity);
    },

    /**
     * Get incoming edges for a node
     * @param {Object} graph - Graph structure
     * @param {String} nodeId - Node ID
     * @returns {Array} Incoming edges
     */
    getIncomingEdges(graph, nodeId) {
        return graph.edges.filter(e => e.target === nodeId);
    },

    /**
     * Get outgoing edges for a node
     * @param {Object} graph - Graph structure
     * @param {String} nodeId - Node ID
     * @returns {Array} Outgoing edges
     */
    getOutgoingEdges(graph, nodeId) {
        return graph.edges.filter(e => e.source === nodeId);
    },

    /**
     * Detect circular dependencies
     * @param {String} workspaceId - Workspace ID
     * @param {Array} features - Features array
     * @param {Array} connections - Connections array
     * @returns {Array} Circular dependency chains
     */
    detectCircularDependencies(workspaceId, features, connections) {
        const workspaceFeatures = features.filter(f => f.workspaceId === workspaceId);
        const graph = this.buildGraph(workspaceFeatures, connections);

        const cycles = [];
        const visited = new Set();
        const recursionStack = new Set();

        const dfs = (nodeId, path) => {
            visited.add(nodeId);
            recursionStack.add(nodeId);

            const neighbors = graph.adjacencyList.get(nodeId) || [];

            for (const neighbor of neighbors) {
                if (neighbor.type === 'dependency') {
                    if (!visited.has(neighbor.id)) {
                        const foundCycle = dfs(neighbor.id, [...path, neighbor.id]);
                        if (foundCycle) return true;
                    } else if (recursionStack.has(neighbor.id)) {
                        // Found a cycle
                        const cycleStart = path.indexOf(neighbor.id);
                        const cycle = path.slice(cycleStart);
                        cycles.push({
                            cycle,
                            length: cycle.length,
                            features: cycle.map(id => {
                                const node = graph.nodes.get(id);
                                return { id, name: node?.name || 'Unknown' };
                            })
                        });
                        return true;
                    }
                }
            }

            recursionStack.delete(nodeId);
            return false;
        };

        // Check each node for cycles
        graph.nodes.forEach((node, id) => {
            if (!visited.has(id)) {
                dfs(id, [id]);
            }
        });

        return cycles;
    },

    /**
     * Detect feature clusters (strongly connected components)
     * @param {String} workspaceId - Workspace ID
     * @param {Array} features - Features array
     * @param {Array} connections - Connections array
     * @returns {Array} Feature clusters
     */
    detectClusters(workspaceId, features, connections) {
        const workspaceFeatures = features.filter(f => f.workspaceId === workspaceId);
        const graph = this.buildGraph(workspaceFeatures, connections);

        const clusters = [];
        const visited = new Set();

        const bfs = (startId) => {
            const cluster = [];
            const queue = [startId];
            visited.add(startId);

            while (queue.length > 0) {
                const current = queue.shift();
                cluster.push(current);

                // Get all connected nodes (both directions)
                const edges = [
                    ...this.getIncomingEdges(graph, current),
                    ...this.getOutgoingEdges(graph, current)
                ];

                edges.forEach(edge => {
                    const nextId = edge.source === current ? edge.target : edge.source;
                    if (!visited.has(nextId)) {
                        visited.add(nextId);
                        queue.push(nextId);
                    }
                });
            }

            return cluster;
        };

        // Find all clusters
        graph.nodes.forEach((node, id) => {
            if (!visited.has(id)) {
                const cluster = bfs(id);
                if (cluster.length >= 2) {
                    clusters.push({
                        size: cluster.length,
                        features: cluster.map(fId => {
                            const node = graph.nodes.get(fId);
                            return {
                                id: fId,
                                name: node?.name || 'Unknown'
                            };
                        }),
                        density: this.calculateClusterDensity(cluster, graph)
                    });
                }
            }
        });

        // Sort by size (largest first)
        clusters.sort((a, b) => b.size - a.size);

        return clusters;
    },

    /**
     * Calculate cluster density (edges / possible edges)
     * @param {Array} cluster - Cluster node IDs
     * @param {Object} graph - Graph structure
     * @returns {Number} Density (0-1)
     */
    calculateClusterDensity(cluster, graph) {
        const clusterSet = new Set(cluster);
        let edgeCount = 0;

        graph.edges.forEach(edge => {
            if (clusterSet.has(edge.source) && clusterSet.has(edge.target)) {
                edgeCount++;
            }
        });

        const n = cluster.length;
        const possibleEdges = n * (n - 1); // Directed graph

        return possibleEdges > 0 ? edgeCount / possibleEdges : 0;
    },

    /**
     * Calculate graph statistics
     * @param {Object} graph - Graph structure
     * @returns {Object} Graph statistics
     */
    calculateGraphStats(graph) {
        const nodeCount = graph.nodes.size;
        const edgeCount = graph.edges.length;

        // Calculate degree distribution
        const inDegrees = new Map();
        const outDegrees = new Map();

        graph.nodes.forEach((node, id) => {
            inDegrees.set(id, 0);
            outDegrees.set(id, 0);
        });

        graph.edges.forEach(edge => {
            outDegrees.set(edge.source, (outDegrees.get(edge.source) || 0) + 1);
            inDegrees.set(edge.target, (inDegrees.get(edge.target) || 0) + 1);
        });

        // Calculate average degrees
        let totalInDegree = 0;
        let totalOutDegree = 0;

        inDegrees.forEach(degree => totalInDegree += degree);
        outDegrees.forEach(degree => totalOutDegree += degree);

        const avgInDegree = nodeCount > 0 ? totalInDegree / nodeCount : 0;
        const avgOutDegree = nodeCount > 0 ? totalOutDegree / nodeCount : 0;

        // Calculate density
        const possibleEdges = nodeCount * (nodeCount - 1);
        const density = possibleEdges > 0 ? edgeCount / possibleEdges : 0;

        // Find isolated nodes
        const isolatedNodes = [];
        graph.nodes.forEach((node, id) => {
            if (inDegrees.get(id) === 0 && outDegrees.get(id) === 0) {
                isolatedNodes.push(id);
            }
        });

        return {
            nodeCount,
            edgeCount,
            avgInDegree: Math.round(avgInDegree * 100) / 100,
            avgOutDegree: Math.round(avgOutDegree * 100) / 100,
            density: Math.round(density * 10000) / 10000,
            isolatedNodeCount: isolatedNodes.length,
            isolatedNodes
        };
    },

    /**
     * Perform comprehensive graph analysis
     * @param {String} workspaceId - Workspace ID
     * @param {Array} features - Features array
     * @param {Array} connections - Connections array
     * @returns {Promise<Object>} Complete analysis results
     */
    async analyzeWorkspace(workspaceId, features, connections) {
        console.log(`🔍 Analyzing workspace ${workspaceId}...`);

        const results = {
            workspaceId,
            analyzedAt: new Date().toISOString(),
            criticalPath: await this.calculateCriticalPath(workspaceId, features, connections),
            bottlenecks: await this.detectBottlenecks(workspaceId, features, connections),
            circularDependencies: this.detectCircularDependencies(workspaceId, features, connections),
            clusters: this.detectClusters(workspaceId, features, connections)
        };

        console.log(`✅ Analysis complete:
- Critical path length: ${results.criticalPath.criticalPath?.length || 0}
- Bottlenecks detected: ${results.bottlenecks.length}
- Circular dependencies: ${results.circularDependencies.length}
- Clusters found: ${results.clusters.length}`);

        return results;
    }
};

// Export for testing
if (typeof module !== 'undefined' && module.exports) {
    module.exports = graphAnalysisService;
}
