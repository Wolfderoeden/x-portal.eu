import { getDatabase } from "@/lib/database";
import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminApi } from "../../../../lib/admin-auth";
import { writeAuditEvent } from "../../../../lib/db";

const actionSchema = z.object({
  reservationId: z.string().uuid(),
  action: z.enum(["approve", "cancel"]),
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
    SELECT r.*
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
