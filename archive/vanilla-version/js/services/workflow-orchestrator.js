// Workflow Orchestrator Service
// Central workflow management service that coordinates stage transitions, validates stage requirements, and provides workflow-aware AI context

const workflowOrchestrator = {

    // ==================== STAGE DEFINITIONS ====================

    STAGES: {
        IDEATION: 'ideation',
        PLANNING: 'planning',
        EXECUTION: 'execution',
        COMPLETED: 'completed'
    },

    STAGE_LABELS: {
        'ideation': '💡 Ideation & Discovery',
        'planning': '📋 Planning & Execution Mapping',
        'execution': '⚙️ Execution',
        'completed': '✅ Completed'
    },

    STAGE_DESCRIPTIONS: {
        'ideation': 'Finding ideas, improving ideas, deep research, identifying risks and resources',
        'planning': 'Execution planning, project mapping, defining milestones and deliverables',
        'execution': 'Actual project tracking, progress monitoring, and implementation',
        'completed': 'Feature completed and deployed'
    },

    // Requirements for each stage (what must exist to advance)
    STAGE_REQUIREMENTS: {
        'ideation': {
            required: ['inspirationItems', 'risks'],
            optional: ['resources', 'prerequisites'],
            minItems: { inspirationItems: 2, risks: 1 }
        },
        'planning': {
            required: ['executionSteps', 'milestones'],
            optional: ['resources', 'prerequisites', 'acceptanceCriteria'],
            minItems: { executionSteps: 3, milestones: 2 }
        },
        'execution': {
            required: ['status', 'priority'],
            optional: ['actualStartDate', 'progressPercent', 'blockers'],
            minItems: {}
        }
    },

    // ==================== STAGE MANAGEMENT ====================

    /**
     * Get current stage for a feature
     * @param {Object} feature - Feature object
     * @returns {String} Current stage name
     */
    getCurrentStage(feature) {
        return feature.workflowStage || this.STAGES.IDEATION;
    },

    /**
     * Check if feature can advance to next stage
     * @param {Object} feature - Feature object
     * @returns {Object} { canAdvance: Boolean, missingRequirements: Array, completionPercent: Number }
     */
    checkStageReadiness(feature) {
        const currentStage = this.getCurrentStage(feature);
        if (currentStage === this.STAGES.COMPLETED) {
            return { canAdvance: false, missingRequirements: [], completionPercent: 100 };
        }

        const requirements = this.STAGE_REQUIREMENTS[currentStage];
        if (!requirements) {
            return { canAdvance: false, missingRequirements: ['Unknown stage'], completionPercent: 0 };
        }

        const missing = [];
        let totalChecks = 0;
        let passedChecks = 0;

        // Check required fields
        requirements.required.forEach(field => {
            totalChecks++;
            const fieldValue = feature[field];
            const minItems = requirements.minItems[field] || 0;

            if (!fieldValue) {
                missing.push(`Missing required: ${this.humanizeFieldName(field)}`);
            } else if (Array.isArray(fieldValue) && fieldValue.length < minItems) {
                missing.push(`${this.humanizeFieldName(field)}: need ${minItems}, have ${fieldValue.length}`);
            } else if (Array.isArray(fieldValue) && fieldValue.length >= minItems) {
                passedChecks++;
            } else if (!Array.isArray(fieldValue)) {
                // Non-array field (like status, priority)
                if (fieldValue) {
                    passedChecks++;
                } else {
                    missing.push(`Missing: ${this.humanizeFieldName(field)}`);
                }
            }
        });

        // Special check for ideation stage - purpose must be defined
        if (currentStage === 'ideation') {
            totalChecks++;
            if (feature.purpose && feature.purpose.trim() !== '') {
                passedChecks++;
            } else {
                missing.push('Define feature purpose');
            }
        }

        const completionPercent = totalChecks > 0 ? Math.round((passedChecks / totalChecks) * 100) : 0;
        const canAdvance = missing.length === 0;

        return { canAdvance, missingRequirements: missing, completionPercent };
    },

    /**
     * Advance feature to next stage
     * @param {Object} feature - Feature object
     * @param {String} advancedBy - User/system identifier
     * @param {String} notes - Optional transition notes
     * @param {Array} features - Features array (will be modified)
     * @returns {Object} { success: Boolean, newStage: String, message: String }
     */
    async advanceStage(feature, advancedBy = 'user', notes = '', features) {
        const currentStage = this.getCurrentStage(feature);

        // Check if can advance
        const readiness = this.checkStageReadiness(feature);
        if (!readiness.canAdvance) {
            return {
                success: false,
                message: `Cannot advance: ${readiness.missingRequirements.join(', ')}`,
                missingRequirements: readiness.missingRequirements
            };
        }

        // Determine next stage
        const stageOrder = [this.STAGES.IDEATION, this.STAGES.PLANNING, this.STAGES.EXECUTION, this.STAGES.COMPLETED];
        const currentIndex = stageOrder.indexOf(currentStage);

        if (currentIndex === -1 || currentIndex >= stageOrder.length - 1) {
            return { success: false, message: 'Already at final stage' };
        }

        const nextStage = stageOrder[currentIndex + 1];

        // Create history entry
        const historyEntry = {
            stage: nextStage,
            previousStage: currentStage,
            enteredAt: new Date().toISOString(),
            enteredBy: advancedBy,
            notes: notes || `Advanced from ${this.STAGE_LABELS[currentStage]} to ${this.STAGE_LABELS[nextStage]}`
        };

        // Update feature
        feature.workflowStage = nextStage;
        feature.stageHistory = feature.stageHistory || [];
        feature.stageHistory.push(historyEntry);
        feature.stageCompletionPercent = 0;
        feature.stageReadyToAdvance = false;
        feature.updatedAt = new Date().toISOString();

        // Save to storage
        if (typeof featureManager !== 'undefined' && featureManager.update) {
            await featureManager.update(feature.id, feature, features);
        }

        console.log(`✅ Advanced feature "${feature.name}" from ${currentStage} to ${nextStage}`);

        return {
            success: true,
            newStage: nextStage,
            message: `Advanced to ${this.STAGE_LABELS[nextStage]}`
        };
    },

    /**
     * Get features filtered by stage
     * @param {Array} features - All features
     * @param {String} stage - Stage to filter by
     * @param {String} workspaceId - Optional workspace filter
     * @returns {Array} Filtered features
     */
    getFeaturesByStage(features, stage, workspaceId = null) {
        let filtered = features.filter(f => this.getCurrentStage(f) === stage);
        if (workspaceId) {
            filtered = filtered.filter(f => f.workspaceId === workspaceId);
        }
        return filtered;
    },

    /**
     * Get stage statistics for a workspace
     * @param {Array} features - Features array
     * @param {String} workspaceId - Workspace ID
     * @returns {Object} Stage statistics
     */
    getStageStats(features, workspaceId) {
        const workspaceFeatures = features.filter(f => f.workspaceId === workspaceId);

        const stats = {
            total: workspaceFeatures.length,
            byStage: {
                [this.STAGES.IDEATION]: 0,
                [this.STAGES.PLANNING]: 0,
                [this.STAGES.EXECUTION]: 0,
                [this.STAGES.COMPLETED]: 0
            },
            readyToAdvance: 0,
            averageStageCompletion: 0
        };

        let totalCompletion = 0;

        workspaceFeatures.forEach(feature => {
            const stage = this.getCurrentStage(feature);
            if (stats.byStage[stage] !== undefined) {
                stats.byStage[stage]++;
            }

            const readiness = this.checkStageReadiness(feature);
            if (readiness.canAdvance) {
                stats.readyToAdvance++;
            }

            totalCompletion += readiness.completionPercent;
        });

        stats.averageStageCompletion = workspaceFeatures.length > 0
            ? Math.round(totalCompletion / workspaceFeatures.length)
            : 0;

        return stats;
    },

    // ==================== AI CONTEXT GENERATION ====================

    /**
     * Generate stage-specific AI context for prompts
     * @param {Object} feature - Feature object
     * @param {Object} workspace - Workspace object
     * @returns {String} Context string to prepend to AI prompts
     */
    buildStageContext(feature, workspace) {
        const currentStage = this.getCurrentStage(feature);
        const readiness = this.checkStageReadiness(feature);

        let context = `\n\n=== WORKFLOW CONTEXT ===\n`;
        context += `Current Stage: ${this.STAGE_LABELS[currentStage]}\n`;
        context += `Stage Description: ${this.STAGE_DESCRIPTIONS[currentStage]}\n`;
        context += `Stage Completion: ${readiness.completionPercent}%\n`;

        if (readiness.missingRequirements.length > 0) {
            context += `\nMissing Requirements:\n`;
            readiness.missingRequirements.forEach(req => {
                context += `- ${req}\n`;
            });
        }

        // Add stage-specific guidance
        context += `\nStage Guidance:\n`;
        switch (currentStage) {
            case this.STAGES.IDEATION:
                context += `- Focus on discovery, research, and understanding\n`;
                context += `- Find inspiration and similar implementations\n`;
                context += `- Identify risks, challenges, and prerequisites\n`;
                context += `- Don't focus on detailed execution plans yet\n`;
                break;
            case this.STAGES.PLANNING:
                context += `- Break down feature into executable steps\n`;
                context += `- Define clear milestones and deliverables\n`;
                context += `- Identify required resources and tools\n`;
                context += `- Create acceptance criteria\n`;
                break;
            case this.STAGES.EXECUTION:
                context += `- Track progress and update completion status\n`;
                context += `- Document blockers and mitigation strategies\n`;
                context += `- Monitor timeline and adjust as needed\n`;
                context += `- Prepare for deployment and release\n`;
                break;
        }

        return context;
    },

    /**
     * Get appropriate AI workflows for current stage
     * @param {String} stage - Current stage
     * @returns {Array} Array of { name, icon, action, description }
     */
    getStageWorkflows(stage) {
        const workflows = {
            'ideation': [
                { name: 'Find Inspiration', icon: '🔍', action: 'findInspiration', description: 'Search for similar features and implementations' },
                { name: 'Identify Risks', icon: '⚠️', action: 'identifyRisks', description: 'AI-powered risk assessment' },
                { name: 'Deep Research', icon: '📚', action: 'getPerplexityInsights', description: 'Comprehensive research with Perplexity' },
                { name: 'Suggest Prerequisites', icon: '🔗', action: 'suggestPrerequisites', description: 'Find dependencies and requirements' }
            ],
            'planning': [
                { name: 'Generate Execution Plan', icon: '📋', action: 'generateExecutionPlan', description: 'Create detailed step-by-step plan' },
                { name: 'Create Milestones', icon: '🎯', action: 'generateMilestones', description: 'Define project milestones' },
                { name: 'Suggest Resources', icon: '📦', action: 'suggestResources', description: 'Find tools, libraries, and documentation' },
                { name: 'Detect Links', icon: '🔗', action: 'analyzeBatchLinks', description: 'Find dependencies with other features' }
            ],
            'execution': [
                { name: 'Update Progress', icon: '📊', action: 'updateProgress', description: 'Track completion status' },
                { name: 'Analyze Blockers', icon: '🚧', action: 'analyzeBlockers', description: 'Get AI suggestions for blockers' },
                { name: 'Generate Report', icon: '📄', action: 'generateReport', description: 'Create status report' }
            ],
            'completed': []
        };

        return workflows[stage] || [];
    },

    // ==================== UI HELPERS ====================

    /**
     * Get CSS class for stage badge
     * @param {String} stage - Stage name
     * @returns {String} CSS class name
     */
    getStageClass(stage) {
        const classes = {
            'ideation': 'badge-ideation',
            'planning': 'badge-planning',
            'execution': 'badge-execution',
            'completed': 'badge-completed'
        };
        return classes[stage] || 'badge-default';
    },

    /**
     * Get stage progress bar color
     * @param {Number} percent - Completion percentage
     * @returns {String} Color hex code
     */
    getProgressColor(percent) {
        if (percent < 30) return '#ef4444'; // red
        if (percent < 70) return '#f59e0b'; // orange
        return '#10b981'; // green
    },

    /**
     * Humanize field name for display
     * @param {String} fieldName - Camel case field name
     * @returns {String} Human-readable name
     */
    humanizeFieldName(fieldName) {
        const names = {
            'inspirationItems': 'Inspiration & References',
            'risks': 'Risk Assessment',
            'resources': 'Resource Requirements',
            'prerequisites': 'Prerequisites',
            'executionSteps': 'Execution Steps',
            'milestones': 'Milestones',
            'acceptanceCriteria': 'Acceptance Criteria',
            'status': 'Status',
            'priority': 'Priority',
            'progressPercent': 'Progress Tracking'
        };
        return names[fieldName] || fieldName;
    },

    /**
     * Get stage icon emoji
     * @param {String} stage - Stage name
     * @returns {String} Emoji icon
     */
    getStageIcon(stage) {
        const icons = {
            'ideation': '💡',
            'planning': '📋',
            'execution': '⚙️',
            'completed': '✅'
        };
        return icons[stage] || '📌';
    },

    /**
     * Get next stage in progression
     * @param {String} currentStage - Current stage name
     * @returns {String|null} Next stage name or null if at end
     */
    getNextStage(currentStage) {
        const stageOrder = [this.STAGES.IDEATION, this.STAGES.PLANNING, this.STAGES.EXECUTION, this.STAGES.COMPLETED];
        const currentIndex = stageOrder.indexOf(currentStage);

        if (currentIndex === -1 || currentIndex >= stageOrder.length - 1) {
            return null;
        }

        return stageOrder[currentIndex + 1];
    },

    /**
     * Get previous stage in progression
     * @param {String} currentStage - Current stage name
     * @returns {String|null} Previous stage name or null if at beginning
     */
    getPreviousStage(currentStage) {
        const stageOrder = [this.STAGES.IDEATION, this.STAGES.PLANNING, this.STAGES.EXECUTION, this.STAGES.COMPLETED];
        const currentIndex = stageOrder.indexOf(currentStage);

        if (currentIndex <= 0) {
            return null;
        }

        return stageOrder[currentIndex - 1];
    },

    /**
     * Format stage history for display
     * @param {Array} stageHistory - Stage history array
     * @returns {Array} Formatted history entries
     */
    formatStageHistory(stageHistory) {
        if (!stageHistory || !Array.isArray(stageHistory)) {
            return [];
        }

        return stageHistory.map(entry => {
            const enteredAt = new Date(entry.enteredAt);
            const formattedDate = enteredAt.toLocaleDateString() + ' ' + enteredAt.toLocaleTimeString();

            return {
                stage: this.STAGE_LABELS[entry.stage] || entry.stage,
                previousStage: entry.previousStage ? this.STAGE_LABELS[entry.previousStage] : null,
                enteredAt: formattedDate,
                enteredBy: entry.enteredBy,
                notes: entry.notes,
                icon: this.getStageIcon(entry.stage)
            };
        });
    },

    /**
     * Calculate time spent in current stage
     * @param {Object} feature - Feature object
     * @returns {Object} { days: Number, hours: Number, minutes: Number }
     */
    getTimeInCurrentStage(feature) {
        const currentStage = this.getCurrentStage(feature);
        const stageHistory = feature.stageHistory || [];

        // Find the most recent entry for current stage
        const currentStageEntry = stageHistory
            .reverse()
            .find(entry => entry.stage === currentStage);

        if (!currentStageEntry) {
            return { days: 0, hours: 0, minutes: 0 };
        }

        const enteredAt = new Date(currentStageEntry.enteredAt);
        const now = new Date();
        const diff = now - enteredAt;

        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

        return { days, hours, minutes };
    }
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = workflowOrchestrator;
}
