const { Client } = require('pg');

const dbUrl = 'postgresql://postgres.fkqwveyzhoefoeejlgmb:a6%2ACsA%409axc5-jP@aws-1-eu-west-1.pooler.supabase.com:5432/postgres';

async function run() {
  const client = new Client({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } });
  try {
    await client.connect();
    console.log('Connected to Supabase Postgres!');

    // 1. Fix Security Definer search_path warnings
    console.log('\n--- 1. Setting search_path on Security Definer functions ---');
    const secDefFns = await client.query(`
      SELECT p.proname, pg_get_function_identity_arguments(p.oid) as args
      FROM pg_proc p
      JOIN pg_namespace n ON p.pronamespace = n.oid
      WHERE n.nspname = 'public' 
        AND p.prosecdef = true;
    `);

    let secDefFixed = 0;
    for (const fn of secDefFns.rows) {
      const sql = `ALTER FUNCTION public."${fn.proname}"(${fn.args}) SET search_path = public, pg_temp;`;
      try {
        await client.query(sql);
        secDefFixed++;
      } catch (err) {
        console.warn(`Could not set search_path for ${fn.proname}(${fn.args}): ${err.message}`);
      }
    }
    console.log(`Successfully updated search_path on ${secDefFixed} security definer functions.`);

    // 2. Revoke execute on custom fn_* functions from anon & public
    console.log('\n--- 2. Revoking EXECUTE from public & anon on custom fn_* functions ---');
    const customFns = await client.query(`
      SELECT p.proname, pg_get_function_identity_arguments(p.oid) as args
      FROM pg_proc p
      JOIN pg_namespace n ON p.pronamespace = n.oid
      WHERE n.nspname = 'public' 
        AND p.proname LIKE 'fn_%';
    `);

    let revokedFixed = 0;
    for (const fn of customFns.rows) {
      const sqlRevoke = `REVOKE EXECUTE ON FUNCTION public."${fn.proname}"(${fn.args}) FROM public, anon;`;
      const sqlGrant = `GRANT EXECUTE ON FUNCTION public."${fn.proname}"(${fn.args}) TO authenticated, service_role;`;
      try {
        await client.query(sqlRevoke);
        await client.query(sqlGrant);
        revokedFixed++;
      } catch (err) {
        console.warn(`Could not revoke/grant for ${fn.proname}(${fn.args}): ${err.message}`);
      }
    }
    console.log(`Successfully secured execution permissions on ${revokedFixed} custom fn_* functions.`);

    console.log('\n✅ Security Hardening Complete!');

  } catch (err) {
    console.error('Fatal hardening error:', err);
  } finally {
    await client.end();
  }
}

run();
