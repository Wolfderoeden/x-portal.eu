import postgres, { type Sql } from "postgres";

let client: Sql | undefined;

function connectionUrl() {
  return process.env.DATABASE_URL ?? process.env.SUPABASE_DATABASE_URL;
}

export function getDatabase() {
  const url = connectionUrl();
  if (!url) {
    throw new Error(
      "PostgreSQL is not configured. Set DATABASE_URL or SUPABASE_DATABASE_URL.",
    );
  }

  client ??= postgres(url, {
    max: 1,
    idle_timeout: 20,
    connect_timeout: 10,
    prepare: false,
  });

  return { sql: client };
}
