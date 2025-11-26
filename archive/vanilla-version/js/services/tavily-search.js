// Tavily Search Service - Internet search API integration
const tavilyService = {
    // Execute Tavily API search
    async search(query, options = {}) {
        const apiKey = storageService.loadTavilyApiKey();
        if (!apiKey) {
            throw new Error('Tavily API key not configured');
        }

        const {
            searchDepth = 'basic',
            maxResults = 5,
            includeDomains = null,
            excludeDomains = null
        } = options;

        try {
            const response = await fetch('https://api.tavily.com/search', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    api_key: apiKey,
                    query: query,
                    search_depth: searchDepth,
                    max_results: maxResults,
                    include_domains: includeDomains,
                    exclude_domains: excludeDomains
                })
            });

            if (!response.ok) {
                throw new Error(`Tavily API error: ${response.statusText}`);
            }

            const data = await response.json();
            return data.results || [];
        } catch (error) {
            console.error('Tavily search error:', error);
            throw error;
        }
    },

    // Analyze feature to create search context
    analyzeFeatureForSearch(feature) {
        if (!feature) return null;

        const context = {
            feature: feature,
            categories: feature.categories || [],
            usp: feature.usp || '',
            techStack: []
        };

        // Extract tech stack from categories
        const techKeywords = ['react', 'node', 'python', 'java', 'docker', 'aws', 'api'];
        context.techStack = context.categories.filter(cat =>
            techKeywords.some(tech => cat.toLowerCase().includes(tech))
        );

        return context;
    },

    // Generate multiple smart queries for comprehensive search
    generateSmartQueries(feature, context) {
        if (!feature) return [];

        const queries = [];
        const name = feature.name || 'feature';
        const purpose = feature.purpose || '';

        // Quick facts query
        queries.push({
            query: `${name} implementation guide best practices`,
            type: 'quick-facts',
            depth: 'basic',
            maxResults: 3
        });

        // Code examples query
        if (context.techStack.length > 0) {
            queries.push({
                query: `${name} ${context.techStack.join(' ')} code example tutorial`,
                type: 'code-examples',
                depth: 'basic',
                maxResults: 5
            });
        }

        // Architecture query
        if (purpose) {
            queries.push({
                query: `${name} ${purpose} system architecture design patterns`,
                type: 'architecture',
                depth: 'advanced',
                maxResults: 4
            });
        }

        // Best practices query
        queries.push({
            query: `${name} production ready best practices checklist`,
            type: 'best-practices',
            depth: 'advanced',
            maxResults: 4
        });

        return queries;
    },

    // Categorize search result
    categorizeResult(result) {
        if (!result || !result.content) return 'general';

        const content = result.content.toLowerCase();
        const url = (result.url || '').toLowerCase();

        if (url.includes('github.com') || content.includes('repository')) return 'code-example';
        if (content.includes('tutorial') || content.includes('how to')) return 'tutorial';
        if (url.includes('docs.') || content.includes('documentation')) return 'documentation';
        if (content.includes('vs ') || content.includes('comparison')) return 'competitor';
        if (content.includes('best practice') || content.includes('checklist')) return 'best-practice';

        return 'general';
    },

    // Search internet and return results (with UI notifications)
    async searchInternet(query, options = {}) {
        const {
            showNotification = true,
            synthesizeWithAI = false
        } = options;

        try {
            const results = await this.search(query, options);

            if (showNotification && results.length > 0) {
                console.log(`✅ Found ${results.length} results for: ${query}`);
            }

            // Optionally synthesize results with AI (requires AI service)
            if (synthesizeWithAI && window.aiService) {
                const synthesis = await aiService.synthesizeSearchResults(query, results);
                return { results, synthesis };
            }

            return { results };
        } catch (error) {
            if (showNotification) {
                console.error(`❌ Search failed: ${error.message}`);
            }
            throw error;
        }
    },

    // Silent search (no notifications)
    async searchSilent(query, options = {}) {
        return this.searchInternet(query, { ...options, showNotification: false });
    },

    // Batch search with multiple queries
    async batchSearch(queries) {
        const results = [];
        const failed = [];

        for (const queryConfig of queries) {
            try {
                const queryResults = await this.search(queryConfig.query, {
                    searchDepth: queryConfig.depth || 'basic',
                    maxResults: queryConfig.maxResults || 5
                });

                results.push({
                    query: queryConfig.query,
                    type: queryConfig.type,
                    results: queryResults,
                    status: 'success'
                });
            } catch (error) {
                failed.push({
                    query: queryConfig.query,
                    type: queryConfig.type,
                    error: error.message,
                    status: 'failed'
                });
            }
        }

        return { results, failed };
    },

    // Find inspiration for a feature
    async findInspiration(feature, app) {
        if (!feature) {
            throw new Error('Feature is required');
        }

        try {
            // Analyze feature
            const context = this.analyzeFeatureForSearch(feature);

            // Generate queries
            const queries = this.generateSmartQueries(feature, context);

            // Execute batch search
            const searchResults = await this.batchSearch(queries);

            // Format as inspiration items
            const inspirationItems = [];
            for (const resultSet of searchResults.results) {
                for (const result of resultSet.results) {
                    inspirationItems.push({
                        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
                        featureId: feature.id,
                        title: result.title || 'Untitled',
                        url: result.url,
                        snippet: result.content || '',
                        source: 'tavily',
                        category: this.categorizeResult(result),
                        searchType: resultSet.type,
                        score: result.score || 0,
                        addedAt: new Date().toISOString()
                    });
                }
            }

            // Save to feature if app is provided
            if (app && app.saveData) {
                const featureIndex = app.features.findIndex(f => f.id === feature.id);
                if (featureIndex !== -1) {
                    if (!app.features[featureIndex].inspirationItems) {
                        app.features[featureIndex].inspirationItems = [];
                    }
                    app.features[featureIndex].inspirationItems.push(...inspirationItems);
                    await app.saveData();
                }
            }

            return inspirationItems;
        } catch (error) {
            console.error('Find inspiration error:', error);
            throw error;
        }
    }
};
