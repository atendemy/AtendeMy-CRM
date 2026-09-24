const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

const dbUrl = 'postgresql://postgres.fkqwveyzhoefoeejlgmb:a6%2ACsA%409axc5-jP@aws-1-eu-west-1.pooler.supabase.com:5432/postgres';

async function run() {
  const client = new Client({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } });
  try {
    await client.connect();
    console.log('Enabling extensions...');
    await client.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp";');
    await client.query('CREATE EXTENSION IF NOT EXISTS "pgcrypto";');
    await client.query('CREATE EXTENSION IF NOT EXISTS "vector" CASCADE;');
    await client.query('CREATE EXTENSION IF NOT EXISTS "citext" CASCADE;');
    await client.query('CREATE EXTENSION IF NOT EXISTS "pg_trgm" CASCADE;');
    console.log('Extensions enabled successfully!');

    console.log('Reading baseline.sql...');
    const baselinePath = 'C:/Users/Rander/Documents/Antigravity/AtendeMy/AtendeMy CRM/supabase/baseline.sql';
    const sql = fs.readFileSync(baselinePath, 'utf8');
    
    console.log('Executing baseline.sql (this may take a few seconds)...');
    await client.query(sql);
    console.log('baseline.sql applied successfully!');

    const res = await client.query("SELECT tablename FROM pg_tables WHERE schemaname = 'public';");
    console.log('Total tables created in public schema:', res.rows.length);
  } catch (err) {
    console.error('Migration error:', err);
  } finally {
    await client.end();
  }
}

run();
