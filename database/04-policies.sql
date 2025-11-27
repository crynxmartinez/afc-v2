-- =====================================================
-- AFC v2.0 ROW LEVEL SECURITY POLICIES
-- All RLS policies for data access control
-- 
-- Run this FOURTH in Supabase SQL Editor
-- =====================================================

-- =====================================================
-- ENABLE RLS ON ALL TABLES
-- =====================================================
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comment_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contest_winners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.xp_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.xp_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.levels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_submissions ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- USERS POLICIES
-- =====================================================

-- Anyone can view public profiles
CREATE POLICY "Public profiles are viewable by everyone"
  ON public.users FOR SELECT
  USING (profile_visibility = 'public' OR auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON public.users FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- =====================================================
-- CONTESTS POLICIES
-- =====================================================

-- Anyone can view contests
CREATE POLICY "Contests are viewable by everyone"
  ON public.contests FOR SELECT
  USING (true);

-- Only admins can create contests
CREATE POLICY "Admins can create contests"
  ON public.contests FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

-- Only admins can update contests
CREATE POLICY "Admins can update contests"
  ON public.contests FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

-- Only admins can delete contests
CREATE POLICY "Admins can delete contests"
  ON public.contests FOR DELETE
  USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

-- =====================================================
-- ENTRIES POLICIES
-- =====================================================

-- Anyone can view approved entries
CREATE POLICY "Approved entries are viewable by everyone"
  ON public.entries FOR SELECT
  USING (
    status = 'approved' 
    OR user_id = auth.uid()
    OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

-- Authenticated users can create entries
CREATE POLICY "Authenticated users can create entries"
  ON public.entries FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own entries (if not approved)
CREATE POLICY "Users can update own pending entries"
  ON public.entries FOR UPDATE
  USING (
    (user_id = auth.uid() AND status IN ('draft', 'pending', 'rejected'))
    OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

-- Users can delete their own draft entries
CREATE POLICY "Users can delete own draft entries"
  ON public.entries FOR DELETE
  USING (
    (user_id = auth.uid() AND status = 'draft')
    OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

-- =====================================================
-- REACTIONS POLICIES
-- =====================================================

-- Anyone can view reactions
CREATE POLICY "Reactions are viewable by everyone"
  ON public.reactions FOR SELECT
  USING (true);

-- Authenticated users can add reactions
CREATE POLICY "Authenticated users can add reactions"
  ON public.reactions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can remove their own reactions
CREATE POLICY "Users can remove own reactions"
  ON public.reactions FOR DELETE
  USING (auth.uid() = user_id);

-- =====================================================
-- COMMENTS POLICIES
-- =====================================================

-- Anyone can view comments
CREATE POLICY "Comments are viewable by everyone"
  ON public.comments FOR SELECT
  USING (true);

-- Authenticated users can add comments
CREATE POLICY "Authenticated users can add comments"
  ON public.comments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own comments
CREATE POLICY "Users can update own comments"
  ON public.comments FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete their own comments, admins can delete any
CREATE POLICY "Users can delete own comments"
  ON public.comments FOR DELETE
  USING (
    auth.uid() = user_id
    OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

-- =====================================================
-- COMMENT LIKES POLICIES
-- =====================================================

-- Anyone can view comment likes
CREATE POLICY "Comment likes are viewable by everyone"
  ON public.comment_likes FOR SELECT
  USING (true);

-- Authenticated users can add likes
CREATE POLICY "Authenticated users can add comment likes"
  ON public.comment_likes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can remove their own likes
CREATE POLICY "Users can remove own comment likes"
  ON public.comment_likes FOR DELETE
  USING (auth.uid() = user_id);

-- =====================================================
-- FOLLOWS POLICIES
-- =====================================================

-- Anyone can view follows
CREATE POLICY "Follows are viewable by everyone"
  ON public.follows FOR SELECT
  USING (true);

-- Authenticated users can follow
CREATE POLICY "Authenticated users can follow"
  ON public.follows FOR INSERT
  WITH CHECK (auth.uid() = follower_id);

-- Users can unfollow
CREATE POLICY "Users can unfollow"
  ON public.follows FOR DELETE
  USING (auth.uid() = follower_id);

-- =====================================================
-- NOTIFICATIONS POLICIES
-- =====================================================

-- Users can view their own notifications
CREATE POLICY "Users can view own notifications"
  ON public.notifications FOR SELECT
  USING (auth.uid() = user_id);

-- System can create notifications (via functions)
CREATE POLICY "System can create notifications"
  ON public.notifications FOR INSERT
  WITH CHECK (true);

-- Users can update their own notifications (mark as read)
CREATE POLICY "Users can update own notifications"
  ON public.notifications FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete their own notifications
CREATE POLICY "Users can delete own notifications"
  ON public.notifications FOR DELETE
  USING (auth.uid() = user_id);

-- =====================================================
-- CONTEST WINNERS POLICIES
-- =====================================================

-- Anyone can view winners
CREATE POLICY "Winners are viewable by everyone"
  ON public.contest_winners FOR SELECT
  USING (true);

-- Only system can insert winners (via function)
CREATE POLICY "System can insert winners"
  ON public.contest_winners FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

-- =====================================================
-- TRANSACTIONS POLICIES
-- =====================================================

-- Users can view their own transactions
CREATE POLICY "Users can view own transactions"
  ON public.transactions FOR SELECT
  USING (auth.uid() = user_id);

-- System can create transactions
CREATE POLICY "System can create transactions"
  ON public.transactions FOR INSERT
  WITH CHECK (true);

-- =====================================================
-- XP CONFIG POLICIES
-- =====================================================

-- Anyone can view XP config
CREATE POLICY "XP config is viewable by everyone"
  ON public.xp_config FOR SELECT
  USING (true);

-- Only admins can modify XP config
CREATE POLICY "Admins can modify XP config"
  ON public.xp_config FOR ALL
  USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

-- =====================================================
-- XP HISTORY POLICIES
-- =====================================================

-- Users can view their own XP history
CREATE POLICY "Users can view own XP history"
  ON public.xp_history FOR SELECT
  USING (auth.uid() = user_id);

-- System can insert XP history
CREATE POLICY "System can insert XP history"
  ON public.xp_history FOR INSERT
  WITH CHECK (true);

-- =====================================================
-- LEVELS POLICIES
-- =====================================================

-- Anyone can view levels
CREATE POLICY "Levels are viewable by everyone"
  ON public.levels FOR SELECT
  USING (true);

-- Only admins can modify levels
CREATE POLICY "Admins can modify levels"
  ON public.levels FOR ALL
  USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

-- =====================================================
-- SHARES POLICIES
-- =====================================================

-- Anyone can view shares
CREATE POLICY "Shares are viewable by everyone"
  ON public.shares FOR SELECT
  USING (true);

-- Authenticated users can create shares
CREATE POLICY "Authenticated users can create shares"
  ON public.shares FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- =====================================================
-- CONTACT SUBMISSIONS POLICIES
-- =====================================================

-- Users can view their own submissions
CREATE POLICY "Users can view own contact submissions"
  ON public.contact_submissions FOR SELECT
  USING (
    auth.uid() = user_id
    OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

-- Anyone can create contact submissions
CREATE POLICY "Anyone can create contact submissions"
  ON public.contact_submissions FOR INSERT
  WITH CHECK (true);

-- Only admins can update contact submissions
CREATE POLICY "Admins can update contact submissions"
  ON public.contact_submissions FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

-- =====================================================
-- POLICIES COMPLETE
-- Next: Run 05-seed.sql
-- =====================================================
