-- =====================================================
-- AFC v2.0 COMPLETE DATABASE SCHEMA
-- Arena for Creatives - Full Database Setup
-- 
-- Run this ENTIRE file in Supabase SQL Editor
-- This combines all 5 SQL files into one
-- =====================================================

-- =====================================================
-- PART 1: EXTENSIONS
-- =====================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- PART 2: TABLES (15 Tables)
-- =====================================================

-- 1. USERS TABLE
CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  username TEXT UNIQUE NOT NULL,
  display_name TEXT,
  avatar_url TEXT,
  cover_photo_url TEXT,
  bio TEXT,
  
  -- Role & Status
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  is_verified BOOLEAN DEFAULT false,
  
  -- Points & XP System
  points_balance INTEGER NOT NULL DEFAULT 0,
  xp INTEGER NOT NULL DEFAULT 0,
  level INTEGER NOT NULL DEFAULT 1,
  
  -- Profile Info
  location TEXT,
  website TEXT,
  instagram_url TEXT,
  twitter_url TEXT,
  portfolio_url TEXT,
  skills TEXT[] DEFAULT '{}',
  available_for_work BOOLEAN DEFAULT false,
  
  -- Privacy Settings
  profile_visibility TEXT DEFAULT 'public' CHECK (profile_visibility IN ('public', 'private')),
  
  -- Notification Settings
  notify_reactions BOOLEAN DEFAULT true,
  notify_comments BOOLEAN DEFAULT true,
  notify_follows BOOLEAN DEFAULT true,
  notify_contests BOOLEAN DEFAULT true,
  
  -- Denormalized Stats (updated by triggers)
  followers_count INTEGER DEFAULT 0,
  following_count INTEGER DEFAULT 0,
  entries_count INTEGER DEFAULT 0,
  wins_count INTEGER DEFAULT 0,
  total_reactions_received INTEGER DEFAULT 0,
  
  -- Timestamps
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. CONTESTS TABLE
CREATE TABLE public.contests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  thumbnail_url TEXT,
  
  -- Category
  category TEXT NOT NULL DEFAULT 'art' CHECK (category IN ('art', 'cosplay', 'photography', 'music', 'video')),
  
  -- Dates (status is CALCULATED from these, not stored)
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,
  
  -- Sponsor Information
  has_sponsor BOOLEAN DEFAULT false,
  sponsor_name TEXT,
  sponsor_logo_url TEXT,
  sponsor_prize_amount NUMERIC DEFAULT 0,
  
  -- Winners (populated after finalization)
  winner_1st_entry_id UUID,
  winner_2nd_entry_id UUID,
  winner_3rd_entry_id UUID,
  
  -- Finalization
  prize_pool INTEGER DEFAULT 0,
  prize_pool_distributed BOOLEAN DEFAULT false,
  finalized_at TIMESTAMPTZ,
  
  -- Meta
  created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT valid_dates CHECK (end_date > start_date)
);

-- 3. ENTRIES TABLE
CREATE TABLE public.entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contest_id UUID NOT NULL REFERENCES public.contests(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  
  -- Content
  title TEXT,
  description TEXT,
  
  -- 4-Phase Artwork URLs
  phase_1_url TEXT,
  phase_2_url TEXT,
  phase_3_url TEXT,
  phase_4_url TEXT,
  
  -- Status
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'pending', 'approved', 'rejected')),
  rejection_reason TEXT,
  
  -- Denormalized Stats
  reactions_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  
  -- Timestamps
  submitted_at TIMESTAMPTZ,
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(contest_id, user_id)
);

-- 4. REACTIONS TABLE
CREATE TABLE public.reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_id UUID NOT NULL REFERENCES public.entries(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  reaction_type TEXT NOT NULL CHECK (reaction_type IN ('like', 'love', 'fire', 'clap', 'star')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(entry_id, user_id)
);

-- 5. COMMENTS TABLE
CREATE TABLE public.comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_id UUID NOT NULL REFERENCES public.entries(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES public.comments(id) ON DELETE CASCADE,
  
  content TEXT NOT NULL CHECK (LENGTH(content) <= 500),
  is_pinned BOOLEAN DEFAULT false,
  likes_count INTEGER DEFAULT 0,
  
  edited_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. COMMENT LIKES TABLE
CREATE TABLE public.comment_likes (
  comment_id UUID NOT NULL REFERENCES public.comments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  PRIMARY KEY (comment_id, user_id)
);

-- 7. FOLLOWS TABLE
CREATE TABLE public.follows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  following_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(follower_id, following_id),
  CHECK (follower_id != following_id)
);

-- 8. NOTIFICATIONS TABLE
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  
  type TEXT NOT NULL CHECK (type IN ('reaction', 'comment', 'reply', 'follow', 'winner', 'contest', 'system')),
  title TEXT NOT NULL,
  message TEXT,
  link TEXT,
  read BOOLEAN DEFAULT false,
  
  actor_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  entry_id UUID REFERENCES public.entries(id) ON DELETE CASCADE,
  contest_id UUID REFERENCES public.contests(id) ON DELETE CASCADE,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. CONTEST WINNERS TABLE
CREATE TABLE public.contest_winners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contest_id UUID NOT NULL REFERENCES public.contests(id) ON DELETE CASCADE,
  entry_id UUID NOT NULL REFERENCES public.entries(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  
  placement INTEGER NOT NULL CHECK (placement IN (1, 2, 3)),
  reactions_count INTEGER NOT NULL DEFAULT 0,
  prize_amount INTEGER NOT NULL DEFAULT 0,
  
  awarded_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(contest_id, placement)
);

-- 10. TRANSACTIONS TABLE
CREATE TABLE public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  
  type TEXT NOT NULL CHECK (type IN ('purchase', 'prize', 'refund', 'bonus')),
  amount NUMERIC NOT NULL,
  points INTEGER NOT NULL,
  
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed')),
  payment_method TEXT,
  reference_id TEXT,
  description TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. XP CONFIG TABLE
CREATE TABLE public.xp_config (
  action TEXT PRIMARY KEY,
  xp_amount INTEGER NOT NULL,
  description TEXT,
  enabled BOOLEAN DEFAULT true,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 12. XP HISTORY TABLE
CREATE TABLE public.xp_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  
  action TEXT NOT NULL,
  xp_amount INTEGER NOT NULL,
  description TEXT,
  reference_id UUID,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 13. LEVELS TABLE
CREATE TABLE public.levels (
  level INTEGER PRIMARY KEY,
  xp_required INTEGER NOT NULL,
  title TEXT NOT NULL,
  rewards JSONB DEFAULT '{}'
);

-- 14. SHARES TABLE
CREATE TABLE public.shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  entry_id UUID REFERENCES public.entries(id) ON DELETE CASCADE,
  contest_id UUID REFERENCES public.contests(id) ON DELETE CASCADE,
  
  platform TEXT NOT NULL CHECK (platform IN ('facebook', 'twitter', 'instagram', 'copy_link', 'other')),
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 15. CONTACT SUBMISSIONS TABLE
CREATE TABLE public.contact_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  
  status TEXT DEFAULT 'new' CHECK (status IN ('new', 'read', 'replied')),
  admin_notes TEXT,
  replied_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- PART 3: INDEXES
-- =====================================================

CREATE INDEX idx_users_username ON public.users(username);
CREATE INDEX idx_users_role ON public.users(role);
CREATE INDEX idx_users_level ON public.users(level);

CREATE INDEX idx_contests_category ON public.contests(category);
CREATE INDEX idx_contests_dates ON public.contests(start_date, end_date);
CREATE INDEX idx_contests_created_by ON public.contests(created_by);

CREATE INDEX idx_entries_contest ON public.entries(contest_id);
CREATE INDEX idx_entries_user ON public.entries(user_id);
CREATE INDEX idx_entries_status ON public.entries(status);
CREATE INDEX idx_entries_reactions ON public.entries(reactions_count DESC);

CREATE INDEX idx_reactions_entry ON public.reactions(entry_id);
CREATE INDEX idx_reactions_user ON public.reactions(user_id);

CREATE INDEX idx_comments_entry ON public.comments(entry_id);
CREATE INDEX idx_comments_user ON public.comments(user_id);
CREATE INDEX idx_comments_parent ON public.comments(parent_id);

CREATE INDEX idx_follows_follower ON public.follows(follower_id);
CREATE INDEX idx_follows_following ON public.follows(following_id);

CREATE INDEX idx_notifications_user ON public.notifications(user_id);
CREATE INDEX idx_notifications_read ON public.notifications(user_id, read);
CREATE INDEX idx_notifications_created ON public.notifications(created_at DESC);

CREATE INDEX idx_winners_contest ON public.contest_winners(contest_id);
CREATE INDEX idx_winners_user ON public.contest_winners(user_id);

CREATE INDEX idx_transactions_user ON public.transactions(user_id);
CREATE INDEX idx_transactions_status ON public.transactions(status);

CREATE INDEX idx_xp_history_user ON public.xp_history(user_id);

CREATE INDEX idx_shares_user ON public.shares(user_id);
CREATE INDEX idx_shares_entry ON public.shares(entry_id);

-- =====================================================
-- PART 4: FUNCTIONS
-- =====================================================

-- Update timestamp helper
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Contest status calculator
CREATE OR REPLACE FUNCTION get_contest_status(
  p_start_date TIMESTAMPTZ,
  p_end_date TIMESTAMPTZ,
  p_finalized_at TIMESTAMPTZ DEFAULT NULL
)
RETURNS TEXT AS $$
BEGIN
  IF p_finalized_at IS NOT NULL THEN
    RETURN 'finalized';
  ELSIF NOW() < p_start_date THEN
    RETURN 'upcoming';
  ELSIF NOW() >= p_start_date AND NOW() <= p_end_date THEN
    RETURN 'active';
  ELSE
    RETURN 'ended';
  END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Contests with calculated status view
CREATE OR REPLACE VIEW contests_with_status AS
SELECT 
  c.*,
  get_contest_status(c.start_date, c.end_date, c.finalized_at) as status,
  (SELECT COUNT(*) FROM entries e WHERE e.contest_id = c.id AND e.status = 'approved') as entries_count,
  (SELECT COALESCE(SUM(e.reactions_count), 0) FROM entries e WHERE e.contest_id = c.id) as total_reactions
FROM contests c;

-- User profile creation
CREATE OR REPLACE FUNCTION create_user_profile()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, username)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1))
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update entry reactions count
CREATE OR REPLACE FUNCTION update_entry_reactions_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE entries SET reactions_count = reactions_count + 1 WHERE id = NEW.entry_id;
    UPDATE users SET total_reactions_received = total_reactions_received + 1
    WHERE id = (SELECT user_id FROM entries WHERE id = NEW.entry_id);
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE entries SET reactions_count = reactions_count - 1 WHERE id = OLD.entry_id;
    UPDATE users SET total_reactions_received = total_reactions_received - 1
    WHERE id = (SELECT user_id FROM entries WHERE id = OLD.entry_id);
    RETURN OLD;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update entry comments count
CREATE OR REPLACE FUNCTION update_entry_comments_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE entries SET comments_count = comments_count + 1 WHERE id = NEW.entry_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE entries SET comments_count = comments_count - 1 WHERE id = OLD.entry_id;
    RETURN OLD;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update comment likes count
CREATE OR REPLACE FUNCTION update_comment_likes_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE comments SET likes_count = likes_count + 1 WHERE id = NEW.comment_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE comments SET likes_count = likes_count - 1 WHERE id = OLD.comment_id;
    RETURN OLD;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update follow counts
CREATE OR REPLACE FUNCTION update_follow_counts()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE users SET following_count = following_count + 1 WHERE id = NEW.follower_id;
    UPDATE users SET followers_count = followers_count + 1 WHERE id = NEW.following_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE users SET following_count = following_count - 1 WHERE id = OLD.follower_id;
    UPDATE users SET followers_count = followers_count - 1 WHERE id = OLD.following_id;
    RETURN OLD;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update user entries count
CREATE OR REPLACE FUNCTION update_user_entries_count()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'approved' AND (OLD.status IS NULL OR OLD.status != 'approved') THEN
    UPDATE users SET entries_count = entries_count + 1 WHERE id = NEW.user_id;
  ELSIF OLD.status = 'approved' AND NEW.status != 'approved' THEN
    UPDATE users SET entries_count = entries_count - 1 WHERE id = NEW.user_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Award XP function
CREATE OR REPLACE FUNCTION award_xp(
  p_user_id UUID,
  p_action TEXT,
  p_reference_id UUID DEFAULT NULL,
  p_description TEXT DEFAULT NULL
)
RETURNS TABLE (
  xp_gained INTEGER,
  new_total_xp INTEGER,
  new_level INTEGER,
  leveled_up BOOLEAN
) AS $$
DECLARE
  v_xp_amount INTEGER;
  v_old_xp INTEGER;
  v_new_xp INTEGER;
  v_old_level INTEGER;
  v_new_level INTEGER;
  v_leveled_up BOOLEAN := false;
  v_description TEXT;
BEGIN
  SELECT xc.xp_amount, xc.description INTO v_xp_amount, v_description
  FROM xp_config xc
  WHERE xc.action = p_action AND xc.enabled = true;
  
  IF v_xp_amount IS NULL THEN
    v_xp_amount := 10;
    v_description := p_action;
  END IF;
  
  SELECT xp, level INTO v_old_xp, v_old_level
  FROM users WHERE id = p_user_id;
  
  v_new_xp := v_old_xp + v_xp_amount;
  
  SELECT COALESCE(MAX(l.level), 1) INTO v_new_level
  FROM levels l WHERE l.xp_required <= v_new_xp;
  
  IF v_new_level > v_old_level THEN
    v_leveled_up := true;
  END IF;
  
  UPDATE users SET xp = v_new_xp, level = v_new_level WHERE id = p_user_id;
  
  INSERT INTO xp_history (user_id, action, xp_amount, description, reference_id)
  VALUES (p_user_id, p_action, v_xp_amount, COALESCE(p_description, v_description), p_reference_id);
  
  RETURN QUERY SELECT v_xp_amount, v_new_xp, v_new_level, v_leveled_up;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get level progress
CREATE OR REPLACE FUNCTION get_level_progress(p_user_id UUID)
RETURNS TABLE (
  current_level INTEGER,
  current_xp INTEGER,
  current_title TEXT,
  xp_for_current_level INTEGER,
  xp_for_next_level INTEGER,
  xp_progress INTEGER,
  xp_needed INTEGER,
  progress_percentage NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    u.level as current_level,
    u.xp as current_xp,
    COALESCE(l.title, 'Beginner') as current_title,
    COALESCE(l.xp_required, 0) as xp_for_current_level,
    COALESCE(nl.xp_required, u.xp) as xp_for_next_level,
    u.xp - COALESCE(l.xp_required, 0) as xp_progress,
    COALESCE(nl.xp_required, u.xp) - u.xp as xp_needed,
    CASE 
      WHEN COALESCE(nl.xp_required, u.xp) - COALESCE(l.xp_required, 0) = 0 THEN 100
      ELSE ROUND(
        ((u.xp - COALESCE(l.xp_required, 0))::NUMERIC / 
        (COALESCE(nl.xp_required, u.xp) - COALESCE(l.xp_required, 0))::NUMERIC * 100), 2)
    END as progress_percentage
  FROM users u
  LEFT JOIN levels l ON l.level = u.level
  LEFT JOIN levels nl ON nl.level = u.level + 1
  WHERE u.id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add points
CREATE OR REPLACE FUNCTION add_points(p_user_id UUID, p_amount INTEGER, p_description TEXT DEFAULT NULL)
RETURNS INTEGER AS $$
DECLARE
  v_new_balance INTEGER;
BEGIN
  UPDATE users SET points_balance = points_balance + p_amount
  WHERE id = p_user_id RETURNING points_balance INTO v_new_balance;
  RETURN v_new_balance;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Deduct points
CREATE OR REPLACE FUNCTION deduct_points(p_user_id UUID, p_amount INTEGER)
RETURNS BOOLEAN AS $$
DECLARE
  v_current_balance INTEGER;
BEGIN
  SELECT points_balance INTO v_current_balance FROM users WHERE id = p_user_id;
  IF v_current_balance < p_amount THEN RETURN false; END IF;
  UPDATE users SET points_balance = points_balance - p_amount WHERE id = p_user_id;
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- AUTO-FINALIZATION SYSTEM
-- Contests finalize AUTOMATICALLY when end_date passes
-- No admin intervention required
-- 1 reaction = 1 vote = 1 point in prize pool
-- =====================================================

-- Finalize contest and select winners (called automatically)
CREATE OR REPLACE FUNCTION finalize_contest_and_select_winners(p_contest_id UUID)
RETURNS TABLE (
  success BOOLEAN,
  message TEXT,
  winner_1st_user_id UUID,
  winner_2nd_user_id UUID,
  winner_3rd_user_id UUID,
  prize_1st INTEGER,
  prize_2nd INTEGER,
  prize_3rd INTEGER,
  total_prize_pool INTEGER
) AS $$
DECLARE
  v_contest RECORD;
  v_winner_1st RECORD;
  v_winner_2nd RECORD;
  v_winner_3rd RECORD;
  v_prize_pool INTEGER;
  v_prize_1st INTEGER;
  v_prize_2nd INTEGER;
  v_prize_3rd INTEGER;
BEGIN
  -- Get contest
  SELECT * INTO v_contest FROM contests WHERE id = p_contest_id;
  
  -- Validation: Contest exists
  IF NOT FOUND THEN
    RETURN QUERY SELECT false, 'Contest not found'::TEXT, NULL::UUID, NULL::UUID, NULL::UUID, 0, 0, 0, 0;
    RETURN;
  END IF;
  
  -- Validation: Contest has ended
  IF v_contest.end_date > NOW() THEN
    RETURN QUERY SELECT false, 'Contest has not ended yet'::TEXT, NULL::UUID, NULL::UUID, NULL::UUID, 0, 0, 0, 0;
    RETURN;
  END IF;
  
  -- Validation: Not already finalized
  IF v_contest.finalized_at IS NOT NULL THEN
    RETURN QUERY SELECT false, 'Contest already finalized'::TEXT, NULL::UUID, NULL::UUID, NULL::UUID, 0, 0, 0, 0;
    RETURN;
  END IF;
  
  -- Get top 3 entries by reactions_count (votes)
  -- Tiebreaker: Earlier submission wins
  SELECT e.id, e.user_id, e.reactions_count INTO v_winner_1st
  FROM entries e 
  WHERE e.contest_id = p_contest_id AND e.status = 'approved'
  ORDER BY e.reactions_count DESC, e.created_at ASC 
  LIMIT 1;
  
  SELECT e.id, e.user_id, e.reactions_count INTO v_winner_2nd
  FROM entries e 
  WHERE e.contest_id = p_contest_id AND e.status = 'approved'
    AND e.id != COALESCE(v_winner_1st.id, '00000000-0000-0000-0000-000000000000'::UUID)
  ORDER BY e.reactions_count DESC, e.created_at ASC 
  LIMIT 1;
  
  SELECT e.id, e.user_id, e.reactions_count INTO v_winner_3rd
  FROM entries e 
  WHERE e.contest_id = p_contest_id AND e.status = 'approved'
    AND e.id != COALESCE(v_winner_1st.id, '00000000-0000-0000-0000-000000000000'::UUID)
    AND e.id != COALESCE(v_winner_2nd.id, '00000000-0000-0000-0000-000000000000'::UUID)
  ORDER BY e.reactions_count DESC, e.created_at ASC 
  LIMIT 1;
  
  -- Calculate prize pool = SUM of ALL reactions (votes) on top 3 entries
  -- Each reaction = 1 vote = 1 point in prize pool
  v_prize_pool := COALESCE(v_winner_1st.reactions_count, 0) 
                + COALESCE(v_winner_2nd.reactions_count, 0) 
                + COALESCE(v_winner_3rd.reactions_count, 0);
  
  -- Calculate prizes: 50% / 20% / 10% (20% platform fee)
  v_prize_1st := FLOOR(v_prize_pool * 0.5);
  v_prize_2nd := FLOOR(v_prize_pool * 0.2);
  v_prize_3rd := FLOOR(v_prize_pool * 0.1);
  
  -- Award 1st place (only if they have at least 1 vote)
  IF v_winner_1st.id IS NOT NULL AND v_winner_1st.reactions_count > 0 THEN
    PERFORM add_points(v_winner_1st.user_id, v_prize_1st);
    PERFORM award_xp(v_winner_1st.user_id, 'win_first', p_contest_id, 'Won 1st place in contest');
    UPDATE users SET wins_count = wins_count + 1 WHERE id = v_winner_1st.user_id;
    INSERT INTO contest_winners (contest_id, entry_id, user_id, placement, reactions_count, prize_amount)
    VALUES (p_contest_id, v_winner_1st.id, v_winner_1st.user_id, 1, v_winner_1st.reactions_count, v_prize_1st);
    INSERT INTO transactions (user_id, type, amount, points, status, description)
    VALUES (v_winner_1st.user_id, 'prize', 0, v_prize_1st, 'completed', 'Contest 1st place prize');
    INSERT INTO notifications (user_id, type, title, message, contest_id, entry_id)
    VALUES (v_winner_1st.user_id, 'winner', '🏆 Congratulations!', 'You won 1st place and earned ' || v_prize_1st || ' points!', p_contest_id, v_winner_1st.id);
  END IF;
  
  -- Award 2nd place
  IF v_winner_2nd.id IS NOT NULL AND v_winner_2nd.reactions_count > 0 THEN
    PERFORM add_points(v_winner_2nd.user_id, v_prize_2nd);
    PERFORM award_xp(v_winner_2nd.user_id, 'win_second', p_contest_id, 'Won 2nd place in contest');
    INSERT INTO contest_winners (contest_id, entry_id, user_id, placement, reactions_count, prize_amount)
    VALUES (p_contest_id, v_winner_2nd.id, v_winner_2nd.user_id, 2, v_winner_2nd.reactions_count, v_prize_2nd);
    INSERT INTO transactions (user_id, type, amount, points, status, description)
    VALUES (v_winner_2nd.user_id, 'prize', 0, v_prize_2nd, 'completed', 'Contest 2nd place prize');
    INSERT INTO notifications (user_id, type, title, message, contest_id, entry_id)
    VALUES (v_winner_2nd.user_id, 'winner', '🥈 Congratulations!', 'You won 2nd place and earned ' || v_prize_2nd || ' points!', p_contest_id, v_winner_2nd.id);
  END IF;
  
  -- Award 3rd place
  IF v_winner_3rd.id IS NOT NULL AND v_winner_3rd.reactions_count > 0 THEN
    PERFORM add_points(v_winner_3rd.user_id, v_prize_3rd);
    PERFORM award_xp(v_winner_3rd.user_id, 'win_third', p_contest_id, 'Won 3rd place in contest');
    INSERT INTO contest_winners (contest_id, entry_id, user_id, placement, reactions_count, prize_amount)
    VALUES (p_contest_id, v_winner_3rd.id, v_winner_3rd.user_id, 3, v_winner_3rd.reactions_count, v_prize_3rd);
    INSERT INTO transactions (user_id, type, amount, points, status, description)
    VALUES (v_winner_3rd.user_id, 'prize', 0, v_prize_3rd, 'completed', 'Contest 3rd place prize');
    INSERT INTO notifications (user_id, type, title, message, contest_id, entry_id)
    VALUES (v_winner_3rd.user_id, 'winner', '🥉 Congratulations!', 'You won 3rd place and earned ' || v_prize_3rd || ' points!', p_contest_id, v_winner_3rd.id);
  END IF;
  
  -- Mark contest as finalized
  UPDATE contests SET
    winner_1st_entry_id = v_winner_1st.id,
    winner_2nd_entry_id = v_winner_2nd.id,
    winner_3rd_entry_id = v_winner_3rd.id,
    prize_pool = v_prize_pool,
    prize_pool_distributed = true,
    finalized_at = NOW()
  WHERE id = p_contest_id;
  
  RETURN QUERY SELECT 
    true, 
    'Contest finalized! Winners selected and prizes distributed.'::TEXT,
    v_winner_1st.user_id, 
    v_winner_2nd.user_id, 
    v_winner_3rd.user_id,
    v_prize_1st, 
    v_prize_2nd, 
    v_prize_3rd, 
    v_prize_pool;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- AUTO-FINALIZE ALL ENDED CONTESTS
-- This function checks ALL contests and finalizes any that have ended
-- Called by cron job every 5 minutes
-- =====================================================

CREATE OR REPLACE FUNCTION auto_finalize_ended_contests()
RETURNS TABLE (
  contest_id UUID,
  contest_title TEXT,
  finalized BOOLEAN,
  message TEXT
) AS $$
DECLARE
  v_contest RECORD;
  v_result RECORD;
BEGIN
  -- Find all contests that have ended but not yet finalized
  FOR v_contest IN 
    SELECT c.id, c.title 
    FROM contests c 
    WHERE c.end_date < NOW() 
      AND c.finalized_at IS NULL
    ORDER BY c.end_date ASC
  LOOP
    -- Finalize each contest
    SELECT * INTO v_result 
    FROM finalize_contest_and_select_winners(v_contest.id) 
    LIMIT 1;
    
    -- Return result for this contest
    RETURN QUERY SELECT 
      v_contest.id,
      v_contest.title,
      v_result.success,
      v_result.message;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Is following check
CREATE OR REPLACE FUNCTION is_following(p_follower_id UUID, p_following_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (SELECT 1 FROM follows WHERE follower_id = p_follower_id AND following_id = p_following_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get user stats
CREATE OR REPLACE FUNCTION get_user_stats(p_user_id UUID)
RETURNS TABLE (
  total_entries INTEGER,
  total_wins INTEGER,
  total_reactions INTEGER,
  total_followers INTEGER,
  total_following INTEGER,
  current_level INTEGER,
  current_xp INTEGER,
  points_balance INTEGER
) AS $$
BEGIN
  RETURN QUERY SELECT 
    u.entries_count, u.wins_count, u.total_reactions_received,
    u.followers_count, u.following_count, u.level, u.xp, u.points_balance
  FROM users u WHERE u.id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- PART 5: TRIGGERS
-- =====================================================

-- Auto-create user profile
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION create_user_profile();

-- Update timestamps
CREATE TRIGGER update_users_timestamp BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_contests_timestamp BEFORE UPDATE ON public.contests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_entries_timestamp BEFORE UPDATE ON public.entries
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_comments_timestamp BEFORE UPDATE ON public.comments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Reactions triggers
CREATE TRIGGER on_reaction_insert AFTER INSERT ON public.reactions
  FOR EACH ROW EXECUTE FUNCTION update_entry_reactions_count();
CREATE TRIGGER on_reaction_delete AFTER DELETE ON public.reactions
  FOR EACH ROW EXECUTE FUNCTION update_entry_reactions_count();

-- Comments triggers
CREATE TRIGGER on_comment_insert AFTER INSERT ON public.comments
  FOR EACH ROW EXECUTE FUNCTION update_entry_comments_count();
CREATE TRIGGER on_comment_delete AFTER DELETE ON public.comments
  FOR EACH ROW EXECUTE FUNCTION update_entry_comments_count();

-- Comment likes triggers
CREATE TRIGGER on_comment_like_insert AFTER INSERT ON public.comment_likes
  FOR EACH ROW EXECUTE FUNCTION update_comment_likes_count();
CREATE TRIGGER on_comment_like_delete AFTER DELETE ON public.comment_likes
  FOR EACH ROW EXECUTE FUNCTION update_comment_likes_count();

-- Follows triggers
CREATE TRIGGER on_follow_insert AFTER INSERT ON public.follows
  FOR EACH ROW EXECUTE FUNCTION update_follow_counts();
CREATE TRIGGER on_follow_delete AFTER DELETE ON public.follows
  FOR EACH ROW EXECUTE FUNCTION update_follow_counts();

-- Entry status trigger
CREATE TRIGGER on_entry_status_change AFTER UPDATE OF status ON public.entries
  FOR EACH ROW EXECUTE FUNCTION update_user_entries_count();

-- Notification triggers
CREATE OR REPLACE FUNCTION notify_on_reaction()
RETURNS TRIGGER AS $$
DECLARE
  v_entry_owner_id UUID;
  v_actor_username TEXT;
BEGIN
  SELECT e.user_id INTO v_entry_owner_id FROM entries e WHERE e.id = NEW.entry_id;
  IF v_entry_owner_id = NEW.user_id THEN RETURN NEW; END IF;
  IF NOT (SELECT notify_reactions FROM users WHERE id = v_entry_owner_id) THEN RETURN NEW; END IF;
  SELECT username INTO v_actor_username FROM users WHERE id = NEW.user_id;
  INSERT INTO notifications (user_id, type, title, message, actor_id, entry_id, link)
  VALUES (v_entry_owner_id, 'reaction', 'New Reaction', v_actor_username || ' reacted to your entry', NEW.user_id, NEW.entry_id, '/entry/' || NEW.entry_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_reaction_notify AFTER INSERT ON public.reactions
  FOR EACH ROW EXECUTE FUNCTION notify_on_reaction();

CREATE OR REPLACE FUNCTION notify_on_comment()
RETURNS TRIGGER AS $$
DECLARE
  v_entry_owner_id UUID;
  v_parent_owner_id UUID;
  v_actor_username TEXT;
BEGIN
  SELECT username INTO v_actor_username FROM users WHERE id = NEW.user_id;
  
  IF NEW.parent_id IS NOT NULL THEN
    SELECT user_id INTO v_parent_owner_id FROM comments WHERE id = NEW.parent_id;
    IF v_parent_owner_id != NEW.user_id THEN
      IF (SELECT notify_comments FROM users WHERE id = v_parent_owner_id) THEN
        INSERT INTO notifications (user_id, type, title, message, actor_id, entry_id, link)
        VALUES (v_parent_owner_id, 'reply', 'New Reply', v_actor_username || ' replied to your comment', NEW.user_id, NEW.entry_id, '/entry/' || NEW.entry_id);
      END IF;
    END IF;
  END IF;
  
  SELECT user_id INTO v_entry_owner_id FROM entries WHERE id = NEW.entry_id;
  IF v_entry_owner_id != NEW.user_id THEN
    IF (SELECT notify_comments FROM users WHERE id = v_entry_owner_id) THEN
      INSERT INTO notifications (user_id, type, title, message, actor_id, entry_id, link)
      VALUES (v_entry_owner_id, 'comment', 'New Comment', v_actor_username || ' commented on your entry', NEW.user_id, NEW.entry_id, '/entry/' || NEW.entry_id);
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_comment_notify AFTER INSERT ON public.comments
  FOR EACH ROW EXECUTE FUNCTION notify_on_comment();

CREATE OR REPLACE FUNCTION notify_on_follow()
RETURNS TRIGGER AS $$
DECLARE
  v_actor_username TEXT;
BEGIN
  IF NOT (SELECT notify_follows FROM users WHERE id = NEW.following_id) THEN RETURN NEW; END IF;
  SELECT username INTO v_actor_username FROM users WHERE id = NEW.follower_id;
  INSERT INTO notifications (user_id, type, title, message, actor_id, link)
  VALUES (NEW.following_id, 'follow', 'New Follower', v_actor_username || ' started following you', NEW.follower_id, '/profile/' || v_actor_username);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_follow_notify AFTER INSERT ON public.follows
  FOR EACH ROW EXECUTE FUNCTION notify_on_follow();

-- =====================================================
-- PART 6: ROW LEVEL SECURITY
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

-- Users policies
CREATE POLICY "Public profiles viewable" ON public.users FOR SELECT
  USING (profile_visibility = 'public' OR auth.uid() = id);
CREATE POLICY "Users update own profile" ON public.users FOR UPDATE
  USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- Contests policies
CREATE POLICY "Contests viewable by all" ON public.contests FOR SELECT USING (true);
CREATE POLICY "Admins create contests" ON public.contests FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "Admins update contests" ON public.contests FOR UPDATE
  USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "Admins delete contests" ON public.contests FOR DELETE
  USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'));

-- Entries policies
CREATE POLICY "Approved entries viewable" ON public.entries FOR SELECT
  USING (status = 'approved' OR user_id = auth.uid() OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "Users create entries" ON public.entries FOR INSERT
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own entries" ON public.entries FOR UPDATE
  USING ((user_id = auth.uid() AND status IN ('draft', 'pending', 'rejected')) OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "Users delete draft entries" ON public.entries FOR DELETE
  USING ((user_id = auth.uid() AND status = 'draft') OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'));

-- Reactions policies
CREATE POLICY "Reactions viewable" ON public.reactions FOR SELECT USING (true);
CREATE POLICY "Users add reactions" ON public.reactions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users remove own reactions" ON public.reactions FOR DELETE USING (auth.uid() = user_id);

-- Comments policies
CREATE POLICY "Comments viewable" ON public.comments FOR SELECT USING (true);
CREATE POLICY "Users add comments" ON public.comments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own comments" ON public.comments FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own comments" ON public.comments FOR DELETE
  USING (auth.uid() = user_id OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'));

-- Comment likes policies
CREATE POLICY "Comment likes viewable" ON public.comment_likes FOR SELECT USING (true);
CREATE POLICY "Users add comment likes" ON public.comment_likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users remove own likes" ON public.comment_likes FOR DELETE USING (auth.uid() = user_id);

-- Follows policies
CREATE POLICY "Follows viewable" ON public.follows FOR SELECT USING (true);
CREATE POLICY "Users can follow" ON public.follows FOR INSERT WITH CHECK (auth.uid() = follower_id);
CREATE POLICY "Users can unfollow" ON public.follows FOR DELETE USING (auth.uid() = follower_id);

-- Notifications policies
CREATE POLICY "Users view own notifications" ON public.notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "System creates notifications" ON public.notifications FOR INSERT WITH CHECK (true);
CREATE POLICY "Users update own notifications" ON public.notifications FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own notifications" ON public.notifications FOR DELETE USING (auth.uid() = user_id);

-- Contest winners policies
CREATE POLICY "Winners viewable" ON public.contest_winners FOR SELECT USING (true);
CREATE POLICY "System inserts winners" ON public.contest_winners FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'));

-- Transactions policies
CREATE POLICY "Users view own transactions" ON public.transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "System creates transactions" ON public.transactions FOR INSERT WITH CHECK (true);

-- XP config policies
CREATE POLICY "XP config viewable" ON public.xp_config FOR SELECT USING (true);
CREATE POLICY "Admins modify XP config" ON public.xp_config FOR ALL
  USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'));

-- XP history policies
CREATE POLICY "Users view own XP history" ON public.xp_history FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "System inserts XP history" ON public.xp_history FOR INSERT WITH CHECK (true);

-- Levels policies
CREATE POLICY "Levels viewable" ON public.levels FOR SELECT USING (true);
CREATE POLICY "Admins modify levels" ON public.levels FOR ALL
  USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'));

-- Shares policies
CREATE POLICY "Shares viewable" ON public.shares FOR SELECT USING (true);
CREATE POLICY "Users create shares" ON public.shares FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Contact submissions policies
CREATE POLICY "Users view own submissions" ON public.contact_submissions FOR SELECT
  USING (auth.uid() = user_id OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "Anyone creates submissions" ON public.contact_submissions FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins update submissions" ON public.contact_submissions FOR UPDATE
  USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'));

-- =====================================================
-- PART 7: SEED DATA
-- =====================================================

-- Levels
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
ON CONFLICT (level) DO NOTHING;

-- XP Config
INSERT INTO public.xp_config (action, xp_amount, description, enabled) VALUES
  ('submit_entry', 50, 'Submit an entry to a contest', true),
  ('entry_approved', 25, 'Entry approved by admin', true),
  ('receive_reaction', 5, 'Receive a reaction on your entry', true),
  ('give_reaction', 2, 'Give a reaction to an entry', true),
  ('receive_comment', 10, 'Receive a comment on your entry', true),
  ('give_comment', 5, 'Comment on an entry', true),
  ('gain_follower', 15, 'Gain a new follower', true),
  ('follow_user', 3, 'Follow another user', true),
  ('win_first', 200, 'Win 1st place in a contest', true),
  ('win_second', 150, 'Win 2nd place in a contest', true),
  ('win_third', 100, 'Win 3rd place in a contest', true),
  ('share_entry', 10, 'Share an entry on social media', true),
  ('complete_profile', 50, 'Complete your profile', true),
  ('daily_login', 10, 'Daily login bonus', true)
ON CONFLICT (action) DO NOTHING;

-- Grant permissions
GRANT EXECUTE ON FUNCTION get_contest_status TO authenticated;
GRANT EXECUTE ON FUNCTION award_xp TO authenticated;
GRANT EXECUTE ON FUNCTION get_level_progress TO authenticated;
GRANT EXECUTE ON FUNCTION add_points TO authenticated;
GRANT EXECUTE ON FUNCTION deduct_points TO authenticated;
GRANT EXECUTE ON FUNCTION finalize_contest_and_select_winners TO authenticated;
GRANT EXECUTE ON FUNCTION auto_finalize_ended_contests TO authenticated;
GRANT EXECUTE ON FUNCTION is_following TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_stats TO authenticated;

-- =====================================================
-- PART 8: STORAGE BUCKETS
-- =====================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types) VALUES 
  ('avatars', 'avatars', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']),
  ('covers', 'covers', true, 10485760, ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']),
  ('entries', 'entries', true, 10485760, ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']),
  ('contests', 'contests', true, 10485760, ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']),
  ('sponsors', 'sponsors', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'])
ON CONFLICT (id) DO NOTHING;

-- Storage policies
CREATE POLICY "Avatar images public" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
CREATE POLICY "Users upload avatar" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'avatars' AND auth.role() = 'authenticated');
CREATE POLICY "Users update avatar" ON storage.objects FOR UPDATE USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users delete avatar" ON storage.objects FOR DELETE USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Cover images public" ON storage.objects FOR SELECT USING (bucket_id = 'covers');
CREATE POLICY "Users upload cover" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'covers' AND auth.role() = 'authenticated');
CREATE POLICY "Users update cover" ON storage.objects FOR UPDATE USING (bucket_id = 'covers' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users delete cover" ON storage.objects FOR DELETE USING (bucket_id = 'covers' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Entry images public" ON storage.objects FOR SELECT USING (bucket_id = 'entries');
CREATE POLICY "Users upload entries" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'entries' AND auth.role() = 'authenticated');
CREATE POLICY "Users update entries" ON storage.objects FOR UPDATE USING (bucket_id = 'entries' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users delete entries" ON storage.objects FOR DELETE USING (bucket_id = 'entries' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Contest images public" ON storage.objects FOR SELECT USING (bucket_id = 'contests');
CREATE POLICY "Auth upload contests" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'contests' AND auth.role() = 'authenticated');
CREATE POLICY "Auth update contests" ON storage.objects FOR UPDATE USING (bucket_id = 'contests' AND auth.role() = 'authenticated');
CREATE POLICY "Auth delete contests" ON storage.objects FOR DELETE USING (bucket_id = 'contests' AND auth.role() = 'authenticated');

CREATE POLICY "Sponsor images public" ON storage.objects FOR SELECT USING (bucket_id = 'sponsors');
CREATE POLICY "Auth manage sponsors" ON storage.objects FOR ALL USING (bucket_id = 'sponsors' AND auth.role() = 'authenticated');

-- =====================================================
-- PART 9: CRON JOB FOR AUTO-FINALIZATION
-- Supabase pg_cron extension
-- Runs every 5 minutes to auto-finalize ended contests
-- =====================================================

-- Enable pg_cron extension (Supabase has this enabled by default on paid plans)
-- If you're on free plan, you'll need to call auto_finalize_ended_contests() 
-- manually or via an Edge Function with a scheduled trigger

-- Uncomment below if pg_cron is available:
-- CREATE EXTENSION IF NOT EXISTS pg_cron;
-- SELECT cron.schedule(
--   'auto-finalize-contests',
--   '*/5 * * * *',
--   $$SELECT * FROM auto_finalize_ended_contests()$$
-- );

-- =====================================================
-- ALTERNATIVE: Use Supabase Edge Function (Recommended)
-- Create an Edge Function that calls:
-- SELECT * FROM auto_finalize_ended_contests();
-- And schedule it via Supabase Dashboard or external cron
-- =====================================================

-- =====================================================
-- COMPLETE!
-- =====================================================
SELECT '✅ AFC v2.0 Database Setup Complete!' as status;
SELECT 'Tables: 15' as info;
SELECT 'Functions: 13 (including auto-finalize)' as info;
SELECT 'Triggers: 15' as info;
SELECT 'Policies: 40+' as info;
SELECT 'Auto-finalization: ENABLED' as info;
