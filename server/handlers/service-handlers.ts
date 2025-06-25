import { z } from 'zod';
import { RouteHandler, RequestContext } from '../lib/route-registry';
import { openRouterService } from '../services/openrouter';
import { memoryService } from '../services/memory';
import { healthMonitor } from '../health';

// Get service status handler
export const getServiceStatusHandler: RouteHandler = {
  schema: z.object({}),
  handler: async (params, context: RequestContext) => {
    // Check service status directly for accurate real-time status
    const openrouterConfigured = !!(process.env.OPENROUTER_API_KEY || process.env.OPENROUTER_KEY);
    const memoryStatus = memoryService.getServiceStatus();
    const emailConfigured = !!(process.env.MAILGUN_API_KEY && process.env.MAILGUN_DOMAIN);
    
    return {
      openrouter: {
        status: openrouterConfigured ? 'active' : 'inactive',
        message: openrouterConfigured ? 'OpenRouter API configured' : 'OpenRouter API key needed'
      },
      supermemory: {
        status: memoryStatus.status === 'active' ? 'active' : 'limited',
        message: memoryStatus.message
      },
      supabase: {
        status: memoryStatus.status === 'active' ? 'active' : 'limited', 
        message: 'Memory service active'
      },
      file_access: {
        status: 'active',
        message: 'File operations available'
      },
      email: {
        status: emailConfigured ? 'active' : 'inactive',
        message: emailConfigured ? 'Email service configured' : 'Email service not configured'
      }
    };
  },
  description: 'Get system service status'
};

// Get available models handler
export const getAvailableModelsHandler: RouteHandler = {
  schema: z.object({}),
  handler: async (params, context: RequestContext) => {
    try {
      const models = await openRouterService.getAvailableModels();
      return { models };
    } catch (error) {
      // Return curated model list if OpenRouter fails
      return {
        models: [
          'gpt-4o-mini',
          'anthropic/claude-3.5-sonnet',
          'qwen/qwen-2.5-coder-32b-instruct',
          'deepseek/deepseek-r1',
          'google/gemini-2.0-flash-exp'
        ]
      };
    }
  },
  description: 'Get available AI models'
};