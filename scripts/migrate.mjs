import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import postgres from "postgres";

const databaseUrl =
  process.env.DATABASE_URL ?? process.env.SUPABASE_DATABASE_URL;

if (!databaseUrl) {
  console.log("Database migration skipped: no PostgreSQL URL configured.");
  process.exit(0);
}

const migrationRoot = join(
  process.cwd(),
  "netlify",
  "database",
  "migrations",
);
const folders = (await readdir(migrationRoot, { withFileTypes: true }))
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name)
  .sort();
const sql = postgres(databaseUrl, {
  max: 1,
  connect_timeout: 10,
  prepare: false,
});

try {
  await sql`
    CREATE TABLE IF NOT EXISTS xportal_schema_migrations (
      migration_name TEXT PRIMARY KEY,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;

  for (const folder of folders) {
    const alreadyApplied = await sql`
      SELECT 1
      FROM xportal_schema_migrations
      WHERE migration_name = ${folder}
      LIMIT 1
    `;
    if (alreadyApplied.length) continue;

    const source = await readFile(
      join(migrationRoot, folder, "migration.sql"),
      "utf8",
    );
    await sql.begin(async (transaction) => {
      await transaction.unsafe(source);
      await transaction`
        INSERT INTO xportal_schema_migrations (migration_name)
        VALUES (${folder})
      `;
    });
    console.log(`Applied database migration: ${folder}`);
  }
} finally {
  await sql.end();
}
