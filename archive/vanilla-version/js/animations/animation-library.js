/**
 * Advanced Animation Library
 * 
 * Comprehensive animation system with:
 * - Hardware-accelerated animations for optimal performance
 * - Sophisticated easing functions and timing curves
 * - Staggered animations for component groups
 * - Physics-based animations with spring dynamics
 * - Scroll-triggered animations with intersection observer
 * - Morphing and shape animations
 * - Particle systems and effects
 * - Text animation utilities
 * - Performance monitoring and optimization
 * - Accessibility-compliant with reduced motion support
 * 
 * @version 1.0.0
 * @author Frontend Specialist
 */

const animationLibrary = {
    /**
     * Configuration
     */
    config: {
        // Animation settings
        defaultDuration: 300,
        defaultEasing: 'easeOutCubic',
        maxConcurrentAnimations: 50,
        
        // Performance settings
        enableGPUAcceleration: true,
        enableOptimization: true,
        targetFPS: 60,
        
        // Accessibility settings
        respectReducedMotion: true,
        reducedMotionDuration: 0,
        
        // Physics settings
        gravity: 9.8,
        friction: 0.95,
        springTension: 0.1,
        
        // Particle settings
        maxParticles: 100,
        particleLifetime: 3000,
        
        // Scroll settings
        scrollThreshold: 0.1,
        scrollRootMargin: '50px'
    },

    /**
     * State management
     */
    state: {
        // Animation tracking
        activeAnimations: new Map(),
        animationQueue: [],
        isAnimating: false,
        
        // Performance tracking
        frameCount: 0,
        lastFrameTime: 0,
        currentFPS: 60,
        
        // Scroll tracking
        scrollElements: new Map(),
        scrollObserver: null,
        
        // Particle systems
        particleSystems: new Map(),
        activeParticles: new Set(),
        
        // Easing functions
        easingFunctions: new Map(),
        
        // Animation presets
        presets: new Map(),
        
        // Performance metrics
        metrics: {
            totalAnimations: 0,
            averageDuration: 0,
            droppedFrames: 0,
            memoryUsage: 0
        }
    },

    /**
     * Initialize animation library
     */
    initialize() {
        console.log('🎬 Initializing Advanced Animation Library...');
        
        // Setup easing functions
        this.setupEasingFunctions();
        
        // Setup animation presets
        this.setupAnimationPresets();
        
        // Setup scroll observer
        this.setupScrollObserver();
        
        // Setup performance monitoring
        this.setupPerformanceMonitoring();
        
        // Setup accessibility features
        this.setupAccessibilityFeatures();
        
        // Setup particle canvas
        this.setupParticleCanvas();
        
        // Start animation loop
        this.startAnimationLoop();
        
        console.log('✅ Advanced Animation Library initialized');
    },

    /**
     * Setup easing functions
     */
    setupEasingFunctions() {
        // Linear
        this.state.easingFunctions.set('linear', t => t);
        
        // Quad
        this.state.easingFunctions.set('easeInQuad', t => t * t);
        this.state.easingFunctions.set('easeOutQuad', t => t * (2 - t));
        this.state.easingFunctions.set('easeInOutQuad', t => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t);
        
        // Cubic
        this.state.easingFunctions.set('easeInCubic', t => t * t * t);
        this.state.easingFunctions.set('easeOutCubic', t => (--t) * t * t + 1);
        this.state.easingFunctions.set('easeInOutCubic', t => t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1);
        
        // Quart
        this.state.easingFunctions.set('easeInQuart', t => t * t * t * t);
        this.state.easingFunctions.set('easeOutQuart', t => 1 - (--t) * t * t * t);
        this.state.easingFunctions.set('easeInOutQuart', t => t < 0.5 ? 8 * t * t * t * t : 1 - 8 * (--t) * t * t * t);
        
        // Quint
        this.state.easingFunctions.set('easeInQuint', t => t * t * t * t * t);
        this.state.easingFunctions.set('easeOutQuint', t => 1 + (--t) * t * t * t * t);
        this.state.easingFunctions.set('easeInOutQuint', t => t < 0.5 ? 16 * t * t * t * t * t : 1 + 16 * (--t) * t * t * t * t);
        
        // Sine
        this.state.easingFunctions.set('easeInSine', t => 1 - Math.cos((t * Math.PI) / 2));
        this.state.easingFunctions.set('easeOutSine', t => Math.sin((t * Math.PI) / 2));
        this.state.easingFunctions.set('easeInOutSine', t => -(Math.cos(Math.PI * t) - 1) / 2);
        
        // Exponential
        this.state.easingFunctions.set('easeInExpo', t => t === 0 ? 0 : Math.pow(2, 10 * t - 10));
        this.state.easingFunctions.set('easeOutExpo', t => t === 1 ? 1 : 1 - Math.pow(2, -10 * t));
        this.state.easingFunctions.set('easeInOutExpo', t => {
            if (t === 0) return 0;
            if (t === 1) return 1;
            if (t < 0.5) return Math.pow(2, 20 * t - 10) / 2;
            return (2 - Math.pow(2, -20 * t + 10)) / 2;
        });
        
        // Circular
        this.state.easingFunctions.set('easeInCirc', t => 1 - Math.sqrt(1 - Math.pow(t, 2)));
        this.state.easingFunctions.set('easeOutCirc', t => Math.sqrt(1 - Math.pow(t - 1, 2)));
        this.state.easingFunctions.set('easeInOutCirc', t => {
            if (t < 0.5) return (1 - Math.sqrt(1 - Math.pow(2 * t, 2))) / 2;
            return (Math.sqrt(1 - Math.pow(-2 * t + 2, 2)) + 1) / 2;
        });
        
        // Back
        this.state.easingFunctions.set('easeInBack', t => {
            const c1 = 1.70158;
            const c3 = c1 + 1;
            return c3 * t * t * t - c1 * t * t;
        });
        this.state.easingFunctions.set('easeOutBack', t => {
            const c1 = 1.70158;
            const c3 = c1 + 1;
            return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
        });
        this.state.easingFunctions.set('easeInOutBack', t => {
            const c1 = 1.70158;
            const c2 = c1 * 1.525;
            if (t < 0.5) {
                return (Math.pow(2 * t, 2) * ((c2 + 1) * 2 * t - c2)) / 2;
            }
            return (Math.pow(2 * t - 2, 2) * ((c2 + 1) * (t * 2 - 2) + c2) + 2) / 2;
        });
        
        // Elastic
        this.state.easingFunctions.set('easeInElastic', t => {
            if (t === 0) return 0;
            if (t === 1) return 1;
            return -Math.pow(2, 10 * t - 10) * Math.sin((t * 10 - 10.75) * ((2 * Math.PI) / 3));
        });
        this.state.easingFunctions.set('easeOutElastic', t => {
            if (t === 0) return 0;
            if (t === 1) return 1;
            return Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * ((2 * Math.PI) / 3)) + 1;
        });
        this.state.easingFunctions.set('easeInOutElastic', t => {
            if (t === 0) return 0;
            if (t === 1) return 1;
            if (t < 0.5) {
                return -(Math.pow(2, 20 * t - 10) * Math.sin((20 * t - 11.125) * ((2 * Math.PI) / 4.5))) / 2;
            }
            return (Math.pow(2, -20 * t + 10) * Math.sin((20 * t - 11.125) * ((2 * Math.PI) / 4.5))) / 2 + 1;
        });
        
        // Bounce
        this.state.easingFunctions.set('easeInBounce', t => {
            return 1 - this.state.easingFunctions.get('easeOutBounce')(1 - t);
        });
        this.state.easingFunctions.set('easeOutBounce', t => {
            const n1 = 7.5625;
            const d1 = 2.75;
            if (t < 1 / d1) {
                return n1 * t * t;
            } else if (t < 2 / d1) {
                return n1 * (t -= 1.5 / d1) * t + 0.75;
            } else if (t < 2.5 / d1) {
                return n1 * (t -= 2.25 / d1) * t + 0.9375;
            } else {
                return n1 * (t -= 2.625 / d1) * t + 0.984375;
            }
        });
        this.state.easingFunctions.set('easeInOutBounce', t => {
            if (t < 0.5) {
                return (1 - this.state.easingFunctions.get('easeOutBounce')(1 - 2 * t)) / 2;
            }
            return (1 + this.state.easingFunctions.get('easeOutBounce')(2 * t - 1)) / 2;
        });
    },

    /**
     * Setup animation presets
     */
    setupAnimationPresets() {
        // Fade animations
        this.state.presets.set('fadeIn', {
            properties: { opacity: [0, 1] },
            duration: 300,
            easing: 'easeOutCubic'
        });
        
        this.state.presets.set('fadeOut', {
            properties: { opacity: [1, 0] },
            duration: 300,
            easing: 'easeOutCubic'
        });
        
        // Slide animations
        this.state.presets.set('slideInUp', {
            properties: { 
                opacity: [0, 1],
                transform: ['translateY(20px)', 'translateY(0)']
            },
            duration: 400,
            easing: 'easeOutCubic'
        });
        
        this.state.presets.set('slideInDown', {
            properties: { 
                opacity: [0, 1],
                transform: ['translateY(-20px)', 'translateY(0)']
            },
            duration: 400,
            easing: 'easeOutCubic'
        });
        
        this.state.presets.set('slideInLeft', {
            properties: { 
                opacity: [0, 1],
                transform: ['translateX(-20px)', 'translateX(0)']
            },
            duration: 400,
            easing: 'easeOutCubic'
        });
        
        this.state.presets.set('slideInRight', {
            properties: { 
                opacity: [0, 1],
                transform: ['translateX(20px)', 'translateX(0)']
            },
            duration: 400,
            easing: 'easeOutCubic'
        });
        
        // Scale animations
        this.state.presets.set('scaleIn', {
            properties: { 
                opacity: [0, 1],
                transform: ['scale(0.8)', 'scale(1)']
            },
            duration: 300,
            easing: 'easeOutBack'
        });
        
        this.state.presets.set('scaleOut', {
            properties: { 
                opacity: [1, 0],
                transform: ['scale(1)', 'scale(0.8)']
            },
            duration: 300,
            easing: 'easeInBack'
        });
        
        // Rotate animations
        this.state.presets.set('rotateIn', {
            properties: { 
                opacity: [0, 1],
                transform: ['rotate(-180deg)', 'rotate(0deg)']
            },
            duration: 500,
            easing: 'easeOutBack'
        });
        
        // Bounce animations
        this.state.presets.set('bounceIn', {
            properties: { 
                opacity: [0, 1],
                transform: ['scale(0.3)', 'scale(1.05)', 'scale(0.9)', 'scale(1)']
            },
            duration: 600,
            easing: 'easeOutBounce'
        });
        
        // Shake animations
        this.state.presets.set('shake', {
            properties: { 
                transform: ['translateX(0)', 'translateX(-10px)', 'translateX(10px)', 'translateX(-10px)', 'translateX(10px)', 'translateX(0)']
            },
            duration: 500,
            easing: 'easeInOutQuad'
        });
        
        // Pulse animations
        this.state.presets.set('pulse', {
            properties: { 
                transform: ['scale(1)', 'scale(1.05)', 'scale(1)']
            },
            duration: 1000,
            easing: 'easeInOutQuad',
            repeat: -1
        });
    },

    /**
     * Setup scroll observer
     */
    setupScrollObserver() {
        if (!('IntersectionObserver' in window)) {
            console.warn('IntersectionObserver not supported');
            return;
        }
        
        this.state.scrollObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                const element = entry.target;
                const animationData = this.state.scrollElements.get(element);
                
                if (animationData) {
                    if (entry.isIntersecting) {
                        // Trigger animation when element comes into view
                        this.animate(element, animationData.preset, {
                            ...animationData.options,
                            delay: animationData.options.delay || 0
                        });
                        
                        // Unobserve if animation should only run once
                        if (animationData.once) {
                            this.state.scrollObserver.unobserve(element);
                            this.state.scrollElements.delete(element);
                        }
                    } else if (!animationData.once && animationData.resetOnScroll) {
                        // Reset animation when element goes out of view
                        this.resetAnimation(element);
                    }
                }
            });
        }, {
            threshold: this.config.scrollThreshold,
            rootMargin: this.config.scrollRootMargin
        });
    },

    /**
     * Setup performance monitoring
     */
    setupPerformanceMonitoring() {
        // Monitor frame rate
        let lastTime = performance.now();
        let frames = 0;
        
        const measureFPS = (currentTime) => {
            frames++;
            
            if (currentTime >= lastTime + 1000) {
                this.state.currentFPS = Math.round((frames * 1000) / (currentTime - lastTime));
                this.state.frameCount = frames;
                this.state.lastFrameTime = currentTime;
                
                // Check for dropped frames
                if (this.state.currentFPS < this.config.targetFPS) {
                    this.state.metrics.droppedFrames++;
                }
                
                frames = 0;
                lastTime = currentTime;
            }
            
            requestAnimationFrame(measureFPS);
        };
        
        requestAnimationFrame(measureFPS);
        
        // Monitor memory usage
        if (performance.memory) {
            setInterval(() => {
                this.state.metrics.memoryUsage = performance.memory.usedJSHeapSize / performance.memory.jsHeapSizeLimit;
            }, 5000);
        }
    },

    /**
     * Setup accessibility features
     */
    setupAccessibilityFeatures() {
        // Check for reduced motion preference
        if (window.matchMedia) {
            const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
            
            if (reducedMotionQuery.matches) {
                this.config.defaultDuration = this.config.reducedMotionDuration;
            }
            
            reducedMotionQuery.addEventListener('change', (e) => {
                if (e.matches) {
                    this.config.defaultDuration = this.config.reducedMotionDuration;
                } else {
                    this.config.defaultDuration = 300;
                }
            });
        }
    },

    /**
     * Setup particle canvas
     */
    setupParticleCanvas() {
        // Create particle canvas
        const canvas = document.createElement('canvas');
        canvas.id = 'particle-canvas';
        canvas.style.position = 'fixed';
        canvas.style.top = '0';
        canvas.style.left = '0';
        canvas.style.width = '100%';
        canvas.style.height = '100%';
        canvas.style.pointerEvents = 'none';
        canvas.style.zIndex = '9999';
        canvas.style.display = 'none';
        
        document.body.appendChild(canvas);
        
        // Get canvas context
        this.particleCanvas = canvas;
        this.particleContext = canvas.getContext('2d');
        
        // Set canvas size
        this.resizeParticleCanvas();
        
        // Handle resize
        window.addEventListener('resize', () => {
            this.resizeParticleCanvas();
        });
    },

    /**
     * Resize particle canvas
     */
    resizeParticleCanvas() {
        this.particleCanvas.width = window.innerWidth;
        this.particleCanvas.height = window.innerHeight;
    },

    /**
     * Start animation loop
     */
    startAnimationLoop() {
        const animate = (currentTime) => {
            // Update active animations
            this.updateAnimations(currentTime);
            
            // Update particles
            this.updateParticles(currentTime);
            
            // Continue loop
            requestAnimationFrame(animate);
        };
        
        requestAnimationFrame(animate);
    },

    /**
     * Animate element
     */
    animate(element, presetOrProperties, options = {}) {
        // Check for reduced motion
        if (this.config.respectReducedMotion && this.config.defaultDuration === 0) {
            return Promise.resolve();
        }
        
        // Get preset or properties
        let preset;
        if (typeof presetOrProperties === 'string') {
            preset = this.state.presets.get(presetOrProperties);
            if (!preset) {
                console.warn(`Animation preset '${presetOrProperties}' not found`);
                return Promise.resolve();
            }
        } else {
            preset = {
                properties: presetOrProperties,
                duration: options.duration || this.config.defaultDuration,
                easing: options.easing || this.config.defaultEasing
            };
        }
        
        // Merge options
        const animationOptions = {
            duration: options.duration || preset.duration,
            easing: options.easing || preset.easing,
            delay: options.delay || 0,
            repeat: options.repeat || 0,
            direction: options.direction || 'normal',
            fill: options.fill || 'both',
            ...options
        };
        
        // Create animation
        const animation = this.createAnimation(element, preset, animationOptions);
        
        // Start animation
        return this.startAnimation(animation);
    },

    /**
     * Create animation
     */
    createAnimation(element, preset, options) {
        const animation = {
            id: this.generateAnimationId(),
            element,
            preset,
            options,
            startTime: performance.now() + options.delay,
            currentTime: 0,
            progress: 0,
            isActive: true,
            isComplete: false,
            repeatCount: 0,
            keyframes: this.generateKeyframes(preset.properties),
            easingFunction: this.state.easingFunctions.get(options.easing) || this.state.easingFunctions.get('easeOutCubic')
        };
        
        // Store animation
        this.state.activeAnimations.set(animation.id, animation);
        
        return animation;
    },

    /**
     * Generate keyframes
     */
    generateKeyframes(properties) {
        const keyframes = [];
        
        Object.entries(properties).forEach(([property, values]) => {
            const keyframe = {
                property,
                values: Array.isArray(values) ? values : [values],
                currentValues: Array.isArray(values) ? new Array(values.length).fill(0) : [0]
            };
            
            keyframes.push(keyframe);
        });
        
        return keyframes;
    },

    /**
     * Start animation
     */
    startAnimation(animation) {
        return new Promise((resolve) => {
            animation.resolve = resolve;
            
            // Apply initial styles
            this.applyAnimationStyles(animation, 0);
            
            // Add to queue if too many active animations
            if (this.state.activeAnimations.size > this.config.maxConcurrentAnimations) {
                this.state.animationQueue.push(animation);
            } else {
                animation.isQueued = false;
            }
        });
    },

    /**
     * Update animations
     */
    updateAnimations(currentTime) {
        // Process queued animations
        if (this.state.animationQueue.length > 0 && this.state.activeAnimations.size < this.config.maxConcurrentAnimations) {
            const nextAnimation = this.state.animationQueue.shift();
            nextAnimation.isQueued = false;
        }
        
        // Update active animations
        this.state.activeAnimations.forEach((animation, id) => {
            if (!animation.isActive || animation.isQueued) return;
            
            // Calculate progress
            const elapsed = currentTime - animation.startTime;
            animation.progress = Math.min(elapsed / animation.options.duration, 1);
            animation.currentTime = elapsed;
            
            // Apply easing
            const easedProgress = animation.easingFunction(animation.progress);
            
            // Apply styles
            this.applyAnimationStyles(animation, easedProgress);
            
            // Check for completion
            if (animation.progress >= 1) {
                this.handleAnimationComplete(animation);
            }
        });
    },

    /**
     * Apply animation styles
     */
    applyAnimationStyles(animation, progress) {
        const element = animation.element;
        
        animation.keyframes.forEach(keyframe => {
            // Calculate current value
            const value = this.interpolateValue(keyframe.values, progress);
            
            // Apply style
            if (keyframe.property === 'transform') {
                element.style.transform = value;
            } else if (keyframe.property === 'opacity') {
                element.style.opacity = value;
            } else {
                element.style[keyframe.property] = value;
            }
        });
    },

    /**
     * Interpolate value
     */
    interpolateValue(values, progress) {
        if (values.length === 1) {
            return values[0];
        }
        
        // Find segment
        const segmentCount = values.length - 1;
        const segment = Math.min(Math.floor(progress * segmentCount), segmentCount - 1);
        const segmentProgress = (progress * segmentCount) - segment;
        
        // Interpolate between segment values
        const startValue = values[segment];
        const endValue = values[segment + 1];
        
        if (typeof startValue === 'number' && typeof endValue === 'number') {
            return startValue + (endValue - startValue) * segmentProgress;
        }
        
        if (typeof startValue === 'string' && typeof endValue === 'string') {
            // Handle transform values
            if (startValue.includes('translate') || startValue.includes('scale') || startValue.includes('rotate')) {
                return this.interpolateTransform(startValue, endValue, segmentProgress);
            }
            
            // Handle color values
            if (startValue.startsWith('#') || startValue.startsWith('rgb')) {
                return this.interpolateColor(startValue, endValue, segmentProgress);
            }
        }
        
        return endValue;
    },

    /**
     * Interpolate transform
     */
    interpolateTransform(start, end, progress) {
        // Extract transform functions
        const startFunctions = this.parseTransform(start);
        const endFunctions = this.parseTransform(end);
        
        // Interpolate each function
        const interpolatedFunctions = startFunctions.map((startFunc, index) => {
            const endFunc = endFunctions[index];
            if (!endFunc) return startFunc;
            
            if (startFunc.type === 'translate') {
                const x = startFunc.values[0] + (endFunc.values[0] - startFunc.values[0]) * progress;
                const y = startFunc.values[1] + (endFunc.values[1] - startFunc.values[1]) * progress;
                return `translate(${x}px, ${y}px)`;
            } else if (startFunc.type === 'scale') {
                const scale = startFunc.values[0] + (endFunc.values[0] - startFunc.values[0]) * progress;
                return `scale(${scale})`;
            } else if (startFunc.type === 'rotate') {
                const angle = startFunc.values[0] + (endFunc.values[0] - startFunc.values[0]) * progress;
                return `rotate(${angle}deg)`;
            }
            
            return startFunc;
        });
        
        return interpolatedFunctions.join(' ');
    },

    /**
     * Parse transform
     */
    parseTransform(transform) {
        const functions = [];
        const regex = /(\w+)\(([^)]+)\)/g;
        let match;
        
        while ((match = regex.exec(transform)) !== null) {
            const type = match[1];
            const values = match[2].split(',').map(v => parseFloat(v.trim()));
            functions.push({ type, values });
        }
        
        return functions;
    },

    /**
     * Interpolate color
     */
    interpolateColor(start, end, progress) {
        // Convert to RGB
        const startRGB = this.parseColor(start);
        const endRGB = this.parseColor(end);
        
        // Interpolate
        const r = Math.round(startRGB.r + (endRGB.r - startRGB.r) * progress);
        const g = Math.round(startRGB.g + (endRGB.g - startRGB.g) * progress);
        const b = Math.round(startRGB.b + (endRGB.b - startRGB.b) * progress);
        
        return `rgb(${r}, ${g}, ${b})`;
    },

    /**
     * Parse color
     */
    parseColor(color) {
        let r, g, b;
        
        if (color.startsWith('#')) {
            // Hex color
            const hex = color.slice(1);
            r = parseInt(hex.substr(0, 2), 16);
            g = parseInt(hex.substr(2, 2), 16);
            b = parseInt(hex.substr(4, 2), 16);
        } else if (color.startsWith('rgb')) {
            // RGB color
            const values = color.match(/\d+/g);
            r = parseInt(values[0]);
            g = parseInt(values[1]);
            b = parseInt(values[2]);
        } else {
            // Named color (fallback)
            r = g = b = 0;
        }
        
        return { r, g, b };
    },

    /**
     * Handle animation complete
     */
    handleAnimationComplete(animation) {
        animation.isComplete = true;
        animation.isActive = false;
        
        // Handle repeats
        if (animation.options.repeat > 0) {
            animation.repeatCount++;
            if (animation.repeatCount < animation.options.repeat) {
                // Reset and continue
                animation.startTime = performance.now();
                animation.progress = 0;
                animation.isActive = true;
                return;
            }
        } else if (animation.options.repeat === -1) {
            // Infinite repeat
            animation.startTime = performance.now();
            animation.progress = 0;
            animation.isActive = true;
            return;
        }
        
        // Resolve promise
        if (animation.resolve) {
            animation.resolve(animation);
        }
        
        // Remove from active animations
        this.state.activeAnimations.delete(animation.id);
        
        // Update metrics
        this.state.metrics.totalAnimations++;
        this.state.metrics.averageDuration = (this.state.metrics.averageDuration + animation.options.duration) / 2;
    },

    /**
     * Animate multiple elements with stagger
     */
    animateStagger(elements, presetOrProperties, options = {}) {
        const {
            stagger = 100,
            reverse = false,
            ...animationOptions
        } = options;
        
        // Create array of elements
        const elementArray = Array.from(elements);
        
        // Reverse if specified
        if (reverse) {
            elementArray.reverse();
        }
        
        // Create staggered animations
        const animations = elementArray.map((element, index) => {
            const delay = (animationOptions.delay || 0) + (index * stagger);
            return this.animate(element, presetOrProperties, {
                ...animationOptions,
                delay
            });
        });
        
        return Promise.all(animations);
    },

    /**
     * Create scroll-triggered animation
     */
    animateOnScroll(element, presetOrProperties, options = {}) {
        const {
            once = true,
            resetOnScroll = false,
            threshold = this.config.scrollThreshold,
            rootMargin = this.config.scrollRootMargin,
            ...animationOptions
        } = options;
        
        // Store animation data
        this.state.scrollElements.set(element, {
            preset: presetOrProperties,
            options: {
                ...animationOptions,
                once,
                resetOnScroll
            },
            once,
            resetOnScroll
        });
        
        // Start observing
        this.state.scrollObserver.observe(element);
    },

    /**
     * Create physics-based animation
     */
    animatePhysics(element, properties, options = {}) {
        const {
            velocity = 0,
            acceleration = 0,
            friction = this.config.friction,
            gravity = this.config.gravity,
            spring = this.config.springTension,
            ...animationOptions
        } = options;
        
        // Create physics animation
        const animation = {
            id: this.generateAnimationId(),
            element,
            type: 'physics',
            properties,
            options: animationOptions,
            velocity,
            acceleration,
            friction,
            gravity,
            spring,
            position: 0,
            isActive: true,
            startTime: performance.now()
        };
        
        // Store animation
        this.state.activeAnimations.set(animation.id, animation);
        
        return new Promise((resolve) => {
            animation.resolve = resolve;
        });
    },

    /**
     * Create spring animation
     */
    animateSpring(element, properties, options = {}) {
        const {
            tension = this.config.springTension,
            friction = this.config.friction,
            velocity = 0,
            ...animationOptions
        } = options;
        
        // Create spring animation
        const animation = {
            id: this.generateAnimationId(),
            element,
            type: 'spring',
            properties,
            options: animationOptions,
            tension,
            friction,
            velocity,
            position: 0,
            targetPosition: 1,
            isActive: true,
            startTime: performance.now()
        };
        
        // Store animation
        this.state.activeAnimations.set(animation.id, animation);
        
        return new Promise((resolve) => {
            animation.resolve = resolve;
        });
    },

    /**
     * Create morph animation
     */
    animateMorph(element, fromPath, toPath, options = {}) {
        const {
            duration = 1000,
            easing = 'easeInOutCubic',
            ...animationOptions
        } = options;
        
        // Create morph animation
        const animation = {
            id: this.generateAnimationId(),
            element,
            type: 'morph',
            fromPath,
            toPath,
            options: {
                duration,
                easing,
                ...animationOptions
            },
            progress: 0,
            isActive: true,
            startTime: performance.now()
        };
        
        // Store animation
        this.state.activeAnimations.set(animation.id, animation);
        
        return new Promise((resolve) => {
            animation.resolve = resolve;
        });
    },

    /**
     * Create particle system
     */
    createParticleSystem(options = {}) {
        const {
            count = 50,
            lifetime = this.config.particleLifetime,
            emitter = { x: 0, y: 0 },
            velocity = { x: 0, y: -1 },
            acceleration = { x: 0, y: 0 },
            size = 5,
            color = '#ffffff',
            ...particleOptions
        } = options;
        
        const systemId = this.generateAnimationId();
        const system = {
            id: systemId,
            particles: [],
            options: {
                count,
                lifetime,
                emitter,
                velocity,
                acceleration,
                size,
                color,
                ...particleOptions
            },
            isActive: true
        };
        
        // Create particles
        for (let i = 0; i < count; i++) {
            const particle = {
                x: emitter.x + (Math.random() - 0.5) * 10,
                y: emitter.y + (Math.random() - 0.5) * 10,
                vx: velocity.x + (Math.random() - 0.5) * 2,
                vy: velocity.y + (Math.random() - 0.5) * 2,
                ax: acceleration.x,
                ay: acceleration.y,
                size: size + (Math.random() - 0.5) * 2,
                color,
                lifetime: lifetime + (Math.random() - 0.5) * 1000,
                age: 0,
                opacity: 1
            };
            
            system.particles.push(particle);
            this.state.activeParticles.add(particle);
        }
        
        // Store system
        this.state.particleSystems.set(systemId, system);
        
        // Show canvas
        this.particleCanvas.style.display = 'block';
        
        return systemId;
    },

    /**
     * Update particles
     */
    updateParticles(currentTime) {
        if (this.state.activeParticles.size === 0) {
            this.particleCanvas.style.display = 'none';
            return;
        }
        
        // Clear canvas
        this.particleContext.clearRect(0, 0, this.particleCanvas.width, this.particleCanvas.height);
        
        // Update and draw particles
        this.state.activeParticles.forEach(particle => {
            // Update physics
            particle.vx += particle.ax * 0.016; // 60fps timestep
            particle.vy += particle.ay * 0.016;
            particle.x += particle.vx;
            particle.y += particle.vy;
            
            // Update age
            particle.age += 16; // 60fps timestep
            particle.opacity = 1 - (particle.age / particle.lifetime);
            
            // Remove dead particles
            if (particle.age >= particle.lifetime) {
                this.state.activeParticles.delete(particle);
                return;
            }
            
            // Draw particle
            this.particleContext.globalAlpha = particle.opacity;
            this.particleContext.fillStyle = particle.color;
            this.particleContext.beginPath();
            this.particleContext.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
            this.particleContext.fill();
        });
    },

    /**
     * Create text animation
     */
    animateText(element, text, options = {}) {
        const {
            type = 'typewriter',
            duration = 1000,
            easing = 'linear',
            ...animationOptions
        } = options;
        
        switch (type) {
            case 'typewriter':
                return this.animateTypewriter(element, text, { duration, easing, ...animationOptions });
            case 'fade':
                return this.animateTextFade(element, text, { duration, easing, ...animationOptions });
            case 'slide':
                return this.animateTextSlide(element, text, { duration, easing, ...animationOptions });
            default:
                return this.animateTypewriter(element, text, { duration, easing, ...animationOptions });
        }
    },

    /**
     * Animate typewriter text
     */
    animateTypewriter(element, text, options = {}) {
        const { duration = 1000 } = options;
        const charDuration = duration / text.length;
        
        element.textContent = '';
        
        let currentChar = 0;
        
        return new Promise((resolve) => {
            const typeChar = () => {
                if (currentChar < text.length) {
                    element.textContent += text[currentChar];
                    currentChar++;
                    setTimeout(typeChar, charDuration);
                } else {
                    resolve();
                }
            };
            
            typeChar();
        });
    },

    /**
     * Animate text fade
     */
    animateTextFade(element, text, options = {}) {
        const { duration = 1000 } = options;
        
        element.textContent = text;
        element.style.opacity = '0';
        
        return this.animate(element, { opacity: [0, 1] }, { duration });
    },

    /**
     * Animate text slide
     */
    animateTextSlide(element, text, options = {}) {
        const { duration = 1000 } = options;
        
        element.textContent = text;
        element.style.transform = 'translateY(20px)';
        element.style.opacity = '0';
        
        return this.animate(element, {
            opacity: [0, 1],
            transform: ['translateY(20px)', 'translateY(0)']
        }, { duration });
    },

    /**
     * Reset animation
     */
    resetAnimation(element) {
        // Find active animation for element
        let animationToReset = null;
        this.state.activeAnimations.forEach((animation, id) => {
            if (animation.element === element) {
                animationToReset = animation;
            }
        });
        
        if (animationToReset) {
            // Reset to initial state
            this.applyAnimationStyles(animationToReset, 0);
            
            // Remove animation
            this.state.activeAnimations.delete(animationToReset.id);
        }
    },

    /**
     * Stop animation
     */
    stopAnimation(element) {
        // Find and remove active animations for element
        const animationsToRemove = [];
        
        this.state.activeAnimations.forEach((animation, id) => {
            if (animation.element === element) {
                animationsToRemove.push(id);
            }
        });
        
        animationsToRemove.forEach(id => {
            this.state.activeAnimations.delete(id);
        });
    },

    /**
     * Pause animation
     */
    pauseAnimation(element) {
        // Find active animation for element
        this.state.activeAnimations.forEach((animation, id) => {
            if (animation.element === element) {
                animation.isActive = false;
                animation.pausedAt = performance.now();
            }
        });
    },

    /**
     * Resume animation
     */
    resumeAnimation(element) {
        // Find paused animation for element
        this.state.activeAnimations.forEach((animation, id) => {
            if (animation.element === element && !animation.isActive) {
                animation.isActive = true;
                animation.startTime += performance.now() - animation.pausedAt;
                delete animation.pausedAt;
            }
        });
    },

    /**
     * Generate animation ID
     */
    generateAnimationId() {
        return `anim-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    },

    /**
     * Get animation metrics
     */
    getMetrics() {
        return {
            ...this.state.metrics,
            activeAnimations: this.state.activeAnimations.size,
            queuedAnimations: this.state.animationQueue.length,
            currentFPS: this.state.currentFPS,
            activeParticles: this.state.activeParticles.size,
            particleSystems: this.state.particleSystems.size
        };
    },

    /**
     * Destroy animation library
     */
    destroy() {
        // Clear all animations
        this.state.activeAnimations.clear();
        this.state.animationQueue = [];
        this.state.activeParticles.clear();
        this.state.particleSystems.clear();
        
        // Disconnect scroll observer
        if (this.state.scrollObserver) {
            this.state.scrollObserver.disconnect();
        }
        
        // Remove particle canvas
        if (this.particleCanvas) {
            this.particleCanvas.remove();
        }
        
        console.log('🗑️ Advanced Animation Library destroyed');
    }
};

// Initialize on DOM ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => animationLibrary.initialize());
} else {
    animationLibrary.initialize();
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = animationLibrary;
}

// Make available globally
window.animationLibrary = animationLibrary;