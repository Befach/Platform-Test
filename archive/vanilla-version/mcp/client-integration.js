/**
 * MCP Client-Side Integration
 * 
 * Comprehensive client-side integration with:
 * - Real-time component synchronization
 * - Component caching and preloading mechanisms
 * - Component error handling and recovery systems
 * - Component performance monitoring on client side
 * - WebSocket-based real-time updates
 * - Component state management and persistence
 * - Cross-application component sharing
 * - Component lifecycle management on client
 * 
 * @version 1.0.0
 * @author MCP Client Integration
 */

/**
 * MCP Client Integration Class
 */
export class MCPClientIntegration {
  constructor(config = {}) {
    // Configuration
    this.config = {
      serverUrl: config.serverUrl || 'ws://localhost:8080/mcp-components',
      reconnectInterval: config.reconnectInterval || 5000,
      maxReconnectAttempts: config.maxReconnectAttempts || 10,
      enableCaching: config.enableCaching !== false,
      enablePreloading: config.enablePreloading !== false,
      enablePerformanceMonitoring: config.enablePerformanceMonitoring !== false,
      enableErrorRecovery: config.enableErrorRecovery !== false,
      cacheSize: config.cacheSize || 100,
      preloadThreshold: config.preloadThreshold || 0.8,
      errorRetryAttempts: config.errorRetryAttempts || 3,
      syncInterval: config.syncInterval || 30000 // 30 seconds
    };
    
    // Connection state
    this.connection = {
      ws: null,
      isConnected: false,
      reconnectAttempts: 0,
      lastConnectionTime: null,
      connectionId: null
    };
    
    // Component management
    this.components = new Map();
    this.componentStates = new Map();
    this.componentCache = new Map();
    this.preloadQueue = [];
    
    // Event handling
    this.eventHandlers = new Map();
    this.messageQueue = [];
    this.subscriptions = new Set();
    
    // Performance monitoring
    this.performanceMonitor = {
      metrics: new Map(),
      observers: new Map(),
      isEnabled: this.config.enablePerformanceMonitoring
    };
    
    // Error handling
    this.errorHandler = {
      errors: new Map(),
      recoveryStrategies: new Map(),
      retryAttempts: new Map(),
      isEnabled: this.config.enableErrorRecovery
    };
    
    // Sync management
    this.syncManager = {
      lastSyncTime: null,
      syncInProgress: false,
      pendingSyncs: new Set(),
      conflictResolver: null
    };
    
    // State persistence
    this.statePersistence = {
      storageKey: 'mcp_component_states',
      isEnabled: true,
      autoSave: true,
      saveInterval: 60000 // 1 minute
    };
    
    // Initialize subsystems
    this.initializeErrorHandling();
    this.initializePerformanceMonitoring();
    this.initializeStatePersistence();
    
    // Start background processes
    this.startBackgroundProcesses();
  }

  /**
   * Connect to MCP server
   * @returns {Promise<Object>} Connection result
   */
  async connect() {
    if (this.connection.isConnected) {
      throw new Error('Already connected to MCP server');
    }

    try {
      // Create WebSocket connection
      this.connection.ws = new WebSocket(this.config.serverUrl);
      
      // Setup connection handlers
      this.setupConnectionHandlers();
      
      // Wait for connection to open
      await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Connection timeout'));
        }, 10000);
        
        this.connection.ws.onopen = () => {
          clearTimeout(timeout);
          resolve();
        };
        
        this.connection.ws.onerror = (error) => {
          clearTimeout(timeout);
          reject(error);
        };
      });
      
      this.connection.isConnected = true;
      this.connection.lastConnectionTime = Date.now();
      this.connection.reconnectAttempts = 0;
      
      // Send client registration
      await this.registerClient();
      
      // Process queued messages
      this.processMessageQueue();
      
      console.log('✅ Connected to MCP server');
      
      this.emit('connected', {
        connectionId: this.connection.connectionId,
        serverUrl: this.config.serverUrl,
        timestamp: Date.now()
      });
      
      return {
        success: true,
        connectionId: this.connection.connectionId,
        message: 'Connected to MCP server successfully'
      };
      
    } catch (error) {
      console.error('❌ Failed to connect to MCP server:', error);
      this.handleConnectionError(error);
      throw error;
    }
  }

  /**
   * Disconnect from MCP server
   * @returns {Object} Disconnection result
   */
  disconnect() {
    if (!this.connection.isConnected) {
      return { success: true, message: 'Already disconnected' };
    }

    // Close WebSocket connection
    if (this.connection.ws) {
      this.connection.ws.close();
      this.connection.ws = null;
    }
    
    this.connection.isConnected = false;
    this.connection.connectionId = null;
    
    // Clear subscriptions
    this.subscriptions.clear();
    
    console.log('🔌 Disconnected from MCP server');
    
    this.emit('disconnected', {
      timestamp: Date.now()
    });
    
    return {
      success: true,
      message: 'Disconnected from MCP server successfully'
    };
  }

  /**
   * Register a component with MCP
   * @param {Object} componentData - Component data
   * @returns {Promise<Object>} Registration result
   */
  async registerComponent(componentData) {
    this.ensureConnected();
    
    try {
      // Validate component data
      this.validateComponentData(componentData);
      
      // Add client-side metadata
      const enhancedComponentData = {
        ...componentData,
        clientMetadata: {
          registeredAt: Date.now(),
          clientId: this.connection.connectionId,
          userAgent: navigator.userAgent,
          platform: navigator.platform
        }
      };
      
      // Send registration request
      const response = await this.sendRequest('register_component', enhancedComponentData);
      
      // Store component locally
      this.components.set(componentData.id, {
        ...enhancedComponentData,
        serverData: response.component,
        localState: 'registered'
      });
      
      // Initialize component state
      this.componentStates.set(componentData.id, {
        state: 'registered',
        lastUpdated: Date.now(),
        syncStatus: 'synced'
      });
      
      console.log(`✅ Component registered with MCP: ${componentData.id}`);
      
      this.emit('componentRegistered', {
        componentId: componentData.id,
        response,
        timestamp: Date.now()
      });
      
      return {
        success: true,
        componentId: componentData.id,
        response,
        message: `Component '${componentData.id}' registered successfully`
      };
      
    } catch (error) {
      console.error(`❌ Failed to register component '${componentData.id}':`, error);
      this.handleComponentError(componentData.id, error, 'registration');
      throw error;
    }
  }

  /**
   * Load a component
   * @param {string} componentId - Component ID
   * @param {Object} options - Load options
   * @returns {Promise<Object>} Load result
   */
  async loadComponent(componentId, options = {}) {
    this.ensureConnected();
    
    try {
      // Check cache first
      if (this.config.enableCaching) {
        const cachedComponent = this.componentCache.get(componentId);
        if (cachedComponent && !options.forceReload) {
          console.log(`📦 Loading component '${componentId}' from cache`);
          return this.loadFromCache(componentId, cachedComponent, options);
        }
      }
      
      // Request component from server
      const response = await this.sendRequest('get_component_state', {
        id: componentId,
        includeMetadata: true
      });
      
      // Process component data
      const componentData = this.processComponentData(response);
      
      // Cache component if enabled
      if (this.config.enableCaching) {
        this.cacheComponent(componentId, componentData);
      }
      
      // Update local state
      this.updateComponentState(componentId, 'loaded');
      
      // Start performance monitoring if enabled
      if (this.performanceMonitor.isEnabled) {
        this.startComponentPerformanceMonitoring(componentId);
      }
      
      console.log(`✅ Component loaded: ${componentId}`);
      
      this.emit('componentLoaded', {
        componentId,
        componentData,
        fromCache: false,
        timestamp: Date.now()
      });
      
      return {
        success: true,
        componentId,
        componentData,
        message: `Component '${componentId}' loaded successfully`
      };
      
    } catch (error) {
      console.error(`❌ Failed to load component '${componentId}':`, error);
      this.handleComponentError(componentId, error, 'loading');
      throw error;
    }
  }

  /**
   * Update a component
   * @param {string} componentId - Component ID
   * @param {Object} updates - Component updates
   * @returns {Promise<Object>} Update result
   */
  async updateComponent(componentId, updates) {
    this.ensureConnected();
    
    try {
      // Prepare update request
      const updateRequest = {
        id: componentId,
        updates: {
          ...updates,
          clientMetadata: {
            updatedAt: Date.now(),
            clientId: this.connection.connectionId
          }
        }
      };
      
      // Send update request
      const response = await this.sendRequest('update_component', updateRequest);
      
      // Update local component data
      const component = this.components.get(componentId);
      if (component) {
        Object.assign(component, updates);
        component.serverData = response.component;
      }
      
      // Update cache if enabled
      if (this.config.enableCaching) {
        const cachedComponent = this.componentCache.get(componentId);
        if (cachedComponent) {
          Object.assign(cachedComponent, updates);
        }
      }
      
      // Update local state
      this.updateComponentState(componentId, 'updated');
      
      console.log(`✅ Component updated: ${componentId}`);
      
      this.emit('componentUpdated', {
        componentId,
        updates,
        response,
        timestamp: Date.now()
      });
      
      return {
        success: true,
        componentId,
        response,
        message: `Component '${componentId}' updated successfully`
      };
      
    } catch (error) {
      console.error(`❌ Failed to update component '${componentId}':`, error);
      this.handleComponentError(componentId, error, 'update');
      throw error;
    }
  }

  /**
   * Subscribe to component updates
   * @param {Array} componentIds - Component IDs to subscribe to
   * @returns {Promise<Object>} Subscription result
   */
  async subscribeToComponents(componentIds) {
    this.ensureConnected();
    
    try {
      // Add to local subscriptions
      componentIds.forEach(id => this.subscriptions.add(id));
      
      // Send subscription request
      const response = await this.sendRequest('subscribe', {
        componentIds,
        clientId: this.connection.connectionId
      });
      
      console.log(`📝 Subscribed to ${componentIds.length} components`);
      
      this.emit('subscribed', {
        componentIds,
        response,
        timestamp: Date.now()
      });
      
      return {
        success: true,
        componentIds,
        response,
        message: `Subscribed to ${componentIds.length} components successfully`
      };
      
    } catch (error) {
      console.error('❌ Failed to subscribe to components:', error);
      throw error;
    }
  }

  /**
   * Sync components with server
   * @param {Array} componentIds - Component IDs to sync (optional, all if not provided)
   * @returns {Promise<Object>} Sync result
   */
  async syncComponents(componentIds = null) {
    this.ensureConnected();
    
    if (this.syncManager.syncInProgress) {
      throw new Error('Sync already in progress');
    }
    
    try {
      this.syncManager.syncInProgress = true;
      
      // Determine which components to sync
      const targetComponentIds = componentIds || Array.from(this.components.keys());
      
      // Send sync request
      const response = await this.sendRequest('sync_components', {
        componentIds: targetComponentIds,
        targetApplications: ['current'],
        syncMode: 'incremental'
      });
      
      // Process sync results
      await this.processSyncResults(response);
      
      // Update sync state
      this.syncManager.lastSyncTime = Date.now();
      
      console.log(`🔄 Synced ${targetComponentIds.length} components`);
      
      this.emit('syncCompleted', {
        componentIds: targetComponentIds,
        response,
        timestamp: Date.now()
      });
      
      return {
        success: true,
        componentIds: targetComponentIds,
        response,
        message: `Synced ${targetComponentIds.length} components successfully`
      };
      
    } catch (error) {
      console.error('❌ Failed to sync components:', error);
      throw error;
    } finally {
      this.syncManager.syncInProgress = false;
    }
  }

  /**
   * Get component performance metrics
   * @param {Array} componentIds - Component IDs (optional, all if not provided)
   * @returns {Object} Performance metrics
   */
  getPerformanceMetrics(componentIds = null) {
    if (!this.performanceMonitor.isEnabled) {
      throw new Error('Performance monitoring is not enabled');
    }
    
    const targetComponents = componentIds || Array.from(this.performanceMonitor.metrics.keys());
    const metrics = {};
    
    for (const componentId of targetComponents) {
      const componentMetrics = this.performanceMonitor.metrics.get(componentId);
      if (componentMetrics) {
        metrics[componentId] = {
          ...componentMetrics,
          currentObservers: this.performanceMonitor.observers.get(componentId)?.size || 0
        };
      }
    }
    
    return {
      componentIds: targetComponents,
      metrics,
      summary: this.calculatePerformanceSummary(metrics),
      timestamp: Date.now()
    };
  }

  /**
   * Preload components
   * @param {Array} componentIds - Component IDs to preload
   * @returns {Promise<Object>} Preload result
   */
  async preloadComponents(componentIds) {
    if (!this.config.enablePreloading) {
      throw new Error('Preloading is not enabled');
    }
    
    const results = {
      successful: [],
      failed: [],
      skipped: []
    };
    
    for (const componentId of componentIds) {
      try {
        // Check if already cached
        if (this.componentCache.has(componentId)) {
          results.skipped.push(componentId);
          continue;
        }
        
        // Load component
        await this.loadComponent(componentId, { preload: true });
        results.successful.push(componentId);
        
      } catch (error) {
        console.error(`❌ Failed to preload component '${componentId}':`, error);
        results.failed.push({ componentId, error: error.message });
      }
    }
    
    console.log(`🚀 Preloaded ${results.successful.length} components`);
    
    this.emit('componentsPreloaded', {
      results,
      timestamp: Date.now()
    });
    
    return {
      success: true,
      results,
      message: `Preloaded ${results.successful.length} components successfully`
    };
  }

  /**
   * Private helper methods
   */

  ensureConnected() {
    if (!this.connection.isConnected) {
      throw new Error('Not connected to MCP server');
    }
  }

  setupConnectionHandlers() {
    const ws = this.connection.ws;
    
    ws.onopen = () => {
      console.log('🔗 WebSocket connection opened');
    };
    
    ws.onmessage = (event) => {
      this.handleServerMessage(event.data);
    };
    
    ws.onclose = (event) => {
      console.log('🔌 WebSocket connection closed:', event.code, event.reason);
      this.handleConnectionClose(event);
    };
    
    ws.onerror = (error) => {
      console.error('❌ WebSocket error:', error);
      this.handleConnectionError(error);
    };
  }

  async registerClient() {
    const response = await this.sendRequest('register_client', {
      clientType: 'browser',
      capabilities: ['caching', 'preloading', 'performance_monitoring', 'error_recovery'],
      config: {
        enableCaching: this.config.enableCaching,
        enablePreloading: this.config.enablePreloading,
        enablePerformanceMonitoring: this.config.enablePerformanceMonitoring
      }
    });
    
    this.connection.connectionId = response.clientId;
    return response;
  }

  async sendRequest(method, params = {}) {
    return new Promise((resolve, reject) => {
      const requestId = this.generateRequestId();
      const request = {
        id: requestId,
        method,
        params,
        timestamp: Date.now()
      };
      
      // Store request handler
      const timeout = setTimeout(() => {
        this.eventHandlers.delete(requestId);
        reject(new Error(`Request timeout: ${method}`));
      }, 30000);
      
      this.eventHandlers.set(requestId, {
        resolve: (response) => {
          clearTimeout(timeout);
          resolve(response);
        },
        reject: (error) => {
          clearTimeout(timeout);
          reject(error);
        }
      });
      
      // Send request
      if (this.connection.ws && this.connection.ws.readyState === WebSocket.OPEN) {
        this.connection.ws.send(JSON.stringify(request));
      } else {
        // Queue message if not connected
        this.messageQueue.push(request);
        reject(new Error('WebSocket is not connected'));
      }
    });
  }

  handleServerMessage(data) {
    try {
      const message = JSON.parse(data);
      
      if (message.id && this.eventHandlers.has(message.id)) {
        // Handle response to a request
        const handler = this.eventHandlers.get(message.id);
        this.eventHandlers.delete(message.id);
        
        if (message.error) {
          handler.reject(new Error(message.error.message));
        } else {
          handler.resolve(message.result);
        }
      } else {
        // Handle server-initiated message
        this.handleServerNotification(message);
      }
      
    } catch (error) {
      console.error('❌ Failed to parse server message:', error);
    }
  }

  handleServerNotification(message) {
    switch (message.type) {
      case 'component_update':
        this.handleComponentUpdate(message);
        break;
      case 'sync_completed':
        this.handleSyncCompleted(message);
        break;
      case 'conflict_detected':
        this.handleConflictDetected(message);
        break;
      case 'performance_alert':
        this.handlePerformanceAlert(message);
        break;
      default:
        console.warn('Unknown server notification type:', message.type);
    }
  }

  handleComponentUpdate(message) {
    const { componentId, state, syncResults } = message;
    
    // Update local component state
    if (this.components.has(componentId)) {
      const component = this.components.get(componentId);
      component.serverData = state;
      
      // Update cache
      if (this.config.enableCaching) {
        this.componentCache.set(componentId, { ...component, serverData: state });
      }
    }
    
    // Update component state tracking
    this.updateComponentState(componentId, 'server_updated');
    
    console.log(`📦 Component updated from server: ${componentId}`);
    
    this.emit('componentUpdateFromServer', {
      componentId,
      state,
      syncResults,
      timestamp: Date.now()
    });
  }

  handleSyncCompleted(message) {
    const { syncId, results } = message;
    
    // Process sync results
    this.processSyncResults(results);
    
    // Update sync state
    this.syncManager.lastSyncTime = Date.now();
    
    console.log(`🔄 Sync completed: ${syncId}`);
    
    this.emit('syncCompletedFromServer', {
      syncId,
      results,
      timestamp: Date.now()
    });
  }

  handleConflictDetected(message) {
    const { componentId, conflicts } = message;
    
    console.warn(`⚠️ Conflict detected for component: ${componentId}`, conflicts);
    
    this.emit('conflictDetected', {
      componentId,
      conflicts,
      timestamp: Date.now()
    });
  }

  handlePerformanceAlert(message) {
    const { componentId, alert } = message;
    
    console.warn(`📊 Performance alert for component: ${componentId}`, alert);
    
    this.emit('performanceAlert', {
      componentId,
      alert,
      timestamp: Date.now()
    });
  }

  handleConnectionClose(event) {
    this.connection.isConnected = false;
    this.connection.ws = null;
    
    // Attempt reconnection if not a normal closure
    if (event.code !== 1000) {
      this.attemptReconnection();
    }
    
    this.emit('connectionClosed', {
      code: event.code,
      reason: event.reason,
      timestamp: Date.now()
    });
  }

  handleConnectionError(error) {
    this.connection.isConnected = false;
    
    this.emit('connectionError', {
      error,
      timestamp: Date.now()
    });
  }

  async attemptReconnection() {
    if (this.connection.reconnectAttempts >= this.config.maxReconnectAttempts) {
      console.error('❌ Maximum reconnection attempts reached');
      this.emit('reconnectionFailed', {
        attempts: this.connection.reconnectAttempts,
        timestamp: Date.now()
      });
      return;
    }
    
    this.connection.reconnectAttempts++;
    
    console.log(`🔄 Attempting reconnection (${this.connection.reconnectAttempts}/${this.config.maxReconnectAttempts})`);
    
    setTimeout(async () => {
      try {
        await this.connect();
        console.log('✅ Reconnection successful');
        this.emit('reconnectionSuccessful', {
          attempts: this.connection.reconnectAttempts,
          timestamp: Date.now()
        });
      } catch (error) {
        console.error('❌ Reconnection failed:', error);
        this.attemptReconnection();
      }
    }, this.config.reconnectInterval);
  }

  processMessageQueue() {
    while (this.messageQueue.length > 0 && this.connection.ws && this.connection.ws.readyState === WebSocket.OPEN) {
      const message = this.messageQueue.shift();
      this.connection.ws.send(JSON.stringify(message));
    }
  }

  validateComponentData(data) {
    const required = ['id', 'name', 'type'];
    for (const field of required) {
      if (!data[field]) {
        throw new Error(`Required field '${field}' is missing`);
      }
    }
  }

  processComponentData(serverData) {
    return {
      ...serverData,
      clientData: {
        loadedAt: Date.now(),
        clientId: this.connection.connectionId
      }
    };
  }

  cacheComponent(componentId, componentData) {
    // Implement LRU cache if size limit exceeded
    if (this.componentCache.size >= this.config.cacheSize) {
      const firstKey = this.componentCache.keys().next().value;
      this.componentCache.delete(firstKey);
    }
    
    this.componentCache.set(componentId, componentData);
  }

  loadFromCache(componentId, cachedComponent, options) {
    // Update local state
    this.updateComponentState(componentId, 'loaded_from_cache');
    
    // Start performance monitoring if enabled
    if (this.performanceMonitor.isEnabled) {
      this.startComponentPerformanceMonitoring(componentId);
    }
    
    this.emit('componentLoaded', {
      componentId,
      componentData: cachedComponent,
      fromCache: true,
      timestamp: Date.now()
    });
    
    return {
      success: true,
      componentId,
      componentData: cachedComponent,
      fromCache: true,
      message: `Component '${componentId}' loaded from cache`
    };
  }

  updateComponentState(componentId, state) {
    const componentState = this.componentStates.get(componentId) || {
      state: 'unknown',
      lastUpdated: Date.now(),
      syncStatus: 'unknown'
    };
    
    componentState.state = state;
    componentState.lastUpdated = Date.now();
    
    this.componentStates.set(componentId, componentState);
    
    // Save to persistent storage if enabled
    if (this.statePersistence.isEnabled && this.statePersistence.autoSave) {
      this.saveComponentStates();
    }
  }

  initializeErrorHandling() {
    if (!this.errorHandler.isEnabled) return;
    
    // Define recovery strategies
    this.errorHandler.recoveryStrategies.set('connection_error', {
      maxRetries: 3,
      retryDelay: 2000,
      recover: async (error, context) => {
        return this.attemptReconnection();
      }
    });
    
    this.errorHandler.recoveryStrategies.set('component_load_error', {
      maxRetries: 2,
      retryDelay: 1000,
      recover: async (error, context) => {
        return this.loadComponent(context.componentId, { forceReload: true });
      }
    });
  }

  handleComponentError(componentId, error, phase) {
    if (!this.errorHandler.isEnabled) return;
    
    // Record error
    if (!this.errorHandler.errors.has(componentId)) {
      this.errorHandler.errors.set(componentId, []);
    }
    
    this.errorHandler.errors.get(componentId).push({
      error: error.message,
      phase,
      timestamp: Date.now()
    });
    
    // Attempt recovery if strategy exists
    const strategy = this.errorHandler.recoveryStrategies.get(phase);
    if (strategy) {
      const attempts = this.errorHandler.retryAttempts.get(componentId) || 0;
      
      if (attempts < strategy.maxRetries) {
        this.errorHandler.retryAttempts.set(componentId, attempts + 1);
        
        setTimeout(async () => {
          try {
            await strategy.recover(error, { componentId });
            console.log(`✅ Error recovery successful for component '${componentId}'`);
          } catch (recoveryError) {
            console.error(`❌ Error recovery failed for component '${componentId}':`, recoveryError);
          }
        }, strategy.retryDelay);
      }
    }
    
    this.emit('componentError', {
      componentId,
      error,
      phase,
      timestamp: Date.now()
    });
  }

  initializePerformanceMonitoring() {
    if (!this.performanceMonitor.isEnabled) return;
    
    // Initialize performance observers
    if (typeof PerformanceObserver !== 'undefined') {
      // Observe navigation timing
      const navObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'navigation') {
            this.recordPerformanceMetric('navigation', entry);
          }
        }
      });
      navObserver.observe({ entryTypes: ['navigation'] });
      
      // Observe resource timing
      const resourceObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'resource') {
            this.recordPerformanceMetric('resource', entry);
          }
        }
      });
      resourceObserver.observe({ entryTypes: ['resource'] });
    }
  }

  startComponentPerformanceMonitoring(componentId) {
    if (!this.performanceMonitor.isEnabled) return;
    
    // Initialize component metrics
    if (!this.performanceMonitor.metrics.has(componentId)) {
      this.performanceMonitor.metrics.set(componentId, {
        loadTime: 0,
        renderTime: 0,
        memoryUsage: 0,
        errorCount: 0,
        lastUpdated: Date.now()
      });
    }
    
    // Start monitoring if possible
    if (typeof PerformanceObserver !== 'undefined') {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          this.recordComponentPerformanceMetric(componentId, entry);
        }
      });
      
      observer.observe({ entryTypes: ['measure', 'navigation', 'resource'] });
      
      this.performanceMonitor.observers.set(componentId, observer);
    }
  }

  recordPerformanceMetric(type, entry) {
    // Record global performance metrics
    console.log(`📊 Performance metric recorded: ${type}`, entry);
  }

  recordComponentPerformanceMetric(componentId, entry) {
    const metrics = this.performanceMonitor.metrics.get(componentId);
    if (!metrics) return;
    
    switch (entry.entryType) {
      case 'measure':
        if (entry.name.includes('load')) {
          metrics.loadTime = entry.duration;
        } else if (entry.name.includes('render')) {
          metrics.renderTime = entry.duration;
        }
        break;
      case 'memory':
        metrics.memoryUsage = entry.usedJSHeapSize;
        break;
    }
    
    metrics.lastUpdated = Date.now();
  }

  initializeStatePersistence() {
    if (!this.statePersistence.isEnabled) return;
    
    // Load saved states
    this.loadComponentStates();
    
    // Setup auto-save
    if (this.statePersistence.autoSave) {
      setInterval(() => {
        this.saveComponentStates();
      }, this.statePersistence.saveInterval);
    }
  }

  saveComponentStates() {
    try {
      const states = Object.fromEntries(this.componentStates);
      localStorage.setItem(this.statePersistence.storageKey, JSON.stringify(states));
    } catch (error) {
      console.error('❌ Failed to save component states:', error);
    }
  }

  loadComponentStates() {
    try {
      const saved = localStorage.getItem(this.statePersistence.storageKey);
      if (saved) {
        const states = JSON.parse(saved);
        for (const [componentId, state] of Object.entries(states)) {
          this.componentStates.set(componentId, state);
        }
      }
    } catch (error) {
      console.error('❌ Failed to load component states:', error);
    }
  }

  startBackgroundProcesses() {
    // Start sync interval
    if (this.config.syncInterval > 0) {
      setInterval(() => {
        if (this.connection.isConnected && !this.syncManager.syncInProgress) {
          this.syncComponents();
        }
      }, this.config.syncInterval);
    }
    
    // Start preload queue processor
    if (this.config.enablePreloading) {
      setInterval(() => {
        this.processPreloadQueue();
      }, 5000);
    }
  }

  processPreloadQueue() {
    if (this.preloadQueue.length === 0) return;
    
    const componentId = this.preloadQueue.shift();
    
    if (!this.componentCache.has(componentId)) {
      this.loadComponent(componentId, { preload: true }).catch(error => {
        console.error(`❌ Failed to preload component '${componentId}':`, error);
      });
    }
  }

  processSyncResults(results) {
    // Update local components based on sync results
    for (const result of results.successful) {
      const componentId = result.componentId;
      this.updateComponentState(componentId, 'synced');
    }
    
    // Handle conflicts
    for (const conflict of results.conflicts) {
      this.handleConflictDetected({
        componentId: conflict.componentId,
        conflicts: conflict.conflicts
      });
    }
  }

  calculatePerformanceSummary(metrics) {
    const summary = {
      totalComponents: Object.keys(metrics).length,
      averageLoadTime: 0,
      averageRenderTime: 0,
      totalMemoryUsage: 0,
      totalErrors: 0
    };
    
    let totalLoadTime = 0;
    let totalRenderTime = 0;
    let componentCount = 0;
    
    for (const componentMetrics of Object.values(metrics)) {
      totalLoadTime += componentMetrics.loadTime;
      totalRenderTime += componentMetrics.renderTime;
      summary.totalMemoryUsage += componentMetrics.memoryUsage;
      summary.totalErrors += componentMetrics.errorCount;
      componentCount++;
    }
    
    if (componentCount > 0) {
      summary.averageLoadTime = totalLoadTime / componentCount;
      summary.averageRenderTime = totalRenderTime / componentCount;
    }
    
    return summary;
  }

  generateRequestId() {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Event emitter methods
  on(event, handler) {
    if (!this.eventHandlers.has(`event_${event}`)) {
      this.eventHandlers.set(`event_${event}`, new Set());
    }
    this.eventHandlers.get(`event_${event}`).add(handler);
  }

  off(event, handler) {
    const handlers = this.eventHandlers.get(`event_${event}`);
    if (handlers) {
      handlers.delete(handler);
    }
  }

  emit(event, data) {
    const handlers = this.eventHandlers.get(`event_${event}`);
    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler(data);
        } catch (error) {
          console.error(`❌ Event handler error for '${event}':`, error);
        }
      });
    }
  }
}

// Export for use in browser or Node.js
if (typeof window !== 'undefined') {
  window.MCPClientIntegration = MCPClientIntegration;
}

export default MCPClientIntegration;