import { getDatabase } from "@/lib/database";
import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminApi } from "../../../../lib/admin-auth";
import { writeAuditEvent } from "../../../../lib/db";

const schema = z.object({
  entityType: z.enum(["property", "reservation", "organisation"]),
  entityId: z.string().uuid(),
  checkType: z.enum(["ownership", "cadastre", "zoning", "sanctions", "source-of-funds", "seller-kyb", "buyer-kyb", "country-legal"]),
  country: z.enum(["UA", "PL", "SK", "HU", "RO"]).or(z.literal("")),
  status: z.enum(["pending", "in-review", "approved", "rejected", "expired"]),
  evidenceSummary: z.string().min(3).max(3000),
});

function redirectTo(path: string) {
  return new NextResponse(null, { status: 303, headers: { Location: path } });
}

export async function POST(request: Request) {
  const admin = await requireAdminApi(["owner", "compliance"]);
  if (!admin) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  const form = await request.formData();
  const parsed = schema.safeParse(Object.fromEntries(form.entries()));
  if (!parsed.success) return redirectTo("/admin/compliance?error=check");
  const propertyId = parsed.data.entityType === "property" ? parsed.data.entityId : null;
  const reservationId = parsed.data.entityType === "reservation" ? parsed.data.entityId : null;
  const organisationId = parsed.data.entityType === "organisation" ? parsed.data.entityId : null;
  const db = getDatabase();
  const rows = await db.sql`
    INSERT INTO compliance_checks (
      property_id, reservation_id, organisation_id, check_type, country,
      status, reviewer, evidence_summary, reviewed_at
    ) VALUES (
      ${propertyId}, ${reservationId}, ${organisationId}, ${parsed.data.checkType},
      ${parsed.data.country || null}, ${parsed.data.status}, ${admin.sub},
      ${parsed.data.evidenceSummary},
      ${parsed.data.status === "pending" ? null : new Date().toISOString()}
    )
    RETURNING id
  `;
  await writeAuditEvent({
    actor: admin.sub,
    role: admin.role,
    action: "compliance.check-recorded",
    entityType: parsed.data.entityType,
    entityId: parsed.data.entityId,
    after: { checkId: rows[0].id, ...parsed.data },
  });
  return redirectTo("/admin/compliance?updated=1");
}
