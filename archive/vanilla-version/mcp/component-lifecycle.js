/**
 * Component Lifecycle Management
 * 
 * Comprehensive lifecycle management with:
 * - Component lifecycle hooks and events
 * - Dynamic component loading and unloading
 * - Component state transitions and validation
 * - Component dependency management
 * - Component initialization and cleanup
 * - Component error handling and recovery
 * - Component performance monitoring
 * - Component version migration support
 * 
 * @version 1.0.0
 * @author MCP Component Lifecycle Manager
 */

import { EventEmitter } from 'events';

/**
 * Component Lifecycle Manager Class
 */
export class ComponentLifecycle extends EventEmitter {
  constructor() {
    super();
    
    // Lifecycle states
    this.STATES = {
      REGISTERED: 'registered',
      INITIALIZING: 'initializing',
      INITIALIZED: 'initialized',
      LOADING: 'loading',
      LOADED: 'loaded',
      ACTIVE: 'active',
      INACTIVE: 'inactive',
      UPDATING: 'updating',
      ERROR: 'error',
      UNLOADING: 'unloading',
      UNLOADED: 'unloaded',
      UNREGISTERING: 'unregistering',
      UNREGISTERED: 'unregistered'
    };
    
    // State transitions
    this.TRANSITIONS = {
      [this.STATES.REGISTERED]: [this.STATES.INITIALIZING, this.STATES.UNREGISTERING],
      [this.STATES.INITIALIZING]: [this.STATES.INITIALIZED, this.STATES.ERROR],
      [this.STATES.INITIALIZED]: [this.STATES.LOADING, this.STATES.UNREGISTERING],
      [this.STATES.LOADING]: [this.STATES.LOADED, this.STATES.ERROR],
      [this.STATES.LOADED]: [this.STATES.ACTIVE, this.STATES.INACTIVE, this.STATES.UNLOADING],
      [this.STATES.ACTIVE]: [this.STATES.INACTIVE, this.STATES.UPDATING, this.STATES.UNLOADING],
      [this.STATES.INACTIVE]: [this.STATES.ACTIVE, this.STATES.UPDATING, this.STATES.UNLOADING],
      [this.STATES.UPDATING]: [this.STATES.ACTIVE, this.STATES.INACTIVE, this.STATES.ERROR],
      [this.STATES.ERROR]: [this.STATES.INITIALIZING, this.STATES.LOADING, this.STATES.UNLOADING],
      [this.STATES.UNLOADING]: [this.STATES.UNLOADED, this.STATES.ERROR],
      [this.STATES.UNLOADED]: [this.STATES.LOADING, this.STATES.UNREGISTERING],
      [this.STATES.UNREGISTERING]: [this.STATES.UNREGISTERED, this.STATES.ERROR]
    };
    
    // Component registry
    this.components = new Map();
    this.componentStates = new Map();
    this.componentInstances = new Map();
    this.componentDependencies = new Map();
    
    // Lifecycle hooks
    this.hooks = {
      beforeRegister: new Set(),
      afterRegister: new Set(),
      beforeInit: new Set(),
      afterInit: new Set(),
      beforeLoad: new Set(),
      afterLoad: new Set(),
      beforeActivate: new Set(),
      afterActivate: new Set(),
      beforeDeactivate: new Set(),
      afterDeactivate: new Set(),
      beforeUpdate: new Set(),
      afterUpdate: new Set(),
      beforeUnload: new Set(),
      afterUnload: new Set(),
      beforeUnregister: new Set(),
      afterUnregister: new Set(),
      onError: new Set(),
      onStateChange: new Set()
    };
    
    // Lifecycle configuration
    this.config = {
      enableAutoRecovery: true,
      maxRetryAttempts: 3,
      retryDelay: 1000,
      enableDependencyValidation: true,
      enableStateValidation: true,
      enablePerformanceMonitoring: true,
      enableErrorTracking: true,
      componentTimeout: 30000,
      cleanupInterval: 60000
    };
    
    // Error tracking
    this.errorHistory = new Map();
    this.recoveryAttempts = new Map();
    
    // Performance monitoring
    this.performanceMetrics = new Map();
    
    // Start cleanup timer
    this.startCleanupTimer();
  }

  /**
   * Register a component for lifecycle management
   * @param {Object} componentData - Component data
   * @returns {Object} Registration result
   */
  async registerComponent(componentData) {
    const {
      id,
      name,
      type,
      version,
      dependencies = [],
      config = {},
      hooks = {},
      initialState = this.STATES.REGISTERED
    } = componentData;

    // Validate component data
    this.validateComponentData(componentData);

    // Check if component already exists
    if (this.components.has(id)) {
      throw new Error(`Component with ID '${id}' is already registered`);
    }

    // Execute before register hooks
    await this.executeHooks('beforeRegister', { componentData });

    // Create component object
    const component = {
      id,
      name,
      type,
      version,
      dependencies: new Set(dependencies),
      config: { ...config },
      hooks: { ...hooks },
      state: initialState,
      registeredAt: Date.now(),
      lastStateChange: Date.now(),
      stateHistory: [{
        state: initialState,
        timestamp: Date.now(),
        reason: 'registration'
      }],
      instance: null,
      metadata: {
        loadCount: 0,
        activateCount: 0,
        errorCount: 0,
        totalLoadTime: 0,
        totalActiveTime: 0
      }
    };

    // Store component
    this.components.set(id, component);
    this.componentStates.set(id, initialState);

    // Register component hooks
    this.registerComponentHooks(id, hooks);

    // Execute after register hooks
    await this.executeHooks('afterRegister', { component });

    // Emit event
    this.emit('lifecycleEvent', {
      type: 'componentRegistered',
      componentId: id,
      state: initialState,
      timestamp: Date.now()
    });

    console.log(`✅ Component registered for lifecycle management: ${id} (${name})`);

    return {
      success: true,
      componentId: id,
      state: initialState,
      message: `Component '${id}' registered successfully`
    };
  }

  /**
   * Initialize a component
   * @param {string} componentId - Component ID
   * @param {Object} options - Initialization options
   * @returns {Object} Initialization result
   */
  async initializeComponent(componentId, options = {}) {
    const component = this.components.get(componentId);
    
    if (!component) {
      throw new Error(`Component with ID '${componentId}' not found`);
    }

    // Check current state
    if (!this.canTransitionTo(componentId, this.STATES.INITIALIZING)) {
      throw new Error(`Component '${componentId}' cannot be initialized from state '${component.state}'`);
    }

    // Execute before init hooks
    await this.executeHooks('beforeInit', { component, options });

    // Change state to initializing
    await this.changeComponentState(componentId, this.STATES.INITIALIZING, 'initialization');

    try {
      // Validate dependencies
      if (this.config.enableDependencyValidation) {
        await this.validateDependencies(componentId);
      }

      // Initialize component
      const initResult = await this.performInitialization(component, options);
      
      // Change state to initialized
      await this.changeComponentState(componentId, this.STATES.INITIALIZED, 'initialization_complete');

      // Execute after init hooks
      await this.executeHooks('afterInit', { component, initResult });

      // Emit event
      this.emit('lifecycleEvent', {
        type: 'componentInitialized',
        componentId,
        result: initResult,
        timestamp: Date.now()
      });

      console.log(`✅ Component initialized: ${componentId}`);

      return {
        success: true,
        componentId,
        state: this.STATES.INITIALIZED,
        result: initResult,
        message: `Component '${componentId}' initialized successfully`
      };

    } catch (error) {
      // Handle initialization error
      await this.handleComponentError(componentId, error, 'initialization');
      
      throw error;
    }
  }

  /**
   * Load a component
   * @param {string} componentId - Component ID
   * @param {Object} options - Loading options
   * @returns {Object} Loading result
   */
  async loadComponent(componentId, options = {}) {
    const component = this.components.get(componentId);
    
    if (!component) {
      throw new Error(`Component with ID '${componentId}' not found`);
    }

    // Check current state
    if (!this.canTransitionTo(componentId, this.STATES.LOADING)) {
      throw new Error(`Component '${componentId}' cannot be loaded from state '${component.state}'`);
    }

    // Execute before load hooks
    await this.executeHooks('beforeLoad', { component, options });

    // Change state to loading
    await this.changeComponentState(componentId, this.STATES.LOADING, 'loading');

    try {
      const startTime = performance.now();

      // Load component instance
      const instance = await this.performComponentLoad(component, options);
      
      // Store instance
      this.componentInstances.set(componentId, instance);
      component.instance = instance;
      component.metadata.loadCount++;
      component.metadata.totalLoadTime += performance.now() - startTime;

      // Change state to loaded
      await this.changeComponentState(componentId, this.STATES.LOADED, 'loading_complete');

      // Execute after load hooks
      await this.executeHooks('afterLoad', { component, instance });

      // Emit event
      this.emit('lifecycleEvent', {
        type: 'componentLoaded',
        componentId,
        instance,
        loadTime: performance.now() - startTime,
        timestamp: Date.now()
      });

      console.log(`✅ Component loaded: ${componentId}`);

      return {
        success: true,
        componentId,
        state: this.STATES.LOADED,
        instance,
        loadTime: performance.now() - startTime,
        message: `Component '${componentId}' loaded successfully`
      };

    } catch (error) {
      // Handle loading error
      await this.handleComponentError(componentId, error, 'loading');
      
      throw error;
    }
  }

  /**
   * Activate a component
   * @param {string} componentId - Component ID
   * @param {Object} options - Activation options
   * @returns {Object} Activation result
   */
  async activateComponent(componentId, options = {}) {
    const component = this.components.get(componentId);
    
    if (!component) {
      throw new Error(`Component with ID '${componentId}' not found`);
    }

    // Check current state
    if (!this.canTransitionTo(componentId, this.STATES.ACTIVE)) {
      throw new Error(`Component '${componentId}' cannot be activated from state '${component.state}'`);
    }

    // Execute before activate hooks
    await this.executeHooks('beforeActivate', { component, options });

    // Change state to active
    await this.changeComponentState(componentId, this.STATES.ACTIVE, 'activation');

    try {
      const startTime = performance.now();

      // Activate component instance
      const activationResult = await this.performComponentActivation(component, options);
      
      component.metadata.activateCount++;
      component.activeSince = Date.now();

      // Execute after activate hooks
      await this.executeHooks('afterActivate', { component, activationResult });

      // Emit event
      this.emit('lifecycleEvent', {
        type: 'componentActivated',
        componentId,
        result: activationResult,
        timestamp: Date.now()
      });

      console.log(`✅ Component activated: ${componentId}`);

      return {
        success: true,
        componentId,
        state: this.STATES.ACTIVE,
        result: activationResult,
        message: `Component '${componentId}' activated successfully`
      };

    } catch (error) {
      // Handle activation error
      await this.handleComponentError(componentId, error, 'activation');
      
      throw error;
    }
  }

  /**
   * Deactivate a component
   * @param {string} componentId - Component ID
   * @param {Object} options - Deactivation options
   * @returns {Object} Deactivation result
   */
  async deactivateComponent(componentId, options = {}) {
    const component = this.components.get(componentId);
    
    if (!component) {
      throw new Error(`Component with ID '${componentId}' not found`);
    }

    // Check current state
    if (!this.canTransitionTo(componentId, this.STATES.INACTIVE)) {
      throw new Error(`Component '${componentId}' cannot be deactivated from state '${component.state}'`);
    }

    // Execute before deactivate hooks
    await this.executeHooks('beforeDeactivate', { component, options });

    // Change state to inactive
    await this.changeComponentState(componentId, this.STATES.INACTIVE, 'deactivation');

    try {
      // Update active time
      if (component.activeSince) {
        component.metadata.totalActiveTime += Date.now() - component.activeSince;
        component.activeSince = null;
      }

      // Deactivate component instance
      const deactivationResult = await this.performComponentDeactivation(component, options);

      // Execute after deactivate hooks
      await this.executeHooks('afterDeactivate', { component, deactivationResult });

      // Emit event
      this.emit('lifecycleEvent', {
        type: 'componentDeactivated',
        componentId,
        result: deactivationResult,
        timestamp: Date.now()
      });

      console.log(`✅ Component deactivated: ${componentId}`);

      return {
        success: true,
        componentId,
        state: this.STATES.INACTIVE,
        result: deactivationResult,
        message: `Component '${componentId}' deactivated successfully`
      };

    } catch (error) {
      // Handle deactivation error
      await this.handleComponentError(componentId, error, 'deactivation');
      
      throw error;
    }
  }

  /**
   * Update a component
   * @param {string} componentId - Component ID
   * @param {Object} updates - Updates to apply
   * @param {Object} options - Update options
   * @returns {Object} Update result
   */
  async updateComponent(componentId, updates, options = {}) {
    const component = this.components.get(componentId);
    
    if (!component) {
      throw new Error(`Component with ID '${componentId}' not found`);
    }

    // Check current state
    if (!this.canTransitionTo(componentId, this.STATES.UPDATING)) {
      throw new Error(`Component '${componentId}' cannot be updated from state '${component.state}'`);
    }

    // Execute before update hooks
    await this.executeHooks('beforeUpdate', { component, updates, options });

    // Change state to updating
    await this.changeComponentState(componentId, this.STATES.UPDATING, 'update');

    try {
      // Perform component update
      const updateResult = await this.performComponentUpdate(component, updates, options);

      // Return to previous state (active or inactive)
      const previousState = component.stateHistory[component.stateHistory.length - 2]?.state || this.STATES.INACTIVE;
      await this.changeComponentState(componentId, previousState, 'update_complete');

      // Execute after update hooks
      await this.executeHooks('afterUpdate', { component, updateResult });

      // Emit event
      this.emit('lifecycleEvent', {
        type: 'componentUpdated',
        componentId,
        updates,
        result: updateResult,
        timestamp: Date.now()
      });

      console.log(`✅ Component updated: ${componentId}`);

      return {
        success: true,
        componentId,
        state: previousState,
        result: updateResult,
        message: `Component '${componentId}' updated successfully`
      };

    } catch (error) {
      // Handle update error
      await this.handleComponentError(componentId, error, 'update');
      
      throw error;
    }
  }

  /**
   * Unload a component
   * @param {string} componentId - Component ID
   * @param {Object} options - Unload options
   * @returns {Object} Unload result
   */
  async unloadComponent(componentId, options = {}) {
    const component = this.components.get(componentId);
    
    if (!component) {
      throw new Error(`Component with ID '${componentId}' not found`);
    }

    // Check current state
    if (!this.canTransitionTo(componentId, this.STATES.UNLOADING)) {
      throw new Error(`Component '${componentId}' cannot be unloaded from state '${component.state}'`);
    }

    // Execute before unload hooks
    await this.executeHooks('beforeUnload', { component, options });

    // Change state to unloading
    await this.changeComponentState(componentId, this.STATES.UNLOADING, 'unloading');

    try {
      // Update active time if component was active
      if (component.activeSince) {
        component.metadata.totalActiveTime += Date.now() - component.activeSince;
        component.activeSince = null;
      }

      // Unload component instance
      const unloadResult = await this.performComponentUnload(component, options);
      
      // Remove instance
      this.componentInstances.delete(componentId);
      component.instance = null;

      // Change state to unloaded
      await this.changeComponentState(componentId, this.STATES.UNLOADED, 'unloading_complete');

      // Execute after unload hooks
      await this.executeHooks('afterUnload', { component, unloadResult });

      // Emit event
      this.emit('lifecycleEvent', {
        type: 'componentUnloaded',
        componentId,
        result: unloadResult,
        timestamp: Date.now()
      });

      console.log(`✅ Component unloaded: ${componentId}`);

      return {
        success: true,
        componentId,
        state: this.STATES.UNLOADED,
        result: unloadResult,
        message: `Component '${componentId}' unloaded successfully`
      };

    } catch (error) {
      // Handle unload error
      await this.handleComponentError(componentId, error, 'unloading');
      
      throw error;
    }
  }

  /**
   * Unregister a component
   * @param {string} componentId - Component ID
   * @param {Object} options - Unregister options
   * @returns {Object} Unregister result
   */
  async unregisterComponent(componentId, options = {}) {
    const component = this.components.get(componentId);
    
    if (!component) {
      throw new Error(`Component with ID '${componentId}' not found`);
    }

    // Check current state
    if (!this.canTransitionTo(componentId, this.STATES.UNREGISTERING)) {
      throw new Error(`Component '${componentId}' cannot be unregistered from state '${component.state}'`);
    }

    // Execute before unregister hooks
    await this.executeHooks('beforeUnregister', { component, options });

    // Change state to unregistering
    await this.changeComponentState(componentId, this.STATES.UNREGISTERING, 'unregistering');

    try {
      // Ensure component is unloaded first
      if (component.instance) {
        await this.unloadComponent(componentId, { force: true });
      }

      // Perform cleanup
      await this.performComponentUnregister(component, options);

      // Remove from registries
      this.components.delete(componentId);
      this.componentStates.delete(componentId);
      this.componentInstances.delete(componentId);
      this.componentDependencies.delete(componentId);
      this.errorHistory.delete(componentId);
      this.recoveryAttempts.delete(componentId);
      this.performanceMetrics.delete(componentId);

      // Execute after unregister hooks
      await this.executeHooks('afterUnregister', { componentId, component });

      // Emit event
      this.emit('lifecycleEvent', {
        type: 'componentUnregistered',
        componentId,
        timestamp: Date.now()
      });

      console.log(`✅ Component unregistered: ${componentId}`);

      return {
        success: true,
        componentId,
        state: this.STATES.UNREGISTERED,
        message: `Component '${componentId}' unregistered successfully`
      };

    } catch (error) {
      // Handle unregister error
      await this.handleComponentError(componentId, error, 'unregistering');
      
      throw error;
    }
  }

  /**
   * Get component state
   * @param {string} componentId - Component ID
   * @returns {Object} Component state information
   */
  getComponentState(componentId) {
    const component = this.components.get(componentId);
    
    if (!component) {
      throw new Error(`Component with ID '${componentId}' not found`);
    }

    return {
      id: componentId,
      state: component.state,
      lastStateChange: component.lastStateChange,
      stateHistory: [...component.stateHistory],
      metadata: { ...component.metadata },
      canTransitionTo: this.TRANSITIONS[component.state] || []
    };
  }

  /**
   * Get all components and their states
   * @param {Object} filter - Filter criteria
   * @returns {Array} List of components with states
   */
  getAllComponents(filter = {}) {
    let components = Array.from(this.components.values());
    
    // Apply filters
    if (filter.state) {
      components = components.filter(c => c.state === filter.state);
    }
    
    if (filter.type) {
      components = components.filter(c => c.type === filter.type);
    }
    
    if (filter.hasErrors) {
      components = components.filter(c => this.errorHistory.has(c.id));
    }
    
    return components.map(component => ({
      id: component.id,
      name: component.name,
      type: component.type,
      version: component.version,
      state: component.state,
      registeredAt: component.registeredAt,
      lastStateChange: component.lastStateChange,
      metadata: { ...component.metadata },
      hasInstance: !!component.instance,
      hasErrors: this.errorHistory.has(component.id)
    }));
  }

  /**
   * Private helper methods
   */

  validateComponentData(data) {
    const required = ['id', 'name', 'type'];
    for (const field of required) {
      if (!data[field]) {
        throw new Error(`Required field '${field}' is missing`);
      }
    }
  }

  canTransitionTo(componentId, targetState) {
    const component = this.components.get(componentId);
    if (!component) return false;
    
    const allowedTransitions = this.TRANSITIONS[component.state];
    return allowedTransitions && allowedTransitions.includes(targetState);
  }

  async changeComponentState(componentId, newState, reason) {
    const component = this.components.get(componentId);
    if (!component) return;

    const oldState = component.state;
    component.state = newState;
    component.lastStateChange = Date.now();
    
    // Add to state history
    component.stateHistory.push({
      state: newState,
      timestamp: Date.now(),
      reason,
      previousState: oldState
    });
    
    // Update state registry
    this.componentStates.set(componentId, newState);
    
    // Execute state change hooks
    await this.executeHooks('onStateChange', { 
      componentId, 
      oldState, 
      newState, 
      reason 
    });
    
    // Emit state change event
    this.emit('stateChanged', {
      componentId,
      oldState,
      newState,
      reason,
      timestamp: Date.now()
    });
  }

  async executeHooks(hookName, data) {
    const hooks = this.hooks[hookName];
    if (!hooks) return;
    
    const promises = Array.from(hooks).map(async (hook) => {
      try {
        await hook(data);
      } catch (error) {
        console.error(`Hook '${hookName}' failed:`, error);
      }
    });
    
    await Promise.all(promises);
  }

  registerComponentHooks(componentId, hooks) {
    // Register component-specific hooks
    for (const [hookName, hookFunction] of Object.entries(hooks)) {
      if (typeof hookFunction === 'function') {
        const wrappedHook = (data) => {
          if (data.component?.id === componentId || data.componentId === componentId) {
            return hookFunction(data);
          }
        };
        
        if (this.hooks[hookName]) {
          this.hooks[hookName].add(wrappedHook);
        }
      }
    }
  }

  async validateDependencies(componentId) {
    const component = this.components.get(componentId);
    if (!component) return;
    
    for (const dependencyId of component.dependencies) {
      const dependency = this.components.get(dependencyId);
      if (!dependency) {
        throw new Error(`Dependency '${dependencyId}' not found for component '${componentId}'`);
      }
      
      // Check if dependency is in a valid state
      const validStates = [this.STATES.INITIALIZED, this.STATES.LOADED, this.STATES.ACTIVE];
      if (!validStates.includes(dependency.state)) {
        throw new Error(`Dependency '${dependencyId}' is in invalid state '${dependency.state}'`);
      }
    }
  }

  async handleComponentError(componentId, error, phase) {
    const component = this.components.get(componentId);
    if (!component) return;
    
    // Record error
    if (!this.errorHistory.has(componentId)) {
      this.errorHistory.set(componentId, []);
    }
    
    this.errorHistory.get(componentId).push({
      error: error.message,
      phase,
      timestamp: Date.now(),
      state: component.state
    });
    
    component.metadata.errorCount++;
    
    // Change to error state
    await this.changeComponentState(componentId, this.STATES.ERROR, `error_in_${phase}`);
    
    // Execute error hooks
    await this.executeHooks('onError', { componentId, error, phase });
    
    // Emit error event
    this.emit('componentError', {
      componentId,
      error: error.message,
      phase,
      state: component.state,
      timestamp: Date.now()
    });
    
    // Attempt recovery if enabled
    if (this.config.enableAutoRecovery) {
      await this.attemptRecovery(componentId, error, phase);
    }
  }

  async attemptRecovery(componentId, error, phase) {
    const component = this.components.get(componentId);
    if (!component) return;
    
    const attempts = this.recoveryAttempts.get(componentId) || 0;
    if (attempts >= this.config.maxRetryAttempts) {
      console.error(`Recovery failed for component '${componentId}' after ${attempts} attempts`);
      return;
    }
    
    this.recoveryAttempts.set(componentId, attempts + 1);
    
    console.log(`Attempting recovery for component '${componentId}' (attempt ${attempts + 1})`);
    
    // Wait before retry
    await new Promise(resolve => setTimeout(resolve, this.config.retryDelay));
    
    try {
      // Attempt recovery based on phase
      switch (phase) {
        case 'initialization':
          await this.initializeComponent(componentId);
          break;
        case 'loading':
          await this.loadComponent(componentId);
          break;
        case 'activation':
          await this.activateComponent(componentId);
          break;
        case 'update':
          // Return to previous state
          const previousState = component.stateHistory[component.stateHistory.length - 2]?.state || this.STATES.INACTIVE;
          await this.changeComponentState(componentId, previousState, 'recovery');
          break;
        default:
          console.warn(`No recovery strategy for phase: ${phase}`);
      }
      
      // Clear recovery attempts on success
      this.recoveryAttempts.delete(componentId);
      console.log(`Recovery successful for component '${componentId}'`);
      
    } catch (recoveryError) {
      console.error(`Recovery failed for component '${componentId}':`, recoveryError);
      // Will retry on next call if under max attempts
    }
  }

  // Placeholder methods for component-specific operations
  async performInitialization(component, options) {
    // Component-specific initialization logic
    return { initialized: true };
  }

  async performComponentLoad(component, options) {
    // Component-specific loading logic
    return { loaded: true };
  }

  async performComponentActivation(component, options) {
    // Component-specific activation logic
    return { activated: true };
  }

  async performComponentDeactivation(component, options) {
    // Component-specific deactivation logic
    return { deactivated: true };
  }

  async performComponentUpdate(component, updates, options) {
    // Component-specific update logic
    return { updated: true };
  }

  async performComponentUnload(component, options) {
    // Component-specific unloading logic
    return { unloaded: true };
  }

  async performComponentUnregister(component, options) {
    // Component-specific cleanup logic
    return { unregistered: true };
  }

  startCleanupTimer() {
    setInterval(() => {
      this.performCleanup();
    }, this.config.cleanupInterval);
  }

  performCleanup() {
    // Clean up old error history
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours
    const now = Date.now();
    
    for (const [componentId, errors] of this.errorHistory) {
      const filteredErrors = errors.filter(error => now - error.timestamp < maxAge);
      this.errorHistory.set(componentId, filteredErrors);
    }
    
    // Clean up recovery attempts for components that are no longer in error state
    for (const [componentId, attempts] of this.recoveryAttempts) {
      const component = this.components.get(componentId);
      if (component && component.state !== this.STATES.ERROR) {
        this.recoveryAttempts.delete(componentId);
      }
    }
  }

  /**
   * Hook registration methods
   */

  addHook(hookName, hookFunction) {
    if (this.hooks[hookName]) {
      this.hooks[hookName].add(hookFunction);
    } else {
      throw new Error(`Unknown hook: ${hookName}`);
    }
  }

  removeHook(hookName, hookFunction) {
    if (this.hooks[hookName]) {
      this.hooks[hookName].delete(hookFunction);
    }
  }

  /**
   * Get lifecycle statistics
   * @returns {Object} Lifecycle statistics
   */
  getLifecycleStats() {
    const stats = {
      totalComponents: this.components.size,
      stateDistribution: {},
      errorCount: 0,
      averageLoadTime: 0,
      averageActiveTime: 0,
      totalErrors: 0
    };
    
    // Calculate state distribution
    for (const component of this.components.values()) {
      stats.stateDistribution[component.state] = (stats.stateDistribution[component.state] || 0) + 1;
      
      if (component.metadata.errorCount > 0) {
        stats.errorCount++;
        stats.totalErrors += component.metadata.errorCount;
      }
    }
    
    // Calculate averages
    let totalLoadTime = 0;
    let totalActiveTime = 0;
    let loadCount = 0;
    
    for (const component of this.components.values()) {
      if (component.metadata.loadCount > 0) {
        totalLoadTime += component.metadata.totalLoadTime;
        loadCount += component.metadata.loadCount;
      }
      
      totalActiveTime += component.metadata.totalActiveTime;
    }
    
    stats.averageLoadTime = loadCount > 0 ? totalLoadTime / loadCount : 0;
    stats.averageActiveTime = this.components.size > 0 ? totalActiveTime / this.components.size : 0;
    
    return stats;
  }
}