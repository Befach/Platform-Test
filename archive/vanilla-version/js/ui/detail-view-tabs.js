/**
 * Detail View Tabs Module
 * Handles rendering of all detail view tab content
 *
 * Extracted from index.html as part of Phase 5.4.2 refactoring
 * Lines extracted: ~412 lines
 * Methods: 6 tab rendering methods (Overview, Execution, Resources, Planning, Inspiration, Helper)
 */

const detailViewTabs = {
    /**
     * Render Overview tab with purpose, USP, timeline items, links, and metrics
     * @param {Object} app - App instance
     * @param {Object} feature - Feature to render
     */
    renderOverviewTab(app, feature) {
        // Purpose
        document.getElementById('detailPurpose').textContent = feature.purpose || 'No purpose specified';

        // USP
        const usp = feature.summary?.usp || feature.timelineItems?.[0]?.usp || 'No USP specified';
        document.getElementById('detailUSP').textContent = usp;

        // Integration
        const integration = feature.summary?.integrationType || feature.timelineItems?.[0]?.integrationType || 'No integration type specified';
        document.getElementById('detailIntegration').textContent = integration;

        // Timeline Items
        const timelineContainer = document.getElementById('detailTimelineItems');
        if (feature.timelineItems && feature.timelineItems.length > 0) {
            timelineContainer.innerHTML = feature.timelineItems.map(item => `
                <div class="timeline-item-card">
                    <div class="timeline-item-header">
                        <div class="timeline-item-badges">
                            <span class="badge badge-${item.timeline.toLowerCase()}">${item.timeline}</span>
                            <span class="badge badge-${item.difficulty.toLowerCase()}">${item.difficulty}</span>
                        </div>
                    </div>
                    <div class="timeline-item-body">
                        <h4>USP</h4>
                        <p>${item.usp || 'N/A'}</p>
                        <h4>Integration Type</h4>
                        <p>${item.integrationType || 'N/A'}</p>
                        ${item.category && item.category.length > 0 ? `
                            <div class="timeline-item-categories">
                                ${item.category.map(cat => `<span class="tag">${cat}</span>`).join('')}
                            </div>
                        ` : ''}
                    </div>
                </div>
            `).join('');
        } else {
            timelineContainer.innerHTML = '<p class="detail-text">No timeline items defined</p>';
        }

        // Linked Items
        const linkedContainer = document.getElementById('detailLinkedItems');
        const allLinkedItems = detailViewTabs.getAllLinkedItems(app, feature.id);

        if (allLinkedItems.length > 0) {
            linkedContainer.innerHTML = allLinkedItems.map(link => {
                const linkedFeature = app.features.find(f => f.id === link.linkedFeatureId);
                if (!linkedFeature) return '';

                const relationshipText = link.direction === 'outgoing'
                    ? `${link.relationshipType === 'dependency' ? 'Depends on' : 'Complements'}: ${link.reason}`
                    : `${link.relationshipType === 'dependency' ? 'Required by' : 'Complemented by'}: ${link.reason}`;

                return `
                    <div class="linked-item" onclick="app.showDetailView('${linkedFeature.id}')">
                        <div class="linked-item-icon">${linkedFeature.name.substring(0, 2).toUpperCase()}</div>
                        <div class="linked-item-content">
                            <h4>${linkedFeature.name}</h4>
                            <p class="linked-item-relationship">${relationshipText}</p>
                        </div>
                    </div>
                `;
            }).join('');
        } else {
            linkedContainer.innerHTML = '<p class="detail-text">No linked features</p>';
        }

        // Success Metrics
        const metricsContainer = document.getElementById('successMetricsList');
        const metrics = feature.successMetrics || [];

        if (metrics.length > 0) {
            metricsContainer.innerHTML = metrics.map(metric => {
                const progress = app.calculateMetricProgress(metric);
                const isSuccess = progress >= 100;

                return `
                    <div class="metric-card">
                        <div class="metric-header">
                            <h4>${metric.name}</h4>
                            <button class="metric-delete" onclick="app.deleteSuccessMetric('${metric.id}')" title="Delete metric">×</button>
                        </div>
                        <div class="metric-values">
                            <div class="metric-value">
                                <div class="metric-label">Target</div>
                                <div class="metric-number">${metric.target}${metric.unit}</div>
                            </div>
                            <div class="metric-value">
                                <div class="metric-label">Actual</div>
                                <div class="metric-number clickable" onclick="app.updateMetricActual('${metric.id}')">${metric.actual}${metric.unit}</div>
                            </div>
                        </div>
                        <div class="metric-progress">
                            <div class="metric-progress-bar">
                                <div class="metric-progress-fill ${isSuccess ? 'success' : ''}" style="width: ${progress}%"></div>
                            </div>
                            <div class="metric-progress-text">${progress}%</div>
                        </div>
                    </div>
                `;
            }).join('');
        } else {
            metricsContainer.innerHTML = '<p class="detail-text">No success metrics defined</p>';
        }

        // Customer Impact
        const customerImpactText = document.getElementById('customerImpactText');
        if (customerImpactText) {
            customerImpactText.value = feature.customerImpact || '';
        }

        // Strategic Alignment
        const strategicAlignmentText = document.getElementById('strategicAlignmentText');
        if (strategicAlignmentText) {
            strategicAlignmentText.value = feature.strategicAlignment || '';
        }
    },

    /**
     * Get all linked items (dependencies and complements) for a feature
     * Collects both outgoing links and incoming links from other features
     * @param {Object} app - App instance
     * @param {string} featureId - Feature ID to get links for
     * @returns {Array} Array of linked items with direction (outgoing/incoming)
     */
    getAllLinkedItems(app, featureId) {
        const feature = app.features.find(f => f.id === featureId);
        if (!feature) return [];

        const links = [];

        // Get outgoing links from timeline items
        if (feature.timelineItems) {
            feature.timelineItems.forEach(item => {
                if (item.linkedItems) {
                    item.linkedItems.forEach(link => {
                        if (link.direction === 'outgoing') {
                            links.push(link);
                        }
                    });
                }
            });
        }

        // Get incoming links from other features
        app.features.forEach(otherFeature => {
            if (otherFeature.id === featureId) return;

            if (otherFeature.timelineItems) {
                otherFeature.timelineItems.forEach(item => {
                    if (item.linkedItems) {
                        item.linkedItems.forEach(link => {
                            if (link.linkedFeatureId === featureId && link.direction === 'outgoing') {
                                links.push({
                                    ...link,
                                    linkedFeatureId: otherFeature.id,
                                    direction: 'incoming'
                                });
                            }
                        });
                    }
                });
            }
        });

        return links;
    },

    /**
     * Render Execution tab with execution steps list
     * @param {Object} app - App instance
     * @param {Object} feature - Feature to render
     */
    renderExecutionTab(app, feature) {
        const container = document.getElementById('executionStepsList');
        const executionSteps = feature.executionSteps || [];

        if (executionSteps.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">📋</div>
                    <h3>No Execution Steps Yet</h3>
                    <p>Add steps manually or use AI to generate an execution plan</p>
                </div>
            `;
            return;
        }

        container.innerHTML = executionSteps
            .sort((a, b) => (a.order || 0) - (b.order || 0))
            .map((step, index) => `
                <div class="execution-step">
                    <div class="step-number">${index + 1}</div>
                    <div class="step-content">
                        <h4>${step.title}</h4>
                        <p>${step.description}</p>
                        <div class="step-meta">
                            ${step.estimatedHours ? `<span>⏱️ ${step.estimatedHours}h estimated</span>` : ''}
                            ${step.completed ? '<span style="color: var(--success);">✓ Completed</span>' : ''}
                        </div>
                    </div>
                    <div class="step-actions">
                        <button onclick="app.toggleStepComplete('${feature.id}', '${step.id}')" title="${step.completed ? 'Mark incomplete' : 'Mark complete'}">
                            ${step.completed ? '↩️' : '✓'}
                        </button>
                        <button onclick="app.deleteExecutionStep('${feature.id}', '${step.id}')" title="Delete step">🗑️</button>
                    </div>
                </div>
            `).join('');
    },

    /**
     * Render Resources tab with team composition, technologies, and budget
     * @param {Object} app - App instance
     * @param {Object} feature - Feature to render
     */
    renderResourcesTab(app, feature) {
        const container = document.getElementById('resourcesContent');
        const resources = feature.resources || {};

        if (!resources.teamRoles && !resources.technologies && !resources.estimatedBudget && !resources.estimatedHours) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">🛠️</div>
                    <h3>No Resources Defined</h3>
                    <p>Define required resources or let AI suggest them</p>
                </div>
            `;
            return;
        }

        let html = '';

        // Team composition
        if (resources.teamRoles && resources.teamRoles.length > 0) {
            html += `
                <div class="resource-section">
                    <h3>👥 Team Composition</h3>
                    <div class="resource-list">
                        ${resources.teamRoles.map(role => `
                            <div class="resource-item">
                                <span class="resource-label">${role.role}</span>
                                <span class="resource-value">${role.count} × ${role.skillLevel || 'Any'}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        }

        // Technologies
        if (resources.technologies && resources.technologies.length > 0) {
            html += `
                <div class="resource-section">
                    <h3>💻 Technologies</h3>
                    <div class="tech-tags">
                        ${resources.technologies.map(tech => `<span class="tech-tag">${tech}</span>`).join('')}
                    </div>
                </div>
            `;
        }

        // Budget & Time
        if (resources.estimatedBudget || resources.estimatedHours) {
            html += `
                <div class="resource-section">
                    <h3>💰 Budget & Time</h3>
                    <div class="resource-list">
                        ${resources.estimatedBudget ? `
                            <div class="resource-item">
                                <span class="resource-label">Estimated Budget</span>
                                <span class="resource-value">${resources.estimatedBudget}</span>
                            </div>
                        ` : ''}
                        ${resources.estimatedHours ? `
                            <div class="resource-item">
                                <span class="resource-label">Estimated Hours</span>
                                <span class="resource-value">${resources.estimatedHours}h</span>
                            </div>
                        ` : ''}
                    </div>
                </div>
            `;
        }

        container.innerHTML = html;
    },

    /**
     * Render Planning tab with milestones, risks, prerequisites, acceptance criteria, definition of done, and blockers
     * @param {Object} app - App instance
     * @param {Object} feature - Feature to render
     */
    renderPlanningTab(app, feature) {
        const planning = feature.planning || {};

        // Milestones
        const milestonesContainer = document.getElementById('milestonesList');
        if (planning.milestones && planning.milestones.length > 0) {
            milestonesContainer.innerHTML = planning.milestones.map(milestone => `
                <div class="milestone">
                    <div class="milestone-status ${milestone.status || 'pending'}"></div>
                    <div class="milestone-content">
                        <h4>${milestone.name}</h4>
                        <p class="milestone-date">${milestone.targetDate ? `Target: ${milestone.targetDate}` : 'No date set'}</p>
                        ${milestone.dependencies ? `<p style="font-size: 12px; color: var(--text-muted); margin-top: 4px;">Dependencies: ${milestone.dependencies.join(', ')}</p>` : ''}
                    </div>
                </div>
            `).join('');
        } else {
            milestonesContainer.innerHTML = '<p class="detail-text">No milestones defined</p>';
        }

        // Risks
        const risksContainer = document.getElementById('risksList');
        if (planning.risks && planning.risks.length > 0) {
            risksContainer.innerHTML = planning.risks.map(risk => `
                <div class="risk ${risk.severity || 'medium'}">
                    <div class="risk-header">
                        <h4>Risk</h4>
                        <span class="risk-severity ${risk.severity || 'medium'}">${risk.severity || 'medium'}</span>
                    </div>
                    <div class="risk-body">
                        <p>${risk.description}</p>
                    </div>
                    ${risk.mitigation ? `
                        <div class="risk-mitigation">
                            <strong>Mitigation Strategy:</strong>
                            <p>${risk.mitigation}</p>
                        </div>
                    ` : ''}
                </div>
            `).join('');
        } else {
            risksContainer.innerHTML = '<p class="detail-text">No risks identified</p>';
        }

        // Prerequisites
        const prerequisitesContainer = document.getElementById('prerequisitesList');
        if (planning.prerequisites && planning.prerequisites.length > 0) {
            prerequisitesContainer.innerHTML = planning.prerequisites.map(prereq => `
                <div class="prerequisite">
                    <div class="prerequisite-checkbox"></div>
                    <span class="prerequisite-text">${prereq}</span>
                </div>
            `).join('');
        } else {
            prerequisitesContainer.innerHTML = '<p class="detail-text">No prerequisites defined</p>';
        }

        // Acceptance Criteria
        const acceptanceCriteriaList = document.getElementById('acceptanceCriteriaList');
        const acceptanceCriteria = feature.acceptanceCriteria || [];

        if (acceptanceCriteria.length > 0) {
            acceptanceCriteriaList.innerHTML = acceptanceCriteria.map(criteria => `
                <div class="checklist-item ${criteria.completed ? 'completed' : ''}">
                    <div class="checklist-checkbox ${criteria.completed ? 'checked' : ''}" onclick="app.toggleAcceptanceCriteria('${criteria.id}')"></div>
                    <span class="checklist-text">${criteria.text}</span>
                    <button class="checklist-remove" onclick="app.removeAcceptanceCriteria('${criteria.id}')" title="Remove">×</button>
                </div>
            `).join('');
        } else {
            acceptanceCriteriaList.innerHTML = '<p class="empty-state">No acceptance criteria defined</p>';
        }

        // Definition of Done
        const definitionOfDoneList = document.getElementById('definitionOfDoneList');
        const definitionOfDone = feature.definitionOfDone || [];

        if (definitionOfDone.length > 0) {
            definitionOfDoneList.innerHTML = definitionOfDone.map(dod => `
                <div class="checklist-item ${dod.completed ? 'completed' : ''}">
                    <div class="checklist-checkbox ${dod.completed ? 'checked' : ''}" onclick="app.toggleDefinitionOfDone('${dod.id}')"></div>
                    <span class="checklist-text">${dod.text}</span>
                    <button class="checklist-remove" onclick="app.removeDefinitionOfDone('${dod.id}')" title="Remove">×</button>
                </div>
            `).join('');
        } else {
            definitionOfDoneList.innerHTML = '<p class="empty-state">No definition of done items</p>';
        }

        // Blockers
        const blockersList = document.getElementById('blockersList');
        const blockers = feature.blockers || [];

        if (blockers.length > 0) {
            blockersList.innerHTML = blockers.map(blocker => `
                <div class="blocker-card ${blocker.severity}">
                    <div class="blocker-header">
                        <div>
                            <h4>${blocker.title}</h4>
                            <span class="blocker-severity ${blocker.severity}">${blocker.severity.toUpperCase()}</span>
                        </div>
                        <span class="blocker-status-badge ${blocker.status}">${blocker.status.toUpperCase()}</span>
                    </div>
                    <p class="blocker-description">${blocker.description}</p>
                    <div class="blocker-actions">
                        <button class="btn-secondary" onclick="app.toggleBlockerStatus('${blocker.id}')" style="padding: 4px 12px; font-size: 12px;">
                            ${blocker.status === 'active' ? 'Mark Resolved' : 'Reopen'}
                        </button>
                        <button class="btn-danger" onclick="app.deleteBlocker('${blocker.id}')" style="padding: 4px 12px; font-size: 12px;">Delete</button>
                    </div>
                </div>
            `).join('');
        } else {
            blockersList.innerHTML = '<p class="detail-text">No blockers identified</p>';
        }
    },

    /**
     * Render Inspiration tab with inspiration cards
     * @param {Object} app - App instance
     * @param {Object} feature - Feature to render
     */
    renderInspirationTab(app, feature) {
        const container = document.getElementById('inspirationList');
        const inspiration = feature.inspiration || [];

        if (inspiration.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">💡</div>
                    <h3>No Inspiration Yet</h3>
                    <p>Add references manually or let AI find inspiration</p>
                </div>
            `;
            return;
        }

        container.innerHTML = inspiration.map(item => `
            <div class="inspiration-card" onclick="window.open('${item.url}', '_blank')">
                <button class="delete-inspiration-btn" onclick="event.stopPropagation(); app.deleteInspiration('${feature.id}', '${item.id}');" title="Delete inspiration">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                        <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z"/>
                        <path fill-rule="evenodd" d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z"/>
                    </svg>
                </button>
                <div class="inspiration-image">
                    ${item.imageUrl ? `<img src="${item.imageUrl}" alt="${item.title}" style="width:100%;height:100%;object-fit:cover;">` : '🔗'}
                </div>
                <div class="inspiration-content">
                    <span class="inspiration-type">${item.type || 'reference'}</span>
                    <h4>${item.title}</h4>
                    <p>${item.description || 'No description'}</p>
                    <a href="${item.url}" class="inspiration-link" onclick="event.stopPropagation()">${item.url}</a>
                </div>
            </div>
        `).join('');
    }
};

// Export for testing
if (typeof module !== 'undefined' && module.exports) {
    module.exports = detailViewTabs;
}
