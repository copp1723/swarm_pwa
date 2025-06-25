#!/usr/bin/env node

/**
 * SWARM Data Export Script
 * Exports all database content for migration to new environment
 */

import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import fs from 'fs';
import path from 'path';

// Construct database connection
let connectionString;
if (process.env.PGHOST && process.env.PGUSER && process.env.PGPASSWORD) {
  connectionString = `postgresql://${process.env.PGUSER}:${process.env.PGPASSWORD}@${process.env.PGHOST}:${process.env.PGPORT}/${process.env.PGDATABASE}`;
} else {
  connectionString = process.env.DATABASE_URL;
}

if (!connectionString) {
  console.error('❌ No database connection string available');
  process.exit(1);
}

const sql = postgres(connectionString, { ssl: 'require' });

async function exportData() {
  try {
    console.log('🔄 Starting data export...');
    
    const exportData = {
      timestamp: new Date().toISOString(),
      version: '1.0',
      data: {}
    };

    // Export users
    console.log('📥 Exporting users...');
    const users = await sql`SELECT * FROM users ORDER BY id`;
    exportData.data.users = users;
    console.log(`✓ Exported ${users.length} users`);

    // Export conversations
    console.log('📥 Exporting conversations...');
    const conversations = await sql`SELECT * FROM conversations ORDER BY id`;
    exportData.data.conversations = conversations;
    console.log(`✓ Exported ${conversations.length} conversations`);

    // Export messages
    console.log('📥 Exporting messages...');
    const messages = await sql`SELECT * FROM messages ORDER BY id`;
    exportData.data.messages = messages;
    console.log(`✓ Exported ${messages.length} messages`);

    // Export memories
    console.log('📥 Exporting memories...');
    const memories = await sql`SELECT * FROM memories ORDER BY id`;
    exportData.data.memories = memories;
    console.log(`✓ Exported ${memories.length} memories`);

    // Export files
    console.log('📥 Exporting files...');
    const files = await sql`SELECT * FROM files ORDER BY id`;
    exportData.data.files = files;
    console.log(`✓ Exported ${files.length} files`);

    // Export agent configs
    console.log('📥 Exporting agent configurations...');
    const agentConfigs = await sql`SELECT * FROM agent_configs ORDER BY id`;
    exportData.data.agent_configs = agentConfigs;
    console.log(`✓ Exported ${agentConfigs.length} agent configurations`);

    // Create export directory if it doesn't exist
    const exportDir = path.join(process.cwd(), 'exports');
    if (!fs.existsSync(exportDir)) {
      fs.mkdirSync(exportDir, { recursive: true });
    }

    // Write export file
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const exportPath = path.join(exportDir, `swarm-export-${timestamp}.json`);
    
    fs.writeFileSync(exportPath, JSON.stringify(exportData, null, 2));
    
    console.log('✅ Export completed successfully!');
    console.log(`📁 Export saved to: ${exportPath}`);
    console.log(`📊 Total records exported: ${
      users.length + conversations.length + messages.length + 
      memories.length + files.length + agentConfigs.length
    }`);

    // Create import script template
    const importScript = `#!/usr/bin/env node

/**
 * SWARM Data Import Script
 * Run this in your new environment to restore data
 */

const { drizzle } = require('drizzle-orm/postgres-js');
const postgres = require('postgres');
const fs = require('fs');

// Update this with your new database connection string
const connectionString = process.env.DATABASE_URL || 'postgresql://user:password@localhost:5432/swarm';

async function importData() {
  const sql = postgres(connectionString);
  
  try {
    const exportData = JSON.parse(fs.readFileSync('./swarm-export-${timestamp}.json', 'utf8'));
    
    console.log('🔄 Starting data import...');
    
    // Import in correct order (respecting foreign keys)
    if (exportData.data.users.length > 0) {
      await sql\`INSERT INTO users \${sql(exportData.data.users)}\`;
    }
    if (exportData.data.conversations.length > 0) {
      await sql\`INSERT INTO conversations \${sql(exportData.data.conversations)}\`;
    }
    if (exportData.data.messages.length > 0) {
      await sql\`INSERT INTO messages \${sql(exportData.data.messages)}\`;
    }
    if (exportData.data.memories.length > 0) {
      await sql\`INSERT INTO memories \${sql(exportData.data.memories)}\`;
    }
    if (exportData.data.files.length > 0) {
      await sql\`INSERT INTO files \${sql(exportData.data.files)}\`;
    }
    if (exportData.data.agent_configs.length > 0) {
      await sql\`INSERT INTO agent_configs \${sql(exportData.data.agent_configs)} ON CONFLICT (name) DO NOTHING\`;
    }
    
    console.log('✅ Import completed successfully!');
  } catch (error) {
    console.error('❌ Import failed:', error);
  } finally {
    await sql.end();
  }
}

importData();
`;

    const importPath = path.join(exportDir, `import-to-new-db.js`);
    fs.writeFileSync(importPath, importScript);
    
    console.log(`🔧 Import script created: ${importPath}`);
    console.log('\n📋 Migration Instructions:');
    console.log('1. Copy the export file and import script to your new environment');
    console.log('2. Set up your new PostgreSQL database');
    console.log('3. Run the database schema creation (npm run db:push)');
    console.log('4. Update the connection string in the import script');
    console.log('5. Run: node import-to-new-db.js');

  } catch (error) {
    console.error('❌ Export failed:', error);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

exportData();