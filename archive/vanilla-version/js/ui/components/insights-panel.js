/**
 * Insights Panel Component
 * Displays actionable insights from graph analysis
 *
 * Purpose: Present critical path, bottlenecks, correlations, and recommendations
 * Integration: Uses graph-analysis-service, importance-service, correlation-service
 */

const insightsPanel = {
    currentWorkspaceId: null,
    analysisResults: null,

    /**
     * Render insights panel
     * @param {String} containerId - Container element ID
     * @param {String} workspaceId - Workspace ID
     * @param {Array} features - Features array
     * @param {Array} connections - Connections array
     */
    async render(containerId, workspaceId, features, connections) {
        this.currentWorkspaceId = workspaceId;

        const container = document.getElementById(containerId);
        if (!container) {
            console.error('❌ Insights container not found:', containerId);
            return;
        }

        // Show loading state
        container.innerHTML = '<div class="insights-loading">🔍 Analyzing workspace...</div>';

        try {
            // Run comprehensive analysis
            this.analysisResults = await graphAnalysisService.analyzeWorkspace(
                workspaceId,
                features,
                connections
            );

            // Calculate importance scores
            const importanceScores = await importanceService.calculateWorkspaceImportance(
                workspaceId,
                features
            );

            // Detect correlations
            const correlations = await correlationService.detectWorkspaceCorrelations(
                workspaceId,
                features,
                0.5 // Higher threshold for insights
            );

            // Render insights
            container.innerHTML = this.buildInsightsHTML(
                this.analysisResults,
                importanceScores,
                correlations,
                features
            );

            console.log('✅ Insights panel rendered');
        } catch (error) {
            console.error('❌ Error rendering insights:', error);
            container.innerHTML = '<div class="insights-error">Failed to generate insights</div>';
        }
    },

    /**
     * Build insights HTML
     * @param {Object} analysis - Graph analysis results
     * @param {Array} importance - Importance scores
     * @param {Array} correlations - Correlations
     * @param {Array} features - Features array
     * @returns {String} HTML string
     */
    buildInsightsHTML(analysis, importance, correlations, features) {
        return `
            <div class="insights-panel">
                <div class="insights-header">
                    <h2>📊 Workspace Insights</h2>
                    <button class="btn-refresh" onclick="insightsPanel.refresh()">🔄 Refresh</button>
                </div>

                <div class="insights-grid">
                    ${this.buildOverviewSection(analysis, importance)}
                    ${this.buildCriticalPathSection(analysis, features)}
                    ${this.buildBottlenecksSection(analysis.bottlenecks, features)}
                    ${this.buildTopFeaturesSection(importance, features)}
                    ${this.buildCorrelationsSection(correlations, features)}
                    ${this.buildRecommendationsSection(analysis, importance)}
                </div>
            </div>
        `;
    },

    /**
     * Build overview section
     */
    buildOverviewSection(analysis, importance) {
        const stats = analysis.criticalPath.graphStats;

        return `
            <div class="insight-card overview-card">
                <h3>🎯 Overview</h3>
                <div class="stats-grid">
                    <div class="stat">
                        <div class="stat-value">${stats.nodeCount}</div>
                        <div class="stat-label">Features</div>
                    </div>
                    <div class="stat">
                        <div class="stat-value">${stats.edgeCount}</div>
                        <div class="stat-label">Connections</div>
                    </div>
                    <div class="stat">
                        <div class="stat-value">${(stats.density * 100).toFixed(1)}%</div>
                        <div class="stat-label">Density</div>
                    </div>
                    <div class="stat">
                        <div class="stat-value">${stats.isolatedNodeCount}</div>
                        <div class="stat-label">Isolated</div>
                    </div>
                </div>
            </div>
        `;
    },

    /**
     * Build critical path section
     */
    buildCriticalPathSection(analysis, features) {
        const criticalPath = analysis.criticalPath.criticalPath;

        if (!criticalPath) {
            return `
                <div class="insight-card">
                    <h3>🎯 Critical Path</h3>
                    <p class="insight-empty">No critical path found</p>
                </div>
            `;
        }

        const pathFeatures = criticalPath.path.map(id => {
            const feature = features.find(f => f.id === id);
            return feature ? feature.name : 'Unknown';
        });

        return `
            <div class="insight-card critical-path-card">
                <h3>🎯 Critical Path</h3>
                <div class="insight-metric">
                    <span class="metric-label">Path Length:</span>
                    <span class="metric-value">${criticalPath.length} features</span>
                </div>
                <div class="insight-metric">
                    <span class="metric-label">Estimated Effort:</span>
                    <span class="metric-value">${Math.round(criticalPath.totalEffort)}h</span>
                </div>
                <div class="path-list">
                    ${pathFeatures.map((name, idx) => `
                        <div class="path-item">
                            <span class="path-number">${idx + 1}</span>
                            <span class="path-name">${name}</span>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    },

    /**
     * Build bottlenecks section
     */
    buildBottlenecksSection(bottlenecks, features) {
        if (bottlenecks.length === 0) {
            return `
                <div class="insight-card">
                    <h3>🚫 Bottlenecks</h3>
                    <p class="insight-success">✅ No bottlenecks detected</p>
                </div>
            `;
        }

        return `
            <div class="insight-card bottleneck-card">
                <h3>🚫 Bottlenecks</h3>
                <div class="bottleneck-list">
                    ${bottlenecks.slice(0, 5).map(bottleneck => `
                        <div class="bottleneck-item ${bottleneck.severity >= 10 ? 'severe' : ''}">
                            <div class="bottleneck-header">
                                <strong>${bottleneck.name}</strong>
                                <span class="severity-badge severity-${bottleneck.severity >= 10 ? 'high' : 'medium'}">
                                    Severity: ${bottleneck.severity}
                                </span>
                            </div>
                            <div class="bottleneck-stats">
                                <span>🔗 ${bottleneck.incomingCount} incoming</span>
                                <span>🚫 Blocks ${bottleneck.blockingCount} features</span>
                                <span>Status: ${bottleneck.status}</span>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    },

    /**
     * Build top features section
     */
    buildTopFeaturesSection(importance, features) {
        const topFeatures = importance.slice(0, 5);

        return `
            <div class="insight-card top-features-card">
                <h3>⭐ Top Important Features</h3>
                <div class="top-features-list">
                    ${topFeatures.map((score, idx) => {
                        const feature = features.find(f => f.id === score.featureId);
                        if (!feature) return '';

                        return `
                            <div class="top-feature-item">
                                <div class="feature-rank">${idx + 1}</div>
                                <div class="feature-info">
                                    <div class="feature-name">${feature.name}</div>
                                    <div class="feature-score">
                                        <div class="score-bar">
                                            <div class="score-fill" style="width: ${score.overallScore}%"></div>
                                        </div>
                                        <span class="score-value">${Math.round(score.overallScore)}</span>
                                    </div>
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
        `;
    },

    /**
     * Build correlations section
     */
    buildCorrelationsSection(correlations, features) {
        if (correlations.length === 0) {
            return `
                <div class="insight-card">
                    <h3>🔄 High Correlations</h3>
                    <p class="insight-empty">No high correlations found</p>
                </div>
            `;
        }

        const topCorrelations = correlations.slice(0, 5);

        return `
            <div class="insight-card correlations-card">
                <h3>🔄 High Correlations</h3>
                <div class="correlations-list">
                    ${topCorrelations.map(corr => {
                        const featureA = features.find(f => f.id === corr.featureAId);
                        const featureB = features.find(f => f.id === corr.featureBId);

                        if (!featureA || !featureB) return '';

                        return `
                            <div class="correlation-item">
                                <div class="correlation-features">
                                    <span>${featureA.name}</span>
                                    <span class="correlation-icon">↔️</span>
                                    <span>${featureB.name}</span>
                                </div>
                                <div class="correlation-score">
                                    ${(corr.correlationScore * 100).toFixed(0)}% similar
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
        `;
    },

    /**
     * Build recommendations section
     */
    buildRecommendationsSection(analysis, importance) {
        const recommendations = this.generateRecommendations(analysis, importance);

        return `
            <div class="insight-card recommendations-card">
                <h3>💡 Recommendations</h3>
                <div class="recommendations-list">
                    ${recommendations.map(rec => `
                        <div class="recommendation-item ${rec.priority}">
                            <div class="recommendation-icon">${rec.icon}</div>
                            <div class="recommendation-content">
                                <div class="recommendation-title">${rec.title}</div>
                                <div class="recommendation-description">${rec.description}</div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    },

    /**
     * Generate actionable recommendations
     * @param {Object} analysis - Analysis results
     * @param {Array} importance - Importance scores
     * @returns {Array} Recommendations
     */
    generateRecommendations(analysis, importance) {
        const recommendations = [];

        // Critical path recommendation
        if (analysis.criticalPath.criticalPath) {
            recommendations.push({
                icon: '🎯',
                priority: 'high',
                title: 'Focus on Critical Path',
                description: `Prioritize the ${analysis.criticalPath.criticalPath.length} features on the critical path to avoid project delays.`
            });
        }

        // Bottleneck recommendation
        if (analysis.bottlenecks.length > 0) {
            const severeBottlenecks = analysis.bottlenecks.filter(b => b.severity >= 10);
            if (severeBottlenecks.length > 0) {
                recommendations.push({
                    icon: '🚫',
                    priority: 'critical',
                    title: 'Resolve Bottlenecks',
                    description: `${severeBottlenecks.length} severe bottlenecks are blocking progress. Address these urgently.`
                });
            }
        }

        // Isolated features recommendation
        if (analysis.criticalPath.graphStats.isolatedNodeCount > 0) {
            recommendations.push({
                icon: '🔗',
                priority: 'medium',
                title: 'Connect Isolated Features',
                description: `${analysis.criticalPath.graphStats.isolatedNodeCount} features have no connections. Review their relevance or add dependencies.`
            });
        }

        // Circular dependencies recommendation
        if (analysis.circularDependencies.length > 0) {
            recommendations.push({
                icon: '⚠️',
                priority: 'high',
                title: 'Break Circular Dependencies',
                description: `${analysis.circularDependencies.length} circular dependencies detected. These can cause deadlocks.`
            });
        }

        // Low connectivity recommendation
        if (analysis.criticalPath.graphStats.density < 0.1) {
            recommendations.push({
                icon: '📊',
                priority: 'low',
                title: 'Low Connectivity',
                description: 'Consider adding more connections between related features to improve coordination.'
            });
        }

        return recommendations;
    },

    /**
     * Refresh insights
     */
    async refresh() {
        if (!this.currentWorkspaceId || !app) return;

        const container = document.getElementById('insightsContainer');
        if (!container) return;

        // Get current data
        const connections = await connectionManager.getWorkspaceConnections(this.currentWorkspaceId);
        const workspaceFeatures = app.features.filter(f => f.workspaceId === this.currentWorkspaceId);

        // Re-render
        await this.render('insightsContainer', this.currentWorkspaceId, workspaceFeatures, connections);
    },

    /**
     * Export insights as JSON
     * @returns {String} JSON string
     */
    exportInsights() {
        if (!this.analysisResults) return null;

        return JSON.stringify({
            workspaceId: this.currentWorkspaceId,
            exportedAt: new Date().toISOString(),
            analysis: this.analysisResults
        }, null, 2);
    }
};

// Export for testing
if (typeof module !== 'undefined' && module.exports) {
    module.exports = insightsPanel;
}
