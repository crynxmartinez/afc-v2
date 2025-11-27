-- =====================================================
-- CREATE ADMIN USER FOR AFC v2.0
-- Run this in Supabase SQL Editor
-- =====================================================

-- Step 1: Create the auth user
-- This creates the user in auth.users and triggers the handle_new_user function
-- which automatically creates the public.users record

INSERT INTO auth.users (
  id,
  instance_id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  role,
  aud,
  confirmation_token
) VALUES (
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000000',
  'admin@afc.com',
  crypt('admin123', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW(),
  '{"provider": "email", "providers": ["email"]}',
  '{"username": "admin"}',
  FALSE,
  'authenticated',
  'authenticated',
  ''
);

-- Step 2: Update the user to be admin
-- (The trigger should have created the public.users record)
UPDATE public.users 
SET 
  role = 'admin',
  username = 'admin',
  display_name = 'Administrator'
WHERE email = 'admin@afc.com';

-- Verify the admin was created
SELECT id, email, username, display_name, role, created_at 
FROM public.users 
WHERE email = 'admin@afc.com';
