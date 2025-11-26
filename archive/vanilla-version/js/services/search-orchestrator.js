// Search Orchestrator Service - Intelligent routing to best search API
const searchOrchestrator = {
    /**
     * Routes search query to best API(s) based on feature and intent
     * @param {Object} feature - Feature object to search for
     * @param {String} userIntent - Optional: 'auto', 'quick-facts', 'code-examples', 'comprehensive-research', 'best-practices'
     * @param {Object} app - App instance (for calling findInspiration, findInspirationWithExa, getPerplexityInsights)
     * @returns {Array} Search results with source metadata
     */
    async routeSearch(feature, userIntent = 'auto', app = null) {
        if (!feature) {
            console.error('❌ No feature provided for search routing');
            return [];
        }

        // Analyze what the user needs
        const intent = userIntent === 'auto'
            ? this.analyzeIntent(feature)
            : { primary: userIntent, confidence: 1.0, reasoning: 'User specified intent' };

        console.log('🔀 Routing search with intent:', intent);

        // Check which APIs are available
        const availableApis = this.checkAvailableApis();

        const results = [];

        // Route based on intent and availability
        switch (intent.primary) {
            case 'quick-facts':
                // Quick facts → Perplexity (if available) OR Tavily
                if (availableApis.perplexity) {
                    console.log('→ Using Perplexity for quick facts');
                    if (app && app.getPerplexityInsights) {
                        const insights = await this.safeCall(() => app.getPerplexityInsights(), 'Perplexity');
                        results.push(...insights);
                    } else {
                        // Use perplexityService directly
                        const insights = await this.safeCall(() => perplexityService.getInsights(feature, app), 'Perplexity');
                        if (insights && insights.inspirationItems) {
                            results.push(...insights.inspirationItems);
                        }
                    }
                } else if (availableApis.tavily) {
                    console.log('→ Using Tavily for quick facts');
                    if (app && app.findInspiration) {
                        const tavily = await this.safeCall(() => app.findInspiration(), 'Tavily');
                        results.push(...tavily);
                    } else {
                        const tavily = await this.safeCall(() => tavilyService.findInspiration(feature, app), 'Tavily');
                        results.push(...tavily);
                    }
                }
                break;

            case 'code-examples':
                // Code & implementation → Exa (semantic) OR Tavily
                if (availableApis.exa) {
                    console.log('→ Using Exa for code examples');
                    if (app && app.findInspirationWithExa) {
                        const exa = await this.safeCall(() => app.findInspirationWithExa(), 'Exa');
                        results.push(...exa);
                    } else {
                        const exa = await this.safeCall(() => exaService.findInspiration(feature, app), 'Exa');
                        results.push(...exa);
                    }
                } else if (availableApis.tavily) {
                    console.log('→ Using Tavily for code examples');
                    if (app && app.findInspiration) {
                        const tavily = await this.safeCall(() => app.findInspiration(), 'Tavily');
                        results.push(...tavily);
                    } else {
                        const tavily = await this.safeCall(() => tavilyService.findInspiration(feature, app), 'Tavily');
                        results.push(...tavily);
                    }
                }
                break;

            case 'comprehensive-research':
                // Comprehensive → Use ALL available APIs
                console.log('→ Using all available APIs for comprehensive research');
                const searchPromises = [];

                if (availableApis.tavily) {
                    if (app && app.findInspiration) {
                        searchPromises.push(this.safeCall(() => app.findInspiration(), 'Tavily'));
                    } else {
                        searchPromises.push(this.safeCall(() => tavilyService.findInspiration(feature, app), 'Tavily'));
                    }
                }

                if (availableApis.exa) {
                    if (app && app.findInspirationWithExa) {
                        searchPromises.push(this.safeCall(() => app.findInspirationWithExa(), 'Exa'));
                    } else {
                        searchPromises.push(this.safeCall(() => exaService.findInspiration(feature, app), 'Exa'));
                    }
                }

                if (availableApis.perplexity) {
                    if (app && app.getPerplexityInsights) {
                        searchPromises.push(this.safeCall(() => app.getPerplexityInsights(), 'Perplexity'));
                    } else {
                        searchPromises.push(
                            this.safeCall(async () => {
                                const insights = await perplexityService.getInsights(feature, app);
                                return insights.inspirationItems || [];
                            }, 'Perplexity')
                        );
                    }
                }

                const allResults = await Promise.all(searchPromises);
                results.push(...allResults.flat());
                break;

            case 'best-practices':
                // Best practices → Perplexity (with citations) OR Exa (semantic)
                if (availableApis.perplexity) {
                    console.log('→ Using Perplexity for best practices');
                    if (app && app.getPerplexityInsights) {
                        const insights = await this.safeCall(() => app.getPerplexityInsights(), 'Perplexity');
                        results.push(...insights);
                    } else {
                        const insights = await this.safeCall(() => perplexityService.getInsights(feature, app), 'Perplexity');
                        if (insights && insights.inspirationItems) {
                            results.push(...insights.inspirationItems);
                        }
                    }
                } else if (availableApis.exa) {
                    console.log('→ Using Exa for best practices');
                    if (app && app.findInspirationWithExa) {
                        const exa = await this.safeCall(() => app.findInspirationWithExa(), 'Exa');
                        results.push(...exa);
                    } else {
                        const exa = await this.safeCall(() => exaService.findInspiration(feature, app), 'Exa');
                        results.push(...exa);
                    }
                } else if (availableApis.tavily) {
                    console.log('→ Using Tavily for best practices');
                    if (app && app.findInspiration) {
                        const tavily = await this.safeCall(() => app.findInspiration(), 'Tavily');
                        results.push(...tavily);
                    } else {
                        const tavily = await this.safeCall(() => tavilyService.findInspiration(feature, app), 'Tavily');
                        results.push(...tavily);
                    }
                }
                break;

            default:
                // Fallback: Use first available API
                console.log('→ Using fallback: first available API');
                if (availableApis.tavily) {
                    if (app && app.findInspiration) {
                        const tavily = await this.safeCall(() => app.findInspiration(), 'Tavily');
                        results.push(...tavily);
                    } else {
                        const tavily = await this.safeCall(() => tavilyService.findInspiration(feature, app), 'Tavily');
                        results.push(...tavily);
                    }
                } else if (availableApis.exa) {
                    if (app && app.findInspirationWithExa) {
                        const exa = await this.safeCall(() => app.findInspirationWithExa(), 'Exa');
                        results.push(...exa);
                    } else {
                        const exa = await this.safeCall(() => exaService.findInspiration(feature, app), 'Exa');
                        results.push(...exa);
                    }
                } else if (availableApis.perplexity) {
                    if (app && app.getPerplexityInsights) {
                        const insights = await this.safeCall(() => app.getPerplexityInsights(), 'Perplexity');
                        results.push(...insights);
                    } else {
                        const insights = await this.safeCall(() => perplexityService.getInsights(feature, app), 'Perplexity');
                        if (insights && insights.inspirationItems) {
                            results.push(...insights.inspirationItems);
                        }
                    }
                }
        }

        return results;
    },

    /**
     * Safe API call with error handling
     * @param {Function} fn - Function to execute
     * @param {String} apiName - Name of API for logging
     * @returns {Array} Results or empty array on error
     */
    async safeCall(fn, apiName) {
        try {
            return await fn() || [];
        } catch (error) {
            console.error(`${apiName} search failed:`, error);
            return [];
        }
    },

    /**
     * Check which search APIs are available (have API keys)
     * @returns {Object} Object with boolean flags for each API
     */
    checkAvailableApis() {
        return {
            tavily: !!storageService.loadTavilyApiKey(),
            exa: !!storageService.loadExaApiKey(),
            perplexity: !!storageService.loadPerplexityApiKey()
        };
    },

    /**
     * Analyze feature to determine search intent
     * @param {Object} feature - Feature to analyze
     * @returns {Object} Intent analysis with primary intent, confidence, reasoning
     */
    analyzeIntent(feature) {
        let score = {
            'quick-facts': 0,
            'code-examples': 0,
            'comprehensive-research': 0,
            'best-practices': 0
        };

        // Analyze categories
        const categories = feature.categories || [];

        if (categories.includes('Research')) {
            score['comprehensive-research'] += 30;
            score['quick-facts'] += 10;
        }

        if (categories.includes('AI/ML') || categories.includes('Frontend')) {
            score['code-examples'] += 25;
            score['comprehensive-research'] += 15;
        }

        if (categories.includes('Security') || categories.includes('Backend')) {
            score['best-practices'] += 25;
            score['comprehensive-research'] += 10;
        }

        // Analyze existing data
        const hasExecutionSteps = feature.executionSteps && feature.executionSteps.length > 0;
        const hasResources = feature.resources && feature.resources.technologies;
        const hasRisks = feature.risks && feature.risks.length > 0;

        if (!hasExecutionSteps) {
            score['code-examples'] += 20;
            score['comprehensive-research'] += 10;
        }

        if (!hasResources) {
            score['code-examples'] += 15;
            score['quick-facts'] += 10;
        }

        if (hasRisks) {
            score['best-practices'] += 20;
        }

        // Analyze feature complexity
        const complexity = feature.difficulty || 'medium';
        if (complexity === 'hard' || complexity === 'epic') {
            score['comprehensive-research'] += 20;
            score['best-practices'] += 15;
        }

        // Determine primary intent
        const sortedIntents = Object.entries(score)
            .sort((a, b) => b[1] - a[1]);

        const primary = sortedIntents[0][0];
        const maxScore = sortedIntents[0][1];
        const confidence = Math.min(maxScore / 50, 1); // Normalize to 0-1

        return {
            primary: primary,
            confidence: confidence,
            reasoning: this.explainIntent(primary, feature),
            scores: score
        };
    },

    /**
     * Generate human-readable explanation for search intent
     * @param {String} intent - Intent type
     * @param {Object} feature - Feature object
     * @returns {String} Explanation
     */
    explainIntent(intent, feature) {
        const reasons = [];

        switch (intent) {
            case 'quick-facts':
                reasons.push('Feature needs basic information');
                if (!feature.resources) reasons.push('Missing technology stack');
                break;

            case 'code-examples':
                reasons.push('Feature needs implementation guidance');
                if (!feature.executionSteps) reasons.push('Missing execution steps');
                if (feature.categories?.includes('Frontend') || feature.categories?.includes('AI/ML')) {
                    reasons.push('Technical category benefits from code examples');
                }
                break;

            case 'comprehensive-research':
                reasons.push('Complex feature requiring thorough research');
                if (feature.difficulty === 'hard' || feature.difficulty === 'epic') {
                    reasons.push('High complexity warrants comprehensive approach');
                }
                if (feature.categories?.includes('Research')) {
                    reasons.push('Research category requires depth');
                }
                break;

            case 'best-practices':
                reasons.push('Feature needs vetted best practices');
                if (feature.risks && feature.risks.length > 0) {
                    reasons.push('Identified risks require best practices');
                }
                if (feature.categories?.includes('Security')) {
                    reasons.push('Security category requires authoritative guidance');
                }
                break;
        }

        return reasons.join('; ');
    },

    /**
     * Merge and deduplicate results from multiple sources
     * @param {Array} results - Array of result arrays
     * @returns {Array} Merged and deduplicated results
     */
    mergeResults(results) {
        const seen = new Set();
        const merged = [];

        for (const result of results.flat()) {
            if (!result || !result.url) continue;

            // Use URL as unique identifier
            if (!seen.has(result.url)) {
                seen.add(result.url);
                merged.push(result);
            }
        }

        return merged;
    },

    /**
     * Rank results by relevance to feature
     * @param {Array} results - Results to rank
     * @param {Object} feature - Feature to rank against
     * @returns {Array} Ranked results
     */
    rankResults(results, feature) {
        return results.map(result => {
            let score = result.score || 50; // Base score

            // Boost if title matches feature name
            if (feature.name && result.title) {
                const featureName = feature.name.toLowerCase();
                const title = result.title.toLowerCase();
                if (title.includes(featureName)) {
                    score += 20;
                }
            }

            // Boost by source quality
            if (result.source === 'perplexity') score += 10; // Has citations
            if (result.source === 'exa') score += 5; // Semantic search

            // Boost by category match
            if (result.category && feature.categories) {
                const categories = feature.categories.map(c => c.toLowerCase());
                const resultCategory = result.category.toLowerCase();
                if (categories.some(c => resultCategory.includes(c))) {
                    score += 15;
                }
            }

            return { ...result, finalScore: score };
        }).sort((a, b) => b.finalScore - a.finalScore);
    },

    /**
     * Get summary of available search APIs
     * @returns {String} Summary string
     */
    getAvailabilityStatus() {
        const apis = this.checkAvailableApis();
        const available = Object.entries(apis)
            .filter(([_, enabled]) => enabled)
            .map(([name, _]) => name.charAt(0).toUpperCase() + name.slice(1));

        if (available.length === 0) {
            return 'No search APIs configured. Please add API keys in settings.';
        }

        return `Available: ${available.join(', ')}`;
    }
};
