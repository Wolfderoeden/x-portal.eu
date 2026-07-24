import { NextResponse } from "next/server";
import { getDatabase } from "../../../../lib/database";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const db = getDatabase();
    const rows = await db.sql`
      SELECT
        id, slug, title_en, country, region, municipality,
        cadastral_reference, area_sqm, commercial_use, status,
        geometry, cadastral_checked_at
      FROM properties
      WHERE published = TRUE
        AND verification_status = 'verified'
        AND status IN ('available', 'reserved')
        AND geometry IS NOT NULL
      ORDER BY updated_at DESC
    `;

    return NextResponse.json(
      {
        type: "FeatureCollection",
        status: "connected",
        features: rows.map((row) => ({
          type: "Feature",
          id: String(row.id),
          geometry: row.geometry,
          properties: {
            slug: String(row.slug),
            title: String(row.title_en),
            country: String(row.country),
            region: String(row.region),
            municipality: String(row.municipality),
            cadastralReference: String(row.cadastral_reference),
            areaSqm: Number(row.area_sqm),
            commercialUse: String(row.commercial_use),
            status: String(row.status),
            checkedAt: row.cadastral_checked_at ? String(row.cadastral_checked_at) : null,
          },
        })),
      },
      {
        headers: {
          "Cache-Control": "public, max-age=60, stale-while-revalidate=300",
        },
      },
    );
  } catch {
    return NextResponse.json(
      {
        type: "FeatureCollection",
        status: "unconfigured",
        message: "The verified parcel datastore is not connected yet.",
        features: [],
      },
      {
        headers: {
          "Cache-Control": "public, max-age=30, stale-while-revalidate=60",
        },
      },
    );
  }
}
