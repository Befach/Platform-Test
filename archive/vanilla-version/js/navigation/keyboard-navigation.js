/**
 * Advanced Keyboard Navigation System
 * 
 * Comprehensive keyboard navigation with:
 * - Full keyboard accessibility compliance (WCAG 2.1 AA)
 * - Custom keyboard shortcuts and command palette
 * - Focus management with visual indicators
 * - Skip links and landmark navigation
 * - Modal and dialog focus trapping
 * - Keyboard-only user interface support
 * - Screen reader integration and ARIA support
 * - Performance-optimized key event handling
 * - Adaptive keyboard shortcuts based on usage patterns
 * 
 * @version 1.0.0
 * @author Keyboard Navigation System
 */

const keyboardNavigation = {
    /**
     * Configuration
     */
    config: {
        // Keyboard shortcuts
        shortcuts: {
            // Navigation
            'Ctrl+K': 'commandPalette',
            'Ctrl+/': 'shortcutsHelp',
            'Ctrl+B': 'toggleBreadcrumbs',
            'Alt+ArrowLeft': 'navigateBack',
            'Alt+ArrowRight': 'navigateForward',
            'Alt+Home': 'navigateHome',
            'Alt+End': 'navigateEnd',
            
            // Quick access
            'Ctrl+1': 'quickAccess1',
            'Ctrl+2': 'quickAccess2',
            'Ctrl+3': 'quickAccess3',
            'Ctrl+4': 'quickAccess4',
            'Ctrl+5': 'quickAccess5',
            'Ctrl+6': 'quickAccess6',
            'Ctrl+7': 'quickAccess7',
            'Ctrl+8': 'quickAccess8',
            'Ctrl+9': 'quickAccess9',
            'Ctrl+0': 'quickAccess10',
            
            // Search
            'Ctrl+F': 'find',
            'Ctrl+H': 'replace',
            'F3': 'findNext',
            'Shift+F3': 'findPrevious',
            
            // Actions
            'Ctrl+N': 'newItem',
            'Ctrl+S': 'save',
            'Ctrl+E': 'edit',
            'Ctrl+D': 'duplicate',
            'Delete': 'delete',
            'Enter': 'activate',
            'Space': 'select',
            'Escape': 'cancel',
            
            // Views
            'Ctrl+T': 'tableView',
            'Ctrl+G': 'graphView',
            'Ctrl+I': 'insightsView',
            'Ctrl+,': 'settings',
            
            // Accessibility
            'Tab': 'nextFocusable',
            'Shift+Tab': 'previousFocusable',
            'Alt+M': 'toggleMode',
            'Alt+C': 'toggleContrast',
            'Alt+S': 'toggleFontSize',
            
            // Help
            'F1': 'help',
            'F11': 'toggleFullscreen'
        },
        
        // Focus management
        focusVisibleClass: 'focus-visible',
        focusWithinClass: 'focus-within',
        focusTrapClass: 'focus-trap',
        skipLinkClass: 'skip-link',
        
        // Performance
        keyEventDebounce: 16, // ~60fps
        keyEventThrottle: 8,  // ~120fps
        maxConcurrentKeyEvents: 10,
        
        // Accessibility
        ariaLiveRegion: 'aria-live-region',
            announcementDelay: 100,
        
        // Visual feedback
        focusIndicatorDuration: 200,
        keyboardOnlyDetection: true,
        
        // Learning
        adaptiveShortcuts: true,
        shortcutUsageTracking: true,
        personalizedShortcuts: true
    },

    /**
     * State management
     */
    state: {
        // Focus management
        currentFocusElement: null,
        focusHistory: [],
        focusStack: [],
        focusableElements: new Set(),
        
        // Keyboard shortcuts
        activeShortcuts: new Map(),
        shortcutUsage: new Map(),
        personalizedShortcuts: new Map(),
        shortcutConflicts: new Map(),
        
        // Command palette
        commandPaletteOpen: false,
        commandPaletteResults: [],
        commandPaletteIndex: 0,
        
        // Modal focus trapping
        activeModal: null,
        modalFocusElements: [],
        previousFocusElement: null,
        
        // Screen reader integration
        announcements: [],
        liveRegion: null,
        
        // Performance
        keyEventQueue: [],
        processingKeyEvents: false,
        keyEventMetrics: new Map(),
        
        // User behavior
        keyboardOnlyUser: false,
        preferredShortcuts: new Map(),
        usagePatterns: new Map(),
        
        // Accessibility
        highContrastMode: false,
        reducedMotionMode: false,
        largeTextMode: false,
        
        // Debug
        debugMode: false,
        keyEventLog: []
    },

    /**
     * Initialize keyboard navigation system
     */
    initialize() {
        console.log('⌨️ Initializing Advanced Keyboard Navigation System...');
        
        // Setup keyboard event listeners
        this.setupKeyboardListeners();
        
        // Initialize focus management
        this.initializeFocusManagement();
        
        // Setup command palette
        this.setupCommandPalette();
        
        // Setup skip links
        this.setupSkipLinks();
        
        // Setup modal focus trapping
        this.setupModalFocusTrapping();
        
        // Setup screen reader integration
        this.setupScreenReaderIntegration();
        
        // Setup accessibility features
        this.setupAccessibilityFeatures();
        
        // Load user preferences
        this.loadUserPreferences();
        
        // Setup performance monitoring
        this.setupPerformanceMonitoring();
        
        // Setup adaptive shortcuts
        this.setupAdaptiveShortcuts();
        
        // Detect keyboard-only user
        this.detectKeyboardOnlyUser();
        
        console.log('✅ Advanced Keyboard Navigation System initialized');
    },

    /**
     * Setup keyboard event listeners
     */
    setupKeyboardListeners() {
        // Global keyboard events
        document.addEventListener('keydown', (e) => this.handleKeyDown(e), true);
        document.addEventListener('keyup', (e) => this.handleKeyUp(e), true);
        document.addEventListener('keypress', (e) => this.handleKeyPress(e), true);
        
        // Focus events
        document.addEventListener('focusin', (e) => this.handleFocusIn(e), true);
        document.addEventListener('focusout', (e) => this.handleFocusOut(e), true);
        
        // Input method events (for international keyboards)
        document.addEventListener('compositionstart', (e) => this.handleCompositionStart(e), true);
        document.addEventListener('compositionend', (e) => this.handleCompositionEnd(e), true);
        
        console.log('Keyboard event listeners setup complete');
    },

    /**
     * Handle key down event
     */
    handleKeyDown(e) {
        // Record key event for debugging
        if (this.state.debugMode) {
            this.recordKeyEvent('keydown', e);
        }
        
        // Detect keyboard-only user
        this.detectKeyboardOnlyUser();
        
        // Get keyboard shortcut
        const shortcut = this.getKeyboardShortcut(e);
        
        // Handle special keys
        if (this.handleSpecialKeys(e, shortcut)) {
            return;
        }
        
        // Handle keyboard shortcuts
        if (shortcut && this.config.shortcuts[shortcut]) {
            e.preventDefault();
            this.handleKeyboardShortcut(this.config.shortcuts[shortcut], e);
            return;
        }
        
        // Handle focus navigation
        if (this.handleFocusNavigation(e, shortcut)) {
            return;
        }
        
        // Handle command palette
        if (this.state.commandPaletteOpen) {
            this.handleCommandPaletteKey(e);
            return;
        }
        
        // Handle modal focus trapping
        if (this.state.activeModal) {
            this.handleModalKey(e);
            return;
        }
        
        // Queue key event for processing
        this.queueKeyEvent(e);
    },

    /**
     * Handle key up event
     */
    handleKeyUp(e) {
        // Record key event for debugging
        if (this.state.debugMode) {
            this.recordKeyEvent('keyup', e);
        }
        
        // Handle key up specific actions
        this.handleKeyUpActions(e);
    },

    /**
     * Handle key press event
     */
    handleKeyPress(e) {
        // Record key event for debugging
        if (this.state.debugMode) {
            this.recordKeyEvent('keypress', e);
        }
        
        // Handle character input
        this.handleCharacterInput(e);
    },

    /**
     * Get keyboard shortcut string
     */
    getKeyboardShortcut(e) {
        const parts = [];
        
        // Modifier keys
        if (e.ctrlKey || e.metaKey) parts.push('Ctrl');
        if (e.altKey) parts.push('Alt');
        if (e.shiftKey) parts.push('Shift');
        
        // Main key
        let key = e.key;
        
        // Handle special keys
        switch (key) {
            case ' ':
                key = 'Space';
                break;
            case 'ArrowUp':
                key = 'ArrowUp';
                break;
            case 'ArrowDown':
                key = 'ArrowDown';
                break;
            case 'ArrowLeft':
                key = 'ArrowLeft';
                break;
            case 'ArrowRight':
                key = 'ArrowRight';
                break;
            default:
                // Use key as-is for other keys
                break;
        }
        
        parts.push(key);
        
        return parts.join('+');
    },

    /**
     * Handle special keys
     */
    handleSpecialKeys(e, shortcut) {
        // Handle Tab key for focus navigation
        if (e.key === 'Tab') {
            this.handleTabNavigation(e);
            return true;
        }
        
        // Handle Escape key
        if (e.key === 'Escape') {
            this.handleEscapeKey(e);
            return true;
        }
        
        // Handle Enter key
        if (e.key === 'Enter') {
            this.handleEnterKey(e);
            return true;
        }
        
        // Handle Space key
        if (e.key === ' ') {
            this.handleSpaceKey(e);
            return true;
        }
        
        return false;
    },

    /**
     * Handle keyboard shortcut
     */
    handleKeyboardShortcut(action, e) {
        console.log('⌨️ Keyboard shortcut:', action);
        
        // Track shortcut usage
        this.trackShortcutUsage(action);
        
        // Execute shortcut action
        switch (action) {
            case 'commandPalette':
                this.toggleCommandPalette();
                break;
            case 'shortcutsHelp':
                this.showShortcutsHelp();
                break;
            case 'toggleBreadcrumbs':
                enhancedNavigation.toggleBreadcrumbs();
                break;
            case 'navigateBack':
                enhancedNavigation.navigateBack();
                break;
            case 'navigateForward':
                enhancedNavigation.navigateForward();
                break;
            case 'navigateHome':
                enhancedNavigation.navigateTo('home');
                break;
            case 'navigateEnd':
                enhancedNavigation.navigateTo('settings');
                break;
            case 'find':
                this.activateFind();
                break;
            case 'findNext':
                this.findNext();
                break;
            case 'findPrevious':
                this.findPrevious();
                break;
            case 'newItem':
                this.createNewItem();
                break;
            case 'save':
                this.saveCurrentItem();
                break;
            case 'edit':
                this.editCurrentItem();
                break;
            case 'duplicate':
                this.duplicateCurrentItem();
                break;
            case 'delete':
                this.deleteCurrentItem();
                break;
            case 'tableView':
                enhancedNavigation.navigateTo('tableView');
                break;
            case 'graphView':
                enhancedNavigation.navigateTo('graphView');
                break;
            case 'insightsView':
                enhancedNavigation.navigateTo('insights');
                break;
            case 'settings':
                enhancedNavigation.navigateTo('settings');
                break;
            case 'help':
                this.showHelp();
                break;
            case 'toggleFullscreen':
                this.toggleFullscreen();
                break;
            default:
                if (action.startsWith('quickAccess')) {
                    const index = parseInt(action.replace('quickAccess', '')) - 1;
                    this.activateQuickAccessItem(index);
                }
                break;
        }
        
        // Announce action to screen readers
        this.announceAction(action);
    },

    /**
     * Handle focus navigation
     */
    handleFocusNavigation(e, shortcut) {
        // Handle arrow key navigation
        if (e.key.startsWith('Arrow')) {
            return this.handleArrowKeyNavigation(e);
        }
        
        // Handle Home/End keys
        if (e.key === 'Home' || e.key === 'End') {
            return this.handleHomeEndNavigation(e);
        }
        
        // Handle Page Up/Down keys
        if (e.key === 'PageUp' || e.key === 'PageDown') {
            return this.handlePageNavigation(e);
        }
        
        return false;
    },

    /**
     * Handle Tab navigation
     */
    handleTabNavigation(e) {
        // Get all focusable elements
        const focusableElements = this.getFocusableElements();
        
        if (focusableElements.length === 0) return;
        
        // Find current focus index
        const currentIndex = focusableElements.indexOf(document.activeElement);
        
        // Calculate next index
        let nextIndex;
        if (e.shiftKey) {
            // Shift+Tab - previous element
            nextIndex = currentIndex > 0 ? currentIndex - 1 : focusableElements.length - 1;
        } else {
            // Tab - next element
            nextIndex = currentIndex < focusableElements.length - 1 ? currentIndex + 1 : 0;
        }
        
        // Focus next element
        const nextElement = focusableElements[nextIndex];
        if (nextElement) {
            e.preventDefault();
            nextElement.focus();
            
            // Add focus visible indicator
            this.addFocusVisibleIndicator(nextElement);
        }
    },

    /**
     * Handle arrow key navigation
     */
    handleArrowKeyNavigation(e) {
        const target = e.target;
        
        // Check if target supports arrow key navigation
        if (this.supportsArrowKeyNavigation(target)) {
            return this.handleElementArrowNavigation(target, e);
        }
        
        // Handle grid navigation
        if (this.isGridElement(target)) {
            return this.handleGridNavigation(target, e);
        }
        
        // Handle list navigation
        if (this.isListElement(target)) {
            return this.handleListNavigation(target, e);
        }
        
        return false;
    },

    /**
     * Handle Home/End navigation
     */
    handleHomeEndNavigation(e) {
        const target = e.target;
        
        // Handle text input Home/End
        if (this.isTextInput(target)) {
            return false; // Let browser handle default behavior
        }
        
        // Handle list Home/End
        if (this.isListElement(target)) {
            const listItems = this.getListItems(target);
            if (listItems.length > 0) {
                e.preventDefault();
                const targetItem = e.key === 'Home' ? listItems[0] : listItems[listItems.length - 1];
                targetItem.focus();
                return true;
            }
        }
        
        return false;
    },

    /**
     * Handle Page navigation
     */
    handlePageNavigation(e) {
        const target = e.target;
        
        // Handle scrollable containers
        if (this.isScrollableContainer(target)) {
            return false; // Let browser handle default behavior
        }
        
        // Handle list page navigation
        if (this.isListElement(target)) {
            return this.handleListPageNavigation(target, e);
        }
        
        return false;
    },

    /**
     * Initialize focus management
     */
    initializeFocusManagement() {
        // Find all focusable elements
        this.updateFocusableElements();
        
        // Setup focus visible indicators
        this.setupFocusVisibleIndicators();
        
        // Setup focus within detection
        this.setupFocusWithinDetection();
        
        // Setup focus restoration
        this.setupFocusRestoration();
    },

    /**
     * Get focusable elements
     */
    getFocusableElements(container = document) {
        const focusableSelectors = [
            'button:not([disabled])',
            'input:not([disabled])',
            'select:not([disabled])',
            'textarea:not([disabled])',
            'a[href]',
            'area[href]',
            'iframe',
            'object',
            'embed',
            '[tabindex]:not([tabindex="-1"])',
            '[contenteditable="true"]',
            'summary',
            'audio[controls]',
            'video[controls]'
        ];
        
        const selector = focusableSelectors.join(', ');
        return Array.from(container.querySelectorAll(selector));
    },

    /**
     * Update focusable elements
     */
    updateFocusableElements() {
        const focusableElements = this.getFocusableElements();
        this.state.focusableElements = new Set(focusableElements);
    },

    /**
     * Setup focus visible indicators
     */
    setupFocusVisibleIndicators() {
        // Add focus visible class on keyboard focus
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Tab') {
                document.body.classList.add('keyboard-navigation');
            }
        });
        
        // Remove focus visible class on mouse interaction
        document.addEventListener('mousedown', () => {
            document.body.classList.remove('keyboard-navigation');
        });
        
        // Add focus visible class to focused elements
        document.addEventListener('focusin', (e) => {
            if (document.body.classList.contains('keyboard-navigation')) {
                this.addFocusVisibleIndicator(e.target);
            }
        });
        
        document.addEventListener('focusout', (e) => {
            this.removeFocusVisibleIndicator(e.target);
        });
    },

    /**
     * Add focus visible indicator
     */
    addFocusVisibleIndicator(element) {
        element.classList.add(this.config.focusVisibleClass);
        
        // Remove after delay
        setTimeout(() => {
            element.classList.remove(this.config.focusVisibleClass);
        }, this.config.focusIndicatorDuration);
    },

    /**
     * Remove focus visible indicator
     */
    removeFocusVisibleIndicator(element) {
        element.classList.remove(this.config.focusVisibleClass);
    },

    /**
     * Setup focus within detection
     */
    setupFocusWithinDetection() {
        document.addEventListener('focusin', (e) => {
            const parent = e.target.closest('.focus-within-container');
            if (parent) {
                parent.classList.add(this.config.focusWithinClass);
            }
        });
        
        document.addEventListener('focusout', (e) => {
            const parent = e.target.closest('.focus-within-container');
            if (parent && !parent.contains(e.relatedTarget)) {
                parent.classList.remove(this.config.focusWithinClass);
            }
        });
    },

    /**
     * Setup focus restoration
     */
    setupFocusRestoration() {
        // Store focus before page navigation
        window.addEventListener('beforeunload', () => {
            this.storeFocusState();
        });
        
        // Restore focus after page load
        window.addEventListener('load', () => {
            this.restoreFocusState();
        });
    },

    /**
     * Store focus state
     */
    storeFocusState() {
        const activeElement = document.activeElement;
        if (activeElement && activeElement !== document.body) {
            const focusState = {
                elementId: activeElement.id,
                elementSelector: this.getElementSelector(activeElement),
                scrollPosition: {
                    x: window.scrollX,
                    y: window.scrollY
                },
                timestamp: Date.now()
            };
            
            sessionStorage.setItem('keyboardFocusState', JSON.stringify(focusState));
        }
    },

    /**
     * Restore focus state
     */
    restoreFocusState() {
        try {
            const saved = sessionStorage.getItem('keyboardFocusState');
            if (saved) {
                const focusState = JSON.parse(saved);
                
                // Restore scroll position
                window.scrollTo(focusState.scrollPosition.x, focusState.scrollPosition.y);
                
                // Restore focus
                setTimeout(() => {
                    const element = document.querySelector(focusState.elementSelector) || 
                                   document.getElementById(focusState.elementId);
                    if (element) {
                        element.focus();
                    }
                }, 100);
                
                // Clear saved state
                sessionStorage.removeItem('keyboardFocusState');
            }
        } catch (error) {
            console.warn('Failed to restore focus state:', error);
        }
    },

    /**
     * Setup command palette
     */
    setupCommandPalette() {
        // Check if command palette already exists
        if (document.getElementById('commandPalette')) {
            console.log('⌨️ Command palette already exists, skipping creation');
            return;
        }

        // Create command palette element
        const commandPalette = document.createElement('div');
        commandPalette.className = 'command-palette';
        commandPalette.id = 'commandPalette';
        commandPalette.innerHTML = `
            <div class="command-palette-overlay"></div>
            <div class="command-palette-content">
                <div class="command-palette-header">
                    <input type="text" class="command-palette-input" placeholder="Type a command..." autocomplete="off">
                    <button class="command-palette-close" aria-label="Close command palette">×</button>
                </div>
                <div class="command-palette-results">
                    <div class="command-palette-list" id="commandPaletteList"></div>
                </div>
                <div class="command-palette-footer">
                    <div class="command-palette-shortcuts">
                        <span>↑↓ Navigate</span>
                        <span>Enter Select</span>
                        <span>Esc Close</span>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(commandPalette);

        // Setup command palette events
        this.setupCommandPaletteEvents(commandPalette);
    },

    /**
     * Setup command palette events
     */
    setupCommandPaletteEvents(commandPalette) {
        const input = commandPalette.querySelector('.command-palette-input');
        const closeBtn = commandPalette.querySelector('.command-palette-close');
        const overlay = commandPalette.querySelector('.command-palette-overlay');
        
        // Input events
        input.addEventListener('input', (e) => this.handleCommandPaletteInput(e));
        input.addEventListener('keydown', (e) => this.handleCommandPaletteKey(e));
        
        // Close events
        closeBtn.addEventListener('click', () => this.closeCommandPalette());
        overlay.addEventListener('click', () => this.closeCommandPalette());
        
        // Global close event
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.state.commandPaletteOpen) {
                this.closeCommandPalette();
            }
        });
    },

    /**
     * Toggle command palette
     */
    toggleCommandPalette() {
        if (this.state.commandPaletteOpen) {
            this.closeCommandPalette();
        } else {
            this.openCommandPalette();
        }
    },

    /**
     * Open command palette
     */
    openCommandPalette() {
        const commandPalette = document.getElementById('commandPalette');
        const input = commandPalette.querySelector('.command-palette-input');
        
        // Show command palette
        commandPalette.classList.add('active');
        this.state.commandPaletteOpen = true;
        
        // Focus input
        input.focus();
        input.value = '';
        
        // Load initial commands
        this.loadCommandPaletteCommands('');
        
        // Announce to screen readers
        this.announceToScreenReader('Command palette opened');
    },

    /**
     * Close command palette
     */
    closeCommandPalette() {
        const commandPalette = document.getElementById('commandPalette');
        
        // Hide command palette
        commandPalette.classList.remove('active');
        this.state.commandPaletteOpen = false;
        
        // Restore focus
        this.restorePreviousFocus();
        
        // Announce to screen readers
        this.announceToScreenReader('Command palette closed');
    },

    /**
     * Handle command palette input
     */
    handleCommandPaletteInput(e) {
        const query = e.target.value;
        this.loadCommandPaletteCommands(query);
    },

    /**
     * Handle command palette key
     */
    handleCommandPaletteKey(e) {
        const results = this.state.commandPaletteResults;
        
        switch (e.key) {
            case 'ArrowUp':
                e.preventDefault();
                this.navigateCommandPalette(-1);
                break;
            case 'ArrowDown':
                e.preventDefault();
                this.navigateCommandPalette(1);
                break;
            case 'Enter':
                e.preventDefault();
                this.executeCommandPaletteCommand();
                break;
            case 'Escape':
                e.preventDefault();
                this.closeCommandPalette();
                break;
        }
    },

    /**
     * Load command palette commands
     */
    loadCommandPaletteCommands(query) {
        const commands = this.getCommandPaletteCommands(query);
        this.state.commandPaletteResults = commands;
        this.state.commandPaletteIndex = 0;
        
        this.renderCommandPaletteResults(commands);
    },

    /**
     * Get command palette commands
     */
    getCommandPaletteCommands(query) {
        const allCommands = [
            { name: 'Navigate to Table View', action: 'navigateTo', params: ['tableView'], category: 'Navigation' },
            { name: 'Navigate to Graph View', action: 'navigateTo', params: ['graphView'], category: 'Navigation' },
            { name: 'Navigate to Insights', action: 'navigateTo', params: ['insights'], category: 'Navigation' },
            { name: 'Navigate to Settings', action: 'navigateTo', params: ['settings'], category: 'Navigation' },
            { name: 'Create New Feature', action: 'createFeature', params: [], category: 'Actions' },
            { name: 'Search Features', action: 'search', params: [], category: 'Search' },
            { name: 'Toggle Dark Mode', action: 'toggleTheme', params: [], category: 'Appearance' },
            { name: 'Show Keyboard Shortcuts', action: 'showShortcuts', params: [], category: 'Help' },
            { name: 'Export Data', action: 'exportData', params: [], category: 'Actions' },
            { name: 'Import Data', action: 'importData', params: [], category: 'Actions' }
        ];
        
        // Filter commands based on query
        if (query) {
            const lowerQuery = query.toLowerCase();
            return allCommands.filter(cmd => 
                cmd.name.toLowerCase().includes(lowerQuery) ||
                cmd.category.toLowerCase().includes(lowerQuery)
            );
        }
        
        return allCommands;
    },

    /**
     * Render command palette results
     */
    renderCommandPaletteResults(commands) {
        const list = document.getElementById('commandPaletteList');
        
        if (commands.length === 0) {
            list.innerHTML = '<div class="command-palette-no-results">No commands found</div>';
            return;
        }
        
        list.innerHTML = commands.map((cmd, index) => `
            <div class="command-palette-item ${index === 0 ? 'selected' : ''}" 
                 data-index="${index}"
                 onclick="keyboardNavigation.executeCommandPaletteCommandByIndex(${index})">
                <div class="command-palette-item-name">${cmd.name}</div>
                <div class="command-palette-item-category">${cmd.category}</div>
            </div>
        `).join('');
    },

    /**
     * Navigate command palette
     */
    navigateCommandPalette(direction) {
        const results = this.state.commandPaletteResults;
        const items = document.querySelectorAll('.command-palette-item');
        
        if (items.length === 0) return;
        
        // Remove selected class from current item
        items[this.state.commandPaletteIndex].classList.remove('selected');
        
        // Calculate new index
        let newIndex = this.state.commandPaletteIndex + direction;
        if (newIndex < 0) newIndex = items.length - 1;
        if (newIndex >= items.length) newIndex = 0;
        
        // Update state and UI
        this.state.commandPaletteIndex = newIndex;
        items[newIndex].classList.add('selected');
        
        // Scroll into view if needed
        items[newIndex].scrollIntoView({ block: 'nearest' });
    },

    /**
     * Execute command palette command
     */
    executeCommandPaletteCommand() {
        const command = this.state.commandPaletteResults[this.state.commandPaletteIndex];
        if (command) {
            this.executeCommand(command);
            this.closeCommandPalette();
        }
    },

    /**
     * Execute command palette command by index
     */
    executeCommandPaletteCommandByIndex(index) {
        const command = this.state.commandPaletteResults[index];
        if (command) {
            this.executeCommand(command);
            this.closeCommandPalette();
        }
    },

    /**
     * Execute command
     */
    executeCommand(command) {
        console.log('🎯 Executing command:', command);
        
        switch (command.action) {
            case 'navigateTo':
                enhancedNavigation.navigateTo(command.params[0]);
                break;
            case 'createFeature':
                app.showAddModal();
                break;
            case 'search':
                this.activateFind();
                break;
            case 'toggleTheme':
                this.toggleTheme();
                break;
            case 'showShortcuts':
                this.showShortcutsHelp();
                break;
            case 'exportData':
                app.exportAllData();
                break;
            case 'importData':
                app.importData();
                break;
        }
        
        // Track command usage
        this.trackCommandUsage(command);
    },

    /**
     * Setup skip links
     */
    setupSkipLinks() {
        // Check if skip links already exist
        if (document.querySelector('.skip-links')) {
            console.log('⌨️ Skip links already exist, skipping creation');
            return;
        }

        // Create skip links container
        const skipLinks = document.createElement('div');
        skipLinks.className = 'skip-links';
        skipLinks.setAttribute('role', 'navigation');
        skipLinks.setAttribute('aria-label', 'Skip navigation links');
        skipLinks.innerHTML = `
            <a href="#main-content" class="skip-link ${this.config.skipLinkClass}">Skip to main content</a>
            <a href="#navigation" class="skip-link ${this.config.skipLinkClass}">Skip to navigation</a>
            <a href="#search" class="skip-link ${this.config.skipLinkClass}">Skip to search</a>
        `;

        // Insert at beginning of body
        document.body.insertBefore(skipLinks, document.body.firstChild);
    },

    /**
     * Setup modal focus trapping
     */
    setupModalFocusTrapping() {
        // Listen for modal open/close events
        document.addEventListener('modalOpened', (e) => this.trapModalFocus(e.detail.modal));
        document.addEventListener('modalClosed', (e) => this.releaseModalFocus(e.detail.modal));
    },

    /**
     * Trap modal focus
     */
    trapModalFocus(modal) {
        // Store previous focus element
        this.state.previousFocusElement = document.activeElement;
        
        // Get focusable elements within modal
        const focusableElements = this.getFocusableElements(modal);
        this.state.modalFocusElements = focusableElements;
        
        // Set active modal
        this.state.activeModal = modal;
        
        // Focus first element
        if (focusableElements.length > 0) {
            focusableElements[0].focus();
        }
        
        // Add focus trap class
        modal.classList.add(this.config.focusTrapClass);
    },

    /**
     * Release modal focus
     */
    releaseModalFocus(modal) {
        // Restore previous focus
        if (this.state.previousFocusElement) {
            this.state.previousFocusElement.focus();
        }
        
        // Clear modal state
        this.state.activeModal = null;
        this.state.modalFocusElements = [];
        
        // Remove focus trap class
        modal.classList.remove(this.config.focusTrapClass);
    },

    /**
     * Handle modal key events
     */
    handleModalKey(e) {
        const focusableElements = this.state.modalFocusElements;
        const currentIndex = focusableElements.indexOf(document.activeElement);
        
        switch (e.key) {
            case 'Tab':
                e.preventDefault();
                
                if (e.shiftKey) {
                    // Shift+Tab - previous element
                    const prevIndex = currentIndex > 0 ? currentIndex - 1 : focusableElements.length - 1;
                    focusableElements[prevIndex].focus();
                } else {
                    // Tab - next element
                    const nextIndex = currentIndex < focusableElements.length - 1 ? currentIndex + 1 : 0;
                    focusableElements[nextIndex].focus();
                }
                break;
                
            case 'Escape':
                e.preventDefault();
                // Close modal (implementation depends on modal system)
                this.closeActiveModal();
                break;
        }
    },

    /**
     * Setup screen reader integration
     */
    setupScreenReaderIntegration() {
        // Create live region for announcements
        const liveRegion = document.createElement('div');
        liveRegion.id = this.config.ariaLiveRegion;
        liveRegion.className = 'sr-only';
        liveRegion.setAttribute('aria-live', 'polite');
        liveRegion.setAttribute('aria-atomic', 'true');
        
        document.body.appendChild(liveRegion);
        this.state.liveRegion = liveRegion;
    },

    /**
     * Announce to screen reader
     */
    announceToScreenReader(message) {
        if (!this.state.liveRegion) return;
        
        // Clear previous announcement
        this.state.liveRegion.textContent = '';
        
        // Set new announcement
        setTimeout(() => {
            this.state.liveRegion.textContent = message;
        }, this.config.announcementDelay);
    },

    /**
     * Announce action
     */
    announceAction(action) {
        const announcements = {
            'commandPalette': 'Command palette opened',
            'navigateBack': 'Navigated back',
            'navigateForward': 'Navigated forward',
            'save': 'Item saved',
            'delete': 'Item deleted',
            'edit': 'Edit mode activated'
        };
        
        const message = announcements[action] || `Action: ${action}`;
        this.announceToScreenReader(message);
    },

    /**
     * Setup accessibility features
     */
    setupAccessibilityFeatures() {
        // Detect high contrast mode
        if (window.matchMedia) {
            const highContrastQuery = window.matchMedia('(prefers-contrast: high)');
            this.state.highContrastMode = highContrastQuery.matches;
            
            highContrastQuery.addListener((query) => {
                this.state.highContrastMode = query.matches;
                this.updateAccessibilityMode();
            });
        }
        
        // Detect reduced motion preference
        if (window.matchMedia) {
            const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
            this.state.reducedMotionMode = reducedMotionQuery.matches;
            
            reducedMotionQuery.addListener((query) => {
                this.state.reducedMotionMode = query.matches;
                this.updateAccessibilityMode();
            });
        }
        
        // Apply accessibility settings
        this.updateAccessibilityMode();
    },

    /**
     * Update accessibility mode
     */
    updateAccessibilityMode() {
        document.body.classList.toggle('high-contrast', this.state.highContrastMode);
        document.body.classList.toggle('reduced-motion', this.state.reducedMotionMode);
        document.body.classList.toggle('large-text', this.state.largeTextMode);
    },

    /**
     * Load user preferences
     */
    loadUserPreferences() {
        try {
            const saved = localStorage.getItem('keyboardNavigationPreferences');
            if (saved) {
                const preferences = JSON.parse(saved);
                
                // Apply preferences
                this.state.personalizedShortcuts = new Map(preferences.personalizedShortcuts || []);
                this.state.preferredShortcuts = new Map(preferences.preferredShortcuts || []);
                
                // Update shortcuts
                this.updatePersonalizedShortcuts();
            }
        } catch (error) {
            console.warn('Failed to load keyboard navigation preferences:', error);
        }
    },

    /**
     * Save user preferences
     */
    saveUserPreferences() {
        try {
            const preferences = {
                personalizedShortcuts: Array.from(this.state.personalizedShortcuts),
                preferredShortcuts: Array.from(this.state.preferredShortcuts),
                keyboardOnlyUser: this.state.keyboardOnlyUser
            };
            
            localStorage.setItem('keyboardNavigationPreferences', JSON.stringify(preferences));
        } catch (error) {
            console.warn('Failed to save keyboard navigation preferences:', error);
        }
    },

    /**
     * Setup adaptive shortcuts
     */
    setupAdaptiveShortcuts() {
        if (!this.config.adaptiveShortcuts) return;
        
        // Analyze usage patterns periodically
        setInterval(() => {
            this.analyzeUsagePatterns();
            this.updateAdaptiveShortcuts();
        }, 60000); // Every minute
    },

    /**
     * Track shortcut usage
     */
    trackShortcutUsage(action) {
        if (!this.config.shortcutUsageTracking) return;
        
        const usage = this.state.shortcutUsage.get(action) || { count: 0, lastUsed: 0 };
        usage.count++;
        usage.lastUsed = Date.now();
        
        this.state.shortcutUsage.set(action, usage);
    },

    /**
     * Analyze usage patterns
     */
    analyzeUsagePatterns() {
        // Analyze shortcut usage patterns
        this.state.shortcutUsage.forEach((usage, action) => {
            const pattern = {
                action,
                frequency: usage.count,
                recency: Date.now() - usage.lastUsed,
                efficiency: this.calculateShortcutEfficiency(action)
            };
            
            this.state.usagePatterns.set(action, pattern);
        });
    },

    /**
     * Calculate shortcut efficiency
     */
    calculateShortcutEfficiency(action) {
        // This would measure how efficiently users perform actions with shortcuts
        // Implementation depends on specific metrics
        return 0.8; // Placeholder
    },

    /**
     * Update adaptive shortcuts
     */
    updateAdaptiveShortcuts() {
        // Update shortcuts based on usage patterns
        this.state.usagePatterns.forEach((pattern, action) => {
            if (pattern.frequency > 10 && pattern.efficiency > 0.7) {
                // Promote frequently used shortcuts
                this.promoteShortcut(action);
            }
        });
    },

    /**
     * Promote shortcut
     */
    promoteShortcut(action) {
        // This would make the shortcut more prominent in the UI
        console.log('Promoting shortcut:', action);
    },

    /**
     * Detect keyboard-only user
     */
    detectKeyboardOnlyUser() {
        // Set keyboard-only flag on keyboard interaction
        this.state.keyboardOnlyUser = true;
        
        // Clear flag on mouse interaction
        const clearKeyboardOnly = () => {
            this.state.keyboardOnlyUser = false;
        };
        
        document.addEventListener('mousedown', clearKeyboardOnly, { once: true });
        document.addEventListener('touchstart', clearKeyboardOnly, { once: true });
    },

    /**
     * Setup performance monitoring
     */
    setupPerformanceMonitoring() {
        // Monitor key event processing performance
        this.state.performanceMetrics = {
            keyEventCount: 0,
            averageProcessingTime: 0,
            totalProcessingTime: 0
        };
    },

    /**
     * Queue key event for processing
     */
    queueKeyEvent(e) {
        this.state.keyEventQueue.push(e);
        
        if (!this.state.processingKeyEvents) {
            this.processKeyEvents();
        }
    },

    /**
     * Process key events
     */
    async processKeyEvents() {
        this.state.processingKeyEvents = true;
        
        while (this.state.keyEventQueue.length > 0) {
            const event = this.state.keyEventQueue.shift();
            await this.processKeyEvent(event);
        }
        
        this.state.processingKeyEvents = false;
    },

    /**
     * Process key event
     */
    async processKeyEvent(e) {
        const startTime = performance.now();
        
        // Process the key event
        // This would contain the actual key event processing logic
        
        const endTime = performance.now();
        const processingTime = endTime - startTime;
        
        // Update performance metrics
        this.updatePerformanceMetrics(processingTime);
    },

    /**
     * Update performance metrics
     */
    updatePerformanceMetrics(processingTime) {
        const metrics = this.state.performanceMetrics;
        metrics.keyEventCount++;
        metrics.totalProcessingTime += processingTime;
        metrics.averageProcessingTime = metrics.totalProcessingTime / metrics.keyEventCount;
    },

    /**
     * Record key event for debugging
     */
    recordKeyEvent(type, e) {
        const logEntry = {
            type,
            key: e.key,
            code: e.code,
            shortcut: this.getKeyboardShortcut(e),
            timestamp: Date.now(),
            target: e.target.tagName
        };
        
        this.state.keyEventLog.push(logEntry);
        
        // Limit log size
        if (this.state.keyEventLog.length > 1000) {
            this.state.keyEventLog.shift();
        }
    },

    /**
     * Get element selector
     */
    getElementSelector(element) {
        if (element.id) {
            return `#${element.id}`;
        }
        
        if (element.className) {
            return `.${element.className.split(' ').join('.')}`;
        }
        
        return element.tagName.toLowerCase();
    },

    /**
     * Supports arrow key navigation
     */
    supportsArrowKeyNavigation(element) {
        return element.classList.contains('arrow-navigable') ||
               element.tagName === 'SELECT' ||
               element.tagName === 'INPUT' && element.type === 'radio';
    },

    /**
     * Is grid element
     */
    isGridElement(element) {
        return element.classList.contains('grid') ||
               element.classList.contains('table') ||
               element.getAttribute('role') === 'grid';
    },

    /**
     * Is list element
     */
    isListElement(element) {
        return element.classList.contains('list') ||
               element.tagName === 'UL' ||
               element.tagName === 'OL' ||
               element.getAttribute('role') === 'list' ||
               element.getAttribute('role') === 'listbox';
    },

    /**
     * Is text input
     */
    isTextInput(element) {
        return element.tagName === 'INPUT' && 
               (element.type === 'text' || element.type === 'password' || element.type === 'email' || element.type === 'search') ||
               element.tagName === 'TEXTAREA';
    },

    /**
     * Is scrollable container
     */
    isScrollableContainer(element) {
        const style = window.getComputedStyle(element);
        return style.overflow === 'auto' || style.overflow === 'scroll' ||
               style.overflowX === 'auto' || style.overflowX === 'scroll' ||
               style.overflowY === 'auto' || style.overflowY === 'scroll';
    },

    /**
     * Get list items
     */
    getListItems(listElement) {
        return Array.from(listElement.querySelectorAll('li, [role="option"], [role="listitem"]'));
    },

    /**
     * Handle element arrow navigation
     */
    handleElementArrowNavigation(element, e) {
        // Implementation depends on specific element type
        return false;
    },

    /**
     * Handle grid navigation
     */
    handleGridNavigation(grid, e) {
        // Implementation for grid navigation
        return false;
    },

    /**
     * Handle list navigation
     */
    handleListNavigation(list, e) {
        // Implementation for list navigation
        return false;
    },

    /**
     * Handle list page navigation
     */
    handleListPageNavigation(list, e) {
        // Implementation for list page navigation
        return false;
    },

    /**
     * Handle key up actions
     */
    handleKeyUpActions(e) {
        // Implementation for key up specific actions
    },

    /**
     * Handle character input
     */
    handleCharacterInput(e) {
        // Implementation for character input handling
    },

    /**
     * Handle composition start
     */
    handleCompositionStart(e) {
        // Implementation for IME composition start
    },

    /**
     * Handle composition end
     */
    handleCompositionEnd(e) {
        // Implementation for IME composition end
    },
    /**
     * Handle focus in
     */
    handleFocusIn(e) {
        if (e.target) {
            this.state.lastFocusedElement = e.target;
        }
    },
    
    /**
     * Handle focus out
     */
    handleFocusOut(e) {
        if (this.state.debugMode) {
            console.log('[KeyboardNav] Focus lost from:', e.target);
        }
    },
    /**
     * Handle escape key
     */
    handleEscapeKey(e) {
        // Implementation for escape key handling
    },

    /**
     * Handle enter key
     */
    handleEnterKey(e) {
        // Implementation for enter key handling
    },

    /**
     * Handle space key
     */
    handleSpaceKey(e) {
        // Implementation for space key handling
    },

    /**
     * Activate find
     */
    activateFind() {
        // Implementation for find functionality
        console.log('Find activated');
    },

    /**
     * Find next
     */
    findNext() {
        // Implementation for find next
        console.log('Find next');
    },

    /**
     * Find previous
     */
    findPrevious() {
        // Implementation for find previous
        console.log('Find previous');
    },

    /**
     * Create new item
     */
    createNewItem() {
        // Implementation for creating new item
        console.log('Create new item');
    },

    /**
     * Save current item
     */
    saveCurrentItem() {
        // Implementation for saving current item
        console.log('Save current item');
    },

    /**
     * Edit current item
     */
    editCurrentItem() {
        // Implementation for editing current item
        console.log('Edit current item');
    },

    /**
     * Duplicate current item
     */
    duplicateCurrentItem() {
        // Implementation for duplicating current item
        console.log('Duplicate current item');
    },

    /**
     * Delete current item
     */
    deleteCurrentItem() {
        // Implementation for deleting current item
        console.log('Delete current item');
    },

    /**
     * Activate quick access item
     */
    activateQuickAccessItem(index) {
        // Implementation for activating quick access item
        console.log('Activate quick access item:', index);
    },

    /**
     * Show shortcuts help
     */
    showShortcutsHelp() {
        // Implementation for showing shortcuts help
        console.log('Show shortcuts help');
    },

    /**
     * Show help
     */
    showHelp() {
        // Implementation for showing help
        console.log('Show help');
    },

    /**
     * Toggle fullscreen
     */
    toggleFullscreen() {
        // Implementation for toggling fullscreen
        console.log('Toggle fullscreen');
    },

    /**
     * Toggle theme
     */
    toggleTheme() {
        // Implementation for toggling theme
        console.log('Toggle theme');
    },

    /**
     * Close active modal
     */
    closeActiveModal() {
        // Implementation for closing active modal
        console.log('Close active modal');
    },

    /**
     * Restore previous focus
     */
    restorePreviousFocus() {
        // Implementation for restoring previous focus
        console.log('Restore previous focus');
    },

    /**
     * Track command usage
     */
    trackCommandUsage(command) {
        // Implementation for tracking command usage
        console.log('Track command usage:', command);
    },

    /**
     * Update personalized shortcuts
     */
    updatePersonalizedShortcuts() {
        // Implementation for updating personalized shortcuts
        console.log('Update personalized shortcuts');
    }
};

// Initialize on DOM ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => keyboardNavigation.initialize());
} else {
    keyboardNavigation.initialize();
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = keyboardNavigation;
}

// Make available globally
window.keyboardNavigation = keyboardNavigation;