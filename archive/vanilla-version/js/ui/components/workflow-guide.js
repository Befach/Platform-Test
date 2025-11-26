// Workflow Guide Panel Component
// Displays stage-specific requirements, progress, and AI action buttons

const workflowGuide = {
    /**
     * Render workflow guide panel for a feature
     * @param {Object} feature - Feature object
     * @param {Object} workspace - Workspace object
     * @param {HTMLElement} container - Container element to render into
     */
    render(feature, workspace, container) {
        // Check if workflow mode is enabled for workspace
        if (!workspace || !workspace.workflowModeEnabled) {
            container.innerHTML = '';
            container.style.display = 'none';
            return;
        }

        // Check if workflowOrchestrator is available
        if (typeof workflowOrchestrator === 'undefined') {
            console.warn('⚠️ workflowOrchestrator not loaded');
            container.innerHTML = '';
            return;
        }

        const currentStage = workflowOrchestrator.getCurrentStage(feature);
        const readiness = workflowOrchestrator.checkStageReadiness(feature);
        const stageLabel = workflowOrchestrator.STAGE_LABELS[currentStage];
        const stageIcon = workflowOrchestrator.getStageIcon(currentStage);
        const stageDesc = workflowOrchestrator.STAGE_DESCRIPTIONS[currentStage];
        const nextStage = workflowOrchestrator.getNextStage(currentStage);
        const progressColor = workflowOrchestrator.getProgressColor(readiness.completionPercent);

        container.style.display = 'block';
        container.innerHTML = `
            <div class="workflow-guide-panel">
                <div class="workflow-guide-header">
                    <div class="stage-info">
                        <span class="stage-icon">${stageIcon}</span>
                        <div class="stage-details">
                            <h4 class="stage-title">${stageLabel}</h4>
                            <p class="stage-description">${stageDesc}</p>
                        </div>
                    </div>
                    <button class="collapse-btn" onclick="workflowGuide.toggle()" title="Collapse guide">
                        <span class="collapse-icon">◀</span>
                    </button>
                </div>

                <div class="workflow-guide-body">
                    <!-- Progress Section -->
                    <div class="progress-section">
                        <div class="progress-header">
                            <span class="progress-label">Stage Progress</span>
                            <span class="progress-percent" style="color: ${progressColor}">${readiness.completionPercent}%</span>
                        </div>
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: ${readiness.completionPercent}%; background: ${progressColor}"></div>
                        </div>
                        ${readiness.canAdvance ?
                            `<div class="ready-badge">✓ Ready to advance</div>` :
                            `<div class="requirements-count">${readiness.missingRequirements.length} requirement(s) remaining</div>`
                        }
                    </div>

                    <!-- Requirements Section -->
                    ${readiness.missingRequirements.length > 0 ? `
                        <div class="requirements-section">
                            <h5 class="requirements-title">Missing Requirements</h5>
                            <ul class="requirements-list">
                                ${readiness.missingRequirements.map(req => `
                                    <li class="requirement-item">
                                        <span class="requirement-icon">⚠️</span>
                                        <span class="requirement-text">${req}</span>
                                    </li>
                                `).join('')}
                            </ul>
                        </div>
                    ` : ''}

                    <!-- Stage Guidance -->
                    <div class="guidance-section">
                        <h5 class="guidance-title">Stage Guidance</h5>
                        ${this.getStageGuidanceHTML(currentStage)}
                    </div>

                    <!-- AI Actions -->
                    ${this.getAIActionsHTML(currentStage, feature)}

                    <!-- Advance Button -->
                    ${readiness.canAdvance && nextStage ? `
                        <div class="advance-section">
                            <button
                                class="btn-advance"
                                onclick="workflowGuide.advanceStage('${feature.id}')"
                                title="Advance to ${workflowOrchestrator.STAGE_LABELS[nextStage]}">
                                Advance to ${workflowOrchestrator.getStageIcon(nextStage)} ${workflowOrchestrator.STAGE_LABELS[nextStage]}
                            </button>
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
    },

    /**
     * Get stage-specific guidance HTML
     * @param {String} stage - Current stage
     * @returns {String} HTML string
     */
    getStageGuidanceHTML(stage) {
        const guidance = {
            'ideation': `
                <ul class="guidance-list">
                    <li>Focus on discovery, research, and understanding</li>
                    <li>Find inspiration and similar implementations</li>
                    <li>Identify risks, challenges, and prerequisites</li>
                    <li>Don't focus on detailed execution plans yet</li>
                </ul>
            `,
            'planning': `
                <ul class="guidance-list">
                    <li>Break down feature into executable steps</li>
                    <li>Define clear milestones and deliverables</li>
                    <li>Identify required resources and tools</li>
                    <li>Create acceptance criteria</li>
                </ul>
            `,
            'execution': `
                <ul class="guidance-list">
                    <li>Track progress and update completion status</li>
                    <li>Document blockers and mitigation strategies</li>
                    <li>Monitor timeline and adjust as needed</li>
                    <li>Prepare for deployment and release</li>
                </ul>
            `,
            'completed': `
                <p class="guidance-text">Feature completed! Review and document learnings.</p>
            `
        };

        return guidance[stage] || '<p class="guidance-text">No guidance available for this stage.</p>';
    },

    /**
     * Get AI action buttons for current stage
     * @param {String} stage - Current stage
     * @param {Object} feature - Feature object
     * @returns {String} HTML string
     */
    getAIActionsHTML(stage, feature) {
        if (typeof workflowOrchestrator === 'undefined') {
            return '';
        }

        const workflows = workflowOrchestrator.getStageWorkflows(stage);
        if (!workflows || workflows.length === 0) {
            return '';
        }

        return `
            <div class="ai-actions-section">
                <h5 class="ai-actions-title">AI Assistance</h5>
                <div class="ai-actions-grid">
                    ${workflows.map(workflow => `
                        <button
                            class="ai-action-btn"
                            onclick="workflowGuide.executeAIAction('${workflow.action}', '${feature.id}')"
                            title="${workflow.description}">
                            <span class="ai-action-icon">${workflow.icon}</span>
                            <span class="ai-action-label">${workflow.name}</span>
                        </button>
                    `).join('')}
                </div>
            </div>
        `;
    },

    /**
     * Toggle workflow guide panel collapse state
     */
    toggle() {
        const panel = document.querySelector('.workflow-guide-panel');
        if (!panel) return;

        panel.classList.toggle('collapsed');

        const icon = panel.querySelector('.collapse-icon');
        if (icon) {
            icon.textContent = panel.classList.contains('collapsed') ? '▶' : '◀';
        }

        // Save state to localStorage
        localStorage.setItem('workflowGuideCollapsed', panel.classList.contains('collapsed'));
    },

    /**
     * Restore collapsed state from localStorage
     */
    restoreState() {
        const collapsed = localStorage.getItem('workflowGuideCollapsed') === 'true';
        if (collapsed) {
            const panel = document.querySelector('.workflow-guide-panel');
            if (panel) {
                panel.classList.add('collapsed');
                const icon = panel.querySelector('.collapse-icon');
                if (icon) icon.textContent = '▶';
            }
        }
    },

    /**
     * Advance feature to next stage
     * @param {String} featureId - Feature ID
     */
    async advanceStage(featureId) {
        try {
            const feature = app.features.find(f => f.id === featureId);
            if (!feature) {
                alert('Feature not found');
                return;
            }

            const workspace = app.workspaces.find(w => w.id === feature.workspaceId);
            if (!workspace || !workspace.workflowModeEnabled) {
                alert('Workflow mode not enabled for this workspace');
                return;
            }

            // Show confirmation dialog with notes
            const notes = prompt('Optional: Add notes about this stage transition');
            if (notes === null) return; // User cancelled

            // Advance stage
            const result = await workflowOrchestrator.advanceStage(
                feature,
                'user',
                notes || '',
                app.features
            );

            if (result.success) {
                alert(`✅ ${result.message}`);

                // Refresh tab restrictions for new stage
                if (typeof workflowTabs !== 'undefined') {
                    workflowTabs.refresh(featureId);
                }

                // Refresh UI
                if (typeof app.refreshCurrentView === 'function') {
                    app.refreshCurrentView();
                }
            } else {
                alert(`❌ ${result.message}\n\nMissing:\n${result.missingRequirements.join('\n')}`);
            }
        } catch (error) {
            console.error('❌ Error advancing stage:', error);
            alert('Error advancing stage. Check console for details.');
        }
    },

    /**
     * Execute AI action for feature
     * @param {String} action - Action name
     * @param {String} featureId - Feature ID
     */
    async executeAIAction(action, featureId) {
        try {
            const feature = app.features.find(f => f.id === featureId);
            if (!feature) {
                alert('Feature not found');
                return;
            }

            // Open AI chat panel if needed
            if (typeof app.openChatPanel === 'function') {
                app.openChatPanel();
            }

            // Send action to AI chat
            if (typeof app.sendAIMessage === 'function') {
                const message = this.getAIActionPrompt(action, feature);
                app.sendAIMessage(message);
            } else {
                alert('AI chat not available');
            }
        } catch (error) {
            console.error('❌ Error executing AI action:', error);
            alert('Error executing AI action. Check console for details.');
        }
    },

    /**
     * Get AI prompt for specific action
     * @param {String} action - Action name
     * @param {Object} feature - Feature object
     * @returns {String} AI prompt
     */
    getAIActionPrompt(action, feature) {
        const prompts = {
            'findInspiration': `Find 5-7 similar implementations or tools for this feature:\n\nFeature: ${feature.name}\nPurpose: ${feature.purpose || 'Not specified'}\n\nProvide inspiration items with titles, URLs, and descriptions.`,
            'identifyRisks': `Identify potential risks and challenges for this feature:\n\nFeature: ${feature.name}\nPurpose: ${feature.purpose || 'Not specified'}\n\nList risks with severity levels and mitigation strategies.`,
            'getPerplexityInsights': `Provide comprehensive research insights for this feature:\n\nFeature: ${feature.name}\nPurpose: ${feature.purpose || 'Not specified'}\n\nInclude: best practices, common pitfalls, technology recommendations.`,
            'suggestPrerequisites': `Identify prerequisites and dependencies for this feature:\n\nFeature: ${feature.name}\nPurpose: ${feature.purpose || 'Not specified'}\n\nList technical and non-technical prerequisites.`,
            'generateExecutionPlan': `Create a detailed execution plan for this feature:\n\nFeature: ${feature.name}\nPurpose: ${feature.purpose || 'Not specified'}\n\nBreak down into steps with estimated hours and dependencies.`,
            'generateMilestones': `Define key milestones for this feature:\n\nFeature: ${feature.name}\nPurpose: ${feature.purpose || 'Not specified'}\n\nCreate 3-5 milestones with target dates and success criteria.`,
            'suggestResources': `Suggest resources needed for this feature:\n\nFeature: ${feature.name}\nPurpose: ${feature.purpose || 'Not specified'}\n\nInclude: team roles, technologies, tools, and budget estimates.`,
            'analyzeBatchLinks': `Analyze potential dependencies between this feature and others in the roadmap:\n\nFeature: ${feature.name}\nPurpose: ${feature.purpose || 'Not specified'}\n\nIdentify features this depends on or blocks.`
        };

        return prompts[action] || `Help with ${action} for feature: ${feature.name}`;
    }
};
