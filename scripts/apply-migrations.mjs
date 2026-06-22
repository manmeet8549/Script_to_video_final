// One-off migration runner: applies supabase/migrations/*.sql in order using
// DIRECT_URL. Usage: node --env-file=.env.local scripts/apply-migrations.mjs
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import pg from "pg";

const url = process.env.DIRECT_URL || process.env.DATABASE_URL;
if (!url) {
  console.error("DIRECT_URL (or DATABASE_URL) is not set.");
  process.exit(1);
}

const dir = join(process.cwd(), "supabase", "migrations");
const files = readdirSync(dir).filter((f) => f.endsWith(".sql")).sort();

const client = new pg.Client({ connectionString: url, ssl: { rejectUnauthorized: false } });

try {
  await client.connect();
  for (const file of files) {
    const sql = readFileSync(join(dir, file), "utf8");
    process.stdout.write(`Applying ${file} ... `);
    await client.query(sql);
    console.log("OK");
  }
  console.log("\nAll migrations applied.");
} catch (err) {
  console.error("\nMigration failed:", err.message);
  process.exitCode = 1;
} finally {
  await client.end();
}
