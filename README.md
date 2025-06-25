# SWARM - Multi-Agent AI Collaboration Platform

A sophisticated personal productivity platform featuring specialized AI agents that collaborate intelligently on complex tasks.

## Features

- **6 Specialized Agents**: Communication, Coder, Analyst, Writer, Email, Project Manager
- **Multi-Agent Collaboration**: Use @mentions to coordinate multiple agents
- **Model Selection**: Choose optimal AI models per agent (GPT-4, Claude, DeepSeek, etc.)
- **SuperMemory Integration**: Enhanced context and memory across conversations
- **Project Tracker API**: Automated client progress updates

## Quick Start

See [QUICK_START.md](QUICK_START.md) for 5-minute local setup.

## Repository Structure

```
swarm/
├── client/                 # React frontend
├── server/                 # Express backend
├── shared/                 # Shared TypeScript schemas
├── docs/                   # Documentation
├── exports/                # Data migration files
├── attached_assets/        # Development assets
└── package.json
```

## Development

```bash
npm install
npm run dev
```

## Migration

For Replit to local migration, see [LOCAL_DEPLOYMENT.md](LOCAL_DEPLOYMENT.md).

## Architecture

Built with React, Express, PostgreSQL, and OpenRouter AI integration for a modern, scalable multi-agent system.