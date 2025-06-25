# MCP Filesystem Access Setup

## Current Limitation

SWARM is running in a Replit cloud environment, which means it can only access files within the workspace directory `/home/runner/workspace`. It cannot directly access your local desktop or other directories on your personal machine.

## Solutions for Desktop Access

### Option 1: Upload Project Files
- Upload your CCL-3 project files to the `attached_assets/` directory
- Or create a new directory in the workspace for your project
- SWARM can then analyze the actual files

### Option 2: Run SWARM Locally
To have full MCP filesystem access to your desktop:

1. Clone this SWARM repository to your local machine
2. Install dependencies: `npm install`
3. Set up environment variables (DATABASE_URL, OPENROUTER_API_KEY)
4. Run locally: `npm run dev`
5. SWARM will then have access to your entire filesystem

### Option 3: MCP Server Configuration
For remote desktop access, you would need to configure an MCP server on your local machine that SWARM can connect to. This requires:

- Running an MCP filesystem server locally
- Configuring network access between Replit and your machine
- Setting up authentication and security

## Current MCP Capabilities

Within the Replit workspace, SWARM can:
- Read/write/list files in the workspace
- Access project structure
- Analyze code files
- Create documentation

## Recommendation

For immediate assistance with your CCL-3 project:
1. Upload the key project files (package.json, tsconfig.json, main source files)
2. SWARM will analyze the actual code and create proper documentation
3. You can then download the generated README and use it locally