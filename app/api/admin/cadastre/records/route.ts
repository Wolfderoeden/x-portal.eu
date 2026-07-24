import { NextResponse } from "next/server";
import { requireAdminApi } from "../../../../../lib/admin-auth";
import { getDatabase } from "../../../../../lib/database";

export async function GET(request: Request) {
  const admin = await requireAdminApi(["owner", "operations", "compliance", "viewer"]);
  if (!admin) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const country = searchParams.get("country")?.toUpperCase() ?? "";
  const reference = searchParams.get("reference")?.trim() ?? "";
  const limit = Math.min(Math.max(Number(searchParams.get("limit") ?? 25), 1), 100);

  if (country && !["UA", "PL", "SK", "HU", "RO"].includes(country)) {
    return NextResponse.json({ message: "Invalid country" }, { status: 400 });
  }

  try {
    const db = getDatabase();
    const referenceQuery = `%${reference}%`;
    const rows = await db.sql`
      SELECT
        r.id, r.country, r.cadastral_reference, r.municipality,
        r.area_sqm, r.geometry, r.source_url, r.source_checked_at,
        r.verification_status, r.created_at, r.updated_at,
        s.authority, s.registry_name, s.access_mode
      FROM cadastre_records r
      JOIN cadastre_sources s ON s.id = r.source_id
      WHERE (${country} = '' OR r.country = ${country})
        AND (${reference} = '' OR r.cadastral_reference ILIKE ${referenceQuery})
      ORDER BY r.updated_at DESC
      LIMIT ${limit}
    `;
    return NextResponse.json({ records: rows });
  } catch {
    return NextResponse.json(
      { message: "The cadastral datastore is not connected." },
      { status: 503 },
    );
  }
}
