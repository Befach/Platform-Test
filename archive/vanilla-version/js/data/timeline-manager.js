// Timeline Manager - Timeline item management for features
const timelineManager = {
    /**
     * Add timeline item to a feature
     * @param {String} featureId - Feature ID
     * @param {Object} item Item data (name, timeline, difficulty, category, linkedItems)
     * @param {Array} features - Features array
     * @returns {Object|null} Added timeline item or null
     */
    addItem(featureId, itemData, features) {
        const feature = features.find(f => f.id === featureId);
        if (!feature) {
            console.error('❌ Feature not found:', featureId);
            return null;
        }

        const item = {
            id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
            name: itemData.name,
            timeline: itemData.timeline, // MVP, SHORT, LONG
            difficulty: itemData.difficulty, // easy, medium, hard, epic
            category: itemData.category || [],
            description: itemData.description || '',
            linkedItems: itemData.linkedItems || [],
            createdAt: new Date().toISOString()
        };

        if (!feature.timelineItems) {
            feature.timelineItems = [];
        }

        feature.timelineItems.push(item);
        feature.updatedAt = new Date().toISOString();

        console.log('✅ Added timeline item:', item.name);
        return item;
    },

    /**
     * Update timeline item in a feature
     * @param {String} featureId - Feature ID
     * @param {String} itemId - Timeline item ID
     * @param {Object} updates - Properties to update
     * @param {Array} features - Features array
     * @returns {Boolean} Success status
     */
    updateItem(featureId, itemId, updates, features) {
        const feature = features.find(f => f.id === featureId);
        if (!feature || !feature.timelineItems) {
            console.error('❌ Feature not found:', featureId);
            return false;
        }

        const item = feature.timelineItems.find(i => i.id === itemId);
        if (!item) {
            console.error('❌ Timeline item not found:', itemId);
            return false;
        }

        // Update properties
        Object.keys(updates).forEach(key => {
            if (key !== 'id' && key !== 'createdAt') {
                item[key] = updates[key];
            }
        });

        feature.updatedAt = new Date().toISOString();

        console.log('✅ Updated timeline item:', item.name);
        return true;
    },

    /**
     * Delete timeline item from a feature
     * @param {String} featureId - Feature ID
     * @param {String} itemId - Timeline item ID
     * @param {Array} features - Features array
     * @returns {Boolean} Success status
     */
    deleteItem(featureId, itemId, features) {
        const feature = features.find(f => f.id === featureId);
        if (!feature || !feature.timelineItems) {
            console.error('❌ Feature not found:', featureId);
            return false;
        }

        const index = feature.timelineItems.findIndex(i => i.id === itemId);
        if (index === -1) {
            console.error('❌ Timeline item not found:', itemId);
            return false;
        }

        const item = feature.timelineItems[index];

        // Remove all links to/from this item
        feature.timelineItems.forEach(otherItem => {
            if (otherItem.linkedItems) {
                otherItem.linkedItems = otherItem.linkedItems.filter(l =>
                    l.targetId !== itemId && l.sourceId !== itemId
                );
            }
        });

        feature.timelineItems.splice(index, 1);
        feature.updatedAt = new Date().toISOString();

        console.log('✅ Deleted timeline item:', item.name);
        return true;
    },

    /**
     * Get timeline item by ID
     * @param {String} featureId - Feature ID
     * @param {String} itemId - Timeline item ID
     * @param {Array} features - Features array
     * @returns {Object|null} Timeline item or null
     */
    getItemById(featureId, itemId, features) {
        const feature = features.find(f => f.id === featureId);
        if (!feature || !feature.timelineItems) return null;

        return feature.timelineItems.find(i => i.id === itemId) || null;
    },

    /**
     * Get all timeline items for a feature
     * @param {String} featureId - Feature ID
     * @param {Array} features - Features array
     * @returns {Array} Timeline items
     */
    getItems(featureId, features) {
        const feature = features.find(f => f.id === featureId);
        if (!feature || !feature.timelineItems) return [];

        return [...feature.timelineItems];
    },

    /**
     * Filter timeline items by timeline phase
     * @param {String} featureId - Feature ID
     * @param {String} timeline - Timeline phase (MVP, SHORT, LONG)
     * @param {Array} features - Features array
     * @returns {Array} Filtered timeline items
     */
    filterByTimeline(featureId, timeline, features) {
        const items = this.getItems(featureId, features);
        return items.filter(i => i.timeline === timeline);
    },

    /**
     * Filter timeline items by difficulty
     * @param {String} featureId - Feature ID
     * @param {String} difficulty - Difficulty level (easy, medium, hard, epic)
     * @param {Array} features - Features array
     * @returns {Array} Filtered timeline items
     */
    filterByDifficulty(featureId, difficulty, features) {
        const items = this.getItems(featureId, features);
        return items.filter(i => i.difficulty === difficulty);
    },

    /**
     * Get timeline item statistics for a feature
     * @param {String} featureId - Feature ID
     * @param {Array} features - Features array
     * @returns {Object} Statistics object
     */
    getStats(featureId, features) {
        const items = this.getItems(featureId, features);

        const stats = {
            total: items.length,
            byTimeline: {
                MVP: 0,
                SHORT: 0,
                LONG: 0
            },
            byDifficulty: {
                easy: 0,
                medium: 0,
                hard: 0,
                epic: 0
            },
            totalLinks: 0
        };

        items.forEach(item => {
            // Count by timeline
            if (stats.byTimeline[item.timeline] !== undefined) {
                stats.byTimeline[item.timeline]++;
            }

            // Count by difficulty
            if (stats.byDifficulty[item.difficulty] !== undefined) {
                stats.byDifficulty[item.difficulty]++;
            }

            // Count links
            if (item.linkedItems) {
                stats.totalLinks += item.linkedItems.length;
            }
        });

        return stats;
    },

    /**
     * Reorder timeline items
     * @param {String} featureId - Feature ID
     * @param {String} itemId - Item ID to move
     * @param {Number} newIndex - New index position
     * @param {Array} features - Features array
     * @returns {Boolean} Success status
     */
    reorder(featureId, itemId, newIndex, features) {
        const feature = features.find(f => f.id === featureId);
        if (!feature || !feature.timelineItems) {
            console.error('❌ Feature not found:', featureId);
            return false;
        }

        const currentIndex = feature.timelineItems.findIndex(i => i.id === itemId);
        if (currentIndex === -1) {
            console.error('❌ Timeline item not found:', itemId);
            return false;
        }

        // Remove from current position
        const [item] = feature.timelineItems.splice(currentIndex, 1);

        // Insert at new position
        feature.timelineItems.splice(newIndex, 0, item);

        feature.updatedAt = new Date().toISOString();

        console.log('✅ Reordered timeline item:', item.name);
        return true;
    },

    /**
     * Validate timeline item
     * @param {Object} item - Timeline item to validate
     * @returns {Object} Validation result { valid: Boolean, errors: Array }
     */
    validate(item) {
        const errors = [];

        if (!item.name || item.name.trim() === '') {
            errors.push('Timeline item name is required');
        }

        if (!item.timeline || !['MVP', 'SHORT', 'LONG'].includes(item.timeline)) {
            errors.push('Valid timeline is required (MVP, SHORT, or LONG)');
        }

        if (!item.difficulty || !['easy', 'medium', 'hard', 'epic'].includes(item.difficulty)) {
            errors.push('Valid difficulty is required (easy, medium, hard, or epic)');
        }

        return {
            valid: errors.length === 0,
            errors: errors
        };
    },

    /**
     * Duplicate timeline item
     * @param {String} featureId - Feature ID
     * @param {String} itemId - Timeline item ID to duplicate
     * @param {Array} features - Features array
     * @returns {Object|null} Duplicated item or null
     */
    duplicate(featureId, itemId, features) {
        const feature = features.find(f => f.id === featureId);
        if (!feature || !feature.timelineItems) {
            console.error('❌ Feature not found:', featureId);
            return null;
        }

        const source = feature.timelineItems.find(i => i.id === itemId);
        if (!source) {
            console.error('❌ Timeline item not found:', itemId);
            return null;
        }

        const copy = {
            ...source,
            id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
            name: `${source.name} (Copy)`,
            linkedItems: [], // Don't copy links
            createdAt: new Date().toISOString()
        };

        feature.timelineItems.push(copy);
        feature.updatedAt = new Date().toISOString();

        console.log('✅ Duplicated timeline item:', source.name, '→', copy.name);
        return copy;
    }
};
