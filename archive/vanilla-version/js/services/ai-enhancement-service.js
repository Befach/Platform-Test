/**
 * AI Enhancement Service
 * Handles intelligent field generation, auto-population, and context-aware AI suggestions
 *
 * Purpose: Enhance features with AI-generated content for high-value fields
 * Integration: Works with Claude API via api-service.js
 */

const aiEnhancementService = {
    /**
     * Field tiers for prioritization
     */
    FIELD_TIERS: {
        CRITICAL: [
            'purpose', 'customer_impact', 'success_metrics', 'acceptance_criteria',
            'definition_of_done', 'execution_steps', 'milestone_criteria', 'risks',
            'risk_mitigation', 'usp', 'integration_type', 'ai_rationale'
        ],
        HIGH: [
            'priority', 'health', 'planned_start_date', 'planned_end_date',
            'story_points', 'estimated_hours', 'business_value', 'strategic_alignment',
            'tags', 'category', 'step_order', 'step_duration', 'step_dependencies',
            'validation_criteria', 'resource_description', 'resource_url', 'milestone_name',
            'risk_severity'
        ],
        MEDIUM: [
            'name', 'status', 'target_release', 'effort_confidence', 'progress_percent',
            'stage_ready_to_advance', 'stage_completion_percent', 'blockers', 'stakeholders',
            'resource_type', 'quantity_needed', 'cost_estimate', 'risk_category',
            'prerequisite_category', 'inspiration_title'
        ],
        LOW: [
            'type', 'owner', 'contributors', 'assigned_to', 'milestone_owner', 'risk_owner'
        ]
    },

    /**
     * Field dependency graph - defines which fields depend on others
     */
    FIELD_DEPENDENCIES: {
        'priority': ['business_value', 'customer_impact', 'dependencies'],
        'health': ['progress_percent', 'blockers', 'planned_end_date'],
        'story_points': ['execution_steps', 'complexity'],
        'estimated_hours': ['story_points', 'execution_steps'],
        'planned_end_date': ['planned_start_date', 'estimated_hours'],
        'tags': ['purpose', 'category'],
        'acceptance_criteria': ['purpose', 'customer_impact'],
        'definition_of_done': ['acceptance_criteria'],
        'risks': ['purpose', 'execution_steps', 'category'],
        'execution_steps': ['purpose', 'timeline'],
        'success_metrics': ['customer_impact', 'business_value']
    },

    /**
     * Token budgets per field type
     */
    TOKEN_BUDGETS: {
        CRITICAL: 800,
        HIGH: 500,
        MEDIUM: 300,
        LOW: 150
    },

    /**
     * Model selection based on field complexity
     */
    selectModel(fieldName) {
        if (this.FIELD_TIERS.CRITICAL.includes(fieldName)) {
            return 'claude-3-5-sonnet-20241022'; // Best model for critical fields
        } else if (this.FIELD_TIERS.HIGH.includes(fieldName)) {
            return 'claude-3-5-sonnet-20241022';
        } else {
            return 'claude-3-5-haiku-20241022'; // Faster, cheaper for simpler fields
        }
    },

    /**
     * Get token budget for a field
     */
    getTokenBudget(fieldName) {
        if (this.FIELD_TIERS.CRITICAL.includes(fieldName)) return this.TOKEN_BUDGETS.CRITICAL;
        if (this.FIELD_TIERS.HIGH.includes(fieldName)) return this.TOKEN_BUDGETS.HIGH;
        if (this.FIELD_TIERS.MEDIUM.includes(fieldName)) return this.TOKEN_BUDGETS.MEDIUM;
        return this.TOKEN_BUDGETS.LOW;
    },

    /**
     * Check if a field can be AI-generated
     */
    isFieldEnhanceable(fieldName) {
        return [
            ...this.FIELD_TIERS.CRITICAL,
            ...this.FIELD_TIERS.HIGH,
            ...this.FIELD_TIERS.MEDIUM
        ].includes(fieldName);
    },

    /**
     * Build enriched context for field generation
     * @param {String} fieldName - Field to generate
     * @param {Object} feature - Feature object
     * @param {Object} workspace - Workspace context
     * @returns {Object} Enriched context
     */
    buildContext(fieldName, feature, workspace = {}) {
        const context = {
            featureName: feature.name,
            purpose: feature.purpose,
            type: feature.type,
            category: feature.category,
            workspaceGoals: workspace.customInstructions || '',
            existingFields: {}
        };

        // Add dependent fields to context
        const dependencies = this.FIELD_DEPENDENCIES[fieldName] || [];
        dependencies.forEach(dep => {
            if (feature[dep]) {
                context.existingFields[dep] = feature[dep];
            }
        });

        // Add timeline items if relevant
        if (feature.timelineItems && feature.timelineItems.length > 0) {
            context.timeline = feature.timelineItems.map(item => ({
                timeline: item.timeline,
                difficulty: item.difficulty,
                usp: item.usp,
                category: item.category
            }));
        }

        return context;
    },

    /**
     * Build prompt for specific field type
     * @param {String} fieldName - Field to generate
     * @param {Object} context - Context object
     * @returns {String} Prompt text
     */
    buildFieldPrompt(fieldName, context) {
        const prompts = {
            // CRITICAL TIER
            'purpose': `Analyze this feature and write a clear, concise purpose statement:
Feature Name: ${context.featureName}
Type: ${context.type}

Purpose should answer: What does this feature do? Who is it for? What problem does it solve?
Keep it under 200 words, focused and specific.`,

            'customer_impact': `Analyze the customer impact for this feature:
Feature: ${context.featureName}
Purpose: ${context.purpose}

Describe:
1. Which customers/users benefit
2. What specific pain points it addresses
3. Measurable improvements to user experience
4. Business value delivered

Be specific and quantifiable where possible.`,

            'acceptance_criteria': `Generate 3-5 clear, testable acceptance criteria for this feature:
Feature: ${context.featureName}
Purpose: ${context.purpose}
Customer Impact: ${context.existingFields.customer_impact || 'N/A'}

Format each criterion as:
- GIVEN [context]
- WHEN [action]
- THEN [expected result]

Make them specific, measurable, and testable.`,

            'definition_of_done': `Generate a definition of done checklist for this feature:
Feature: ${context.featureName}
Purpose: ${context.purpose}
Acceptance Criteria: ${JSON.stringify(context.existingFields.acceptance_criteria || [])}

Include:
- Code complete items
- Testing requirements
- Documentation needs
- Deployment criteria
- Quality gates

Provide 5-8 specific, actionable items.`,

            'execution_steps': `Break down this feature into detailed implementation steps:
Feature: ${context.featureName}
Purpose: ${context.purpose}
Timeline: ${context.timeline ? context.timeline.map(t => t.timeline).join(', ') : 'Not specified'}

Generate 5-8 sequential steps covering:
1. Setup/prerequisites
2. Core implementation
3. Integration points
4. Testing
5. Deployment preparation

Format: {"step": "Step description", "order": 1, "estimatedDuration": "2 hours", "dependencies": []}`,

            'risks': `Identify 3-5 key risks for this feature:
Feature: ${context.featureName}
Purpose: ${context.purpose}
Category: ${context.category}

For each risk, provide:
- Description: What could go wrong
- Mitigation: How to prevent/handle it
- Severity: critical/high/medium/low
- Probability: very_likely/likely/possible/unlikely
- Category: technical/business/resource/schedule/external

Focus on realistic, actionable risks.`,

            'success_metrics': `Define 3-5 success metrics for this feature:
Feature: ${context.featureName}
Purpose: ${context.purpose}
Customer Impact: ${context.existingFields.customer_impact || 'N/A'}

Format: {"metric": "Metric name", "target": "Target value", "measurement": "How to measure"}

Use SMART criteria (Specific, Measurable, Achievable, Relevant, Time-bound).`,

            // HIGH TIER
            'priority': `Calculate priority level for this feature:
Feature: ${context.featureName}
Business Value: ${context.existingFields.business_value || 'medium'}
Customer Impact: ${context.existingFields.customer_impact || 'N/A'}
Dependencies: ${context.existingFields.dependencies || 'None'}

Consider: business value, customer impact, dependencies, urgency, effort
Return one of: critical, high, medium, low
Explain reasoning in one sentence.`,

            'story_points': `Estimate story points for this feature using Fibonacci scale (1,2,3,5,8,13,21):
Feature: ${context.featureName}
Purpose: ${context.purpose}
Execution Steps: ${context.existingFields.execution_steps ? context.existingFields.execution_steps.length + ' steps' : 'Not defined'}

Consider: complexity, unknowns, dependencies, size
Provide the number and brief justification.`,

            'estimated_hours': `Estimate development hours for this feature:
Feature: ${context.featureName}
Story Points: ${context.existingFields.story_points || 'Not set'}
Execution Steps: ${context.existingFields.execution_steps ? context.existingFields.execution_steps.length + ' steps' : 'Not defined'}

Break down: development, testing, documentation, deployment
Provide total hours estimate (realistic, accounting for unknowns).`,

            'tags': `Generate 3-5 relevant tags for this feature:
Feature: ${context.featureName}
Purpose: ${context.purpose}
Category: ${context.category}

Tags should cover: domain, technology, user group, functionality type
Return as comma-separated list.`,

            'strategic_alignment': `Analyze strategic alignment for this feature:
Feature: ${context.featureName}
Purpose: ${context.purpose}
Workspace Goals: ${context.workspaceGoals || 'Not specified'}

Explain how this feature aligns with overall product/business strategy.
Keep to 2-3 sentences.`
        };

        return prompts[fieldName] || `Generate appropriate content for the ${fieldName} field based on:
Feature: ${context.featureName}
Purpose: ${context.purpose}`;
    },

    /**
     * Generate value for a single field
     * @param {String} fieldName - Field to generate
     * @param {Object} feature - Feature object
     * @param {Object} workspace - Workspace context
     * @returns {Promise<Object>} Generated content + metadata
     */
    async generateField(fieldName, feature, workspace = {}) {
        if (!this.isFieldEnhanceable(fieldName)) {
            throw new Error(`Field ${fieldName} is not AI-enhanceable`);
        }

        // Check dependencies are met
        const dependencies = this.FIELD_DEPENDENCIES[fieldName] || [];
        const missingDeps = dependencies.filter(dep => !feature[dep]);
        if (missingDeps.length > 0) {
            console.warn(`⚠️ Missing dependencies for ${fieldName}:`, missingDeps);
        }

        // Build context and prompt
        const context = this.buildContext(fieldName, feature, workspace);
        const prompt = this.buildFieldPrompt(fieldName, context);

        // Call AI with appropriate model and token budget
        const model = this.selectModel(fieldName);
        const maxTokens = this.getTokenBudget(fieldName);

        try {
            const response = await apiService.sendMessage(prompt, {
                model: model,
                max_tokens: maxTokens,
                temperature: 0.7
            });

            return {
                fieldName,
                value: response,
                model,
                tokensUsed: response.length / 4, // Rough estimate
                generatedAt: new Date().toISOString(),
                confidence: missingDeps.length === 0 ? 0.9 : 0.7,
                dependencies: dependencies,
                missingDependencies: missingDeps
            };
        } catch (error) {
            console.error(`❌ Error generating ${fieldName}:`, error);
            throw error;
        }
    },

    /**
     * Generate multiple fields in batch with dependency resolution
     * @param {Array<String>} fieldNames - Fields to generate
     * @param {Object} feature - Feature object
     * @param {Object} workspace - Workspace context
     * @returns {Promise<Object>} Generated fields map
     */
    async generateBatch(fieldNames, feature, workspace = {}) {
        const results = {};
        const errors = {};

        // Sort fields by tier priority (Critical first)
        const sortedFields = this.sortFieldsByPriority(fieldNames);

        // Track total tokens
        let totalTokens = 0;

        for (const fieldName of sortedFields) {
            try {
                console.log(`🤖 Generating ${fieldName}...`);

                // Use previously generated fields in this batch
                const enrichedFeature = { ...feature, ...results };

                const result = await this.generateField(fieldName, enrichedFeature, workspace);
                results[fieldName] = result;
                totalTokens += result.tokensUsed;

                console.log(`✅ Generated ${fieldName} (${Math.round(result.tokensUsed)} tokens)`);
            } catch (error) {
                console.error(`❌ Failed to generate ${fieldName}:`, error);
                errors[fieldName] = error.message;
            }
        }

        return {
            success: Object.keys(results).length > 0,
            results,
            errors,
            totalTokens,
            fieldsGenerated: Object.keys(results).length,
            fieldsFailed: Object.keys(errors).length
        };
    },

    /**
     * Sort fields by tier priority
     */
    sortFieldsByPriority(fieldNames) {
        return fieldNames.sort((a, b) => {
            const getTier = (field) => {
                if (this.FIELD_TIERS.CRITICAL.includes(field)) return 1;
                if (this.FIELD_TIERS.HIGH.includes(field)) return 2;
                if (this.FIELD_TIERS.MEDIUM.includes(field)) return 3;
                return 4;
            };

            return getTier(a) - getTier(b);
        });
    },

    /**
     * Detect which fields would benefit from AI generation
     * @param {Object} feature - Feature object
     * @returns {Array<Object>} Suggested fields with reasoning
     */
    detectEnhanceableFields(feature) {
        const suggestions = [];

        // Check critical fields
        if (!feature.purpose || feature.purpose.length < 20) {
            suggestions.push({
                field: 'purpose',
                tier: 'CRITICAL',
                reason: 'Clear purpose statement is foundation for all planning',
                priority: 1
            });
        }

        if (!feature.customer_impact) {
            suggestions.push({
                field: 'customer_impact',
                tier: 'CRITICAL',
                reason: 'Understanding customer impact drives prioritization',
                priority: 1
            });
        }

        if (!feature.acceptance_criteria || feature.acceptance_criteria.length === 0) {
            suggestions.push({
                field: 'acceptance_criteria',
                tier: 'CRITICAL',
                reason: 'Define clear success criteria before implementation',
                priority: 1
            });
        }

        if (!feature.definition_of_done || feature.definition_of_done.length === 0) {
            suggestions.push({
                field: 'definition_of_done',
                tier: 'CRITICAL',
                reason: 'Quality gates ensure consistent delivery standards',
                priority: 1
            });
        }

        // Check high value fields
        if (!feature.story_points && feature.purpose) {
            suggestions.push({
                field: 'story_points',
                tier: 'HIGH',
                reason: 'Effort estimation helps with planning and prioritization',
                priority: 2
            });
        }

        if (!feature.tags || feature.tags.length === 0) {
            suggestions.push({
                field: 'tags',
                tier: 'HIGH',
                reason: 'Tags improve discoverability and organization',
                priority: 2
            });
        }

        if (!feature.business_value && feature.purpose) {
            suggestions.push({
                field: 'business_value',
                tier: 'HIGH',
                reason: 'Business value assessment enables ROI-based prioritization',
                priority: 2
            });
        }

        // Sort by priority
        return suggestions.sort((a, b) => a.priority - b.priority);
    },

    /**
     * Calculate estimated cost for field generation
     * @param {Array<String>} fieldNames - Fields to generate
     * @returns {Object} Cost estimate
     */
    estimateCost(fieldNames) {
        let totalTokens = 0;
        const breakdown = {};

        fieldNames.forEach(field => {
            const budget = this.getTokenBudget(field);
            totalTokens += budget;
            breakdown[field] = budget;
        });

        // Rough cost estimate (Claude pricing varies)
        // Sonnet: ~$3/$15 per MTok (input/output)
        // Haiku: ~$0.25/$1.25 per MTok
        const estimatedCost = (totalTokens / 1000000) * 5; // Conservative estimate

        return {
            totalTokens,
            estimatedCost: `$${estimatedCost.toFixed(4)}`,
            breakdown
        };
    }
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = aiEnhancementService;
}
