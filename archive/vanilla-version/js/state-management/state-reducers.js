/**
 * State Reducers for Immutable Updates
 * Handles all state transformations with immutable update patterns
 */

class StateReducers {
    /**
     * Authentication Reducers
     */
    static authLoginReducer(state, action) {
        const { credentials } = action.payload;
        
        return {
            ...state,
            auth: {
                ...state.auth,
                isAuthenticated: true,
                lastActivity: Date.now(),
                // In real implementation, this would be set after successful API call
                user: {
                    id: 'temp_user',
                    name: 'User',
                    email: credentials.email || 'user@example.com'
                }
            }
        };
    }

    static authLogoutReducer(state, action) {
        return {
            ...state,
            auth: {
                ...state.auth,
                user: null,
                token: null,
                isAuthenticated: false,
                permissions: [],
                lastActivity: null
            }
        };
    }

    static authUpdateUserReducer(state, action) {
        const { userData } = action.payload;
        
        return {
            ...state,
            auth: {
                ...state.auth,
                user: {
                    ...state.auth.user,
                    ...userData,
                    lastUpdated: Date.now()
                },
                lastActivity: Date.now()
            }
        };
    }

    static authSetTokenReducer(state, action) {
        const { token } = action.payload;
        
        return {
            ...state,
            auth: {
                ...state.auth,
                token,
                lastActivity: Date.now()
            }
        };
    }

    static authRefreshReducer(state, action) {
        return {
            ...state,
            auth: {
                ...state.auth,
                lastActivity: Date.now()
            }
        };
    }

    /**
     * Application Reducers
     */
    static appSetLoadingReducer(state, action) {
        const { isLoading, context } = action.payload;
        
        return {
            ...state,
            app: {
                ...state.app,
                isLoading: context === 'global' ? isLoading : state.app.isLoading,
                loadingContexts: {
                    ...state.app.loadingContexts,
                    [context]: isLoading
                }
            }
        };
    }

    static appSetErrorReducer(state, action) {
        const { error, context } = action.payload;
        
        return {
            ...state,
            app: {
                ...state.app,
                error: context === 'global' ? error : state.app.error,
                errorContexts: {
                    ...state.app.errorContexts,
                    [context]: error
                }
            }
        };
    }

    static appClearErrorReducer(state, action) {
        const { context } = action.payload;
        
        const newErrorContexts = { ...state.app.errorContexts };
        delete newErrorContexts[context];
        
        return {
            ...state,
            app: {
                ...state.app,
                error: context === 'global' ? null : state.app.error,
                errorContexts: newErrorContexts
            }
        };
    }

    static appAddNotificationReducer(state, action) {
        const { notification } = action.payload;
        
        return {
            ...state,
            app: {
                ...state.app,
                notifications: [...state.app.notifications, notification]
            }
        };
    }

    static appRemoveNotificationReducer(state, action) {
        const { notificationId } = action.payload;
        
        return {
            ...state,
            app: {
                ...state.app,
                notifications: state.app.notifications.filter(
                    notification => notification.id !== notificationId
                )
            }
        };
    }

    static appClearNotificationsReducer(state, action) {
        return {
            ...state,
            app: {
                ...state.app,
                notifications: []
            }
        };
    }

    static appSetThemeReducer(state, action) {
        const { theme } = action.payload;
        
        return {
            ...state,
            app: {
                ...state.app,
                theme
            }
        };
    }

    static appSetLanguageReducer(state, action) {
        const { language } = action.payload;
        
        return {
            ...state,
            app: {
                ...state.app,
                language
            }
        };
    }

    static appUpdateViewportReducer(state, action) {
        const { viewport } = action.payload;
        
        return {
            ...state,
            app: {
                ...state.app,
                viewport: {
                    ...state.app.viewport,
                    ...viewport
                }
            }
        };
    }

    /**
     * Navigation Reducers
     */
    static navigateToReducer(state, action) {
        const { route, options, previousRoute } = action.payload;
        
        return {
            ...state,
            navigation: {
                ...state.navigation,
                currentRoute: route,
                previousRoute: previousRoute || state.navigation.currentRoute,
                isNavigating: false,
                navigationHistory: [
                    ...state.navigation.navigationHistory,
                    {
                        route,
                        timestamp: Date.now(),
                        options
                    }
                ].slice(-50) // Keep last 50 navigation entries
            }
        };
    }

    static navigationSetBreadcrumbsReducer(state, action) {
        const { breadcrumbs } = action.payload;
        
        return {
            ...state,
            navigation: {
                ...state.navigation,
                breadcrumbs
            }
        };
    }

    static navigationAddToHistoryReducer(state, action) {
        const { route, metadata } = action.payload;
        
        return {
            ...state,
            navigation: {
                ...state.navigation,
                navigationHistory: [
                    ...state.navigation.navigationHistory,
                    {
                        route,
                        timestamp: Date.now(),
                        metadata
                    }
                ].slice(-50)
            }
        };
    }

    static navigationSetStateReducer(state, action) {
        const { isNavigating } = action.payload;
        
        return {
            ...state,
            navigation: {
                ...state.navigation,
                isNavigating
            }
        };
    }

    /**
     * Data Reducers
     */
    static dataSetFeaturesReducer(state, action) {
        const { features } = action.payload;
        
        return {
            ...state,
            data: {
                ...state.data,
                features,
                lastSync: Date.now()
            }
        };
    }

    static dataAddFeatureReducer(state, action) {
        const { feature } = action.payload;
        
        return {
            ...state,
            data: {
                ...state.data,
                features: [...state.data.features, feature],
                lastSync: Date.now()
            }
        };
    }

    static dataUpdateFeatureReducer(state, action) {
        const { featureId, updates } = action.payload;
        
        return {
            ...state,
            data: {
                ...state.data,
                features: state.data.features.map(feature =>
                    feature.id === featureId
                        ? { ...feature, ...updates, lastUpdated: Date.now() }
                        : feature
                ),
                lastSync: Date.now()
            }
        };
    }

    static dataDeleteFeatureReducer(state, action) {
        const { featureId } = action.payload;
        
        return {
            ...state,
            data: {
                ...state.data,
                features: state.data.features.filter(feature => feature.id !== featureId),
                lastSync: Date.now()
            }
        };
    }

    static dataSetWorkspacesReducer(state, action) {
        const { workspaces } = action.payload;
        
        return {
            ...state,
            data: {
                ...state.data,
                workspaces,
                lastSync: Date.now()
            }
        };
    }

    static dataSetConnectionsReducer(state, action) {
        const { connections } = action.payload;
        
        return {
            ...state,
            data: {
                ...state.data,
                connections,
                lastSync: Date.now()
            }
        };
    }

    static dataSetInsightsReducer(state, action) {
        const { insights } = action.payload;
        
        return {
            ...state,
            data: {
                ...state.data,
                insights,
                lastSync: Date.now()
            }
        };
    }

    static dataSyncStartReducer(state, action) {
        return {
            ...state,
            data: {
                ...state.data,
                isSyncing: true,
                syncErrors: []
            }
        };
    }

    static dataSyncCompleteReducer(state, action) {
        const { results } = action.payload;
        
        return {
            ...state,
            data: {
                ...state.data,
                isSyncing: false,
                lastSync: Date.now(),
                syncResults: results
            }
        };
    }

    static dataSyncErrorReducer(state, action) {
        const { error } = action.payload;
        
        return {
            ...state,
            data: {
                ...state.data,
                isSyncing: false,
                syncErrors: [...state.data.syncErrors, {
                    error,
                    timestamp: Date.now()
                }]
            }
        };
    }

    /**
     * UI Reducers
     */
    static uiToggleModalReducer(state, action) {
        const { modalId, options } = action.payload;
        const isActive = state.ui.modals.active.includes(modalId);
        
        if (isActive) {
            // Close modal
            return {
                ...state,
                ui: {
                    ...state.ui,
                    modals: {
                        ...state.ui.modals,
                        active: state.ui.modals.active.filter(id => id !== modalId),
                        stack: state.ui.modals.stack.filter(entry => entry.id !== modalId)
                    }
                }
            };
        } else {
            // Open modal
            return {
                ...state,
                ui: {
                    ...state.ui,
                    modals: {
                        ...state.ui.modals,
                        active: [...state.ui.modals.active, modalId],
                        stack: [...state.ui.modals.stack, {
                            id: modalId,
                            options,
                            timestamp: Date.now()
                        }]
                    }
                }
            };
        }
    }

    static uiOpenModalReducer(state, action) {
        const { modalId, options } = action.payload;
        
        if (state.ui.modals.active.includes(modalId)) {
            return state; // Already open
        }
        
        return {
            ...state,
            ui: {
                ...state.ui,
                modals: {
                    ...state.ui.modals,
                    active: [...state.ui.modals.active, modalId],
                    stack: [...state.ui.modals.stack, {
                        id: modalId,
                        options,
                        timestamp: Date.now()
                    }]
                }
            }
        };
    }

    static uiCloseModalReducer(state, action) {
        const { modalId } = action.payload;
        
        return {
            ...state,
            ui: {
                ...state.ui,
                modals: {
                    ...state.ui.modals,
                    active: state.ui.modals.active.filter(id => id !== modalId),
                    stack: state.ui.modals.stack.filter(entry => entry.id !== modalId)
                }
            }
        };
    }

    static uiCloseAllModalsReducer(state, action) {
        return {
            ...state,
            ui: {
                ...state.ui,
                modals: {
                    ...state.ui.modals,
                    active: [],
                    stack: []
                }
            }
        };
    }

    static uiTogglePanelReducer(state, action) {
        const { panelId, options } = action.payload;
        const currentState = state.ui.panels[panelId];
        
        if (!currentState) {
            return state; // Panel doesn't exist
        }
        
        return {
            ...state,
            ui: {
                ...state.ui,
                panels: {
                    ...state.ui.panels,
                    [panelId]: {
                        ...currentState,
                        open: !currentState.open,
                        ...options
                    }
                }
            }
        };
    }

    static uiSetPanelStateReducer(state, action) {
        const { panelId, state: panelState } = action.payload;
        
        return {
            ...state,
            ui: {
                ...state.ui,
                panels: {
                    ...state.ui.panels,
                    [panelId]: {
                        ...state.ui.panels[panelId],
                        ...panelState
                    }
                }
            }
        };
    }

    static uiSetLayoutReducer(state, action) {
        const { layout } = action.payload;
        
        return {
            ...state,
            ui: {
                ...state.ui,
                layout: {
                    ...state.ui.layout,
                    ...layout
                }
            }
        };
    }

    static uiUpdateFiltersReducer(state, action) {
        const { filters } = action.payload;
        
        return {
            ...state,
            ui: {
                ...state.ui,
                layout: {
                    ...state.ui.layout,
                    filters: {
                        ...state.ui.layout.filters,
                        ...filters
                    }
                }
            }
        };
    }

    static uiClearFiltersReducer(state, action) {
        return {
            ...state,
            ui: {
                ...state.ui,
                layout: {
                    ...state.ui.layout,
                    filters: {}
                }
            }
        };
    }

    /**
     * Collaboration Reducers
     */
    static collabUserConnectedReducer(state, action) {
        const { user } = action.payload;
        
        return {
            ...state,
            collaboration: {
                ...state.collaboration,
                connectedUsers: [
                    ...state.collaboration.connectedUsers.filter(u => u.id !== user.id),
                    user
                ]
            }
        };
    }

    static collabUserDisconnectedReducer(state, action) {
        const { userId } = action.payload;
        
        return {
            ...state,
            collaboration: {
                ...state.collaboration,
                connectedUsers: state.collaboration.connectedUsers.filter(
                    user => user.id !== userId
                )
            }
        };
    }

    static collabSetPresenceReducer(state, action) {
        const { presence } = action.payload;
        
        return {
            ...state,
            collaboration: {
                ...state.collaboration,
                presence: {
                    ...state.collaboration.presence,
                    ...presence,
                    lastSeen: Date.now()
                }
            }
        };
    }

    static collabAddConflictReducer(state, action) {
        const { conflict } = action.payload;
        
        return {
            ...state,
            collaboration: {
                ...state.collaboration,
                conflicts: [
                    ...state.collaboration.conflicts,
                    {
                        ...conflict,
                        id: conflict.id || `conflict_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                        timestamp: Date.now(),
                        status: 'pending'
                    }
                ]
            }
        };
    }

    static collabResolveConflictReducer(state, action) {
        const { conflictId, resolution } = action.payload;
        
        return {
            ...state,
            collaboration: {
                ...state.collaboration,
                conflicts: state.collaboration.conflicts.map(conflict =>
                    conflict.id === conflictId
                        ? {
                            ...conflict,
                            status: 'resolved',
                            resolution,
                            resolvedAt: Date.now()
                        }
                        : conflict
                )
            }
        };
    }

    static collabStartSessionReducer(state, action) {
        const { sessionConfig } = action.payload;
        
        return {
            ...state,
            collaboration: {
                ...state.collaboration,
                activeSessions: [
                    ...state.collaboration.activeSessions,
                    {
                        id: sessionConfig.id || `session_${Date.now()}`,
                        ...sessionConfig,
                        startTime: Date.now(),
                        status: 'active'
                    }
                ]
            }
        };
    }

    static collabEndSessionReducer(state, action) {
        const { sessionId } = action.payload;
        
        return {
            ...state,
            collaboration: {
                ...state.collaboration,
                activeSessions: state.collaboration.activeSessions.map(session =>
                    session.id === sessionId
                        ? {
                            ...session,
                            status: 'ended',
                            endTime: Date.now()
                        }
                        : session
                )
            }
        };
    }

    /**
     * Analytics Reducers
     */
    static analyticsTrackActionReducer(state, action) {
        const { action: trackedAction, metadata } = action.payload;
        
        return {
            ...state,
            analytics: {
                ...state.analytics,
                userActions: [
                    ...state.analytics.userActions,
                    {
                        action: trackedAction,
                        metadata,
                        timestamp: Date.now()
                    }
                ].slice(-100) // Keep last 100 actions
            }
        };
    }

    static analyticsUpdateMetricsReducer(state, action) {
        const { metrics } = action.payload;
        
        return {
            ...state,
            analytics: {
                ...state.analytics,
                performanceMetrics: {
                    ...state.analytics.performanceMetrics,
                    ...metrics,
                    lastUpdated: Date.now()
                }
            }
        };
    }

    static analyticsTrackErrorReducer(state, action) {
        const { error, context } = action.payload;
        
        return {
            ...state,
            analytics: {
                ...state.analytics,
                errorTracking: [
                    ...state.analytics.errorTracking,
                    {
                        error,
                        context,
                        timestamp: Date.now(),
                        id: `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
                    }
                ].slice(-50) // Keep last 50 errors
            }
        };
    }

    static analyticsTrackPageViewReducer(state, action) {
        const { page, metadata } = action.payload;
        
        return {
            ...state,
            analytics: {
                ...state.analytics,
                pageViews: state.analytics.pageViews + 1,
                lastPageView: {
                    page,
                    metadata,
                    timestamp: Date.now()
                }
            }
        };
    }

    /**
     * Batch Actions Reducer
     */
    static batchActionsReducer(state, action) {
        const { actions } = action.payload;
        
        return actions.reduce((currentState, batchedAction) => {
            const reducer = StateReducers.getReducerForAction(batchedAction.type);
            return reducer ? reducer(currentState, batchedAction) : currentState;
        }, state);
    }

    /**
     * Utility Methods
     */
    static getReducerForAction(actionType) {
        const reducerMap = {
            // Auth reducers
            'AUTH_LOGIN': StateReducers.authLoginReducer,
            'AUTH_LOGOUT': StateReducers.authLogoutReducer,
            'AUTH_UPDATE_USER': StateReducers.authUpdateUserReducer,
            'AUTH_SET_TOKEN': StateReducers.authSetTokenReducer,
            'AUTH_REFRESH': StateReducers.authRefreshReducer,
            
            // App reducers
            'APP_SET_LOADING': StateReducers.appSetLoadingReducer,
            'APP_SET_ERROR': StateReducers.appSetErrorReducer,
            'APP_CLEAR_ERROR': StateReducers.appClearErrorReducer,
            'APP_ADD_NOTIFICATION': StateReducers.appAddNotificationReducer,
            'APP_REMOVE_NOTIFICATION': StateReducers.appRemoveNotificationReducer,
            'APP_CLEAR_NOTIFICATIONS': StateReducers.appClearNotificationsReducer,
            'APP_SET_THEME': StateReducers.appSetThemeReducer,
            'APP_SET_LANGUAGE': StateReducers.appSetLanguageReducer,
            'APP_UPDATE_VIEWPORT': StateReducers.appUpdateViewportReducer,
            
            // Navigation reducers
            'NAVIGATE_TO': StateReducers.navigateToReducer,
            'NAVIGATION_SET_BREADCRUMBS': StateReducers.navigationSetBreadcrumbsReducer,
            'NAVIGATION_ADD_TO_HISTORY': StateReducers.navigationAddToHistoryReducer,
            'NAVIGATION_SET_STATE': StateReducers.navigationSetStateReducer,
            
            // Data reducers
            'DATA_SET_FEATURES': StateReducers.dataSetFeaturesReducer,
            'DATA_ADD_FEATURE': StateReducers.dataAddFeatureReducer,
            'DATA_UPDATE_FEATURE': StateReducers.dataUpdateFeatureReducer,
            'DATA_DELETE_FEATURE': StateReducers.dataDeleteFeatureReducer,
            'DATA_SET_WORKSPACES': StateReducers.dataSetWorkspacesReducer,
            'DATA_SET_CONNECTIONS': StateReducers.dataSetConnectionsReducer,
            'DATA_SET_INSIGHTS': StateReducers.dataSetInsightsReducer,
            'DATA_SYNC_START': StateReducers.dataSyncStartReducer,
            'DATA_SYNC_COMPLETE': StateReducers.dataSyncCompleteReducer,
            'DATA_SYNC_ERROR': StateReducers.dataSyncErrorReducer,
            
            // UI reducers
            'UI_TOGGLE_MODAL': StateReducers.uiToggleModalReducer,
            'UI_OPEN_MODAL': StateReducers.uiOpenModalReducer,
            'UI_CLOSE_MODAL': StateReducers.uiCloseModalReducer,
            'UI_CLOSE_ALL_MODALS': StateReducers.uiCloseAllModalsReducer,
            'UI_TOGGLE_PANEL': StateReducers.uiTogglePanelReducer,
            'UI_SET_PANEL_STATE': StateReducers.uiSetPanelStateReducer,
            'UI_SET_LAYOUT': StateReducers.uiSetLayoutReducer,
            'UI_UPDATE_FILTERS': StateReducers.uiUpdateFiltersReducer,
            'UI_CLEAR_FILTERS': StateReducers.uiClearFiltersReducer,
            
            // Collaboration reducers
            'COLLAB_USER_CONNECTED': StateReducers.collabUserConnectedReducer,
            'COLLAB_USER_DISCONNECTED': StateReducers.collabUserDisconnectedReducer,
            'COLLAB_SET_PRESENCE': StateReducers.collabSetPresenceReducer,
            'COLLAB_ADD_CONFLICT': StateReducers.collabAddConflictReducer,
            'COLLAB_RESOLVE_CONFLICT': StateReducers.collabResolveConflictReducer,
            'COLLAB_START_SESSION': StateReducers.collabStartSessionReducer,
            'COLLAB_END_SESSION': StateReducers.collabEndSessionReducer,
            
            // Analytics reducers
            'ANALYTICS_TRACK_ACTION': StateReducers.analyticsTrackActionReducer,
            'ANALYTICS_UPDATE_METRICS': StateReducers.analyticsUpdateMetricsReducer,
            'ANALYTICS_TRACK_ERROR': StateReducers.analyticsTrackErrorReducer,
            'ANALYTICS_TRACK_PAGE_VIEW': StateReducers.analyticsTrackPageViewReducer,
            
            // Batch reducer
            'BATCH_ACTIONS': StateReducers.batchActionsReducer
        };
        
        return reducerMap[actionType];
    }

    /**
     * Immutable Update Utilities
     */
    static updateNestedState(state, path, updates) {
        const keys = path.split('.');
        const lastKey = keys.pop();
        
        const updatedNested = keys.reduce((current, key) => {
            return current && current[key] ? current[key] : {};
        }, state);
        
        const updatedParent = keys.reduce((current, key, index) => {
            const childKey = keys[index + 1];
            return {
                ...current,
                [key]: {
                    ...current[key],
                    [childKey]: index === keys.length - 1 ? 
                        { ...current[key][childKey], ...updates } : 
                        current[key][childKey]
                }
            };
        }, state);
        
        return {
            ...updatedParent,
            [lastKey]: {
                ...updatedNested,
                ...updates
            }
        };
    }

    static updateArrayState(state, path, itemIndex, updates) {
        const array = this.getNestedValue(state, path);
        if (!Array.isArray(array)) return state;
        
        const updatedArray = array.map((item, index) => 
            index === itemIndex ? { ...item, ...updates } : item
        );
        
        return this.updateNestedState(state, path, updatedArray);
    }

    static addItemToArray(state, path, item) {
        const array = this.getNestedValue(state, path) || [];
        return this.updateNestedState(state, path, [...array, item]);
    }

    static removeItemFromArray(state, path, predicate) {
        const array = this.getNestedValue(state, path) || [];
        const updatedArray = array.filter(predicate);
        return this.updateNestedState(state, path, updatedArray);
    }

    static getNestedValue(obj, path) {
        return path.split('.').reduce((current, key) => {
            return current && current[key] !== undefined ? current[key] : null;
        }, obj);
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = StateReducers;
} else if (typeof window !== 'undefined') {
    window.StateReducers = StateReducers;
}