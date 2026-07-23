import { createHash, randomBytes } from "node:crypto";
import { getDatabase } from "@/lib/database";
import { NextResponse } from "next/server";
import { z } from "zod";
import { writeAuditEvent } from "../../../lib/db";

const reservationSchema = z.object({
  propertyId: z.string().uuid(),
  buyerName: z.string().min(2).max(120),
  buyerEmail: z.string().email().max(180),
  buyerCompany: z.string().min(2).max(180),
  buyerCountry: z.string().min(2).max(100),
  intendedUse: z.string().min(10).max(1500),
  consent: z.literal("yes"),
});

function redirectTo(path: string) {
  return new NextResponse(null, { status: 303, headers: { Location: path } });
}

export async function POST(request: Request) {
  const form = await request.formData();
  const parsed = reservationSchema.safeParse(Object.fromEntries(form.entries()));
  const slug = String(form.get("propertySlug") ?? "");
  if (!parsed.success) return redirectTo(`/properties/${slug}?error=validation#reserve`);

  try {
    const db = getDatabase();
    const properties = await db.sql`
      SELECT id FROM properties
      WHERE id = ${parsed.data.propertyId}
        AND published = TRUE
        AND verification_status = 'verified'
        AND status = 'available'
      LIMIT 1
    `;
    if (!properties[0]) return redirectTo(`/properties/${slug}?error=unavailable#reserve`);

    const accessToken = randomBytes(32).toString("base64url");
    const accessTokenHash = createHash("sha256").update(accessToken).digest("hex");
    const rows = await db.sql`
      INSERT INTO reservations (
        property_id, buyer_name, buyer_email, buyer_company, buyer_country,
        intended_use, access_token_hash, privacy_consent_at
      ) VALUES (
        ${parsed.data.propertyId}, ${parsed.data.buyerName},
        ${parsed.data.buyerEmail.toLowerCase()}, ${parsed.data.buyerCompany},
        ${parsed.data.buyerCountry}, ${parsed.data.intendedUse},
        ${accessTokenHash}, ${new Date().toISOString()}
      )
      RETURNING id, status, document_status
    `;
    await writeAuditEvent({
      actor: parsed.data.buyerEmail.toLowerCase(),
      role: "buyer",
      action: "reservation.inquiry-created",
      entityType: "reservation",
      entityId: String(rows[0].id),
      after: rows[0],
    });
    return redirectTo(`/account/${accessToken}?created=1`);
  } catch {
    return redirectTo(`/properties/${slug}?error=save#reserve`);
  }
}
