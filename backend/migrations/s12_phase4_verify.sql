-- S12 Phase 4: Verify Schema Integrity
-- Execute after Phase 3 (create) completes successfully

-- =====================================================
-- 4.1 VERIFY TABLES EXIST
-- =====================================================

SELECT 
  table_name, 
  (SELECT COUNT(*) 
   FROM information_schema.columns 
   WHERE table_name = t.table_name 
     AND table_schema = 'public') as column_count
FROM information_schema.tables t
WHERE table_schema = 'public' 
  AND table_name IN ('users', 'ca_firms', 'itr_filings', 'audit_events')
ORDER BY table_name;

-- Expected:
-- users: 10 columns
-- ca_firms: 7 columns
-- itr_filings: 16 columns
-- audit_events: 7 columns

-- =====================================================
-- 4.2 VERIFY FOREIGN KEYS
-- =====================================================

SELECT 
  tc.table_name, 
  kcu.column_name, 
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND tc.table_schema = 'public'
  AND tc.table_name IN ('users', 'ca_firms', 'itr_filings', 'audit_events')
ORDER BY tc.table_name, kcu.column_name;

-- Expected: 8 foreign key constraints

-- =====================================================
-- 4.3 VERIFY INDEXES
-- =====================================================

SELECT 
  tablename, 
  indexname
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename IN ('users', 'ca_firms', 'itr_filings', 'audit_events')
ORDER BY tablename, indexname;

-- Expected: 15+ indexes

-- =====================================================
-- 4.4 VERIFY CHECK CONSTRAINTS
-- =====================================================

SELECT 
  tc.table_name,
  tc.constraint_name,
  cc.check_clause
FROM information_schema.table_constraints tc
JOIN information_schema.check_constraints cc
  ON tc.constraint_name = cc.constraint_name
WHERE tc.table_schema = 'public'
  AND tc.table_name IN ('users', 'ca_firms', 'itr_filings', 'audit_events')
ORDER BY tc.table_name, tc.constraint_name;

-- Expected: Multiple CHECK constraints for enums

-- =====================================================
-- SUCCESS SUMMARY
-- =====================================================

SELECT 
  'Schema verification complete' as status,
  (SELECT COUNT(*) FROM information_schema.tables 
   WHERE table_schema = 'public' 
     AND table_name IN ('users', 'ca_firms', 'itr_filings', 'audit_events')) as tables_created,
  (SELECT COUNT(*) FROM information_schema.table_constraints 
   WHERE table_schema = 'public' 
     AND constraint_type = 'FOREIGN KEY'
     AND table_name IN ('users', 'ca_firms', 'itr_filings', 'audit_events')) as foreign_keys,
  (SELECT COUNT(*) FROM pg_indexes 
   WHERE schemaname = 'public' 
     AND tablename IN ('users', 'ca_firms', 'itr_filings', 'audit_events')) as indexes;
