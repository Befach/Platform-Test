// Link Manager - Manage links between timeline items
const linkManager = {
    /**
     * Create link between two timeline items (bidirectional)
     * @param {String} featureId - Feature ID
     * @param {String} sourceId - Source timeline item ID
     * @param {String} targetId - Target timeline item ID
     * @param {String} relationshipType - Type of relationship ('dependency' or 'complements')
     * @param {Array} features - Features array
     * @returns {Boolean} Success status
     */
    createLink(featureId, sourceId, targetId, relationshipType, features) {
        const feature = features.find(f => f.id === featureId);
        if (!feature || !feature.timelineItems) {
            console.error('❌ Feature not found:', featureId);
            return false;
        }

        const sourceItem = feature.timelineItems.find(i => i.id === sourceId);
        const targetItem = feature.timelineItems.find(i => i.id === targetId);

        if (!sourceItem || !targetItem) {
            console.error('❌ Timeline item(s) not found');
            return false;
        }

        // Initialize linkedItems arrays if needed
        if (!sourceItem.linkedItems) sourceItem.linkedItems = [];
        if (!targetItem.linkedItems) targetItem.linkedItems = [];

        // Check if link already exists
        const existingOutgoing = sourceItem.linkedItems.find(
            l => l.targetId === targetId && l.direction === 'outgoing'
        );
        const existingIncoming = targetItem.linkedItems.find(
            l => l.sourceId === sourceId && l.direction === 'incoming'
        );

        if (existingOutgoing && existingIncoming) {
            console.log('⚠️ Link already exists');
            return false;
        }

        // Create outgoing link on source
        sourceItem.linkedItems.push({
            targetId: targetId,
            relationshipType: relationshipType,
            direction: 'outgoing',
            createdAt: new Date().toISOString()
        });

        // Create incoming link on target
        targetItem.linkedItems.push({
            sourceId: sourceId,
            relationshipType: relationshipType,
            direction: 'incoming',
            createdAt: new Date().toISOString()
        });

        feature.updatedAt = new Date().toISOString();

        console.log('✅ Created link:', sourceItem.name, '→', targetItem.name);
        return true;
    },

    /**
     * Delete link between two timeline items (bidirectional)
     * @param {String} featureId - Feature ID
     * @param {String} sourceId - Source timeline item ID
     * @param {String} targetId - Target timeline item ID
     * @param {Array} features - Features array
     * @returns {Boolean} Success status
     */
    deleteLink(featureId, sourceId, targetId, features) {
        const feature = features.find(f => f.id === featureId);
        if (!feature || !feature.timelineItems) {
            console.error('❌ Feature not found:', featureId);
            return false;
        }

        const sourceItem = feature.timelineItems.find(i => i.id === sourceId);
        const targetItem = feature.timelineItems.find(i => i.id === targetId);

        if (!sourceItem || !targetItem) {
            console.error('❌ Timeline item(s) not found');
            return false;
        }

        // Remove outgoing link from source
        if (sourceItem.linkedItems) {
            sourceItem.linkedItems = sourceItem.linkedItems.filter(
                l => !(l.targetId === targetId && l.direction === 'outgoing')
            );
        }

        // Remove incoming link from target
        if (targetItem.linkedItems) {
            targetItem.linkedItems = targetItem.linkedItems.filter(
                l => !(l.sourceId === sourceId && l.direction === 'incoming')
            );
        }

        feature.updatedAt = new Date().toISOString();

        console.log('✅ Deleted link:', sourceItem.name, '→', targetItem.name);
        return true;
    },

    /**
     * Get all outgoing links for a timeline item
     * @param {String} featureId - Feature ID
     * @param {String} itemId - Timeline item ID
     * @param {Array} features - Features array
     * @returns {Array} Outgoing links
     */
    getOutgoingLinks(featureId, itemId, features) {
        const feature = features.find(f => f.id === featureId);
        if (!feature || !feature.timelineItems) return [];

        const item = feature.timelineItems.find(i => i.id === itemId);
        if (!item || !item.linkedItems) return [];

        return item.linkedItems.filter(l => l.direction === 'outgoing');
    },

    /**
     * Get all incoming links for a timeline item
     * @param {String} featureId - Feature ID
     * @param {String} itemId - Timeline item ID
     * @param {Array} features - Features array
     * @returns {Array} Incoming links
     */
    getIncomingLinks(featureId, itemId, features) {
        const feature = features.find(f => f.id === featureId);
        if (!feature || !feature.timelineItems) return [];

        const item = feature.timelineItems.find(i => i.id === itemId);
        if (!item || !item.linkedItems) return [];

        return item.linkedItems.filter(l => l.direction === 'incoming');
    },

    /**
     * Get all links for a timeline item (both incoming and outgoing)
     * @param {String} featureId - Feature ID
     * @param {String} itemId - Timeline item ID
     * @param {Array} features - Features array
     * @returns {Object} Object with incoming and outgoing links
     */
    getAllLinks(featureId, itemId, features) {
        return {
            incoming: this.getIncomingLinks(featureId, itemId, features),
            outgoing: this.getOutgoingLinks(featureId, itemId, features)
        };
    },

    /**
     * Check if link exists between two items
     * @param {String} featureId - Feature ID
     * @param {String} sourceId - Source timeline item ID
     * @param {String} targetId - Target timeline item ID
     * @param {Array} features - Features array
     * @returns {Boolean} True if link exists
     */
    linkExists(featureId, sourceId, targetId, features) {
        const outgoing = this.getOutgoingLinks(featureId, sourceId, features);
        return outgoing.some(l => l.targetId === targetId);
    },

    /**
     * Get link statistics for a feature
     * @param {String} featureId - Feature ID
     * @param {Array} features - Features array
     * @returns {Object} Statistics object
     */
    getStats(featureId, features) {
        const feature = features.find(f => f.id === featureId);
        if (!feature || !feature.timelineItems) {
            return { total: 0, byType: { dependency: 0, complements: 0 } };
        }

        const stats = {
            total: 0,
            byType: {
                dependency: 0,
                complements: 0
            }
        };

        feature.timelineItems.forEach(item => {
            if (item.linkedItems) {
                // Count only outgoing to avoid double-counting
                const outgoing = item.linkedItems.filter(l => l.direction === 'outgoing');
                stats.total += outgoing.length;

                outgoing.forEach(link => {
                    if (stats.byType[link.relationshipType] !== undefined) {
                        stats.byType[link.relationshipType]++;
                    }
                });
            }
        });

        return stats;
    },

    /**
     * Validate link data
     * @param {String} sourceId - Source timeline item ID
     * @param {String} targetId - Target timeline item ID
     * @param {String} relationshipType - Relationship type
     * @returns {Object} Validation result { valid: Boolean, errors: Array }
     */
    validate(sourceId, targetId, relationshipType) {
        const errors = [];

        if (!sourceId) {
            errors.push('Source item ID is required');
        }

        if (!targetId) {
            errors.push('Target item ID is required');
        }

        if (sourceId === targetId) {
            errors.push('Cannot link item to itself');
        }

        if (!relationshipType || !['dependency', 'complements'].includes(relationshipType)) {
            errors.push('Valid relationship type is required (dependency or complements)');
        }

        return {
            valid: errors.length === 0,
            errors: errors
        };
    },

    /**
     * Get all dependencies for a timeline item (items it depends on)
     * @param {String} featureId - Feature ID
     * @param {String} itemId - Timeline item ID
     * @param {Array} features - Features array
     * @returns {Array} Array of timeline items this item depends on
     */
    getDependencies(featureId, itemId, features) {
        const feature = features.find(f => f.id === featureId);
        if (!feature || !feature.timelineItems) return [];

        const outgoing = this.getOutgoingLinks(featureId, itemId, features);
        const dependencyIds = outgoing
            .filter(l => l.relationshipType === 'dependency')
            .map(l => l.targetId);

        return feature.timelineItems.filter(i => dependencyIds.includes(i.id));
    },

    /**
     * Get all dependents for a timeline item (items that depend on it)
     * @param {String} featureId - Feature ID
     * @param {String} itemId - Timeline item ID
     * @param {Array} features - Features array
     * @returns {Array} Array of timeline items that depend on this item
     */
    getDependents(featureId, itemId, features) {
        const feature = features.find(f => f.id === featureId);
        if (!feature || !feature.timelineItems) return [];

        const incoming = this.getIncomingLinks(featureId, itemId, features);
        const dependentIds = incoming
            .filter(l => l.relationshipType === 'dependency')
            .map(l => l.sourceId);

        return feature.timelineItems.filter(i => dependentIds.includes(i.id));
    },

    /**
     * Check for circular dependencies
     * @param {String} featureId - Feature ID
     * @param {String} sourceId - Source timeline item ID
     * @param {String} targetId - Target timeline item ID
     * @param {Array} features - Features array
     * @returns {Boolean} True if adding link would create circular dependency
     */
    wouldCreateCircular(featureId, sourceId, targetId, features) {
        // Check if target already has a path to source
        const visited = new Set();
        const queue = [targetId];

        while (queue.length > 0) {
            const currentId = queue.shift();
            if (currentId === sourceId) {
                return true; // Circular dependency detected
            }

            if (visited.has(currentId)) continue;
            visited.add(currentId);

            const outgoing = this.getOutgoingLinks(featureId, currentId, features);
            const dependencies = outgoing
                .filter(l => l.relationshipType === 'dependency')
                .map(l => l.targetId);

            queue.push(...dependencies);
        }

        return false;
    }
};
