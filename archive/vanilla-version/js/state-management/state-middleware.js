/**
 * State Middleware System
 * Comprehensive middleware for logging, validation, performance monitoring, and more
 */

class StateMiddleware {
    constructor() {
        this.middlewareRegistry = new Map();
        this.middlewareStack = [];
        this.performanceMetrics = new Map();
        this.errorTracking = [];
        this.validationRules = new Map();
        
        this.initializeBuiltInMiddleware();
    }

    /**
     * Initialize built-in middleware
     */
    initializeBuiltInMiddleware() {
        // Logging middleware
        this.register('logger', this.createLoggingMiddleware());
        
        // Validation middleware
        this.register('validator', this.createValidationMiddleware());
        
        // Performance monitoring middleware
        this.register('performance', this.createPerformanceMiddleware());
        
        // Error tracking middleware
        this.register('errorTracker', this.createErrorTrackingMiddleware());
        
        // State persistence middleware
        this.register('persistence', this.createPersistenceMiddleware());
        
        // Analytics middleware
        this.register('analytics', this.createAnalyticsMiddleware());
        
        // Security middleware
        this.register('security', this.createSecurityMiddleware());
        
        // Debug middleware
        this.register('debug', this.createDebugMiddleware());
    }

    /**
     * Register middleware
     */
    register(name, middleware) {
        this.middlewareRegistry.set(name, middleware);
        this.rebuildMiddlewareStack();
    }

    /**
     * Unregister middleware
     */
    unregister(name) {
        this.middlewareRegistry.delete(name);
        this.rebuildMiddlewareStack();
    }

    /**
     * Rebuild middleware stack
     */
    rebuildMiddlewareStack() {
        this.middlewareStack = Array.from(this.middlewareRegistry.values());
    }

    /**
     * Get middleware stack
     */
    getMiddlewareStack() {
        return [...this.middlewareStack];
    }

    /**
     * Create logging middleware
     */
    createLoggingMiddleware(options = {}) {
        const {
            logLevel = 'info',
            logActions = true,
            logStateChanges = true,
            logPerformance = true,
            maxLogSize = 1000
        } = options;

        const logHistory = [];
        const shouldLog = (level) => {
            const levels = { debug: 0, info: 1, warn: 2, error: 3 };
            return levels[level] >= levels[logLevel];
        };

        return (state, action, next) => {
            const startTime = performance.now();
            const logEntry = {
                timestamp: Date.now(),
                action: action.type,
                payload: action.payload,
                previousState: state
            };

            try {
                // Log action
                if (logActions && shouldLog('info')) {
                    console.log(`[StateMiddleware] Action: ${action.type}`, action.payload);
                }

                // Execute next middleware
                const newState = next(state, action);
                const endTime = performance.now();
                const duration = endTime - startTime;

                // Update log entry
                logEntry.duration = duration;
                logEntry.newState = newState;
                logEntry.stateChanged = newState !== state;

                // Log state change
                if (logStateChanges && logEntry.stateChanged && shouldLog('info')) {
                    console.log(`[StateMiddleware] State changed for: ${action.type}`, {
                        duration: `${duration.toFixed(2)}ms`,
                        stateDiff: this.getStateDiff(state, newState)
                    });
                }

                // Log performance
                if (logPerformance && shouldLog('debug')) {
                    console.debug(`[StateMiddleware] Performance: ${action.type}`, {
                        duration: `${duration.toFixed(2)}ms`,
                        memoryUsage: this.getMemoryUsage()
                    });
                }

                // Add to log history
                logHistory.push(logEntry);
                if (logHistory.length > maxLogSize) {
                    logHistory.shift();
                }

                return newState;

            } catch (error) {
                logEntry.error = error;
                
                if (shouldLog('error')) {
                    console.error(`[StateMiddleware] Error in ${action.type}:`, error);
                }

                throw error;
            }
        };
    }

    /**
     * Create validation middleware
     */
    createValidationMiddleware(options = {}) {
        const {
            strictMode = false,
            validatePayload = true,
            validateState = false,
            customValidators = new Map()
        } = options;

        return (state, action, next) => {
            try {
                // Validate action structure
                if (!this.validateActionStructure(action)) {
                    throw new Error(`Invalid action structure: ${action.type}`);
                }

                // Validate payload
                if (validatePayload && action.payload) {
                    const payloadValidation = this.validateActionPayload(action);
                    if (!payloadValidation.isValid) {
                        throw new Error(`Invalid payload for ${action.type}: ${payloadValidation.errors.join(', ')}`);
                    }
                }

                // Validate state
                if (validateState) {
                    const stateValidation = this.validateStateStructure(state);
                    if (!stateValidation.isValid) {
                        throw new Error(`Invalid state structure: ${stateValidation.errors.join(', ')}`);
                    }
                }

                // Apply custom validators
                for (const [actionType, validator] of customValidators) {
                    if (action.type === actionType) {
                        const result = validator(action, state);
                        if (!result.isValid) {
                            throw new Error(`Validation failed for ${actionType}: ${result.error}`);
                        }
                    }
                }

                return next(state, action);

            } catch (error) {
                console.error(`[StateMiddleware] Validation error:`, error);
                
                if (strictMode) {
                    throw error;
                } else {
                    console.warn(`[StateMiddleware] Skipping invalid action: ${action.type}`);
                    return state;
                }
            }
        };
    }

    /**
     * Create performance monitoring middleware
     */
    createPerformanceMiddleware(options = {}) {
        const {
            trackMemory = true,
            trackTiming = true,
            trackFrequency = true,
            alertThreshold = 100, // ms
            maxMetrics = 100
        } = options;

        const actionMetrics = new Map();

        return (state, action, next) => {
            const startTime = performance.now();
            const startMemory = trackMemory ? this.getMemoryUsage() : null;

            try {
                const newState = next(state, action);
                const endTime = performance.now();
                const duration = endTime - startTime;
                const endMemory = trackMemory ? this.getMemoryUsage() : null;

                // Update metrics
                if (!actionMetrics.has(action.type)) {
                    actionMetrics.set(action.type, {
                        count: 0,
                        totalDuration: 0,
                        averageDuration: 0,
                        maxDuration: 0,
                        minDuration: Infinity,
                        totalMemoryDelta: 0,
                        lastExecuted: null
                    });
                }

                const metrics = actionMetrics.get(action.type);
                metrics.count++;
                metrics.totalDuration += duration;
                metrics.averageDuration = metrics.totalDuration / metrics.count;
                metrics.maxDuration = Math.max(metrics.maxDuration, duration);
                metrics.minDuration = Math.min(metrics.minDuration, duration);
                metrics.lastExecuted = Date.now();

                if (trackMemory && startMemory && endMemory) {
                    const memoryDelta = endMemory.used - startMemory.used;
                    metrics.totalMemoryDelta += memoryDelta;
                }

                // Performance alert
                if (duration > alertThreshold) {
                    console.warn(`[StateMiddleware] Slow action detected: ${action.type} took ${duration.toFixed(2)}ms`);
                }

                // Store metrics
                this.performanceMetrics.set(action.type, metrics);

                // Limit metrics size
                if (this.performanceMetrics.size > maxMetrics) {
                    const oldestKey = this.performanceMetrics.keys().next().value;
                    this.performanceMetrics.delete(oldestKey);
                }

                return newState;

            } catch (error) {
                // Track error metrics
                const metrics = actionMetrics.get(action.type) || { count: 0, errors: 0 };
                metrics.errors = (metrics.errors || 0) + 1;
                actionMetrics.set(action.type, metrics);

                throw error;
            }
        };
    }

    /**
     * Create error tracking middleware
     */
    createErrorTrackingMiddleware(options = {}) {
        const {
            maxErrors = 100,
            includeStackTrace = true,
            reportToService = false,
            reportService = null
        } = options;

        return (state, action, next) => {
            try {
                return next(state, action);
            } catch (error) {
                const errorEntry = {
                    timestamp: Date.now(),
                    action: action.type,
                    payload: action.payload,
                    error: {
                        message: error.message,
                        name: error.name,
                        stack: includeStackTrace ? error.stack : null
                    },
                    state: this.getStateSnapshot(state)
                };

                // Add to error tracking
                this.errorTracking.push(errorEntry);
                if (this.errorTracking.length > maxErrors) {
                    this.errorTracking.shift();
                }

                // Report to service
                if (reportToService && reportService) {
                    reportService.reportError(errorEntry);
                }

                console.error(`[StateMiddleware] Error in ${action.type}:`, error);
                throw error;
            }
        };
    }

    /**
     * Create persistence middleware
     */
    createPersistenceMiddleware(options = {}) {
        const {
            storageKey = 'app_state',
            storage = localStorage,
            persistPaths = ['auth', 'app.theme', 'app.language'],
            excludePaths = [],
            debounceMs = 1000
        } = options;

        let saveTimeout = null;

        const saveState = (state) => {
            try {
                const stateToPersist = this.extractStatePaths(state, persistPaths, excludePaths);
                storage.setItem(storageKey, JSON.stringify(stateToPersist));
            } catch (error) {
                console.error('[StateMiddleware] Failed to persist state:', error);
            }
        };

        return (state, action, next) => {
            const newState = next(state, action);

            // Debounced save
            if (saveTimeout) {
                clearTimeout(saveTimeout);
            }

            saveTimeout = setTimeout(() => {
                saveState(newState);
            }, debounceMs);

            return newState;
        };
    }

    /**
     * Create analytics middleware
     */
    createAnalyticsMiddleware(options = {}) {
        const {
            trackAllActions = false,
            trackedActions = ['NAVIGATE_TO', 'DATA_UPDATE_FEATURE', 'UI_TOGGLE_MODAL'],
            analyticsService = null
        } = options;

        return (state, action, next) => {
            const shouldTrack = trackAllActions || trackedActions.includes(action.type);

            if (shouldTrack) {
                const analyticsEvent = {
                    type: 'state_action',
                    action: action.type,
                    timestamp: Date.now(),
                    payload: this.sanitizePayload(action.payload),
                    context: {
                        userAgent: navigator.userAgent,
                        viewport: {
                            width: window.innerWidth,
                            height: window.innerHeight
                        }
                    }
                };

                // Send to analytics service
                if (analyticsService) {
                    analyticsService.track(analyticsEvent);
                } else {
                    console.debug('[StateMiddleware] Analytics event:', analyticsEvent);
                }
            }

            return next(state, action);
        };
    }

    /**
     * Create security middleware
     */
    createSecurityMiddleware(options = {}) {
        const {
            sanitizePayload = true,
            validatePermissions = true,
            maxPayloadSize = 10000, // bytes
            blockedActions = []
        } = options;

        return (state, action, next) => {
            // Check blocked actions
            if (blockedActions.includes(action.type)) {
                console.warn(`[StateMiddleware] Blocked action: ${action.type}`);
                return state;
            }

            // Validate payload size
            if (action.payload && JSON.stringify(action.payload).length > maxPayloadSize) {
                console.warn(`[StateMiddleware] Payload too large for: ${action.type}`);
                return state;
            }

            // Validate permissions
            if (validatePermissions && state.auth && state.auth.permissions) {
                if (!this.hasPermissionForAction(state.auth.permissions, action.type)) {
                    console.warn(`[StateMiddleware] Insufficient permissions for: ${action.type}`);
                    return state;
                }
            }

            // Sanitize payload
            if (sanitizePayload && action.payload) {
                action.payload = this.sanitizePayload(action.payload);
            }

            return next(state, action);
        };
    }

    /**
     * Create debug middleware
     */
    createDebugMiddleware(options = {}) {
        const {
            enableReduxDevTools = true,
            enableStateSnapshots = false,
            maxSnapshots = 10
        } = options;

        const stateSnapshots = [];

        // Redux DevTools integration
        if (enableReduxDevTools && typeof window !== 'undefined' && window.__REDUX_DEVTOOLS_EXTENSION__) {
            const devTools = window.__REDUX_DEVTOOLS_EXTENSION__.connect({
                name: 'Platform Test State Store',
                features: {
                    pause: true,
                    lock: true,
                    persist: true,
                    export: true,
                    import: 'custom',
                    jump: true,
                    skip: true,
                    reorder: true,
                    dispatch: true,
                    test: true
                }
            });

            devTools.subscribe((message) => {
                if (message.type === 'DISPATCH' && message.state) {
                    // Handle Redux DevTools actions
                    console.log('[StateMiddleware] Redux DevTools action:', message);
                }
            });

            // Store devTools instance for later use
            this.devTools = devTools;
        }

        return (state, action, next) => {
            const newState = next(state, action);

            // Send to Redux DevTools
            if (this.devTools) {
                this.devTools.send(action, newState);
            }

            // Create state snapshot
            if (enableStateSnapshots) {
                const snapshot = {
                    timestamp: Date.now(),
                    action: action.type,
                    state: this.getStateSnapshot(newState)
                };

                stateSnapshots.push(snapshot);
                if (stateSnapshots.length > maxSnapshots) {
                    stateSnapshots.shift();
                }
            }

            return newState;
        };
    }

    /**
     * Utility Methods
     */
    validateActionStructure(action) {
        return action && 
               typeof action === 'object' && 
               typeof action.type === 'string' && 
               action.type.length > 0;
    }

    validateActionPayload(action) {
        // Basic payload validation - can be extended
        const errors = [];

        if (action.payload && typeof action.payload !== 'object') {
            errors.push('Payload must be an object');
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    validateStateStructure(state) {
        // Basic state validation - can be extended
        const errors = [];

        if (!state || typeof state !== 'object') {
            errors.push('State must be an object');
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    getStateDiff(previousState, newState) {
        const diff = {};
        
        // Simple diff implementation - can be enhanced
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

    getStateSnapshot(state) {
        // Create a shallow copy for snapshot
        return { ...state };
    }

    extractStatePaths(state, includePaths, excludePaths) {
        const result = {};

        for (const path of includePaths) {
            const value = this.getNestedValue(state, path);
            if (value !== null) {
                this.setNestedValue(result, path, value);
            }
        }

        for (const path of excludePaths) {
            this.removeNestedValue(result, path);
        }

        return result;
    }

    getNestedValue(obj, path) {
        return path.split('.').reduce((current, key) => {
            return current && current[key] !== undefined ? current[key] : null;
        }, obj);
    }

    setNestedValue(obj, path, value) {
        const keys = path.split('.');
        const lastKey = keys.pop();
        
        const target = keys.reduce((current, key) => {
            if (!current[key]) current[key] = {};
            return current[key];
        }, obj);
        
        target[lastKey] = value;
    }

    removeNestedValue(obj, path) {
        const keys = path.split('.');
        const lastKey = keys.pop();
        
        const target = keys.reduce((current, key) => {
            return current && current[key] ? current[key] : null;
        }, obj);
        
        if (target && target[lastKey] !== undefined) {
            delete target[lastKey];
        }
    }

    sanitizePayload(payload) {
        // Remove sensitive data from payload
        const sanitized = { ...payload };
        const sensitiveKeys = ['password', 'token', 'secret', 'key'];

        for (const key of sensitiveKeys) {
            if (sanitized[key]) {
                sanitized[key] = '[REDACTED]';
            }
        }

        return sanitized;
    }

    hasPermissionForAction(permissions, actionType) {
        // Simple permission check - can be enhanced
        const requiredPermissions = this.getRequiredPermissions(actionType);
        return requiredPermissions.every(perm => permissions.includes(perm));
    }

    getRequiredPermissions(actionType) {
        // Define required permissions for actions
        const permissionMap = {
            'AUTH_LOGIN': [],
            'AUTH_LOGOUT': [],
            'DATA_UPDATE_FEATURE': ['write'],
            'DATA_DELETE_FEATURE': ['write', 'admin'],
            'UI_TOGGLE_MODAL': []
        };

        return permissionMap[actionType] || [];
    }

    /**
     * Get middleware metrics
     */
    getMetrics() {
        return {
            performance: Object.fromEntries(this.performanceMetrics),
            errors: [...this.errorTracking],
            middlewareCount: this.middlewareRegistry.size
        };
    }

    /**
     * Clear metrics
     */
    clearMetrics() {
        this.performanceMetrics.clear();
        this.errorTracking = [];
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = StateMiddleware;
} else if (typeof window !== 'undefined') {
    window.StateMiddleware = StateMiddleware;
}