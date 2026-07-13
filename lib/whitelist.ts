import { getDeployStore, getStore } from "@netlify/blobs";

export type WhitelistEntry = {
  id: string;
  fullName: string;
  email: string;
  country: string;
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
}) {
  const entry: WhitelistEntry = {
    id: crypto.randomUUID(),
    fullName: input.fullName,
    email: input.email,
    country: input.country,
    createdAt: new Date().toISOString(),
  };

  const key = `entries/${entry.createdAt}-${entry.id}`;
  await whitelistStore().setJSON(key, entry);
}

export async function listWhitelistEntries(): Promise<WhitelistEntry[]> {
  const store = whitelistStore();
  const { blobs } = await store.list({ prefix: "entries/" });
  const entries = await Promise.all(
    blobs.map((blob) => store.get(blob.key, { type: "json" })),
  );

  return entries
    .filter((entry): entry is WhitelistEntry => Boolean(entry?.id && entry?.email))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}
