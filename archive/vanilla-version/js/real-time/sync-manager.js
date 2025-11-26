/**
 * Real-Time Synchronization Manager
 * Handles WebSocket-based real-time data synchronization with conflict resolution
 */

class SyncManager {
    constructor(options = {}) {
        this.websocket = null;
        this.isConnected = false;
        this.isReconnecting = false;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = options.maxReconnectAttempts || 10;
        this.reconnectDelay = options.reconnectDelay || 1000;
        this.reconnectBackoffMultiplier = options.reconnectBackoffMultiplier || 1.5;
        
        this.syncQueue = [];
        this.isProcessingQueue = false;
        this.maxQueueSize = options.maxQueueSize || 1000;
        
        this.eventListeners = new Map();
        this.conflictResolver = null;
        this.stateStore = null;
        
        this.syncStatus = {
            isOnline: false,
            isSyncing: false,
            lastSync: null,
            pendingOperations: 0,
            conflicts: [],
            errors: []
        };
        
        this.performanceMetrics = {
            messagesSent: 0,
            messagesReceived: 0,
            totalLatency: 0,
            averageLatency: 0,
            connectionUptime: 0,
            lastConnectionTime: null
        };
        
        this.clientId = this.generateClientId();
        this.sessionId = this.generateSessionId();
        
        // Initialize heartbeat
        this.heartbeatInterval = options.heartbeatInterval || 30000;
        this.heartbeatTimer = null;
        
        // Initialize conflict resolver
        this.initializeConflictResolver();
    }

    /**
     * Initialize connection to WebSocket server
     */
    async connect(url, options = {}) {
        try {
            if (this.websocket && this.isConnected) {
                console.warn('[SyncManager] Already connected');
                return;
            }

            console.log(`[SyncManager] Connecting to: ${url}`);
            
            this.websocket = new WebSocket(url);
            this.setupWebSocketHandlers();
            
            // Wait for connection
            await new Promise((resolve, reject) => {
                const timeout = setTimeout(() => {
                    reject(new Error('Connection timeout'));
                }, options.connectionTimeout || 10000);

                this.websocket.onopen = () => {
                    clearTimeout(timeout);
                    this.onConnectionOpen();
                    resolve();
                };

                this.websocket.onerror = (error) => {
                    clearTimeout(timeout);
                    reject(error);
                };
            });

        } catch (error) {
            console.error('[SyncManager] Connection failed:', error);
            this.handleConnectionError(error);
            throw error;
        }
    }

    /**
     * Disconnect from WebSocket server
     */
    disconnect() {
        if (this.heartbeatTimer) {
            clearInterval(this.heartbeatTimer);
            this.heartbeatTimer = null;
        }

        if (this.websocket) {
            this.websocket.close();
            this.websocket = null;
        }

        this.isConnected = false;
        this.isReconnecting = false;
        this.updateSyncStatus({ isOnline: false });
        
        console.log('[SyncManager] Disconnected');
    }

    /**
     * Setup WebSocket event handlers
     */
    setupWebSocketHandlers() {
        this.websocket.onopen = () => this.onConnectionOpen();
        this.websocket.onclose = (event) => this.onConnectionClose(event);
        this.websocket.onerror = (error) => this.onConnectionError(error);
        this.websocket.onmessage = (event) => this.onMessageReceived(event);
    }

    /**
     * Handle connection open
     */
    onConnectionOpen() {
        console.log('[SyncManager] Connection established');
        
        this.isConnected = true;
        this.isReconnecting = false;
        this.reconnectAttempts = 0;
        
        this.updateSyncStatus({ isOnline: true });
        this.updatePerformanceMetrics({ lastConnectionTime: Date.now() });
        
        // Start heartbeat
        this.startHeartbeat();
        
        // Send client identification
        this.sendMessage({
            type: 'CLIENT_IDENTIFICATION',
            payload: {
                clientId: this.clientId,
                sessionId: this.sessionId,
                timestamp: Date.now(),
                userAgent: navigator.userAgent,
                capabilities: this.getClientCapabilities()
            }
        });
        
        // Process sync queue
        this.processSyncQueue();
        
        // Emit connection event
        this.emit('connected', {
            clientId: this.clientId,
            sessionId: this.sessionId
        });
    }

    /**
     * Handle connection close
     */
    onConnectionClose(event) {
        console.log(`[SyncManager] Connection closed: ${event.code} - ${event.reason}`);
        
        this.isConnected = false;
        this.updateSyncStatus({ isOnline: false });
        
        // Stop heartbeat
        if (this.heartbeatTimer) {
            clearInterval(this.heartbeatTimer);
            this.heartbeatTimer = null;
        }
        
        // Emit disconnection event
        this.emit('disconnected', {
            code: event.code,
            reason: event.reason,
            wasClean: event.wasClean
        });
        
        // Attempt reconnection if not intentional
        if (!event.wasClean && !this.isReconnecting) {
            this.attemptReconnection();
        }
    }

    /**
     * Handle connection error
     */
    onConnectionError(error) {
        console.error('[SyncManager] Connection error:', error);
        this.handleConnectionError(error);
    }

    /**
     * Handle message received
     */
    onMessageReceived(event) {
        try {
            const message = JSON.parse(event.data);
            this.updatePerformanceMetrics({ 
                messagesReceived: this.performanceMetrics.messagesReceived + 1 
            });
            
            // Calculate latency if timestamp is present
            if (message.timestamp) {
                const latency = Date.now() - message.timestamp;
                this.updateLatencyMetrics(latency);
            }
            
            console.debug('[SyncManager] Message received:', message);
            
            // Route message to appropriate handler
            this.routeMessage(message);
            
        } catch (error) {
            console.error('[SyncManager] Failed to parse message:', error);
        }
    }

    /**
     * Route incoming message to appropriate handler
     */
    routeMessage(message) {
        const handlers = {
            'SYNC_UPDATE': this.handleSyncUpdate.bind(this),
            'SYNC_RESPONSE': this.handleSyncResponse.bind(this),
            'CONFLICT_DETECTED': this.handleConflictDetected.bind(this),
            'CONFLICT_RESOLVED': this.handleConflictResolved.bind(this),
            'USER_CONNECTED': this.handleUserConnected.bind(this),
            'USER_DISCONNECTED': this.handleUserDisconnected.bind(this),
            'HEARTBEAT': this.handleHeartbeat.bind(this),
            'ERROR': this.handleError.bind(this),
            'PRESENCE_UPDATE': this.handlePresenceUpdate.bind(this),
            'COLLABORATION_EVENT': this.handleCollaborationEvent.bind(this)
        };
        
        const handler = handlers[message.type];
        if (handler) {
            handler(message);
        } else {
            console.warn(`[SyncManager] Unknown message type: ${message.type}`);
        }
    }

    /**
     * Send message to server
     */
    sendMessage(message) {
        if (!this.isConnected || !this.websocket) {
            console.warn('[SyncManager] Cannot send message - not connected');
            this.addToSyncQueue(message);
            return false;
        }

        try {
            const messageWithTimestamp = {
                ...message,
                timestamp: Date.now(),
                clientId: this.clientId,
                sessionId: this.sessionId
            };

            this.websocket.send(JSON.stringify(messageWithTimestamp));
            
            this.updatePerformanceMetrics({ 
                messagesSent: this.performanceMetrics.messagesSent + 1 
            });
            
            console.debug('[SyncManager] Message sent:', messageWithTimestamp);
            return true;
            
        } catch (error) {
            console.error('[SyncManager] Failed to send message:', error);
            this.addToSyncQueue(message);
            return false;
        }
    }

    /**
     * Add message to sync queue
     */
    addToSyncQueue(message) {
        if (this.syncQueue.length >= this.maxQueueSize) {
            console.warn('[SyncManager] Sync queue full, dropping oldest message');
            this.syncQueue.shift();
        }
        
        this.syncQueue.push({
            ...message,
            queuedAt: Date.now(),
            retryCount: 0
        });
        
        this.updateSyncStatus({ 
            pendingOperations: this.syncQueue.length 
        });
    }

    /**
     * Process sync queue
     */
    async processSyncQueue() {
        if (this.isProcessingQueue || this.syncQueue.length === 0) {
            return;
        }

        this.isProcessingQueue = true;
        this.updateSyncStatus({ isSyncing: true });

        try {
            while (this.syncQueue.length > 0 && this.isConnected) {
                const message = this.syncQueue.shift();
                
                // Check if message is too old
                const maxAge = 5 * 60 * 1000; // 5 minutes
                if (Date.now() - message.queuedAt > maxAge) {
                    console.warn('[SyncManager] Dropping old message from queue');
                    continue;
                }
                
                // Send message
                const sent = this.sendMessage(message);
                if (!sent) {
                    // Put message back at front of queue
                    this.syncQueue.unshift(message);
                    break;
                }
                
                // Small delay between messages
                await new Promise(resolve => setTimeout(resolve, 10));
            }
        } finally {
            this.isProcessingQueue = false;
            this.updateSyncStatus({ 
                isSyncing: false,
                pendingOperations: this.syncQueue.length 
            });
        }
    }

    /**
     * Handle sync update from server
     */
    handleSyncUpdate(message) {
        const { payload } = message;
        
        console.log('[SyncManager] Sync update received:', payload);
        
        // Apply update to state store
        if (this.stateStore) {
            try {
                // Check for conflicts
                const conflict = this.detectConflict(payload);
                if (conflict) {
                    this.handleConflictDetected({
                        type: 'CONFLICT_DETECTED',
                        payload: conflict
                    });
                    return;
                }
                
                // Apply update
                this.applySyncUpdate(payload);
                
                // Update sync status
                this.updateSyncStatus({ 
                    lastSync: Date.now(),
                    pendingOperations: Math.max(0, this.syncStatus.pendingOperations - 1)
                });
                
            } catch (error) {
                console.error('[SyncManager] Failed to apply sync update:', error);
                this.handleSyncError(error, payload);
            }
        }
        
        // Emit sync event
        this.emit('syncUpdate', payload);
    }

    /**
     * Handle sync response from server
     */
    handleSyncResponse(message) {
        const { payload } = message;
        
        console.log('[SyncManager] Sync response received:', payload);
        
        // Update sync status
        this.updateSyncStatus({ 
            lastSync: Date.now(),
            pendingOperations: Math.max(0, this.syncStatus.pendingOperations - 1)
        });
        
        // Emit response event
        this.emit('syncResponse', payload);
    }

    /**
     * Handle conflict detected
     */
    handleConflictDetected(message) {
        const { payload } = message;
        
        console.warn('[SyncManager] Conflict detected:', payload);
        
        // Add to conflicts list
        this.syncStatus.conflicts.push({
            ...payload,
            detectedAt: Date.now(),
            status: 'pending'
        });
        
        // Attempt to resolve conflict
        if (this.conflictResolver) {
            this.resolveConflict(payload);
        }
        
        // Emit conflict event
        this.emit('conflictDetected', payload);
    }

    /**
     * Handle conflict resolved
     */
    handleConflictResolved(message) {
        const { payload } = message;
        
        console.log('[SyncManager] Conflict resolved:', payload);
        
        // Update conflicts list
        this.syncStatus.conflicts = this.syncStatus.conflicts.map(conflict =>
            conflict.id === payload.conflictId
                ? { ...conflict, status: 'resolved', resolution: payload.resolution, resolvedAt: Date.now() }
                : conflict
        );
        
        // Emit resolution event
        this.emit('conflictResolved', payload);
    }

    /**
     * Handle user connected
     */
    handleUserConnected(message) {
        const { payload } = message;
        
        console.log('[SyncManager] User connected:', payload);
        
        // Emit user connected event
        this.emit('userConnected', payload);
    }

    /**
     * Handle user disconnected
     */
    handleUserDisconnected(message) {
        const { payload } = message;
        
        console.log('[SyncManager] User disconnected:', payload);
        
        // Emit user disconnected event
        this.emit('userDisconnected', payload);
    }

    /**
     * Handle heartbeat
     */
    handleHeartbeat(message) {
        console.debug('[SyncManager] Heartbeat received');
        
        // Send heartbeat response
        this.sendMessage({
            type: 'HEARTBEAT_RESPONSE',
            payload: {
                timestamp: Date.now()
            }
        });
    }

    /**
     * Handle error message
     */
    handleError(message) {
        const { payload } = message;
        
        console.error('[SyncManager] Server error:', payload);
        
        // Add to errors list
        this.syncStatus.errors.push({
            ...payload,
            timestamp: Date.now()
        });
        
        // Emit error event
        this.emit('error', payload);
    }

    /**
     * Handle presence update
     */
    handlePresenceUpdate(message) {
        const { payload } = message;
        
        console.debug('[SyncManager] Presence update:', payload);
        
        // Emit presence event
        this.emit('presenceUpdate', payload);
    }

    /**
     * Handle collaboration event
     */
    handleCollaborationEvent(message) {
        const { payload } = message;
        
        console.debug('[SyncManager] Collaboration event:', payload);
        
        // Emit collaboration event
        this.emit('collaborationEvent', payload);
    }

    /**
     * Attempt reconnection
     */
    async attemptReconnection() {
        if (this.isReconnecting || this.reconnectAttempts >= this.maxReconnectAttempts) {
            console.log('[SyncManager] Max reconnection attempts reached');
            return;
        }

        this.isReconnecting = true;
        this.reconnectAttempts++;
        
        const delay = this.reconnectDelay * Math.pow(this.reconnectBackoffMultiplier, this.reconnectAttempts - 1);
        
        console.log(`[SyncManager] Attempting reconnection ${this.reconnectAttempts}/${this.maxReconnectAttempts} in ${delay}ms`);
        
        await new Promise(resolve => setTimeout(resolve, delay));
        
        try {
            // Reconnect to original URL
            const originalUrl = this.websocket.url.replace('ws://', 'http://').replace('wss://', 'https://');
            await this.connect(originalUrl.replace('http://', 'ws://').replace('https://', 'wss://'));
        } catch (error) {
            console.error('[SyncManager] Reconnection failed:', error);
            this.isReconnecting = false;
            
            // Continue attempting reconnection
            if (this.reconnectAttempts < this.maxReconnectAttempts) {
                setTimeout(() => this.attemptReconnection(), delay);
            }
        }
    }

    /**
     * Start heartbeat
     */
    startHeartbeat() {
        if (this.heartbeatTimer) {
            clearInterval(this.heartbeatTimer);
        }
        
        this.heartbeatTimer = setInterval(() => {
            if (this.isConnected) {
                this.sendMessage({
                    type: 'HEARTBEAT',
                    payload: {
                        timestamp: Date.now()
                    }
                });
            }
        }, this.heartbeatInterval);
    }

    /**
     * Detect conflict between local and remote state
     */
    detectConflict(remoteUpdate) {
        if (!this.stateStore) {
            return null;
        }
        
        const currentState = this.stateStore.getState();
        const localVersion = this.getVersionFromState(currentState);
        const remoteVersion = remoteUpdate.version;
        
        if (localVersion && remoteVersion && localVersion !== remoteVersion) {
            return {
                type: 'version_conflict',
                localVersion,
                remoteVersion,
                localState: currentState,
                remoteUpdate
            };
        }
        
        return null;
    }

    /**
     * Apply sync update to state store
     */
    applySyncUpdate(update) {
        if (!this.stateStore) {
            return;
        }
        
        // Apply update using state store
        for (const [key, value] of Object.entries(update.changes || {})) {
            this.stateStore.dispatch({
                type: 'SYNC_UPDATE',
                payload: {
                    key,
                    value,
                    source: 'remote'
                }
            });
        }
    }

    /**
     * Resolve conflict
     */
    async resolveConflict(conflict) {
        if (!this.conflictResolver) {
            console.warn('[SyncManager] No conflict resolver available');
            return;
        }
        
        try {
            const resolution = await this.conflictResolver.resolve(conflict);
            
            // Send resolution to server
            this.sendMessage({
                type: 'CONFLICT_RESOLUTION',
                payload: {
                    conflictId: conflict.id,
                    resolution
                }
            });
            
        } catch (error) {
            console.error('[SyncManager] Failed to resolve conflict:', error);
        }
    }

    /**
     * Initialize conflict resolver
     */
    initializeConflictResolver() {
        // Import ConflictResolver if available
        if (typeof ConflictResolver !== 'undefined') {
            this.conflictResolver = new ConflictResolver({
                strategy: 'last-write-wins',
                autoResolve: true
            });
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
                    console.error(`[SyncManager] Error in event listener for ${event}:`, error);
                }
            });
        }
    }

    /**
     * Utility methods
     */
    generateClientId() {
        return `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    generateSessionId() {
        return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    getClientCapabilities() {
        return {
            conflictResolution: true,
            realTimeSync: true,
            collaboration: true,
            version: '1.0.0'
        };
    }

    getVersionFromState(state) {
        return state.meta?.version || null;
    }

    updateSyncStatus(updates) {
        this.syncStatus = { ...this.syncStatus, ...updates };
        this.emit('statusUpdate', this.syncStatus);
    }

    updatePerformanceMetrics(updates) {
        this.performanceMetrics = { ...this.performanceMetrics, ...updates };
    }

    updateLatencyMetrics(latency) {
        this.performanceMetrics.totalLatency += latency;
        this.performanceMetrics.averageLatency = 
            this.performanceMetrics.totalLatency / this.performanceMetrics.messagesReceived;
    }

    handleConnectionError(error) {
        this.updateSyncStatus({ 
            isOnline: false,
            errors: [...this.syncStatus.errors, {
                type: 'connection_error',
                message: error.message,
                timestamp: Date.now()
            }]
        });
        
        this.emit('connectionError', error);
    }

    handleSyncError(error, payload) {
        this.updateSyncStatus({ 
            errors: [...this.syncStatus.errors, {
                type: 'sync_error',
                message: error.message,
                payload,
                timestamp: Date.now()
            }]
        });
        
        this.emit('syncError', { error, payload });
    }

    /**
     * Get sync status
     */
    getStatus() {
        return {
            ...this.syncStatus,
            isConnected: this.isConnected,
            isReconnecting: this.isReconnecting,
            reconnectAttempts: this.reconnectAttempts,
            queueSize: this.syncQueue.length
        };
    }

    /**
     * Get performance metrics
     */
    getMetrics() {
        return {
            ...this.performanceMetrics,
            connectionUptime: this.isConnected ? 
                Date.now() - (this.performanceMetrics.lastConnectionTime || Date.now()) : 
                this.performanceMetrics.connectionUptime
        };
    }

    /**
     * Set state store
     */
    setStateStore(store) {
        this.stateStore = store;
    }

    /**
     * Destroy sync manager
     */
    destroy() {
        this.disconnect();
        this.eventListeners.clear();
        this.syncQueue = [];
        this.conflictResolver = null;
        this.stateStore = null;
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SyncManager;
} else if (typeof window !== 'undefined') {
    window.SyncManager = SyncManager;
}