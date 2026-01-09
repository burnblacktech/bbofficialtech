-- =====================================================
-- ADD jsonPayload COLUMN TO itr_filings
-- Canonical storage for all filing data
-- =====================================================

-- Add jsonPayload column
ALTER TABLE public.itr_filings
ADD COLUMN IF NOT EXISTS json_payload JSONB NOT NULL DEFAULT '{}'::jsonb;

-- Add comment
COMMENT ON COLUMN public.itr_filings.json_payload IS 'All filing data: income, deductions, capital gains, regime comparison, etc.';

-- Create GIN index for JSONB queries (performance)
CREATE INDEX IF NOT EXISTS idx_itr_filings_json_payload ON public.itr_filings USING GIN (json_payload);

-- Verify
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'itr_filings'
  AND column_name = 'json_payload';
