/**
 * Progressive Disclosure Manager
 * 
 * Comprehensive progressive disclosure system with:
 * - Accordion-style expandable sections with smooth animations
 * - Tab-based content organization with transition effects
 * - Step-by-step wizard flows with progress indicators
 * - Contextual help tooltips with smart positioning
 * - "Show more" patterns with content loading
 * - Advanced search with progressive filter revelation
 * - Multi-level navigation with expandable menus
 * - Form field grouping with conditional visibility
 * - Data table column management with show/hide options
 * - Dashboard widget arrangement with drag-and-drop
 * 
 * @version 1.0.0
 * @author Frontend Specialist
 */

const disclosureManager = {
    /**
     * Configuration
     */
    config: {
        // Animation settings
        animationDuration: 300,
        staggerDelay: 100,
        easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
        
        // Accordion settings
        accordionAllowMultiple: false,
        accordionAutoCollapse: true,
        
        // Tab settings
        tabAutoSwitch: false,
        tabSwitchInterval: 5000,
        
        // Wizard settings
        wizardValidateSteps: true,
        wizardAllowSkip: false,
        
        // Tooltip settings
        tooltipDelay: 500,
        tooltipDuration: 3000,
        tooltipMaxWidth: 300,
        
        // Search settings
        searchDebounceDelay: 300,
        searchMinQueryLength: 2,
        
        // Performance settings
        maxConcurrentAnimations: 5,
        lazyLoadThreshold: 100,
        
        // Accessibility settings
        respectReducedMotion: true,
        announceChanges: true,
        
        // Storage settings
        saveUserPreferences: true,
        storageKey: 'progressive-disclosure-preferences'
    },

    /**
     * State management
     */
    state: {
        // Accordion state
        accordions: new Map(),
        activeAccordionItems: new Set(),
        
        // Tab state
        tabs: new Map(),
        activeTabs: new Map(),
        tabAutoSwitchTimers: new Map(),
        
        // Wizard state
        wizards: new Map(),
        activeWizardSteps: new Map(),
        wizardHistory: new Map(),
        
        // Tooltip state
        tooltips: new Map(),
        activeTooltips: new Map(),
        tooltipTimers: new Map(),
        
        // Search state
        searchContainers: new Map(),
        searchFilters: new Map(),
        searchDebounceTimers: new Map(),
        
        // Navigation state
        navigationMenus: new Map(),
        expandedMenuItems: new Set(),
        
        // Form state
        formContainers: new Map(),
        conditionalFields: new Map(),
        formValidation: new Map(),
        
        // Table state
        tables: new Map(),
        tableColumns: new Map(),
        columnVisibility: new Map(),
        
        // Dashboard state
        dashboards: new Map(),
        widgetPositions: new Map(),
        draggedWidget: null,
        
        // Animation state
        activeAnimations: new Map(),
        animationQueue: [],
        
        // User preferences
        userPreferences: new Map(),
        
        // Performance state
        metrics: {
            totalDisclosures: 0,
            totalAnimations: 0,
            averageResponseTime: 0
        }
    },

    /**
     * Initialize disclosure manager
     */
    initialize() {
        console.log('📂 Initializing Progressive Disclosure Manager...');
        
        // Load user preferences
        this.loadUserPreferences();
        
        // Setup accordions
        this.setupAccordions();
        
        // Setup tabs
        this.setupTabs();
        
        // Setup wizards
        this.setupWizards();
        
        // Setup tooltips
        this.setupTooltips();
        
        // Setup show more patterns
        this.setupShowMore();
        
        // Setup advanced search
        this.setupAdvancedSearch();
        
        // Setup multi-level navigation
        this.setupMultiLevelNavigation();
        
        // Setup form field grouping
        this.setupFormFieldGrouping();
        
        // Setup data table management
        this.setupDataTableManagement();
        
        // Setup dashboard widgets
        this.setupDashboardWidgets();
        
        // Setup accessibility features
        this.setupAccessibilityFeatures();
        
        // Setup performance monitoring
        this.setupPerformanceMonitoring();
        
        console.log('✅ Progressive Disclosure Manager initialized');
    },

    /**
     * Load user preferences
     */
    loadUserPreferences() {
        if (!this.config.saveUserPreferences) return;
        
        try {
            const stored = localStorage.getItem(this.config.storageKey);
            if (stored) {
                const preferences = JSON.parse(stored);
                this.state.userPreferences = new Map(Object.entries(preferences));
            }
        } catch (error) {
            console.warn('Failed to load user preferences:', error);
        }
    },

    /**
     * Save user preferences
     */
    saveUserPreferences() {
        if (!this.config.saveUserPreferences) return;
        
        try {
            const preferences = Object.fromEntries(this.state.userPreferences);
            localStorage.setItem(this.config.storageKey, JSON.stringify(preferences));
        } catch (error) {
            console.warn('Failed to save user preferences:', error);
        }
    },

    /**
     * Setup accordions
     */
    setupAccordions() {
        const accordionContainers = document.querySelectorAll('.accordion-container');
        
        accordionContainers.forEach(container => {
            const accordionId = this.generateId();
            const accordionItems = container.querySelectorAll('.accordion-item');
            
            // Initialize accordion state
            this.state.accordions.set(accordionId, {
                container,
                items: new Map(),
                allowMultiple: container.hasAttribute('data-allow-multiple'),
                autoCollapse: container.hasAttribute('data-auto-collapse')
            });
            
            // Setup accordion items
            accordionItems.forEach((item, index) => {
                const header = item.querySelector('.accordion-header');
                const content = item.querySelector('.accordion-content');
                const itemId = `${accordionId}-item-${index}`;
                
                if (header && content) {
                    // Store item data
                    this.state.accordions.get(accordionId).items.set(itemId, {
                        item,
                        header,
                        content,
                        isExpanded: item.classList.contains('expanded')
                    });
                    
                    // Add click handler
                    header.addEventListener('click', (e) => {
                        e.preventDefault();
                        this.toggleAccordionItem(accordionId, itemId);
                    });
                    
                    // Add keyboard support
                    header.setAttribute('tabindex', '0');
                    header.addEventListener('keydown', (e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            this.toggleAccordionItem(accordionId, itemId);
                        }
                    });
                    
                    // Initialize expanded state
                    if (item.classList.contains('expanded')) {
                        this.state.activeAccordionItems.add(itemId);
                        this.openAccordionContent(content);
                    }
                }
            });
        });
    },

    /**
     * Toggle accordion item
     */
    toggleAccordionItem(accordionId, itemId) {
        const accordion = this.state.accordions.get(accordionId);
        if (!accordion) return;
        
        const item = accordion.items.get(itemId);
        if (!item) return;
        
        const isCurrentlyExpanded = item.isExpanded;
        
        // Handle auto-collapse
        if (accordion.autoCollapse && !accordion.allowMultiple && isCurrentlyExpanded) {
            // Don't allow collapsing the last item if auto-collapse is enabled
            return;
        }
        
        // Handle multiple expansion
        if (!accordion.allowMultiple && !isCurrentlyExpanded) {
            // Collapse all other items
            accordion.items.forEach((otherItem, otherItemId) => {
                if (otherItemId !== itemId && otherItem.isExpanded) {
                    this.collapseAccordionItem(accordionId, otherItemId);
                }
            });
        }
        
        // Toggle current item
        if (isCurrentlyExpanded) {
            this.collapseAccordionItem(accordionId, itemId);
        } else {
            this.expandAccordionItem(accordionId, itemId);
        }
        
        // Update metrics
        this.updateMetrics('accordion-toggle');
    },

    /**
     * Expand accordion item
     */
    expandAccordionItem(accordionId, itemId) {
        const accordion = this.state.accordions.get(accordionId);
        if (!accordion) return;
        
        const item = accordion.items.get(itemId);
        if (!item || item.isExpanded) return;
        
        // Update state
        item.isExpanded = true;
        item.item.classList.add('expanded');
        this.state.activeAccordionItems.add(itemId);
        
        // Animate content
        this.openAccordionContent(item.content);
        
        // Announce change
        this.announceChange(`Accordion section expanded: ${item.header.textContent.trim()}`);
        
        // Save preference
        this.saveAccordionPreference(accordionId, itemId, true);
        
        // Dispatch event
        item.item.dispatchEvent(new CustomEvent('accordionExpanded', {
            detail: { accordionId, itemId }
        }));
    },

    /**
     * Collapse accordion item
     */
    collapseAccordionItem(accordionId, itemId) {
        const accordion = this.state.accordions.get(accordionId);
        if (!accordion) return;
        
        const item = accordion.items.get(itemId);
        if (!item || !item.isExpanded) return;
        
        // Update state
        item.isExpanded = false;
        item.item.classList.remove('expanded');
        this.state.activeAccordionItems.delete(itemId);
        
        // Animate content
        this.closeAccordionContent(item.content);
        
        // Announce change
        this.announceChange(`Accordion section collapsed: ${item.header.textContent.trim()}`);
        
        // Save preference
        this.saveAccordionPreference(accordionId, itemId, false);
        
        // Dispatch event
        item.item.dispatchEvent(new CustomEvent('accordionCollapsed', {
            detail: { accordionId, itemId }
        }));
    },

    /**
     * Open accordion content with animation
     */
    openAccordionContent(content) {
        // Get natural height
        content.style.maxHeight = 'none';
        const height = content.scrollHeight;
        content.style.maxHeight = '0px';
        
        // Trigger animation
        requestAnimationFrame(() => {
            content.style.maxHeight = height + 'px';
            content.style.transition = `max-height ${this.config.animationDuration}ms ${this.config.easing}`;
        });
        
        // Clean up after animation
        setTimeout(() => {
            content.style.maxHeight = 'none';
            content.style.transition = '';
        }, this.config.animationDuration);
    },

    /**
     * Close accordion content with animation
     */
    closeAccordionContent(content) {
        // Set current height
        content.style.maxHeight = content.scrollHeight + 'px';
        content.style.transition = `max-height ${this.config.animationDuration}ms ${this.config.easing}`;
        
        // Trigger animation
        requestAnimationFrame(() => {
            content.style.maxHeight = '0px';
        });
        
        // Clean up after animation
        setTimeout(() => {
            content.style.maxHeight = '';
            content.style.transition = '';
        }, this.config.animationDuration);
    },

    /**
     * Save accordion preference
     */
    saveAccordionPreference(accordionId, itemId, isExpanded) {
        const key = `accordion-${accordionId}-${itemId}`;
        this.state.userPreferences.set(key, isExpanded);
        this.saveUserPreferences();
    },

    /**
     * Setup tabs
     */
    setupTabs() {
        const tabContainers = document.querySelectorAll('.tab-container');
        
        tabContainers.forEach(container => {
            const tabId = this.generateId();
            const tabList = container.querySelector('.tab-list');
            const tabButtons = container.querySelectorAll('.tab-button');
            const tabPanels = container.querySelectorAll('.tab-panel');
            
            if (!tabList || !tabButtons.length || !tabPanels.length) return;
            
            // Initialize tab state
            this.state.tabs.set(tabId, {
                container,
                tabList,
                buttons: new Map(),
                panels: new Map(),
                autoSwitch: container.hasAttribute('data-auto-switch'),
                switchInterval: parseInt(container.getAttribute('data-switch-interval')) || this.config.tabSwitchInterval
            });
            
            // Setup tab buttons
            tabButtons.forEach((button, index) => {
                const panelId = button.getAttribute('aria-controls');
                const panel = container.querySelector(`#${panelId}`);
                
                if (panel) {
                    const buttonId = `${tabId}-button-${index}`;
                    
                    // Store button and panel data
                    this.state.tabs.get(tabId).buttons.set(buttonId, {
                        button,
                        panel,
                        isActive: button.classList.contains('active')
                    });
                    
                    // Add click handler
                    button.addEventListener('click', (e) => {
                        e.preventDefault();
                        this.switchTab(tabId, buttonId);
                    });
                    
                    // Add keyboard support
                    button.addEventListener('keydown', (e) => {
                        this.handleTabKeyboard(e, tabId, buttonId);
                    });
                    
                    // Initialize active state
                    if (button.classList.contains('active')) {
                        this.state.activeTabs.set(tabId, buttonId);
                        panel.classList.add('active');
                    }
                }
            });
            
            // Setup auto-switch if enabled
            if (this.state.tabs.get(tabId).autoSwitch) {
                this.startTabAutoSwitch(tabId);
            }
        });
    },

    /**
     * Switch tab
     */
    switchTab(tabId, buttonId) {
        const tab = this.state.tabs.get(tabId);
        if (!tab) return;
        
        const buttonData = tab.buttons.get(buttonId);
        if (!buttonData) return;
        
        // Don't switch if already active
        if (this.state.activeTabs.get(tabId) === buttonId) return;
        
        // Deactivate previous tab
        const previousButtonId = this.state.activeTabs.get(tabId);
        if (previousButtonId) {
            const previousButtonData = tab.buttons.get(previousButtonId);
            if (previousButtonData) {
                previousButtonData.button.classList.remove('active');
                previousButtonData.panel.classList.remove('active');
                previousButtonData.isActive = false;
            }
        }
        
        // Activate new tab
        buttonData.button.classList.add('active');
        buttonData.panel.classList.add('active');
        buttonData.isActive = true;
        
        // Update state
        this.state.activeTabs.set(tabId, buttonId);
        
        // Announce change
        this.announceChange(`Tab switched to: ${buttonData.button.textContent.trim()}`);
        
        // Save preference
        this.saveTabPreference(tabId, buttonId);
        
        // Dispatch events
        buttonData.button.dispatchEvent(new CustomEvent('tabActivated', {
            detail: { tabId, buttonId }
        }));
        
        buttonData.panel.dispatchEvent(new CustomEvent('panelShown', {
            detail: { tabId, buttonId }
        }));
        
        // Update metrics
        this.updateMetrics('tab-switch');
    },

    /**
     * Handle tab keyboard navigation
     */
    handleTabKeyboard(event, tabId, buttonId) {
        const tab = this.state.tabs.get(tabId);
        if (!tab) return;
        
        const buttonIds = Array.from(tab.buttons.keys());
        const currentIndex = buttonIds.indexOf(buttonId);
        
        let nextIndex;
        
        switch (event.key) {
            case 'ArrowLeft':
            case 'ArrowUp':
                event.preventDefault();
                nextIndex = currentIndex > 0 ? currentIndex - 1 : buttonIds.length - 1;
                this.switchTab(tabId, buttonIds[nextIndex]);
                tab.buttons.get(buttonIds[nextIndex]).button.focus();
                break;
                
            case 'ArrowRight':
            case 'ArrowDown':
                event.preventDefault();
                nextIndex = currentIndex < buttonIds.length - 1 ? currentIndex + 1 : 0;
                this.switchTab(tabId, buttonIds[nextIndex]);
                tab.buttons.get(buttonIds[nextIndex]).button.focus();
                break;
                
            case 'Home':
                event.preventDefault();
                this.switchTab(tabId, buttonIds[0]);
                tab.buttons.get(buttonIds[0]).button.focus();
                break;
                
            case 'End':
                event.preventDefault();
                this.switchTab(tabId, buttonIds[buttonIds.length - 1]);
                tab.buttons.get(buttonIds[buttonIds.length - 1]).button.focus();
                break;
        }
    },

    /**
     * Start tab auto-switch
     */
    startTabAutoSwitch(tabId) {
        const tab = this.state.tabs.get(tabId);
        if (!tab || !tab.autoSwitch) return;
        
        // Clear existing timer
        if (this.state.tabAutoSwitchTimers.has(tabId)) {
            clearInterval(this.state.tabAutoSwitchTimers.get(tabId));
        }
        
        // Start auto-switch timer
        const timer = setInterval(() => {
            const buttonIds = Array.from(tab.buttons.keys());
            const currentButtonId = this.state.activeTabs.get(tabId);
            const currentIndex = buttonIds.indexOf(currentButtonId);
            const nextIndex = (currentIndex + 1) % buttonIds.length;
            
            this.switchTab(tabId, buttonIds[nextIndex]);
        }, tab.switchInterval);
        
        this.state.tabAutoSwitchTimers.set(tabId, timer);
    },

    /**
     * Stop tab auto-switch
     */
    stopTabAutoSwitch(tabId) {
        if (this.state.tabAutoSwitchTimers.has(tabId)) {
            clearInterval(this.state.tabAutoSwitchTimers.get(tabId));
            this.state.tabAutoSwitchTimers.delete(tabId);
        }
    },

    /**
     * Save tab preference
     */
    saveTabPreference(tabId, buttonId) {
        const key = `tab-${tabId}`;
        this.state.userPreferences.set(key, buttonId);
        this.saveUserPreferences();
    },

    /**
     * Setup wizards
     */
    setupWizards() {
        const wizardContainers = document.querySelectorAll('.wizard-container');
        
        wizardContainers.forEach(container => {
            const wizardId = this.generateId();
            const steps = container.querySelectorAll('.wizard-panel');
            const progressLine = container.querySelector('.wizard-progress-fill');
            const nextButton = container.querySelector('.wizard-next');
            const prevButton = container.querySelector('.wizard-previous');
            const finishButton = container.querySelector('.wizard-finish');
            
            if (!steps.length) return;
            
            // Initialize wizard state
            this.state.wizards.set(wizardId, {
                container,
                steps: new Map(),
                currentStep: 0,
                totalSteps: steps.length,
                validateSteps: container.hasAttribute('data-validate-steps'),
                allowSkip: container.hasAttribute('data-allow-skip'),
                progressLine
            });
            
            // Setup wizard steps
            steps.forEach((step, index) => {
                const stepId = `${wizardId}-step-${index}`;
                const stepIndicator = container.querySelector(`.wizard-step:nth-child(${index + 1})`);
                
                // Store step data
                this.state.wizards.get(wizardId).steps.set(stepId, {
                    step,
                    indicator: stepIndicator,
                    index,
                    isValid: true
                });
                
                // Initialize first step
                if (index === 0) {
                    step.classList.add('active');
                    if (stepIndicator) {
                        stepIndicator.classList.add('active');
                    }
                }
            });
            
            // Setup navigation buttons
            if (nextButton) {
                nextButton.addEventListener('click', () => {
                    this.nextWizardStep(wizardId);
                });
            }
            
            if (prevButton) {
                prevButton.addEventListener('click', () => {
                    this.previousWizardStep(wizardId);
                });
            }
            
            if (finishButton) {
                finishButton.addEventListener('click', () => {
                    this.finishWizard(wizardId);
                });
            }
            
            // Update initial progress
            this.updateWizardProgress(wizardId);
        });
    },

    /**
     * Next wizard step
     */
    nextWizardStep(wizardId) {
        const wizard = this.state.wizards.get(wizardId);
        if (!wizard) return;
        
        const currentStepIndex = wizard.currentStep;
        const nextStepIndex = currentStepIndex + 1;
        
        // Check if we're at the last step
        if (nextStepIndex >= wizard.totalSteps) {
            this.finishWizard(wizardId);
            return;
        }
        
        // Validate current step if required
        if (wizard.validateSteps && !this.validateWizardStep(wizardId, currentStepIndex)) {
            return;
        }
        
        // Switch to next step
        this.switchWizardStep(wizardId, nextStepIndex);
    },

    /**
     * Previous wizard step
     */
    previousWizardStep(wizardId) {
        const wizard = this.state.wizards.get(wizardId);
        if (!wizard) return;
        
        const currentStepIndex = wizard.currentStep;
        const prevStepIndex = currentStepIndex - 1;
        
        // Check if we're at the first step
        if (prevStepIndex < 0) {
            return;
        }
        
        // Switch to previous step
        this.switchWizardStep(wizardId, prevStepIndex);
    },

    /**
     * Switch wizard step
     */
    switchWizardStep(wizardId, stepIndex) {
        const wizard = this.state.wizards.get(wizardId);
        if (!wizard || stepIndex < 0 || stepIndex >= wizard.totalSteps) return;
        
        const stepIds = Array.from(wizard.steps.keys());
        const currentStepId = stepIds[wizard.currentStep];
        const nextStepId = stepIds[stepIndex];
        
        // Deactivate current step
        const currentStepData = wizard.steps.get(currentStepId);
        if (currentStepData) {
            currentStepData.step.classList.remove('active');
            if (currentStepData.indicator) {
                currentStepData.indicator.classList.remove('active');
                currentStepData.indicator.classList.add('completed');
            }
        }
        
        // Activate next step
        const nextStepData = wizard.steps.get(nextStepId);
        if (nextStepData) {
            nextStepData.step.classList.add('active');
            if (nextStepData.indicator) {
                nextStepData.indicator.classList.add('active');
            }
        }
        
        // Update current step
        wizard.currentStep = stepIndex;
        
        // Update progress
        this.updateWizardProgress(wizardId);
        
        // Update navigation buttons
        this.updateWizardNavigation(wizardId);
        
        // Announce change
        this.announceChange(`Wizard step ${stepIndex + 1} of ${wizard.totalSteps}`);
        
        // Update metrics
        this.updateMetrics('wizard-step');
    },

    /**
     * Update wizard progress
     */
    updateWizardProgress(wizardId) {
        const wizard = this.state.wizards.get(wizardId);
        if (!wizard) return;
        
        const progress = ((wizard.currentStep + 1) / wizard.totalSteps) * 100;
        
        if (wizard.progressLine) {
            wizard.progressLine.style.width = `${progress}%`;
        }
        
        // Update step indicators
        wizard.steps.forEach((stepData, stepId) => {
            if (stepData.indicator) {
                const stepIndex = stepData.index;
                if (stepIndex < wizard.currentStep) {
                    stepData.indicator.classList.add('completed');
                    stepData.indicator.classList.remove('active');
                } else if (stepIndex === wizard.currentStep) {
                    stepData.indicator.classList.add('active');
                    stepData.indicator.classList.remove('completed');
                } else {
                    stepData.indicator.classList.remove('active', 'completed');
                }
            }
        });
    },

    /**
     * Update wizard navigation buttons
     */
    updateWizardNavigation(wizardId) {
        const wizard = this.state.wizards.get(wizardId);
        if (!wizard) return;
        
        const prevButton = wizard.container.querySelector('.wizard-previous');
        const nextButton = wizard.container.querySelector('.wizard-next');
        const finishButton = wizard.container.querySelector('.wizard-finish');
        
        // Update previous button
        if (prevButton) {
            prevButton.disabled = wizard.currentStep === 0;
        }
        
        // Update next/finish buttons
        const isLastStep = wizard.currentStep === wizard.totalSteps - 1;
        
        if (nextButton) {
            nextButton.style.display = isLastStep ? 'none' : 'block';
        }
        
        if (finishButton) {
            finishButton.style.display = isLastStep ? 'block' : 'none';
        }
    },

    /**
     * Validate wizard step
     */
    validateWizardStep(wizardId, stepIndex) {
        const wizard = this.state.wizards.get(wizardId);
        if (!wizard) return true;
        
        const stepIds = Array.from(wizard.steps.keys());
        const stepId = stepIds[stepIndex];
        const stepData = wizard.steps.get(stepId);
        
        if (!stepData) return true;
        
        // Find form inputs in the step
        const inputs = stepData.step.querySelectorAll('input, select, textarea');
        let isValid = true;
        
        inputs.forEach(input => {
            if (input.hasAttribute('required') && !input.value.trim()) {
                isValid = false;
                input.classList.add('error');
            } else {
                input.classList.remove('error');
            }
        });
        
        stepData.isValid = isValid;
        
        if (!isValid) {
            this.announceChange('Please fill in all required fields');
        }
        
        return isValid;
    },

    /**
     * Finish wizard
     */
    finishWizard(wizardId) {
        const wizard = this.state.wizards.get(wizardId);
        if (!wizard) return;
        
        // Validate final step if required
        if (wizard.validateSteps && !this.validateWizardStep(wizardId, wizard.currentStep)) {
            return;
        }
        
        // Mark all steps as completed
        wizard.steps.forEach(stepData => {
            stepData.indicator.classList.add('completed');
            stepData.indicator.classList.remove('active');
        });
        
        // Announce completion
        this.announceChange('Wizard completed successfully');
        
        // Dispatch event
        wizard.container.dispatchEvent(new CustomEvent('wizardCompleted', {
            detail: { wizardId, totalSteps: wizard.totalSteps }
        }));
        
        // Update metrics
        this.updateMetrics('wizard-complete');
    },

    /**
     * Setup tooltips
     */
    setupTooltips() {
        const tooltipContainers = document.querySelectorAll('.tooltip-container');
        
        tooltipContainers.forEach(container => {
            const trigger = container.querySelector('.tooltip-trigger');
            const content = container.querySelector('.tooltip-content');
            
            if (!trigger || !content) return;
            
            const tooltipId = this.generateId();
            
            // Initialize tooltip state
            this.state.tooltips.set(tooltipId, {
                container,
                trigger,
                content,
                isVisible: false,
                position: this.getTooltipPosition(content)
            });
            
            // Add event listeners
            trigger.addEventListener('mouseenter', () => {
                this.showTooltip(tooltipId);
            });
            
            trigger.addEventListener('mouseleave', () => {
                this.hideTooltip(tooltipId);
            });
            
            trigger.addEventListener('focus', () => {
                this.showTooltip(tooltipId);
            });
            
            trigger.addEventListener('blur', () => {
                this.hideTooltip(tooltipId);
            });
            
            // Add keyboard support
            trigger.setAttribute('aria-describedby', tooltipId);
            content.id = tooltipId;
            content.setAttribute('role', 'tooltip');
        });
    },

    /**
     * Get tooltip position
     */
    getTooltipPosition(content) {
        const position = content.className.match(/tooltip-(top|bottom|left|right)/);
        return position ? position[1] : 'top';
    },

    /**
     * Show tooltip
     */
    showTooltip(tooltipId) {
        const tooltip = this.state.tooltips.get(tooltipId);
        if (!tooltip || tooltip.isVisible) return;
        
        // Clear existing timer
        if (this.state.tooltipTimers.has(tooltipId)) {
            clearTimeout(this.state.tooltipTimers.get(tooltipId));
        }
        
        // Show tooltip after delay
        const timer = setTimeout(() => {
            tooltip.content.classList.add('visible');
            tooltip.isVisible = true;
            this.state.activeTooltips.add(tooltipId);
            
            // Auto-hide after duration
            setTimeout(() => {
                this.hideTooltip(tooltipId);
            }, this.config.tooltipDuration);
        }, this.config.tooltipDelay);
        
        this.state.tooltipTimers.set(tooltipId, timer);
    },

    /**
     * Hide tooltip
     */
    hideTooltip(tooltipId) {
        const tooltip = this.state.tooltips.get(tooltipId);
        if (!tooltip || !tooltip.isVisible) return;
        
        // Clear timer
        if (this.state.tooltipTimers.has(tooltipId)) {
            clearTimeout(this.state.tooltipTimers.get(tooltipId));
            this.state.tooltipTimers.delete(tooltipId);
        }
        
        // Hide tooltip
        tooltip.content.classList.remove('visible');
        tooltip.isVisible = false;
        this.state.activeTooltips.delete(tooltipId);
    },

    /**
     * Setup show more patterns
     */
    setupShowMore() {
        const showMoreContainers = document.querySelectorAll('.show-more-container');
        
        showMoreContainers.forEach(container => {
            const button = container.querySelector('.show-more-button');
            const content = container.querySelector('.show-more-content');
            const fade = container.querySelector('.show-more-fade');
            
            if (!button || !content) return;
            
            const showMoreId = this.generateId();
            
            // Initialize state
            this.state.showMoreContainers = this.state.showMoreContainers || new Map();
            this.state.showMoreContainers.set(showMoreId, {
                container,
                button,
                content,
                fade,
                isExpanded: container.classList.contains('expanded')
            });
            
            // Add click handler
            button.addEventListener('click', () => {
                this.toggleShowMore(showMoreId);
            });
            
            // Add keyboard support
            button.setAttribute('aria-expanded', container.classList.contains('expanded'));
            button.setAttribute('aria-controls', content.id || showMoreId);
            
            if (!content.id) {
                content.id = showMoreId;
            }
        });
    },

    /**
     * Toggle show more
     */
    toggleShowMore(showMoreId) {
        const showMore = this.state.showMoreContainers.get(showMoreId);
        if (!showMore) return;
        
        const isCurrentlyExpanded = showMore.isExpanded;
        
        if (isCurrentlyExpanded) {
            this.collapseShowMore(showMoreId);
        } else {
            this.expandShowMore(showMoreId);
        }
        
        // Update metrics
        this.updateMetrics('show-more-toggle');
    },

    /**
     * Expand show more
     */
    expandShowMore(showMoreId) {
        const showMore = this.state.showMoreContainers.get(showMoreId);
        if (!showMore) return;
        
        // Update state
        showMore.isExpanded = true;
        showMore.container.classList.add('expanded');
        
        // Update button
        showMore.button.setAttribute('aria-expanded', 'true');
        
        // Animate content
        const contentHeight = showMore.content.scrollHeight;
        showMore.content.style.maxHeight = contentHeight + 'px';
        showMore.content.style.transition = `max-height ${this.config.animationDuration}ms ${this.config.easing}`;
        
        // Update metrics
        this.updateMetrics('show-more-expand');
    },

    /**
     * Collapse show more
     */
    collapseShowMore(showMoreId) {
        const showMore = this.state.showMoreContainers.get(showMoreId);
        if (!showMore) return;
        
        // Update state
        showMore.isExpanded = false;
        showMore.container.classList.remove('expanded');
        
        // Update button
        showMore.button.setAttribute('aria-expanded', 'false');
        
        // Animate content
        showMore.content.style.maxHeight = '100px';
        showMore.content.style.transition = `max-height ${this.config.animationDuration}ms ${this.config.easing}`;
        
        // Update metrics
        this.updateMetrics('show-more-collapse');
    },

    /**
     * Setup advanced search
     */
    setupAdvancedSearch() {
        const searchContainers = document.querySelectorAll('.search-container');
        
        searchContainers.forEach(container => {
            const searchId = this.generateId();
            const input = container.querySelector('.search-input');
            const filters = container.querySelector('.search-filters');
            const toggle = container.querySelector('.filter-toggle');
            
            if (!input) return;
            
            // Initialize search state
            this.state.searchContainers.set(searchId, {
                container,
                input,
                filters,
                toggle,
                hasFilters: false,
                query: '',
                activeFilters: new Set()
            });
            
            // Setup input handler
            input.addEventListener('input', (e) => {
                this.handleSearchInput(searchId, e.target.value);
            });
            
            // Setup filter toggle
            if (toggle) {
                toggle.addEventListener('click', () => {
                    this.toggleSearchFilters(searchId);
                });
            }
            
            // Setup filter options
            const filterOptions = container.querySelectorAll('.filter-option');
            filterOptions.forEach(option => {
                option.addEventListener('click', () => {
                    this.toggleSearchFilter(searchId, option);
                });
            });
        });
    },

    /**
     * Handle search input
     */
    handleSearchInput(searchId, query) {
        const search = this.state.searchContainers.get(searchId);
        if (!search) return;
        
        // Update query
        search.query = query;
        
        // Debounce search
        if (this.state.searchDebounceTimers.has(searchId)) {
            clearTimeout(this.state.searchDebounceTimers.get(searchId));
        }
        
        const timer = setTimeout(() => {
            this.performSearch(searchId, query);
        }, this.config.searchDebounceDelay);
        
        this.state.searchDebounceTimers.set(searchId, timer);
    },

    /**
     * Perform search
     */
    performSearch(searchId, query) {
        const search = this.state.searchContainers.get(searchId);
        if (!search) return;
        
        // Show filters if query is long enough
        if (query.length >= this.config.searchMinQueryLength) {
            search.container.classList.add('has-filters');
            search.hasFilters = true;
        } else {
            search.container.classList.remove('has-filters');
            search.hasFilters = false;
        }
        
        // Dispatch search event
        search.container.dispatchEvent(new CustomEvent('searchPerformed', {
            detail: { searchId, query, activeFilters: Array.from(search.activeFilters) }
        }));
        
        // Update metrics
        this.updateMetrics('search-performed');
    },

    /**
     * Toggle search filters
     */
    toggleSearchFilters(searchId) {
        const search = this.state.searchContainers.get(searchId);
        if (!search || !search.filters) return;
        
        const isVisible = search.filters.style.maxHeight && search.filters.style.maxHeight !== '0px';
        
        if (isVisible) {
            // Hide filters
            search.filters.style.maxHeight = '0px';
            search.toggle.classList.remove('active');
        } else {
            // Show filters
            const filtersHeight = search.filters.scrollHeight;
            search.filters.style.maxHeight = filtersHeight + 'px';
            search.toggle.classList.add('active');
        }
        
        // Update metrics
        this.updateMetrics('search-filters-toggle');
    },

    /**
     * Toggle search filter
     */
    toggleSearchFilter(searchId, option) {
        const search = this.state.searchContainers.get(searchId);
        if (!search) return;
        
        const filterValue = option.getAttribute('data-filter') || option.textContent.trim();
        
        if (search.activeFilters.has(filterValue)) {
            // Remove filter
            search.activeFilters.delete(filterValue);
            option.classList.remove('selected');
        } else {
            // Add filter
            search.activeFilters.add(filterValue);
            option.classList.add('selected');
        }
        
        // Re-perform search
        this.performSearch(searchId, search.query);
        
        // Update metrics
        this.updateMetrics('search-filter-toggle');
    },

    /**
     * Setup multi-level navigation
     */
    setupMultiLevelNavigation() {
        const navContainers = document.querySelectorAll('.multi-level-nav');
        
        navContainers.forEach(container => {
            const navId = this.generateId();
            const navItems = container.querySelectorAll('.nav-item');
            
            // Initialize navigation state
            this.state.navigationMenus.set(navId, {
                container,
                items: new Map()
            });
            
            // Setup navigation items
            navItems.forEach((item, index) => {
                const link = item.querySelector('.nav-link');
                const subLevel = item.querySelector('.nav-sub-level');
                const expandIcon = item.querySelector('.nav-expand-icon');
                
                if (link && subLevel) {
                    const itemId = `${navId}-item-${index}`;
                    
                    // Store item data
                    this.state.navigationMenus.get(navId).items.set(itemId, {
                        item,
                        link,
                        subLevel,
                        expandIcon,
                        isExpanded: item.classList.contains('expanded')
                    });
                    
                    // Add click handler
                    link.addEventListener('click', (e) => {
                        e.preventDefault();
                        this.toggleNavigationItem(navId, itemId);
                    });
                    
                    // Add keyboard support
                    link.setAttribute('aria-expanded', item.classList.contains('expanded'));
                    link.setAttribute('aria-controls', subLevel.id || itemId);
                    
                    if (!subLevel.id) {
                        subLevel.id = itemId;
                    }
                }
            });
        });
    },

    /**
     * Toggle navigation item
     */
    toggleNavigationItem(navId, itemId) {
        const nav = this.state.navigationMenus.get(navId);
        if (!nav) return;
        
        const item = nav.items.get(itemId);
        if (!item) return;
        
        const isCurrentlyExpanded = item.isExpanded;
        
        if (isCurrentlyExpanded) {
            this.collapseNavigationItem(navId, itemId);
        } else {
            this.expandNavigationItem(navId, itemId);
        }
        
        // Update metrics
        this.updateMetrics('nav-item-toggle');
    },

    /**
     * Expand navigation item
     */
    expandNavigationItem(navId, itemId) {
        const nav = this.state.navigationMenus.get(navId);
        if (!nav) return;
        
        const item = nav.items.get(itemId);
        if (!item || item.isExpanded) return;
        
        // Update state
        item.isExpanded = true;
        item.item.classList.add('expanded');
        this.state.expandedMenuItems.add(itemId);
        
        // Update ARIA
        item.link.setAttribute('aria-expanded', 'true');
        
        // Animate sub-level
        const subLevelHeight = item.subLevel.scrollHeight;
        item.subLevel.style.maxHeight = subLevelHeight + 'px';
        item.subLevel.style.transition = `max-height ${this.config.animationDuration}ms ${this.config.easing}`;
        
        // Update metrics
        this.updateMetrics('nav-item-expand');
    },

    /**
     * Collapse navigation item
     */
    collapseNavigationItem(navId, itemId) {
        const nav = this.state.navigationMenus.get(navId);
        if (!nav) return;
        
        const item = nav.items.get(itemId);
        if (!item || !item.isExpanded) return;
        
        // Update state
        item.isExpanded = false;
        item.item.classList.remove('expanded');
        this.state.expandedMenuItems.delete(itemId);
        
        // Update ARIA
        item.link.setAttribute('aria-expanded', 'false');
        
        // Animate sub-level
        item.subLevel.style.maxHeight = '0px';
        item.subLevel.style.transition = `max-height ${this.config.animationDuration}ms ${this.config.easing}`;
        
        // Update metrics
        this.updateMetrics('nav-item-collapse');
    },

    /**
     * Setup form field grouping
     */
    setupFormFieldGrouping() {
        const formContainers = document.querySelectorAll('.form-group-container');
        
        formContainers.forEach(container => {
            const formId = this.generateId();
            const conditionalFields = container.querySelectorAll('.conditional-field');
            const triggers = container.querySelectorAll('[data-conditional-trigger]');
            
            // Initialize form state
            this.state.formContainers.set(formId, {
                container,
                conditionalFields: new Map(),
                triggers: new Map()
            });
            
            // Setup conditional fields
            conditionalFields.forEach((field, index) => {
                const fieldId = `${formId}-field-${index}`;
                const triggerSelector = field.getAttribute('data-trigger');
                
                // Store field data
                this.state.formContainers.get(formId).conditionalFields.set(fieldId, {
                    field,
                    triggerSelector,
                    isVisible: field.classList.contains('visible')
                });
            });
            
            // Setup triggers
            triggers.forEach((trigger, index) => {
                const triggerId = `${formId}-trigger-${index}`;
                const targetSelector = trigger.getAttribute('data-conditional-trigger');
                
                // Store trigger data
                this.state.formContainers.get(formId).triggers.set(triggerId, {
                    trigger,
                    targetSelector
                });
                
                // Add event listeners
                trigger.addEventListener('change', () => {
                    this.handleFormTrigger(formId, triggerId);
                });
                
                trigger.addEventListener('input', () => {
                    this.handleFormTrigger(formId, triggerId);
                });
            });
        });
    },

    /**
     * Handle form trigger
     */
    handleFormTrigger(formId, triggerId) {
        const form = this.state.formContainers.get(formId);
        if (!form) return;
        
        const trigger = form.triggers.get(triggerId);
        if (!trigger) return;
        
        // Find target fields
        const targetFields = form.container.querySelectorAll(trigger.targetSelector);
        
        targetFields.forEach(targetField => {
            const shouldShow = this.evaluateCondition(trigger.trigger, targetField);
            
            if (shouldShow) {
                this.showConditionalField(targetField);
            } else {
                this.hideConditionalField(targetField);
            }
        });
        
        // Update metrics
        this.updateMetrics('form-trigger');
    },

    /**
     * Evaluate condition
     */
    evaluateCondition(trigger, targetField) {
        const triggerValue = trigger.value.trim();
        const condition = targetField.getAttribute('data-condition') || 'not-empty';
        
        switch (condition) {
            case 'not-empty':
                return triggerValue !== '';
            case 'empty':
                return triggerValue === '';
            case 'equals':
                const expectedValue = targetField.getAttribute('data-value');
                return triggerValue === expectedValue;
            case 'contains':
                const containsValue = targetField.getAttribute('data-value');
                return triggerValue.includes(containsValue);
            case 'checked':
                return trigger.checked;
            case 'unchecked':
                return !trigger.checked;
            default:
                return triggerValue !== '';
        }
    },

    /**
     * Show conditional field
     */
    showConditionalField(field) {
        field.classList.add('visible');
        field.style.maxHeight = field.scrollHeight + 'px';
        field.style.opacity = '1';
        field.style.transition = `all ${this.config.animationDuration}ms ${this.config.easing}`;
        
        // Update metrics
        this.updateMetrics('conditional-field-show');
    },

    /**
     * Hide conditional field
     */
    hideConditionalField(field) {
        field.classList.remove('visible');
        field.style.maxHeight = '0px';
        field.style.opacity = '0';
        field.style.transition = `all ${this.config.animationDuration}ms ${this.config.easing}`;
        
        // Update metrics
        this.updateMetrics('conditional-field-hide');
    },

    /**
     * Setup data table management
     */
    setupDataTableManagement() {
        const tableContainers = document.querySelectorAll('.table-container');
        
        tableContainers.forEach(container => {
            const tableId = this.generateId();
            const table = container.querySelector('.data-table');
            const toggle = container.querySelector('.column-toggle-button');
            const dropdown = container.querySelector('.column-dropdown');
            
            if (!table) return;
            
            // Initialize table state
            this.state.tables.set(tableId, {
                container,
                table,
                toggle,
                dropdown,
                columns: new Map()
            });
            
            // Setup column management
            const headers = table.querySelectorAll('th');
            headers.forEach((header, index) => {
                const columnId = `${tableId}-column-${index}`;
                const columnName = header.textContent.trim();
                
                // Store column data
                this.state.tables.get(tableId).columns.set(columnId, {
                    header,
                    index,
                    name: columnName,
                    isVisible: true
                });
            });
            
            // Setup column toggle
            if (toggle) {
                toggle.addEventListener('click', () => {
                    this.toggleColumnDropdown(tableId);
                });
            }
            
            // Setup column options
            const columnOptions = container.querySelectorAll('.column-option');
            columnOptions.forEach(option => {
                const checkbox = option.querySelector('.column-checkbox');
                const label = option.querySelector('.column-label');
                
                if (checkbox && label) {
                    const columnName = label.textContent.trim();
                    
                    checkbox.addEventListener('change', () => {
                        this.toggleColumnVisibility(tableId, columnName, checkbox.checked);
                    });
                    
                    // Initialize checkbox state
                    checkbox.checked = true;
                }
            });
        });
    },

    /**
     * Toggle column dropdown
     */
    toggleColumnDropdown(tableId) {
        const table = this.state.tables.get(tableId);
        if (!table || !table.dropdown) return;
        
        const isVisible = table.dropdown.classList.contains('active');
        
        if (isVisible) {
            // Hide dropdown
            table.dropdown.classList.remove('active');
            table.toggle.classList.remove('active');
        } else {
            // Show dropdown
            table.dropdown.classList.add('active');
            table.toggle.classList.add('active');
        }
        
        // Update metrics
        this.updateMetrics('column-dropdown-toggle');
    },

    /**
     * Toggle column visibility
     */
    toggleColumnVisibility(tableId, columnName, isVisible) {
        const table = this.state.tables.get(tableId);
        if (!table) return;
        
        // Find column
        let targetColumn = null;
        table.columns.forEach((column, columnId) => {
            if (column.name === columnName) {
                targetColumn = column;
            }
        });
        
        if (!targetColumn) return;
        
        // Update visibility
        targetColumn.isVisible = isVisible;
        
        // Toggle column display
        const columnIndex = targetColumn.index;
        const rows = table.table.querySelectorAll('tr');
        
        rows.forEach(row => {
            const cells = row.querySelectorAll('td, th');
            if (cells[columnIndex]) {
                cells[columnIndex].style.display = isVisible ? '' : 'none';
            }
        });
        
        // Update metrics
        this.updateMetrics('column-visibility-toggle');
    },

    /**
     * Setup dashboard widgets
     */
    setupDashboardWidgets() {
        const dashboardContainers = document.querySelectorAll('.dashboard-container');
        
        dashboardContainers.forEach(container => {
            const dashboardId = this.generateId();
            const widgets = container.querySelectorAll('.dashboard-widget');
            
            // Initialize dashboard state
            this.state.dashboards.set(dashboardId, {
                container,
                widgets: new Map(),
                widgetPositions: new Map()
            });
            
            // Setup widgets
            widgets.forEach((widget, index) => {
                const widgetId = `${dashboardId}-widget-${index}`;
                const header = widget.querySelector('.widget-header');
                
                // Store widget data
                this.state.dashboards.get(dashboardId).widgets.set(widgetId, {
                    widget,
                    header,
                    index,
                    isDragging: false
                });
                
                // Setup drag and drop
                if (header) {
                    header.addEventListener('mousedown', (e) => {
                        this.startWidgetDrag(dashboardId, widgetId, e);
                    });
                }
            });
            
            // Setup drag and drop events
            container.addEventListener('dragover', (e) => {
                e.preventDefault();
                this.handleWidgetDragOver(e);
            });
            
            container.addEventListener('drop', (e) => {
                e.preventDefault();
                this.handleWidgetDrop(e);
            });
        });
    },

    /**
     * Start widget drag
     */
    startWidgetDrag(dashboardId, widgetId, event) {
        const dashboard = this.state.dashboards.get(dashboardId);
        if (!dashboard) return;
        
        const widget = dashboard.widgets.get(widgetId);
        if (!widget) return;
        
        // Prevent default drag behavior
        event.preventDefault();
        
        // Update state
        widget.isDragging = true;
        this.state.draggedWidget = { dashboardId, widgetId };
        
        // Add dragging class
        widget.widget.classList.add('dragging');
        
        // Setup mouse move handler
        const handleMouseMove = (e) => {
            this.handleWidgetDrag(e);
        };
        
        // Setup mouse up handler
        const handleMouseUp = () => {
            this.endWidgetDrag();
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
        
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
        
        // Update metrics
        this.updateMetrics('widget-drag-start');
    },

    /**
     * Handle widget drag
     */
    handleWidgetDrag(event) {
        if (!this.state.draggedWidget) return;
        
        const { dashboardId, widgetId } = this.state.draggedWidget;
        const dashboard = this.state.dashboards.get(dashboardId);
        const widget = dashboard.widgets.get(widgetId);
        
        if (!widget) return;
        
        // Update widget position
        const containerRect = dashboard.container.getBoundingClientRect();
        const x = event.clientX - containerRect.left;
        const y = event.clientY - containerRect.top;
        
        widget.widget.style.position = 'absolute';
        widget.widget.style.left = x + 'px';
        widget.widget.style.top = y + 'px';
        widget.widget.style.zIndex = '1000';
    },

    /**
     * Handle widget drag over
     */
    handleWidgetDragOver(event) {
        if (!this.state.draggedWidget) return;
        
        // Find target widget
        const targetWidget = event.target.closest('.dashboard-widget');
        if (targetWidget && !targetWidget.classList.contains('dragging')) {
            targetWidget.classList.add('drag-over');
        }
    },

    /**
     * Handle widget drop
     */
    handleWidgetDrop(event) {
        if (!this.state.draggedWidget) return;
        
        // Find target widget
        const targetWidget = event.target.closest('.dashboard-widget');
        if (targetWidget) {
            targetWidget.classList.remove('drag-over');
        }
        
        // Update metrics
        this.updateMetrics('widget-drop');
    },

    /**
     * End widget drag
     */
    endWidgetDrag() {
        if (!this.state.draggedWidget) return;
        
        const { dashboardId, widgetId } = this.state.draggedWidget;
        const dashboard = this.state.dashboards.get(dashboardId);
        const widget = dashboard.widgets.get(widgetId);
        
        if (widget) {
            // Remove dragging class
            widget.widget.classList.remove('dragging');
            
            // Reset position
            widget.widget.style.position = '';
            widget.widget.style.left = '';
            widget.widget.style.top = '';
            widget.widget.style.zIndex = '';
            
            // Update state
            widget.isDragging = false;
        }
        
        // Clear dragged widget
        this.state.draggedWidget = null;
        
        // Update metrics
        this.updateMetrics('widget-drag-end');
    },

    /**
     * Setup accessibility features
     */
    setupAccessibilityFeatures() {
        // Check for reduced motion preference
        if (window.matchMedia) {
            const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
            if (reducedMotionQuery.matches) {
                this.config.animationDuration = 0;
                this.config.staggerDelay = 0;
            }
            
            reducedMotionQuery.addEventListener('change', (e) => {
                if (e.matches) {
                    this.config.animationDuration = 0;
                    this.config.staggerDelay = 0;
                } else {
                    this.config.animationDuration = 300;
                    this.config.staggerDelay = 100;
                }
            });
        }
        
        // Setup live regions
        this.setupLiveRegions();
    },

    /**
     * Setup live regions
     */
    setupLiveRegions() {
        // Create status live region
        if (!document.getElementById('disclosure-status')) {
            const statusRegion = document.createElement('div');
            statusRegion.id = 'disclosure-status';
            statusRegion.className = 'sr-only';
            statusRegion.setAttribute('aria-live', 'polite');
            statusRegion.setAttribute('aria-atomic', 'true');
            document.body.appendChild(statusRegion);
        }
        
        // Create alert live region
        if (!document.getElementById('disclosure-alert')) {
            const alertRegion = document.createElement('div');
            alertRegion.id = 'disclosure-alert';
            alertRegion.className = 'sr-only';
            alertRegion.setAttribute('aria-live', 'assertive');
            alertRegion.setAttribute('aria-atomic', 'true');
            document.body.appendChild(alertRegion);
        }
    },

    /**
     * Announce change
     */
    announceChange(message) {
        if (!this.config.announceChanges) return;
        
        const statusRegion = document.getElementById('disclosure-status');
        if (statusRegion) {
            statusRegion.textContent = message;
        }
    },

    /**
     * Setup performance monitoring
     */
    setupPerformanceMonitoring() {
        // Monitor disclosure performance
        if ('PerformanceObserver' in window) {
            const observer = new PerformanceObserver((list) => {
                list.getEntries().forEach((entry) => {
                    if (entry.name.includes('disclosure')) {
                        this.recordPerformanceMetric(entry);
                    }
                });
            });
            
            observer.observe({ entryTypes: ['measure', 'paint'] });
        }
    },

    /**
     * Record performance metric
     */
    recordPerformanceMetric(entry) {
        // This would send performance data to analytics service
        console.log(`Disclosure performance: ${entry.name} - ${entry.duration.toFixed(2)}ms`);
    },

    /**
     * Update metrics
     */
    updateMetrics(action) {
        this.state.metrics.totalDisclosures++;
        
        // Record action-specific metrics
        if (!this.state.metrics[action]) {
            this.state.metrics[action] = 0;
        }
        this.state.metrics[action]++;
    },

    /**
     * Generate unique ID
     */
    generateId() {
        return `disclosure-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    },

    /**
     * Get metrics
     */
    getMetrics() {
        return {
            ...this.state.metrics,
            activeAccordions: this.state.activeAccordionItems.size,
            activeTabs: this.state.activeTabs.size,
            activeTooltips: this.state.activeTooltips.size,
            expandedMenuItems: this.state.expandedMenuItems.size
        };
    },

    /**
     * Destroy disclosure manager
     */
    destroy() {
        // Clear timers
        this.state.tabAutoSwitchTimers.forEach(timer => clearInterval(timer));
        this.state.tooltipTimers.forEach(timer => clearTimeout(timer));
        this.state.searchDebounceTimers.forEach(timer => clearTimeout(timer));
        
        // Clear state
        this.state.accordions.clear();
        this.state.tabs.clear();
        this.state.wizards.clear();
        this.state.tooltips.clear();
        this.state.searchContainers.clear();
        this.state.navigationMenus.clear();
        this.state.formContainers.clear();
        this.state.tables.clear();
        this.state.dashboards.clear();
        
        console.log('🗑️ Progressive Disclosure Manager destroyed');
    }
};

// Initialize on DOM ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => disclosureManager.initialize());
} else {
    disclosureManager.initialize();
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = disclosureManager;
}

// Make available globally
window.disclosureManager = disclosureManager;