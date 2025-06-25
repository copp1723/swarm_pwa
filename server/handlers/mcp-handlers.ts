import { z } from 'zod';
import { RouteHandler, RequestContext } from '../lib/route-registry';

// MCP operation handler
export const mcpOperationHandler: RouteHandler = {
  schema: z.object({
    server: z.string().min(1),
    operation: z.string().min(1),
    path: z.string().optional(),
    content: z.string().optional(),
    encoding: z.string().optional()
  }),
  handler: async (params, context: RequestContext) => {
    const { server, operation, path, content, encoding } = params;
    
    try {
      if (server === 'filesystem') {
        const { mcpFileSystem } = await import('../services/mcp-filesystem');
        
        return await mcpFileSystem.executeFileOperation({
          operation,
          path: path || '',
          content,
          encoding
        });
      }
      
      // Future MCP servers can be added here
      throw new Error(`Unsupported MCP server: ${server}`);
      
    } catch (error) {
      return {
        success: false,
        message: `MCP operation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  },
  description: 'Execute MCP server operation'
};

// Get MCP servers handler
export const getMcpServersHandler: RouteHandler = {
  schema: z.object({}),
  handler: async (params, context: RequestContext) => {
    return {
      servers: [
        {
          name: 'filesystem',
          description: 'File system operations for desktop and project access',
          capabilities: ['read', 'write', 'list', 'delete', 'create_dir'],
          enabled: true,
          status: 'active'
        }
      ]
    };
  },
  description: 'Get available MCP servers'
};

// Get MCP server status handler
export const getMcpServerStatusHandler: RouteHandler = {
  schema: z.object({
    server: z.string().min(1)
  }),
  handler: async (params, context: RequestContext) => {
    const { server } = params;
    
    if (server === 'filesystem') {
      try {
        const { mcpFileSystem } = await import('../services/mcp-filesystem');
        
        // Test filesystem access
        const testResult = await mcpFileSystem.executeFileOperation({
          operation: 'list',
          path: '.'
        });
        
        return {
          server: 'filesystem',
          status: testResult.success ? 'active' : 'error',
          message: testResult.message,
          capabilities: ['read', 'write', 'list', 'delete', 'create_dir'],
          lastChecked: new Date().toISOString()
        };
      } catch (error) {
        return {
          server: 'filesystem',
          status: 'error',
          message: `Filesystem error: ${error instanceof Error ? error.message : 'Unknown error'}`,
          capabilities: ['read', 'write', 'list', 'delete', 'create_dir'],
          lastChecked: new Date().toISOString()
        };
      }
    }
    
    return {
      server,
      status: 'not_found',
      message: 'Server not found',
      capabilities: [],
      lastChecked: new Date().toISOString()
    };
  },
  description: 'Get MCP server status'
};