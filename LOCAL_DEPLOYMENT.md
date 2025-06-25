# SWARM Local Deployment Guide

This guide helps you migrate your SWARM application from Replit to your local environment.

## Prerequisites

- Node.js 20+ installed
- PostgreSQL 16+ installed locally
- Git (to clone the repository)

## Migration Steps

### 1. Export Data from Replit
```bash
# Run this in your Replit environment before migrating
node export-data.js
```
This creates an `exports/` directory with your data and import script.

### 2. Set Up Local Environment

```bash
# Clone or download your project
git clone <your-repo-url>
cd swarm

# Install dependencies
npm install

# Install PostgreSQL locally (if not already installed)
# macOS: brew install postgresql
# Ubuntu: sudo apt-get install postgresql postgresql-contrib
# Windows: Download from postgresql.org
```

### 3. Configure Local Database

```bash
# Start PostgreSQL service
# macOS: brew services start postgresql
# Ubuntu: sudo systemctl start postgresql
# Windows: Start via Services or pgAdmin

# Create database
createdb swarm

# Create user (optional)
createuser --interactive swarm_user
```

### 4. Environment Configuration

Create `.env` file:
```env
# Database Configuration
DATABASE_URL=postgresql://username:password@localhost:5432/swarm

# OpenRouter API Key (Required)
OPENROUTER_API_KEY=your_openrouter_api_key_here

# Server Configuration
PORT=5000
NODE_ENV=development

# Optional: SuperMemory Integration
SUPERMEMORY_API_KEY=your_supermemory_key
```

### 5. Database Schema Setup

```bash
# Push database schema
npm run db:push
```

### 6. Import Your Data

```bash
# Copy your export files from Replit to local exports/ directory
# Update the database connection in import-to-new-db.js if needed
node exports/import-to-new-db.js
```

### 7. Start Local Development

```bash
npm run dev
```

Your SWARM application will be available at `http://localhost:5000`

## Key Differences: Local vs Replit

| Feature | Replit | Local |
|---------|--------|-------|
| Database | Managed PostgreSQL | Self-hosted PostgreSQL |
| SSL | Auto-configured | Not required for localhost |
| Environment | Cloud | Your machine |
| Backups | Automatic | Manual (recommend pg_dump) |
| Scaling | Managed | Manual |

## Production Deployment Options

### Option 1: VPS (DigitalOcean, Linode, etc.)
- Full control over environment
- Manual SSL setup required
- PostgreSQL installation needed

### Option 2: Cloud Platforms
- **Vercel/Netlify**: Frontend only (need separate DB)
- **Railway/Render**: Full-stack with managed database
- **AWS/GCP**: Maximum flexibility and scalability

### Option 3: Hybrid Approach
- Frontend on Vercel/Netlify
- Backend on Railway/Render
- Database on Neon/Supabase

## Backup Strategy

```bash
# Regular database backup
pg_dump swarm > backup-$(date +%Y%m%d).sql

# Restore from backup
psql swarm < backup-20250625.sql
```

## Troubleshooting

### Database Connection Issues
- Verify PostgreSQL is running: `pg_isready`
- Check connection string format
- Ensure database exists: `psql -l`

### Missing Dependencies
- Run `npm install` if packages are missing
- Check Node.js version: `node --version`

### Port Conflicts
- Change PORT in .env if 5000 is occupied
- Check running processes: `lsof -i :5000`

## SuperMemory Integration

SuperMemory works seamlessly across environments:
- No migration needed for SuperMemory data
- Same API key works locally and in production
- Context and memory features remain intact

## Support

Your SWARM application is designed to work identically whether deployed locally or in the cloud. The agent configurations, models, and all functionality remain the same across environments.