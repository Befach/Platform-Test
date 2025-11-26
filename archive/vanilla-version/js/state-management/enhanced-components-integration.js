/**
 * Enhanced Components Integration
 * Integrates the state management system with existing enhanced interface components
 */

class EnhancedComponentsIntegration {
    constructor(stateManagementIntegration, options = {}) {
        this.stateIntegration = stateManagementIntegration;
        this.options = {
            enableAutoBinding: options.enableAutoBinding !== false,
            enableResponsiveState: options.enableResponsiveState !== false,
            enableThemeIntegration: options.enableThemeIntegration !== false,
            enableNavigationIntegration: options.enableNavigationIntegration !== false,
            enableMicroInteractions: options.enableMicroInteractions !== false,
            enableAccessibilityIntegration: options.enableAccessibilityIntegration !== false,
            ...options
        };
        
        this.componentBindings = new Map();
        this.themeManager = null;
        this.navigationManager = null;
        this.microInteractionManager = null;
        this.accessibilityManager = null;
        
        this.isInitialized = false;
        
        console.log('[EnhancedComponentsIntegration] Initializing...');
    }

    /**
     * Initialize enhanced components integration
     */
    async initialize() {
        if (this.isInitialized) {
            console.warn('[EnhancedComponentsIntegration] Already initialized');
            return;
        }

        try {
            console.log('[EnhancedComponentsIntegration] Starting initialization...');
            
            // Initialize theme integration
            if (this.options.enableThemeIntegration) {
                await this.initializeThemeIntegration();
            }
            
            // Initialize navigation integration
            if (this.options.enableNavigationIntegration) {
                await this.initializeNavigationIntegration();
            }
            
            // Initialize micro-interactions integration
            if (this.options.enableMicroInteractions) {
                await this.initializeMicroInteractionsIntegration();
            }
            
            // Initialize accessibility integration
            if (this.options.enableAccessibilityIntegration) {
                await this.initializeAccessibilityIntegration();
            }
            
            // Setup auto-binding if enabled
            if (this.options.enableAutoBinding) {
                await this.setupAutoBinding();
            }
            
            // Setup responsive state if enabled
            if (this.options.enableResponsiveState) {
                await this.setupResponsiveState();
            }
            
            // Bind existing enhanced components
            await this.bindExistingComponents();
            
            this.isInitialized = true;
            console.log('[EnhancedComponentsIntegration] Initialization completed successfully');
            
        } catch (error) {
            console.error('[EnhancedComponentsIntegration] Initialization failed:', error);
            throw error;
        }
    }

    /**
     * Initialize theme integration
     */
    async initializeThemeIntegration() {
        console.log('[EnhancedComponentsIntegration] Initializing theme integration...');
        
        const stateStore = this.stateIntegration.getStateStore();
        const stateActions = this.stateIntegration.getStateActions();
        
        // Create theme manager
        this.themeManager = {
            currentTheme: 'light',
            
            // Apply theme to CSS variables
            applyTheme: (theme) => {
                const root = document.documentElement;
                const themeVariables = this.getThemeVariables(theme);
                
                for (const [property, value] of Object.entries(themeVariables)) {
                    root.style.setProperty(property, value);
                }
                
                this.themeManager.currentTheme = theme;
                
                // Update state
                stateStore.dispatch({
                    type: 'APP_SET_THEME',
                    payload: { theme }
                });
                
                // Emit theme change event
                this.emit('themeChanged', { theme, timestamp: Date.now() });
            },
            
            // Get theme CSS variables
            getThemeVariables: (theme) => {
                const themes = {
                    light: {
                        '--primary-color': '#007bff',
                        '--secondary-color': '#6c757d',
                        '--background-color': '#ffffff',
                        '--text-color': '#333333',
                        '--border-color': '#dee2e6'
                    },
                    dark: {
                        '--primary-color': '#0d6efd',
                        '--secondary-color': '#6c757d',
                        '--background-color': '#1a1a1a',
                        '--text-color': '#ffffff',
                        '--border-color': '#404040'
                    }
                };
                
                return themes[theme] || themes.light;
            },
            
            // Toggle theme
            toggleTheme: () => {
                const newTheme = this.themeManager.currentTheme === 'light' ? 'dark' : 'light';
                this.themeManager.applyTheme(newTheme);
            }
        };
        
        // Subscribe to theme state changes
        stateStore.subscribe((newState) => {
            if (newState.app && newState.app.theme && newState.app.theme !== this.themeManager.currentTheme) {
                this.themeManager.applyTheme(newState.app.theme);
            }
        });
        
        console.log('[EnhancedComponentsIntegration] Theme integration initialized');
    }

    /**
     * Initialize navigation integration
     */
    async initializeNavigationIntegration() {
        console.log('[EnhancedComponentsIntegration] Initializing navigation integration...');
        
        const stateStore = this.stateIntegration.getStateStore();
        const stateActions = this.stateIntegration.getStateActions();
        
        // Create navigation manager
        this.navigationManager = {
            currentRoute: '/',
            
            // Navigate to route
            navigateTo: (route, options = {}) => {
                // Update state
                stateStore.dispatch({
                    type: 'NAVIGATE_TO',
                    payload: { route, options }
                });
                
                // Update URL if using browser history
                if (options.updateHistory !== false) {
                    window.history.pushState({ route }, '', route);
                }
                
                this.navigationManager.currentRoute = route;
                
                // Emit navigation event
                this.emit('navigationChanged', { route, options, timestamp: Date.now() });
            },
            
            // Update breadcrumbs
            updateBreadcrumbs: (breadcrumbs) => {
                stateStore.dispatch({
                    type: 'NAVIGATION_SET_BREADCRUMBS',
                    payload: { breadcrumbs }
                });
            },
            
            // Handle browser back/forward
            handleBrowserNavigation: (event) => {
                const route = window.location.pathname;
                this.navigationManager.navigateTo(route, { updateHistory: false });
            }
        };
        
        // Subscribe to navigation state changes
        stateStore.subscribe((newState) => {
            if (newState.navigation && newState.navigation.currentRoute !== this.navigationManager.currentRoute) {
                this.navigationManager.currentRoute = newState.navigation.currentRoute;
                this.emit('navigationStateChanged', newState.navigation);
            }
        });
        
        // Setup browser navigation handling
        window.addEventListener('popstate', this.navigationManager.handleBrowserNavigation);
        
        console.log('[EnhancedComponentsIntegration] Navigation integration initialized');
    }

    /**
     * Initialize micro-interactions integration
     */
    async initializeMicroInteractionsIntegration() {
        console.log('[EnhancedComponentsIntegration] Initializing micro-interactions integration...');
        
        const stateStore = this.stateIntegration.getStateStore();
        
        // Create micro-interaction manager
        this.microInteractionManager = {
            // Track user interactions
            trackInteraction: (element, interactionType, data = {}) => {
                const interaction = {
                    element: element.tagName.toLowerCase(),
                    interactionType,
                    data,
                    timestamp: Date.now()
                };
                
                // Update state
                stateStore.dispatch({
                    type: 'ANALYTICS_TRACK_ACTION',
                    payload: {
                        action: 'user_interaction',
                        metadata: interaction
                    }
                });
                
                // Emit interaction event
                this.emit('userInteraction', interaction);
            },
            
            // Apply micro-interaction effects
            applyEffect: (element, effectType, options = {}) => {
                const effects = {
                    hover: () => {
                        element.classList.add('hover-effect');
                        setTimeout(() => element.classList.remove('hover-effect'), 200);
                    },
                    click: () => {
                        element.classList.add('click-effect');
                        setTimeout(() => element.classList.remove('click-effect'), 300);
                    },
                    focus: () => {
                        element.classList.add('focus-effect');
                    },
                    blur: () => {
                        element.classList.remove('focus-effect');
                    }
                };
                
                const effect = effects[effectType];
                if (effect) {
                    effect();
                    this.microInteractionManager.trackInteraction(element, effectType, options);
                }
            }
        };
        
        // Setup global event listeners for micro-interactions
        document.addEventListener('click', (event) => {
            if (event.target.matches('[data-micro-click]')) {
                this.microInteractionManager.applyEffect(event.target, 'click');
            }
        });
        
        document.addEventListener('mouseover', (event) => {
            if (event.target.matches('[data-micro-hover]')) {
                this.microInteractionManager.applyEffect(event.target, 'hover');
            }
        });
        
        console.log('[EnhancedComponentsIntegration] Micro-interactions integration initialized');
    }

    /**
     * Initialize accessibility integration
     */
    async initializeAccessibilityIntegration() {
        console.log('[EnhancedComponentsIntegration] Initializing accessibility integration...');
        
        const stateStore = this.stateIntegration.getStateStore();
        
        // Create accessibility manager
        this.accessibilityManager = {
            // Track accessibility events
            trackAccessibilityEvent: (eventType, data = {}) => {
                const event = {
                    eventType,
                    data,
                    timestamp: Date.now()
                };
                
                // Update state
                stateStore.dispatch({
                    type: 'ANALYTICS_TRACK_ACTION',
                    payload: {
                        action: 'accessibility_event',
                        metadata: event
                    }
                });
                
                // Emit accessibility event
                this.emit('accessibilityEvent', event);
            },
            
            // Update ARIA attributes based on state
            updateARIA: (element, attributes) => {
                for (const [attribute, value] of Object.entries(attributes)) {
                    element.setAttribute(attribute, value);
                }
            },
            
            // Announce to screen readers
            announce: (message, priority = 'polite') => {
                const announcer = document.createElement('div');
                announcer.setAttribute('aria-live', priority);
                announcer.setAttribute('aria-atomic', 'true');
                announcer.className = 'sr-only';
                announcer.textContent = message;
                
                document.body.appendChild(announcer);
                
                setTimeout(() => {
                    document.body.removeChild(announcer);
                }, 1000);
            }
        };
        
        // Setup accessibility event listeners
        document.addEventListener('focus', (event) => {
            if (event.target.matches('[data-track-focus]')) {
                this.accessibilityManager.trackAccessibilityEvent('focus', {
                    element: event.target.tagName.toLowerCase()
                });
            }
        });
        
        console.log('[EnhancedComponentsIntegration] Accessibility integration initialized');
    }

    /**
     * Setup auto-binding
     */
    async setupAutoBinding() {
        console.log('[EnhancedComponentsIntegration] Setting up auto-binding...');
        
        const componentIntegration = this.stateIntegration.getComponentIntegration();
        const stateStore = this.stateIntegration.getStateStore();
        
        // Auto-bind elements with data-state attributes
        const stateBoundElements = document.querySelectorAll('[data-state]');
        
        for (const element of stateBoundElements) {
            const statePath = element.getAttribute('data-state');
            const updateStrategy = element.getAttribute('data-state-update') || 'auto';
            
            componentIntegration.registerComponent(element, {
                statePaths: [statePath],
                updateStrategy,
                onStateChange: ({ newValue }) => {
                    this.updateElementFromState(element, newValue, updateStrategy);
                }
            });
        }
        
        console.log(`[EnhancedComponentsIntegration] Auto-bound ${stateBoundElements.length} elements`);
    }

    /**
     * Setup responsive state
     */
    async setupResponsiveState() {
        console.log('[EnhancedComponentsIntegration] Setting up responsive state...');
        
        const stateStore = this.stateIntegration.getStateStore();
        
        // Update viewport state on resize
        const updateViewportState = () => {
            const viewport = {
                width: window.innerWidth,
                height: window.innerHeight,
                isMobile: window.innerWidth < 768,
                isTablet: window.innerWidth >= 768 && window.innerWidth < 1024,
                isDesktop: window.innerWidth >= 1024
            };
            
            stateStore.dispatch({
                type: 'APP_UPDATE_VIEWPORT',
                payload: { viewport }
            });
        };
        
        // Initial viewport update
        updateViewportState();
        
        // Setup resize listener with debouncing
        let resizeTimeout;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(updateViewportState, 100);
        });
        
        console.log('[EnhancedComponentsIntegration] Responsive state setup completed');
    }

    /**
     * Bind existing enhanced components
     */
    async bindExistingComponents() {
        console.log('[EnhancedComponentsIntegration] Binding existing enhanced components...');
        
        const componentIntegration = this.stateIntegration.getComponentIntegration();
        
        // Bind navigation components
        const navElements = document.querySelectorAll('.enhanced-nav, [data-enhanced-nav]');
        for (const navElement of navElements) {
            this.bindNavigationComponent(navElement);
        }
        
        // Bind modal components
        const modalElements = document.querySelectorAll('.enhanced-modal, [data-enhanced-modal]');
        for (const modalElement of modalElements) {
            this.bindModalComponent(modalElement);
        }
        
        // Bind form components
        const formElements = document.querySelectorAll('.enhanced-form, [data-enhanced-form]');
        for (const formElement of formElements) {
            this.bindFormComponent(formElement);
        }
        
        // Bind table components
        const tableElements = document.querySelectorAll('.enhanced-table, [data-enhanced-table]');
        for (const tableElement of tableElements) {
            this.bindTableComponent(tableElement);
        }
        
        console.log('[EnhancedComponentsIntegration] Existing components bound successfully');
    }

    /**
     * Bind navigation component
     */
    bindNavigationComponent(element) {
        const componentIntegration = this.stateIntegration.getComponentIntegration();
        const stateStore = this.stateIntegration.getStateStore();
        
        componentIntegration.registerComponent(element, {
            statePaths: ['navigation.currentRoute', 'navigation.breadcrumbs'],
            onStateChange: ({ newValue, statePath }) => {
                if (statePath === 'navigation.currentRoute') {
                    this.updateNavigationActiveState(element, newValue);
                } else if (statePath === 'navigation.breadcrumbs') {
                    this.updateNavigationBreadcrumbs(element, newValue);
                }
            },
            onMount: (config) => {
                // Setup click handlers for navigation links
                const links = element.querySelectorAll('a[href]');
                for (const link of links) {
                    link.addEventListener('click', (event) => {
                        event.preventDefault();
                        const route = link.getAttribute('href');
                        if (this.navigationManager) {
                            this.navigationManager.navigateTo(route);
                        }
                    });
                }
            }
        });
    }

    /**
     * Bind modal component
     */
    bindModalComponent(element) {
        const componentIntegration = this.stateIntegration.getComponentIntegration();
        const stateStore = this.stateIntegration.getStateStore();
        
        componentIntegration.registerComponent(element, {
            statePaths: ['ui.modals.active'],
            onStateChange: ({ newValue }) => {
                const modalId = element.getAttribute('data-modal-id') || element.id;
                const isActive = newValue && newValue.includes(modalId);
                
                if (isActive) {
                    element.classList.add('active');
                    element.setAttribute('aria-hidden', 'false');
                } else {
                    element.classList.remove('active');
                    element.setAttribute('aria-hidden', 'true');
                }
            },
            onMount: (config) => {
                // Setup close handlers
                const closeButtons = element.querySelectorAll('[data-modal-close], .modal-close');
                for (const closeButton of closeButtons) {
                    closeButton.addEventListener('click', () => {
                        const modalId = element.getAttribute('data-modal-id') || element.id;
                        stateStore.dispatch({
                            type: 'UI_CLOSE_MODAL',
                            payload: { modalId }
                        });
                    });
                }
            }
        });
    }

    /**
     * Bind form component
     */
    bindFormComponent(element) {
        const componentIntegration = this.stateIntegration.getComponentIntegration();
        const stateStore = this.stateIntegration.getStateStore();
        
        componentIntegration.registerComponent(element, {
            statePaths: ['data.features', 'app.error'],
            onStateChange: ({ newValue, statePath }) => {
                if (statePath === 'app.error') {
                    this.updateFormErrorState(element, newValue);
                }
            },
            onMount: (config) => {
                // Setup form submission
                element.addEventListener('submit', (event) => {
                    event.preventDefault();
                    this.handleFormSubmission(element);
                });
                
                // Setup input validation
                const inputs = element.querySelectorAll('input, select, textarea');
                for (const input of inputs) {
                    input.addEventListener('blur', () => {
                        this.validateInput(input);
                    });
                }
            }
        });
    }

    /**
     * Bind table component
     */
    bindTableComponent(element) {
        const componentIntegration = this.stateIntegration.getComponentIntegration();
        const stateStore = this.stateIntegration.getStateStore();
        
        componentIntegration.registerComponent(element, {
            statePaths: ['data.features', 'ui.layout.sortBy', 'ui.layout.sortOrder'],
            onStateChange: ({ newValue, statePath }) => {
                if (statePath === 'data.features') {
                    this.updateTableData(element, newValue);
                } else if (statePath.includes('sort')) {
                    this.updateTableSorting(element, stateStore.getState().ui.layout);
                }
            },
            onMount: (config) => {
                // Setup sorting handlers
                const sortHeaders = element.querySelectorAll('[data-sort]');
                for (const header of sortHeaders) {
                    header.addEventListener('click', () => {
                        const sortBy = header.getAttribute('data-sort');
                        stateStore.dispatch({
                            type: 'UI_SET_LAYOUT',
                            payload: {
                                layout: {
                                    sortBy,
                                    sortOrder: stateStore.getState().ui.layout.sortOrder === 'asc' ? 'desc' : 'asc'
                                }
                            }
                        });
                    });
                }
            }
        });
    }

    /**
     * Update element from state
     */
    updateElementFromState(element, value, strategy) {
        switch (strategy) {
            case 'text':
                element.textContent = String(value || '');
                break;
            case 'html':
                element.innerHTML = String(value || '');
                break;
            case 'value':
                element.value = String(value || '');
                break;
            case 'class':
                element.className = String(value || '');
                break;
            case 'style':
                if (typeof value === 'object') {
                    Object.assign(element.style, value);
                } else {
                    element.style.cssText = String(value || '');
                }
                break;
            case 'attribute':
                const attributeName = element.getAttribute('data-state-attribute') || 'data-value';
                if (value === null || value === undefined) {
                    element.removeAttribute(attributeName);
                } else {
                    element.setAttribute(attributeName, String(value));
                }
                break;
            case 'visible':
                element.style.display = value ? '' : 'none';
                break;
            case 'auto':
            default:
                // Auto-detect based on element type
                if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA' || element.tagName === 'SELECT') {
                    element.value = String(value || '');
                } else if (element.tagName === 'IMG') {
                    element.src = String(value || '');
                } else {
                    element.textContent = String(value || '');
                }
                break;
        }
    }

    /**
     * Update navigation active state
     */
    updateNavigationActiveState(element, currentRoute) {
        const links = element.querySelectorAll('a[href]');
        for (const link of links) {
            const href = link.getAttribute('href');
            if (href === currentRoute) {
                link.classList.add('active');
                link.setAttribute('aria-current', 'page');
            } else {
                link.classList.remove('active');
                link.removeAttribute('aria-current');
            }
        }
    }

    /**
     * Update navigation breadcrumbs
     */
    updateNavigationBreadcrumbs(element, breadcrumbs) {
        const breadcrumbContainer = element.querySelector('.breadcrumbs') || element;
        breadcrumbContainer.innerHTML = '';
        
        for (let i = 0; i < breadcrumbs.length; i++) {
            const crumb = breadcrumbs[i];
            const crumbElement = document.createElement(i === breadcrumbs.length - 1 ? 'span' : 'a');
            crumbElement.textContent = crumb.title;
            
            if (i < breadcrumbs.length - 1) {
                crumbElement.href = crumb.path;
                crumbElement.addEventListener('click', (event) => {
                    event.preventDefault();
                    if (this.navigationManager) {
                        this.navigationManager.navigateTo(crumb.path);
                    }
                });
            } else {
                crumbElement.setAttribute('aria-current', 'page');
            }
            
            breadcrumbContainer.appendChild(crumbElement);
            
            if (i < breadcrumbs.length - 1) {
                const separator = document.createElement('span');
                separator.className = 'breadcrumb-separator';
                separator.textContent = ' / ';
                breadcrumbContainer.appendChild(separator);
            }
        }
    }

    /**
     * Update form error state
     */
    updateFormErrorState(element, error) {
        const errorContainer = element.querySelector('.form-error') || element;
        
        if (error) {
            errorContainer.textContent = error;
            errorContainer.classList.add('error');
            errorContainer.setAttribute('role', 'alert');
        } else {
            errorContainer.textContent = '';
            errorContainer.classList.remove('error');
            errorContainer.removeAttribute('role');
        }
    }

    /**
     * Handle form submission
     */
    handleFormSubmission(element) {
        const formData = new FormData(element);
        const data = Object.fromEntries(formData.entries());
        
        // Dispatch form submission action
        this.stateIntegration.getStateStore().dispatch({
            type: 'FORM_SUBMIT',
            payload: { data, formId: element.id || element.getAttribute('data-form-id') }
        });
    }

    /**
     * Validate input
     */
    validateInput(input) {
        const isValid = input.checkValidity();
        
        if (isValid) {
            input.classList.remove('error');
            input.removeAttribute('aria-invalid');
        } else {
            input.classList.add('error');
            input.setAttribute('aria-invalid', 'true');
        }
        
        return isValid;
    }

    /**
     * Update table data
     */
    updateTableData(element, data) {
        const tbody = element.querySelector('tbody');
        if (!tbody) return;
        
        tbody.innerHTML = '';
        
        for (const item of data) {
            const row = document.createElement('tr');
            
            // Add cells based on table headers
            const headers = element.querySelectorAll('thead th');
            for (const header of headers) {
                const cell = document.createElement('td');
                const key = header.getAttribute('data-key') || header.textContent.toLowerCase();
                cell.textContent = String(item[key] || '');
                row.appendChild(cell);
            }
            
            tbody.appendChild(row);
        }
    }

    /**
     * Update table sorting
     */
    updateTableSorting(element, layout) {
        const { sortBy, sortOrder } = layout;
        
        // Update header classes
        const headers = element.querySelectorAll('thead th[data-sort]');
        for (const header of headers) {
            const headerSortBy = header.getAttribute('data-sort');
            
            header.classList.remove('sort-asc', 'sort-desc');
            
            if (headerSortBy === sortBy) {
                header.classList.add(`sort-${sortOrder}`);
            }
        }
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
                    console.error(`[EnhancedComponentsIntegration] Error in event listener for ${event}:`, error);
                }
            });
        }
    }

    /**
     * Get integration status
     */
    getStatus() {
        return {
            isInitialized: this.isInitialized,
            components: {
                themeManager: !!this.themeManager,
                navigationManager: !!this.navigationManager,
                microInteractionManager: !!this.microInteractionManager,
                accessibilityManager: !!this.accessibilityManager
            },
            bindings: this.componentBindings.size,
            options: this.options
        };
    }

    /**
     * Destroy integration
     */
    destroy() {
        // Remove browser navigation listener
        if (this.navigationManager) {
            window.removeEventListener('popstate', this.navigationManager.handleBrowserNavigation);
        }
        
        // Clear component bindings
        this.componentBindings.clear();
        
        // Clear event listeners
        if (this.eventListeners) {
            this.eventListeners.clear();
        }
        
        // Reset managers
        this.themeManager = null;
        this.navigationManager = null;
        this.microInteractionManager = null;
        this.accessibilityManager = null;
        
        this.isInitialized = false;
        
        console.log('[EnhancedComponentsIntegration] Destroyed');
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = EnhancedComponentsIntegration;
} else if (typeof window !== 'undefined') {
    window.EnhancedComponentsIntegration = EnhancedComponentsIntegration;
}