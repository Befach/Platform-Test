#!/usr/bin/env node

/**
 * MCP Server for Modern Component Architecture
 * 
 * Comprehensive MCP server providing:
 * - Real-time component synchronization
 * - Cross-application consistency
 * - Component lifecycle management
 * - Performance monitoring and optimization
 * - Dynamic component loading and unloading
 * - Component versioning and rollback
 * - WebSocket-based real-time updates
 * 
 * @version 1.0.0
 * @author MCP Component Architecture Server
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { WebSocketServer } from 'ws';
import { createServer } from 'http';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
  SubscribeRequestSchema,
  UnsubscribeRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

// Import MCP modules
import { ComponentRegistry } from './component-registry.js';
import { SyncManager } from './sync-manager.js';
import { ComponentLifecycle } from './component-lifecycle.js';
import { PerformanceMonitor } from './performance-monitor.js';

/**
 * Main MCP Server Class
 */
class MCPComponentServer {
  constructor() {
    this.server = null;
    this.wsServer = null;
    this.httpServer = null;
    this.clients = new Map();
    this.componentRegistry = new ComponentRegistry();
    this.syncManager = new SyncManager();
    this.lifecycle = new ComponentLifecycle();
    this.performanceMonitor = new PerformanceMonitor();
    
    // Server state
    this.state = {
      startTime: Date.now(),
      componentCount: 0,
      activeConnections: 0,
      syncOperations: 0,
      performanceMetrics: new Map()
    };
    
    // Initialize subsystems
    this.initializeSubsystems();
  }

  /**
   * Initialize all subsystems
   */
  initializeSubsystems() {
    // Setup component registry
    this.componentRegistry.on('componentRegistered', (data) => {
      this.handleComponentRegistered(data);
    });
    
    this.componentRegistry.on('componentUnregistered', (data) => {
      this.handleComponentUnregistered(data);
    });
    
    // Setup sync manager
    this.syncManager.on('syncCompleted', (data) => {
      this.handleSyncCompleted(data);
    });
    
    this.syncManager.on('syncConflict', (data) => {
      this.handleSyncConflict(data);
    });
    
    // Setup lifecycle manager
    this.lifecycle.on('lifecycleEvent', (data) => {
      this.handleLifecycleEvent(data);
    });
    
    // Setup performance monitor
    this.performanceMonitor.on('performanceAlert', (data) => {
      this.handlePerformanceAlert(data);
    });
  }

  /**
   * Start the MCP server
   */
  async start() {
    console.log('🚀 Starting MCP Component Architecture Server...');
    
    try {
      // Create MCP server
      this.server = new Server(
        {
          name: 'mcp-component-architecture',
          version: '1.0.0',
        },
        {
          capabilities: {
            tools: {},
            resources: {},
            subscriptions: {},
          },
        }
      );

      // Setup request handlers
      this.setupToolHandlers();
      this.setupResourceHandlers();
      this.setupSubscriptionHandlers();

      // Start HTTP server for WebSocket
      await this.startHttpServer();
      
      // Start WebSocket server
      await this.startWebSocketServer();
      
      // Connect to stdio transport
      const transport = new StdioServerTransport();
      await this.server.connect(transport);
      
      console.log('✅ MCP Component Architecture Server started successfully');
      console.log(`📊 Server started at ${new Date().toISOString()}`);
      
    } catch (error) {
      console.error('❌ Failed to start MCP server:', error);
      throw error;
    }
  }

  /**
   * Setup tool handlers
   */
  setupToolHandlers() {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: 'register_component',
            description: 'Register a new component in the architecture',
            inputSchema: {
              type: 'object',
              properties: {
                id: { type: 'string', description: 'Component ID' },
                name: { type: 'string', description: 'Component name' },
                type: { type: 'string', description: 'Component type' },
                version: { type: 'string', description: 'Component version' },
                metadata: { type: 'object', description: 'Component metadata' },
                dependencies: { type: 'array', items: { type: 'string' }, description: 'Component dependencies' }
              },
              required: ['id', 'name', 'type', 'version']
            }
          },
          {
            name: 'unregister_component',
            description: 'Unregister a component from the architecture',
            inputSchema: {
              type: 'object',
              properties: {
                id: { type: 'string', description: 'Component ID' }
              },
              required: ['id']
            }
          },
          {
            name: 'sync_components',
            description: 'Synchronize components across applications',
            inputSchema: {
              type: 'object',
              properties: {
                componentIds: { type: 'array', items: { type: 'string' }, description: 'Component IDs to sync' },
                targetApplications: { type: 'array', items: { type: 'string' }, description: 'Target applications' },
                syncMode: { type: 'string', enum: ['full', 'incremental', 'selective'], description: 'Sync mode' }
              },
              required: ['componentIds']
            }
          },
          {
            name: 'get_component_state',
            description: 'Get the current state of a component',
            inputSchema: {
              type: 'object',
              properties: {
                id: { type: 'string', description: 'Component ID' },
                includeMetadata: { type: 'boolean', description: 'Include metadata' }
              },
              required: ['id']
            }
          },
          {
            name: 'update_component',
            description: 'Update a component\'s state or configuration',
            inputSchema: {
              type: 'object',
              properties: {
                id: { type: 'string', description: 'Component ID' },
                updates: { type: 'object', description: 'Component updates' },
                version: { type: 'string', description: 'New version' }
              },
              required: ['id', 'updates']
            }
          },
          {
            name: 'rollback_component',
            description: 'Rollback a component to a previous version',
            inputSchema: {
              type: 'object',
              properties: {
                id: { type: 'string', description: 'Component ID' },
                targetVersion: { type: 'string', description: 'Target version to rollback to' }
              },
              required: ['id', 'targetVersion']
            }
          },
          {
            name: 'get_performance_metrics',
            description: 'Get performance metrics for components',
            inputSchema: {
              type: 'object',
              properties: {
                componentIds: { type: 'array', items: { type: 'string' }, description: 'Component IDs (optional, all if not provided)' },
                timeRange: { type: 'string', description: 'Time range (1h, 24h, 7d, 30d)' }
              }
            }
          },
          {
            name: 'optimize_components',
            description: 'Optimize component performance based on metrics',
            inputSchema: {
              type: 'object',
              properties: {
                componentIds: { type: 'array', items: { type: 'string' }, description: 'Component IDs to optimize' },
                optimizationLevel: { type: 'string', enum: ['conservative', 'moderate', 'aggressive'], description: 'Optimization level' }
              }
            }
          },
          {
            name: 'list_components',
            description: 'List all registered components',
            inputSchema: {
              type: 'object',
              properties: {
                filter: { type: 'object', description: 'Filter criteria' },
                sortBy: { type: 'string', description: 'Sort field' },
                sortOrder: { type: 'string', enum: ['asc', 'desc'], description: 'Sort order' }
              }
            }
          },
          {
            name: 'create_component_snapshot',
            description: 'Create a snapshot of component states',
            inputSchema: {
              type: 'object',
              properties: {
                componentIds: { type: 'array', items: { type: 'string' }, description: 'Component IDs to snapshot' },
                snapshotName: { type: 'string', description: 'Snapshot name' },
                description: { type: 'string', description: 'Snapshot description' }
              },
              required: ['snapshotName']
            }
          },
          {
            name: 'restore_component_snapshot',
            description: 'Restore components from a snapshot',
            inputSchema: {
              type: 'object',
              properties: {
                snapshotId: { type: 'string', description: 'Snapshot ID' },
                componentIds: { type: 'array', items: { type: 'string' }, description: 'Component IDs to restore (optional, all if not provided)' }
              },
              required: ['snapshotId']
            }
          }
        ]
      };
    });

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;
      
      try {
        const result = await this.handleToolCall(name, args);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2)
            }
          ]
        };
      } catch (error) {
        console.error(`Tool call error (${name}):`, error);
        return {
          content: [
            {
              type: 'text',
              text: `Error: ${error.message}`
            }
          ],
          isError: true
        };
      }
    });
  }

  /**
   * Handle tool calls
   */
  async handleToolCall(name, args) {
    const startTime = performance.now();
    
    try {
      let result;
      
      switch (name) {
        case 'register_component':
          result = await this.componentRegistry.register(args);
          break;
          
        case 'unregister_component':
          result = await this.componentRegistry.unregister(args.id);
          break;
          
        case 'sync_components':
          result = await this.syncManager.sync(args);
          break;
          
        case 'get_component_state':
          result = await this.componentRegistry.getState(args.id, args.includeMetadata);
          break;
          
        case 'update_component':
          result = await this.componentRegistry.update(args.id, args.updates, args.version);
          break;
          
        case 'rollback_component':
          result = await this.componentRegistry.rollback(args.id, args.targetVersion);
          break;
          
        case 'get_performance_metrics':
          result = await this.performanceMonitor.getMetrics(args.componentIds, args.timeRange);
          break;
          
        case 'optimize_components':
          result = await this.performanceMonitor.optimize(args.componentIds, args.optimizationLevel);
          break;
          
        case 'list_components':
          result = await this.componentRegistry.list(args.filter, args.sortBy, args.sortOrder);
          break;
          
        case 'create_component_snapshot':
          result = await this.componentRegistry.createSnapshot(args);
          break;
          
        case 'restore_component_snapshot':
          result = await this.componentRegistry.restoreSnapshot(args.snapshotId, args.componentIds);
          break;
          
        default:
          throw new Error(`Unknown tool: ${name}`);
      }
      
      // Record performance metrics
      const duration = performance.now() - startTime;
      this.performanceMonitor.recordOperation(name, duration, args);
      
      return result;
      
    } catch (error) {
      const duration = performance.now() - startTime;
      this.performanceMonitor.recordOperation(name, duration, args, error);
      throw error;
    }
  }

  /**
   * Setup resource handlers
   */
  setupResourceHandlers() {
    // List available resources
    this.server.setRequestHandler(ListResourcesRequestSchema, async () => {
      return {
        resources: [
          {
            uri: 'mcp://components/registry',
            name: 'Component Registry',
            description: 'Complete component registry with all components and their states',
            mimeType: 'application/json'
          },
          {
            uri: 'mcp://components/performance',
            name: 'Performance Metrics',
            description: 'Current performance metrics for all components',
            mimeType: 'application/json'
          },
          {
            uri: 'mcp://components/snapshots',
            name: 'Component Snapshots',
            description: 'List of all component snapshots',
            mimeType: 'application/json'
          },
          {
            uri: 'mcp://components/config',
            name: 'Server Configuration',
            description: 'Current server configuration and settings',
            mimeType: 'application/json'
          }
        ]
      };
    });

    // Handle resource reads
    this.server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
      const { uri } = request.params;
      
      try {
        let content;
        
        switch (uri) {
          case 'mcp://components/registry':
            content = await this.componentRegistry.exportRegistry();
            break;
            
          case 'mcp://components/performance':
            content = await this.performanceMonitor.exportMetrics();
            break;
            
          case 'mcp://components/snapshots':
            content = await this.componentRegistry.listSnapshots();
            break;
            
          case 'mcp://components/config':
            content = await this.exportServerConfig();
            break;
            
          default:
            throw new Error(`Unknown resource: ${uri}`);
        }
        
        return {
          contents: [
            {
              uri,
              mimeType: 'application/json',
              text: JSON.stringify(content, null, 2)
            }
          ]
        };
        
      } catch (error) {
        console.error(`Resource read error (${uri}):`, error);
        throw error;
      }
    });
  }

  /**
   * Setup subscription handlers
   */
  setupSubscriptionHandlers() {
    // Handle subscriptions
    this.server.setRequestHandler(SubscribeRequestSchema, async (request) => {
      const { uri } = request.params;
      
      // Add subscription
      if (!this.subscriptions) {
        this.subscriptions = new Set();
      }
      this.subscriptions.add(uri);
      
      console.log(`📝 Subscribed to: ${uri}`);
      
      return { success: true };
    });

    // Handle unsubscriptions
    this.server.setRequestHandler(UnsubscribeRequestSchema, async (request) => {
      const { uri } = request.params;
      
      // Remove subscription
      if (this.subscriptions) {
        this.subscriptions.delete(uri);
      }
      
      console.log(`📝 Unsubscribed from: ${uri}`);
      
      return { success: true };
    });
  }

  /**
   * Start HTTP server for WebSocket
   */
  async startHttpServer() {
    return new Promise((resolve, reject) => {
      this.httpServer = createServer();
      
      this.httpServer.on('error', (error) => {
        console.error('HTTP server error:', error);
        reject(error);
      });
      
      this.httpServer.listen(0, () => {
        const port = this.httpServer.address().port;
        console.log(`🌐 HTTP server listening on port ${port}`);
        resolve(port);
      });
    });
  }

  /**
   * Start WebSocket server
   */
  async startWebSocketServer() {
    const port = this.httpServer.address().port;
    
    this.wsServer = new WebSocketServer({ 
      server: this.httpServer,
      path: '/mcp-components'
    });
    
    this.wsServer.on('connection', (ws, request) => {
      this.handleWebSocketConnection(ws, request);
    });
    
    this.wsServer.on('error', (error) => {
      console.error('WebSocket server error:', error);
    });
    
    console.log(`🔌 WebSocket server listening on ws://localhost:${port}/mcp-components`);
  }

  /**
   * Handle WebSocket connection
   */
  handleWebSocketConnection(ws, request) {
    const clientId = this.generateClientId();
    const clientInfo = {
      id: clientId,
      ws,
      connected: true,
      connectedAt: Date.now(),
      lastActivity: Date.now(),
      subscriptions: new Set()
    };
    
    this.clients.set(clientId, clientInfo);
    this.state.activeConnections++;
    
    console.log(`🔗 Client connected: ${clientId} (${this.state.activeConnections} total)`);
    
    // Setup message handlers
    ws.on('message', (data) => {
      this.handleWebSocketMessage(clientId, data);
    });
    
    ws.on('close', () => {
      this.handleWebSocketDisconnection(clientId);
    });
    
    ws.on('error', (error) => {
      console.error(`WebSocket error for client ${clientId}:`, error);
      this.handleWebSocketDisconnection(clientId);
    });
    
    // Send welcome message
    this.sendToClient(clientId, {
      type: 'welcome',
      clientId,
      serverTime: Date.now(),
      capabilities: ['sync', 'lifecycle', 'performance', 'registry']
    });
  }

  /**
   * Handle WebSocket message
   */
  handleWebSocketMessage(clientId, data) {
    try {
      const message = JSON.parse(data.toString());
      const clientInfo = this.clients.get(clientId);
      
      if (!clientInfo) return;
      
      clientInfo.lastActivity = Date.now();
      
      switch (message.type) {
        case 'subscribe':
          this.handleClientSubscription(clientId, message);
          break;
          
        case 'unsubscribe':
          this.handleClientUnsubscription(clientId, message);
          break;
          
        case 'sync_request':
          this.handleClientSyncRequest(clientId, message);
          break;
          
        case 'component_update':
          this.handleClientComponentUpdate(clientId, message);
          break;
          
        case 'ping':
          this.sendToClient(clientId, { type: 'pong', timestamp: Date.now() });
          break;
          
        default:
          console.warn(`Unknown message type from client ${clientId}:`, message.type);
      }
      
    } catch (error) {
      console.error(`Error handling message from client ${clientId}:`, error);
      this.sendToClient(clientId, {
        type: 'error',
        message: 'Invalid message format'
      });
    }
  }

  /**
   * Handle WebSocket disconnection
   */
  handleWebSocketDisconnection(clientId) {
    const clientInfo = this.clients.get(clientId);
    
    if (clientInfo) {
      clientInfo.connected = false;
      clientInfo.disconnectedAt = Date.now();
      
      // Clean up after delay
      setTimeout(() => {
        if (!clientInfo.connected) {
          this.clients.delete(clientId);
          this.state.activeConnections--;
          console.log(`🔌 Client disconnected: ${clientId} (${this.state.activeConnections} total)`);
        }
      }, 5000);
    }
  }

  /**
   * Event handlers
   */
  handleComponentRegistered(data) {
    this.state.componentCount++;
    this.broadcastToClients({
      type: 'component_registered',
      data
    });
  }

  handleComponentUnregistered(data) {
    this.state.componentCount--;
    this.broadcastToClients({
      type: 'component_unregistered',
      data
    });
  }

  handleSyncCompleted(data) {
    this.state.syncOperations++;
    this.broadcastToClients({
      type: 'sync_completed',
      data
    });
  }

  handleSyncConflict(data) {
    this.broadcastToClients({
      type: 'sync_conflict',
      data
    });
  }

  handleLifecycleEvent(data) {
    this.broadcastToClients({
      type: 'lifecycle_event',
      data
    });
  }

  handlePerformanceAlert(data) {
    this.broadcastToClients({
      type: 'performance_alert',
      data
    });
  }

  /**
   * Utility methods
   */
  generateClientId() {
    return `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  sendToClient(clientId, message) {
    const clientInfo = this.clients.get(clientId);
    
    if (clientInfo && clientInfo.connected && clientInfo.ws.readyState === 1) {
      clientInfo.ws.send(JSON.stringify(message));
    }
  }

  broadcastToClients(message, filter = null) {
    for (const [clientId, clientInfo] of this.clients) {
      if (clientInfo.connected && clientInfo.ws.readyState === 1) {
        if (!filter || filter(clientInfo)) {
          clientInfo.ws.send(JSON.stringify(message));
        }
      }
    }
  }

  async exportServerConfig() {
    return {
      server: {
        name: 'mcp-component-architecture',
        version: '1.0.0',
        startTime: this.state.startTime,
        uptime: Date.now() - this.state.startTime
      },
      state: {
        componentCount: this.state.componentCount,
        activeConnections: this.state.activeConnections,
        syncOperations: this.state.syncOperations
      },
      capabilities: {
        tools: ['register_component', 'unregister_component', 'sync_components', 'get_component_state', 'update_component', 'rollback_component', 'get_performance_metrics', 'optimize_components', 'list_components', 'create_component_snapshot', 'restore_component_snapshot'],
        resources: ['registry', 'performance', 'snapshots', 'config'],
        subscriptions: true
      }
    };
  }

  /**
   * Stop the server
   */
  async stop() {
    console.log('🛑 Stopping MCP Component Architecture Server...');
    
    // Close WebSocket connections
    for (const [clientId, clientInfo] of this.clients) {
      if (clientInfo.ws.readyState === 1) {
        clientInfo.ws.close();
      }
    }
    this.clients.clear();
    
    // Close WebSocket server
    if (this.wsServer) {
      this.wsServer.close();
    }
    
    // Close HTTP server
    if (this.httpServer) {
      this.httpServer.close();
    }
    
    console.log('✅ MCP Component Architecture Server stopped');
  }
}

// Start the server
async function main() {
  const server = new MCPComponentServer();
  
  // Handle graceful shutdown
  process.on('SIGINT', async () => {
    console.log('\n🛑 Received SIGINT, shutting down gracefully...');
    await server.stop();
    process.exit(0);
  });
  
  process.on('SIGTERM', async () => {
    console.log('\n🛑 Received SIGTERM, shutting down gracefully...');
    await server.stop();
    process.exit(0);
  });
  
  try {
    await server.start();
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Start the server if this file is run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { MCPComponentServer };