interface OpenRouterResponse {
  id: string;
  choices: Array<{
    message: {
      content: string;
      role: string;
    };
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export class OpenRouterService {
  private apiKey: string;
  private baseUrl = 'https://openrouter.ai/api/v1';

  constructor() {
    this.apiKey = process.env.OPENROUTER_API_KEY || process.env.OPENROUTER_KEY || '';
    
    if (!this.apiKey) {
      console.warn('OpenRouter API key not configured. Agent responses will fail.');
    }
  }

  async chat(
    messages: ChatMessage[],
    model: string = 'anthropic/claude-3.5-sonnet',
    maxTokens: number = 4000
  ): Promise<{ content: string; tokenUsage: number }> {
    if (!this.apiKey) {
      throw new Error('OpenRouter API key not configured. Please add OPENROUTER_API_KEY to environment variables.');
    }
    
    // Validate inputs
    if (!messages || messages.length === 0) {
      throw new Error('No messages provided for chat completion');
    }
    
    if (maxTokens > 4000) {
      maxTokens = 4000; // Prevent excessive token usage
    }

    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': process.env.SITE_URL || 'http://localhost:5000',
          'X-Title': 'Multi-Agent Productivity System'
        },
        body: JSON.stringify({
          model,
          messages,
          max_tokens: maxTokens,
          temperature: 0.7
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`OpenRouter API error: ${response.status} - ${errorText}`);
      }

      const data: OpenRouterResponse = await response.json();
      
      if (!data.choices || data.choices.length === 0) {
        throw new Error('No response choices from OpenRouter');
      }

      return {
        content: data.choices[0].message.content,
        tokenUsage: data.usage?.total_tokens || 0
      };
    } catch (error) {
      console.error('OpenRouter API error:', error);
      throw error;
    }
  }

  async getAvailableModels(): Promise<string[]> {
    try {
      const response = await fetch(`${this.baseUrl}/models`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch models: ${response.status}`);
      }

      const data = await response.json();
      return data.data?.map((model: any) => model.id) || [];
    } catch (error) {
      console.error('Failed to fetch available models:', error);
      return ['anthropic/claude-3.5-sonnet', 'openai/gpt-4', 'openai/gpt-3.5-turbo'];
    }
  }
}

export const openRouterService = new OpenRouterService();
