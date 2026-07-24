import { createHash } from "node:crypto";
import type { Property, PropertyIntegrity } from "./domain";

export const PROPERTY_FINGERPRINT_SCHEMA = "xportal.property.v1" as const;
export const PROPERTY_FINGERPRINT_ALGORITHM = "SHA-256" as const;

type FingerprintInput = Pick<
  Property,
  | "country"
  | "region"
  | "municipality"
  | "cadastralReference"
  | "cadastralSourceUrl"
  | "cadastralCheckedAt"
  | "geometry"
  | "areaSqm"
  | "commercialUse"
  | "developmentParameters"
  | "restrictions"
  | "utilities"
  | "priceEurCents"
  | "priceSource"
  | "verificationStatus"
  | "riskNotes"
>;

function sortCanonical(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortCanonical);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, nested]) => [key, sortCanonical(nested)]),
    );
  }
  return value;
}

export function canonicalPropertyPayload(property: FingerprintInput) {
  return sortCanonical({
    schema: PROPERTY_FINGERPRINT_SCHEMA,
    jurisdiction: {
      country: property.country,
      region: property.region,
      municipality: property.municipality,
    },
    cadastre: {
      reference: property.cadastralReference,
      sourceUrl: property.cadastralSourceUrl,
      checkedAt: property.cadastralCheckedAt,
      geometry: property.geometry,
      areaSqm: property.areaSqm,
    },
    commercialRecord: {
      permittedUse: property.commercialUse,
      developmentParameters: property.developmentParameters,
      restrictions: property.restrictions,
      utilities: property.utilities,
      priceEurCents: property.priceEurCents,
      priceSource: property.priceSource,
      riskNotes: property.riskNotes,
    },
    verificationStatus: property.verificationStatus,
  });
}

export function computePropertyFingerprint(property: FingerprintInput) {
  return createHash("sha256")
    .update(JSON.stringify(canonicalPropertyPayload(property)))
    .digest("hex");
}

export function buildPropertyIntegrity(
  property: FingerprintInput & {
    storedDataFingerprint?: string | null;
    fingerprintAlgorithm?: string | null;
    anchorNetwork?: string | null;
    anchorTxHash?: string | null;
    anchorSlot?: number | null;
    anchorRecordedAt?: string | null;
  },
): PropertyIntegrity {
  const fingerprint = computePropertyFingerprint(property);
  const storedFingerprint = property.storedDataFingerprint ?? null;
  const recordMatches =
    storedFingerprint === null ||
    storedFingerprint.toLowerCase() === fingerprint.toLowerCase();
  const hasAnchor = Boolean(property.anchorTxHash && property.anchorNetwork);

  return {
    schema: PROPERTY_FINGERPRINT_SCHEMA,
    algorithm: PROPERTY_FINGERPRINT_ALGORITHM,
    fingerprint,
    storedFingerprint,
    recordMatches,
    anchorStatus: !hasAnchor
      ? "not-anchored"
      : recordMatches
        ? "anchored-match"
        : "anchored-mismatch",
    anchorNetwork: property.anchorNetwork ?? null,
    anchorTxHash: property.anchorTxHash ?? null,
    anchorSlot: property.anchorSlot ?? null,
    anchorRecordedAt: property.anchorRecordedAt ?? null,
  };
}
