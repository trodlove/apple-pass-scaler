-- Google Wallet Passes Table
-- This is completely independent from Apple Wallet tables

CREATE TABLE google_passes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pass_class_id TEXT NOT NULL,
  pass_object_id TEXT NOT NULL UNIQUE,
  affiliate_link TEXT NOT NULL,
  tracking_data JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for better query performance
CREATE INDEX idx_google_passes_class_id ON google_passes(pass_class_id);
CREATE INDEX idx_google_passes_object_id ON google_passes(pass_object_id);
