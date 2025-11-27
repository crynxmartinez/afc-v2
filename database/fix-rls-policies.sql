-- =====================================================
-- FIX RLS POLICIES FOR AFC v2.0
-- Run this if you get 403 errors on login
-- =====================================================

-- Drop ALL existing users policies
DROP POLICY IF EXISTS "Public profiles viewable" ON public.users;
DROP POLICY IF EXISTS "Users update own profile" ON public.users;
DROP POLICY IF EXISTS "Users can read own profile" ON public.users;
DROP POLICY IF EXISTS "Public profiles are viewable" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Service role full access" ON public.users;

-- Create single comprehensive SELECT policy
-- Users can read: their own profile OR any public profile
CREATE POLICY "Users can read profiles" ON public.users FOR SELECT
  USING (
    auth.uid() = id 
    OR profile_visibility = 'public'
    OR auth.role() = 'service_role'
  );

-- Users can update their own profile
CREATE POLICY "Users can update own profile" ON public.users FOR UPDATE
  USING (auth.uid() = id) 
  WITH CHECK (auth.uid() = id);

-- Users can insert (for trigger - handled by SECURITY DEFINER)
CREATE POLICY "Allow insert for auth trigger" ON public.users FOR INSERT
  WITH CHECK (true);

-- Verify policies
SELECT tablename, policyname, cmd, qual 
FROM pg_policies 
WHERE tablename = 'users';
