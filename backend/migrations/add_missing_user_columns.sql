-- Migration: Add missing columns to users table to match User model
-- Date: 2026-01-02
-- Purpose: Align database schema with Sequelize User model definition

BEGIN;

-- Add google_id for OAuth integration
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS google_id VARCHAR(255) UNIQUE;

-- Add provider_id for generic OAuth provider support
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS provider_id VARCHAR(255);

-- Add token_version for JWT invalidation strategy
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS token_version INTEGER NOT NULL DEFAULT 0;

-- Add phone_verified for phone verification tracking
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS phone_verified BOOLEAN DEFAULT FALSE;

-- Add last_login_at for security tracking
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMP WITH TIME ZONE;

-- Add date_of_birth for tax calculations
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS date_of_birth DATE;

-- Add gender for profile and tax calculations
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS gender VARCHAR(10) CHECK (gender IN ('MALE', 'FEMALE', 'OTHER'));

-- Add metadata JSONB for flexible user preferences/settings
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- Add pan_verified_at for PAN verification timestamp
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS pan_verified_at TIMESTAMP WITH TIME ZONE;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_google_id ON public.users(google_id) WHERE google_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_users_provider_id ON public.users(provider_id) WHERE provider_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_users_last_login_at ON public.users(last_login_at);
CREATE INDEX IF NOT EXISTS idx_users_metadata_gin ON public.users USING gin(metadata);

-- Add comments for documentation
COMMENT ON COLUMN public.users.google_id IS 'Google OAuth user ID';
COMMENT ON COLUMN public.users.provider_id IS 'Generic OAuth provider user ID';
COMMENT ON COLUMN public.users.token_version IS 'JWT token version for invalidation';
COMMENT ON COLUMN public.users.phone_verified IS 'Whether phone number is verified';
COMMENT ON COLUMN public.users.last_login_at IS 'Timestamp of last successful login';
COMMENT ON COLUMN public.users.date_of_birth IS 'User date of birth for tax calculations';
COMMENT ON COLUMN public.users.gender IS 'User gender for profile and tax calculations';
COMMENT ON COLUMN public.users.metadata IS 'JSONB field for user preferences, notification settings, privacy settings, etc.';
COMMENT ON COLUMN public.users.pan_verified_at IS 'Timestamp when PAN was verified';

COMMIT;

-- Verification query
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'users'
  AND table_schema = 'public'
ORDER BY ordinal_position;
