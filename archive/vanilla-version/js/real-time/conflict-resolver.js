/**
 * Conflict Resolution System
 * Handles conflicts from concurrent state modifications with multiple resolution strategies
 */

class ConflictResolver {
    constructor(options = {}) {
        this.options = {
            strategy: options.strategy || 'last-write-wins',
            autoResolve: options.autoResolve !== false,
            maxConflictHistory: options.maxConflictHistory || 100,
            enableUserIntervention: options.enableUserIntervention !== false,
            conflictTimeout: options.conflictTimeout || 30000,
            ...options
        };
        
        this.conflictHistory = [];
        this.activeConflicts = new Map();
        this.resolutionStrategies = new Map();
        this.userInterventionCallbacks = new Map();
        
        this.metrics = {
            conflictsDetected: 0,
            conflictsResolved: 0,
            conflictsAutoResolved: 0,
            conflictsUserResolved: 0,
            averageResolutionTime: 0,
            totalResolutionTime: 0
        };
        
        this.initializeResolutionStrategies();
    }

    /**
     * Initialize resolution strategies
     */
    initializeResolutionStrategies() {
        // Last Write Wins strategy
        this.resolutionStrategies.set('last-write-wins', {
            description: 'Keeps the most recent change',
            resolve: (conflict) => {
                const localTimestamp = conflict.localState.timestamp || 0;
                const remoteTimestamp = conflict.remoteUpdate.timestamp || 0;
                
                if (remoteTimestamp > localTimestamp) {
                    return {
                        action: 'accept_remote',
                        reason: 'Remote change is more recent',
                        resolution: conflict.remoteUpdate
                    };
                } else {
                    return {
                        action: 'accept_local',
                        reason: 'Local change is more recent',
                        resolution: conflict.localState
                    };
                }
            }
        });

        // First Write Wins strategy
        this.resolutionStrategies.set('first-write-wins', {
            description: 'Keeps the original change',
            resolve: (conflict) => {
                const localTimestamp = conflict.localState.timestamp || 0;
                const remoteTimestamp = conflict.remoteUpdate.timestamp || 0;
                
                if (localTimestamp < remoteTimestamp) {
                    return {
                        action: 'accept_local',
                        reason: 'Local change was made first',
                        resolution: conflict.localState
                    };
                } else {
                    return {
                        action: 'accept_remote',
                        reason: 'Remote change was made first',
                        resolution: conflict.remoteUpdate
                    };
                }
            }
        });

        // Merge strategy
        this.resolutionStrategies.set('merge', {
            description: 'Attempts to merge changes',
            resolve: (conflict) => {
                const merged = this.attemptMerge(conflict.localState, conflict.remoteUpdate);
                
                if (merged.success) {
                    return {
                        action: 'merge',
                        reason: 'Successfully merged changes',
                        resolution: merged.result
                    };
                } else {
                    // Fall back to last-write-wins
                    return this.resolutionStrategies.get('last-write-wins').resolve(conflict);
                }
            }
        });

        // User Choice strategy
        this.resolutionStrategies.set('user-choice', {
            description: 'Requires user intervention',
            resolve: (conflict) => {
                return {
                    action: 'user_intervention',
                    reason: 'User choice required',
                    resolution: null
                };
            }
        });

        // Priority-based strategy
        this.resolutionStrategies.set('priority', {
            description: 'Resolves based on priority levels',
            resolve: (conflict) => {
                const localPriority = conflict.localState.priority || 0;
                const remotePriority = conflict.remoteUpdate.priority || 0;
                
                if (remotePriority > localPriority) {
                    return {
                        action: 'accept_remote',
                        reason: 'Remote change has higher priority',
                        resolution: conflict.remoteUpdate
                    };
                } else if (localPriority > remotePriority) {
                    return {
                        action: 'accept_local',
                        reason: 'Local change has higher priority',
                        resolution: conflict.localState
                    };
                } else {
                    // Equal priority, fall back to timestamp
                    return this.resolutionStrategies.get('last-write-wins').resolve(conflict);
                }
            }
        });

        // Custom strategy
        this.resolutionStrategies.set('custom', {
            description: 'Uses custom resolution function',
            resolve: (conflict) => {
                if (this.options.customResolver) {
                    return this.options.customResolver(conflict);
                } else {
                    console.warn('[ConflictResolver] Custom strategy specified but no custom resolver provided');
                    return this.resolutionStrategies.get('last-write-wins').resolve(conflict);
                }
            }
        });
    }

    /**
     * Resolve conflict
     */
    async resolve(conflict) {
        const startTime = Date.now();
        const conflictId = this.generateConflictId(conflict);
        
        try {
            // Add to active conflicts
            this.activeConflicts.set(conflictId, {
                ...conflict,
                id: conflictId,
                detectedAt: Date.now(),
                status: 'resolving'
            });
            
            // Update metrics
            this.metrics.conflictsDetected++;
            
            console.log(`[ConflictResolver] Resolving conflict: ${conflictId}`);
            
            // Get resolution strategy
            const strategy = this.getResolutionStrategy(conflict);
            
            // Attempt resolution
            let resolution;
            if (strategy.action === 'user_intervention') {
                resolution = await this.requestUserIntervention(conflict);
            } else {
                resolution = strategy;
            }
            
            // Apply resolution
            const result = await this.applyResolution(conflict, resolution);
            
            // Update conflict status
            const activeConflict = this.activeConflicts.get(conflictId);
            if (activeConflict) {
                activeConflict.status = 'resolved';
                activeConflict.resolvedAt = Date.now();
                activeConflict.resolution = resolution;
                activeConflict.result = result;
            }
            
            // Update metrics
            const resolutionTime = Date.now() - startTime;
            this.updateResolutionMetrics(resolutionTime, resolution.action);
            
            // Add to history
            this.addToConflictHistory({
                ...conflict,
                id: conflictId,
                resolution,
                result,
                resolutionTime,
                strategy: strategy.action
            });
            
            // Remove from active conflicts
            this.activeConflicts.delete(conflictId);
            
            console.log(`[ConflictResolver] Conflict resolved: ${conflictId}`);
            return result;
            
        } catch (error) {
            console.error(`[ConflictResolver] Failed to resolve conflict ${conflictId}:`, error);
            
            // Update conflict status
            const activeConflict = this.activeConflicts.get(conflictId);
            if (activeConflict) {
                activeConflict.status = 'failed';
                activeConflict.error = error.message;
            }
            
            throw error;
        }
    }

    /**
     * Get resolution strategy for conflict
     */
    getResolutionStrategy(conflict) {
        // Check if conflict has specific strategy
        if (conflict.strategy) {
            const strategy = this.resolutionStrategies.get(conflict.strategy);
            if (strategy) {
                return strategy.resolve(conflict);
            }
        }
        
        // Use default strategy
        const defaultStrategy = this.resolutionStrategies.get(this.options.strategy);
        if (!defaultStrategy) {
            throw new Error(`Unknown resolution strategy: ${this.options.strategy}`);
        }
        
        return defaultStrategy.resolve(conflict);
    }

    /**
     * Attempt to merge conflicting states
     */
    attemptMerge(localState, remoteUpdate) {
        try {
            const merged = this.deepMerge(localState, remoteUpdate.changes || remoteUpdate);
            
            return {
                success: true,
                result: merged
            };
            
        } catch (error) {
            console.warn('[ConflictResolver] Merge failed:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Deep merge objects
     */
    deepMerge(target, source) {
        const result = { ...target };
        
        for (const key in source) {
            if (source.hasOwnProperty(key)) {
                if (this.isObject(source[key]) && this.isObject(result[key])) {
                    result[key] = this.deepMerge(result[key], source[key]);
                } else {
                    result[key] = source[key];
                }
            }
        }
        
        return result;
    }

    /**
     * Check if value is an object
     */
    isObject(value) {
        return value !== null && typeof value === 'object' && !Array.isArray(value);
    }

    /**
     * Request user intervention
     */
    async requestUserIntervention(conflict) {
        if (!this.options.enableUserIntervention) {
            throw new Error('User intervention not enabled');
        }
        
        const conflictId = this.generateConflictId(conflict);
        
        return new Promise((resolve, reject) => {
            // Set timeout for user intervention
            const timeout = setTimeout(() => {
                this.userInterventionCallbacks.delete(conflictId);
                reject(new Error('User intervention timeout'));
            }, this.options.conflictTimeout);
            
            // Store callback
            this.userInterventionCallbacks.set(conflictId, {
                resolve: (resolution) => {
                    clearTimeout(timeout);
                    this.userInterventionCallbacks.delete(conflictId);
                    resolve(resolution);
                },
                reject: (error) => {
                    clearTimeout(timeout);
                    this.userInterventionCallbacks.delete(conflictId);
                    reject(error);
                }
            });
            
            // Emit user intervention event
            this.emit('userInterventionRequired', {
                conflictId,
                conflict,
                timeout: this.options.conflictTimeout
            });
        });
    }

    /**
     * Provide user resolution
     */
    provideUserResolution(conflictId, resolution) {
        const callback = this.userInterventionCallbacks.get(conflictId);
        if (callback) {
            callback.resolve(resolution);
        } else {
            console.warn(`[ConflictResolver] No pending user intervention for conflict: ${conflictId}`);
        }
    }

    /**
     * Cancel user intervention
     */
    cancelUserIntervention(conflictId, error = null) {
        const callback = this.userInterventionCallbacks.get(conflictId);
        if (callback) {
            if (error) {
                callback.reject(error);
            } else {
                callback.reject(new Error('User intervention cancelled'));
            }
        } else {
            console.warn(`[ConflictResolver] No pending user intervention for conflict: ${conflictId}`);
        }
    }

    /**
     * Apply resolution to state
     */
    async applyResolution(conflict, resolution) {
        switch (resolution.action) {
            case 'accept_local':
                return {
                    applied: true,
                    state: conflict.localState,
                    action: 'local_accepted'
                };
                
            case 'accept_remote':
                return {
                    applied: true,
                    state: resolution.resolution,
                    action: 'remote_accepted'
                };
                
            case 'merge':
                return {
                    applied: true,
                    state: resolution.resolution,
                    action: 'merged'
                };
                
            case 'user_intervention':
                return {
                    applied: false,
                    state: null,
                    action: 'user_intervention',
                    userResolution: resolution.resolution
                };
                
            default:
                throw new Error(`Unknown resolution action: ${resolution.action}`);
        }
    }

    /**
     * Generate conflict ID
     */
    generateConflictId(conflict) {
        const key = `${conflict.type}_${conflict.entityId}_${Date.now()}`;
        return `conflict_${key.replace(/[^a-zA-Z0-9]/g, '_')}`;
    }

    /**
     * Add to conflict history
     */
    addToConflictHistory(conflict) {
        this.conflictHistory.push(conflict);
        
        // Limit history size
        if (this.conflictHistory.length > this.options.maxConflictHistory) {
            this.conflictHistory.shift();
        }
    }

    /**
     * Update resolution metrics
     */
    updateResolutionMetrics(resolutionTime, action) {
        this.metrics.conflictsResolved++;
        this.metrics.totalResolutionTime += resolutionTime;
        this.metrics.averageResolutionTime = this.metrics.totalResolutionTime / this.metrics.conflictsResolved;
        
        if (action === 'user_intervention') {
            this.metrics.conflictsUserResolved++;
        } else {
            this.metrics.conflictsAutoResolved++;
        }
    }

    /**
     * Get conflict by ID
     */
    getConflict(conflictId) {
        return this.activeConflicts.get(conflictId);
    }

    /**
     * Get all active conflicts
     */
    getActiveConflicts() {
        return Array.from(this.activeConflicts.values());
    }

    /**
     * Get conflict history
     */
    getConflictHistory() {
        return [...this.conflictHistory];
    }

    /**
     * Get metrics
     */
    getMetrics() {
        return {
            ...this.metrics,
            activeConflicts: this.activeConflicts.size,
            availableStrategies: Array.from(this.resolutionStrategies.keys())
        };
    }

    /**
     * Register custom resolution strategy
     */
    registerStrategy(name, strategy) {
        if (!strategy.description || !strategy.resolve) {
            throw new Error('Strategy must have description and resolve function');
        }
        
        this.resolutionStrategies.set(name, strategy);
    }

    /**
     * Unregister resolution strategy
     */
    unregisterStrategy(name) {
        if (name === this.options.strategy) {
            throw new Error('Cannot unregister default strategy');
        }
        
        return this.resolutionStrategies.delete(name);
    }

    /**
     * Set default strategy
     */
    setDefaultStrategy(strategy) {
        if (!this.resolutionStrategies.has(strategy)) {
            throw new Error(`Unknown strategy: ${strategy}`);
        }
        
        this.options.strategy = strategy;
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
                    console.error(`[ConflictResolver] Error in event listener for ${event}:`, error);
                }
            });
        }
    }

    /**
     * Clear conflict history
     */
    clearHistory() {
        this.conflictHistory = [];
    }

    /**
     * Clear metrics
     */
    clearMetrics() {
        this.metrics = {
            conflictsDetected: 0,
            conflictsResolved: 0,
            conflictsAutoResolved: 0,
            conflictsUserResolved: 0,
            averageResolutionTime: 0,
            totalResolutionTime: 0
        };
    }

    /**
     * Destroy conflict resolver
     */
    destroy() {
        // Cancel all pending user interventions
        for (const [conflictId, callback] of this.userInterventionCallbacks) {
            callback.reject(new Error('Conflict resolver destroyed'));
        }
        
        this.userInterventionCallbacks.clear();
        this.activeConflicts.clear();
        this.conflictHistory = [];
        this.resolutionStrategies.clear();
        
        if (this.eventListeners) {
            this.eventListeners.clear();
        }
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ConflictResolver;
} else if (typeof window !== 'undefined') {
    window.ConflictResolver = ConflictResolver;
}