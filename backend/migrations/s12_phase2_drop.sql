-- S12 Phase 2: Drop Legacy Tables
-- WARNING: This is destructive. Ensure Phase 1 backup completed successfully.
-- STOP THE SERVER before running this.

BEGIN;

-- Drop in reverse dependency order
DROP TABLE IF EXISTS public.audit_events CASCADE;
DROP TABLE IF EXISTS public.itr_filings CASCADE;
DROP TABLE IF EXISTS public.ca_firms CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;

COMMIT;

-- Verify deletion (should return 0 rows)
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('users', 'ca_firms', 'itr_filings', 'audit_events');
