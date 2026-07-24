CREATE TABLE IF NOT EXISTS cadastre_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  country CHAR(2) UNIQUE NOT NULL CHECK (country IN ('UA', 'PL', 'SK', 'HU', 'RO')),
  authority TEXT NOT NULL,
  registry_name TEXT NOT NULL,
  access_mode TEXT NOT NULL CHECK (access_mode IN ('api-live', 'official-portal', 'licensed')),
  portal_url TEXT NOT NULL,
  api_url TEXT,
  reference_guidance TEXT NOT NULL,
  capabilities JSONB NOT NULL DEFAULT '{}'::jsonb,
  operational_status TEXT NOT NULL CHECK (operational_status IN ('connected', 'review-required', 'disabled')),
  last_verified_on DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO cadastre_sources (
  country, authority, registry_name, access_mode, portal_url, api_url,
  reference_guidance, capabilities, operational_status, last_verified_on
) VALUES
  (
    'UA',
    'State Service of Ukraine for Geodesy, Cartography and Cadastre',
    'State Land Cadastre / Public Cadastral Map',
    'official-portal',
    'https://land.gov.ua/',
    NULL,
    'Complete official cadastral number from the State Land Cadastre',
    '{"parcelGeometry":true,"referenceLookup":true,"cadastralAreas":true,"ownershipData":false,"zoningData":false}'::jsonb,
    'review-required',
    '2026-07-24'
  ),
  (
    'PL',
    'Head Office of Geodesy and Cartography (GUGiK)',
    'ULDK Land Parcel Location Service',
    'api-live',
    'https://uldk.gugik.gov.pl/?lang=en',
    'https://uldk.gugik.gov.pl/opis.html',
    'Complete EGiB parcel identifier',
    '{"parcelGeometry":true,"referenceLookup":true,"cadastralAreas":true,"ownershipData":false,"zoningData":false}'::jsonb,
    'connected',
    '2026-07-24'
  ),
  (
    'SK',
    'Geodesy, Cartography and Cadastre Authority of the Slovak Republic',
    'ZBGIS / ESKN',
    'official-portal',
    'https://zbgis.skgeodesy.sk/mkzbgis/sk/zakladna-mapa',
    NULL,
    'Cadastral territory code and complete parcel reference',
    '{"parcelGeometry":true,"referenceLookup":true,"cadastralAreas":true,"ownershipData":false,"zoningData":false}'::jsonb,
    'review-required',
    '2026-07-24'
  ),
  (
    'HU',
    'Hungarian Land Administration',
    'E-ING / Land Registry Information System',
    'licensed',
    'https://info.foldhivatal.hu/tknet/eing_elovalaszto6_p.kezdolap',
    NULL,
    'Municipality and complete helyrajzi szam',
    '{"parcelGeometry":true,"referenceLookup":true,"cadastralAreas":true,"ownershipData":false,"zoningData":false}'::jsonb,
    'review-required',
    '2026-07-24'
  ),
  (
    'RO',
    'National Agency for Cadastre and Land Registration (ANCPI)',
    'ANCPI INSPIRE Cadastral Parcels',
    'api-live',
    'https://geoportal.ancpi.ro/',
    'https://geoportal.ancpi.ro/inspireview/rest/services/CP/CP_View/MapServer/1',
    'Complete nationalCadastralRef from the official parcel layer',
    '{"parcelGeometry":true,"referenceLookup":true,"cadastralAreas":true,"ownershipData":false,"zoningData":false}'::jsonb,
    'connected',
    '2026-07-24'
  )
ON CONFLICT (country) DO UPDATE SET
  authority = EXCLUDED.authority,
  registry_name = EXCLUDED.registry_name,
  access_mode = EXCLUDED.access_mode,
  portal_url = EXCLUDED.portal_url,
  api_url = EXCLUDED.api_url,
  reference_guidance = EXCLUDED.reference_guidance,
  capabilities = EXCLUDED.capabilities,
  operational_status = EXCLUDED.operational_status,
  last_verified_on = EXCLUDED.last_verified_on,
  updated_at = NOW();

CREATE TABLE IF NOT EXISTS cadastre_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id UUID NOT NULL REFERENCES cadastre_sources(id),
  country CHAR(2) NOT NULL CHECK (country IN ('UA', 'PL', 'SK', 'HU', 'RO')),
  cadastral_reference TEXT NOT NULL,
  normalized_reference TEXT NOT NULL,
  municipality TEXT,
  geometry JSONB,
  area_sqm NUMERIC(14,2),
  source_url TEXT NOT NULL,
  source_payload JSONB,
  source_checked_at TIMESTAMPTZ,
  verification_status TEXT NOT NULL DEFAULT 'imported'
    CHECK (verification_status IN ('imported', 'resolved', 'review', 'verified', 'rejected')),
  created_by TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(country, normalized_reference)
);

CREATE INDEX IF NOT EXISTS cadastre_records_reference_idx
  ON cadastre_records (country, cadastral_reference);
CREATE INDEX IF NOT EXISTS cadastre_records_verification_idx
  ON cadastre_records (verification_status, updated_at DESC);

ALTER TABLE properties
  ADD COLUMN IF NOT EXISTS cadastre_record_id UUID REFERENCES cadastre_records(id);

CREATE INDEX IF NOT EXISTS properties_cadastre_record_idx
  ON properties (cadastre_record_id);
