/**
 * AI Field Detector Service
 * Intelligent detection of fields that would benefit from AI enhancement
 *
 * Purpose: Auto-detect enhancement opportunities and trigger smart suggestions
 * Integration: Works with ai-enhancement-service.js and UI components
 */

const aiFieldDetector = {
    /**
     * Detection rules for triggering AI suggestions
     */
    DETECTION_RULES: {
        // Empty critical fields always trigger
        emptyCriticalField: {
            trigger: (feature, fieldName) => {
                return aiEnhancementService.FIELD_TIERS.CRITICAL.includes(fieldName) &&
                       this.isFieldEmpty(feature[fieldName]);
            },
            priority: 'high',
            message: (fieldName) => `Critical field '${fieldName}' is empty - AI can help!`
        },

        // Short purpose statements trigger improvement suggestion
        shortPurpose: {
            trigger: (feature) => {
                return feature.purpose && feature.purpose.length > 0 && feature.purpose.length < 50;
            },
            priority: 'medium',
            message: () => 'Purpose statement is very short - expand it for better clarity',
            affectedFields: ['purpose']
        },

        // Missing acceptance criteria
        missingAcceptanceCriteria: {
            trigger: (feature) => {
                return feature.purpose && (!feature.acceptance_criteria || feature.acceptance_criteria.length === 0);
            },
            priority: 'high',
            message: () => 'Define acceptance criteria before implementation',
            affectedFields: ['acceptance_criteria']
        },

        // No execution steps defined
        missingExecutionSteps: {
            trigger: (feature) => {
                return feature.purpose && (!feature.execution_steps || feature.execution_steps.length === 0);
            },
            priority: 'high',
            message: () => 'Break down feature into actionable execution steps',
            affectedFields: ['execution_steps']
        },

        // Missing definition of done
        missingDefinitionOfDone: {
            trigger: (feature) => {
                return feature.acceptance_criteria && feature.acceptance_criteria.length > 0 &&
                       (!feature.definition_of_done || feature.definition_of_done.length === 0);
            },
            priority: 'high',
            message: () => 'Define done criteria to ensure quality standards',
            affectedFields: ['definition_of_done']
        },

        // No success metrics defined
        missingSuccessMetrics: {
            trigger: (feature) => {
                return feature.customer_impact && (!feature.success_metrics || feature.success_metrics.length === 0);
            },
            priority: 'high',
            message: () => 'Define measurable success metrics',
            affectedFields: ['success_metrics']
        },

        // Missing estimated effort
        missingEstimation: {
            trigger: (feature) => {
                return feature.execution_steps && feature.execution_steps.length > 0 &&
                       !feature.story_points && !feature.estimated_hours;
            },
            priority: 'medium',
            message: () => 'Estimate effort based on execution steps',
            affectedFields: ['story_points', 'estimated_hours']
        },

        // Missing tags/categorization
        poorCategorization: {
            trigger: (feature) => {
                return feature.purpose && (!feature.tags || feature.tags.length === 0) && !feature.category;
            },
            priority: 'low',
            message: () => 'Add tags and category for better organization',
            affectedFields: ['tags', 'category']
        },

        // Risk assessment missing
        missingRiskAssessment: {
            trigger: (feature) => {
                return feature.execution_steps && feature.execution_steps.length >= 5 &&
                       (!feature.risks || feature.risks.length === 0);
            },
            priority: 'medium',
            message: () => 'Identify and mitigate potential risks',
            affectedFields: ['risks']
        },

        // Inconsistent data
        inconsistentPriority: {
            trigger: (feature) => {
                return feature.business_value === 'critical' && feature.priority !== 'critical' &&
                       feature.priority !== 'high';
            },
            priority: 'medium',
            message: () => 'Priority doesn\'t match business value - recalculate',
            affectedFields: ['priority']
        }
    },

    /**
     * Check if a field is considered empty
     */
    isFieldEmpty(value) {
        if (value === null || value === undefined) return true;
        if (typeof value === 'string') return value.trim().length === 0;
        if (Array.isArray(value)) return value.length === 0;
        if (typeof value === 'object') return Object.keys(value).length === 0;
        return false;
    },

    /**
     * Detect enhancement opportunities for a feature
     * @param {Object} feature - Feature object
     * @returns {Array<Object>} Enhancement suggestions
     */
    detectOpportunities(feature) {
        const opportunities = [];

        // Run all detection rules
        for (const [ruleName, rule] of Object.entries(this.DETECTION_RULES)) {
            try {
                if (rule.trigger(feature)) {
                    const affectedFields = rule.affectedFields || this.inferAffectedFields(ruleName);

                    opportunities.push({
                        ruleName,
                        priority: rule.priority,
                        message: typeof rule.message === 'function' ? rule.message() : rule.message,
                        affectedFields,
                        estimatedCost: this.estimateOpportunityCost(affectedFields),
                        estimatedTime: this.estimateGenerationTime(affectedFields.length)
                    });
                }
            } catch (error) {
                console.error(`Error running detection rule ${ruleName}:`, error);
            }
        }

        // Also check individual field tier status
        const additionalOpportunities = aiEnhancementService.detectEnhanceableFields(feature);
        additionalOpportunities.forEach(opp => {
            opportunities.push({
                ruleName: `empty_${opp.field}`,
                priority: opp.tier === 'CRITICAL' ? 'high' : opp.tier === 'HIGH' ? 'medium' : 'low',
                message: opp.reason,
                affectedFields: [opp.field],
                estimatedCost: this.estimateOpportunityCost([opp.field]),
                estimatedTime: this.estimateGenerationTime(1)
            });
        });

        // Deduplicate by affected fields
        const seen = new Set();
        return opportunities.filter(opp => {
            const key = opp.affectedFields.sort().join(',');
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
        }).sort((a, b) => {
            // Sort by priority
            const priorityOrder = { 'high': 1, 'medium': 2, 'low': 3 };
            return priorityOrder[a.priority] - priorityOrder[b.priority];
        });
    },

    /**
     * Infer affected fields from rule name
     */
    inferAffectedFields(ruleName) {
        const fieldMap = {
            'emptyPurpose': ['purpose'],
            'shortPurpose': ['purpose'],
            'missingAcceptanceCriteria': ['acceptance_criteria'],
            'missingExecutionSteps': ['execution_steps'],
            'missingDefinitionOfDone': ['definition_of_done'],
            'missingSuccessMetrics': ['success_metrics'],
            'missingEstimation': ['story_points', 'estimated_hours'],
            'poorCategorization': ['tags', 'category'],
            'missingRiskAssessment': ['risks'],
            'inconsistentPriority': ['priority']
        };

        return fieldMap[ruleName] || [];
    },

    /**
     * Estimate cost for opportunity
     */
    estimateOpportunityCost(fields) {
        const estimate = aiEnhancementService.estimateCost(fields);
        return estimate.estimatedCost;
    },

    /**
     * Estimate generation time
     */
    estimateGenerationTime(fieldCount) {
        // Rough estimate: 3-5 seconds per field
        const seconds = fieldCount * 4;
        if (seconds < 60) return `~${seconds}s`;
        return `~${Math.ceil(seconds / 60)}m`;
    },

    /**
     * Auto-detect and display opportunities in UI
     * @param {Object} feature - Feature object
     * @param {String} containerId - Container element ID
     */
    renderOpportunitiesPanel(feature, containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        const opportunities = this.detectOpportunities(feature);

        if (opportunities.length === 0) {
            container.innerHTML = `
                <div class="ai-opportunities-empty">
                    <span style="font-size: 32px;">✅</span>
                    <p>All key fields are populated!</p>
                </div>
            `;
            container.style.display = 'none';
            return;
        }

        // Show panel with opportunities
        container.style.display = 'block';

        const highPriority = opportunities.filter(o => o.priority === 'high');
        const mediumPriority = opportunities.filter(o => o.priority === 'medium');
        const lowPriority = opportunities.filter(o => o.priority === 'low');

        container.innerHTML = `
            <div class="ai-opportunities-panel">
                <div class="ai-opportunities-header">
                    <h3>🤖 AI Enhancement Available</h3>
                    <span class="ai-opportunities-count">${opportunities.length} suggestion${opportunities.length !== 1 ? 's' : ''}</span>
                </div>

                ${highPriority.length > 0 ? `
                <div class="ai-opportunities-section">
                    <h4 class="priority-high">⚠️ High Priority</h4>
                    ${highPriority.map(opp => this.renderOpportunityCard(opp, feature)).join('')}
                </div>
                ` : ''}

                ${mediumPriority.length > 0 ? `
                <div class="ai-opportunities-section">
                    <h4 class="priority-medium">💡 Recommended</h4>
                    ${mediumPriority.map(opp => this.renderOpportunityCard(opp, feature)).join('')}
                </div>
                ` : ''}

                ${lowPriority.length > 0 ? `
                <div class="ai-opportunities-section">
                    <h4 class="priority-low">✨ Nice to Have</h4>
                    ${lowPriority.map(opp => this.renderOpportunityCard(opp, feature)).join('')}
                </div>
                ` : ''}

                <div class="ai-opportunities-actions">
                    <button class="btn-generate-all" onclick="aiFieldDetector.generateAll('${feature.id}')">
                        ✨ Generate All (${opportunities.map(o => o.estimatedCost).join(', ')} total)
                    </button>
                </div>
            </div>
        `;
    },

    /**
     * Render a single opportunity card
     */
    renderOpportunityCard(opportunity, feature) {
        return `
            <div class="ai-opportunity-card priority-${opportunity.priority}" data-rule="${opportunity.ruleName}">
                <div class="opportunity-header">
                    <span class="opportunity-message">${opportunity.message}</span>
                    <span class="opportunity-cost">${opportunity.estimatedCost}</span>
                </div>
                <div class="opportunity-fields">
                    <strong>Fields:</strong> ${opportunity.affectedFields.join(', ')}
                </div>
                <div class="opportunity-actions">
                    <button class="btn-generate-field btn-sm"
                            onclick="aiFieldDetector.generateFields('${feature.id}', ${JSON.stringify(opportunity.affectedFields).replace(/"/g, '&quot;')})">
                        ✨ Generate (${opportunity.estimatedTime})
                    </button>
                </div>
            </div>
        `;
    },

    /**
     * Generate specific fields for a feature
     * @param {String} featureId - Feature ID
     * @param {Array<String>} fields - Fields to generate
     */
    async generateFields(featureId, fields) {
        console.log(`🤖 Generating fields for feature ${featureId}:`, fields);

        // Show loading state
        const loadingToast = this.showToast('Generating fields with AI...', 'info');

        try {
            // Get feature and workspace
            const feature = app.features.find(f => f.id === featureId);
            if (!feature) {
                throw new Error('Feature not found');
            }

            const workspace = app.workspaces.find(w => w.id === feature.workspaceId);

            // Generate fields
            const result = await aiEnhancementService.generateBatch(fields, feature, workspace);

            if (result.success) {
                // Apply generated values to feature
                Object.keys(result.results).forEach(fieldName => {
                    feature[fieldName] = result.results[fieldName].value;
                });

                // Save feature
                await app.saveData();

                // Show success
                this.showToast(`✅ Generated ${result.fieldsGenerated} field${result.fieldsGenerated !== 1 ? 's' : ''}`, 'success');

                // Refresh UI
                if (typeof detailView !== 'undefined') {
                    detailView.showFeatureDetails(featureId);
                }

                // Refresh opportunities panel
                this.renderOpportunitiesPanel(feature, 'ai-opportunities-container');
            } else {
                throw new Error('Generation failed');
            }
        } catch (error) {
            console.error('Error generating fields:', error);
            this.showToast(`❌ Error: ${error.message}`, 'error');
        }
    },

    /**
     * Generate all opportunities for a feature
     * @param {String} featureId - Feature ID
     */
    async generateAll(featureId) {
        console.log(`🤖 Generating all opportunities for feature ${featureId}`);

        const feature = app.features.find(f => f.id === featureId);
        if (!feature) return;

        const opportunities = this.detectOpportunities(feature);
        const allFields = [...new Set(opportunities.flatMap(o => o.affectedFields))];

        await this.generateFields(featureId, allFields);
    },

    /**
     * Show toast notification
     */
    showToast(message, type = 'info') {
        // Simple toast implementation
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.textContent = message;
        toast.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 12px 20px;
            background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6'};
            color: white;
            border-radius: 8px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            z-index: 10000;
            animation: slideIn 0.3s ease-out;
        `;

        document.body.appendChild(toast);

        setTimeout(() => {
            toast.style.animation = 'slideOut 0.3s ease-in';
            setTimeout(() => toast.remove(), 300);
        }, 3000);

        return toast;
    }
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = aiFieldDetector;
}
