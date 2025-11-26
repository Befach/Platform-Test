/**
 * Detail View AI Integration Module
 * Handles AI-powered feature generation and search
 *
 * Extracted from index.html as part of Phase 5.4.4 refactoring
 * Lines extracted: ~2,200 lines
 * Methods: 45+ AI integration methods
 */

const detailViewAI = {
    // ==================== Main AI Generation Methods ====================

    /**
     * Generate execution plan for current feature using AI
     * @param {Object} app - App instance
     */
    async generateExecutionPlan(app) {
        if (!app.currentFeatureId) return;

        const feature = app.features.find(f => f.id === app.currentFeatureId);
        if (!feature) return;

        if (!app.apiKey) {
            app.showAlert({ title: 'API Key Required', message: 'Please set your OpenRouter API key in settings first.', variant: 'warning' });
            return;
        }

        const userMessage = `Generate a detailed execution plan for this feature:

Feature Name: ${feature.name}
Type: ${feature.type}
Purpose: ${feature.purpose}
Timeline: ${feature.timelineItems?.map(t => t.timeline).join(', ') || 'Not specified'}
Difficulty: ${feature.timelineItems?.map(t => t.difficulty).join(', ') || 'Not specified'}

Please generate 5-8 concrete, actionable execution steps with:
1. Clear title for each step
2. Detailed description of what needs to be done
3. Estimated hours for each step

Return as JSON array:
[{"title": "...", "description": "...", "estimatedHours": number}]`;

        try {
            const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${app.apiKey}`,
                    'Content-Type': 'application/json',
                    'HTTP-Referer': window.location.href,
                    'X-Title': 'Platform Roadmap Manager'
                },
                body: JSON.stringify({
                    model: app.selectedModel,
                    messages: [{ role: 'user', content: userMessage }]
                })
            });

            if (!response.ok) throw new Error('AI request failed');

            const data = await response.json();
            const content = data.choices[0].message.content;

            // Try to extract JSON from the response
            const jsonMatch = content.match(/\[[\s\S]*\]/);
            if (jsonMatch) {
                const steps = JSON.parse(jsonMatch[0]);

                if (!feature.executionSteps) feature.executionSteps = [];

                steps.forEach((step, index) => {
                    feature.executionSteps.push({
                        id: Date.now().toString() + index,
                        order: feature.executionSteps.length + index,
                        title: step.title,
                        description: step.description,
                        estimatedHours: step.estimatedHours || null,
                        completed: false
                    });
                });

                app.saveData();
                app.renderExecutionTab(feature);
                app.showAlert({ title: 'Success', message: 'Execution plan generated!', variant: 'success' });
            } else {
                throw new Error('Could not parse AI response');
            }
        } catch (error) {
            console.error('Error generating execution plan:', error);
            app.showAlert({ title: 'Error', message: 'Failed to generate execution plan. Please try again.', variant: 'error' });
        }
    },

    /**
     * Suggest resources for current feature using AI
     * @param {Object} app - App instance
     */
    async suggestResources(app) {
        if (!app.currentFeatureId) return;

        const feature = app.features.find(f => f.id === app.currentFeatureId);
        if (!feature) return;

        if (!app.apiKey) {
            app.showAlert({ title: 'API Key Required', message: 'Please set your OpenRouter API key in settings first.', variant: 'warning' });
            return;
        }

        const userMessage = `Suggest required resources for this feature:

Feature Name: ${feature.name}
Type: ${feature.type}
Purpose: ${feature.purpose}
Difficulty: ${feature.timelineItems?.map(t => t.difficulty).join(', ') || 'Not specified'}

Please suggest:
1. Team roles needed (with count and skill level)
2. Technologies required
3. Estimated budget range
4. Estimated total hours

Return as JSON:
{
  "teamRoles": [{"role": "...", "count": 1, "skillLevel": "..."}],
  "technologies": ["..."],
  "estimatedBudget": "...",
  "estimatedHours": number
}`;

        try {
            const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${app.apiKey}`,
                    'Content-Type': 'application/json',
                    'HTTP-Referer': window.location.href,
                    'X-Title': 'Platform Roadmap Manager'
                },
                body: JSON.stringify({
                    model: app.selectedModel,
                    messages: [{ role: 'user', content: userMessage }]
                })
            });

            if (!response.ok) throw new Error('AI request failed');

            const data = await response.json();
            const content = data.choices[0].message.content;

            const jsonMatch = content.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                const resources = JSON.parse(jsonMatch[0]);
                feature.resources = resources;
                app.saveData();
                app.renderResourcesTab(feature);
                app.showAlert({ title: 'Success', message: 'Resources suggested!', variant: 'success' });
            } else {
                throw new Error('Could not parse AI response');
            }
        } catch (error) {
            console.error('Error suggesting resources:', error);
            app.showAlert({ title: 'Error', message: 'Failed to suggest resources. Please try again.', variant: 'error' });
        }
    },

    /**
     * Identify risks for current feature using AI
     * @param {Object} app - App instance
     */
    async identifyRisks(app) {
        if (!app.currentFeatureId) return;

        const feature = app.features.find(f => f.id === app.currentFeatureId);
        if (!feature) return;

        if (!app.apiKey) {
            app.showAlert({ title: 'API Key Required', message: 'Please set your OpenRouter API key in settings first.', variant: 'warning' });
            return;
        }

        const userMessage = `Identify potential risks for this feature:

Feature Name: ${feature.name}
Type: ${feature.type}
Purpose: ${feature.purpose}
Difficulty: ${feature.timelineItems?.map(t => t.difficulty).join(', ') || 'Not specified'}

Please identify 3-5 risks with:
1. Description of the risk
2. Severity (low/medium/high)
3. Mitigation strategy

Return as JSON array:
[{"description": "...", "severity": "...", "mitigation": "..."}]`;

        try {
            const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${app.apiKey}`,
                    'Content-Type': 'application/json',
                    'HTTP-Referer': window.location.href,
                    'X-Title': 'Platform Roadmap Manager'
                },
                body: JSON.stringify({
                    model: app.selectedModel,
                    messages: [{ role: 'user', content: userMessage }]
                })
            });

            if (!response.ok) throw new Error('AI request failed');

            const data = await response.json();
            const content = data.choices[0].message.content;

            const jsonMatch = content.match(/\[[\s\S]*\]/);
            if (jsonMatch) {
                const risks = JSON.parse(jsonMatch[0]);

                if (!feature.planning) feature.planning = {};
                if (!feature.planning.risks) feature.planning.risks = [];

                risks.forEach(risk => {
                    feature.planning.risks.push({
                        id: Date.now().toString() + Math.random(),
                        description: risk.description,
                        severity: risk.severity.toLowerCase(),
                        mitigation: risk.mitigation
                    });
                });

                app.saveData();
                app.renderPlanningTab(feature);
                app.showAlert({ title: 'Success', message: 'Risks identified!', variant: 'success' });
            } else {
                throw new Error('Could not parse AI response');
            }
        } catch (error) {
            console.error('Error identifying risks:', error);
            app.showAlert({ title: 'Error', message: 'Failed to identify risks. Please try again.', variant: 'error' });
        }
    },

    /**
     * Generate milestones for current feature using AI
     * @param {Object} app - App instance
     */
    async generateMilestones(app) {
        if (!app.currentFeatureId) return;

        const feature = app.features.find(f => f.id === app.currentFeatureId);
        if (!feature) return;

        if (!app.apiKey) {
            app.showAlert({ title: 'API Key Required', message: 'Please set your OpenRouter API key in settings first.', variant: 'warning' });
            return;
        }

        const userMessage = `Generate milestones for this feature:

Feature Name: ${feature.name}
Type: ${feature.type}
Purpose: ${feature.purpose}
Timeline Items: ${feature.timelineItems?.map(t => `${t.title} (${t.timeline}, ${t.difficulty} difficulty)`).join(', ') || 'Not specified'}

Please generate 3-5 realistic milestones with:
1. Name/title of the milestone
2. Target date (use format YYYY-MM-DD, spread realistically over weeks/months based on feature complexity)
3. Status (always start with "pending")
4. Dependencies (array of milestone names that must be completed first, can be empty)

Return as JSON array:
[{"name": "...", "targetDate": "YYYY-MM-DD", "status": "pending", "dependencies": []}]`;

        try {
            const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${app.apiKey}`,
                    'Content-Type': 'application/json',
                    'HTTP-Referer': window.location.href,
                    'X-Title': 'Platform Roadmap Manager'
                },
                body: JSON.stringify({
                    model: app.selectedModel,
                    messages: [{ role: 'user', content: userMessage }]
                })
            });

            if (!response.ok) throw new Error('AI request failed');

            const data = await response.json();
            const content = data.choices[0].message.content;

            const jsonMatch = content.match(/\[[\s\S]*\]/);
            if (jsonMatch) {
                const milestones = JSON.parse(jsonMatch[0]);

                if (!feature.planning) feature.planning = {};
                if (!feature.planning.milestones) feature.planning.milestones = [];

                milestones.forEach(milestone => {
                    feature.planning.milestones.push({
                        id: Date.now().toString() + Math.random(),
                        name: milestone.name,
                        targetDate: milestone.targetDate || null,
                        status: 'pending',
                        dependencies: milestone.dependencies || []
                    });
                });

                app.saveData();
                app.renderPlanningTab(feature);
                app.showAlert({ title: 'Success', message: 'Milestones generated!', variant: 'success' });
            } else {
                throw new Error('Could not parse AI response');
            }
        } catch (error) {
            console.error('Error generating milestones:', error);
            app.showAlert({ title: 'Error', message: 'Failed to generate milestones. Please try again.', variant: 'error' });
        }
    },

    /**
     * Suggest prerequisites for current feature using AI
     * @param {Object} app - App instance
     */
    async suggestPrerequisites(app) {
        if (!app.currentFeatureId) return;

        const feature = app.features.find(f => f.id === app.currentFeatureId);
        if (!feature) return;

        if (!app.apiKey) {
            app.showAlert({ title: 'API Key Required', message: 'Please set your OpenRouter API key in settings first.', variant: 'warning' });
            return;
        }

        const userMessage = `Suggest prerequisites for this feature:

Feature Name: ${feature.name}
Type: ${feature.type}
Purpose: ${feature.purpose}
Timeline Items: ${feature.timelineItems?.map(t => `${t.title} (${t.timeline}, ${t.difficulty} difficulty)`).join(', ') || 'Not specified'}

Please suggest 3-6 prerequisites that should be in place before starting this feature. Include:
- Technical requirements (APIs, databases, frameworks, libraries)
- Knowledge/skill requirements
- Infrastructure needs
- Dependencies on other systems/features

Return as JSON array of strings:
["Prerequisite 1", "Prerequisite 2", ...]`;

        try {
            const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${app.apiKey}`,
                    'Content-Type': 'application/json',
                    'HTTP-Referer': window.location.href,
                    'X-Title': 'Platform Roadmap Manager'
                },
                body: JSON.stringify({
                    model: app.selectedModel,
                    messages: [{ role: 'user', content: userMessage }]
                })
            });

            if (!response.ok) throw new Error('AI request failed');

            const data = await response.json();
            const content = data.choices[0].message.content;

            const jsonMatch = content.match(/\[[\s\S]*\]/);
            if (jsonMatch) {
                const prerequisites = JSON.parse(jsonMatch[0]);

                if (!feature.planning) feature.planning = {};
                if (!feature.planning.prerequisites) feature.planning.prerequisites = [];

                prerequisites.forEach(prereq => {
                    if (typeof prereq === 'string') {
                        feature.planning.prerequisites.push(prereq);
                    }
                });

                app.saveData();
                app.renderPlanningTab(feature);
                app.showAlert({ title: 'Success', message: 'Prerequisites suggested!', variant: 'success' });
            } else {
                throw new Error('Could not parse AI response');
            }
        } catch (error) {
            console.error('Error suggesting prerequisites:', error);
            app.showAlert({ title: 'Error', message: 'Failed to suggest prerequisites. Please try again.', variant: 'error' });
        }
    },

    /**
     * Identify blockers for current feature using AI
     * @param {Object} app - App instance
     */
    async identifyBlockers(app) {
        if (!app.currentFeatureId) return;
        const feature = app.features.find(f => f.id === app.currentFeatureId);
        if (!feature) return;

        if (!app.apiKey) {
            app.showAlert({ title: 'API Key Required', message: 'Please set your OpenRouter API key in settings first.', variant: 'warning' });
            return;
        }

        const userMessage = `Identify potential blockers for this feature:

Feature Name: ${feature.name}
Type: ${feature.type}
Purpose: ${feature.purpose}
Timeline: ${feature.timelineItems?.map(t => t.timeline).join(', ') || 'Not specified'}
Execution Steps: ${feature.executionSteps?.map(s => s.title).join(', ') || 'Not specified'}

Please identify 3-5 potential blockers that could prevent or delay this feature. Include:
- Technical dependencies or integration issues
- Resource constraints
- External dependencies
- Potential risks

Return as JSON array:
[{"title": "...", "description": "...", "severity": "critical|high|medium|low"}]`;

        try {
            const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${app.apiKey}`,
                    'Content-Type': 'application/json',
                    'HTTP-Referer': window.location.href,
                    'X-Title': 'Platform Roadmap Manager'
                },
                body: JSON.stringify({
                    model: app.selectedModel,
                    messages: [{ role: 'user', content: userMessage }]
                })
            });

            if (!response.ok) throw new Error('AI request failed');

            const data = await response.json();
            const content = data.choices[0].message.content;

            const jsonMatch = content.match(/\[[\s\S]*\]/);
            if (jsonMatch) {
                const blockers = JSON.parse(jsonMatch[0]);

                if (!feature.blockers) feature.blockers = [];

                blockers.forEach(blocker => {
                    feature.blockers.push({
                        id: Date.now().toString() + Math.random(),
                        title: blocker.title,
                        description: blocker.description || '',
                        severity: blocker.severity || 'medium',
                        status: 'active',
                        createdAt: new Date().toISOString()
                    });
                });

                app.saveData();
                app.renderPlanningTab(feature);
                app.showAlert({ title: 'Success', message: 'Blockers identified!', variant: 'success' });
            } else {
                throw new Error('Could not parse AI response');
            }
        } catch (error) {
            console.error('Error identifying blockers:', error);
            app.showAlert({ title: 'Error', message: 'Failed to identify blockers. Please try again.', variant: 'error' });
        }
    },

    // ==================== Tavily Search Integration ====================

    /**
     * Find inspiration using Perplexity Q&A with citations
     * @param {Object} app - App instance
     */
    async findInspiration(app) {
        if (!app.currentFeatureId) return;

        const feature = app.features.find(f => f.id === app.currentFeatureId);
        if (!feature) return;

        const perplexityApiKey = localStorage.getItem('perplexityApiKey');
        if (!perplexityApiKey) {
            app.showAlert({ title: 'Perplexity API Key Required', message: 'Please set your Perplexity API key in settings to search for inspiration.', variant: 'warning' });
            return;
        }

        try {
            console.log('🔍 Finding inspiration with Perplexity for:', feature.name);
            await app.showAlert({ title: 'Searching...', message: 'Getting AI-powered insights with citations...', variant: 'info' });

            // Analyze feature for Perplexity Q&A
            const analysis = this.analyzeFeatureForPerplexity(feature);

            // Build comprehensive query
            const query = `${analysis.context}

Please provide detailed insights and practical guidance for this feature:

${analysis.questions.map((q, i) => `${i + 1}. ${q}`).join('\n')}

Include specific examples, current best practices, and actionable recommendations with citations for all information.`;

            // Execute Perplexity search
            const result = await this.executePerplexitySearch(app, query, {
                model: 'llama-3.1-sonar-large-128k-online',
                temperature: 0.2,
                maxTokens: 3000
            });

            // Add main insight to inspiration
            if (!feature.inspirationItems) feature.inspirationItems = [];

            // Add Perplexity insight as main item
            feature.inspirationItems.push({
                id: Date.now().toString(),
                type: 'research',
                url: 'perplexity://insights',
                title: `Perplexity Insights: ${feature.name}`,
                description: result.content.substring(0, 500) + '...',
                fullContent: result.content,
                relevanceScore: 95,
                dateAdded: new Date().toISOString(),
                source: 'perplexity',
                metadata: {
                    model: result.model,
                    citations: result.citations
                }
            });

            // Add citations as individual inspiration items
            if (result.citations && result.citations.length > 0) {
                result.citations.forEach(citation => {
                    // Handle both string and object citations
                    const citationUrl = typeof citation === 'string' ? citation : citation.url || citation;

                    if (citationUrl && citationUrl.startsWith('http')) {
                        const existingItem = feature.inspirationItems.find(item => item.url === citationUrl);
                        if (!existingItem) {
                            feature.inspirationItems.push({
                                id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
                                type: 'reference',
                                url: citationUrl,
                                title: typeof citation === 'object' && citation.title ? citation.title : this.extractTitleFromUrl(citationUrl),
                                description: typeof citation === 'object' && citation.snippet ? citation.snippet : '',
                                relevanceScore: 85,
                                dateAdded: new Date().toISOString(),
                                source: 'perplexity-citation'
                            });
                        }
                    }
                });
            }

            app.saveData();
            await app.syncFeatures();

            // Update UI
            app.switchTab('inspiration');

            const totalItems = 1 + (result.citations ? result.citations.length : 0);
            await app.showAlert({ title: 'Success', message: `Added Perplexity insights with ${result.citations?.length || 0} citations!`, variant: 'success' });
            console.log('✅ Added Perplexity insights to inspiration');

        } catch (error) {
            console.error('❌ Error finding inspiration with Perplexity:', error);
            await app.showAlert({ title: 'Error', message: 'Failed to find inspiration: ' + error.message, variant: 'error' });
        }
    },

    /**
     * Extract title from URL
     * @param {string} url - URL to extract title from
     * @returns {string} Extracted title
     */
    extractTitleFromUrl(url) {
        try {
            const urlObj = new URL(url);
            const path = urlObj.pathname;
            const filename = path.split('/').pop() || urlObj.hostname;
            return filename.replace(/[-_]/g, ' ').replace(/\.\w+$/, '');
        } catch (e) {
            return 'Reference';
        }
    },

    /**
     * Analyze feature for optimal search
     * @param {Object} app - App instance
     * @param {Object} feature - Feature to analyze
     * @returns {Object} Search context
     */
    async analyzeFeatureForSearch(app, feature) {
        const prompt = `Analyze this feature for intelligent web search:

Feature: ${feature.name}
Type: ${feature.type}
Purpose: ${feature.purpose || 'Not specified'}

Extract JSON:
{
    "coreKeywords": ["keyword1", "keyword2", ...],
    "industryDomain": "fintech|social|analytics|ecommerce|general",
    "technicalComplexity": "simple|medium|complex",
    "searchFocus": ["implementation", "competitors", "tools", "providers"],
    "recommendedDomains": ["domain1.com", ...]
}`;

        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${app.apiKey}`,
                'Content-Type': 'application/json',
                'HTTP-Referer': window.location.href,
                'X-Title': 'Platform Roadmap Manager'
            },
            body: JSON.stringify({
                model: app.selectedModel,
                messages: [
                    { role: 'system', content: 'You are a search query optimization expert. Return only valid JSON.' },
                    { role: 'user', content: prompt }
                ],
                temperature: 0.3
            })
        });

        const data = await response.json();
        const content = data.choices[0].message.content;

        // Extract JSON from response
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        return jsonMatch ? JSON.parse(jsonMatch[0]) : {
            coreKeywords: [feature.name],
            industryDomain: 'general',
            technicalComplexity: 'medium',
            searchFocus: ['implementation', 'tools'],
            recommendedDomains: []
        };
    },

    /**
     * Generate smart search queries based on feature and context
     * @param {Object} feature - Feature object
     * @param {Object} context - Search context
     * @returns {Array} Array of search queries
     */
    generateSmartQueries(feature, context) {
        const queries = [];
        const keywords = context.coreKeywords.join(' ');
        const complexity = context.technicalComplexity;

        // Query 1: Implementation/Tutorial
        queries.push({
            query: complexity === 'complex'
                ? `${keywords} system architecture implementation guide`
                : `how to implement ${keywords} step by step tutorial`,
            search_depth: complexity === 'complex' ? 'advanced' : 'basic',
            max_results: 7,
            include_domains: ['github.com', 'medium.com', 'dev.to', 'stackoverflow.com'],
            topic: 'general'
        });

        // Query 2: Tools/Libraries
        if (context.searchFocus.includes('tools')) {
            queries.push({
                query: `best ${keywords} libraries frameworks tools 2024`,
                search_depth: 'basic',
                max_results: 7,
                include_domains: ['github.com', 'npmjs.com', 'pypi.org'],
                topic: 'general'
            });
        }

        // Query 3: Competitors/Examples
        if (context.searchFocus.includes('competitors')) {
            queries.push({
                query: `platforms with ${feature.name} feature examples`,
                search_depth: 'basic',
                max_results: 7,
                include_domains: ['producthunt.com', 'g2.com', 'capterra.com'],
                topic: 'general'
            });
        }

        // Query 4: API/Service Providers
        if (context.searchFocus.includes('providers')) {
            queries.push({
                query: `${keywords} API service providers comparison`,
                search_depth: 'basic',
                max_results: 7,
                include_domains: ['rapidapi.com', 'programmableweb.com', ...context.recommendedDomains],
                topic: 'general'
            });
        }

        // Query 5: Best Practices (for complex features)
        if (complexity === 'complex') {
            queries.push({
                query: `${keywords} security scalability best practices`,
                search_depth: 'advanced',
                max_results: 5,
                include_domains: ['docs.microsoft.com', 'aws.amazon.com', 'github.com'],
                topic: 'general'
            });
        }

        return queries;
    },

    /**
     * Execute Tavily search
     * @param {Object} app - App instance
     * @param {Object} queryConfig - Query configuration
     * @returns {Array} Search results
     */
    async executeTavilySearch(app, queryConfig) {
        const response = await fetch('https://api.tavily.com/search', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                api_key: app.tavilyApiKey,
                ...queryConfig
            })
        });

        if (!response.ok) throw new Error('Search failed');

        const data = await response.json();
        return data.results || [];
    },

    /**
     * Deduplicate search results by URL
     * @param {Array} results - Array of search results
     * @returns {Array} Deduplicated results
     */
    deduplicateResults(results) {
        const seen = new Map();
        return results.filter(r => {
            try {
                const urlKey = new URL(r.url).hostname + new URL(r.url).pathname;
                if (seen.has(urlKey)) return false;
                seen.set(urlKey, true);
                return true;
            } catch {
                return true; // Keep if URL parsing fails
            }
        });
    },

    /**
     * Score a search result based on domain authority, relevance, and recency
     * @param {Object} result - Search result
     * @param {Object} feature - Feature object
     * @returns {number} Score
     */
    scoreResult(result, feature) {
        let score = 0;

        // Domain authority (0-30)
        const authorityScores = {
            'github.com': 30, 'stackoverflow.com': 28, 'docs.microsoft.com': 30,
            'aws.amazon.com': 30, 'cloud.google.com': 30, 'firebase.google.com': 28,
            'stripe.com': 28, 'auth0.com': 28, 'medium.com': 22, 'dev.to': 20,
            'smashingmagazine.com': 25, 'css-tricks.com': 25, 'freecodecamp.org': 24
        };
        try {
            const domain = new URL(result.url).hostname.replace('www.', '');
            score += authorityScores[domain] || 12;
        } catch {
            score += 10;
        }

        // Keyword relevance (0-35)
        const searchText = (result.title + ' ' + (result.content || '')).toLowerCase();
        const featureText = (feature.name + ' ' + (feature.purpose || '')).toLowerCase();
        const words = featureText.split(/\s+/).filter(w => w.length > 3);
        const matches = words.filter(w => searchText.includes(w)).length;
        score += Math.min(matches * 7, 35);

        // Content type bonus (0-20)
        if (result.url.includes('github.com') && result.url.includes('/tree/')) score += 20;
        else if (result.title.match(/documentation|official docs/i)) score += 18;
        else if (result.title.match(/tutorial|guide|how.?to/i)) score += 15;
        else if (result.title.match(/best practices|patterns/i)) score += 16;

        // Recency (0-15)
        if (result.title.match(/2024/)) score += 15;
        else if (result.title.match(/2023/)) score += 12;
        else if (result.title.match(/202[0-2]/)) score += 8;

        return score;
    },

    /**
     * Categorize a search result
     * @param {Object} result - Search result
     * @returns {string} Category
     */
    categorizeResult(result) {
        const url = result.url.toLowerCase();
        const title = result.title.toLowerCase();

        if (url.includes('github.com')) return 'code';
        if (url.includes('stackoverflow.com')) return 'qa';
        if (title.match(/tutorial|guide|how.?to/)) return 'tutorial';
        if (url.match(/docs?\.|documentation/)) return 'documentation';
        if (title.match(/comparison|vs|alternative/)) return 'comparison';
        if (url.includes('medium.com') || url.includes('dev.to')) return 'article';

        return 'reference';
    },

    // ==================== Exa API Integration ====================

    /**
     * Find inspiration using Exa semantic search
     * @param {Object} app - App instance
     */
    async findInspirationWithExa(app) {
        if (!app.currentFeatureId) {
            alert('Please select a feature first');
            return;
        }

        const feature = app.features.find(f => f.id === app.currentFeatureId);
        if (!feature) return;

        try {
            console.log('🔍 Finding inspiration with Exa for:', feature.name);

            // Analyze feature for optimal search
            const searchContext = this.analyzeFeatureForExaSearch(feature);

            // Determine recency filter
            let startDate = null;
            if (searchContext.recencyImportance === 'high') {
                startDate = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString(); // 1 year
            } else if (searchContext.recencyImportance === 'medium') {
                startDate = new Date(Date.now() - 730 * 24 * 60 * 60 * 1000).toISOString(); // 2 years
            }

            // Build search queries based on focus areas
            const searches = [];

            // Primary semantic search
            searches.push({
                query: searchContext.semanticQuery,
                type: 'neural',
                numResults: 10,
                includeDomains: searchContext.domains,
                startPublishedDate: startDate
            });

            // Focused searches based on needs
            if (searchContext.focus.includes('implementation')) {
                searches.push({
                    query: `How to implement ${feature.name} with best practices and code examples`,
                    type: 'neural',
                    numResults: 8,
                    includeDomains: ['github.com', 'dev.to', 'medium.com'],
                    category: 'tutorial'
                });
            }

            if (searchContext.focus.includes('tools')) {
                searches.push({
                    query: `Best libraries and frameworks for ${feature.name}`,
                    type: 'neural',
                    numResults: 8,
                    includeDomains: ['github.com', 'npmjs.com', 'pypi.org']
                });
            }

            if (searchContext.focus.includes('best-practices')) {
                searches.push({
                    query: `${feature.name} security scalability best practices`,
                    type: 'neural',
                    numResults: 6,
                    includeDomains: ['medium.com', 'martinfowler.com', 'github.com']
                });
            }

            // Execute all searches in parallel
            const allResults = await Promise.all(
                searches.map(searchConfig =>
                    this.executeExaSearch(app, searchConfig.query, searchConfig)
                        .catch(err => {
                            console.error('Exa search error:', err);
                            return [];
                        })
                )
            );

            // Flatten and rank results
            const flatResults = allResults.flat();
            console.log('📊 Found', flatResults.length, 'total results from Exa');

            // Deduplicate by URL
            const uniqueResults = [];
            const seenUrls = new Set();

            for (const result of flatResults) {
                if (!seenUrls.has(result.url)) {
                    seenUrls.add(result.url);
                    uniqueResults.push(result);
                }
            }

            // Rank and score results
            const rankedResults = this.rankExaResults(uniqueResults, feature);

            // Take top results
            const topResults = rankedResults.slice(0, 15);

            // Convert to inspiration items format
            if (!feature.inspirationItems) feature.inspirationItems = [];

            for (const result of topResults) {
                const existingItem = feature.inspirationItems.find(item => item.url === result.url);
                if (existingItem) continue; // Skip duplicates

                const inspirationItem = {
                    id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
                    type: this.categorizeExaResult(result),
                    url: result.url,
                    title: result.title || 'Untitled',
                    description: result.text?.substring(0, 300) || result.snippet || '',
                    relevanceScore: result.score || 0,
                    dateAdded: new Date().toISOString(),
                    source: 'exa',
                    publishedDate: result.publishedDate || null,
                    author: result.author || null
                };

                feature.inspirationItems.push(inspirationItem);
            }

            app.saveData();
            await app.syncFeatures();

            // Update UI
            app.switchTab('inspiration');

            alert(`✅ Found ${topResults.length} inspiration items with Exa!`);
            console.log('✅ Added', topResults.length, 'Exa results to inspiration');

        } catch (error) {
            console.error('❌ Error finding inspiration with Exa:', error);
            alert('Error finding inspiration: ' + error.message);
        }
    },

    /**
     * Execute Exa semantic search
     * @param {Object} app - App instance
     * @param {string} query - Search query
     * @param {Object} options - Search options
     * @returns {Array} Search results
     */
    async executeExaSearch(app, query, options = {}) {
        try {
            const exaApiKey = localStorage.getItem('exaApiKey');
            if (!exaApiKey) {
                throw new Error('Exa API key not configured. Please add it in Settings.');
            }

            const requestBody = {
                query: query,
                type: options.type || 'neural', // 'neural' for semantic, 'keyword' for traditional
                numResults: options.numResults || 10,
                useAutoprompt: options.useAutoprompt !== false, // Default true
                includeDomains: options.includeDomains || [],
                excludeDomains: options.excludeDomains || [],
                startPublishedDate: options.startPublishedDate || null,
                contents: {
                    text: { maxCharacters: options.maxCharacters || 2000 }
                }
            };

            // Optional filters
            if (options.category) requestBody.category = options.category;
            if (options.startCrawlDate) requestBody.startCrawlDate = options.startCrawlDate;

            const response = await fetch('https://api.exa.ai/search', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': exaApiKey
                },
                body: JSON.stringify(requestBody)
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Exa search failed');
            }

            const data = await response.json();
            console.log('✅ Exa search completed:', data.results.length, 'results');
            return data.results || [];
        } catch (error) {
            console.error('❌ Exa search error:', error);
            throw error;
        }
    },

    /**
     * Analyze feature for Exa search
     * @param {Object} feature - Feature object
     * @returns {Object} Search context
     */
    analyzeFeatureForExaSearch(feature) {
        // Exa works best with semantic, natural language queries
        // Build query that captures intent and context
        const parts = [];

        // Core feature description
        parts.push(feature.name);
        if (feature.description) {
            parts.push(feature.description.substring(0, 200));
        }

        // Technical context from categories
        if (feature.categories && feature.categories.length > 0) {
            const techKeywords = feature.categories
                .filter(cat => ['Frontend', 'Backend', 'Database', 'Infrastructure', 'Security'].includes(cat))
                .join(' ');
            if (techKeywords) parts.push(techKeywords);
        }

        // Extract technologies from resources
        if (feature.resources && feature.resources.technologies) {
            const tech = feature.resources.technologies
                .split(',')
                .map(t => t.trim())
                .join(' ');
            if (tech) parts.push(tech);
        }

        return {
            semanticQuery: parts.join('. '),
            searchType: 'neural', // Semantic search
            focus: this.determineSearchFocus(feature),
            domains: this.getRelevantDomains(feature),
            recencyImportance: this.calculateRecencyNeeds(feature)
        };
    },

    /**
     * Determine search focus based on feature characteristics
     * @param {Object} feature - Feature object
     * @returns {Array} Focus areas
     */
    determineSearchFocus(feature) {
        // Determine what type of content we need
        const focus = [];

        if (!feature.executionSteps || feature.executionSteps.length === 0) {
            focus.push('implementation');
        }

        if (!feature.resources || !feature.resources.technologies) {
            focus.push('tools');
            focus.push('libraries');
        }

        if (feature.risks && feature.risks.length > 0) {
            focus.push('best-practices');
            focus.push('solutions');
        }

        if (feature.categories?.includes('Research')) {
            focus.push('academic');
            focus.push('papers');
        }

        return focus;
    },

    /**
     * Get relevant domains for search based on feature categories
     * @param {Object} feature - Feature object
     * @returns {Array} Relevant domains
     */
    getRelevantDomains(feature) {
        const domains = ['github.com', 'stackoverflow.com'];

        // Add domain based on categories
        if (feature.categories?.includes('Frontend')) {
            domains.push('dev.to', 'css-tricks.com', 'web.dev');
        }

        if (feature.categories?.includes('Backend')) {
            domains.push('medium.com', 'martinfowler.com');
        }

        if (feature.categories?.includes('AI/ML')) {
            domains.push('arxiv.org', 'paperswithcode.com', 'huggingface.co');
        }

        if (feature.categories?.includes('Database')) {
            domains.push('dba.stackexchange.com', 'percona.com');
        }

        return domains;
    },

    /**
     * Calculate recency needs for search
     * @param {Object} feature - Feature object
     * @returns {string} Recency importance ('high'|'medium'|'low')
     */
    calculateRecencyNeeds(feature) {
        // Determine if we need recent results
        const categories = feature.categories || [];

        // High recency need
        if (categories.includes('AI/ML') || categories.includes('Frontend')) {
            return 'high'; // Last 12 months
        }

        // Medium recency need
        if (categories.includes('Backend') || categories.includes('Infrastructure')) {
            return 'medium'; // Last 24 months
        }

        // Lower recency need for stable technologies
        return 'low'; // Last 36 months
    },

    /**
     * Categorize Exa result
     * @param {Object} result - Search result
     * @returns {string} Category
     */
    categorizeExaResult(result) {
        const url = result.url.toLowerCase();
        const title = result.title?.toLowerCase() || '';

        if (url.includes('github.com')) return 'code';
        if (url.includes('stackoverflow.com')) return 'qa';
        if (url.includes('arxiv.org') || url.includes('paperswithcode.com')) return 'research';
        if (title.match(/tutorial|guide|how.?to/)) return 'tutorial';
        if (url.match(/docs?\.|documentation/)) return 'documentation';
        if (title.match(/comparison|vs|alternative/)) return 'comparison';
        if (url.includes('medium.com') || url.includes('dev.to')) return 'article';

        return 'reference';
    },

    /**
     * Rank Exa results
     * @param {Array} results - Search results
     * @param {Object} feature - Feature object
     * @returns {Array} Ranked results
     */
    rankExaResults(results, feature) {
        // Score each result based on multiple factors
        return results.map(result => {
            let score = 0;

            // 1. Exa's built-in relevance score (0-1, most important)
            score += (result.score || 0) * 100;

            // 2. Domain authority
            const url = result.url.toLowerCase();
            if (url.includes('github.com')) score += 25;
            else if (url.includes('stackoverflow.com')) score += 20;
            else if (url.includes('medium.com') || url.includes('dev.to')) score += 15;
            else if (url.match(/\.edu|arxiv\.org/)) score += 30;
            else if (url.match(/docs?\.|documentation/)) score += 22;

            // 3. Content type preference (Exa provides rich text)
            if (result.text && result.text.length > 1000) score += 15; // Substantial content
            if (result.text && result.text.includes('```')) score += 10; // Contains code

            // 4. Title relevance
            const title = result.title?.toLowerCase() || '';
            const featureName = feature.name.toLowerCase();
            if (title.includes(featureName)) score += 20;

            // Check for feature keywords
            const keywords = featureName.split(' ');
            keywords.forEach(keyword => {
                if (keyword.length > 3 && title.includes(keyword)) {
                    score += 5;
                }
            });

            // 5. Recency (Exa provides publishedDate)
            if (result.publishedDate) {
                const publishDate = new Date(result.publishedDate);
                const monthsOld = (Date.now() - publishDate.getTime()) / (30 * 24 * 60 * 60 * 1000);

                if (monthsOld < 6) score += 20;
                else if (monthsOld < 12) score += 15;
                else if (monthsOld < 24) score += 10;
                else if (monthsOld < 36) score += 5;
            }

            // 6. Author credibility (if available)
            if (result.author) score += 8;

            // 7. Highlight matches (Exa provides highlights)
            if (result.highlights && result.highlights.length > 0) {
                score += Math.min(result.highlights.length * 3, 15);
            }

            return { ...result, finalScore: Math.round(score) };
        }).sort((a, b) => b.finalScore - a.finalScore);
    },

    // ==================== Perplexity API Integration ====================

    /**
     * Execute Perplexity search
     * @param {Object} app - App instance
     * @param {string} query - Search query
     * @param {Object} options - Search options
     * @returns {Object} Search result with content and citations
     */
    async executePerplexitySearch(app, query, options = {}) {
        try {
            const perplexityApiKey = localStorage.getItem('perplexityApiKey');
            if (!perplexityApiKey) {
                throw new Error('Perplexity API key not configured. Please add it in Settings.');
            }

            const requestBody = {
                model: options.model || 'llama-3.1-sonar-large-128k-online',
                messages: [
                    {
                        role: 'system',
                        content: options.systemPrompt || 'You are a helpful research assistant. Provide accurate, well-cited information.'
                    },
                    {
                        role: 'user',
                        content: query
                    }
                ],
                temperature: options.temperature || 0.2,
                max_tokens: options.maxTokens || 2000,
                return_citations: true,
                return_images: false,
                search_domain_filter: options.searchDomainFilter || [],
                search_recency_filter: options.searchRecencyFilter || null
            };

            const response = await fetch('https://api.perplexity.ai/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${perplexityApiKey}`
                },
                body: JSON.stringify(requestBody)
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error?.message || 'Perplexity search failed');
            }

            const data = await response.json();
            console.log('✅ Perplexity search completed');
            return {
                content: data.choices[0].message.content,
                citations: data.citations || [],
                model: data.model
            };
        } catch (error) {
            console.error('❌ Perplexity search error:', error);
            throw error;
        }
    },

    /**
     * Analyze feature for Perplexity Q&A
     * @param {Object} feature - Feature object
     * @returns {Object} Analysis context
     */
    analyzeFeatureForPerplexity(feature) {
        // Perplexity excels at Q&A with citations
        // Build specific questions about the feature

        const questions = [];
        const context = [];

        // Add feature name and description
        context.push(`Feature: ${feature.name}`);
        if (feature.description) {
            context.push(`Description: ${feature.description}`);
        }

        // Add categories for context
        if (feature.categories && feature.categories.length > 0) {
            context.push(`Categories: ${feature.categories.join(', ')}`);
        }

        // Generate targeted questions based on what's missing
        if (!feature.executionSteps || feature.executionSteps.length === 0) {
            questions.push('What are the key implementation steps?');
        }

        if (!feature.resources || !feature.resources.technologies) {
            questions.push('What are the recommended technologies and frameworks?');
        }

        if (feature.risks && feature.risks.length > 0) {
            questions.push('What are the best practices to mitigate these risks?');
        }

        if (!feature.acceptanceCriteria || feature.acceptanceCriteria.length === 0) {
            questions.push('What should be the acceptance criteria?');
        }

        // Add general questions
        questions.push('What are the current industry best practices?');
        questions.push('What are common pitfalls to avoid?');

        return {
            context: context.join('\n'),
            questions: questions,
            searchMode: 'detailed', // vs 'quick'
            citationPreference: 'required'
        };
    }
};

// Export for testing
if (typeof module !== 'undefined' && module.exports) {
    module.exports = detailViewAI;
}
