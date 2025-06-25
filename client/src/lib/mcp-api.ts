// MCP API client for interacting with MCP servers

export interface MCPServer {
  name: string;
  description: string;
  capabilities: string[];
  enabled: boolean;
}

export interface MCPServerStatus {
  [serverName: string]: {
    enabled: boolean;
    description: string;
    capabilities: string[];
    available: boolean;
  };
}

export class MCPClient {
  constructor(private apiClient: any) {}

  async getServers(): Promise<MCPServer[]> {
    const response = await this.apiClient.makeRequest('mcp_servers', {});
    return response.servers;
  }

  async getServerStatus(): Promise<MCPServerStatus> {
    return await this.apiClient.makeRequest('mcp_server_status', {});
  }

  async executeOperation(server: string, operation: string, params: any): Promise<any> {
    return await this.apiClient.makeRequest('mcp_operation', {
      server,
      operation,
      params
    });
  }

  // File System Operations
  async readFile(path: string): Promise<{ success: boolean; content?: string; message: string }> {
    return await this.executeOperation('filesystem', 'read', { path });
  }

  async writeFile(path: string, content: string): Promise<{ success: boolean; message: string }> {
    return await this.executeOperation('filesystem', 'write', { path, content });
  }

  async listDirectory(path: string): Promise<{ success: boolean; files?: string[]; message: string }> {
    return await this.executeOperation('filesystem', 'list', { path });
  }

  async deleteFile(path: string): Promise<{ success: boolean; message: string }> {
    return await this.executeOperation('filesystem', 'delete', { path });
  }

  async createDirectory(path: string): Promise<{ success: boolean; message: string }> {
    return await this.executeOperation('filesystem', 'create_dir', { path });
  }

  async getProjectStructure(maxDepth: number = 3): Promise<any> {
    return await this.executeOperation('filesystem', 'get_structure', { maxDepth });
  }

  // Memory Operations
  async storeMemory(content: string, metadata?: any, conversationId?: number): Promise<{ success: boolean; message: string }> {
    return await this.executeOperation('memory', 'store', {
      content,
      metadata,
      conversationId,
      userId: 1 // Default user
    });
  }

  async searchMemories(query: string, limit: number = 10, similarity: number = 0.7): Promise<{ results: any[]; count: number }> {
    return await this.executeOperation('memory', 'search', {
      query,
      limit,
      similarity,
      userId: 1
    });
  }

  async retrieveMemories(limit: number = 20): Promise<{ memories: any[] }> {
    return await this.executeOperation('memory', 'retrieve', {
      limit,
      userId: 1
    });
  }
}