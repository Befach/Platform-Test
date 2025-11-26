/**
 * Loading Manager Utility
 * Helper functions for managing loading states across the application
 *
 * Purpose: Provide consistent loading UX with minimum display time
 * Integration: Used by all async operations (API calls, data fetching, AI chat)
 */

const loadingManager = {
    /**
     * Minimum display time for loading states (prevents flickering)
     */
    MIN_DISPLAY_TIME: 500, // 500ms

    /**
     * Active loading operations tracker
     */
    activeLoading: new Map(),

    /**
     * Show loading spinner in an element
     * @param {String|HTMLElement} target - Element ID or element
     * @param {Object} options - Configuration options
     * @returns {String} Loading ID for cleanup
     */
    showSpinner(target, options = {}) {
        const {
            size = 'md',        // 'sm', 'md', 'lg', 'xl'
            text = '',
            overlay = false,
            minDisplayTime = this.MIN_DISPLAY_TIME
        } = options;

        const element = typeof target === 'string' ? document.getElementById(target) : target;
        if (!element) {
            console.warn('Loading target element not found:', target);
            return null;
        }

        const loadingId = `loading-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const startTime = Date.now();

        // Create spinner HTML
        const spinnerHTML = overlay
            ? this.createOverlaySpinner(size, text)
            : this.createInlineSpinner(size, text);

        // Add to element
        if (overlay) {
            element.style.position = 'relative';
            element.insertAdjacentHTML('beforeend', spinnerHTML);
        } else {
            element.innerHTML = spinnerHTML;
        }

        // Track loading state
        this.activeLoading.set(loadingId, {
            element,
            startTime,
            minDisplayTime,
            overlay
        });

        return loadingId;
    },

    /**
     * Hide loading spinner
     * @param {String} loadingId - ID returned from showSpinner
     * @param {Function} callback - Optional callback after minimum display time
     */
    async hideSpinner(loadingId, callback = null) {
        const loading = this.activeLoading.get(loadingId);
        if (!loading) return;

        const { element, startTime, minDisplayTime, overlay } = loading;
        const elapsed = Date.now() - startTime;
        const remainingTime = Math.max(0, minDisplayTime - elapsed);

        // Wait for minimum display time
        if (remainingTime > 0) {
            await new Promise(resolve => setTimeout(resolve, remainingTime));
        }

        // Remove loading UI
        if (overlay) {
            const overlayElement = element.querySelector('.loading-overlay');
            if (overlayElement) {
                overlayElement.style.opacity = '0';
                setTimeout(() => overlayElement.remove(), 200);
            }
        } else {
            // Clear inline loading
            element.innerHTML = '';
        }

        // Cleanup
        this.activeLoading.delete(loadingId);

        // Execute callback
        if (callback) callback();
    },

    /**
     * Create overlay spinner HTML
     */
    createOverlaySpinner(size, text) {
        return `
            <div class="loading-overlay">
                <div class="loading-overlay-content">
                    <div class="loading-overlay-spinner">
                        <div class="loading-spinner ${size}"></div>
                    </div>
                    ${text ? `<p class="loading-overlay-text">${text}</p>` : ''}
                </div>
            </div>
        `;
    },

    /**
     * Create inline spinner HTML
     */
    createInlineSpinner(size, text) {
        return `
            <div class="loading-inline">
                <div class="loading-spinner ${size}"></div>
                ${text ? `<span>${text}</span>` : ''}
            </div>
        `;
    },

    /**
     * Show skeleton screen
     * @param {String|HTMLElement} target - Element ID or element
     * @param {String} type - Skeleton type: 'table', 'detail', 'card', 'list'
     * @param {Object} options - Configuration options
     */
    showSkeleton(target, type = 'card', options = {}) {
        const element = typeof target === 'string' ? document.getElementById(target) : target;
        if (!element) return null;

        const skeletonHTML = this.createSkeletonHTML(type, options);
        element.innerHTML = skeletonHTML;

        return `skeleton-${Date.now()}`;
    },

    /**
     * Create skeleton HTML based on type
     */
    createSkeletonHTML(type, options = {}) {
        switch (type) {
            case 'table':
                return this.createTableSkeleton(options);
            case 'detail':
                return this.createDetailSkeleton(options);
            case 'card':
                return this.createCardSkeleton(options);
            case 'list':
                return this.createListSkeleton(options);
            default:
                return this.createCardSkeleton(options);
        }
    },

    /**
     * Create table skeleton
     */
    createTableSkeleton(options = {}) {
        const { rows = 5, columns = 4 } = options;
        let html = '<div class="skeleton-table">';

        for (let i = 0; i < rows; i++) {
            html += '<div class="skeleton-table-row">';
            for (let j = 0; j < columns; j++) {
                html += '<div class="skeleton-table-cell skeleton"></div>';
            }
            html += '</div>';
        }

        html += '</div>';
        return html;
    },

    /**
     * Create detail view skeleton
     */
    createDetailSkeleton(options = {}) {
        const { sections = 3, fieldsPerSection = 4 } = options;
        let html = '<div class="skeleton-detail">';

        // Header
        html += `
            <div class="skeleton-detail-header">
                <div class="skeleton skeleton-title"></div>
                <div class="skeleton skeleton-text medium"></div>
            </div>
        `;

        // Sections
        for (let i = 0; i < sections; i++) {
            html += '<div class="skeleton-detail-section">';
            html += '<div class="skeleton skeleton-text narrow" style="margin-bottom: 1rem;"></div>';

            for (let j = 0; j < fieldsPerSection; j++) {
                html += `
                    <div class="skeleton-detail-field">
                        <div class="skeleton skeleton-detail-label"></div>
                        <div class="skeleton skeleton-detail-value"></div>
                    </div>
                `;
            }

            html += '</div>';
        }

        html += '</div>';
        return html;
    },

    /**
     * Create card skeleton
     */
    createCardSkeleton(options = {}) {
        const { cards = 3 } = options;
        let html = '<div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 1rem;">';

        for (let i = 0; i < cards; i++) {
            html += `
                <div class="loading-card">
                    <div class="loading-card-header">
                        <div class="skeleton skeleton-avatar"></div>
                        <div style="flex: 1;">
                            <div class="skeleton skeleton-text wide" style="margin-bottom: 0.5rem;"></div>
                            <div class="skeleton skeleton-text medium"></div>
                        </div>
                    </div>
                    <div class="loading-card-body">
                        <div class="skeleton skeleton-text wide"></div>
                        <div class="skeleton skeleton-text wide"></div>
                        <div class="skeleton skeleton-text medium"></div>
                    </div>
                </div>
            `;
        }

        html += '</div>';
        return html;
    },

    /**
     * Create list skeleton
     */
    createListSkeleton(options = {}) {
        const { items = 5 } = options;
        let html = '<div style="display: flex; flex-direction: column; gap: 1rem;">';

        for (let i = 0; i < items; i++) {
            html += `
                <div style="display: flex; gap: 1rem; align-items: center; padding: 1rem; border: 1px solid var(--border); border-radius: 0.5rem;">
                    <div class="skeleton skeleton-avatar"></div>
                    <div style="flex: 1;">
                        <div class="skeleton skeleton-text wide" style="margin-bottom: 0.5rem;"></div>
                        <div class="skeleton skeleton-text narrow"></div>
                    </div>
                </div>
            `;
        }

        html += '</div>';
        return html;
    },

    /**
     * Set button loading state
     * @param {HTMLElement} button - Button element
     * @param {Boolean} isLoading - Loading state
     * @param {String} loadingText - Optional loading text
     */
    setButtonLoading(button, isLoading, loadingText = 'Loading...') {
        if (!button) return;

        if (isLoading) {
            button.disabled = true;
            button.classList.add('btn-loading');
            button.dataset.originalText = button.textContent;
            button.dataset.loadingText = loadingText;
            button.setAttribute('aria-busy', 'true');
        } else {
            button.disabled = false;
            button.classList.remove('btn-loading');
            if (button.dataset.originalText) {
                button.textContent = button.dataset.originalText;
            }
            button.removeAttribute('aria-busy');
        }
    },

    /**
     * Show progress bar
     * @param {String|HTMLElement} target - Element ID or element
     * @param {Number} progress - Progress percentage (0-100)
     * @param {Object} options - Configuration options
     */
    showProgress(target, progress = 0, options = {}) {
        const {
            animated = false,
            size = 'md',
            color = null
        } = options;

        const element = typeof target === 'string' ? document.getElementById(target) : target;
        if (!element) return;

        const sizeClass = size !== 'md' ? size : '';
        const animatedClass = animated ? 'progress-bar-animated' : '';

        element.innerHTML = `
            <div class="progress-bar ${sizeClass} ${animatedClass}">
                <div class="progress-bar-fill" style="width: ${Math.min(100, Math.max(0, progress))}%;${color ? ` background: ${color};` : ''}"></div>
            </div>
        `;
    },

    /**
     * Update progress bar
     * @param {String|HTMLElement} target - Element ID or element
     * @param {Number} progress - Progress percentage (0-100)
     */
    updateProgress(target, progress) {
        const element = typeof target === 'string' ? document.getElementById(target) : target;
        if (!element) return;

        const progressFill = element.querySelector('.progress-bar-fill');
        if (progressFill) {
            progressFill.style.width = `${Math.min(100, Math.max(0, progress))}%`;
        }
    },

    /**
     * Show loading dots
     * @param {String|HTMLElement} target - Element ID or element
     */
    showDots(target) {
        const element = typeof target === 'string' ? document.getElementById(target) : target;
        if (!element) return;

        element.innerHTML = `
            <div class="loading-dots">
                <span></span>
                <span></span>
                <span></span>
            </div>
        `;
    },

    /**
     * Show empty state
     * @param {String|HTMLElement} target - Element ID or element
     * @param {Object} options - Configuration options
     */
    showEmptyState(target, options = {}) {
        const {
            icon = '📭',
            title = 'No data available',
            description = '',
            action = null
        } = options;

        const element = typeof target === 'string' ? document.getElementById(target) : target;
        if (!element) return;

        let html = `
            <div class="loading-empty">
                <div class="loading-empty-icon">${icon}</div>
                <div class="loading-empty-title">${title}</div>
                ${description ? `<div class="loading-empty-description">${description}</div>` : ''}
                ${action ? `<div style="margin-top: 1.5rem;">${action}</div>` : ''}
            </div>
        `;

        element.innerHTML = html;
    },

    /**
     * Wrap async operation with loading state
     * @param {Function} asyncFn - Async function to execute
     * @param {String|HTMLElement} target - Loading target
     * @param {Object} options - Configuration options
     * @returns {Promise} Result of async function
     */
    async withLoading(asyncFn, target, options = {}) {
        const loadingId = this.showSpinner(target, options);

        try {
            const result = await asyncFn();
            await this.hideSpinner(loadingId);
            return result;
        } catch (error) {
            await this.hideSpinner(loadingId);
            throw error;
        }
    },

    /**
     * Cleanup all active loading states
     */
    cleanupAll() {
        for (const [loadingId] of this.activeLoading) {
            this.hideSpinner(loadingId);
        }
    }
};

// Cleanup on page unload
if (typeof window !== 'undefined') {
    window.addEventListener('beforeunload', () => {
        loadingManager.cleanupAll();
    });
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = loadingManager;
}
