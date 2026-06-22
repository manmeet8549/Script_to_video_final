// Destructive: backs up all public tables to JSON, drops & recreates the public
// schema (restoring Supabase grants), applies migrations, backfills profiles
// from auth.users, and bootstraps the first owner.
// Usage: node --env-file=.env.local scripts/reset-and-migrate.mjs you@example.com
import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import pg from "pg";

const ownerEmail = process.argv[2] || null;
const url = process.env.DIRECT_URL || process.env.DATABASE_URL;
if (!url) {
  console.error("DIRECT_URL is not set.");
  process.exit(1);
}

const client = new pg.Client({ connectionString: url, ssl: { rejectUnauthorized: false } });
await client.connect();

try {
  // 1) Backup every public table to a timestamped JSON file.
  const { rows: tables } = await client.query(
    "select table_name from information_schema.tables where table_schema='public' and table_type='BASE TABLE' order by table_name",
  );
  const backup = {};
  for (const { table_name } of tables) {
    const { rows } = await client.query(`select * from public."${table_name}"`);
    backup[table_name] = rows;
  }
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const backupFile = join(process.cwd(), `db-backup-${stamp}.json`);
  writeFileSync(backupFile, JSON.stringify(backup, null, 2));
  const totalRows = Object.values(backup).reduce((n, r) => n + r.length, 0);
  console.log(`Backed up ${tables.length} tables (${totalRows} rows) → ${backupFile}`);

  // 2) Reset the public schema and restore default Supabase grants.
  console.log("Resetting public schema ...");
  await client.query(`
    drop schema public cascade;
    create schema public;
    grant usage on schema public to postgres, anon, authenticated, service_role;
    grant all on all tables in schema public to postgres, anon, authenticated, service_role;
    grant all on all routines in schema public to postgres, anon, authenticated, service_role;
    grant all on all sequences in schema public to postgres, anon, authenticated, service_role;
    alter default privileges for role postgres in schema public grant all on tables to postgres, anon, authenticated, service_role;
    alter default privileges for role postgres in schema public grant all on routines to postgres, anon, authenticated, service_role;
    alter default privileges for role postgres in schema public grant all on sequences to postgres, anon, authenticated, service_role;
  `);

  // 3) Apply migrations in order.
  const dir = join(process.cwd(), "supabase", "migrations");
  for (const file of readdirSync(dir).filter((f) => f.endsWith(".sql")).sort()) {
    process.stdout.write(`Applying ${file} ... `);
    await client.query(readFileSync(join(dir, file), "utf8"));
    console.log("OK");
  }

  // 4) Backfill profiles for existing auth.users so current accounts work.
  const { rowCount: backfilled } = await client.query(`
    insert into public.profiles (id, email, full_name)
    select id, email, coalesce(raw_user_meta_data->>'full_name', raw_user_meta_data->>'name')
    from auth.users
    on conflict (id) do nothing;
  `);
  console.log(`Backfilled ${backfilled} profile(s) from auth.users.`);

  // 5) Bootstrap the owner (platform_owner flag + workspace + owner membership).
  if (ownerEmail) {
    const { rows } = await client.query("select public.bootstrap_owner($1) as workspace_id", [
      ownerEmail.toLowerCase(),
    ]);
    console.log(`Bootstrapped owner ${ownerEmail} → workspace ${rows[0].workspace_id}`);
  } else {
    console.log("No owner email passed; skipping bootstrap. Run bootstrap_owner() later.");
  }

  console.log("\nReset + migrate complete.");
} catch (err) {
  console.error("\nFAILED:", err.message);
  process.exitCode = 1;
} finally {
  await client.end();
}
