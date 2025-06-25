# SWARM - Quick Start Guide

A multi-agent AI collaboration platform for personal productivity.

## Prerequisites

- **Node.js 20+** - [Download](https://nodejs.org/)
- **PostgreSQL 16+** - [Download](https://postgresql.org/download/)
- **OpenRouter API Key** - [Get yours](https://openrouter.ai/)

## Local Setup (5 minutes)

### 1. Clone & Install
```bash
git clone <your-repo-url>
cd swarm
npm install
```

### 2. Database Setup
```bash
# Start PostgreSQL
# macOS: brew services start postgresql
# Ubuntu: sudo systemctl start postgresql
# Windows: Start via Services

# Create database
createdb swarm
```

### 3. Environment Configuration
Create `.env` file:
```env
# Database
DATABASE_URL=postgresql://username:password@localhost:5432/swarm

# Required: OpenRouter API Key
OPENROUTER_API_KEY=your_key_here

# Optional
PORT=5000
NODE_ENV=development
```

### 4. Initialize Database
```bash
npm run db:push
```

### 5. Start Application
```bash
npm run dev
```

Visit **http://localhost:5000**

## Migration from Replit

If migrating from Replit, run the export script first:
```bash
node export-data.js
node exports/import-to-new-db.js
```

## Agent Capabilities

- **Communication** - Executive business communication
- **Coder** - Software development and debugging  
- **Analyst** - Data analysis and insights
- **Writer** - Content creation and documentation
- **Email** - Email management and processing
- **Project Manager** - Changelog processing and client updates

## Key Features

- Multi-agent collaboration via @mentions
- Per-agent model selection (GPT-4, Claude, DeepSeek, etc.)
- SuperMemory integration for enhanced context
- Real-time conversation management
- Project tracker API integration

## Troubleshooting

**Database Connection**
```bash
# Test connection
psql -d swarm -c "SELECT version();"
```

**Port Issues**
```bash
# Check if port 5000 is in use
lsof -i :5000
```

**Missing Dependencies**
```bash
npm install
```

## Production Deployment

For production deployment options, see [LOCAL_DEPLOYMENT.md](LOCAL_DEPLOYMENT.md)

---

**Support**: Your SWARM application maintains full functionality across environments.