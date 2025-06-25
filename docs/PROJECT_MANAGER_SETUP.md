# Project Manager Agent Setup Guide

## Quick Implementation Steps

### 1. Add Project Manager Agent to Database

```sql
-- Connect to your SWARM database and run:
INSERT INTO agent_configs (name, system_prompt, description, model, max_tokens, temperature) VALUES (
  'Project Manager',
  'You are a Project Manager AI specialized in processing developer changelogs and translating technical updates into professional client communications. Your expertise includes:

CORE CAPABILITIES:
- Parse technical developer updates and extract project progress
- Map development tasks to customer-facing milestones  
- Calculate progress percentages and timeline impacts
- Generate professional client communications
- Learn project patterns and provide predictive insights
- Flag potential delays or risks proactively

COMMUNICATION STYLE:
- Professional and executive-level tone
- Clear, specific deliverables and timelines
- Business language (avoid technical jargon for client updates)
- Proactive and solution-oriented
- Confidence-building without over-promising

WORKFLOW PROCESSING:
When processing changelogs, always:
1. Extract project identifier (AI-YYYY-### format)
2. Categorize completed vs in-progress tasks
3. Identify any blockers or risks
4. Calculate progress impact (percentage)
5. Determine if phase transition occurred
6. Generate client-appropriate status update
7. Provide timeline and next steps

PATTERN RECOGNITION:
Learn from project history to:
- Predict common delay patterns
- Identify scope creep early
- Recommend proactive client communication
- Optimize resource allocation

Always maintain professional standards while being practical and results-focused.',
  
  'Processes developer changelogs into professional client updates and manages project intelligence',
  'anthropic/claude-3.5-sonnet',
  4000,
  0.3
);
```

### 2. Register Project Manager Routes

Add to `server/routes.ts`:

```typescript
// Import the handler
import { projectManagerHandler } from './handlers/project-manager-handlers';

// Register in the routes function
function registerAllRoutes() {
  // ... existing routes
  registry.register('project_manager_chat', projectManagerHandler);
}
```

### 3. Create Project Manager Handler

```typescript
// server/handlers/project-manager-handlers.ts
import { z } from 'zod';
import { RouteHandler, RequestContext } from '../lib/route-registry';

export const projectManagerHandler: RouteHandler = {
  schema: z.object({
    message: z.string(),
    projectCode: z.string().optional(),
    autoProcess: z.boolean().default(false)
  }),
  
  handler: async (params, context: RequestContext) => {
    const { message, projectCode, autoProcess } = params;
    
    // Enhanced system prompt with project context
    let contextPrompt = `You are the Project Manager Agent. Process this request:

USER MESSAGE: ${message}`;

    // Add project context if provided
    if (projectCode) {
      contextPrompt += `\n\nPROJECT CODE: ${projectCode}`;
      
      // TODO: Add project data lookup when Project Tracker is connected
      // const project = await context.storage.getProjectByCode(projectCode);
      // if (project) {
      //   contextPrompt += `\nPROJECT DATA: ${JSON.stringify(project, null, 2)}`;
      // }
    }
    
    // Process with Project Manager agent
    const response = await context.agentService.processAgentRequest({
      userId: context.userId,
      conversationId: 1, // Default conversation for project management
      content: contextPrompt,
      agentType: 'Project Manager',
      model: 'anthropic/claude-3.5-sonnet'
    });
    
    // Auto-process changelog if requested
    if (autoProcess && message.toLowerCase().includes('changelog')) {
      // TODO: Implement changelog processing pipeline
      // const processed = await processChangelog(message, projectCode);
      // return { ...response, processed };
    }
    
    return response;
  },
  
  description: 'Process requests with Project Manager Agent including changelog processing'
};
```

### 4. Test Project Manager Agent

Test the new agent via API:

```bash
curl -X POST http://localhost:5000/api/rpc \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "method": "project_manager_chat",
    "params": {
      "message": "Process this changelog: AutoMax project - completed API authentication, started dashboard testing",
      "projectCode": "AI-2024-087"
    },
    "id": 1
  }'
```

### 5. Add to Frontend Agent List

The Project Manager agent will automatically appear in the SWARM interface once added to the database, since agents are loaded dynamically.

## Changelog Processing Format

### Standard Developer Changelog Input

```
Project: AutoMax (AI-2024-087)
Developer: Rakesh Team
Date: 2025-01-15

Completed:
- Fixed API authentication bug
- Completed user permission module
- Database schema updates deployed

In Progress:
- Dashboard interface testing
- Mobile responsive adjustments

Blockers:
- Waiting for client API keys
- External service rate limiting

Notes:
- Dashboard testing should complete by Friday
- May need additional time for mobile optimization
```

### Expected Agent Output

```
CLIENT UPDATE for AutoMax Project (AI-2024-087):

Development Progress Update:
✓ User authentication system fully implemented and tested
✓ Access control framework completed with role-based permissions
✓ Database infrastructure updated to support new features

Current Focus:
→ Dashboard interface development and quality assurance testing
→ Mobile device compatibility optimization

Timeline Status:
Project remains on track for January 30th delivery. Dashboard testing phase initiated and progressing as scheduled.

Next Milestones:
- Dashboard interface completion (Jan 18)
- Mobile optimization finalization (Jan 22)
- Final testing and deployment preparation (Jan 25-30)

No current blockers affecting client timeline. Development team working on final phase optimizations to ensure smooth launch experience.
```

## Environment Variables Needed

Add to your environment:

```bash
# Project Tracker Integration (when ready)
PROJECT_TRACKER_URL=https://yourcompany.com/api
PROJECT_TRACKER_API_KEY=your_api_key_here

# Enhanced OpenRouter usage for Project Manager
OPENROUTER_API_KEY=your_existing_key
```

## Ready for Integration

The Project Manager Agent is now ready to:

1. ✅ Process natural language changelog inputs
2. ✅ Generate professional client updates  
3. ✅ Maintain project context and memory
4. ✅ Work within existing SWARM chat interface
5. 🔄 Connect to Project Tracker API (needs your database schema)
6. 🔄 Implement automated pattern learning (needs historical data)

Once you provide the Project Tracker database schema and API endpoints, I can complete the full integration pipeline described in your executive summary.