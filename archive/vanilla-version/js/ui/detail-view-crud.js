/**
 * Detail View CRUD Module
 * Handles all CRUD operations for detail view components
 *
 * Extracted from index.html as part of Phase 5.4.3 refactoring
 * Lines extracted: ~680 lines
 * Methods: 30 CRUD operations
 */

const detailViewCrud = {
    // ==================== Contributor Management ====================

    /**
     * Render contributors list
     * @param {Object} app - App instance
     * @param {Array} contributors - Array of contributor names
     */
    renderContributors(app, contributors) {
        const container = document.getElementById('contributorsList');
        if (!container) return;

        if (contributors.length === 0) {
            container.innerHTML = '<p class="detail-text" style="margin: 0; font-size: 13px; color: var(--text-muted);">No contributors added</p>';
            return;
        }

        container.innerHTML = contributors.map(name => `
            <div class="tag-item">
                ${name}
                <button onclick="app.removeContributor('${name.replace(/'/g, "\\'")}')">×</button>
            </div>
        `).join('');
    },

    /**
     * Add a contributor to current feature
     * @param {Object} app - App instance
     */
    addContributor(app) {
        const input = document.getElementById('contributorsInput');
        if (!input || !input.value.trim()) return;

        const name = input.value.trim();
        const feature = app.features.find(f => f.id === app.currentFeatureId);
        if (!feature) return;

        // Initialize contributors array if needed
        if (!feature.contributors) feature.contributors = [];

        // Add if not already in list
        if (!feature.contributors.includes(name)) {
            feature.contributors.push(name);
            this.renderContributors(app, feature.contributors);
            app.saveData();
        }

        // Clear input
        input.value = '';
    },

    /**
     * Remove a contributor from current feature
     * @param {Object} app - App instance
     * @param {string} name - Contributor name to remove
     */
    removeContributor(app, name) {
        const feature = app.features.find(f => f.id === app.currentFeatureId);
        if (!feature) return;

        feature.contributors = (feature.contributors || []).filter(c => c !== name);
        this.renderContributors(app, feature.contributors);
        app.saveData();
    },

    // ==================== Stakeholder Management ====================

    /**
     * Render stakeholders list
     * @param {Object} app - App instance
     * @param {Array} stakeholders - Array of stakeholder names
     */
    renderStakeholders(app, stakeholders) {
        const container = document.getElementById('stakeholdersList');
        if (!container) return;

        if (stakeholders.length === 0) {
            container.innerHTML = '<p class="detail-text" style="margin: 0; font-size: 13px; color: var(--text-muted);">No stakeholders added</p>';
            return;
        }

        container.innerHTML = stakeholders.map(name => `
            <div class="tag-item">
                ${name}
                <button onclick="app.removeStakeholder('${name.replace(/'/g, "\\'")}')">×</button>
            </div>
        `).join('');
    },

    /**
     * Add a stakeholder to current feature
     * @param {Object} app - App instance
     */
    addStakeholder(app) {
        const input = document.getElementById('stakeholdersInput');
        if (!input || !input.value.trim()) return;

        const name = input.value.trim();
        const feature = app.features.find(f => f.id === app.currentFeatureId);
        if (!feature) return;

        // Initialize stakeholders array if needed
        if (!feature.stakeholders) feature.stakeholders = [];

        // Add if not already in list
        if (!feature.stakeholders.includes(name)) {
            feature.stakeholders.push(name);
            this.renderStakeholders(app, feature.stakeholders);
            app.saveData();
        }

        // Clear input
        input.value = '';
    },

    /**
     * Remove a stakeholder from current feature
     * @param {Object} app - App instance
     * @param {string} name - Stakeholder name to remove
     */
    removeStakeholder(app, name) {
        const feature = app.features.find(f => f.id === app.currentFeatureId);
        if (!feature) return;

        feature.stakeholders = (feature.stakeholders || []).filter(s => s !== name);
        this.renderStakeholders(app, feature.stakeholders);
        app.saveData();
    },

    // ==================== Execution Step Management ====================

    /**
     * Add an execution step to current feature
     * @param {Object} app - App instance
     */
    addExecutionStep(app) {
        if (!app.currentFeatureId) return;

        const title = prompt('Step title:');
        if (!title) return;

        const description = prompt('Step description:');
        const estimatedHours = prompt('Estimated hours (optional):');

        const feature = app.features.find(f => f.id === app.currentFeatureId);
        if (!feature) return;

        if (!feature.executionSteps) feature.executionSteps = [];

        const newStep = {
            id: Date.now().toString(),
            order: feature.executionSteps.length,
            title,
            description: description || '',
            estimatedHours: estimatedHours ? parseInt(estimatedHours) : null,
            completed: false
        };

        feature.executionSteps.push(newStep);
        app.saveData();
        app.renderExecutionTab(feature);
    },

    /**
     * Toggle execution step completion status
     * @param {Object} app - App instance
     * @param {string} featureId - Feature ID
     * @param {string} stepId - Step ID
     */
    toggleStepComplete(app, featureId, stepId) {
        const feature = app.features.find(f => f.id === featureId);
        if (!feature || !feature.executionSteps) return;

        const step = feature.executionSteps.find(s => s.id === stepId);
        if (step) {
            step.completed = !step.completed;
            app.saveData();
            app.renderExecutionTab(feature);
        }
    },

    /**
     * Delete an execution step
     * @param {Object} app - App instance
     * @param {string} featureId - Feature ID
     * @param {string} stepId - Step ID
     */
    async deleteExecutionStep(app, featureId, stepId) {
        const feature = app.features.find(f => f.id === featureId);
        if (!feature || !feature.executionSteps) return;

        const confirmed = await app.showConfirm({
            title: 'Delete Execution Step',
            message: 'Are you sure you want to delete this execution step?',
            confirmText: 'Delete',
            cancelText: 'Cancel',
            variant: 'danger',
            dontAskAgainKey: 'hideExecutionStepDeleteConfirm'
        });

        if (!confirmed) return;

        feature.executionSteps = feature.executionSteps.filter(s => s.id !== stepId);
        app.saveData();
        app.renderExecutionTab(feature);
    },

    // ==================== Planning Management ====================

    /**
     * Add a milestone to current feature
     * @param {Object} app - App instance
     */
    addMilestone(app) {
        if (!app.currentFeatureId) return;

        const name = prompt('Milestone name:');
        if (!name) return;

        const targetDate = prompt('Target date (YYYY-MM-DD):');

        const feature = app.features.find(f => f.id === app.currentFeatureId);
        if (!feature) return;

        if (!feature.planning) feature.planning = {};
        if (!feature.planning.milestones) feature.planning.milestones = [];

        feature.planning.milestones.push({
            id: Date.now().toString(),
            name,
            targetDate: targetDate || null,
            status: 'pending',
            dependencies: []
        });

        app.saveData();
        app.renderPlanningTab(feature);
    },

    /**
     * Add a risk to current feature
     * @param {Object} app - App instance
     */
    addRisk(app) {
        if (!app.currentFeatureId) return;

        const description = prompt('Risk description:');
        if (!description) return;

        const severity = prompt('Severity (low/medium/high):') || 'medium';
        const mitigation = prompt('Mitigation strategy (optional):');

        const feature = app.features.find(f => f.id === app.currentFeatureId);
        if (!feature) return;

        if (!feature.planning) feature.planning = {};
        if (!feature.planning.risks) feature.planning.risks = [];

        feature.planning.risks.push({
            id: Date.now().toString(),
            description,
            severity: severity.toLowerCase(),
            mitigation: mitigation || ''
        });

        app.saveData();
        app.renderPlanningTab(feature);
    },

    /**
     * Add a prerequisite to current feature
     * @param {Object} app - App instance
     */
    addPrerequisite(app) {
        if (!app.currentFeatureId) return;

        const prereq = prompt('Prerequisite:');
        if (!prereq) return;

        const feature = app.features.find(f => f.id === app.currentFeatureId);
        if (!feature) return;

        if (!feature.planning) feature.planning = {};
        if (!feature.planning.prerequisites) feature.planning.prerequisites = [];

        feature.planning.prerequisites.push(prereq);
        app.saveData();
        app.renderPlanningTab(feature);
    },

    // ==================== Inspiration Management ====================

    /**
     * Add an inspiration item to current feature
     * @param {Object} app - App instance
     */
    addInspiration(app) {
        if (!app.currentFeatureId) return;

        const title = prompt('Reference title:');
        if (!title) return;

        const url = prompt('URL:');
        if (!url) return;

        const description = prompt('Description (optional):');
        const type = prompt('Type (reference/competitor/example):') || 'reference';

        const feature = app.features.find(f => f.id === app.currentFeatureId);
        if (!feature) return;

        if (!feature.inspiration) feature.inspiration = [];

        feature.inspiration.push({
            id: Date.now().toString(),
            title,
            url,
            description: description || '',
            type: type.toLowerCase(),
            imageUrl: null
        });

        app.saveData();
        app.renderInspirationTab(feature);
    },

    /**
     * Delete an inspiration item
     * @param {Object} app - App instance
     * @param {string} featureId - Feature ID
     * @param {string} inspirationId - Inspiration ID
     */
    deleteInspiration(app, featureId, inspirationId) {
        const feature = app.features.find(f => f.id === featureId);
        if (!feature || !feature.inspiration) return;

        if (!confirm('Delete this inspiration source?')) return;

        feature.inspiration = feature.inspiration.filter(i => i.id !== inspirationId);
        app.saveData();
        app.renderInspirationTab(feature);
    },

    // ==================== Blocker Management ====================

    /**
     * Add a blocker to current feature
     * @param {Object} app - App instance
     */
    addBlocker(app) {
        if (!app.currentFeatureId) return;
        const feature = app.features.find(f => f.id === app.currentFeatureId);
        if (!feature) return;

        const title = prompt('Blocker title:');
        if (!title || !title.trim()) return;

        const description = prompt('Blocker description:');
        const severity = prompt('Severity (critical/high/medium/low):', 'medium');

        if (!feature.blockers) feature.blockers = [];

        const blocker = {
            id: Date.now().toString(),
            title: title.trim(),
            description: description?.trim() || '',
            severity: ['critical', 'high', 'medium', 'low'].includes(severity?.toLowerCase()) ? severity.toLowerCase() : 'medium',
            status: 'active',
            createdAt: new Date().toISOString()
        };

        feature.blockers.push(blocker);
        app.saveData();
        app.renderPlanningTab(feature);
        console.log('✅ Added blocker:', blocker.title);
    },

    /**
     * Toggle blocker status between active and resolved
     * @param {Object} app - App instance
     * @param {string} blockerId - Blocker ID
     */
    toggleBlockerStatus(app, blockerId) {
        if (!app.currentFeatureId) return;
        const feature = app.features.find(f => f.id === app.currentFeatureId);
        if (!feature || !feature.blockers) return;

        const blocker = feature.blockers.find(b => b.id === blockerId);
        if (!blocker) return;

        blocker.status = blocker.status === 'active' ? 'resolved' : 'active';
        app.saveData();
        app.renderPlanningTab(feature);
        console.log(`✅ Updated blocker status to: ${blocker.status}`);
    },

    /**
     * Delete a blocker
     * @param {Object} app - App instance
     * @param {string} blockerId - Blocker ID
     */
    deleteBlocker(app, blockerId) {
        if (!app.currentFeatureId) return;
        const feature = app.features.find(f => f.id === app.currentFeatureId);
        if (!feature || !feature.blockers) return;

        if (!confirm('Delete this blocker?')) return;

        feature.blockers = feature.blockers.filter(b => b.id !== blockerId);
        app.saveData();
        app.renderPlanningTab(feature);
        console.log('✅ Deleted blocker');
    },

    // ==================== Success Metrics Management ====================

    /**
     * Add a success metric to current feature
     * @param {Object} app - App instance
     */
    addSuccessMetric(app) {
        if (!app.currentFeatureId) return;
        const feature = app.features.find(f => f.id === app.currentFeatureId);
        if (!feature) return;

        const name = prompt('Metric name (e.g., "User Adoption Rate"):');
        if (!name || !name.trim()) return;

        const target = prompt('Target value:', '100');
        const unit = prompt('Unit (e.g., "%", "users", "ms"):', '%');

        if (!feature.successMetrics) feature.successMetrics = [];

        const metric = {
            id: Date.now().toString(),
            name: name.trim(),
            target: parseFloat(target) || 0,
            actual: 0,
            unit: unit?.trim() || '',
            createdAt: new Date().toISOString()
        };

        feature.successMetrics.push(metric);
        app.saveData();
        app.renderOverviewTab(feature);
        console.log('✅ Added success metric:', metric.name);
    },

    /**
     * Update actual value of a success metric
     * @param {Object} app - App instance
     * @param {string} metricId - Metric ID
     */
    updateMetricActual(app, metricId) {
        if (!app.currentFeatureId) return;
        const feature = app.features.find(f => f.id === app.currentFeatureId);
        if (!feature || !feature.successMetrics) return;

        const metric = feature.successMetrics.find(m => m.id === metricId);
        if (!metric) return;

        const actual = prompt(`Update actual value for "${metric.name}":`, metric.actual.toString());
        if (actual === null) return;

        metric.actual = parseFloat(actual) || 0;
        app.saveData();
        app.renderOverviewTab(feature);
        console.log(`✅ Updated metric "${metric.name}" to: ${metric.actual}`);
    },

    /**
     * Delete a success metric
     * @param {Object} app - App instance
     * @param {string} metricId - Metric ID
     */
    deleteSuccessMetric(app, metricId) {
        if (!app.currentFeatureId) return;
        const feature = app.features.find(f => f.id === app.currentFeatureId);
        if (!feature || !feature.successMetrics) return;

        if (!confirm('Delete this success metric?')) return;

        feature.successMetrics = feature.successMetrics.filter(m => m.id !== metricId);
        app.saveData();
        app.renderOverviewTab(feature);
        console.log('✅ Deleted success metric');
    },

    /**
     * Calculate progress percentage for a success metric
     * @param {Object} metric - Success metric object
     * @returns {number} Progress percentage (0-100)
     */
    calculateMetricProgress(metric) {
        if (metric.target === 0) return 0;
        const percent = (metric.actual / metric.target) * 100;
        return Math.min(Math.round(percent), 100);
    },

    // ==================== Acceptance Criteria Management ====================

    /**
     * Add acceptance criteria to current feature
     * @param {Object} app - App instance
     */
    addAcceptanceCriteria(app) {
        if (!app.currentFeatureId) return;
        const feature = app.features.find(f => f.id === app.currentFeatureId);
        if (!feature) return;

        const input = document.getElementById('acceptanceCriteriaInput');
        if (!input || !input.value.trim()) return;

        if (!feature.acceptanceCriteria) feature.acceptanceCriteria = [];

        const criteria = {
            id: Date.now().toString(),
            text: input.value.trim(),
            completed: false
        };

        feature.acceptanceCriteria.push(criteria);
        input.value = '';
        app.saveData();
        app.renderPlanningTab(feature);
        console.log('✅ Added acceptance criteria:', criteria.text);
    },

    /**
     * Toggle acceptance criteria completion status
     * @param {Object} app - App instance
     * @param {string} criteriaId - Criteria ID
     */
    toggleAcceptanceCriteria(app, criteriaId) {
        if (!app.currentFeatureId) return;
        const feature = app.features.find(f => f.id === app.currentFeatureId);
        if (!feature || !feature.acceptanceCriteria) return;

        const criteria = feature.acceptanceCriteria.find(c => c.id === criteriaId);
        if (!criteria) return;

        criteria.completed = !criteria.completed;
        app.saveData();
        app.renderPlanningTab(feature);
        console.log(`✅ Toggled acceptance criteria: ${criteria.completed ? 'completed' : 'incomplete'}`);
    },

    /**
     * Remove acceptance criteria
     * @param {Object} app - App instance
     * @param {string} criteriaId - Criteria ID
     */
    removeAcceptanceCriteria(app, criteriaId) {
        if (!app.currentFeatureId) return;
        const feature = app.features.find(f => f.id === app.currentFeatureId);
        if (!feature || !feature.acceptanceCriteria) return;

        feature.acceptanceCriteria = feature.acceptanceCriteria.filter(c => c.id !== criteriaId);
        app.saveData();
        app.renderPlanningTab(feature);
        console.log('✅ Removed acceptance criteria');
    },

    // ==================== Definition of Done Management ====================

    /**
     * Add definition of done item to current feature
     * @param {Object} app - App instance
     */
    addDefinitionOfDone(app) {
        if (!app.currentFeatureId) return;
        const feature = app.features.find(f => f.id === app.currentFeatureId);
        if (!feature) return;

        const input = document.getElementById('definitionOfDoneInput');
        if (!input || !input.value.trim()) return;

        if (!feature.definitionOfDone) feature.definitionOfDone = [];

        const dod = {
            id: Date.now().toString(),
            text: input.value.trim(),
            completed: false
        };

        feature.definitionOfDone.push(dod);
        input.value = '';
        app.saveData();
        app.renderPlanningTab(feature);
        console.log('✅ Added definition of done:', dod.text);
    },

    /**
     * Toggle definition of done completion status
     * @param {Object} app - App instance
     * @param {string} dodId - DoD ID
     */
    toggleDefinitionOfDone(app, dodId) {
        if (!app.currentFeatureId) return;
        const feature = app.features.find(f => f.id === app.currentFeatureId);
        if (!feature || !feature.definitionOfDone) return;

        const dod = feature.definitionOfDone.find(d => d.id === dodId);
        if (!dod) return;

        dod.completed = !dod.completed;
        app.saveData();
        app.renderPlanningTab(feature);
        console.log(`✅ Toggled definition of done: ${dod.completed ? 'completed' : 'incomplete'}`);
    },

    /**
     * Remove definition of done item
     * @param {Object} app - App instance
     * @param {string} dodId - DoD ID
     */
    removeDefinitionOfDone(app, dodId) {
        if (!app.currentFeatureId) return;
        const feature = app.features.find(f => f.id === app.currentFeatureId);
        if (!feature || !feature.definitionOfDone) return;

        feature.definitionOfDone = feature.definitionOfDone.filter(d => d.id !== dodId);
        app.saveData();
        app.renderPlanningTab(feature);
        console.log('✅ Removed definition of done');
    },

    // ==================== Tags Management ====================

    /**
     * Add a tag to current feature
     * @param {Object} app - App instance
     */
    addTag(app) {
        if (!app.currentFeatureId) return;
        const feature = app.features.find(f => f.id === app.currentFeatureId);
        if (!feature) return;

        const input = document.getElementById('tagsInput');
        if (!input || !input.value.trim()) return;

        if (!feature.tags) feature.tags = [];

        const tag = input.value.trim();

        // Prevent duplicates
        if (feature.tags.includes(tag)) {
            console.log('⚠️ Tag already exists');
            input.value = '';
            return;
        }

        feature.tags.push(tag);
        input.value = '';
        app.saveData();
        this.renderTags(app, feature.tags);
        console.log('✅ Added tag:', tag);
    },

    /**
     * Remove a tag from current feature
     * @param {Object} app - App instance
     * @param {string} tag - Tag to remove
     */
    removeTag(app, tag) {
        if (!app.currentFeatureId) return;
        const feature = app.features.find(f => f.id === app.currentFeatureId);
        if (!feature || !feature.tags) return;

        feature.tags = feature.tags.filter(t => t !== tag);
        app.saveData();
        this.renderTags(app, feature.tags);
        console.log('✅ Removed tag:', tag);
    },

    /**
     * Render tags list
     * @param {Object} app - App instance
     * @param {Array} tags - Array of tags
     */
    renderTags(app, tags) {
        const tagsList = document.getElementById('tagsList');
        if (!tagsList) return;

        if (!tags || tags.length === 0) {
            tagsList.innerHTML = '<span class="empty-state">No tags</span>';
            return;
        }

        tagsList.innerHTML = tags.map(tag => `
            <span class="tag-item">
                ${tag}
                <button class="tag-remove" onclick="app.removeTag('${tag}')" aria-label="Remove tag">×</button>
            </span>
        `).join('');
    }
};

// Export for testing
if (typeof module !== 'undefined' && module.exports) {
    module.exports = detailViewCrud;
}
