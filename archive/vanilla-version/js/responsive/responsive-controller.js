/**
 * Responsive Controller
 * Advanced responsive behavior control for adaptive layouts and device-specific optimizations
 * 
 * Features:
 * - Fluid typography with clamp() and CSS custom properties
 * - Responsive grid systems that adapt to all screen sizes
 * - Container queries for component-level responsiveness
 * - Flexible spacing systems based on viewport size
 * - Adaptive navigation patterns for different devices
 * - Touch-friendly interaction targets (44px minimum)
 * - Mobile-first progressive enhancement
 * - Cross-browser compatibility and fallbacks
 */

class ResponsiveController {
    constructor(options = {}) {
        this.options = {
            // Breakpoints
            breakpoints: {
                xs: 320,
                sm: 640,
                md: 768,
                lg: 1024,
                xl: 1280,
                '2xl': 1536,
                '3xl': 1920
            },
            
            // Container queries
            containerQueries: {
                sm: 400,
                md: 600,
                lg: 800,
                xl: 1000
            },
            
            // Device detection
            deviceDetection: true,
            
            // Touch detection
            touchDetection: true,
            
            // Orientation detection
            orientationDetection: true,
            
            // Performance monitoring
            performanceMonitoring: false,
            
            // Debug mode
            debugMode: false,
            
            // Auto-update
            autoUpdate: true,
            
            // Update interval (ms)
            updateInterval: 100,
            
            ...options
        };
        
        this.state = {
            // Current viewport
            viewport: {
                width: window.innerWidth,
                height: window.innerHeight,
                ratio: window.innerWidth / window.innerHeight,
                orientation: this.getOrientation(),
                breakpoint: this.getCurrentBreakpoint(),
                containerBreakpoint: null
            },
            
            // Device information
            device: {
                type: this.getDeviceType(),
                isTouch: this.isTouchDevice(),
                isMobile: this.isMobileDevice(),
                isTablet: this.isTabletDevice(),
                isDesktop: this.isDesktopDevice(),
                pixelRatio: window.devicePixelRatio || 1,
                colorGamut: this.getColorGamut(),
                dynamicRange: this.getDynamicRange()
            },
            
            // Input methods
            input: {
                isTouch: false,
                isMouse: false,
                isKeyboard: false,
                isPen: false,
                primaryInput: this.getPrimaryInput()
            },
            
            // Capabilities
            capabilities: {
                containerQueries: this.supportsContainerQueries(),
                cssGrid: this.supportsCSSGrid(),
                cssFlexbox: this.supportsCSSFlexbox(),
                cssCustomProperties: this.supportsCSSCustomProperties(),
                cssClamp: this.supportsCSSClamp(),
                intersectionObserver: this.supportsIntersectionObserver(),
                resizeObserver: this.supportsResizeObserver(),
                webp: this.supportsWebP(),
                avif: this.supportsAVIF(),
                webgl: this.supportsWebGL(),
                webgl2: this.supportsWebGL2()
            },
            
            // Media queries
            mediaQueries: new Map(),
            
            // Event listeners
            eventListeners: new Map(),
            
            // Update timer
            updateTimer: null,
            
            // Performance metrics
            performanceMetrics: {
                updates: 0,
                resizeEvents: 0,
                orientationChanges: 0,
                breakpointChanges: 0,
                containerQueryChanges: 0
            }
        };
        
        this.init();
    }
    
    /**
     * Initialize the responsive controller
     */
    init() {
        this.log('Initializing Responsive Controller...');
        
        // Set up media queries
        this.setupMediaQueries();
        
        // Set up event listeners
        this.setupEventListeners();
        
        // Detect device capabilities
        this.detectCapabilities();
        
        // Initialize container queries
        this.initializeContainerQueries();
        
        // Set up responsive behaviors
        this.setupResponsiveBehaviors();
        
        // Set up fluid typography
        this.setupFluidTypography();
        
        // Set up responsive grids
        this.setupResponsiveGrids();
        
        // Set up adaptive navigation
        this.setupAdaptiveNavigation();
        
        // Set up touch optimizations
        this.setupTouchOptimizations();
        
        // Set up performance monitoring
        if (this.options.performanceMonitoring) {
            this.setupPerformanceMonitoring();
        }
        
        // Start auto-update
        if (this.options.autoUpdate) {
            this.startAutoUpdate();
        }
        
        this.log('Responsive Controller initialized successfully');
    }
    
    /**
     * Set up media queries
     */
    setupMediaQueries() {
        this.log('Setting up media queries...');
        
        // Create media queries for each breakpoint
        Object.entries(this.options.breakpoints).forEach(([name, width]) => {
            const mediaQuery = window.matchMedia(`(min-width: ${width}px)`);
            this.state.mediaQueries.set(name, mediaQuery);
            
            // Add listener for breakpoint changes
            mediaQuery.addEventListener('change', (e) => {
                this.handleBreakpointChange(name, e.matches);
            });
        });
        
        // Create media queries for device features
        this.state.mediaQueries.set('touch', window.matchMedia('(pointer: coarse)'));
        this.state.mediaQueries.set('mouse', window.matchMedia('(pointer: fine)'));
        this.state.mediaQueries.set('hover', window.matchMedia('(hover: hover)'));
        this.state.mediaQueries.set('noHover', window.matchMedia('(hover: none)'));
        this.state.mediaQueries.set('portrait', window.matchMedia('(orientation: portrait)'));
        this.state.mediaQueries.set('landscape', window.matchMedia('(orientation: landscape)'));
        this.state.mediaQueries.set('reducedMotion', window.matchMedia('(prefers-reduced-motion: reduce)'));
        this.state.mediaQueries.set('highContrast', window.matchMedia('(prefers-contrast: high)'));
        this.state.mediaQueries.set('darkMode', window.matchMedia('(prefers-color-scheme: dark)'));
        this.state.mediaQueries.set('lightMode', window.matchMedia('(prefers-color-scheme: light)'));
        
        // Add listeners for device feature changes
        this.state.mediaQueries.get('touch').addEventListener('change', (e) => {
            this.handleTouchChange(e.matches);
        });
        
        this.state.mediaQueries.get('mouse').addEventListener('change', (e) => {
            this.handleMouseChange(e.matches);
        });
        
        this.state.mediaQueries.get('hover').addEventListener('change', (e) => {
            this.handleHoverChange(e.matches);
        });
        
        this.state.mediaQueries.get('portrait').addEventListener('change', (e) => {
            this.handleOrientationChange(e.matches ? 'portrait' : 'landscape');
        });
        
        this.state.mediaQueries.get('landscape').addEventListener('change', (e) => {
            this.handleOrientationChange(e.matches ? 'landscape' : 'portrait');
        });
        
        this.state.mediaQueries.get('reducedMotion').addEventListener('change', (e) => {
            this.handleReducedMotionChange(e.matches);
        });
        
        this.state.mediaQueries.get('highContrast').addEventListener('change', (e) => {
            this.handleHighContrastChange(e.matches);
        });
        
        this.state.mediaQueries.get('darkMode').addEventListener('change', (e) => {
            this.handleColorSchemeChange(e.matches ? 'dark' : 'light');
        });
    }
    
    /**
     * Set up event listeners
     */
    setupEventListeners() {
        this.log('Setting up event listeners...');
        
        // Window resize
        const resizeHandler = this.handleResize.bind(this);
        window.addEventListener('resize', resizeHandler);
        this.state.eventListeners.set('resize', { handler: resizeHandler, element: window });
        
        // Device orientation change
        if (window.screen && window.screen.orientation) {
            const orientationHandler = this.handleDeviceOrientationChange.bind(this);
            window.screen.orientation.addEventListener('change', orientationHandler);
            this.state.eventListeners.set('orientation', { handler: orientationHandler, element: window.screen.orientation });
        }
        
        // Visibility change
        const visibilityHandler = this.handleVisibilityChange.bind(this);
        document.addEventListener('visibilitychange', visibilityHandler);
        this.state.eventListeners.set('visibility', { handler: visibilityHandler, element: document });
        
        // Input method detection
        const mouseDownHandler = this.handleMouseDown.bind(this);
        document.addEventListener('mousedown', mouseDownHandler);
        this.state.eventListeners.set('mousedown', { handler: mouseDownHandler, element: document });
        
        const touchStartHandler = this.handleTouchStart.bind(this);
        document.addEventListener('touchstart', touchStartHandler);
        this.state.eventListeners.set('touchstart', { handler: touchStartHandler, element: document });
        
        const keyDownHandler = this.handleKeyDown.bind(this);
        document.addEventListener('keydown', keyDownHandler);
        this.state.eventListeners.set('keydown', { handler: keyDownHandler, element: document });
        
        // Pointer events
        if (window.PointerEvent) {
            const pointerHandler = this.handlePointerEvent.bind(this);
            document.addEventListener('pointerdown', pointerHandler);
            this.state.eventListeners.set('pointerdown', { handler: pointerHandler, element: document });
        }
    }
    
    /**
     * Detect device capabilities
     */
    detectCapabilities() {
        this.log('Detecting device capabilities...');
        
        // Update device information
        this.state.device = {
            ...this.state.device,
            type: this.getDeviceType(),
            isTouch: this.isTouchDevice(),
            isMobile: this.isMobileDevice(),
            isTablet: this.isTabletDevice(),
            isDesktop: this.isDesktopDevice(),
            pixelRatio: window.devicePixelRatio || 1,
            colorGamut: this.getColorGamut(),
            dynamicRange: this.getDynamicRange()
        };
        
        // Update input methods
        this.state.input = {
            ...this.state.input,
            isTouch: this.state.mediaQueries.get('touch').matches,
            isMouse: this.state.mediaQueries.get('mouse').matches,
            primaryInput: this.getPrimaryInput()
        };
        
        // Apply capability classes
        this.applyCapabilityClasses();
    }
    
    /**
     * Initialize container queries
     */
    initializeContainerQueries() {
        this.log('Initializing container queries...');
        
        if (!this.state.capabilities.containerQueries) {
            this.log('Container queries not supported, using fallback');
            this.initializeContainerQueryFallback();
            return;
        }
        
        // Find all container query elements
        const containerElements = document.querySelectorAll('[data-container]');
        
        containerElements.forEach(element => {
            this.setupContainerQuery(element);
        });
    }
    
    /**
     * Set up container query for an element
     */
    setupContainerQuery(element) {
        const containerName = element.getAttribute('data-container');
        const containerType = element.getAttribute('data-container-type') || 'inline-size';
        
        // Set container type
        element.style.containerType = containerType;
        
        // Set up container query styles
        this.updateContainerQueryStyles(element, containerName);
        
        // Add resize observer for container changes
        if (this.state.capabilities.resizeObserver) {
            const resizeObserver = new ResizeObserver(entries => {
                entries.forEach(entry => {
                    this.handleContainerResize(entry.target, containerName);
                });
            });
            
            resizeObserver.observe(element);
            
            // Store resize observer for cleanup
            if (!this.state.containerResizeObservers) {
                this.state.containerResizeObservers = new Map();
            }
            this.state.containerResizeObservers.set(element, resizeObserver);
        }
    }
    
    /**
     * Update container query styles
     */
    updateContainerQueryStyles(element, containerName) {
        const width = element.offsetWidth;
        let breakpoint = null;
        
        // Determine container breakpoint
        Object.entries(this.options.containerQueries).forEach(([name, minWidth]) => {
            if (width >= minWidth) {
                breakpoint = name;
            }
        });
        
        // Update container breakpoint class
        element.className = element.className.replace(/container-\w+/g, '');
        if (breakpoint) {
            element.classList.add(`container-${breakpoint}`);
        }
        
        // Trigger container change event
        this.triggerContainerChangeEvent(element, containerName, breakpoint);
    }
    
    /**
     * Initialize container query fallback
     */
    initializeContainerQueryFallback() {
        this.log('Setting up container query fallback...');
        
        // Use ResizeObserver as fallback
        if (this.state.capabilities.resizeObserver) {
            const containerElements = document.querySelectorAll('[data-container]');
            
            containerElements.forEach(element => {
                const containerName = element.getAttribute('data-container');
                const resizeObserver = new ResizeObserver(entries => {
                    entries.forEach(entry => {
                        this.handleContainerResize(entry.target, containerName);
                    });
                });
                
                resizeObserver.observe(element);
                
                // Store resize observer for cleanup
                if (!this.state.containerResizeObservers) {
                    this.state.containerResizeObservers = new Map();
                }
                this.state.containerResizeObservers.set(element, resizeObserver);
            });
        }
    }
    
    /**
     * Set up responsive behaviors
     */
    setupResponsiveBehaviors() {
        this.log('Setting up responsive behaviors...');
        
        // Set up responsive images
        this.setupResponsiveImages();
        
        // Set up responsive videos
        this.setupResponsiveVideos();
        
        // Set up responsive tables
        this.setupResponsiveTables();
        
        // Set up responsive forms
        this.setupResponsiveForms();
        
        // Set up responsive navigation
        this.setupResponsiveNavigation();
        
        // Set up responsive modals
        this.setupResponsiveModals();
        
        // Set up responsive carousels
        this.setupResponsiveCarousels();
    }
    
    /**
     * Set up fluid typography
     */
    setupFluidTypography() {
        this.log('Setting up fluid typography...');
        
        // Update CSS custom properties for fluid typography
        this.updateFluidTypographyProperties();
        
        // Set up responsive headings
        this.setupResponsiveHeadings();
        
        // Set up responsive text
        this.setupResponsiveText();
    }
    
    /**
     * Update fluid typography properties
     */
    updateFluidTypographyProperties() {
        const root = document.documentElement;
        const viewport = this.state.viewport;
        
        // Calculate fluid font sizes
        const baseFontSize = this.calculateFluidFontSize(16, 20, viewport.width);
        const h1FontSize = this.calculateFluidFontSize(28, 48, viewport.width);
        const h2FontSize = this.calculateFluidFontSize(24, 36, viewport.width);
        const h3FontSize = this.calculateFluidFontSize(20, 30, viewport.width);
        const h4FontSize = this.calculateFluidFontSize(18, 24, viewport.width);
        const h5FontSize = this.calculateFluidFontSize(16, 20, viewport.width);
        const h6FontSize = this.calculateFluidFontSize(14, 18, viewport.width);
        
        // Update CSS custom properties
        root.style.setProperty('--fluid-font-base', `${baseFontSize}px`);
        root.style.setProperty('--fluid-font-h1', `${h1FontSize}px`);
        root.style.setProperty('--fluid-font-h2', `${h2FontSize}px`);
        root.style.setProperty('--fluid-font-h3', `${h3FontSize}px`);
        root.style.setProperty('--fluid-font-h4', `${h4FontSize}px`);
        root.style.setProperty('--fluid-font-h5', `${h5FontSize}px`);
        root.style.setProperty('--fluid-font-h6', `${h6FontSize}px`);
        
        // Calculate fluid spacing
        const baseSpacing = this.calculateFluidSpacing(16, 24, viewport.width);
        root.style.setProperty('--fluid-spacing', `${baseSpacing}px`);
    }
    
    /**
     * Calculate fluid font size
     */
    calculateFluidFontSize(minSize, maxSize, viewportWidth) {
        const minWidth = 320;
        const maxWidth = 1920;
        
        // Clamp viewport width
        const clampedWidth = Math.max(minWidth, Math.min(maxWidth, viewportWidth));
        
        // Calculate font size
        const scaleFactor = (clampedWidth - minWidth) / (maxWidth - minWidth);
        const fontSize = minSize + (maxSize - minSize) * scaleFactor;
        
        return fontSize;
    }
    
    /**
     * Calculate fluid spacing
     */
    calculateFluidSpacing(minSize, maxSize, viewportWidth) {
        const minWidth = 320;
        const maxWidth = 1920;
        
        // Clamp viewport width
        const clampedWidth = Math.max(minWidth, Math.min(maxWidth, viewportWidth));
        
        // Calculate spacing
        const scaleFactor = (clampedWidth - minWidth) / (maxWidth - minWidth);
        const spacing = minSize + (maxSize - minSize) * scaleFactor;
        
        return spacing;
    }
    
    /**
     * Set up responsive grids
     */
    setupResponsiveGrids() {
        this.log('Setting up responsive grids...');
        
        // Find all grid elements
        const gridElements = document.querySelectorAll('[data-responsive-grid]');
        
        gridElements.forEach(element => {
            this.setupResponsiveGrid(element);
        });
    }
    
    /**
     * Set up responsive grid for an element
     */
    setupResponsiveGrid(element) {
        const gridType = element.getAttribute('data-responsive-grid');
        const breakpoint = this.state.viewport.breakpoint;
        
        // Update grid based on breakpoint
        switch (gridType) {
            case 'auto':
                this.setupAutoGrid(element, breakpoint);
                break;
            case 'fixed':
                this.setupFixedGrid(element, breakpoint);
                break;
            case 'masonry':
                this.setupMasonryGrid(element, breakpoint);
                break;
            default:
                this.setupAutoGrid(element, breakpoint);
        }
    }
    
    /**
     * Set up auto grid
     */
    setupAutoGrid(element, breakpoint) {
        const minColumns = parseInt(element.getAttribute('data-min-columns')) || 1;
        const maxColumns = parseInt(element.getAttribute('data-max-columns')) || 4;
        const columnWidth = parseInt(element.getAttribute('data-column-width')) || 280;
        
        // Calculate columns based on viewport width
        const viewportWidth = this.state.viewport.width;
        const calculatedColumns = Math.floor(viewportWidth / columnWidth);
        const columns = Math.max(minColumns, Math.min(maxColumns, calculatedColumns));
        
        // Update grid styles
        element.style.display = 'grid';
        element.style.gridTemplateColumns = `repeat(${columns}, 1fr)`;
        element.style.gap = this.calculateFluidSpacing(16, 32, viewportWidth) + 'px';
    }
    
    /**
     * Set up fixed grid
     */
    setupFixedGrid(element, breakpoint) {
        const gridConfig = this.getGridConfig(breakpoint);
        
        if (gridConfig) {
            element.style.display = 'grid';
            element.style.gridTemplateColumns = gridConfig.columns;
            element.style.gap = gridConfig.gap;
        }
    }
    
    /**
     * Set up masonry grid
     */
    setupMasonryGrid(element, breakpoint) {
        const columns = this.getMasonryColumns(breakpoint);
        
        // Use CSS columns for masonry
        element.style.columnCount = columns;
        element.style.columnGap = this.calculateFluidSpacing(16, 32, this.state.viewport.width) + 'px';
        
        // Style masonry items
        const items = element.children;
        Array.from(items).forEach(item => {
            item.style.breakInside = 'avoid';
            item.style.marginBottom = this.calculateFluidSpacing(16, 32, this.state.viewport.width) + 'px';
        });
    }
    
    /**
     * Set up adaptive navigation
     */
    setupAdaptiveNavigation() {
        this.log('Setting up adaptive navigation...');
        
        // Find all navigation elements
        const navElements = document.querySelectorAll('[data-responsive-nav]');
        
        navElements.forEach(element => {
            this.setupAdaptiveNavigationElement(element);
        });
    }
    
    /**
     * Set up adaptive navigation element
     */
    setupAdaptiveNavigationElement(element) {
        const navType = element.getAttribute('data-responsive-nav');
        const breakpoint = this.state.viewport.breakpoint;
        const deviceType = this.state.device.type;
        
        // Update navigation based on device and breakpoint
        if (deviceType === 'mobile' || breakpoint === 'xs' || breakpoint === 'sm') {
            this.setupMobileNavigation(element);
        } else if (deviceType === 'tablet' || breakpoint === 'md') {
            this.setupTabletNavigation(element);
        } else {
            this.setupDesktopNavigation(element);
        }
    }
    
    /**
     * Set up mobile navigation
     */
    setupMobileNavigation(element) {
        // Convert to hamburger menu
        if (!element.classList.contains('mobile-nav')) {
            element.classList.add('mobile-nav');
            
            // Create hamburger button
            const hamburger = this.createHamburgerButton();
            element.insertBefore(hamburger, element.firstChild);
            
            // Hide menu items
            const menuItems = element.querySelectorAll('.nav-item');
            menuItems.forEach(item => {
                item.style.display = 'none';
            });
            
            // Add mobile menu container
            const mobileMenu = this.createMobileMenu(menuItems);
            element.appendChild(mobileMenu);
        }
    }
    
    /**
     * Set up tablet navigation
     */
    setupTabletNavigation(element) {
        // Horizontal navigation with dropdowns
        if (!element.classList.contains('tablet-nav')) {
            element.classList.add('tablet-nav');
            
            // Show menu items
            const menuItems = element.querySelectorAll('.nav-item');
            menuItems.forEach(item => {
                item.style.display = 'block';
            });
            
            // Remove mobile menu if exists
            const mobileMenu = element.querySelector('.mobile-menu');
            if (mobileMenu) {
                mobileMenu.remove();
            }
        }
    }
    
    /**
     * Set up desktop navigation
     */
    setupDesktopNavigation(element) {
        // Full navigation with hover states
        if (!element.classList.contains('desktop-nav')) {
            element.classList.add('desktop-nav');
            
            // Show menu items
            const menuItems = element.querySelectorAll('.nav-item');
            menuItems.forEach(item => {
                item.style.display = 'block';
            });
            
            // Remove mobile menu if exists
            const mobileMenu = element.querySelector('.mobile-menu');
            if (mobileMenu) {
                mobileMenu.remove();
            }
        }
    }
    
    /**
     * Set up touch optimizations
     */
    setupTouchOptimizations() {
        this.log('Setting up touch optimizations...');
        
        if (!this.state.device.isTouch) {
            return;
        }
        
        // Add touch optimizations
        document.documentElement.classList.add('touch-optimized');
        
        // Increase touch targets
        this.increaseTouchTargets();
        
        // Add touch feedback
        this.addTouchFeedback();
        
        // Optimize scrolling
        this.optimizeTouchScrolling();
    }
    
    /**
     * Increase touch targets
     */
    increaseTouchTargets() {
        const touchElements = document.querySelectorAll('button, a, input, select, textarea, [role="button"]');
        
        touchElements.forEach(element => {
            const computedStyle = window.getComputedStyle(element);
            const minSize = 44; // Minimum touch target size
            
            // Check if element needs larger touch target
            if (parseInt(computedStyle.height) < minSize || parseInt(computedStyle.width) < minSize) {
                element.style.minHeight = `${minSize}px`;
                element.style.minWidth = `${minSize}px`;
                element.classList.add('touch-target');
            }
        });
    }
    
    /**
     * Add touch feedback
     */
    addTouchFeedback() {
        const touchElements = document.querySelectorAll('.touch-target');
        
        touchElements.forEach(element => {
            element.addEventListener('touchstart', () => {
                element.classList.add('touch-active');
            });
            
            element.addEventListener('touchend', () => {
                setTimeout(() => {
                    element.classList.remove('touch-active');
                }, 150);
            });
        });
    }
    
    /**
     * Optimize touch scrolling
     */
    optimizeTouchScrolling() {
        const scrollElements = document.querySelectorAll('.scroll-container');
        
        scrollElements.forEach(element => {
            element.style.webkitOverflowScrolling = 'touch';
            element.style.overflowScrolling = 'touch';
            element.classList.add('touch-scroll');
        });
    }
    
    /**
     * Handle resize events
     */
    handleResize() {
        this.log('Handling resize event...');
        
        // Update viewport information
        this.updateViewport();
        
        // Update responsive behaviors
        this.updateResponsiveBehaviors();
        
        // Update performance metrics
        this.state.performanceMetrics.resizeEvents++;
    }
    
    /**
     * Handle device orientation change
     */
    handleDeviceOrientationChange() {
        this.log('Handling device orientation change...');
        
        // Update orientation
        this.state.viewport.orientation = this.getOrientation();
        
        // Update viewport
        this.updateViewport();
        
        // Update responsive behaviors
        this.updateResponsiveBehaviors();
        
        // Update performance metrics
        this.state.performanceMetrics.orientationChanges++;
    }
    
    /**
     * Handle visibility change
     */
    handleVisibilityChange() {
        this.log('Handling visibility change...');
        
        if (document.hidden) {
            // Pause auto-update when page is hidden
            this.stopAutoUpdate();
        } else {
            // Resume auto-update when page is visible
            if (this.options.autoUpdate) {
                this.startAutoUpdate();
            }
        }
    }
    
    /**
     * Handle mouse down
     */
    handleMouseDown() {
        this.state.input.isMouse = true;
        this.state.input.isTouch = false;
        this.state.input.primaryInput = 'mouse';
        
        document.documentElement.classList.add('mouse-input');
        document.documentElement.classList.remove('touch-input');
    }
    
    /**
     * Handle touch start
     */
    handleTouchStart() {
        this.state.input.isTouch = true;
        this.state.input.isMouse = false;
        this.state.input.primaryInput = 'touch';
        
        document.documentElement.classList.add('touch-input');
        document.documentElement.classList.remove('mouse-input');
    }
    
    /**
     * Handle key down
     */
    handleKeyDown() {
        this.state.input.isKeyboard = true;
        this.state.input.primaryInput = 'keyboard';
        
        document.documentElement.classList.add('keyboard-input');
    }
    
    /**
     * Handle pointer event
     */
    handlePointerEvent(event) {
        this.state.input.isPen = event.pointerType === 'pen';
        
        if (event.pointerType === 'pen') {
            this.state.input.primaryInput = 'pen';
            document.documentElement.classList.add('pen-input');
        }
    }
    
    /**
     * Handle breakpoint change
     */
    handleBreakpointChange(breakpoint, isActive) {
        this.log(`Breakpoint ${breakpoint} changed to ${isActive}`);
        
        // Update current breakpoint
        this.state.viewport.breakpoint = this.getCurrentBreakpoint();
        
        // Update responsive behaviors
        this.updateResponsiveBehaviors();
        
        // Update performance metrics
        this.state.performanceMetrics.breakpointChanges++;
        
        // Trigger breakpoint change event
        this.triggerBreakpointChangeEvent(breakpoint, isActive);
    }
    
    /**
     * Handle touch change
     */
    handleTouchChange(isTouch) {
        this.log(`Touch capability changed to ${isTouch}`);
        
        this.state.input.isTouch = isTouch;
        this.state.device.isTouch = isTouch;
        
        // Update touch optimizations
        if (isTouch) {
            this.setupTouchOptimizations();
        }
        
        // Trigger touch change event
        this.triggerTouchChangeEvent(isTouch);
    }
    
    /**
     * Handle mouse change
     */
    handleMouseChange(isMouse) {
        this.log(`Mouse capability changed to ${isMouse}`);
        
        this.state.input.isMouse = isMouse;
        
        // Trigger mouse change event
        this.triggerMouseChangeEvent(isMouse);
    }
    
    /**
     * Handle hover change
     */
    handleHoverChange(hasHover) {
        this.log(`Hover capability changed to ${hasHover}`);
        
        // Update hover styles
        if (hasHover) {
            document.documentElement.classList.add('hover-capable');
        } else {
            document.documentElement.classList.remove('hover-capable');
        }
        
        // Trigger hover change event
        this.triggerHoverChangeEvent(hasHover);
    }
    
    /**
     * Handle orientation change
     */
    handleOrientationChange(orientation) {
        this.log(`Orientation changed to ${orientation}`);
        
        this.state.viewport.orientation = orientation;
        
        // Update orientation styles
        document.documentElement.className = document.documentElement.className.replace(/orientation-\w+/g, '');
        document.documentElement.classList.add(`orientation-${orientation}`);
        
        // Update performance metrics
        this.state.performanceMetrics.orientationChanges++;
        
        // Trigger orientation change event
        this.triggerOrientationChangeEvent(orientation);
    }
    
    /**
     * Handle reduced motion change
     */
    handleReducedMotionChange(prefersReduced) {
        this.log(`Reduced motion preference changed to ${prefersReduced}`);
        
        // Update reduced motion styles
        if (prefersReduced) {
            document.documentElement.classList.add('reduced-motion');
        } else {
            document.documentElement.classList.remove('reduced-motion');
        }
        
        // Trigger reduced motion change event
        this.triggerReducedMotionChangeEvent(prefersReduced);
    }
    
    /**
     * Handle high contrast change
     */
    handleHighContrastChange(prefersHighContrast) {
        this.log(`High contrast preference changed to ${prefersHighContrast}`);
        
        // Update high contrast styles
        if (prefersHighContrast) {
            document.documentElement.classList.add('high-contrast');
        } else {
            document.documentElement.classList.remove('high-contrast');
        }
        
        // Trigger high contrast change event
        this.triggerHighContrastChangeEvent(prefersHighContrast);
    }
    
    /**
     * Handle color scheme change
     */
    handleColorSchemeChange(colorScheme) {
        this.log(`Color scheme preference changed to ${colorScheme}`);
        
        // Update color scheme styles
        document.documentElement.className = document.documentElement.className.replace(/color-scheme-\w+/g, '');
        document.documentElement.classList.add(`color-scheme-${colorScheme}`);
        
        // Trigger color scheme change event
        this.triggerColorSchemeChangeEvent(colorScheme);
    }
    
    /**
     * Handle container resize
     */
    handleContainerResize(element, containerName) {
        this.log(`Container ${containerName} resized`);
        
        // Update container query styles
        this.updateContainerQueryStyles(element, containerName);
        
        // Update performance metrics
        this.state.performanceMetrics.containerQueryChanges++;
    }
    
    /**
     * Update viewport information
     */
    updateViewport() {
        this.state.viewport.width = window.innerWidth;
        this.state.viewport.height = window.innerHeight;
        this.state.viewport.ratio = window.innerWidth / window.innerHeight;
        this.state.viewport.breakpoint = this.getCurrentBreakpoint();
    }
    
    /**
     * Update responsive behaviors
     */
    updateResponsiveBehaviors() {
        // Update fluid typography
        this.updateFluidTypographyProperties();
        
        // Update responsive grids
        const gridElements = document.querySelectorAll('[data-responsive-grid]');
        gridElements.forEach(element => {
            this.setupResponsiveGrid(element);
        });
        
        // Update adaptive navigation
        const navElements = document.querySelectorAll('[data-responsive-nav]');
        navElements.forEach(element => {
            this.setupAdaptiveNavigationElement(element);
        });
        
        // Update responsive images
        this.updateResponsiveImages();
        
        // Update responsive videos
        this.updateResponsiveVideos();
    }
    
    /**
     * Get current orientation
     */
    getOrientation() {
        return window.innerWidth > window.innerHeight ? 'landscape' : 'portrait';
    }
    
    /**
     * Get current breakpoint
     */
    getCurrentBreakpoint() {
        const width = window.innerWidth;
        let currentBreakpoint = 'xs';
        
        Object.entries(this.options.breakpoints).forEach(([name, minWidth]) => {
            if (width >= minWidth) {
                currentBreakpoint = name;
            }
        });
        
        return currentBreakpoint;
    }
    
    /**
     * Get device type
     */
    getDeviceType() {
        const width = window.innerWidth;
        
        if (width < 768) {
            return 'mobile';
        } else if (width < 1024) {
            return 'tablet';
        } else {
            return 'desktop';
        }
    }
    
    /**
     * Check if device is touch-capable
     */
    isTouchDevice() {
        return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    }
    
    /**
     * Check if device is mobile
     */
    isMobileDevice() {
        return this.getDeviceType() === 'mobile';
    }
    
    /**
     * Check if device is tablet
     */
    isTabletDevice() {
        return this.getDeviceType() === 'tablet';
    }
    
    /**
     * Check if device is desktop
     */
    isDesktopDevice() {
        return this.getDeviceType() === 'desktop';
    }
    
    /**
     * Get color gamut
     */
    getColorGamut() {
        if (window.matchMedia('(color-gamut: rec2020)').matches) {
            return 'rec2020';
        } else if (window.matchMedia('(color-gamut: p3)').matches) {
            return 'p3';
        } else if (window.matchMedia('(color-gamut: srgb)').matches) {
            return 'srgb';
        }
        return 'unknown';
    }
    
    /**
     * Get dynamic range
     */
    getDynamicRange() {
        if (window.matchMedia('(dynamic-range: high)').matches) {
            return 'high';
        } else if (window.matchMedia('(dynamic-range: standard)').matches) {
            return 'standard';
        }
        return 'unknown';
    }
    
    /**
     * Get primary input
     */
    getPrimaryInput() {
        if (window.matchMedia('(pointer: coarse)').matches) {
            return 'touch';
        } else if (window.matchMedia('(pointer: fine)').matches) {
            return 'mouse';
        }
        return 'unknown';
    }
    
    /**
     * Check if container queries are supported
     */
    supportsContainerQueries() {
        return 'container' in document.documentElement.style;
    }
    
    /**
     * Check if CSS Grid is supported
     */
    supportsCSSGrid() {
        return 'grid' in document.documentElement.style;
    }
    
    /**
     * Check if CSS Flexbox is supported
     */
    supportsCSSFlexbox() {
        return 'flex' in document.documentElement.style;
    }
    
    /**
     * Check if CSS custom properties are supported
     */
    supportsCSSCustomProperties() {
        return 'CSS' in window && 'supports' in window.CSS && window.CSS.supports('color', 'var(--test)');
    }
    
    /**
     * Check if CSS clamp() is supported
     */
    supportsCSSClamp() {
        return 'CSS' in window && 'supports' in window.CSS && window.CSS.supports('width', 'clamp(1px, 2px, 3px)');
    }
    
    /**
     * Check if Intersection Observer is supported
     */
    supportsIntersectionObserver() {
        return 'IntersectionObserver' in window;
    }
    
    /**
     * Check if Resize Observer is supported
     */
    supportsResizeObserver() {
        return 'ResizeObserver' in window;
    }
    
    /**
     * Check if WebP is supported
     */
    supportsWebP() {
        const canvas = document.createElement('canvas');
        return canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
    }
    
    /**
     * Check if AVIF is supported
     */
    supportsAVIF() {
        const canvas = document.createElement('canvas');
        return canvas.toDataURL('image/avif').indexOf('data:image/avif') === 0;
    }
    
    /**
     * Check if WebGL is supported
     */
    supportsWebGL() {
        try {
            const canvas = document.createElement('canvas');
            return !!(canvas.getContext('webgl') || canvas.getContext('experimental-webgl'));
        } catch (e) {
            return false;
        }
    }
    
    /**
     * Check if WebGL2 is supported
     */
    supportsWebGL2() {
        try {
            const canvas = document.createElement('canvas');
            return !!(canvas.getContext('webgl2'));
        } catch (e) {
            return false;
        }
    }
    
    /**
     * Apply capability classes
     */
    applyCapabilityClasses() {
        const root = document.documentElement;
        
        // Apply device classes
        root.classList.add(`device-${this.state.device.type}`);
        
        if (this.state.device.isTouch) {
            root.classList.add('touch-device');
        }
        
        if (this.state.device.isMobile) {
            root.classList.add('mobile-device');
        }
        
        if (this.state.device.isTablet) {
            root.classList.add('tablet-device');
        }
        
        if (this.state.device.isDesktop) {
            root.classList.add('desktop-device');
        }
        
        // Apply capability classes
        if (this.state.capabilities.containerQueries) {
            root.classList.add('container-queries');
        }
        
        if (this.state.capabilities.cssGrid) {
            root.classList.add('css-grid');
        }
        
        if (this.state.capabilities.cssFlexbox) {
            root.classList.add('css-flexbox');
        }
        
        if (this.state.capabilities.cssCustomProperties) {
            root.classList.add('css-custom-properties');
        }
        
        if (this.state.capabilities.cssClamp) {
            root.classList.add('css-clamp');
        }
        
        if (this.state.capabilities.webp) {
            root.classList.add('webp');
        }
        
        if (this.state.capabilities.avif) {
            root.classList.add('avif');
        }
        
        if (this.state.capabilities.webgl) {
            root.classList.add('webgl');
        }
        
        if (this.state.capabilities.webgl2) {
            root.classList.add('webgl2');
        }
    }
    
    /**
     * Create hamburger button
     */
    createHamburgerButton() {
        const button = document.createElement('button');
        button.className = 'hamburger-button';
        button.setAttribute('aria-label', 'Toggle navigation');
        button.innerHTML = `
            <span class="hamburger-line"></span>
            <span class="hamburger-line"></span>
            <span class="hamburger-line"></span>
        `;
        
        button.addEventListener('click', () => {
            this.toggleMobileMenu();
        });
        
        return button;
    }
    
    /**
     * Create mobile menu
     */
    createMobileMenu(menuItems) {
        const menu = document.createElement('div');
        menu.className = 'mobile-menu';
        menu.setAttribute('aria-hidden', 'true');
        
        const list = document.createElement('ul');
        list.className = 'mobile-menu-list';
        
        menuItems.forEach(item => {
            const listItem = document.createElement('li');
            listItem.className = 'mobile-menu-item';
            listItem.appendChild(item.cloneNode(true));
            list.appendChild(listItem);
        });
        
        menu.appendChild(list);
        
        return menu;
    }
    
    /**
     * Toggle mobile menu
     */
    toggleMobileMenu() {
        const mobileMenu = document.querySelector('.mobile-menu');
        const hamburger = document.querySelector('.hamburger-button');
        
        if (mobileMenu) {
            const isHidden = mobileMenu.getAttribute('aria-hidden') === 'true';
            mobileMenu.setAttribute('aria-hidden', !isHidden);
            hamburger.classList.toggle('active', !isHidden);
        }
    }
    
    /**
     * Get grid config for breakpoint
     */
    getGridConfig(breakpoint) {
        const configs = {
            xs: { columns: '1fr', gap: '16px' },
            sm: { columns: 'repeat(2, 1fr)', gap: '16px' },
            md: { columns: 'repeat(2, 1fr)', gap: '24px' },
            lg: { columns: 'repeat(3, 1fr)', gap: '24px' },
            xl: { columns: 'repeat(4, 1fr)', gap: '32px' },
            '2xl': { columns: 'repeat(4, 1fr)', gap: '32px' },
            '3xl': { columns: 'repeat(5, 1fr)', gap: '40px' }
        };
        
        return configs[breakpoint];
    }
    
    /**
     * Get masonry columns for breakpoint
     */
    getMasonryColumns(breakpoint) {
        const columns = {
            xs: 1,
            sm: 2,
            md: 2,
            lg: 3,
            xl: 4,
            '2xl': 4,
            '3xl': 5
        };
        
        return columns[breakpoint] || 1;
    }
    
    /**
     * Set up responsive images
     */
    setupResponsiveImages() {
        const images = document.querySelectorAll('img[data-responsive]');
        
        images.forEach(img => {
            this.setupResponsiveImage(img);
        });
    }
    
    /**
     * Set up responsive image
     */
    setupResponsiveImage(img) {
        const srcset = img.getAttribute('data-srcset');
        const sizes = img.getAttribute('data-sizes');
        
        if (srcset) {
            img.srcset = srcset;
        }
        
        if (sizes) {
            img.sizes = sizes;
        }
    }
    
    /**
     * Update responsive images
     */
    updateResponsiveImages() {
        const images = document.querySelectorAll('img[data-responsive]');
        
        images.forEach(img => {
            this.setupResponsiveImage(img);
        });
    }
    
    /**
     * Set up responsive videos
     */
    setupResponsiveVideos() {
        const videos = document.querySelectorAll('video[data-responsive], iframe[data-responsive]');
        
        videos.forEach(video => {
            this.setupResponsiveVideo(video);
        });
    }
    
    /**
     * Set up responsive video
     */
    setupResponsiveVideo(video) {
        // Create responsive container
        const container = document.createElement('div');
        container.className = 'responsive-video-container';
        
        // Wrap video
        video.parentNode.insertBefore(container, video);
        container.appendChild(video);
        
        // Set up aspect ratio
        const aspectRatio = video.getAttribute('data-aspect-ratio') || '16:9';
        const [width, height] = aspectRatio.split(':').map(Number);
        
        container.style.paddingBottom = `${(height / width) * 100}%`;
        container.style.position = 'relative';
        
        video.style.position = 'absolute';
        video.style.top = '0';
        video.style.left = '0';
        video.style.width = '100%';
        video.style.height = '100%';
    }
    
    /**
     * Update responsive videos
     */
    updateResponsiveVideos() {
        const videos = document.querySelectorAll('video[data-responsive], iframe[data-responsive]');
        
        videos.forEach(video => {
            this.setupResponsiveVideo(video);
        });
    }
    
    /**
     * Set up responsive tables
     */
    setupResponsiveTables() {
        const tables = document.querySelectorAll('table[data-responsive]');
        
        tables.forEach(table => {
            this.setupResponsiveTable(table);
        });
    }
    
    /**
     * Set up responsive table
     */
    setupResponsiveTable(table) {
        // Create responsive container
        const container = document.createElement('div');
        container.className = 'responsive-table-container';
        container.style.overflowX = 'auto';
        container.style.webkitOverflowScrolling = 'touch';
        
        // Wrap table
        table.parentNode.insertBefore(container, table);
        container.appendChild(table);
    }
    
    /**
     * Set up responsive forms
     */
    setupResponsiveForms() {
        const forms = document.querySelectorAll('form[data-responsive]');
        
        forms.forEach(form => {
            this.setupResponsiveForm(form);
        });
    }
    
    /**
     * Set up responsive form
     */
    setupResponsiveForm(form) {
        // Add responsive class
        form.classList.add('responsive-form');
        
        // Set up form fields
        const fields = form.querySelectorAll('input, select, textarea');
        fields.forEach(field => {
            field.classList.add('responsive-form-field');
        });
    }
    
    /**
     * Set up responsive navigation
     */
    setupResponsiveNavigation() {
        const navs = document.querySelectorAll('nav[data-responsive]');
        
        navs.forEach(nav => {
            this.setupResponsiveNavigationElement(nav);
        });
    }
    
    /**
     * Set up responsive modals
     */
    setupResponsiveModals() {
        const modals = document.querySelectorAll('[data-responsive-modal]');
        
        modals.forEach(modal => {
            this.setupResponsiveModal(modal);
        });
    }
    
    /**
     * Set up responsive modal
     */
    setupResponsiveModal(modal) {
        // Add responsive class
        modal.classList.add('responsive-modal');
        
        // Set up modal overlay
        const overlay = modal.querySelector('.modal-overlay');
        if (overlay) {
            overlay.classList.add('responsive-modal-overlay');
        }
    }
    
    /**
     * Set up responsive carousels
     */
    setupResponsiveCarousels() {
        const carousels = document.querySelectorAll('[data-responsive-carousel]');
        
        carousels.forEach(carousel => {
            this.setupResponsiveCarousel(carousel);
        });
    }
    
    /**
     * Set up responsive carousel
     */
    setupResponsiveCarousel(carousel) {
        // Add responsive class
        carousel.classList.add('responsive-carousel');
        
        // Set up carousel container
        const container = carousel.querySelector('.carousel-container');
        if (container) {
            container.classList.add('responsive-carousel-container');
        }
    }
    
    /**
     * Set up responsive headings
     */
    setupResponsiveHeadings() {
        const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
        
        headings.forEach(heading => {
            heading.classList.add('responsive-heading');
        });
    }
    
    /**
     * Set up responsive text
     */
    setupResponsiveText() {
        const textElements = document.querySelectorAll('p, span, div');
        
        textElements.forEach(element => {
            element.classList.add('responsive-text');
        });
    }
    
    /**
     * Start auto-update
     */
    startAutoUpdate() {
        if (this.state.updateTimer) {
            return;
        }
        
        this.state.updateTimer = setInterval(() => {
            this.update();
        }, this.options.updateInterval);
    }
    
    /**
     * Stop auto-update
     */
    stopAutoUpdate() {
        if (this.state.updateTimer) {
            clearInterval(this.state.updateTimer);
            this.state.updateTimer = null;
        }
    }
    
    /**
     * Update
     */
    update() {
        this.updateViewport();
        this.updateResponsiveBehaviors();
        this.state.performanceMetrics.updates++;
    }
    
    /**
     * Set up performance monitoring
     */
    setupPerformanceMonitoring() {
        // Create performance monitor
        const monitor = document.createElement('div');
        monitor.id = 'responsive-performance-monitor';
        monitor.className = 'performance-monitor';
        monitor.innerHTML = `
            <div>Viewport: <span class="performance-viewport">0x0</span></div>
            <div>Breakpoint: <span class="performance-breakpoint">xs</span></div>
            <div>Device: <span class="performance-device">mobile</span></div>
            <div>Updates: <span class="performance-updates">0</span></div>
            <div>Resize Events: <span class="performance-resize">0</span></div>
        `;
        
        document.body.appendChild(monitor);
        
        // Update metrics periodically
        setInterval(() => {
            monitor.querySelector('.performance-viewport').textContent = `${this.state.viewport.width}x${this.state.viewport.height}`;
            monitor.querySelector('.performance-breakpoint').textContent = this.state.viewport.breakpoint;
            monitor.querySelector('.performance-device').textContent = this.state.device.type;
            monitor.querySelector('.performance-updates').textContent = this.state.performanceMetrics.updates;
            monitor.querySelector('.performance-resize').textContent = this.state.performanceMetrics.resizeEvents;
        }, 100);
    }
    
    /**
     * Trigger breakpoint change event
     */
    triggerBreakpointChangeEvent(breakpoint, isActive) {
        const event = new CustomEvent('breakpointChange', {
            detail: { breakpoint, isActive, viewport: this.state.viewport }
        });
        document.dispatchEvent(event);
    }
    
    /**
     * Trigger container change event
     */
    triggerContainerChangeEvent(element, containerName, breakpoint) {
        const event = new CustomEvent('containerChange', {
            detail: { element, containerName, breakpoint }
        });
        document.dispatchEvent(event);
    }
    
    /**
     * Trigger touch change event
     */
    triggerTouchChangeEvent(isTouch) {
        const event = new CustomEvent('touchChange', {
            detail: { isTouch, device: this.state.device }
        });
        document.dispatchEvent(event);
    }
    
    /**
     * Trigger mouse change event
     */
    triggerMouseChangeEvent(isMouse) {
        const event = new CustomEvent('mouseChange', {
            detail: { isMouse, input: this.state.input }
        });
        document.dispatchEvent(event);
    }
    
    /**
     * Trigger hover change event
     */
    triggerHoverChangeEvent(hasHover) {
        const event = new CustomEvent('hoverChange', {
            detail: { hasHover }
        });
        document.dispatchEvent(event);
    }
    
    /**
     * Trigger orientation change event
     */
    triggerOrientationChangeEvent(orientation) {
        const event = new CustomEvent('orientationChange', {
            detail: { orientation, viewport: this.state.viewport }
        });
        document.dispatchEvent(event);
    }
    
    /**
     * Trigger reduced motion change event
     */
    triggerReducedMotionChangeEvent(prefersReduced) {
        const event = new CustomEvent('reducedMotionChange', {
            detail: { prefersReduced }
        });
        document.dispatchEvent(event);
    }
    
    /**
     * Trigger high contrast change event
     */
    triggerHighContrastChangeEvent(prefersHighContrast) {
        const event = new CustomEvent('highContrastChange', {
            detail: { prefersHighContrast }
        });
        document.dispatchEvent(event);
    }
    
    /**
     * Trigger color scheme change event
     */
    triggerColorSchemeChangeEvent(colorScheme) {
        const event = new CustomEvent('colorSchemeChange', {
            detail: { colorScheme }
        });
        document.dispatchEvent(event);
    }
    
    /**
     * Log message
     */
    log(message, ...args) {
        if (this.options.debugMode) {
            console.log(`[ResponsiveController] ${message}`, ...args);
        }
    }
    
    /**
     * Log warning
     */
    logWarning(message, ...args) {
        if (this.options.debugMode) {
            console.warn(`[ResponsiveController] ${message}`, ...args);
        }
    }
    
    /**
     * Log error
     */
    logError(message, ...args) {
        if (this.options.debugMode) {
            console.error(`[ResponsiveController] ${message}`, ...args);
        }
    }
    
    /**
     * Get current state
     */
    getState() {
        return { ...this.state };
    }
    
    /**
     * Get viewport information
     */
    getViewport() {
        return { ...this.state.viewport };
    }
    
    /**
     * Get device information
     */
    getDevice() {
        return { ...this.state.device };
    }
    
    /**
     * Get input information
     */
    getInput() {
        return { ...this.state.input };
    }
    
    /**
     * Get capabilities
     */
    getCapabilities() {
        return { ...this.state.capabilities };
    }
    
    /**
     * Get performance metrics
     */
    getPerformanceMetrics() {
        return { ...this.state.performanceMetrics };
    }
    
    /**
     * Check if breakpoint matches
     */
    isBreakpoint(breakpoint) {
        return this.state.viewport.breakpoint === breakpoint;
    }
    
    /**
     * Check if breakpoint is at least
     */
    isBreakpointUp(breakpoint) {
        const breakpointOrder = ['xs', 'sm', 'md', 'lg', 'xl', '2xl', '3xl'];
        const currentIndex = breakpointOrder.indexOf(this.state.viewport.breakpoint);
        const targetIndex = breakpointOrder.indexOf(breakpoint);
        
        return currentIndex >= targetIndex;
    }
    
    /**
     * Check if breakpoint is at most
     */
    isBreakpointDown(breakpoint) {
        const breakpointOrder = ['xs', 'sm', 'md', 'lg', 'xl', '2xl', '3xl'];
        const currentIndex = breakpointOrder.indexOf(this.state.viewport.breakpoint);
        const targetIndex = breakpointOrder.indexOf(breakpoint);
        
        return currentIndex <= targetIndex;
    }
    
    /**
     * Check if device type matches
     */
    isDevice(deviceType) {
        return this.state.device.type === deviceType;
    }
    
    /**
     * Check if device is touch-capable
     */
    isTouch() {
        return this.state.device.isTouch;
    }
    
    /**
     * Check if device is mobile
     */
    isMobile() {
        return this.state.device.isMobile;
    }
    
    /**
     * Check if device is tablet
     */
    isTablet() {
        return this.state.device.isTablet;
    }
    
    /**
     * Check if device is desktop
     */
    isDesktop() {
        return this.state.device.isDesktop;
    }
    
    /**
     * Destroy the responsive controller
     */
    destroy() {
        this.log('Destroying Responsive Controller...');
        
        // Stop auto-update
        this.stopAutoUpdate();
        
        // Remove event listeners
        this.state.eventListeners.forEach((listener, element) => {
            element.removeEventListener(listener.type, listener.handler);
        });
        
        // Clean up resize observers
        if (this.state.containerResizeObservers) {
            this.state.containerResizeObservers.forEach((observer, element) => {
                observer.disconnect();
            });
        }
        
        // Remove performance monitor
        const monitor = document.getElementById('responsive-performance-monitor');
        if (monitor) {
            monitor.remove();
        }
        
        // Reset state
        this.state = {
            viewport: {
                width: window.innerWidth,
                height: window.innerHeight,
                ratio: window.innerWidth / window.innerHeight,
                orientation: this.getOrientation(),
                breakpoint: this.getCurrentBreakpoint(),
                containerBreakpoint: null
            },
            device: {
                type: this.getDeviceType(),
                isTouch: this.isTouchDevice(),
                isMobile: this.isMobileDevice(),
                isTablet: this.isTabletDevice(),
                isDesktop: this.isDesktopDevice(),
                pixelRatio: window.devicePixelRatio || 1,
                colorGamut: this.getColorGamut(),
                dynamicRange: this.getDynamicRange()
            },
            input: {
                isTouch: false,
                isMouse: false,
                isKeyboard: false,
                isPen: false,
                primaryInput: this.getPrimaryInput()
            },
            capabilities: {
                containerQueries: this.supportsContainerQueries(),
                cssGrid: this.supportsCSSGrid(),
                cssFlexbox: this.supportsCSSFlexbox(),
                cssCustomProperties: this.supportsCSSCustomProperties(),
                cssClamp: this.supportsCSSClamp(),
                intersectionObserver: this.supportsIntersectionObserver(),
                resizeObserver: this.supportsResizeObserver(),
                webp: this.supportsWebP(),
                avif: this.supportsAVIF(),
                webgl: this.supportsWebGL(),
                webgl2: this.supportsWebGL2()
            },
            mediaQueries: new Map(),
            eventListeners: new Map(),
            updateTimer: null,
            performanceMetrics: {
                updates: 0,
                resizeEvents: 0,
                orientationChanges: 0,
                breakpointChanges: 0,
                containerQueryChanges: 0
            }
        };
        
        this.log('Responsive Controller destroyed');
    }
}

// Export the ResponsiveController
export default ResponsiveController;

// Auto-initialize if not in a module environment
if (typeof window !== 'undefined' && !window.ResponsiveController) {
    window.ResponsiveController = ResponsiveController;
    
    // Auto-initialize with default options
    document.addEventListener('DOMContentLoaded', () => {
        window.responsiveController = new ResponsiveController({
            debugMode: false,
            autoUpdate: true
        });
    });
}