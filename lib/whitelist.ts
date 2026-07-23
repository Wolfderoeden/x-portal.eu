import { getDeployStore, getStore } from "@netlify/blobs";
import { getDatabase } from "@netlify/database";

export type WhitelistEntry = {
  id: string;
  fullName: string;
  email: string;
  country: string;
  company?: string;
  createdAt: string;
};

function whitelistStore() {
  if (process.env.CONTEXT === "production") {
    return getStore("xportal-whitelist", { consistency: "strong" });
  }

  return getDeployStore("xportal-whitelist");
}

export async function addWhitelistEntry(input: {
  fullName: string;
  email: string;
  country: string;
  company?: string;
}) {
  const entry: WhitelistEntry = {
    id: crypto.randomUUID(),
    fullName: input.fullName,
    email: input.email,
    country: input.country,
    company: input.company ?? "",
    createdAt: new Date().toISOString(),
  };

  try {
    const db = getDatabase();
    await db.sql`
      INSERT INTO whitelist_leads (id, full_name, email, country, company, consent_at, created_at)
      VALUES (${entry.id}, ${entry.fullName}, ${entry.email}, ${entry.country},
        ${entry.company ?? ""}, ${entry.createdAt}, ${entry.createdAt})
      ON CONFLICT (LOWER(email)) DO UPDATE
      SET full_name = EXCLUDED.full_name,
          country = EXCLUDED.country,
          company = EXCLUDED.company,
          consent_at = EXCLUDED.consent_at
    `;
  } catch {
    const key = `entries/${entry.createdAt}-${entry.id}`;
    await whitelistStore().setJSON(key, entry);
  }
}

export async function listWhitelistEntries(): Promise<WhitelistEntry[]> {
  const entries: WhitelistEntry[] = [];
  try {
    const db = getDatabase();
    const rows = await db.sql`SELECT * FROM whitelist_leads ORDER BY created_at DESC`;
    entries.push(...rows.map((row) => ({
      id: String(row.id),
      fullName: String(row.full_name),
      email: String(row.email),
      country: String(row.country),
      company: String(row.company ?? ""),
      createdAt: String(row.created_at),
    })));
  } catch {
    // The database is provisioned by Netlify on deploy. Legacy Blob leads remain readable.
  }
  try {
    const store = whitelistStore();
    const { blobs } = await store.list({ prefix: "entries/" });
    const blobEntries = await Promise.all(
      blobs.map((blob) => store.get(blob.key, { type: "json" })),
    );
    entries.push(
      ...blobEntries.filter(
        (entry): entry is WhitelistEntry => Boolean(entry?.id && entry?.email),
      ),
    );
  } catch {
    // Local builds do not have Netlify Blob credentials.
  }

  return entries
    .filter(
      (entry, index, all) =>
        all.findIndex((candidate) => candidate.email === entry.email) === index,
    )
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}
