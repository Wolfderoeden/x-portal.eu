import { NextResponse } from "next/server";
import { listPublishedProperties } from "../../../../lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const properties = await listPublishedProperties();

    return NextResponse.json(
      {
        type: "FeatureCollection",
        status: "connected",
        features: properties.filter((property) => property.geometry).map((property) => ({
          type: "Feature",
          id: property.id,
          geometry: property.geometry,
          properties: {
            slug: property.slug,
            title: property.titleEn,
            country: property.country,
            region: property.region,
            municipality: property.municipality,
            cadastralReference: property.cadastralReference,
            areaSqm: property.areaSqm,
            commercialUse: property.commercialUse,
            status: property.status,
            checkedAt: property.cadastralCheckedAt,
            integrity: {
              algorithm: property.integrity.algorithm,
              fingerprint: property.integrity.fingerprint,
              recordMatches: property.integrity.recordMatches,
              anchorStatus: property.integrity.anchorStatus,
              anchorNetwork: property.integrity.anchorNetwork,
              anchorTxHash: property.integrity.anchorTxHash,
              anchorSlot: property.integrity.anchorSlot,
              anchorRecordedAt: property.integrity.anchorRecordedAt,
            },
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
