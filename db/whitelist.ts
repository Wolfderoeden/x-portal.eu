import { env } from "cloudflare:workers";

export type WhitelistEntry = {
  id: string;
  fullName: string;
  email: string;
  country: string;
  createdAt: string;
};

async function getWhitelistDb() {
  const db = env.DB;
  if (!db) throw new Error("The whitelist database is unavailable.");

  await db.batch([
    db.prepare(`
      CREATE TABLE IF NOT EXISTS whitelist_entries (
        id TEXT PRIMARY KEY,
        full_name TEXT NOT NULL,
        email TEXT NOT NULL COLLATE NOCASE UNIQUE,
        country TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `),
    db.prepare(`
      CREATE INDEX IF NOT EXISTS whitelist_created_at_idx
      ON whitelist_entries (created_at DESC)
    `),
  ]);

  return db;
}

export async function addWhitelistEntry(input: {
  fullName: string;
  email: string;
  country: string;
}) {
  const db = await getWhitelistDb();
  await db
    .prepare(`
      INSERT INTO whitelist_entries (id, full_name, email, country)
      VALUES (?, ?, ?, ?)
      ON CONFLICT(email) DO UPDATE SET
        full_name = excluded.full_name,
        country = excluded.country
    `)
    .bind(crypto.randomUUID(), input.fullName, input.email, input.country)
    .run();
}

export async function listWhitelistEntries(): Promise<WhitelistEntry[]> {
  const db = await getWhitelistDb();
  const result = await db
    .prepare(`
      SELECT
        id,
        full_name AS fullName,
        email,
        country,
        created_at AS createdAt
      FROM whitelist_entries
      ORDER BY created_at DESC
    `)
    .all<WhitelistEntry>();

  return result.results;
}
