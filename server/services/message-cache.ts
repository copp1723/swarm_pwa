// In-memory message cache for when database is unavailable
import type { Message } from '@shared/schema';

class MessageCache {
  private cache = new Map<number, Message[]>();

  addMessage(conversationId: number, message: Message): void {
    console.log('Adding message to cache:', { conversationId, messageId: message.id, content: message.content?.substring(0, 50) });
    
    if (!this.cache.has(conversationId)) {
      this.cache.set(conversationId, []);
    }
    this.cache.get(conversationId)!.push(message);
    
    console.log('Cache now has', this.cache.get(conversationId)!.length, 'messages for conversation', conversationId);
    
    // Keep only last 100 messages per conversation
    const messages = this.cache.get(conversationId)!;
    if (messages.length > 100) {
      this.cache.set(conversationId, messages.slice(-100));
    }
  }

  getMessages(conversationId: number, limit: number = 50): Message[] {
    const messages = this.cache.get(conversationId) || [];
    console.log('Getting messages from cache:', { conversationId, cachedCount: messages.length, requesting: limit });
    return messages.slice(-limit);
  }

  clear(conversationId?: number): void {
    if (conversationId) {
      this.cache.delete(conversationId);
    } else {
      this.cache.clear();
    }
  }
}

export const messageCache = new MessageCache();