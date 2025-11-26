/**
 * AI Cost Manager Service
 * Handles cost tracking, rate limiting, and budget management for AI operations
 *
 * Purpose: Prevent runaway AI costs and track usage
 * Integration: Works with ai-enhancement-service.js
 */

const aiCostManager = {
    /**
     * Cost configuration
     */
    PRICING: {
        'claude-3-5-sonnet-20241022': {
            input: 3.00 / 1000000,   // $3 per MTok
            output: 15.00 / 1000000   // $15 per MTok
        },
        'claude-3-5-haiku-20241022': {
            input: 0.25 / 1000000,    // $0.25 per MTok
            output: 1.25 / 1000000    // $1.25 per MTok
        }
    },

    /**
     * Budget limits
     */
    BUDGETS: {
        perField: 0.05,        // $0.05 per field max
        perFeature: 0.50,      // $0.50 per feature max
        perWorkspace: 10.00,   // $10 per workspace per day
        perUser: 50.00         // $50 per user per month
    },

    /**
     * Rate limits
     */
    RATE_LIMITS: {
        requestsPerMinute: 10,
        requestsPerHour: 100,
        tokensPerMinute: 50000,
        tokensPerHour: 200000
    },

    /**
     * Storage keys
     */
    STORAGE_KEYS: {
        usage: 'ai_usage_tracking',
        budgets: 'ai_budgets',
        rateLimits: 'ai_rate_limits'
    },

    /**
     * Initialize cost manager
     */
    init() {
        this.loadUsageData();
        this.resetRateLimitsIfNeeded();

        console.log('💰 AI Cost Manager initialized');
    },

    /**
     * Load usage data from localStorage
     */
    loadUsageData() {
        try {
            const stored = localStorage.getItem(this.STORAGE_KEYS.usage);
            this.usageData = stored ? JSON.parse(stored) : this.createEmptyUsageData();
        } catch (error) {
            console.error('Error loading usage data:', error);
            this.usageData = this.createEmptyUsageData();
        }
    },

    /**
     * Create empty usage data structure
     */
    createEmptyUsageData() {
        return {
            userId: 'default',
            features: {},        // featureId -> usage
            workspaces: {},      // workspaceId -> usage
            daily: {},           // date -> usage
            monthly: {},         // month -> usage
            totals: {
                requests: 0,
                tokensInput: 0,
                tokensOutput: 0,
                costUSD: 0
            }
        };
    },

    /**
     * Save usage data to localStorage
     */
    saveUsageData() {
        try {
            localStorage.setItem(this.STORAGE_KEYS.usage, JSON.stringify(this.usageData));
        } catch (error) {
            console.error('Error saving usage data:', error);
        }
    },

    /**
     * Reset rate limits if time period has passed
     */
    resetRateLimitsIfNeeded() {
        const now = Date.now();
        const limits = this.loadRateLimits();

        // Reset per-minute counters
        if (!limits.lastMinute || (now - limits.lastMinute) >= 60000) {
            limits.requestsThisMinute = 0;
            limits.tokensThisMinute = 0;
            limits.lastMinute = now;
        }

        // Reset per-hour counters
        if (!limits.lastHour || (now - limits.lastHour) >= 3600000) {
            limits.requestsThisHour = 0;
            limits.tokensThisHour = 0;
            limits.lastHour = now;
        }

        this.saveRateLimits(limits);
        return limits;
    },

    /**
     * Load rate limit counters
     */
    loadRateLimits() {
        try {
            const stored = localStorage.getItem(this.STORAGE_KEYS.rateLimits);
            return stored ? JSON.parse(stored) : {
                requestsThisMinute: 0,
                tokensThisMinute: 0,
                requestsThisHour: 0,
                tokensThisHour: 0,
                lastMinute: Date.now(),
                lastHour: Date.now()
            };
        } catch (error) {
            console.error('Error loading rate limits:', error);
            return {
                requestsThisMinute: 0,
                tokensThisMinute: 0,
                requestsThisHour: 0,
                tokensThisHour: 0,
                lastMinute: Date.now(),
                lastHour: Date.now()
            };
        }
    },

    /**
     * Save rate limit counters
     */
    saveRateLimits(limits) {
        try {
            localStorage.setItem(this.STORAGE_KEYS.rateLimits, JSON.stringify(limits));
        } catch (error) {
            console.error('Error saving rate limits:', error);
        }
    },

    /**
     * Check if operation would exceed rate limits
     * @param {Number} estimatedTokens - Estimated tokens for operation
     * @returns {Object} {allowed: boolean, reason: string}
     */
    checkRateLimit(estimatedTokens) {
        const limits = this.resetRateLimitsIfNeeded();

        // Check requests per minute
        if (limits.requestsThisMinute >= this.RATE_LIMITS.requestsPerMinute) {
            return {
                allowed: false,
                reason: `Rate limit: Maximum ${this.RATE_LIMITS.requestsPerMinute} requests per minute`,
                waitTimeMs: 60000 - (Date.now() - limits.lastMinute)
            };
        }

        // Check requests per hour
        if (limits.requestsThisHour >= this.RATE_LIMITS.requestsPerHour) {
            return {
                allowed: false,
                reason: `Rate limit: Maximum ${this.RATE_LIMITS.requestsPerHour} requests per hour`,
                waitTimeMs: 3600000 - (Date.now() - limits.lastHour)
            };
        }

        // Check tokens per minute
        if (limits.tokensThisMinute + estimatedTokens > this.RATE_LIMITS.tokensPerMinute) {
            return {
                allowed: false,
                reason: `Rate limit: Maximum ${this.RATE_LIMITS.tokensPerMinute} tokens per minute`,
                waitTimeMs: 60000 - (Date.now() - limits.lastMinute)
            };
        }

        // Check tokens per hour
        if (limits.tokensThisHour + estimatedTokens > this.RATE_LIMITS.tokensPerHour) {
            return {
                allowed: false,
                reason: `Rate limit: Maximum ${this.RATE_LIMITS.tokensPerHour} tokens per hour`,
                waitTimeMs: 3600000 - (Date.now() - limits.lastHour)
            };
        }

        return { allowed: true };
    },

    /**
     * Check if operation would exceed budget limits
     * @param {String} context - 'field', 'feature', 'workspace', or 'user'
     * @param {String} id - Context ID
     * @param {Number} estimatedCost - Estimated cost in USD
     * @returns {Object} {allowed: boolean, reason: string}
     */
    checkBudget(context, id, estimatedCost) {
        const today = new Date().toISOString().split('T')[0];
        const thisMonth = today.substring(0, 7);

        // Check per-field budget
        if (context === 'field') {
            if (estimatedCost > this.BUDGETS.perField) {
                return {
                    allowed: false,
                    reason: `Budget exceeded: Maximum $${this.BUDGETS.perField} per field`,
                    budget: this.BUDGETS.perField,
                    estimated: estimatedCost
                };
            }
        }

        // Check per-feature budget
        if (context === 'feature') {
            const featureUsage = this.usageData.features[id] || { costUSD: 0 };
            if (featureUsage.costUSD + estimatedCost > this.BUDGETS.perFeature) {
                return {
                    allowed: false,
                    reason: `Budget exceeded: Maximum $${this.BUDGETS.perFeature} per feature`,
                    budget: this.BUDGETS.perFeature,
                    used: featureUsage.costUSD,
                    estimated: estimatedCost
                };
            }
        }

        // Check per-workspace daily budget
        if (context === 'workspace') {
            const workspaceDailyUsage = this.usageData.daily[today]?.workspaces?.[id]?.costUSD || 0;
            if (workspaceDailyUsage + estimatedCost > this.BUDGETS.perWorkspace) {
                return {
                    allowed: false,
                    reason: `Budget exceeded: Maximum $${this.BUDGETS.perWorkspace} per workspace per day`,
                    budget: this.BUDGETS.perWorkspace,
                    used: workspaceDailyUsage,
                    estimated: estimatedCost
                };
            }
        }

        // Check per-user monthly budget
        const monthlyUsage = this.usageData.monthly[thisMonth]?.costUSD || 0;
        if (monthlyUsage + estimatedCost > this.BUDGETS.perUser) {
            return {
                allowed: false,
                reason: `Budget exceeded: Maximum $${this.BUDGETS.perUser} per month`,
                budget: this.BUDGETS.perUser,
                used: monthlyUsage,
                estimated: estimatedCost
            };
        }

        return { allowed: true };
    },

    /**
     * Track AI operation usage
     * @param {Object} operation - Operation details
     */
    trackUsage(operation) {
        const {
            featureId,
            workspaceId,
            fieldName,
            model,
            tokensInput,
            tokensOutput,
            success
        } = operation;

        const cost = this.calculateCost(model, tokensInput, tokensOutput);
        const today = new Date().toISOString().split('T')[0];
        const thisMonth = today.substring(0, 7);

        // Update totals
        this.usageData.totals.requests++;
        this.usageData.totals.tokensInput += tokensInput;
        this.usageData.totals.tokensOutput += tokensOutput;
        this.usageData.totals.costUSD += cost;

        // Update feature-level usage
        if (featureId) {
            if (!this.usageData.features[featureId]) {
                this.usageData.features[featureId] = {
                    requests: 0,
                    tokensInput: 0,
                    tokensOutput: 0,
                    costUSD: 0,
                    fields: {}
                };
            }
            this.usageData.features[featureId].requests++;
            this.usageData.features[featureId].tokensInput += tokensInput;
            this.usageData.features[featureId].tokensOutput += tokensOutput;
            this.usageData.features[featureId].costUSD += cost;

            if (fieldName) {
                if (!this.usageData.features[featureId].fields[fieldName]) {
                    this.usageData.features[featureId].fields[fieldName] = {
                        requests: 0,
                        tokensInput: 0,
                        tokensOutput: 0,
                        costUSD: 0
                    };
                }
                this.usageData.features[featureId].fields[fieldName].requests++;
                this.usageData.features[featureId].fields[fieldName].tokensInput += tokensInput;
                this.usageData.features[featureId].fields[fieldName].tokensOutput += tokensOutput;
                this.usageData.features[featureId].fields[fieldName].costUSD += cost;
            }
        }

        // Update workspace-level usage
        if (workspaceId) {
            if (!this.usageData.workspaces[workspaceId]) {
                this.usageData.workspaces[workspaceId] = {
                    requests: 0,
                    tokensInput: 0,
                    tokensOutput: 0,
                    costUSD: 0
                };
            }
            this.usageData.workspaces[workspaceId].requests++;
            this.usageData.workspaces[workspaceId].tokensInput += tokensInput;
            this.usageData.workspaces[workspaceId].tokensOutput += tokensOutput;
            this.usageData.workspaces[workspaceId].costUSD += cost;
        }

        // Update daily usage
        if (!this.usageData.daily[today]) {
            this.usageData.daily[today] = {
                requests: 0,
                tokensInput: 0,
                tokensOutput: 0,
                costUSD: 0,
                workspaces: {}
            };
        }
        this.usageData.daily[today].requests++;
        this.usageData.daily[today].tokensInput += tokensInput;
        this.usageData.daily[today].tokensOutput += tokensOutput;
        this.usageData.daily[today].costUSD += cost;

        if (workspaceId) {
            if (!this.usageData.daily[today].workspaces[workspaceId]) {
                this.usageData.daily[today].workspaces[workspaceId] = {
                    requests: 0,
                    tokensInput: 0,
                    tokensOutput: 0,
                    costUSD: 0
                };
            }
            this.usageData.daily[today].workspaces[workspaceId].requests++;
            this.usageData.daily[today].workspaces[workspaceId].tokensInput += tokensInput;
            this.usageData.daily[today].workspaces[workspaceId].tokensOutput += tokensOutput;
            this.usageData.daily[today].workspaces[workspaceId].costUSD += cost;
        }

        // Update monthly usage
        if (!this.usageData.monthly[thisMonth]) {
            this.usageData.monthly[thisMonth] = {
                requests: 0,
                tokensInput: 0,
                tokensOutput: 0,
                costUSD: 0
            };
        }
        this.usageData.monthly[thisMonth].requests++;
        this.usageData.monthly[thisMonth].tokensInput += tokensInput;
        this.usageData.monthly[thisMonth].tokensOutput += tokensOutput;
        this.usageData.monthly[thisMonth].costUSD += cost;

        // Update rate limits
        const limits = this.loadRateLimits();
        limits.requestsThisMinute++;
        limits.tokensThisMinute += (tokensInput + tokensOutput);
        limits.requestsThisHour++;
        limits.tokensThisHour += (tokensInput + tokensOutput);
        this.saveRateLimits(limits);

        // Save usage data
        this.saveUsageData();

        return {
            cost,
            totalCost: this.usageData.totals.costUSD,
            featureCost: featureId ? this.usageData.features[featureId].costUSD : 0,
            workspaceDailyCost: workspaceId ? (this.usageData.daily[today]?.workspaces?.[workspaceId]?.costUSD || 0) : 0,
            monthlyTotal: this.usageData.monthly[thisMonth].costUSD
        };
    },

    /**
     * Calculate cost for an AI operation
     * @param {String} model - Model name
     * @param {Number} tokensInput - Input tokens
     * @param {Number} tokensOutput - Output tokens
     * @returns {Number} Cost in USD
     */
    calculateCost(model, tokensInput, tokensOutput) {
        const pricing = this.PRICING[model];
        if (!pricing) {
            console.warn(`Unknown model pricing: ${model}, using Sonnet pricing`);
            return (tokensInput * this.PRICING['claude-3-5-sonnet-20241022'].input) +
                   (tokensOutput * this.PRICING['claude-3-5-sonnet-20241022'].output);
        }

        return (tokensInput * pricing.input) + (tokensOutput * pricing.output);
    },

    /**
     * Get usage summary
     * @param {String} context - 'feature', 'workspace', 'daily', 'monthly', or 'total'
     * @param {String} id - Context ID
     * @returns {Object} Usage summary
     */
    getUsageSummary(context = 'total', id = null) {
        if (context === 'total') {
            return {
                ...this.usageData.totals,
                averageCostPerRequest: this.usageData.totals.requests > 0
                    ? this.usageData.totals.costUSD / this.usageData.totals.requests
                    : 0
            };
        }

        if (context === 'feature' && id) {
            return this.usageData.features[id] || this.createEmptyUsageData().features;
        }

        if (context === 'workspace' && id) {
            return this.usageData.workspaces[id] || this.createEmptyUsageData().workspaces;
        }

        if (context === 'daily' && id) {
            return this.usageData.daily[id] || { requests: 0, tokensInput: 0, tokensOutput: 0, costUSD: 0 };
        }

        if (context === 'monthly' && id) {
            return this.usageData.monthly[id] || { requests: 0, tokensInput: 0, tokensOutput: 0, costUSD: 0 };
        }

        return null;
    },

    /**
     * Get remaining budget
     * @param {String} context - 'field', 'feature', 'workspace', or 'user'
     * @param {String} id - Context ID
     * @returns {Object} Budget status
     */
    getRemainingBudget(context, id = null) {
        const today = new Date().toISOString().split('T')[0];
        const thisMonth = today.substring(0, 7);

        if (context === 'field') {
            return {
                budget: this.BUDGETS.perField,
                remaining: this.BUDGETS.perField, // Per-field budget resets each time
                used: 0
            };
        }

        if (context === 'feature' && id) {
            const used = this.usageData.features[id]?.costUSD || 0;
            return {
                budget: this.BUDGETS.perFeature,
                used,
                remaining: this.BUDGETS.perFeature - used,
                percentUsed: (used / this.BUDGETS.perFeature) * 100
            };
        }

        if (context === 'workspace' && id) {
            const used = this.usageData.daily[today]?.workspaces?.[id]?.costUSD || 0;
            return {
                budget: this.BUDGETS.perWorkspace,
                used,
                remaining: this.BUDGETS.perWorkspace - used,
                percentUsed: (used / this.BUDGETS.perWorkspace) * 100,
                resetsAt: new Date(new Date(today).getTime() + 86400000).toISOString()
            };
        }

        if (context === 'user') {
            const used = this.usageData.monthly[thisMonth]?.costUSD || 0;
            return {
                budget: this.BUDGETS.perUser,
                used,
                remaining: this.BUDGETS.perUser - used,
                percentUsed: (used / this.BUDGETS.perUser) * 100,
                resetsAt: new Date(new Date(thisMonth + '-01').getTime() + 2678400000).toISOString()
            };
        }

        return null;
    }
};

// Initialize on load
if (typeof window !== 'undefined') {
    aiCostManager.init();
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = aiCostManager;
}
