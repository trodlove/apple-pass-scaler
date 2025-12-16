-- Migration: Add last_modified column to passes table
-- This column is CRITICAL for iOS to determine which passes need updating

-- Add the column
ALTER TABLE passes 
ADD COLUMN IF NOT EXISTS last_modified TIMESTAMPTZ DEFAULT NOW();

-- Set last_modified to last_updated_at for existing passes
UPDATE passes 
SET last_modified = last_updated_at 
WHERE last_modified IS NULL;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_passes_last_modified ON passes(last_modified);

