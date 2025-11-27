-- =====================================================
-- FIX RLS POLICIES FOR AFC v2.0
-- Run this if you get 403 errors on login
-- =====================================================

-- Drop existing users policies
DROP POLICY IF EXISTS "Public profiles viewable" ON public.users;
DROP POLICY IF EXISTS "Users update own profile" ON public.users;

-- Create fixed policies
-- Allow users to ALWAYS read their own profile
-- Allow reading public profiles
CREATE POLICY "Users can read own profile" ON public.users FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Public profiles are viewable" ON public.users FOR SELECT
  USING (profile_visibility = 'public');

CREATE POLICY "Users can update own profile" ON public.users FOR UPDATE
  USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- Also allow service role full access (for triggers)
CREATE POLICY "Service role full access" ON public.users
  USING (auth.jwt()->>'role' = 'service_role');

-- Verify policies
SELECT tablename, policyname, cmd, qual 
FROM pg_policies 
WHERE tablename = 'users';
