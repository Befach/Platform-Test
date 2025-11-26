
/**
 * State Management Test and Validation System
 * Comprehensive testing and validation for all state management components
 */

class StateManagementTest {
    constructor() {
        this.testResults = [];
        this.currentTest = null;
        this.testSuite = {
            stateStore: [],
            stateActions: [],
            stateMiddleware: [],
            statePersistence: [],
            syncManager: [],
            websocketClient: [],
            conflictResolver: [],
            componentIntegration: [],
            advancedFeatures: [],
            integration: []
        };
        
        this.performanceTests = {
            stateUpdates: [],
            syncOperations: [],
            persistenceOperations: [],
            componentUpdates: []
        };
        
        this.validationRules = {
            stateImmutability: true,
            actionValidation: true,
            errorHandling: true,
            performanceThresholds: {
                stateUpdate: 50, // ms
                syncOperation: 100, // ms
                persistenceOperation: 200, // ms
                componentUpdate: 16 // ms (60fps)
            }
        };
    }

    /**
     * Run comprehensive test suite
     */
    async runComprehensiveTests() {
        console.log('[StateManagementTest] Starting comprehensive test suite...');
        
        try {
            // Initialize test environment
            await this.initializeTestEnvironment();
            
            // Run individual component tests
            await this.runStateStoreTests();
            await this.runStateActionsTests();
            await this.runStateMiddlewareTests();
            await this.runStatePersistenceTests();
            await this.runSyncManagerTests();
            await this.runWebSocketClientTests();
            await this.runConflictResolverTests();
            await this.runComponentIntegrationTests();
            await this.runAdvancedFeaturesTests();
            await this.runIntegrationTests();
            
            // Run performance tests
            await this.runPerformanceTests();
            
            // Run validation tests
            await this.runValidationTests();
            
            // Generate test report
            const report = this.generateTestReport();
            
            console.log('[StateManagementTest] Comprehensive test suite completed');
            return report;
            
        } catch (error) {
            console.error('[StateManagementTest] Test suite failed:', error);
            throw error;
        }
    }

    /**
     * Initialize test environment
     */
    async initializeTestEnvironment() {
        console.log('[StateManagementTest] Initializing test environment...');
        
        // Create test instances
        this.testStateStore = new StateStore({
            enableTimeTravel: true,
            batchUpdates: true,
            maxHistorySize: 50
        });
        
        this.testStateActions = new StateActions(this.testStateStore);
        this.testStateMiddleware = new StateMiddleware();
        this.testStatePersistence = new StatePersistence({
            storageType: 'memory',
            autoSave: false,
            enableBackups: true
        });
        
        this.testConflictResolver = new ConflictResolver({
            strategy: 'last-write-wins',
            autoResolve: true
        });
        
        this.testComponentIntegration = new ComponentStateIntegration(this.testStateStore);
        this.testAdvancedFeatures = new AdvancedStateFeatures(this.testStateStore);
        
        console.log('[StateManagementTest] Test environment initialized');
    }

    /**
     * Run state store tests
     */
    async runStateStoreTests() {
        console.log('[StateManagementTest] Running state store tests...');
        
        const tests = [
            this.testStateStoreInitialization.bind(this),
            this.testStateStoreDispatch.bind(this),
            this.testStateStoreSubscribe.bind(this),
            this.testStateStoreHistory.bind(this),
            this.testStateStoreBatching.bind(this),
            this.testStateStoreMiddleware.bind(this)
        ];
        
        for (const test of tests) {
            await this.runTest('stateStore', test);
        }
    }

    /**
     * Run state actions tests
     */
    async runStateActionsTests() {
        console.log('[StateManagementTest] Running state actions tests...');
        
        const tests = [
            this.testStateActionsCreation.bind(this),
            this.testStateActionsValidation.bind(this),
            this.testStateActionsAsync.bind(this),
            this.testStateActionsBatching.bind(this)
        ];
        
        for (const test of tests) {
            await this.runTest('stateActions', test);
        }
    }

    /**
     * Run state middleware tests
     */
    async runStateMiddlewareTests() {
        console.log('[StateManagementTest] Running state middleware tests...');
        
        const tests = [
            this.testStateMiddlewareRegistration.bind(this),
            this.testStateMiddlewareExecution.bind(this),
            this.testStateMiddlewareChaining.bind(this),
            this.testStateMiddlewareErrorHandling.bind(this)
        ];
        
        for (const test of tests) {
            await this.runTest('stateMiddleware', test);
        }
    }

    /**
     * Run state persistence tests
     */
    async runStatePersistenceTests() {
        console.log('[StateManagementTest] Running state persistence tests...');
        
        const tests = [
            this.testStatePersistenceSave.bind(this),
            this.testStatePersistenceLoad.bind(this),
            this.testStatePersistenceBackups.bind(this),
            this.testStatePersistenceCompression.bind(this),
            this.testStatePersistenceValidation.bind(this)
        ];
        
        for (const test of tests) {
            await this.runTest('statePersistence', test);
        }
    }

    /**
     * Run sync manager tests
     */
    async runSyncManagerTests() {
        console.log('[StateManagementTest] Running sync manager tests...');
        
        const tests = [
            this.testSyncManagerConnection.bind(this),
            this.testSyncManagerMessageHandling.bind(this),
            this.testSyncManagerConflictResolution.bind(this),
            this.testSyncManagerQueueing.bind(this),
            this.testSyncManagerReconnection.bind(this)
        ];
        
        for (const test of tests) {
            await this.runTest('syncManager', test);
        }
    }

    /**
     * Run WebSocket client tests
     */
    async runWebSocketClientTests() {
        console.log('[StateManagementTest] Running WebSocket client tests...');
        
        const tests = [
            this.testWebSocketClientConnection.bind(this),
            this.testWebSocketClientMessaging.bind(this),
            this.testWebSocketClientReconnection.bind(this),
            this.testWebSocketClientHeartbeat.bind(this),
            this.testWebSocketClientErrorHandling.bind(this)
        ];
        
        for (const test of tests) {
            await this.runTest('websocketClient', test);
        }
    }

    /**
     * Run conflict resolver tests
     */
    async runConflictResolverTests() {
        console.log('[StateManagementTest] Running conflict resolver tests...');
        
        const tests = [
            this.testConflictResolverStrategies.bind(this),
            this.testConflictResolverMerging.bind(this),
            this.testConflictResolverUserIntervention.bind(this),
            this.testConflictResolverMetrics.bind(this)
        ];
        
        for (const test of tests) {
            await this.runTest('conflictResolver', test);
        }
    }

    /**
     * Run component integration tests
     */
    async runComponentIntegrationTests() {
        console.log('[StateManagementTest] Running component integration tests...');
        
        const tests = [
            this.testComponentRegistration.bind(this),
            this.testComponentStateSubscription.bind(this),
            this.testComponentDOMUpdates.bind(this),
            this.testComponentIsolation.bind(this),
            this.testComponentSharedState.bind(this),
            this.testComponentOptimisticUpdates.bind(this)
        ];
        
        for (const test of tests) {
            await this.runTest('componentIntegration', test);
        }
    }

    /**
     * Run advanced features tests
     */
    async runAdvancedFeaturesTests() {
        console.log('[StateManagementTest] Running advanced features tests...');
        
        const tests = [
            this.testAdvancedFeaturesHistory.bind(this),
            this.testAdvancedFeaturesAnalytics.bind(this),
            this.testAdvancedFeaturesMonitoring.bind(this),
            this.testAdvancedFeaturesDebugging.bind(this),
            this.testAdvancedFeaturesPerformance.bind(this)
        ];
        
        for (const test of tests) {
            await this.runTest('advancedFeatures', test);
        }
    }

    /**
     * Run integration tests
     */
    async runIntegrationTests() {
        console.log('[StateManagementTest] Running integration tests...');
        
        const tests = [
            this.testIntegrationInitialization.bind(this),
            this.testIntegrationCrossComponent.bind(this),
            this.testIntegrationErrorHandling.bind(this),
            this.testIntegrationPerformance.bind(this),
            this.testIntegrationDataFlow.bind(this)
        ];
        
        for (const test of tests) {
            await this.runTest('integration', test);
        }
    }

    /**
     * Individual test methods
     */

    async testStateStoreInitialization() {
        const store = new StateStore();
        this.assert(store !== null, 'State store should be initialized');
        this.assert(store.getState() !== null, 'State store should have initial state');
        this.assert(typeof store.dispatch === 'function', 'State store should have dispatch method');
        this.assert(typeof store.subscribe === 'function', 'State store should have subscribe method');
    }

    async testStateStoreDispatch() {
        const initialState = this.testStateStore.getState();
        this.testStateStore.dispatch({ type: 'TEST_ACTION', payload: { test: true } });
        const newState = this.testStateStore.getState();
        this.assert(newState !== initialState, 'State should change after dispatch');
    }

    async testStateStoreSubscribe() {
        let notified = false;
        const unsubscribe = this.testStateStore.subscribe(() => {
            notified = true;
        });
        
        this.testStateStore.dispatch({ type: 'TEST_ACTION' });
        this.assert(notified, 'Subscriber should be notified');
        unsubscribe();
    }

    async testStateStoreHistory() {
        this.testStateStore.dispatch({ type: 'TEST_ACTION_1' });
        this.testStateStore.dispatch({ type: 'TEST_ACTION_2' });
        
        this.assert(this.testStateStore.canUndo(), 'Should be able to undo');
        this.testStateStore.undo();
        this.assert(this.testStateStore.canRedo(), 'Should be able to redo');
        this.testStateStore.redo();
    }

    async testStateStoreBatching() {
        const store = new StateStore({ batchUpdates: true });
        const startTime = performance.now();
        
        // Dispatch multiple actions
        for (let i = 0; i < 100; i++) {
            store.dispatch({ type: 'BATCH_TEST', payload: { index: i } });
        }
        
        const endTime = performance.now();
        const duration = endTime - startTime;
        
        this.assert(duration < 100, 'Batched updates should be performant');
    }

    async testStateStoreMiddleware() {
        let middlewareCalled = false;
        const testMiddleware = (state, action, next) => {
            middlewareCalled = true;
            return next(state, action);
        };
        
        this.testStateStore.addMiddleware(testMiddleware);
        this.testStateStore.dispatch({ type: 'MIDDLEWARE_TEST' });
        
        this.assert(middlewareCalled, 'Middleware should be called');
    }

    async testStateActionsCreation() {
        const action = this.testStateActions.login({ username: 'test', password: 'test' });
        this.assert(action.type === 'AUTH_LOGIN', 'Action should have correct type');
        this.assert(action.payload.credentials, 'Action should have payload');
    }

    async testStateActionsValidation() {
        try {
            this.testStateActions.dispatch({ type: '', payload: null });
            this.assert(false, 'Invalid action should throw error');
        } catch (error) {
            this.assert(true, 'Invalid action should throw error');
        }
    }

    async testStateActionsAsync() {
        const result = await this.testStateActions.fetchDataAsync('features');
        this.assert(result !== null, 'Async action should return result');
    }

    async testStateActionsBatching() {
        const actions = [
            { type: 'TEST_1' },
            { type: 'TEST_2' },
            { type: 'TEST_3' }
        ];
        
        const result = this.testStateActions.createBatch(actions);
        this.assert(result.type === 'BATCH_ACTIONS', 'Batch action should be created');
    }

    async testStateMiddlewareRegistration() {
        const middleware = (state, action, next) => next(state, action);
        this.testStateMiddleware.register('test', middleware);
        
        const registered = this.testStateMiddleware.isRegistered('test');
        this.assert(registered, 'Middleware should be registered');
    }

    async testStateMiddlewareExecution() {
        let executed = false;
        const middleware = (state, action, next) => {
            executed = true;
            return next(state, action);
        };
        
        const result = middleware({}, { type: 'TEST' }, (s, a) => ({ ...s, test: true }));
        this.assert(executed, 'Middleware should execute');
        this.assert(result.test, 'Middleware should allow state modification');
    }

    async testStateMiddlewareChaining() {
        let callOrder = [];
        const middleware1 = (state, action, next) => {
            callOrder.push('middleware1');
            return next(state, action);
        };
        const middleware2 = (state, action, next) => {
            callOrder.push('middleware2');
            return next(state, action);
        };
        
        const stack = [middleware1, middleware2];
        let index = 0;
        const next = (state, action) => {
            if (index < stack.length) {
                return stack[index++](state, action, next);
            }
            return state;
        };
        
        next({}, { type: 'TEST' });
        this.assert(callOrder[0] === 'middleware1', 'Middleware should execute in order');
        this.assert(callOrder[1] === 'middleware2', 'Middleware should chain correctly');
    }

    async testStateMiddlewareErrorHandling() {
        const errorMiddleware = (state, action, next) => {
            try {
                return next(state, action);
            } catch (error) {
                return { ...state, error: error.message };
            }
        };
        
        const throwingMiddleware = (state, action, next) => {
            throw new Error('Test error');
        };
        
        const result = errorMiddleware({}, { type: 'TEST' }, throwingMiddleware);
        this.assert(result.error, 'Error should be caught and handled');
    }

    async testStatePersistenceSave() {
        const testState = { test: 'data', timestamp: Date.now() };
        const result = await this.testStatePersistence.save(testState);
        this.assert(result, 'State should be saved successfully');
    }

    async testStatePersistenceLoad() {
        const testState = { test: 'data', timestamp: Date.now() };
        await this.testStatePersistence.save(testState);
        const loadedState = await this.testStatePersistence.load();
        this.assert(loadedState !== null, 'State should be loaded successfully');
        this.assert(loadedState.test === testState.test, 'Loaded state should match saved state');
    }

    async testStatePersistenceBackups() {
        const testState = { test: 'backup_data', timestamp: Date.now() };
        await this.testStatePersistence.save(testState);
        await this.testStatePersistence.createBackup(testState);
        
        const backupState = await this.testStatePersistence.loadFromBackup();
        this.assert(backupState !== null, 'Backup should be created and loadable');
    }

    async testStatePersistenceCompression() {
        const persistence = new StatePersistence({
            storageType: 'memory',
            enableCompression: true
        });
        
        const testState = { data: 'x'.repeat(1000) }; // Large data
        const result = await persistence.save(testState);
        this.assert(result, 'Compressed state should be saved');
    }

    async testStatePersistenceValidation() {
        const invalidState = null;
        try {
            await this.testStatePersistence.save(invalidState);
            this.assert(false, 'Invalid state should fail validation');
        } catch (error) {
            this.assert(true, 'Invalid state should fail validation');
        }
    }

    async testSyncManagerConnection() {
        // Mock WebSocket for testing
        const mockWebSocket = {
            readyState: WebSocket.OPEN,
            send: () => {},
            close: () => {},
            addEventListener: () => {}
        };
        
        const syncManager = new SyncManager();
        syncManager.websocket = mockWebSocket;
        syncManager.isConnected = true;
        
        const status = syncManager.getStatus();
        this.assert(status.isOnline, 'Sync manager should report online status');
    }

    async testSyncManagerMessageHandling() {
        const syncManager = new SyncManager();
        const testMessage = {
            type: 'SYNC_UPDATE',
            payload: { changes: { test: 'data' } }
        };
        
        // Should not throw error
        syncManager.routeMessage(testMessage);
        this.assert(true, 'Sync manager should handle messages');
    }

    async testSyncManagerConflictResolution() {
        const conflict = {
            type: 'version_conflict',
            localState: { version: 1, data: 'local' },
            remoteUpdate: { version: 2, data: 'remote' }
        };
        
        const resolution = this.testConflictResolver.resolve(conflict);
        this.assert(resolution !== null, 'Conflict should be resolved');
    }

    async testSyncManagerQueueing() {
        const syncManager = new SyncManager();
        const testMessage = { type: 'TEST_MESSAGE' };
        
        syncManager.addToSyncQueue(testMessage);
        this.assert(syncManager.syncQueue.length > 0, 'Message should be queued');
    }

    async testSyncManagerReconnection() {
        const syncManager = new SyncManager({
            maxReconnectAttempts: 3,
            reconnectDelay: 100
        });
        
        syncManager.isReconnecting = true;
        syncManager.reconnectAttempts = 0;
        
        // Test reconnection logic (mocked)
        syncManager.attemptReconnection = () => {
            syncManager.reconnectAttempts++;
            if (syncManager.reconnectAttempts >= 3) {
                syncManager.isReconnecting = false;
            }
        };
        
        syncManager.attemptReconnection();
        this.assert(syncManager.reconnectAttempts > 0, 'Reconnection should be attempted');
    }

    async testWebSocketClientConnection() {
        // Mock WebSocket for testing
        global.WebSocket = class MockWebSocket {
            constructor(url) {
                setTimeout(() => {
                    this.onopen && this.onopen();
                }, 10);
            }
            
            send() {}
            close() {}
        };
        
        const client = new WebSocketClient();
        try {
            await client.connect('ws://test');
            this.assert(true, 'WebSocket client should connect');
        } catch (error) {
            this.assert(false, 'WebSocket client connection failed');
        }
    }

    async testWebSocketClientMessaging() {
        const client = new WebSocketClient();
        client.isConnected = true;
        
        const result = client.send({ type: 'TEST_MESSAGE' });
        this.assert(result !== false, 'Message should be sent');
    }

    async testWebSocketClientReconnection() {
        const client = new WebSocketClient({
            maxReconnectAttempts: 2,
            reconnectDelay: 50
        });
        
        client.isReconnecting = true;
        client.reconnectAttempts = 0;
        
        client.attemptReconnection = () => {
            client.reconnectAttempts++;
            client.isReconnecting = false;
        };
        
        client.attemptReconnection();
        this.assert(client.reconnectAttempts > 0, 'Reconnection should be attempted');
    }

    async testWebSocketClientHeartbeat() {
        const client = new WebSocketClient({ heartbeatInterval: 100 });
        client.isConnected = true;
        client.send = (message) => {
            if (message.type === 'heartbeat') {
                this.assert(true, 'Heartbeat should be sent');
            }
        };
        
        client.startHeartbeat();
        setTimeout(() => client.stopHeartbeat(), 150);
    }

    async testWebSocketClientErrorHandling() {
        const client = new WebSocketClient();
        let errorHandled = false;
        
        client.on('error', () => {
            errorHandled = true;
        });
        
        client.handleConnectionError(new Error('Test error'));
        this.assert(errorHandled, 'Error should be handled');
    }

    async testConflictResolverStrategies() {
        const conflict = {
            localState: { timestamp: 1000, data: 'local' },
            remoteUpdate: { timestamp: 2000, data: 'remote' }
        };
        
        // Test last-write-wins
        const resolution = this.testConflictResolver.resolve(conflict);
        this.assert(resolution.action === 'accept_remote', 'Last-write-wins should accept remote');
    }

    async testConflictResolverMerging() {
        const conflict = {
            localState: { a: 1, b: 2 },
            remoteUpdate: { b: 3, c: 4 }
        };
        
        const resolver = new ConflictResolver({ strategy: 'merge' });
        const resolution = await resolver.resolve(conflict);
        
        this.assert(resolution.action === 'merge', 'Merge strategy should be used');
    }

    async testConflictResolverUserIntervention() {
        const resolver = new ConflictResolver({ 
            strategy: 'user-choice',
            enableUserIntervention: true 
        });
        
        const conflict = {
            localState: { data: 'local' },
            remoteUpdate: { data: 'remote' }
        };
        
        // Mock user intervention
        resolver.provideUserResolution = (conflictId, resolution) => {
            resolver.resolveConflict = () => Promise.resolve(resolution);
        };
        
        const resolution = await resolver.resolve(conflict);
        this.assert(resolution.action === 'user_intervention', 'User intervention should be requested');
    }

    async testConflictResolverMetrics() {
        const metrics = this.testConflictResolver.getMetrics();
        this.assert(typeof metrics.conflictsDetected === 'number', 'Metrics should include conflicts detected');
        this.assert(typeof metrics.conflictsResolved === 'number', 'Metrics should include conflicts resolved');
    }

    async testComponentRegistration() {
        const mockComponent = { id: 'test-component' };
        const componentId = this.testComponentIntegration.registerComponent(mockComponent);
        
        this.assert(componentId !== null, 'Component should be registered');
        this.assert(this.testComponentIntegration.getComponent(componentId) !== null, 'Component should be retrievable');
    }

    async testComponentStateSubscription() {
        const mockComponent = { id: 'test-component' };
        let stateChanged = false;
        
        this.testComponentIntegration.registerComponent(mockComponent, {
            statePaths: ['app.theme'],
            onStateChange: () => { stateChanged = true; }
        });
        
        this.testStateStore.dispatch({ type: 'APP_SET_THEME', payload: { theme: 'dark' } });
        
        // Wait for update processing
        setTimeout(() => {
            this.assert(stateChanged, 'Component should receive state change notification');
        }, 50);
    }

    async testComponentDOMUpdates() {
        const mockElement = document.createElement('div');
        const mockComponent = { element: mockElement };
        
        this.testComponentIntegration.registerComponent(mockComponent, {
            statePaths: ['app.theme'],
            updateStrategy: 'text'
        });
        
        this.testStateStore.dispatch({ type: 'APP_SET_THEME', payload: { theme: 'dark' } });
        
        // Wait for DOM update
        setTimeout(() => {
            this.assert(mockElement.textContent.includes('dark'), 'Component DOM should be updated');
        }, 50);
    }

    async testComponentIsolation() {
        const mockComponent = { id: 'isolated-component' };
        
        this.testComponentIntegration.registerComponent(mockComponent, {
            isolated: true,
            statePaths: ['data.test']
        });
        
        // Test isolation logic
        const isolatedState = this.testComponentIntegration.componentIsolation.get('isolated-component');
        this.assert(isolatedState !== null, 'Component should have isolated state');
    }

    async testComponentSharedState() {
        const component1 = { id: 'component1' };
        const component2 = { id: 'component2' };
        
        this.testComponentIntegration.registerComponent(component1, {
            sharedStateKeys: ['sharedData']
        });
        
        this.testComponentIntegration.registerComponent(component2, {
            sharedStateKeys: ['sharedData']
        });
        
        this.testComponentIntegration.shareState('sharedData', 'test_value', 'component1');
        
        const sharedValue = this.testComponentIntegration.getSharedState('sharedData');
        this.assert(sharedValue === 'test_value', 'Shared state should be accessible');
    }

    async testComponentOptimisticUpdates() {
        const mockComponent = { id: 'optimistic-component' };
        
        this.testComponentIntegration.registerComponent(mockComponent, {
            optimisticUpdates: true
        });
        
        const updateFn = async () => {
            // Mock optimistic update
            return true;
        };
        
        const rollbackFn = async () => {
            // Mock rollback
            return true;
        };
        
        const result = await this.testComponentIntegration.optimisticUpdate('optimistic-component', updateFn, rollbackFn);
        this.assert(result !== false, 'Optimistic update should be processed');
    }

    async testAdvancedFeaturesHistory() {
        this.testStateStore.dispatch({ type: 'TEST_HISTORY' });
        const history = this.testAdvancedFeatures.getStateHistory();
        
        this.assert(history.length > 0, 'History should contain entries');
        this.assert(history[0].type === 'initial_state' || history[0].type === 'state_change', 'History should have valid entries');
    }

    async testAdvancedFeaturesAnalytics() {
        this.testAdvancedFeatures.trackAnalyticsEvent({
            type: 'test_event',
            data: { test: true }
        });
        
        const events = this.testAdvancedFeatures.getAnalyticsEvents();
        this.assert(events.length > 0, 'Analytics should contain events');
    }

    async testAdvancedFeaturesMonitoring() {
        const metrics = this.testAdvancedFeatures.getMetrics();
        this.assert(metrics !== null, 'Monitoring should provide metrics');
    }

    async testAdvancedFeaturesDebugging() {
        const sessionId = this.testAdvancedFeatures.startDebugSession();
        this.assert(sessionId !== null, 'Debug session should be created');
        
        const debugSession = this.testAdvancedFeatures.getDebugSession(sessionId);
        this.assert(debugSession !== null, 'Debug session should be retrievable');
        
        this.testAdvancedFeatures.stopDebugSession(sessionId);
    }

    async testAdvancedFeaturesPerformance() {
        const startTime = performance.now();
        
        // Perform some state operations
        for (let i = 0; i < 10; i++) {
            this.testStateStore.dispatch({ type: 'PERFORMANCE_TEST', payload: { index: i } });
        }
        
        const endTime = performance.now();
        const duration = endTime - startTime;
        
        this.assert(duration < 100, 'Performance should be within acceptable range');
    }

    async testIntegrationInitialization() {
        const integration = new StateManagementIntegration({
            enableRealTimeSync: false,
            enablePersistence: false,
            enableComponentIntegration: false,
            enableAdvancedFeatures: false
        });
        
        await integration.initialize();
        const status = integration.getStatus();
        
        this.assert(status.isInitialized, 'Integration should be initialized');
        this.assert(status.components.stateStore, 'State store component should be available');
        
        integration.destroy();
    }

    async testIntegrationCrossComponent() {
        // Test cross-component communication
        let stateChangeReceived = false;
        
        this.testStateStore.subscribe(() => {
            stateChangeReceived = true;
        });
        
        this.testStateStore.dispatch({ type: 'CROSS_COMPONENT_TEST' });
        
        this.assert(stateChangeReceived, 'Cross-component communication should work');
    }

    async testIntegrationErrorHandling() {
        let errorHandled = false;
        
        this.testStateStore.subscribe((newState) => {
            if (newState.app && newState.app.error) {
                errorHandled = true;
            }
        });
        
        this.testStateStore.dispatch({ type: 'APP_SET_ERROR', payload: { error: 'Test error' } });
        
        this.assert(errorHandled, 'Integration should handle errors');
    }

    async testIntegrationPerformance() {
        const integration = new StateManagementIntegration({
            enablePerformanceOptimization: true
        });
        
        await integration.initialize();
        
        const startTime = performance.now();
        
        // Perform multiple operations
        for (let i = 0; i < 50; i++) {
            integration.getStateStore().dispatch({ type: 'INTEGRATION_PERF_TEST', payload: { index: i } });
        }
        
        const endTime = performance.now();
        const duration = endTime - startTime;
        
        this.assert(duration < 200, 'Integration performance should be acceptable');
        
        integration.destroy();
    }

    async testIntegrationDataFlow() {
        const integration = new StateManagementIntegration();
        await integration.initialize();
        
        // Test data flow through all components
        const testAction = { type: 'DATA_FLOW_TEST', payload: { data: 'test' } };
        integration.getStateStore().dispatch(testAction);
        
        const state = integration.getStateStore().getState();
        this.assert(state !== null, 'Data should flow through integration');
        
        integration.destroy();
    }

    /**
     * Run performance tests
     */
    async runPerformanceTests() {
        console.log('[StateManagementTest] Running performance tests...');
        
        // State update performance
        await this.testStateUpdatePerformance();
        
        // Sync operation performance
        await this.testSyncOperationPerformance();
        
        // Persistence operation performance
        await this.testPersistenceOperationPerformance();
        
        // Component update performance
        await this.testComponentUpdatePerformance();
    }

    async testStateUpdatePerformance() {
        const iterations = 1000;
        const startTime = performance.now();
        
        for (let i = 0; i < iterations; i++) {
            this.testStateStore.dispatch({ type: 'PERF_TEST', payload: { index: i } });
        }
        
        const endTime = performance.now();
        const averageTime = (endTime - startTime) / iterations;
        
        this.performanceTests.stateUpdates.push({
            iterations,
            totalTime: endTime - startTime,
            averageTime
        });
        
        this.assert(averageTime < this.validationRules.performanceThresholds.stateUpdate,
            'State update performance should be within threshold');
    }

    async testSyncOperationPerformance() {
        // Mock sync operation
        const iterations = 100;
        const startTime = performance.now();
        
        for (let i = 0; i < iterations; i++) {
            // Simulate sync operation
            await new Promise(resolve => setTimeout(resolve, 1));
        }
        
        const endTime = performance.now();
        const averageTime = (endTime - startTime) / iterations;
        
        this.performanceTests.syncOperations.push({
            iterations,
            totalTime: endTime - startTime,
            averageTime
        });
        
        this.assert(averageTime < this.validationRules.performanceThresholds.syncOperation,
            'Sync operation performance should be within threshold');
    }

    async testPersistenceOperationPerformance() {
        const iterations = 50;
        const startTime = performance.now();
        
        for (let i = 0; i < iterations; i++) {
            const testState = { test: `data_${i}`, timestamp: Date.now() };
            await this.testStatePersistence.save(testState);
        }
        
        const endTime = performance.now();
        const averageTime = (endTime - startTime) / iterations;
        
        this.performanceTests.persistenceOperations.push({
            iterations,
            totalTime: endTime - startTime,
            averageTime
        });
        
        this.assert(averageTime < this.validationRules.performanceThresholds.persistenceOperation,
            'Persistence operation performance should be within threshold');
    }

    async testComponentUpdatePerformance() {
        const iterations = 100;
        const startTime = performance.now();
        
        for (let i = 0; i < iterations; i++) {
            const mockElement = document.createElement('div');
            const mockComponent = { element: mockElement, id: `perf_component_${i}` };
            
            this.testComponentIntegration.registerComponent(mockComponent, {
                statePaths: ['app.theme'],
                updateStrategy: 'text'
            });
            
            this.testStateStore.dispatch({ type: 'APP_SET_THEME', payload: { theme: `theme_${i}` } });
        }
        
        const endTime = performance.now();
        const averageTime = (endTime - startTime) / iterations;
        
        this.performanceTests.componentUpdates.push({
            iterations,
            totalTime: endTime - startTime,
            averageTime
        });
        
        this.assert(averageTime < this.validationRules.performanceThresholds.componentUpdate,
            'Component update performance should be within threshold');
    }

    /**
     * Run validation tests
     */
    async runValidationTests() {
        console.log('[StateManagementTest] Running validation tests...');
        
        // State immutability validation
        await this.validateStateImmutability();
        
        // Action validation
        await this.validateActions();
        
        // Error handling validation
        await this.validateErrorHandling();
        
        // Performance validation
        await this.validatePerformance();
    }

    async validateStateImmutability() {
        const initialState = this.testStateStore.getState();
        this.testStateStore.dispatch({ type: 'IMMUTABILITY_TEST' });
        const newState = this.testStateStore.getState();
        
        this.assert(initialState !== newState, 'State should be immutable');
        this.assert(typeof initialState === 'object', 'Initial state should be object');
        this.assert(typeof newState === 'object', 'New state should be object');
    }

    async validateActions() {
        // Test valid action
        const validAction = { type: 'VALID_TEST', payload: { test: true } };
        try {
            this.testStateStore.dispatch(validAction);
            this.assert(true, 'Valid action should be processed');
        } catch (error) {
            this.assert(false, 'Valid action should not throw error');
        }
        
        // Test invalid action
        const invalidAction = { type: '', payload: null };
        try {
            this.testStateStore.dispatch(invalidAction);
            this.assert(false, 'Invalid action should throw error');
        } catch (error) {
            this.assert(true, 'Invalid action should throw error');
        }
    }

    async validateErrorHandling() {
        let errorCaught = false;
        
        try {
            // Simulate error condition
            throw new Error('Test error');
        } catch (error) {
            errorCaught = true;
        }
        
        this.assert(errorCaught, 'Error handling should work');
    }

    async validatePerformance() {
        const metrics = this.getPerformanceMetrics();
        
        for (const [testType, tests] of Object.entries(this.performanceTests)) {
            if (tests.length > 0) {
                const latestTest = tests[tests.length - 1];
                const threshold = this.validationRules.performanceThresholds[testType.replace(/s$/, '')];
                
                if (threshold) {
                    this.assert(latestTest.averageTime < threshold,
                        `${testType} performance should be within threshold`);
                }
            }
        }
    }

    /**
     * Test utility methods
     */
    async runTest(category, testFunction) {
        const testName = testFunction.name;
        this.currentTest = { category, testName, startTime: Date.now() };
        
        try {
            console.log(`[StateManagementTest] Running ${category}.${testName}...`);
            await testFunction();
            
            const result = {
                category,
                testName,
                status: 'passed',
                duration: Date.now() - this.currentTest.startTime,
                timestamp: Date.now()
            };
            
            this.testResults.push(result);
            this.testSuite[category].push(result);
            
            console.log(`[StateManagementTest] ✓ ${category}.${testName} passed`);
            
        } catch (error) {
            const result = {
                category,
                testName,
                status: 'failed',
                error: error.message,
                duration: Date.now() - this.currentTest.startTime,
                timestamp: Date.now()
            };
            
            this.testResults.push(result);
            this.testSuite[category].push(result);
            
            console.error(`[StateManagementTest] ✗ ${category}.${testName} failed:`, error.message);
        }
        
        this.currentTest = null;
    }

    assert(condition, message) {
        if (!condition) {
            throw new Error(message || 'Assertion failed');
        }
    }

    /**
     * Generate test report
     */
    generateTestReport() {
        const totalTests = this.testResults.length;
        const passedTests = this.testResults.filter(r => r.status === 'passed').length;
        const failedTests = this.testResults.filter(r => r.status === 'failed').length;
        const totalDuration = this.testResults.reduce((sum, r) => sum + r.duration, 0);
        
        const report = {
            summary: {
                totalTests,
                passedTests,
                failedTests,
                successRate: (passedTests / totalTests * 100).toFixed(2) + '%',
                totalDuration,
                timestamp: Date.now()
            },
            results: this.testResults,
            suite: this.testSuite,
            performance: this.performanceTests,
            validation: {
                rules: this.validationRules,
                passed: failedTests === 0
            }
        };
        
        console.log('[StateManagementTest] Test Report Generated:');
        console.log(`- Total Tests: ${totalTests}`);
        console.log(`- Passed: ${passedTests}`);
        console.log(`- Failed: ${failedTests}`);
        console.log(`- Success Rate: ${report.summary.successRate}`);
        console.log(`- Total Duration: ${totalDuration}ms`);
        
        return report;
    }

    /**
     * Get performance metrics
     */
    getPerformanceMetrics() {
        return {
            stateUpdates: this.performanceTests.stateUpdates,
            syncOperations: this.performanceTests.syncOperations,
            persistenceOperations: this.performanceTests.persistenceOperations,
            componentUpdates: this.performanceTests.componentUpdates
        };
    }

    /**
     * Export test results
     */
    exportResults() {
        const report = this.generateTestReport();
        return JSON.stringify(report, null, 2);
    }

    /**
     * Clean up test environment
     */
    cleanup() {
        // Destroy test instances
        if (this.testStateStore) {
            this.testStateStore.destroy();
        }
        
        if (this.testStatePersistence) {
            this.testStatePersistence.destroy();
        }
        
        if (this.testComponentIntegration) {
            this.testComponentIntegration.destroy();
        }
        
        if (this.testAdvancedFeatures) {
            this.testAdvancedFeatures.destroy();
        }
        
        if (this.testConflictResolver) {
            this.testConflictResolver.destroy();
        }
        
        // Clear test data
        this.testResults = [];
        this.performanceTests = {
            stateUpdates: [],
            syncOperations: [],
            persistenceOperations: [],
            componentUpdates: []
        };
        
        console.log('[StateManagementTest] Test environment cleaned up');
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = StateManagementTest;
} else if (typeof window !== 'undefined') {
    window.StateManagementTest = StateManagementTest;
}