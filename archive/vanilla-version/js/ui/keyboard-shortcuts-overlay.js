/**
 * Keyboard Shortcuts Reference Overlay
 * Displays a comprehensive keyboard shortcuts reference when triggered
 *
 * Usage:
 * - Press '?' or 'Shift+/' to show shortcuts
 * - Press 'Esc' to close
 * - Add to index.html: <script src="js/ui/keyboard-shortcuts-overlay.js"></script>
 */

const KeyboardShortcutsOverlay = {
    // Shortcuts configuration
    shortcuts: {
        'Navigation': [
            { keys: ['Tab'], description: 'Navigate to next element' },
            { keys: ['Shift', 'Tab'], description: 'Navigate to previous element' },
            { keys: ['Enter'], description: 'Activate/Select element' },
            { keys: ['Esc'], description: 'Close modal/panel' },
            { keys: ['Ctrl', 'K'], description: 'Focus search input', mac: ['⌘', 'K'] }
        ],
        'Features': [
            { keys: ['N'], description: 'Add new feature' },
            { keys: ['A'], description: 'Open AI assistant' },
            { keys: ['E'], description: 'Export data' },
            { keys: ['I'], description: 'Import data' },
            { keys: ['S'], description: 'Save changes', mac: ['⌘', 'S'] }
        ],
        'View': [
            { keys: ['1'], description: 'Switch to Overview tab' },
            { keys: ['2'], description: 'Switch to Execution tab' },
            { keys: ['3'], description: 'Switch to Resources tab' },
            { keys: ['4'], description: 'Switch to Planning tab' },
            { keys: ['F'], description: 'Toggle fullscreen mode' }
        ],
        'Selection': [
            { keys: ['Ctrl', 'A'], description: 'Select all', mac: ['⌘', 'A'] },
            { keys: ['Ctrl', 'D'], description: 'Deselect all', mac: ['⌘', 'D'] },
            { keys: ['↑', '↓'], description: 'Navigate list items' },
            { keys: ['Space'], description: 'Toggle selection' }
        ],
        'AI Features': [
            { keys: ['Ctrl', 'Shift', 'A'], description: 'Open AI actions log', mac: ['⌘', '⇧', 'A'] },
            { keys: ['Ctrl', 'Shift', 'L'], description: 'Analyze batch links', mac: ['⌘', '⇧', 'L'] },
            { keys: ['Ctrl', 'Shift', 'E'], description: 'AI enhance feature', mac: ['⌘', '⇧', 'E'] }
        ],
        'Help': [
            { keys: ['?'], description: 'Show keyboard shortcuts', altKeys: ['Shift', '/'] },
            { keys: ['H'], description: 'Open help documentation' },
            { keys: ['Ctrl', '/'], description: 'Toggle command palette', mac: ['⌘', '/'] }
        ]
    },

    // Check if Mac
    isMac: /Mac|iPhone|iPad|iPod/.test(navigator.platform),

    // Initialize the overlay
    initialize() {
        this.createOverlay();
        this.attachEventListeners();
        console.log('⌨️ Keyboard Shortcuts Overlay initialized');
    },

    // Create overlay HTML
    createOverlay() {
        const overlay = document.createElement('div');
        overlay.id = 'keyboardShortcutsOverlay';
        overlay.className = 'keyboard-shortcuts-overlay';
        overlay.innerHTML = `
            <div class="shortcuts-modal enhanced-card">
                <div class="shortcuts-header">
                    <h2>⌨️ Keyboard Shortcuts</h2>
                    <button class="shortcuts-close" onclick="KeyboardShortcutsOverlay.hide()">&times;</button>
                </div>
                <div class="shortcuts-content">
                    ${this.renderShortcutsGrid()}
                </div>
                <div class="shortcuts-footer">
                    <p>Press <kbd>?</kbd> anytime to show this reference</p>
                    <p style="font-size: 0.875rem; opacity: 0.7; margin-top: 0.5rem;">
                        Tip: Most shortcuts work from anywhere in the application
                    </p>
                </div>
            </div>
        `;

        // Add styles
        const styles = document.createElement('style');
        styles.textContent = `
            .keyboard-shortcuts-overlay {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0, 0, 0, 0.75);
                backdrop-filter: blur(4px);
                display: none;
                align-items: center;
                justify-content: center;
                z-index: 10000;
                padding: 2rem;
                animation: fadeIn 0.2s ease;
            }

            .keyboard-shortcuts-overlay.visible {
                display: flex;
            }

            .shortcuts-modal {
                background: white;
                border-radius: 16px;
                max-width: 900px;
                width: 100%;
                max-height: 90vh;
                overflow: auto;
                box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
                animation: slideInUp 0.3s ease;
            }

            .shortcuts-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 2rem;
                border-bottom: 1px solid #e2e8f0;
            }

            .shortcuts-header h2 {
                margin: 0;
                font-size: 1.75rem;
                color: #2d3748;
            }

            .shortcuts-close {
                background: none;
                border: none;
                font-size: 2rem;
                color: #a0aec0;
                cursor: pointer;
                padding: 0;
                width: 40px;
                height: 40px;
                border-radius: 8px;
                transition: all 0.2s ease;
            }

            .shortcuts-close:hover {
                background: #edf2f7;
                color: #2d3748;
            }

            .shortcuts-content {
                padding: 2rem;
            }

            .shortcuts-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
                gap: 2rem;
            }

            .shortcuts-section {
                margin-bottom: 0;
            }

            .shortcuts-section h3 {
                font-size: 1.125rem;
                color: #4a5568;
                margin-bottom: 1rem;
                display: flex;
                align-items: center;
                gap: 0.5rem;
            }

            .shortcuts-section h3::before {
                content: '';
                width: 4px;
                height: 20px;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                border-radius: 2px;
            }

            .shortcut-item {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 0.75rem 0;
                border-bottom: 1px solid #f7fafc;
            }

            .shortcut-item:last-child {
                border-bottom: none;
            }

            .shortcut-description {
                color: #4a5568;
                font-size: 0.9375rem;
            }

            .shortcut-keys {
                display: flex;
                gap: 0.25rem;
                align-items: center;
            }

            .shortcut-keys kbd {
                background: linear-gradient(180deg, #ffffff 0%, #f7fafc 100%);
                border: 1px solid #cbd5e0;
                border-radius: 4px;
                padding: 0.25rem 0.5rem;
                font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', monospace;
                font-size: 0.8125rem;
                font-weight: 600;
                color: #2d3748;
                box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
                min-width: 24px;
                text-align: center;
            }

            .shortcut-keys .separator {
                color: #a0aec0;
                font-size: 0.75rem;
                margin: 0 0.125rem;
            }

            .shortcuts-footer {
                padding: 1.5rem 2rem;
                background: #f7fafc;
                border-top: 1px solid #e2e8f0;
                text-align: center;
                color: #4a5568;
            }

            .shortcuts-footer kbd {
                background: white;
                border: 1px solid #cbd5e0;
                border-radius: 4px;
                padding: 0.25rem 0.5rem;
                font-family: monospace;
                font-weight: 600;
            }

            @keyframes fadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
            }

            @keyframes slideInUp {
                from {
                    opacity: 0;
                    transform: translateY(20px);
                }
                to {
                    opacity: 1;
                    transform: translateY(0);
                }
            }

            @media (max-width: 768px) {
                .shortcuts-grid {
                    grid-template-columns: 1fr;
                }

                .shortcuts-modal {
                    margin: 1rem;
                }

                .shortcuts-header,
                .shortcuts-content,
                .shortcuts-footer {
                    padding: 1.5rem;
                }
            }
        `;

        document.head.appendChild(styles);
        document.body.appendChild(overlay);
    },

    // Render shortcuts grid
    renderShortcutsGrid() {
        let html = '<div class="shortcuts-grid">';

        for (const [category, shortcuts] of Object.entries(this.shortcuts)) {
            html += `
                <div class="shortcuts-section">
                    <h3>${category}</h3>
                    ${shortcuts.map(shortcut => this.renderShortcut(shortcut)).join('')}
                </div>
            `;
        }

        html += '</div>';
        return html;
    },

    // Render individual shortcut
    renderShortcut(shortcut) {
        const keys = this.isMac && shortcut.mac ? shortcut.mac : shortcut.keys;
        const keysHtml = keys.map(key => `<kbd>${this.formatKey(key)}</kbd>`).join('<span class="separator">+</span>');

        return `
            <div class="shortcut-item">
                <span class="shortcut-description">${shortcut.description}</span>
                <div class="shortcut-keys">${keysHtml}</div>
            </div>
        `;
    },

    // Format key display
    formatKey(key) {
        const keyMap = {
            'Ctrl': this.isMac ? '⌃' : 'Ctrl',
            'Alt': this.isMac ? '⌥' : 'Alt',
            'Shift': this.isMac ? '⇧' : 'Shift',
            'Enter': '↵',
            'Esc': 'Esc',
            'Space': 'Space',
            'Tab': 'Tab',
            '↑': '↑',
            '↓': '↓',
            '←': '←',
            '→': '→'
        };

        return keyMap[key] || key;
    },

    // Attach event listeners
    attachEventListeners() {
        // Keyboard listener for '?' or 'Shift+/'
        document.addEventListener('keydown', (e) => {
            // Show shortcuts with '?' or 'Shift+/'
            if (e.key === '?' || (e.shiftKey && e.key === '/')) {
                e.preventDefault();
                this.show();
            }

            // Hide shortcuts with 'Esc'
            if (e.key === 'Escape' && this.isVisible()) {
                e.preventDefault();
                this.hide();
            }
        });

        // Click outside to close
        const overlay = document.getElementById('keyboardShortcutsOverlay');
        overlay?.addEventListener('click', (e) => {
            if (e.target === overlay) {
                this.hide();
            }
        });
    },

    // Show overlay
    show() {
        const overlay = document.getElementById('keyboardShortcutsOverlay');
        if (overlay) {
            overlay.classList.add('visible');
            console.log('⌨️ Keyboard shortcuts reference displayed');
        }
    },

    // Hide overlay
    hide() {
        const overlay = document.getElementById('keyboardShortcutsOverlay');
        if (overlay) {
            overlay.classList.remove('visible');
        }
    },

    // Check if visible
    isVisible() {
        const overlay = document.getElementById('keyboardShortcutsOverlay');
        return overlay?.classList.contains('visible');
    },

    // Add custom shortcut
    addShortcut(category, shortcut) {
        if (!this.shortcuts[category]) {
            this.shortcuts[category] = [];
        }
        this.shortcuts[category].push(shortcut);
    }
};

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        KeyboardShortcutsOverlay.initialize();
    });
} else {
    KeyboardShortcutsOverlay.initialize();
}

// Make available globally
window.KeyboardShortcutsOverlay = KeyboardShortcutsOverlay;
