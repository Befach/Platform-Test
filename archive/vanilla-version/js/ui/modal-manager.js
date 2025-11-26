// Modal Manager - Centralized modal management for the application
const modalManager = {
    /**
     * Show alert modal
     * @param {Object} options - Alert options
     * @param {String} options.title - Alert title
     * @param {String} options.message - Alert message
     * @param {String} options.buttonText - Button text
     * @param {String} options.variant - Variant (info, warning, danger, success)
     * @returns {Promise<Boolean>} Resolves to true when closed
     */
    showAlert({ title = 'Notice', message = '', buttonText = 'OK', variant = 'info' } = {}) {
        return new Promise((resolve) => {
            const overlay = document.createElement('div');
            overlay.className = 'link-picker-overlay';
            const modal = document.createElement('div');
            modal.className = 'link-picker-modal';
            modal.setAttribute('role', 'dialog');
            modal.setAttribute('aria-modal', 'true');
            modal.innerHTML = `
                <h3>${title}</h3>
                <div style="color:var(--text-primary); font-size:13px; line-height:1.5; margin-bottom:10px;">${message}</div>
                <div class="link-picker-actions">
                    <button id="alert-ok" style="background:${variant==='danger' ? 'var(--danger)' : (variant==='warning' ? 'var(--warning)' : 'var(--info)')}; color:var(--text-inverse); width:100%">${buttonText}</button>
                </div>
            `;
            const release = this.trapFocus(modal);
            const closeAll = () => {
                release && release();
                document.body.removeChild(overlay);
                document.body.removeChild(modal);
                resolve(true);
            };
            overlay.addEventListener('click', closeAll);
            modal.querySelector('#alert-ok').addEventListener('click', closeAll);
            document.body.appendChild(overlay);
            document.body.appendChild(modal);
            setTimeout(() => modal.querySelector('#alert-ok').focus(), 0);
            const escHandler = (e) => {
                if (e.key === 'Escape') {
                    closeAll();
                    document.removeEventListener('keydown', escHandler);
                }
            };
            document.addEventListener('keydown', escHandler);
        });
    },

    /**
     * Show confirmation modal
     * @param {Object} options - Confirmation options
     * @param {String} options.title - Confirmation title
     * @param {String} options.message - Confirmation message
     * @param {String} options.confirmText - Confirm button text
     * @param {String} options.cancelText - Cancel button text
     * @param {String} options.variant - Variant (info, danger)
     * @param {String} options.dontAskAgainKey - localStorage key for "don't ask again" feature
     * @returns {Promise<Boolean>} Resolves to true if confirmed, false if cancelled
     */
    showConfirm({ title = 'Are you sure?', message = '', confirmText = 'OK', cancelText = 'Cancel', variant = 'info', dontAskAgainKey = null } = {}) {
        return new Promise((resolve) => {
            // Check if user has previously selected "don't ask again"
            if (dontAskAgainKey) {
                const dontAskAgain = localStorage.getItem(dontAskAgainKey);
                if (dontAskAgain === 'true') {
                    resolve(true);
                    return;
                }
            }

            const overlay = document.createElement('div');
            overlay.className = 'link-picker-overlay';
            const modal = document.createElement('div');
            modal.className = 'link-picker-modal';
            modal.setAttribute('role', 'dialog');
            modal.setAttribute('aria-modal', 'true');

            const dontAskAgainCheckbox = dontAskAgainKey ? `
                <div style="margin-bottom:12px; padding:8px; background:rgba(0,0,0,0.05); border-radius:4px;">
                    <label style="display:flex; align-items:center; gap:8px; cursor:pointer; font-size:12px; color:var(--text-secondary);">
                        <input type="checkbox" id="dontAskAgainCheckbox" style="cursor:pointer;">
                        <span>Don't ask me again</span>
                    </label>
                </div>
            ` : '';

            modal.innerHTML = `
                <h3>${title}</h3>
                <div style="color:var(--text-primary); font-size:13px; line-height:1.5; margin-bottom:10px;">${message}</div>
                ${dontAskAgainCheckbox}
                <div class="link-picker-actions">
                    <button id="confirm-cancel" style="background:var(--neutral-medium); color:var(--text-inverse);">${cancelText}</button>
                    <button id="confirm-ok" style="background:${variant==='danger' ? 'var(--danger)' : 'var(--success)'}; color:var(--text-inverse);">${confirmText}</button>
                </div>
            `;
            const release = this.trapFocus(modal);
            const closeAll = (val) => {
                // Save "don't ask again" preference if checkbox exists and is checked
                if (dontAskAgainKey && val) {
                    const checkbox = modal.querySelector('#dontAskAgainCheckbox');
                    if (checkbox && checkbox.checked) {
                        localStorage.setItem(dontAskAgainKey, 'true');
                    }
                }

                release && release();
                document.body.removeChild(overlay);
                document.body.removeChild(modal);
                resolve(val);
            };
            overlay.addEventListener('click', () => closeAll(false));
            modal.querySelector('#confirm-cancel').addEventListener('click', () => closeAll(false));
            modal.querySelector('#confirm-ok').addEventListener('click', () => closeAll(true));
            document.body.appendChild(overlay);
            document.body.appendChild(modal);
            setTimeout(() => modal.querySelector('#confirm-ok').focus(), 0);
            const escHandler = (e) => {
                if (e.key === 'Escape') {
                    closeAll(false);
                    document.removeEventListener('keydown', escHandler);
                }
            };
            document.addEventListener('keydown', escHandler);
        });
    },

    /**
     * Focus trap utility for accessibility
     * Traps keyboard focus within a container (modal)
     * @param {HTMLElement} container - Container element to trap focus within
     * @returns {Function} Release function to remove trap and restore focus
     */
    trapFocus(container) {
        const focusableSelector = 'a[href], button, textarea, input, select, [tabindex]:not([tabindex="-1"])';
        const focusables = Array.from(container.querySelectorAll(focusableSelector)).filter(el => !el.hasAttribute('disabled') && !el.getAttribute('aria-hidden'));
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        const prev = document.activeElement;
        const handler = (e) => {
            if (e.key !== 'Tab') return;
            if (e.shiftKey) {
                if (document.activeElement === first) { e.preventDefault(); last.focus(); }
            } else {
                if (document.activeElement === last) { e.preventDefault(); first.focus(); }
            }
        };
        document.addEventListener('keydown', handler);
        if (first) first.focus();
        return () => {
            document.removeEventListener('keydown', handler);
            if (prev && typeof prev.focus === 'function') { try { prev.focus(); } catch {} }
        };
    },

    /**
     * Escape HTML to prevent XSS
     * @param {String} text - Text to escape
     * @returns {String} Escaped HTML
     */
    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    },

    /**
     * Show workspace creation/edit modal
     * @param {String} workspaceId - Workspace ID (null for create new)
     * @param {Object} app - App instance with workspaces array and methods
     */
    showWorkspaceModal(workspaceId = null, app) {
        const isEdit = workspaceId !== null;
        const workspace = isEdit ? app.workspaces.find(w => w.id === workspaceId) : null;

        const modal = document.createElement('div');
        modal.id = 'workspaceModalOverlay';
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal-content workspace-modal">
                <div class="modal-header">
                    <h3>${isEdit ? 'Edit Workspace' : 'Create New Workspace'}</h3>
                    <button class="modal-close" onclick="modalManager.closeWorkspaceModal()">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="form-group">
                        <label for="workspaceName">Workspace Name *</label>
                        <input type="text" id="workspaceName" class="form-control"
                               placeholder="e.g., Product Roadmap 2024"
                               value="${isEdit ? this.escapeHtml(workspace.name) : ''}" required>
                    </div>
                    <div class="form-group">
                        <label for="workspaceDescription">Description</label>
                        <textarea id="workspaceDescription" class="form-control" rows="3"
                                  placeholder="Optional description for this workspace">${isEdit ? this.escapeHtml(workspace.description) : ''}</textarea>
                    </div>
                    <div class="form-group">
                        <label for="workspaceColor">Color</label>
                        <div class="color-picker">
                            <input type="color" id="workspaceColor" value="${isEdit ? workspace.color : '#3b82f6'}">
                            <span class="color-preview" id="colorPreview"></span>
                        </div>
                    </div>
                    <div class="form-group">
                        <label for="workspaceIcon">Icon (Emoji)</label>
                        <div class="icon-picker" id="iconPicker">
                            ${[
                                '📊', '📈', '📉', '📋', '📝', '📅', '🎯', '⭐', '🚀', '💡',
                                '🔧', '⚙️', '🎨', '📱', '💻', '🌐', '🔗', '📂', '📁', '🗂️',
                                '📄', '📃', '🏗️', '🛠️', '🔍', '📊', '💼', '🏢', '🏭', '🏪'
                            ].map(icon => `
                                <button type="button" class="icon-option ${icon === (isEdit ? workspace.icon : '📊') ? 'selected' : ''}"
                                        onclick="modalManager.selectWorkspaceIcon('${icon}')" title="${icon}">
                                    ${icon}
                                </button>
                            `).join('')}
                        </div>
                        <input type="hidden" id="workspaceIcon" value="${isEdit ? workspace.icon : '📊'}">
                        <small class="form-hint">Choose an emoji to represent this workspace</small>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn-secondary" onclick="modalManager.closeWorkspaceModal()">Cancel</button>
                    <button class="btn-primary" onclick="modalManager.saveWorkspaceFromModal(${isEdit ? `'${workspaceId}'` : 'null'}, app)">
                        ${isEdit ? 'Save Changes' : 'Create Workspace'}
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        document.getElementById('workspaceName').focus();
    },

    /**
     * Close workspace creation/edit modal
     */
    closeWorkspaceModal() {
        const modal = document.getElementById('workspaceModalOverlay');
        if (modal) modal.remove();
    },

    /**
     * Select workspace icon from picker
     * @param {String} icon - Selected emoji
     */
    selectWorkspaceIcon(icon) {
        document.getElementById('workspaceIcon').value = icon;

        // Update visual selection
        const picker = document.getElementById('iconPicker');
        const options = picker.querySelectorAll('.icon-option');
        options.forEach(option => {
            option.classList.remove('selected');
            if (option.textContent.trim() === icon) {
                option.classList.add('selected');
            }
        });
    },

    /**
     * Save workspace from modal (called by workspace modal buttons)
     * @param {String} workspaceId - Workspace ID (null for new workspace)
     * @param {Object} app - App instance
     */
    async saveWorkspaceFromModal(workspaceId, app) {
        const name = document.getElementById('workspaceName').value.trim();
        const description = document.getElementById('workspaceDescription').value.trim();
        const color = document.getElementById('workspaceColor').value;
        const icon = document.getElementById('workspaceIcon').value.trim() || '📊';

        if (!name) {
            this.showAlert({ title: 'Validation Error', message: 'Workspace name is required', variant: 'warning' });
            return;
        }

        try {
            if (workspaceId) {
                // Update existing workspace
                await app.updateWorkspace(workspaceId, { name, description, color, icon });
                this.showAlert({ title: 'Success', message: 'Workspace updated successfully', variant: 'success' });
            } else {
                // Create new workspace
                const workspace = await app.createWorkspace(name, description, color, icon);

                // Switch to the new workspace
                await app.switchWorkspace(workspace.id);

                this.showAlert({ title: 'Success', message: 'Workspace created successfully', variant: 'success' });
            }

            this.closeWorkspaceModal();
        } catch (error) {
            console.error('❌ Error saving workspace:', error);
            this.showAlert({ title: 'Error', message: 'Failed to save workspace. Please try again.', variant: 'danger' });
        }
    },

    /**
     * Show workspace management modal (list all workspaces)
     * @param {Object} app - App instance
     */
    showWorkspaceManageModal(app) {
        // Close dropdown first
        const dropdown = document.getElementById('workspaceDropdownMenu');
        if (dropdown) dropdown.classList.add('hidden');

        const modal = document.createElement('div');
        modal.id = 'workspaceManageOverlay';
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal-content workspace-manage-modal">
                <div class="modal-header">
                    <h3>Manage Workspaces</h3>
                    <button class="modal-close" onclick="modalManager.closeWorkspaceManageModal()">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="workspace-list">
                        ${app.workspaces.map(w => {
                            const featureCount = app.features.filter(f => f.workspaceId === w.id).length;
                            return `
                                <div class="workspace-list-item ${w.id === app.currentWorkspaceId ? 'active' : ''}">
                                    <div class="workspace-info">
                                        <span class="workspace-icon-lg" style="color: ${w.color}">${w.icon}</span>
                                        <div class="workspace-details">
                                            <div class="workspace-title">${this.escapeHtml(w.name)}</div>
                                            <div class="workspace-meta">
                                                ${w.description ? `<div>${this.escapeHtml(w.description)}</div>` : ''}
                                                <div class="workspace-stats">${featureCount} feature${featureCount !== 1 ? 's' : ''}</div>
                                            </div>
                                        </div>
                                    </div>
                                    <div class="workspace-actions">
                                        ${w.id === app.currentWorkspaceId ? '<span class="workspace-badge-current">Current</span>' : `<button class="btn-sm btn-secondary" onclick="modalManager.selectWorkspaceFromManage('${w.id}', app)">Switch</button>`}
                                        <button class="btn-sm btn-secondary" onclick="modalManager.editWorkspaceFromManage('${w.id}', app)">Edit</button>
                                        <button class="btn-sm btn-danger" onclick="modalManager.deleteWorkspaceFromManage('${w.id}', app)">Delete</button>
                                    </div>
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn-primary" onclick="modalManager.showWorkspaceModalFromManage(app)">+ New Workspace</button>
                    <button class="btn-secondary" onclick="modalManager.closeWorkspaceManageModal()">Close</button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
    },

    /**
     * Close workspace management modal
     */
    closeWorkspaceManageModal() {
        const modal = document.getElementById('workspaceManageOverlay');
        if (modal) modal.remove();
    },

    /**
     * Select workspace from manage modal (switch to workspace)
     * @param {String} workspaceId - Workspace ID to switch to
     * @param {Object} app - App instance
     */
    async selectWorkspaceFromManage(workspaceId, app) {
        await app.switchWorkspace(workspaceId);
        this.closeWorkspaceManageModal();
    },

    /**
     * Edit workspace from manage modal
     * @param {String} workspaceId - Workspace ID to edit
     * @param {Object} app - App instance
     */
    editWorkspaceFromManage(workspaceId, app) {
        this.closeWorkspaceManageModal();
        this.showWorkspaceModal(workspaceId, app);
    },

    /**
     * Delete workspace from manage modal
     * @param {String} workspaceId - Workspace ID to delete
     * @param {Object} app - App instance
     */
    async deleteWorkspaceFromManage(workspaceId, app) {
        const deleted = await app.deleteWorkspace(workspaceId);
        if (deleted) {
            this.closeWorkspaceManageModal();
            // Reopen if there are still workspaces
            if (app.workspaces.length > 0) {
                setTimeout(() => this.showWorkspaceManageModal(app), 300);
            }
        }
    },

    /**
     * Show workspace modal from manage modal (create new workspace)
     * @param {Object} app - App instance
     */
    showWorkspaceModalFromManage(app) {
        this.closeWorkspaceManageModal();
        this.showWorkspaceModal(null, app);
    },

    /**
     * Close feature modal
     * @param {Object} app - App instance
     */
    closeFeatureModal(app) {
        document.getElementById('featureModal').classList.remove('active');
        if (app._featureModalRelease) {
            app._featureModalRelease();
            app._featureModalRelease = null;
        }
        // Reset saving flag if modal is closed
        app.isSavingFeature = false;
        // Reset save button state
        const saveButton = document.querySelector('#featureModal button[type="submit"]');
        if (saveButton) {
            saveButton.disabled = false;
            saveButton.textContent = 'Save Feature';
            saveButton.style.opacity = '';
            saveButton.style.cursor = '';
        }
    }
};
