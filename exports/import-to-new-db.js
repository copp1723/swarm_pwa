#!/usr/bin/env node

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
    const exportData = JSON.parse(fs.readFileSync('./swarm-export-2025-06-25T20-50-52-060Z.json', 'utf8'));
    
    console.log('🔄 Starting data import...');
    
    // Import in correct order (respecting foreign keys)
    if (exportData.data.users.length > 0) {
      await sql`INSERT INTO users ${sql(exportData.data.users)}`;
    }
    if (exportData.data.conversations.length > 0) {
      await sql`INSERT INTO conversations ${sql(exportData.data.conversations)}`;
    }
    if (exportData.data.messages.length > 0) {
      await sql`INSERT INTO messages ${sql(exportData.data.messages)}`;
    }
    if (exportData.data.memories.length > 0) {
      await sql`INSERT INTO memories ${sql(exportData.data.memories)}`;
    }
    if (exportData.data.files.length > 0) {
      await sql`INSERT INTO files ${sql(exportData.data.files)}`;
    }
    if (exportData.data.agent_configs.length > 0) {
      await sql`INSERT INTO agent_configs ${sql(exportData.data.agent_configs)} ON CONFLICT (name) DO NOTHING`;
    }
    
    console.log('✅ Import completed successfully!');
  } catch (error) {
    console.error('❌ Import failed:', error);
  } finally {
    await sql.end();
  }
}

importData();
