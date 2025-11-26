/**
 * Mobile Navigation Utility
 * Handles hamburger menu, touch gestures, and mobile-specific interactions
 */

const mobileNav = {
    /**
     * Configuration
     */
    config: {
        breakpoint: 768,
        swipeThreshold: 50,
        swipeVelocity: 0.3,
        // Allow menu on desktop
        enableOnDesktop: true
    },

    /**
     * State
     */
    state: {
        isOpen: false,
        isMobile: false,
        touchStartX: 0,
        touchStartY: 0,
        touchCurrentX: 0,
        touchCurrentY: 0,
        isSearchOpen: false
    },

    /**
     * Initialize mobile navigation
     */
    initialize() {
        this.createMobileNavigation();
        this.setupEventListeners();
        this.checkViewport();

        // Check viewport on resize
        window.addEventListener('resize', () => this.checkViewport());
    },

/**
     * Check if we're on mobile viewport
     */
    checkViewport() {
        const wasMobile = this.state.isMobile;
        this.state.isMobile = window.innerWidth <= this.config.breakpoint;

        // Don't automatically close menu when switching to desktop
        // Users want to access the menu options on desktop too
        console.log(`[MobileNav] Viewport checked. isMobile: ${this.state.isMobile}, wasMobile: ${wasMobile}`);
    },

    /**
     * Create mobile navigation elements
     */
    createMobileNavigation() {
        console.log('[MobileNav] Creating mobile navigation...');

        // Create hamburger button
        const hamburgerButton = document.createElement('button');
        hamburgerButton.className = 'mobile-menu-toggle';
        hamburgerButton.id = 'mobileMenuToggle';
        hamburgerButton.setAttribute('aria-label', 'Toggle navigation menu');
        hamburgerButton.setAttribute('aria-expanded', 'false');
        hamburgerButton.innerHTML = `
            <div class="hamburger-icon">
                <span class="hamburger-line"></span>
                <span class="hamburger-line"></span>
                <span class="hamburger-line"></span>
            </div>
        `;

        // Insert into header
        const header = document.querySelector('.header');
        if (header) {
            console.log('[MobileNav] Header found, inserting hamburger button');
            header.insertBefore(hamburgerButton, header.firstChild);
            console.log('[MobileNav] Hamburger button inserted successfully');
        } else {
            console.error('[MobileNav] Header element not found! Cannot insert hamburger button.');
            // Fallback: try inserting at the beginning of body
            console.log('[MobileNav] Attempting fallback: inserting at body start');
            document.body.insertBefore(hamburgerButton, document.body.firstChild);
        }

        // Create navigation panel
        const navPanel = document.createElement('div');
        navPanel.className = 'mobile-nav-panel';
        navPanel.id = 'mobileNavPanel';
        navPanel.setAttribute('role', 'navigation');
        navPanel.setAttribute('aria-label', 'Mobile navigation');
        navPanel.innerHTML = this.buildNavPanelContent();

        // Create overlay
        const overlay = document.createElement('div');
        overlay.className = 'mobile-nav-overlay';
        overlay.id = 'mobileNavOverlay';

        // Append to body
        document.body.appendChild(navPanel);
        document.body.appendChild(overlay);

        // Create mobile search
        this.createMobileSearch();
    },

    /**
     * Build navigation panel content
     */
    buildNavPanelContent() {
        return `
            <div class="mobile-nav-header">
                <div class="mobile-nav-title">🚀 Menu</div>
                <button class="mobile-nav-close" id="mobileNavClose" aria-label="Close menu">
                    ✕
                </button>
            </div>

            <div class="mobile-nav-body">
                <!-- Workspace Selector -->
                <div class="mobile-workspace-selector" id="mobileWorkspaceSelector">
                    <div class="mobile-workspace-current" onclick="mobileNav.showWorkspaceMenu()">
                        <div class="mobile-workspace-icon">🌟</div>
                        <div class="mobile-workspace-info">
                            <div class="mobile-workspace-name">Current Workspace</div>
                            <div class="mobile-workspace-count">0 features</div>
                        </div>
                        <div class="mobile-workspace-arrow">›</div>
                    </div>
                </div>

                <!-- Navigation Sections -->
                <div class="mobile-nav-section">
                    <div class="mobile-nav-section-title">Views</div>
                    <button class="mobile-nav-item active" onclick="mobileNav.navigateTo('table-view')">
                        <span class="mobile-nav-icon">📋</span>
                        <span class="mobile-nav-label">Table View</span>
                    </button>
                    <button class="mobile-nav-item" onclick="mobileNav.navigateTo('graph-view')">
                        <span class="mobile-nav-icon">🕸️</span>
                        <span class="mobile-nav-label">Graph View</span>
                    </button>
                    <button class="mobile-nav-item" onclick="mobileNav.navigateTo('insights')">
                        <span class="mobile-nav-icon">💡</span>
                        <span class="mobile-nav-label">Insights</span>
                    </button>
                </div>

                <div class="mobile-nav-section">
                    <div class="mobile-nav-section-title">Actions</div>
                    <button class="mobile-nav-item" onclick="mobileNav.createFeature()">
                        <span class="mobile-nav-icon">➕</span>
                        <span class="mobile-nav-label">New Feature</span>
                    </button>
                    <button class="mobile-nav-item" onclick="mobileNav.showFilters()">
                        <span class="mobile-nav-icon">🔍</span>
                        <span class="mobile-nav-label">Filters</span>
                    </button>
                    <button class="mobile-nav-item" onclick="mobileNav.showSort()">
                        <span class="mobile-nav-icon">⬆️</span>
                        <span class="mobile-nav-label">Sort</span>
                    </button>
                </div>

                <div class="mobile-nav-section">
                    <div class="mobile-nav-section-title">Tools</div>
                    <button class="mobile-nav-item" onclick="mobileNav.exportData()">
                        <span class="mobile-nav-icon">💾</span>
                        <span class="mobile-nav-label">Export Data</span>
                    </button>
                    <button class="mobile-nav-item" onclick="mobileNav.importData()">
                        <span class="mobile-nav-icon">📥</span>
                        <span class="mobile-nav-label">Import Data</span>
                    </button>
                    <button class="mobile-nav-item" onclick="mobileNav.showSettings()">
                        <span class="mobile-nav-icon">⚙️</span>
                        <span class="mobile-nav-label">Settings</span>
                    </button>
                </div>

                <div class="mobile-nav-section">
                    <div class="mobile-nav-section-title">AI Assistant</div>
                    <button class="mobile-nav-item" onclick="mobileNav.openChat()">
                        <span class="mobile-nav-icon">🤖</span>
                        <span class="mobile-nav-label">Chat with AI</span>
                    </button>
                    <button class="mobile-nav-item" onclick="mobileNav.showAIOpportunities()">
                        <span class="mobile-nav-icon">✨</span>
                        <span class="mobile-nav-label">AI Suggestions</span>
                        <span class="mobile-nav-badge">3</span>
                    </button>
                </div>
            </div>
        `;
    },

    /**
     * Create mobile search panel
     */
    createMobileSearch() {
        // Add search toggle button to header
        const searchToggle = document.createElement('button');
        searchToggle.className = 'mobile-search-toggle';
        searchToggle.id = 'mobileSearchToggle';
        searchToggle.setAttribute('aria-label', 'Toggle search');
        searchToggle.innerHTML = '🔍';

        const headerRight = document.querySelector('.header-right');
        if (headerRight) {
            headerRight.insertBefore(searchToggle, headerRight.firstChild);
        }

        // Create search panel
        const searchPanel = document.createElement('div');
        searchPanel.className = 'mobile-search-panel';
        searchPanel.id = 'mobileSearchPanel';
        searchPanel.innerHTML = `
            <input
                type="text"
                class="mobile-search-input"
                id="mobileSearchInput"
                placeholder="Search features..."
                autocomplete="off"
            >
        `;

        document.body.appendChild(searchPanel);
    },

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        console.log('[MobileNav] Setting up event listeners...');

        // Hamburger toggle
        const toggleButton = document.getElementById('mobileMenuToggle');
        if (toggleButton) {
            console.log('[MobileNav] Hamburger button found, adding click listener');
            toggleButton.addEventListener('click', () => this.toggleMenu());
        } else {
            console.error('[MobileNav] Hamburger button not found! Click event not attached.');
        }

        // Close button
        const closeButton = document.getElementById('mobileNavClose');
        if (closeButton) {
            closeButton.addEventListener('click', () => this.closeMenu());
        }

        // Overlay click
        const overlay = document.getElementById('mobileNavOverlay');
        if (overlay) {
            overlay.addEventListener('click', () => this.closeMenu());
        }

        // Search toggle
        const searchToggle = document.getElementById('mobileSearchToggle');
        if (searchToggle) {
            searchToggle.addEventListener('click', () => this.toggleSearch());
        }

        // Search input
        const searchInput = document.getElementById('mobileSearchInput');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                if (window.app && window.app.applyFilters) {
                    // Update main search input
                    const mainSearch = document.getElementById('searchInput');
                    if (mainSearch) {
                        mainSearch.value = e.target.value;
                    }
                    window.app.applyFilters();
                }
            });
        }

        // Touch gestures
        this.setupTouchGestures();

        // Mouse click outside to close (for desktop)
        document.addEventListener('click', (e) => {
            if (this.state.isOpen && !this.state.isMobile) {
                const panel = document.getElementById('mobileNavPanel');
                const toggle = document.getElementById('mobileMenuToggle');
                
                if (panel && !panel.contains(e.target) && toggle && !toggle.contains(e.target)) {
                    this.closeMenu();
                }
            }
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            // Escape to close
            if (e.key === 'Escape' && this.state.isOpen) {
                this.closeMenu();
            }
        });
    },

    /**
     * Setup touch gestures for swipe
     */
    setupTouchGestures() {
        const panel = document.getElementById('mobileNavPanel');
        if (!panel) return;

        // Only setup touch gestures on mobile/touch devices
        if (!('ontouchstart' in window)) {
            console.log('[MobileNav] Touch gestures disabled - desktop detected');
            return;
        }

        // Swipe to close
        panel.addEventListener('touchstart', (e) => {
            this.state.touchStartX = e.touches[0].clientX;
            this.state.touchStartY = e.touches[0].clientY;
        }, { passive: true });

        panel.addEventListener('touchmove', (e) => {
            if (!this.state.isOpen) return;

            this.state.touchCurrentX = e.touches[0].clientX;
            this.state.touchCurrentY = e.touches[0].clientY;

            const deltaX = this.state.touchCurrentX - this.state.touchStartX;
            const deltaY = Math.abs(this.state.touchCurrentY - this.state.touchStartY);

            // Only swipe if mostly horizontal
            if (deltaY < 50 && deltaX < 0) {
                panel.style.transform = `translateX(${deltaX}px)`;
            }
        }, { passive: true });

        panel.addEventListener('touchend', () => {
            if (!this.state.isOpen) return;

            const deltaX = this.state.touchCurrentX - this.state.touchStartX;
            const velocity = Math.abs(deltaX) / 100;

            // Close if swiped far enough or fast enough
            if (deltaX < -this.config.swipeThreshold || velocity > this.config.swipeVelocity) {
                this.closeMenu();
            } else {
                // Reset position
                panel.style.transform = '';
            }
        }, { passive: true });

        // Swipe from edge to open
        document.addEventListener('touchstart', (e) => {
            if (this.state.isOpen) return;
            if (e.touches[0].clientX < 20) {
                this.state.touchStartX = e.touches[0].clientX;
            }
        }, { passive: true });

        document.addEventListener('touchend', (e) => {
            if (this.state.isOpen) return;
            if (e.changedTouches[0].clientX - this.state.touchStartX > this.config.swipeThreshold) {
                this.openMenu();
            }
        }, { passive: true });
    },

    /**
     * Toggle menu open/closed
     */
    toggleMenu() {
        console.log('[MobileNav] Toggle menu called, current state:', this.state.isOpen);
        if (this.state.isOpen) {
            this.closeMenu();
        } else {
            this.openMenu();
        }
    },

/**
     * Open menu
     */
    openMenu() {
        this.state.isOpen = true;

        const panel = document.getElementById('mobileNavPanel');
        const overlay = document.getElementById('mobileNavOverlay');
        const toggle = document.getElementById('mobileMenuToggle');

        if (panel) panel.classList.add('open');
        if (overlay) {
            // On desktop, make the overlay more subtle
            if (this.state.isMobile) {
                overlay.classList.add('visible');
            } else {
                overlay.classList.add('visible');
                overlay.style.background = 'rgba(0, 0, 0, 0.2)'; // Lighter overlay for desktop
            }
        }
        if (toggle) {
            toggle.classList.add('active');
            toggle.setAttribute('aria-expanded', 'true');
        }

        // Prevent body scroll on mobile, but allow it on desktop
        if (this.state.isMobile) {
            document.body.style.overflow = 'hidden';
        }

        // Update workspace display
        this.updateMobileWorkspaceDisplay();
    },

/**
     * Close menu
     */
    closeMenu() {
        this.state.isOpen = false;

        const panel = document.getElementById('mobileNavPanel');
        const overlay = document.getElementById('mobileNavOverlay');
        const toggle = document.getElementById('mobileMenuToggle');

        if (panel) {
            panel.classList.remove('open');
            panel.style.transform = ''; // Reset any transform from gestures
        }
        if (overlay) {
            overlay.classList.remove('visible');
            overlay.style.background = ''; // Reset overlay style
        }
        if (toggle) {
            toggle.classList.remove('active');
            toggle.setAttribute('aria-expanded', 'false');
        }

        // Restore body scroll
        document.body.style.overflow = '';
    },

    /**
     * Toggle mobile search
     */
    toggleSearch() {
        this.state.isSearchOpen = !this.state.isSearchOpen;

        const searchPanel = document.getElementById('mobileSearchPanel');
        const searchInput = document.getElementById('mobileSearchInput');

        if (searchPanel) {
            searchPanel.classList.toggle('open', this.state.isSearchOpen);
        }

        if (this.state.isSearchOpen && searchInput) {
            setTimeout(() => searchInput.focus(), 100);
        }
    },

    /**
     * Update mobile workspace display
     */
    updateMobileWorkspaceDisplay() {
        if (!window.app) return;

        const currentWorkspace = window.app.workspaces.find(w => w.id === window.app.currentWorkspaceId);
        if (!currentWorkspace) return;

        const featureCount = window.app.features.filter(f => f.workspaceId === window.app.currentWorkspaceId).length;

        const container = document.querySelector('.mobile-workspace-current');
        if (container) {
            container.innerHTML = `
                <div class="mobile-workspace-icon" style="background: ${currentWorkspace.color || '#667eea'}20;">
                    ${currentWorkspace.icon || '🌟'}
                </div>
                <div class="mobile-workspace-info">
                    <div class="mobile-workspace-name">${currentWorkspace.name}</div>
                    <div class="mobile-workspace-count">${featureCount} feature${featureCount !== 1 ? 's' : ''}</div>
                </div>
                <div class="mobile-workspace-arrow">›</div>
            `;
        }
    },

    /**
     * Navigation actions
     */
    navigateTo(view) {
        console.log(`[MobileNav] Navigate to: ${view}`);
        this.closeMenu();

        switch(view) {
            case 'table-view':
                console.log('[MobileNav] Switching to table view');
                if (window.app && window.app.showTableView) {
                    window.app.showTableView();
                } else {
                    console.warn('[MobileNav] app.showTableView not available');
                    alert('Table view is the default view');
                }
                break;

            case 'graph-view':
                console.log('[MobileNav] Opening graph view modal');
                // Graph view would typically be a modal or separate view
                alert('Graph view coming soon! This will show your features as an interactive network diagram.');
                break;

            case 'insights':
                console.log('[MobileNav] Opening insights panel');
                // Insights panel would typically be a modal or separate view
                alert('Insights panel coming soon! This will analyze your roadmap and provide recommendations.');
                break;

            default:
                console.warn(`[MobileNav] Unknown view: ${view}`);
        }
    },

    createFeature() {
        console.log('[MobileNav] Creating new feature');
        this.closeMenu();

        if (window.detailView && window.detailView.createNewFeature) {
            window.detailView.createNewFeature();
        } else if (window.app && window.app.showDetailView) {
            // Alternative: show detail view for new feature
            window.app.showDetailView(null);
        } else {
            console.error('[MobileNav] detailView.createNewFeature not available');
            alert('Unable to create feature. Please try from the main interface.');
        }
    },

    showFilters() {
        console.log('[MobileNav] Showing filters');
        this.closeMenu();

        // Try to click the filter button in the main interface
        const filterButton = document.querySelector('[aria-label="Filter features"]') ||
                           document.querySelector('.filter-btn') ||
                           document.querySelector('#filterButton');

        if (filterButton) {
            console.log('[MobileNav] Clicking filter button');
            filterButton.click();
        } else {
            console.warn('[MobileNav] Filter button not found');
            alert('Filter panel not available in mobile view yet.');
        }
    },

    showSort() {
        console.log('[MobileNav] Showing sort options');
        this.closeMenu();

        // Try to click the sort button in the main interface
        const sortButton = document.querySelector('[aria-label="Sort features"]') ||
                         document.querySelector('.sort-btn') ||
                         document.querySelector('#sortButton');

        if (sortButton) {
            console.log('[MobileNav] Clicking sort button');
            sortButton.click();
        } else {
            console.warn('[MobileNav] Sort button not found');
            alert('Sort options not available in mobile view yet.');
        }
    },

    exportData() {
        console.log('[MobileNav] Exporting data');
        this.closeMenu();

        if (window.app && window.app.exportAllData) {
            window.app.exportAllData();
        } else {
            console.error('[MobileNav] app.exportAllData not available');
            alert('Export function not available');
        }
    },

    importData() {
        console.log('[MobileNav] Importing data');
        this.closeMenu();

        if (window.app && window.app.importAllData) {
            window.app.importAllData();
        } else {
            console.error('[MobileNav] app.importAllData not available');
            alert('Import function not available');
        }
    },

    showSettings() {
        console.log('[MobileNav] Opening settings');
        this.closeMenu();

        // Try clicking the settings/API settings button
        const settingsBtn = document.querySelector('[aria-label="API Settings"]') ||
                          document.querySelector('.settings-btn') ||
                          document.getElementById('settingsBtn');

        if (settingsBtn) {
            console.log('[MobileNav] Clicking settings button');
            settingsBtn.click();
        } else {
            console.error('[MobileNav] Settings button not found');
            alert('Settings not available');
        }
    },

    showWorkspaceMenu() {
        console.log('[MobileNav] Opening workspace menu');
        this.closeMenu();

        // Try clicking the workspace manager button
        const workspaceBtn = document.querySelector('[aria-label="Manage Workspaces"]') ||
                           document.querySelector('[aria-label="Manage workspaces"]') ||
                           document.getElementById('manageWorkspacesBtn');

        if (workspaceBtn) {
            console.log('[MobileNav] Clicking workspace menu button');
            workspaceBtn.click();
        } else {
            console.error('[MobileNav] Workspace menu button not found');
            alert('Workspace menu not available');
        }
    },

    openChat() {
        console.log('[MobileNav] Opening AI chat');
        this.closeMenu();

        // Try to find and click the AI chat button in the main interface
        const chatButton = document.querySelector('[aria-label="Open AI chat"]') ||
                         document.querySelector('.ai-chat-btn') ||
                         document.querySelector('#aiChatButton');

        if (chatButton) {
            console.log('[MobileNav] Clicking AI chat button');
            chatButton.click();
        } else {
            console.warn('[MobileNav] AI chat button not found');
            alert('AI chat coming soon!');
        }
    },

    showAIOpportunities() {
        console.log('[MobileNav] Showing AI opportunities');
        this.closeMenu();

        // Try to find and click the AI suggestions button in the main interface
        const aiButton = document.querySelector('[aria-label="AI suggestions"]') ||
                       document.querySelector('.ai-suggestions-btn') ||
                       document.querySelector('#aiSuggestionsButton');

        if (aiButton) {
            console.log('[MobileNav] Clicking AI suggestions button');
            aiButton.click();
        } else {
            console.warn('[MobileNav] AI suggestions button not found');
            alert('AI suggestions coming soon!');
        }
    }
};

// Initialize on DOM ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => mobileNav.initialize());
} else {
    mobileNav.initialize();
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = mobileNav;
}
