import { z } from 'zod';
import { mcpFileSystem } from './mcp-filesystem';

// MCP Server Registry - Modular system for adding/removing MCP servers
// Inspired by the MCP configuration format

export interface MCPServerConfig {
  name: string;
  description: string;
  enabled: boolean;
  capabilities: string[];
  handler: MCPServerHandler;
}

export interface MCPServerHandler {
  execute(operation: string, params: any): Promise<any>;
  getCapabilities(): string[];
  isEnabled(): boolean | Promise<boolean>;
}

export interface MCPOperation {
  server: string;
  operation: string;
  params: any;
}

class MCPServerRegistry {
  private servers: Map<string, MCPServerConfig> = new Map();

  constructor() {
    this.initializeDefaultServers();
  }

  private initializeDefaultServers() {
    // File System Server
    this.registerServer({
      name: 'filesystem',
      description: 'File system operations with secure project access',
      enabled: true,
      capabilities: ['read', 'write', 'list', 'delete', 'create_dir', 'get_structure'],
      handler: new FileSystemHandler()
    });

    // Memory Server (using existing SuperMemory integration)
    this.registerServer({
      name: 'memory',
      description: 'Memory and knowledge storage for conversations',
      enabled: true,
      capabilities: ['store', 'search', 'retrieve'],
      handler: new MemoryHandler()
    });

    // GitHub Server (placeholder for future implementation)
    this.registerServer({
      name: 'github',
      description: 'GitHub repository access and operations',
      enabled: false, // Disabled until implemented
      capabilities: ['repos', 'issues', 'pull_requests'],
      handler: new GitHubHandler()
    });
  }

  registerServer(config: MCPServerConfig): void {
    this.servers.set(config.name, config);
  }

  unregisterServer(name: string): boolean {
    return this.servers.delete(name);
  }

  enableServer(name: string): boolean {
    const server = this.servers.get(name);
    if (server) {
      server.enabled = true;
      return true;
    }
    return false;
  }

  disableServer(name: string): boolean {
    const server = this.servers.get(name);
    if (server) {
      server.enabled = false;
      return true;
    }
    return false;
  }

  getEnabledServers(): MCPServerConfig[] {
    return Array.from(this.servers.values()).filter(server => server.enabled);
  }

  getServerCapabilities(serverName: string): string[] {
    const server = this.servers.get(serverName);
    return server?.enabled ? server.capabilities : [];
  }

  async executeOperation(operation: MCPOperation): Promise<any> {
    const server = this.servers.get(operation.server);
    
    if (!server) {
      throw new Error(`MCP server '${operation.server}' not found`);
    }

    if (!server.enabled) {
      throw new Error(`MCP server '${operation.server}' is disabled`);
    }

    if (!server.capabilities.includes(operation.operation)) {
      throw new Error(`Operation '${operation.operation}' not supported by server '${operation.server}'`);
    }

    return await server.handler.execute(operation.operation, operation.params);
  }

  async getServerStatus(): Promise<Record<string, any>> {
    const status: Record<string, any> = {};
    
    for (const [name, config] of this.servers) {
      const available = await Promise.resolve(config.handler.isEnabled());
      status[name] = {
        enabled: config.enabled,
        description: config.description,
        capabilities: config.capabilities,
        available
      };
    }
    
    return status;
  }
}

// File System Handler
class FileSystemHandler implements MCPServerHandler {
  async execute(operation: string, params: any): Promise<any> {
    switch (operation) {
      case 'read':
      case 'write':
      case 'list':
      case 'delete':
      case 'create_dir':
        return await mcpFileSystem.executeFileOperation({
          operation,
          ...params
        });
      case 'get_structure':
        return await mcpFileSystem.getProjectStructure(params.maxDepth || 3);
      default:
        throw new Error(`Unsupported file system operation: ${operation}`);
    }
  }

  getCapabilities(): string[] {
    return ['read', 'write', 'list', 'delete', 'create_dir', 'get_structure'];
  }

  isEnabled(): boolean {
    return true; // File system is always available
  }
}

// Memory Handler (integrates with existing memory service)
class MemoryHandler implements MCPServerHandler {
  async execute(operation: string, params: any): Promise<any> {
    const { memoryService } = await import('./memory.js');
    
    switch (operation) {
      case 'store':
        await memoryService.storeMemory({
          userId: params.userId || 1,
          content: params.content,
          metadata: params.metadata,
          conversationId: params.conversationId,
          agentType: params.agentType
        });
        return { success: true, message: 'Memory stored successfully' };
        
      case 'search':
        const results = await memoryService.searchMemories(
          params.userId || 1,
          params.query,
          params.similarity || 0.7,
          params.limit || 10
        );
        return { results, count: results.length };
        
      case 'retrieve':
        // Get recent memories for context
        const memories = await memoryService.searchMemories(
          params.userId || 1,
          '',
          0.5,
          params.limit || 20
        );
        return { memories };
        
      default:
        throw new Error(`Unsupported memory operation: ${operation}`);
    }
  }

  getCapabilities(): string[] {
    return ['store', 'search', 'retrieve'];
  }

  async isEnabled(): Promise<boolean> {
    try {
      const { memoryService } = await import('./memory.js');
      const status = memoryService.getServiceStatus();
      return status.status === 'active';
    } catch {
      return false;
    }
  }
}

// GitHub Handler (placeholder for future implementation)
class GitHubHandler implements MCPServerHandler {
  async execute(operation: string, params: any): Promise<any> {
    throw new Error('GitHub MCP server not yet implemented');
  }

  getCapabilities(): string[] {
    return ['repos', 'issues', 'pull_requests'];
  }

  isEnabled(): boolean {
    return false; // Not implemented yet
  }
}

// Export singleton instance
export const mcpRegistry = new MCPServerRegistry();

// Helper function to add new MCP servers dynamically
export function addMCPServer(config: MCPServerConfig): void {
  mcpRegistry.registerServer(config);
}

// Helper function to create custom MCP server handlers
export abstract class BaseMCPHandler implements MCPServerHandler {
  abstract execute(operation: string, params: any): Promise<any>;
  abstract getCapabilities(): string[];
  abstract isEnabled(): boolean | Promise<boolean>;
}