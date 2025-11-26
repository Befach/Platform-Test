/**
 * Advanced State Features System
 * Provides state history, analytics, monitoring, and advanced debugging capabilities
 */

class AdvancedStateFeatures {
    constructor(stateStore, options = {}) {
        this.stateStore = stateStore;
        this.options = {
            enableHistory: options.enableHistory !== false,
            enableAnalytics: options.enableAnalytics !== false,
            enableMonitoring: options.enableMonitoring !== false,
            enableDebugging: options.enableDebugging !== false,
            maxHistorySize: options.maxHistorySize || 100,
            maxAnalyticsEvents: options.maxAnalyticsEvents || 1000,
            monitoringInterval: options.monitoringInterval || 5000,
            enablePerformanceTracking: options.enablePerformanceTracking !== false,
            enableMemoryTracking: options.enableMemoryTracking !== false,
            enableUserBehaviorTracking: options.enableUserBehaviorTracking !== false,
            ...options
        };
        
        this.stateHistory = [];
        this.analyticsEvents = [];
        this.performanceMetrics = new Map();
        this.memorySnapshots = [];
        this.userBehaviorEvents = [];
        this.debugSessions = new Map();
        
        this.currentSession = {
            id: this.generateSessionId(),
            startTime: Date.now(),
            actions: [],
            errors: [],
            performance: {}
        };
        
        this.monitoringTimer = null;
        this.isMonitoring = false;
        
        this.initializeFeatures();
    }

    /**
     * Initialize advanced features
     */
    initializeFeatures() {
        // Setup state store integration
        this.setupStateStoreIntegration();
        
        // Initialize history tracking
        if (this.options.enableHistory) {
            this.initializeHistoryTracking();
        }
        
        // Initialize analytics
        if (this.options.enableAnalytics) {
            this.initializeAnalytics();
        }
        
        // Initialize monitoring
        if (this.options.enableMonitoring) {
            this.initializeMonitoring();
        }
        
        // Initialize debugging
        if (this.options.enableDebugging) {
            this.initializeDebugging();
        }
        
        console.log('[AdvancedStateFeatures] Initialized with options:', this.options);
    }

    /**
     * Setup state store integration
     */
    setupStateStoreIntegration() {
        // Subscribe to state changes
        this.stateStore.subscribe((newState, previousState, action) => {
            this.handleStateChange(newState, previousState, action);
        });
        
        // Hook into dispatch for tracking
        const originalDispatch = this.stateStore.dispatch.bind(this.stateStore);
        this.stateStore.dispatch = (action) => {
            this.trackAction(action);
            return originalDispatch(action);
        };
    }

    /**
     * Initialize history tracking
     */
    initializeHistoryTracking() {
        this.stateHistory = [];
        
        // Add initial state
        this.addHistoryEntry({
            type: 'initial_state',
            state: this.stateStore.getState(),
            timestamp: Date.now(),
            sessionId: this.currentSession.id
        });
    }

    /**
     * Initialize analytics
     */
    initializeAnalytics() {
        this.analyticsEvents = [];
        
        // Track initial page load
        this.trackAnalyticsEvent({
            type: 'page_load',
            timestamp: Date.now(),
            sessionId: this.currentSession.id,
            userAgent: navigator.userAgent,
            viewport: {
                width: window.innerWidth,
                height: window.innerHeight
            },
            url: window.location.href
        });
    }

    /**
     * Initialize monitoring
     */
    initializeMonitoring() {
        this.isMonitoring = true;
        this.performanceMetrics.clear();
        
        // Start monitoring timer
        this.monitoringTimer = setInterval(() => {
            this.collectMonitoringData();
        }, this.options.monitoringInterval);
        
        // Collect initial monitoring data
        this.collectMonitoringData();
    }

    /**
     * Initialize debugging
     */
    initializeDebugging() {
        this.debugSessions.clear();
        
        // Setup global debug API
        if (typeof window !== 'undefined') {
            window.stateDebug = {
                getStateHistory: () => this.getStateHistory(),
                getAnalyticsEvents: () => this.getAnalyticsEvents(),
                getPerformanceMetrics: () => this.getPerformanceMetrics(),
                startDebugSession: (options) => this.startDebugSession(options),
                stopDebugSession: (sessionId) => this.stopDebugSession(sessionId),
                exportSession: (sessionId) => this.exportSession(sessionId),
                replayHistory: (fromIndex, toIndex) => this.replayHistory(fromIndex, toIndex)
            };
        }
    }

    /**
     * Handle state change
     */
    handleStateChange(newState, previousState, action) {
        // Track in history
        if (this.options.enableHistory) {
            this.addHistoryEntry({
                type: 'state_change',
                action: action.type,
                previousState: this.createStateSnapshot(previousState),
                newState: this.createStateSnapshot(newState),
                timestamp: Date.now(),
                sessionId: this.currentSession.id
            });
        }
        
        // Track analytics
        if (this.options.enableAnalytics) {
            this.trackStateChangeAnalytics(newState, previousState, action);
        }
        
        // Track performance
        if (this.options.enablePerformanceTracking) {
            this.trackStateChangePerformance(newState, previousState, action);
        }
        
        // Update session
        this.currentSession.actions.push({
            type: action.type,
            timestamp: Date.now()
        });
    }

    /**
     * Track action
     */
    trackAction(action) {
        // Track in analytics
        if (this.options.enableAnalytics) {
            this.trackAnalyticsEvent({
                type: 'action_dispatched',
                action: action.type,
                payload: this.sanitizePayload(action.payload),
                timestamp: Date.now(),
                sessionId: this.currentSession.id
            });
        }
        
        // Track user behavior
        if (this.options.enableUserBehaviorTracking) {
            this.trackUserBehavior({
                type: 'action',
                action: action.type,
                timestamp: Date.now()
            });
        }
    }

    /**
     * Add history entry
     */
    addHistoryEntry(entry) {
        this.stateHistory.push(entry);
        
        // Limit history size
        if (this.stateHistory.length > this.options.maxHistorySize) {
            this.stateHistory.shift();
        }
    }

    /**
     * Track analytics event
     */
    trackAnalyticsEvent(event) {
        this.analyticsEvents.push(event);
        
        // Limit events size
        if (this.analyticsEvents.length > this.options.maxAnalyticsEvents) {
            this.analyticsEvents.shift();
        }
    }

    /**
     * Track state change analytics
     */
    trackStateChangeAnalytics(newState, previousState, action) {
        const stateDiff = this.calculateStateDiff(previousState, newState);
        
        this.trackAnalyticsEvent({
            type: 'state_change',
            action: action.type,
            stateDiff,
            timestamp: Date.now(),
            sessionId: this.currentSession.id
        });
    }

    /**
     * Track state change performance
     */
    trackStateChangePerformance(newState, previousState, action) {
        const startTime = performance.now();
        
        // Calculate state complexity
        const complexity = this.calculateStateComplexity(newState);
        
        // Calculate memory usage
        const memoryUsage = this.options.enableMemoryTracking ? 
            this.getMemoryUsage() : null;
        
        this.performanceMetrics.set(action.type, {
            complexity,
            memoryUsage,
            timestamp: Date.now()
        });
    }

    /**
     * Track user behavior
     */
    trackUserBehavior(event) {
        this.userBehaviorEvents.push(event);
        
        // Limit events size
        if (this.userBehaviorEvents.length > 500) {
            this.userBehaviorEvents.shift();
        }
    }

    /**
     * Collect monitoring data
     */
    collectMonitoringData() {
        const timestamp = Date.now();
        
        // Collect performance data
        const performanceData = {
            timestamp,
            memory: this.options.enableMemoryTracking ? this.getMemoryUsage() : null,
            timing: performance.now(),
            stateSize: this.calculateStateSize(this.stateStore.getState()),
            historySize: this.stateHistory.length,
            analyticsSize: this.analyticsEvents.length
        };
        
        // Store in session
        this.currentSession.performance[timestamp] = performanceData;
        
        // Create memory snapshot periodically
        if (this.options.enableMemoryTracking && timestamp % 30000 < this.options.monitoringInterval) {
            this.createMemorySnapshot(timestamp);
        }
        
        // Emit monitoring event
        this.emit('monitoringData', performanceData);
    }

    /**
     * Create memory snapshot
     */
    createMemorySnapshot(timestamp) {
        const snapshot = {
            timestamp,
            memory: this.getMemoryUsage(),
            stateSize: this.calculateStateSize(this.stateStore.getState()),
            componentCount: this.getComponentCount(),
            eventListenerCount: this.getEventListenerCount()
        };
        
        this.memorySnapshots.push(snapshot);
        
        // Limit snapshots
        if (this.memorySnapshots.length > 50) {
            this.memorySnapshots.shift();
        }
    }

    /**
     * Start debug session
     */
    startDebugSession(options = {}) {
        const sessionId = this.generateSessionId();
        const debugSession = {
            id: sessionId,
            startTime: Date.now(),
            options: {
                trackStateChanges: options.trackStateChanges !== false,
                trackActions: options.trackActions !== false,
                trackPerformance: options.trackPerformance !== false,
                trackMemory: options.trackMemory !== false,
                captureScreenshots: options.captureScreenshots || false,
                ...options
            },
            events: [],
            snapshots: []
        };
        
        this.debugSessions.set(sessionId, debugSession);
        
        // Setup session tracking
        this.setupDebugSessionTracking(sessionId);
        
        console.log(`[AdvancedStateFeatures] Debug session started: ${sessionId}`);
        return sessionId;
    }

    /**
     * Stop debug session
     */
    stopDebugSession(sessionId) {
        const debugSession = this.debugSessions.get(sessionId);
        if (!debugSession) {
            console.warn(`[AdvancedStateFeatures] Debug session not found: ${sessionId}`);
            return;
        }
        
        debugSession.endTime = Date.now();
        debugSession.duration = debugSession.endTime - debugSession.startTime;
        
        console.log(`[AdvancedStateFeatures] Debug session stopped: ${sessionId}`);
        return debugSession;
    }

    /**
     * Setup debug session tracking
     */
    setupDebugSessionTracking(sessionId) {
        const debugSession = this.debugSessions.get(sessionId);
        if (!debugSession) {
            return;
        }
        
        // Create temporary subscription for session
        const unsubscribe = this.stateStore.subscribe((newState, previousState, action) => {
            if (debugSession.options.trackStateChanges) {
                debugSession.events.push({
                    type: 'state_change',
                    action: action.type,
                    timestamp: Date.now(),
                    stateSnapshot: this.createStateSnapshot(newState)
                });
            }
        });
        
        // Store unsubscribe function
        debugSession.unsubscribe = unsubscribe;
    }

    /**
     * Export session data
     */
    exportSession(sessionId = null) {
        const sessionToExport = sessionId ? 
            this.debugSessions.get(sessionId) : 
            this.currentSession;
        
        if (!sessionToExport) {
            return null;
        }
        
        const exportData = {
            session: sessionToExport,
            history: this.stateHistory,
            analytics: this.analyticsEvents,
            performance: Object.fromEntries(this.performanceMetrics),
            memory: this.memorySnapshots,
            userBehavior: this.userBehaviorEvents,
            exportTime: Date.now()
        };
        
        return JSON.stringify(exportData, null, 2);
    }

    /**
     * Replay history
     */
    async replayHistory(fromIndex = 0, toIndex = this.stateHistory.length - 1) {
        const replayEntries = this.stateHistory.slice(fromIndex, toIndex + 1);
        
        console.log(`[AdvancedStateFeatures] Replaying ${replayEntries.length} history entries`);
        
        for (const entry of replayEntries) {
            if (entry.type === 'state_change') {
                // Apply state change
                this.stateStore.state = entry.newState;
                
                // Notify listeners
                this.stateStore.notifyListeners(entry.previousState, entry.newState, {
                    type: 'history_replay',
                    originalAction: entry.action
                });
                
                // Small delay for visualization
                await new Promise(resolve => setTimeout(resolve, 100));
            }
        }
    }

    /**
     * Create state snapshot
     */
    createStateSnapshot(state) {
        return {
            state: this.deepClone(state),
            timestamp: Date.now(),
            size: this.calculateStateSize(state)
        };
    }

    /**
     * Calculate state diff
     */
    calculateStateDiff(previousState, newState) {
        const diff = {};
        
        // Simple diff implementation
        for (const key in newState) {
            if (previousState[key] !== newState[key]) {
                diff[key] = {
                    previous: previousState[key],
                    current: newState[key]
                };
            }
        }
        
        return diff;
    }

    /**
     * Calculate state complexity
     */
    calculateStateComplexity(state) {
        let complexity = 0;
        
        const calculateComplexity = (obj, depth = 0) => {
            if (depth > 10) return; // Prevent infinite recursion
            
            for (const key in obj) {
                complexity++;
                if (obj[key] && typeof obj[key] === 'object') {
                    calculateComplexity(obj[key], depth + 1);
                }
            }
        };
        
        calculateComplexity(state);
        return complexity;
    }

    /**
     * Calculate state size
     */
    calculateStateSize(state) {
        return JSON.stringify(state).length;
    }

    /**
     * Get memory usage
     */
    getMemoryUsage() {
        if (performance.memory) {
            return {
                used: performance.memory.usedJSHeapSize,
                total: performance.memory.totalJSHeapSize,
                limit: performance.memory.jsHeapSizeLimit
            };
        }
        return null;
    }

    /**
     * Get component count
     */
    getComponentCount() {
        if (typeof document !== 'undefined') {
            return document.querySelectorAll('*').length;
        }
        return 0;
    }

    /**
     * Get event listener count
     */
    getEventListenerCount() {
        // This is an approximation
        return 0;
    }

    /**
     * Sanitize payload for analytics
     */
    sanitizePayload(payload) {
        if (!payload || typeof payload !== 'object') {
            return payload;
        }
        
        const sanitized = {};
        const sensitiveKeys = ['password', 'token', 'secret', 'key'];
        
        for (const [key, value] of Object.entries(payload)) {
            if (sensitiveKeys.includes(key.toLowerCase())) {
                sanitized[key] = '[REDACTED]';
            } else if (typeof value === 'object' && value !== null) {
                sanitized[key] = '[OBJECT]';
            } else {
                sanitized[key] = value;
            }
        }
        
        return sanitized;
    }

    /**
     * Deep clone object
     */
    deepClone(obj) {
        if (obj === null || typeof obj !== 'object') {
            return obj;
        }
        
        if (obj instanceof Date) {
            return new Date(obj.getTime());
        }
        
        if (obj instanceof Array) {
            return obj.map(item => this.deepClone(item));
        }
        
        const cloned = {};
        for (const key in obj) {
            if (obj.hasOwnProperty(key)) {
                cloned[key] = this.deepClone(obj[key]);
            }
        }
        
        return cloned;
    }

    /**
     * Generate session ID
     */
    generateSessionId() {
        return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Event handling
     */
    on(event, callback) {
        if (!this.eventListeners) {
            this.eventListeners = new Map();
        }
        
        if (!this.eventListeners.has(event)) {
            this.eventListeners.set(event, []);
        }
        this.eventListeners.get(event).push(callback);
    }

    off(event, callback) {
        if (this.eventListeners && this.eventListeners.has(event)) {
            const listeners = this.eventListeners.get(event);
            const index = listeners.indexOf(callback);
            if (index > -1) {
                listeners.splice(index, 1);
            }
        }
    }

    emit(event, data) {
        if (this.eventListeners && this.eventListeners.has(event)) {
            this.eventListeners.get(event).forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error(`[AdvancedStateFeatures] Error in event listener for ${event}:`, error);
                }
            });
        }
    }

    /**
     * Get state history
     */
    getStateHistory() {
        return [...this.stateHistory];
    }

    /**
     * Get analytics events
     */
    getAnalyticsEvents() {
        return [...this.analyticsEvents];
    }

    /**
     * Get performance metrics
     */
    getPerformanceMetrics() {
        return Object.fromEntries(this.performanceMetrics);
    }

    /**
     * Get memory snapshots
     */
    getMemorySnapshots() {
        return [...this.memorySnapshots];
    }

    /**
     * Get user behavior events
     */
    getUserBehaviorEvents() {
        return [...this.userBehaviorEvents];
    }

    /**
     * Get current session
     */
    getCurrentSession() {
        return { ...this.currentSession };
    }

    /**
     * Get debug session
     */
    getDebugSession(sessionId) {
        return this.debugSessions.get(sessionId);
    }

    /**
     * Get all debug sessions
     */
    getDebugSessions() {
        return Array.from(this.debugSessions.values());
    }

    /**
     * Get comprehensive metrics
     */
    getMetrics() {
        return {
            history: {
                size: this.stateHistory.length,
                maxSize: this.options.maxHistorySize
            },
            analytics: {
                size: this.analyticsEvents.length,
                maxSize: this.options.maxAnalyticsEvents
            },
            performance: {
                metricsCount: this.performanceMetrics.size,
                isMonitoring: this.isMonitoring
            },
            memory: {
                snapshotsCount: this.memorySnapshots.length,
                currentUsage: this.getMemoryUsage()
            },
            userBehavior: {
                eventsCount: this.userBehaviorEvents.length
            },
            debugging: {
                activeSessions: this.debugSessions.size,
                currentSession: this.currentSession.id
            }
        };
    }

    /**
     * Clear history
     */
    clearHistory() {
        this.stateHistory = [];
        console.log('[AdvancedStateFeatures] History cleared');
    }

    /**
     * Clear analytics
     */
    clearAnalytics() {
        this.analyticsEvents = [];
        console.log('[AdvancedStateFeatures] Analytics cleared');
    }

    /**
     * Clear performance metrics
     */
    clearPerformanceMetrics() {
        this.performanceMetrics.clear();
        console.log('[AdvancedStateFeatures] Performance metrics cleared');
    }

    /**
     * Clear all data
     */
    clearAll() {
        this.clearHistory();
        this.clearAnalytics();
        this.clearPerformanceMetrics();
        this.memorySnapshots = [];
        this.userBehaviorEvents = [];
        
        // Clear debug sessions
        for (const [sessionId, debugSession] of this.debugSessions) {
            if (debugSession.unsubscribe) {
                debugSession.unsubscribe();
            }
        }
        this.debugSessions.clear();
        
        console.log('[AdvancedStateFeatures] All data cleared');
    }

    /**
     * Destroy advanced features
     */
    destroy() {
        // Stop monitoring
        if (this.monitoringTimer) {
            clearInterval(this.monitoringTimer);
            this.monitoringTimer = null;
        }
        
        // Clear all data
        this.clearAll();
        
        // Remove global debug API
        if (typeof window !== 'undefined' && window.stateDebug) {
            delete window.stateDebug;
        }
        
        // Clear event listeners
        if (this.eventListeners) {
            this.eventListeners.clear();
        }
        
        this.stateStore = null;
        this.isMonitoring = false;
        
        console.log('[AdvancedStateFeatures] Destroyed');
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AdvancedStateFeatures;
} else if (typeof window !== 'undefined') {
    window.AdvancedStateFeatures = AdvancedStateFeatures;
}