import { normalizeCadastralReference } from "./cadastre-knowledge";
import { getDatabase } from "./database";
import type { GeoJsonGeometry } from "./domain";

export async function upsertCadastreRecord(input: {
  country: string;
  reference: string;
  municipality?: string | null;
  geometry: GeoJsonGeometry;
  areaSqm?: number | null;
  sourceUrl: string;
  checkedAt: string;
  verificationStatus: "resolved" | "review" | "verified";
  createdBy: string;
  sourcePayload?: unknown;
}) {
  const db = getDatabase();
  const normalizedReference = normalizeCadastralReference(
    input.country,
    input.reference,
  );
  const rows = await db.sql`
    INSERT INTO cadastre_records (
      source_id, country, cadastral_reference, normalized_reference,
      municipality, geometry, area_sqm, source_url, source_payload,
      source_checked_at, verification_status, created_by
    )
    SELECT
      s.id, ${input.country}, ${input.reference}, ${normalizedReference},
      ${input.municipality ?? null}, ${JSON.stringify(input.geometry)}::jsonb,
      ${input.areaSqm ?? null}, ${input.sourceUrl},
      ${JSON.stringify(input.sourcePayload ?? null)}::jsonb,
      ${input.checkedAt}, ${input.verificationStatus}, ${input.createdBy}
    FROM cadastre_sources s
    WHERE s.country = ${input.country}
    ON CONFLICT (country, normalized_reference) DO UPDATE SET
      municipality = COALESCE(EXCLUDED.municipality, cadastre_records.municipality),
      geometry = EXCLUDED.geometry,
      area_sqm = COALESCE(EXCLUDED.area_sqm, cadastre_records.area_sqm),
      source_id = EXCLUDED.source_id,
      source_url = EXCLUDED.source_url,
      source_payload = EXCLUDED.source_payload,
      source_checked_at = EXCLUDED.source_checked_at,
      verification_status = EXCLUDED.verification_status,
      updated_at = NOW()
    RETURNING id
  `;
  if (!rows[0]) throw new Error("Cadastral source is not configured");
  return String(rows[0].id);
}
