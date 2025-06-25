# Gemini CLI Integration - Development Handoff Package

## Project Context

SWARM is a multi-agent AI collaboration platform with 6 specialized agents (Communication, Coder, Analyst, Writer, Email, Project Manager). The system uses React frontend, Express backend, PostgreSQL database, and OpenRouter for AI model integration.

**Goal**: Integrate Google's Gemini CLI to enhance the Coder agent with advanced code analysis and multi-file operations.

## Current Architecture Overview

### Key Files to Review

**Core System Files:**
- `replit.md` - Complete project context and user preferences
- `server/services/agents.ts` - Main agent service logic
- `server/handlers/agent-handlers.ts` - API request handlers
- `shared/schema.ts` - Database schema and types
- `server/lib/route-registry.ts` - API routing system

**Agent System:**
- `server/services/agents.ts:AgentService.processAgentRequest()` - Main entry point
- Multi-agent coordination via @mentions
- Per-agent model selection (GPT-4, Claude, DeepSeek, etc.)
- Built-in memory integration and context management

**MCP System (Model Context Protocol):**
- `server/handlers/mcp-handlers.ts` - MCP API handlers
- `server/services/mcp/` - MCP server implementations
- Existing filesystem operations and memory integration

### Current Coder Agent Capabilities

```typescript
// From server/services/agents.ts
const AGENT_PROMPTS = {
  coder: `You are an expert software engineer and architect...`
  // Current: Code review, debugging, architecture advice
  // Target: Add Gemini CLI integration for enhanced capabilities
}
```

## Integration Requirements

### Phase 1: Basic Integration (3-4 weeks)

**New Service Implementation:**
```typescript
// server/services/gemini-cli.ts
export class GeminiCLIService {
  async isAvailable(): Promise<boolean>
  async executeCommand(prompt: string, projectPath?: string): Promise<string>
  async analyzeCodebase(path: string): Promise<CodeAnalysis>
  async generateCode(prompt: string, context: string[]): Promise<GeneratedCode>
}
```

**Enhanced Coder Agent:**
- Add optional Gemini CLI integration to existing Coder agent
- Fallback to current OpenRouter-based processing if CLI unavailable
- Maintain existing multi-agent coordination patterns

### Technical Specifications

**Dependencies to Add:**
```json
{
  "@google/gemini-cli": "latest",
  "child_process": "built-in"
}
```

**Environment Variables:**
```env
GEMINI_API_KEY=sk-...  # From Google AI Studio
GEMINI_CLI_ENABLED=true
```

**Integration Points:**
1. Extend `server/services/agents.ts:AgentService.processSingleAgentRequest()`
2. Add Gemini CLI option to Coder agent processing
3. Use existing MCP filesystem for file operations
4. Maintain current error handling and fallback patterns

## Implementation Strategy

### Low-Risk Approach

**Step 1: Service Layer**
- Create `GeminiCLIService` with basic command execution
- Add availability checks and error handling
- Implement authentication flow

**Step 2: Agent Integration**
- Modify Coder agent to optionally use Gemini CLI
- Add toggle mechanism in agent configuration
- Preserve existing functionality as fallback

**Step 3: Enhanced Capabilities**
- Multi-file analysis and refactoring
- Architecture planning and code generation
- Integration with existing @mentions system

### File Structure

```
server/
├── services/
│   ├── agents.ts              # Modify: Add Gemini CLI integration
│   └── gemini-cli.ts          # New: Core service
├── handlers/
│   └── agent-handlers.ts      # Modify: Add CLI-enhanced endpoints
└── lib/
    └── gemini-cli-bridge.ts   # New: CLI process management
```

## Key Context for Implementation

### User Preferences (from replit.md)
- Simple, professional interface without complexity
- Stability over new features during development
- Executive ESTJ communication style across all agents
- Multi-agent collaboration via @mentions
- Per-agent model selection maintained

### Existing Patterns to Follow
- JSON-RPC API structure in `server/routes.ts`
- Error handling via `APIError` class
- Agent coordination in `AgentService.processCollaborativeRequest()`
- MCP integration patterns in `server/handlers/mcp-handlers.ts`

### Critical Success Factors
1. **Maintain Existing UX**: User shouldn't notice complexity increase
2. **Gradual Enhancement**: Start with code analysis, expand to generation
3. **Robust Fallbacks**: Always fall back to current Coder agent if CLI fails
4. **Security**: Proper authentication and file system access controls

## Expected Deliverables

### Phase 1 MVP
- `GeminiCLIService` with basic command execution
- Enhanced Coder agent with optional CLI integration
- Configuration toggle for enabling/disabling feature
- Comprehensive error handling and logging

### Testing Requirements
- Unit tests for `GeminiCLIService`
- Integration tests with existing agent system
- Fallback mechanism validation
- Performance impact assessment

## Handoff Questions for Implementation Agent

1. Authentication preference: API key vs OAuth flow?
2. CLI process management: Persistent vs per-request execution?
3. File system security: Project-scoped vs full access?
4. Error handling: Silent fallback vs user notification?
5. Configuration: Environment variables vs database settings?

## Post-Implementation Integration

When returning the implementation:
1. Provide updated files with clear change markers
2. Include configuration instructions
3. Document new environment variables needed
4. Provide testing steps and validation checklist
5. Highlight any architectural decisions made during implementation

---

**Project Repository**: All code lives in workspace root, not `/repo/`
**Current Status**: System stable, database optimized, ready for enhancement
**Timeline**: 3-4 week implementation for basic integration