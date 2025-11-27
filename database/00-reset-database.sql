-- =====================================================
-- AFC v2.0 DATABASE RESET
-- Run this FIRST to clean everything before FULL-SCHEMA.sql
-- =====================================================

-- Drop all storage policies first (they cause conflicts)
DROP POLICY IF EXISTS "Avatar images public" ON storage.objects;
DROP POLICY IF EXISTS "Users upload avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users update own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users delete own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Entry images public" ON storage.objects;
DROP POLICY IF EXISTS "Users upload entries" ON storage.objects;
DROP POLICY IF EXISTS "Users update own entries" ON storage.objects;
DROP POLICY IF EXISTS "Users delete own entries" ON storage.objects;
DROP POLICY IF EXISTS "Contest images public" ON storage.objects;
DROP POLICY IF EXISTS "Admins upload contest images" ON storage.objects;
DROP POLICY IF EXISTS "Admins update contest images" ON storage.objects;
DROP POLICY IF EXISTS "Admins delete contest images" ON storage.objects;

-- Drop storage buckets
DELETE FROM storage.objects WHERE bucket_id IN ('avatars', 'entries', 'contests');
DELETE FROM storage.buckets WHERE id IN ('avatars', 'entries', 'contests');

-- Drop public schema and recreate
DROP SCHEMA IF EXISTS public CASCADE;
CREATE SCHEMA public;

-- Grant permissions
GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL ON SCHEMA public TO public;
GRANT ALL ON SCHEMA public TO anon;
GRANT ALL ON SCHEMA public TO authenticated;
GRANT ALL ON SCHEMA public TO service_role;

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

SELECT 'Database reset complete. Now run FULL-SCHEMA.sql' as status;
