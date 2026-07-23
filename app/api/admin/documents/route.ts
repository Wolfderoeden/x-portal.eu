import { getDatabase } from "@netlify/database";
import { NextResponse } from "next/server";
import { requireAdminApi } from "../../../../lib/admin-auth";
import { writeAuditEvent } from "../../../../lib/db";
import { privateDocumentsStore } from "../../../../lib/documents";

const ALLOWED_TYPES = new Set(["application/pdf", "image/jpeg", "image/png"]);
const MAX_BYTES = 12 * 1024 * 1024;

function redirectTo(path: string) {
  return new NextResponse(null, { status: 303, headers: { Location: path } });
}

export async function POST(request: Request) {
  const admin = await requireAdminApi(["owner", "operations", "compliance"]);
  if (!admin) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  const form = await request.formData();
  const entityType = String(form.get("entityType") ?? "");
  const entityId = String(form.get("entityId") ?? "");
  const documentType = String(form.get("documentType") ?? "").slice(0, 100);
  const file = form.get("file");
  if (
    !["property", "reservation", "organisation"].includes(entityType) ||
    !/^[a-f0-9-]{36}$/i.test(entityId) ||
    !documentType ||
    !(file instanceof File) ||
    !ALLOWED_TYPES.has(file.type) ||
    file.size <= 0 ||
    file.size > MAX_BYTES
  ) {
    return redirectTo("/admin/compliance?error=document");
  }

  const id = crypto.randomUUID();
  const key = `${entityType}/${entityId}/${id}`;
  try {
    await privateDocumentsStore().set(key, await file.arrayBuffer());
    const db = getDatabase();
    const propertyId = entityType === "property" ? entityId : null;
    const reservationId = entityType === "reservation" ? entityId : null;
    const organisationId = entityType === "organisation" ? entityId : null;
    await db.sql`
      INSERT INTO documents (
        id, property_id, reservation_id, organisation_id, blob_key,
        file_name, media_type, size_bytes, document_type, uploaded_by
      ) VALUES (
        ${id}, ${propertyId}, ${reservationId}, ${organisationId}, ${key},
        ${file.name.slice(0, 240)}, ${file.type}, ${file.size},
        ${documentType}, ${admin.sub}
      )
    `;
    await writeAuditEvent({
      actor: admin.sub,
      role: admin.role,
      action: "document.uploaded",
      entityType,
      entityId,
      after: { documentId: id, documentType, fileName: file.name, size: file.size },
    });
    return redirectTo("/admin/compliance?uploaded=1");
  } catch {
    await privateDocumentsStore().delete(key).catch(() => undefined);
    return redirectTo("/admin/compliance?error=document");
  }
}
