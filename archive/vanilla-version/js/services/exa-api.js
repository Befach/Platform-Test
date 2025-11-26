// Exa API Service - Semantic search API integration
const exaService = {
    // Execute Exa semantic search
    async search(query, options = {}) {
        const apiKey = storageService.loadExaApiKey();
        if (!apiKey) {
            throw new Error('Exa API key not configured');
        }

        const {
            numResults = 10,
            useAutoprompt = true,
            type = 'neural',
            category = null,
            startPublishedDate = null
        } = options;

        try {
            const response = await fetch('https://api.exa.ai/search', {
                method: 'POST',
                headers: {
                    'x-api-key': apiKey,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    query,
                    numResults,
                    useAutoprompt,
                    type,
                    category,
                    startPublishedDate
                })
            });

            if (!response.ok) {
                throw new Error(`Exa API error: ${response.statusText}`);
            }

            const data = await response.json();
            return data.results || [];
        } catch (error) {
            console.error('Exa search error:', error);
            throw error;
        }
    },

    // Analyze feature for Exa semantic search
    analyzeFeatureForSearch(feature) {
        if (!feature) return null;

        const context = {
            feature: feature,
            semanticContext: '',
            queryTypes: []
        };

        // Build semantic context
        const parts = [];
        if (feature.name) parts.push(feature.name);
        if (feature.purpose) parts.push(feature.purpose);
        if (feature.usp) parts.push(feature.usp);

        context.semanticContext = parts.join('. ');

        // Determine query types
        if (feature.categories && feature.categories.length > 0) {
            const hasCode = feature.categories.some(c =>
                c.toLowerCase().includes('code') ||
                c.toLowerCase().includes('implementation')
            );
            if (hasCode) context.queryTypes.push('code-examples');
        }

        context.queryTypes.push('best-practices', 'tutorials');

        return context;
    },

    // Rank Exa results by relevance
    rankResults(results, feature) {
        if (!results || results.length === 0) return [];

        // Score each result
        const scoredResults = results.map(result => {
            let score = result.score || 0;

            // Boost recent content
            if (result.publishedDate) {
                const publishDate = new Date(result.publishedDate);
                const ageInDays = (Date.now() - publishDate.getTime()) / (1000 * 60 * 60 * 24);
                if (ageInDays < 30) score += 0.2;
                else if (ageInDays < 90) score += 0.1;
            }

            // Boost if title/content matches feature name
            if (feature && feature.name) {
                const featureName = feature.name.toLowerCase();
                const title = (result.title || '').toLowerCase();
                const text = (result.text || '').toLowerCase();

                if (title.includes(featureName)) score += 0.3;
                if (text.includes(featureName)) score += 0.1;
            }

            // Boost high-quality sources
            const url = (result.url || '').toLowerCase();
            if (url.includes('github.com')) score += 0.2;
            if (url.includes('medium.com')) score += 0.1;
            if (url.includes('dev.to')) score += 0.1;

            return { ...result, finalScore: score };
        });

        // Sort by final score
        return scoredResults.sort((a, b) => b.finalScore - a.finalScore);
    },

    // Categorize Exa result
    categorizeResult(result) {
        if (!result) return 'general';

        const url = (result.url || '').toLowerCase();
        const title = (result.title || '').toLowerCase();
        const text = (result.text || '').toLowerCase();

        if (url.includes('github.com') || url.includes('gitlab.com')) return 'code-example';
        if (url.includes('medium.com') || url.includes('dev.to') || url.includes('blog')) return 'blog';
        if (url.includes('docs.') || title.includes('documentation')) return 'documentation';
        if (title.includes('tutorial') || text.includes('step by step')) return 'tutorial';
        if (url.includes('arxiv.org') || url.includes('research')) return 'research';

        return 'article';
    },

    // Find inspiration using Exa
    async findInspiration(feature, app) {
        if (!feature) {
            throw new Error('Feature is required');
        }

        try {
            // Analyze feature for semantic search
            const context = this.analyzeFeatureForSearch(feature);

            // Create semantic query
            const query = `${feature.name}: ${feature.purpose || ''} ${feature.usp || ''}`.trim();

            // Execute search
            const results = await this.search(query, {
                numResults: 15,
                useAutoprompt: true,
                type: 'neural'
            });

            // Rank results
            const rankedResults = this.rankResults(results, feature);

            // Format as inspiration items
            const inspirationItems = rankedResults.slice(0, 10).map(result => ({
                id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
                featureId: feature.id,
                title: result.title || 'Untitled',
                url: result.url,
                snippet: result.text || '',
                source: 'exa',
                category: this.categorizeResult(result),
                score: result.finalScore,
                publishedDate: result.publishedDate,
                author: result.author,
                addedAt: new Date().toISOString()
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

            return inspirationItems;
        } catch (error) {
            console.error('Exa find inspiration error:', error);
            throw error;
        }
    }
};
