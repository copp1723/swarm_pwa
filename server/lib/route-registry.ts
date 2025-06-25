import { z } from 'zod';

// Enhanced API Error class for structured error handling
export class APIError extends Error {
  constructor(
    message: string,
    public code: string,
    public status: number = 500,
    public details?: any
  ) {
    super(message);
    this.name = 'APIError';
  }
}

// Request context interface for dependency injection
export interface RequestContext {
  userId: number;
  storage: any;
  agentService: any;
  memoryService: any;
  mcpRegistry?: any;
}

// Route handler interface
export interface RouteHandler {
  handler: (params: any, context: RequestContext) => Promise<any>;
  schema: z.ZodSchema;
  description?: string;
}

// Registry class for managing route handlers
export class RouteRegistry {
  private handlers = new Map<string, RouteHandler>();

  register(method: string, route: RouteHandler): void {
    this.handlers.set(method, route);
  }

  async execute(method: string, params: any, context: RequestContext): Promise<any> {
    const routeHandler = this.handlers.get(method);
    
    if (!routeHandler) {
      throw new APIError(`Unknown method: ${method}`, 'METHOD_NOT_FOUND', 404);
    }

    try {
      // Validate input parameters
      const validatedParams = routeHandler.schema.parse(params);
      
      // Execute handler with validated params
      const result = await routeHandler.handler(validatedParams, context);
      return result;
      
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new APIError(
          'Validation error',
          'VALIDATION_ERROR',
          400,
          error.flatten().fieldErrors
        );
      } else if (error instanceof APIError) {
        throw error;
      } else if (error instanceof Error) {
        throw new APIError(error.message, 'INTERNAL_ERROR', 500);
      } else {
        throw new APIError('Unknown error occurred', 'INTERNAL_ERROR', 500);
      }
    }
  }

  getMethods(): string[] {
    return Array.from(this.handlers.keys());
  }

  hasMethod(method: string): boolean {
    return this.handlers.has(method);
  }
}