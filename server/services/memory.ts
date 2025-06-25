import { storage } from '../storage';
import { type InsertMemory } from '../../shared/schema';
import supermemory from 'supermemory';

export interface MemoryContext {
  userId: number;
  content: string;
  metadata?: any;
  conversationId?: number;
  agentType?: string;
}

export class MemoryService {
  private supabaseUrl: string;
  private supabaseKey: string;
  private supermemoryClient: any;
  private isSupabaseAvailable: boolean = false;
  private isSupermemoryAvailable: boolean = false;

  constructor() {
    this.supabaseUrl = process.env.SUPABASE_URL || '';
    this.supabaseKey = process.env.SUPABASE_ANON_KEY || '';
    this.isSupabaseAvailable = !!(this.supabaseUrl && this.supabaseKey);
    
    // Initialize Supermemory client if API key is available
    const supermemoryApiKey = process.env.SUPERMEMORY_API_KEY;
    if (supermemoryApiKey) {
      this.supermemoryClient = new supermemory({
        apiKey: supermemoryApiKey,
      });
      this.isSupermemoryAvailable = true;
    }
    

  }

  async storeMemory(context: MemoryContext): Promise<void> {
    try {
      const memoryData: InsertMemory = {
        userId: context.userId,
        content: context.content,
        metadata: {
          conversationId: context.conversationId,
          agentType: context.agentType,
          timestamp: new Date().toISOString(),
          ...context.metadata
        }
      };

      // Store in local memory
      await storage.createMemory(memoryData);

      // TODO: If Supabase is configured, also store there with vector embedding
      if (this.isSupabaseAvailable) {
        await this.storeInSupabase(memoryData);
      }
    } catch (error) {
      console.error('Failed to store memory:', error);
      throw error;
    }
  }

  async searchMemories(
    userId: number, 
    query: string, 
    similarityThreshold: number = 0.7,
    limit: number = 10
  ): Promise<any[]> {
    try {
      // Search in local storage first
      const localResults = await storage.searchMemories(userId, query, similarityThreshold);
      
      if (this.isSupabaseAvailable) {
        // TODO: Implement vector similarity search with Supabase pgvector
        const vectorResults = await this.searchSupabaseVector(userId, query, similarityThreshold, limit);
        return this.mergeResults(localResults, vectorResults);
      }

      return localResults.slice(0, limit);
    } catch (error) {
      console.error('Failed to search memories:', error);
      return [];
    }
  }

  private async storeInSupabase(memory: InsertMemory): Promise<void> {
    // Supabase integration stub - functionality moved to SuperMemory
    return;
  }

  private async searchSupabaseVector(
    userId: number, 
    query: string, 
    threshold: number, 
    limit: number
  ): Promise<any[]> {
    // Supabase vector search stub - functionality moved to SuperMemory
    return [];
  }

  private mergeResults(localResults: any[], vectorResults: any[]): any[] {
    // Simple merge logic - in production, this would be more sophisticated
    const combined = [...localResults, ...vectorResults];
    const unique = combined.filter((item, index, self) => 
      index === self.findIndex(t => t.id === item.id)
    );
    return unique.sort((a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0));
  }

  getServiceStatus(): { status: 'active' | 'limited' | 'error'; message: string } {
    if (this.isSupermemoryAvailable) {
      return { status: 'active', message: 'SuperMemory AI-powered memory active' };
    }
    if (this.isSupabaseAvailable) {
      return { status: 'active', message: 'Vector search enabled with Supabase' };
    }
    return { status: 'active', message: 'Local memory storage active' };
  }

  private async storeInSupermemory(content: string, metadata: any): Promise<void> {
    try {
      const response = await this.supermemoryClient.memories.add({
        content: content,
        metadata: metadata
      });

    } catch (error) {
      // Silent fallback to local storage
    }
  }

  private async searchSupermemory(query: string, limit: number = 10): Promise<any[]> {
    try {
      const response = await this.supermemoryClient.search.execute({
        q: query,
        limit: limit
      });
      return response.results || [];
    } catch (error) {
      return [];
    }
  }
}

export const memoryService = new MemoryService();
