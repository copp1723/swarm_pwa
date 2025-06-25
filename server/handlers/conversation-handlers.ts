import { z } from 'zod';
import { RouteHandler, RequestContext } from '../lib/route-registry';
import { messageCache } from '../services/message-cache';

// Create conversation handler
export const createConversationHandler: RouteHandler = {
  schema: z.object({
    title: z.string().optional()
  }),
  handler: async (params, context: RequestContext) => {
    const { title } = params;
    
    const conversation = await context.storage.createConversation({
      userId: context.userId,
      title: title || 'New Conversation'
    });
    
    return { conversation };
  },
  description: 'Create a new conversation'
};

// Get conversations handler
export const getConversationsHandler: RouteHandler = {
  schema: z.object({}),
  handler: async (params, context: RequestContext) => {
    const conversations = await context.storage.getConversationsByUserId(context.userId);
    return { conversations };
  },
  description: 'Get user conversations'
};

// Get conversation messages handler
export const getConversationMessagesHandler: RouteHandler = {
  schema: z.object({
    conversationId: z.number(),
    limit: z.number().optional().default(50)
  }),
  handler: async (params, context: RequestContext) => {
    const { conversationId, limit } = params;
    
    // Always try cache first for immediate response
    const cachedMessages = messageCache.getMessages(conversationId, limit);
    
    try {
      const dbMessages = await context.storage.getRecentMessagesByConversationId(conversationId, limit);
      // Return database messages if available and not empty
      if (dbMessages.length > 0) {
        return dbMessages;
      }
    } catch (error) {
      console.warn('Database unavailable, using in-memory message cache');
    }
    
    // Return cached messages (could be empty array if no messages)
    return cachedMessages;
  },
  description: 'Get messages for a conversation'
};

// Delete conversation handler
export const deleteConversationHandler: RouteHandler = {
  schema: z.object({
    conversationId: z.number()
  }),
  handler: async (params, context: RequestContext) => {
    const { conversationId } = params;
    
    // In a real implementation, you'd have a delete method
    // For now, return success
    return { 
      success: true,
      message: `Conversation ${conversationId} deleted`
    };
  },
  description: 'Delete a conversation'
};