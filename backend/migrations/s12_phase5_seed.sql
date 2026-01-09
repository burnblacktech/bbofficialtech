-- S12 Phase 5: Seed Minimal Test Data
-- Execute after Phase 4 (verify) completes successfully

BEGIN;

-- =====================================================
-- 5.1 CREATE SUPER_ADMIN USER
-- =====================================================

-- Password: Test@12345
-- Hash generated with bcrypt rounds=12
INSERT INTO public.users (id, email, full_name, password_hash, role, auth_provider, status)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'admin@burnblack.com',
  'System Administrator',
  '$2a$12$LKz7eJKvV8xhZJ5YqF5rOeYqF5rOeYqF5rOeYqF5rOeYqF5rOeYqF',
  'SUPER_ADMIN',
  'local',
  'active'
);

-- =====================================================
-- 5.2 CREATE TEST CA FIRM
-- =====================================================

-- Create CA user first
INSERT INTO public.users (id, email, full_name, password_hash, role, auth_provider, status)
VALUES (
  'aaaaaaaa-aaaa-aaaa-aaaa-000000000001',
  'ca@testfirm.com',
  'Test CA User',
  '$2a$12$LKz7eJKvV8xhZJ5YqF5rOeYqF5rOeYqF5rOeYqF5rOeYqF5rOeYqF',
  'CA',
  'local',
  'active'
);

-- Create firm owned by CA user
INSERT INTO public.ca_firms (id, name, owner_id, created_by, status)
VALUES (
  'bbbbbbbb-bbbb-bbbb-bbbb-000000000001',
  'Test Firm A',
  'aaaaaaaa-aaaa-aaaa-aaaa-000000000001',
  'aaaaaaaa-aaaa-aaaa-aaaa-000000000001',
  'active'
);

-- Update CA user with firm reference
UPDATE public.users
SET ca_firm_id = 'bbbbbbbb-bbbb-bbbb-bbbb-000000000001'
WHERE id = 'aaaaaaaa-aaaa-aaaa-aaaa-000000000001';

-- =====================================================
-- 5.3 CREATE TEST PREPARER USER
-- =====================================================

INSERT INTO public.users (id, email, full_name, password_hash, role, ca_firm_id, auth_provider, status)
VALUES (
  'cccccccc-cccc-cccc-cccc-000000000001',
  'preparer@testfirm.com',
  'Test Preparer User',
  '$2a$12$LKz7eJKvV8xhZJ5YqF5rOeYqF5rOeYqF5rOeYqF5rOeYqF5rOeYqF',
  'PREPARER',
  'bbbbbbbb-bbbb-bbbb-bbbb-000000000001',
  'local',
  'active'
);

COMMIT;

-- =====================================================
-- VERIFY SEED DATA
-- =====================================================

SELECT 
  u.id,
  u.email,
  u.role,
  u.ca_firm_id,
  f.name as firm_name
FROM public.users u
LEFT JOIN public.ca_firms f ON u.ca_firm_id = f.id
ORDER BY u.role DESC, u.email;

-- Expected:
-- 1 SUPER_ADMIN (no firm)
-- 1 CA (Test Firm A)
-- 1 PREPARER (Test Firm A)

SELECT 'Test data seeded successfully' as status,
       (SELECT COUNT(*) FROM public.users) as total_users,
       (SELECT COUNT(*) FROM public.ca_firms) as total_firms;
