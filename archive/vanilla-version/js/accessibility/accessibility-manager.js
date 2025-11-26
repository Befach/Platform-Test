/**
 * Accessibility Manager
 * Comprehensive accessibility management system for WCAG 2.1 AA compliance
 * 
 * Features:
 * - Focus management with visible focus indicators
 * - ARIA labels and descriptions for screen readers
 * - Keyboard navigation support for all interactive elements
 * - Skip links and landmark navigation
 * - Screen reader support with semantic HTML5 structure
 * - Live regions for dynamic content updates
 * - Voice command and switch navigation compatibility
 * - Reduced motion and battery-saving features
 */

class AccessibilityManager {
    constructor(options = {}) {
        this.options = {
            // Focus management
            focusVisibleClass: 'focus-visible',
            focusTrapClass: 'focus-trap',
            skipLinkClass: 'skip-link',
            
            // ARIA management
            liveRegionClass: 'aria-live',
            liveRegionPoliteClass: 'aria-live-polite',
            liveRegionAssertiveClass: 'aria-live-assertive',
            
            // Keyboard navigation
            keyboardNavClass: 'keyboard-nav',
            keyboardNavActiveClass: 'keyboard-nav-active',
            
            // Screen reader support
            srOnlyClass: 'sr-only',
            srOnlyFocusableClass: 'sr-only-focusable',
            
            // Reduced motion
            reducedMotionClass: 'reduced-motion',
            
            // High contrast
            highContrastClass: 'high-contrast',
            
            // Voice navigation
            voiceNavClass: 'voice-nav',
            
            // Debug mode
            debugMode: false,
            
            ...options
        };
        
        this.state = {
            isKeyboardNavActive: false,
            isReducedMotionPreferred: false,
            isHighContrastPreferred: false,
            isVoiceNavActive: false,
            currentFocusElement: null,
            focusTrapElements: [],
            liveRegions: new Map(),
            skipLinks: [],
            landmarks: new Map(),
            
            // Event listeners
            eventListeners: new Map(),
            
            // Performance monitoring
            performanceMetrics: {
                focusChanges: 0,
                ariaUpdates: 0,
                keyboardNavigations: 0,
                screenReaderAnnouncements: 0
            }
        };
        
        this.init();
    }
    
    /**
     * Initialize the accessibility manager
     */
    init() {
        this.log('Initializing Accessibility Manager...');
        
        // Detect user preferences
        this.detectUserPreferences();
        
        // Set up event listeners
        this.setupEventListeners();
        
        // Initialize focus management
        this.initializeFocusManagement();
        
        // Initialize ARIA management
        this.initializeARIAManagement();
        
        // Initialize keyboard navigation
        this.initializeKeyboardNavigation();
        
        // Initialize screen reader support
        this.initializeScreenReaderSupport();
        
        // Initialize skip links
        this.initializeSkipLinks();
        
        // Initialize landmarks
        this.initializeLandmarks();
        
        // Initialize live regions
        this.initializeLiveRegions();
        
        // Initialize voice navigation
        this.initializeVoiceNavigation();
        
        this.log('Accessibility Manager initialized successfully');
    }
    
    /**
     * Detect user preferences for accessibility
     */
    detectUserPreferences() {
        // Detect reduced motion preference
        this.state.isReducedMotionPreferred = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        
        // Detect high contrast preference
        this.state.isHighContrastPreferred = window.matchMedia('(prefers-contrast: high)').matches;
        
        // Apply preference classes
        if (this.state.isReducedMotionPreferred) {
            document.documentElement.classList.add(this.options.reducedMotionClass);
        }
        
        if (this.state.isHighContrastPreferred) {
            document.documentElement.classList.add(this.options.highContrastClass);
        }
        
        // Listen for preference changes
        window.matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', (e) => {
            this.state.isReducedMotionPreferred = e.matches;
            document.documentElement.classList.toggle(this.options.reducedMotionClass, e.matches);
        });
        
        window.matchMedia('(prefers-contrast: high)').addEventListener('change', (e) => {
            this.state.isHighContrastPreferred = e.matches;
            document.documentElement.classList.toggle(this.options.highContrastClass, e.matches);
        });
    }
    
    /**
     * Set up event listeners
     */
    setupEventListeners() {
        // Keyboard navigation detection
        document.addEventListener('keydown', this.handleKeyDown.bind(this));
        document.addEventListener('mousedown', this.handleMouseDown.bind(this));
        
        // Focus management
        document.addEventListener('focusin', this.handleFocusIn.bind(this));
        document.addEventListener('focusout', this.handleFocusOut.bind(this));
        
        // ARIA updates
        document.addEventListener('aria-attribute-change', this.handleAriaChange.bind(this));
        
        // Voice navigation
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            this.setupVoiceNavigation();
        }
        
        // Performance monitoring
        if (this.options.debugMode) {
            this.setupPerformanceMonitoring();
        }
    }
    
    /**
     * Initialize focus management
     */
    initializeFocusManagement() {
        this.log('Initializing focus management...');

        // Add focus-visible class to keyboard-focused elements
        const focusableElements = document.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );

        focusableElements.forEach(element => {
            element.addEventListener('focus', this.handleElementFocus.bind(this));
            element.addEventListener('blur', this.handleElementBlur.bind(this));
        });
    }
    
    /**
     * Initialize ARIA management
     */
    initializeARIAManagement() {
        this.log('Initializing ARIA management...');
        
        // Find all elements with ARIA attributes
        const ariaElements = document.querySelectorAll('[aria-label], [aria-describedby], [aria-labelledby]');
        
        ariaElements.forEach(element => {
            this.validateARIAAttributes(element);
        });
        
        // Set up ARIA mutation observer
        this.setupARIAMutationObserver();
    }
    
    /**
     * Initialize keyboard navigation
     */
    initializeKeyboardNavigation() {
        this.log('Initializing keyboard navigation...');
        
        // Add keyboard navigation class
        document.documentElement.classList.add(this.options.keyboardNavClass);
        
        // Set up keyboard navigation patterns
        this.setupKeyboardNavigationPatterns();
    }
    
    /**
     * Initialize screen reader support
     */
    initializeScreenReaderSupport() {
        this.log('Initializing screen reader support...');
        
        // Add screen reader only elements
        this.addScreenReaderOnlyElements();
        
        // Set up screen reader announcements
        this.setupScreenReaderAnnouncements();
    }
    
    /**
     * Initialize skip links
     */
    initializeSkipLinks() {
        this.log('Initializing skip links...');

        // Find existing skip links (created by keyboard-navigation.js)
        this.state.skipLinks = Array.from(document.querySelectorAll(`.${this.options.skipLinkClass}`));

        // Set up skip link functionality for existing links
        this.state.skipLinks.forEach(skipLink => {
            skipLink.addEventListener('click', this.handleSkipLinkClick.bind(this));
        });

        this.log(`Found ${this.state.skipLinks.length} skip links`);
    }
    
    /**
     * Initialize landmarks
     */
    initializeLandmarks() {
        this.log('Initializing landmarks...');
        
        // Find all landmark elements
        const landmarks = document.querySelectorAll('[role="banner"], [role="navigation"], [role="main"], [role="contentinfo"], [role="search"], [role="complementary"], [role="form"], [role="region"]');
        
        landmarks.forEach(landmark => {
            const role = landmark.getAttribute('role');
            if (!this.state.landmarks.has(role)) {
                this.state.landmarks.set(role, []);
            }
            this.state.landmarks.get(role).push(landmark);
        });
        
        // Set up landmark navigation
        this.setupLandmarkNavigation();
    }
    
    /**
     * Initialize live regions
     */
    initializeLiveRegions() {
        this.log('Initializing live regions...');
        
        // Find existing live regions
        const liveRegions = document.querySelectorAll(`[aria-live]`);
        
        liveRegions.forEach(region => {
            const politeness = region.getAttribute('aria-live');
            const id = region.id || this.generateId('live-region');
            
            if (!region.id) {
                region.id = id;
            }
            
            this.state.liveRegions.set(id, {
                element: region,
                politeness: politeness || 'polite',
                lastAnnouncement: null
            });
        });
        
        // Create default live regions if needed
        this.createDefaultLiveRegions();
    }
    
    /**
     * Initialize voice navigation
     */
    initializeVoiceNavigation() {
        this.log('Initializing voice navigation...');
        
        // Check for speech recognition support
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        
        if (SpeechRecognition) {
            this.state.voiceRecognition = new SpeechRecognition();
            this.setupVoiceRecognition();
        }
    }
    
    /**
     * Handle keyboard events
     */
    handleKeyDown(event) {
        // Detect keyboard navigation
        if (event.key === 'Tab') {
            this.state.isKeyboardNavActive = true;
            document.documentElement.classList.add(this.options.keyboardNavActiveClass);
            this.state.performanceMetrics.keyboardNavigations++;
        }
        
        // Handle escape key for modals and dropdowns
        if (event.key === 'Escape') {
            this.handleEscapeKey(event);
        }
        
        // Handle arrow keys for navigation
        if (event.key.startsWith('Arrow')) {
            this.handleArrowKey(event);
        }
        
        // Handle Enter and Space for activation
        if (event.key === 'Enter' || event.key === ' ') {
            this.handleActivationKey(event);
        }
    }
    
    /**
     * Handle mouse events
     */
    handleMouseDown(event) {
        // Disable keyboard navigation when mouse is used
        this.state.isKeyboardNavActive = false;
        document.documentElement.classList.remove(this.options.keyboardNavActiveClass);
    }
    
    /**
     * Handle focus in events
     */
    handleFocusIn(event) {
        this.state.currentFocusElement = event.target;
        this.state.performanceMetrics.focusChanges++;
        
        // Add focus-visible class for keyboard navigation
        if (this.state.isKeyboardNavActive) {
            event.target.classList.add(this.options.focusVisibleClass);
        }
        
        // Handle focus trap
        if (event.target.classList.contains(this.options.focusTrapClass)) {
            this.handleFocusTrap(event);
        }
    }
    
    /**
     * Handle focus out events
     */
    handleFocusOut(event) {
        // Remove focus-visible class
        event.target.classList.remove(this.options.focusVisibleClass);
    }
    
    /**
     * Handle element focus
     */
    handleElementFocus(event) {
        if (this.state.isKeyboardNavActive) {
            event.target.classList.add(this.options.focusVisibleClass);
        }
    }
    
    /**
     * Handle element blur
     */
    handleElementBlur(event) {
        event.target.classList.remove(this.options.focusVisibleClass);
    }
    
    /**
     * Handle ARIA changes
     */
    handleAriaChange(event) {
        this.state.performanceMetrics.ariaUpdates++;
        this.validateARIAAttributes(event.target);
    }
    
    /**
     * Handle skip link clicks
     */
    handleSkipLinkClick(event) {
        event.preventDefault();
        
        const targetId = event.target.getAttribute('href');
        const targetElement = document.querySelector(targetId);
        
        if (targetElement) {
            targetElement.focus();
            targetElement.scrollIntoView();
        }
    }
    
    /**
     * Handle escape key
     */
    handleEscapeKey(event) {
        // Close modals
        const openModals = document.querySelectorAll('.modal-overlay.active');
        openModals.forEach(modal => {
            modal.classList.remove('active');
        });
        
        // Close dropdowns
        const openDropdowns = document.querySelectorAll('.dropdown.active');
        openDropdowns.forEach(dropdown => {
            dropdown.classList.remove('active');
        });
    }
    
    /**
     * Handle arrow keys
     */
    handleArrowKey(event) {
        const target = event.target;
        
        // Handle menu navigation
        if (target.getAttribute('role') === 'menuitem') {
            this.handleMenuArrowKey(event);
        }
        
        // Handle tab navigation
        if (target.getAttribute('role') === 'tab') {
            this.handleTabArrowKey(event);
        }
        
        // Handle grid navigation
        if (target.getAttribute('role') === 'gridcell') {
            this.handleGridArrowKey(event);
        }
    }
    
    /**
     * Handle activation keys
     */
    handleActivationKey(event) {
        const target = event.target;
        
        // Prevent default for space key on buttons
        if (event.key === ' ' && target.tagName === 'BUTTON') {
            event.preventDefault();
        }
        
        // Handle custom activation
        if (target.hasAttribute('data-activate')) {
            this.handleCustomActivation(event);
        }
    }
    
    /**
     * Create default live regions
     */
    createDefaultLiveRegions() {
        // Create polite live region
        if (!this.state.liveRegions.has('polite')) {
            const politeRegion = document.createElement('div');
            politeRegion.id = this.generateId('live-region-polite');
            politeRegion.setAttribute('aria-live', 'polite');
            politeRegion.setAttribute('aria-atomic', 'true');
            politeRegion.className = this.options.srOnlyClass;
            document.body.appendChild(politeRegion);
            
            this.state.liveRegions.set('polite', {
                element: politeRegion,
                politeness: 'polite',
                lastAnnouncement: null
            });
        }
        
        // Create assertive live region
        if (!this.state.liveRegions.has('assertive')) {
            const assertiveRegion = document.createElement('div');
            assertiveRegion.id = this.generateId('live-region-assertive');
            assertiveRegion.setAttribute('aria-live', 'assertive');
            assertiveRegion.setAttribute('aria-atomic', 'true');
            assertiveRegion.className = this.options.srOnlyClass;
            document.body.appendChild(assertiveRegion);
            
            this.state.liveRegions.set('assertive', {
                element: assertiveRegion,
                politeness: 'assertive',
                lastAnnouncement: null
            });
        }
    }
    
    /**
     * Set up voice recognition
     */
    setupVoiceRecognition() {
        const recognition = this.state.voiceRecognition;
        
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = 'en-US';
        
        recognition.onresult = (event) => {
            const command = event.results[0][0].transcript.toLowerCase();
            this.handleVoiceCommand(command);
        };
        
        recognition.onerror = (event) => {
            this.log('Voice recognition error:', event.error);
        };
        
        recognition.onend = () => {
            this.state.isVoiceNavActive = false;
            document.documentElement.classList.remove(this.options.voiceNavClass);
        };
    }
    
    /**
     * Handle voice commands
     */
    handleVoiceCommand(command) {
        this.log('Voice command received:', command);
        
        // Simple voice command mapping
        const commands = {
            'go home': () => window.location.href = '/',
            'go back': () => window.history.back(),
            'scroll down': () => window.scrollBy(0, 200),
            'scroll up': () => window.scrollBy(0, -200),
            'focus search': () => document.querySelector('#search')?.focus(),
            'open menu': () => this.openMenu(),
            'close menu': () => this.closeMenu()
        };
        
        if (commands[command]) {
            commands[command]();
        }
    }
    
    /**
     * Set up ARIA mutation observer
     */
    setupARIAMutationObserver() {
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'attributes' && mutation.attributeName.startsWith('aria-')) {
                    this.validateARIAAttributes(mutation.target);
                }
            });
        });
        
        observer.observe(document.body, {
            attributes: true,
            attributeFilter: ['aria-label', 'aria-describedby', 'aria-labelledby', 'aria-expanded', 'aria-hidden', 'aria-live'],
            subtree: true
        });
    }
    
    /**
     * Validate ARIA attributes
     */
    validateARIAAttributes(element) {
        // Check for required ARIA attributes
        const role = element.getAttribute('role');
        
        if (role) {
            this.validateRole(element, role);
        }
        
        // Check for aria-label validity
        const ariaLabel = element.getAttribute('aria-label');
        if (ariaLabel && ariaLabel.trim() === '') {
            this.logWarning('Empty aria-label found on element:', element);
        }
        
        // Check for aria-describedby validity
        const ariaDescribedBy = element.getAttribute('aria-describedby');
        if (ariaDescribedBy) {
            const describedElements = ariaDescribedBy.split(' ');
            describedElements.forEach(id => {
                const describedElement = document.getElementById(id);
                if (!describedElement) {
                    this.logWarning(`aria-describedby references non-existent element: #${id}`);
                }
            });
        }
    }
    
    /**
     * Validate role
     */
    validateRole(element, role) {
        // Check for required attributes for specific roles
        const requiredAttributes = {
            'button': ['aria-expanded', 'aria-pressed'],
            'link': ['aria-describedby'],
            'textbox': ['aria-label', 'aria-placeholder'],
            'combobox': ['aria-expanded', 'aria-autocomplete'],
            'listbox': ['aria-orientation'],
            'menu': ['aria-orientation'],
            'menubar': ['aria-orientation'],
            'tablist': ['aria-orientation'],
            'tree': ['aria-orientation', 'aria-multiselectable'],
            'grid': ['aria-orientation', 'aria-multiselectable']
        };
        
        if (requiredAttributes[role]) {
            requiredAttributes[role].forEach(attr => {
                if (!element.hasAttribute(attr)) {
                    this.logWarning(`Role "${role}" missing recommended attribute "${attr}"`);
                }
            });
        }
    }
    
    /**
     * Set up keyboard navigation patterns
     */
    setupKeyboardNavigationPatterns() {
        // Tab navigation pattern
        this.setupTabNavigation();
        
        // Menu navigation pattern
        this.setupMenuNavigation();
        
        // Grid navigation pattern
        this.setupGridNavigation();
        
        // Dialog navigation pattern
        this.setupDialogNavigation();
    }
    
    /**
     * Set up tab navigation
     */
    setupTabNavigation() {
        const tabLists = document.querySelectorAll('[role="tablist"]');
        
        tabLists.forEach(tabList => {
            const tabs = tabList.querySelectorAll('[role="tab"]');
            const panels = Array.from(tabs).map(tab => 
                document.getElementById(tab.getAttribute('aria-controls'))
            );
            
            tabs.forEach((tab, index) => {
                tab.addEventListener('keydown', (e) => {
                    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
                        e.preventDefault();
                        const direction = e.key === 'ArrowRight' ? 1 : -1;
                        const newIndex = (index + direction + tabs.length) % tabs.length;
                        tabs[newIndex].focus();
                        tabs[newIndex].click();
                    }
                });
            });
        });
    }
    
    /**
     * Set up menu navigation
     */
    setupMenuNavigation() {
        const menus = document.querySelectorAll('[role="menu"]');
        
        menus.forEach(menu => {
            const items = menu.querySelectorAll('[role="menuitem"]');
            
            items.forEach((item, index) => {
                item.addEventListener('keydown', (e) => {
                    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
                        e.preventDefault();
                        const direction = e.key === 'ArrowDown' ? 1 : -1;
                        const newIndex = (index + direction + items.length) % items.length;
                        items[newIndex].focus();
                    }
                });
            });
        });
    }
    
    /**
     * Set up grid navigation
     */
    setupGridNavigation() {
        const grids = document.querySelectorAll('[role="grid"]');
        
        grids.forEach(grid => {
            const cells = grid.querySelectorAll('[role="gridcell"]');
            
            cells.forEach((cell, index) => {
                cell.addEventListener('keydown', (e) => {
                    // Calculate grid dimensions
                    const gridWidth = Math.floor(Math.sqrt(cells.length));
                    const currentRow = Math.floor(index / gridWidth);
                    const currentCol = index % gridWidth;
                    
                    let newIndex = index;
                    
                    switch (e.key) {
                        case 'ArrowRight':
                            newIndex = Math.min(index + 1, currentRow * gridWidth + gridWidth - 1);
                            break;
                        case 'ArrowLeft':
                            newIndex = Math.max(index - 1, currentRow * gridWidth);
                            break;
                        case 'ArrowDown':
                            newIndex = Math.min(index + gridWidth, cells.length - 1);
                            break;
                        case 'ArrowUp':
                            newIndex = Math.max(index - gridWidth, 0);
                            break;
                    }
                    
                    if (newIndex !== index) {
                        e.preventDefault();
                        cells[newIndex].focus();
                    }
                });
            });
        });
    }
    
    /**
     * Set up dialog navigation
     */
    setupDialogNavigation() {
        const dialogs = document.querySelectorAll('[role="dialog"]');
        
        dialogs.forEach(dialog => {
            // Trap focus within dialog
            dialog.addEventListener('keydown', (e) => {
                if (e.key === 'Tab') {
                    const focusableElements = dialog.querySelectorAll(
                        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
                    );
                    
                    if (focusableElements.length === 0) return;
                    
                    const firstElement = focusableElements[0];
                    const lastElement = focusableElements[focusableElements.length - 1];
                    
                    if (e.shiftKey) {
                        if (document.activeElement === firstElement) {
                            e.preventDefault();
                            lastElement.focus();
                        }
                    } else {
                        if (document.activeElement === lastElement) {
                            e.preventDefault();
                            firstElement.focus();
                        }
                    }
                }
            });
        });
    }
    
    /**
     * Set up landmark navigation
     */
    setupLandmarkNavigation() {
        // Add landmark navigation shortcuts
        document.addEventListener('keydown', (e) => {
            // Alt + 1-9 for landmark navigation
            if (e.altKey && e.key >= '1' && e.key <= '9') {
                const landmarkIndex = parseInt(e.key) - 1;
                const landmarkRoles = ['banner', 'navigation', 'main', 'contentinfo', 'search', 'complementary'];
                
                if (landmarkIndex < landmarkRoles.length) {
                    const role = landmarkRoles[landmarkIndex];
                    const landmarks = this.state.landmarks.get(role);
                    
                    if (landmarks && landmarks.length > 0) {
                        e.preventDefault();
                        landmarks[0].focus();
                    }
                }
            }
        });
    }
    
    /**
     * Set up screen reader announcements
     */
    setupScreenReaderAnnouncements() {
        // Create announcement method
        this.announce = (message, politeness = 'polite') => {
            const region = this.state.liveRegions.get(politeness);
            
            if (region) {
                region.element.textContent = message;
                region.lastAnnouncement = message;
                this.state.performanceMetrics.screenReaderAnnouncements++;
                
                // Clear announcement after delay
                setTimeout(() => {
                    region.element.textContent = '';
                }, 1000);
            }
        };
    }
    
    /**
     * Add screen reader only elements
     */
    addScreenReaderOnlyElements() {
        // Add status indicators
        this.addStatusIndicators();
        
        // Add error announcements
        this.addErrorAnnouncements();
        
        // Add success announcements
        this.addSuccessAnnouncements();
    }
    
    /**
     * Add status indicators
     */
    addStatusIndicators() {
        const statusRegion = document.createElement('div');
        statusRegion.id = 'status-region';
        statusRegion.setAttribute('aria-live', 'polite');
        statusRegion.setAttribute('aria-atomic', 'true');
        statusRegion.className = this.options.srOnlyClass;
        document.body.appendChild(statusRegion);
        
        this.state.liveRegions.set('status', {
            element: statusRegion,
            politeness: 'polite',
            lastAnnouncement: null
        });
    }
    
    /**
     * Add error announcements
     */
    addErrorAnnouncements() {
        const errorRegion = document.createElement('div');
        errorRegion.id = 'error-region';
        errorRegion.setAttribute('aria-live', 'assertive');
        errorRegion.setAttribute('aria-atomic', 'true');
        errorRegion.className = this.options.srOnlyClass;
        document.body.appendChild(errorRegion);
        
        this.state.liveRegions.set('error', {
            element: errorRegion,
            politeness: 'assertive',
            lastAnnouncement: null
        });
    }
    
    /**
     * Add success announcements
     */
    addSuccessAnnouncements() {
        const successRegion = document.createElement('div');
        successRegion.id = 'success-region';
        successRegion.setAttribute('aria-live', 'polite');
        successRegion.setAttribute('aria-atomic', 'true');
        successRegion.className = this.options.srOnlyClass;
        document.body.appendChild(successRegion);
        
        this.state.liveRegions.set('success', {
            element: successRegion,
            politeness: 'polite',
            lastAnnouncement: null
        });
    }
    
    /**
     * Handle focus trap
     */
    handleFocusTrap(event) {
        const trapElement = event.target.closest(`.${this.options.focusTrapClass}`);
        
        if (trapElement) {
            const focusableElements = trapElement.querySelectorAll(
                'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
            );
            
            if (focusableElements.length > 0) {
                this.state.focusTrapElements = Array.from(focusableElements);
            }
        }
    }
    
    /**
     * Handle menu arrow key
     */
    handleMenuArrowKey(event) {
        const menu = event.target.closest('[role="menu"]');
        if (!menu) return;
        
        const items = menu.querySelectorAll('[role="menuitem"]');
        const currentIndex = Array.from(items).indexOf(event.target);
        
        let newIndex;
        
        switch (event.key) {
            case 'ArrowDown':
                newIndex = (currentIndex + 1) % items.length;
                break;
            case 'ArrowUp':
                newIndex = (currentIndex - 1 + items.length) % items.length;
                break;
            default:
                return;
        }
        
        event.preventDefault();
        items[newIndex].focus();
    }
    
    /**
     * Handle tab arrow key
     */
    handleTabArrowKey(event) {
        const tabList = event.target.closest('[role="tablist"]');
        if (!tabList) return;
        
        const tabs = tabList.querySelectorAll('[role="tab"]');
        const currentIndex = Array.from(tabs).indexOf(event.target);
        
        let newIndex;
        
        switch (event.key) {
            case 'ArrowRight':
                newIndex = (currentIndex + 1) % tabs.length;
                break;
            case 'ArrowLeft':
                newIndex = (currentIndex - 1 + tabs.length) % tabs.length;
                break;
            default:
                return;
        }
        
        event.preventDefault();
        tabs[newIndex].focus();
        tabs[newIndex].click();
    }
    
    /**
     * Handle grid arrow key
     */
    handleGridArrowKey(event) {
        const grid = event.target.closest('[role="grid"]');
        if (!grid) return;
        
        const cells = grid.querySelectorAll('[role="gridcell"]');
        const currentIndex = Array.from(cells).indexOf(event.target);
        
        // Calculate grid dimensions
        const gridWidth = Math.floor(Math.sqrt(cells.length));
        const currentRow = Math.floor(currentIndex / gridWidth);
        const currentCol = currentIndex % gridWidth;
        
        let newIndex;
        
        switch (event.key) {
            case 'ArrowRight':
                newIndex = Math.min(currentIndex + 1, currentRow * gridWidth + gridWidth - 1);
                break;
            case 'ArrowLeft':
                newIndex = Math.max(currentIndex - 1, currentRow * gridWidth);
                break;
            case 'ArrowDown':
                newIndex = Math.min(currentIndex + gridWidth, cells.length - 1);
                break;
            case 'ArrowUp':
                newIndex = Math.max(currentIndex - gridWidth, 0);
                break;
            default:
                return;
        }
        
        if (newIndex !== currentIndex) {
            event.preventDefault();
            cells[newIndex].focus();
        }
    }
    
    /**
     * Handle custom activation
     */
    handleCustomActivation(event) {
        const target = event.target;
        const action = target.getAttribute('data-activate');
        
        switch (action) {
            case 'toggle':
                target.setAttribute('aria-expanded', 
                    target.getAttribute('aria-expanded') === 'true' ? 'false' : 'true'
                );
                break;
            case 'open':
                target.setAttribute('aria-expanded', 'true');
                break;
            case 'close':
                target.setAttribute('aria-expanded', 'false');
                break;
        }
    }
    
    /**
     * Open menu
     */
    openMenu() {
        const menu = document.querySelector('[role="menu"]');
        if (menu) {
            menu.setAttribute('aria-expanded', 'true');
            menu.focus();
        }
    }
    
    /**
     * Close menu
     */
    closeMenu() {
        const menu = document.querySelector('[role="menu"][aria-expanded="true"]');
        if (menu) {
            menu.setAttribute('aria-expanded', 'false');
        }
    }
    
    /**
     * Set up voice navigation
     */
    setupVoiceNavigation() {
        // Add voice navigation button
        const voiceButton = document.createElement('button');
        voiceButton.id = 'voice-nav-button';
        voiceButton.textContent = 'Voice Navigation';
        voiceButton.className = this.options.srOnlyClass;
        voiceButton.setAttribute('aria-label', 'Activate voice navigation');
        
        voiceButton.addEventListener('click', () => {
            this.startVoiceNavigation();
        });
        
        document.body.appendChild(voiceButton);
    }
    
    /**
     * Start voice navigation
     */
    startVoiceNavigation() {
        if (this.state.voiceRecognition) {
            this.state.isVoiceNavActive = true;
            document.documentElement.classList.add(this.options.voiceNavClass);
            this.state.voiceRecognition.start();
            this.announce('Voice navigation activated. Say a command.');
        }
    }
    
    /**
     * Set up performance monitoring
     */
    setupPerformanceMonitoring() {
        // Create performance monitor
        const monitor = document.createElement('div');
        monitor.id = 'accessibility-performance-monitor';
        monitor.className = 'performance-monitor';
        monitor.innerHTML = `
            <div>Focus Changes: <span class="performance-monitor-fps">0</span></div>
            <div>ARIA Updates: <span class="performance-monitor-memory">0</span></div>
            <div>Keyboard Navigations: <span class="performance-monitor-network">0</span></div>
            <div>Screen Reader Announcements: <span class="performance-monitor-fps">0</span></div>
        `;
        
        document.body.appendChild(monitor);
        
        // Update metrics periodically
        setInterval(() => {
            monitor.querySelector('.performance-monitor-fps').textContent = this.state.performanceMetrics.focusChanges;
            monitor.querySelector('.performance-monitor-memory').textContent = this.state.performanceMetrics.ariaUpdates;
            monitor.querySelector('.performance-monitor-network').textContent = this.state.performanceMetrics.keyboardNavigations;
            monitor.querySelectorAll('.performance-monitor-fps')[1].textContent = this.state.performanceMetrics.screenReaderAnnouncements;
        }, 1000);
    }
    
    /**
     * Generate unique ID
     */
    generateId(prefix) {
        return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }
    
    /**
     * Log message
     */
    log(message, ...args) {
        if (this.options.debugMode) {
            console.log(`[AccessibilityManager] ${message}`, ...args);
        }
    }
    
    /**
     * Log warning
     */
    logWarning(message, ...args) {
        if (this.options.debugMode) {
            console.warn(`[AccessibilityManager] ${message}`, ...args);
        }
    }
    
    /**
     * Log error
     */
    logError(message, ...args) {
        if (this.options.debugMode) {
            console.error(`[AccessibilityManager] ${message}`, ...args);
        }
    }
    
    /**
     * Get performance metrics
     */
    getPerformanceMetrics() {
        return { ...this.state.performanceMetrics };
    }
    
    /**
     * Get current state
     */
    getState() {
        return { ...this.state };
    }
    
    /**
     * Destroy the accessibility manager
     */
    destroy() {
        this.log('Destroying Accessibility Manager...');
        
        // Remove event listeners
        this.state.eventListeners.forEach((listener, element) => {
            element.removeEventListener(listener.type, listener.handler);
        });
        
        // Clean up DOM
        const elementsToRemove = [
            ...this.state.skipLinks,
            ...Array.from(this.state.liveRegions.values()).map(region => region.element),
            document.getElementById('voice-nav-button'),
            document.getElementById('accessibility-performance-monitor')
        ];
        
        elementsToRemove.forEach(element => {
            if (element && element.parentNode) {
                element.parentNode.removeChild(element);
            }
        });
        
        // Reset state
        this.state = {
            isKeyboardNavActive: false,
            isReducedMotionPreferred: false,
            isHighContrastPreferred: false,
            isVoiceNavActive: false,
            currentFocusElement: null,
            focusTrapElements: [],
            liveRegions: new Map(),
            skipLinks: [],
            landmarks: new Map(),
            eventListeners: new Map(),
            performanceMetrics: {
                focusChanges: 0,
                ariaUpdates: 0,
                keyboardNavigations: 0,
                screenReaderAnnouncements: 0
            }
        };
        
        this.log('Accessibility Manager destroyed');
    }
}

// Export the AccessibilityManager
export default AccessibilityManager;

// Auto-initialize if not in a module environment
if (typeof window !== 'undefined' && !window.AccessibilityManager) {
    window.AccessibilityManager = AccessibilityManager;
    
    // Auto-initialize with default options
    document.addEventListener('DOMContentLoaded', () => {
        window.accessibilityManager = new AccessibilityManager({
            debugMode: false
        });
    });
}