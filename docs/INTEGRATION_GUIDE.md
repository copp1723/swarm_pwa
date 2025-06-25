# SWARM Integration Capabilities Documentation

## Overview

SWARM is built with a modular architecture that supports dynamic agent addition, external database connections, API integrations, and intelligent processing capabilities. This guide covers everything needed to implement the Project Manager Agent and integrate with the Project Tracker system.

## 1. Adding New Agents

### Agent Configuration System

Agents are dynamically configured through the database `agent_configs` table:

```typescript
// Database Schema (shared/schema.ts)
export const agentConfigs = pgTable("agent_configs", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  systemPrompt: text("system_prompt").notNull(),
  description: text("description"),
  isActive: boolean("is_active").default(true),
  model: text("model").default("anthropic/claude-3.5-sonnet"),
  maxTokens: integer("max_tokens").default(2000),
  temperature: real("temperature").default(0.7),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});
```

### Adding Project Manager Agent

```sql
-- Add Project Manager Agent to database
INSERT INTO agent_configs (name, system_prompt, description, model, max_tokens) VALUES (
  'Project Manager',
  'You are a Project Manager AI that processes developer changelogs and translates them into professional client updates. You understand project phases, timeline impacts, and client communication needs. Your role is to:

1. Parse technical developer updates and extract project progress
2. Map technical tasks to customer-facing milestones
3. Calculate progress percentages and timeline impacts
4. Generate professional client communications
5. Learn project patterns and provide predictive insights
6. Flag potential delays or issues proactively

Always maintain professional tone, be specific about deliverables, and provide clear timeline information.',
  
  'Processes developer changelogs and manages project communications',
  'anthropic/claude-3.5-sonnet',
  3000
);
```

### Agent Service Integration

The agent automatically becomes available through the existing `AgentService` class:

```typescript
// server/services/agents.ts - Already handles dynamic agents
export class AgentService {
  // Agents are loaded dynamically from database
  async processAgentRequest(request: AgentRequest): Promise<AgentResponse> {
    // Existing system automatically supports new agents
  }
}
```

## 2. Database Connection Methods

### Current Database Setup

SWARM uses Drizzle ORM with PostgreSQL:

```typescript
// server/db.ts
import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);
export const db = drizzle(sql, { schema });
```

### Adding Project Tracker Integration

Create new schema definitions for Project Tracker integration:

```typescript
// shared/schema.ts - Add these tables
export const projects = pgTable("projects", {
  id: serial("id").primaryKey(),
  projectCode: text("project_code").notNull().unique(), // AI-2024-087
  clientName: text("client_name").notNull(),
  title: text("title").notNull(),
  status: text("status").notNull(), // "planning", "development", "testing", "deployment", "completed"
  phase: integer("phase").default(1), // 1-5 for 5-step methodology
  progressPercentage: integer("progress_percentage").default(0),
  startDate: timestamp("start_date").defaultNow(),
  estimatedCompletion: timestamp("estimated_completion"),
  actualCompletion: timestamp("actual_completion"),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

export const projectUpdates = pgTable("project_updates", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").references(() => projects.id),
  updateType: text("update_type").notNull(), // "changelog", "milestone", "status"
  technicalContent: text("technical_content"), // Raw developer input
  clientContent: text("client_content"), // Processed client-facing content
  progressDelta: integer("progress_delta").default(0), // Progress change
  phaseChange: boolean("phase_change").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  createdBy: text("created_by") // "agent" or user id
});

export const projectPatterns = pgTable("project_patterns", {
  id: serial("id").primaryKey(),
  patternType: text("pattern_type").notNull(), // "delay", "scope_creep", "completion"
  projectPhase: integer("project_phase"),
  description: text("description").notNull(),
  confidence: real("confidence").default(0.0),
  occurrences: integer("occurrences").default(1),
  createdAt: timestamp("created_at").defaultNow(),
  lastOccurrence: timestamp("last_occurrence").defaultNow()
});
```

### Storage Service Extensions

```typescript
// server/storage.ts - Add these methods
export class Storage {
  // Project Management Methods
  async createProject(data: InsertProject): Promise<Project> {
    const [project] = await this.db.insert(projects).values(data).returning();
    return project;
  }

  async getProjectByCode(projectCode: string): Promise<Project | null> {
    const [project] = await this.db
      .select()
      .from(projects)
      .where(eq(projects.projectCode, projectCode))
      .limit(1);
    return project || null;
  }

  async updateProjectProgress(
    projectId: number, 
    progressPercentage: number, 
    phase?: number
  ): Promise<void> {
    await this.db
      .update(projects)
      .set({ 
        progressPercentage, 
        ...(phase && { phase }),
        updatedAt: new Date() 
      })
      .where(eq(projects.id, projectId));
  }

  async createProjectUpdate(data: InsertProjectUpdate): Promise<ProjectUpdate> {
    const [update] = await this.db.insert(projectUpdates).values(data).returning();
    return update;
  }

  async getProjectPatterns(projectPhase?: number): Promise<ProjectPattern[]> {
    const query = this.db.select().from(projectPatterns);
    if (projectPhase) {
      query.where(eq(projectPatterns.projectPhase, projectPhase));
    }
    return await query;
  }

  async storeProjectPattern(data: InsertProjectPattern): Promise<ProjectPattern> {
    const [pattern] = await this.db.insert(projectPatterns).values(data).returning();
    return pattern;
  }
}
```

## 3. API Calling Capabilities from Agents

### MCP (Model Context Protocol) Integration

SWARM includes MCP servers for external API calls:

```typescript
// server/services/mcp-registry.ts - Already built
export class MCPRegistry {
  async callTool(serverName: string, toolName: string, params: any): Promise<any> {
    // Makes API calls through MCP servers
  }
}
```

### Adding Project Tracker API Integration

Create new MCP server for Project Tracker:

```typescript
// server/services/mcp-project-tracker.ts
export interface ProjectTrackerAPI {
  updateProject(projectCode: string, data: ProjectUpdateData): Promise<boolean>;
  getProject(projectCode: string): Promise<Project | null>;
  refreshCustomerPage(projectCode: string): Promise<boolean>;
}

export class MCPProjectTrackerService implements ProjectTrackerAPI {
  private readonly baseUrl: string;
  private readonly apiKey: string;

  constructor() {
    this.baseUrl = process.env.PROJECT_TRACKER_URL || 'https://yourcompany.com/api';
    this.apiKey = process.env.PROJECT_TRACKER_API_KEY || '';
  }

  async updateProject(projectCode: string, data: ProjectUpdateData): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/projects/${projectCode}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });
      return response.ok;
    } catch (error) {
      console.error('Project Tracker API error:', error);
      return false;
    }
  }

  async refreshCustomerPage(projectCode: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/projects/${projectCode}/refresh`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`
        }
      });
      return response.ok;
    } catch (error) {
      console.error('Customer page refresh error:', error);
      return false;
    }
  }

  // MCP Tool Implementation
  async executeProjectOperation(params: any): Promise<any> {
    const { operation, projectCode, data } = params;
    
    switch (operation) {
      case 'update':
        return await this.updateProject(projectCode, data);
      case 'refresh':
        return await this.refreshCustomerPage(projectCode);
      default:
        throw new Error(`Unknown operation: ${operation}`);
    }
  }
}

export const mcpProjectTracker = new MCPProjectTrackerService();
```

### Agent API Access

Agents can call external APIs through the MCP system:

```typescript
// Example: Project Manager Agent making API calls
const projectUpdate = await context.mcpRegistry.callTool(
  'project-tracker',
  'update-project',
  {
    projectCode: 'AI-2024-087',
    progressPercentage: 75,
    statusMessage: 'Development phase completed, testing initiated'
  }
);
```

## 4. Natural Language Processing for Project Updates

### Changelog Processing System

```typescript
// server/services/changelog-processor.ts
export interface ChangelogEntry {
  projectCode: string;
  rawContent: string;
  extractedTasks: string[];
  completedItems: string[];
  inProgressItems: string[];
  blockers: string[];
  progressImpact: number;
  phaseChange: boolean;
}

export class ChangelogProcessor {
  async processChangelog(changelog: string): Promise<ChangelogEntry> {
    // Use agent to parse changelog
    const response = await agentService.processAgentRequest({
      userId: 1,
      conversationId: 0,
      content: `Parse this developer changelog and extract structured information:

CHANGELOG: ${changelog}

Extract and return JSON with:
- projectCode: Project identifier (format: AI-YYYY-###)
- completedItems: List of completed tasks
- inProgressItems: List of current work
- blockers: Any issues or blockers mentioned
- progressImpact: Estimated progress percentage impact (0-100)
- phaseChange: Boolean if this indicates phase transition

Example output:
{
  "projectCode": "AI-2024-087",
  "completedItems": ["API authentication", "user permissions"],
  "inProgressItems": ["dashboard testing"],
  "blockers": [],
  "progressImpact": 10,
  "phaseChange": false
}`,
      agentType: 'Project Manager',
      model: 'anthropic/claude-3.5-sonnet'
    });

    return JSON.parse(response.content);
  }

  async generateClientUpdate(changelog: ChangelogEntry, project: Project): Promise<string> {
    const response = await agentService.processAgentRequest({
      userId: 1,
      conversationId: 0,
      content: `Generate professional client update from technical changelog:

PROJECT: ${project.title} (${project.projectCode})
CURRENT PHASE: ${project.phase}/5
CURRENT PROGRESS: ${project.progressPercentage}%

TECHNICAL UPDATES:
- Completed: ${changelog.completedItems.join(', ')}
- In Progress: ${changelog.inProgressItems.join(', ')}
- Blockers: ${changelog.blockers.join(', ') || 'None'}

Generate professional client-facing update that:
1. Uses business language (not technical jargon)
2. Relates to project milestones and timeline
3. Maintains confidence and professionalism
4. Includes specific progress information
5. Addresses any timeline impacts

Format as professional project update suitable for client portal.`,
      agentType: 'Project Manager',
      model: 'anthropic/claude-3.5-sonnet'
    });

    return response.content;
  }
}

export const changelogProcessor = new ChangelogProcessor();
```

### Processing Pipeline

```typescript
// server/handlers/project-handlers.ts
export const processChangelogHandler: RouteHandler = {
  schema: z.object({
    changelog: z.string(),
    autoPublish: z.boolean().default(false)
  }),
  
  handler: async (params, context: RequestContext) => {
    const { changelog, autoPublish } = params;
    
    // 1. Parse changelog
    const parsed = await changelogProcessor.processChangelog(changelog);
    
    // 2. Get project
    const project = await context.storage.getProjectByCode(parsed.projectCode);
    if (!project) {
      throw new APIError(404, `Project ${parsed.projectCode} not found`);
    }
    
    // 3. Generate client update
    const clientUpdate = await changelogProcessor.generateClientUpdate(parsed, project);
    
    // 4. Update database
    const newProgress = Math.min(100, project.progressPercentage + parsed.progressImpact);
    await context.storage.updateProjectProgress(project.id, newProgress);
    
    // 5. Store update record
    await context.storage.createProjectUpdate({
      projectId: project.id,
      updateType: 'changelog',
      technicalContent: changelog,
      clientContent: clientUpdate,
      progressDelta: parsed.progressImpact,
      phaseChange: parsed.phaseChange,
      createdBy: 'agent'
    });
    
    // 6. Optionally publish to Project Tracker
    if (autoPublish) {
      await context.mcpRegistry.callTool('project-tracker', 'update-project', {
        projectCode: parsed.projectCode,
        progressPercentage: newProgress,
        statusMessage: clientUpdate
      });
    }
    
    return {
      projectCode: parsed.projectCode,
      clientUpdate,
      progressChange: parsed.progressImpact,
      newProgress,
      published: autoPublish
    };
  },
  
  description: 'Process developer changelog and generate client update'
};
```

## 5. Memory Storage for Project Patterns

### Pattern Recognition System

```typescript
// server/services/pattern-learning.ts
export interface ProjectPattern {
  type: 'delay' | 'scope_creep' | 'early_completion' | 'client_behavior';
  phase: number;
  description: string;
  confidence: number;
  triggers: string[];
  recommendations: string[];
}

export class PatternLearningService {
  async analyzeProjectHistory(projectCode?: string): Promise<ProjectPattern[]> {
    // Get historical data
    const updates = await storage.getProjectUpdateHistory(projectCode);
    const patterns: ProjectPattern[] = [];
    
    // Use AI to identify patterns
    const response = await agentService.processAgentRequest({
      userId: 1,
      conversationId: 0,
      content: `Analyze project update history and identify patterns:

${JSON.stringify(updates, null, 2)}

Identify patterns such as:
- Phases that consistently overrun
- Types of delays that recur
- Client communication patterns
- Scope creep indicators
- Early completion opportunities

Return JSON array of patterns with confidence scores.`,
      agentType: 'Analyst',
      model: 'anthropic/claude-3.5-sonnet'
    });
    
    return JSON.parse(response.content);
  }
  
  async storePattern(pattern: ProjectPattern): Promise<void> {
    await storage.storeProjectPattern({
      patternType: pattern.type,
      projectPhase: pattern.phase,
      description: pattern.description,
      confidence: pattern.confidence
    });
  }
  
  async getRelevantPatterns(
    projectCode: string, 
    currentPhase: number
  ): Promise<ProjectPattern[]> {
    return await storage.getProjectPatterns(currentPhase);
  }
  
  async generatePredictiveInsights(
    project: Project,
    recentUpdates: ProjectUpdate[]
  ): Promise<string[]> {
    const patterns = await this.getRelevantPatterns(project.projectCode, project.phase);
    
    const response = await agentService.processAgentRequest({
      userId: 1,
      conversationId: 0,
      content: `Generate predictive insights for project:

CURRENT PROJECT: ${JSON.stringify(project, null, 2)}
RECENT UPDATES: ${JSON.stringify(recentUpdates, null, 2)}
HISTORICAL PATTERNS: ${JSON.stringify(patterns, null, 2)}

Based on patterns and current state, provide:
1. Timeline risk assessment
2. Potential issues to watch for
3. Proactive recommendations
4. Client communication suggestions

Return as array of actionable insights.`,
      agentType: 'Project Manager',
      model: 'anthropic/claude-3.5-sonnet'
    });
    
    return JSON.parse(response.content);
  }
}

export const patternLearning = new PatternLearningService();
```

### Memory Integration with SuperMemory

```typescript
// server/services/memory.ts - Enhanced for project patterns
export class MemoryService {
  async storeProjectInsight(
    projectCode: string,
    insight: string,
    metadata: any
  ): Promise<void> {
    await this.storeMemory({
      content: insight,
      metadata: {
        type: 'project_insight',
        projectCode,
        ...metadata
      },
      userId: 1,
      conversationId: 0
    });
  }
  
  async searchProjectMemories(
    projectCode: string,
    query: string
  ): Promise<Memory[]> {
    return await this.searchMemories(1, query, 0.7, {
      type: 'project_insight',
      projectCode
    });
  }
}
```

## Implementation Example: Complete Project Manager Agent

```typescript
// server/handlers/project-manager-handlers.ts
export const projectManagerChatHandler: RouteHandler = {
  schema: z.object({
    message: z.string(),
    projectCode: z.string().optional(),
    action: z.enum(['chat', 'process_changelog', 'generate_update', 'analyze_patterns']).optional()
  }),
  
  handler: async (params, context: RequestContext) => {
    const { message, projectCode, action = 'chat' } = params;
    
    // Build context from project data and patterns
    let contextData = '';
    if (projectCode) {
      const project = await context.storage.getProjectByCode(projectCode);
      const patterns = await patternLearning.getRelevantPatterns(projectCode, project?.phase || 1);
      const insights = await patternLearning.generatePredictiveInsights(project!, []);
      
      contextData = `
PROJECT CONTEXT:
${JSON.stringify(project, null, 2)}

RELEVANT PATTERNS:
${JSON.stringify(patterns, null, 2)}

CURRENT INSIGHTS:
${insights.join('\n')}
`;
    }
    
    const response = await context.agentService.processAgentRequest({
      userId: context.userId,
      conversationId: 1,
      content: `${contextData}\n\nUSER REQUEST: ${message}`,
      agentType: 'Project Manager',
      model: 'anthropic/claude-3.5-sonnet'
    });
    
    return response;
  },
  
  description: 'Chat with Project Manager Agent with full project context'
};
```

This documentation provides everything needed to implement the Project Manager Agent and integrate SWARM with your Project Tracker system. The architecture is already in place - you just need to add the specific schemas, handlers, and configuration for your business logic.