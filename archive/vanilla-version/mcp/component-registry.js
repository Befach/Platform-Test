/**
 * Component Registry System
 * 
 * Comprehensive component registration and management with:
 * - Component metadata and dependency tracking
 * - Dynamic component composition and configuration
 * - Component versioning and rollback capabilities
 * - Component caching and preloading strategies
 * - Cross-application component sharing and reuse
 * - Component inheritance and extension patterns
 * - Standardized component APIs and interfaces
 * 
 * @version 1.0.0
 * @author MCP Component Registry
 */

import { EventEmitter } from 'events';

/**
 * Component Registry Class
 */
export class ComponentRegistry extends EventEmitter {
  constructor() {
    super();
    
    // Component storage
    this.components = new Map();
    this.componentVersions = new Map();
    this.componentDependencies = new Map();
    this.componentMetadata = new Map();
    this.componentSnapshots = new Map();
    
    // Indexes for fast lookup
    this.componentsByType = new Map();
    this.componentsByApplication = new Map();
    this.componentsByTag = new Map();
    
    // Registry state
    this.state = {
      totalComponents: 0,
      totalVersions: 0,
      totalSnapshots: 0,
      lastUpdated: Date.now(),
      registryVersion: '1.0.0'
    };
    
    // Configuration
    this.config = {
      maxVersionsPerComponent: 50,
      enableCaching: true,
      enableVersioning: true,
      enableSnapshots: true,
      autoCleanup: true,
      cleanupInterval: 24 * 60 * 60 * 1000, // 24 hours
      cacheSize: 1000
    };
    
    // Component cache
    this.cache = new Map();
    this.cacheAccessTimes = new Map();
    
    // Start cleanup timer
    this.startCleanupTimer();
  }

  /**
   * Register a new component
   * @param {Object} componentData - Component data
   * @returns {Object} Registration result
   */
  async register(componentData) {
    const {
      id,
      name,
      type,
      version = '1.0.0',
      metadata = {},
      dependencies = [],
      application = 'default',
      tags = [],
      config = {},
      api = {},
      template = null,
      styles = null,
      scripts = null
    } = componentData;

    // Validate component data
    this.validateComponentData(componentData);

    // Check if component already exists
    if (this.components.has(id)) {
      throw new Error(`Component with ID '${id}' already exists. Use update() instead.`);
    }

    // Create component object
    const component = {
      id,
      name,
      type,
      version,
      metadata: {
        ...metadata,
        registeredAt: Date.now(),
        registeredBy: metadata.registeredBy || 'system',
        description: metadata.description || '',
        author: metadata.author || 'Unknown',
        license: metadata.license || 'MIT'
      },
      dependencies: new Set(dependencies),
      application,
      tags: new Set(tags),
      config: { ...config },
      api: { ...api },
      template,
      styles,
      scripts,
      state: 'registered',
      usage: {
        timesUsed: 0,
        lastUsed: null,
        applications: new Set()
      },
      performance: {
        loadTime: 0,
        renderTime: 0,
        memoryUsage: 0,
        lastMeasured: null
      }
    };

    // Store component
    this.components.set(id, component);
    
    // Update indexes
    this.updateIndexes(component);
    
    // Update version tracking
    if (this.config.enableVersioning) {
      this.trackComponentVersion(id, version, component);
    }
    
    // Update state
    this.state.totalComponents++;
    this.state.lastUpdated = Date.now();
    
    // Cache component if enabled
    if (this.config.enableCaching) {
      this.cacheComponent(id, component);
    }
    
    // Emit event
    this.emit('componentRegistered', {
      id,
      name,
      type,
      version,
      application,
      timestamp: Date.now()
    });
    
    console.log(`✅ Component registered: ${id} (${name}) v${version}`);
    
    return {
      success: true,
      component: this.sanitizeComponent(component),
      message: `Component '${id}' registered successfully`
    };
  }

  /**
   * Unregister a component
   * @param {string} componentId - Component ID
   * @returns {Object} Unregistration result
   */
  async unregister(componentId) {
    const component = this.components.get(componentId);
    
    if (!component) {
      throw new Error(`Component with ID '${componentId}' not found`);
    }

    // Check for dependents
    const dependents = this.findDependentComponents(componentId);
    if (dependents.length > 0) {
      throw new Error(`Cannot unregister component '${componentId}'. It has ${dependents.length} dependent components: ${dependents.join(', ')}`);
    }

    // Create snapshot before removal if enabled
    if (this.config.enableSnapshots) {
      await this.createSnapshot({
        componentIds: [componentId],
        snapshotName: `pre-unregister-${componentId}`,
        description: `Snapshot created before unregistering component ${componentId}`
      });
    }

    // Remove from storage
    this.components.delete(componentId);
    this.componentMetadata.delete(componentId);
    this.componentDependencies.delete(componentId);
    
    // Remove from cache
    this.cache.delete(componentId);
    this.cacheAccessTimes.delete(componentId);
    
    // Update indexes
    this.removeFromIndexes(component);
    
    // Update state
    this.state.totalComponents--;
    this.state.lastUpdated = Date.now();
    
    // Emit event
    this.emit('componentUnregistered', {
      id: componentId,
      name: component.name,
      type: component.type,
      timestamp: Date.now()
    });
    
    console.log(`✅ Component unregistered: ${componentId}`);
    
    return {
      success: true,
      message: `Component '${componentId}' unregistered successfully`
    };
  }

  /**
   * Update a component
   * @param {string} componentId - Component ID
   * @param {Object} updates - Updates to apply
   * @param {string} newVersion - New version (optional)
   * @returns {Object} Update result
   */
  async update(componentId, updates, newVersion = null) {
    const component = this.components.get(componentId);
    
    if (!component) {
      throw new Error(`Component with ID '${componentId}' not found`);
    }

    // Create snapshot before update if enabled
    if (this.config.enableSnapshots) {
      await this.createSnapshot({
        componentIds: [componentId],
        snapshotName: `pre-update-${componentId}`,
        description: `Snapshot created before updating component ${componentId}`
      });
    }

    // Store old version for rollback
    const oldComponent = JSON.parse(JSON.stringify(component));
    
    // Apply updates
    const updatedComponent = { ...component };
    
    // Update basic properties
    if (updates.name) updatedComponent.name = updates.name;
    if (updates.metadata) updatedComponent.metadata = { ...component.metadata, ...updates.metadata };
    if (updates.config) updatedComponent.config = { ...component.config, ...updates.config };
    if (updates.api) updatedComponent.api = { ...component.api, ...updates.api };
    if (updates.template) updatedComponent.template = updates.template;
    if (updates.styles) updatedComponent.styles = updates.styles;
    if (updates.scripts) updatedComponent.scripts = updates.scripts;
    
    // Update dependencies
    if (updates.dependencies) {
      updatedComponent.dependencies = new Set(updates.dependencies);
      this.componentDependencies.set(componentId, new Set(updates.dependencies));
    }
    
    // Update tags
    if (updates.tags) {
      updatedComponent.tags = new Set(updates.tags);
    }
    
    // Update version if provided
    if (newVersion && this.config.enableVersioning) {
      updatedComponent.version = newVersion;
      this.trackComponentVersion(componentId, newVersion, updatedComponent);
    }
    
    // Update metadata
    updatedComponent.metadata.updatedAt = Date.now();
    updatedComponent.metadata.updatedBy = updates.updatedBy || 'system';
    
    // Store updated component
    this.components.set(componentId, updatedComponent);
    
    // Update indexes
    this.removeFromIndexes(oldComponent);
    this.updateIndexes(updatedComponent);
    
    // Update cache
    if (this.config.enableCaching) {
      this.cacheComponent(componentId, updatedComponent);
    }
    
    // Update state
    this.state.lastUpdated = Date.now();
    
    // Emit event
    this.emit('componentUpdated', {
      id: componentId,
      oldVersion: component.version,
      newVersion: updatedComponent.version,
      updates,
      timestamp: Date.now()
    });
    
    console.log(`✅ Component updated: ${componentId} (${updatedComponent.name}) v${updatedComponent.version}`);
    
    return {
      success: true,
      component: this.sanitizeComponent(updatedComponent),
      oldVersion: component.version,
      newVersion: updatedComponent.version,
      message: `Component '${componentId}' updated successfully`
    };
  }

  /**
   * Rollback a component to a previous version
   * @param {string} componentId - Component ID
   * @param {string} targetVersion - Target version to rollback to
   * @returns {Object} Rollback result
   */
  async rollback(componentId, targetVersion) {
    const component = this.components.get(componentId);
    
    if (!component) {
      throw new Error(`Component with ID '${componentId}' not found`);
    }

    // Get version history
    const versionHistory = this.componentVersions.get(componentId);
    if (!versionHistory) {
      throw new Error(`No version history found for component '${componentId}'`);
    }

    // Find target version
    const targetVersionData = versionHistory.find(v => v.version === targetVersion);
    if (!targetVersionData) {
      throw new Error(`Version '${targetVersion}' not found for component '${componentId}'`);
    }

    // Create snapshot before rollback
    if (this.config.enableSnapshots) {
      await this.createSnapshot({
        componentIds: [componentId],
        snapshotName: `pre-rollback-${componentId}`,
        description: `Snapshot created before rolling back component ${componentId} to version ${targetVersion}`
      });
    }

    // Restore component from version data
    const restoredComponent = JSON.parse(JSON.stringify(targetVersionData.component));
    restoredComponent.metadata.rollbackAt = Date.now();
    restoredComponent.metadata.rollbackFrom = component.version;
    
    // Store restored component
    this.components.set(componentId, restoredComponent);
    
    // Update indexes
    this.removeFromIndexes(component);
    this.updateIndexes(restoredComponent);
    
    // Update cache
    if (this.config.enableCaching) {
      this.cacheComponent(componentId, restoredComponent);
    }
    
    // Update state
    this.state.lastUpdated = Date.now();
    
    // Emit event
    this.emit('componentRolledBack', {
      id: componentId,
      fromVersion: component.version,
      toVersion: targetVersion,
      timestamp: Date.now()
    });
    
    console.log(`✅ Component rolled back: ${componentId} from v${component.version} to v${targetVersion}`);
    
    return {
      success: true,
      component: this.sanitizeComponent(restoredComponent),
      fromVersion: component.version,
      toVersion: targetVersion,
      message: `Component '${componentId}' rolled back to version '${targetVersion}'`
    };
  }

  /**
   * Get component state
   * @param {string} componentId - Component ID
   * @param {boolean} includeMetadata - Include metadata
   * @returns {Object} Component state
   */
  async getState(componentId, includeMetadata = false) {
    const component = this.components.get(componentId);
    
    if (!component) {
      throw new Error(`Component with ID '${componentId}' not found`);
    }

    // Get from cache if available
    let cachedComponent = null;
    if (this.config.enableCaching) {
      cachedComponent = this.cache.get(componentId);
    }

    const componentData = cachedComponent || component;
    const result = this.sanitizeComponent(componentData);
    
    if (!includeMetadata) {
      delete result.metadata;
    }
    
    // Add additional state information
    result.state = {
      ...result.state,
      dependents: this.findDependentComponents(componentId),
      dependencies: Array.from(component.dependencies),
      canBeUnregistered: this.findDependentComponents(componentId).length === 0
    };
    
    return result;
  }

  /**
   * List components with filtering and sorting
   * @param {Object} filter - Filter criteria
   * @param {string} sortBy - Sort field
   * @param {string} sortOrder - Sort order
   * @returns {Array} List of components
   */
  async list(filter = {}, sortBy = 'name', sortOrder = 'asc') {
    let components = Array.from(this.components.values());
    
    // Apply filters
    if (filter.type) {
      components = components.filter(c => c.type === filter.type);
    }
    
    if (filter.application) {
      components = components.filter(c => c.application === filter.application);
    }
    
    if (filter.tags && filter.tags.length > 0) {
      components = components.filter(c => 
        filter.tags.some(tag => c.tags.has(tag))
      );
    }
    
    if (filter.state) {
      components = components.filter(c => c.state === filter.state);
    }
    
    if (filter.search) {
      const searchTerm = filter.search.toLowerCase();
      components = components.filter(c => 
        c.name.toLowerCase().includes(searchTerm) ||
        c.id.toLowerCase().includes(searchTerm) ||
        (c.metadata.description && c.metadata.description.toLowerCase().includes(searchTerm))
      );
    }
    
    // Apply sorting
    components.sort((a, b) => {
      let aValue, bValue;
      
      switch (sortBy) {
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case 'type':
          aValue = a.type.toLowerCase();
          bValue = b.type.toLowerCase();
          break;
        case 'version':
          aValue = a.version;
          bValue = b.version;
          break;
        case 'registeredAt':
          aValue = a.metadata.registeredAt;
          bValue = b.metadata.registeredAt;
          break;
        case 'timesUsed':
          aValue = a.usage.timesUsed;
          bValue = b.usage.timesUsed;
          break;
        default:
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
      }
      
      if (sortOrder === 'desc') {
        return aValue < bValue ? 1 : aValue > bValue ? -1 : 0;
      } else {
        return aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
      }
    });
    
    // Sanitize components for output
    return components.map(c => this.sanitizeComponent(c));
  }

  /**
   * Create a component snapshot
   * @param {Object} options - Snapshot options
   * @returns {Object} Snapshot result
   */
  async createSnapshot(options) {
    const {
      componentIds = null,
      snapshotName,
      description = '',
      includeMetadata = true
    } = options;

    // Generate snapshot ID
    const snapshotId = this.generateSnapshotId();
    
    // Determine which components to snapshot
    let componentsToSnapshot;
    if (componentIds) {
      componentsToSnapshot = componentIds.map(id => this.components.get(id)).filter(Boolean);
    } else {
      componentsToSnapshot = Array.from(this.components.values());
    }
    
    if (componentsToSnapshot.length === 0) {
      throw new Error('No components found to create snapshot');
    }

    // Create snapshot data
    const snapshot = {
      id: snapshotId,
      name: snapshotName,
      description,
      createdAt: Date.now(),
      createdBy: 'system',
      componentCount: componentsToSnapshot.length,
      components: {}
    };
    
    // Add component data
    for (const component of componentsToSnapshot) {
      const componentData = includeMetadata ? 
        this.sanitizeComponent(component) : 
        this.sanitizeComponent(component, false);
      
      snapshot.components[component.id] = {
        ...componentData,
        snapshotVersion: component.version
      };
    }
    
    // Store snapshot
    this.componentSnapshots.set(snapshotId, snapshot);
    this.state.totalSnapshots++;
    this.state.lastUpdated = Date.now();
    
    // Emit event
    this.emit('snapshotCreated', {
      snapshotId,
      name: snapshotName,
      componentCount: componentsToSnapshot.length,
      timestamp: Date.now()
    });
    
    console.log(`✅ Snapshot created: ${snapshotName} (${snapshotId}) with ${componentsToSnapshot.length} components`);
    
    return {
      success: true,
      snapshot: {
        id: snapshot.id,
        name: snapshot.name,
        description: snapshot.description,
        createdAt: snapshot.createdAt,
        componentCount: snapshot.componentCount
      },
      message: `Snapshot '${snapshotName}' created successfully`
    };
  }

  /**
   * Restore components from a snapshot
   * @param {string} snapshotId - Snapshot ID
   * @param {Array} componentIds - Component IDs to restore (optional)
   * @returns {Object} Restore result
   */
  async restoreSnapshot(snapshotId, componentIds = null) {
    const snapshot = this.componentSnapshots.get(snapshotId);
    
    if (!snapshot) {
      throw new Error(`Snapshot with ID '${snapshotId}' not found`);
    }

    // Determine which components to restore
    let componentsToRestore;
    if (componentIds) {
      componentsToRestore = componentIds.map(id => snapshot.components[id]).filter(Boolean);
    } else {
      componentsToRestore = Object.values(snapshot.components);
    }
    
    if (componentsToRestore.length === 0) {
      throw new Error('No components found to restore from snapshot');
    }

    // Restore components
    const restoredComponents = [];
    
    for (const componentData of componentsToRestore) {
      const componentId = componentData.id;
      
      // Create backup of current component if it exists
      const currentComponent = this.components.get(componentId);
      if (currentComponent) {
        await this.createSnapshot({
          componentIds: [componentId],
          snapshotName: `pre-restore-${componentId}`,
          description: `Backup before restoring from snapshot ${snapshotId}`
        });
      }
      
      // Restore component
      const restoredComponent = {
        ...componentData,
        metadata: {
          ...componentData.metadata,
          restoredAt: Date.now(),
          restoredFrom: snapshotId,
          originalVersion: componentData.version
        },
        dependencies: new Set(componentData.dependencies || []),
        tags: new Set(componentData.tags || []),
        usage: {
          timesUsed: componentData.usage?.timesUsed || 0,
          lastUsed: componentData.usage?.lastUsed || null,
          applications: new Set(componentData.usage?.applications || [])
        },
        performance: {
          loadTime: componentData.performance?.loadTime || 0,
          renderTime: componentData.performance?.renderTime || 0,
          memoryUsage: componentData.performance?.memoryUsage || 0,
          lastMeasured: componentData.performance?.lastMeasured || null
        }
      };
      
      // Store restored component
      this.components.set(componentId, restoredComponent);
      
      // Update indexes
      if (currentComponent) {
        this.removeFromIndexes(currentComponent);
      }
      this.updateIndexes(restoredComponent);
      
      // Update cache
      if (this.config.enableCaching) {
        this.cacheComponent(componentId, restoredComponent);
      }
      
      restoredComponents.push(componentId);
    }
    
    // Update state
    this.state.lastUpdated = Date.now();
    
    // Emit event
    this.emit('snapshotRestored', {
      snapshotId,
      restoredComponentCount: restoredComponents.length,
      componentIds: restoredComponents,
      timestamp: Date.now()
    });
    
    console.log(`✅ Snapshot restored: ${snapshotId} with ${restoredComponents.length} components`);
    
    return {
      success: true,
      restoredComponents,
      message: `Restored ${restoredComponents.length} components from snapshot '${snapshotId}'`
    };
  }

  /**
   * List all snapshots
   * @returns {Array} List of snapshots
   */
  async listSnapshots() {
    const snapshots = Array.from(this.componentSnapshots.values());
    
    return snapshots.map(snapshot => ({
      id: snapshot.id,
      name: snapshot.name,
      description: snapshot.description,
      createdAt: snapshot.createdAt,
      componentCount: snapshot.componentCount,
      components: Object.keys(snapshot.components)
    }));
  }

  /**
   * Export registry data
   * @returns {Object} Registry export
   */
  async exportRegistry() {
    const components = Array.from(this.components.values()).map(c => 
      this.sanitizeComponent(c)
    );
    
    return {
      registry: {
        version: this.state.registryVersion,
        totalComponents: this.state.totalComponents,
        totalVersions: this.state.totalVersions,
        totalSnapshots: this.state.totalSnapshots,
        lastUpdated: this.state.lastUpdated,
        exportedAt: Date.now()
      },
      components,
      snapshots: await this.listSnapshots(),
      indexes: {
        byType: Array.from(this.componentsByType.entries()).map(([type, ids]) => ({
          type,
          components: Array.from(ids)
        })),
        byApplication: Array.from(this.componentsByApplication.entries()).map(([app, ids]) => ({
          application: app,
          components: Array.from(ids)
        })),
        byTag: Array.from(this.componentsByTag.entries()).map(([tag, ids]) => ({
          tag,
          components: Array.from(ids)
        }))
      }
    };
  }

  /**
   * Private helper methods
   */

  validateComponentData(data) {
    const required = ['id', 'name', 'type'];
    for (const field of required) {
      if (!data[field]) {
        throw new Error(`Required field '${field}' is missing`);
      }
    }
    
    // Validate ID format
    if (typeof data.id !== 'string' || !/^[a-zA-Z0-9_-]+$/.test(data.id)) {
      throw new Error('Component ID must be a string containing only letters, numbers, underscores, and hyphens');
    }
    
    // Validate dependencies
    if (data.dependencies) {
      for (const dep of data.dependencies) {
        if (!this.components.has(dep)) {
          console.warn(`Dependency '${dep}' not found in registry`);
        }
      }
    }
  }

  updateIndexes(component) {
    // Update type index
    if (!this.componentsByType.has(component.type)) {
      this.componentsByType.set(component.type, new Set());
    }
    this.componentsByType.get(component.type).add(component.id);
    
    // Update application index
    if (!this.componentsByApplication.has(component.application)) {
      this.componentsByApplication.set(component.application, new Set());
    }
    this.componentsByApplication.get(component.application).add(component.id);
    
    // Update tag indexes
    for (const tag of component.tags) {
      if (!this.componentsByTag.has(tag)) {
        this.componentsByTag.set(tag, new Set());
      }
      this.componentsByTag.get(tag).add(component.id);
    }
    
    // Update dependencies index
    this.componentDependencies.set(component.id, component.dependencies);
  }

  removeFromIndexes(component) {
    // Remove from type index
    const typeSet = this.componentsByType.get(component.type);
    if (typeSet) {
      typeSet.delete(component.id);
      if (typeSet.size === 0) {
        this.componentsByType.delete(component.type);
      }
    }
    
    // Remove from application index
    const appSet = this.componentsByApplication.get(component.application);
    if (appSet) {
      appSet.delete(component.id);
      if (appSet.size === 0) {
        this.componentsByApplication.delete(component.application);
      }
    }
    
    // Remove from tag indexes
    for (const tag of component.tags) {
      const tagSet = this.componentsByTag.get(tag);
      if (tagSet) {
        tagSet.delete(component.id);
        if (tagSet.size === 0) {
          this.componentsByTag.delete(tag);
        }
      }
    }
  }

  trackComponentVersion(componentId, version, component) {
    if (!this.componentVersions.has(componentId)) {
      this.componentVersions.set(componentId, []);
    }
    
    const versionHistory = this.componentVersions.get(componentId);
    versionHistory.push({
      version,
      timestamp: Date.now(),
      component: JSON.parse(JSON.stringify(component))
    });
    
    // Limit version history
    if (versionHistory.length > this.config.maxVersionsPerComponent) {
      versionHistory.shift();
    }
    
    this.state.totalVersions++;
  }

  findDependentComponents(componentId) {
    const dependents = [];
    
    for (const [id, dependencies] of this.componentDependencies) {
      if (dependencies.has(componentId)) {
        dependents.push(id);
      }
    }
    
    return dependents;
  }

  cacheComponent(componentId, component) {
    // Check cache size limit
    if (this.cache.size >= this.config.cacheSize) {
      this.evictLeastRecentlyUsed();
    }
    
    this.cache.set(componentId, JSON.parse(JSON.stringify(component)));
    this.cacheAccessTimes.set(componentId, Date.now());
  }

  evictLeastRecentlyUsed() {
    let oldestTime = Date.now();
    let oldestKey = null;
    
    for (const [key, time] of this.cacheAccessTimes) {
      if (time < oldestTime) {
        oldestTime = time;
        oldestKey = key;
      }
    }
    
    if (oldestKey) {
      this.cache.delete(oldestKey);
      this.cacheAccessTimes.delete(oldestKey);
    }
  }

  generateSnapshotId() {
    return `snapshot_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  sanitizeComponent(component, includeMetadata = true) {
    const sanitized = {
      id: component.id,
      name: component.name,
      type: component.type,
      version: component.version,
      application: component.application,
      state: component.state,
      config: { ...component.config },
      api: { ...component.api },
      usage: {
        timesUsed: component.usage.timesUsed,
        lastUsed: component.usage.lastUsed,
        applications: Array.from(component.usage.applications)
      },
      performance: { ...component.performance }
    };
    
    if (includeMetadata) {
      sanitized.metadata = { ...component.metadata };
    }
    
    // Convert Sets to Arrays
    sanitized.dependencies = Array.from(component.dependencies);
    sanitized.tags = Array.from(component.tags);
    
    return sanitized;
  }

  startCleanupTimer() {
    if (!this.config.autoCleanup) return;
    
    setInterval(() => {
      this.performCleanup();
    }, this.config.cleanupInterval);
  }

  performCleanup() {
    console.log('🧹 Performing registry cleanup...');
    
    // Clean up old cache entries
    const now = Date.now();
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours
    
    for (const [key, time] of this.cacheAccessTimes) {
      if (now - time > maxAge) {
        this.cache.delete(key);
        this.cacheAccessTimes.delete(key);
      }
    }
    
    console.log(`✅ Cleanup completed. Cache size: ${this.cache.size}`);
  }
}