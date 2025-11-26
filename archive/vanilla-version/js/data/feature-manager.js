// Feature Manager - Feature CRUD operations and management
const featureManager = {
    /**
     * Create a new feature
     * @param {Object} featureData - Feature data (name, type, purpose, timelineItems, etc.)
     * @param {String} workspaceId - Workspace ID
     * @param {Array} features - Features array (will be modified)
     * @returns {Object} Created feature object
     */
    async create(featureData, workspaceId, features) {
        const feature = {
            id: Date.now().toString(),
            name: featureData.name,
            type: featureData.type,
            purpose: featureData.purpose || '',
            workspaceId: workspaceId,
            timelineItems: featureData.timelineItems || [],
            summary: featureData.summary || null,

            // Tracking fields
            status: featureData.status || 'Not Started',
            priority: featureData.priority || 'Medium',
            health: featureData.health || 'On Track',

            // Optional fields
            usp: featureData.usp || '',
            categories: featureData.categories || [],
            tags: featureData.tags || [],

            // Phase 2 fields
            estimatedStartDate: featureData.estimatedStartDate || null,
            estimatedEndDate: featureData.estimatedEndDate || null,
            actualStartDate: featureData.actualStartDate || null,
            actualEndDate: featureData.actualEndDate || null,
            delayReason: featureData.delayReason || '',

            // Phase 3 fields
            successMetrics: featureData.successMetrics || [],
            customerImpact: featureData.customerImpact || '',
            strategicAlignment: featureData.strategicAlignment || '',
            blockers: featureData.blockers || [],
            acceptanceCriteria: featureData.acceptanceCriteria || [],
            definitionOfDone: featureData.definitionOfDone || [],

            // AI enhancement fields
            executionSteps: featureData.executionSteps || [],
            resources: featureData.resources || null,
            milestones: featureData.milestones || [],
            prerequisites: featureData.prerequisites || [],
            risks: featureData.risks || [],
            inspirationItems: featureData.inspirationItems || [],

            // Metadata
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        features.push(feature);

        // Save to storage
        storageService.saveFeatures(features);

        // Save to Supabase
        if (supabaseService.isConnected) {
            await supabaseService.syncFeatures(features);
        }

        console.log('✅ Created feature:', feature.name);
        return feature;
    },

    /**
     * Update an existing feature
     * @param {String} featureId - Feature ID to update
     * @param {Object} updates - Properties to update
     * @param {Array} features - Features array
     * @returns {Boolean} Success status
     */
    async update(featureId, updates, features) {
        const index = features.findIndex(f => f.id === featureId);
        if (index === -1) {
            console.error('❌ Feature not found:', featureId);
            return false;
        }

        const feature = features[index];

        // Update properties
        Object.keys(updates).forEach(key => {
            if (key !== 'id' && key !== 'createdAt') {
                feature[key] = updates[key];
            }
        });

        feature.updatedAt = new Date().toISOString();

        // Save to storage
        storageService.saveFeatures(features);

        // Save to Supabase
        if (supabaseService.isConnected) {
            await supabaseService.syncFeatures(features);
        }

        console.log('✅ Updated feature:', feature.name);
        return true;
    },

    /**
     * Delete a feature
     * @param {String} featureId - Feature ID to delete
     * @param {Array} features - Features array (will be modified)
     * @returns {Boolean} Success status
     */
    async delete(featureId, features) {
        const index = features.findIndex(f => f.id === featureId);
        if (index === -1) {
            console.error('❌ Feature not found:', featureId);
            return false;
        }

        const feature = features[index];
        features.splice(index, 1);

        // Save to storage
        storageService.saveFeatures(features);

        // Save to Supabase
        if (supabaseService.isConnected) {
            await supabaseService.syncFeatures(features);
        }

        console.log('✅ Deleted feature:', feature.name);
        return true;
    },

    /**
     * Get feature by ID
     * @param {String} featureId - Feature ID
     * @param {Array} features - Features array
     * @returns {Object|null} Feature object or null
     */
    getById(featureId, features) {
        return features.find(f => f.id === featureId) || null;
    },

    /**
     * Get all features for a workspace
     * @param {String} workspaceId - Workspace ID
     * @param {Array} features - Features array
     * @returns {Array} Features belonging to workspace
     */
    getByWorkspace(workspaceId, features) {
        return features.filter(f => f.workspaceId === workspaceId);
    },

    /**
     * Get all features
     * @param {Array} features - Features array
     * @returns {Array} Copy of features array
     */
    getAll(features) {
        return [...features];
    },

    /**
     * Filter features by status
     * @param {String} status - Status to filter by
     * @param {Array} features - Features array
     * @returns {Array} Filtered features
     */
    filterByStatus(status, features) {
        return features.filter(f => f.status === status);
    },

    /**
     * Filter features by priority
     * @param {String} priority - Priority to filter by
     * @param {Array} features - Features array
     * @returns {Array} Filtered features
     */
    filterByPriority(priority, features) {
        return features.filter(f => f.priority === priority);
    },

    /**
     * Filter features by health
     * @param {String} health - Health status to filter by
     * @param {Array} features - Features array
     * @returns {Array} Filtered features
     */
    filterByHealth(health, features) {
        return features.filter(f => f.health === health);
    },

    /**
     * Search features by name or purpose
     * @param {String} searchTerm - Search term
     * @param {Array} features - Features array
     * @returns {Array} Matching features
     */
    search(searchTerm, features) {
        const term = searchTerm.toLowerCase().trim();
        if (!term) return [];

        return features.filter(f =>
            f.name.toLowerCase().includes(term) ||
            (f.purpose && f.purpose.toLowerCase().includes(term)) ||
            (f.usp && f.usp.toLowerCase().includes(term))
        );
    },

    /**
     * Sort features by various criteria
     * @param {Array} features - Features array
     * @param {String} sortBy - Sort criteria: 'name', 'created', 'updated', 'priority', 'status'
     * @param {String} direction - Sort direction: 'asc' or 'desc'
     * @returns {Array} Sorted features
     */
    sort(features, sortBy = 'created', direction = 'desc') {
        const sorted = [...features];

        const priorityOrder = { 'Critical': 4, 'High': 3, 'Medium': 2, 'Low': 1 };
        const statusOrder = { 'Not Started': 1, 'In Progress': 2, 'On Hold': 3, 'Completed': 4 };

        sorted.sort((a, b) => {
            let compareResult = 0;

            switch (sortBy) {
                case 'name':
                    compareResult = a.name.localeCompare(b.name);
                    break;

                case 'created':
                    compareResult = new Date(a.createdAt) - new Date(b.createdAt);
                    break;

                case 'updated':
                    compareResult = new Date(a.updatedAt) - new Date(b.updatedAt);
                    break;

                case 'priority':
                    compareResult = (priorityOrder[a.priority] || 0) - (priorityOrder[b.priority] || 0);
                    break;

                case 'status':
                    compareResult = (statusOrder[a.status] || 0) - (statusOrder[b.status] || 0);
                    break;

                default:
                    compareResult = 0;
            }

            return direction === 'desc' ? -compareResult : compareResult;
        });

        return sorted;
    },

    /**
     * Validate feature data
     * @param {Object} feature - Feature object to validate
     * @returns {Object} Validation result { valid: Boolean, errors: Array }
     */
    validate(feature) {
        const errors = [];

        if (!feature.name || feature.name.trim() === '') {
            errors.push('Feature name is required');
        }

        if (!feature.type || feature.type.trim() === '') {
            errors.push('Feature type is required');
        }

        if (!feature.workspaceId) {
            errors.push('Workspace ID is required');
        }

        if (!Array.isArray(feature.timelineItems)) {
            errors.push('Timeline items must be an array');
        } else if (feature.timelineItems.length === 0) {
            errors.push('At least one timeline item is required');
        }

        return {
            valid: errors.length === 0,
            errors: errors
        };
    },

    /**
     * Duplicate a feature (creates copy with new ID)
     * @param {String} featureId - Feature ID to duplicate
     * @param {Array} features - Features array (will be modified)
     * @returns {Object|null} New feature or null if source not found
     */
    async duplicate(featureId, features) {
        const source = features.find(f => f.id === featureId);
        if (!source) {
            console.error('❌ Feature not found:', featureId);
            return null;
        }

        const copy = JSON.parse(JSON.stringify(source)); // Deep clone
        copy.id = Date.now().toString();
        copy.name = `${source.name} (Copy)`;
        copy.createdAt = new Date().toISOString();
        copy.updatedAt = new Date().toISOString();
        copy.status = 'Not Started';
        copy.actualStartDate = null;
        copy.actualEndDate = null;

        features.push(copy);

        // Save to storage
        storageService.saveFeatures(features);

        // Save to Supabase
        if (supabaseService.isConnected) {
            await supabaseService.syncFeatures(features);
        }

        console.log('✅ Duplicated feature:', source.name, '→', copy.name);
        return copy;
    },

    /**
     * Get feature statistics
     * @param {Array} features - Features array
     * @returns {Object} Statistics object
     */
    getStats(features) {
        const stats = {
            total: features.length,
            byStatus: {
                'Not Started': 0,
                'In Progress': 0,
                'Completed': 0,
                'On Hold': 0
            },
            byPriority: {
                'Critical': 0,
                'High': 0,
                'Medium': 0,
                'Low': 0
            },
            byHealth: {
                'On Track': 0,
                'At Risk': 0,
                'Off Track': 0
            }
        };

        features.forEach(feature => {
            // Count by status
            if (stats.byStatus[feature.status] !== undefined) {
                stats.byStatus[feature.status]++;
            }

            // Count by priority
            if (stats.byPriority[feature.priority] !== undefined) {
                stats.byPriority[feature.priority]++;
            }

            // Count by health
            if (stats.byHealth[feature.health] !== undefined) {
                stats.byHealth[feature.health]++;
            }
        });

        return stats;
    },

    /**
     * Check if feature exists
     * @param {String} featureId - Feature ID
     * @param {Array} features - Features array
     * @returns {Boolean} True if feature exists
     */
    exists(featureId, features) {
        return features.some(f => f.id === featureId);
    },

    /**
     * Get features by tag
     * @param {String} tag - Tag to filter by
     * @param {Array} features - Features array
     * @returns {Array} Features with tag
     */
    getByTag(tag, features) {
        return features.filter(f =>
            f.tags && f.tags.includes(tag)
        );
    },

    /**
     * Get features with active blockers
     * @param {Array} features - Features array
     * @returns {Array} Features with active blockers
     */
    getWithActiveBlockers(features) {
        return features.filter(f =>
            f.blockers &&
            f.blockers.some(b => b.status === 'active')
        );
    },

    /**
     * Get overdue features
     * @param {Array} features - Features array
     * @returns {Array} Features past estimated end date
     */
    getOverdue(features) {
        const now = new Date();
        return features.filter(f =>
            f.estimatedEndDate &&
            new Date(f.estimatedEndDate) < now &&
            f.status !== 'Completed'
        );
    },

    // ==================== WORKFLOW MANAGEMENT ====================

    /**
     * Update workflow stage for a feature
     * @param {String} featureId - Feature ID
     * @param {String} newStage - New stage name (optional, auto-advances if null)
     * @param {String} advancedBy - User identifier
     * @param {String} notes - Optional notes
     * @param {Array} features - Features array
     * @returns {Object} { success: Boolean, newStage: String, message: String }
     */
    async updateWorkflowStage(featureId, newStage, advancedBy, notes, features) {
        const feature = this.getById(featureId, features);
        if (!feature) {
            console.error('❌ Feature not found:', featureId);
            return { success: false, message: 'Feature not found' };
        }

        // If newStage is null, use auto-advancement via workflowOrchestrator
        if (newStage === null && typeof workflowOrchestrator !== 'undefined') {
            return await workflowOrchestrator.advanceStage(feature, advancedBy, notes, features);
        }

        // Manual stage setting
        if (newStage) {
            const historyEntry = {
                stage: newStage,
                previousStage: feature.workflowStage || 'ideation',
                enteredAt: new Date().toISOString(),
                enteredBy: advancedBy,
                notes: notes || `Manual stage update to ${newStage}`
            };

            feature.workflowStage = newStage;
            feature.stageHistory = feature.stageHistory || [];
            feature.stageHistory.push(historyEntry);
            feature.updatedAt = new Date().toISOString();

            await this.update(featureId, feature, features);

            return { success: true, newStage, message: `Stage updated to ${newStage}` };
        }

        return { success: false, message: 'No stage specified' };
    },

    /**
     * Get features by workflow stage
     * @param {String} stage - Stage to filter by
     * @param {Array} features - Features array
     * @param {String} workspaceId - Optional workspace filter
     * @returns {Array} Features in specified stage
     */
    getByWorkflowStage(stage, features, workspaceId = null) {
        if (typeof workflowOrchestrator !== 'undefined') {
            return workflowOrchestrator.getFeaturesByStage(features, stage, workspaceId);
        }

        // Fallback if orchestrator not loaded
        let filtered = features.filter(f => (f.workflowStage || 'ideation') === stage);
        if (workspaceId) {
            filtered = filtered.filter(f => f.workspaceId === workspaceId);
        }
        return filtered;
    },

    /**
     * Check if feature can advance to next stage
     * @param {String} featureId - Feature ID
     * @param {Array} features - Features array
     * @returns {Object} Readiness check result
     */
    checkStageReadiness(featureId, features) {
        const feature = this.getById(featureId, features);
        if (!feature) {
            return { canAdvance: false, missingRequirements: ['Feature not found'], completionPercent: 0 };
        }

        if (typeof workflowOrchestrator !== 'undefined') {
            return workflowOrchestrator.checkStageReadiness(feature);
        }

        // Fallback if orchestrator not loaded
        return { canAdvance: false, missingRequirements: ['Workflow orchestrator not loaded'], completionPercent: 0 };
    },

    /**
     * Get workflow statistics for workspace
     * @param {String} workspaceId - Workspace ID
     * @param {Array} features - Features array
     * @returns {Object} Workflow statistics
     */
    getWorkflowStats(workspaceId, features) {
        if (typeof workflowOrchestrator !== 'undefined') {
            return workflowOrchestrator.getStageStats(features, workspaceId);
        }

        // Fallback if orchestrator not loaded
        const workspaceFeatures = features.filter(f => f.workspaceId === workspaceId);
        return {
            total: workspaceFeatures.length,
            byStage: {
                ideation: 0,
                planning: 0,
                execution: 0,
                completed: 0
            },
            readyToAdvance: 0,
            averageStageCompletion: 0
        };
    },

    /**
     * Initialize workflow for existing feature
     * Sets default workflow stage if not set
     * @param {String} featureId - Feature ID
     * @param {Array} features - Features array
     * @returns {Boolean} Success status
     */
    async initializeWorkflow(featureId, features) {
        const feature = this.getById(featureId, features);
        if (!feature) {
            console.error('❌ Feature not found:', featureId);
            return false;
        }

        // Skip if already initialized
        if (feature.workflowStage) {
            return true;
        }

        // Set default stage
        feature.workflowStage = 'ideation';
        feature.stageHistory = [{
            stage: 'ideation',
            enteredAt: feature.createdAt || new Date().toISOString(),
            enteredBy: 'system',
            notes: 'Initial workflow stage'
        }];
        feature.stageCompletionPercent = 0;
        feature.stageReadyToAdvance = false;

        await this.update(featureId, feature, features);

        console.log(`✅ Initialized workflow for feature: ${feature.name}`);
        return true;
    }
};
