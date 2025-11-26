/**
 * Graph View Component
 * Interactive graph visualization using Cytoscape.js
 *
 * Purpose: Visual representation of feature connections and dependencies
 * Integration: Uses connection-manager, importance-service, graph-analysis-service
 */

const graphView = {
    cy: null,
    currentWorkspaceId: null,
    currentLayout: 'dagre',

    /**
     * Layout algorithms available
     */
    LAYOUTS: {
        dagre: {
            name: 'dagre',
            rankDir: 'TB',
            nodeSep: 100,
            edgeSep: 50,
            rankSep: 150,
            animate: true,
            animationDuration: 500
        },
        circle: {
            name: 'circle',
            animate: true,
            animationDuration: 500
        },
        grid: {
            name: 'grid',
            animate: true,
            animationDuration: 500
        },
        concentric: {
            name: 'concentric',
            concentric: (node) => node.data('importance') || 0,
            levelWidth: () => 2,
            animate: true,
            animationDuration: 500
        }
    },

    /**
     * Initialize graph visualization
     * @param {String} containerId - Container element ID
     * @param {String} workspaceId - Workspace ID
     * @param {Array} features - Features array
     * @param {Array} connections - Connections array
     */
    async initialize(containerId, workspaceId, features, connections) {
        this.currentWorkspaceId = workspaceId;

        // Get container
        const container = document.getElementById(containerId);
        if (!container) {
            console.error('❌ Graph container not found:', containerId);
            return;
        }

        // Build graph data
        const elements = this.buildGraphElements(workspaceId, features, connections);

        // Initialize Cytoscape
        this.cy = cytoscape({
            container,
            elements,
            style: this.getGraphStyle(),
            layout: this.LAYOUTS.dagre,
            minZoom: 0.1,
            maxZoom: 3,
            wheelSensitivity: 0.2
        });

        // Setup event handlers
        this.setupEventHandlers();

        console.log(`✅ Graph initialized with ${elements.nodes.length} nodes and ${elements.edges.length} edges`);
    },

    /**
     * Build Cytoscape graph elements from features and connections
     * @param {String} workspaceId - Workspace ID
     * @param {Array} features - Features array
     * @param {Array} connections - Connections array
     * @returns {Object} Elements object {nodes, edges}
     */
    buildGraphElements(workspaceId, features, connections) {
        const workspaceFeatures = features.filter(f => f.workspaceId === workspaceId);

        // Build nodes
        const nodes = workspaceFeatures.map(feature => ({
            data: {
                id: feature.id,
                label: feature.name,
                type: feature.type || 'Feature',
                priority: feature.priority || 'medium',
                status: feature.status || 'not_started',
                workflowStage: feature.workflowStage || 'ideation',
                importance: 50 // Will be updated by importance service
            }
        }));

        // Build edges
        const edges = connections
            .filter(conn => conn.status === 'active')
            .map(conn => ({
                data: {
                    id: conn.id,
                    source: conn.sourceFeatureId,
                    target: conn.targetFeatureId,
                    connectionType: conn.connectionType,
                    strength: conn.strength || 0.5,
                    label: connectionManager.getConnectionLabel(conn.connectionType)
                }
            }));

        return { nodes, edges };
    },

    /**
     * Get graph visual style
     * @returns {Array} Cytoscape style array
     */
    getGraphStyle() {
        return [
            // Node styles
            {
                selector: 'node',
                style: {
                    'background-color': '#667eea',
                    'label': 'data(label)',
                    'text-valign': 'center',
                    'text-halign': 'center',
                    'font-size': '12px',
                    'color': '#333',
                    'text-outline-color': '#fff',
                    'text-outline-width': 2,
                    'width': 60,
                    'height': 60,
                    'border-width': 2,
                    'border-color': '#764ba2'
                }
            },

            // Node status colors
            {
                selector: 'node[status="completed"]',
                style: {
                    'background-color': '#10b981',
                    'border-color': '#059669'
                }
            },
            {
                selector: 'node[status="in_progress"]',
                style: {
                    'background-color': '#3b82f6',
                    'border-color': '#2563eb'
                }
            },
            {
                selector: 'node[status="blocked"]',
                style: {
                    'background-color': '#ef4444',
                    'border-color': '#dc2626'
                }
            },
            {
                selector: 'node[status="not_started"]',
                style: {
                    'background-color': '#94a3b8',
                    'border-color': '#64748b'
                }
            },

            // Priority sizing
            {
                selector: 'node[priority="critical"]',
                style: {
                    'width': 80,
                    'height': 80,
                    'font-size': '14px',
                    'font-weight': 'bold'
                }
            },
            {
                selector: 'node[priority="high"]',
                style: {
                    'width': 70,
                    'height': 70,
                    'font-size': '13px'
                }
            },

            // Edge styles
            {
                selector: 'edge',
                style: {
                    'width': 2,
                    'line-color': '#cbd5e1',
                    'target-arrow-color': '#cbd5e1',
                    'target-arrow-shape': 'triangle',
                    'curve-style': 'bezier',
                    'arrow-scale': 1.5
                }
            },

            // Edge types
            {
                selector: 'edge[connectionType="dependency"]',
                style: {
                    'line-color': '#667eea',
                    'target-arrow-color': '#667eea',
                    'width': 3
                }
            },
            {
                selector: 'edge[connectionType="blocks"]',
                style: {
                    'line-color': '#ef4444',
                    'target-arrow-color': '#ef4444',
                    'width': 3,
                    'line-style': 'dashed'
                }
            },
            {
                selector: 'edge[connectionType="complements"]',
                style: {
                    'line-color': '#10b981',
                    'target-arrow-color': '#10b981',
                    'target-arrow-shape': 'diamond'
                }
            },

            // Hover and selection states
            {
                selector: 'node:selected',
                style: {
                    'border-width': 4,
                    'border-color': '#fbbf24',
                    'box-shadow': '0 0 20px #fbbf24'
                }
            },
            {
                selector: 'edge:selected',
                style: {
                    'line-color': '#fbbf24',
                    'target-arrow-color': '#fbbf24',
                    'width': 4
                }
            },

            // Critical path highlight
            {
                selector: '.critical-path',
                style: {
                    'border-color': '#f59e0b',
                    'border-width': 4,
                    'background-color': '#fbbf24'
                }
            },

            // Bottleneck highlight
            {
                selector: '.bottleneck',
                style: {
                    'border-color': '#dc2626',
                    'border-width': 4,
                    'background-color': '#fca5a5'
                }
            }
        ];
    },

    /**
     * Setup event handlers for graph interactions
     */
    setupEventHandlers() {
        if (!this.cy) return;

        // Node click - show feature details
        this.cy.on('tap', 'node', (event) => {
            const node = event.target;
            const featureId = node.data('id');

            if (typeof app !== 'undefined' && app.showDetailView) {
                app.showDetailView(featureId);
            }
        });

        // Edge click - show connection details
        this.cy.on('tap', 'edge', (event) => {
            const edge = event.target;
            const data = edge.data();

            this.showEdgeTooltip(data);
        });

        // Node hover
        this.cy.on('mouseover', 'node', (event) => {
            const node = event.target;
            node.style('cursor', 'pointer');

            // Highlight connected nodes
            const connected = node.connectedEdges().connectedNodes();
            connected.addClass('highlighted');
            node.connectedEdges().addClass('highlighted');
        });

        this.cy.on('mouseout', 'node', (event) => {
            this.cy.elements().removeClass('highlighted');
        });
    },

    /**
     * Show edge tooltip
     * @param {Object} edgeData - Edge data
     */
    showEdgeTooltip(edgeData) {
        const tooltip = `
            <div style="position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
                        background: white; padding: 20px; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.15); z-index: 10000;">
                <h3 style="margin: 0 0 10px 0;">Connection Details</h3>
                <p><strong>Type:</strong> ${edgeData.label}</p>
                <p><strong>Strength:</strong> ${(edgeData.strength * 100).toFixed(0)}%</p>
                <button onclick="this.parentElement.remove()" style="margin-top: 10px;">Close</button>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', tooltip);

        // Auto-remove after 5 seconds
        setTimeout(() => {
            const tooltips = document.querySelectorAll('[style*="transform: translate(-50%, -50%)"]');
            tooltips.forEach(t => t.remove());
        }, 5000);
    },

    /**
     * Update graph layout
     * @param {String} layoutName - Layout algorithm name
     */
    changeLayout(layoutName) {
        if (!this.cy) return;

        const layout = this.LAYOUTS[layoutName];
        if (!layout) {
            console.error('❌ Unknown layout:', layoutName);
            return;
        }

        this.currentLayout = layoutName;
        const cyLayout = this.cy.layout(layout);
        cyLayout.run();

        console.log(`✅ Changed layout to: ${layoutName}`);
    },

    /**
     * Highlight critical path
     * @param {Array} path - Array of feature IDs on critical path
     */
    highlightCriticalPath(path) {
        if (!this.cy) return;

        // Remove previous highlights
        this.cy.elements().removeClass('critical-path');

        // Highlight nodes on path
        path.forEach(featureId => {
            const node = this.cy.getElementById(featureId);
            if (node) {
                node.addClass('critical-path');
            }
        });

        console.log(`✅ Highlighted critical path: ${path.length} features`);
    },

    /**
     * Highlight bottlenecks
     * @param {Array} bottlenecks - Array of bottleneck objects
     */
    highlightBottlenecks(bottlenecks) {
        if (!this.cy) return;

        // Remove previous highlights
        this.cy.elements().removeClass('bottleneck');

        // Highlight bottleneck nodes
        bottlenecks.forEach(bottleneck => {
            const node = this.cy.getElementById(bottleneck.featureId);
            if (node) {
                node.addClass('bottleneck');
            }
        });

        console.log(`✅ Highlighted ${bottlenecks.length} bottlenecks`);
    },

    /**
     * Filter graph by connection type
     * @param {String} connectionType - Connection type to show
     */
    filterByConnectionType(connectionType) {
        if (!this.cy) return;

        if (connectionType === 'all') {
            this.cy.elements().show();
        } else {
            this.cy.edges().hide();
            this.cy.edges(`[connectionType="${connectionType}"]`).show();
        }
    },

    /**
     * Filter graph by status
     * @param {String} status - Status to show
     */
    filterByStatus(status) {
        if (!this.cy) return;

        if (status === 'all') {
            this.cy.nodes().show();
        } else {
            this.cy.nodes().hide();
            this.cy.nodes(`[status="${status}"]`).show();

            // Show edges between visible nodes
            this.cy.edges().forEach(edge => {
                const source = edge.source();
                const target = edge.target();
                if (source.visible() && target.visible()) {
                    edge.show();
                } else {
                    edge.hide();
                }
            });
        }
    },

    /**
     * Export graph as image
     * @returns {String} PNG data URL
     */
    exportAsImage() {
        if (!this.cy) return null;

        const png = this.cy.png({
            output: 'blob',
            bg: '#ffffff',
            full: true,
            scale: 2
        });

        return png;
    },

    /**
     * Fit graph to viewport
     */
    fit() {
        if (!this.cy) return;
        this.cy.fit();
    },

    /**
     * Center graph
     */
    center() {
        if (!this.cy) return;
        this.cy.center();
    },

    /**
     * Reset zoom
     */
    resetZoom() {
        if (!this.cy) return;
        this.cy.zoom(1);
        this.cy.center();
    },

    /**
     * Destroy graph instance
     */
    destroy() {
        if (this.cy) {
            this.cy.destroy();
            this.cy = null;
        }
    },

    /**
     * Update graph with new data
     * @param {String} workspaceId - Workspace ID
     * @param {Array} features - Features array
     * @param {Array} connections - Connections array
     */
    async update(workspaceId, features, connections) {
        if (!this.cy) {
            console.error('❌ Graph not initialized');
            return;
        }

        // Clear existing elements
        this.cy.elements().remove();

        // Build new elements
        const elements = this.buildGraphElements(workspaceId, features, connections);

        // Add to graph
        this.cy.add(elements.nodes);
        this.cy.add(elements.edges);

        // Apply layout
        const layout = this.cy.layout(this.LAYOUTS[this.currentLayout]);
        layout.run();

        console.log(`✅ Graph updated: ${elements.nodes.length} nodes, ${elements.edges.length} edges`);
    }
};

// Export for testing
if (typeof module !== 'undefined' && module.exports) {
    module.exports = graphView;
}
