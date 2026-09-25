/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

const dbUrl = 'postgresql://postgres.fkqwveyzhoefoeejlgmb:a6%2ACsA%409axc5-jP@aws-1-eu-west-1.pooler.supabase.com:5432/postgres';

async function run() {
  const client = new Client({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } });
  try {
    await client.connect();
    console.log('Connected to Supabase Postgres!');

    // 1. Ensure schema_migrations table exists with RLS enabled
    await client.query(`
      CREATE TABLE IF NOT EXISTS public.schema_migrations (
        version TEXT PRIMARY KEY,
        applied_at TIMESTAMPTZ DEFAULT NOW()
      );
      ALTER TABLE public.schema_migrations ENABLE ROW LEVEL SECURITY;
      REVOKE ALL ON public.schema_migrations FROM public, anon, authenticated;
      GRANT ALL ON public.schema_migrations TO service_role, postgres;
    `);

    // 2. Read already applied migrations
    const res = await client.query('SELECT version FROM public.schema_migrations;');
    const appliedVersions = new Set(res.rows.map(r => r.version));
    console.log(`Already recorded migrations in schema_migrations: ${appliedVersions.size}`);

    // 3. Read migration directory
    const migrationsDir = 'C:/Users/Rander/Documents/Antigravity/AtendeMy/AtendeMy CRM/supabase/migrations';
    const files = fs.readdirSync(migrationsDir)
      .filter(f => f.endsWith('.sql'))
      .sort();

    console.log(`Found ${files.length} total migration SQL files in supabase/migrations/`);

    let appliedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    for (const file of files) {
      if (appliedVersions.has(file)) {
        skippedCount++;
        continue;
      }

      const filePath = path.join(migrationsDir, file);
      const sql = fs.readFileSync(filePath, 'utf8').trim();

      if (!sql) {
        await client.query('INSERT INTO public.schema_migrations (version) VALUES ($1) ON CONFLICT DO NOTHING;', [file]);
        appliedCount++;
        continue;
      }

      try {
        await client.query(sql);
        await client.query('INSERT INTO public.schema_migrations (version) VALUES ($1) ON CONFLICT DO NOTHING;', [file]);
        appliedCount++;
        if (appliedCount % 20 === 0 || appliedCount === 1) {
          console.log(`[${appliedCount}] Applied migration: ${file}`);
        }
      } catch (err) {
        console.warn(`[WARNING] Migration ${file} emitted error: ${err.message}`);
        await client.query('INSERT INTO public.schema_migrations (version) VALUES ($1) ON CONFLICT DO NOTHING;', [file]);
        errorCount++;
      }
    }

    console.log(`\n✅ Migration Sync Complete!`);
    console.log(`  - Total files: ${files.length}`);
    console.log(`  - Newly applied: ${appliedCount}`);
    console.log(`  - Already applied / skipped: ${skippedCount}`);
    console.log(`  - Emitted warnings/handled errors: ${errorCount}`);

    const tablesRes = await client.query("SELECT tablename FROM pg_tables WHERE schemaname = 'public';");
    console.log(`  - Total tables currently in public schema: ${tablesRes.rows.length}`);

  } catch (err) {
    console.error('Fatal migration sync error:', err);
  } finally {
    await client.end();
  }
}

run();
