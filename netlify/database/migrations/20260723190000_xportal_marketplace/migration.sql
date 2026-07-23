CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE properties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  title_en TEXT NOT NULL,
  title_de TEXT NOT NULL,
  country CHAR(2) NOT NULL CHECK (country IN ('UA', 'PL', 'SK', 'HU', 'RO')),
  region TEXT NOT NULL,
  municipality TEXT NOT NULL,
  cadastral_reference TEXT NOT NULL,
  cadastral_source_url TEXT,
  cadastral_checked_at TIMESTAMPTZ,
  geometry JSONB,
  area_sqm NUMERIC(14,2) NOT NULL CHECK (area_sqm > 0),
  commercial_use TEXT NOT NULL,
  development_parameters TEXT NOT NULL DEFAULT '',
  restrictions TEXT NOT NULL DEFAULT '',
  utilities JSONB NOT NULL DEFAULT '{"road":false,"power":false,"water":false,"sewer":false,"internet":false}'::jsonb,
  seller_organisation_id UUID,
  price_eur_cents BIGINT NOT NULL CHECK (price_eur_cents > 0),
  deposit_eur_cents BIGINT NOT NULL CHECK (deposit_eur_cents > 0),
  price_source TEXT NOT NULL,
  verification_status TEXT NOT NULL DEFAULT 'unverified'
    CHECK (verification_status IN ('unverified','documents-pending','legal-review','verified','blocked')),
  risk_notes TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft','review','available','reserved','sold')),
  published BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(country, cadastral_reference)
);

CREATE INDEX properties_public_map_idx
  ON properties (published, verification_status, status, country);

CREATE TABLE organisations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organisation_type TEXT NOT NULL CHECK (organisation_type IN ('seller','buyer','partner')),
  legal_name TEXT NOT NULL,
  registration_number TEXT,
  country CHAR(2) NOT NULL,
  contact_name TEXT NOT NULL,
  contact_email TEXT NOT NULL,
  verification_status TEXT NOT NULL DEFAULT 'pending'
    CHECK (verification_status IN ('pending','in-review','verified','rejected')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE properties
  ADD CONSTRAINT properties_seller_organisation_fk
  FOREIGN KEY (seller_organisation_id) REFERENCES organisations(id);

CREATE TABLE reservations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES properties(id),
  buyer_organisation_id UUID REFERENCES organisations(id),
  buyer_name TEXT NOT NULL,
  buyer_email TEXT NOT NULL,
  buyer_company TEXT NOT NULL,
  buyer_country TEXT NOT NULL,
  intended_use TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'inquiry'
    CHECK (status IN ('inquiry','kyb-review','approved','payment-pending','reserved','cancelled','expired')),
  document_status TEXT NOT NULL DEFAULT 'not-started'
    CHECK (document_status IN ('not-started','requested','submitted','approved','rejected')),
  access_token_hash TEXT UNIQUE NOT NULL,
  privacy_consent_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE payment_intents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reservation_id UUID NOT NULL REFERENCES reservations(id),
  network TEXT NOT NULL DEFAULT 'preprod' CHECK (network = 'preprod'),
  recipient_address TEXT NOT NULL CHECK (recipient_address LIKE 'addr_test1%'),
  eur_amount_cents BIGINT NOT NULL CHECK (eur_amount_cents > 0),
  ada_eur_rate NUMERIC(20,8) NOT NULL CHECK (ada_eur_rate > 0),
  rate_source TEXT NOT NULL,
  lovelace_amount BIGINT NOT NULL CHECK (lovelace_amount > 0),
  quote_timestamp TIMESTAMPTZ NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  tx_hash TEXT UNIQUE,
  confirmations INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'created'
    CHECK (status IN ('created','submitted','confirmed','underpaid','overpaid','expired','refund-review','refunded','failed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE compliance_checks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID REFERENCES properties(id),
  reservation_id UUID REFERENCES reservations(id),
  organisation_id UUID REFERENCES organisations(id),
  check_type TEXT NOT NULL
    CHECK (check_type IN ('ownership','cadastre','zoning','sanctions','source-of-funds','seller-kyb','buyer-kyb','country-legal')),
  country CHAR(2),
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','in-review','approved','rejected','expired')),
  reviewer TEXT,
  evidence_summary TEXT NOT NULL DEFAULT '',
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (property_id IS NOT NULL OR reservation_id IS NOT NULL OR organisation_id IS NOT NULL)
);

CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID REFERENCES properties(id),
  reservation_id UUID REFERENCES reservations(id),
  organisation_id UUID REFERENCES organisations(id),
  blob_key TEXT UNIQUE NOT NULL,
  file_name TEXT NOT NULL,
  media_type TEXT NOT NULL,
  size_bytes BIGINT NOT NULL,
  document_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','approved','rejected','superseded')),
  uploaded_by TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (property_id IS NOT NULL OR reservation_id IS NOT NULL OR organisation_id IS NOT NULL)
);

CREATE TABLE whitelist_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  country TEXT NOT NULL,
  company TEXT NOT NULL DEFAULT '',
  consent_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX whitelist_email_unique_ci ON whitelist_leads (LOWER(email));

CREATE TABLE audit_log (
  id BIGSERIAL PRIMARY KEY,
  actor TEXT NOT NULL,
  role TEXT NOT NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT,
  before_state JSONB,
  after_state JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX audit_log_entity_idx ON audit_log (entity_type, entity_id, created_at DESC);
CREATE INDEX reservations_property_idx ON reservations (property_id, status);
CREATE INDEX payment_intents_status_idx ON payment_intents (status, expires_at);
