export const MARKET_COUNTRIES = [
  { code: "UA", name: "Ukraine", center: [31.2, 49] as [number, number], pilot: true },
  { code: "PL", name: "Poland", center: [19.2, 52.1] as [number, number], pilot: false },
  { code: "SK", name: "Slovakia", center: [19.5, 48.7] as [number, number], pilot: false },
  { code: "HU", name: "Hungary", center: [19.5, 47.1] as [number, number], pilot: false },
  { code: "RO", name: "Romania", center: [24.9, 45.9] as [number, number], pilot: false },
] as const;

export type PropertyStatus =
  | "draft"
  | "review"
  | "available"
  | "reserved"
  | "sold";

export type VerificationStatus =
  | "unverified"
  | "documents-pending"
  | "legal-review"
  | "verified"
  | "blocked";

export type GeoJsonGeometry = {
  type: "Polygon" | "MultiPolygon";
  coordinates: unknown[];
};

export type Property = {
  id: string;
  slug: string;
  titleEn: string;
  titleDe: string;
  country: string;
  region: string;
  municipality: string;
  cadastralReference: string;
  cadastralSourceUrl: string | null;
  cadastralCheckedAt: string | null;
  geometry: GeoJsonGeometry | null;
  areaSqm: number;
  commercialUse: string;
  developmentParameters: string;
  restrictions: string;
  utilities: {
    road: boolean;
    power: boolean;
    water: boolean;
    sewer: boolean;
    internet: boolean;
  };
  priceEurCents: number;
  depositEurCents: number;
  priceSource: string;
  verificationStatus: VerificationStatus;
  riskNotes: string;
  status: PropertyStatus;
  published: boolean;
  createdAt: string;
  updatedAt: string;
};

export type AdminRole = "owner" | "compliance" | "operations" | "viewer";

export type Reservation = {
  id: string;
  propertyId: string;
  propertyTitle: string;
  buyerName: string;
  buyerEmail: string;
  buyerCompany: string;
  buyerCountry: string;
  status: string;
  documentStatus: string;
  createdAt: string;
};

export function formatEuro(cents: number, locale = "en-IE") {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

export function countryName(code: string) {
  return MARKET_COUNTRIES.find((country) => country.code === code)?.name ?? code;
}
