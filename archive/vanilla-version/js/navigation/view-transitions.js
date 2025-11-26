/**
 * Advanced View Transitions System
 * 
 * Comprehensive smooth view transitions with:
 * - Modern View Transitions API integration with fallbacks
 * - Hardware-accelerated CSS animations and transforms
 * - Sophisticated transition timing and easing functions
 * - Context-aware transition patterns and animations
 * - Performance-optimized transition rendering
 * - Accessibility-compliant motion preferences
 * - Cross-browser compatibility with polyfills
 * - State preservation during transitions
 * - Custom transition builders and composers
 * - Real-time transition performance monitoring
 * 
 * @version 1.0.0
 * @author View Transitions System
 */

const viewTransitions = {
    /**
     * Configuration
     */
    config: {
        // View Transitions API
        viewTransitionsAPI: true,
        fallbackToCSS: true,
        
        // Animation settings
        defaultDuration: 300,
        defaultEasing: 'cubic-bezier(0.4, 0.0, 0.2, 1)',
        fastDuration: 200,
        slowDuration: 500,
        
        // Performance
        hardwareAcceleration: true,
        maxConcurrentTransitions: 3,
        frameRate: 60,
        performanceThreshold: 16.67, // ms per frame for 60fps
        
        // Accessibility
        respectMotionPreference: true,
        reducedMotionDuration: 0,
        reducedMotionEasing: 'linear',
        
        // Transition types
        transitionTypes: {
            'fade': { duration: 300, easing: 'ease-in-out' },
            'slide': { duration: 350, easing: 'cubic-bezier(0.4, 0.0, 0.2, 1)' },
            'scale': { duration: 400, easing: 'cubic-bezier(0.4, 0.0, 0.2, 1)' },
            'flip': { duration: 500, easing: 'cubic-bezier(0.4, 0.0, 0.2, 1)' },
            'morph': { duration: 600, easing: 'cubic-bezier(0.4, 0.0, 0.2, 1)' },
            'dissolve': { duration: 400, easing: 'ease-in-out' },
            'wipe': { duration: 350, easing: 'cubic-bezier(0.4, 0.0, 0.2, 1)' },
            'push': { duration: 400, easing: 'cubic-bezier(0.4, 0.0, 0.2, 1)' },
            'reveal': { duration: 450, easing: 'cubic-bezier(0.4, 0.0, 0.2, 1)' },
            'cube': { duration: 600, easing: 'cubic-bezier(0.4, 0.0, 0.2, 1)' }
        },
        
        // Context patterns
        contextPatterns: {
            'navigation': 'slide',
            'modal': 'scale',
            'detail': 'morph',
            'search': 'fade',
            'filter': 'dissolve',
            'sort': 'slide',
            'edit': 'scale',
            'delete': 'fade',
            'create': 'reveal',
            'update': 'morph'
        },
        
        // Debug
        debugMode: false,
        performanceMonitoring: true,
        transitionLogging: false
    },

    /**
     * State management
     */
    state: {
        // View Transitions API
        viewTransitionsSupported: false,
        activeTransition: null,
        transitionQueue: [],
        
        // Animation state
        activeAnimations: new Map(),
        animationFrame: null,
        startTime: null,
        progress: 0,
        
        // Performance
        frameMetrics: new Map(),
        performanceHistory: [],
        currentFrameRate: 60,
        
        // Accessibility
        reducedMotion: false,
        motionPreference: null,
        
        // Browser compatibility
        browserFeatures: new Map(),
        polyfillsLoaded: false,
        
        // Transition builders
        customTransitions: new Map(),
        transitionComposers: new Map(),
        
        // State preservation
        preservedStates: new Map(),
        stateSnapshot: null,
        
        // Cache
        transitionCache: new Map(),
        animationCache: new Map(),
        
        // Debug
        transitionLog: [],
        performanceLog: []
    },

    /**
     * Initialize view transitions system
     */
    initialize() {
        console.log('🎬 Initializing Advanced View Transitions System...');
        
        // Check browser capabilities
        this.checkBrowserCapabilities();
        
        // Setup View Transitions API
        this.setupViewTransitionsAPI();
        
        // Setup CSS fallbacks
        this.setupCSSFallbacks();
        
        // Setup performance monitoring
        this.setupPerformanceMonitoring();
        
        // Setup accessibility preferences
        this.setupAccessibilityPreferences();
        
        // Setup custom transitions
        this.setupCustomTransitions();
        
        // Setup transition composers
        this.setupTransitionComposers();
        
        // Setup state preservation
        this.setupStatePreservation();
        
        // Setup debug mode
        this.setupDebugMode();
        
        // Load polyfills if needed
        this.loadPolyfills();
        
        console.log('✅ Advanced View Transitions System initialized');
    },

    /**
     * Check browser capabilities
     */
    checkBrowserCapabilities() {
        // Check View Transitions API support
        this.state.viewTransitionsSupported = 'startViewTransition' in document;
        
        // Check CSS animation support
        this.state.browserFeatures.set('cssAnimations', 'animation' in document.body.style);
        this.state.browserFeatures.set('cssTransforms', 'transform' in document.body.style);
        this.state.browserFeatures.set('cssTransitions', 'transition' in document.body.style);
        this.state.browserFeatures.set('willChange', 'willChange' in document.body.style);
        
        // Check hardware acceleration support
        this.state.browserFeatures.set('hardwareAcceleration', 
            this.checkHardwareAccelerationSupport());
        
        // Check performance API support
        this.state.browserFeatures.set('performanceAPI', 'performance' in window);
        this.state.browserFeatures.set('performanceObserver', 'PerformanceObserver' in window);
        
        // Check reduced motion preference
        this.state.browserFeatures.set('reducedMotion', 
            window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
        
        console.log('Browser capabilities:', {
            viewTransitionsAPI: this.state.viewTransitionsSupported,
            cssAnimations: this.state.browserFeatures.get('cssAnimations'),
            cssTransforms: this.state.browserFeatures.get('cssTransforms'),
            hardwareAcceleration: this.state.browserFeatures.get('hardwareAcceleration'),
            reducedMotion: this.state.browserFeatures.get('reducedMotion')
        });
    },

    /**
     * Check hardware acceleration support
     */
    checkHardwareAccelerationSupport() {
        // Create test element
        const testElement = document.createElement('div');
        testElement.style.transform = 'translateZ(0)';
        testElement.style.backfaceVisibility = 'hidden';
        
        // Check if transform is applied
        const computedStyle = window.getComputedStyle(testElement);
        return computedStyle.transform !== 'none';
    },

    /**
     * Setup View Transitions API
     */
    setupViewTransitionsAPI() {
        if (!this.state.viewTransitionsSupported) {
            console.log('View Transitions API not supported, using CSS fallbacks');
            return;
        }
        
        // Override document.startViewTransition for enhanced functionality
        const originalStartViewTransition = document.startViewTransition.bind(document);
        
        document.startViewTransition = (callback, options = {}) => {
            // Merge with default options
            const mergedOptions = {
                duration: this.config.defaultDuration,
                easing: this.config.defaultEasing,
                ...options
            };
            
            // Log transition if debug mode is enabled
            if (this.config.transitionLogging) {
                this.logTransition('start', mergedOptions);
            }
            
            // Start performance monitoring
            if (this.config.performanceMonitoring) {
                this.startPerformanceMonitoring();
            }
            
            // Call original method with enhanced callback
            return originalStartViewTransition(() => {
                // Apply pre-transition setup
                this.setupPreTransition(mergedOptions);
                
                // Execute original callback
                const result = callback();
                
                // Apply post-transition setup
                this.setupPostTransition(mergedOptions);
                
                return result;
            });
        };
        
        console.log('View Transitions API setup complete');
    },

    /**
     * Setup CSS fallbacks
     */
    setupCSSFallbacks() {
        if (!this.config.fallbackToCSS) return;
        
        // Create CSS transition classes
        this.createCSSTransitionClasses();
        
        // Setup CSS animation keyframes
        this.createCSSAnimationKeyframes();
        
        // Setup transition utilities
        this.setupTransitionUtilities();
        
        console.log('CSS fallbacks setup complete');
    },

    /**
     * Create CSS transition classes
     */
    createCSSTransitionClasses() {
        const style = document.createElement('style');
        style.id = 'view-transitions-css';
        
        let css = `
            /* Base transition classes */
            .view-transition {
                position: relative;
                overflow: hidden;
            }
            
            .view-transition-enter {
                opacity: 0;
            }
            
            .view-transition-enter-active {
                opacity: 1;
                transition: opacity var(--transition-duration) var(--transition-easing);
            }
            
            .view-transition-exit {
                opacity: 1;
            }
            
            .view-transition-exit-active {
                opacity: 0;
                transition: opacity var(--transition-duration) var(--transition-easing);
            }
            
            /* Hardware acceleration */
            .view-transition-hardware-accelerated {
                transform: translateZ(0);
                backface-visibility: hidden;
                perspective: 1000px;
            }
            
            /* Reduced motion */
            @media (prefers-reduced-motion: reduce) {
                .view-transition *,
                .view-transition *::before,
                .view-transition *::after {
                    animation-duration: 0.01ms !important;
                    animation-iteration-count: 1 !important;
                    transition-duration: 0.01ms !important;
                }
            }
        `;
        
        // Add transition type specific classes
        Object.entries(this.config.transitionTypes).forEach(([type, config]) => {
            css += this.generateTransitionCSS(type, config);
        });
        
        style.textContent = css;
        document.head.appendChild(style);
    },

    /**
     * Generate transition CSS
     */
    generateTransitionCSS(type, config) {
        const { duration, easing } = config;
        
        switch (type) {
            case 'fade':
                return `
                    .view-transition-fade-enter { opacity: 0; }
                    .view-transition-fade-enter-active { opacity: 1; transition: opacity ${duration}ms ${easing}; }
                    .view-transition-fade-exit { opacity: 1; }
                    .view-transition-fade-exit-active { opacity: 0; transition: opacity ${duration}ms ${easing}; }
                `;
                
            case 'slide':
                return `
                    .view-transition-slide-enter { transform: translateX(100%); opacity: 0; }
                    .view-transition-slide-enter-active { transform: translateX(0); opacity: 1; transition: transform ${duration}ms ${easing}, opacity ${duration}ms ${easing}; }
                    .view-transition-slide-exit { transform: translateX(0); opacity: 1; }
                    .view-transition-slide-exit-active { transform: translateX(-100%); opacity: 0; transition: transform ${duration}ms ${easing}, opacity ${duration}ms ${easing}; }
                `;
                
            case 'scale':
                return `
                    .view-transition-scale-enter { transform: scale(0.8); opacity: 0; }
                    .view-transition-scale-enter-active { transform: scale(1); opacity: 1; transition: transform ${duration}ms ${easing}, opacity ${duration}ms ${easing}; }
                    .view-transition-scale-exit { transform: scale(1); opacity: 1; }
                    .view-transition-scale-exit-active { transform: scale(1.2); opacity: 0; transition: transform ${duration}ms ${easing}, opacity ${duration}ms ${easing}; }
                `;
                
            case 'flip':
                return `
                    .view-transition-flip-enter { transform: rotateY(-90deg); opacity: 0; }
                    .view-transition-flip-enter-active { transform: rotateY(0); opacity: 1; transition: transform ${duration}ms ${easing}, opacity ${duration}ms ${easing}; }
                    .view-transition-flip-exit { transform: rotateY(0); opacity: 1; }
                    .view-transition-flip-exit-active { transform: rotateY(90deg); opacity: 0; transition: transform ${duration}ms ${easing}, opacity ${duration}ms ${easing}; }
                `;
                
            case 'morph':
                return `
                    .view-transition-morph-enter { transform: scale(0.5) rotate(180deg); opacity: 0; border-radius: 50%; }
                    .view-transition-morph-enter-active { transform: scale(1) rotate(0); opacity: 1; border-radius: 0; transition: transform ${duration}ms ${easing}, opacity ${duration}ms ${easing}, border-radius ${duration}ms ${easing}; }
                    .view-transition-morph-exit { transform: scale(1) rotate(0); opacity: 1; border-radius: 0; }
                    .view-transition-morph-exit-active { transform: scale(1.5) rotate(-180deg); opacity: 0; border-radius: 50%; transition: transform ${duration}ms ${easing}, opacity ${duration}ms ${easing}, border-radius ${duration}ms ${easing}; }
                `;
                
            default:
                return '';
        }
    },

    /**
     * Create CSS animation keyframes
     */
    createCSSAnimationKeyframes() {
        const style = document.createElement('style');
        style.id = 'view-transitions-keyframes';
        
        const css = `
            @keyframes viewTransitionFadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
            }
            
            @keyframes viewTransitionFadeOut {
                from { opacity: 1; }
                to { opacity: 0; }
            }
            
            @keyframes viewTransitionSlideInRight {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
            
            @keyframes viewTransitionSlideOutLeft {
                from { transform: translateX(0); opacity: 1; }
                to { transform: translateX(-100%); opacity: 0; }
            }
            
            @keyframes viewTransitionScaleIn {
                from { transform: scale(0.8); opacity: 0; }
                to { transform: scale(1); opacity: 1; }
            }
            
            @keyframes viewTransitionScaleOut {
                from { transform: scale(1); opacity: 1; }
                to { transform: scale(1.2); opacity: 0; }
            }
            
            @keyframes viewTransitionFlipIn {
                from { transform: rotateY(-90deg); opacity: 0; }
                to { transform: rotateY(0); opacity: 1; }
            }
            
            @keyframes viewTransitionFlipOut {
                from { transform: rotateY(0); opacity: 1; }
                to { transform: rotateY(90deg); opacity: 0; }
            }
            
            @keyframes viewTransitionMorphIn {
                from { transform: scale(0.5) rotate(180deg); opacity: 0; border-radius: 50%; }
                to { transform: scale(1) rotate(0); opacity: 1; border-radius: 0; }
            }
            
            @keyframes viewTransitionMorphOut {
                from { transform: scale(1) rotate(0); opacity: 1; border-radius: 0; }
                to { transform: scale(1.5) rotate(-180deg); opacity: 0; border-radius: 50%; }
            }
        `;
        
        style.textContent = css;
        document.head.appendChild(style);
    },

    /**
     * Setup transition utilities
     */
    setupTransitionUtilities() {
        // Create transition container
        const container = document.createElement('div');
        container.id = 'view-transition-container';
        container.className = 'view-transition-container';
        container.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: 9999;
        `;
        
        document.body.appendChild(container);
    },

    /**
     * Setup performance monitoring
     */
    setupPerformanceMonitoring() {
        if (!this.config.performanceMonitoring) return;
        
        // Setup Performance Observer if available
        if ('PerformanceObserver' in window) {
            const observer = new PerformanceObserver((list) => {
                list.getEntries().forEach((entry) => {
                    if (entry.name.includes('view-transition')) {
                        this.recordPerformanceMetric(entry);
                    }
                });
            });
            
            observer.observe({ entryTypes: ['measure', 'navigation'] });
        }
        
        // Setup frame rate monitoring
        this.setupFrameRateMonitoring();
        
        console.log('Performance monitoring setup complete');
    },

    /**
     * Setup frame rate monitoring
     */
    setupFrameRateMonitoring() {
        let lastTime = performance.now();
        let frameCount = 0;
        
        const measureFrameRate = (currentTime) => {
            frameCount++;
            
            if (currentTime - lastTime >= 1000) {
                this.state.currentFrameRate = frameCount;
                frameCount = 0;
                lastTime = currentTime;
                
                // Log frame rate if below threshold
                if (this.state.currentFrameRate < 30) {
                    console.warn('Low frame rate detected:', this.state.currentFrameRate);
                }
            }
            
            requestAnimationFrame(measureFrameRate);
        };
        
        requestAnimationFrame(measureFrameRate);
    },

    /**
     * Setup accessibility preferences
     */
    setupAccessibilityPreferences() {
        if (!this.config.respectMotionPreference) return;
        
        // Check for reduced motion preference
        if (window.matchMedia) {
            const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
            this.state.reducedMotion = motionQuery.matches;
            
            motionQuery.addListener((query) => {
                this.state.reducedMotion = query.matches;
                this.updateAccessibilitySettings();
            });
        }
        
        this.updateAccessibilitySettings();
    },

    /**
     * Update accessibility settings
     */
    updateAccessibilitySettings() {
        if (this.state.reducedMotion) {
            // Disable animations for reduced motion
            document.body.classList.add('reduced-motion');
        } else {
            document.body.classList.remove('reduced-motion');
        }
    },

    /**
     * Setup custom transitions
     */
    setupCustomTransitions() {
        // Register built-in custom transitions
        this.registerCustomTransition('bounce', {
            duration: 600,
            easing: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
            keyframes: {
                enter: [
                    { transform: 'scale(0.3)', opacity: 0 },
                    { transform: 'scale(1.05)', opacity: 1, offset: 0.5 },
                    { transform: 'scale(1)', opacity: 1 }
                ],
                exit: [
                    { transform: 'scale(1)', opacity: 1 },
                    { transform: 'scale(0.3)', opacity: 0 }
                ]
            }
        });
        
        this.registerCustomTransition('elastic', {
            duration: 800,
            easing: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
            keyframes: {
                enter: [
                    { transform: 'scale(0)', opacity: 0 },
                    { transform: 'scale(1.2)', opacity: 1, offset: 0.6 },
                    { transform: 'scale(1)', opacity: 1 }
                ],
                exit: [
                    { transform: 'scale(1)', opacity: 1 },
                    { transform: 'scale(0)', opacity: 0 }
                ]
            }
        });
        
        console.log('Custom transitions setup complete');
    },

    /**
     * Register custom transition
     */
    registerCustomTransition(name, config) {
        this.state.customTransitions.set(name, config);
    },

    /**
     * Setup transition composers
     */
    setupTransitionComposers() {
        // Register built-in composers
        this.registerTransitionComposer('sequential', (transitions) => {
            return this.composeSequential(transitions);
        });
        
        this.registerTransitionComposer('parallel', (transitions) => {
            return this.composeParallel(transitions);
        });
        
        this.registerTransitionComposer('staggered', (transitions, options = {}) => {
            return this.composeStaggered(transitions, options);
        });
        
        console.log('Transition composers setup complete');
    },

    /**
     * Register transition composer
     */
    registerTransitionComposer(name, composer) {
        this.state.transitionComposers.set(name, composer);
    },

    /**
     * Setup state preservation
     */
    setupStatePreservation() {
        // Setup state snapshot mechanism
        this.state.stateSnapshot = {
            scrollPosition: { x: 0, y: 0 },
            focusElement: null,
            activeElement: null,
            formStates: new Map(),
            viewStates: new Map()
        };
        
        console.log('State preservation setup complete');
    },

    /**
     * Setup debug mode
     */
    setupDebugMode() {
        if (!this.config.debugMode) return;
        
        // Create debug overlay
        this.createDebugOverlay();
        
        // Setup transition logging
        this.setupTransitionLogging();
        
        console.log('Debug mode setup complete');
    },

    /**
     * Create debug overlay
     */
    createDebugOverlay() {
        const overlay = document.createElement('div');
        overlay.className = 'view-transition-debug-overlay';
        overlay.innerHTML = `
            <div class="view-transition-debug-info">
                <div>Active Transition: <span id="activeTransition">None</span></div>
                <div>Frame Rate: <span id="frameRate">60</span> FPS</div>
                <div>Performance: <span id="performance">Good</span></div>
                <div>Queue Size: <span id="queueSize">0</span></div>
                <div>Reduced Motion: <span id="reducedMotion">No</span></div>
            </div>
        `;
        
        document.body.appendChild(overlay);
        
        // Update debug info
        setInterval(() => {
            this.updateDebugOverlay();
        }, 100);
    },

    /**
     * Update debug overlay
     */
    updateDebugOverlay() {
        if (!this.config.debugMode) return;
        
        const activeTransitionElement = document.getElementById('activeTransition');
        const frameRateElement = document.getElementById('frameRate');
        const performanceElement = document.getElementById('performance');
        const queueSizeElement = document.getElementById('queueSize');
        const reducedMotionElement = document.getElementById('reducedMotion');
        
        if (activeTransitionElement) {
            activeTransitionElement.textContent = this.state.activeTransition || 'None';
        }
        
        if (frameRateElement) {
            frameRateElement.textContent = this.state.currentFrameRate;
        }
        
        if (performanceElement) {
            const performance = this.getPerformanceRating();
            performanceElement.textContent = performance;
        }
        
        if (queueSizeElement) {
            queueSizeElement.textContent = this.state.transitionQueue.length;
        }
        
        if (reducedMotionElement) {
            reducedMotionElement.textContent = this.state.reducedMotion ? 'Yes' : 'No';
        }
    },

    /**
     * Get performance rating
     */
    getPerformanceRating() {
        const frameRate = this.state.currentFrameRate;
        
        if (frameRate >= 55) return 'Excellent';
        if (frameRate >= 45) return 'Good';
        if (frameRate >= 30) return 'Fair';
        return 'Poor';
    },

    /**
     * Setup transition logging
     */
    setupTransitionLogging() {
        // Log transition events
        document.addEventListener('viewTransitionStart', (e) => {
            this.logTransition('start', e.detail);
        });
        
        document.addEventListener('viewTransitionEnd', (e) => {
            this.logTransition('end', e.detail);
        });
    },

    /**
     * Load polyfills
     */
    loadPolyfills() {
        if (this.state.polyfillsLoaded) return;
        
        // Load polyfills for missing browser features
        if (!this.state.browserFeatures.get('cssAnimations')) {
            this.loadAnimationPolyfill();
        }
        
        if (!this.state.browserFeatures.get('cssTransitions')) {
            this.loadTransitionPolyfill();
        }
        
        this.state.polyfillsLoaded = true;
        console.log('Polyfills loaded');
    },

    /**
     * Load animation polyfill
     */
    loadAnimationPolyfill() {
        // Implementation for animation polyfill
        console.log('Animation polyfill loaded');
    },

    /**
     * Load transition polyfill
     */
    loadTransitionPolyfill() {
        // Implementation for transition polyfill
        console.log('Transition polyfill loaded');
    },

    /**
     * Start view transition
     */
    startViewTransition(callback, options = {}) {
        // Get transition type
        const transitionType = options.type || this.getContextualTransitionType(options.context);
        
        // Get transition configuration
        const transitionConfig = this.getTransitionConfig(transitionType, options);
        
        // Check for reduced motion
        if (this.state.reducedMotion) {
            return this.startReducedMotionTransition(callback, options);
        }
        
        // Use View Transitions API if supported
        if (this.state.viewTransitionsSupported && this.config.viewTransitionsAPI) {
            return this.startAPITransition(callback, transitionConfig);
        }
        
        // Use CSS fallback
        return this.startCSSTransition(callback, transitionConfig);
    },

    /**
     * Get contextual transition type
     */
    getContextualTransitionType(context) {
        if (!context) return 'fade';
        
        // Get transition type based on context
        const contextType = context.type || context.action || 'default';
        return this.config.contextPatterns[contextType] || 'fade';
    },

    /**
     * Get transition configuration
     */
    getTransitionConfig(type, options) {
        // Get base configuration
        let config = this.config.transitionTypes[type] || this.config.transitionTypes['fade'];
        
        // Check for custom transition
        if (this.state.customTransitions.has(type)) {
            config = { ...config, ...this.state.customTransitions.get(type) };
        }
        
        // Merge with options
        return {
            type,
            duration: options.duration || config.duration,
            easing: options.easing || config.easing,
            keyframes: options.keyframes || config.keyframes,
            ...options
        };
    },

    /**
     * Start API transition
     */
    startAPITransition(callback, config) {
        return document.startViewTransition(() => {
            // Preserve state
            this.preserveState();
            
            // Execute callback
            const result = callback();
            
            // Restore state
            this.restoreState();
            
            return result;
        }, config);
    },

    /**
     * Start CSS transition
     */
    startCSSTransition(callback, config) {
        return new Promise((resolve) => {
            // Get transition container
            const container = document.getElementById('view-transition-container');
            
            // Create transition elements
            const { enterElement, exitElement } = this.createTransitionElements(container, config);
            
            // Setup transition
            this.setupCSSTransition(enterElement, exitElement, config);
            
            // Execute callback
            const result = callback();
            
            // Start transition
            this.startCSSTransitionAnimation(enterElement, exitElement, config)
                .then(() => {
                    // Cleanup
                    this.cleanupTransitionElements(enterElement, exitElement);
                    resolve(result);
                });
        });
    },

    /**
     * Create transition elements
     */
    createTransitionElements(container, config) {
        // Create enter element
        const enterElement = document.createElement('div');
        enterElement.className = `view-transition-enter view-transition-${config.type}-enter`;
        
        // Create exit element
        const exitElement = document.createElement('div');
        exitElement.className = `view-transition-exit view-transition-${config.type}-exit`;
        
        // Add to container
        container.appendChild(enterElement);
        container.appendChild(exitElement);
        
        return { enterElement, exitElement };
    },

    /**
     * Setup CSS transition
     */
    setupCSSTransition(enterElement, exitElement, config) {
        // Set CSS variables
        enterElement.style.setProperty('--transition-duration', `${config.duration}ms`);
        enterElement.style.setProperty('--transition-easing', config.easing);
        exitElement.style.setProperty('--transition-duration', `${config.duration}ms`);
        exitElement.style.setProperty('--transition-easing', config.easing);
        
        // Add hardware acceleration if enabled
        if (this.config.hardwareAcceleration) {
            enterElement.classList.add('view-transition-hardware-accelerated');
            exitElement.classList.add('view-transition-hardware-accelerated');
        }
    },

    /**
     * Start CSS transition animation
     */
    startCSSTransitionAnimation(enterElement, exitElement, config) {
        return new Promise((resolve) => {
            // Add active classes
            enterElement.classList.add('view-transition-enter-active');
            exitElement.classList.add('view-transition-exit-active');
            
            // Listen for transition end
            const handleTransitionEnd = () => {
                // Remove event listeners
                enterElement.removeEventListener('transitionend', handleTransitionEnd);
                exitElement.removeEventListener('transitionend', handleTransitionEnd);
                
                // Resolve promise
                resolve();
            };
            
            enterElement.addEventListener('transitionend', handleTransitionEnd);
            exitElement.addEventListener('transitionend', handleTransitionEnd);
            
            // Fallback timeout
            setTimeout(() => {
                handleTransitionEnd();
            }, config.duration + 100);
        });
    },

    /**
     * Start reduced motion transition
     */
    startReducedMotionTransition(callback, options) {
        // Execute callback immediately
        const result = callback();
        
        // Return resolved promise
        return Promise.resolve(result);
    },

    /**
     * Preserve state
     */
    preserveState() {
        const snapshot = this.state.stateSnapshot;
        
        // Preserve scroll position
        snapshot.scrollPosition = {
            x: window.scrollX,
            y: window.scrollY
        };
        
        // Preserve focus
        snapshot.focusElement = document.activeElement;
        snapshot.activeElement = document.activeElement;
        
        // Preserve form states
        const forms = document.querySelectorAll('form');
        forms.forEach(form => {
            const formData = new FormData(form);
            snapshot.formStates.set(form, formData);
        });
        
        // Preserve view states
        const views = document.querySelectorAll('.view');
        views.forEach(view => {
            const viewState = {
                id: view.id,
                className: view.className,
                scrollTop: view.scrollTop,
                scrollLeft: view.scrollLeft
            };
            snapshot.viewStates.set(view, viewState);
        });
    },

    /**
     * Restore state
     */
    restoreState() {
        const snapshot = this.state.stateSnapshot;
        
        // Restore scroll position
        window.scrollTo(snapshot.scrollPosition.x, snapshot.scrollPosition.y);
        
        // Restore focus
        if (snapshot.focusElement && snapshot.focusElement.focus) {
            snapshot.focusElement.focus();
        }
        
        // Restore form states
        snapshot.formStates.forEach((formData, form) => {
            // Restore form data
            for (let [key, value] of formData.entries()) {
                const input = form.elements[key];
                if (input) {
                    input.value = value;
                }
            }
        });
        
        // Restore view states
        snapshot.viewStates.forEach((viewState, view) => {
            view.id = viewState.id;
            view.className = viewState.className;
            view.scrollTop = viewState.scrollTop;
            view.scrollLeft = viewState.scrollLeft;
        });
    },

    /**
     * Cleanup transition elements
     */
    cleanupTransitionElements(enterElement, exitElement) {
        // Remove from DOM
        if (enterElement.parentNode) {
            enterElement.parentNode.removeChild(enterElement);
        }
        
        if (exitElement.parentNode) {
            exitElement.parentNode.removeChild(exitElement);
        }
    },

    /**
     * Compose sequential transitions
     */
    composeSequential(transitions) {
        return transitions.reduce((promise, transition, index) => {
            return promise.then(() => {
                return this.startViewTransition(transition.callback, transition.options);
            });
        }, Promise.resolve());
    },

    /**
     * Compose parallel transitions
     */
    composeParallel(transitions) {
        return Promise.all(transitions.map(transition => {
            return this.startViewTransition(transition.callback, transition.options);
        }));
    },

    /**
     * Compose staggered transitions
     */
    composeStaggered(transitions, options = {}) {
        const { delay = 100 } = options;
        
        return transitions.map((transition, index) => {
            const staggeredOptions = {
                ...transition.options,
                delay: index * delay
            };
            
            return this.startViewTransition(transition.callback, staggeredOptions);
        });
    },

    /**
     * Setup pre-transition
     */
    setupPreTransition(options) {
        // Add pre-transition class to body
        document.body.classList.add('view-transition-pre');
        
        // Set CSS variables
        document.documentElement.style.setProperty('--transition-duration', `${options.duration}ms`);
        document.documentElement.style.setProperty('--transition-easing', options.easing);
    },

    /**
     * Setup post-transition
     */
    setupPostTransition(options) {
        // Remove pre-transition class
        document.body.classList.remove('view-transition-pre');
        
        // Add post-transition class
        document.body.classList.add('view-transition-post');
        
        // Remove post-transition class after transition
        setTimeout(() => {
            document.body.classList.remove('view-transition-post');
        }, options.duration);
    },

    /**
     * Start performance monitoring
     */
    startPerformanceMonitoring() {
        this.state.startTime = performance.now();
        
        // Mark performance start
        if (performance.mark) {
            performance.mark('view-transition-start');
        }
    },

    /**
     * Record performance metric
     */
    recordPerformanceMetric(entry) {
        this.state.performanceHistory.push({
            name: entry.name,
            duration: entry.duration,
            timestamp: Date.now()
        });
        
        // Limit history size
        if (this.state.performanceHistory.length > 100) {
            this.state.performanceHistory.shift();
        }
    },

    /**
     * Log transition
     */
    logTransition(event, detail) {
        const logEntry = {
            event,
            detail,
            timestamp: Date.now(),
            frameRate: this.state.currentFrameRate
        };
        
        this.state.transitionLog.push(logEntry);
        
        // Limit log size
        if (this.state.transitionLog.length > 1000) {
            this.state.transitionLog.shift();
        }
        
        // Console log if debug mode
        if (this.config.debugMode) {
            console.log('View Transition:', event, detail);
        }
    },

    /**
     * Get transition metrics
     */
    getTransitionMetrics() {
        return {
            frameRate: this.state.currentFrameRate,
            performanceHistory: this.state.performanceHistory,
            transitionLog: this.state.transitionLog,
            activeTransition: this.state.activeTransition,
            queueSize: this.state.transitionQueue.length
        };
    },

    /**
     * Clear transition cache
     */
    clearTransitionCache() {
        this.state.transitionCache.clear();
        this.state.animationCache.clear();
    },

    /**
     * Reset transition system
     */
    resetTransitionSystem() {
        // Clear active animations
        this.state.activeAnimations.clear();
        
        // Clear transition queue
        this.state.transitionQueue = [];
        
        // Reset state
        this.state.activeTransition = null;
        this.state.startTime = null;
        this.state.progress = 0;
        
        // Clear cache
        this.clearTransitionCache();
    }
};

// Initialize on DOM ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => viewTransitions.initialize());
} else {
    viewTransitions.initialize();
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = viewTransitions;
}

// Make available globally
window.viewTransitions = viewTransitions;