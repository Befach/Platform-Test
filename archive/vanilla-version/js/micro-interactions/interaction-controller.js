/**
 * Micro-Interactions Controller
 * 
 * Comprehensive micro-interaction management with:
 * - Sophisticated hover effects with depth perception
 * - Magnetic cursor effects for interactive elements
 * - Ripple effects on button clicks and touches
 * - Staggered animations for component groups
 * - Advanced focus states with glowing indicators
 * - Touch and gesture feedback systems
 * - Performance-optimized with GPU acceleration
 * - Accessibility-compliant with reduced motion support
 * 
 * @version 1.0.0
 * @author Frontend Specialist
 */

const interactionController = {
    /**
     * Configuration
     */
    config: {
        // Animation settings
        animationDuration: 300,
        staggerDelay: 100,
        magneticStrength: 0.3,
        rippleDuration: 600,
        
        // Performance settings
        maxConcurrentAnimations: 10,
        gpuAcceleration: true,
        reducedMotion: false,
        
        // Touch settings
        touchThreshold: 10,
        longPressDuration: 500,
        doubleTapTimeout: 300,
        
        // Focus settings
        focusGlowDuration: 2000,
        focusTrapEnabled: true,
        
        // Accessibility settings
        respectReducedMotion: true,
        highContrastMode: false
    },

    /**
     * State management
     */
    state: {
        // Animation tracking
        activeAnimations: new Map(),
        animationQueue: [],
        isAnimating: false,
        
        // Magnetic cursor tracking
        magneticElements: new Map(),
        cursorPosition: { x: 0, y: 0 },
        isMagneticActive: false,
        
        // Touch tracking
        touchStartPoint: null,
        touchStartTime: null,
        longPressTimer: null,
        lastTapTime: 0,
        
        // Focus tracking
        focusedElement: null,
        focusHistory: [],
        focusTrapActive: false,
        
        // Ripple tracking
        rippleElements: new Map(),
        activeRipples: new Map(),
        
        // Performance tracking
        animationMetrics: new Map(),
        frameCount: 0,
        lastFrameTime: 0,
        
        // Accessibility state
        reducedMotionPreference: false,
        highContrastPreference: false
    },

    /**
     * Initialize interaction controller
     */
    initialize() {
        console.log('🎯 Initializing Micro-Interactions Controller...');
        
        // Check accessibility preferences
        this.checkAccessibilityPreferences();
        
        // Setup magnetic cursor effects
        this.setupMagneticCursor();
        
        // Setup ripple effects
        this.setupRippleEffects();
        
        // Setup advanced hover effects
        this.setupAdvancedHover();
        
        // Setup focus management
        this.setupFocusManagement();
        
        // Setup touch interactions
        this.setupTouchInteractions();
        
        // Setup staggered animations
        this.setupStaggeredAnimations();
        
        // Setup performance monitoring
        this.setupPerformanceMonitoring();
        
        // Setup accessibility features
        this.setupAccessibilityFeatures();
        
        console.log('✅ Micro-Interactions Controller initialized');
    },

    /**
     * Check accessibility preferences
     */
    checkAccessibilityPreferences() {
        // Check for reduced motion preference
        if (window.matchMedia) {
            const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
            this.state.reducedMotionPreference = reducedMotionQuery.matches;
            this.config.reducedMotion = reducedMotionQuery.matches;
            
            reducedMotionQuery.addEventListener('change', (e) => {
                this.state.reducedMotionPreference = e.matches;
                this.config.reducedMotion = e.matches;
                this.updateAnimationSettings();
            });
            
            // Check for high contrast preference
            const highContrastQuery = window.matchMedia('(prefers-contrast: high)');
            this.state.highContrastPreference = highContrastQuery.matches;
            this.config.highContrastMode = highContrastQuery.matches;
            
            highContrastQuery.addEventListener('change', (e) => {
                this.state.highContrastPreference = e.matches;
                this.config.highContrastMode = e.matches;
                this.updateContrastSettings();
            });
        }
    },

    /**
     * Setup magnetic cursor effects
     */
    setupMagneticCursor() {
        const magneticElements = document.querySelectorAll('.magnetic-cursor');
        
        magneticElements.forEach(element => {
            this.state.magneticElements.set(element, {
                element,
                originalPosition: { x: 0, y: 0 },
                currentPosition: { x: 0, y: 0 },
                isActive: false
            });
        });
        
        // Track cursor movement
        document.addEventListener('mousemove', (e) => {
            this.state.cursorPosition = { x: e.clientX, y: e.clientY };
            this.updateMagneticElements(e);
        });
        
        // Handle mouse enter/leave for magnetic elements
        magneticElements.forEach(element => {
            element.addEventListener('mouseenter', () => {
                this.activateMagneticEffect(element);
            });
            
            element.addEventListener('mouseleave', () => {
                this.deactivateMagneticEffect(element);
            });
        });
    },

    /**
     * Update magnetic elements based on cursor position
     */
    updateMagneticElements(e) {
        if (this.config.reducedMotion) return;
        
        this.state.magneticElements.forEach((magneticData, element) => {
            if (!magneticData.isActive) return;
            
            const rect = element.getBoundingClientRect();
            const centerX = rect.left + rect.width / 2;
            const centerY = rect.top + rect.height / 2;
            
            const deltaX = (e.clientX - centerX) * this.config.magneticStrength;
            const deltaY = (e.clientY - centerY) * this.config.magneticStrength;
            
            // Apply smooth transformation
            element.style.transform = `translate(${deltaX}px, ${deltaY}px) scale(1.02)`;
            
            magneticData.currentPosition = { x: deltaX, y: deltaY };
        });
    },

    /**
     * Activate magnetic effect for an element
     */
    activateMagneticEffect(element) {
        const magneticData = this.state.magneticElements.get(element);
        if (!magneticData) return;
        
        magneticData.isActive = true;
        element.setAttribute('data-magnetic', 'active');
        element.classList.add('magnetic-active');
        
        // Add transition for smooth movement
        element.style.transition = 'transform 0.1s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
    },

    /**
     * Deactivate magnetic effect for an element
     */
    deactivateMagneticEffect(element) {
        const magneticData = this.state.magneticElements.get(element);
        if (!magneticData) return;
        
        magneticData.isActive = false;
        element.removeAttribute('data-magnetic');
        element.classList.remove('magnetic-active');
        
        // Reset position with smooth transition
        element.style.transform = 'translate(0, 0) scale(1)';
        
        // Remove transition after animation
        setTimeout(() => {
            element.style.transition = '';
        }, this.config.animationDuration);
    },

    /**
     * Setup ripple effects
     */
    setupRippleEffects() {
        const rippleElements = document.querySelectorAll('.ripple-effect, .touch-ripple');
        
        rippleElements.forEach(element => {
            this.state.rippleElements.set(element, {
                element,
                rippleCount: 0
            });
            
            // Mouse events
            element.addEventListener('mousedown', (e) => this.createRipple(e, element));
            
            // Touch events
            element.addEventListener('touchstart', (e) => this.createRipple(e, element), { passive: true });
        });
    },

    /**
     * Create ripple effect
     */
    createRipple(event, element) {
        if (this.config.reducedMotion) return;
        
        const rippleData = this.state.rippleElements.get(element);
        if (!rippleData) return;
        
        // Get ripple position
        const rect = element.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        const x = (event.clientX || event.touches[0].clientX) - rect.left - size / 2;
        const y = (event.clientY || event.touches[0].clientY) - rect.top - size / 2;
        
        // Create ripple element
        const ripple = document.createElement('span');
        ripple.className = 'ripple-ripple';
        ripple.style.width = ripple.style.height = size + 'px';
        ripple.style.left = x + 'px';
        ripple.style.top = y + 'px';
        
        // Add ripple to element
        element.appendChild(ripple);
        
        // Track ripple
        const rippleId = `ripple-${Date.now()}-${Math.random()}`;
        this.state.activeRipples.set(rippleId, {
            element: ripple,
            parent: element,
            startTime: Date.now()
        });
        
        // Animate ripple
        requestAnimationFrame(() => {
            ripple.classList.add('ripple-active');
        });
        
        // Remove ripple after animation
        setTimeout(() => {
            if (ripple.parentNode) {
                ripple.parentNode.removeChild(ripple);
            }
            this.state.activeRipples.delete(rippleId);
        }, this.config.rippleDuration);
        
        // Update ripple count
        rippleData.rippleCount++;
    },

    /**
     * Setup advanced hover effects
     */
    setupAdvancedHover() {
        const hoverElements = document.querySelectorAll('.hover-lift-advanced, .hover-gradient-shift');
        
        hoverElements.forEach(element => {
            // Mouse enter
            element.addEventListener('mouseenter', (e) => {
                this.handleHoverEnter(e, element);
            });
            
            // Mouse leave
            element.addEventListener('mouseleave', (e) => {
                this.handleHoverLeave(e, element);
            });
            
            // Mouse move for 3D effects
            element.addEventListener('mousemove', (e) => {
                this.handleHoverMove(e, element);
            });
        });
    },

    /**
     * Handle hover enter
     */
    handleHoverEnter(event, element) {
        if (this.config.reducedMotion) return;
        
        element.classList.add('hover-active');
        
        // Add GPU acceleration
        if (this.config.gpuAcceleration) {
            element.style.transform = 'translateZ(0)';
            element.style.willChange = 'transform';
        }
        
        // Trigger hover animation
        this.triggerAnimation(element, 'hover-enter');
    },

    /**
     * Handle hover leave
     */
    handleHoverLeave(event, element) {
        element.classList.remove('hover-active');
        
        // Reset transform
        if (this.config.gpuAcceleration) {
            element.style.transform = '';
            element.style.willChange = 'auto';
        }
        
        // Trigger hover animation
        this.triggerAnimation(element, 'hover-leave');
    },

    /**
     * Handle hover move for 3D effects
     */
    handleHoverMove(event, element) {
        if (this.config.reducedMotion) return;
        
        if (!element.classList.contains('hover-active')) return;
        
        const rect = element.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        
        const deltaX = ((event.clientX - centerX) / rect.width) * 20;
        const deltaY = ((event.clientY - centerY) / rect.height) * 20;
        
        // Apply 3D transform
        element.style.transform = `translateZ(0) rotateX(${-deltaY}deg) rotateY(${deltaX}deg)`;
    },

    /**
     * Setup focus management
     */
    setupFocusManagement() {
        // Track focus changes
        document.addEventListener('focusin', (e) => {
            this.handleFocusIn(e);
        });
        
        document.addEventListener('focusout', (e) => {
            this.handleFocusOut(e);
        });
        
        // Setup focus trap for modals
        this.setupFocusTrap();
        
        // Setup keyboard navigation
        this.setupKeyboardNavigation();
    },

    /**
     * Handle focus in
     */
    handleFocusIn(event) {
        const element = event.target;
        this.state.focusedElement = element;
        
        // Add focus history
        this.state.focusHistory.push({
            element,
            timestamp: Date.now()
        });
        
        // Limit history size
        if (this.state.focusHistory.length > 10) {
            this.state.focusHistory.shift();
        }
        
        // Apply focus effects
        if (element.classList.contains('focus-glow')) {
            this.applyFocusGlow(element);
        }
        
        if (element.classList.contains('focus-inset')) {
            this.applyFocusInset(element);
        }
        
        if (element.classList.contains('keyboard-nav')) {
            this.applyKeyboardNavFocus(element);
        }
        
        // Trigger focus animation
        this.triggerAnimation(element, 'focus-enter');
    },

    /**
     * Handle focus out
     */
    handleFocusOut(event) {
        const element = event.target;
        
        // Remove focus effects
        if (element.classList.contains('focus-glow')) {
            this.removeFocusGlow(element);
        }
        
        if (element.classList.contains('keyboard-nav')) {
            this.removeKeyboardNavFocus(element);
        }
        
        // Trigger focus animation
        this.triggerAnimation(element, 'focus-leave');
        
        // Clear focused element if it's the same
        if (this.state.focusedElement === element) {
            this.state.focusedElement = null;
        }
    },

    /**
     * Apply focus glow effect
     */
    applyFocusGlow(element) {
        element.classList.add('focus-glow-active');
        
        // Create glow effect if not exists
        if (!element.querySelector('.focus-glow-effect')) {
            const glowEffect = document.createElement('div');
            glowEffect.className = 'focus-glow-effect';
            element.appendChild(glowEffect);
        }
        
        // Animate glow
        const glowEffect = element.querySelector('.focus-glow-effect');
        if (glowEffect) {
            glowEffect.style.animation = `focusGlowPulse ${this.config.focusGlowDuration}ms ease infinite`;
        }
    },

    /**
     * Remove focus glow effect
     */
    removeFocusGlow(element) {
        element.classList.remove('focus-glow-active');
        
        const glowEffect = element.querySelector('.focus-glow-effect');
        if (glowEffect) {
            glowEffect.style.animation = '';
        }
    },

    /**
     * Apply focus inset effect
     */
    applyFocusInset(element) {
        element.classList.add('focus-inset-active');
    },

    /**
     * Remove focus inset effect
     */
    removeFocusInset(element) {
        element.classList.remove('focus-inset-active');
    },

    /**
     * Apply keyboard navigation focus
     */
    applyKeyboardNavFocus(element) {
        element.classList.add('keyboard-nav-active');
        
        // Add keyboard indicator
        if (!element.querySelector('.keyboard-nav-indicator')) {
            const indicator = document.createElement('div');
            indicator.className = 'keyboard-nav-indicator';
            indicator.innerHTML = '⌨️';
            element.appendChild(indicator);
        }
    },

    /**
     * Remove keyboard navigation focus
     */
    removeKeyboardNavFocus(element) {
        element.classList.remove('keyboard-nav-active');
        
        const indicator = element.querySelector('.keyboard-nav-indicator');
        if (indicator) {
            indicator.remove();
        }
    },

    /**
     * Setup focus trap
     */
    setupFocusTrap() {
        // Find focus trap containers
        const focusTrapContainers = document.querySelectorAll('.focus-trap');
        
        focusTrapContainers.forEach(container => {
            container.addEventListener('keydown', (e) => {
                if (e.key === 'Tab') {
                    this.handleFocusTrap(e, container);
                }
            });
        });
    },

    /**
     * Handle focus trap
     */
    handleFocusTrap(event, container) {
        const focusableElements = container.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        
        if (focusableElements.length === 0) return;
        
        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];
        
        if (event.shiftKey) {
            // Shift + Tab
            if (document.activeElement === firstElement) {
                event.preventDefault();
                lastElement.focus();
            }
        } else {
            // Tab
            if (document.activeElement === lastElement) {
                event.preventDefault();
                firstElement.focus();
            }
        }
    },

    /**
     * Setup keyboard navigation
     */
    setupKeyboardNavigation() {
        document.addEventListener('keydown', (e) => {
            // Handle arrow key navigation
            if (e.key === 'ArrowUp' || e.key === 'ArrowDown' || e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
                this.handleArrowKeyNavigation(e);
            }
            
            // Handle Enter/Space for activation
            if (e.key === 'Enter' || e.key === ' ') {
                this.handleActivationKey(e);
            }
            
            // Handle Escape for cancellation
            if (e.key === 'Escape') {
                this.handleEscapeKey(e);
            }
        });
    },

    /**
     * Handle arrow key navigation
     */
    handleArrowKeyNavigation(event) {
        // Implementation for custom arrow key navigation
        // This would be customized based on the specific navigation patterns
    },

    /**
     * Handle activation key
     */
    handleActivationKey(event) {
        if (event.target.classList.contains('keyboard-nav')) {
            event.preventDefault();
            event.target.click();
        }
    },

    /**
     * Handle escape key
     */
    handleEscapeKey(event) {
        // Close modals, cancel operations, etc.
        const activeModal = document.querySelector('.modal-overlay.active');
        if (activeModal) {
            activeModal.classList.remove('active');
        }
    },

    /**
     * Setup touch interactions
     */
    setupTouchInteractions() {
        const touchElements = document.querySelectorAll('.haptic-feedback, .touch-ripple');
        
        touchElements.forEach(element => {
            // Touch start
            element.addEventListener('touchstart', (e) => {
                this.handleTouchStart(e, element);
            }, { passive: false });
            
            // Touch end
            element.addEventListener('touchend', (e) => {
                this.handleTouchEnd(e, element);
            }, { passive: false });
            
            // Touch move
            element.addEventListener('touchmove', (e) => {
                this.handleTouchMove(e, element);
            }, { passive: false });
        });
    },

    /**
     * Handle touch start
     */
    handleTouchStart(event, element) {
        const touch = event.touches[0];
        this.state.touchStartPoint = {
            x: touch.clientX,
            y: touch.clientY,
            time: Date.now()
        };
        
        // Start long press timer
        this.state.longPressTimer = setTimeout(() => {
            this.handleLongPress(element);
        }, this.config.longPressDuration);
        
        // Apply haptic feedback
        if (element.classList.contains('haptic-feedback')) {
            this.applyHapticFeedback(element, 'light');
        }
        
        // Prevent default for certain touch interactions
        if (element.classList.contains('prevent-default-touch')) {
            event.preventDefault();
        }
    },

    /**
     * Handle touch end
     */
    handleTouchEnd(event, element) {
        if (!this.state.touchStartPoint) return;
        
        const touch = event.changedTouches[0];
        const deltaX = touch.clientX - this.state.touchStartPoint.x;
        const deltaY = touch.clientY - this.state.touchStartPoint.y;
        const deltaTime = Date.now() - this.state.touchStartPoint.time;
        
        // Clear long press timer
        if (this.state.longPressTimer) {
            clearTimeout(this.state.longPressTimer);
            this.state.longPressTimer = null;
        }
        
        // Determine touch gesture
        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
        
        if (distance < this.config.touchThreshold && deltaTime < 200) {
            // Tap gesture
            this.handleTap(element);
        } else if (deltaTime < this.config.longPressDuration) {
            // Swipe gesture
            this.handleSwipe(element, deltaX, deltaY);
        }
        
        // Reset touch state
        this.state.touchStartPoint = null;
    },

    /**
     * Handle touch move
     */
    handleTouchMove(event, element) {
        if (!this.state.touchStartPoint) return;
        
        const touch = event.touches[0];
        const deltaX = touch.clientX - this.state.touchStartPoint.x;
        const deltaY = touch.clientY - this.state.touchStartPoint.y;
        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
        
        // Cancel long press if moved too much
        if (distance > this.config.touchThreshold) {
            if (this.state.longPressTimer) {
                clearTimeout(this.state.longPressTimer);
                this.state.longPressTimer = null;
            }
        }
    },

    /**
     * Handle tap gesture
     */
    handleTap(element) {
        const currentTime = Date.now();
        const timeSinceLastTap = currentTime - this.state.lastTapTime;
        
        if (timeSinceLastTap < this.config.doubleTapTimeout) {
            // Double tap
            this.handleDoubleTap(element);
        } else {
            // Single tap
            this.handleSingleTap(element);
        }
        
        this.state.lastTapTime = currentTime;
    },

    /**
     * Handle single tap
     */
    handleSingleTap(element) {
        // Apply haptic feedback
        if (element.classList.contains('haptic-feedback')) {
            this.applyHapticFeedback(element, 'medium');
        }
        
        // Trigger tap animation
        this.triggerAnimation(element, 'tap');
    },

    /**
     * Handle double tap
     */
    handleDoubleTap(element) {
        // Apply haptic feedback
        if (element.classList.contains('haptic-feedback')) {
            this.applyHapticFeedback(element, 'heavy');
        }
        
        // Trigger double tap animation
        this.triggerAnimation(element, 'double-tap');
    },

    /**
     * Handle long press
     */
    handleLongPress(element) {
        // Apply haptic feedback
        if (element.classList.contains('haptic-feedback')) {
            this.applyHapticFeedback(element, 'heavy');
        }
        
        // Trigger long press animation
        this.triggerAnimation(element, 'long-press');
        
        // Dispatch long press event
        element.dispatchEvent(new CustomEvent('longpress', {
            detail: { element, timestamp: Date.now() }
        }));
    },

    /**
     * Handle swipe gesture
     */
    handleSwipe(element, deltaX, deltaY) {
        const direction = this.getSwipeDirection(deltaX, deltaY);
        
        // Apply haptic feedback
        if (element.classList.contains('haptic-feedback')) {
            this.applyHapticFeedback(element, 'light');
        }
        
        // Trigger swipe animation
        this.triggerAnimation(element, 'swipe', { direction, deltaX, deltaY });
        
        // Dispatch swipe event
        element.dispatchEvent(new CustomEvent('swipe', {
            detail: { element, direction, deltaX, deltaY, timestamp: Date.now() }
        }));
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
     * Apply haptic feedback
     */
    applyHapticFeedback(element, intensity) {
        if (this.config.reducedMotion) return;
        
        element.classList.add('haptic-active');
        element.setAttribute('data-haptic', intensity);
        
        // Visual feedback
        switch (intensity) {
            case 'light':
                element.style.transform = 'scale(0.99)';
                break;
            case 'medium':
                element.style.transform = 'scale(0.97)';
                break;
            case 'heavy':
                element.style.transform = 'scale(0.95)';
                break;
        }
        
        // Reset after animation
        setTimeout(() => {
            element.classList.remove('haptic-active');
            element.style.transform = '';
        }, 200);
    },

    /**
     * Setup staggered animations
     */
    setupStaggeredAnimations() {
        const staggerContainers = document.querySelectorAll('.stagger-container');
        
        staggerContainers.forEach(container => {
            // Observe container for visibility
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        this.triggerStaggeredAnimation(container);
                        observer.unobserve(container);
                    }
                });
            }, { threshold: 0.1 });
            
            observer.observe(container);
        });
    },

    /**
     * Trigger staggered animation
     */
    triggerStaggeredAnimation(container) {
        const items = container.querySelectorAll('.stagger-item');
        
        items.forEach((item, index) => {
            const delay = index * this.config.staggerDelay;
            
            setTimeout(() => {
                item.classList.add('stagger-animate');
                this.triggerAnimation(item, 'stagger-enter');
            }, delay);
        });
    },

    /**
     * Trigger animation
     */
    triggerAnimation(element, animationType, options = {}) {
        if (this.config.reducedMotion) return;
        
        // Check animation limit
        if (this.state.activeAnimations.size >= this.config.maxConcurrentAnimations) {
            this.state.animationQueue.push({ element, animationType, options });
            return;
        }
        
        // Create animation ID
        const animationId = `animation-${Date.now()}-${Math.random()}`;
        
        // Track animation
        this.state.activeAnimations.set(animationId, {
            element,
            animationType,
            options,
            startTime: Date.now()
        });
        
        // Add animation class
        element.classList.add(`animate-${animationType}`);
        
        // Apply GPU acceleration if enabled
        if (this.config.gpuAcceleration) {
            element.style.transform = 'translateZ(0)';
            element.style.willChange = 'transform, opacity';
        }
        
        // Remove animation class after duration
        const duration = options.duration || this.config.animationDuration;
        setTimeout(() => {
            element.classList.remove(`animate-${animationType}`);
            
            // Reset will-change
            if (this.config.gpuAcceleration) {
                element.style.willChange = 'auto';
            }
            
            // Remove from active animations
            this.state.activeAnimations.delete(animationId);
            
            // Process animation queue
            this.processAnimationQueue();
            
            // Record animation metrics
            this.recordAnimationMetrics(animationType, duration);
        }, duration);
        
        // Dispatch animation event
        element.dispatchEvent(new CustomEvent('animationStart', {
            detail: { animationType, options, animationId }
        }));
    },

    /**
     * Process animation queue
     */
    processAnimationQueue() {
        if (this.state.animationQueue.length === 0) return;
        
        const nextAnimation = this.state.animationQueue.shift();
        this.triggerAnimation(nextAnimation.element, nextAnimation.animationType, nextAnimation.options);
    },

    /**
     * Record animation metrics
     */
    recordAnimationMetrics(animationType, duration) {
        const metrics = this.state.animationMetrics.get(animationType) || {
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
        
        this.state.animationMetrics.set(animationType, metrics);
    },

    /**
     * Setup performance monitoring
     */
    setupPerformanceMonitoring() {
        // Monitor frame rate
        this.monitorFrameRate();
        
        // Monitor animation performance
        if ('PerformanceObserver' in window) {
            const observer = new PerformanceObserver((list) => {
                list.getEntries().forEach((entry) => {
                    if (entry.name.includes('animation')) {
                        this.recordPerformanceMetric(entry);
                    }
                });
            });
            
            observer.observe({ entryTypes: ['measure', 'paint'] });
        }
    },

    /**
     * Monitor frame rate
     */
    monitorFrameRate() {
        const measureFrameRate = (timestamp) => {
            if (this.state.lastFrameTime) {
                const deltaTime = timestamp - this.state.lastFrameTime;
                const frameRate = 1000 / deltaTime;
                
                // Log low frame rate warnings
                if (frameRate < 30) {
                    console.warn(`Low frame rate detected: ${frameRate.toFixed(2)}fps`);
                }
            }
            
            this.state.lastFrameTime = timestamp;
            this.state.frameCount++;
            
            requestAnimationFrame(measureFrameRate);
        };
        
        requestAnimationFrame(measureFrameRate);
    },

    /**
     * Record performance metric
     */
    recordPerformanceMetric(entry) {
        // This would send performance data to analytics service
        console.log(`Performance metric: ${entry.name} - ${entry.duration.toFixed(2)}ms`);
    },

    /**
     * Setup accessibility features
     */
    setupAccessibilityFeatures() {
        // Setup reduced motion support
        if (this.config.respectReducedMotion && this.config.reducedMotion) {
            this.disableAnimations();
        }
        
        // Setup high contrast mode support
        if (this.config.highContrastMode) {
            this.enableHighContrast();
        }
        
        // Setup screen reader support
        this.setupScreenReaderSupport();
    },

    /**
     * Disable animations
     */
    disableAnimations() {
        document.body.classList.add('reduced-motion');
        
        // Disable all animation classes
        const animatedElements = document.querySelectorAll('[class*="animate-"], [class*="hover-"], [class*="focus-"]');
        animatedElements.forEach(element => {
            element.style.transition = 'none';
            element.style.animation = 'none';
        });
    },

    /**
     * Enable high contrast
     */
    enableHighContrast() {
        document.body.classList.add('high-contrast');
        
        // Increase border widths and contrast
        const interactiveElements = document.querySelectorAll('button, a, input, select, textarea');
        interactiveElements.forEach(element => {
            element.style.borderWidth = '2px';
        });
    },

    /**
     * Setup screen reader support
     */
    setupScreenReaderSupport() {
        // Add ARIA labels for interactive elements
        const interactiveElements = document.querySelectorAll('.magnetic-cursor, .ripple-effect, .hover-lift-advanced');
        
        interactiveElements.forEach(element => {
            if (!element.getAttribute('aria-label')) {
                element.setAttribute('aria-label', 'Interactive element');
            }
        });
        
        // Add live regions for dynamic content
        this.addLiveRegions();
    },

    /**
     * Add live regions
     */
    addLiveRegions() {
        // Create status live region
        if (!document.getElementById('status-live-region')) {
            const statusRegion = document.createElement('div');
            statusRegion.id = 'status-live-region';
            statusRegion.className = 'sr-only';
            statusRegion.setAttribute('aria-live', 'polite');
            statusRegion.setAttribute('aria-atomic', 'true');
            document.body.appendChild(statusRegion);
        }
        
        // Create alert live region
        if (!document.getElementById('alert-live-region')) {
            const alertRegion = document.createElement('div');
            alertRegion.id = 'alert-live-region';
            alertRegion.className = 'sr-only';
            alertRegion.setAttribute('aria-live', 'assertive');
            alertRegion.setAttribute('aria-atomic', 'true');
            document.body.appendChild(alertRegion);
        }
    },

    /**
     * Update animation settings
     */
    updateAnimationSettings() {
        if (this.config.reducedMotion) {
            this.disableAnimations();
        } else {
            this.enableAnimations();
        }
    },

    /**
     * Update contrast settings
     */
    updateContrastSettings() {
        if (this.config.highContrastMode) {
            this.enableHighContrast();
        } else {
            this.disableHighContrast();
        }
    },

    /**
     * Enable animations
     */
    enableAnimations() {
        document.body.classList.remove('reduced-motion');
        
        // Re-enable animations for elements
        const animatedElements = document.querySelectorAll('[class*="animate-"], [class*="hover-"], [class*="focus-"]');
        animatedElements.forEach(element => {
            element.style.transition = '';
            element.style.animation = '';
        });
    },

    /**
     * Disable high contrast
     */
    disableHighContrast() {
        document.body.classList.remove('high-contrast');
        
        // Reset border widths
        const interactiveElements = document.querySelectorAll('button, a, input, select, textarea');
        interactiveElements.forEach(element => {
            element.style.borderWidth = '';
        });
    },

    /**
     * Get animation metrics
     */
    getAnimationMetrics() {
        return Object.fromEntries(this.state.animationMetrics);
    },

    /**
     * Get performance metrics
     */
    getPerformanceMetrics() {
        return {
            frameRate: this.state.frameCount > 0 ? 1000 / (this.state.lastFrameTime - (this.state.lastFrameTime - 16)) : 0,
            activeAnimations: this.state.activeAnimations.size,
            queuedAnimations: this.state.animationQueue.length,
            totalAnimations: this.state.animationMetrics.size
        };
    },

    /**
     * Destroy interaction controller
     */
    destroy() {
        // Clean up event listeners
        document.removeEventListener('mousemove', this.updateMagneticElements);
        document.removeEventListener('focusin', this.handleFocusIn);
        document.removeEventListener('focusout', this.handleFocusOut);
        
        // Clean up state
        this.state.activeAnimations.clear();
        this.state.magneticElements.clear();
        this.state.rippleElements.clear();
        this.state.activeRipples.clear();
        this.state.animationMetrics.clear();
        
        console.log('🗑️ Micro-Interactions Controller destroyed');
    }
};

// Initialize on DOM ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => interactionController.initialize());
} else {
    interactionController.initialize();
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = interactionController;
}

// Make available globally
window.interactionController = interactionController;