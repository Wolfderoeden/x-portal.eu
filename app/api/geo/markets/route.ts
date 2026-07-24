import { NextResponse } from "next/server";
import { CADASTRE_SOURCES } from "../../../../lib/cadastre-knowledge";
import { MARKET_COUNTRIES } from "../../../../lib/domain";

export const dynamic = "force-dynamic";

export async function GET() {
  const markets = MARKET_COUNTRIES.map((market) => {
    const cadastre = CADASTRE_SOURCES.find((source) => source.country === market.code);
    return {
      country: market.code,
      name: market.name,
      center: market.center,
      pilot: market.pilot,
      cadastre: cadastre
        ? {
            accessMode: cadastre.accessMode,
            operationalStatus: cadastre.operationalStatus,
            autoResolve: cadastre.autoResolve,
          }
        : null,
    };
  });

  return NextResponse.json(
    {
      type: "xportal-market-network",
      focus: { name: "Rakhiv", country: "UA", coordinates: [24.2099, 48.0524] },
      markets,
    },
    {
      headers: {
        "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
      },
    },
  );
}
