import { eq, desc, and, sql } from 'drizzle-orm';
import { db } from './db';
import { 
  users, conversations, messages, memories, files, agentConfigs,
  type User, type InsertUser,
  type Conversation, type InsertConversation,
  type Message, type InsertMessage,
  type Memory, type InsertMemory,
  type File, type InsertFile,
  type AgentConfig, type InsertAgentConfig
} from '../shared/schema';

export class Storage {
  // User operations
  async createUser(data: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(data).returning();
    return user;
  }

  async getUserById(id: number): Promise<User | null> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || null;
  }

  // Conversation operations
  async createConversation(data: InsertConversation): Promise<Conversation> {
    const [conversation] = await db.insert(conversations).values(data).returning();
    return conversation;
  }

  async getConversationsByUserId(userId: number): Promise<Conversation[]> {
    return db.select().from(conversations)
      .where(eq(conversations.userId, userId))
      .orderBy(desc(conversations.updatedAt));
  }

  async getConversationById(id: number): Promise<Conversation | null> {
    const [conversation] = await db.select().from(conversations).where(eq(conversations.id, id));
    return conversation || null;
  }

  // Message operations
  async createMessage(data: InsertMessage): Promise<Message> {
    const [message] = await db.insert(messages).values(data).returning();
    return message;
  }

  async getMessagesByConversationId(conversationId: number): Promise<Message[]> {
    return db.select().from(messages)
      .where(eq(messages.conversationId, conversationId))
      .orderBy(messages.createdAt);
  }

  async getRecentMessagesByConversationId(conversationId: number, limit: number = 10): Promise<Message[]> {
    return db.select().from(messages)
      .where(eq(messages.conversationId, conversationId))
      .orderBy(desc(messages.createdAt))
      .limit(limit);
  }

  // Memory operations
  async createMemory(data: InsertMemory): Promise<Memory> {
    const [memory] = await db.insert(memories).values(data).returning();
    return memory;
  }

  async searchMemories(userId: number, query?: string, similarity?: number): Promise<Memory[]> {
    if (similarity) {
      return db.select().from(memories)
        .where(and(
          eq(memories.userId, userId),
          sql`${memories.similarity} >= ${similarity}`
        ))
        .orderBy(desc(memories.createdAt))
        .limit(20);
    }
    
    return db.select().from(memories)
      .where(eq(memories.userId, userId))
      .orderBy(desc(memories.createdAt))
      .limit(20);
  }

  // File operations
  async createFile(data: InsertFile): Promise<File> {
    const [file] = await db.insert(files).values(data).returning();
    return file;
  }

  async getFilesByUserId(userId: number): Promise<File[]> {
    return db.select().from(files)
      .where(eq(files.userId, userId))
      .orderBy(desc(files.createdAt));
  }

  // Agent config operations
  async createAgentConfig(data: InsertAgentConfig): Promise<AgentConfig> {
    const [config] = await db.insert(agentConfigs).values(data).returning();
    return config;
  }

  async getActiveAgentConfigs(): Promise<AgentConfig[]> {
    return db.select().from(agentConfigs)
      .where(eq(agentConfigs.isActive, true))
      .orderBy(agentConfigs.name);
  }

  async getAllAgentConfigs(): Promise<AgentConfig[]> {
    try {
      return await db.select().from(agentConfigs)
        .orderBy(agentConfigs.name);
    } catch (error) {
      console.warn('Database unavailable for agent configs, using fallback');
      // Return hardcoded agent configs when database is unavailable
      return [
        {
          id: 1,
          name: 'Communication',
          systemPrompt: 'You are a Communication specialist...',
          description: 'Executive communication specialist',
          isActive: true,
          model: 'anthropic/claude-3.5-sonnet',
          maxTokens: 2000,
          temperature: 0.7,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: 2,
          name: 'Coder',
          systemPrompt: 'You are a Coder specialist...',
          description: 'Software development expert',
          isActive: true,
          model: 'qwen/qwen-2.5-coder-32b-instruct',
          maxTokens: 2000,
          temperature: 0.3,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: 3,
          name: 'Analyst',
          systemPrompt: 'You are an Analyst specialist...',
          description: 'Data analysis and insights',
          isActive: true,
          model: 'openai/gpt-4o',
          maxTokens: 2000,
          temperature: 0.5,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: 4,
          name: 'Writer',
          systemPrompt: 'You are a Writer specialist...',
          description: 'Content creation specialist',
          isActive: true,
          model: 'anthropic/claude-3.5-sonnet',
          maxTokens: 2000,
          temperature: 0.8,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: 5,
          name: 'Email',
          systemPrompt: 'You are an Email specialist...',
          description: 'Email processing and automation',
          isActive: true,
          model: 'openai/gpt-4o-mini',
          maxTokens: 1500,
          temperature: 0.4,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: 6,
          name: 'Project Manager',
          systemPrompt: 'You are a Project Manager AI specialized in processing developer changelogs and translating technical updates into professional client communications...',
          description: 'Processes developer changelogs into professional client updates and manages project intelligence',
          isActive: true,
          model: 'anthropic/claude-3.5-sonnet',
          maxTokens: 4000,
          temperature: 0.3,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];
    }
  }

  async getAgentConfigByName(name: string): Promise<AgentConfig | null> {
    const [config] = await db.select().from(agentConfigs).where(eq(agentConfigs.name, name));
    return config || null;
  }
}

export const storage = new Storage();