/**
 * Interaction Flows Management System
 * 
 * Comprehensive interaction flow management with:
 * - Gesture-based interactions for touch devices
 * - Keyboard navigation with focus management
 * - Drag-and-drop functionality for content organization
 * - Inline editing capabilities for quick updates
 * - Multi-step workflows with progress indicators
 * - Smart tooltips and contextual help system
 * - Interactive tutorials and onboarding flows
 * - Personalized navigation based on usage patterns
 * 
 * @version 1.0.0
 * @author Interaction Flows System
 */

const interactionFlows = {
    /**
     * Configuration
     */
    config: {
        // Gesture settings
        gestureThreshold: 50,
        gestureVelocity: 0.3,
        longPressDuration: 500,
        doubleTapTimeout: 300,
        
        // Drag and drop settings
        dragThreshold: 5,
        dropZones: '.drop-zone',
        dragHandle: '.drag-handle',
        
        // Inline editing settings
        inlineEditSelector: '.inline-editable',
        autoSaveDelay: 1000,
        
        // Workflow settings
        workflowStepTimeout: 30000,
        workflowAutoAdvance: false,
        
        // Tooltip settings
        tooltipDelay: 500,
        tooltipDuration: 3000,
        
        // Tutorial settings
        tutorialStepDelay: 2000,
        tutorialAutoAdvance: false,
        
        // Performance settings
        debounceDelay: 150,
        throttleDelay: 50,
        maxConcurrentInteractions: 5
    },

    /**
     * State management
     */
    state: {
        // Gesture state
        gestureInProgress: false,
        currentGesture: null,
        gestureStartPoint: null,
        longPressTimer: null,
        lastTapTime: 0,
        
        // Drag and drop state
        dragInProgress: false,
        currentDragElement: null,
        dragData: null,
        dropZones: new Map(),
        
        // Inline editing state
        editingElements: new Map(),
        autoSaveTimers: new Map(),
        
        // Workflow state
        activeWorkflows: new Map(),
        workflowHistory: [],
        
        // Tooltip state
        activeTooltips: new Map(),
        tooltipQueue: [],
        
        // Tutorial state
        activeTutorial: null,
        tutorialStep: 0,
        tutorialHistory: [],
        
        // Focus management
        focusStack: [],
        currentFocusElement: null,
        
        // Performance metrics
        interactionMetrics: new Map(),
        concurrentInteractions: 0,
        
        // User behavior tracking
        interactionPatterns: new Map(),
        userPreferences: new Map()
    },

    /**
     * Initialize interaction flows system
     */
    initialize() {
        console.log('🎯 Initializing Interaction Flows System...');
        
        // Setup gesture interactions
        this.setupGestureInteractions();
        
        // Setup drag and drop
        this.setupDragAndDrop();
        
        // Setup inline editing
        this.setupInlineEditing();
        
        // Setup workflow management
        this.setupWorkflowManagement();
        
        // Setup tooltips
        this.setupTooltips();
        
        // Setup tutorials
        this.setupTutorials();
        
        // Setup focus management
        this.setupFocusManagement();
        
        // Load user preferences
        this.loadUserPreferences();
        
        // Setup performance monitoring
        this.setupPerformanceMonitoring();
        
        console.log('✅ Interaction Flows System initialized');
    },

    /**
     * Setup gesture interactions
     */
    setupGestureInteractions() {
        const interactiveElements = document.querySelectorAll('.gesture-enabled');
        
        interactiveElements.forEach(element => {
            // Touch events
            element.addEventListener('touchstart', (e) => this.handleTouchStart(e), { passive: false });
            element.addEventListener('touchmove', (e) => this.handleTouchMove(e), { passive: false });
            element.addEventListener('touchend', (e) => this.handleTouchEnd(e), { passive: false });
            
            // Mouse events for desktop testing
            element.addEventListener('mousedown', (e) => this.handleMouseDown(e));
            element.addEventListener('mousemove', (e) => this.handleMouseMove(e));
            element.addEventListener('mouseup', (e) => this.handleMouseUp(e));
            
            // Add gesture attributes
            element.setAttribute('role', 'button');
            element.setAttribute('tabindex', '0');
        });
    },

    /**
     * Setup drag and drop functionality
     */
    setupDragAndDrop() {
        const draggableElements = document.querySelectorAll('[draggable="true"]');
        const dropZones = document.querySelectorAll(this.config.dropZones);
        
        // Setup draggable elements
        draggableElements.forEach(element => {
            element.addEventListener('dragstart', (e) => this.handleDragStart(e));
            element.addEventListener('drag', (e) => this.handleDrag(e));
            element.addEventListener('dragend', (e) => this.handleDragEnd(e));
            
            // Touch events for mobile drag and drop
            element.addEventListener('touchstart', (e) => this.handleTouchDragStart(e), { passive: false });
            element.addEventListener('touchmove', (e) => this.handleTouchDragMove(e), { passive: false });
            element.addEventListener('touchend', (e) => this.handleTouchDragEnd(e), { passive: false });
        });
        
        // Setup drop zones
        dropZones.forEach(zone => {
            zone.addEventListener('dragover', (e) => this.handleDragOver(e));
            zone.addEventListener('drop', (e) => this.handleDrop(e));
            zone.addEventListener('dragleave', (e) => this.handleDragLeave(e));
            zone.addEventListener('dragenter', (e) => this.handleDragEnter(e));
            
            // Store drop zone reference
            this.state.dropZones.set(zone, {
                element: zone,
                validDropTypes: zone.dataset.dropTypes ? zone.dataset.dropTypes.split(',') : ['*']
            });
        });
    },

    /**
     * Setup inline editing
     */
    setupInlineEditing() {
        const editableElements = document.querySelectorAll(this.config.inlineEditSelector);
        
        editableElements.forEach(element => {
            // Double-click to edit
            element.addEventListener('dblclick', (e) => this.startInlineEdit(e));
            
            // Keyboard shortcut to edit (Ctrl+E)
            element.addEventListener('keydown', (e) => {
                if (e.ctrlKey && e.key === 'e') {
                    e.preventDefault();
                    this.startInlineEdit(e);
                }
            });
            
            // Add editing attributes
            element.setAttribute('role', 'textbox');
            element.setAttribute('aria-multiline', element.tagName === 'DIV' || element.tagName === 'P');
            element.setAttribute('data-editable', 'true');
        });
    },

    /**
     * Setup workflow management
     */
    setupWorkflowManagement() {
        // Find workflow containers
        const workflowContainers = document.querySelectorAll('.workflow-container');
        
        workflowContainers.forEach(container => {
            const workflowId = container.dataset.workflowId;
            if (workflowId) {
                this.initializeWorkflow(workflowId, container);
            }
        });
        
        // Setup workflow navigation
        this.setupWorkflowNavigation();
    },

    /**
     * Setup tooltips
     */
    setupTooltips() {
        const tooltipElements = document.querySelectorAll('[data-tooltip]');
        
        tooltipElements.forEach(element => {
            // Mouse events
            element.addEventListener('mouseenter', (e) => this.showTooltip(e));
            element.addEventListener('mouseleave', (e) => this.hideTooltip(e));
            
            // Focus events for keyboard navigation
            element.addEventListener('focus', (e) => this.showTooltip(e));
            element.addEventListener('blur', (e) => this.hideTooltip(e));
            
            // Touch events for mobile
            element.addEventListener('touchstart', (e) => this.handleTooltipTouch(e), { passive: false });
        });
    },

    /**
     * Setup tutorials
     */
    setupTutorials() {
        // Create tutorial container
        const tutorialContainer = document.createElement('div');
        tutorialContainer.className = 'tutorial-container';
        tutorialContainer.id = 'tutorialContainer';
        tutorialContainer.innerHTML = `
            <div class="tutorial-overlay" id="tutorialOverlay"></div>
            <div class="tutorial-content" id="tutorialContent">
                <div class="tutorial-header">
                    <h3 class="tutorial-title" id="tutorialTitle"></h3>
                    <button class="tutorial-close" id="tutorialClose" aria-label="Close tutorial">×</button>
                </div>
                <div class="tutorial-body" id="tutorialBody"></div>
                <div class="tutorial-footer">
                    <div class="tutorial-progress" id="tutorialProgress"></div>
                    <div class="tutorial-actions">
                        <button class="tutorial-skip" id="tutorialSkip">Skip</button>
                        <button class="tutorial-previous" id="tutorialPrevious">Previous</button>
                        <button class="tutorial-next" id="tutorialNext">Next</button>
                        <button class="tutorial-finish" id="tutorialFinish">Finish</button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(tutorialContainer);
        
        // Setup tutorial controls
        this.setupTutorialControls();
    },

    /**
     * Setup focus management
     */
    setupFocusManagement() {
        // Track focus changes
        document.addEventListener('focusin', (e) => this.handleFocusIn(e));
        document.addEventListener('focusout', (e) => this.handleFocusOut(e));
        
        // Setup focus trap for modals
        this.setupFocusTrap();
        
        // Setup skip links
        this.setupSkipLinks();
    },

    /**
     * Handle touch start
     */
    handleTouchStart(e) {
        if (this.state.gestureInProgress) return;
        
        const touch = e.touches[0];
        this.state.gestureStartPoint = {
            x: touch.clientX,
            y: touch.clientY,
            time: Date.now()
        };
        
        // Start long press timer
        this.state.longPressTimer = setTimeout(() => {
            this.handleLongPress(e);
        }, this.config.longPressDuration);
        
        // Prevent default for certain gestures
        if (e.target.classList.contains('prevent-default-touch')) {
            e.preventDefault();
        }
    },

    /**
     * Handle touch move
     */
    handleTouchMove(e) {
        if (!this.state.gestureStartPoint) return;
        
        const touch = e.touches[0];
        const deltaX = touch.clientX - this.state.gestureStartPoint.x;
        const deltaY = touch.clientY - this.state.gestureStartPoint.y;
        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
        
        // Cancel long press if moved too much
        if (distance > this.config.gestureThreshold) {
            clearTimeout(this.state.longPressTimer);
            this.state.longPressTimer = null;
        }
        
        // Handle drag gesture
        if (this.state.dragInProgress) {
            this.handleDragMove(e);
        }
    },

    /**
     * Handle touch end
     */
    handleTouchEnd(e) {
        if (!this.state.gestureStartPoint) return;
        
        const touch = e.changedTouches[0];
        const deltaX = touch.clientX - this.state.gestureStartPoint.x;
        const deltaY = touch.clientY - this.state.gestureStartPoint.y;
        const deltaTime = Date.now() - this.state.gestureStartPoint.time;
        
        // Clear long press timer
        if (this.state.longPressTimer) {
            clearTimeout(this.state.longPressTimer);
            this.state.longPressTimer = null;
        }
        
        // Determine gesture type
        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
        const velocity = distance / deltaTime;
        
        if (distance < 10 && deltaTime < 200) {
            // Tap gesture
            this.handleTap(e);
        } else if (velocity > this.config.gestureVelocity) {
            // Swipe gesture
            this.handleSwipe(e, deltaX, deltaY);
        }
        
        // Reset gesture state
        this.state.gestureStartPoint = null;
    },

    /**
     * Handle tap gesture
     */
    handleTap(e) {
        const currentTime = Date.now();
        const timeSinceLastTap = currentTime - this.state.lastTapTime;
        
        if (timeSinceLastTap < this.config.doubleTapTimeout) {
            // Double tap
            this.handleDoubleTap(e);
        } else {
            // Single tap
            this.handleSingleTap(e);
        }
        
        this.state.lastTapTime = currentTime;
    },

    /**
     * Handle single tap
     */
    handleSingleTap(e) {
        const target = e.target;
        
        // Trigger click event
        const clickEvent = new MouseEvent('click', {
            bubbles: true,
            cancelable: true,
            view: window
        });
        target.dispatchEvent(clickEvent);
        
        // Record interaction pattern
        this.recordInteractionPattern('tap', target);
    },

    /**
     * Handle double tap
     */
    handleDoubleTap(e) {
        const target = e.target;
        
        // Handle double tap specific actions
        if (target.classList.contains('zoom-enabled')) {
            this.handleZoom(e);
        } else if (target.classList.contains('inline-editable')) {
            this.startInlineEdit(e);
        }
        
        // Record interaction pattern
        this.recordInteractionPattern('double-tap', target);
    },

    /**
     * Handle long press
     */
    handleLongPress(e) {
        const target = e.target;
        
        // Show context menu or perform long press action
        if (target.classList.contains('context-menu-enabled')) {
            this.showContextMenu(e);
        } else if (target.classList.contains('drag-enabled')) {
            this.startDrag(e);
        }
        
        // Record interaction pattern
        this.recordInteractionPattern('long-press', target);
    },

    /**
     * Handle swipe gesture
     */
    handleSwipe(e, deltaX, deltaY) {
        const target = e.target;
        const direction = this.getSwipeDirection(deltaX, deltaY);
        
        // Handle swipe actions
        switch (direction) {
            case 'left':
                this.handleSwipeLeft(e, target);
                break;
            case 'right':
                this.handleSwipeRight(e, target);
                break;
            case 'up':
                this.handleSwipeUp(e, target);
                break;
            case 'down':
                this.handleSwipeDown(e, target);
                break;
        }
        
        // Record interaction pattern
        this.recordInteractionPattern('swipe', target, { direction, deltaX, deltaY });
    },

    /**
     * Get swipe direction
     */
    getSwipeDirection(deltaX, deltaY) {
        if (Math.abs(deltaX) > Math.abs(deltaY)) {
            return deltaX > 0 ? 'right' : 'left';
        } else {
            return deltaY > 0 ? 'down' : 'up';
        }
    },

    /**
     * Handle swipe left
     */
    handleSwipeLeft(e, target) {
        // Navigate to next view or perform swipe left action
        if (target.classList.contains('swipe-navigable')) {
            enhancedNavigation.navigateForward();
        } else if (target.classList.contains('swipe-dismissible')) {
            this.dismissElement(target);
        }
    },

    /**
     * Handle swipe right
     */
    handleSwipeRight(e, target) {
        // Navigate to previous view or perform swipe right action
        if (target.classList.contains('swipe-navigable')) {
            enhancedNavigation.navigateBack();
        } else if (target.classList.contains('swipe-actionable')) {
            this.triggerSwipeAction(target, 'right');
        }
    },

    /**
     * Handle swipe up
     */
    handleSwipeUp(e, target) {
        // Show quick access or perform swipe up action
        if (target.classList.contains('swipe-revealable')) {
            this.revealHiddenContent(target);
        }
    },

    /**
     * Handle swipe down
     */
    handleSwipeDown(e, target) {
        // Hide content or perform swipe down action
        if (target.classList.contains('swipe-hidable')) {
            this.hideContent(target);
        }
    },

    /**
     * Start inline editing
     */
    startInlineEdit(e) {
        const target = e.target;
        const element = target.closest(this.config.inlineEditSelector);
        
        if (!element || this.state.editingElements.has(element)) return;
        
        // Get current content
        const currentContent = element.textContent.trim();
        const tagName = element.tagName.toLowerCase();
        
        // Create editor
        const editor = document.createElement(tagName === 'input' || tagName === 'textarea' ? tagName : 'textarea');
        editor.className = 'inline-editor';
        editor.value = currentContent;
        editor.setAttribute('aria-label', 'Edit content');
        
        // Replace element with editor
        const originalContent = element.innerHTML;
        element.innerHTML = '';
        element.appendChild(editor);
        
        // Store editing state
        this.state.editingElements.set(element, {
            originalContent,
            editor,
            autoSaveTimer: null
        });
        
        // Focus editor
        editor.focus();
        editor.select();
        
        // Setup editor events
        editor.addEventListener('blur', () => this.finishInlineEdit(element));
        editor.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.finishInlineEdit(element);
            } else if (e.key === 'Escape') {
                this.cancelInlineEdit(element);
            }
        });
        
        // Setup auto-save
        this.state.editingElements.get(element).autoSaveTimer = setTimeout(() => {
            this.autoSaveInlineEdit(element);
        }, this.config.autoSaveDelay);
        
        // Record interaction pattern
        this.recordInteractionPattern('inline-edit-start', element);
    },

    /**
     * Finish inline editing
     */
    finishInlineEdit(element) {
        const editingState = this.state.editingElements.get(element);
        if (!editingState) return;
        
        const { editor, originalContent, autoSaveTimer } = editingState;
        
        // Clear auto-save timer
        if (autoSaveTimer) {
            clearTimeout(autoSaveTimer);
        }
        
        // Get new content
        const newContent = editor.value.trim();
        
        // Restore element
        element.innerHTML = newContent || originalContent;
        
        // Remove editing state
        this.state.editingElements.delete(element);
        
        // Save changes if content changed
        if (newContent && newContent !== originalContent.trim()) {
            this.saveInlineEdit(element, newContent);
        }
        
        // Record interaction pattern
        this.recordInteractionPattern('inline-edit-finish', element, { 
            changed: newContent !== originalContent.trim() 
        });
    },

    /**
     * Cancel inline editing
     */
    cancelInlineEdit(element) {
        const editingState = this.state.editingElements.get(element);
        if (!editingState) return;
        
        const { originalContent, autoSaveTimer } = editingState;
        
        // Clear auto-save timer
        if (autoSaveTimer) {
            clearTimeout(autoSaveTimer);
        }
        
        // Restore original content
        element.innerHTML = originalContent;
        
        // Remove editing state
        this.state.editingElements.delete(element);
        
        // Record interaction pattern
        this.recordInteractionPattern('inline-edit-cancel', element);
    },

    /**
     * Auto-save inline edit
     */
    autoSaveInlineEdit(element) {
        const editingState = this.state.editingElements.get(element);
        if (!editingState) return;
        
        const { editor } = editingState;
        const content = editor.value.trim();
        
        // Show saving indicator
        this.showSavingIndicator(element);
        
        // Save content
        this.saveInlineEdit(element, content);
        
        // Record interaction pattern
        this.recordInteractionPattern('inline-edit-auto-save', element);
    },

    /**
     * Save inline edit
     */
    saveInlineEdit(element, content) {
        // Get element identifier
        const elementId = element.id || element.dataset.id;
        const fieldName = element.dataset.field || 'content';
        
        // Dispatch save event
        const saveEvent = new CustomEvent('inlineEditSave', {
            detail: {
                elementId,
                fieldName,
                content,
                element
            }
        });
        
        document.dispatchEvent(saveEvent);
        
        // Show success indicator
        this.showSaveSuccessIndicator(element);
    },

    /**
     * Handle drag start
     */
    handleDragStart(e) {
        const target = e.target;
        
        // Set drag data
        this.state.dragData = {
            element: target,
            data: target.dataset.dragData || {},
            startPoint: {
                x: e.clientX,
                y: e.clientY
            }
        };
        
        // Set drag effect
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', JSON.stringify(this.state.dragData.data));
        
        // Add dragging class
        target.classList.add('dragging');
        
        // Record interaction pattern
        this.recordInteractionPattern('drag-start', target);
    },

    /**
     * Handle drag
     */
    handleDrag(e) {
        // Update drag visual feedback
        const target = e.target;
        if (target.classList.contains('dragging')) {
            target.style.transform = `translate(${e.clientX - this.state.dragData.startPoint.x}px, ${e.clientY - this.state.dragData.startPoint.y}px)`;
        }
    },

    /**
     * Handle drag end
     */
    handleDragEnd(e) {
        const target = e.target;
        
        // Remove dragging class
        target.classList.remove('dragging');
        
        // Reset transform
        target.style.transform = '';
        
        // Clear drag data
        this.state.dragData = null;
        
        // Record interaction pattern
        this.recordInteractionPattern('drag-end', target);
    },

    /**
     * Handle drag over
     */
    handleDragOver(e) {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        
        // Update drop zone visual feedback
        const dropZone = e.target.closest(this.config.dropZones);
        if (dropZone) {
            dropZone.classList.add('drag-over');
        }
    },

    /**
     * Handle drop
     */
    handleDrop(e) {
        e.preventDefault();
        
        const dropZone = e.target.closest(this.config.dropZones);
        if (!dropZone) return;
        
        // Get drag data
        let dragData;
        try {
            dragData = JSON.parse(e.dataTransfer.getData('text/plain'));
        } catch (error) {
            dragData = this.state.dragData?.data || {};
        }
        
        // Validate drop
        if (this.validateDrop(dropZone, dragData)) {
            // Process drop
            this.processDrop(dropZone, dragData, e);
            
            // Remove drag-over class
            dropZone.classList.remove('drag-over');
            
            // Record interaction pattern
            this.recordInteractionPattern('drop', dropZone, { dragData });
        }
    },

    /**
     * Validate drop
     */
    validateDrop(dropZone, dragData) {
        const dropZoneInfo = this.state.dropZones.get(dropZone);
        if (!dropZoneInfo) return false;
        
        // Check if drop type is valid
        const validDropTypes = dropZoneInfo.validDropTypes;
        if (validDropTypes.includes('*')) return true;
        
        return validDropTypes.includes(dragData.type || 'default');
    },

    /**
     * Process drop
     */
    processDrop(dropZone, dragData, event) {
        // Dispatch drop event
        const dropEvent = new CustomEvent('dropProcessed', {
            detail: {
                dropZone,
                dragData,
                event
            }
        });
        
        document.dispatchEvent(dropEvent);
        
        // Show drop success indicator
        this.showDropSuccessIndicator(dropZone);
    },

    /**
     * Initialize workflow
     */
    initializeWorkflow(workflowId, container) {
        const workflow = {
            id: workflowId,
            container,
            currentStep: 0,
            steps: this.getWorkflowSteps(workflowId),
            state: 'ready',
            data: {},
            startTime: null,
            endTime: null
        };
        
        this.state.activeWorkflows.set(workflowId, workflow);
        
        // Setup workflow navigation
        this.setupWorkflowNavigation(workflow);
        
        // Render first step
        this.renderWorkflowStep(workflow, 0);
    },

    /**
     * Get workflow steps
     */
    getWorkflowSteps(workflowId) {
        // This would be customized based on workflow type
        const stepDefinitions = {
            'feature-creation': [
                { id: 'basic-info', title: 'Basic Information', required: true },
                { id: 'timeline', title: 'Timeline Planning', required: true },
                { id: 'resources', title: 'Resource Planning', required: false },
                { id: 'review', title: 'Review & Confirm', required: true }
            ],
            'ai-enhancement': [
                { id: 'analysis', title: 'Feature Analysis', required: true },
                { id: 'research', title: 'Research & Insights', required: true },
                { id: 'enhancement', title: 'Enhancement Planning', required: true },
                { id: 'implementation', title: 'Implementation', required: true }
            ]
        };
        
        return stepDefinitions[workflowId] || [];
    },

    /**
     * Render workflow step
     */
    renderWorkflowStep(workflow, stepIndex) {
        const step = workflow.steps[stepIndex];
        if (!step) return;
        
        // Update current step
        workflow.currentStep = stepIndex;
        
        // Render step content
        const stepContent = this.generateStepContent(step);
        workflow.container.innerHTML = stepContent;
        
        // Update progress indicator
        this.updateWorkflowProgress(workflow);
        
        // Setup step events
        this.setupStepEvents(workflow, step);
        
        // Record interaction pattern
        this.recordInteractionPattern('workflow-step', workflow.container, { 
            workflowId: workflow.id, 
            stepIndex, 
            stepId: step.id 
        });
    },

    /**
     * Generate step content
     */
    generateStepContent(step) {
        return `
            <div class="workflow-step" data-step-id="${step.id}">
                <div class="workflow-step-header">
                    <h3 class="workflow-step-title">${step.title}</h3>
                    ${step.required ? '<span class="workflow-step-required">Required</span>' : ''}
                </div>
                <div class="workflow-step-content">
                    ${this.getStepContent(step.id)}
                </div>
                <div class="workflow-step-actions">
                    <button class="workflow-step-previous" onclick="interactionFlows.workflowPreviousStep('${step.id}')">Previous</button>
                    <button class="workflow-step-next" onclick="interactionFlows.workflowNextStep('${step.id}')">Next</button>
                    <button class="workflow-step-finish" onclick="interactionFlows.workflowFinish('${step.id}')" style="display: none;">Finish</button>
                </div>
            </div>
        `;
    },

    /**
     * Get step content
     */
    getStepContent(stepId) {
        // This would be customized based on step type
        const contentMap = {
            'basic-info': `
                <div class="form-group">
                    <label for="featureName">Feature Name</label>
                    <input type="text" id="featureName" class="form-input" required>
                </div>
                <div class="form-group">
                    <label for="featureType">Feature Type</label>
                    <select id="featureType" class="form-select">
                        <option value="feature">Feature</option>
                        <option value="epic">Epic</option>
                        <option value="story">User Story</option>
                    </select>
                </div>
            `,
            'timeline': `
                <div class="form-group">
                    <label for="timelineType">Timeline Type</label>
                    <select id="timelineType" class="form-select">
                        <option value="short">Short (1-2 weeks)</option>
                        <option value="medium">Medium (2-4 weeks)</option>
                        <option value="long">Long (1+ months)</option>
                    </select>
                </div>
            `,
            'review': `
                <div class="review-summary">
                    <h4>Review your feature details</h4>
                    <div id="reviewContent" class="review-content">
                        <!-- Review content will be populated here -->
                    </div>
                </div>
            `
        };
        
        return contentMap[stepId] || '<p>Step content not available</p>';
    },

    /**
     * Update workflow progress
     */
    updateWorkflowProgress(workflow) {
        const progressElement = workflow.container.querySelector('.workflow-progress');
        if (!progressElement) return;
        
        const totalSteps = workflow.steps.length;
        const currentStep = workflow.currentStep + 1;
        const progressPercent = (currentStep / totalSteps) * 100;
        
        progressElement.innerHTML = `
            <div class="progress-bar">
                <div class="progress-fill" style="width: ${progressPercent}%"></div>
            </div>
            <span class="progress-text">Step ${currentStep} of ${totalSteps}</span>
        `;
    },

    /**
     * Show tooltip
     */
    showTooltip(e) {
        const target = e.target;
        const tooltipText = target.dataset.tooltip;
        
        if (!tooltipText || this.state.activeTooltips.has(target)) return;
        
        // Create tooltip element
        const tooltip = document.createElement('div');
        tooltip.className = 'tooltip';
        tooltip.textContent = tooltipText;
        tooltip.id = `tooltip-${Date.now()}`;
        
        // Position tooltip
        this.positionTooltip(tooltip, target);
        
        // Add to DOM
        document.body.appendChild(tooltip);
        
        // Store tooltip reference
        this.state.activeTooltips.set(target, {
            element: tooltip,
            timer: setTimeout(() => this.hideTooltip({ target }), this.config.tooltipDuration)
        });
        
        // Show tooltip with animation
        requestAnimationFrame(() => {
            tooltip.classList.add('visible');
        });
    },

    /**
     * Hide tooltip
     */
    hideTooltip(e) {
        const target = e.target;
        const tooltipInfo = this.state.activeTooltips.get(target);
        
        if (!tooltipInfo) return;
        
        const { element, timer } = tooltipInfo;
        
        // Clear timer
        if (timer) {
            clearTimeout(timer);
        }
        
        // Hide tooltip with animation
        element.classList.remove('visible');
        
        // Remove tooltip after animation
        setTimeout(() => {
            if (element.parentNode) {
                element.parentNode.removeChild(element);
            }
        }, 300);
        
        // Remove from active tooltips
        this.state.activeTooltips.delete(target);
    },

    /**
     * Position tooltip
     */
    positionTooltip(tooltip, target) {
        const targetRect = target.getBoundingClientRect();
        const tooltipRect = tooltip.getBoundingClientRect();
        
        // Calculate position
        let left = targetRect.left + (targetRect.width / 2) - (tooltipRect.width / 2);
        let top = targetRect.top - tooltipRect.height - 10;
        
        // Adjust if tooltip would go off screen
        if (left < 10) left = 10;
        if (left + tooltipRect.width > window.innerWidth - 10) {
            left = window.innerWidth - tooltipRect.width - 10;
        }
        
        if (top < 10) {
            // Show below target instead
            top = targetRect.bottom + 10;
        }
        
        // Set position
        tooltip.style.left = `${left}px`;
        tooltip.style.top = `${top}px`;
    },

    /**
     * Start tutorial
     */
    startTutorial(tutorialId) {
        const tutorial = this.getTutorialDefinition(tutorialId);
        if (!tutorial) return;
        
        this.state.activeTutorial = {
            id: tutorialId,
            definition: tutorial,
            currentStep: 0,
            startTime: Date.now()
        };
        
        // Show tutorial container
        const container = document.getElementById('tutorialContainer');
        if (container) {
            container.classList.add('active');
        }
        
        // Show first step
        this.showTutorialStep(0);
        
        // Record interaction pattern
        this.recordInteractionPattern('tutorial-start', document.body, { tutorialId });
    },

    /**
     * Get tutorial definition
     */
    getTutorialDefinition(tutorialId) {
        const tutorials = {
            'getting-started': {
                title: 'Getting Started',
                steps: [
                    {
                        title: 'Welcome to Platform Roadmap',
                        content: 'Let\'s take a quick tour of the main features.',
                        target: '.header',
                        position: 'bottom'
                    },
                    {
                        title: 'Feature Management',
                        content: 'Here you can view and manage all your platform features.',
                        target: '.feature-grid',
                        position: 'right'
                    },
                    {
                        title: 'AI Assistance',
                        content: 'Get AI-powered insights and enhancement suggestions.',
                        target: '.btn-ai-create',
                        position: 'left'
                    }
                ]
            },
            'advanced-features': {
                title: 'Advanced Features',
                steps: [
                    {
                        title: 'Graph Visualization',
                        content: 'Visualize feature relationships and dependencies.',
                        target: '.graph-view',
                        position: 'bottom'
                    },
                    {
                        title: 'Analytics Dashboard',
                        content: 'Track progress and get insights.',
                        target: '.insights-panel',
                        position: 'left'
                    }
                ]
            }
        };
        
        return tutorials[tutorialId];
    },

    /**
     * Show tutorial step
     */
    showTutorialStep(stepIndex) {
        const tutorial = this.state.activeTutorial;
        if (!tutorial) return;
        
        const step = tutorial.definition.steps[stepIndex];
        if (!step) return;
        
        // Update tutorial state
        tutorial.currentStep = stepIndex;
        
        // Update tutorial content
        this.updateTutorialContent(step);
        
        // Highlight target element
        this.highlightTutorialTarget(step);
        
        // Update tutorial navigation
        this.updateTutorialNavigation(tutorial);
    },

    /**
     * Update tutorial content
     */
    updateTutorialContent(step) {
        const titleElement = document.getElementById('tutorialTitle');
        const bodyElement = document.getElementById('tutorialBody');
        
        if (titleElement) titleElement.textContent = step.title;
        if (bodyElement) bodyElement.textContent = step.content;
    },

    /**
     * Highlight tutorial target
     */
    highlightTutorialTarget(step) {
        // Remove previous highlights
        document.querySelectorAll('.tutorial-highlight').forEach(el => {
            el.classList.remove('tutorial-highlight');
        });
        
        // Add highlight to target
        const target = document.querySelector(step.target);
        if (target) {
            target.classList.add('tutorial-highlight');
        }
    },

    /**
     * Record interaction pattern
     */
    recordInteractionPattern(type, target, data = {}) {
        const timestamp = Date.now();
        const targetInfo = this.getTargetInfo(target);
        
        const pattern = {
            type,
            timestamp,
            target: targetInfo,
            data,
            sessionId: this.getSessionId()
        };
        
        // Update interaction patterns
        const patterns = this.state.interactionPatterns.get(type) || [];
        patterns.push(pattern);
        
        // Limit pattern history
        if (patterns.length > 100) {
            patterns.shift();
        }
        
        this.state.interactionPatterns.set(type, patterns);
        
        // Update user preferences based on patterns
        this.updateUserPreferences(pattern);
    },

    /**
     * Get target information
     */
    getTargetInfo(target) {
        return {
            tagName: target.tagName,
            id: target.id,
            className: target.className,
            textContent: target.textContent?.substring(0, 50),
            dataset: { ...target.dataset }
        };
    },

    /**
     * Get session ID
     */
    getSessionId() {
        let sessionId = sessionStorage.getItem('interactionSessionId');
        if (!sessionId) {
            sessionId = Date.now().toString();
            sessionStorage.setItem('interactionSessionId', sessionId);
        }
        return sessionId;
    },

    /**
     * Update user preferences
     */
    updateUserPreferences(pattern) {
        // Update preferences based on interaction patterns
        switch (pattern.type) {
            case 'tap':
                this.updatePreference('preferredInteraction', 'tap');
                break;
            case 'swipe':
                this.updatePreference('preferredInteraction', 'swipe');
                break;
            case 'inline-edit-start':
                this.updatePreference('inlineEditingEnabled', true);
                break;
            case 'tutorial-start':
                this.updatePreference('tutorialsEnabled', true);
                break;
        }
    },

    /**
     * Update preference
     */
    updatePreference(key, value) {
        this.state.userPreferences.set(key, value);
        this.saveUserPreferences();
    },

    /**
     * Save user preferences
     */
    saveUserPreferences() {
        const preferences = Object.fromEntries(this.state.userPreferences);
        localStorage.setItem('interactionUserPreferences', JSON.stringify(preferences));
    },

    /**
     * Load user preferences
     */
    loadUserPreferences() {
        try {
            const saved = localStorage.getItem('interactionUserPreferences');
            if (saved) {
                const preferences = JSON.parse(saved);
                this.state.userPreferences = new Map(Object.entries(preferences));
            }
        } catch (error) {
            console.warn('Failed to load user preferences:', error);
        }
    },

    /**
     * Setup performance monitoring
     */
    setupPerformanceMonitoring() {
        // Monitor interaction performance
        if ('PerformanceObserver' in window) {
            const observer = new PerformanceObserver((list) => {
                list.getEntries().forEach((entry) => {
                    if (entry.name.includes('interaction')) {
                        this.recordInteractionMetric(entry.name, entry.duration);
                    }
                });
            });
            
            observer.observe({ entryTypes: ['measure'] });
        }
    },

    /**
     * Record interaction metric
     */
    recordInteractionMetric(interactionType, duration) {
        const metrics = this.state.interactionMetrics.get(interactionType) || {
            count: 0,
            totalDuration: 0,
            averageDuration: 0,
            minDuration: Infinity,
            maxDuration: 0
        };
        
        metrics.count++;
        metrics.totalDuration += duration;
        metrics.averageDuration = metrics.totalDuration / metrics.count;
        metrics.minDuration = Math.min(metrics.minDuration, duration);
        metrics.maxDuration = Math.max(metrics.maxDuration, duration);
        
        this.state.interactionMetrics.set(interactionType, metrics);
    },

    /**
     * Show saving indicator
     */
    showSavingIndicator(element) {
        const indicator = document.createElement('div');
        indicator.className = 'saving-indicator';
        indicator.textContent = 'Saving...';
        
        element.appendChild(indicator);
        
        setTimeout(() => {
            if (indicator.parentNode) {
                indicator.parentNode.removeChild(indicator);
            }
        }, 2000);
    },

    /**
     * Show save success indicator
     */
    showSaveSuccessIndicator(element) {
        const indicator = document.createElement('div');
        indicator.className = 'save-success-indicator';
        indicator.textContent = 'Saved!';
        
        element.appendChild(indicator);
        
        setTimeout(() => {
            if (indicator.parentNode) {
                indicator.parentNode.removeChild(indicator);
            }
        }, 2000);
    },

    /**
     * Show drop success indicator
     */
    showDropSuccessIndicator(dropZone) {
        dropZone.classList.add('drop-success');
        
        setTimeout(() => {
            dropZone.classList.remove('drop-success');
        }, 1000);
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
    }
};

// Initialize on DOM ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => interactionFlows.initialize());
} else {
    interactionFlows.initialize();
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = interactionFlows;
}

// Make available globally
window.interactionFlows = interactionFlows;