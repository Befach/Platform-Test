/**
 * Detail View AI Workflows Module
 * ================================
 * Advanced AI-powered workflows for feature enhancement and research.
 *
 * This module handles:
 * - Perplexity advanced integration with domain/recency filtering
 * - Smart search routing across multiple AI APIs
 * - Research-based feature creation and enhancement workflows
 * - Enhancement panel UI and interactions
 *
 * Dependencies:
 * - detail-view-ai.js (core AI methods)
 * - OpenRouter API for AI generation
 * - Perplexity API for insights
 * - Tavily API for research
 *
 * @module detailViewAIWorkflows
 */

const detailViewAIWorkflows = {

    // ==================== Perplexity Advanced Integration ====================

    /**
     * Get Perplexity insights with advanced filtering
     * Uses recency and domain filters for targeted results
     * @param {Object} app - App instance
     */
    async getPerplexityInsights(app) {
        if (!app.currentFeatureId) {
            alert('Please select a feature first');
            return;
        }

        const feature = app.features.find(f => f.id === app.currentFeatureId);
        if (!feature) return;

        const perplexityApiKey = localStorage.getItem('perplexityApiKey');
        if (!perplexityApiKey) {
            alert('Perplexity API key required. Please add it in Settings.');
            return;
        }

        try {
            console.log('🔍 Getting Perplexity insights for:', feature.name);

            // Analyze feature for optimal queries (using method from detail-view-ai.js)
            const analysis = detailViewAI.analyzeFeatureForPerplexity(feature);

            // Build comprehensive query with context
            const query = `${analysis.context}

Please provide detailed insights about this feature:

${analysis.questions.map((q, i) => `${i + 1}. ${q}`).join('\n')}

Provide practical, actionable guidance with specific examples and current best practices. Include citations for all recommendations.`;

            // Execute Perplexity search with appropriate filters
            const recencyFilter = this.getPerplexityRecencyFilter(feature);
            const domainFilter = this.getPerplexityDomainFilter(feature);

            const result = await detailViewAI.executePerplexitySearch(app, query, {
                model: 'llama-3.1-sonar-large-128k-online',
                temperature: 0.2,
                maxTokens: 3000,
                searchRecencyFilter: recencyFilter,
                searchDomainFilter: domainFilter
            });

            // Parse and structure the insights
            const insights = {
                id: Date.now().toString(),
                content: result.content,
                citations: result.citations,
                dateAdded: new Date().toISOString(),
                source: 'perplexity',
                model: result.model
            };

            // Add to inspiration items with structured format
            if (!feature.inspirationItems) feature.inspirationItems = [];

            // Add main insight
            feature.inspirationItems.push({
                id: insights.id,
                type: 'research',
                url: 'perplexity://insights',
                title: `Perplexity Insights: ${feature.name}`,
                description: insights.content.substring(0, 500) + '...',
                fullContent: insights.content,
                relevanceScore: 95,
                dateAdded: insights.dateAdded,
                source: 'perplexity',
                metadata: {
                    model: insights.model,
                    citations: insights.citations
                }
            });

            // Add individual citations as inspiration items
            const formattedCitations = this.formatPerplexityCitations(result.citations);
            for (const citation of formattedCitations) {
                const existingItem = feature.inspirationItems.find(item => item.url === citation.url);
                if (!existingItem && citation.url !== 'perplexity://insights') {
                    feature.inspirationItems.push({
                        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
                        type: 'reference',
                        url: citation.url,
                        title: citation.title || 'Citation',
                        description: citation.description || '',
                        relevanceScore: citation.relevance || 80,
                        dateAdded: new Date().toISOString(),
                        source: 'perplexity-citation'
                    });
                }
            }

            app.saveData();
            await app.syncFeatures();

            // Update UI
            app.switchTab('inspiration');

            alert(`✅ Added Perplexity insights with ${formattedCitations.length} citations!`);
            console.log('✅ Added Perplexity insights to inspiration');

        } catch (error) {
            console.error('❌ Error getting Perplexity insights:', error);
            alert('Error getting insights: ' + error.message);
        }
    },

    /**
     * Get recency filter for Perplexity based on feature category
     * @param {Object} feature - Feature object
     * @returns {string|null} Recency filter (month/week/day/hour) or null
     */
    getPerplexityRecencyFilter(feature) {
        const categories = feature.categories || [];

        // month, week, day, hour
        if (categories.includes('AI/ML') || categories.includes('Frontend')) {
            return 'month'; // Very current info
        }

        if (categories.includes('Security')) {
            return 'month'; // Security needs current info
        }

        return null; // No filter for stable technologies
    },

    /**
     * Get domain filter for Perplexity based on feature category
     * @param {Object} feature - Feature object
     * @returns {string[]} Array of domain names to filter
     */
    getPerplexityDomainFilter(feature) {
        const categories = feature.categories || [];
        const domains = [];

        if (categories.includes('AI/ML')) {
            domains.push('arxiv.org', 'huggingface.co', 'paperswithcode.com');
        }

        if (categories.includes('Frontend')) {
            domains.push('web.dev', 'developer.mozilla.org', 'github.com');
        }

        if (categories.includes('Backend')) {
            domains.push('github.com', 'stackoverflow.com', 'medium.com');
        }

        if (categories.includes('Security')) {
            domains.push('owasp.org', 'cve.mitre.org', 'nvd.nist.gov');
        }

        return domains.length > 0 ? domains : [];
    },

    /**
     * Format Perplexity citations into structured objects
     * @param {Array} citations - Raw citations from Perplexity API
     * @returns {Array} Formatted citation objects
     */
    formatPerplexityCitations(citations) {
        if (!citations || citations.length === 0) return [];

        return citations.map(citation => {
            // Perplexity returns URLs as strings
            if (typeof citation === 'string') {
                return {
                    url: citation,
                    title: detailViewAI.extractTitleFromUrl(citation),
                    relevance: 80
                };
            }

            // Or as objects with more metadata
            return {
                url: citation.url || citation,
                title: citation.title || detailViewAI.extractTitleFromUrl(citation.url || citation),
                description: citation.snippet || citation.text || '',
                relevance: citation.relevance || 80
            };
        }).filter(c => c.url && c.url.startsWith('http')); // Filter valid URLs
    },

    // ==================== Smart Search Routing ====================

    /**
     * Intelligently route search queries to best API(s) based on intent
     * @param {Object} app - App instance
     * @param {Object} feature - Feature to search for
     * @param {string} userIntent - User intent (auto, quick-facts, code-examples, etc.)
     * @returns {Array} Search results with source metadata
     */
    async routeSearchQuery(app, feature, userIntent = 'auto') {
        if (!feature) {
            console.error('❌ No feature provided for search routing');
            return [];
        }

        // Analyze what the user needs
        const intent = userIntent === 'auto'
            ? this.analyzeSearchIntent(feature)
            : userIntent;

        console.log('🔀 Routing search with intent:', intent);

        // Check which APIs are available
        const availableApis = {
            tavily: !!app.tavilyApiKey,
            exa: !!app.exaApiKey,
            perplexity: !!localStorage.getItem('perplexityApiKey')
        };

        const results = [];

        // Route based on intent and availability
        switch (intent.primary) {
            case 'quick-facts':
                // Quick facts → Perplexity (if available) OR Tavily
                if (availableApis.perplexity) {
                    console.log('→ Using Perplexity for quick facts');
                    const insights = await this.getPerplexityInsights(app);
                    results.push(...insights);
                } else if (availableApis.tavily) {
                    console.log('→ Using Tavily for quick facts');
                    await detailViewAI.findInspiration(app);
                }
                break;

            case 'code-examples':
                // Code & implementation → Exa (semantic) OR Tavily
                if (availableApis.exa) {
                    console.log('→ Using Exa for code examples');
                    await detailViewAI.findInspirationWithExa(app);
                } else if (availableApis.tavily) {
                    console.log('→ Using Tavily for code examples');
                    await detailViewAI.findInspiration(app);
                }
                break;

            case 'comprehensive-research':
                // Comprehensive → Use ALL available APIs
                console.log('→ Using all available APIs for comprehensive research');
                const searchPromises = [];

                if (availableApis.tavily) {
                    searchPromises.push(
                        detailViewAI.findInspiration(app).catch(e => {
                            console.error('Tavily failed:', e);
                            return [];
                        })
                    );
                }

                if (availableApis.exa) {
                    searchPromises.push(
                        detailViewAI.findInspirationWithExa(app).catch(e => {
                            console.error('Exa failed:', e);
                            return [];
                        })
                    );
                }

                if (availableApis.perplexity) {
                    searchPromises.push(
                        this.getPerplexityInsights(app).catch(e => {
                            console.error('Perplexity failed:', e);
                            return [];
                        })
                    );
                }

                const allResults = await Promise.all(searchPromises);
                results.push(...allResults.flat());
                break;

            case 'best-practices':
                // Best practices → Perplexity (with citations) OR Exa (semantic)
                if (availableApis.perplexity) {
                    console.log('→ Using Perplexity for best practices');
                    await this.getPerplexityInsights(app);
                } else if (availableApis.exa) {
                    console.log('→ Using Exa for best practices');
                    await detailViewAI.findInspirationWithExa(app);
                } else if (availableApis.tavily) {
                    console.log('→ Using Tavily for best practices');
                    await detailViewAI.findInspiration(app);
                }
                break;

            default:
                // Fallback: Use first available API
                console.log('→ Using fallback: first available API');
                if (availableApis.tavily) {
                    await detailViewAI.findInspiration(app);
                } else if (availableApis.exa) {
                    await detailViewAI.findInspirationWithExa(app);
                } else if (availableApis.perplexity) {
                    await this.getPerplexityInsights(app);
                }
        }

        return results;
    },

    /**
     * Analyze feature to determine search intent
     * @param {Object} feature - Feature to analyze
     * @returns {Object} Intent analysis {primary, confidence, reasoning, scores}
     */
    analyzeSearchIntent(feature) {
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
     * Generate human-readable explanation of search intent
     * @param {string} intent - Primary intent
     * @param {Object} feature - Feature object
     * @returns {string} Explanation text
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
     * Public method to trigger smart search routing
     * Can be called from UI buttons
     * @param {Object} app - App instance
     */
    async smartSearch(app) {
        if (!app.currentFeatureId) {
            alert('Please select a feature first');
            return;
        }

        const feature = app.features.find(f => f.id === app.currentFeatureId);
        if (!feature) return;

        try {
            // Analyze intent
            const intent = this.analyzeSearchIntent(feature);

            console.log('🎯 Smart Search Intent Analysis:', intent);

            // Show intent to user
            const proceed = confirm(
                `Smart Search Analysis:\n\n` +
                `Intent: ${intent.primary.replace('-', ' ').toUpperCase()}\n` +
                `Confidence: ${Math.round(intent.confidence * 100)}%\n` +
                `Reasoning: ${intent.reasoning}\n\n` +
                `Proceed with search?`
            );

            if (!proceed) return;

            // Execute routing
            await this.routeSearchQuery(app, feature, 'auto');

            alert('✅ Smart search completed! Check the Inspiration tab.');

        } catch (error) {
            console.error('❌ Smart search error:', error);
            alert('Error during smart search: ' + error.message);
        }
    },

    // ==================== Enhancement Panel Workflow ====================

    /**
     * Show enhancement panel for feature
     * @param {Object} app - App instance
     * @param {string} featureId - Feature ID
     */
    showEnhancementPanel(app, featureId) {
        const feature = app.features.find(f => f.id === featureId);
        if (!feature) {
            app.showAlert({ title: 'Error', message: 'Feature not found', variant: 'error' });
            return;
        }

        // Set flags
        app.aiFeatureEnhancementMode = true;
        app.currentFeatureId = featureId;
        app.enhancementQuestions = [];
        app.enhancementAnswers = {};

        // Show panel
        const panel = document.getElementById('enhancementPanel');
        panel.classList.remove('hidden');

        // Populate understanding section
        document.getElementById('understandingName').textContent = feature.name;
        document.getElementById('understandingType').textContent = feature.type;
        document.getElementById('understandingPurpose').textContent = feature.purpose || 'Not specified';

        // Identify gaps
        const gaps = [];
        if (!feature.executionSteps || feature.executionSteps.length === 0) gaps.push('Execution Steps');
        if (!feature.resources) gaps.push('Resources');
        if (!feature.planning) gaps.push('Planning');
        if (!feature.inspiration || feature.inspiration.length === 0) gaps.push('Inspiration');

        const gapsContainer = document.getElementById('enhancementGaps');
        if (gaps.length > 0) {
            gapsContainer.innerHTML = gaps.map(gap =>
                `<span class="gap-badge">${gap}</span>`
            ).join('');
        } else {
            gapsContainer.innerHTML = '<p style="font-size:13px; color:var(--text-muted); font-style:italic;">No gaps found - feature looks complete!</p>';
        }

        // Generate questions via AI
        this.generateEnhancementQuestions(app, feature);
    },

    /**
     * Generate AI-powered enhancement questions for feature
     * @param {Object} app - App instance
     * @param {Object} feature - Feature object
     */
    async generateEnhancementQuestions(app, feature) {
        const questionsContainer = document.getElementById('enhancementQuestions');
        questionsContainer.innerHTML = '<p class="enhancement-loading">Generating questions...</p>';

        try {
            const featureContext = `Feature Name: ${feature.name}
Type: ${feature.type}
Purpose: ${feature.purpose || 'Not specified'}
Current State: ${feature.executionSteps ? 'Has execution steps' : 'Missing execution steps'}, ${feature.resources ? 'Has resources' : 'Missing resources'}, ${feature.planning ? 'Has planning' : 'Missing planning'}`;

            const prompt = `Based on this feature, generate 3-5 targeted clarifying questions to gather information needed to enhance it:

${featureContext}

Return ONLY a JSON array of questions, like: ["Question 1?", "Question 2?", "Question 3?"]
Make questions specific, actionable, and focused on missing information.`;

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
                        { role: 'system', content: 'You are a helpful assistant that generates clarifying questions. Return only valid JSON.' },
                        { role: 'user', content: prompt }
                    ],
                    temperature: 0.7
                })
            });

            const data = await response.json();
            const content = data.choices[0].message.content;

            // Extract JSON array
            const jsonMatch = content.match(/\[[\s\S]*\]/);
            if (jsonMatch) {
                app.enhancementQuestions = JSON.parse(jsonMatch[0]);

                // Display questions
                questionsContainer.innerHTML = app.enhancementQuestions.map((q, i) => `
                    <div class="question-item">
                        <label class="question-label">${i + 1}. ${q}</label>
                        <input type="text" class="question-input" id="question-${i}" placeholder="Your answer..." oninput="app.checkEnhancementAnswers()">
                    </div>
                `).join('');

                // Enable submit button when all answered
                document.getElementById('enhancementSubmitBtn').disabled = true;
            } else {
                throw new Error('Failed to parse questions');
            }
        } catch (error) {
            console.error('Error generating questions:', error);
            questionsContainer.innerHTML = '<p style="color:var(--danger); font-size:13px;">Error generating questions. Please try again or use chat instead.</p>';
        }
    },

    /**
     * Check if all enhancement questions are answered
     * @param {Object} app - App instance
     */
    checkEnhancementAnswers(app) {
        const allAnswered = app.enhancementQuestions.every((_, i) => {
            const input = document.getElementById(`question-${i}`);
            return input && input.value.trim().length > 0;
        });

        document.getElementById('enhancementSubmitBtn').disabled = !allAnswered;
    },

    /**
     * Close enhancement panel
     * @param {Object} app - App instance
     */
    closeEnhancementPanel(app) {
        const panel = document.getElementById('enhancementPanel');
        panel.classList.add('hidden');

        // Reset state
        app.aiFeatureEnhancementMode = false;
        app.currentFeatureId = null;
        app.enhancementQuestions = [];
        app.enhancementAnswers = {};
    },

    /**
     * Submit enhancement answers and start research workflow
     * @param {Object} app - App instance
     */
    async submitEnhancementAnswers(app) {
        // Collect answers
        app.enhancementQuestions.forEach((q, i) => {
            const input = document.getElementById(`question-${i}`);
            if (input) {
                app.enhancementAnswers[q] = input.value.trim();
            }
        });

        // Validate that all questions have answers
        const unansweredQuestions = app.enhancementQuestions.filter((q, i) => {
            const input = document.getElementById(`question-${i}`);
            return !input || !input.value.trim();
        });

        if (unansweredQuestions.length > 0) {
            await app.showAlert({
                title: 'Missing Answers',
                message: 'Please answer all questions before proceeding. This ensures I have enough context to enhance your feature properly.',
                variant: 'warning'
            });
            return;
        }

        // Hide questions, show progress
        document.getElementById('enhancementQuestions').classList.add('hidden');
        const progressSection = document.getElementById('enhancementProgress');
        progressSection.classList.remove('hidden');

        // Disable submit button
        document.getElementById('enhancementSubmitBtn').disabled = true;

        // Get feature
        const feature = app.features.find(f => f.id === app.currentFeatureId);

        // Build research prompt
        const answersText = Object.entries(app.enhancementAnswers)
            .map(([q, a]) => `Q: ${q}\nA: ${a}`)
            .join('\n\n');

        // Update progress
        this.updateEnhancementProgress(20, 'Conducting research...');

        try {
            // Conduct research
            const enhancedData = {
                name: feature.name,
                type: feature.type,
                purpose: feature.purpose,
                timelineItems: feature.timelineItems || [],
                additionalInfo: answersText
            };

            this.updateEnhancementProgress(40, 'Searching for relevant information...');

            const researchResults = await this.conductFeatureResearch(app, enhancedData);

            this.updateEnhancementProgress(60, 'Generating execution steps...');

            const executionSteps = await this.generateExecutionStepsFromResearch(app, enhancedData, researchResults);

            this.updateEnhancementProgress(70, 'Suggesting resources...');

            const resources = await this.suggestResourcesFromResearch(app, enhancedData, researchResults);

            this.updateEnhancementProgress(80, 'Creating planning details...');

            const planning = await this.generatePlanningFromResearch(app, enhancedData, researchResults);

            this.updateEnhancementProgress(90, 'Finding inspiration sources...');

            const inspiration = this.selectBestInspirationSources(researchResults);

            // Update feature
            feature.executionSteps = executionSteps;
            feature.resources = resources;
            feature.planning = planning;
            feature.inspiration = inspiration;
            feature.aiModified = true;

            app.saveData();
            app.renderFeatureDetail(app.currentFeatureId);
            app.renderTable();

            this.updateEnhancementProgress(100, 'Complete!');

            // Close panel after delay
            setTimeout(() => {
                this.closeEnhancementPanel(app);
                app.showToast('✓ Feature enhanced successfully!', 'success');
            }, 1000);

        } catch (error) {
            console.error('Enhancement error:', error);
            document.getElementById('enhancementProgressText').textContent = `Error: ${error.message}`;
            document.getElementById('enhancementProgressText').style.color = 'var(--danger)';
        }
    },

    /**
     * Update enhancement progress bar and message
     * @param {number} percent - Progress percentage (0-100)
     * @param {string} message - Progress message
     */
    updateEnhancementProgress(percent, message) {
        const fill = document.getElementById('enhancementProgressFill');
        const text = document.getElementById('enhancementProgressText');

        if (fill) fill.style.width = `${percent}%`;
        if (text) text.textContent = message;
    },

    /**
     * Start AI enhancement workflow for feature
     * @param {Object} app - App instance
     * @param {string} featureId - Feature ID
     */
    startAIEnhancementWorkflow(app, featureId) {
        // Use the new enhancement panel instead of chat
        this.showEnhancementPanel(app, featureId);
    },

    // ==================== Research-Based Feature Creation ====================

    /**
     * Enhance existing feature with AI research
     * AI Tool: Called by chat AI to enhance features
     * @param {Object} app - App instance
     * @param {Object} actionData - Enhancement data
     * @returns {Object} Success/error result
     */
    async executeEnhanceFeatureWithResearch(app, actionData) {
        try {
            const featureId = actionData.featureId || app.currentFeatureId;
            const feature = app.features.find(f => f.id === featureId);

            if (!feature) {
                return { success: false, error: 'Feature not found' };
            }

            // IMPORTANT: Enforce that enhancement can ONLY happen through the enhancement panel
            if (!app.aiFeatureEnhancementMode || Object.keys(app.enhancementAnswers || {}).length === 0) {
                app.addChatMessage('⚠️ To enhance a feature, I need to ask you some questions first. Please click the "AI Enhance" button on the feature to start the guided enhancement process.', 'ai');
                return {
                    success: false,
                    error: 'Enhancement must be initiated through the enhancement panel to ensure proper context gathering'
                };
            }

            await app.showAlert({ title: 'Enhancing Feature...', message: 'AI is researching and generating comprehensive feature details...', variant: 'info' });

            // Merge existing data with new data from actionData
            const enhancedData = {
                name: actionData.name || feature.name,
                type: actionData.type || feature.type,
                purpose: actionData.purpose || feature.purpose,
                timelineItems: feature.timelineItems || [],
                additionalInfo: actionData.additionalInfo || ''
            };

            // Step 1: Conduct Tavily research
            const researchResults = await this.conductFeatureResearch(app, enhancedData);

            // Step 2: AI generates execution steps from research
            const executionSteps = await this.generateExecutionStepsFromResearch(app, enhancedData, researchResults);

            // Step 3: AI suggests resources
            const resources = await this.suggestResourcesFromResearch(app, enhancedData, researchResults);

            // Step 4: AI creates planning (milestones, risks)
            const planning = await this.generatePlanningFromResearch(app, enhancedData, researchResults);

            // Step 5: Select best inspiration sources from research
            const inspiration = this.selectBestInspirationSources(researchResults);

            // Step 6: Update the existing feature
            feature.executionSteps = executionSteps;
            feature.resources = resources;
            feature.planning = planning;
            feature.inspiration = inspiration;
            feature.aiModified = true;
            feature.updatedAt = new Date().toISOString();

            // Update name/purpose if provided
            if (actionData.name) feature.name = actionData.name;
            if (actionData.purpose) feature.purpose = actionData.purpose;
            if (actionData.type) feature.type = actionData.type;

            // Save changes
            app.saveData();
            app.renderFeatureDetail(featureId);
            app.renderTable();

            // Reset enhancement mode
            app.aiFeatureEnhancementMode = false;

            await app.showAlert({
                title: 'Feature Enhanced!',
                message: 'AI has researched and populated all detail sections. Review and edit as needed.',
                variant: 'success'
            });

            return {
                success: true,
                featureId: featureId,
                message: 'Feature enhanced successfully with AI research! All sections have been updated.'
            };

        } catch (error) {
            console.error('Error enhancing feature with research:', error);
            await app.showAlert({ title: 'Error', message: 'Failed to enhance feature. Please try again.', variant: 'error' });
            app.aiFeatureEnhancementMode = false;
            return { success: false, error: error.message };
        }
    },

    /**
     * Create new feature with AI research
     * AI Tool: Called by chat AI to create features
     * @param {Object} app - App instance
     * @param {Object} actionData - Feature data
     * @returns {Object} Success/error result
     */
    async executeCreateFeatureWithResearch(app, actionData) {
        try {
            await app.showAlert({ title: 'Creating Feature...', message: 'AI is researching and generating comprehensive feature details...', variant: 'info' });

            // Step 1: Conduct Tavily research
            const researchResults = await this.conductFeatureResearch(app, actionData);

            // Step 2: AI generates execution steps from research
            const executionSteps = await this.generateExecutionStepsFromResearch(app, actionData, researchResults);

            // Step 3: AI suggests resources
            const resources = await this.suggestResourcesFromResearch(app, actionData, researchResults);

            // Step 4: AI creates planning (milestones, risks)
            const planning = await this.generatePlanningFromResearch(app, actionData, researchResults);

            // Step 5: Select best inspiration sources from research
            const inspiration = this.selectBestInspirationSources(researchResults);

            // Step 6: Create the feature
            const newFeature = {
                id: Date.now().toString(),
                name: actionData.name,
                type: actionData.type || 'Feature',
                purpose: actionData.purpose,
                workspaceId: app.currentWorkspaceId,
                timelineItems: actionData.timelineItems || [],
                executionSteps: executionSteps,
                resources: resources,
                planning: planning,
                inspiration: inspiration,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                aiCreated: true
            };

            // Add to features array
            app.features.push(newFeature);
            app.saveData();
            app.renderTable();

            // Reset AI creation mode
            app.aiFeatureCreationMode = false;

            // Show detail view for review
            app.showDetailView(newFeature.id);

            await app.showAlert({
                title: 'Feature Created!',
                message: 'AI has created a comprehensive feature plan. Review and edit as needed.',
                variant: 'success'
            });

            return {
                success: true,
                featureId: newFeature.id,
                message: 'Feature created successfully with AI research! Opening detail view for your review.'
            };

        } catch (error) {
            console.error('Error creating feature with research:', error);
            await app.showAlert({ title: 'Error', message: 'Failed to create feature. Please try again.', variant: 'error' });
            return { success: false, error: error.message };
        }
    },

    /**
     * Conduct comprehensive research for feature using Tavily
     * @param {Object} app - App instance
     * @param {Object} actionData - Feature data
     * @returns {Array} Top 15 research results
     */
    async conductFeatureResearch(app, actionData) {
        // Create a temporary feature object for research
        const tempFeature = {
            id: 'temp',
            name: actionData.name,
            type: actionData.type || 'Feature',
            purpose: actionData.purpose
        };

        // Use the same AI-enhanced search from detail-view-ai.js
        const searchContext = await detailViewAI.analyzeFeatureForSearch(app, tempFeature);
        const queries = detailViewAI.generateSmartQueries(tempFeature, searchContext);

        // Execute searches in parallel
        const searchPromises = queries.map(q => detailViewAI.executeTavilySearch(app, q));
        const rawResults = await Promise.all(searchPromises);

        // Flatten and deduplicate
        const allResults = rawResults.flat();
        const uniqueResults = detailViewAI.deduplicateResults(allResults);

        // Score and rank
        const scoredResults = uniqueResults.map(r => ({
            ...r,
            score: detailViewAI.scoreResult(r, tempFeature),
            category: detailViewAI.categorizeResult(r)
        }));

        scoredResults.sort((a, b) => b.score - a.score);

        return scoredResults.slice(0, 15); // Top 15 results for comprehensive research
    },

    /**
     * Generate execution steps from research results using AI
     * @param {Object} app - App instance
     * @param {Object} actionData - Feature data
     * @param {Array} researchResults - Research results
     * @returns {Array} Execution steps
     */
    async generateExecutionStepsFromResearch(app, actionData, researchResults) {
        const researchSummary = researchResults.slice(0, 5).map((r, i) =>
            `[${i + 1}] ${r.title}\n${r.content?.substring(0, 150) || 'No description'}`
        ).join('\n\n');

        const prompt = `Based on this feature and research, generate 5-8 detailed execution steps:

Feature: ${actionData.name}
Purpose: ${actionData.purpose}
Type: ${actionData.type}

Research findings:
${researchSummary}

Generate execution steps as JSON array:
[{
    "title": "Step title",
    "description": "Detailed description of what to do",
    "estimatedHours": number
}]

Make steps actionable, specific, and based on the research findings.`;

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
                    { role: 'system', content: 'You are a technical project planner. Return only valid JSON.' },
                    { role: 'user', content: prompt }
                ]
            })
        });

        const data = await response.json();
        const content = data.choices[0].message.content;

        const jsonMatch = content.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
            const steps = JSON.parse(jsonMatch[0]);
            return steps.map((step, index) => ({
                id: Date.now().toString() + index,
                order: index,
                title: step.title,
                description: step.description,
                estimatedHours: step.estimatedHours || null,
                completed: false
            }));
        }

        return [];
    },

    /**
     * Suggest resources from research results using AI
     * @param {Object} app - App instance
     * @param {Object} actionData - Feature data
     * @param {Array} researchResults - Research results
     * @returns {Object} Resources object
     */
    async suggestResourcesFromResearch(app, actionData, researchResults) {
        const researchSummary = researchResults.slice(0, 5).map((r, i) =>
            `[${i + 1}] ${r.title}`
        ).join('\n');

        const prompt = `Based on this feature and research, suggest required resources:

Feature: ${actionData.name}
Purpose: ${actionData.purpose}

Research sources:
${researchSummary}

Generate resources as JSON:
{
    "teamRoles": [{"role": "Developer", "count": 2, "skillLevel": "Senior"}],
    "technologies": ["React", "Node.js", "PostgreSQL"],
    "estimatedBudget": "$15k-25k",
    "estimatedHours": 120
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
                    { role: 'system', content: 'You are a resource planning expert. Return only valid JSON.' },
                    { role: 'user', content: prompt }
                ]
            })
        });

        const data = await response.json();
        const content = data.choices[0].message.content;

        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            return JSON.parse(jsonMatch[0]);
        }

        return {};
    },

    /**
     * Generate planning details from research results using AI
     * @param {Object} app - App instance
     * @param {Object} actionData - Feature data
     * @param {Array} researchResults - Research results
     * @returns {Object} Planning object with milestones, risks, prerequisites
     */
    async generatePlanningFromResearch(app, actionData, researchResults) {
        const prompt = `Based on this feature, generate planning details:

Feature: ${actionData.name}
Purpose: ${actionData.purpose}

Generate planning as JSON:
{
    "milestones": [{"id": "1", "name": "Milestone name", "targetDate": null, "status": "pending", "dependencies": []}],
    "risks": [{"id": "1", "description": "Risk description", "severity": "medium", "mitigation": "How to mitigate"}],
    "prerequisites": ["Prerequisite 1", "Prerequisite 2"]
}

Generate 3-4 milestones, 3-5 risks, and 2-4 prerequisites.`;

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
                    { role: 'system', content: 'You are a project planning expert. Return only valid JSON.' },
                    { role: 'user', content: prompt }
                ]
            })
        });

        const data = await response.json();
        const content = data.choices[0].message.content;

        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            return JSON.parse(jsonMatch[0]);
        }

        return {
            milestones: [],
            risks: [],
            prerequisites: []
        };
    },

    /**
     * Select best inspiration sources from research results
     * @param {Array} researchResults - Research results
     * @returns {Array} Top 8 inspiration items
     */
    selectBestInspirationSources(researchResults) {
        // Take top 8 results and format for inspiration
        return researchResults.slice(0, 8).map(result => ({
            id: Date.now().toString() + Math.random(),
            title: result.title,
            url: result.url,
            description: result.content?.substring(0, 200) || '',
            type: result.category || 'reference',
            imageUrl: null,
            score: result.score
        }));
    }
};
