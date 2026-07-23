import { getDatabase } from "@/lib/database";
import { NextResponse } from "next/server";
import { requireAdminApi } from "../../../../../lib/admin-auth";
import { privateDocumentsStore } from "../../../../../lib/documents";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const admin = await requireAdminApi(["owner", "operations", "compliance", "viewer"]);
  if (!admin) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const db = getDatabase();
  const rows = await db.sql`SELECT * FROM documents WHERE id = ${id} LIMIT 1`;
  const document = rows[0];
  if (!document) return NextResponse.json({ message: "Not found" }, { status: 404 });
  const data = await privateDocumentsStore().get(String(document.blob_key), { type: "arrayBuffer" });
  if (!data) return NextResponse.json({ message: "File missing" }, { status: 404 });
  return new Response(data, {
    headers: {
      "Content-Type": String(document.media_type),
      "Content-Disposition": `attachment; filename="${String(document.file_name).replace(/["\r\n]/g, "_")}"`,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
