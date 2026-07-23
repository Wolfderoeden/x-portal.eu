import { getDatabase } from "@netlify/database";
import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminApi } from "../../../../lib/admin-auth";
import { writeAuditEvent } from "../../../../lib/db";

const propertySchema = z.object({
  titleEn: z.string().min(4).max(160),
  titleDe: z.string().min(4).max(160),
  country: z.enum(["UA", "PL", "SK", "HU", "RO"]),
  region: z.string().min(2).max(120),
  municipality: z.string().min(2).max(120),
  cadastralReference: z.string().min(3).max(180),
  cadastralSourceUrl: z.string().url().or(z.literal("")),
  cadastralCheckedAt: z.string().datetime().or(z.literal("")),
  geometry: z.string().min(20),
  areaSqm: z.coerce.number().positive().max(1_000_000_000),
  commercialUse: z.string().min(3).max(500),
  developmentParameters: z.string().max(2000),
  restrictions: z.string().max(2000),
  priceEur: z.coerce.number().positive().max(10_000_000_000),
  depositEur: z.coerce.number().positive().max(100_000_000),
  priceSource: z.string().min(3).max(500),
  riskNotes: z.string().max(3000),
  status: z.enum(["draft", "review", "available", "reserved", "sold"]),
  verificationStatus: z.enum([
    "unverified",
    "documents-pending",
    "legal-review",
    "verified",
    "blocked",
  ]),
});

function slugify(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 90);
}

function redirectTo(path: string) {
  return new NextResponse(null, { status: 303, headers: { Location: path } });
}

export async function POST(request: Request) {
  const admin = await requireAdminApi(["owner", "operations"]);
  if (!admin) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const form = await request.formData();
  const parsed = propertySchema.safeParse(Object.fromEntries(form.entries()));
  if (!parsed.success) return redirectTo("/admin/properties/new?error=validation");

  let geometry: unknown;
  try {
    geometry = JSON.parse(parsed.data.geometry);
    const type = (geometry as { type?: string }).type;
    if (!["Polygon", "MultiPolygon"].includes(type ?? "")) throw new Error();
  } catch {
    return redirectTo("/admin/properties/new?error=geometry");
  }

  const utilities = {
    road: form.get("utilityRoad") === "yes",
    power: form.get("utilityPower") === "yes",
    water: form.get("utilityWater") === "yes",
    sewer: form.get("utilitySewer") === "yes",
    internet: form.get("utilityInternet") === "yes",
  };
  const published =
    form.get("published") === "yes" &&
    parsed.data.verificationStatus === "verified" &&
    ["available", "reserved"].includes(parsed.data.status);
  const slug = `${slugify(parsed.data.titleEn)}-${crypto.randomUUID().slice(0, 8)}`;

  try {
    const db = getDatabase();
    const rows = await db.sql`
      INSERT INTO properties (
        slug, title_en, title_de, country, region, municipality,
        cadastral_reference, cadastral_source_url, cadastral_checked_at,
        geometry, area_sqm, commercial_use, development_parameters,
        restrictions, utilities, price_eur_cents, deposit_eur_cents,
        price_source, verification_status, risk_notes, status, published
      ) VALUES (
        ${slug}, ${parsed.data.titleEn}, ${parsed.data.titleDe}, ${parsed.data.country},
        ${parsed.data.region}, ${parsed.data.municipality},
        ${parsed.data.cadastralReference}, ${parsed.data.cadastralSourceUrl || null},
        ${parsed.data.cadastralCheckedAt || null}, ${JSON.stringify(geometry)}::jsonb,
        ${parsed.data.areaSqm}, ${parsed.data.commercialUse},
        ${parsed.data.developmentParameters}, ${parsed.data.restrictions},
        ${JSON.stringify(utilities)}::jsonb, ${Math.round(parsed.data.priceEur * 100)},
        ${Math.round(parsed.data.depositEur * 100)}, ${parsed.data.priceSource},
        ${parsed.data.verificationStatus}, ${parsed.data.riskNotes},
        ${parsed.data.status}, ${published}
      )
      RETURNING id, slug, status, verification_status, published
    `;
    const property = rows[0];
    await writeAuditEvent({
      actor: admin.sub,
      role: admin.role,
      action: "property.created",
      entityType: "property",
      entityId: String(property.id),
      after: property,
    });
    return redirectTo("/admin?created=property");
  } catch {
    return redirectTo("/admin/properties/new?error=save");
  }
}
