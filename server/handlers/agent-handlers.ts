import { z } from 'zod';
import { RouteHandler, RequestContext } from '../lib/route-registry';
import { messageCache } from '../services/message-cache';

// Send message handler
export const sendMessageHandler: RouteHandler = {
  schema: z.object({
    conversationId: z.number(),
    content: z.string().min(1),
    agentType: z.string().optional(),
    model: z.string().optional()
  }),
  handler: async (params, context: RequestContext) => {
    const { conversationId, content, agentType, model } = params;
    
    try {
      // Process with agent first
      const agentResponse = await context.agentService.processAgentRequest({
        userId: context.userId,
        conversationId,
        content,
        agentType: agentType || 'Communication',
        model
      });

      // Create messages with fallback storage
      const userMessage = {
        id: Date.now(),
        conversationId,
        userId: context.userId,
        content,
        agentType: null,
        createdAt: new Date()
      };

      const agentMessage = {
        id: Date.now() + 1,
        conversationId,
        userId: null,
        content: agentResponse.content,
        agentType: agentResponse.agentType,
        tokenCount: agentResponse.tokenUsage,
        createdAt: new Date()
      };

      // Store in message cache first (always works)
      messageCache.addMessage(conversationId, userMessage);
      messageCache.addMessage(conversationId, agentMessage);

      // Try to store in database but don't fail if unavailable
      try {
        await context.storage.createMessage({
          conversationId,
          userId: context.userId,
          content,
          agentType: null
        });
        
        await context.storage.createMessage({
          conversationId,
          userId: null,
          content: agentResponse.content,
          agentType: agentResponse.agentType,
          tokenCount: agentResponse.tokenUsage
        });
      } catch (dbError) {
        console.warn('Database storage failed, using in-memory cache only');
      }

      return {
        userMessage,
        agentMessage,
        tokenUsage: agentResponse.tokenUsage
      };
    } catch (error) {
      throw new Error(`Message processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },
  description: 'Send a message and get agent response'
};

// Get agents handler
export const getAgentsHandler: RouteHandler = {
  schema: z.object({}),
  handler: async (params, context: RequestContext) => {
    try {
      let agents = await context.storage.getAllAgentConfigs();
      
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
          await context.storage.createAgentConfig(agent);
        }
        
        agents = await context.storage.getAllAgentConfigs();
      }
      
      return { agents };
    } catch (error) {
      // Return fallback agents if database fails
      return {
        agents: [
          { id: 1, name: 'Communication', description: 'Executive communication specialist', isActive: true },
          { id: 2, name: 'Coder', description: 'Software development expert', isActive: true },
          { id: 3, name: 'Analyst', description: 'Data analysis and insights', isActive: true },
          { id: 4, name: 'Writer', description: 'Content creation specialist', isActive: true },
          { id: 5, name: 'Email', description: 'Email processing and automation', isActive: true }
        ]
      };
    }
  },
  description: 'Get list of available agents'
};

// Quick transform handler
export const quickTransformHandler: RouteHandler = {
  schema: z.object({
    text: z.string().min(1)
  }),
  handler: async (params, context: RequestContext) => {
    const { text } = params;
    
    try {
      const agentResponse = await context.agentService.processAgentRequest({
        userId: context.userId,
        conversationId: 1, // Default conversation for quick transform
        content: `REWRITE ONLY. Transform this text to sound casual and conversational, like talking to a coworker. Use contractions, turn complaints into friendly questions. Example input: "When I try and go to the partner page, there isn't the option to select a skill or persona" Output: "I noticed the partner page doesn't have options for skills or personas—any idea where they might be?" 

Transform: ${text}`,
        agentType: 'Communication',
        model: 'anthropic/claude-3.5-sonnet'
      });

      // Create messages with fallback storage
      const userMessage = {
        id: Date.now(),
        conversationId: 1,
        userId: context.userId,
        content: text,
        agentType: null,
        createdAt: new Date()
      };

      const agentMessage = {
        id: Date.now() + 1,
        conversationId: 1,
        userId: null,
        content: agentResponse.content,
        agentType: 'Writer',
        tokenCount: agentResponse.tokenUsage,
        createdAt: new Date()
      };

      // Store in message cache for chat display
      messageCache.addMessage(1, userMessage);
      messageCache.addMessage(1, agentMessage);
      
      return { 
        transformed: agentResponse.content,
        original: text,
        tokenUsage: agentResponse.tokenUsage || 0,
        redirectToChat: true
      };
    } catch (error) {
      console.error('Quick transform error:', error);
      return {
        transformed: text,
        original: text,
        tokenUsage: 0,
        error: 'Transform service temporarily unavailable'
      };
    }
  },
  description: 'Transform text into casual, friendly communication using Communication agent'
};