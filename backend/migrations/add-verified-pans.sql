-- Migration: Add verified_pans column to users table
-- Run this SQL in your PostgreSQL database

ALTER TABLE users 
ADD COLUMN IF NOT EXISTS verified_pans JSONB DEFAULT '[]'::jsonb;

-- Verify the column was added
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'users' AND column_name = 'verified_pans';
