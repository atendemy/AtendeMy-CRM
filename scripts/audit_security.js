const { Client } = require('pg');

const dbUrl = 'postgresql://postgres.fkqwveyzhoefoeejlgmb:a6%2ACsA%409axc5-jP@aws-1-eu-west-1.pooler.supabase.com:5432/postgres';

async function run() {
  const client = new Client({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } });
  try {
    await client.connect();
    
    console.log('--- 1. Tables in public without RLS ---');
    const noRls = await client.query(`
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'public' AND rowsecurity = false;
    `);
    console.log('Tables without RLS count:', noRls.rows.length);
    console.log('Tables without RLS names:', noRls.rows.map(r => r.tablename));

    console.log('\n--- 2. Security Definer functions without search_path set ---');
    const mutableSearchPath = await client.query(`
      SELECT p.proname, pg_get_function_identity_arguments(p.oid) as args
      FROM pg_proc p
      JOIN pg_namespace n ON p.pronamespace = n.oid
      WHERE n.nspname = 'public' 
        AND p.prosecdef = true 
        AND (p.proconfig IS NULL OR NOT (p.proconfig::text[] @> ARRAY['search_path=public, pg_temp']));
    `);
    console.log('Security definer functions needing search_path count:', mutableSearchPath.rows.length);
    console.log('Sample functions needing search_path:', mutableSearchPath.rows.slice(0, 20).map(r => `${r.proname}(${r.args})`));

    console.log('\n--- 3. Functions in public executable by anon or public ---');
    const publicExec = await client.query(`
      SELECT p.proname, pg_get_function_identity_arguments(p.oid) as args
      FROM pg_proc p
      JOIN pg_namespace n ON p.pronamespace = n.oid
      WHERE n.nspname = 'public'
        AND (has_function_privilege('anon', p.oid, 'EXECUTE') OR has_function_privilege('public', p.oid, 'EXECUTE'));
    `);
    console.log('Functions executable by anon or public count:', publicExec.rows.length);

  } catch (err) {
    console.error('Audit error:', err);
  } finally {
    await client.end();
  }
}

run();
