/**
 * Importance Service
 * Calculates feature importance scores based on multiple factors
 *
 * Purpose: Rank features by importance using weighted algorithm
 * Integration: Works with Supabase feature_importance_scores table
 */

const importanceService = {
    /**
     * Default weights for importance calculation
     * Sum should equal 1.0
     */
    DEFAULT_WEIGHTS: {
        dependency: 0.20,      // How many features depend on this
        blocking: 0.15,        // How many features this blocks
        connection: 0.15,      // Total connections
        businessValue: 0.20,   // Business value rating
        priority: 0.15,        // Priority rating
        workflow: 0.10,        // Workflow stage position
        complexity: 0.05       // Difficulty/effort
    },

    /**
     * Calculate importance score for a single feature
     * @param {String} featureId - Feature ID
     * @param {Object} features - All features array
     * @param {Array} connections - All connections array
     * @param {Object} weights - Custom weights (optional)
     * @returns {Promise<Object>} Score breakdown
     */
    async calculateFeatureImportance(featureId, features, connections, weights = null) {
        const feature = features.find(f => f.id === featureId);
        if (!feature) {
            throw new Error(`Feature not found: ${featureId}`);
        }

        const w = weights || this.DEFAULT_WEIGHTS;

        // Calculate component scores
        const dependencyScore = this.calculateDependencyScore(featureId, connections);
        const blockingScore = this.calculateBlockingScore(featureId, connections);
        const connectionScore = this.calculateConnectionScore(featureId, connections);
        const businessValueScore = this.calculateBusinessValueScore(feature);
        const priorityScore = this.calculatePriorityScore(feature);
        const workflowScore = this.calculateWorkflowScore(feature);
        const complexityScore = this.calculateComplexityScore(feature);

        // Calculate weighted overall score
        const overallScore =
            (dependencyScore * w.dependency) +
            (blockingScore * w.blocking) +
            (connectionScore * w.connection) +
            (businessValueScore * w.businessValue) +
            (priorityScore * w.priority) +
            (workflowScore * w.workflow) +
            (complexityScore * w.complexity);

        // Get connection metrics
        const metrics = this.getConnectionMetrics(featureId, connections);

        const scoreBreakdown = {
            featureId,
            overallScore: Math.round(overallScore * 100) / 100,
            componentScores: {
                dependency: Math.round(dependencyScore * 100) / 100,
                blocking: Math.round(blockingScore * 100) / 100,
                connection: Math.round(connectionScore * 100) / 100,
                businessValue: Math.round(businessValueScore * 100) / 100,
                priority: Math.round(priorityScore * 100) / 100,
                workflow: Math.round(workflowScore * 100) / 100,
                complexity: Math.round(complexityScore * 100) / 100
            },
            metrics: {
                incomingDependencies: metrics.incomingDeps,
                outgoingDependencies: metrics.outgoingDeps,
                totalConnections: metrics.totalConnections,
                blockingCount: metrics.blockingCount
            },
            calculatedAt: new Date().toISOString(),
            weights: w
        };

        // Save to Supabase
        await this.saveImportanceScore(scoreBreakdown, feature.workspaceId);

        return scoreBreakdown;
    },

    /**
     * Calculate dependency score (0-100)
     * Based on how many features depend on this one
     */
    calculateDependencyScore(featureId, connections) {
        const incomingDeps = connections.filter(c =>
            c.targetFeatureId === featureId &&
            c.connectionType === 'dependency' &&
            c.status === 'active'
        ).length;

        // Score: 20 points per incoming dependency, max 100
        return Math.min(100, incomingDeps * 20);
    },

    /**
     * Calculate blocking score (0-100)
     * Based on how many features this one blocks
     */
    calculateBlockingScore(featureId, connections) {
        const blockingCount = connections.filter(c =>
            c.sourceFeatureId === featureId &&
            c.connectionType === 'blocks' &&
            c.status === 'active'
        ).length;

        // Score: 25 points per blocked feature, max 100
        return Math.min(100, blockingCount * 25);
    },

    /**
     * Calculate connection score (0-100)
     * Based on total number of connections
     */
    calculateConnectionScore(featureId, connections) {
        const totalConnections = connections.filter(c =>
            (c.sourceFeatureId === featureId || c.targetFeatureId === featureId) &&
            c.status === 'active'
        ).length;

        // Score: 10 points per connection, max 100
        return Math.min(100, totalConnections * 10);
    },

    /**
     * Calculate business value score (0-100)
     */
    calculateBusinessValueScore(feature) {
        const businessValue = feature.businessValue || 'medium';

        const scores = {
            critical: 100,
            high: 75,
            medium: 50,
            low: 25
        };

        return scores[businessValue] || 50;
    },

    /**
     * Calculate priority score (0-100)
     */
    calculatePriorityScore(feature) {
        const priority = feature.priority || 'medium';

        const scores = {
            critical: 100,
            high: 75,
            medium: 50,
            low: 25
        };

        return scores[priority] || 50;
    },

    /**
     * Calculate workflow score (0-100)
     * Earlier stages get higher scores (need more prioritization)
     */
    calculateWorkflowScore(feature) {
        const workflowStage = feature.workflowStage || 'ideation';

        const scores = {
            ideation: 100,      // Early stage - highest priority
            planning: 75,       // Planning stage
            execution: 50,      // In progress
            completed: 25       // Done - lowest priority
        };

        return scores[workflowStage] || 50;
    },

    /**
     * Calculate complexity score (0-100)
     * Easier features get higher scores (can be done sooner)
     */
    calculateComplexityScore(feature) {
        // Try to get difficulty from timeline items
        let difficulty = 'Medium';

        if (feature.timelineItems && feature.timelineItems.length > 0) {
            const firstItem = feature.timelineItems[0];
            difficulty = firstItem.difficulty || 'Medium';
        }

        const scores = {
            Easy: 75,
            Medium: 50,
            Hard: 25
        };

        return scores[difficulty] || 50;
    },

    /**
     * Get connection metrics for a feature
     */
    getConnectionMetrics(featureId, connections) {
        const activeConnections = connections.filter(c => c.status === 'active');

        return {
            incomingDeps: activeConnections.filter(c =>
                c.targetFeatureId === featureId && c.connectionType === 'dependency'
            ).length,
            outgoingDeps: activeConnections.filter(c =>
                c.sourceFeatureId === featureId && c.connectionType === 'dependency'
            ).length,
            blockingCount: activeConnections.filter(c =>
                c.sourceFeatureId === featureId && c.connectionType === 'blocks'
            ).length,
            totalConnections: activeConnections.filter(c =>
                c.sourceFeatureId === featureId || c.targetFeatureId === featureId
            ).length
        };
    },

    /**
     * Calculate importance for all features in a workspace
     * @param {String} workspaceId - Workspace ID
     * @param {Array} features - Features array
     * @param {Object} weights - Custom weights (optional)
     * @returns {Promise<Array>} Array of score breakdowns
     */
    async calculateWorkspaceImportance(workspaceId, features, weights = null) {
        // Get all connections for workspace
        const connections = await connectionManager.getWorkspaceConnections(workspaceId);

        // Filter features for this workspace
        const workspaceFeatures = features.filter(f => f.workspaceId === workspaceId);

        // Calculate scores for each feature
        const scores = [];
        for (const feature of workspaceFeatures) {
            try {
                const score = await this.calculateFeatureImportance(
                    feature.id,
                    features,
                    connections,
                    weights
                );
                scores.push(score);
            } catch (error) {
                console.error(`❌ Error calculating importance for ${feature.id}:`, error);
            }
        }

        // Sort by overall score
        scores.sort((a, b) => b.overallScore - a.overallScore);

        // Add rankings
        scores.forEach((score, index) => {
            score.workspaceRank = index + 1;
            score.percentile = Math.round(((scores.length - index) / scores.length) * 100);
        });

        // Update rankings in database
        await this.updateRankings(scores);

        console.log(`✅ Calculated importance for ${scores.length} features in workspace ${workspaceId}`);

        return scores;
    },

    /**
     * Save importance score to Supabase
     * @param {Object} scoreBreakdown - Score breakdown
     * @param {String} workspaceId - Workspace ID
     */
    async saveImportanceScore(scoreBreakdown, workspaceId) {
        if (typeof supabaseService === 'undefined' || !supabaseService.isConnected) {
            return;
        }

        try {
            const record = {
                id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
                feature_id: scoreBreakdown.featureId,
                workspace_id: workspaceId,
                user_id: 'default',
                overall_score: scoreBreakdown.overallScore,
                dependency_score: scoreBreakdown.componentScores.dependency,
                blocking_score: scoreBreakdown.componentScores.blocking,
                connection_score: scoreBreakdown.componentScores.connection,
                business_value_score: scoreBreakdown.componentScores.businessValue,
                priority_score: scoreBreakdown.componentScores.priority,
                workflow_score: scoreBreakdown.componentScores.workflow,
                complexity_score: scoreBreakdown.componentScores.complexity,
                incoming_dependency_count: scoreBreakdown.metrics.incomingDependencies,
                outgoing_dependency_count: scoreBreakdown.metrics.outgoingDependencies,
                total_connection_count: scoreBreakdown.metrics.totalConnections,
                blocking_count: scoreBreakdown.metrics.blockingCount,
                calculation_weights: scoreBreakdown.weights,
                calculated_at: scoreBreakdown.calculatedAt,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            };

            // Upsert (insert or update)
            const { error } = await supabaseService.client
                .from('feature_importance_scores')
                .upsert(record, {
                    onConflict: 'feature_id'
                });

            if (error) throw error;

        } catch (error) {
            console.error('❌ Error saving importance score:', error);
        }
    },

    /**
     * Update rankings in database
     * @param {Array} scores - Sorted scores with rankings
     */
    async updateRankings(scores) {
        if (typeof supabaseService === 'undefined' || !supabaseService.isConnected) {
            return;
        }

        try {
            for (const score of scores) {
                await supabaseService.client
                    .from('feature_importance_scores')
                    .update({
                        workspace_rank: score.workspaceRank,
                        percentile: score.percentile,
                        updated_at: new Date().toISOString()
                    })
                    .eq('feature_id', score.featureId);
            }
        } catch (error) {
            console.error('❌ Error updating rankings:', error);
        }
    },

    /**
     * Get top N most important features
     * @param {String} workspaceId - Workspace ID
     * @param {Number} limit - Number of features to return
     * @returns {Promise<Array>} Top features with scores
     */
    async getTopFeatures(workspaceId, limit = 10) {
        if (typeof supabaseService === 'undefined' || !supabaseService.isConnected) {
            return [];
        }

        try {
            const { data, error } = await supabaseService.client
                .from('feature_importance_scores')
                .select('*')
                .eq('workspace_id', workspaceId)
                .order('overall_score', { ascending: false })
                .limit(limit);

            if (error) throw error;

            return data.map(score => this.mapFromDatabase(score));
        } catch (error) {
            console.error('❌ Error fetching top features:', error);
            return [];
        }
    },

    /**
     * Get importance score for a feature
     * @param {String} featureId - Feature ID
     * @returns {Promise<Object|null>} Score breakdown
     */
    async getFeatureScore(featureId) {
        if (typeof supabaseService === 'undefined' || !supabaseService.isConnected) {
            return null;
        }

        try {
            const { data, error } = await supabaseService.client
                .from('feature_importance_scores')
                .select('*')
                .eq('feature_id', featureId)
                .single();

            if (error) throw error;

            return this.mapFromDatabase(data);
        } catch (error) {
            console.error('❌ Error fetching feature score:', error);
            return null;
        }
    },

    /**
     * Map database record to application format
     */
    mapFromDatabase(dbRecord) {
        return {
            featureId: dbRecord.feature_id,
            overallScore: dbRecord.overall_score,
            componentScores: {
                dependency: dbRecord.dependency_score,
                blocking: dbRecord.blocking_score,
                connection: dbRecord.connection_score,
                businessValue: dbRecord.business_value_score,
                priority: dbRecord.priority_score,
                workflow: dbRecord.workflow_score,
                complexity: dbRecord.complexity_score
            },
            metrics: {
                incomingDependencies: dbRecord.incoming_dependency_count,
                outgoingDependencies: dbRecord.outgoing_dependency_count,
                totalConnections: dbRecord.total_connection_count,
                blockingCount: dbRecord.blocking_count
            },
            workspaceRank: dbRecord.workspace_rank,
            percentile: dbRecord.percentile,
            isOnCriticalPath: dbRecord.is_on_critical_path,
            isBottleneck: dbRecord.is_bottleneck,
            calculatedAt: dbRecord.calculated_at
        };
    },

    /**
     * Mark feature as on critical path
     * @param {String} featureId - Feature ID
     * @param {Boolean} isOnPath - True if on critical path
     */
    async markCriticalPath(featureId, isOnPath) {
        if (typeof supabaseService === 'undefined' || !supabaseService.isConnected) {
            return;
        }

        try {
            await supabaseService.client
                .from('feature_importance_scores')
                .update({
                    is_on_critical_path: isOnPath,
                    updated_at: new Date().toISOString()
                })
                .eq('feature_id', featureId);
        } catch (error) {
            console.error('❌ Error marking critical path:', error);
        }
    },

    /**
     * Mark feature as bottleneck
     * @param {String} featureId - Feature ID
     * @param {Boolean} isBottleneck - True if bottleneck
     */
    async markBottleneck(featureId, isBottleneck) {
        if (typeof supabaseService === 'undefined' || !supabaseService.isConnected) {
            return;
        }

        try {
            await supabaseService.client
                .from('feature_importance_scores')
                .update({
                    is_bottleneck: isBottleneck,
                    updated_at: new Date().toISOString()
                })
                .eq('feature_id', featureId);
        } catch (error) {
            console.error('❌ Error marking bottleneck:', error);
        }
    }
};

// Export for testing
if (typeof module !== 'undefined' && module.exports) {
    module.exports = importanceService;
}
