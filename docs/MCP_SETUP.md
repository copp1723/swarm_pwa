# MCP Server Setup Guide

## Overview

The SWARM system includes a modular MCP (Model Context Protocol) server registry that allows easy addition and removal of different MCP servers. This provides agents with enhanced capabilities like file system access, memory operations, and future integrations.

## Current MCP Servers

### 1. File System Server
- **Status**: Active
- **Capabilities**: `read`, `write`, `list`, `delete`, `create_dir`, `get_structure`
- **Security**: Restricted to project directory with allowlisted file types
- **Usage**: Agents can read/write files, navigate directories, and understand project structure

### 2. Memory Server
- **Status**: Active
- **Capabilities**: `store`, `search`, `retrieve`
- **Integration**: Uses existing SuperMemory service
- **Usage**: Enhanced context storage and retrieval across conversations

### 3. GitHub Server
- **Status**: Planned
- **Capabilities**: `repos`, `issues`, `pull_requests`
- **Usage**: Future GitHub repository operations

## Adding New MCP Servers

### 1. Create Server Handler

```typescript
import { BaseMCPHandler } from '../services/mcp-registry';

class CustomMCPHandler extends BaseMCPHandler {
  async execute(operation: string, params: any): Promise<any> {
    switch (operation) {
      case 'custom_operation':
        return await this.handleCustomOperation(params);
      default:
        throw new Error(`Unsupported operation: ${operation}`);
    }
  }

  getCapabilities(): string[] {
    return ['custom_operation'];
  }

  isEnabled(): boolean {
    return true; // Check if your service is available
  }

  private async handleCustomOperation(params: any): Promise<any> {
    // Implement your operation logic
    return { success: true, data: 'result' };
  }
}
```

### 2. Register the Server

```typescript
import { addMCPServer } from '../services/mcp-registry';

addMCPServer({
  name: 'custom_server',
  description: 'Custom MCP server for specific operations',
  enabled: true,
  capabilities: ['custom_operation'],
  handler: new CustomMCPHandler()
});
```

### 3. Client Integration

```typescript
// Use the MCP client
import { MCPClient } from '@/lib/mcp-api';

const mcpClient = new MCPClient(api);

// Execute custom operation
const result = await mcpClient.executeOperation('custom_server', 'custom_operation', {
  param1: 'value1'
});
```

## Agent Integration

Agents automatically have access to MCP capabilities through their system prompts. They can:

1. **File Operations**: Read project files, write documentation, analyze code structure
2. **Memory Operations**: Store and retrieve context across conversations
3. **Custom Operations**: Use any registered MCP server capabilities

Example agent usage:
```
Agent: "I'll read the current API file to understand the structure..."
System: Uses MCP filesystem server to read client/src/lib/api.ts
Agent: "I'll store this insight for future reference..."
System: Uses MCP memory server to store contextual information
```

## Configuration

MCP servers are configured in `server/services/mcp-registry.ts`. You can:

- Enable/disable servers: `mcpRegistry.enableServer('server_name')`
- Check status: `mcpRegistry.getServerStatus()`
- Add servers: `mcpRegistry.registerServer(config)`
- Remove servers: `mcpRegistry.unregisterServer('server_name')`

## Security Considerations

1. **File System**: Restricted to project directory, allowlisted extensions only
2. **Path Traversal**: All paths are sanitized and validated
3. **Operation Limits**: Each server defines allowed operations
4. **Error Handling**: Graceful degradation when servers are unavailable

## API Endpoints

- `mcp_servers`: Get list of available MCP servers
- `mcp_server_status`: Get detailed status of all servers
- `mcp_operation`: Execute operation on specific server

## Future Enhancements

1. **GitHub Integration**: Repository operations, issue management
2. **Database MCP**: Direct database operations for agents
3. **External APIs**: Weather, news, other data sources
4. **Custom Tools**: User-defined capabilities