// AI Service - OpenRouter API integration for chat and feature enhancement
const aiService = {
    apiEndpoint: 'https://openrouter.ai/api/v1/chat/completions',

    // Get API configuration from storage
    getApiKey() {
        return storageService.loadApiKey();
    },

    getModel() {
        return storageService.loadModel();
    },

    getCustomInstructions() {
        return storageService.loadCustomInstructions();
    },

    // Validate API key is configured
    validateApiKey() {
        const apiKey = this.getApiKey();
        if (!apiKey) {
            throw new Error('OpenRouter API key not configured. Please add your API key in settings.');
        }
        return apiKey;
    },

    // Core chat method - sends message to OpenRouter API with streaming
    async chat(messages, options = {}) {
        const apiKey = this.validateApiKey();
        const model = options.model || this.getModel();

        const {
            stream = false,
            temperature = 0.7,
            maxTokens = 4000,
            onChunk = null
        } = options;

        try {
            const response = await fetch(this.apiEndpoint, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json',
                    'HTTP-Referer': window.location.origin,
                    'X-Title': 'Platform Roadmap Manager'
                },
                body: JSON.stringify({
                    model: model,
                    messages: messages,
                    temperature: temperature,
                    max_tokens: maxTokens,
                    stream: stream
                })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error?.message || `API error: ${response.statusText}`);
            }

            if (stream && onChunk) {
                // Handle streaming response
                const reader = response.body.getReader();
                const decoder = new TextDecoder();
                let fullContent = '';

                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;

                    const chunk = decoder.decode(value);
                    const lines = chunk.split('\n');

                    for (const line of lines) {
                        if (line.startsWith('data: ')) {
                            const data = line.slice(6);
                            if (data === '[DONE]') continue;

                            try {
                                const parsed = JSON.parse(data);
                                const content = parsed.choices?.[0]?.delta?.content;
                                if (content) {
                                    fullContent += content;
                                    onChunk(content, fullContent);
                                }
                            } catch (e) {
                                // Skip invalid JSON
                            }
                        }
                    }
                }

                return { success: true, content: fullContent };
            } else {
                // Non-streaming response
                const data = await response.json();
                const content = data.choices?.[0]?.message?.content || '';
                return { success: true, content };
            }
        } catch (error) {
            console.error('AI chat error:', error);
            return { success: false, error: error.message };
        }
    },

    // Analyze conversation for memory suggestions
    async analyzeConversationForMemory(conversation) {
        if (!conversation || conversation.length === 0) {
            return [];
        }

        const apiKey = this.validateApiKey();

        const prompt = `Analyze this conversation and extract 1-3 key learnings or preferences that should be remembered for future interactions.

Conversation:
${conversation.map(msg => `${msg.role}: ${msg.content}`).join('\n')}

Extract information like:
- User preferences
- Project context
- Technical choices
- Domain knowledge
- Goals and priorities

Return ONLY a JSON array of memory items:
[{"category": "preference|context|technical|domain|goal", "content": "the learning", "confidence": 0.7-1.0}]`;

        try {
            const response = await fetch(this.apiEndpoint, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json',
                    'HTTP-Referer': window.location.origin,
                    'X-Title': 'Platform Roadmap Manager'
                },
                body: JSON.stringify({
                    model: 'meta-llama/llama-3.3-70b-instruct',
                    messages: [
                        { role: 'system', content: 'You are a helpful assistant that extracts key learnings from conversations. Always respond with valid JSON.' },
                        { role: 'user', content: prompt }
                    ],
                    temperature: 0.3,
                    max_tokens: 1000
                })
            });

            if (!response.ok) throw new Error(`API error: ${response.statusText}`);

            const data = await response.json();
            const content = data.choices?.[0]?.message?.content || '[]';

            // Parse JSON from response
            const memories = this.parseAIJSON(content);
            return Array.isArray(memories) ? memories : [];
        } catch (error) {
            console.error('Memory analysis error:', error);
            return [];
        }
    },

    // Summarize timeline items for a feature
    async summarizeTimelineItems(timelineItems) {
        if (!timelineItems || timelineItems.length === 0) {
            return null;
        }

        const apiKey = this.validateApiKey();
        const model = this.getModel();

        const itemsText = timelineItems.map((item, i) =>
            `${i + 1}. ${item.name} (${item.timeline}, ${item.difficulty})`
        ).join('\n');

        const prompt = `Summarize these timeline items into a cohesive implementation overview:

${itemsText}

Provide a brief 2-3 sentence summary that describes the overall approach and sequence.`;

        try {
            const response = await this.chat([
                { role: 'system', content: 'You are a technical project manager. Provide concise summaries.' },
                { role: 'user', content: prompt }
            ], { model, temperature: 0.5, maxTokens: 500 });

            return response.success ? response.content : null;
        } catch (error) {
            console.error('Summarize error:', error);
            return null;
        }
    },

    // Analyze batch links between timeline items
    async analyzeBatchLinks(timelineItems) {
        if (!timelineItems || timelineItems.length < 2) {
            return [];
        }

        const apiKey = this.validateApiKey();
        const model = this.getModel();

        const itemsText = timelineItems.map((item, i) =>
            `[${i}] ${item.name} - ${item.description || ''}`
        ).join('\n');

        const prompt = `Analyze these timeline items and suggest which ones should be linked (dependencies or complementary relationships):

${itemsText}

For each suggested link, specify:
- fromIndex: source item index
- toIndex: target item index
- relationshipType: "dependency" or "complements"
- direction: "outgoing" (from→to) or "incoming" (to→from)
- reason: why they should be linked
- confidence: 0.7-1.0

Return ONLY a JSON array:
[{"fromIndex": 0, "toIndex": 1, "relationshipType": "dependency", "direction": "outgoing", "reason": "...", "confidence": 0.9}]`;

        try {
            const response = await this.chat([
                { role: 'system', content: 'You are a project planning expert. Identify logical dependencies and relationships. Always respond with valid JSON.' },
                { role: 'user', content: prompt }
            ], { model, temperature: 0.4, maxTokens: 2000 });

            if (response.success) {
                const links = this.parseAIJSON(response.content);
                return Array.isArray(links) ? links : [];
            }
            return [];
        } catch (error) {
            console.error('Batch link analysis error:', error);
            return [];
        }
    },

    // Generate execution plan for a feature
    async generateExecutionPlan(feature) {
        const apiKey = this.validateApiKey();
        const model = this.getModel();

        const prompt = `Create a detailed execution plan for this feature:

Name: ${feature.name}
Purpose: ${feature.purpose || 'Not specified'}
USP: ${feature.usp || 'Not specified'}
Categories: ${feature.categories?.join(', ') || 'None'}

Generate 5-10 execution steps that cover:
- Setup and prerequisites
- Core implementation
- Testing and validation
- Deployment considerations

Return ONLY a JSON array:
[{"step": "Step description", "phase": "setup|implementation|testing|deployment", "estimatedHours": 2}]`;

        try {
            const response = await this.chat([
                { role: 'system', content: 'You are a senior software architect. Create detailed, actionable execution plans. Always respond with valid JSON.' },
                { role: 'user', content: prompt }
            ], { model, temperature: 0.5, maxTokens: 2000 });

            if (response.success) {
                const steps = this.parseAIJSON(response.content);
                return { success: true, steps: Array.isArray(steps) ? steps : [] };
            }
            return { success: false, error: 'Failed to generate execution plan' };
        } catch (error) {
            console.error('Execution plan error:', error);
            return { success: false, error: error.message };
        }
    },

    // Suggest resources for a feature
    async suggestResources(feature) {
        const apiKey = this.validateApiKey();
        const model = this.getModel();

        const prompt = `Suggest learning resources and documentation for implementing this feature:

Name: ${feature.name}
Purpose: ${feature.purpose || 'Not specified'}
Categories: ${feature.categories?.join(', ') || 'None'}

Suggest 5-8 resources including:
- Official documentation
- Tutorials and guides
- Best practices articles
- Example implementations

Return ONLY a JSON array:
[{"title": "Resource title", "type": "documentation|tutorial|article|example", "url": "https://...", "description": "Brief description"}]`;

        try {
            const response = await this.chat([
                { role: 'system', content: 'You are a technical educator. Suggest high-quality, current resources. Always respond with valid JSON.' },
                { role: 'user', content: prompt }
            ], { model, temperature: 0.6, maxTokens: 2000 });

            if (response.success) {
                const resources = this.parseAIJSON(response.content);
                return { success: true, resources: Array.isArray(resources) ? resources : [] };
            }
            return { success: false, error: 'Failed to suggest resources' };
        } catch (error) {
            console.error('Resource suggestion error:', error);
            return { success: false, error: error.message };
        }
    },

    // Generate milestones for a feature
    async generateMilestones(feature) {
        const apiKey = this.validateApiKey();
        const model = this.getModel();

        const prompt = `Create development milestones for this feature:

Name: ${feature.name}
Purpose: ${feature.purpose || 'Not specified'}

Generate 3-5 major milestones that represent significant progress points.

Return ONLY a JSON array:
[{"name": "Milestone name", "description": "What's achieved", "deliverables": ["deliverable 1", "deliverable 2"]}]`;

        try {
            const response = await this.chat([
                { role: 'system', content: 'You are a project manager. Create meaningful, measurable milestones. Always respond with valid JSON.' },
                { role: 'user', content: prompt }
            ], { model, temperature: 0.5, maxTokens: 1500 });

            if (response.success) {
                const milestones = this.parseAIJSON(response.content);
                return { success: true, milestones: Array.isArray(milestones) ? milestones : [] };
            }
            return { success: false, error: 'Failed to generate milestones' };
        } catch (error) {
            console.error('Milestone generation error:', error);
            return { success: false, error: error.message };
        }
    },

    // Suggest prerequisites for a feature
    async suggestPrerequisites(feature, allFeatures = []) {
        const apiKey = this.validateApiKey();
        const model = this.getModel();

        const otherFeatures = allFeatures
            .filter(f => f.id !== feature.id)
            .map(f => `- ${f.name}: ${f.purpose || ''}`)
            .join('\n');

        const prompt = `Identify prerequisite features or capabilities needed before implementing this feature:

Feature: ${feature.name}
Purpose: ${feature.purpose || 'Not specified'}

${otherFeatures ? `Other existing features:\n${otherFeatures}\n` : ''}

Suggest 2-5 prerequisites that should exist first.

Return ONLY a JSON array:
[{"name": "Prerequisite name", "reason": "Why it's needed", "existing": false}]`;

        try {
            const response = await this.chat([
                { role: 'system', content: 'You are a software architect. Identify logical prerequisites and dependencies. Always respond with valid JSON.' },
                { role: 'user', content: prompt }
            ], { model, temperature: 0.5, maxTokens: 1500 });

            if (response.success) {
                const prerequisites = this.parseAIJSON(response.content);
                return { success: true, prerequisites: Array.isArray(prerequisites) ? prerequisites : [] };
            }
            return { success: false, error: 'Failed to suggest prerequisites' };
        } catch (error) {
            console.error('Prerequisite suggestion error:', error);
            return { success: false, error: error.message };
        }
    },

    // Generate enhancement questions for a feature
    async generateEnhancementQuestions(feature) {
        const apiKey = this.validateApiKey();
        const model = this.getModel();

        const prompt = `Generate 5-8 clarifying questions that would help better define and implement this feature:

Name: ${feature.name}
Purpose: ${feature.purpose || 'Not specified'}
USP: ${feature.usp || 'Not specified'}

Focus on:
- Technical implementation details
- User experience considerations
- Edge cases and error handling
- Performance and scalability
- Integration points

Return ONLY a JSON array of question strings:
["Question 1?", "Question 2?", ...]`;

        try {
            const response = await this.chat([
                { role: 'system', content: 'You are a senior software engineer doing requirements analysis. Ask insightful, technical questions. Always respond with valid JSON.' },
                { role: 'user', content: prompt }
            ], { model, temperature: 0.6, maxTokens: 1500 });

            if (response.success) {
                const questions = this.parseAIJSON(response.content);
                return { success: true, questions: Array.isArray(questions) ? questions : [] };
            }
            return { success: false, error: 'Failed to generate questions' };
        } catch (error) {
            console.error('Question generation error:', error);
            return { success: false, error: error.message };
        }
    },

    // Synthesize search results with AI analysis
    async synthesizeSearchResults(query, searchResults) {
        const apiKey = this.validateApiKey();
        const model = this.getModel();

        const resultsText = searchResults
            .slice(0, 5)
            .map((r, i) => `[${i + 1}] ${r.title}\n${r.content || r.snippet || ''}\nURL: ${r.url}`)
            .join('\n\n');

        const prompt = `Analyze these search results for the query "${query}" and provide actionable insights:

${resultsText}

Provide a structured analysis with:
1. Key findings (3-5 bullet points)
2. Recommended approach
3. Important considerations
4. Next steps

Format as markdown.`;

        try {
            const response = await this.chat([
                { role: 'system', content: 'You are a research analyst. Synthesize information into actionable insights.' },
                { role: 'user', content: prompt }
            ], { model, temperature: 0.6, maxTokens: 2000 });

            return response.success ? response.content : null;
        } catch (error) {
            console.error('Search synthesis error:', error);
            return null;
        }
    },

    // Parse AI JSON response with fallback
    parseAIJSON(content) {
        try {
            // Try direct parse first
            return JSON.parse(content);
        } catch (e) {
            // Try to extract JSON from markdown code blocks
            const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/) ||
                             content.match(/```\s*([\s\S]*?)\s*```/);

            if (jsonMatch) {
                try {
                    return JSON.parse(jsonMatch[1]);
                } catch (e2) {
                    // Fall through
                }
            }

            // Try to find JSON array or object
            const arrayMatch = content.match(/\[[\s\S]*\]/);
            const objectMatch = content.match(/\{[\s\S]*\}/);

            if (arrayMatch) {
                try {
                    return JSON.parse(arrayMatch[0]);
                } catch (e3) {
                    // Fall through
                }
            }

            if (objectMatch) {
                try {
                    return JSON.parse(objectMatch[0]);
                } catch (e4) {
                    // Fall through
                }
            }

            console.warn('Failed to parse AI JSON response:', content);
            return null;
        }
    },

    // Build conversation context with memory
    buildConversationContext(memory = [], customInstructions = '') {
        const memoryContext = memory.length > 0
            ? `\n\nPrevious learnings about this project:\n${memory.map(m => `- ${m.content}`).join('\n')}`
            : '';

        const instructionsContext = customInstructions
            ? `\n\nCustom instructions: ${customInstructions}`
            : '';

        return memoryContext + instructionsContext;
    },

    // ==================== WORKFLOW-AWARE METHODS ====================

    /**
     * Generate AI response with workflow context
     * Automatically injects stage-specific guidance into prompts
     * @param {Array} messages - Chat messages
     * @param {Object} feature - Current feature
     * @param {Object} workspace - Current workspace
     * @param {Object} options - Chat options
     * @returns {Object} AI response
     */
    async chatWithWorkflowContext(messages, feature, workspace, options = {}) {
        // Check if workflow mode is enabled for workspace
        if (workspace && workspace.workflowModeEnabled && feature && typeof workflowOrchestrator !== 'undefined') {
            const workflowContext = workflowOrchestrator.buildStageContext(feature, workspace);

            // Inject workflow context into system message
            if (messages.length > 0 && messages[0].role === 'system') {
                messages[0].content += workflowContext;
            } else {
                messages.unshift({
                    role: 'system',
                    content: `You are a helpful AI assistant for roadmap planning.${workflowContext}`
                });
            }

            console.log('✨ Injected workflow context into AI chat');
        }

        return this.chat(messages, options);
    },

    /**
     * Generate stage-specific suggestions
     * @param {Object} feature - Feature object
     * @param {String} stage - Target stage
     * @returns {Object} { success: Boolean, suggestions: Object }
     */
    async generateStageSuggestions(feature, stage) {
        const apiKey = this.validateApiKey();
        const model = this.getModel();

        const stageGuidance = {
            'ideation': 'Suggest 5-7 research questions, potential risks, and inspiration sources for this feature idea',
            'planning': 'Suggest execution steps, milestones, and resource requirements needed to build this feature',
            'execution': 'Suggest progress tracking approach, testing strategies, and deployment considerations for this feature'
        };

        const prompt = `For this feature in ${stage} stage:

Name: ${feature.name}
Purpose: ${feature.purpose || 'Not specified'}

${stageGuidance[stage]}

Return ONLY a JSON object with this structure:
{
    "questions": ["question 1", "question 2", ...],
    "risks": ["risk 1", "risk 2", ...],
    "actions": ["action 1", "action 2", ...]
}`;

        try {
            const response = await this.chat([
                { role: 'system', content: 'You are a product planning expert. Provide stage-appropriate guidance. Always respond with valid JSON only, no markdown formatting.' },
                { role: 'user', content: prompt }
            ], { model, temperature: 0.6, maxTokens: 2000 });

            if (response.success) {
                const suggestions = this.parseAIJSON(response.content);
                return { success: true, suggestions };
            }
            return { success: false, error: 'Failed to generate suggestions' };
        } catch (error) {
            console.error('Stage suggestions error:', error);
            return { success: false, error: error.message };
        }
    }
};
