/**
 * State Persistence and Recovery System
 * Handles state persistence, recovery, and backup mechanisms with multiple storage strategies
 */

class StatePersistence {
    constructor(options = {}) {
        this.options = {
            storageType: options.storageType || 'localStorage',
            storageKey: options.storageKey || 'app_state',
            backupKey: options.backupKey || 'app_state_backup',
            autoSave: options.autoSave !== false,
            autoSaveDelay: options.autoSaveDelay || 1000,
            enableBackups: options.enableBackups !== false,
            maxBackups: options.maxBackups || 5,
            compressionEnabled: options.compressionEnabled !== false,
            encryptionEnabled: options.encryptionEnabled || false,
            encryptionKey: options.encryptionKey || null,
            persistPaths: options.persistPaths || ['auth', 'app.theme', 'app.language', 'ui.layout'],
            excludePaths: options.excludePaths || ['data.temp', 'ui.modals.active'],
            validateOnLoad: options.validateOnLoad !== false,
            migrationEnabled: options.migrationEnabled !== false,
            ...options
        };
        
        this.storage = this.initializeStorage();
        this.saveTimer = null;
        this.isSaving = false;
        this.isLoading = false;
        
        this.persistenceState = {
            lastSave: null,
            lastLoad: null,
            saveCount: 0,
            loadCount: 0,
            errorCount: 0,
            lastError: null
        };
        
        this.backups = [];
        this.migrations = new Map();
        
        this.metrics = {
            saves: 0,
            loads: 0,
            errors: 0,
            totalSaveTime: 0,
            totalLoadTime: 0,
            averageSaveTime: 0,
            averageLoadTime: 0,
            totalBytesSaved: 0,
            totalBytesLoaded: 0
        };
        
        this.initializeMigrations();
    }

    /**
     * Initialize storage based on type
     */
    initializeStorage() {
        switch (this.options.storageType) {
            case 'localStorage':
                return {
                    get: (key) => localStorage.getItem(key),
                    set: (key, value) => localStorage.setItem(key, value),
                    remove: (key) => localStorage.removeItem(key),
                    clear: () => localStorage.clear(),
                    size: () => this.getLocalStorageSize()
                };
                
            case 'sessionStorage':
                return {
                    get: (key) => sessionStorage.getItem(key),
                    set: (key, value) => sessionStorage.setItem(key, value),
                    remove: (key) => sessionStorage.removeItem(key),
                    clear: () => sessionStorage.clear(),
                    size: () => this.getSessionStorageSize()
                };
                
            case 'indexedDB':
                return this.initializeIndexedDB();
                
            case 'memory':
                return {
                    get: (key) => this.memoryStorage?.get(key),
                    set: (key, value) => {
                        if (!this.memoryStorage) this.memoryStorage = new Map();
                        this.memoryStorage.set(key, value);
                    },
                    remove: (key) => this.memoryStorage?.delete(key),
                    clear: () => this.memoryStorage?.clear(),
                    size: () => this.getMemoryStorageSize()
                };
                
            default:
                throw new Error(`Unknown storage type: ${this.options.storageType}`);
        }
    }

    /**
     * Initialize IndexedDB storage
     */
    initializeIndexedDB() {
        return {
            get: async (key) => {
                const db = await this.getIndexedDB();
                return new Promise((resolve, reject) => {
                    const transaction = db.transaction(['state'], 'readonly');
                    const store = transaction.objectStore('state');
                    const request = store.get(key);
                    request.onsuccess = () => resolve(request.result?.value);
                    request.onerror = () => reject(request.error);
                });
            },
            set: async (key, value) => {
                const db = await this.getIndexedDB();
                return new Promise((resolve, reject) => {
                    const transaction = db.transaction(['state'], 'readwrite');
                    const store = transaction.objectStore('state');
                    const request = store.put({ key, value });
                    request.onsuccess = () => resolve();
                    request.onerror = () => reject(request.error);
                });
            },
            remove: async (key) => {
                const db = await this.getIndexedDB();
                return new Promise((resolve, reject) => {
                    const transaction = db.transaction(['state'], 'readwrite');
                    const store = transaction.objectStore('state');
                    const request = store.delete(key);
                    request.onsuccess = () => resolve();
                    request.onerror = () => reject(request.error);
                });
            },
            clear: async () => {
                const db = await this.getIndexedDB();
                return new Promise((resolve, reject) => {
                    const transaction = db.transaction(['state'], 'readwrite');
                    const store = transaction.objectStore('state');
                    const request = store.clear();
                    request.onsuccess = () => resolve();
                    request.onerror = () => reject(request.error);
                });
            },
            size: async () => {
                // IndexedDB size estimation is complex, return approximate
                return 0;
            }
        };
    }

    /**
     * Get IndexedDB instance
     */
    async getIndexedDB() {
        if (this.indexedDB) {
            return this.indexedDB;
        }
        
        return new Promise((resolve, reject) => {
            const request = indexedDB.open('StatePersistenceDB', 1);
            
            request.onerror = () => reject(request.error);
            request.onsuccess = () => {
                this.indexedDB = request.result;
                resolve(this.indexedDB);
            };
            
            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                if (!db.objectStoreNames.contains('state')) {
                    db.createObjectStore('state');
                }
            };
        });
    }

    /**
     * Save state to storage
     */
    async save(state, options = {}) {
        if (this.isSaving) {
            console.warn('[StatePersistence] Save already in progress');
            return false;
        }

        const startTime = performance.now();
        
        try {
            this.isSaving = true;
            
            // Extract state to persist
            const stateToPersist = this.extractState(state, options);
            
            // Validate state
            if (this.options.validateOnLoad && !this.validateState(stateToPersist)) {
                throw new Error('State validation failed');
            }
            
            // Prepare data
            let data = {
                state: stateToPersist,
                metadata: {
                    version: this.getStateVersion(stateToPersist),
                    timestamp: Date.now(),
                    clientId: this.getClientId(),
                    checksum: this.calculateChecksum(stateToPersist)
                }
            };
            
            // Compress if enabled
            if (this.options.compressionEnabled) {
                data = await this.compressData(data);
            }
            
            // Encrypt if enabled
            if (this.options.encryptionEnabled) {
                data = await this.encryptData(data);
            }
            
            // Serialize
            const serialized = JSON.stringify(data);
            
            // Save to storage
            await this.storage.set(this.options.storageKey, serialized);
            
            // Create backup if enabled
            if (this.options.enableBackups) {
                await this.createBackup(stateToPersist);
            }
            
            // Update metrics
            const endTime = performance.now();
            const duration = endTime - startTime;
            this.updateSaveMetrics(duration, serialized.length);
            
            // Update persistence state
            this.persistenceState.lastSave = Date.now();
            this.persistenceState.saveCount++;
            
            console.log(`[StatePersistence] State saved successfully (${duration.toFixed(2)}ms)`);
            return true;
            
        } catch (error) {
            console.error('[StatePersistence] Save failed:', error);
            this.handleSaveError(error);
            return false;
        } finally {
            this.isSaving = false;
        }
    }

    /**
     * Load state from storage
     */
    async load(options = {}) {
        if (this.isLoading) {
            console.warn('[StatePersistence] Load already in progress');
            return null;
        }

        const startTime = performance.now();
        
        try {
            this.isLoading = true;
            
            // Get from storage
            const serialized = await this.storage.get(this.options.storageKey);
            if (!serialized) {
                console.log('[StatePersistence] No saved state found');
                return null;
            }
            
            // Deserialize
            let data = JSON.parse(serialized);
            
            // Decrypt if enabled
            if (this.options.encryptionEnabled) {
                data = await this.decryptData(data);
            }
            
            // Decompress if enabled
            if (this.options.compressionEnabled) {
                data = await this.decompressData(data);
            }
            
            // Validate metadata
            if (!this.validateMetadata(data.metadata)) {
                throw new Error('Invalid state metadata');
            }
            
            // Validate checksum
            if (!this.validateChecksum(data.state, data.metadata.checksum)) {
                console.warn('[StatePersistence] Checksum validation failed, attempting backup recovery');
                return await this.loadFromBackup();
            }
            
            // Run migrations if needed
            if (this.options.migrationEnabled) {
                data.state = await this.runMigrations(data.state, data.metadata.version);
            }
            
            // Validate state
            if (this.options.validateOnLoad && !this.validateState(data.state)) {
                throw new Error('State validation failed');
            }
            
            // Update metrics
            const endTime = performance.now();
            const duration = endTime - startTime;
            this.updateLoadMetrics(duration, serialized.length);
            
            // Update persistence state
            this.persistenceState.lastLoad = Date.now();
            this.persistenceState.loadCount++;
            
            console.log(`[StatePersistence] State loaded successfully (${duration.toFixed(2)}ms)`);
            return data.state;
            
        } catch (error) {
            console.error('[StatePersistence] Load failed:', error);
            this.handleLoadError(error);
            
            // Attempt backup recovery
            if (this.options.enableBackups) {
                console.log('[StatePersistence] Attempting backup recovery');
                return await this.loadFromBackup();
            }
            
            return null;
        } finally {
            this.isLoading = false;
        }
    }

    /**
     * Auto-save state with debouncing
     */
    autoSave(state) {
        if (!this.options.autoSave) {
            return;
        }
        
        // Clear existing timer
        if (this.saveTimer) {
            clearTimeout(this.saveTimer);
        }
        
        // Set new timer
        this.saveTimer = setTimeout(() => {
            this.save(state);
            this.saveTimer = null;
        }, this.options.autoSaveDelay);
    }

    /**
     * Create backup
     */
    async createBackup(state) {
        try {
            const backup = {
                state,
                metadata: {
                    version: this.getStateVersion(state),
                    timestamp: Date.now(),
                    type: 'auto_backup'
                }
            };
            
            // Add to backups list
            this.backups.push(backup);
            
            // Limit backups
            if (this.backups.length > this.options.maxBackups) {
                this.backups.shift();
            }
            
            // Save backups to storage
            await this.storage.set(this.options.backupKey, JSON.stringify(this.backups));
            
            console.log('[StatePersistence] Backup created successfully');
            
        } catch (error) {
            console.error('[StatePersistence] Backup creation failed:', error);
        }
    }

    /**
     * Load from backup
     */
    async loadFromBackup() {
        try {
            // Get backups from storage
            const serialized = await this.storage.get(this.options.backupKey);
            if (!serialized) {
                console.log('[StatePersistence] No backups found');
                return null;
            }
            
            this.backups = JSON.parse(serialized);
            
            if (this.backups.length === 0) {
                console.log('[StatePersistence] No backups available');
                return null;
            }
            
            // Get most recent backup
            const latestBackup = this.backups[this.backups.length - 1];
            
            console.log('[StatePersistence] Loaded from backup');
            return latestBackup.state;
            
        } catch (error) {
            console.error('[StatePersistence] Backup load failed:', error);
            return null;
        }
    }

    /**
     * Extract state paths to persist
     */
    extractState(state, options = {}) {
        const persistPaths = options.persistPaths || this.options.persistPaths;
        const excludePaths = options.excludePaths || this.options.excludePaths;
        
        const result = {};
        
        // Include specified paths
        for (const path of persistPaths) {
            const value = this.getNestedValue(state, path);
            if (value !== undefined && value !== null) {
                this.setNestedValue(result, path, value);
            }
        }
        
        // Exclude specified paths
        for (const path of excludePaths) {
            this.removeNestedValue(result, path);
        }
        
        return result;
    }

    /**
     * Validate state structure
     */
    validateState(state) {
        try {
            // Basic validation
            if (!state || typeof state !== 'object') {
                return false;
            }
            
            // Check required fields
            const requiredFields = ['auth', 'app'];
            for (const field of requiredFields) {
                if (!state[field]) {
                    console.warn(`[StatePersistence] Missing required field: ${field}`);
                    return false;
                }
            }
            
            return true;
            
        } catch (error) {
            console.error('[StatePersistence] State validation error:', error);
            return false;
        }
    }

    /**
     * Validate metadata
     */
    validateMetadata(metadata) {
        return metadata && 
               typeof metadata.version === 'string' &&
               typeof metadata.timestamp === 'number' &&
               typeof metadata.checksum === 'string';
    }

    /**
     * Calculate checksum
     */
    calculateChecksum(state) {
        const serialized = JSON.stringify(state);
        let hash = 0;
        
        for (let i = 0; i < serialized.length; i++) {
            const char = serialized.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        
        return hash.toString(16);
    }

    /**
     * Validate checksum
     */
    validateChecksum(state, expectedChecksum) {
        const actualChecksum = this.calculateChecksum(state);
        return actualChecksum === expectedChecksum;
    }

    /**
     * Compress data
     */
    async compressData(data) {
        if (typeof CompressionStream !== 'undefined') {
            try {
                const serialized = JSON.stringify(data);
                const stream = new CompressionStream('gzip');
                const writer = stream.writable.getWriter();
                const reader = stream.readable.getReader();
                
                writer.write(new TextEncoder().encode(serialized));
                writer.close();
                
                const chunks = [];
                let done = false;
                
                while (!done) {
                    const { value, done: readerDone } = await reader.read();
                    done = readerDone;
                    if (value) chunks.push(value);
                }
                
                const compressed = new Uint8Array(chunks.reduce((acc, chunk) => acc + chunk.length, 0));
                let offset = 0;
                
                for (const chunk of chunks) {
                    compressed.set(chunk, offset);
                    offset += chunk.length;
                }
                
                return {
                    compressed: true,
                    data: Array.from(compressed)
                };
                
            } catch (error) {
                console.warn('[StatePersistence] Compression failed:', error);
            }
        }
        
        return data;
    }

    /**
     * Decompress data
     */
    async decompressData(data) {
        if (data.compressed && typeof DecompressionStream !== 'undefined') {
            try {
                const stream = new DecompressionStream('gzip');
                const writer = stream.writable.getWriter();
                const reader = stream.readable.getReader();
                
                writer.write(new Uint8Array(data.data));
                writer.close();
                
                const chunks = [];
                let done = false;
                
                while (!done) {
                    const { value, done: readerDone } = await reader.read();
                    done = readerDone;
                    if (value) chunks.push(value);
                }
                
                const decompressed = new Uint8Array(chunks.reduce((acc, chunk) => acc + chunk.length, 0));
                let offset = 0;
                
                for (const chunk of chunks) {
                    decompressed.set(chunk, offset);
                    offset += chunk.length;
                }
                
                const serialized = new TextDecoder().decode(decompressed);
                return JSON.parse(serialized);
                
            } catch (error) {
                console.warn('[StatePersistence] Decompression failed:', error);
            }
        }
        
        return data;
    }

    /**
     * Encrypt data
     */
    async encryptData(data) {
        if (!this.options.encryptionEnabled || !this.options.encryptionKey) {
            return data;
        }
        
        try {
            const serialized = JSON.stringify(data);
            const encrypted = await this.simpleEncrypt(serialized, this.options.encryptionKey);
            
            return {
                encrypted: true,
                data: encrypted
            };
            
        } catch (error) {
            console.error('[StatePersistence] Encryption failed:', error);
            throw error;
        }
    }

    /**
     * Decrypt data
     */
    async decryptData(data) {
        if (!data.encrypted) {
            return data;
        }
        
        try {
            const decrypted = await this.simpleDecrypt(data.data, this.options.encryptionKey);
            return JSON.parse(decrypted);
            
        } catch (error) {
            console.error('[StatePersistence] Decryption failed:', error);
            throw error;
        }
    }

    /**
     * Simple encryption (for demo purposes)
     */
    async simpleEncrypt(text, key) {
        // In production, use proper encryption like Web Crypto API
        const encrypted = [];
        for (let i = 0; i < text.length; i++) {
            encrypted.push(text.charCodeAt(i) ^ key.charCodeAt(i % key.length));
        }
        return btoa(String.fromCharCode(...encrypted));
    }

    /**
     * Simple decryption (for demo purposes)
     */
    async simpleDecrypt(encrypted, key) {
        const decrypted = [];
        const decoded = atob(encrypted);
        for (let i = 0; i < decoded.length; i++) {
            decrypted.push(decoded.charCodeAt(i) ^ key.charCodeAt(i % key.length));
        }
        return String.fromCharCode(...decrypted);
    }

    /**
     * Initialize migrations
     */
    initializeMigrations() {
        // Example migration from v1.0 to v1.1
        this.migrations.set('1.0->1.1', {
            description: 'Add theme support',
            migrate: (state) => {
                if (!state.app.theme) {
                    state.app.theme = 'light';
                }
                return state;
            }
        });
        
        // Add more migrations as needed
    }

    /**
     * Run migrations
     */
    async runMigrations(state, currentVersion) {
        if (!this.options.migrationEnabled) {
            return state;
        }
        
        const targetVersion = this.getTargetVersion();
        let migratedState = { ...state };
        let version = currentVersion;
        
        while (version !== targetVersion) {
            const nextVersion = this.getNextVersion(version);
            const migration = this.migrations.get(`${version}->${nextVersion}`);
            
            if (migration) {
                console.log(`[StatePersistence] Running migration: ${version}->${nextVersion}`);
                migratedState = migration.migrate(migratedState);
                version = nextVersion;
            } else {
                break;
            }
        }
        
        return migratedState;
    }

    /**
     * Get target version
     */
    getTargetVersion() {
        return '1.1'; // Update as needed
    }

    /**
     * Get next version
     */
    getNextVersion(currentVersion) {
        const versionMap = {
            '1.0': '1.1'
        };
        return versionMap[currentVersion];
    }

    /**
     * Get state version
     */
    getStateVersion(state) {
        return state.meta?.version || '1.0';
    }

    /**
     * Get client ID
     */
    getClientId() {
        if (!this.clientId) {
            this.clientId = `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        }
        return this.clientId;
    }

    /**
     * Utility methods for nested state
     */
    getNestedValue(obj, path) {
        return path.split('.').reduce((current, key) => {
            return current && current[key] !== undefined ? current[key] : null;
        }, obj);
    }

    setNestedValue(obj, path, value) {
        const keys = path.split('.');
        const lastKey = keys.pop();
        
        const target = keys.reduce((current, key) => {
            if (!current[key]) current[key] = {};
            return current[key];
        }, obj);
        
        target[lastKey] = value;
    }

    removeNestedValue(obj, path) {
        const keys = path.split('.');
        const lastKey = keys.pop();
        
        const target = keys.reduce((current, key) => {
            return current && current[key] ? current[key] : null;
        }, obj);
        
        if (target && target[lastKey] !== undefined) {
            delete target[lastKey];
        }
    }

    /**
     * Storage size utilities
     */
    getLocalStorageSize() {
        let total = 0;
        for (const key in localStorage) {
            if (localStorage.hasOwnProperty(key)) {
                total += localStorage[key].length + key.length;
            }
        }
        return total;
    }

    getSessionStorageSize() {
        let total = 0;
        for (const key in sessionStorage) {
            if (sessionStorage.hasOwnProperty(key)) {
                total += sessionStorage[key].length + key.length;
            }
        }
        return total;
    }

    getMemoryStorageSize() {
        if (!this.memoryStorage) return 0;
        
        let total = 0;
        for (const [key, value] of this.memoryStorage) {
            total += key.length + JSON.stringify(value).length;
        }
        return total;
    }

    /**
     * Update save metrics
     */
    updateSaveMetrics(duration, bytes) {
        this.metrics.saves++;
        this.metrics.totalSaveTime += duration;
        this.metrics.averageSaveTime = this.metrics.totalSaveTime / this.metrics.saves;
        this.metrics.totalBytesSaved += bytes;
    }

    /**
     * Update load metrics
     */
    updateLoadMetrics(duration, bytes) {
        this.metrics.loads++;
        this.metrics.totalLoadTime += duration;
        this.metrics.averageLoadTime = this.metrics.totalLoadTime / this.metrics.loads;
        this.metrics.totalBytesLoaded += bytes;
    }

    /**
     * Handle save error
     */
    handleSaveError(error) {
        this.persistenceState.errorCount++;
        this.persistenceState.lastError = {
            type: 'save',
            message: error.message,
            timestamp: Date.now()
        };
        
        this.metrics.errors++;
    }

    /**
     * Handle load error
     */
    handleLoadError(error) {
        this.persistenceState.errorCount++;
        this.persistenceState.lastError = {
            type: 'load',
            message: error.message,
            timestamp: Date.now()
        };
        
        this.metrics.errors++;
    }

    /**
     * Clear all persisted data
     */
    async clear() {
        try {
            await this.storage.remove(this.options.storageKey);
            await this.storage.remove(this.options.backupKey);
            this.backups = [];
            console.log('[StatePersistence] All persisted data cleared');
        } catch (error) {
            console.error('[StatePersistence] Clear failed:', error);
        }
    }

    /**
     * Get persistence status
     */
    getStatus() {
        return {
            ...this.persistenceState,
            isSaving: this.isSaving,
            isLoading: this.isLoading,
            backupCount: this.backups.length,
            storageType: this.options.storageType,
            storageSize: this.storage.size ? this.storage.size() : 0
        };
    }

    /**
     * Get metrics
     */
    getMetrics() {
        return {
            ...this.metrics,
            persistenceState: this.persistenceState
        };
    }

    /**
     * Destroy persistence system
     */
    destroy() {
        if (this.saveTimer) {
            clearTimeout(this.saveTimer);
            this.saveTimer = null;
        }
        
        this.backups = [];
        this.migrations.clear();
        
        if (this.indexedDB) {
            this.indexedDB.close();
        }
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = StatePersistence;
} else if (typeof window !== 'undefined') {
    window.StatePersistence = StatePersistence;
}