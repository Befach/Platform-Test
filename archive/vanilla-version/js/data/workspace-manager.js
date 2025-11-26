// Workspace Manager - Workspace CRUD operations and management
const workspaceManager = {
    /**
     * Create a new workspace
     * @param {String} name - Workspace name
     * @param {String} description - Workspace description
     * @param {String} color - Workspace color (hex)
     * @param {String} icon - Workspace icon (emoji)
     * @param {Array} workspaces - Current workspaces array (will be modified)
     * @returns {Object} Created workspace object
     */
    async create(name, description, color, icon, workspaces) {
        const workspace = {
            id: Date.now().toString(),
            name: name,
            description: description || '',
            color: color || '#3b82f6',
            icon: icon || '📊',
            customInstructions: '',
            aiMemory: [],
            workflowModeEnabled: false,
            workflowConfig: {
                enableIdeationStage: true,
                enablePlanningStage: true,
                enableExecutionStage: true,
                autoAdvanceStages: false,
                showStageGuides: true,
                stageRequirements: {
                    ideation: ['inspirationItems', 'risks'],
                    planning: ['executionSteps', 'milestones'],
                    execution: ['status', 'progress']
                }
            },
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        workspaces.push(workspace);

        // Save to localStorage
        storageService.saveWorkspaces(workspaces);

        // Save to Supabase
        if (supabaseService.isConnected) {
            await supabaseService.createWorkspace(workspace);
        }

        console.log('✅ Created workspace:', workspace.name);
        return workspace;
    },

    /**
     * Update an existing workspace
     * @param {String} workspaceId - Workspace ID to update
     * @param {Object} updates - Properties to update
     * @param {Array} workspaces - Current workspaces array
     * @returns {Boolean} Success status
     */
    async update(workspaceId, updates, workspaces) {
        const workspace = workspaces.find(w => w.id === workspaceId);
        if (!workspace) {
            console.error('❌ Workspace not found:', workspaceId);
            return false;
        }

        // Update properties
        if (updates.name !== undefined) workspace.name = updates.name;
        if (updates.description !== undefined) workspace.description = updates.description;
        if (updates.color !== undefined) workspace.color = updates.color;
        if (updates.icon !== undefined) workspace.icon = updates.icon;
        if (updates.customInstructions !== undefined) workspace.customInstructions = updates.customInstructions;
        if (updates.aiMemory !== undefined) workspace.aiMemory = updates.aiMemory;
        if (updates.workflowModeEnabled !== undefined) workspace.workflowModeEnabled = updates.workflowModeEnabled;
        if (updates.workflowConfig !== undefined) workspace.workflowConfig = updates.workflowConfig;
        workspace.updatedAt = new Date().toISOString();

        // Save to localStorage
        storageService.saveWorkspaces(workspaces);

        // Save to Supabase
        if (supabaseService.isConnected) {
            await supabaseService.updateWorkspace(workspaceId, workspace);
        }

        console.log('✅ Updated workspace:', workspace.name);
        return true;
    },

    /**
     * Delete a workspace (with confirmation)
     * @param {String} workspaceId - Workspace ID to delete
     * @param {Array} workspaces - Current workspaces array (will be modified)
     * @param {Array} features - Current features array (will be modified to remove workspace features)
     * @param {Function} confirmFn - Optional confirmation function (defaults to window.confirm)
     * @returns {Boolean} Success status
     */
    async delete(workspaceId, workspaces, features, confirmFn = null) {
        const workspace = workspaces.find(w => w.id === workspaceId);
        if (!workspace) {
            console.error('❌ Workspace not found:', workspaceId);
            return false;
        }

        // Count features in this workspace
        const featureCount = features.filter(f => f.workspaceId === workspaceId).length;

        // Confirm deletion
        const confirm = confirmFn || window.confirm;
        const confirmed = confirm(
            `Delete workspace "${workspace.name}"?\n\n` +
            `This will permanently delete ${featureCount} feature(s) in this workspace.\n\n` +
            `This action cannot be undone.`
        );
        if (!confirmed) return false;

        // Delete from Supabase first
        if (supabaseService.isConnected) {
            await supabaseService.deleteWorkspace(workspaceId);
        }

        // Remove from local array
        const workspaceIndex = workspaces.findIndex(w => w.id === workspaceId);
        if (workspaceIndex !== -1) {
            workspaces.splice(workspaceIndex, 1);
        }

        // Remove all features in this workspace
        const featuresToRemove = features.filter(f => f.workspaceId === workspaceId);
        featuresToRemove.forEach(feature => {
            const index = features.indexOf(feature);
            if (index !== -1) {
                features.splice(index, 1);
            }
        });

        // Save to localStorage
        storageService.saveWorkspaces(workspaces);
        storageService.saveFeatures(features);

        console.log('✅ Deleted workspace:', workspace.name);
        return true;
    },

    /**
     * Get workspace by ID
     * @param {String} workspaceId - Workspace ID
     * @param {Array} workspaces - Current workspaces array
     * @returns {Object|null} Workspace object or null if not found
     */
    getById(workspaceId, workspaces) {
        return workspaces.find(w => w.id === workspaceId) || null;
    },

    /**
     * Get all workspaces
     * @param {Array} workspaces - Current workspaces array
     * @returns {Array} Array of all workspaces
     */
    getAll(workspaces) {
        return [...workspaces];
    },

    /**
     * Load features for a specific workspace
     * @param {String} workspaceId - Workspace ID
     * @param {Array} allFeatures - All features array
     * @returns {Array} Features belonging to workspace
     */
    async loadWorkspaceFeatures(workspaceId, allFeatures) {
        if (supabaseService.isConnected) {
            const workspaceFeatures = await supabaseService.loadWorkspaceFeatures(workspaceId);
            if (workspaceFeatures !== null) {
                return workspaceFeatures;
            }
        }

        // Fallback to filtering local features
        return allFeatures.filter(f => f.workspaceId === workspaceId);
    },

    /**
     * Count features in a workspace
     * @param {String} workspaceId - Workspace ID
     * @param {Array} features - Features array
     * @returns {Number} Feature count
     */
    countFeatures(workspaceId, features) {
        return features.filter(f => f.workspaceId === workspaceId).length;
    },

    /**
     * Validate workspace data
     * @param {Object} workspace - Workspace object to validate
     * @returns {Object} Validation result { valid: Boolean, errors: Array }
     */
    validate(workspace) {
        const errors = [];

        if (!workspace.name || workspace.name.trim() === '') {
            errors.push('Workspace name is required');
        }

        if (workspace.name && workspace.name.length > 100) {
            errors.push('Workspace name must be 100 characters or less');
        }

        if (workspace.color && !/^#[0-9A-Fa-f]{6}$/.test(workspace.color)) {
            errors.push('Workspace color must be a valid hex color (e.g., #3b82f6)');
        }

        return {
            valid: errors.length === 0,
            errors: errors
        };
    },

    /**
     * Check if workspace exists
     * @param {String} workspaceId - Workspace ID
     * @param {Array} workspaces - Workspaces array
     * @returns {Boolean} True if workspace exists
     */
    exists(workspaceId, workspaces) {
        return workspaces.some(w => w.id === workspaceId);
    },

    /**
     * Find workspaces by name (partial match)
     * @param {String} searchTerm - Search term
     * @param {Array} workspaces - Workspaces array
     * @returns {Array} Matching workspaces
     */
    search(searchTerm, workspaces) {
        const term = searchTerm.toLowerCase().trim();
        if (!term) return [];

        return workspaces.filter(w =>
            w.name.toLowerCase().includes(term) ||
            (w.description && w.description.toLowerCase().includes(term))
        );
    },

    /**
     * Get workspace statistics
     * @param {String} workspaceId - Workspace ID
     * @param {Array} features - Features array
     * @returns {Object} Statistics object
     */
    getStats(workspaceId, features) {
        const workspaceFeatures = features.filter(f => f.workspaceId === workspaceId);

        const stats = {
            totalFeatures: workspaceFeatures.length,
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
            }
        };

        workspaceFeatures.forEach(feature => {
            // Count by status
            const status = feature.status || 'Not Started';
            if (stats.byStatus[status] !== undefined) {
                stats.byStatus[status]++;
            }

            // Count by priority
            const priority = feature.priority || 'Medium';
            if (stats.byPriority[priority] !== undefined) {
                stats.byPriority[priority]++;
            }
        });

        return stats;
    },

    /**
     * Duplicate a workspace (creates copy with new ID)
     * @param {String} workspaceId - Workspace ID to duplicate
     * @param {Array} workspaces - Workspaces array (will be modified)
     * @param {Boolean} includeFeatures - Whether to duplicate features too
     * @returns {Object|null} New workspace or null if source not found
     */
    async duplicate(workspaceId, workspaces, includeFeatures = false) {
        const source = workspaces.find(w => w.id === workspaceId);
        if (!source) {
            console.error('❌ Workspace not found:', workspaceId);
            return null;
        }

        const copy = {
            id: Date.now().toString(),
            name: `${source.name} (Copy)`,
            description: source.description,
            color: source.color,
            icon: source.icon,
            customInstructions: source.customInstructions,
            aiMemory: [...source.aiMemory],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        workspaces.push(copy);

        // Save to localStorage
        storageService.saveWorkspaces(workspaces);

        // Save to Supabase
        if (supabaseService.isConnected) {
            await supabaseService.createWorkspace(copy);
        }

        console.log('✅ Duplicated workspace:', source.name, '→', copy.name);
        return copy;
    },

    /**
     * Archive/unarchive workspace
     * @param {String} workspaceId - Workspace ID
     * @param {Boolean} archived - Archive status
     * @param {Array} workspaces - Workspaces array
     * @returns {Boolean} Success status
     */
    async setArchived(workspaceId, archived, workspaces) {
        const workspace = workspaces.find(w => w.id === workspaceId);
        if (!workspace) {
            console.error('❌ Workspace not found:', workspaceId);
            return false;
        }

        workspace.archived = archived;
        workspace.updatedAt = new Date().toISOString();

        // Save to localStorage
        storageService.saveWorkspaces(workspaces);

        // Save to Supabase
        if (supabaseService.isConnected) {
            await supabaseService.updateWorkspace(workspaceId, workspace);
        }

        console.log(`✅ ${archived ? 'Archived' : 'Unarchived'} workspace:`, workspace.name);
        return true;
    },

    /**
     * Get active (non-archived) workspaces
     * @param {Array} workspaces - Workspaces array
     * @returns {Array} Active workspaces
     */
    getActive(workspaces) {
        return workspaces.filter(w => !w.archived);
    },

    /**
     * Get archived workspaces
     * @param {Array} workspaces - Workspaces array
     * @returns {Array} Archived workspaces
     */
    getArchived(workspaces) {
        return workspaces.filter(w => w.archived === true);
    },

    /**
     * Sort workspaces by various criteria
     * @param {Array} workspaces - Workspaces array
     * @param {String} sortBy - Sort criteria: 'name', 'created', 'updated', 'features'
     * @param {String} direction - Sort direction: 'asc' or 'desc'
     * @param {Array} features - Features array (needed for 'features' sort)
     * @returns {Array} Sorted workspaces
     */
    sort(workspaces, sortBy = 'name', direction = 'asc', features = []) {
        const sorted = [...workspaces];

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

                case 'features':
                    const aCount = this.countFeatures(a.id, features);
                    const bCount = this.countFeatures(b.id, features);
                    compareResult = aCount - bCount;
                    break;

                default:
                    compareResult = 0;
            }

            return direction === 'desc' ? -compareResult : compareResult;
        });

        return sorted;
    },

    // ==================== WORKFLOW CONFIGURATION ====================

    /**
     * Enable workflow mode for a workspace
     * @param {String} workspaceId - Workspace ID
     * @param {Array} workspaces - Workspaces array
     * @returns {Boolean} Success status
     */
    async enableWorkflowMode(workspaceId, workspaces) {
        const workspace = workspaces.find(w => w.id === workspaceId);
        if (!workspace) {
            console.error('❌ Workspace not found:', workspaceId);
            return false;
        }

        workspace.workflowModeEnabled = true;
        workspace.updatedAt = new Date().toISOString();

        // Initialize workflow config if not exists
        if (!workspace.workflowConfig) {
            workspace.workflowConfig = {
                enableIdeationStage: true,
                enablePlanningStage: true,
                enableExecutionStage: true,
                autoAdvanceStages: false,
                showStageGuides: true,
                stageRequirements: {
                    ideation: ['inspirationItems', 'risks'],
                    planning: ['executionSteps', 'milestones'],
                    execution: ['status', 'progress']
                }
            };
        }

        // Save to localStorage
        storageService.saveWorkspaces(workspaces);

        // Save to Supabase
        if (supabaseService.isConnected) {
            await supabaseService.updateWorkspace(workspaceId, workspace);
        }

        console.log('✅ Enabled workflow mode for workspace:', workspace.name);
        return true;
    },

    /**
     * Disable workflow mode for a workspace
     * @param {String} workspaceId - Workspace ID
     * @param {Array} workspaces - Workspaces array
     * @returns {Boolean} Success status
     */
    async disableWorkflowMode(workspaceId, workspaces) {
        const workspace = workspaces.find(w => w.id === workspaceId);
        if (!workspace) {
            console.error('❌ Workspace not found:', workspaceId);
            return false;
        }

        workspace.workflowModeEnabled = false;
        workspace.updatedAt = new Date().toISOString();

        // Save to localStorage
        storageService.saveWorkspaces(workspaces);

        // Save to Supabase
        if (supabaseService.isConnected) {
            await supabaseService.updateWorkspace(workspaceId, workspace);
        }

        console.log('✅ Disabled workflow mode for workspace:', workspace.name);
        return true;
    },

    /**
     * Update workflow configuration for a workspace
     * @param {String} workspaceId - Workspace ID
     * @param {Object} config - Workflow configuration updates
     * @param {Array} workspaces - Workspaces array
     * @returns {Boolean} Success status
     */
    async updateWorkflowConfig(workspaceId, config, workspaces) {
        const workspace = workspaces.find(w => w.id === workspaceId);
        if (!workspace) {
            console.error('❌ Workspace not found:', workspaceId);
            return false;
        }

        // Initialize config if doesn't exist
        if (!workspace.workflowConfig) {
            workspace.workflowConfig = {
                enableIdeationStage: true,
                enablePlanningStage: true,
                enableExecutionStage: true,
                autoAdvanceStages: false,
                showStageGuides: true,
                stageRequirements: {
                    ideation: ['inspirationItems', 'risks'],
                    planning: ['executionSteps', 'milestones'],
                    execution: ['status', 'progress']
                }
            };
        }

        // Update config properties
        if (config.enableIdeationStage !== undefined) {
            workspace.workflowConfig.enableIdeationStage = config.enableIdeationStage;
        }
        if (config.enablePlanningStage !== undefined) {
            workspace.workflowConfig.enablePlanningStage = config.enablePlanningStage;
        }
        if (config.enableExecutionStage !== undefined) {
            workspace.workflowConfig.enableExecutionStage = config.enableExecutionStage;
        }
        if (config.autoAdvanceStages !== undefined) {
            workspace.workflowConfig.autoAdvanceStages = config.autoAdvanceStages;
        }
        if (config.showStageGuides !== undefined) {
            workspace.workflowConfig.showStageGuides = config.showStageGuides;
        }
        if (config.stageRequirements !== undefined) {
            workspace.workflowConfig.stageRequirements = {
                ...workspace.workflowConfig.stageRequirements,
                ...config.stageRequirements
            };
        }

        workspace.updatedAt = new Date().toISOString();

        // Save to localStorage
        storageService.saveWorkspaces(workspaces);

        // Save to Supabase
        if (supabaseService.isConnected) {
            await supabaseService.updateWorkspace(workspaceId, workspace);
        }

        console.log('✅ Updated workflow config for workspace:', workspace.name);
        return true;
    },

    /**
     * Get workflow configuration for a workspace
     * @param {String} workspaceId - Workspace ID
     * @param {Array} workspaces - Workspaces array
     * @returns {Object|null} Workflow config or null if not found
     */
    getWorkflowConfig(workspaceId, workspaces) {
        const workspace = workspaces.find(w => w.id === workspaceId);
        if (!workspace) {
            console.error('❌ Workspace not found:', workspaceId);
            return null;
        }

        // Return default config if not set
        if (!workspace.workflowConfig) {
            return {
                enableIdeationStage: true,
                enablePlanningStage: true,
                enableExecutionStage: true,
                autoAdvanceStages: false,
                showStageGuides: true,
                stageRequirements: {
                    ideation: ['inspirationItems', 'risks'],
                    planning: ['executionSteps', 'milestones'],
                    execution: ['status', 'progress']
                }
            };
        }

        return workspace.workflowConfig;
    },

    /**
     * Check if workflow mode is enabled for a workspace
     * @param {String} workspaceId - Workspace ID
     * @param {Array} workspaces - Workspaces array
     * @returns {Boolean} True if workflow mode enabled
     */
    isWorkflowEnabled(workspaceId, workspaces) {
        const workspace = workspaces.find(w => w.id === workspaceId);
        if (!workspace) {
            return false;
        }

        return workspace.workflowModeEnabled === true;
    }
};
