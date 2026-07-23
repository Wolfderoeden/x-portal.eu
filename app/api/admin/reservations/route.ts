import { getDatabase } from "@netlify/database";
import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminApi } from "../../../../lib/admin-auth";
import { writeAuditEvent } from "../../../../lib/db";

const actionSchema = z.object({
  reservationId: z.string().uuid(),
  action: z.enum(["approve", "cancel", "create-intent"]),
  adaEurRate: z.coerce.number().positive().optional(),
  rateSource: z.string().max(240).optional(),
});

function redirectTo(path: string) {
  return new NextResponse(null, { status: 303, headers: { Location: path } });
}

export async function POST(request: Request) {
  const admin = await requireAdminApi(["owner", "operations", "compliance"]);
  if (!admin) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  const form = await request.formData();
  const parsed = actionSchema.safeParse(Object.fromEntries(form.entries()));
  if (!parsed.success) return redirectTo("/admin/reservations?error=validation");

  const db = getDatabase();
  const rows = await db.sql`
    SELECT r.*, p.deposit_eur_cents
    FROM reservations r JOIN properties p ON p.id = r.property_id
    WHERE r.id = ${parsed.data.reservationId}
    LIMIT 1
  `;
  const reservation = rows[0];
  if (!reservation) return redirectTo("/admin/reservations?error=missing");

  if (parsed.data.action === "approve") {
    await db.sql`
      UPDATE reservations
      SET status = 'approved', document_status = 'approved', updated_at = NOW()
      WHERE id = ${parsed.data.reservationId}
    `;
  } else if (parsed.data.action === "cancel") {
    await db.sql`
      UPDATE reservations SET status = 'cancelled', updated_at = NOW()
      WHERE id = ${parsed.data.reservationId}
    `;
  } else {
    const recipient = process.env.CARDANO_PREPROD_ADDRESS ?? "";
    const rate = parsed.data.adaEurRate;
    const rateSource = parsed.data.rateSource?.trim() ?? "";
    if (
      reservation.status !== "approved" ||
      !recipient.startsWith("addr_test1") ||
      !rate ||
      !rateSource
    ) {
      return redirectTo("/admin/reservations?error=payment-config");
    }
    const lovelace = Math.round((Number(reservation.deposit_eur_cents) / 100 / rate) * 1_000_000);
    const now = new Date();
    const expires = new Date(now.getTime() + 15 * 60 * 1000);
    await db.sql`
      UPDATE payment_intents
      SET status = 'expired', updated_at = NOW()
      WHERE reservation_id = ${parsed.data.reservationId} AND status = 'created'
    `;
    await db.sql`
      INSERT INTO payment_intents (
        reservation_id, recipient_address, eur_amount_cents, ada_eur_rate,
        rate_source, lovelace_amount, quote_timestamp, expires_at
      ) VALUES (
        ${parsed.data.reservationId}, ${recipient}, ${Number(reservation.deposit_eur_cents)},
        ${rate}, ${rateSource}, ${lovelace}, ${now.toISOString()}, ${expires.toISOString()}
      )
    `;
    await db.sql`
      UPDATE reservations SET status = 'payment-pending', updated_at = NOW()
      WHERE id = ${parsed.data.reservationId}
    `;
  }

  await writeAuditEvent({
    actor: admin.sub,
    role: admin.role,
    action: `reservation.${parsed.data.action}`,
    entityType: "reservation",
    entityId: parsed.data.reservationId,
    before: { status: reservation.status },
    after: { action: parsed.data.action },
  });
  return redirectTo("/admin/reservations?updated=1");
}
