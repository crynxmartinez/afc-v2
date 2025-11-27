-- =====================================================
-- AFC v2.0 SEED DATA
-- Default configuration data
-- 
-- Run this FIFTH (LAST) in Supabase SQL Editor
-- =====================================================

-- =====================================================
-- LEVELS CONFIGURATION
-- XP required for each level
-- =====================================================
INSERT INTO public.levels (level, xp_required, title, rewards) VALUES
  (1, 0, 'Newcomer', '{"badge": "newcomer"}'),
  (2, 100, 'Beginner', '{"badge": "beginner"}'),
  (3, 300, 'Apprentice', '{"badge": "apprentice"}'),
  (4, 600, 'Artist', '{"badge": "artist"}'),
  (5, 1000, 'Skilled Artist', '{"badge": "skilled_artist"}'),
  (6, 1500, 'Expert', '{"badge": "expert"}'),
  (7, 2100, 'Master', '{"badge": "master"}'),
  (8, 2800, 'Grand Master', '{"badge": "grand_master"}'),
  (9, 3600, 'Legend', '{"badge": "legend"}'),
  (10, 4500, 'Champion', '{"badge": "champion", "points_bonus": 100}'),
  (11, 5500, 'Elite', '{"badge": "elite"}'),
  (12, 6600, 'Virtuoso', '{"badge": "virtuoso"}'),
  (13, 7800, 'Prodigy', '{"badge": "prodigy"}'),
  (14, 9100, 'Maestro', '{"badge": "maestro"}'),
  (15, 10500, 'Legendary', '{"badge": "legendary", "points_bonus": 250}'),
  (16, 12000, 'Mythic', '{"badge": "mythic"}'),
  (17, 13600, 'Divine', '{"badge": "divine"}'),
  (18, 15300, 'Immortal', '{"badge": "immortal"}'),
  (19, 17100, 'Transcendent', '{"badge": "transcendent"}'),
  (20, 19000, 'Ultimate', '{"badge": "ultimate", "points_bonus": 500}')
ON CONFLICT (level) DO UPDATE SET
  xp_required = EXCLUDED.xp_required,
  title = EXCLUDED.title,
  rewards = EXCLUDED.rewards;

-- =====================================================
-- XP REWARDS CONFIGURATION
-- XP amounts for different actions
-- =====================================================
INSERT INTO public.xp_config (action, xp_amount, description, enabled) VALUES
  -- Entry actions
  ('submit_entry', 50, 'Submit an entry to a contest', true),
  ('entry_approved', 25, 'Entry approved by admin', true),
  
  -- Reaction actions
  ('receive_reaction', 5, 'Receive a reaction on your entry', true),
  ('give_reaction', 2, 'Give a reaction to an entry', true),
  
  -- Comment actions
  ('receive_comment', 10, 'Receive a comment on your entry', true),
  ('give_comment', 5, 'Comment on an entry', true),
  
  -- Social actions
  ('gain_follower', 15, 'Gain a new follower', true),
  ('follow_user', 3, 'Follow another user', true),
  
  -- Contest winning
  ('win_first', 200, 'Win 1st place in a contest', true),
  ('win_second', 150, 'Win 2nd place in a contest', true),
  ('win_third', 100, 'Win 3rd place in a contest', true),
  
  -- Sharing
  ('share_entry', 10, 'Share an entry on social media', true),
  
  -- Profile
  ('complete_profile', 50, 'Complete your profile', true),
  
  -- Daily
  ('daily_login', 10, 'Daily login bonus', true),
  ('daily_vote', 5, 'Daily voting activity', true)
ON CONFLICT (action) DO UPDATE SET
  xp_amount = EXCLUDED.xp_amount,
  description = EXCLUDED.description,
  enabled = EXCLUDED.enabled;

-- =====================================================
-- GRANT EXECUTE PERMISSIONS
-- Allow authenticated users to call functions
-- =====================================================
GRANT EXECUTE ON FUNCTION get_contest_status TO authenticated;
GRANT EXECUTE ON FUNCTION award_xp TO authenticated;
GRANT EXECUTE ON FUNCTION get_level_progress TO authenticated;
GRANT EXECUTE ON FUNCTION add_points TO authenticated;
GRANT EXECUTE ON FUNCTION deduct_points TO authenticated;
GRANT EXECUTE ON FUNCTION finalize_contest_and_select_winners TO authenticated;
GRANT EXECUTE ON FUNCTION create_notification TO authenticated;
GRANT EXECUTE ON FUNCTION is_following TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_stats TO authenticated;

-- =====================================================
-- STORAGE BUCKETS
-- Create storage buckets for file uploads
-- Note: Run this in Supabase Dashboard if it fails here
-- =====================================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('avatars', 'avatars', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']),
  ('covers', 'covers', true, 10485760, ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']),
  ('entries', 'entries', true, 10485760, ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']),
  ('contests', 'contests', true, 10485760, ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']),
  ('sponsors', 'sponsors', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'])
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- STORAGE POLICIES
-- =====================================================

-- Avatars bucket policies
CREATE POLICY "Avatar images are publicly accessible"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload their own avatar"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'avatars' AND auth.role() = 'authenticated');

CREATE POLICY "Users can update their own avatar"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own avatar"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Covers bucket policies
CREATE POLICY "Cover images are publicly accessible"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'covers');

CREATE POLICY "Users can upload their own cover"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'covers' AND auth.role() = 'authenticated');

CREATE POLICY "Users can update their own cover"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'covers' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own cover"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'covers' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Entries bucket policies
CREATE POLICY "Entry images are publicly accessible"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'entries');

CREATE POLICY "Users can upload entry images"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'entries' AND auth.role() = 'authenticated');

CREATE POLICY "Users can update their own entry images"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'entries' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own entry images"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'entries' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Contests bucket policies
CREATE POLICY "Contest images are publicly accessible"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'contests');

CREATE POLICY "Admins can upload contest images"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'contests' AND auth.role() = 'authenticated');

CREATE POLICY "Admins can update contest images"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'contests' AND auth.role() = 'authenticated');

CREATE POLICY "Admins can delete contest images"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'contests' AND auth.role() = 'authenticated');

-- Sponsors bucket policies
CREATE POLICY "Sponsor images are publicly accessible"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'sponsors');

CREATE POLICY "Admins can manage sponsor images"
  ON storage.objects FOR ALL
  USING (bucket_id = 'sponsors' AND auth.role() = 'authenticated');

-- =====================================================
-- SEED DATA COMPLETE
-- Database is ready to use!
-- =====================================================

SELECT 'AFC v2.0 Database Setup Complete!' as status;
SELECT 'Tables: ' || COUNT(*)::text FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE';
SELECT 'Functions: ' || COUNT(*)::text FROM information_schema.routines WHERE routine_schema = 'public';
