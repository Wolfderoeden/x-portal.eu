import { NextResponse } from "next/server";
import { CADASTRE_SOURCES } from "../../../../lib/cadastre-knowledge";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(
    {
      type: "xportal-cadastre-knowledge",
      privacy:
        "This endpoint publishes source and capability metadata only. Ownership, KYC, documents and audit records are never included.",
      sources: CADASTRE_SOURCES,
    },
    {
      headers: {
        "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
      },
    },
  );
}
