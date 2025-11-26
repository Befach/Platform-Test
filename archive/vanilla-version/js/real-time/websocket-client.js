/**
 * WebSocket Client for Real-Time Communication
 * Advanced WebSocket client with reconnection, message queuing, and protocol support
 */

class WebSocketClient {
    constructor(options = {}) {
        this.url = options.url;
        this.protocols = options.protocols || [];
        this.options = {
            reconnect: options.reconnect !== false,
            maxReconnectAttempts: options.maxReconnectAttempts || 10,
            reconnectDelay: options.reconnectDelay || 1000,
            reconnectBackoffMultiplier: options.reconnectBackoffMultiplier || 1.5,
            connectionTimeout: options.connectionTimeout || 10000,
            heartbeatInterval: options.heartbeatInterval || 30000,
            maxMessageSize: options.maxMessageSize || 1024 * 1024, // 1MB
            enableCompression: options.enableCompression !== false,
            messageQueueSize: options.messageQueueSize || 1000,
            ...options
        };
        
        this.websocket = null;
        this.isConnected = false;
        this.isConnecting = false;
        this.isReconnecting = false;
        this.reconnectAttempts = 0;
        this.connectionStartTime = null;
        
        this.messageQueue = [];
        this.eventListeners = new Map();
        this.messageHandlers = new Map();
        
        this.metrics = {
            connectionsAttempted: 0,
            connectionsSuccessful: 0,
            connectionsFailed: 0,
            messagesSent: 0,
            messagesReceived: 0,
            totalBytesReceived: 0,
            totalBytesSent: 0,
            averageLatency: 0,
            totalLatency: 0,
            connectionUptime: 0,
            lastConnectionTime: null,
            lastDisconnectionTime: null
        };
        
        this.heartbeatTimer = null;
        this.heartbeatTimeout = null;
        this.lastHeartbeatSent = null;
        this.lastHeartbeatReceived = null;
        
        this.protocolVersion = '1.0.0';
        this.clientId = this.generateClientId();
        this.sessionId = this.generateSessionId();
        
        // Initialize message handlers
        this.initializeMessageHandlers();
    }

    /**
     * Connect to WebSocket server
     */
    async connect(url = null, protocols = null) {
        if (this.isConnected || this.isConnecting) {
            console.warn('[WebSocketClient] Already connected or connecting');
            return;
        }

        const targetUrl = url || this.url;
        if (!targetUrl) {
            throw new Error('WebSocket URL is required');
        }

        const targetProtocols = protocols || this.protocols;
        
        try {
            this.isConnecting = true;
            this.connectionStartTime = Date.now();
            this.metrics.connectionsAttempted++;
            
            console.log(`[WebSocketClient] Connecting to: ${targetUrl}`);
            
            // Create WebSocket connection
            this.websocket = new WebSocket(targetUrl, targetProtocols);
            this.setupWebSocketHandlers();
            
            // Wait for connection
            await new Promise((resolve, reject) => {
                const timeout = setTimeout(() => {
                    this.isConnecting = false;
                    reject(new Error('Connection timeout'));
                }, this.options.connectionTimeout);

                this.websocket.onopen = () => {
                    clearTimeout(timeout);
                    this.onConnectionOpen();
                    resolve();
                };

                this.websocket.onerror = (error) => {
                    clearTimeout(timeout);
                    this.isConnecting = false;
                    reject(error);
                };
            });

        } catch (error) {
            this.isConnecting = false;
            this.metrics.connectionsFailed++;
            console.error('[WebSocketClient] Connection failed:', error);
            this.handleConnectionError(error);
            throw error;
        }
    }

    /**
     * Disconnect from WebSocket server
     */
    disconnect(code = 1000, reason = 'Client disconnect') {
        if (this.heartbeatTimer) {
            clearInterval(this.heartbeatTimer);
            this.heartbeatTimer = null;
        }
        
        if (this.heartbeatTimeout) {
            clearTimeout(this.heartbeatTimeout);
            this.heartbeatTimeout = null;
        }

        if (this.websocket) {
            this.websocket.close(code, reason);
            this.websocket = null;
        }

        this.isConnected = false;
        this.isConnecting = false;
        this.isReconnecting = false;
        this.metrics.lastDisconnectionTime = Date.now();
        
        console.log('[WebSocketClient] Disconnected');
        this.emit('disconnected', { code, reason });
    }

    /**
     * Setup WebSocket event handlers
     */
    setupWebSocketHandlers() {
        this.websocket.onopen = (event) => this.onConnectionOpen(event);
        this.websocket.onclose = (event) => this.onConnectionClose(event);
        this.websocket.onerror = (event) => this.onConnectionError(event);
        this.websocket.onmessage = (event) => this.onMessageReceived(event);
    }

    /**
     * Handle connection open
     */
    onConnectionOpen(event) {
        console.log('[WebSocketClient] Connection established');
        
        this.isConnected = true;
        this.isConnecting = false;
        this.isReconnecting = false;
        this.reconnectAttempts = 0;
        
        this.metrics.connectionsSuccessful++;
        this.metrics.lastConnectionTime = Date.now();
        
        // Start heartbeat
        this.startHeartbeat();
        
        // Send client identification
        this.sendIdentification();
        
        // Process message queue
        this.processMessageQueue();
        
        // Emit connection event
        this.emit('connected', {
            url: this.websocket.url,
            protocols: this.websocket.protocol,
            clientId: this.clientId,
            sessionId: this.sessionId
        });
    }

    /**
     * Handle connection close
     */
    onConnectionClose(event) {
        console.log(`[WebSocketClient] Connection closed: ${event.code} - ${event.reason}`);
        
        this.isConnected = false;
        this.isConnecting = false;
        this.metrics.lastDisconnectionTime = Date.now();
        
        // Update connection uptime
        if (this.metrics.lastConnectionTime) {
            this.metrics.connectionUptime += Date.now() - this.metrics.lastConnectionTime;
        }
        
        // Stop heartbeat
        this.stopHeartbeat();
        
        // Emit disconnection event
        this.emit('disconnected', {
            code: event.code,
            reason: event.reason,
            wasClean: event.wasClean
        });
        
        // Attempt reconnection if enabled and not intentional
        if (this.options.reconnect && !event.wasClean && !this.isReconnecting) {
            this.attemptReconnection();
        }
    }

    /**
     * Handle connection error
     */
    onConnectionError(event) {
        console.error('[WebSocketClient] Connection error:', event);
        this.handleConnectionError(event);
    }

    /**
     * Handle message received
     */
    onMessageReceived(event) {
        try {
            // Check message size
            if (event.data.size > this.options.maxMessageSize) {
                console.warn('[WebSocketClient] Message too large, ignoring');
                return;
            }
            
            // Update metrics
            this.metrics.messagesReceived++;
            this.metrics.totalBytesReceived += event.data.size || event.data.length;
            
            // Parse message
            const message = this.parseMessage(event.data);
            if (!message) {
                return;
            }
            
            // Calculate latency if timestamp is present
            if (message.timestamp) {
                const latency = Date.now() - message.timestamp;
                this.updateLatencyMetrics(latency);
            }
            
            console.debug('[WebSocketClient] Message received:', message);
            
            // Route to appropriate handler
            this.routeMessage(message);
            
        } catch (error) {
            console.error('[WebSocketClient] Failed to process message:', error);
            this.emit('messageError', { error, data: event.data });
        }
    }

    /**
     * Send message to server
     */
    send(message) {
        if (!this.isConnected || !this.websocket) {
            console.warn('[WebSocketClient] Cannot send message - not connected');
            this.addToMessageQueue(message);
            return false;
        }

        try {
            // Prepare message
            const preparedMessage = this.prepareMessage(message);
            
            // Check message size
            const messageSize = this.getMessageSize(preparedMessage);
            if (messageSize > this.options.maxMessageSize) {
                console.error('[WebSocketClient] Message too large');
                return false;
            }
            
            // Send message
            this.websocket.send(preparedMessage);
            
            // Update metrics
            this.metrics.messagesSent++;
            this.metrics.totalBytesSent += messageSize;
            
            console.debug('[WebSocketClient] Message sent:', message);
            return true;
            
        } catch (error) {
            console.error('[WebSocketClient] Failed to send message:', error);
            this.addToMessageQueue(message);
            return false;
        }
    }

    /**
     * Send message with acknowledgment
     */
    async sendWithAck(message, timeout = 5000) {
        const messageId = this.generateMessageId();
        const messageWithId = {
            ...message,
            id: messageId,
            timestamp: Date.now()
        };
        
        return new Promise((resolve, reject) => {
            // Set up acknowledgment handler
            const ackHandler = (response) => {
                if (response.ackId === messageId) {
                    this.off('ack', ackHandler);
                    this.off('error', errorHandler);
                    resolve(response);
                }
            };
            
            const errorHandler = (error) => {
                if (error.messageId === messageId) {
                    this.off('ack', ackHandler);
                    this.off('error', errorHandler);
                    reject(error);
                }
            };
            
            this.on('ack', ackHandler);
            this.on('error', errorHandler);
            
            // Send message
            const sent = this.send(messageWithId);
            if (!sent) {
                this.off('ack', ackHandler);
                this.off('error', errorHandler);
                reject(new Error('Failed to send message'));
                return;
            }
            
            // Set timeout
            setTimeout(() => {
                this.off('ack', ackHandler);
                this.off('error', errorHandler);
                reject(new Error('Acknowledgment timeout'));
            }, timeout);
        });
    }

    /**
     * Add message to queue
     */
    addToMessageQueue(message) {
        if (this.messageQueue.length >= this.options.messageQueueSize) {
            console.warn('[WebSocketClient] Message queue full, dropping oldest message');
            this.messageQueue.shift();
        }
        
        this.messageQueue.push({
            ...message,
            queuedAt: Date.now(),
            retryCount: 0
        });
    }

    /**
     * Process message queue
     */
    async processMessageQueue() {
        if (this.messageQueue.length === 0) {
            return;
        }
        
        console.log(`[WebSocketClient] Processing ${this.messageQueue.length} queued messages`);
        
        while (this.messageQueue.length > 0 && this.isConnected) {
            const message = this.messageQueue.shift();
            
            // Check if message is too old
            const maxAge = 5 * 60 * 1000; // 5 minutes
            if (Date.now() - message.queuedAt > maxAge) {
                console.warn('[WebSocketClient] Dropping old message from queue');
                continue;
            }
            
            // Send message
            const sent = this.send(message);
            if (!sent) {
                // Put message back at front of queue
                this.messageQueue.unshift(message);
                break;
            }
            
            // Small delay between messages
            await new Promise(resolve => setTimeout(resolve, 10));
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
                this.sendHeartbeat();
            }
        }, this.options.heartbeatInterval);
    }

    /**
     * Stop heartbeat
     */
    stopHeartbeat() {
        if (this.heartbeatTimer) {
            clearInterval(this.heartbeatTimer);
            this.heartbeatTimer = null;
        }
        
        if (this.heartbeatTimeout) {
            clearTimeout(this.heartbeatTimeout);
            this.heartbeatTimeout = null;
        }
    }

    /**
     * Send heartbeat
     */
    sendHeartbeat() {
        this.lastHeartbeatSent = Date.now();
        
        const heartbeat = {
            type: 'heartbeat',
            timestamp: this.lastHeartbeatSent,
            clientId: this.clientId
        };
        
        this.send(heartbeat);
        
        // Set timeout for heartbeat response
        if (this.heartbeatTimeout) {
            clearTimeout(this.heartbeatTimeout);
        }
        
        this.heartbeatTimeout = setTimeout(() => {
            console.warn('[WebSocketClient] Heartbeat timeout');
            this.emit('heartbeatTimeout');
        }, this.options.heartbeatInterval * 0.8);
    }

    /**
     * Send client identification
     */
    sendIdentification() {
        const identification = {
            type: 'identification',
            clientId: this.clientId,
            sessionId: this.sessionId,
            protocolVersion: this.protocolVersion,
            capabilities: this.getClientCapabilities(),
            timestamp: Date.now()
        };
        
        this.send(identification);
    }

    /**
     * Attempt reconnection
     */
    async attemptReconnection() {
        if (this.isReconnecting || this.reconnectAttempts >= this.options.maxReconnectAttempts) {
            console.log('[WebSocketClient] Max reconnection attempts reached');
            return;
        }

        this.isReconnecting = true;
        this.reconnectAttempts++;
        
        const delay = this.options.reconnectDelay * 
                     Math.pow(this.options.reconnectBackoffMultiplier, this.reconnectAttempts - 1);
        
        console.log(`[WebSocketClient] Attempting reconnection ${this.reconnectAttempts}/${this.options.maxReconnectAttempts} in ${delay}ms`);
        
        this.emit('reconnecting', { attempt: this.reconnectAttempts, delay });
        
        await new Promise(resolve => setTimeout(resolve, delay));
        
        try {
            await this.connect();
        } catch (error) {
            console.error('[WebSocketClient] Reconnection failed:', error);
            this.isReconnecting = false;
            
            if (this.reconnectAttempts < this.options.maxReconnectAttempts) {
                setTimeout(() => this.attemptReconnection(), delay);
            } else {
                this.emit('reconnectionFailed', { attempts: this.reconnectAttempts });
            }
        }
    }

    /**
     * Parse incoming message
     */
    parseMessage(data) {
        try {
            if (typeof data === 'string') {
                return JSON.parse(data);
            } else if (data instanceof Blob) {
                return data.text().then(text => JSON.parse(text));
            } else if (data instanceof ArrayBuffer) {
                const text = new TextDecoder().decode(data);
                return JSON.parse(text);
            }
        } catch (error) {
            console.error('[WebSocketClient] Failed to parse message:', error);
        }
        
        return null;
    }

    /**
     * Prepare outgoing message
     */
    prepareMessage(message) {
        const preparedMessage = {
            ...message,
            clientId: this.clientId,
            sessionId: this.sessionId,
            timestamp: Date.now()
        };
        
        return JSON.stringify(preparedMessage);
    }

    /**
     * Route message to appropriate handler
     */
    routeMessage(message) {
        // Handle heartbeat response
        if (message.type === 'heartbeat' || message.type === 'pong') {
            this.lastHeartbeatReceived = Date.now();
            if (this.heartbeatTimeout) {
                clearTimeout(this.heartbeatTimeout);
                this.heartbeatTimeout = null;
            }
            this.emit('heartbeat', message);
            return;
        }
        
        // Handle acknowledgment
        if (message.type === 'ack') {
            this.emit('ack', message);
            return;
        }
        
        // Route to specific handler
        const handler = this.messageHandlers.get(message.type);
        if (handler) {
            handler(message);
        } else {
            this.emit('message', message);
        }
    }

    /**
     * Initialize message handlers
     */
    initializeMessageHandlers() {
        // Default handlers can be added here
        this.messageHandlers.set('error', (message) => {
            console.error('[WebSocketClient] Server error:', message);
            this.emit('error', message);
        });
        
        this.messageHandlers.set('ping', (message) => {
            this.send({ type: 'pong', timestamp: Date.now() });
        });
    }

    /**
     * Register message handler
     */
    registerHandler(messageType, handler) {
        this.messageHandlers.set(messageType, handler);
    }

    /**
     * Unregister message handler
     */
    unregisterHandler(messageType) {
        this.messageHandlers.delete(messageType);
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
                    console.error(`[WebSocketClient] Error in event listener for ${event}:`, error);
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

    generateMessageId() {
        return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    getClientCapabilities() {
        return {
            compression: this.options.enableCompression,
            heartbeat: true,
            acknowledgments: true,
            version: this.protocolVersion
        };
    }

    getMessageSize(message) {
        if (typeof message === 'string') {
            return new Blob([message]).size;
        } else if (message instanceof Blob) {
            return message.size;
        } else if (message instanceof ArrayBuffer) {
            return message.byteLength;
        }
        return 0;
    }

    updateLatencyMetrics(latency) {
        this.metrics.totalLatency += latency;
        this.metrics.averageLatency = this.metrics.totalLatency / this.metrics.messagesReceived;
    }

    handleConnectionError(error) {
        this.emit('connectionError', error);
    }

    /**
     * Get connection status
     */
    getStatus() {
        return {
            isConnected: this.isConnected,
            isConnecting: this.isConnecting,
            isReconnecting: this.isReconnecting,
            reconnectAttempts: this.reconnectAttempts,
            url: this.url,
            clientId: this.clientId,
            sessionId: this.sessionId,
            queueSize: this.messageQueue.length,
            lastHeartbeatSent: this.lastHeartbeatSent,
            lastHeartbeatReceived: this.lastHeartbeatReceived
        };
    }

    /**
     * Get metrics
     */
    getMetrics() {
        return {
            ...this.metrics,
            connectionUptime: this.isConnected ? 
                Date.now() - (this.metrics.lastConnectionTime || Date.now()) : 
                this.metrics.connectionUptime
        };
    }

    /**
     * Clear metrics
     */
    clearMetrics() {
        this.metrics = {
            connectionsAttempted: 0,
            connectionsSuccessful: 0,
            connectionsFailed: 0,
            messagesSent: 0,
            messagesReceived: 0,
            totalBytesReceived: 0,
            totalBytesSent: 0,
            averageLatency: 0,
            totalLatency: 0,
            connectionUptime: 0,
            lastConnectionTime: null,
            lastDisconnectionTime: null
        };
    }

    /**
     * Destroy WebSocket client
     */
    destroy() {
        this.disconnect();
        this.eventListeners.clear();
        this.messageHandlers.clear();
        this.messageQueue = [];
        this.clearMetrics();
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = WebSocketClient;
} else if (typeof window !== 'undefined') {
    window.WebSocketClient = WebSocketClient;
}