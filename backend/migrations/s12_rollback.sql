-- S12 ROLLBACK: Restore from Backup
-- Execute ONLY if migration fails and you need to restore

BEGIN;

-- Drop failed new tables
DROP TABLE IF EXISTS public.audit_events CASCADE;
DROP TABLE IF EXISTS public.itr_filings CASCADE;
DROP TABLE IF EXISTS public.ca_firms CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;

-- Restore from backup
CREATE TABLE public.users AS SELECT * FROM backup_pre_s12.users;
CREATE TABLE public.ca_firms AS SELECT * FROM backup_pre_s12.ca_firms;

-- Restore other tables if they exist in backup
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'itr_filings' AND table_schema = 'backup_pre_s12') THEN
    EXECUTE 'CREATE TABLE public.itr_filings AS SELECT * FROM backup_pre_s12.itr_filings';
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'audit_events' AND table_schema = 'backup_pre_s12') THEN
    EXECUTE 'CREATE TABLE public.audit_events AS SELECT * FROM backup_pre_s12.audit_events';
  END IF;
END $$;

COMMIT;

-- Verify restoration
SELECT 
  'users' as table_name, COUNT(*) as row_count FROM public.users
UNION ALL
SELECT 'ca_firms', COUNT(*) FROM public.ca_firms;

SELECT 'Rollback complete - database restored from backup' as status;
