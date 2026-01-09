-- S12 Phase 1: Backup Current State
-- Execute this FIRST before any destructive operations

BEGIN;

-- Create backup schema
CREATE SCHEMA IF NOT EXISTS backup_pre_s12;

-- Backup core tables
CREATE TABLE backup_pre_s12.users AS SELECT * FROM public.users;
CREATE TABLE backup_pre_s12.ca_firms AS SELECT * FROM public.ca_firms;

-- Backup other tables if they exist
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'itr_filings' AND table_schema = 'public') THEN
    EXECUTE 'CREATE TABLE backup_pre_s12.itr_filings AS SELECT * FROM public.itr_filings';
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'audit_events' AND table_schema = 'public') THEN
    EXECUTE 'CREATE TABLE backup_pre_s12.audit_events AS SELECT * FROM public.audit_events';
  END IF;
END $$;

COMMIT;

-- Verify backup
SELECT 
  'users' as table_name, COUNT(*) as row_count FROM backup_pre_s12.users
UNION ALL
SELECT 'ca_firms', COUNT(*) FROM backup_pre_s12.ca_firms
UNION ALL
SELECT 'itr_filings', COUNT(*) FROM backup_pre_s12.itr_filings WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'itr_filings' AND table_schema = 'backup_pre_s12')
UNION ALL
SELECT 'audit_events', COUNT(*) FROM backup_pre_s12.audit_events WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'audit_events' AND table_schema = 'backup_pre_s12');
