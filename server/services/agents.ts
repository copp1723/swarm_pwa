import { storage } from '../storage';
import { openRouterService } from './openrouter';
import { memoryService } from './memory';
import type { Message, Memory, InsertMemory } from '@shared/schema';

export interface AgentResponse {
  content: string;
  agentType: string;
  tokenUsage: number;
  metadata?: any;
}

export interface AgentRequest {
  userId: number;
  conversationId: number;
  content: string;
  agentType: string;
  model?: string;
  context?: any[];
  coordination?: boolean;
}

export interface CollaborationStatus {
  status: 'idle' | 'analyzing' | 'coordinating' | 'processing' | 'synthesizing' | 'completed' | 'failed';
  currentStep?: string;
  activeAgents?: string[];
  progress?: { current: number; total: number };
  startTime?: number;
  error?: string;
}

export class AgentService {
  private readonly MAX_CONTEXT_TOKENS = 6000;
  private readonly MAX_RESPONSE_TOKENS = 2000;
  private activeCollaborations: Map<number, CollaborationStatus> = new Map();
  
  // Default models per agent type - can be overridden per request
  private readonly DEFAULT_MODELS: Record<string, string> = {
    'Communication': 'anthropic/claude-3.5-sonnet',
    'Coder': 'qwen/qwen-2.5-coder-32b-instruct', 
    'Analyst': 'openai/gpt-4o',
    'Researcher': 'openai/gpt-4o',
    'Writer': 'anthropic/claude-3.5-sonnet'
  };

  async processAgentRequest(request: AgentRequest): Promise<AgentResponse> {
    try {
      // Set initial status
      this.setCollaborationStatus(request.conversationId, {
        status: 'processing',
        currentStep: 'Processing your request',
        startTime: Date.now()
      });

      // Get agent configuration with robust fallback
      let agentConfig;
      try {
        agentConfig = await storage.getAgentConfigByName(request.agentType);
      } catch (error) {
        // Create comprehensive default config for all agent types
        const defaultPrompts: Record<string, string> = {
          'Communication': 'You are an executive communication specialist with an ESTJ personality. You help leaders craft clear, decisive, and professional messages. Your responses are concise, action-oriented, and maintain executive-level authority.',
          'Coder': 'You are an expert software engineer specializing in clean, efficient code. You provide practical solutions, explain technical concepts clearly, and follow best practices.',
          'Analyst': 'You are a senior data analyst who transforms complex information into actionable insights. You focus on metrics, trends, and data-driven recommendations.',
          'Writer': 'You are a professional content writer who creates compelling, well-structured content. You adapt your tone and style to the audience and purpose.',
          'Email': 'You are an email processing specialist who helps manage and organize email communications efficiently.'
        };
        
        agentConfig = {
          name: request.agentType,
          systemPrompt: defaultPrompts[request.agentType as keyof typeof defaultPrompts] || `You are a helpful ${request.agentType.toLowerCase()} agent providing professional assistance.`,
          isActive: true,
          capabilities: ['general']
        };
      }

      // Determine model to use
      const selectedModel = request.model || this.DEFAULT_MODELS[request.agentType] || 'anthropic/claude-3.5-sonnet';

      // Check for explicit agent mentions
      const mentionedAgents = this.parseAgentMentions(request.content);
      
      if (mentionedAgents.length === 1) {
        // Single agent mention - route to that specific agent
        const targetAgent = mentionedAgents[0];
        const targetRequest = { ...request, agentType: targetAgent };
        
        // Get the target agent's config
        let targetAgentConfig;
        try {
          targetAgentConfig = await storage.getAgentConfigByName(targetAgent);
        } catch (error) {
          const defaultPrompts: Record<string, string> = {
            'Communication': 'You are an executive communication specialist with an ESTJ personality. You help leaders craft clear, decisive, and professional messages. Your responses are concise, action-oriented, and maintain executive-level authority.',
            'Coder': 'You are an expert software engineer specializing in clean, efficient code. You provide practical solutions, explain technical concepts clearly, and follow best practices.',
            'Analyst': 'You are a senior data analyst who transforms complex information into actionable insights. You focus on metrics, trends, and data-driven recommendations.',
            'Writer': 'You are a professional content writer who creates compelling, well-structured content. You adapt your tone and style to the audience and purpose.',
            'Email': 'You are an email processing specialist who helps manage and organize email communications efficiently.',
            'Project Manager': 'You are a project management specialist who processes changelogs and generates professional client updates.'
          };
          
          targetAgentConfig = {
            name: targetAgent,
            systemPrompt: defaultPrompts[targetAgent as keyof typeof defaultPrompts] || `You are a helpful ${targetAgent.toLowerCase()} agent providing professional assistance.`,
            isActive: true,
            capabilities: ['general']
          };
        }
        
        const targetModel = request.model || this.DEFAULT_MODELS[targetAgent as keyof typeof this.DEFAULT_MODELS] || 'anthropic/claude-4-sonnet';
        return await this.processSingleAgentRequest(targetRequest, targetAgentConfig, targetModel);
        
      } else if (mentionedAgents.length > 1) {
        // Multiple agent mentions - use collaboration
        return await this.processCollaborativeRequest(request, agentConfig, selectedModel, {
          requiresMultipleAgents: true,
          agents: mentionedAgents,
          workflow: 'sequential' as const,
          reasoning: 'User requested multi-agent collaboration'
        });
      }

      // Standard single-agent processing
      return await this.processSingleAgentRequest(request, agentConfig, selectedModel);

    } catch (error) {
      this.setCollaborationStatus(request.conversationId, {
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      });

      return {
        content: `I encountered an error: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again.`,
        agentType: request.agentType,
        tokenUsage: 0,
        metadata: { error: true }
      };
    } finally {
      // Clear status after a delay
      setTimeout(() => {
        this.clearCollaborationStatus(request.conversationId);
      }, 3000);
    }
  }

  private async processSingleAgentRequest(
    request: AgentRequest, 
    agentConfig: any, 
    model: string
  ): Promise<AgentResponse> {
    try {
      // Get conversation context with fallback
      let conversationMessages: any[] = [];
      try {
        conversationMessages = await storage.getMessagesByConversationId(request.conversationId);
      } catch (error) {
        console.warn('Database unavailable, proceeding without conversation history');
      }
      
      // Get relevant memories with fallback
      let relevantMemories = [];
      try {
        relevantMemories = await memoryService.searchMemories(
          request.userId,
          request.content,
          0.7,
          5
        );
      } catch (error) {
        console.warn('Memory service unavailable, proceeding without context');
      }

    // Check for filesystem access requests and integrate MCP
    let enhancedContent = request.content;
    if ((request.content.includes('desktop/') || request.content.includes('Desktop/') || 
         request.content.includes('access') || request.content.includes('analyze')) && 
        (request.agentType === 'Coder' || request.agentType === 'Communication')) {
      
      try {
        const { mcpFileSystem } = await import('./mcp-filesystem');
        
        // Extract path from user request - support various path formats
        const pathMatch = request.content.match(/desktop\/[\w-]+/i) || 
                         request.content.match(/Desktop\/[\w-]+/) ||
                         request.content.match(/[Dd]esktop[\/\\][\w-]+/);
        if (pathMatch) {
          const projectPath = pathMatch[0].replace(/\\/g, '/'); // Normalize path separators
          
          // Access filesystem through MCP
          const listResult = await mcpFileSystem.executeFileOperation({
            operation: 'list',
            path: projectPath
          });
          
          if (listResult.success && listResult.files) {
            let filesystemData = `\n\n=== FILESYSTEM ACCESS RESULTS ===\nProject Directory: ${projectPath}\nFound ${listResult.files.length} items:\n`;
            
            listResult.files.forEach(file => {
              filesystemData += `- ${file.name} (${file.type})\n`;
            });
            
            // Read key project files for analysis
            const keyFiles = listResult.files.filter(f => 
              f.name.endsWith('.ts') || f.name.endsWith('.tsx') ||
              f.name.endsWith('.js') || f.name.endsWith('.jsx') ||
              f.name === 'package.json' || f.name === 'tsconfig.json' ||
              f.name === 'README.md' || f.name.endsWith('.json')
            );
            
            filesystemData += `\n=== KEY FILES ANALYSIS ===\n`;
            
            for (const file of keyFiles.slice(0, 5)) {
              try {
                const readResult = await mcpFileSystem.executeFileOperation({
                  operation: 'read',
                  path: `${projectPath}/${file.name}`
                });
                
                if (readResult.success && readResult.content) {
                  filesystemData += `\n--- Content of ${file.name} ---\n${readResult.content.substring(0, 2000)}\n`;
                  if (readResult.content.length > 2000) {
                    filesystemData += `... (content truncated, total length: ${readResult.content.length})\n`;
                  }
                }
              } catch (err) {
                filesystemData += `\nError reading ${file.name}: ${err}\n`;
              }
            }
            
            enhancedContent += filesystemData;
          } else {
            enhancedContent += `\n\nFilesystem access failed for ${projectPath}: ${listResult.message}`;
          }
        }
      } catch (error) {
        enhancedContent += `\n\nMCP Filesystem Error: ${error}`;
      }
    }

    // Build context for the agent
    const contextMessages = this.buildContextMessages(
      agentConfig.systemPrompt,
      conversationMessages,
      relevantMemories,
      enhancedContent
    );

    // Get response from OpenRouter with selected model
    const response = await openRouterService.chat(
      contextMessages,
      model,
      this.MAX_RESPONSE_TOKENS
    );

    // Store the interaction in memory with fallback
    try {
      await memoryService.storeMemory({
        userId: request.userId,
        content: `User: ${request.content}\nAgent (${request.agentType}): ${response.content}`,
        metadata: {
          conversationId: request.conversationId,
          agentType: request.agentType,
          model: model,
          tokenUsage: response.tokenUsage
        }
      });
    } catch (error) {
      console.warn('Failed to store memory, continuing without persistence');
    }

    return {
      content: response.content,
      agentType: request.agentType,
      tokenUsage: response.tokenUsage,
      metadata: {
        relevantContextCount: relevantMemories.length,
        conversationLength: conversationMessages.length,
        model: model
      }
    };
    } catch (error) {
      console.error('Agent processing error:', error);
      return {
        content: `I encountered an error processing your request. Please try again.`,
        agentType: request.agentType,
        tokenUsage: 0,
        metadata: { error: true }
      };
    }
  }

  private async processCollaborativeRequest(
    request: AgentRequest,
    agentConfig: any,
    model: string,
    collaboration: { requiresMultipleAgents: boolean; agents: string[]; workflow: string; reasoning: string }
  ): Promise<AgentResponse> {
    const agents = collaboration.agents;
    
    this.setCollaborationStatus(request.conversationId, {
      status: 'analyzing',
      currentStep: 'Planning agent coordination strategy',
      activeAgents: agents,
      progress: { current: 0, total: agents.length + 1 },
      startTime: Date.now()
    });

    try {
      // Enhanced coordination analysis
      const coordinationPlan = this.analyzeCoordinationStrategy(agents, request.content, collaboration.workflow);
      
      if (coordinationPlan.strategy === 'parallel' && agents.length <= 3) {
        return await this.executeParallelWorkflow(request, agents, coordinationPlan);
      } else if (coordinationPlan.strategy === 'sequential') {
        return await this.executeSequentialWorkflow(request, agents, coordinationPlan);
      } else {
        return await this.executeEnhancedSingleAgent(request, agents, agentConfig, model);
      }
      
    } catch (error) {
      this.setCollaborationStatus(request.conversationId, {
        status: 'failed',
        error: error instanceof Error ? error.message : 'Collaboration failed'
      });
      
      // Graceful fallback to enhanced single agent
      return await this.executeEnhancedSingleAgent(request, agents, agentConfig, model);
    }
  }

  private analyzeCoordinationStrategy(agents: string[], content: string, workflow: string): {
    strategy: 'parallel' | 'sequential' | 'enhanced-single';
    dependencies: string[];
    estimatedTime: number;
    reasoning: string;
  } {
    // Analyze content patterns for coordination needs
    const hasAnalysisPhase = /analyze|review|assess|evaluate|examine/i.test(content);
    const hasCreativePhase = /write|create|generate|design|compose/i.test(content);
    const hasImplementationPhase = /code|develop|implement|build|program/i.test(content);
    const hasResearchPhase = /research|find|investigate|search|explore/i.test(content);
    
    // Determine optimal strategy
    if (agents.length <= 2 && !hasAnalysisPhase) {
      return {
        strategy: 'parallel',
        dependencies: [],
        estimatedTime: 25,
        reasoning: 'Independent tasks suitable for parallel processing'
      };
    }
    
    if (agents.includes('Analyst') && (hasCreativePhase || hasImplementationPhase)) {
      return {
        strategy: 'sequential',
        dependencies: ['Analyst → Writer/Coder'],
        estimatedTime: 40,
        reasoning: 'Analysis required before creative/implementation work'
      };
    }
    
    return {
      strategy: 'enhanced-single',
      dependencies: [],
      estimatedTime: 20,
      reasoning: 'Single agent with multi-specialty context most efficient'
    };
  }

  private async executeParallelWorkflow(
    request: AgentRequest,
    agents: string[],
    plan: any
  ): Promise<AgentResponse> {
    this.setCollaborationStatus(request.conversationId, {
      status: 'processing',
      currentStep: 'Executing parallel agent workflow',
      activeAgents: agents,
      progress: { current: 1, total: agents.length + 1 }
    });

    const agentPromises = agents.map(async (agentType, index) => {
      let agentConfig;
      try {
        agentConfig = await storage.getAgentConfigByName(agentType);
      } catch (error) {
        const defaultPrompts: Record<string, string> = {
          'Communication': 'You are an executive communication specialist with an ESTJ personality.',
          'Coder': 'You are an expert software engineer specializing in clean, efficient code.',
          'Analyst': 'You are a senior data analyst who transforms complex information into actionable insights.',
          'Writer': 'You are a professional content writer who creates compelling, well-structured content.',
          'Email': 'You are an email processing specialist who helps manage and organize email communications efficiently.'
        };
        
        agentConfig = {
          name: agentType,
          systemPrompt: defaultPrompts[agentType as keyof typeof defaultPrompts] || `You are a helpful ${agentType.toLowerCase()} agent providing professional assistance.`,
          isActive: true,
          capabilities: ['general']
        };
      }
      const model = this.DEFAULT_MODELS[agentType as keyof typeof this.DEFAULT_MODELS] || 'anthropic/claude-4-sonnet';
      
      // Add slight delay to prevent rate limiting
      if (index > 0) await new Promise(resolve => setTimeout(resolve, 500 * index));
      
      return await this.processSingleAgentRequest(
        { ...request, agentType },
        agentConfig,
        model
      );
    });

    const results = await Promise.allSettled(agentPromises);
    const successful = results
      .filter((r): r is PromiseFulfilledResult<AgentResponse> => r.status === 'fulfilled')
      .map(r => r.value);

    if (successful.length === 0) {
      throw new Error('All parallel agents failed');
    }

    return this.synthesizeParallelResults(request, successful, agents);
  }

  private async executeSequentialWorkflow(
    request: AgentRequest,
    agents: string[],
    plan: any
  ): Promise<AgentResponse> {
    let contextAccumulator = request.content;
    const results: AgentResponse[] = [];
    
    for (let i = 0; i < agents.length; i++) {
      const agentType = agents[i];
      
      this.setCollaborationStatus(request.conversationId, {
        status: 'processing',
        currentStep: `${agentType} processing (${i + 1}/${agents.length})`,
        activeAgents: [agentType],
        progress: { current: i + 1, total: agents.length + 1 }
      });

      let agentConfig;
      try {
        agentConfig = await storage.getAgentConfigByName(agentType);
      } catch (error) {
        const defaultPrompts: Record<string, string> = {
          'Communication': 'You are an executive communication specialist with an ESTJ personality.',
          'Coder': 'You are an expert software engineer specializing in clean, efficient code.',
          'Analyst': 'You are a senior data analyst who transforms complex information into actionable insights.',
          'Writer': 'You are a professional content writer who creates compelling, well-structured content.',
          'Email': 'You are an email processing specialist who helps manage and organize email communications efficiently.'
        };
        
        agentConfig = {
          name: agentType,
          systemPrompt: defaultPrompts[agentType as keyof typeof defaultPrompts] || `You are a helpful ${agentType.toLowerCase()} agent providing professional assistance.`,
          isActive: true,
          capabilities: ['general']
        };
      }
      const model = this.DEFAULT_MODELS[agentType as keyof typeof this.DEFAULT_MODELS] || 'anthropic/claude-4-sonnet';
      
      const result = await this.processSingleAgentRequest(
        { ...request, content: contextAccumulator, agentType },
        agentConfig,
        model
      );

      results.push(result);
      
      // Build context for next agent
      if (i < agents.length - 1) {
        contextAccumulator = `${request.content}\n\n**Previous ${agentType} Analysis:**\n${result.content}`;
      }
    }

    return this.synthesizeSequentialResults(request, results, agents);
  }

  private async executeEnhancedSingleAgent(
    request: AgentRequest,
    agents: string[],
    agentConfig: any,
    model: string
  ): Promise<AgentResponse> {
    const primaryAgent = agents[0] || request.agentType;
    
    this.setCollaborationStatus(request.conversationId, {
      status: 'processing',
      currentStep: `${primaryAgent} processing with multi-agent context`,
      activeAgents: [primaryAgent]
    });

    const enhancedContent = `${request.content}\n\n**Multi-Agent Context:** This request involves expertise from ${agents.join(', ')}. Provide comprehensive analysis covering all these perspectives.`;

    return await this.processSingleAgentRequest({
      ...request,
      agentType: primaryAgent,
      content: enhancedContent
    }, agentConfig, model);
  }

  private synthesizeParallelResults(
    request: AgentRequest,
    results: AgentResponse[],
    agents: string[]
  ): AgentResponse {
    this.setCollaborationStatus(request.conversationId, {
      status: 'synthesizing',
      currentStep: 'Combining parallel analysis results'
    });

    const sections = results.map((result, i) => {
      const agentName = agents[i];
      return `## ${agentName} Analysis\n\n${result.content}`;
    }).join('\n\n---\n\n');

    const totalTokens = results.reduce((sum, r) => sum + r.tokenUsage, 0);

    return {
      content: `# Collaborative Analysis\n\n${sections}\n\n---\n\n**Coordination:** Parallel processing by ${agents.join(', ')}`,
      agentType: 'Multi-Agent',
      tokenUsage: totalTokens,
      metadata: {
        collaborationMode: 'parallel',
        participatingAgents: agents,
        processingTime: Date.now() - (this.getCollaborationStatus(request.conversationId)?.startTime || 0)
      }
    };
  }

  private synthesizeSequentialResults(
    request: AgentRequest,
    results: AgentResponse[],
    agents: string[]
  ): AgentResponse {
    const finalResult = results[results.length - 1];
    const totalTokens = results.reduce((sum, r) => sum + r.tokenUsage, 0);

    const workflow = results.map((r, i) => 
      `**${agents[i]}:** ${r.content.substring(0, 120)}...`
    ).join('\n');

    return {
      content: `${finalResult.content}\n\n---\n\n**Sequential Workflow:**\n${workflow}`,
      agentType: 'Multi-Agent',
      tokenUsage: totalTokens,
      metadata: {
        collaborationMode: 'sequential',
        participatingAgents: agents,
        primaryResult: agents[agents.length - 1]
      }
    };
  }

  private analyzeCollaborationNeeds(content: string): { 
    requiresMultipleAgents: boolean; 
    agents: string[]; 
    workflow: 'sequential' | 'parallel' | 'hierarchical';
    reasoning: string;
  } {
    const mentions = this.parseAgentMentions(content);
    
    if (mentions.length > 1) {
      return {
        requiresMultipleAgents: true,
        agents: mentions,
        workflow: mentions.length <= 2 ? 'parallel' : 'sequential',
        reasoning: `Multi-agent collaboration requested: ${mentions.join(', ')}`
      };
    }
    
    // Single agent or implicit request
    const agentType = mentions.length > 0 ? mentions[0] : 'Communication';
    return {
      requiresMultipleAgents: false,
      agents: [agentType],
      workflow: 'sequential',
      reasoning: 'Single agent processing'
    };
  }

  private async synthesizeMultiAgentResults(
    results: AgentResponse[], 
    originalRequest: AgentRequest, 
    sharedContext: string
  ): Promise<string> {
    if (results.length === 0) {
      return 'No agent responses available.';
    }
    
    if (results.length === 1) {
      return results[0].content;
    }
    
    // Multiple results - create comprehensive synthesis
    const sections = results.map((result, index) => {
      const agentName = result.agentType || `Agent ${index + 1}`;
      return `**${agentName} Response:**\n${result.content}`;
    }).join('\n\n---\n\n');
    
    return `# Multi-Agent Collaboration Results\n\n${sections}\n\n---\n\n*Combined insights from ${results.length} specialized agents*`;
  }

  private buildContextMessages(
    systemPrompt: string,
    conversationMessages: Message[],
    relevantMemories: Memory[],
    currentMessage: string
  ): Array<{ role: 'system' | 'user' | 'assistant'; content: string }> {
    const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [];

    // Add system prompt
    let enhancedSystemPrompt = systemPrompt;
    
    // Add relevant memory context if available
    if (relevantMemories.length > 0) {
      const memoryContext = relevantMemories
        .slice(0, 3) // Limit to most relevant
        .map(memory => memory.content)
        .join('\n\n');
      
      enhancedSystemPrompt += `\n\nRelevant context from previous conversations:\n${memoryContext}`;
    }

    messages.push({ role: 'system', content: enhancedSystemPrompt });

    // Add recent conversation messages (trimmed to fit token limits)
    const recentMessages = conversationMessages
      .slice(-10) // Last 10 messages
      .filter(msg => msg.content.length > 0);

    for (const msg of recentMessages) {
      if (msg.userId) {
        messages.push({ role: 'user', content: msg.content });
      } else if (msg.agentType) {
        messages.push({ role: 'assistant', content: msg.content });
      }
    }

    // Add current message
    messages.push({ role: 'user', content: currentMessage });

    return messages;
  }

  parseAgentMentions(content: string): string[] {
    const validAgents = ['Communication', 'Coder', 'Analyst', 'Writer', 'Email', 'Project Manager'];
    const mentionRegex = /@(\w+(?:\s+\w+)*)/g;
    const mentions: string[] = [];
    let match;
    
    while ((match = mentionRegex.exec(content)) !== null) {
      const mentionedName = match[1];
      const matchedAgent = validAgents.find(agent => 
        agent.toLowerCase() === mentionedName.toLowerCase() ||
        agent.toLowerCase().includes(mentionedName.toLowerCase()) ||
        mentionedName.toLowerCase().includes(agent.toLowerCase())
      );
      
      if (matchedAgent) {
        mentions.push(matchedAgent);
      }
    }
    
    return Array.from(new Set(mentions));
  }

  private canRunInParallel(agents: string[], content: string): boolean {
    return false; // Sequential processing for reliability
  }



  setCollaborationStatus(conversationId: number, status: CollaborationStatus): void {
    this.activeCollaborations.set(conversationId, {
      ...this.activeCollaborations.get(conversationId),
      ...status
    });
  }

  getCollaborationStatus(conversationId: number): CollaborationStatus | null {
    return this.activeCollaborations.get(conversationId) || null;
  }

  clearCollaborationStatus(conversationId: number): void {
    this.activeCollaborations.delete(conversationId);
  }

  async getTokenCount(conversationId: number): Promise<number> {
    const messages = await storage.getMessagesByConversationId(conversationId);
    return messages.reduce((total, msg) => total + (msg.tokenCount || 0), 0);
  }

  // Removed quickTransform method - now handled directly via processAgentRequest for consistency
}

export const agentService = new AgentService();
