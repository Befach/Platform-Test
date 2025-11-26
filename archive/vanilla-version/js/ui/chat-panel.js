/**
 * Chat Panel Manager - AI conversation interface
 *
 * Handles all chat-related functionality including:
 * - AI conversation streaming
 * - Tool calling (search, roadmap editing)
 * - Message formatting (markdown, tables, code)
 * - UI interactions (resize, expand/collapse)
 * - Search integration (Tavily API)
 *
 * This module requires:
 * - app object with state (apiKey, features, memory, etc.)
 * - modalManager for confirmations
 * - DOM elements: #chatPanel, #chatInput, #chatMessages, etc.
 */

const chatPanel = {
    /**
     * Toggle chat panel visibility
     */
    toggleChat() {
        const panel = document.getElementById('chatPanel');
        panel.classList.toggle('active');
    },

    /**
     * Main AI conversation method
     * Handles streaming responses, tool calling, and context management
     *
     * @param {Object} app - Main app object with state and methods
     */
    async sendMessage(app) {
        const input = document.getElementById('chatInput');
        const message = input.value.trim();

        if (!message) return;

        if (!app.apiKey) {
            await modalManager.showAlert({
                title: 'API key required',
                message: 'Please enter your OpenRouter API key in settings first!'
            });
            return;
        }

        // Add user message to UI
        this.addChatMessage(message, 'user', null, app);
        app.conversationHistory.push({ role: 'user', content: message });
        app.messageCount++;
        this.updateCounters(app);

        // Clear input
        input.value = '';
        input.style.height = 'auto';

        // Show loading message with proper spinner
        const loadingId = 'loading-' + Date.now();
        this.addChatMessage('⏳ Thinking...', 'ai', loadingId, app);

        try {
            // Build dynamic system prompt with context
            let systemPrompt = '';
            systemPrompt += `🎯 PLATFORM VISION:\n`;
            systemPrompt += `You are helping build a comprehensive trade platform roadmap manager. This tool helps users plan, organize, and track the development of complex trading systems with multiple features, timeline management, and intelligent linking.\n\n`;

            systemPrompt += `📋 CURRENT ROADMAP CONTEXT:\n`;
            systemPrompt += this.formatFeaturesForContext(app);

            if (app.customInstructions && app.customInstructions.trim()) {
                systemPrompt += `\n📝 CUSTOM INSTRUCTIONS:\n${app.customInstructions}\n\n`;
            }

            if (app.memory.length > 0) {
                systemPrompt += `\n🧠 MEMORY (Important information from previous conversations):\n`;
                app.memory.forEach((item, index) => {
                    systemPrompt += `${index + 1}. ${item.content}\n`;
                });
                systemPrompt += '\n';
            }

            systemPrompt += `Always be helpful, clear, and concise. When making suggestions about the roadmap, consider the current context and existing features.`;

            // Get available AI tools
            const tools = this.getAITools();
            const availableTools = tools.filter(tool => {
                if (tool.function.name === 'search_internet') {
                    return !!app.tavilyApiKey;
                }
                return app.aiEditingEnabled;
            });

            // Build messages array with system prompt
            const messages = [
                { role: 'system', content: systemPrompt },
                ...app.conversationHistory
            ];

            // Stream response from OpenRouter
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
                    messages: messages,
                    stream: true,
                    tools: availableTools.length > 0 ? availableTools : undefined
                })
            });

            if (!response.ok) {
                throw new Error(`API request failed: ${response.statusText}`);
            }

            // Process streaming response
            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let buffer = '';
            let fullContent = '';
            let toolCalls = [];
            let toolCallBuffer = {}; // Store tool call chunks by index
            let isFirstChunk = true;

            // Create streaming message element
            const streamingId = 'streaming-' + Date.now();
            document.getElementById(loadingId)?.remove();
            this.addChatMessage('', 'ai', streamingId, app);
            const streamingElement = document.getElementById(streamingId);

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split('\n');
                buffer = lines.pop();

                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        const data = line.slice(6);
                        if (data === '[DONE]') continue;

                        try {
                            const json = JSON.parse(data);
                            const delta = json.choices?.[0]?.delta;

                            // Handle content streaming
                            if (delta?.content) {
                                fullContent += delta.content;
                                if (streamingElement) {
                                    const formatted = this.formatMessage(fullContent);
                                    const safe = this.sanitizeHtml(formatted) || '';
                                    if (safe) {
                                        streamingElement.innerHTML = safe;
                                    } else {
                                        streamingElement.textContent = fullContent;
                                    }

                                    // Auto-scroll
                                    const messagesContainer = document.getElementById('chatMessages');
                                    messagesContainer.scrollTop = messagesContainer.scrollHeight;
                                }
                            }

                            // Handle tool call streaming
                            if (delta?.tool_calls) {
                                delta.tool_calls.forEach(tc => {
                                    const index = tc.index;
                                    if (!toolCallBuffer[index]) {
                                        toolCallBuffer[index] = {
                                            id: '',
                                            type: 'function',
                                            function: {
                                                name: '',
                                                arguments: ''
                                            }
                                        };
                                    }

                                    if (tc.id) toolCallBuffer[index].id = tc.id;
                                    if (tc.function?.name) toolCallBuffer[index].function.name = tc.function.name;
                                    if (tc.function?.arguments) toolCallBuffer[index].function.arguments += tc.function.arguments;
                                });
                            }
                        } catch (e) {
                            console.error('Error parsing SSE data:', e);
                        }
                    }
                }
            }

            // Add expand/collapse for long messages if needed
            if (streamingElement) {
                // Force a reflow to ensure accurate height measurement
                streamingElement.offsetHeight;

                const hasTable = streamingElement.querySelector('table');
                const isLongContent = streamingElement.scrollHeight > 400;

                if (hasTable || isLongContent) {
                    streamingElement.classList.add('expandable', 'collapsed');
                    const expandBtn = document.createElement('button');
                    expandBtn.className = 'message-expand-btn';
                    expandBtn.textContent = 'Expand';
                    expandBtn.onclick = () => this.toggleMessageExpand(streamingElement, expandBtn);
                    streamingElement.appendChild(expandBtn);
                }

                // Final scroll to ensure message is visible
                setTimeout(() => {
                    const messagesContainer = document.getElementById('chatMessages');
                    messagesContainer.scrollTop = messagesContainer.scrollHeight;
                }, 100);
            }

            // Add assistant response to conversation history
            if (fullContent) {
                app.conversationHistory.push({
                    role: 'assistant',
                    content: fullContent
                });
            }

            // Process tool calls
            toolCalls = Object.values(toolCallBuffer).filter(tc => tc.id && tc.function.name);

            if (toolCalls.length > 0) {
                const editingTools = [];
                const readOnlyTools = [];

                // Separate read-only (search) from editing tools
                for (const toolCall of toolCalls) {
                    const functionName = toolCall.function.name;
                    let functionArgs = {};

                    try {
                        functionArgs = JSON.parse(toolCall.function.arguments);
                    } catch (e) {
                        console.error('Error parsing tool arguments:', e);
                        continue;
                    }

                    if (functionName === 'search_internet') {
                        readOnlyTools.push({ toolCall, functionName, functionArgs });
                    } else {
                        editingTools.push({ toolCall, functionName, functionArgs });
                    }
                }

                // Execute read-only tools immediately (search)
                if (readOnlyTools.length > 0) {
                    if (readOnlyTools.length === 1) {
                        // Single search - display immediately
                        await this.executeSearchInternet(readOnlyTools[0].functionArgs, app);
                    } else {
                        // Multiple searches - batch them
                        const searchPromises = readOnlyTools.map(tool =>
                            this.executeSearchInternetSilent(tool.functionArgs, app)
                        );
                        const searchResults = await Promise.all(searchPromises);
                        this.displayBatchedSearchResults(searchResults, app);
                    }
                }

                // Queue editing tools for user approval
                for (const tool of editingTools) {
                    app.pendingAIActions.push({
                        actionType: tool.functionName,
                        actionData: tool.functionArgs,
                        reason: tool.functionArgs.reason || 'No reason provided'
                    });
                }

                // Show approval UI for editing tools
                if (editingTools.length > 0) {
                    app.renderPendingAIActions();
                }
            }

            app.saveData();
            app.updateCounters();

        } catch (error) {
            console.error('Chat error:', error);
            document.getElementById(loadingId)?.remove();
            this.addChatMessage(`❌ Error: ${error.message}`, 'ai', null, app);
        }
    },

    /**
     * Add a message to the chat UI
     *
     * @param {string} text - Message text (may contain HTML if sender is 'ai')
     * @param {string} sender - 'user' or 'ai'
     * @param {string|null} id - Optional DOM ID for the message element
     * @param {Object} app - Main app object
     */
    addChatMessage(text, sender, id = null, app) {
        const messagesContainer = document.getElementById('chatMessages');
        const messageDiv = document.createElement('div');
        messageDiv.className = `chat-message ${sender}`;
        if (id) messageDiv.id = id;

        // Format AI messages, keep user messages as-is
        if (sender === 'ai' && text.trim() !== '') {
            const formatted = this.formatMessage(text);
            const safe = this.sanitizeHtml(formatted) || '';
            if (safe) {
                messageDiv.innerHTML = safe;
            } else {
                messageDiv.textContent = text;
            }
        } else {
            messageDiv.textContent = text;
        }

        messagesContainer.appendChild(messageDiv);

        // Auto-scroll to show new message
        messagesContainer.scrollTop = messagesContainer.scrollHeight;

        // Add expand/collapse for long messages (check after scroll to ensure proper height)
        if (sender === 'ai' && text.trim() !== '') {
            // Use requestAnimationFrame to ensure layout is complete
            requestAnimationFrame(() => {
                const hasTable = messageDiv.querySelector('table');
                const isLongContent = messageDiv.scrollHeight > 400;

                if (hasTable || isLongContent) {
                    messageDiv.classList.add('expandable', 'collapsed');
                    const expandBtn = document.createElement('button');
                    expandBtn.className = 'message-expand-btn';
                    expandBtn.textContent = 'Expand';
                    expandBtn.onclick = () => this.toggleMessageExpand(messageDiv, expandBtn);
                    messageDiv.appendChild(expandBtn);

                    // Scroll again after adding button to ensure it's visible
                    messagesContainer.scrollTop = messagesContainer.scrollHeight;
                }
            });
        }
    },

    /**
     * Toggle expand/collapse for long messages
     *
     * @param {HTMLElement} messageDiv - The message container element
     * @param {HTMLElement} button - The expand/collapse button
     */
    toggleMessageExpand(messageDiv, button) {
        const isCollapsed = messageDiv.classList.contains('collapsed');

        if (isCollapsed) {
            // Expanding: remove collapsed class from message, add expanded class to button
            messageDiv.classList.remove('collapsed');
            button.classList.add('expanded');
            button.textContent = 'Collapse';
        } else {
            // Collapsing: add collapsed class to message, remove expanded class from button
            messageDiv.classList.add('collapsed');
            button.classList.remove('expanded');
            button.textContent = 'Expand';

            // Smooth scroll to show the collapsed message
            messageDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
    },

    /**
     * Toggle visibility of search result sources
     *
     * @param {HTMLElement} button - The toggle button element
     */
    toggleSources(button) {
        const sourcesContainer = button.nextElementSibling;
        const isHidden = sourcesContainer.style.display === 'none' || !sourcesContainer.style.display;
        sourcesContainer.style.display = isHidden ? 'block' : 'none';
        button.textContent = isHidden ? 'Hide sources' : button.textContent.replace('Hide', 'View');
    },

    /**
     * Format roadmap features for AI context
     * Creates a structured summary of current features for the system prompt
     *
     * @param {Object} app - Main app object
     * @returns {string} Formatted feature context
     */
    formatFeaturesForContext(app) {
        if (!app.features || app.features.length === 0) {
            return 'No features in roadmap yet.\n\n';
        }

        let context = `Current Roadmap (${app.features.length} features):\n\n`;

        app.features.forEach((feature, index) => {
            context += `${index + 1}. ${feature.name} (${feature.type})\n`;
            if (feature.purpose) {
                context += `   Purpose: ${feature.purpose}\n`;
            }
            if (feature.status) {
                context += `   Status: ${feature.status}\n`;
            }
            if (feature.timelineItems && feature.timelineItems.length > 0) {
                const mvpItems = feature.timelineItems.filter(t => t.timeline === 'MVP');
                const shortItems = feature.timelineItems.filter(t => t.timeline === 'SHORT');
                const longItems = feature.timelineItems.filter(t => t.timeline === 'LONG');

                if (mvpItems.length > 0 || shortItems.length > 0 || longItems.length > 0) {
                    context += `   Timeline: `;
                    const parts = [];
                    if (mvpItems.length > 0) parts.push(`${mvpItems.length} MVP`);
                    if (shortItems.length > 0) parts.push(`${shortItems.length} SHORT`);
                    if (longItems.length > 0) parts.push(`${longItems.length} LONG`);
                    context += parts.join(', ') + '\n';
                }
            }
            context += '\n';
        });

        return context;
    },

    /**
     * Update message and memory counters in UI
     *
     * @param {Object} app - Main app object
     */
    updateCounters(app) {
        document.getElementById('messageCounter').textContent = app.messageCount;
        document.getElementById('memoryCounter').textContent = app.memory.length;
        this.updateMemoryContextIndicator(app);
    },

    /**
     * Update memory context indicator badge
     *
     * @param {Object} app - Main app object
     */
    updateMemoryContextIndicator(app) {
        const indicator = document.getElementById('memoryContextIndicator');
        const text = document.getElementById('memoryContextText');
        if (!indicator || !text) return;

        if (app.memory.length === 0) {
            text.textContent = 'No memory items • Click to add';
            indicator.classList.remove('has-memory');
            indicator.title = 'Click to add memory items that persist across conversations';
        } else {
            text.textContent = `${app.memory.length} memory item${app.memory.length !== 1 ? 's' : ''} included in context`;
            indicator.classList.add('has-memory');
            indicator.title = `Click to manage ${app.memory.length} memory item${app.memory.length !== 1 ? 's' : ''}`;
        }
    },

    /**
     * Start a new conversation (clear chat, keep memory)
     *
     * @param {Object} app - Main app object
     */
    async compactConversation(app) {
        const ok = await modalManager.showConfirm({
            title: 'Start a new conversation?',
            message: 'Current chat will be cleared but memory will be preserved.',
            confirmText: 'Start new',
            cancelText: 'Cancel'
        });
        if (!ok) return;

        app.conversationHistory = [];
        app.messageCount = 0;
        app.lastAnalysisCount = 0;
        document.getElementById('contextWarning')?.classList.add('hidden');
        const messagesContainer = document.getElementById('chatMessages');
        messagesContainer.innerHTML = `
            <div class="chat-message ai">
                👋 New conversation started! Your memory and custom instructions are preserved.
            </div>
        `;
    },

    /**
     * Set up chat panel resize functionality
     * Allows dragging the left edge to resize the panel width
     */
    setupChatPanelResize() {
        const resizer = document.getElementById('chatPanelResizer');
        const panel = document.getElementById('chatPanel');
        if (!resizer || !panel) return;

        let isResizing = false;
        let startX = 0;
        let startWidth = 0;

        const startResize = (e) => {
            isResizing = true;
            startX = e.clientX;
            startWidth = panel.offsetWidth;
            resizer.classList.add('dragging');
            panel.style.transition = 'none';
            document.body.style.cursor = 'ew-resize';
            document.body.style.userSelect = 'none';
            e.preventDefault();
            e.stopPropagation();
        };

        const doResize = (e) => {
            if (!isResizing) return;
            const diff = startX - e.clientX; // Reverse because we're resizing from left
            const newWidth = Math.max(300, Math.min(window.innerWidth * 0.9, startWidth + diff));
            panel.style.width = newWidth + 'px';
            e.preventDefault();
        };

        const stopResize = () => {
            if (isResizing) {
                isResizing = false;
                resizer.classList.remove('dragging');
                panel.style.transition = '';
                document.body.style.cursor = '';
                document.body.style.userSelect = '';
            }
        };

        resizer.addEventListener('mousedown', startResize);
        document.addEventListener('mousemove', doResize);
        document.addEventListener('mouseup', stopResize);

        // Also handle mouseleave to stop resize if mouse leaves window
        document.addEventListener('mouseleave', stopResize);
    },

    /**
     * Format message text with markdown-like syntax
     * Converts markdown to HTML for display in chat
     *
     * @param {string} text - Raw message text
     * @returns {string} HTML-formatted text
     */
    formatMessage(text) {
        let formatted = text;

        // Tables (must be processed before other formatting)
        formatted = this.formatTables(formatted);

        // Code blocks (```code```)
        formatted = formatted.replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>');

        // Inline code (`code`)
        formatted = formatted.replace(/`([^`]+)`/g, '<code>$1</code>');

        // Bold (**text** or __text__)
        formatted = formatted.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
        formatted = formatted.replace(/__([^_]+)__/g, '<strong>$1</strong>');

        // Italic (*text* or _text_)
        formatted = formatted.replace(/\*([^*]+)\*/g, '<em>$1</em>');
        formatted = formatted.replace(/_([^_]+)_/g, '<em>$1</em>');

        // Headers (### Header)
        formatted = formatted.replace(/^### (.+)$/gm, '<h3>$1</h3>');
        formatted = formatted.replace(/^## (.+)$/gm, '<h2>$1</h2>');
        formatted = formatted.replace(/^# (.+)$/gm, '<h1>$1</h1>');

        // Bullet points (- item or * item)
        const lines = formatted.split('\n');
        let inList = false;
        let result = [];

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const trimmed = line.trim();

            if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
                if (!inList) {
                    result.push('<ul>');
                    inList = true;
                }
                const content = trimmed.substring(2);
                result.push(`<li>${content}</li>`);
            } else if (/^\d+\.\s/.test(trimmed)) {
                // Numbered lists
                if (!inList) {
                    result.push('<ol>');
                    inList = true;
                }
                const content = trimmed.replace(/^\d+\.\s/, '');
                result.push(`<li>${content}</li>`);
            } else {
                if (inList) {
                    result.push('</ul>');
                    inList = false;
                }
                result.push(line);
            }
        }

        if (inList) {
            result.push('</ul>');
        }

        formatted = result.join('\n');

        // Line breaks
        formatted = formatted.replace(/\n/g, '<br>');

        return formatted;
    },

    /**
     * Parse and convert markdown tables to HTML
     *
     * @param {string} text - Text containing markdown tables
     * @returns {string} Text with tables converted to HTML
     */
    formatTables(text) {
        // Detect and convert markdown tables to HTML
        const lines = text.split('\n');
        let result = [];
        let inTable = false;
        let tableRows = [];

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();

            // Check if this line is a table row (contains | characters)
            if (line.includes('|') && line.split('|').length > 2) {
                const cells = line.split('|').map(c => c.trim()).filter(c => c);

                // Skip separator rows (like |---|---|)
                if (cells.every(c => /^[-:]+$/.test(c))) {
                    continue;
                }

                if (!inTable) {
                    inTable = true;
                    tableRows = [];
                }
                tableRows.push(cells);
            } else {
                // Not a table row
                if (inTable) {
                    // End of table - convert to HTML
                    if (tableRows.length > 0) {
                        result.push('<table class="ai-table">');

                        // First row is header
                        result.push('<thead><tr>');
                        tableRows[0].forEach(cell => {
                            result.push(`<th>${cell}</th>`);
                        });
                        result.push('</tr></thead>');

                        // Remaining rows are body
                        if (tableRows.length > 1) {
                            result.push('<tbody>');
                            for (let j = 1; j < tableRows.length; j++) {
                                result.push('<tr>');
                                tableRows[j].forEach(cell => {
                                    result.push(`<td>${cell}</td>`);
                                });
                                result.push('</tr>');
                            }
                            result.push('</tbody>');
                        }

                        result.push('</table>');
                    }
                    inTable = false;
                    tableRows = [];
                }
                result.push(line);
            }
        }

        // Handle table at end of text
        if (inTable && tableRows.length > 0) {
            result.push('<table class="ai-table">');
            result.push('<thead><tr>');
            tableRows[0].forEach(cell => {
                result.push(`<th>${cell}</th>`);
            });
            result.push('</tr></thead>');

            if (tableRows.length > 1) {
                result.push('<tbody>');
                for (let j = 1; j < tableRows.length; j++) {
                    result.push('<tr>');
                    tableRows[j].forEach(cell => {
                        result.push(`<td>${cell}</td>`);
                    });
                    result.push('</tr>');
                }
                result.push('</tbody>');
            }
            result.push('</table>');
        }

        return result.join('\n');
    },

    /**
     * Sanitize HTML to prevent XSS attacks
     * Strips dangerous tags and attributes while preserving safe formatting
     *
     * @param {string} html - HTML string to sanitize
     * @returns {string} Sanitized HTML
     */
    sanitizeHtml(html) {
        if (!html) return '';

        // Create a temporary div to parse HTML
        const temp = document.createElement('div');
        temp.innerHTML = html;

        // Remove script tags and event handlers
        const scripts = temp.querySelectorAll('script');
        scripts.forEach(s => s.remove());

        // Remove dangerous attributes
        const allElements = temp.querySelectorAll('*');
        allElements.forEach(el => {
            // Remove event handler attributes
            Array.from(el.attributes).forEach(attr => {
                if (attr.name.startsWith('on')) {
                    el.removeAttribute(attr.name);
                }
            });

            // Remove javascript: URLs
            if (el.hasAttribute('href') && el.getAttribute('href').toLowerCase().startsWith('javascript:')) {
                el.removeAttribute('href');
            }
            if (el.hasAttribute('src') && el.getAttribute('src').toLowerCase().startsWith('javascript:')) {
                el.removeAttribute('src');
            }
        });

        return temp.innerHTML;
    },

    /**
     * Execute internet search via Tavily API and display results
     * Single search with immediate display
     *
     * @param {Object} actionData - Search query data { query: string }
     * @param {Object} app - Main app object
     * @returns {Object} Search result summary
     */
    async executeSearchInternet(actionData, app) {
        if (!app.tavilyApiKey) {
            throw new Error('Tavily API key not configured. Please add your Tavily API key in settings.');
        }

        if (!app.apiKey) {
            throw new Error('OpenRouter API key required for synthesizing search results.');
        }

        try {
            // Step 1: Execute search
            const response = await fetch('https://api.tavily.com/search', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    api_key: app.tavilyApiKey,
                    query: actionData.query,
                    search_depth: 'advanced',
                    max_results: 10,
                    include_answer: true,
                    include_raw_content: true
                })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || `Tavily API error: ${response.statusText}`);
            }

            const searchData = await response.json();

            if (!searchData.results || searchData.results.length === 0) {
                this.addChatMessage('🔍 No search results found for your query.', 'ai', null, app);
                return {
                    success: true,
                    query: actionData.query,
                    resultsCount: 0
                };
            }

            // Step 2: Synthesize answer using AI
            // Add feature context if in enhancement mode
            let contextualInfo = '';
            if (app.aiFeatureEnhancementMode && app.currentFeatureId) {
                const feature = app.features.find(f => f.id === app.currentFeatureId);
                if (feature) {
                    contextualInfo = `\n\nIMPORTANT CONTEXT - Answer specifically in relation to this feature:
Feature Name: ${feature.name}
Feature Type: ${feature.type}
Purpose: ${feature.purpose || 'Not specified'}
Current Status: ${feature.executionSteps ? 'Has execution steps' : 'Needs execution steps'}, ${feature.resources ? 'Has resources' : 'Needs resources'}, ${feature.planning ? 'Has planning' : 'Needs planning'}

Your answer should be tailored to help enhance THIS specific feature with relevant, actionable information.\n`;
                }
            }

            const synthesisPrompt = `Based on the following search results, provide a comprehensive and well-structured answer to the user's question: "${actionData.query}"${contextualInfo}

Search Results:
${searchData.results.map((result, index) => `
[${index + 1}] ${result.title}
URL: ${result.url}
Content: ${result.content || 'No content available'}
`).join('\n\n')}

Please synthesize this information into a clear, informative answer that directly addresses the user's question. Be thorough but concise.`;

            const synthesisResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
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
                        {
                            role: 'system',
                            content: 'You are a helpful assistant that synthesizes search results into clear, comprehensive answers. Focus on providing accurate, well-structured information based on the search results provided.'
                        },
                        { role: 'user', content: synthesisPrompt }
                    ],
                    temperature: 0.7
                })
            });

            if (!synthesisResponse.ok) {
                throw new Error(`Failed to synthesize answer: ${synthesisResponse.statusText}`);
            }

            const synthesisData = await synthesisResponse.json();
            const synthesizedAnswer = synthesisData.choices[0].message.content;

            // Step 3: Format and display with collapsible sources
            const sourcesCount = searchData.results.length;

            // Escape HTML in source data
            const escapeHtml = (text) => {
                const div = document.createElement('div');
                div.textContent = text;
                return div.innerHTML;
            };

            const sourcesHtml = searchData.results.map((result, index) => {
                const title = escapeHtml(result.title || 'Untitled');
                const url = escapeHtml(result.url);
                // URL for href should be properly encoded
                const urlHref = result.url.replace(/"/g, '&quot;');
                return `
                    <div class="source-item">
                        <div class="source-title">${title}</div>
                        <a href="${urlHref}" target="_blank" rel="noopener noreferrer" class="source-url">${url}</a>
                    </div>
                `;
            }).join('');

            const formattedAnswer = this.formatMessage(synthesizedAnswer);
            const searchResultsHtml = `
                <div class="search-synthesis">
                    <div class="ai-answer">${formattedAnswer}</div>
                    <div class="search-sources">
                        <button class="sources-toggle" onclick="chatPanel.toggleSources(this)">
                            View ${sourcesCount} source${sourcesCount !== 1 ? 's' : ''}
                        </button>
                        <div class="sources-list">
                            ${sourcesHtml}
                        </div>
                    </div>
                </div>
            `;

            // Add to chat with HTML (we control the HTML structure, so safe to set directly)
            const messagesContainer = document.getElementById('chatMessages');
            const messageDiv = document.createElement('div');
            messageDiv.className = 'chat-message ai';
            // Set innerHTML directly since we're generating safe HTML ourselves
            messageDiv.innerHTML = searchResultsHtml;
            messagesContainer.appendChild(messageDiv);
            messagesContainer.scrollTop = messagesContainer.scrollHeight;

            return {
                success: true,
                query: actionData.query,
                resultsCount: sourcesCount,
                synthesizedAnswer: synthesizedAnswer
            };
        } catch (error) {
            console.error('Search error:', error);
            throw error;
        }
    },

    /**
     * Silent version of search for batching multiple searches
     * Returns data without displaying to UI
     *
     * @param {Object} actionData - Search query data { query: string }
     * @param {Object} app - Main app object
     * @returns {Object} Search result data
     */
    async executeSearchInternetSilent(actionData, app) {
        if (!app.tavilyApiKey) {
            throw new Error('Tavily API key not configured.');
        }

        if (!app.apiKey) {
            throw new Error('OpenRouter API key required for synthesizing search results.');
        }

        try {
            // Step 1: Execute search
            const response = await fetch('https://api.tavily.com/search', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    api_key: app.tavilyApiKey,
                    query: actionData.query,
                    search_depth: 'advanced',
                    max_results: 10,
                    include_answer: true,
                    include_raw_content: true
                })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || `Tavily API error: ${response.statusText}`);
            }

            const searchData = await response.json();

            if (!searchData.results || searchData.results.length === 0) {
                return {
                    success: true,
                    query: actionData.query,
                    resultsCount: 0,
                    results: [],
                    synthesizedAnswer: 'No search results found for your query.'
                };
            }

            // Step 2: Synthesize answer using AI
            // Add feature context if in enhancement mode
            let contextualInfo = '';
            if (app.aiFeatureEnhancementMode && app.currentFeatureId) {
                const feature = app.features.find(f => f.id === app.currentFeatureId);
                if (feature) {
                    contextualInfo = `\n\nIMPORTANT CONTEXT - Answer specifically in relation to this feature:
Feature Name: ${feature.name}
Feature Type: ${feature.type}
Purpose: ${feature.purpose || 'Not specified'}
Current Status: ${feature.executionSteps ? 'Has execution steps' : 'Needs execution steps'}, ${feature.resources ? 'Has resources' : 'Needs resources'}, ${feature.planning ? 'Has planning' : 'Needs planning'}

Your answer should be tailored to help enhance THIS specific feature with relevant, actionable information.\n`;
                }
            }

            const synthesisPrompt = `Based on the following search results, provide a comprehensive and well-structured answer to the user's question: "${actionData.query}"${contextualInfo}

Search Results:
${searchData.results.map((result, index) => `
[${index + 1}] ${result.title}
URL: ${result.url}
Content: ${result.content || 'No content available'}
`).join('\n\n')}

Please synthesize this information into a clear, informative answer that directly addresses the user's question. Be thorough but concise.`;

            const synthesisResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
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
                        {
                            role: 'system',
                            content: 'You are a helpful assistant that synthesizes search results into clear, comprehensive answers. Focus on providing accurate, well-structured information based on the search results provided.'
                        },
                        { role: 'user', content: synthesisPrompt }
                    ],
                    temperature: 0.7
                })
            });

            if (!synthesisResponse.ok) {
                throw new Error(`Failed to synthesize answer: ${synthesisResponse.statusText}`);
            }

            const synthesisData = await synthesisResponse.json();
            const synthesizedAnswer = synthesisData.choices[0].message.content;

            // Return data without displaying
            return {
                success: true,
                query: actionData.query,
                resultsCount: searchData.results.length,
                results: searchData.results,
                synthesizedAnswer: synthesizedAnswer
            };
        } catch (error) {
            console.error('Silent search error:', error);
            return {
                success: false,
                query: actionData.query,
                error: error.message,
                resultsCount: 0,
                results: [],
                synthesizedAnswer: `Error: ${error.message}`
            };
        }
    },

    /**
     * Display multiple search results in one combined message
     * Used when batching multiple search queries
     *
     * @param {Array} searchResults - Array of search result objects
     * @param {Object} app - Main app object
     */
    displayBatchedSearchResults(searchResults, app) {
        if (!searchResults || searchResults.length === 0) {
            return;
        }

        const messagesContainer = document.getElementById('chatMessages');
        const messageDiv = document.createElement('div');
        messageDiv.className = 'chat-message ai';

        // Escape HTML helper
        const escapeHtml = (text) => {
            const div = document.createElement('div');
            div.textContent = text;
            return div.innerHTML;
        };

        // Build combined display
        let combinedHtml = '<div class="batched-search-results">';

        // Header showing number of searches
        const successfulSearches = searchResults.filter(r => r.success && r.resultsCount > 0);
        if (successfulSearches.length > 1) {
            combinedHtml += `<div class="batch-search-header">🔍 Searched ${successfulSearches.length} queries and found ${successfulSearches.reduce((sum, r) => sum + r.resultsCount, 0)} total results</div>`;
        }

        // Display each search result
        successfulSearches.forEach((result, index) => {
            const queryLabel = successfulSearches.length > 1 ? `<div class="search-query-label">Query ${index + 1}: "${escapeHtml(result.query)}"</div>` : '';

            // Format the synthesized answer
            const formattedAnswer = this.formatMessage(result.synthesizedAnswer);

            // Build sources HTML
            const sourcesHtml = result.results.map((source, idx) => {
                const title = escapeHtml(source.title || 'Untitled');
                const url = escapeHtml(source.url);
                const urlHref = source.url.replace(/"/g, '&quot;');
                return `
                    <div class="source-item">
                        <div class="source-title">${title}</div>
                        <a href="${urlHref}" target="_blank" rel="noopener noreferrer" class="source-url">${url}</a>
                    </div>
                `;
            }).join('');

            combinedHtml += `
                <div class="search-result-section">
                    ${queryLabel}
                    <div class="search-synthesis">
                        <div class="ai-answer">${formattedAnswer}</div>
                        <div class="search-sources">
                            <button class="sources-toggle" onclick="chatPanel.toggleSources(this)">
                                View ${result.resultsCount} source${result.resultsCount !== 1 ? 's' : ''}
                            </button>
                            <div class="sources-list">
                                ${sourcesHtml}
                            </div>
                        </div>
                    </div>
                </div>
            `;
        });

        // Show errors if any
        const failedSearches = searchResults.filter(r => !r.success || r.resultsCount === 0);
        if (failedSearches.length > 0) {
            combinedHtml += '<div class="failed-searches">';
            failedSearches.forEach(result => {
                combinedHtml += `<div class="search-error">⚠️ No results for: "${escapeHtml(result.query)}"</div>`;
            });
            combinedHtml += '</div>';
        }

        combinedHtml += '</div>';

        messageDiv.innerHTML = combinedHtml;
        messagesContainer.appendChild(messageDiv);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    },

    /**
     * Get AI tool definitions for function calling
     * Defines all available tools the AI can invoke
     *
     * @returns {Array} Array of tool definition objects
     */
    getAITools() {
        return [
            {
                type: "function",
                function: {
                    name: "search_internet",
                    description: "Search the internet for information using Tavily API. Use this when you need current information, research data, or answers from the web.",
                    parameters: {
                        type: "object",
                        properties: {
                            query: {
                                type: "string",
                                description: "The search query to find information about"
                            }
                        },
                        required: ["query"]
                    }
                }
            },
            {
                type: "function",
                function: {
                    name: "update_feature",
                    description: "Update an existing feature's basic information (name, type, purpose, status, or description)",
                    parameters: {
                        type: "object",
                        properties: {
                            featureId: {
                                type: "string",
                                description: "The ID of the feature to update"
                            },
                            updates: {
                                type: "object",
                                description: "Fields to update",
                                properties: {
                                    name: { type: "string", description: "New feature name" },
                                    type: { type: "string", description: "New feature type" },
                                    purpose: { type: "string", description: "New purpose description" },
                                    status: { type: "string", description: "New status" },
                                    description: { type: "string", description: "New description" }
                                }
                            },
                            reason: {
                                type: "string",
                                description: "Explanation of why this update is being suggested"
                            }
                        },
                        required: ["featureId", "updates", "reason"]
                    }
                }
            },
            {
                type: "function",
                function: {
                    name: "update_timeline_item",
                    description: "Update an existing timeline item within a feature",
                    parameters: {
                        type: "object",
                        properties: {
                            featureId: {
                                type: "string",
                                description: "The ID of the feature containing the timeline item"
                            },
                            timelineItemId: {
                                type: "string",
                                description: "The ID of the timeline item to update"
                            },
                            updates: {
                                type: "object",
                                description: "Fields to update",
                                properties: {
                                    name: { type: "string", description: "New item name" },
                                    description: { type: "string", description: "New description" },
                                    timeline: { type: "string", enum: ["MVP", "SHORT", "LONG"], description: "New timeline category" },
                                    difficulty: { type: "string", enum: ["Easy", "Medium", "Hard"], description: "New difficulty level" },
                                    priority: { type: "string", enum: ["High", "Medium", "Low"], description: "New priority" },
                                    categories: {
                                        type: "array",
                                        items: { type: "string" },
                                        description: "New categories array"
                                    }
                                }
                            },
                            reason: {
                                type: "string",
                                description: "Explanation of why this update is being suggested"
                            }
                        },
                        required: ["featureId", "timelineItemId", "updates", "reason"]
                    }
                }
            },
            {
                type: "function",
                function: {
                    name: "create_feature",
                    description: "Create a new feature in the roadmap",
                    parameters: {
                        type: "object",
                        properties: {
                            name: {
                                type: "string",
                                description: "Feature name"
                            },
                            type: {
                                type: "string",
                                description: "Feature type (e.g., Core, Module, Integration)"
                            },
                            purpose: {
                                type: "string",
                                description: "Purpose or description of the feature"
                            },
                            status: {
                                type: "string",
                                description: "Current status (e.g., Planned, In Progress, Completed)"
                            },
                            reason: {
                                type: "string",
                                description: "Why this feature is being suggested"
                            }
                        },
                        required: ["name", "type", "purpose", "reason"]
                    }
                }
            },
            {
                type: "function",
                function: {
                    name: "create_feature_with_research",
                    description: "Create a new feature with comprehensive research, execution steps, resources, and planning. Use this when creating well-researched, detailed features.",
                    parameters: {
                        type: "object",
                        properties: {
                            feature: {
                                type: "object",
                                description: "Basic feature information",
                                properties: {
                                    name: { type: "string" },
                                    type: { type: "string" },
                                    purpose: { type: "string" },
                                    status: { type: "string" }
                                },
                                required: ["name", "type", "purpose"]
                            },
                            executionSteps: {
                                type: "array",
                                description: "Execution steps as timeline items",
                                items: {
                                    type: "object",
                                    properties: {
                                        name: { type: "string" },
                                        description: { type: "string" },
                                        timeline: { type: "string", enum: ["MVP", "SHORT", "LONG"] },
                                        difficulty: { type: "string", enum: ["Easy", "Medium", "Hard"] },
                                        priority: { type: "string", enum: ["High", "Medium", "Low"] },
                                        categories: {
                                            type: "array",
                                            items: { type: "string" }
                                        }
                                    }
                                }
                            },
                            resources: {
                                type: "array",
                                description: "Resource items (documentation, tutorials, APIs)",
                                items: {
                                    type: "object",
                                    properties: {
                                        title: { type: "string" },
                                        url: { type: "string" },
                                        type: { type: "string" },
                                        description: { type: "string" }
                                    }
                                }
                            },
                            planning: {
                                type: "object",
                                description: "Planning information",
                                properties: {
                                    technicalConsiderations: { type: "string" },
                                    alternativeApproaches: { type: "string" },
                                    potentialChallenges: { type: "string" },
                                    successMetrics: {
                                        type: "array",
                                        items: { type: "string" }
                                    },
                                    acceptanceCriteria: {
                                        type: "array",
                                        items: { type: "string" }
                                    }
                                }
                            },
                            reason: {
                                type: "string",
                                description: "Why this feature is being suggested"
                            }
                        },
                        required: ["feature", "reason"]
                    }
                }
            },
            {
                type: "function",
                function: {
                    name: "create_link_suggestion",
                    description: "Suggest a link between two timeline items",
                    parameters: {
                        type: "object",
                        properties: {
                            fromFeatureId: { type: "string" },
                            fromTimelineItemId: { type: "string" },
                            toFeatureId: { type: "string" },
                            toTimelineItemId: { type: "string" },
                            relationshipType: {
                                type: "string",
                                enum: ["dependency", "complements"],
                                description: "Type of relationship"
                            },
                            reason: {
                                type: "string",
                                description: "Why this link makes sense"
                            }
                        },
                        required: ["fromFeatureId", "fromTimelineItemId", "toFeatureId", "toTimelineItemId", "relationshipType", "reason"]
                    }
                }
            },
            {
                type: "function",
                function: {
                    name: "add_timeline_item",
                    description: "Add a new timeline item to a feature",
                    parameters: {
                        type: "object",
                        properties: {
                            featureId: { type: "string" },
                            item: {
                                type: "object",
                                properties: {
                                    name: { type: "string" },
                                    description: { type: "string" },
                                    timeline: { type: "string", enum: ["MVP", "SHORT", "LONG"] },
                                    difficulty: { type: "string", enum: ["Easy", "Medium", "Hard"] },
                                    priority: { type: "string", enum: ["High", "Medium", "Low"] },
                                    categories: {
                                        type: "array",
                                        items: { type: "string" }
                                    }
                                }
                            },
                            reason: { type: "string" }
                        },
                        required: ["featureId", "item", "reason"]
                    }
                }
            },
            {
                type: "function",
                function: {
                    name: "delete_timeline_item",
                    description: "Delete a timeline item from a feature",
                    parameters: {
                        type: "object",
                        properties: {
                            featureId: { type: "string" },
                            timelineItemId: { type: "string" },
                            reason: { type: "string" }
                        },
                        required: ["featureId", "timelineItemId", "reason"]
                    }
                }
            }
        ];
    }
};
