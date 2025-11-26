/**
 * Feature Table Module
 * Handles table rendering, filtering, sorting, and bulk operations
 *
 * Extracted from index.html as part of Phase 5.3 refactoring
 * Lines extracted: ~400 lines
 * Methods: 14 table-related methods
 */

const featureTable = {
    /**
     * Render the main features table with all columns and filtering
     * Shows features in a table view with inline editing capabilities
     */
    renderTable(app) {
        const tbody = document.getElementById('tableBody');
        const filtered = this.getFilteredFeatures(app);

        if (filtered.length === 0) {
            tbody.innerHTML = '<tr><td colspan="11" style="text-align:center; padding:40px; color:var(--text-muted);">No features found. Click "Add Feature" to get started!</td></tr>';
            return;
        }

        // Get filter values
        const timelineFilter = document.getElementById('timelineFilter')?.value || '';
        const difficultyFilter = document.getElementById('difficultyFilter')?.value || '';

        tbody.innerHTML = filtered.map(feature => {
            let timelineItems = feature.timelineItems || [];

            // Filter timeline items based on active filters
            if (timelineFilter) {
                timelineItems = timelineItems.filter(item => item.timeline === timelineFilter);
            }
            if (difficultyFilter) {
                timelineItems = timelineItems.filter(item => item.difficulty === difficultyFilter);
            }

            // Create vertical timeline badges
            const timelineBadges = timelineItems.map(item =>
                `<span class="badge badge-${item.timeline.toLowerCase()}" style="display:block; margin-bottom:4px;">${item.timeline}</span>`
            ).join('');

            // Create vertical difficulty badges (matching timeline order)
            const difficultyBadges = timelineItems.map(item =>
                `<span class="badge badge-${item.difficulty.toLowerCase()}" style="display:block; margin-bottom:4px;">${item.difficulty}</span>`
            ).join('');

            // Get all unique categories from filtered timeline items only
            const allCategories = [...new Set(timelineItems.flatMap(item => item.category || []))];
            const categoryTags = allCategories.map(c => `<span class="tag">${c}</span>`).join(' ');

            // Get summaries or create fallback based on filtered timeline items
            const summary = feature.summary || {
                usp: timelineItems.map(item => item.usp).filter(u => u).join('; ') || '-',
                integrationType: timelineItems.map(item => item.integrationType).filter(i => i).join('; ') || '-'
            };

            // Get linked items only from filtered timeline items
            const allLinks = [];
            timelineItems.forEach(item => {
                if (item.linkedItems && item.linkedItems.length > 0) {
                    item.linkedItems.forEach(link => {
                        const linkedFeature = app.features.find(f => f.id === link.linkedFeatureId);
                        const linkedItem = linkedFeature?.timelineItems.find(i => i.id === link.linkedItemId);
                        if (linkedFeature && linkedItem) {
                            allLinks.push({
                                featureName: linkedFeature.name,
                                timeline: linkedItem.timeline,
                                type: link.relationshipType,
                                direction: link.direction,
                                reason: link.reason || 'No description provided'
                            });
                        }
                    });
                }
            });

            const linkedItemsBadges = allLinks.length > 0
                ? allLinks.map(link => {
                    const typeClass = link.type === 'dependency' ? 'badge-mvp' : 'badge-short';
                    const arrow = link.direction === 'outgoing' ? '→' : '←';
                    const typeLabel = link.type === 'dependency' ? 'Dependency' : 'Complements';
                    const directionLabel = link.direction === 'outgoing' ? 'depends on' : 'is depended on by';
                    const tooltipText = `${typeLabel}: ${link.reason}`;
                    return `<span class="badge ${typeClass} linked-item-badge" style="display:block; margin-bottom:4px; font-size:11px; cursor:help;" title="${tooltipText}">${arrow} ${link.featureName} (${link.timeline})</span>`;
                }).join('')
                : '<span style="color:var(--text-muted);">-</span>';

            // AI modification badges
            const aiCreatedBadge = feature.aiCreated ? '<span class="badge" style="background:var(--primary); font-size:10px; margin-left:5px; color:var(--text-inverse);">AI Created</span>' : '';
            const aiModifiedBadge = feature.aiModified ? '<span class="badge" style="background:var(--info); font-size:10px; margin-left:5px; color:var(--text-inverse);">AI Modified</span>' : '';

            // Status/Priority/Health badges
            const statusColors = {
                'not_started': '#94a3b8',
                'planning': '#3b82f6',
                'in_progress': '#8b5cf6',
                'blocked': '#ef4444',
                'review': '#f59e0b',
                'completed': '#10b981',
                'on_hold': '#6b7280',
                'cancelled': '#475569'
            };
            const priorityColors = {
                'low': '#94a3b8',
                'medium': '#3b82f6',
                'high': '#f59e0b',
                'critical': '#ef4444'
            };
            const healthIcons = {
                'on_track': '✅',
                'at_risk': '⚠️',
                'off_track': '🔴',
                'unknown': '❓'
            };

            const status = feature.status || 'not_started';
            const priority = feature.priority || 'medium';
            const health = feature.health || 'on_track';

            const statusBadge = `<span class="badge" style="background:${statusColors[status]}; font-size:10px; margin-left:5px; color:white;">${status.replace('_', ' ').toUpperCase()}</span>`;
            const priorityBadge = `<span class="badge" style="background:${priorityColors[priority]}; font-size:10px; margin-left:5px; color:white;">${priority.toUpperCase()}</span>`;
            const healthBadge = `<span style="font-size:14px; margin-left:5px;" title="${health.replace('_', ' ')}">${healthIcons[health]}</span>`;

            // Workflow stage badge
            let workflowBadge = '';
            if (feature.workspaceId && typeof workflowOrchestrator !== 'undefined') {
                const workspace = app.workspaces.find(w => w.id === feature.workspaceId);
                if (workspace && workspace.workflowModeEnabled) {
                    const stage = workflowOrchestrator.getCurrentStage(feature);
                    const stageLabel = workflowOrchestrator.STAGE_LABELS[stage];
                    const stageIcon = workflowOrchestrator.getStageIcon(stage);
                    const stageClass = workflowOrchestrator.getStageClass(stage);
                    workflowBadge = `<span class="badge ${stageClass}" style="font-size:10px; margin-left:5px;" title="Workflow Stage: ${stageLabel}">${stageIcon} ${stage.toUpperCase()}</span>`;
                }
            }

            const isSelected = app.selectedFeatureIds.has(feature.id);
            const safeName = (feature.name || '').replace(/"/g,'&quot;');
            const nameCell = `
                <div>
                    <span class="focus-ring" style="cursor:pointer; color: var(--primary);" onclick="app.showDetailView('${feature.id}')" ondblclick="app.startInlineEdit('${feature.id}','name','${safeName}')"><strong>${feature.name}</strong></span>
                    ${workflowBadge}${aiCreatedBadge}${aiModifiedBadge}${statusBadge}${priorityBadge}${healthBadge}
                </div>`;
            const typeCell = `
                <select class="focus-ring" onchange="featureTable.inlineUpdateType(app, '${feature.id}', this.value)">
                    <option value="Feature" ${ (feature.type || 'Feature')==='Feature' ? 'selected' : ''}>Feature</option>
                    <option value="Service" ${ (feature.type || 'Feature')==='Service' ? 'selected' : ''}>Service</option>
                </select>`;
            const purposeCell = `<div class="clamp-2" title="${(feature.purpose || '').replace(/"/g,'&quot;')}">${feature.purpose || '-'}</div>`;
            const uspCell = `<div class="clamp-2" title="${(summary.usp || '').replace(/"/g,'&quot;')}">${summary.usp}</div>`;
            const integCell = `<div class="clamp-2" title="${(summary.integrationType || '').replace(/"/g,'&quot;')}">${summary.integrationType}</div>`;

            return `
                <tr>
                    <td><input type="checkbox" ${isSelected ? 'checked' : ''} onchange="featureTable.toggleSelectOne(app, '${feature.id}', this.checked)" aria-label="Select ${safeName}" class="focus-ring"></td>
                    <td>${nameCell}</td>
                    <td>${typeCell}</td>
                    <td style="padding:8px;">${timelineBadges || '-'}</td>
                    <td style="padding:8px;">${difficultyBadges || '-'}</td>
                    <td>${purposeCell}</td>
                    <td>${uspCell}</td>
                    <td>${integCell}</td>
                    <td>${categoryTags || '-'}</td>
                    <td style="padding:8px;">${linkedItemsBadges}</td>
                    <td>
                        <div class="action-buttons">
                            <button class="btn-secondary btn-icon" onclick="app.showDetailView('${feature.id}')" title="View details">👁️</button>
                            <button class="btn-primary btn-icon" onclick="app.showEditModal('${feature.id}')">Edit</button>
                            <button class="btn-danger btn-icon" onclick="app.deleteFeature('${feature.id}')">Delete</button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');

        // Update category filter dropdown with current categories
        this.populateCategoryFilter(app);
        this.updateBulkActionsBar(app);
    },

    /**
     * Get filtered and sorted features based on active filters
     * @returns {Array} Filtered and sorted features
     */
    getFilteredFeatures(app) {
        let filtered = [...app.features];

        // Apply search
        const search = document.getElementById('searchInput').value.toLowerCase();
        if (search) {
            filtered = filtered.filter(f => {
                // Search in feature-level fields
                if (f.name.toLowerCase().includes(search) ||
                    (f.purpose && f.purpose.toLowerCase().includes(search)) ||
                    (f.tags && f.tags.some(t => t.toLowerCase().includes(search)))) {
                    return true;
                }

                // Search in timeline items
                if (f.timelineItems) {
                    return f.timelineItems.some(item =>
                        (item.usp && item.usp.toLowerCase().includes(search)) ||
                        (item.integrationType && item.integrationType.toLowerCase().includes(search)) ||
                        (item.category && item.category.some(c => c.toLowerCase().includes(search)))
                    );
                }
                return false;
            });
        }

        // Apply timeline filter (filter by ANY timeline item matching)
        const timeline = document.getElementById('timelineFilter').value;
        if (timeline) {
            filtered = filtered.filter(f =>
                f.timelineItems && f.timelineItems.some(item => item.timeline === timeline)
            );
        }

        // Apply category filter (filter by ANY timeline item matching)
        const category = document.getElementById('categoryFilter').value;
        if (category) {
            filtered = filtered.filter(f =>
                f.timelineItems && f.timelineItems.some(item =>
                    item.category && item.category.includes(category)
                )
            );
        }

        // Apply difficulty filter (filter by ANY timeline item matching)
        const difficulty = document.getElementById('difficultyFilter').value;
        if (difficulty) {
            filtered = filtered.filter(f =>
                f.timelineItems && f.timelineItems.some(item => item.difficulty === difficulty)
            );
        }

        // Apply sorting
        if (app.sortColumn) {
            filtered.sort((a, b) => {
                const aVal = a[app.sortColumn] || '';
                const bVal = b[app.sortColumn] || '';
                const comparison = aVal.toString().localeCompare(bVal.toString());
                return app.sortDirection === 'asc' ? comparison : -comparison;
            });
        }

        return filtered;
    },

    /**
     * Sort table by column
     * @param {Object} app - App instance
     * @param {Event} evt - Click event
     * @param {string} column - Column name to sort by
     */
    sortTable(app, evt, column) {
        if (app.sortColumn === column) {
            app.sortDirection = app.sortDirection === 'asc' ? 'desc' : 'asc';
        } else {
            app.sortColumn = column;
            app.sortDirection = 'asc';
        }

        // Update header styling
        document.querySelectorAll('th').forEach(th => {
            th.classList.remove('sorted-asc', 'sorted-desc');
        });
        const thEl = (evt && evt.currentTarget) ? evt.currentTarget : (typeof event !== 'undefined' ? event.target : null);
        thEl && thEl.classList.add(`sorted-${app.sortDirection}`);

        app.saveUIState();
        this.renderTable(app);
    },

    /**
     * Apply current filters and re-render table
     * @param {Object} app - App instance
     */
    applyFilters(app) {
        app.saveUIState();
        this.renderTable(app);
    },

    /**
     * Clear all filters and re-render table
     * @param {Object} app - App instance
     */
    clearFilters(app) {
        document.getElementById('searchInput').value = '';
        document.getElementById('timelineFilter').value = '';
        document.getElementById('categoryFilter').value = '';
        document.getElementById('difficultyFilter').value = '';
        this.applyFilters(app);
    },

    /**
     * Populate category filter dropdown with all existing categories
     * @param {Object} app - App instance
     */
    populateCategoryFilter(app) {
        const categoryFilter = document.getElementById('categoryFilter');
        if (!categoryFilter) return;

        // Get current selected value
        const currentValue = categoryFilter.value;

        // Get all unique categories from all timeline items
        const allCategories = this.getAllExistingCategories(app);

        // Rebuild dropdown
        categoryFilter.innerHTML = '<option value="">All Categories</option>';
        allCategories.forEach(cat => {
            const option = document.createElement('option');
            option.value = cat;
            option.textContent = cat;
            categoryFilter.appendChild(option);
        });

        // Restore selected value if it still exists
        if (currentValue && allCategories.includes(currentValue)) {
            categoryFilter.value = currentValue;
        }
    },

    /**
     * Get all existing categories from all features, sorted by frequency
     * @param {Object} app - App instance
     * @returns {Array} Array of category names sorted by frequency
     */
    getAllExistingCategories(app) {
        // Collect all categories from all features' timeline items with frequency
        const categoryCount = {};

        app.features.forEach(feature => {
            if (feature.timelineItems) {
                feature.timelineItems.forEach(item => {
                    if (item.category) {
                        item.category.forEach(cat => {
                            categoryCount[cat] = (categoryCount[cat] || 0) + 1;
                        });
                    }
                });
            }
        });

        // Convert to array and sort by frequency (most frequent first)
        return Object.entries(categoryCount)
            .sort((a, b) => b[1] - a[1])
            .map(([category]) => category);
    },

    /**
     * Export features to CSV file
     * Creates one row per timeline item for detailed export
     * @param {Object} app - App instance
     */
    async exportToCSV(app) {
        if (app.features.length === 0) {
            await app.showAlert({ title:'Nothing to export', message:'No features to export!' });
            return;
        }

        const headers = ['Feature Name', 'Type', 'Purpose', 'Timeline', 'Difficulty', 'USP', 'Integration Type', 'Categories', 'Created', 'Updated'];

        // Flatten: one row per timeline item
        const rows = [];
        app.features.forEach(f => {
            const timelineItems = f.timelineItems || [];

            if (timelineItems.length === 0) {
                // Handle features without timeline items (legacy data)
                rows.push([
                    f.name,
                    f.type || 'Feature',
                    f.purpose || '',
                    '-',
                    '-',
                    '-',
                    '-',
                    '-',
                    new Date(f.createdAt).toLocaleDateString(),
                    new Date(f.updatedAt).toLocaleDateString()
                ]);
            } else {
                // Create one row per timeline item
                timelineItems.forEach(item => {
                    rows.push([
                        f.name,
                        f.type || 'Feature',
                        f.purpose || '',
                        item.timeline || '-',
                        item.difficulty || '-',
                        item.usp || '-',
                        item.integrationType || '-',
                        (item.category || []).join('; '),
                        new Date(f.createdAt).toLocaleDateString(),
                        new Date(f.updatedAt).toLocaleDateString()
                    ]);
                });
            }
        });

        const csv = [
            headers.join(','),
            ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
        ].join('\n');

        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `roadmap-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    },

    /**
     * Inline update feature type from table dropdown
     * @param {Object} app - App instance
     * @param {string} id - Feature ID
     * @param {string} value - New type value
     */
    inlineUpdateType(app, id, value) {
        const f = app.features.find(x => x.id === id);
        if (!f) return;
        f.type = value;
        f.updatedAt = new Date().toISOString();
        app.saveData();
        this.renderTable(app);
    },

    /**
     * Toggle selection of all filtered features
     * @param {Object} app - App instance
     * @param {boolean} checked - Whether to select or deselect all
     */
    toggleSelectAll(app, checked) {
        const filtered = this.getFilteredFeatures(app);
        if (checked) { filtered.forEach(f => app.selectedFeatureIds.add(f.id)); }
        else { filtered.forEach(f => app.selectedFeatureIds.delete(f.id)); }
        this.renderTable(app);
    },

    /**
     * Toggle selection of a single feature
     * @param {Object} app - App instance
     * @param {string} id - Feature ID
     * @param {boolean} checked - Whether to select or deselect
     */
    toggleSelectOne(app, id, checked) {
        if (checked) app.selectedFeatureIds.add(id);
        else app.selectedFeatureIds.delete(id);
        this.updateBulkActionsBar(app);
    },

    /**
     * Update bulk actions bar visibility and count
     * @param {Object} app - App instance
     */
    updateBulkActionsBar(app) {
        const bar = document.getElementById('bulkActions');
        if (!bar) return;
        const count = app.selectedFeatureIds.size;
        const label = document.getElementById('bulkCount');
        if (label) label.textContent = count;
        if (count > 0) bar.classList.add('active');
        else bar.classList.remove('active');
    },

    /**
     * Delete all selected features
     * @param {Object} app - App instance
     */
    async bulkDeleteSelected(app) {
        if (app.selectedFeatureIds.size === 0) return;
        const ok = await app.showConfirm({
            title: 'Delete selected features?',
            message: `This will delete ${app.selectedFeatureIds.size} feature(s). This cannot be undone.`,
            confirmText: 'Delete',
            cancelText: 'Cancel',
            variant: 'danger'
        });
        if (!ok) return;
        app.features = app.features.filter(f => !app.selectedFeatureIds.has(f.id));
        app.selectedFeatureIds.clear();
        app.saveData();
        this.renderTable(app);
        app.showToast('Deleted selected features', 'success');
    },

    /**
     * Export only selected features to CSV
     * @param {Object} app - App instance
     */
    exportSelectedToCSV(app) {
        if (app.selectedFeatureIds.size === 0) return this.exportToCSV(app);
        const backup = app.features;
        app.features = app.features.filter(f => app.selectedFeatureIds.has(f.id));
        try { this.exportToCSV(app); }
        finally { app.features = backup; }
    }
};

// Export for testing
if (typeof module !== 'undefined' && module.exports) {
    module.exports = featureTable;
}
