# Project Tracker API Configuration

## Environment Variables Setup

Add these environment variables to configure SWARM's Project Tracker integration:

```bash
# Project Tracker API Configuration - LIVE
PROJECT_TRACKER_URL=https://workspace--josh735.replit.app
PROJECT_TRACKER_API_KEY=7a1ae5c268ac1ed1b49317180057d3773cb7e678725ad0772d10d60e53c26c60

# Development URL (for testing)
# PROJECT_TRACKER_URL=https://b970d072-8dc9-4d39-ac12-e6b6697d22c2-00-toc8o7t8iris.spock.replit.dev

# Optional: Timeout configuration (default: 10000ms)
PROJECT_TRACKER_TIMEOUT=10000
```

## Project Tracker API Requirements

Your Project Tracker system needs these REST API endpoints:

### 1. Update Project Endpoint
```
PATCH /projects/{projectCode}
Authorization: Bearer {api_key}
Content-Type: application/json

Body:
{
  "progressPercentage": 75,
  "statusMessage": "User authentication complete, dashboard testing initiated",
  "phaseChange": false,
  "completedTasks": ["API authentication", "User permissions"],
  "inProgressTasks": ["Dashboard testing"],
  "blockers": [],
  "estimatedCompletion": "2025-01-30"
}
```

### 2. Get Project Endpoint
```
GET /projects/{projectCode}
Authorization: Bearer {api_key}

Response:
{
  "projectCode": "AI-2024-087",
  "clientName": "AutoMax Solutions",
  "title": "Custom CRM System",
  "status": "development",
  "phase": 3,
  "progressPercentage": 65,
  "startDate": "2024-11-15",
  "estimatedCompletion": "2025-01-30",
  "description": "Custom CRM with advanced analytics"
}
```

### 3. Refresh Customer Page Endpoint
```
POST /projects/{projectCode}/refresh
Authorization: Bearer {api_key}

Response:
{
  "success": true,
  "message": "Customer page refreshed"
}
```

### 4. Health Check Endpoint
```
GET /health
Authorization: Bearer {api_key}

Response:
{
  "status": "healthy",
  "version": "1.0.0"
}
```

## Current Status

Run this command to check Project Tracker configuration:

```bash
curl -X POST http://localhost:5000/api/rpc \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "method": "project_tracker_status",
    "params": {},
    "id": 1
  }'
```

Expected response when not configured:
```json
{
  "configured": false,
  "baseUrl": "Not configured",
  "connectionStatus": {
    "success": false,
    "message": "Project Tracker not configured. Set PROJECT_TRACKER_URL and PROJECT_TRACKER_API_KEY."
  }
}
```

## Testing Integration

Once configured, test with a changelog:

```bash
curl -X POST http://localhost:5000/api/rpc \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "method": "project_manager_chat",
    "params": {
      "message": "Process this changelog: AutoMax AI-2024-087 - API complete, testing started",
      "projectCode": "AI-2024-087",
      "autoProcess": true
    },
    "id": 1
  }'
```

The Project Manager Agent will:
1. Parse the changelog
2. Generate professional client update
3. Send update to Project Tracker API (if configured)
4. Return structured response with processing results

## Project Code Formats

Supports multiple project code formats:
- Legacy: `AI-YYYY-###` (AI-2024-087)
- New: `PROJ-####` (PROJ-0001)
- Custom: `AUTOMAX-CRM-2024-001`

Examples: `AI-2024-087`, `PROJ-0001`, `AUTOMAX-CRM-2024-001`