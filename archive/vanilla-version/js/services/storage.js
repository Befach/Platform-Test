// Storage Service - Centralized localStorage management
const storageService = {
    // Storage keys
    KEYS: {
        FEATURES: 'roadmapFeatures',
        WORKSPACES: 'roadmapWorkspaces',
        CURRENT_WORKSPACE: 'currentWorkspaceId',
        OPENROUTER_KEY: 'openrouterApiKey',
        TAVILY_KEY: 'tavilyApiKey',
        EXA_KEY: 'exaApiKey',
        PERPLEXITY_KEY: 'perplexityApiKey',
        MODEL: 'selectedModel',
        CUSTOM_INSTRUCTIONS: 'customInstructions',
        MEMORY: 'aiMemory',
        MEMORY_SUGGESTIONS: 'memorySuggestions',
        LINK_SUGGESTIONS: 'linkSuggestions',
        REJECTED_LINKS: 'rejectedLinks',
        AI_ACTION_LOG: 'aiActionLog',
        UI_STATE: 'uiState',
        THEME: 'theme',
        LAST_ORIGIN: 'lastOrigin'
    },

    // === Feature Storage ===
    saveFeatures(features) {
        try {
            localStorage.setItem(this.KEYS.FEATURES, JSON.stringify(features));
            return true;
        } catch (error) {
            if (error.name === 'QuotaExceededError') {
                console.error('⚠️ localStorage quota exceeded');
                return false;
            }
            throw error;
        }
    },

    loadFeatures() {
        try {
            const stored = localStorage.getItem(this.KEYS.FEATURES);
            return stored ? JSON.parse(stored) : [];
        } catch (error) {
            console.error('Error loading features:', error);
            return [];
        }
    },

    // === Workspace Storage ===
    saveWorkspaces(workspaces) {
        try {
            localStorage.setItem(this.KEYS.WORKSPACES, JSON.stringify(workspaces));
            return true;
        } catch (error) {
            console.error('Error saving workspaces:', error);
            return false;
        }
    },

    loadWorkspaces() {
        try {
            const stored = localStorage.getItem(this.KEYS.WORKSPACES);
            return stored ? JSON.parse(stored) : [];
        } catch (error) {
            console.error('Error loading workspaces:', error);
            return [];
        }
    },

    saveCurrentWorkspace(workspaceId) {
        localStorage.setItem(this.KEYS.CURRENT_WORKSPACE, workspaceId);
    },

    loadCurrentWorkspace() {
        return localStorage.getItem(this.KEYS.CURRENT_WORKSPACE);
    },

    // === API Key Management ===
    saveApiKey(key) {
        localStorage.setItem(this.KEYS.OPENROUTER_KEY, key);
    },

    loadApiKey() {
        return localStorage.getItem(this.KEYS.OPENROUTER_KEY) || '';
    },

    saveTavilyApiKey(key) {
        localStorage.setItem(this.KEYS.TAVILY_KEY, key);
    },

    loadTavilyApiKey() {
        return localStorage.getItem(this.KEYS.TAVILY_KEY) || '';
    },

    saveExaApiKey(key) {
        localStorage.setItem(this.KEYS.EXA_KEY, key);
    },

    loadExaApiKey() {
        return localStorage.getItem(this.KEYS.EXA_KEY) || '';
    },

    savePerplexityApiKey(key) {
        localStorage.setItem(this.KEYS.PERPLEXITY_KEY, key);
    },

    loadPerplexityApiKey() {
        return localStorage.getItem(this.KEYS.PERPLEXITY_KEY) || '';
    },

    // === Model & Configuration ===
    saveModel(model) {
        localStorage.setItem(this.KEYS.MODEL, model);
    },

    loadModel() {
        return localStorage.getItem(this.KEYS.MODEL) || DEFAULT_MODEL;
    },

    saveCustomInstructions(instructions) {
        localStorage.setItem(this.KEYS.CUSTOM_INSTRUCTIONS, instructions);
    },

    loadCustomInstructions() {
        return localStorage.getItem(this.KEYS.CUSTOM_INSTRUCTIONS) || '';
    },

    // === Memory Management ===
    saveMemory(memory) {
        try {
            localStorage.setItem(this.KEYS.MEMORY, JSON.stringify(memory));
            return true;
        } catch (error) {
            console.error('Error saving memory:', error);
            return false;
        }
    },

    loadMemory() {
        try {
            const stored = localStorage.getItem(this.KEYS.MEMORY);
            return stored ? JSON.parse(stored) : [];
        } catch (error) {
            console.error('Error loading memory:', error);
            return [];
        }
    },

    saveMemorySuggestions(suggestions) {
        try {
            localStorage.setItem(this.KEYS.MEMORY_SUGGESTIONS, JSON.stringify(suggestions));
            return true;
        } catch (error) {
            console.error('Error saving memory suggestions:', error);
            return false;
        }
    },

    loadMemorySuggestions() {
        try {
            const stored = localStorage.getItem(this.KEYS.MEMORY_SUGGESTIONS);
            return stored ? JSON.parse(stored) : [];
        } catch (error) {
            console.error('Error loading memory suggestions:', error);
            return [];
        }
    },

    // === Link Suggestions ===
    saveLinkSuggestions(suggestions) {
        try {
            localStorage.setItem(this.KEYS.LINK_SUGGESTIONS, JSON.stringify(suggestions));
            return true;
        } catch (error) {
            console.error('Error saving link suggestions:', error);
            return false;
        }
    },

    loadLinkSuggestions() {
        try {
            const stored = localStorage.getItem(this.KEYS.LINK_SUGGESTIONS);
            if (!stored) return [];

            const suggestions = JSON.parse(stored);
            // Filter out suggestions older than 30 days
            const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
            return suggestions.filter(s => s.timestamp > thirtyDaysAgo);
        } catch (error) {
            console.error('Error loading link suggestions:', error);
            return [];
        }
    },

    saveRejectedLinks(rejectedLinks) {
        try {
            localStorage.setItem(this.KEYS.REJECTED_LINKS, JSON.stringify(rejectedLinks));
            return true;
        } catch (error) {
            console.error('Error saving rejected links:', error);
            return false;
        }
    },

    loadRejectedLinks() {
        try {
            const stored = localStorage.getItem(this.KEYS.REJECTED_LINKS);
            return stored ? JSON.parse(stored) : [];
        } catch (error) {
            console.error('Error loading rejected links:', error);
            return [];
        }
    },

    // === AI Action Log ===
    saveAIActionLog(log) {
        try {
            localStorage.setItem(this.KEYS.AI_ACTION_LOG, JSON.stringify(log));
            return true;
        } catch (error) {
            console.error('Error saving AI action log:', error);
            return false;
        }
    },

    loadAIActionLog() {
        try {
            const stored = localStorage.getItem(this.KEYS.AI_ACTION_LOG);
            return stored ? JSON.parse(stored) : [];
        } catch (error) {
            console.error('Error loading AI action log:', error);
            return [];
        }
    },

    // === UI State ===
    saveUIState(state) {
        try {
            localStorage.setItem(this.KEYS.UI_STATE, JSON.stringify(state));
            return true;
        } catch (error) {
            console.error('Error saving UI state:', error);
            return false;
        }
    },

    loadUIState() {
        try {
            const stored = localStorage.getItem(this.KEYS.UI_STATE);
            return stored ? JSON.parse(stored) : null;
        } catch (error) {
            console.error('Error loading UI state:', error);
            return null;
        }
    },

    // === Theme ===
    saveTheme(theme) {
        localStorage.setItem(this.KEYS.THEME, theme);
    },

    loadTheme() {
        return localStorage.getItem(this.KEYS.THEME) || 'light';
    },

    // === Last Origin (for migration) ===
    saveLastOrigin(origin) {
        localStorage.setItem(this.KEYS.LAST_ORIGIN, origin);
    },

    loadLastOrigin() {
        return localStorage.getItem(this.KEYS.LAST_ORIGIN);
    },

    // === Export/Import ===
    exportAllData() {
        const data = {
            version: '2.0',
            exportDate: new Date().toISOString(),
            workspaces: this.loadWorkspaces(),
            features: this.loadFeatures(),
            currentWorkspaceId: this.loadCurrentWorkspace(),
            settings: {
                model: this.loadModel(),
                customInstructions: this.loadCustomInstructions()
            },
            memory: this.loadMemory(),
            memorySuggestions: this.loadMemorySuggestions(),
            linkSuggestions: this.loadLinkSuggestions(),
            rejectedLinks: this.loadRejectedLinks(),
            aiActionLog: this.loadAIActionLog()
        };
        return data;
    },

    importAllData(data) {
        try {
            // Handle backward compatibility
            if (!data.version) data.version = '1.0';

            // Import workspaces (v2.0+) or create default workspace (v1.0)
            if (data.workspaces && data.workspaces.length > 0) {
                this.saveWorkspaces(data.workspaces);
                if (data.currentWorkspaceId) {
                    this.saveCurrentWorkspace(data.currentWorkspaceId);
                }
            } else if (data.features && data.features.length > 0) {
                // v1.0 data - create default workspace
                const defaultWorkspace = {
                    id: Date.now().toString(),
                    name: 'Imported Project',
                    description: 'Migrated from v1.0 backup',
                    color: '#667eea',
                    icon: '📋',
                    customInstructions: data.customInstructions || '',
                    aiMemory: data.memory || []
                };
                this.saveWorkspaces([defaultWorkspace]);
                this.saveCurrentWorkspace(defaultWorkspace.id);

                // Assign workspace to features
                data.features.forEach(f => f.workspaceId = defaultWorkspace.id);
            }

            // Import features
            if (data.features) {
                this.saveFeatures(data.features);
            }

            // Import settings
            if (data.settings) {
                if (data.settings.model) this.saveModel(data.settings.model);
                if (data.settings.customInstructions) this.saveCustomInstructions(data.settings.customInstructions);
            } else {
                // v1.0 compatibility
                if (data.selectedModel) this.saveModel(data.selectedModel);
                if (data.customInstructions) this.saveCustomInstructions(data.customInstructions);
            }

            // Import memory and suggestions
            if (data.memory) this.saveMemory(data.memory);
            if (data.memorySuggestions) this.saveMemorySuggestions(data.memorySuggestions);
            if (data.linkSuggestions) this.saveLinkSuggestions(data.linkSuggestions);
            if (data.rejectedLinks) this.saveRejectedLinks(data.rejectedLinks);
            if (data.aiActionLog) this.saveAIActionLog(data.aiActionLog);

            return { success: true, version: data.version };
        } catch (error) {
            console.error('Error importing data:', error);
            return { success: false, error: error.message };
        }
    },

    // === Utility ===
    checkQuotaAvailable() {
        try {
            const test = '__storage_test__';
            localStorage.setItem(test, test);
            localStorage.removeItem(test);
            return true;
        } catch (e) {
            return false;
        }
    },

    clearAll() {
        const keys = Object.values(this.KEYS);
        keys.forEach(key => localStorage.removeItem(key));
    }
};
