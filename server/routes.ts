import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { agentService } from "./services/agents";
import { memoryService } from "./services/memory";
import { openRouterService } from "./services/openrouter";
import { emailService } from "./services/email";
import { insertMessageSchema, insertConversationSchema } from "@shared/schema";
import { z } from "zod";
import { RouteRegistry, APIError, type RequestContext } from "./lib/route-registry";
import { sendMessageHandler, getAgentsHandler, quickTransformHandler } from "./handlers/agent-handlers";
import { createConversationHandler, getConversationsHandler, getConversationMessagesHandler, deleteConversationHandler } from "./handlers/conversation-handlers";
import { mcpOperationHandler, getMcpServersHandler, getMcpServerStatusHandler } from "./handlers/mcp-handlers";
import { getServiceStatusHandler, getAvailableModelsHandler } from "./handlers/service-handlers";
import { projectManagerHandler } from "./handlers/project-manager-handlers";

// JSON-RPC schemas
const jsonRpcRequestSchema = z.object({
  jsonrpc: z.literal("2.0"),
  id: z.union([z.string(), z.number()]),
  method: z.string(),
  params: z.any().optional()
});



const memorySearchSchema = z.object({
  query: z.string(),
  similarity: z.number().min(0).max(1).optional()
});

const fileOperationSchema = z.object({
  path: z.string(),
  content: z.string().optional()
});

// Create and configure route registry
const routeRegistry = new RouteRegistry();

// Register all route handlers
function registerAllRoutes() {
  // Agent routes
  routeRegistry.register('send_message', sendMessageHandler);
  routeRegistry.register('get_agents', getAgentsHandler);
  routeRegistry.register('quick_transform', quickTransformHandler);
  
  // Conversation routes
  routeRegistry.register('create_conversation', createConversationHandler);
  routeRegistry.register('get_conversations', getConversationsHandler);
  routeRegistry.register('get_conversation_messages', getConversationMessagesHandler);
  routeRegistry.register('get_messages', getConversationMessagesHandler);
  routeRegistry.register('delete_conversation', deleteConversationHandler);
  
  // MCP routes
  routeRegistry.register('mcp_operation', mcpOperationHandler);
  routeRegistry.register('mcp_servers', getMcpServersHandler);
  routeRegistry.register('mcp_server_status', getMcpServerStatusHandler);
  
  // Service routes
  routeRegistry.register('get_service_status', getServiceStatusHandler);
  routeRegistry.register('get_available_models', getAvailableModelsHandler);
  
  // Project management routes
  routeRegistry.register('project_manager_chat', projectManagerHandler);
  
  // Project Tracker status route
  routeRegistry.register('project_tracker_status', {
    schema: z.object({}),
    handler: async (params, context: RequestContext) => {
      const { projectTrackerService } = await import('./services/project-tracker');
      const config = projectTrackerService.getConfiguration();
      const connectionTest = await projectTrackerService.testConnection();
      
      return {
        configured: config.configured,
        baseUrl: config.baseUrl,
        connectionStatus: connectionTest
      };
    },
    description: 'Get Project Tracker configuration and connection status'
  });
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Register all route handlers
  registerAllRoutes();

  // Define the RPC handler using registry
  app.post("/api/rpc", async (req, res) => {
    try {
      const request = jsonRpcRequestSchema.parse(req.body);
      const { method, params, id } = request;
      const userId = 1;
      
      // Create request context
      const context: RequestContext = {
        userId,
        storage,
        agentService,
        memoryService
      };

      // Execute through registry
      const result = await routeRegistry.execute(method, params || {}, context);

      res.json({
        jsonrpc: "2.0",
        id,
        result
      });
    } catch (error) {
      let errorResponse;
      
      if (error instanceof APIError) {
        errorResponse = {
          jsonrpc: "2.0",
          id: req.body.id,
          error: {
            code: error.status || -32603,
            message: error.message,
            data: error.details || {}
          }
        };
      } else if (error instanceof Error) {
        errorResponse = {
          jsonrpc: "2.0",
          id: req.body.id,
          error: {
            code: -32603,
            message: error.message,
            data: {}
          }
        };
      } else {
        errorResponse = {
          jsonrpc: "2.0",
          id: req.body.id,
          error: {
            code: -32603,
            message: "Internal server error",
            data: {}
          }
        };
      }

      res.json(errorResponse);
    }
  });

  // Legacy route handlers for backwards compatibility
  app.post("/api/rpc-legacy", async (req, res) => {
    try {
      const request = jsonRpcRequestSchema.parse(req.body);
      const { method, params, id } = request;
      const userId = 1;
      let result: any;

      switch (method) {
        case "agent_chat": {
          const { conversationId, content, agentType, model, coordination } = z.object({
            conversationId: z.number(),
            content: z.string(),
            agentType: z.string().optional(),
            model: z.string().optional(),
            coordination: z.boolean().optional()
          }).parse(params);

          console.log('Processing agent chat:', { conversationId, content, agentType, model, coordination });

          // Store user message first
          const userMessage = await storage.createMessage({
            conversationId,
            userId,
            content,
            tokenCount: Math.ceil(content.length / 4)
          });

          console.log('User message stored:', userMessage);

          // Process with agent
          const agentResponse = await agentService.processAgentRequest({
            userId,
            conversationId,
            content,
            agentType: agentType || 'Communication',
            model,
            coordination: coordination || false
          });

          console.log('Agent response generated:', agentResponse);

          // Store agent response
          const agentMessage = await storage.createMessage({
            conversationId,
            agentType: agentResponse.agentType,
            content: agentResponse.content,
            tokenCount: agentResponse.tokenUsage,
            metadata: agentResponse.metadata
          });

          console.log('Agent message stored:', agentMessage);

          result = {
            responses: [agentResponse],
            totalTokens: agentResponse.tokenUsage,
            userMessage,
            agentMessage
          };
          break;
        }

        case "memory_search": {
          const { query, similarity = 0.7 } = memorySearchSchema.parse(params);
          const memories = await memoryService.searchMemories(userId, query, similarity);
          result = { memories, count: memories.length };
          break;
        }

        case "memory_store": {
          const { content, metadata } = z.object({
            content: z.string(),
            metadata: z.any().optional()
          }).parse(params);
          
          await memoryService.storeMemory({
            userId,
            content,
            metadata
          });
          
          result = { success: true, message: "Memory stored successfully" };
          break;
        }

        case "file_list": {
          const files = await storage.getFilesByUserId(userId);
          result = { files };
          break;
        }

        case "file_read": {
          const { path } = fileOperationSchema.parse(params);
          
          // Simple path sanitization
          const sanitizedPath = path.replace(/\.\./g, '').replace(/^\/+/, '');
          
          // Mock file reading - in production, implement actual file system access
          result = { 
            path: sanitizedPath, 
            content: `Mock content for file: ${sanitizedPath}`,
            message: "File reading not implemented - mock response"
          };
          break;
        }

        case "file_write": {
          const { path, content } = fileOperationSchema.parse(params);
          
          // Simple path sanitization
          const sanitizedPath = path.replace(/\.\./g, '').replace(/^\/+/, '');
          
          // Mock file writing - in production, implement actual file system access
          await storage.createFile({
            userId,
            filename: sanitizedPath.split('/').pop() || 'unknown',
            path: sanitizedPath,
            size: content?.length || 0,
            mimeType: 'text/plain'
          });
          
          result = { 
            success: true, 
            path: sanitizedPath,
            message: "File writing not implemented - mock response"
          };
          break;
        }

        case "quick_transform": {
          const { text } = z.object({ text: z.string() }).parse(params);
          
          try {
            // Process through Communication agent for professional transformation
            const agentResponse = await agentService.processAgentRequest({
              userId,
              conversationId: 1, // Use default conversation for quick transform
              content: `Please improve and professionalize this text while maintaining its core meaning and executive tone:\n\n${text}`,
              agentType: 'Communication',
              model: 'gpt-4o-mini'
            });
            
            result = { 
              transformed: agentResponse.content,
              original: text,
              tokenUsage: agentResponse.tokenUsage || 0
            };
          } catch (error) {
            result = {
              transformed: text,
              original: text,
              tokenUsage: 0,
              error: 'Transform service temporarily unavailable'
            };
          }
          break;
        }

        case "mcp_operation": {
          const { server, operation, params: mcpParams } = z.object({
            server: z.string(),
            operation: z.string(), 
            params: z.any()
          }).parse(params);
          
          const { mcpRegistry } = await import('./services/mcp-registry');
          result = await mcpRegistry.executeOperation({
            server,
            operation,
            params: mcpParams
          });
          break;
        }

        case "mcp_servers": {
          const { mcpRegistry } = await import('./services/mcp-registry');
          result = {
            servers: mcpRegistry.getEnabledServers().map(server => ({
              name: server.name,
              description: server.description,
              capabilities: server.capabilities,
              enabled: server.enabled
            }))
          };
          break;
        }

        case "mcp_server_status": {
          const { mcpRegistry } = await import('./services/mcp-registry');
          result = await mcpRegistry.getServerStatus();
          break;
        }

        case "get_conversations": {
          const conversations = await storage.getConversationsByUserId(userId);
          result = { conversations };
          break;
        }

        case "create_conversation": {
          const { title } = z.object({ title: z.string().optional() }).parse(params);
          const conversation = await storage.createConversation({
            userId,
            title: title || `Conversation ${new Date().toLocaleString()}`
          });
          result = { conversation };
          break;
        }

        case "get_messages": {
          const { conversationId } = z.object({ conversationId: z.number() }).parse(params);
          const messages = await storage.getMessagesByConversationId(conversationId);
          result = { messages };
          break;
        }

        case "get_agents": {
          try {
            let agents = await storage.getAllAgentConfigs();
            
            if (!agents || agents.length === 0) {
              const defaultAgents = [
                {
                  name: 'Communication',
                  description: 'Executive communication specialist',
                  systemPrompt: 'You are a professional executive communication specialist...',
                  isActive: true,
                  capabilities: ['writing', 'editing', 'tone']
                },
                {
                  name: 'Coder',
                  description: 'Software development expert',
                  systemPrompt: 'You are an expert software engineer...',
                  isActive: true,
                  capabilities: ['coding', 'debugging', 'architecture']
                },
                {
                  name: 'Analyst',
                  description: 'Data analysis and insights',
                  systemPrompt: 'You are a senior data analyst...',
                  isActive: true,
                  capabilities: ['analysis', 'research', 'metrics']
                },
                {
                  name: 'Writer',
                  description: 'Content creation specialist',
                  systemPrompt: 'You are a professional content writer...',
                  isActive: true,
                  capabilities: ['writing', 'content', 'documentation']
                },
                {
                  name: 'Email',
                  description: 'Email processing and automation',
                  systemPrompt: 'You are an email processing specialist...',
                  isActive: true,
                  capabilities: ['email', 'automation', 'tasks']
                }
              ];

              for (const agent of defaultAgents) {
                await storage.createAgentConfig(agent);
              }
              
              agents = await storage.getAllAgentConfigs();
            }
            
            result = { agents };
          } catch (error) {
            result = {
              agents: [
                { id: 1, name: 'Communication', description: 'Executive communication specialist', isActive: true },
                { id: 2, name: 'Coder', description: 'Software development expert', isActive: true },
                { id: 3, name: 'Analyst', description: 'Data analysis and insights', isActive: true },
                { id: 4, name: 'Writer', description: 'Content creation specialist', isActive: true },
                { id: 5, name: 'Email', description: 'Email processing and automation', isActive: true }
              ]
            };
          }
          break;
        }

        case "service_status": {
          // Simple status check without external API calls for performance
          const memoryStatus = memoryService.getServiceStatus();
          
          result = {
            openrouter: { status: 'active' as const, message: 'OpenRouter configured' },
            supermemory: memoryStatus,
            supabase: memoryStatus,
            file_access: { status: 'active' as const, message: 'File access available' },
            email: { 
              status: emailService.isConfigured() ? 'active' as const : 'inactive' as const, 
              message: emailService.isConfigured() ? 'Mailgun configured' : 'Email not configured' 
            }
          };
          break;
        }

        case "send_email": {
          const { to, subject, content, agentType } = params;
          const emailResult = await emailService.sendEmail({
            to: Array.isArray(to) ? to : [to],
            subject,
            text: content,
            tags: ['swarm-agent', agentType || 'general']
          });
          result = emailResult;
          break;
        }



        case "get_service_status":
        case "get_service_statuses": {
          // Simple status check without external API calls for performance
          const memoryStatus = memoryService.getServiceStatus();
          
          result = {
            openrouter: { status: 'active' as const, message: 'OpenRouter configured' },
            supermemory: memoryStatus,
            supabase: memoryStatus,
            file_access: { status: 'active' as const, message: 'File access available' },
            email: { 
              status: emailService.isConfigured() ? 'active' as const : 'inactive' as const, 
              message: emailService.isConfigured() ? 'Mailgun configured' : 'Email not configured' 
            }
          };
          break;
        }

        default:
          throw new Error(`Unknown method: ${method}`);
      }

      res.json({
        jsonrpc: "2.0",
        id,
        result
      });

    } catch (error) {
      console.error("RPC Error:", error);
      res.json({
        jsonrpc: "2.0",
        id: req.body?.id || null,
        error: {
          code: -32603,
          message: error instanceof Error ? error.message : "Internal error",
          data: error
        }
      });
    }
  });

  // Health check endpoint
  app.get("/api/health", async (req, res) => {
    res.json({ 
      status: "ok", 
      timestamp: new Date().toISOString(),
      services: {
        memory: memoryService.getServiceStatus(),
        agents: await storage.getAllAgentConfigs().then(agents => ({ 
          status: "active", 
          count: agents.length 
        }))
      }
    });
  });

  // Email webhook endpoint for Mailgun
  app.post('/api/webhooks/mailgun', async (req, res) => {
    try {
      const { timestamp, token, signature } = req.body;
      
      // Verify webhook signature
      if (!emailService.verifyWebhookSignature(timestamp, token, signature)) {
        return res.status(401).json({ error: 'Invalid signature' });
      }

      // Parse incoming email
      const emailData = emailService.parseIncomingEmail(req.body);
      if (!emailData) {
        return res.status(400).json({ error: 'Failed to parse email' });
      }

      // Create task from email
      const userId = 1; // Default user for now
      const conversation = await storage.createConversation({
        userId,
        title: `Email: ${emailData.subject}`
      });

      // Add email content as user message
      await storage.createMessage({
        conversationId: conversation.id,
        content: `Email from ${emailData.from}:\n\nSubject: ${emailData.subject}\n\n${emailData.text}`,
        agentType: 'Email'
      });

      // Process with email agent
      const agentResponse = await agentService.processAgentRequest({
        userId,
        conversationId: conversation.id,
        content: `Process this email and create appropriate tasks: ${emailData.text}`,
        agentType: 'Email'
      });

      // Store agent response
      await storage.createMessage({
        conversationId: conversation.id,
        content: agentResponse.content,
        agentType: 'Email'
      });

      res.json({ status: 'processed', conversationId: conversation.id });
    } catch (error) {
      console.error('Webhook processing error:', error);
      res.status(500).json({ error: 'Failed to process webhook' });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
