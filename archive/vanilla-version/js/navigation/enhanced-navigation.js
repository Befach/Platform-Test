/**
 * Enhanced Navigation System
 * 
 * Comprehensive navigation management with:
 * - Smart breadcrumb navigation with context awareness
 * - Progressive disclosure navigation for complex workflows
 * - Quick access navigation with keyboard shortcuts
 * - Contextual navigation that adapts to user actions
 * - Smooth view transitions with state preservation
 * 
 * @version 1.0.0
 * @author Navigation System
 */

const enhancedNavigation = {
    /**
     * Configuration
     */
    config: {
        // Navigation patterns
        breadcrumbMaxDepth: 5,
        progressiveDisclosureThreshold: 7,
        quickAccessMaxItems: 8,
        
        // Animation settings
        transitionDuration: 300,
        transitionEasing: 'cubic-bezier(0.4, 0.0, 0.2, 1)',
        
        // Keyboard shortcuts
        shortcuts: {
            'Ctrl+K': 'quickSearch',
            'Ctrl+/': 'toggleShortcutsHelp',
            'Ctrl+B': 'toggleBreadcrumbs',
            'Alt+ArrowLeft': 'navigateBack',
            'Alt+ArrowRight': 'navigateForward',
            'Ctrl+1': 'quickAccess1',
            'Ctrl+2': 'quickAccess2',
            'Ctrl+3': 'quickAccess3',
            'Ctrl+4': 'quickAccess4',
            'Ctrl+5': 'quickAccess5',
            'Ctrl+6': 'quickAccess6',
            'Ctrl+7': 'quickAccess7',
            'Ctrl+8': 'quickAccess8'
        },
        
        // Context awareness
        contextMemorySize: 10,
        adaptiveNavigationWeight: 0.7,
        
        // Performance
        debounceDelay: 150,
        throttleDelay: 50
    },

    /**
     * State management
     */
    state: {
        // Navigation history
        navigationHistory: [],
        currentHistoryIndex: -1,
        
        // Breadcrumb state
        breadcrumbs: [],
        breadcrumbVisible: true,
        
        // Progressive disclosure
        disclosedSections: new Set(),
        hiddenSections: new Set(),
        
        // Quick access
        quickAccessItems: [],
        quickAccessVisible: true,
        
        // Context awareness
        navigationContext: [],
        userPatterns: new Map(),
        adaptiveWeights: new Map(),
        
        // View transitions
        currentView: null,
        previousView: null,
        transitionInProgress: false,
        
        // Keyboard navigation
        keyboardNavigationEnabled: true,
        focusedElement: null,
        
        // Gesture navigation
        gestureNavigationEnabled: true,
        touchStartPoint: null,
        
        // Performance
        lastNavigationTime: 0,
        navigationFrequency: new Map()
    },

    /**
     * Initialize enhanced navigation system
     */
    initialize() {
        console.log('🧭 Initializing Enhanced Navigation System...');
        
        // Create navigation elements
        this.createNavigationElements();
        
        // Setup event listeners
        this.setupEventListeners();
        
        // Initialize keyboard navigation
        this.initializeKeyboardNavigation();
        
        // Initialize gesture navigation
        this.initializeGestureNavigation();
        
        // Load saved navigation state
        this.loadNavigationState();
        
        // Setup context awareness
        this.setupContextAwareness();
        
        // Initialize quick access
        this.initializeQuickAccess();
        
        console.log('✅ Enhanced Navigation System initialized');
    },

    /**
     * Create navigation elements
     */
    createNavigationElements() {
        // Create breadcrumb container
        const breadcrumbContainer = document.createElement('div');
        breadcrumbContainer.className = 'enhanced-breadcrumb-container';
        breadcrumbContainer.id = 'breadcrumbContainer';
        breadcrumbContainer.innerHTML = `
            <nav class="breadcrumb-nav" role="navigation" aria-label="Breadcrumb navigation">
                <ol class="breadcrumb-list" id="breadcrumbList"></ol>
            </nav>
            <button class="breadcrumb-toggle" id="breadcrumbToggle" aria-label="Toggle breadcrumbs">
                <span class="breadcrumb-icon">🧭</span>
            </button>
        `;

        // Create quick access container
        const quickAccessContainer = document.createElement('div');
        quickAccessContainer.className = 'quick-access-container';
        quickAccessContainer.id = 'quickAccessContainer';
        quickAccessContainer.innerHTML = `
            <div class="quick-access-header">
                <span class="quick-access-title">Quick Access</span>
                <button class="quick-access-toggle" id="quickAccessToggle" aria-label="Toggle quick access">
                    <span class="quick-access-icon">⚡</span>
                </button>
            </div>
            <div class="quick-access-grid" id="quickAccessGrid"></div>
        `;

        // Create contextual navigation container
        const contextualNavContainer = document.createElement('div');
        contextualNavContainer.className = 'contextual-nav-container';
        contextualNavContainer.id = 'contextualNavContainer';
        contextualNavContainer.innerHTML = `
            <div class="contextual-nav-header">
                <span class="contextual-nav-title">Suggested Actions</span>
                <button class="contextual-nav-toggle" id="contextualNavToggle" aria-label="Toggle contextual navigation">
                    <span class="contextual-nav-icon">💡</span>
                </button>
            </div>
            <div class="contextual-nav-content" id="contextualNavContent"></div>
        `;

        // Create navigation overlay for transitions
        const navigationOverlay = document.createElement('div');
        navigationOverlay.className = 'navigation-overlay';
        navigationOverlay.id = 'navigationOverlay';

        // Insert elements into the page
        const header = document.querySelector('.header') || document.querySelector('.app-header');
        if (header) {
            header.parentNode.insertBefore(breadcrumbContainer, header.nextSibling);
        }

        const main = document.querySelector('.content') || document.querySelector('.app-main');
        if (main) {
            main.insertBefore(quickAccessContainer, main.firstChild);
            main.insertBefore(contextualNavContainer, main.firstChild);
        }

        document.body.appendChild(navigationOverlay);
    },

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Breadcrumb toggle
        const breadcrumbToggle = document.getElementById('breadcrumbToggle');
        if (breadcrumbToggle) {
            breadcrumbToggle.addEventListener('click', () => this.toggleBreadcrumbs());
        }

        // Quick access toggle
        const quickAccessToggle = document.getElementById('quickAccessToggle');
        if (quickAccessToggle) {
            quickAccessToggle.addEventListener('click', () => this.toggleQuickAccess());
        }

        // Contextual navigation toggle
        const contextualNavToggle = document.getElementById('contextualNavToggle');
        if (contextualNavToggle) {
            contextualNavToggle.addEventListener('click', () => this.toggleContextualNav());
        }

        // View navigation events
        document.addEventListener('viewChanged', (e) => this.handleViewChange(e));
        document.addEventListener('navigationRequested', (e) => this.handleNavigationRequest(e));

        // Performance monitoring
        this.setupPerformanceMonitoring();

        // Responsive behavior
        window.addEventListener('resize', this.debounce(() => this.handleResize(), this.config.debounceDelay));
    },

    /**
     * Initialize keyboard navigation
     */
    initializeKeyboardNavigation() {
        if (!this.state.keyboardNavigationEnabled) return;

        document.addEventListener('keydown', (e) => {
            // Check for keyboard shortcuts
            const shortcut = this.getKeyboardShortcut(e);
            if (shortcut && this.config.shortcuts[shortcut]) {
                e.preventDefault();
                this.handleKeyboardShortcut(this.config.shortcuts[shortcut]);
            }

            // Handle navigation keys
            this.handleNavigationKeys(e);
        });

        // Setup focus management
        this.setupFocusManagement();
    },

    /**
     * Initialize gesture navigation
     */
    initializeGestureNavigation() {
        if (!this.state.gestureNavigationEnabled) return;

        const main = document.querySelector('.content') || document.querySelector('.app-main');
        if (!main) return;

        // Touch start
        main.addEventListener('touchstart', (e) => {
            this.state.touchStartPoint = {
                x: e.touches[0].clientX,
                y: e.touches[0].clientY,
                time: Date.now()
            };
        }, { passive: true });

        // Touch end
        main.addEventListener('touchend', (e) => {
            if (!this.state.touchStartPoint) return;

            const touchEndPoint = {
                x: e.changedTouches[0].clientX,
                y: e.changedTouches[0].clientY,
                time: Date.now()
            };

            this.handleGesture(this.state.touchStartPoint, touchEndPoint);
            this.state.touchStartPoint = null;
        }, { passive: true });
    },

    /**
     * Navigate to a specific view
     */
    async navigateTo(viewId, options = {}) {
        if (this.state.transitionInProgress) {
            console.warn('Navigation transition already in progress');
            return false;
        }

        const startTime = performance.now();
        
        try {
            // Update navigation history
            this.updateNavigationHistory(viewId, options);
            
            // Update breadcrumbs
            this.updateBreadcrumbs(viewId, options);
            
            // Start view transition
            await this.performViewTransition(viewId, options);
            
            // Update contextual navigation
            this.updateContextualNavigation(viewId, options);
            
            // Record navigation pattern
            this.recordNavigationPattern(viewId, options);
            
            // Update performance metrics
            const duration = performance.now() - startTime;
            this.updateNavigationMetrics(viewId, duration);
            
            console.log(`🧭 Navigated to: ${viewId} (${duration.toFixed(2)}ms)`);
            return true;
            
        } catch (error) {
            console.error('❌ Navigation failed:', error);
            return false;
        }
    },

    /**
     * Update navigation history
     */
    updateNavigationHistory(viewId, options) {
        // Remove any forward history if we're navigating from a previous point
        if (this.state.currentHistoryIndex < this.state.navigationHistory.length - 1) {
            this.state.navigationHistory = this.state.navigationHistory.slice(0, this.state.currentHistoryIndex + 1);
        }

        // Add new navigation entry
        const navigationEntry = {
            viewId,
            timestamp: Date.now(),
            options: { ...options },
            state: this.captureViewState()
        };

        this.state.navigationHistory.push(navigationEntry);
        this.state.currentHistoryIndex = this.state.navigationHistory.length - 1;

        // Limit history size
        if (this.state.navigationHistory.length > 50) {
            this.state.navigationHistory.shift();
            this.state.currentHistoryIndex--;
        }

        // Save navigation state
        this.saveNavigationState();
    },

    /**
     * Update breadcrumbs
     */
    updateBreadcrumbs(viewId, options) {
        const breadcrumbData = this.generateBreadcrumbData(viewId, options);
        this.state.breadcrumbs = breadcrumbData;

        const breadcrumbList = document.getElementById('breadcrumbList');
        if (!breadcrumbList) return;

        // Render breadcrumbs
        breadcrumbList.innerHTML = breadcrumbData.map((crumb, index) => `
            <li class="breadcrumb-item ${index === breadcrumbData.length - 1 ? 'active' : ''}">
                ${index < breadcrumbData.length - 1 ? 
                    `<a href="#" class="breadcrumb-link" data-view="${crumb.viewId}" onclick="enhancedNavigation.navigateTo('${crumb.viewId}', ${JSON.stringify(crumb.options || {}).replace(/"/g, '"')}); return false;">${crumb.label}</a>` :
                    `<span class="breadcrumb-current">${crumb.label}</span>`
                }
            </li>
        `).join('');

        // Apply progressive disclosure if needed
        this.applyProgressiveDisclosure();
    },

    /**
     * Generate breadcrumb data
     */
    generateBreadcrumbData(viewId, options) {
        const breadcrumbs = [];
        
        // Add home breadcrumb
        breadcrumbs.push({
            viewId: 'home',
            label: '🏠 Home',
            options: {}
        });

        // Generate view-specific breadcrumbs
        const viewPath = this.getViewPath(viewId, options);
        breadcrumbs.push(...viewPath);

        // Limit breadcrumb depth
        if (breadcrumbs.length > this.config.breadcrumbMaxDepth) {
            const startIndex = breadcrumbs.length - this.config.breadcrumbMaxDepth;
            breadcrumbs.splice(0, startIndex, {
                viewId: 'more',
                label: '...',
                options: {}
            });
        }

        return breadcrumbs;
    },

    /**
     * Get view path for breadcrumbs
     */
    getViewPath(viewId, options) {
        const pathMap = {
            'tableView': [
                { viewId: 'features', label: '📋 Features', options: {} }
            ],
            'detailView': [
                { viewId: 'features', label: '📋 Features', options: {} },
                { viewId: 'feature-detail', label: options.featureName || 'Feature Detail', options: {} }
            ],
            'graphView': [
                { viewId: 'analytics', label: '📊 Analytics', options: {} },
                { viewId: 'graph', label: '🕸️ Graph View', options: {} }
            ],
            'insights': [
                { viewId: 'analytics', label: '📊 Analytics', options: {} },
                { viewId: 'insights', label: '💡 Insights', options: {} }
            ],
            'settings': [
                { viewId: 'settings', label: '⚙️ Settings', options: {} }
            ]
        };

        return pathMap[viewId] || [
            { viewId: viewId, label: this.formatViewLabel(viewId), options: {} }
        ];
    },

    /**
     * Perform view transition
     */
    async performViewTransition(viewId, options) {
        this.state.transitionInProgress = true;
        
        try {
            // Get current and target views
            const currentView = this.state.currentView;
            const targetView = document.getElementById(viewId);
            
            if (!targetView) {
                throw new Error(`Target view not found: ${viewId}`);
            }

            // Show navigation overlay
            this.showNavigationOverlay();

            // Hide current view
            if (currentView && currentView !== targetView) {
                await this.hideView(currentView, options.transitionType);
            }

            // Show target view
            await this.showView(targetView, options.transitionType);

            // Update state
            this.state.previousView = this.state.currentView;
            this.state.currentView = targetView;

            // Hide navigation overlay
            this.hideNavigationOverlay();

        } finally {
            this.state.transitionInProgress = false;
        }
    },

    /**
     * Show view with animation
     */
    async showView(view, transitionType = 'fade') {
        view.style.display = '';
        view.classList.add('view-transitioning');
        
        // Apply transition animation
        switch (transitionType) {
            case 'slide':
                view.classList.add('view-slide-in');
                break;
            case 'fade':
                view.classList.add('view-fade-in');
                break;
            case 'scale':
                view.classList.add('view-scale-in');
                break;
            default:
                view.classList.add('view-fade-in');
        }

        // Wait for animation to complete
        await new Promise(resolve => {
            setTimeout(() => {
                view.classList.remove('view-transitioning', 'view-slide-in', 'view-fade-in', 'view-scale-in');
                resolve();
            }, this.config.transitionDuration);
        });
    },

    /**
     * Hide view with animation
     */
    async hideView(view, transitionType = 'fade') {
        view.classList.add('view-transitioning');
        
        // Apply transition animation
        switch (transitionType) {
            case 'slide':
                view.classList.add('view-slide-out');
                break;
            case 'fade':
                view.classList.add('view-fade-out');
                break;
            case 'scale':
                view.classList.add('view-scale-out');
                break;
            default:
                view.classList.add('view-fade-out');
        }

        // Wait for animation to complete
        await new Promise(resolve => {
            setTimeout(() => {
                view.style.display = 'none';
                view.classList.remove('view-transitioning', 'view-slide-out', 'view-fade-out', 'view-scale-out');
                resolve();
            }, this.config.transitionDuration);
        });
    },

    /**
     * Update contextual navigation
     */
    updateContextualNavigation(viewId, options) {
        const contextualItems = this.generateContextualNavigationItems(viewId, options);
        const contextualContent = document.getElementById('contextualNavContent');
        
        if (!contextualContent) return;

        contextualContent.innerHTML = contextualItems.map(item => `
            <button class="contextual-nav-item" onclick="${item.action}" title="${item.description}">
                <span class="contextual-nav-icon">${item.icon}</span>
                <span class="contextual-nav-label">${item.label}</span>
                ${item.badge ? `<span class="contextual-nav-badge">${item.badge}</span>` : ''}
            </button>
        `).join('');

        // Update visibility based on content
        const contextualContainer = document.getElementById('contextualNavContainer');
        if (contextualContainer) {
            contextualContainer.classList.toggle('has-content', contextualItems.length > 0);
        }
    },

    /**
     * Generate contextual navigation items
     */
    generateContextualNavigationItems(viewId, options) {
        const items = [];

        // View-specific contextual items
        switch (viewId) {
            case 'tableView':
                items.push(
                    {
                        icon: '➕',
                        label: 'Add Feature',
                        action: "app.showAddModal()",
                        description: 'Create a new feature'
                    },
                    {
                        icon: '🔍',
                        label: 'Search',
                        action: "document.getElementById('searchInput').focus()",
                        description: 'Search features'
                    },
                    {
                        icon: '📊',
                        label: 'Analytics',
                        action: "enhancedNavigation.navigateTo('insights')",
                        description: 'View insights and analytics'
                    }
                );
                break;

            case 'detailView':
                items.push(
                    {
                        icon: '✏️',
                        label: 'Edit',
                        action: "app.editFeatureFromDetail()",
                        description: 'Edit this feature'
                    },
                    {
                        icon: '✨',
                        label: 'AI Enhance',
                        action: "app.startAIEnhancementWorkflow(app.currentFeatureId)",
                        description: 'Enhance with AI assistance'
                    },
                    {
                        icon: '🔗',
                        label: 'Find Links',
                        action: "app.analyzeBatchLinks(event)",
                        description: 'Find related features'
                    }
                );
                break;

            case 'graphView':
                items.push(
                    {
                        icon: '🔄',
                        label: 'Refresh',
                        action: "location.reload()",
                        description: 'Refresh graph view'
                    },
                    {
                        icon: '📥',
                        label: 'Export',
                        action: "app.exportAllData()",
                        description: 'Export graph data'
                    }
                );
                break;
        }

        // Add adaptive items based on user patterns
        const adaptiveItems = this.getAdaptiveNavigationItems(viewId);
        items.push(...adaptiveItems);

        // Limit items
        return items.slice(0, 6);
    },

    /**
     * Get adaptive navigation items based on user patterns
     */
    getAdaptiveNavigationItems(viewId) {
        const patterns = this.state.userPatterns.get(viewId) || [];
        const items = [];

        patterns.forEach(pattern => {
            if (pattern.frequency > 0.3 && pattern.weight > 0.5) {
                items.push({
                    icon: pattern.icon || '⚡',
                    label: pattern.label,
                    action: pattern.action,
                    description: pattern.description || 'Frequently used action'
                });
            }
        });

        return items;
    },

    /**
     * Record navigation pattern
     */
    recordNavigationPattern(viewId, options) {
        const timestamp = Date.now();
        const pattern = {
            viewId,
            timestamp,
            options,
            source: this.state.previousView?.id || 'direct'
        };

        // Update navigation context
        this.state.navigationContext.push(pattern);
        if (this.state.navigationContext.length > this.config.contextMemorySize) {
            this.state.navigationContext.shift();
        }

        // Update user patterns
        this.updateUserPatterns(pattern);

        // Update navigation frequency
        const frequency = this.state.navigationFrequency.get(viewId) || 0;
        this.state.navigationFrequency.set(viewId, frequency + 1);
    },

    /**
     * Update user patterns
     */
    updateUserPatterns(pattern) {
        const viewPatterns = this.state.userPatterns.get(pattern.viewId) || new Map();
        
        // Update pattern frequency
        const existingPattern = viewPatterns.get(pattern.source);
        if (existingPattern) {
            existingPattern.frequency = Math.min(1, existingPattern.frequency + 0.1);
            existingPattern.lastUsed = pattern.timestamp;
        } else {
            viewPatterns.set(pattern.source, {
                frequency: 0.1,
                weight: 0.5,
                lastUsed: pattern.timestamp,
                ...pattern
            });
        }

        this.state.userPatterns.set(pattern.viewId, viewPatterns);
    },

    /**
     * Handle keyboard shortcut
     */
    handleKeyboardShortcut(action) {
        switch (action) {
            case 'quickSearch':
                this.activateQuickSearch();
                break;
            case 'toggleShortcutsHelp':
                this.toggleShortcutsHelp();
                break;
            case 'toggleBreadcrumbs':
                this.toggleBreadcrumbs();
                break;
            case 'navigateBack':
                this.navigateBack();
                break;
            case 'navigateForward':
                this.navigateForward();
                break;
            default:
                if (action.startsWith('quickAccess')) {
                    const index = parseInt(action.replace('quickAccess', '')) - 1;
                    this.activateQuickAccessItem(index);
                }
        }
    },

    /**
     * Handle navigation keys
     */
    handleNavigationKeys(e) {
        switch (e.key) {
            case 'Tab':
                this.handleTabNavigation(e);
                break;
            case 'Enter':
            case ' ':
                this.handleActivationKey(e);
                break;
            case 'Escape':
                this.handleEscapeKey(e);
                break;
        }
    },

    /**
     * Navigate back in history
     */
    navigateBack() {
        if (this.state.currentHistoryIndex > 0) {
            this.state.currentHistoryIndex--;
            const previousEntry = this.state.navigationHistory[this.state.currentHistoryIndex];
            this.navigateTo(previousEntry.viewId, { ...previousEntry.options, skipHistory: true });
        }
    },

    /**
     * Navigate forward in history
     */
    navigateForward() {
        if (this.state.currentHistoryIndex < this.state.navigationHistory.length - 1) {
            this.state.currentHistoryIndex++;
            const nextEntry = this.state.navigationHistory[this.state.currentHistoryIndex];
            this.navigateTo(nextEntry.viewId, { ...nextEntry.options, skipHistory: true });
        }
    },

    /**
     * Toggle breadcrumbs visibility
     */
    toggleBreadcrumbs() {
        this.state.breadcrumbVisible = !this.state.breadcrumbVisible;
        const container = document.getElementById('breadcrumbContainer');
        if (container) {
            container.classList.toggle('visible', this.state.breadcrumbVisible);
        }
    },

    /**
     * Toggle quick access visibility
     */
    toggleQuickAccess() {
        this.state.quickAccessVisible = !this.state.quickAccessVisible;
        const container = document.getElementById('quickAccessContainer');
        if (container) {
            container.classList.toggle('visible', this.state.quickAccessVisible);
        }
    },

    /**
     * Toggle contextual navigation visibility
     */
    toggleContextualNav() {
        const container = document.getElementById('contextualNavContainer');
        if (container) {
            container.classList.toggle('visible');
        }
    },

    /**
     * Show navigation overlay
     */
    showNavigationOverlay() {
        const overlay = document.getElementById('navigationOverlay');
        if (overlay) {
            overlay.classList.add('active');
        }
    },

    /**
     * Hide navigation overlay
     */
    hideNavigationOverlay() {
        const overlay = document.getElementById('navigationOverlay');
        if (overlay) {
            overlay.classList.remove('active');
        }
    },

    /**
     * Format view label
     */
    formatViewLabel(viewId) {
        const labels = {
            'tableView': 'Table View',
            'detailView': 'Feature Details',
            'graphView': 'Graph View',
            'insights': 'Insights',
            'settings': 'Settings',
            'home': 'Home'
        };
        return labels[viewId] || viewId;
    },

    /**
     * Debounce utility
     */
    debounce(func, delay) {
        let timeoutId;
        return function (...args) {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => func.apply(this, args), delay);
        };
    },

    /**
     * Throttle utility
     */
    throttle(func, delay) {
        let lastCall = 0;
        return function (...args) {
            const now = Date.now();
            if (now - lastCall >= delay) {
                lastCall = now;
                return func.apply(this, args);
            }
        };
    },

    /**
     * Get keyboard shortcut string
     */
    getKeyboardShortcut(e) {
        const parts = [];
        
        if (e.ctrlKey || e.metaKey) parts.push('Ctrl');
        if (e.altKey) parts.push('Alt');
        if (e.shiftKey) parts.push('Shift');
        
        if (e.key && e.key !== 'Control' && e.key !== 'Alt' && e.key !== 'Shift' && e.key !== 'Meta') {
            parts.push(e.key);
        }
        
        return parts.join('+');
    },

    /**
     * Save navigation state
     */
    saveNavigationState() {
        const state = {
            navigationHistory: this.state.navigationHistory,
            currentHistoryIndex: this.state.currentHistoryIndex,
            breadcrumbs: this.state.breadcrumbs,
            userPatterns: Array.from(this.state.userPatterns.entries()),
            navigationFrequency: Array.from(this.state.navigationFrequency.entries())
        };
        
        localStorage.setItem('enhancedNavigationState', JSON.stringify(state));
    },

    /**
     * Load navigation state
     */
    loadNavigationState() {
        try {
            const savedState = localStorage.getItem('enhancedNavigationState');
            if (savedState) {
                const state = JSON.parse(savedState);
                
                this.state.navigationHistory = state.navigationHistory || [];
                this.state.currentHistoryIndex = state.currentHistoryIndex || -1;
                this.state.breadcrumbs = state.breadcrumbs || [];
                this.state.userPatterns = new Map(state.userPatterns || []);
                this.state.navigationFrequency = new Map(state.navigationFrequency || []);
            }
        } catch (error) {
            console.warn('Failed to load navigation state:', error);
        }
    },

    /**
     * Update navigation metrics
     */
    updateNavigationMetrics(viewId, duration) {
        // This could be sent to analytics service
        console.log(`Navigation metrics: ${viewId} took ${duration.toFixed(2)}ms`);
    },

    /**
     * Setup performance monitoring
     */
    setupPerformanceMonitoring() {
        // Monitor navigation performance
        if ('PerformanceObserver' in window) {
            const observer = new PerformanceObserver((list) => {
                list.getEntries().forEach((entry) => {
                    if (entry.name.includes('navigation')) {
                        console.log(`Navigation performance: ${entry.name} - ${entry.duration.toFixed(2)}ms`);
                    }
                });
            });
            
            observer.observe({ entryTypes: ['measure', 'navigation'] });
        }
    },

    /**
     * Handle resize events
     */
    handleResize() {
        // Adjust navigation layout for different screen sizes
        const isMobile = window.innerWidth <= 768;
        
        if (isMobile) {
            // Simplify navigation on mobile
            this.applyMobileNavigationLayout();
        } else {
            // Restore full navigation on desktop
            this.applyDesktopNavigationLayout();
        }
    },

    /**
     * Apply mobile navigation layout
     */
    applyMobileNavigationLayout() {
        // Hide breadcrumbs on mobile if needed
        const breadcrumbContainer = document.getElementById('breadcrumbContainer');
        if (breadcrumbContainer) {
            breadcrumbContainer.classList.add('mobile-layout');
        }
        
        // Adjust quick access for mobile
        const quickAccessContainer = document.getElementById('quickAccessContainer');
        if (quickAccessContainer) {
            quickAccessContainer.classList.add('mobile-layout');
        }
    },

    /**
     * Apply desktop navigation layout
     */
    applyDesktopNavigationLayout() {
        // Restore full navigation on desktop
        const breadcrumbContainer = document.getElementById('breadcrumbContainer');
        if (breadcrumbContainer) {
            breadcrumbContainer.classList.remove('mobile-layout');
        }
        
        const quickAccessContainer = document.getElementById('quickAccessContainer');
        if (quickAccessContainer) {
            quickAccessContainer.classList.remove('mobile-layout');
        }
    },

    /**
     * Apply progressive disclosure
     */
    applyProgressiveDisclosure() {
        const breadcrumbItems = document.querySelectorAll('.breadcrumb-item');
        
        if (breadcrumbItems.length > this.config.progressiveDisclosureThreshold) {
            // Hide middle items and show "..." indicator
            const startIndex = 1;
            const endIndex = breadcrumbItems.length - 2;
            
            breadcrumbItems.forEach((item, index) => {
                if (index >= startIndex && index <= endIndex) {
                    item.classList.add('disclosed');
                }
            });
        }
    },

    /**
     * Setup context awareness
     */
    setupContextAwareness() {
        // Monitor user behavior to adapt navigation
        setInterval(() => {
            this.analyzeNavigationPatterns();
            this.updateAdaptiveWeights();
        }, 30000); // Analyze every 30 seconds
    },

    /**
     * Analyze navigation patterns
     */
    analyzeNavigationPatterns() {
        // Analyze recent navigation context
        const recentContext = this.state.navigationContext.slice(-5);
        
        // Identify patterns and update adaptive navigation
        recentContext.forEach(pattern => {
            const patterns = this.state.userPatterns.get(pattern.viewId) || new Map();
            
            // Update weights based on usage patterns
            patterns.forEach((p, source) => {
                p.weight = Math.min(1, p.weight * this.config.adaptiveNavigationWeight + 
                                 p.frequency * (1 - this.config.adaptiveNavigationWeight));
            });
            
            this.state.userPatterns.set(pattern.viewId, patterns);
        });
    },

    /**
     * Update adaptive weights
     */
    updateAdaptiveWeights() {
        // Update adaptive weights for contextual navigation
        this.state.userPatterns.forEach((patterns, viewId) => {
            patterns.forEach((pattern, source) => {
                // Decay weight over time
                const timeSinceLastUse = Date.now() - pattern.lastUsed;
                const decayFactor = Math.exp(-timeSinceLastUse / (24 * 60 * 60 * 1000)); // 24 hour decay
                
                pattern.weight = Math.max(0.1, pattern.weight * decayFactor);
            });
        });
    },

    /**
     * Initialize quick access
     */
    initializeQuickAccess() {
        // Define default quick access items
        this.state.quickAccessItems = [
            {
                icon: '📋',
                label: 'Table View',
                action: "enhancedNavigation.navigateTo('tableView')",
                description: 'View all features in table format'
            },
            {
                icon: '🕸️',
                label: 'Graph View',
                action: "enhancedNavigation.navigateTo('graphView')",
                description: 'Visualize feature relationships'
            },
            {
                icon: '💡',
                label: 'Insights',
                action: "enhancedNavigation.navigateTo('insights')",
                description: 'View AI-powered insights'
            },
            {
                icon: '➕',
                label: 'Add Feature',
                action: "app.showAddModal()",
                description: 'Create a new feature'
            },
            {
                icon: '🔍',
                label: 'Search',
                action: "enhancedNavigation.activateQuickSearch()",
                description: 'Quick search features'
            },
            {
                icon: '⚙️',
                label: 'Settings',
                action: "enhancedNavigation.navigateTo('settings')",
                description: 'Application settings'
            }
        ];

        this.renderQuickAccess();
    },

    /**
     * Render quick access items
     */
    renderQuickAccess() {
        const quickAccessGrid = document.getElementById('quickAccessGrid');
        if (!quickAccessGrid) return;

        quickAccessGrid.innerHTML = this.state.quickAccessItems
            .slice(0, this.config.quickAccessMaxItems)
            .map((item, index) => `
                <button class="quick-access-item" 
                        onclick="${item.action}" 
                        title="${item.description}"
                        data-shortcut="Ctrl+${index + 1}">
                    <span class="quick-access-icon">${item.icon}</span>
                    <span class="quick-access-label">${item.label}</span>
                    <span class="quick-access-shortcut">Ctrl+${index + 1}</span>
                </button>
            `).join('');
    },

    /**
     * Activate quick search
     */
    activateQuickSearch() {
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.focus();
            searchInput.select();
        }
    },

    /**
     * Activate quick access item
     */
    activateQuickAccessItem(index) {
        const item = this.state.quickAccessItems[index];
        if (item) {
            eval(item.action); // Execute the action
        }
    },

    /**
     * Toggle shortcuts help
     */
    toggleShortcutsHelp() {
        // This would show a modal with keyboard shortcuts
        console.log('Keyboard shortcuts help would be shown here');
    },

    /**
     * Setup focus management
     */
    setupFocusManagement() {
        // Track focused element for keyboard navigation
        document.addEventListener('focusin', (e) => {
            this.state.focusedElement = e.target;
        });

        document.addEventListener('focusout', (e) => {
            if (this.state.focusedElement === e.target) {
                this.state.focusedElement = null;
            }
        });
    },

    /**
     * Handle tab navigation
     */
    handleTabNavigation(e) {
        // Custom tab navigation logic if needed
        // This could be used to implement custom tab order
    },

    /**
     * Handle activation key
     */
    handleActivationKey(e) {
        // Handle Enter/Space key activation
        if (this.state.focusedElement) {
            this.state.focusedElement.click();
        }
    },

    /**
     * Handle escape key
     */
    handleEscapeKey(e) {
        // Handle escape key - close modals, cancel operations, etc.
        if (this.state.transitionInProgress) {
            // Cancel transition if possible
            console.log('Cancelling navigation transition');
        }
    },

    /**
     * Handle gesture
     */
    handleGesture(startPoint, endPoint) {
        const deltaX = endPoint.x - startPoint.x;
        const deltaY = endPoint.y - startPoint.y;
        const deltaTime = endPoint.time - startPoint.time;
        
        const velocity = Math.sqrt(deltaX * deltaX + deltaY * deltaY) / deltaTime;
        
        // Check if this is a valid gesture
        if (velocity < 0.1) return; // Too slow
        
        // Determine gesture direction
        if (Math.abs(deltaX) > Math.abs(deltaY)) {
            // Horizontal gesture
            if (deltaX > 50) {
                // Swipe right - navigate forward
                this.navigateForward();
            } else if (deltaX < -50) {
                // Swipe left - navigate back
                this.navigateBack();
            }
        } else {
            // Vertical gesture
            if (deltaY > 50) {
                // Swipe down - could show quick access
                this.toggleQuickAccess();
            } else if (deltaY < -50) {
                // Swipe up - could hide quick access
                this.toggleQuickAccess();
            }
        }
    },

    /**
     * Capture view state
     */
    captureViewState() {
        // Capture current view state for restoration
        return {
            scrollPosition: window.scrollY,
            focusedElement: this.state.focusedElement?.id || null,
            timestamp: Date.now()
        };
    },

    /**
     * Handle view change event
     */
    handleViewChange(e) {
        const { viewId, options } = e.detail;
        this.navigateTo(viewId, options);
    },

    /**
     * Handle navigation request event
     */
    handleNavigationRequest(e) {
        const { destination, options } = e.detail;
        this.navigateTo(destination, options);
    }
};

// Initialize on DOM ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => enhancedNavigation.initialize());
} else {
    enhancedNavigation.initialize();
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = enhancedNavigation;
}

// Make available globally
window.enhancedNavigation = enhancedNavigation;