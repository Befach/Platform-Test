/**
 * State Management Integration System
 * Main integration file that brings together all state management and real-time synchronization components
 */

class StateManagementIntegration {
    constructor(options = {}) {
        this.options = {
            // State store options
            enableTimeTravel: options.enableTimeTravel !== false,
            batchUpdates: options.batchUpdates !== false,
            maxHistorySize: options.maxHistorySize || 50,
            
            // Real-time sync options
            enableRealTimeSync: options.enableRealTimeSync !== false,
            websocketUrl: options.websocketUrl || null,
            autoReconnect: options.autoReconnect !== false,
            
            // Persistence options
            enablePersistence: options.enablePersistence !== false,
            storageType: options.storageType || 'localStorage',
            autoSave: options.autoSave !== false,
            
            // Component integration options
            enableComponentIntegration: options.enableComponentIntegration !== false,
            autoSubscribeComponents: options.autoSubscribeComponents !== false,
            
            // Advanced features options
            enableAdvancedFeatures: options.enableAdvancedFeatures !== false,
            enableHistory: options.enableHistory !== false,
            enableAnalytics: options.enableAnalytics !== false,
            enableMonitoring: options.enableMonitoring !== false,
            
            // Performance options
            enablePerformanceOptimization: options.enablePerformanceOptimization !== false,
            enableMemoryOptimization: options.enableMemoryOptimization !== false,
            
            ...options
        };
        
        this.isInitialized = false;
        this.isDestroyed = false;
        
        // Core components
        this.stateStore = null;
        this.stateActions = null;
        this.stateMiddleware = null;
        this.statePersistence = null;
        this.componentIntegration = null;
        this.advancedFeatures = null;
        
        // Real-time components
        this.syncManager = null;
        this.websocketClient = null;
        this.conflictResolver = null;
        
        // Integration state
        this.integrationState = {
            initialized: false,
            connected: false,
            syncing: false,
            lastSync: null,
            errorCount: 0,
            lastError: null
        };
        
        // Event system
        this.eventListeners = new Map();
        
        console.log('[StateManagementIntegration] Initializing...');
    }

    /**
     * Initialize the complete state management system
     */
    async initialize() {
        if (this.isInitialized) {
            console.warn('[StateManagementIntegration] Already initialized');
            return;
        }

        try {
            console.log('[StateManagementIntegration] Starting initialization...');
            
            // Initialize core state management
            await this.initializeCoreStateManagement();
            
            // Initialize persistence if enabled
            if (this.options.enablePersistence) {
                await this.initializePersistence();
            }
            
            // Initialize real-time sync if enabled
            if (this.options.enableRealTimeSync) {
                await this.initializeRealTimeSync();
            }
            
            // Initialize component integration if enabled
            if (this.options.enableComponentIntegration) {
                await this.initializeComponentIntegration();
            }
            
            // Initialize advanced features if enabled
            if (this.options.enableAdvancedFeatures) {
                await this.initializeAdvancedFeatures();
            }
            
            // Setup cross-component integration
            this.setupCrossComponentIntegration();
            
            // Mark as initialized
            this.isInitialized = true;
            this.integrationState.initialized = true;
            
            console.log('[StateManagementIntegration] Initialization completed successfully');
            this.emit('initialized', { timestamp: Date.now() });
            
        } catch (error) {
            console.error('[StateManagementIntegration] Initialization failed:', error);
            this.integrationState.lastError = error.message;
            this.integrationState.errorCount++;
            throw error;
        }
    }

    /**
     * Initialize core state management
     */
    async initializeCoreStateManagement() {
        console.log('[StateManagementIntegration] Initializing core state management...');
        
        // Create state store
        this.stateStore = new StateStore({
            enableTimeTravel: this.options.enableTimeTravel,
            batchUpdates: this.options.batchUpdates,
            maxHistorySize: this.options.maxHistorySize
        });
        
        // Create state actions
        this.stateActions = new StateActions(this.stateStore);
        
        // Create state middleware
        this.stateMiddleware = new StateMiddleware();
        
        // Apply middleware to state store
        this.applyMiddlewareToStore();
        
        console.log('[StateManagementIntegration] Core state management initialized');
    }

    /**
     * Initialize persistence
     */
    async initializePersistence() {
        console.log('[StateManagementIntegration] Initializing persistence...');
        
        this.statePersistence = new StatePersistence({
            storageType: this.options.storageType,
            autoSave: this.options.autoSave,
            enableBackups: true,
            compressionEnabled: this.options.enableMemoryOptimization
        });
        
        // Load persisted state
        const persistedState = await this.statePersistence.load();
        if (persistedState) {
            // Apply persisted state to store
            this.stateStore.dispatch({
                type: 'LOAD_PERSISTED_STATE',
                payload: { state: persistedState }
            });
            
            console.log('[StateManagementIntegration] Persisted state loaded');
        }
        
        // Setup auto-save
        if (this.options.autoSave) {
            this.stateStore.subscribe((newState, previousState, action) => {
                this.statePersistence.autoSave(newState);
            });
        }
        
        console.log('[StateManagementIntegration] Persistence initialized');
    }

    /**
     * Initialize real-time sync
     */
    async initializeRealTimeSync() {
        if (!this.options.websocketUrl) {
            console.warn('[StateManagementIntegration] WebSocket URL not provided, skipping real-time sync');
            return;
        }
        
        console.log('[StateManagementIntegration] Initializing real-time sync...');
        
        // Create conflict resolver
        this.conflictResolver = new ConflictResolver({
            strategy: 'last-write-wins',
            autoResolve: true,
            enableUserIntervention: true
        });
        
        // Create WebSocket client
        this.websocketClient = new WebSocketClient({
            url: this.options.websocketUrl,
            autoReconnect: this.options.autoReconnect,
            enableCompression: this.options.enableMemoryOptimization
        });
        
        // Create sync manager
        this.syncManager = new SyncManager({
            maxReconnectAttempts: 10,
            enableCompression: this.options.enableMemoryOptimization
        });
        
        // Setup WebSocket event handlers
        this.setupWebSocketEventHandlers();
        
        // Setup sync manager integration
        this.setupSyncManagerIntegration();
        
        // Connect to WebSocket
        try {
            await this.websocketClient.connect(this.options.websocketUrl);
            this.integrationState.connected = true;
            console.log('[StateManagementIntegration] Real-time sync connected');
        } catch (error) {
            console.error('[StateManagementIntegration] Failed to connect real-time sync:', error);
            this.integrationState.lastError = error.message;
            this.integrationState.errorCount++;
        }
    }

    /**
     * Initialize component integration
     */
    async initializeComponentIntegration() {
        console.log('[StateManagementIntegration] Initializing component integration...');

        // Check if ComponentStateIntegration is available
        if (typeof ComponentStateIntegration === 'undefined') {
            console.warn('[StateManagementIntegration] ComponentStateIntegration not available, skipping component integration');
            return;
        }

        try {
            this.componentIntegration = new ComponentStateIntegration(this.stateStore, {
                autoSubscribe: this.options.autoSubscribeComponents,
                enableOptimisticUpdates: true,
                enableComponentIsolation: true,
                enableStateSharing: true,
                enablePerformanceMonitoring: this.options.enablePerformanceOptimization
            });

            console.log('[StateManagementIntegration] Component integration initialized');
        } catch (error) {
            console.error('[StateManagementIntegration] Failed to initialize component integration:', error);
            // Continue initialization without component integration
        }
    }

    /**
     * Initialize advanced features
     */
    async initializeAdvancedFeatures() {
        console.log('[StateManagementIntegration] Initializing advanced features...');

        // Check if AdvancedStateFeatures is available
        if (typeof AdvancedStateFeatures === 'undefined') {
            console.warn('[StateManagementIntegration] AdvancedStateFeatures not available, skipping advanced features');
            return;
        }

        try {
            this.advancedFeatures = new AdvancedStateFeatures(this.stateStore, {
                enableHistory: this.options.enableHistory,
                enableAnalytics: this.options.enableAnalytics,
                enableMonitoring: this.options.enableMonitoring,
                enablePerformanceTracking: this.options.enablePerformanceOptimization,
                enableMemoryTracking: this.options.enableMemoryOptimization
            });

            console.log('[StateManagementIntegration] Advanced features initialized');
        } catch (error) {
            console.error('[StateManagementIntegration] Failed to initialize advanced features:', error);
            // Continue initialization without advanced features
        }
    }

    /**
     * Apply middleware to state store
     */
    applyMiddlewareToStore() {
        // Get middleware stack
        const middlewareStack = this.stateMiddleware.getMiddlewareStack();
        
        // Apply each middleware to the store
        for (const middleware of middlewareStack) {
            this.stateStore.addMiddleware(middleware);
        }
    }

    /**
     * Setup WebSocket event handlers
     */
    setupWebSocketEventHandlers() {
        this.websocketClient.on('connected', () => {
            this.integrationState.connected = true;
            this.emit('realTimeConnected', { timestamp: Date.now() });
        });
        
        this.websocketClient.on('disconnected', () => {
            this.integrationState.connected = false;
            this.emit('realTimeDisconnected', { timestamp: Date.now() });
        });
        
        this.websocketClient.on('message', (message) => {
            this.handleWebSocketMessage(message);
        });
        
        this.websocketClient.on('error', (error) => {
            this.integrationState.lastError = error.message;
            this.integrationState.errorCount++;
            this.emit('realTimeError', { error, timestamp: Date.now() });
        });
    }

    /**
     * Setup sync manager integration
     */
    setupSyncManagerIntegration() {
        // Set state store in sync manager
        this.syncManager.setStateStore(this.stateStore);
        
        // Set conflict resolver in sync manager
        this.syncManager.conflictResolver = this.conflictResolver;
        
        // Setup sync event handlers
        this.syncManager.on('syncUpdate', (update) => {
            this.handleSyncUpdate(update);
        });
        
        this.syncManager.on('conflictDetected', (conflict) => {
            this.handleConflictDetected(conflict);
        });
        
        this.syncManager.on('statusUpdate', (status) => {
            this.integrationState.syncing = status.isSyncing;
            this.integrationState.lastSync = status.lastSync;
            this.emit('syncStatusUpdate', status);
        });
    }

    /**
     * Setup cross-component integration
     */
    setupCrossComponentIntegration() {
        // Setup state store integration with other components
        this.stateStore.subscribe((newState, previousState, action) => {
            // Notify component integration
            if (this.componentIntegration) {
                this.componentIntegration.handleStateChange(newState, previousState, action);
            }
            
            // Notify sync manager
            if (this.syncManager && this.integrationState.connected) {
                this.syncManager.handleStateChange(newState, previousState, action);
            }
            
            // Emit global state change event
            this.emit('stateChange', {
                newState,
                previousState,
                action,
                timestamp: Date.now()
            });
        });
        
        // Setup error handling
        this.setupErrorHandling();
    }

    /**
     * Setup error handling
     */
    setupErrorHandling() {
        // Handle state store errors
        if (this.stateStore) {
            this.stateStore.subscribe((newState, previousState, action) => {
                // Check for errors in state
                if (newState.app && newState.app.error) {
                    this.handleError(newState.app.error, 'stateStore');
                }
            });
        }
        
        // Handle WebSocket errors
        if (this.websocketClient) {
            this.websocketClient.on('error', (error) => {
                this.handleError(error, 'websocket');
            });
        }
        
        // Handle sync manager errors
        if (this.syncManager) {
            this.syncManager.on('error', (error) => {
                this.handleError(error, 'syncManager');
            });
        }
    }

    /**
     * Handle WebSocket message
     */
    handleWebSocketMessage(message) {
        console.debug('[StateManagementIntegration] WebSocket message received:', message);
        
        // Route message to appropriate handler
        switch (message.type) {
            case 'state_update':
                this.handleRemoteStateUpdate(message);
                break;
            case 'conflict':
                this.handleRemoteConflict(message);
                break;
            default:
                console.warn(`[StateManagementIntegration] Unknown WebSocket message type: ${message.type}`);
        }
    }

    /**
     * Handle sync update
     */
    handleSyncUpdate(update) {
        console.debug('[StateManagementIntegration] Sync update received:', update);
        
        // Apply update to state store
        for (const [key, value] of Object.entries(update.changes || {})) {
            this.stateStore.dispatch({
                type: 'SYNC_UPDATE',
                payload: { key, value, source: 'remote' }
            });
        }
        
        this.emit('syncUpdate', update);
    }

    /**
     * Handle conflict detected
     */
    handleConflictDetected(conflict) {
        console.warn('[StateManagementIntegration] Conflict detected:', conflict);
        
        // Attempt to resolve conflict
        if (this.conflictResolver) {
            this.conflictResolver.resolve(conflict)
                .then(resolution => {
                    console.log('[StateManagementIntegration] Conflict resolved:', resolution);
                    this.emit('conflictResolved', { conflict, resolution });
                })
                .catch(error => {
                    console.error('[StateManagementIntegration] Conflict resolution failed:', error);
                    this.emit('conflictResolutionFailed', { conflict, error });
                });
        }
        
        this.emit('conflictDetected', conflict);
    }

    /**
     * Handle remote state update
     */
    handleRemoteStateUpdate(message) {
        const { payload } = message;
        
        // Apply remote state update
        this.stateStore.dispatch({
            type: 'REMOTE_STATE_UPDATE',
            payload: {
                changes: payload.changes,
                source: 'remote',
                timestamp: payload.timestamp
            }
        });
    }

    /**
     * Handle remote conflict
     */
    handleRemoteConflict(message) {
        const { payload } = message;
        
        // Add conflict to conflict resolver
        if (this.conflictResolver) {
            this.conflictResolver.resolve(payload)
                .then(resolution => {
                    // Send resolution back
                    if (this.websocketClient) {
                        this.websocketClient.send({
                            type: 'conflict_resolution',
                            payload: {
                                conflictId: payload.id,
                                resolution
                            }
                        });
                    }
                })
                .catch(error => {
                    console.error('[StateManagementIntegration] Remote conflict resolution failed:', error);
                });
        }
    }

    /**
     * Handle error
     */
    handleError(error, source) {
        console.error(`[StateManagementIntegration] Error in ${source}:`, error);
        
        this.integrationState.lastError = error.message || error;
        this.integrationState.errorCount++;
        
        this.emit('error', {
            error,
            source,
            timestamp: Date.now()
        });
    }

    /**
     * Public API methods
     */

    /**
     * Get state store
     */
    getStateStore() {
        return this.stateStore;
    }

    /**
     * Get state actions
     */
    getStateActions() {
        return this.stateActions;
    }

    /**
     * Get sync manager
     */
    getSyncManager() {
        return this.syncManager;
    }

    /**
     * Get component integration
     */
    getComponentIntegration() {
        return this.componentIntegration;
    }

    /**
     * Get advanced features
     */
    getAdvancedFeatures() {
        return this.advancedFeatures;
    }

    /**
     * Get integration status
     */
    getStatus() {
        return {
            ...this.integrationState,
            isInitialized: this.isInitialized,
            isDestroyed: this.isDestroyed,
            components: {
                stateStore: !!this.stateStore,
                stateActions: !!this.stateActions,
                stateMiddleware: !!this.stateMiddleware,
                statePersistence: !!this.statePersistence,
                syncManager: !!this.syncManager,
                websocketClient: !!this.websocketClient,
                conflictResolver: !!this.conflictResolver,
                componentIntegration: !!this.componentIntegration,
                advancedFeatures: !!this.advancedFeatures
            }
        };
    }

    /**
     * Get comprehensive metrics
     */
    getMetrics() {
        const metrics = {
            integration: this.getStatus(),
            stateStore: this.stateStore ? this.stateStore.getPerformanceMetrics() : null,
            syncManager: this.syncManager ? this.syncManager.getMetrics() : null,
            websocketClient: this.websocketClient ? this.websocketClient.getMetrics() : null,
            conflictResolver: this.conflictResolver ? this.conflictResolver.getMetrics() : null,
            componentIntegration: this.componentIntegration ? this.componentIntegration.getMetrics() : null,
            advancedFeatures: this.advancedFeatures ? this.advancedFeatures.getMetrics() : null,
            statePersistence: this.statePersistence ? this.statePersistence.getMetrics() : null
        };
        
        return metrics;
    }

    /**
     * Export all data
     */
    async exportData() {
        const exportData = {
            timestamp: Date.now(),
            version: '1.0.0',
            status: this.getStatus(),
            metrics: this.getMetrics(),
            state: this.stateStore ? this.stateStore.getState() : null,
            history: this.advancedFeatures ? this.advancedFeatures.getStateHistory() : null,
            analytics: this.advancedFeatures ? this.advancedFeatures.getAnalyticsEvents() : null
        };
        
        return JSON.stringify(exportData, null, 2);
    }

    /**
     * Import data
     */
    async importData(data) {
        try {
            const importData = typeof data === 'string' ? JSON.parse(data) : data;
            
            // Import state
            if (importData.state && this.stateStore) {
                this.stateStore.dispatch({
                    type: 'IMPORT_STATE',
                    payload: { state: importData.state }
                });
            }
            
            console.log('[StateManagementIntegration] Data imported successfully');
            this.emit('dataImported', { timestamp: Date.now() });
            
        } catch (error) {
            console.error('[StateManagementIntegration] Data import failed:', error);
            throw error;
        }
    }

    /**
     * Event handling
     */
    on(event, callback) {
        if (!this.eventListeners.has(event)) {
            this.eventListeners.set(event, []);
        }
        this.eventListeners.get(event).push(callback);
    }

    off(event, callback) {
        if (this.eventListeners.has(event)) {
            const listeners = this.eventListeners.get(event);
            const index = listeners.indexOf(callback);
            if (index > -1) {
                listeners.splice(index, 1);
            }
        }
    }

    emit(event, data) {
        if (this.eventListeners.has(event)) {
            this.eventListeners.get(event).forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error(`[StateManagementIntegration] Error in event listener for ${event}:`, error);
                }
            });
        }
    }

    /**
     * Destroy the integration system
     */
    destroy() {
        if (this.isDestroyed) {
            return;
        }
        
        console.log('[StateManagementIntegration] Destroying...');
        
        // Destroy components in reverse order
        if (this.advancedFeatures) {
            this.advancedFeatures.destroy();
        }
        
        if (this.componentIntegration) {
            this.componentIntegration.destroy();
        }
        
        if (this.syncManager) {
            this.syncManager.destroy();
        }
        
        if (this.websocketClient) {
            this.websocketClient.destroy();
        }
        
        if (this.conflictResolver) {
            this.conflictResolver.destroy();
        }
        
        if (this.statePersistence) {
            this.statePersistence.destroy();
        }
        
        if (this.stateStore) {
            this.stateStore.destroy();
        }
        
        // Clear event listeners
        this.eventListeners.clear();
        
        // Reset state
        this.isInitialized = false;
        this.isDestroyed = true;
        
        console.log('[StateManagementIntegration] Destroyed');
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = StateManagementIntegration;
} else if (typeof window !== 'undefined') {
    window.StateManagementIntegration = StateManagementIntegration;
}