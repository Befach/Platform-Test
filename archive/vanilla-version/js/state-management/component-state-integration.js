/**
 * Component State Integration System
 * Provides seamless state-aware component lifecycle management and automatic UI updates
 */

class ComponentStateIntegration {
    constructor(stateStore, options = {}) {
        this.stateStore = stateStore;
        this.options = {
            autoSubscribe: options.autoSubscribe !== false,
            enableOptimisticUpdates: options.enableOptimisticUpdates !== false,
            enableComponentIsolation: options.enableComponentIsolation !== false,
            enableStateSharing: options.enableStateSharing !== false,
            updateThrottleMs: options.updateThrottleMs || 16,
            maxComponentSubscriptions: options.maxComponentSubscriptions || 100,
            enablePerformanceMonitoring: options.enablePerformanceMonitoring !== false,
            ...options
        };
        
        this.componentRegistry = new Map();
        this.componentSubscriptions = new Map();
        this.sharedState = new Map();
        this.componentIsolation = new Map();
        this.updateQueue = [];
        this.isProcessingUpdates = false;
        
        this.metrics = {
            componentsRegistered: 0,
            subscriptionsCreated: 0,
            updatesProcessed: 0,
            averageUpdateTime: 0,
            totalUpdateTime: 0,
            optimisticUpdates: 0,
            rollbackOperations: 0
        };
        
        this.performanceMonitor = null;
        
        if (this.options.enablePerformanceMonitoring) {
            this.initializePerformanceMonitor();
        }
        
        this.setupStateStoreIntegration();
    }

    /**
     * Initialize performance monitor
     */
    initializePerformanceMonitor() {
        this.performanceMonitor = {
            componentMetrics: new Map(),
            updateTimes: [],
            renderTimes: [],
            
            recordComponentUpdate: (componentId, updateTime, renderTime) => {
                if (!this.performanceMonitor.componentMetrics.has(componentId)) {
                    this.performanceMonitor.componentMetrics.set(componentId, {
                        updateCount: 0,
                        totalUpdateTime: 0,
                        totalRenderTime: 0,
                        averageUpdateTime: 0,
                        averageRenderTime: 0
                    });
                }
                
                const metrics = this.performanceMonitor.componentMetrics.get(componentId);
                metrics.updateCount++;
                metrics.totalUpdateTime += updateTime;
                metrics.totalRenderTime += renderTime;
                metrics.averageUpdateTime = metrics.totalUpdateTime / metrics.updateCount;
                metrics.averageRenderTime = metrics.totalRenderTime / metrics.updateCount;
                
                this.performanceMonitor.updateTimes.push(updateTime);
                this.performanceMonitor.renderTimes.push(renderTime);
                
                // Keep only last 100 measurements
                if (this.performanceMonitor.updateTimes.length > 100) {
                    this.performanceMonitor.updateTimes.shift();
                    this.performanceMonitor.renderTimes.shift();
                }
            },
            
            getMetrics: () => {
                const componentMetrics = {};
                for (const [componentId, metrics] of this.performanceMonitor.componentMetrics) {
                    componentMetrics[componentId] = { ...metrics };
                }
                
                return {
                    componentMetrics,
                    averageUpdateTime: this.performanceMonitor.updateTimes.reduce((a, b) => a + b, 0) / this.performanceMonitor.updateTimes.length,
                    averageRenderTime: this.performanceMonitor.renderTimes.reduce((a, b) => a + b, 0) / this.performanceMonitor.renderTimes.length,
                    totalComponents: this.performanceMonitor.componentMetrics.size
                };
            }
        };
    }

    /**
     * Setup state store integration
     */
    setupStateStoreIntegration() {
        // Subscribe to state changes for component updates
        if (this.options.autoSubscribe) {
            this.stateStore.subscribe((newState, previousState, action) => {
                this.handleStateChange(newState, previousState, action);
            });
        }
    }

    /**
     * Register component for state integration
     */
    registerComponent(component, options = {}) {
        const componentId = this.generateComponentId(component);
        
        try {
            const componentConfig = {
                id: componentId,
                element: component.element || component,
                statePaths: options.statePaths || [],
                stateSelector: options.stateSelector || null,
                onStateChange: options.onStateChange || null,
                onMount: options.onMount || null,
                onUnmount: options.onUnmount || null,
                optimisticUpdates: options.optimisticUpdates || false,
                isolated: options.isolated || false,
                sharedStateKeys: options.sharedStateKeys || [],
                updateStrategy: options.updateStrategy || 'auto',
                throttle: options.throttle || this.options.updateThrottleMs,
                ...options
            };
            
            // Register component
            this.componentRegistry.set(componentId, componentConfig);
            
            // Create state subscriptions
            if (componentConfig.statePaths.length > 0) {
                this.createComponentSubscriptions(componentId, componentConfig);
            }
            
            // Setup component isolation if enabled
            if (componentConfig.isolated && this.options.enableComponentIsolation) {
                this.setupComponentIsolation(componentId, componentConfig);
            }
            
            // Setup shared state if enabled
            if (componentConfig.sharedStateKeys.length > 0 && this.options.enableStateSharing) {
                this.setupSharedState(componentId, componentConfig);
            }
            
            // Call mount callback
            if (componentConfig.onMount) {
                componentConfig.onMount(componentConfig);
            }
            
            // Update metrics
            this.metrics.componentsRegistered++;
            
            console.log(`[ComponentStateIntegration] Component registered: ${componentId}`);
            return componentId;
            
        } catch (error) {
            console.error(`[ComponentStateIntegration] Failed to register component:`, error);
            throw error;
        }
    }

    /**
     * Unregister component
     */
    unregisterComponent(componentId) {
        try {
            const componentConfig = this.componentRegistry.get(componentId);
            if (!componentConfig) {
                console.warn(`[ComponentStateIntegration] Component not found: ${componentId}`);
                return;
            }
            
            // Call unmount callback
            if (componentConfig.onUnmount) {
                componentConfig.onUnmount(componentConfig);
            }
            
            // Remove subscriptions
            this.removeComponentSubscriptions(componentId);
            
            // Remove isolation
            if (this.componentIsolation.has(componentId)) {
                this.componentIsolation.delete(componentId);
            }
            
            // Remove shared state
            for (const key of componentConfig.sharedStateKeys) {
                const sharedComponents = this.sharedState.get(key);
                if (sharedComponents) {
                    const index = sharedComponents.indexOf(componentId);
                    if (index > -1) {
                        sharedComponents.splice(index, 1);
                    }
                    
                    if (sharedComponents.length === 0) {
                        this.sharedState.delete(key);
                    }
                }
            }
            
            // Remove from registry
            this.componentRegistry.delete(componentId);
            
            console.log(`[ComponentStateIntegration] Component unregistered: ${componentId}`);
            
        } catch (error) {
            console.error(`[ComponentStateIntegration] Failed to unregister component:`, error);
        }
    }

    /**
     * Create component subscriptions
     */
    createComponentSubscriptions(componentId, componentConfig) {
        const subscriptions = [];
        
        for (const statePath of componentConfig.statePaths) {
            const subscription = this.stateStore.subscribe((newState, previousState, action) => {
                this.handleComponentStateChange(componentId, statePath, newState, previousState, action);
            });
            
            subscriptions.push({
                statePath,
                subscription
            });
        }
        
        this.componentSubscriptions.set(componentId, subscriptions);
        this.metrics.subscriptionsCreated += subscriptions.length;
    }

    /**
     * Remove component subscriptions
     */
    removeComponentSubscriptions(componentId) {
        const subscriptions = this.componentSubscriptions.get(componentId);
        if (subscriptions) {
            for (const { subscription } of subscriptions) {
                subscription();
            }
            this.componentSubscriptions.delete(componentId);
        }
    }

    /**
     * Setup component isolation
     */
    setupComponentIsolation(componentId, componentConfig) {
        const isolatedState = {
            original: {},
            modified: {},
            timestamp: Date.now()
        };
        
        // Create isolated copy of relevant state
        for (const statePath of componentConfig.statePaths) {
            const stateValue = this.stateStore.getStateSlice(statePath);
            isolatedState.original[statePath] = this.deepClone(stateValue);
            isolatedState.modified[statePath] = this.deepClone(stateValue);
        }
        
        this.componentIsolation.set(componentId, isolatedState);
    }

    /**
     * Setup shared state
     */
    setupSharedState(componentId, componentConfig) {
        for (const key of componentConfig.sharedStateKeys) {
            if (!this.sharedState.has(key)) {
                this.sharedState.set(key, []);
            }
            
            this.sharedState.get(key).push(componentId);
        }
    }

    /**
     * Handle global state change
     */
    handleStateChange(newState, previousState, action) {
        // Queue update for processing
        this.queueUpdate({
            type: 'global_state_change',
            newState,
            previousState,
            action,
            timestamp: Date.now()
        });
    }

    /**
     * Handle component-specific state change
     */
    handleComponentStateChange(componentId, statePath, newState, previousState, action) {
        const componentConfig = this.componentRegistry.get(componentId);
        if (!componentConfig) {
            return;
        }
        
        // Check if component is isolated
        if (componentConfig.isolated && this.componentIsolation.has(componentId)) {
            this.handleIsolatedComponentStateChange(componentId, statePath, newState, previousState, action);
            return;
        }
        
        // Get state values
        const newValue = this.getNestedValue(newState, statePath);
        const previousValue = this.getNestedValue(previousState, statePath);
        
        // Check if value actually changed
        if (this.deepEqual(newValue, previousValue)) {
            return;
        }
        
        // Queue component update
        this.queueUpdate({
            type: 'component_state_change',
            componentId,
            statePath,
            newValue,
            previousValue,
            action,
            timestamp: Date.now()
        });
    }

    /**
     * Handle isolated component state change
     */
    handleIsolatedComponentStateChange(componentId, statePath, newState, previousState, action) {
        const isolatedState = this.componentIsolation.get(componentId);
        if (!isolatedState) {
            return;
        }
        
        // Update isolated state
        isolatedState.modified[statePath] = this.getNestedValue(newState, statePath);
        
        // Check if component wants to be notified of external changes
        const componentConfig = this.componentRegistry.get(componentId);
        if (componentConfig.notifyExternalChanges) {
            this.queueUpdate({
                type: 'isolated_component_state_change',
                componentId,
                statePath,
                externalValue: this.getNestedValue(newState, statePath),
                isolatedValue: isolatedState.modified[statePath],
                action,
                timestamp: Date.now()
            });
        }
    }

    /**
     * Queue update for processing
     */
    queueUpdate(update) {
        this.updateQueue.push(update);
        
        if (!this.isProcessingUpdates) {
            this.processUpdateQueue();
        }
    }

    /**
     * Process update queue
     */
    async processUpdateQueue() {
        if (this.isProcessingUpdates || this.updateQueue.length === 0) {
            return;
        }
        
        this.isProcessingUpdates = true;
        
        try {
            while (this.updateQueue.length > 0) {
                const update = this.updateQueue.shift();
                await this.processUpdate(update);
            }
        } finally {
            this.isProcessingUpdates = false;
        }
    }

    /**
     * Process individual update
     */
    async processUpdate(update) {
        const startTime = performance.now();
        
        try {
            switch (update.type) {
                case 'global_state_change':
                    await this.processGlobalStateChange(update);
                    break;
                    
                case 'component_state_change':
                    await this.processComponentStateChange(update);
                    break;
                    
                case 'isolated_component_state_change':
                    await this.processIsolatedComponentStateChange(update);
                    break;
                    
                default:
                    console.warn(`[ComponentStateIntegration] Unknown update type: ${update.type}`);
            }
            
            // Update metrics
            const endTime = performance.now();
            const duration = endTime - startTime;
            this.updateMetrics(duration);
            
        } catch (error) {
            console.error(`[ComponentStateIntegration] Failed to process update:`, error);
        }
    }

    /**
     * Process global state change
     */
    async processGlobalStateChange(update) {
        const { newState, previousState, action } = update;
        
        // Notify all components that subscribe to global changes
        for (const [componentId, componentConfig] of this.componentRegistry) {
            if (componentConfig.subscribeToGlobalChanges) {
                await this.notifyComponent(componentId, newState, previousState, action);
            }
        }
    }

    /**
     * Process component state change
     */
    async processComponentStateChange(update) {
        const { componentId, newValue, previousValue, action } = update;
        
        await this.notifyComponent(componentId, newValue, previousValue, action);
    }

    /**
     * Process isolated component state change
     */
    async processIsolatedComponentStateChange(update) {
        const { componentId, externalValue, isolatedValue, action } = update;
        
        const componentConfig = this.componentRegistry.get(componentId);
        if (componentConfig.onExternalStateChange) {
            await componentConfig.onExternalStateChange({
                componentId,
                externalValue,
                isolatedValue,
                action
            });
        }
    }

    /**
     * Notify component of state change
     */
    async notifyComponent(componentId, newValue, previousValue, action) {
        const componentConfig = this.componentRegistry.get(componentId);
        if (!componentConfig) {
            return;
        }
        
        const startTime = performance.now();
        
        try {
            // Apply state selector if provided
            let selectedValue = newValue;
            let selectedPreviousValue = previousValue;
            
            if (componentConfig.stateSelector) {
                selectedValue = componentConfig.stateSelector(newValue);
                selectedPreviousValue = componentConfig.stateSelector(previousValue);
            }
            
            // Call state change callback
            if (componentConfig.onStateChange) {
                await componentConfig.onStateChange({
                    componentId,
                    newValue: selectedValue,
                    previousValue: selectedPreviousValue,
                    action,
                    timestamp: Date.now()
                });
            }
            
            // Update component DOM if needed
            await this.updateComponentDOM(componentId, selectedValue, selectedPreviousValue);
            
            // Record performance metrics
            if (this.performanceMonitor) {
                const endTime = performance.now();
                const renderTime = endTime - startTime;
                this.performanceMonitor.recordComponentUpdate(componentId, startTime, renderTime);
            }
            
        } catch (error) {
            console.error(`[ComponentStateIntegration] Failed to notify component ${componentId}:`, error);
        }
    }

    /**
     * Update component DOM
     */
    async updateComponentDOM(componentId, newValue, previousValue) {
        const componentConfig = this.componentRegistry.get(componentId);
        if (!componentConfig) {
            return;
        }
        
        const element = componentConfig.element;
        if (!element || !element.parentNode) {
            return;
        }
        
        // Apply DOM updates based on update strategy
        switch (componentConfig.updateStrategy) {
            case 'replace':
                this.replaceElementContent(element, newValue);
                break;
                
            case 'merge':
                this.mergeElementContent(element, newValue);
                break;
                
            case 'css':
                this.updateElementCSS(element, newValue);
                break;
                
            case 'attributes':
                this.updateElementAttributes(element, newValue);
                break;
                
            case 'auto':
            default:
                this.autoUpdateElement(element, newValue, previousValue);
                break;
        }
    }

    /**
     * Auto-update element (intelligent detection)
     */
    autoUpdateElement(element, newValue, previousValue) {
        // Detect element type and update accordingly
        if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
            if (element.type === 'checkbox') {
                element.checked = Boolean(newValue);
            } else if (element.type === 'radio') {
                element.checked = element.value === String(newValue);
            } else {
                element.value = String(newValue || '');
            }
        } else if (element.tagName === 'SELECT') {
            element.value = String(newValue || '');
        } else if (element.tagName === 'IMG') {
            if (typeof newValue === 'string') {
                element.src = newValue;
            } else if (newValue && newValue.src) {
                element.src = newValue.src;
            }
        } else if (element.tagName === 'A') {
            if (typeof newValue === 'string') {
                element.href = newValue;
                element.textContent = newValue;
            } else if (newValue) {
                element.href = newValue.href || '#';
                element.textContent = newValue.text || newValue.title || '';
            }
        } else {
            // Default: update text content or inner HTML
            if (typeof newValue === 'string') {
                if (newValue.includes('<') && newValue.includes('>')) {
                    element.innerHTML = newValue;
                } else {
                    element.textContent = newValue;
                }
            } else if (typeof newValue === 'object' && newValue !== null) {
                element.textContent = JSON.stringify(newValue);
            } else {
                element.textContent = String(newValue || '');
            }
        }
    }

    /**
     * Replace element content
     */
    replaceElementContent(element, newValue) {
        if (typeof newValue === 'string') {
            element.innerHTML = newValue;
        } else {
            element.textContent = String(newValue || '');
        }
    }

    /**
     * Merge element content
     */
    mergeElementContent(element, newValue) {
        if (typeof newValue === 'object' && newValue !== null) {
            // Merge object properties
            for (const [key, value] of Object.entries(newValue)) {
                if (key === 'text') {
                    element.textContent = String(value || '');
                } else if (key === 'html') {
                    element.innerHTML = String(value || '');
                } else if (key === 'class') {
                    element.className = String(value || '');
                } else if (key === 'style') {
                    Object.assign(element.style, value);
                } else {
                    element.setAttribute(key, String(value || ''));
                }
            }
        } else {
            this.autoUpdateElement(element, newValue);
        }
    }

    /**
     * Update element CSS
     */
    updateElementCSS(element, newValue) {
        if (typeof newValue === 'object' && newValue !== null) {
            Object.assign(element.style, newValue);
        } else if (typeof newValue === 'string') {
            element.className = newValue;
        }
    }

    /**
     * Update element attributes
     */
    updateElementAttributes(element, newValue) {
        if (typeof newValue === 'object' && newValue !== null) {
            for (const [key, value] of Object.entries(newValue)) {
                if (value === null || value === undefined) {
                    element.removeAttribute(key);
                } else {
                    element.setAttribute(key, String(value));
                }
            }
        }
    }

    /**
     * Optimistic update
     */
    async optimisticUpdate(componentId, updateFn, rollbackFn) {
        if (!this.options.enableOptimisticUpdates) {
            return;
        }
        
        const componentConfig = this.componentRegistry.get(componentId);
        if (!componentConfig || !componentConfig.optimisticUpdates) {
            return;
        }
        
        try {
            // Apply optimistic update
            await updateFn();
            this.metrics.optimisticUpdates++;
            
            // Store rollback function
            if (rollbackFn) {
                if (!this.optimisticRollbacks) {
                    this.optimisticRollbacks = new Map();
                }
                this.optimisticRollbacks.set(componentId, rollbackFn);
            }
            
        } catch (error) {
            console.error(`[ComponentStateIntegration] Optimistic update failed for ${componentId}:`, error);
            
            // Rollback if available
            if (rollbackFn) {
                try {
                    await rollbackFn();
                    this.metrics.rollbackOperations++;
                } catch (rollbackError) {
                    console.error(`[ComponentStateIntegration] Rollback failed for ${componentId}:`, rollbackError);
                }
            }
            
            throw error;
        }
    }

    /**
     * Share state between components
     */
    shareState(key, value, sourceComponentId = null) {
        if (!this.options.enableStateSharing) {
            return;
        }
        
        // Store shared value
        this.sharedState.set(key, value);
        
        // Notify all components that share this key
        const componentIds = this.sharedState.get(key) || [];
        for (const componentId of componentIds) {
            if (componentId !== sourceComponentId) {
                const componentConfig = this.componentRegistry.get(componentId);
                if (componentConfig && componentConfig.onSharedStateChange) {
                    componentConfig.onSharedStateChange({
                        key,
                        value,
                        sourceComponentId,
                        timestamp: Date.now()
                    });
                }
            }
        }
    }

    /**
     * Get shared state
     */
    getSharedState(key) {
        return this.sharedState.get(key);
    }

    /**
     * Utility methods
     */
    generateComponentId(component) {
        if (component.id) {
            return component.id;
        }
        
        if (component.element && component.element.id) {
            return component.element.id;
        }
        
        if (component.element) {
            return `component_${component.element.tagName.toLowerCase()}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        }
        
        return `component_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    getNestedValue(obj, path) {
        return path.split('.').reduce((current, key) => {
            return current && current[key] !== undefined ? current[key] : null;
        }, obj);
    }

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

    deepEqual(a, b) {
        if (a === b) {
            return true;
        }
        
        if (a === null || b === null || typeof a !== typeof b) {
            return false;
        }
        
        if (typeof a !== 'object') {
            return a === b;
        }
        
        const keysA = Object.keys(a);
        const keysB = Object.keys(b);
        
        if (keysA.length !== keysB.length) {
            return false;
        }
        
        for (const key of keysA) {
            if (!keysB.includes(key) || !this.deepEqual(a[key], b[key])) {
                return false;
            }
        }
        
        return true;
    }

    /**
     * Update metrics
     */
    updateMetrics(duration) {
        this.metrics.updatesProcessed++;
        this.metrics.totalUpdateTime += duration;
        this.metrics.averageUpdateTime = this.metrics.totalUpdateTime / this.metrics.updatesProcessed;
    }

    /**
     * Get component configuration
     */
    getComponent(componentId) {
        return this.componentRegistry.get(componentId);
    }

    /**
     * Get all registered components
     */
    getComponents() {
        return Array.from(this.componentRegistry.values());
    }

    /**
     * Get metrics
     */
    getMetrics() {
        return {
            ...this.metrics,
            componentsRegistered: this.componentRegistry.size,
            activeSubscriptions: this.componentSubscriptions.size,
            sharedStateKeys: this.sharedState.size,
            isolatedComponents: this.componentIsolation.size,
            queuedUpdates: this.updateQueue.length,
            performanceMetrics: this.performanceMonitor ? this.performanceMonitor.getMetrics() : null
        };
    }

    /**
     * Clear all components
     */
    clear() {
        // Unregister all components
        for (const componentId of this.componentRegistry.keys()) {
            this.unregisterComponent(componentId);
        }
        
        // Clear queues
        this.updateQueue = [];
        
        // Clear shared state
        this.sharedState.clear();
        
        // Clear isolation
        this.componentIsolation.clear();
        
        console.log('[ComponentStateIntegration] All components cleared');
    }

    /**
     * Destroy integration system
     */
    destroy() {
        this.clear();
        
        if (this.performanceMonitor) {
            this.performanceMonitor.componentMetrics.clear();
            this.performanceMonitor.updateTimes = [];
            this.performanceMonitor.renderTimes = [];
        }
        
        this.optimisticRollbacks = null;
        this.stateStore = null;
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ComponentStateIntegration;
} else if (typeof window !== 'undefined') {
    window.ComponentStateIntegration = ComponentStateIntegration;
}