// Perplexity API Service - AI-powered Q&A and research
const perplexityService = {
    // Execute Perplexity search with citations
    async search(query, options = {}) {
        const apiKey = storageService.loadPerplexityApiKey();
        if (!apiKey) {
            throw new Error('Perplexity API key not configured');
        }

        const {
            model = 'llama-3.1-sonar-large-128k-online',
            searchDomainFilter = null,
            searchRecencyFilter = null,
            returnCitations = true,
            returnRelatedQuestions = false
        } = options;

        try {
            const response = await fetch('https://api.perplexity.ai/chat/completions', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model,
                    messages: [
                        {
                            role: 'system',
                            content: 'You are a helpful technical research assistant. Provide accurate, well-cited answers.'
                        },
                        {
                            role: 'user',
                            content: query
                        }
                    ],
                    search_domain_filter: searchDomainFilter,
                    search_recency_filter: searchRecencyFilter,
                    return_citations: returnCitations,
                    return_related_questions: returnRelatedQuestions
                })
            });

            if (!response.ok) {
                throw new Error(`Perplexity API error: ${response.statusText}`);
            }

            const data = await response.json();
            const content = data.choices?.[0]?.message?.content || '';
            const citations = data.citations || [];

            return { content, citations };
        } catch (error) {
            console.error('Perplexity search error:', error);
            throw error;
        }
    },

    // Analyze feature to create Perplexity query
    analyzeFeatureForQuery(feature) {
        if (!feature) return null;

        const parts = [];

        // Build natural language question
        if (feature.name && feature.purpose) {
            parts.push(`What are the best practices for implementing ${feature.name} for ${feature.purpose}?`);
        } else if (feature.name) {
            parts.push(`What are the best practices and considerations for implementing ${feature.name}?`);
        }

        // Add context
        if (feature.usp) {
            parts.push(`Focus on: ${feature.usp}`);
        }

        if (feature.categories && feature.categories.length > 0) {
            parts.push(`Technologies involved: ${feature.categories.join(', ')}`);
        }

        const query = parts.join(' ');
        return { query, feature };
    },

    // Determine recency filter based on feature
    getRecencyFilter(feature) {
        if (!feature || !feature.categories) return null;

        const categories = feature.categories.map(c => c.toLowerCase());

        // Recent for fast-moving technologies
        const recentTech = ['ai', 'ml', 'react', 'next.js', 'vue', 'llm', 'gpt'];
        if (recentTech.some(tech => categories.some(cat => cat.includes(tech)))) {
            return 'month';
        }

        // Very recent for cutting-edge
        const cuttingEdge = ['gpt-4', 'claude', 'gemini', 'llama'];
        if (cuttingEdge.some(tech => categories.some(cat => cat.includes(tech)))) {
            return 'week';
        }

        return null;
    },

    // Determine domain filter based on feature
    getDomainFilter(feature) {
        if (!feature) return [];

        const domains = [];

        // Add relevant domains based on feature type
        if (feature.categories) {
            const categories = feature.categories.map(c => c.toLowerCase());

            if (categories.some(c => c.includes('code') || c.includes('programming'))) {
                domains.push('github.com', 'stackoverflow.com', 'dev.to');
            }

            if (categories.some(c => c.includes('design') || c.includes('ui'))) {
                domains.push('dribbble.com', 'behance.net');
            }

            if (categories.some(c => c.includes('research') || c.includes('academic'))) {
                domains.push('arxiv.org', 'scholar.google.com');
            }
        }

        return domains.length > 0 ? domains : null;
    },

    // Format citations into structured objects
    formatCitations(citations) {
        if (!citations || !Array.isArray(citations)) return [];

        return citations.map((citation, index) => ({
            id: index + 1,
            url: citation.url || citation,
            title: citation.title || `Citation ${index + 1}`,
            source: 'perplexity-citation'
        }));
    },

    // Get insights for a feature using Perplexity
    async getInsights(feature, app) {
        if (!feature) {
            throw new Error('Feature is required');
        }

        try {
            // Analyze feature to create query
            const analysis = this.analyzeFeatureForQuery(feature);
            if (!analysis) {
                throw new Error('Could not analyze feature');
            }

            // Determine search filters
            const recencyFilter = this.getRecencyFilter(feature);
            const domainFilter = this.getDomainFilter(feature);

            // Execute search
            const { content, citations } = await this.search(analysis.query, {
                searchRecencyFilter: recencyFilter,
                searchDomainFilter: domainFilter,
                returnCitations: true
            });

            // Format citations
            const formattedCitations = this.formatCitations(citations);

            // Create inspiration items from citations
            const inspirationItems = formattedCitations.map(citation => ({
                id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
                featureId: feature.id,
                title: citation.title,
                url: citation.url,
                snippet: content.substring(0, 200) + '...',
                source: 'perplexity',
                category: 'research',
                addedAt: new Date().toISOString(),
                metadata: {
                    fullAnswer: content,
                    query: analysis.query
                }
            }));

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

            return {
                answer: content,
                citations: formattedCitations,
                inspirationItems
            };
        } catch (error) {
            console.error('Perplexity get insights error:', error);
            throw error;
        }
    }
};
