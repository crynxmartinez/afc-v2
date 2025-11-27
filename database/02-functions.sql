-- =====================================================
-- AFC v2.0 DATABASE FUNCTIONS
-- All stored procedures and functions
-- 
-- Run this SECOND in Supabase SQL Editor
-- =====================================================

-- =====================================================
-- HELPER: Update updated_at timestamp
-- =====================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- CONTEST STATUS FUNCTION
-- Calculate status from dates (never stored!)
-- =====================================================
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

-- =====================================================
-- GET CONTESTS WITH STATUS VIEW
-- Use this instead of querying contests directly
-- =====================================================
CREATE OR REPLACE VIEW contests_with_status AS
SELECT 
  c.*,
  get_contest_status(c.start_date, c.end_date, c.finalized_at) as status,
  (SELECT COUNT(*) FROM entries e WHERE e.contest_id = c.id AND e.status = 'approved') as entries_count,
  (SELECT COALESCE(SUM(e.reactions_count), 0) FROM entries e WHERE e.contest_id = c.id) as total_reactions
FROM contests c;

-- =====================================================
-- USER PROFILE CREATION
-- Called after auth.users insert
-- =====================================================
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

-- =====================================================
-- UPDATE ENTRY REACTIONS COUNT
-- Called when reaction is added/removed
-- =====================================================
CREATE OR REPLACE FUNCTION update_entry_reactions_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE entries SET reactions_count = reactions_count + 1 WHERE id = NEW.entry_id;
    
    -- Also update user's total reactions received
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

-- =====================================================
-- UPDATE ENTRY COMMENTS COUNT
-- Called when comment is added/removed
-- =====================================================
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

-- =====================================================
-- UPDATE COMMENT LIKES COUNT
-- Called when comment like is added/removed
-- =====================================================
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

-- =====================================================
-- UPDATE FOLLOW COUNTS
-- Called when follow is added/removed
-- =====================================================
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

-- =====================================================
-- UPDATE USER ENTRIES COUNT
-- Called when entry status changes to approved
-- =====================================================
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

-- =====================================================
-- AWARD XP FUNCTION
-- Awards XP to user and handles level up
-- =====================================================
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
  -- Get XP amount for this action
  SELECT xc.xp_amount, xc.description INTO v_xp_amount, v_description
  FROM xp_config xc
  WHERE xc.action = p_action AND xc.enabled = true;
  
  -- Default XP if action not configured
  IF v_xp_amount IS NULL THEN
    v_xp_amount := 10;
    v_description := p_action;
  END IF;
  
  -- Get current user XP and level
  SELECT xp, level INTO v_old_xp, v_old_level
  FROM users
  WHERE id = p_user_id;
  
  -- Calculate new XP
  v_new_xp := v_old_xp + v_xp_amount;
  
  -- Calculate new level
  SELECT COALESCE(MAX(l.level), 1) INTO v_new_level
  FROM levels l
  WHERE l.xp_required <= v_new_xp;
  
  -- Check if leveled up
  IF v_new_level > v_old_level THEN
    v_leveled_up := true;
  END IF;
  
  -- Update user
  UPDATE users
  SET xp = v_new_xp, level = v_new_level
  WHERE id = p_user_id;
  
  -- Record XP history
  INSERT INTO xp_history (user_id, action, xp_amount, description, reference_id)
  VALUES (p_user_id, p_action, v_xp_amount, COALESCE(p_description, v_description), p_reference_id);
  
  -- Return results
  RETURN QUERY SELECT v_xp_amount, v_new_xp, v_new_level, v_leveled_up;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- GET LEVEL PROGRESS
-- Returns user's level progress info
-- =====================================================
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
        (COALESCE(nl.xp_required, u.xp) - COALESCE(l.xp_required, 0))::NUMERIC * 100),
        2
      )
    END as progress_percentage
  FROM users u
  LEFT JOIN levels l ON l.level = u.level
  LEFT JOIN levels nl ON nl.level = u.level + 1
  WHERE u.id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- ADD POINTS
-- Add points to user balance
-- =====================================================
CREATE OR REPLACE FUNCTION add_points(
  p_user_id UUID,
  p_amount INTEGER,
  p_description TEXT DEFAULT NULL
)
RETURNS INTEGER AS $$
DECLARE
  v_new_balance INTEGER;
BEGIN
  UPDATE users
  SET points_balance = points_balance + p_amount
  WHERE id = p_user_id
  RETURNING points_balance INTO v_new_balance;
  
  RETURN v_new_balance;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- DEDUCT POINTS
-- Deduct points from user balance (with check)
-- =====================================================
CREATE OR REPLACE FUNCTION deduct_points(
  p_user_id UUID,
  p_amount INTEGER
)
RETURNS BOOLEAN AS $$
DECLARE
  v_current_balance INTEGER;
BEGIN
  SELECT points_balance INTO v_current_balance
  FROM users
  WHERE id = p_user_id;
  
  IF v_current_balance < p_amount THEN
    RETURN false;
  END IF;
  
  UPDATE users
  SET points_balance = points_balance - p_amount
  WHERE id = p_user_id;
  
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- FINALIZE CONTEST AND SELECT WINNERS
-- Main prize distribution function
-- =====================================================
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
  v_entries RECORD[];
  v_winner_1st RECORD;
  v_winner_2nd RECORD;
  v_winner_3rd RECORD;
  v_prize_pool INTEGER;
  v_prize_1st INTEGER;
  v_prize_2nd INTEGER;
  v_prize_3rd INTEGER;
BEGIN
  -- Get contest
  SELECT * INTO v_contest
  FROM contests
  WHERE id = p_contest_id;
  
  IF NOT FOUND THEN
    RETURN QUERY SELECT false, 'Contest not found'::TEXT, NULL::UUID, NULL::UUID, NULL::UUID, 0, 0, 0, 0;
    RETURN;
  END IF;
  
  -- Check if contest has ended (by DATE, not status!)
  IF v_contest.end_date > NOW() THEN
    RETURN QUERY SELECT false, 'Contest has not ended yet'::TEXT, NULL::UUID, NULL::UUID, NULL::UUID, 0, 0, 0, 0;
    RETURN;
  END IF;
  
  -- Check if already finalized
  IF v_contest.prize_pool_distributed THEN
    RETURN QUERY SELECT false, 'Prizes already distributed'::TEXT, NULL::UUID, NULL::UUID, NULL::UUID, 0, 0, 0, 0;
    RETURN;
  END IF;
  
  -- Get top 3 entries by reactions
  SELECT e.id, e.user_id, e.reactions_count
  INTO v_winner_1st
  FROM entries e
  WHERE e.contest_id = p_contest_id AND e.status = 'approved'
  ORDER BY e.reactions_count DESC, e.created_at ASC
  LIMIT 1;
  
  SELECT e.id, e.user_id, e.reactions_count
  INTO v_winner_2nd
  FROM entries e
  WHERE e.contest_id = p_contest_id 
    AND e.status = 'approved'
    AND e.id != COALESCE(v_winner_1st.id, '00000000-0000-0000-0000-000000000000'::UUID)
  ORDER BY e.reactions_count DESC, e.created_at ASC
  LIMIT 1;
  
  SELECT e.id, e.user_id, e.reactions_count
  INTO v_winner_3rd
  FROM entries e
  WHERE e.contest_id = p_contest_id 
    AND e.status = 'approved'
    AND e.id != COALESCE(v_winner_1st.id, '00000000-0000-0000-0000-000000000000'::UUID)
    AND e.id != COALESCE(v_winner_2nd.id, '00000000-0000-0000-0000-000000000000'::UUID)
  ORDER BY e.reactions_count DESC, e.created_at ASC
  LIMIT 1;
  
  -- Calculate prize pool from top 3 reactions
  v_prize_pool := COALESCE(v_winner_1st.reactions_count, 0) 
                + COALESCE(v_winner_2nd.reactions_count, 0) 
                + COALESCE(v_winner_3rd.reactions_count, 0);
  
  IF v_prize_pool <= 0 THEN
    RETURN QUERY SELECT false, 'No reactions to distribute'::TEXT, NULL::UUID, NULL::UUID, NULL::UUID, 0, 0, 0, 0;
    RETURN;
  END IF;
  
  -- Calculate prizes: 50% / 20% / 10%
  v_prize_1st := FLOOR(v_prize_pool * 0.5);
  v_prize_2nd := FLOOR(v_prize_pool * 0.2);
  v_prize_3rd := FLOOR(v_prize_pool * 0.1);
  
  -- Award 1st place
  IF v_winner_1st.id IS NOT NULL AND v_winner_1st.reactions_count > 0 THEN
    PERFORM add_points(v_winner_1st.user_id, v_prize_1st);
    PERFORM award_xp(v_winner_1st.user_id, 'win_first', p_contest_id, 'Won 1st place');
    
    UPDATE users SET wins_count = wins_count + 1 WHERE id = v_winner_1st.user_id;
    
    INSERT INTO contest_winners (contest_id, entry_id, user_id, placement, reactions_count, prize_amount)
    VALUES (p_contest_id, v_winner_1st.id, v_winner_1st.user_id, 1, v_winner_1st.reactions_count, v_prize_1st);
    
    INSERT INTO transactions (user_id, type, amount, points, status, description)
    VALUES (v_winner_1st.user_id, 'prize', 0, v_prize_1st, 'completed', 'Contest 1st place prize');
    
    INSERT INTO notifications (user_id, type, title, message, contest_id, entry_id)
    VALUES (v_winner_1st.user_id, 'winner', 'Congratulations! 🏆', 
            'You won 1st place and ' || v_prize_1st || ' points!', p_contest_id, v_winner_1st.id);
  END IF;
  
  -- Award 2nd place
  IF v_winner_2nd.id IS NOT NULL AND v_winner_2nd.reactions_count > 0 THEN
    PERFORM add_points(v_winner_2nd.user_id, v_prize_2nd);
    PERFORM award_xp(v_winner_2nd.user_id, 'win_second', p_contest_id, 'Won 2nd place');
    
    INSERT INTO contest_winners (contest_id, entry_id, user_id, placement, reactions_count, prize_amount)
    VALUES (p_contest_id, v_winner_2nd.id, v_winner_2nd.user_id, 2, v_winner_2nd.reactions_count, v_prize_2nd);
    
    INSERT INTO transactions (user_id, type, amount, points, status, description)
    VALUES (v_winner_2nd.user_id, 'prize', 0, v_prize_2nd, 'completed', 'Contest 2nd place prize');
    
    INSERT INTO notifications (user_id, type, title, message, contest_id, entry_id)
    VALUES (v_winner_2nd.user_id, 'winner', 'Congratulations! 🥈', 
            'You won 2nd place and ' || v_prize_2nd || ' points!', p_contest_id, v_winner_2nd.id);
  END IF;
  
  -- Award 3rd place
  IF v_winner_3rd.id IS NOT NULL AND v_winner_3rd.reactions_count > 0 THEN
    PERFORM add_points(v_winner_3rd.user_id, v_prize_3rd);
    PERFORM award_xp(v_winner_3rd.user_id, 'win_third', p_contest_id, 'Won 3rd place');
    
    INSERT INTO contest_winners (contest_id, entry_id, user_id, placement, reactions_count, prize_amount)
    VALUES (p_contest_id, v_winner_3rd.id, v_winner_3rd.user_id, 3, v_winner_3rd.reactions_count, v_prize_3rd);
    
    INSERT INTO transactions (user_id, type, amount, points, status, description)
    VALUES (v_winner_3rd.user_id, 'prize', 0, v_prize_3rd, 'completed', 'Contest 3rd place prize');
    
    INSERT INTO notifications (user_id, type, title, message, contest_id, entry_id)
    VALUES (v_winner_3rd.user_id, 'winner', 'Congratulations! 🥉', 
            'You won 3rd place and ' || v_prize_3rd || ' points!', p_contest_id, v_winner_3rd.id);
  END IF;
  
  -- Update contest
  UPDATE contests
  SET winner_1st_entry_id = v_winner_1st.id,
      winner_2nd_entry_id = v_winner_2nd.id,
      winner_3rd_entry_id = v_winner_3rd.id,
      prize_pool = v_prize_pool,
      prize_pool_distributed = true,
      finalized_at = NOW()
  WHERE id = p_contest_id;
  
  -- Return success
  RETURN QUERY SELECT 
    true,
    'Winners selected and prizes distributed!'::TEXT,
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
-- CREATE NOTIFICATION
-- Helper to create notifications
-- =====================================================
CREATE OR REPLACE FUNCTION create_notification(
  p_user_id UUID,
  p_type TEXT,
  p_title TEXT,
  p_message TEXT DEFAULT NULL,
  p_link TEXT DEFAULT NULL,
  p_actor_id UUID DEFAULT NULL,
  p_entry_id UUID DEFAULT NULL,
  p_contest_id UUID DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_notification_id UUID;
BEGIN
  INSERT INTO notifications (user_id, type, title, message, link, actor_id, entry_id, contest_id)
  VALUES (p_user_id, p_type, p_title, p_message, p_link, p_actor_id, p_entry_id, p_contest_id)
  RETURNING id INTO v_notification_id;
  
  RETURN v_notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- IS FOLLOWING
-- Check if user follows another user
-- =====================================================
CREATE OR REPLACE FUNCTION is_following(p_follower_id UUID, p_following_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM follows
    WHERE follower_id = p_follower_id AND following_id = p_following_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- GET USER STATS
-- Get comprehensive user statistics
-- =====================================================
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
  RETURN QUERY
  SELECT 
    u.entries_count,
    u.wins_count,
    u.total_reactions_received,
    u.followers_count,
    u.following_count,
    u.level,
    u.xp,
    u.points_balance
  FROM users u
  WHERE u.id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- FUNCTIONS COMPLETE
-- Next: Run 03-triggers.sql
-- =====================================================
