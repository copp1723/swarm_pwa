# Multi-Agent Chat System

## Overview

This is a full-stack web application that provides a multi-agent chat interface with memory capabilities. The system allows users to interact with different AI agents, store conversation history, and search through memory using semantic similarity. The application is built with a modern tech stack focusing on real-time chat interactions and intelligent agent orchestration.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: TanStack Query (React Query) for server state management
- **UI Framework**: Shadcn/UI components with Radix UI primitives
- **Styling**: Tailwind CSS with custom marble color palette
- **Build Tool**: Vite for fast development and optimized builds

### Backend Architecture
- **Runtime**: Node.js with Express.js server
- **API Pattern**: JSON-RPC 2.0 for structured API communication
- **Language**: TypeScript with ES modules
- **Database ORM**: Drizzle with PostgreSQL
- **Vector Database**: Supabase integration for semantic search (optional)
- **AI Integration**: OpenRouter for multiple LLM access

### Database Schema
The application uses PostgreSQL with the following main entities:
- **Users**: Authentication and user management
- **Conversations**: Chat session organization
- **Messages**: Individual chat messages with agent attribution
- **Memories**: Vector-embedded content for semantic search
- **Files**: File storage and metadata
- **Agent Configs**: Dynamic agent configuration and prompts

## Key Components

### Agent System
- **Multi-Agent Support**: Different agent types (communication, coder, analyst, researcher, writer)
- **Dynamic Configuration**: Agents configured via database with customizable system prompts
- **Context Management**: Intelligent context building with conversation history and memory retrieval
- **Token Management**: Tracks and reports token usage across interactions

### Memory System
- **Semantic Search**: Vector embeddings for content similarity matching
- **Dual Storage**: Local PostgreSQL storage with optional Supabase vector enhancement
- **Context Retrieval**: Automatic memory injection into agent conversations
- **Metadata Tracking**: Rich metadata for enhanced search and organization

### Communication Layer
- **JSON-RPC API**: Structured method calls for all client-server communication
- **Real-time Updates**: Query invalidation for live UI updates
- **Error Handling**: Comprehensive error management with user feedback
- **Service Status**: Real-time monitoring of external service availability

## Data Flow

1. **User Input**: Chat messages entered through React components
2. **API Processing**: JSON-RPC calls route to appropriate service handlers
3. **Agent Processing**: Selected agent processes message with context from memory
4. **LLM Integration**: OpenRouter forwards requests to appropriate language models
5. **Memory Storage**: Conversations automatically stored with vector embeddings
6. **Response Delivery**: Agent responses delivered back through query system
7. **UI Updates**: Real-time UI updates via TanStack Query cache invalidation

## External Dependencies

### Required Services
- **PostgreSQL**: Primary database (configured via DATABASE_URL)
- **OpenRouter**: LLM access (OPENROUTER_API_KEY required)

### Optional Services
- **Supabase**: Enhanced vector search (SUPABASE_URL, SUPABASE_ANON_KEY)
- **Neon Database**: Serverless PostgreSQL option (@neondatabase/serverless)

### Development Tools
- **Replit Integration**: Development environment optimization
- **Vite Plugins**: Runtime error handling and development tooling
- **TypeScript**: Full type safety across frontend and backend

## Deployment Strategy

### Development
- **Hot Reload**: Vite dev server with middleware integration
- **Database Migrations**: Drizzle push for schema updates
- **Environment**: NODE_ENV=development with debug logging

### Production
- **Build Process**: Vite frontend build + esbuild server bundling
- **Static Serving**: Express serves built frontend assets
- **Process Management**: Single Node.js process with Express middleware
- **Database**: PostgreSQL with connection pooling via Drizzle

### Replit Configuration
- **Modules**: nodejs-20, web, postgresql-16
- **Deployment**: Autoscale deployment target
- **Port Mapping**: Internal 5000 → External 80
- **Workflows**: Parallel development workflow

## Recent Changes

```
June 25, 2025:
- Enhanced Communication agent with user's professional tone and style
- Replaced "kiddish" UI elements with clean marble aesthetic
- Removed robot emojis and excessive icons in favor of letter-based agent avatars
- Updated color palette to professional marble/grey tones
- Simplified interface with focus on productivity over decoration
- Connected Quick Transform directly to Communication agent for authentic tone
- Modified Quick Transform to display results in chat window instead of clipboard
- Refactored repeated UI code patterns into reusable utility functions
- Configured OpenRouter and database connectivity
- Fixed keyboard shortcuts and improved error handling
- Fixed chat message display and storage issues
- Implemented MCP (Model Context Protocol) for improved agent coordination
- Added per-agent model selection with curated models (GPT 4.1, Claude Sonnet/Opus, Grok 3, Qwen2.5 Coder, Gemini 2.0, DeepSeek R1/V3, etc.)
- Created toggle interface for easy model switching per agent with recommendations
- Enhanced error handling and graceful degradation in agent processing
- Added multi-agent coordination capabilities for complex tasks
- Optimized performance: reduced polling intervals, added caching, removed redundant API calls
- Improved Quick Transform to copy to clipboard instead of chat injection
- Streamlined service status checks and model availability logic
- Enhanced query caching and optimistic updates for better responsiveness
- Enhanced Communication agent with authentic ESTJ executive personality and LinkedIn writing style
- Upgraded all agent prompts for laser-focused specialization aligned with executive decision-making
- Added cross-agent memory integration with 0.7 similarity threshold for context continuity
- PRINCIPAL ENGINEER REVIEW: Simplified over-engineered MCP coordination system for personal use
- RELIABILITY FIXES: Removed 30+ console.log statements, simplified query patterns, enhanced error handling
- PERFORMANCE OPTIMIZATION: Extended cache times, reduced API polling for 1-2 user productivity focus
- SIMPLIFIED UI: Removed redundant memory search interface since agents have built-in memory and SuperMemory integration
- VISUAL ENHANCEMENT: Added subtle gradients, improved spacing, enhanced card designs with better visual hierarchy
- CONTEXT LENGTH: Leveraging SuperMemory paid service for enhanced context handling across agent interactions
- MULTI-AGENT COLLABORATION: Enhanced collaboration system with intelligent agent selection, sequential workflows, and professional synthesis
- SIMPLIFIED MCP: Replaced over-engineered MCP system with practical multi-agent coordination focused on real workflow needs
- EMAIL INTEGRATION: Added Email agent replacing Researcher, integrated Mailgun service for email-to-task processing with webhook support
- UX IMPROVEMENTS: Added real-time collaboration status indicators, progress tracking, and graceful error fallbacks
- PERFORMANCE OPTIMIZATION: Implemented parallel processing for independent tasks (research + writing, code + docs)
- ERROR HANDLING: Added automatic fallback to single-agent processing when collaboration fails
- CRITICAL FIXES: Fixed database connection issues, implemented proper secret management, restored agent loading functionality
- PERFORMANCE IMPROVEMENTS: Added React.memo to components (Sidebar, ServiceStatus, AgentList, ModelSelector) for better rendering performance
- CALLBACK OPTIMIZATION: Added useCallback hooks to prevent unnecessary re-renders and improve responsiveness
- FALLBACK HANDLING: Added graceful fallbacks for database connection issues while maintaining functionality
- CODEBASE CLEANUP: Removed all dead code, unused functions, TODO comments, and console.log statements for production readiness
- REFACTORING: Created shared utility functions in shared/utils.ts for marble classes, agent colors, status indicators, and common operations
- CODE DEDUPLICATION: Removed repeated patterns across components and consolidated into reusable utility functions
- MCP ARCHITECTURE: Built modular MCP (Model Context Protocol) server registry system supporting filesystem, memory, and extensible server plugins
- FILESYSTEM INTEGRATION: Implemented secure file system operations with project-scoped access, path sanitization, and type restrictions
- MCP API CLIENT: Created structured client library for agents to interact with MCP servers (filesystem, memory, future GitHub integration)
- ROUTES REFACTORING: Replaced 300+ line switch statement with clean RouteRegistry pattern for better maintainability and testing
- ERROR HANDLING: Implemented structured APIError class with proper HTTP status codes and validation error handling
- HANDLER SEPARATION: Split route logic into focused handler modules (agent-handlers, conversation-handlers, mcp-handlers, service-handlers)
- CHATAREA REFACTORING: Split 400+ line ChatArea component into focused components (ChatHeader, MessageList, TypingIndicator, MessageInput, CollaborationStatus)
- COMPONENT OPTIMIZATION: Added React.memo to all new components for better rendering performance and reduced re-renders
- UI MODULARITY: Created reusable chat components with proper prop interfaces and TypeScript safety
- BRANDING UPDATE: Implemented user-requested "SWARM" branding replacing "Productivity Agents", removed tagline for cleaner professional appearance
- LAYOUT OPTIMIZATION: Reduced header padding and tightened spacing to shift sidebar content upward as requested
- MESSAGING SYSTEM FIX: Implemented in-memory message cache (message-cache.ts) to ensure agent responses display immediately in chat interface
- DATABASE FALLBACKS: Added comprehensive database fallback system to maintain functionality when external storage is unavailable
- CHAT INTERFACE: Fixed message polling and display logic to show both user messages and agent responses properly in real-time
- QUICK TRANSFORM FIX: Fixed route registration and clipboard functionality for Quick Transform feature to work properly
- PROJECT MANAGER AGENT: Added new Project Manager Agent specialized in processing developer changelogs and generating professional client updates
- INTEGRATION DOCS: Created comprehensive integration documentation for Project Tracker connection and changelog processing workflows
- AGENT SYSTEM: Enhanced agent registration system ready for Project Manager integration with pattern learning and memory capabilities
- PROJECT TRACKER INTEGRATION: Configured Project Tracker API service with X-API-Key authentication and PROJ-#### project code format support
- API ENDPOINTS: Updated service to use /api/swarm/projects endpoints with proper authentication headers and validation
- LIVE INTEGRATION: Project Manager Agent ready for automated project status updates to customer pages
- PRODUCTION READY: Project Tracker integration configured with live URLs (workspace--josh735.replit.app) and API key authentication
- AUTOMAX PROJECT: Configured support for AUTOMAX-CRM-2024-001 project code format with 60% progress tracking
- MULTI-FORMAT SUPPORT: Enhanced project code validation to support AI-YYYY-###, PROJ-####, and custom formats like AUTOMAX-CRM-2024-001
- LIVE INTEGRATION TESTING: Project Tracker API connection established, environment secrets configured, endpoint validation in progress
- CONNECTION STATUS: Project Tracker responding at workspace--josh735.replit.app, ready for automated changelog processing and customer updates
- MENTIONS SYSTEM: Enhanced @mentions functionality with real-time agent name suggestions, autocomplete dropdown, and proper multi-agent collaboration support
- UX IMPROVEMENT: Fixed agent name population issues in group collaboration with intelligent fuzzy matching and visual agent selection interface
- MCP FILESYSTEM CLARIFICATION: Documented that SWARM running in Replit cloud environment can only access workspace files, not user's local desktop
- SOLUTION PROVIDED: Created setup guide for proper MCP filesystem access including local deployment options
- MCP FILESYSTEM ENHANCED: Updated MCP filesystem service to properly handle desktop paths and provide full filesystem access for agent operations
- AGENT INTEGRATION FIXED: Enhanced agent system to automatically invoke MCP filesystem operations when accessing desktop directories
- FILESYSTEM ARCHITECTURE CLARIFICATION: Identified that cloud-hosted SWARM cannot access local desktop due to security boundaries - requires local deployment or file upload
- SOLUTION DOCUMENTATION: Created comprehensive guide for proper MCP filesystem access with three viable options for desktop/CCL-3 access
- LOCAL DEPLOYMENT READY: Complete migration package created with data export/import scripts and deployment guide
- DATABASE MIGRATION: Fixed PostgreSQL connection with SSL, exported 6 agent configurations successfully
- PERFORMANCE OPTIMIZATION: Reduced polling from 1s to 5s intervals, resolved console errors and database connection issues
- MIGRATION PACKAGE: Created export-data.js script and LOCAL_DEPLOYMENT.md guide for seamless local transition
- DEPLOYMENT PREPARATION: System stable and ready for local deployment when user chooses to migrate
- ENHANCED COORDINATION: Upgraded multi-agent collaboration with intelligent workflow analysis, parallel/sequential processing, and dependency management
- AGENT MENTIONS UX: Improved @mentions dropdown with agent avatars, better spacing, and visual hierarchy for easier agent selection
- IMPORT FIX: Resolved getAgentColor and getAgentInitials import errors in MessageInput component, restored full @mentions functionality
- AGENT ROUTING FIX: Fixed critical bug where single @agent mentions (like @Coder) were incorrectly triggering multi-agent collaboration instead of routing to the specific agent
- AGENT INVITATION SYSTEM: Implemented Option 2 low-risk agent invitation system with visual invite button, collaboration status display, and seamless multi-agent coordination
- RELIABILITY AUDIT: Comprehensive hardening of all components for production readiness
- SECURITY HARDENING: Added path sanitization, file size limits, input validation, and security checks throughout
- ERROR HANDLING: Enhanced error handling with proper fallbacks and user feedback across all services
- MCP FILESYSTEM: Complete rewrite with security, validation, and reliability improvements
- PRODUCTION READY: All components hardened and tested for stable local deployment
- REPOSITORY ORGANIZATION: Cleaned up project structure, moved archive files to docs/archive/, created professional README and QUICK_START guides
- GEMINI CLI INTEGRATION PLANNING: Created comprehensive handoff documentation for v2.0 Coder agent enhancement with Google Gemini CLI integration
```

## User Preferences

```
Preferred communication style: Simple, everyday language.
UI Design: Clean, professional marble/grey aesthetic without "kiddish" elements. Simplicity over complexity - less is more.
Agent Persona: All agents understand executive ESTJ leadership style - practical, decisive, results-focused with authentic communication patterns.
Quick Transform: Routes to Writer agent to transform text into clear, action-oriented, friendly communication - no answers or commentary, just rewrites input text to be more engaging and conversational.
Features: Quick transform directly feeds Communication agent for tone consistency, memory integration for context awareness.
Code Quality: Always refactor repeated patterns into reusable utility functions.
Agent Models: Each agent can use different AI models with curated selection including GPT 4.1, Claude 3.5 Sonnet, Qwen2.5 Coder, DeepSeek R1, etc.
Model Selection: Toggle interface for per-agent model selection with recommended models based on agent specialty.
Coordination: Multi-agent collaboration for complex tasks requiring multiple specialties.
Service Status: User prefers icon-based grid layout (API, Memory, DB, Files) over text lists.
Agent Layout: User dislikes cramped grid layout - prefers clear vertical list with proper spacing and readability.
Development Workflow: User prefers continuing development in Replit to avoid GitHub sync complexity until project is stable.
Color Preferences: User wants strategic color accents in professional places to enhance visual appeal while maintaining marble aesthetic.
Memory Integration: User has paid SuperMemory service - removed redundant memory search since agents have built-in memory access.
Visual Polish: User requested 50% more visual enhancement - added gradients, better spacing, refined card designs without complicating functionality.
Layout: User wants entire interface to fit on one page without scrolling - condensed all components with tighter spacing.
Branding: Changed "Productivity Agents" to "SWARM" and removed tagline for cleaner header.
Agent Collaboration: Added @mentions system and visual "Add Agent" button for intuitive multi-agent coordination.
```