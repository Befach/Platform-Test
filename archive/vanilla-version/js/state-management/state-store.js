/**
 * Centralized State Management Store
 * Redux-like architecture with immutable state updates, middleware support, and real-time synchronization
 */

// Import StateReducers if available
if (typeof StateReducers !== 'undefined') {
    // Use imported StateReducers
} else if (typeof require !== 'undefined') {
    try {
        var StateReducers = require('./state-reducers.js');
    } catch (e) {
        console.warn('StateReducers not found, using built-in reducers');
    }
}

class StateStore {
    constructor(options = {}) {
        this.state = this.getInitialState();
        this.listeners = new Map();
        this.middleware = [];
        this.history = [];
        this.historyIndex = -1;
        this.maxHistorySize = options.maxHistorySize || 50;
        this.enableTimeTravel = options.enableTimeTravel !== false;
        this.batchUpdates = options.batchUpdates !== false;
        this.batchTimeout = null;
        this.batchedUpdates = [];
        this.performanceMetrics = {
            updateCount: 0,
            averageUpdateTime: 0,
            totalUpdateTime: 0,
            lastUpdateTime: 0
        };
        
        // Initialize with default middleware
        this.initializeDefaultMiddleware();
        
        // Setup performance monitoring
        this.setupPerformanceMonitoring();
    }

    /**
     * Get initial state structure
     */
    getInitialState() {
        return {
            // User and authentication state
            auth: {
                user: null,
                token: null,
                isAuthenticated: false,
                permissions: [],
                lastActivity: null
            },
            
            // Application state
            app: {
                isLoading: false,
                error: null,
                notifications: [],
                theme: 'light',
                language: 'en',
                viewport: {
                    width: window.innerWidth,
                    height: window.innerHeight,
                    isMobile: window.innerWidth < 768,
                    isTablet: window.innerWidth >= 768 && window.innerWidth < 1024
                }
            },
            
            // Navigation state
            navigation: {
                currentRoute: '/',
                previousRoute: null,
                breadcrumbs: [],
                navigationHistory: [],
                isNavigating: false
            },
            
            // Data state
            data: {
                features: [],
                workspaces: [],
                connections: [],
                insights: [],
                lastSync: null,
                isSyncing: false,
                syncErrors: []
            },
            
            // UI state
            ui: {
                modals: {
                    active: [],
                    stack: []
                },
                panels: {
                    sidebar: { open: true, collapsed: false },
                    chat: { open: false, minimized: false },
                    details: { open: false, activeTab: null }
                },
                layout: {
                    gridSize: 'medium',
                    viewMode: 'grid',
                    sortBy: 'name',
                    sortOrder: 'asc',
                    filters: {}
                }
            },
            
            // Real-time collaboration state
            collaboration: {
                connectedUsers: [],
                activeSessions: [],
                conflicts: [],
                presence: {
                    user: null,
                    status: 'offline',
                    lastSeen: null
                }
            },
            
            // Performance and analytics state
            analytics: {
                pageViews: 0,
                sessionDuration: 0,
                userActions: [],
                performanceMetrics: {},
                errorTracking: []
            }
        };
    }

    /**
     * Initialize default middleware
     */
    initializeDefaultMiddleware() {
        // Logging middleware
        this.addMiddleware((state, action, next) => {
            console.log(`[StateStore] Action: ${action.type}`, action.payload);
            const startTime = performance.now();
            const result = next(state, action);
            const endTime = performance.now();
            console.log(`[StateStore] Action completed in ${(endTime - startTime).toFixed(2)}ms`);
            return result;
        });

        // Validation middleware
        this.addMiddleware((state, action, next) => {
            if (this.validateAction(action)) {
                return next(state, action);
            } else {
                console.error(`[StateStore] Invalid action: ${action.type}`, action);
                return state;
            }
        });

        // Performance monitoring middleware
        this.addMiddleware((state, action, next) => {
            const startTime = performance.now();
            const result = next(state, action);
            const endTime = performance.now();
            this.updatePerformanceMetrics(action.type, endTime - startTime);
            return result;
        });
    }

    /**
     * Setup performance monitoring
     */
    setupPerformanceMonitoring() {
        // Monitor state update performance
        setInterval(() => {
            if (this.performanceMetrics.updateCount > 0) {
                console.log('[StateStore] Performance Metrics:', {
                    updateCount: this.performanceMetrics.updateCount,
                    averageUpdateTime: this.performanceMetrics.averageUpdateTime.toFixed(2) + 'ms',
                    lastUpdateTime: this.performanceMetrics.lastUpdateTime.toFixed(2) + 'ms'
                });
            }
        }, 30000); // Log every 30 seconds
    }

    /**
     * Add middleware to the store
     */
    addMiddleware(middleware) {
        this.middleware.push(middleware);
    }

    /**
     * Dispatch an action to update state
     */
    dispatch(action) {
        if (this.batchUpdates) {
            return this.batchAction(action);
        } else {
            return this.processAction(action);
        }
    }

    /**
     * Batch actions for performance optimization
     */
    batchAction(action) {
        this.batchedUpdates.push(action);
        
        if (!this.batchTimeout) {
            this.batchTimeout = setTimeout(() => {
                this.processBatchedUpdates();
                this.batchTimeout = null;
            }, 16); // Batch for ~60fps
        }
        
        return action;
    }

    /**
     * Process all batched updates
     */
    processBatchedUpdates() {
        if (this.batchedUpdates.length === 0) return;
        
        const actions = [...this.batchedUpdates];
        this.batchedUpdates = [];
        
        let newState = this.state;
        
        // Process all actions in order
        for (const action of actions) {
            newState = this.processAction(action, newState);
        }
        
        // Update state once for all batched actions
        this.updateState(newState, actions[actions.length - 1]);
    }

    /**
     * Process a single action
     */
    processAction(action, currentState = this.state) {
        if (!this.validateAction(action)) {
            console.error('[StateStore] Invalid action:', action);
            return currentState;
        }

        let newState = currentState;
        
        // Apply middleware chain
        const middlewareChain = this.middleware.slice().reverse();
        let index = 0;
        
        const next = (state, action) => {
            if (index < middlewareChain.length) {
                return middlewareChain[index++](state, action, next);
            } else {
                return this.applyReducer(state, action);
            }
        };
        
        newState = next(newState, action);
        
        // Update state if changed
        if (newState !== currentState) {
            this.updateState(newState, action);
        }
        
        return newState;
    }

    /**
     * Apply reducer to update state
     */
    applyReducer(state, action) {
        // Use StateReducers if available, otherwise fall back to built-in reducers
        if (typeof StateReducers !== 'undefined' && StateReducers.getReducerForAction) {
            const reducer = StateReducers.getReducerForAction(action.type);
            if (reducer) {
                return reducer(state, action);
            }
        }
        
        // Fall back to built-in reducer method
        const reducer = this.getReducer(action.type);
        if (reducer) {
            return reducer(state, action);
        } else {
            console.warn(`[StateStore] No reducer found for action: ${action.type}`);
            return state;
        }
    }

    /**
     * Get reducer for action type (built-in fallback)
     */
    getReducer(actionType) {
        // This method is kept as fallback but reducers are now in StateReducers class
        console.warn(`[StateStore] Using built-in reducer fallback for: ${actionType}`);
        return (state, action) => state; // Default no-op reducer
    }

    /**
     * Update state and notify listeners
     */
    updateState(newState, action) {
        const previousState = this.state;
        this.state = newState;
        
        // Update history if time travel is enabled
        if (this.enableTimeTravel) {
            this.updateHistory(previousState, action);
        }
        
        // Notify all listeners
        this.notifyListeners(previousState, newState, action);
        
        // Update performance metrics
        this.performanceMetrics.lastUpdateTime = performance.now();
        this.performanceMetrics.updateCount++;
    }

    /**
     * Update state history for time travel debugging
     */
    updateHistory(previousState, action) {
        // Remove any future states if we're not at the end
        if (this.historyIndex < this.history.length - 1) {
            this.history = this.history.slice(0, this.historyIndex + 1);
        }
        
        // Add new state to history
        this.history.push({
            state: previousState,
            action: action,
            timestamp: Date.now()
        });
        
        // Limit history size
        if (this.history.length > this.maxHistorySize) {
            this.history.shift();
        } else {
            this.historyIndex++;
        }
    }

    /**
     * Notify all state change listeners
     */
    notifyListeners(previousState, newState, action) {
        this.listeners.forEach((listener, key) => {
            try {
                listener(newState, previousState, action);
            } catch (error) {
                console.error(`[StateStore] Error in listener ${key}:`, error);
            }
        });
    }

    /**
     * Subscribe to state changes
     */
    subscribe(listener, key = `listener_${Date.now()}`) {
        this.listeners.set(key, listener);
        
        // Return unsubscribe function
        return () => {
            this.listeners.delete(key);
        };
    }

    /**
     * Get current state
     */
    getState() {
        return this.state;
    }

    /**
     * Get specific state slice
     */
    getStateSlice(path) {
        return this.getNestedValue(this.state, path);
    }

    /**
     * Get nested value from object using dot notation
     */
    getNestedValue(obj, path) {
        return path.split('.').reduce((current, key) => {
            return current && current[key] !== undefined ? current[key] : null;
        }, obj);
    }

    /**
     * Time travel debugging methods
     */
    canUndo() {
        return this.enableTimeTravel && this.historyIndex > 0;
    }

    canRedo() {
        return this.enableTimeTravel && this.historyIndex < this.history.length - 1;
    }

    undo() {
        if (!this.canUndo()) return false;
        
        this.historyIndex--;
        const historyEntry = this.history[this.historyIndex];
        this.state = historyEntry.state;
        this.notifyListeners(this.state, this.state, { type: 'TIME_TRAVEL_UNDO' });
        
        return true;
    }

    redo() {
        if (!this.canRedo()) return false;
        
        this.historyIndex++;
        const historyEntry = this.history[this.historyIndex];
        this.state = historyEntry.state;
        this.notifyListeners(this.state, this.state, { type: 'TIME_TRAVEL_REDO' });
        
        return true;
    }

    /**
     * Get state history
     */
    getHistory() {
        return this.history.map(entry => ({
            action: entry.action,
            timestamp: entry.timestamp
        }));
    }

    /**
     * Validate action structure
     */
    validateAction(action) {
        return action && 
               typeof action === 'object' && 
               typeof action.type === 'string' && 
               action.type.length > 0;
    }

    /**
     * Update performance metrics
     */
    updatePerformanceMetrics(actionType, duration) {
        this.performanceMetrics.totalUpdateTime += duration;
        this.performanceMetrics.updateCount++;
        this.performanceMetrics.averageUpdateTime = 
            this.performanceMetrics.totalUpdateTime / this.performanceMetrics.updateCount;
    }

    /**
     * Get performance metrics
     */
    getPerformanceMetrics() {
        return { ...this.performanceMetrics };
    }

    /**
     * Reset state to initial
     */
    reset() {
        const previousState = this.state;
        this.state = this.getInitialState();
        this.history = [];
        this.historyIndex = -1;
        this.notifyListeners(previousState, this.state, { type: 'STATE_RESET' });
    }

    /**
     * Destroy store and cleanup
     */
    destroy() {
        this.listeners.clear();
        this.middleware = [];
        this.history = [];
        
        if (this.batchTimeout) {
            clearTimeout(this.batchTimeout);
            this.batchTimeout = null;
        }
        
        this.state = null;
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = StateStore;
} else if (typeof window !== 'undefined') {
    window.StateStore = StateStore;
}