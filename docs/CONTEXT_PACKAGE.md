# Complete Context Package for Gemini CLI Integration

## Essential Files for Review (Priority Order)

### 1. Project Foundation
```
replit.md                     # User preferences, architecture, complete project history
README.md                     # Project overview
QUICK_START.md               # Setup instructions
```

### 2. Core Agent System
```
server/services/agents.ts          # Main agent logic - processAgentRequest()
server/handlers/agent-handlers.ts  # API handlers - sendMessageHandler
shared/schema.ts                   # Database types and schemas
```

### 3. Architecture Patterns
```
server/lib/route-registry.ts       # API routing patterns to follow
server/routes.ts                   # JSON-RPC structure
server/handlers/mcp-handlers.ts    # MCP integration patterns
```

### 4. Supporting Systems
```
server/storage.ts                  # Database operations
server/services/email.ts          # Service pattern example
client/src/components/ChatArea/    # UI components for reference
```

## Key Context Points

### Current Agent Architecture
- 6 specialized agents with distinct personalities
- Multi-agent coordination via @mentions
- Per-agent model selection (GPT-4, Claude, DeepSeek, etc.)
- Built-in memory integration with SuperMemory
- Fallback systems for database unavailability

### Integration Points for Gemini CLI
1. **Enhanced Coder Agent**: Add CLI as optional enhancement
2. **MCP System**: Use existing filesystem operations
3. **Fallback Pattern**: Always preserve current functionality
4. **Error Handling**: Follow existing APIError patterns

### User Requirements
- Professional marble/grey aesthetic
- Simple interface without complexity
- Executive ESTJ communication style
- Multi-agent collaboration maintained
- Stability prioritized over features

## Implementation Checklist

### Phase 1: Core Service
- [ ] Create `server/services/gemini-cli.ts`
- [ ] Add authentication handling (API key vs OAuth)
- [ ] Implement CLI process management
- [ ] Add availability checks and error handling

### Phase 2: Agent Integration
- [ ] Modify `server/services/agents.ts` Coder agent
- [ ] Add CLI enhancement toggle
- [ ] Preserve existing OpenRouter fallback
- [ ] Maintain multi-agent coordination

### Phase 3: Enhanced Capabilities
- [ ] Multi-file code analysis
- [ ] Architecture planning features
- [ ] Integration with @mentions system
- [ ] Performance optimization

## Critical Success Metrics
1. **Zero Breaking Changes**: Existing functionality preserved
2. **Graceful Degradation**: CLI unavailable = normal operation
3. **Consistent UX**: User shouldn't notice complexity increase
4. **Performance**: Response times maintained or improved

## Environment Setup
```env
# New variables needed
GEMINI_API_KEY=sk-...
GEMINI_CLI_ENABLED=true

# Existing variables (context)
OPENROUTER_API_KEY=...
DATABASE_URL=...
```

## Return Package Requirements
1. Modified files with clear change documentation
2. New service files with comprehensive comments
3. Configuration instructions
4. Testing validation steps
5. Performance impact assessment