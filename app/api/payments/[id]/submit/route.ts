import { createHash } from "node:crypto";
import { getDatabase } from "@/lib/database";
import { NextResponse } from "next/server";
import { z } from "zod";
import { writeAuditEvent } from "../../../../../lib/db";

const submitSchema = z.object({
  accessToken: z.string().min(30).max(100),
  txHash: z.string().regex(/^[a-f0-9]{64}$/i),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = submitSchema.safeParse(await request.json().catch(() => null));
  if (!body.success) return NextResponse.json({ message: "Invalid submission" }, { status: 400 });
  const tokenHash = createHash("sha256").update(body.data.accessToken).digest("hex");
  const db = getDatabase();
  const rows = await db.sql`
    SELECT pi.id, pi.status, pi.reservation_id
    FROM payment_intents pi
    JOIN reservations r ON r.id = pi.reservation_id
    WHERE pi.id = ${id} AND r.access_token_hash = ${tokenHash}
    LIMIT 1
  `;
  const intent = rows[0];
  if (!intent || !["created", "submitted"].includes(String(intent.status))) {
    return NextResponse.json({ message: "Payment intent is not available" }, { status: 409 });
  }
  await db.sql`
    UPDATE payment_intents
    SET tx_hash = ${body.data.txHash.toLowerCase()}, status = 'submitted', updated_at = NOW()
    WHERE id = ${id}
  `;
  await writeAuditEvent({
    actor: "buyer-wallet",
    role: "buyer",
    action: "payment.submitted",
    entityType: "payment_intent",
    entityId: id,
    after: { txHash: body.data.txHash.toLowerCase(), network: "preprod" },
  });
  return NextResponse.json({ ok: true, status: "submitted" });
}
