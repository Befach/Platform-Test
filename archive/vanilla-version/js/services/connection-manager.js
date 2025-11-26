/**
 * Connection Manager Service
 * Handles CRUD operations for feature connections
 *
 * Purpose: Manage explicit relationships between features (dependencies, complements, etc.)
 * Integration: Works with Supabase feature_connections table
 */

const connectionManager = {
    /**
     * Connection types available
     */
    CONNECTION_TYPES: {
        dependency: { label: 'Dependency', icon: '🔗', description: 'Source depends on target' },
        blocks: { label: 'Blocks', icon: '🚫', description: 'Source blocks target from progressing' },
        enables: { label: 'Enables', icon: '✅', description: 'Source enables target to start' },
        complements: { label: 'Complements', icon: '🤝', description: 'Features work well together' },
        conflicts: { label: 'Conflicts', icon: '⚠️', description: 'Features conflict with each other' },
        relates_to: { label: 'Related', icon: '🔄', description: 'General relationship' },
        duplicates: { label: 'Duplicate', icon: '📋', description: 'Potential duplicate feature' },
        supersedes: { label: 'Supersedes', icon: '⬆️', description: 'Source replaces target' }
    },

    /**
     * Create a new connection between features
     * @param {Object} connectionData - Connection details
     * @returns {Promise<Object>} Created connection
     */
    async createConnection(connectionData) {
        const {
            sourceFeatureId,
            targetFeatureId,
            connectionType,
            strength = 0.5,
            reason = '',
            confidence = 0.7,
            isBidirectional = false,
            discoveredBy = 'user',
            workspaceId,
            userId = 'default'
        } = connectionData;

        // Validate inputs
        if (!sourceFeatureId || !targetFeatureId) {
            throw new Error('Source and target feature IDs are required');
        }

        if (sourceFeatureId === targetFeatureId) {
            throw new Error('Cannot create self-connection');
        }

        if (!this.CONNECTION_TYPES[connectionType]) {
            throw new Error(`Invalid connection type: ${connectionType}`);
        }

        // Create connection object
        const connection = {
            id: Date.now().toString(),
            userId,
            workspaceId,
            sourceFeatureId,
            targetFeatureId,
            connectionType,
            strength: Math.max(0, Math.min(1, strength)),
            isBidirectional,
            reason,
            confidence: Math.max(0, Math.min(1, confidence)),
            discoveredBy,
            status: 'active',
            userConfirmed: discoveredBy === 'user',
            userRejected: false,
            evidence: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        // Save to Supabase if connected
        if (typeof supabaseService !== 'undefined' && supabaseService.isConnected) {
            try {
                const { data, error } = await supabaseService.client
                    .from('feature_connections')
                    .insert({
                        id: connection.id,
                        user_id: connection.userId,
                        workspace_id: connection.workspaceId,
                        source_feature_id: connection.sourceFeatureId,
                        target_feature_id: connection.targetFeatureId,
                        connection_type: connection.connectionType,
                        strength: connection.strength,
                        is_bidirectional: connection.isBidirectional,
                        reason: connection.reason,
                        confidence: connection.confidence,
                        discovered_by: connection.discoveredBy,
                        status: connection.status,
                        user_confirmed: connection.userConfirmed,
                        user_rejected: connection.userRejected,
                        evidence: connection.evidence,
                        created_at: connection.createdAt,
                        updated_at: connection.updatedAt
                    })
                    .select()
                    .single();

                if (error) throw error;

                console.log('✅ Connection saved to Supabase:', connection.id);

                // If bidirectional, create reverse connection
                if (isBidirectional) {
                    await this.createReverseConnection(connection);
                }

                return this.mapFromDatabase(data);
            } catch (error) {
                console.error('❌ Error saving connection to Supabase:', error);
                throw error;
            }
        }

        return connection;
    },

    /**
     * Create reverse connection for bidirectional relationships
     * @param {Object} originalConnection - Original connection
     * @returns {Promise<Object>} Reverse connection
     */
    async createReverseConnection(originalConnection) {
        const reverseConnection = {
            ...originalConnection,
            id: (Date.now() + 1).toString(),
            sourceFeatureId: originalConnection.targetFeatureId,
            targetFeatureId: originalConnection.sourceFeatureId
        };

        if (typeof supabaseService !== 'undefined' && supabaseService.isConnected) {
            const { data, error } = await supabaseService.client
                .from('feature_connections')
                .insert({
                    id: reverseConnection.id,
                    user_id: reverseConnection.userId,
                    workspace_id: reverseConnection.workspaceId,
                    source_feature_id: reverseConnection.sourceFeatureId,
                    target_feature_id: reverseConnection.targetFeatureId,
                    connection_type: reverseConnection.connectionType,
                    strength: reverseConnection.strength,
                    is_bidirectional: reverseConnection.isBidirectional,
                    reason: reverseConnection.reason,
                    confidence: reverseConnection.confidence,
                    discovered_by: reverseConnection.discoveredBy,
                    status: reverseConnection.status,
                    user_confirmed: reverseConnection.userConfirmed,
                    user_rejected: reverseConnection.userRejected,
                    evidence: reverseConnection.evidence,
                    created_at: reverseConnection.createdAt,
                    updated_at: reverseConnection.updatedAt
                })
                .select()
                .single();

            if (error) throw error;
            return this.mapFromDatabase(data);
        }

        return reverseConnection;
    },

    /**
     * Get all connections for a feature
     * @param {String} featureId - Feature ID
     * @param {String} direction - 'all', 'incoming', 'outgoing'
     * @returns {Promise<Array>} Connections
     */
    async getFeatureConnections(featureId, direction = 'all') {
        if (typeof supabaseService !== 'undefined' && supabaseService.isConnected) {
            try {
                let query = supabaseService.client
                    .from('feature_connections')
                    .select('*')
                    .eq('status', 'active');

                if (direction === 'incoming') {
                    query = query.eq('target_feature_id', featureId);
                } else if (direction === 'outgoing') {
                    query = query.eq('source_feature_id', featureId);
                } else {
                    query = query.or(`source_feature_id.eq.${featureId},target_feature_id.eq.${featureId}`);
                }

                const { data, error } = await query;

                if (error) throw error;

                return data.map(conn => ({
                    ...this.mapFromDatabase(conn),
                    direction: conn.source_feature_id === featureId ? 'outgoing' : 'incoming'
                }));
            } catch (error) {
                console.error('❌ Error fetching connections:', error);
                return [];
            }
        }

        return [];
    },

    /**
     * Get connection count for a feature
     * @param {String} featureId - Feature ID
     * @returns {Promise<Number>} Connection count
     */
    async getConnectionCount(featureId) {
        if (typeof supabaseService !== 'undefined' && supabaseService.isConnected) {
            try {
                const { count, error } = await supabaseService.client
                    .from('feature_connections')
                    .select('*', { count: 'exact', head: true })
                    .or(`source_feature_id.eq.${featureId},target_feature_id.eq.${featureId}`)
                    .eq('status', 'active');

                if (error) throw error;
                return count || 0;
            } catch (error) {
                console.error('❌ Error counting connections:', error);
                return 0;
            }
        }

        return 0;
    },

    /**
     * Check if two features are connected
     * @param {String} featureAId - First feature ID
     * @param {String} featureBId - Second feature ID
     * @returns {Promise<Boolean>} True if connected
     */
    async areConnected(featureAId, featureBId) {
        if (typeof supabaseService !== 'undefined' && supabaseService.isConnected) {
            try {
                const { data, error } = await supabaseService.client
                    .from('feature_connections')
                    .select('id')
                    .or(`and(source_feature_id.eq.${featureAId},target_feature_id.eq.${featureBId}),and(source_feature_id.eq.${featureBId},target_feature_id.eq.${featureAId})`)
                    .eq('status', 'active')
                    .limit(1);

                if (error) throw error;
                return data && data.length > 0;
            } catch (error) {
                console.error('❌ Error checking connection:', error);
                return false;
            }
        }

        return false;
    },

    /**
     * Update an existing connection
     * @param {String} connectionId - Connection ID
     * @param {Object} updates - Updates to apply
     * @returns {Promise<Object>} Updated connection
     */
    async updateConnection(connectionId, updates) {
        if (typeof supabaseService !== 'undefined' && supabaseService.isConnected) {
            try {
                const updateData = {
                    updated_at: new Date().toISOString()
                };

                if (updates.strength !== undefined) updateData.strength = Math.max(0, Math.min(1, updates.strength));
                if (updates.reason !== undefined) updateData.reason = updates.reason;
                if (updates.confidence !== undefined) updateData.confidence = Math.max(0, Math.min(1, updates.confidence));
                if (updates.status !== undefined) updateData.status = updates.status;
                if (updates.userConfirmed !== undefined) updateData.user_confirmed = updates.userConfirmed;
                if (updates.userRejected !== undefined) updateData.user_rejected = updates.userRejected;

                const { data, error } = await supabaseService.client
                    .from('feature_connections')
                    .update(updateData)
                    .eq('id', connectionId)
                    .select()
                    .single();

                if (error) throw error;

                console.log('✅ Connection updated:', connectionId);
                return this.mapFromDatabase(data);
            } catch (error) {
                console.error('❌ Error updating connection:', error);
                throw error;
            }
        }

        throw new Error('Supabase not connected');
    },

    /**
     * Delete a connection
     * @param {String} connectionId - Connection ID
     * @returns {Promise<Boolean>} Success
     */
    async deleteConnection(connectionId) {
        if (typeof supabaseService !== 'undefined' && supabaseService.isConnected) {
            try {
                // Soft delete by setting status to inactive
                const { error } = await supabaseService.client
                    .from('feature_connections')
                    .update({
                        status: 'inactive',
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', connectionId);

                if (error) throw error;

                console.log('✅ Connection deleted:', connectionId);
                return true;
            } catch (error) {
                console.error('❌ Error deleting connection:', error);
                return false;
            }
        }

        return false;
    },

    /**
     * Get connections by type for a workspace
     * @param {String} workspaceId - Workspace ID
     * @param {String} connectionType - Connection type
     * @returns {Promise<Array>} Connections
     */
    async getConnectionsByType(workspaceId, connectionType) {
        if (typeof supabaseService !== 'undefined' && supabaseService.isConnected) {
            try {
                const { data, error } = await supabaseService.client
                    .from('feature_connections')
                    .select('*')
                    .eq('workspace_id', workspaceId)
                    .eq('connection_type', connectionType)
                    .eq('status', 'active');

                if (error) throw error;

                return data.map(conn => this.mapFromDatabase(conn));
            } catch (error) {
                console.error('❌ Error fetching connections by type:', error);
                return [];
            }
        }

        return [];
    },

    /**
     * Get all workspace connections
     * @param {String} workspaceId - Workspace ID
     * @returns {Promise<Array>} All connections
     */
    async getWorkspaceConnections(workspaceId) {
        if (typeof supabaseService !== 'undefined' && supabaseService.isConnected) {
            try {
                const { data, error } = await supabaseService.client
                    .from('feature_connections')
                    .select('*')
                    .eq('workspace_id', workspaceId)
                    .eq('status', 'active')
                    .order('created_at', { ascending: false });

                if (error) throw error;

                return data.map(conn => this.mapFromDatabase(conn));
            } catch (error) {
                console.error('❌ Error fetching workspace connections:', error);
                return [];
            }
        }

        return [];
    },

    /**
     * Bulk create connections
     * @param {Array} connections - Array of connection data objects
     * @returns {Promise<Array>} Created connections
     */
    async bulkCreateConnections(connections) {
        if (typeof supabaseService !== 'undefined' && supabaseService.isConnected) {
            try {
                const records = connections.map(conn => ({
                    id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
                    user_id: conn.userId || 'default',
                    workspace_id: conn.workspaceId,
                    source_feature_id: conn.sourceFeatureId,
                    target_feature_id: conn.targetFeatureId,
                    connection_type: conn.connectionType,
                    strength: conn.strength || 0.5,
                    is_bidirectional: conn.isBidirectional || false,
                    reason: conn.reason || '',
                    confidence: conn.confidence || 0.7,
                    discovered_by: conn.discoveredBy || 'system',
                    status: 'active',
                    evidence: conn.evidence || [],
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                }));

                const { data, error } = await supabaseService.client
                    .from('feature_connections')
                    .insert(records)
                    .select();

                if (error) throw error;

                console.log(`✅ Bulk created ${data.length} connections`);
                return data.map(conn => this.mapFromDatabase(conn));
            } catch (error) {
                console.error('❌ Error bulk creating connections:', error);
                return [];
            }
        }

        return [];
    },

    /**
     * Map database record to application format
     * @param {Object} dbRecord - Database record
     * @returns {Object} Application format
     */
    mapFromDatabase(dbRecord) {
        return {
            id: dbRecord.id,
            userId: dbRecord.user_id,
            workspaceId: dbRecord.workspace_id,
            sourceFeatureId: dbRecord.source_feature_id,
            targetFeatureId: dbRecord.target_feature_id,
            connectionType: dbRecord.connection_type,
            strength: dbRecord.strength,
            isBidirectional: dbRecord.is_bidirectional,
            reason: dbRecord.reason,
            confidence: dbRecord.confidence,
            discoveredBy: dbRecord.discovered_by,
            status: dbRecord.status,
            userConfirmed: dbRecord.user_confirmed,
            userRejected: dbRecord.user_rejected,
            evidence: dbRecord.evidence || [],
            discoveredAt: dbRecord.discovered_at,
            createdAt: dbRecord.created_at,
            updatedAt: dbRecord.updated_at
        };
    },

    /**
     * Get connection label for display
     * @param {String} connectionType - Connection type
     * @returns {String} Display label
     */
    getConnectionLabel(connectionType) {
        return this.CONNECTION_TYPES[connectionType]?.label || connectionType;
    },

    /**
     * Get connection icon
     * @param {String} connectionType - Connection type
     * @returns {String} Icon emoji
     */
    getConnectionIcon(connectionType) {
        return this.CONNECTION_TYPES[connectionType]?.icon || '🔗';
    }
};

// Export for testing
if (typeof module !== 'undefined' && module.exports) {
    module.exports = connectionManager;
}
