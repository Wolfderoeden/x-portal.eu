export type CadastreAccessMode = "api-live" | "official-portal" | "licensed";

export type CadastreSource = {
  country: "UA" | "PL" | "SK" | "HU" | "RO";
  countryName: string;
  authority: string;
  registryName: string;
  accessMode: CadastreAccessMode;
  operationalStatus: "connected" | "review-required";
  portalUrl: string;
  apiUrl: string | null;
  referenceGuidance: string;
  autoResolve: boolean;
  capabilities: {
    parcelGeometry: boolean;
    referenceLookup: boolean;
    cadastralAreas: boolean;
    ownershipData: false;
    zoningData: false;
  };
  note: string;
  lastVerified: string;
};

export const CADASTRE_SOURCES: readonly CadastreSource[] = [
  {
    country: "UA",
    countryName: "Ukraine",
    authority: "State Service of Ukraine for Geodesy, Cartography and Cadastre",
    registryName: "State Land Cadastre / Public Cadastral Map",
    accessMode: "official-portal",
    operationalStatus: "review-required",
    portalUrl: "https://land.gov.ua/",
    apiUrl: null,
    referenceGuidance: "Use the complete official cadastral number from the State Land Cadastre.",
    autoResolve: false,
    capabilities: {
      parcelGeometry: true,
      referenceLookup: true,
      cadastralAreas: true,
      ownershipData: false,
      zoningData: false,
    },
    note: "Official map evidence is imported and reviewed by an operator; no stable public parcel API is assumed.",
    lastVerified: "2026-07-24",
  },
  {
    country: "PL",
    countryName: "Poland",
    authority: "Head Office of Geodesy and Cartography (GUGiK)",
    registryName: "ULDK Land Parcel Location Service",
    accessMode: "api-live",
    operationalStatus: "connected",
    portalUrl: "https://uldk.gugik.gov.pl/?lang=en",
    apiUrl: "https://uldk.gugik.gov.pl/opis.html",
    referenceGuidance: "Use the complete EGiB parcel identifier, for example 141201_1.0001.6509.",
    autoResolve: true,
    capabilities: {
      parcelGeometry: true,
      referenceLookup: true,
      cadastralAreas: true,
      ownershipData: false,
      zoningData: false,
    },
    note: "ULDK returns parcel geometry; title, ownership and commercial zoning require separate evidence.",
    lastVerified: "2026-07-24",
  },
  {
    country: "SK",
    countryName: "Slovakia",
    authority: "Geodesy, Cartography and Cadastre Authority of the Slovak Republic",
    registryName: "ZBGIS / ESKN",
    accessMode: "official-portal",
    operationalStatus: "review-required",
    portalUrl: "https://zbgis.skgeodesy.sk/mkzbgis/sk/zakladna-mapa",
    apiUrl: null,
    referenceGuidance: "Record the cadastral territory code and the complete parcel reference shown by the official portal.",
    autoResolve: false,
    capabilities: {
      parcelGeometry: true,
      referenceLookup: true,
      cadastralAreas: true,
      ownershipData: false,
      zoningData: false,
    },
    note: "Official datasets and map services exist, but parcel ingestion remains operator-reviewed until a stable integration is approved.",
    lastVerified: "2026-07-24",
  },
  {
    country: "HU",
    countryName: "Hungary",
    authority: "Hungarian Land Administration",
    registryName: "E-ING / Land Registry Information System",
    accessMode: "licensed",
    operationalStatus: "review-required",
    portalUrl: "https://info.foldhivatal.hu/tknet/eing_elovalaszto6_p.kezdolap",
    apiUrl: null,
    referenceGuidance: "Use municipality plus the complete official helyrajzi szám (topographical lot number).",
    autoResolve: false,
    capabilities: {
      parcelGeometry: true,
      referenceLookup: true,
      cadastralAreas: true,
      ownershipData: false,
      zoningData: false,
    },
    note: "Registry access is authenticated or licensed; imported evidence must retain its permitted source and review trail.",
    lastVerified: "2026-07-24",
  },
  {
    country: "RO",
    countryName: "Romania",
    authority: "National Agency for Cadastre and Land Registration (ANCPI)",
    registryName: "ANCPI INSPIRE Cadastral Parcels",
    accessMode: "api-live",
    operationalStatus: "connected",
    portalUrl: "https://geoportal.ancpi.ro/",
    apiUrl: "https://geoportal.ancpi.ro/inspireview/rest/services/CP/CP_View/MapServer/1",
    referenceGuidance: "Use the complete nationalCadastralRef exposed by the official ANCPI cadastral parcel layer.",
    autoResolve: true,
    capabilities: {
      parcelGeometry: true,
      referenceLookup: true,
      cadastralAreas: true,
      ownershipData: false,
      zoningData: false,
    },
    note: "The INSPIRE layer provides parcel geometry; title, ownership and commercial zoning remain separate checks.",
    lastVerified: "2026-07-24",
  },
] as const;

export function getCadastreSource(country: string) {
  return CADASTRE_SOURCES.find((source) => source.country === country.toUpperCase());
}

export function normalizeCadastralReference(country: string, reference: string) {
  return `${country.toUpperCase()}:${reference.trim().toUpperCase().replace(/\s+/g, "")}`;
}
