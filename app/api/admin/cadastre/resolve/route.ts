import { NextResponse } from "next/server";
import { requireAdminApi } from "../../../../../lib/admin-auth";
import { getCadastreSource } from "../../../../../lib/cadastre-knowledge";
import { upsertCadastreRecord } from "../../../../../lib/cadastre-store";
import type { GeoJsonGeometry } from "../../../../../lib/domain";

function splitGroups(value: string) {
  const groups: string[] = [];
  let depth = 0;
  let start = 0;
  for (let index = 0; index < value.length; index += 1) {
    if (value[index] === "(") depth += 1;
    if (value[index] === ")") depth -= 1;
    if (value[index] === "," && depth === 0) {
      groups.push(value.slice(start, index));
      start = index + 1;
    }
  }
  groups.push(value.slice(start));
  return groups.map((group) => group.trim());
}

function parseRing(value: string) {
  return value
    .replace(/^\(+|\)+$/g, "")
    .split(",")
    .map((pair) => pair.trim().split(/\s+/).slice(0, 2).map(Number))
    .filter((pair) => pair.length === 2 && pair.every(Number.isFinite));
}

function parseWkt(wkt: string): GeoJsonGeometry | null {
  const normalized = wkt.trim().replace(/^SRID=\d+;/i, "");
  if (/^POLYGON/i.test(normalized)) {
    const body = normalized.replace(/^POLYGON\s*/i, "").replace(/^\(|\)$/g, "");
    const rings = splitGroups(body).map(parseRing);
    if (!rings[0] || rings[0].length < 4) return null;
    return { type: "Polygon", coordinates: rings };
  }
  if (/^MULTIPOLYGON/i.test(normalized)) {
    const body = normalized
      .replace(/^MULTIPOLYGON\s*/i, "")
      .replace(/^\(|\)$/g, "");
    const polygons = splitGroups(body).map((polygon) => {
      const polygonBody = polygon.replace(/^\(|\)$/g, "");
      return splitGroups(polygonBody).map(parseRing);
    });
    if (!polygons[0]?.[0] || polygons[0][0].length < 4) return null;
    return { type: "MultiPolygon", coordinates: polygons };
  }
  return null;
}

async function resolvePoland(reference: string) {
  const sourceUrl = new URL("https://uldk.gugik.gov.pl/");
  sourceUrl.searchParams.set("request", "GetParcelById");
  sourceUrl.searchParams.set("id", reference);
  sourceUrl.searchParams.set("result", "geom_wkt");
  sourceUrl.searchParams.set("srid", "4326");
  const response = await fetch(sourceUrl, {
    signal: AbortSignal.timeout(12_000),
    headers: { Accept: "text/plain" },
    cache: "no-store",
  });
  if (!response.ok) throw new Error("Polish cadastral service unavailable");
  const lines = (await response.text()).trim().split(/\r?\n/);
  if (lines[0]?.trim() !== "0") throw new Error("Parcel not found");
  const geometry = parseWkt(lines.slice(1).join("").trim());
  if (!geometry) throw new Error("Unsupported geometry");
  return { geometry, sourceUrl: sourceUrl.toString() };
}

async function resolveRomania(reference: string) {
  const sourceUrl = new URL(
    "https://geoportal.ancpi.ro/inspireview/rest/services/CP/CP_View/MapServer/1/query",
  );
  const escaped = reference.replace(/'/g, "''");
  sourceUrl.searchParams.set("where", `nationalCadastralRef='${escaped}'`);
  sourceUrl.searchParams.set("outFields", "nationalCadastralRef");
  sourceUrl.searchParams.set("returnGeometry", "true");
  sourceUrl.searchParams.set("outSR", "4326");
  sourceUrl.searchParams.set("f", "geojson");
  const response = await fetch(sourceUrl, {
    signal: AbortSignal.timeout(12_000),
    headers: { Accept: "application/geo+json, application/json" },
    cache: "no-store",
  });
  if (!response.ok) throw new Error("Romanian cadastral service unavailable");
  const data = (await response.json()) as {
    features?: Array<{ geometry?: GeoJsonGeometry }>;
  };
  const geometry = data.features?.[0]?.geometry;
  if (!geometry || !["Polygon", "MultiPolygon"].includes(geometry.type)) {
    throw new Error("Parcel not found");
  }
  return { geometry, sourceUrl: sourceUrl.toString() };
}

export async function GET(request: Request) {
  const admin = await requireAdminApi(["owner", "operations", "compliance"]);
  if (!admin) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const country = searchParams.get("country")?.toUpperCase() ?? "";
  const reference = searchParams.get("reference")?.trim() ?? "";
  if (!["UA", "PL", "SK", "HU", "RO"].includes(country) || reference.length < 3) {
    return NextResponse.json({ message: "Invalid country or cadastral reference" }, { status: 400 });
  }

  if (!["PL", "RO"].includes(country)) {
    const source = getCadastreSource(country);
    return NextResponse.json({
      status: "manual",
      source,
      message:
        "This market does not currently expose a reliable public parcel-by-reference API. Upload or paste official GeoJSON and record the source document.",
    });
  }

  try {
    const resolved = country === "PL"
      ? await resolvePoland(reference)
      : await resolveRomania(reference);
    const checkedAt = new Date().toISOString();
    let recordId: string | null = null;
    let storage: "stored" | "pending" = "pending";
    try {
      recordId = await upsertCadastreRecord({
        country,
        reference,
        geometry: resolved.geometry,
        sourceUrl: resolved.sourceUrl,
        checkedAt,
        verificationStatus: "resolved",
        createdBy: admin.sub,
        sourcePayload: { resolver: country === "PL" ? "GUGiK ULDK" : "ANCPI INSPIRE" },
      });
      storage = "stored";
    } catch {
      // Geometry resolution remains useful when the optional datastore is not connected yet.
    }
    return NextResponse.json({
      status: "resolved",
      geometry: resolved.geometry,
      sourceUrl: resolved.sourceUrl,
      checkedAt,
      source: getCadastreSource(country),
      recordId,
      storage,
      message:
        "Boundary resolved from the official cadastral service. Legal identity, ownership and zoning still require document review.",
    });
  } catch (error) {
    return NextResponse.json({
      status: "manual",
      message:
        error instanceof Error
          ? `${error.message}. Paste official GeoJSON or try a complete cadastral identifier.`
          : "The parcel could not be resolved automatically.",
    });
  }
}
