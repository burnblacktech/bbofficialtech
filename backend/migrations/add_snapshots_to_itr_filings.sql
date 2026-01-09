-- =====================================================
-- ADD snapshots COLUMN TO itr_filings (S18)
-- Immutable audit trail for lifecycle transitions
-- =====================================================

-- Add snapshots column
ALTER TABLE public.itr_filings
ADD COLUMN IF NOT EXISTS snapshots JSONB NOT NULL DEFAULT '[]'::jsonb;

-- Add comment
COMMENT ON COLUMN public.itr_filings.snapshots IS 'Immutable snapshots at lifecycle transitions';

-- Create GIN index for JSONB queries (performance)
CREATE INDEX IF NOT EXISTS idx_itr_filings_snapshots ON public.itr_filings USING GIN (snapshots);

-- Verify
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'itr_filings'
  AND column_name = 'snapshots';
