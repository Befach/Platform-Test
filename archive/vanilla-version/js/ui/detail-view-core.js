/**
 * Detail View Core Module
 * Handles detail view navigation, rendering coordination, and tracking
 *
 * Extracted from index.html as part of Phase 5.4.1 refactoring
 * Lines extracted: ~200 lines
 * Methods: 8 core navigation and tracking methods
 */

const detailViewCore = {
    /**
     * Navigate to detail view for a specific feature
     * @param {Object} app - App instance
     * @param {string} featureId - Feature ID to display
     */
    showDetailView(app, featureId) {
        app.currentView = 'detail';
        // Reset enhancement mode if switching to a different feature
        if (app.currentFeatureId !== featureId) {
            app.aiFeatureEnhancementMode = false;
        }
        app.currentFeatureId = featureId;
        app.currentTab = 'overview';

        // Update URL hash for shareable links and browser history
        window.location.hash = `feature/${featureId}`;

        // Toggle views
        document.getElementById('tableView').classList.add('hidden');
        document.getElementById('detailView').classList.remove('hidden');

        // Render the detail content
        this.renderFeatureDetail(app, featureId);
    },

    /**
     * Return to table view from detail view
     * @param {Object} app - App instance
     */
    showTableView(app) {
        app.currentView = 'table';
        app.currentFeatureId = null;
        app.aiFeatureEnhancementMode = false; // Reset enhancement mode when leaving detail view

        // Clear URL hash
        window.location.hash = '';

        // Toggle views
        document.getElementById('detailView').classList.add('hidden');
        document.getElementById('tableView').classList.remove('hidden');

        // Refresh table
        app.renderTable();
    },

    /**
     * Switch between detail view tabs
     * @param {Object} app - App instance
     * @param {string} tabName - Tab name to switch to
     */
    switchDetailTab(app, tabName) {
        app.currentTab = tabName;

        // Update tab buttons
        document.querySelectorAll('.detail-tab').forEach(btn => {
            btn.classList.remove('active');
        });
        event.target.classList.add('active');

        // Update tab content
        document.querySelectorAll('.detail-tab-content').forEach(content => {
            content.classList.remove('active');
        });
        document.getElementById(`${tabName}Tab`).classList.add('active');
    },

    /**
     * Edit feature from detail view (transitions to table view and opens edit modal)
     * @param {Object} app - App instance
     */
    editFeatureFromDetail(app) {
        if (app.currentFeatureId) {
            this.showTableView(app);
            // Small delay to let the view transition complete
            setTimeout(() => {
                app.showEditModal(app.currentFeatureId);
            }, 100);
        }
    },

    /**
     * Main detail view rendering coordinator
     * Renders header, badges, tracking section, and all tabs
     * @param {Object} app - App instance
     * @param {string} featureId - Feature ID to render
     */
    renderFeatureDetail(app, featureId) {
        const feature = app.features.find(f => f.id === featureId);
        if (!feature) {
            this.showTableView(app);
            return;
        }

        // Render header
        document.getElementById('detailFeatureName').textContent = feature.name;

        // Render badges
        const badgesHTML = `
            <span class="badge badge-${feature.type.toLowerCase()}">${feature.type}</span>
            ${feature.aiCreated ? '<span class="ai-badge">AI Created</span>' : ''}
            ${feature.aiModified ? '<span class="ai-badge ai-modified">AI Modified</span>' : ''}
        `;
        document.getElementById('detailBadges').innerHTML = badgesHTML;

        // Render tracking section
        this.renderTrackingSection(app, feature);

        // Render all tabs
        app.renderOverviewTab(feature);
        app.renderExecutionTab(feature);
        app.renderResourcesTab(feature);
        app.renderPlanningTab(feature);
        app.renderInspirationTab(feature);

        // Apply workflow-based tab restrictions (if workflow mode is enabled)
        if (typeof workflowTabs !== 'undefined') {
            const workspace = app.workspaces.find(w => w.id === feature.workspaceId);
            workflowTabs.applyTabRestrictions(feature, workspace);
        }
    },

    /**
     * Render tracking section with all tracking fields
     * @param {Object} app - App instance
     * @param {Object} feature - Feature to render tracking for
     */
    renderTrackingSection(app, feature) {
        // Populate status dropdown
        const statusSelect = document.getElementById('featureStatus');
        if (statusSelect) statusSelect.value = feature.status || 'not_started';

        // Populate priority dropdown
        const prioritySelect = document.getElementById('featurePriority');
        if (prioritySelect) prioritySelect.value = feature.priority || 'medium';

        // Populate health dropdown
        const healthSelect = document.getElementById('featureHealth');
        if (healthSelect) healthSelect.value = feature.health || 'on_track';

        // Populate business value dropdown
        const businessValueSelect = document.getElementById('featureBusinessValue');
        if (businessValueSelect) businessValueSelect.value = feature.businessValue || 'medium';

        // Populate owner
        const ownerInput = document.getElementById('featureOwner');
        if (ownerInput) ownerInput.value = feature.owner || '';

        // Populate target release
        const targetReleaseInput = document.getElementById('featureTargetRelease');
        if (targetReleaseInput) targetReleaseInput.value = feature.targetRelease || '';

        // Populate dates
        const plannedStartInput = document.getElementById('featurePlannedStart');
        if (plannedStartInput) plannedStartInput.value = feature.plannedStartDate || '';

        const plannedEndInput = document.getElementById('featurePlannedEnd');
        if (plannedEndInput) plannedEndInput.value = feature.plannedEndDate || '';

        // Populate effort fields
        const storyPointsInput = document.getElementById('featureStoryPoints');
        if (storyPointsInput) storyPointsInput.value = feature.storyPoints || '';

        const estimatedHoursInput = document.getElementById('featureEstimatedHours');
        if (estimatedHoursInput) estimatedHoursInput.value = feature.estimatedHours || '';

        const actualHoursInput = document.getElementById('featureActualHours');
        if (actualHoursInput) actualHoursInput.value = feature.actualHours || '';

        const effortConfidenceSelect = document.getElementById('featureEffortConfidence');
        if (effortConfidenceSelect) effortConfidenceSelect.value = feature.effortConfidence || 'medium';

        // Calculate and display progress
        const progress = this.calculateProgress(feature);
        const progressPercent = document.getElementById('progressPercent');
        const progressFill = document.getElementById('progressFill');
        const progressSteps = document.getElementById('progressSteps');

        if (progressPercent) progressPercent.textContent = `${progress.percent}%`;
        if (progressFill) progressFill.style.width = `${progress.percent}%`;
        if (progressSteps) progressSteps.textContent = `${progress.completed} of ${progress.total} steps completed`;

        // Render contributors
        app.renderContributors(feature.contributors || []);

        // Render stakeholders
        app.renderStakeholders(feature.stakeholders || []);

        // Render tags
        app.renderTags(feature.tags || []);
    },

    /**
     * Calculate progress based on execution steps
     * @param {Object} feature - Feature to calculate progress for
     * @returns {Object} Progress object with total, completed, and percent
     */
    calculateProgress(feature) {
        const executionSteps = feature.executionSteps || [];
        const total = executionSteps.length;
        const completed = executionSteps.filter(step => step.completed).length;
        const percent = total > 0 ? Math.round((completed / total) * 100) : 0;

        return { total, completed, percent };
    },

    /**
     * Update a tracking field on the current feature
     * @param {Object} app - App instance
     * @param {string} field - Field name to update
     * @param {*} value - New value for the field
     */
    updateFeatureTracking(app, field, value) {
        if (!app.currentFeatureId) return;

        const feature = app.features.find(f => f.id === app.currentFeatureId);
        if (!feature) return;

        // Update the field
        feature[field] = value;

        // If updating progress manually, also update completedSteps and totalSteps
        if (field === 'progressPercent') {
            const progress = this.calculateProgress(feature);
            feature.completedSteps = progress.completed;
            feature.totalSteps = progress.total;
        }

        // Save data
        app.saveData();

        console.log(`✅ Updated ${field} to:`, value);
    }
};

// Export for testing
if (typeof module !== 'undefined' && module.exports) {
    module.exports = detailViewCore;
}
