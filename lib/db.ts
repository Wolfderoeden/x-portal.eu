import { getDatabase } from "./database";
import type { Property, Reservation } from "./domain";
import { buildPropertyIntegrity } from "./property-integrity";

type PropertyRow = {
  id: string;
  slug: string;
  title_en: string;
  title_de: string;
  country: string;
  region: string;
  municipality: string;
  cadastral_reference: string;
  cadastral_source_url: string | null;
  cadastral_checked_at: string | null;
  geometry: Property["geometry"];
  area_sqm: string | number;
  commercial_use: string;
  development_parameters: string;
  restrictions: string;
  utilities: Property["utilities"];
  price_eur_cents: string | number;
  deposit_eur_cents: string | number;
  price_source: string;
  verification_status: Property["verificationStatus"];
  risk_notes: string;
  status: Property["status"];
  published: boolean;
  created_at: string;
  updated_at: string;
  data_fingerprint: string | null;
  fingerprint_algorithm: string | null;
  anchor_network: string | null;
  anchor_tx_hash: string | null;
  anchor_slot: string | number | null;
  anchor_recorded_at: string | null;
};

function mapProperty(row: PropertyRow): Property {
  const property = {
    id: row.id,
    slug: row.slug,
    titleEn: row.title_en,
    titleDe: row.title_de,
    country: row.country,
    region: row.region,
    municipality: row.municipality,
    cadastralReference: row.cadastral_reference,
    cadastralSourceUrl: row.cadastral_source_url,
    cadastralCheckedAt: row.cadastral_checked_at,
    geometry: row.geometry,
    areaSqm: Number(row.area_sqm),
    commercialUse: row.commercial_use,
    developmentParameters: row.development_parameters,
    restrictions: row.restrictions,
    utilities: row.utilities,
    priceEurCents: Number(row.price_eur_cents),
    depositEurCents: Number(row.deposit_eur_cents),
    priceSource: row.price_source,
    verificationStatus: row.verification_status,
    riskNotes: row.risk_notes,
    status: row.status,
    published: row.published,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  } satisfies Omit<Property, "integrity">;

  return {
    ...property,
    integrity: buildPropertyIntegrity({
      ...property,
      storedDataFingerprint: row.data_fingerprint,
      fingerprintAlgorithm: row.fingerprint_algorithm,
      anchorNetwork: row.anchor_network,
      anchorTxHash: row.anchor_tx_hash,
      anchorSlot: row.anchor_slot === null ? null : Number(row.anchor_slot),
      anchorRecordedAt: row.anchor_recorded_at,
    }),
  };
}

export async function listPublishedProperties(): Promise<Property[]> {
  const db = getDatabase();
  const rows = await db.sql`
    SELECT * FROM properties
    WHERE published = TRUE
      AND status IN ('available', 'reserved')
      AND verification_status = 'verified'
    ORDER BY status = 'available' DESC, updated_at DESC
  `;
  return (rows as unknown as PropertyRow[]).map(mapProperty);
}

export async function listAllProperties(): Promise<Property[]> {
  const db = getDatabase();
  const rows = await db.sql`SELECT * FROM properties ORDER BY updated_at DESC`;
  return (rows as unknown as PropertyRow[]).map(mapProperty);
}

export async function getPropertyBySlug(slug: string): Promise<Property | null> {
  const db = getDatabase();
  const rows = await db.sql`
    SELECT * FROM properties
    WHERE slug = ${slug}
      AND published = TRUE
      AND verification_status = 'verified'
    LIMIT 1
  `;
  return rows[0] ? mapProperty(rows[0] as unknown as PropertyRow) : null;
}

export async function getPropertyById(id: string): Promise<Property | null> {
  const db = getDatabase();
  const rows = await db.sql`SELECT * FROM properties WHERE id = ${id} LIMIT 1`;
  return rows[0] ? mapProperty(rows[0] as unknown as PropertyRow) : null;
}

export async function dashboardCounts() {
  const db = getDatabase();
  const [properties, reservations, compliance] = await Promise.all([
    db.sql`SELECT COUNT(*)::int AS count FROM properties`,
    db.sql`SELECT COUNT(*)::int AS count FROM reservations`,
    db.sql`SELECT COUNT(*)::int AS count FROM compliance_checks WHERE status <> 'approved'`,
  ]);
  return {
    properties: Number(properties[0]?.count ?? 0),
    reservations: Number(reservations[0]?.count ?? 0),
    compliance: Number(compliance[0]?.count ?? 0),
  };
}

export async function listReservations(): Promise<Reservation[]> {
  const db = getDatabase();
  const rows = await db.sql`
    SELECT
      r.id,
      r.property_id,
      p.title_en AS property_title,
      r.buyer_name,
      r.buyer_email,
      r.buyer_company,
      r.buyer_country,
      r.status,
      r.document_status,
      r.created_at
    FROM reservations r
    JOIN properties p ON p.id = r.property_id
    ORDER BY r.created_at DESC
  `;
  return rows.map((row) => ({
    id: String(row.id),
    propertyId: String(row.property_id),
    propertyTitle: String(row.property_title),
    buyerName: String(row.buyer_name),
    buyerEmail: String(row.buyer_email),
    buyerCompany: String(row.buyer_company),
    buyerCountry: String(row.buyer_country),
    status: String(row.status),
    documentStatus: String(row.document_status),
    createdAt: String(row.created_at),
  }));
}

export async function writeAuditEvent(input: {
  actor: string;
  role: string;
  action: string;
  entityType: string;
  entityId?: string | null;
  before?: unknown;
  after?: unknown;
}) {
  const db = getDatabase();
  await db.sql`
    INSERT INTO audit_log
      (actor, role, action, entity_type, entity_id, before_state, after_state)
    VALUES
      (${input.actor}, ${input.role}, ${input.action}, ${input.entityType},
       ${input.entityId ?? null}, ${JSON.stringify(input.before ?? null)}::jsonb,
       ${JSON.stringify(input.after ?? null)}::jsonb)
  `;
}
