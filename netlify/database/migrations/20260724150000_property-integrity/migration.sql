ALTER TABLE properties
  ADD COLUMN IF NOT EXISTS data_fingerprint TEXT,
  ADD COLUMN IF NOT EXISTS fingerprint_algorithm TEXT NOT NULL DEFAULT 'SHA-256',
  ADD COLUMN IF NOT EXISTS anchor_network TEXT,
  ADD COLUMN IF NOT EXISTS anchor_tx_hash TEXT,
  ADD COLUMN IF NOT EXISTS anchor_slot BIGINT,
  ADD COLUMN IF NOT EXISTS anchor_recorded_at TIMESTAMPTZ;

ALTER TABLE properties
  DROP CONSTRAINT IF EXISTS properties_data_fingerprint_format,
  ADD CONSTRAINT properties_data_fingerprint_format
    CHECK (data_fingerprint IS NULL OR data_fingerprint ~ '^[0-9a-f]{64}$'),
  DROP CONSTRAINT IF EXISTS properties_anchor_network_allowed,
  ADD CONSTRAINT properties_anchor_network_allowed
    CHECK (anchor_network IS NULL OR anchor_network IN ('cardano-preprod', 'cardano-mainnet')),
  DROP CONSTRAINT IF EXISTS properties_anchor_fields_complete,
  ADD CONSTRAINT properties_anchor_fields_complete
    CHECK (
      (anchor_tx_hash IS NULL AND anchor_network IS NULL AND anchor_recorded_at IS NULL)
      OR
      (anchor_tx_hash ~ '^[0-9a-f]{64}$' AND anchor_network IS NOT NULL AND anchor_recorded_at IS NOT NULL)
    );

CREATE UNIQUE INDEX IF NOT EXISTS properties_anchor_tx_hash_unique
  ON properties (anchor_tx_hash)
  WHERE anchor_tx_hash IS NOT NULL;
