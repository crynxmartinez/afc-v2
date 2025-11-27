-- =====================================================
-- AFC v2.0 DATABASE RESET
-- Run this FIRST to clean everything before FULL-SCHEMA.sql
-- =====================================================

-- Drop ALL storage policies on storage.objects (nuclear option)
DO $$ 
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN 
    SELECT policyname FROM pg_policies WHERE tablename = 'objects' AND schemaname = 'storage'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', pol.policyname);
  END LOOP;
END $$;

-- Drop storage buckets
DELETE FROM storage.objects WHERE bucket_id IN ('avatars', 'entries', 'contests', 'covers', 'sponsors');
DELETE FROM storage.buckets WHERE id IN ('avatars', 'entries', 'contests', 'covers', 'sponsors');

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
