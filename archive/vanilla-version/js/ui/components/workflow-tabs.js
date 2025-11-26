/**
 * Workflow Tabs Module
 * Handles progressive disclosure of detail view tabs based on workflow stage
 *
 * Purpose: Lock/unlock tabs as features progress through workflow stages
 * Integration: Called from detail-view-core.js when rendering feature details
 */

const workflowTabs = {
    /**
     * Tab availability configuration by workflow stage
     * Defines which tabs are available at each stage
     */
    STAGE_TAB_CONFIG: {
        ideation: {
            available: ['overview', 'inspiration'],
            message: 'Complete ideation requirements to unlock Planning'
        },
        planning: {
            available: ['overview', 'inspiration', 'planning'],
            message: 'Complete planning requirements to unlock Execution'
        },
        execution: {
            available: ['overview', 'inspiration', 'planning', 'execution', 'resources'],
            message: 'All tabs available during execution'
        },
        completed: {
            available: ['overview', 'inspiration', 'planning', 'execution', 'resources'],
            message: 'All tabs available'
        }
    },

    /**
     * Tab display names and icons
     */
    TAB_INFO: {
        overview: { label: 'Overview', icon: '📋' },
        inspiration: { label: 'Inspiration', icon: '💡' },
        planning: { label: 'Planning', icon: '🎯' },
        execution: { label: 'Execution Guide', icon: '⚙️' },
        resources: { label: 'Resources', icon: '🛠️' }
    },

    /**
     * Apply workflow-based tab restrictions to the detail view
     * @param {Object} feature - Feature being displayed
     * @param {Object} workspace - Current workspace
     */
    applyTabRestrictions(feature, workspace) {
        // If workflow mode is disabled, show all tabs
        if (!workspace || !workspace.workflowModeEnabled) {
            this.unlockAllTabs();
            return;
        }

        // Get current workflow stage
        const currentStage = feature.workflowStage || 'ideation';
        const stageConfig = this.STAGE_TAB_CONFIG[currentStage];

        if (!stageConfig) {
            this.unlockAllTabs();
            return;
        }

        // Lock/unlock each tab based on stage configuration
        const allTabs = ['overview', 'inspiration', 'planning', 'execution', 'resources'];

        allTabs.forEach(tabName => {
            const isAvailable = stageConfig.available.includes(tabName);

            if (isAvailable) {
                this.unlockTab(tabName);
            } else {
                this.lockTab(tabName, currentStage);
            }
        });
    },

    /**
     * Lock a specific tab with visual indicators
     * @param {string} tabName - Tab to lock (overview, inspiration, planning, execution, resources)
     * @param {string} currentStage - Current workflow stage
     */
    lockTab(tabName, currentStage) {
        // Find tab button
        const tabButton = this.findTabButton(tabName);
        if (!tabButton) return;

        // Add locked state
        tabButton.classList.add('tab-locked');
        tabButton.disabled = true;

        // Get next stage info
        const nextStage = this.getNextStageForTab(tabName, currentStage);
        const nextStageName = workflowOrchestrator ? workflowOrchestrator.STAGE_LABELS[nextStage] : nextStage;

        // Add lock icon and update text
        const tabInfo = this.TAB_INFO[tabName];
        const originalText = tabButton.textContent;

        // Only update if not already showing lock icon
        if (!tabButton.dataset.originalText) {
            tabButton.dataset.originalText = originalText;
            tabButton.innerHTML = `
                <span class="tab-lock-icon">🔒</span>
                <span>${tabInfo.label}</span>
            `;
        }

        // Add tooltip
        tabButton.title = `Available in ${nextStageName} stage`;

        // Prevent clicks
        tabButton.onclick = (e) => {
            e.preventDefault();
            this.showLockedTabMessage(tabName, nextStageName);
        };
    },

    /**
     * Unlock a specific tab
     * @param {string} tabName - Tab to unlock
     */
    unlockTab(tabName) {
        const tabButton = this.findTabButton(tabName);
        if (!tabButton) return;

        // Remove locked state
        tabButton.classList.remove('tab-locked');
        tabButton.disabled = false;

        // Restore original text if locked before
        if (tabButton.dataset.originalText) {
            const tabInfo = this.TAB_INFO[tabName];
            tabButton.innerHTML = tabInfo.label;
            delete tabButton.dataset.originalText;
        }

        // Remove tooltip
        tabButton.title = '';

        // Restore normal click handler
        tabButton.onclick = () => app.switchDetailTab(tabName);
    },

    /**
     * Unlock all tabs (used when workflow mode is disabled)
     */
    unlockAllTabs() {
        const allTabs = ['overview', 'inspiration', 'planning', 'execution', 'resources'];
        allTabs.forEach(tabName => this.unlockTab(tabName));
    },

    /**
     * Find tab button element by tab name
     * @param {string} tabName - Tab name
     * @returns {HTMLElement|null} Tab button element
     */
    findTabButton(tabName) {
        // Get all tab buttons
        const tabButtons = document.querySelectorAll('.detail-tab');

        // Map tab names to button text patterns
        const patterns = {
            overview: /overview/i,
            inspiration: /inspiration/i,
            planning: /planning/i,
            execution: /execution/i,
            resources: /resources/i
        };

        const pattern = patterns[tabName];
        if (!pattern) return null;

        // Find matching button
        for (const button of tabButtons) {
            const onclick = button.getAttribute('onclick');
            if (onclick && onclick.includes(`'${tabName}'`)) {
                return button;
            }
        }

        return null;
    },

    /**
     * Determine which stage unlocks a given tab
     * @param {string} tabName - Tab name
     * @param {string} currentStage - Current stage
     * @returns {string} Stage that unlocks this tab
     */
    getNextStageForTab(tabName, currentStage) {
        const stageOrder = ['ideation', 'planning', 'execution', 'completed'];

        // Find which stage first includes this tab
        for (const stage of stageOrder) {
            const config = this.STAGE_TAB_CONFIG[stage];
            if (config && config.available.includes(tabName)) {
                return stage;
            }
        }

        return 'completed';
    },

    /**
     * Show a friendly message when user tries to access a locked tab
     * @param {string} tabName - Tab that was clicked
     * @param {string} nextStageName - Stage name that unlocks this tab
     */
    showLockedTabMessage(tabName, nextStageName) {
        const tabInfo = this.TAB_INFO[tabName];
        const message = `${tabInfo.icon} ${tabInfo.label} will be available when you advance to the ${nextStageName} stage.\n\nComplete the current stage requirements to unlock this tab.`;

        // Use a nicer notification if available, otherwise alert
        if (typeof app !== 'undefined' && app.showNotification) {
            app.showNotification(message, 'info');
        } else {
            alert(message);
        }
    },

    /**
     * Check if a specific tab is currently available
     * @param {string} tabName - Tab to check
     * @param {Object} feature - Current feature
     * @param {Object} workspace - Current workspace
     * @returns {boolean} True if tab is available
     */
    isTabAvailable(tabName, feature, workspace) {
        // If workflow mode is disabled, all tabs are available
        if (!workspace || !workspace.workflowModeEnabled) {
            return true;
        }

        const currentStage = feature.workflowStage || 'ideation';
        const stageConfig = this.STAGE_TAB_CONFIG[currentStage];

        return stageConfig && stageConfig.available.includes(tabName);
    },

    /**
     * Switch to a tab if available, or show message if locked
     * @param {string} tabName - Tab to switch to
     * @param {Object} feature - Current feature
     * @param {Object} workspace - Current workspace
     */
    switchToTabIfAvailable(tabName, feature, workspace) {
        if (this.isTabAvailable(tabName, feature, workspace)) {
            app.switchDetailTab(tabName);
            return true;
        } else {
            const currentStage = feature.workflowStage || 'ideation';
            const nextStage = this.getNextStageForTab(tabName, currentStage);
            const nextStageName = workflowOrchestrator ? workflowOrchestrator.STAGE_LABELS[nextStage] : nextStage;
            this.showLockedTabMessage(tabName, nextStageName);
            return false;
        }
    },

    /**
     * Get list of available tabs for current stage
     * @param {Object} feature - Current feature
     * @param {Object} workspace - Current workspace
     * @returns {Array<string>} Array of available tab names
     */
    getAvailableTabs(feature, workspace) {
        if (!workspace || !workspace.workflowModeEnabled) {
            return ['overview', 'inspiration', 'planning', 'execution', 'resources'];
        }

        const currentStage = feature.workflowStage || 'ideation';
        const stageConfig = this.STAGE_TAB_CONFIG[currentStage];

        return stageConfig ? stageConfig.available : [];
    },

    /**
     * Refresh tab restrictions (call after stage changes)
     * @param {string} featureId - Feature ID to refresh
     */
    refresh(featureId) {
        if (!app || !app.features) return;

        const feature = app.features.find(f => f.id === featureId);
        if (!feature) return;

        const workspace = app.workspaces.find(w => w.id === feature.workspaceId);
        this.applyTabRestrictions(feature, workspace);
    }
};

// Export for testing
if (typeof module !== 'undefined' && module.exports) {
    module.exports = workflowTabs;
}
