-- Migration to add GSTIN_ADMIN role to users table
-- This adds the new role to the existing ENUM type

-- First, we need to add the new value to the ENUM type
-- PostgreSQL requires us to use ALTER TYPE to add new values
ALTER TYPE "public"."enum_users_role" ADD VALUE IF NOT EXISTS 'GSTIN_ADMIN';

-- Verify the change
SELECT enum_range(NULL::enum_users_role);
