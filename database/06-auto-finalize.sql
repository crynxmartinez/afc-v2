-- =====================================================
-- AFC v2.0 AUTO-FINALIZATION SYSTEM
-- This runs automatically when contests end
-- No admin intervention required
-- =====================================================

-- =====================================================
-- UPDATED FINALIZE FUNCTION
-- Called automatically by cron or on-demand
-- =====================================================

-- Drop old function if exists
DROP FUNCTION IF EXISTS finalize_contest_and_select_winners(UUID);

-- New auto-finalize function
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
  
  -- Calculate prize pool = SUM of ALL reactions on top 3 entries
  -- Each reaction = 1 vote = 1 point in prize pool
  v_prize_pool := COALESCE(v_winner_1st.reactions_count, 0) 
                + COALESCE(v_winner_2nd.reactions_count, 0) 
                + COALESCE(v_winner_3rd.reactions_count, 0);
  
  -- If no reactions at all, still finalize but with 0 prizes
  -- Calculate prizes: 50% / 20% / 10% (20% goes to platform)
  v_prize_1st := FLOOR(v_prize_pool * 0.5);
  v_prize_2nd := FLOOR(v_prize_pool * 0.2);
  v_prize_3rd := FLOOR(v_prize_pool * 0.1);
  
  -- Award 1st place (only if they have at least 1 reaction)
  IF v_winner_1st.id IS NOT NULL AND v_winner_1st.reactions_count > 0 THEN
    -- Add points to winner
    PERFORM add_points(v_winner_1st.user_id, v_prize_1st);
    
    -- Award XP
    PERFORM award_xp(v_winner_1st.user_id, 'win_first', p_contest_id, 'Won 1st place in contest');
    
    -- Increment wins count
    UPDATE users SET wins_count = wins_count + 1 WHERE id = v_winner_1st.user_id;
    
    -- Record winner
    INSERT INTO contest_winners (contest_id, entry_id, user_id, placement, reactions_count, prize_amount)
    VALUES (p_contest_id, v_winner_1st.id, v_winner_1st.user_id, 1, v_winner_1st.reactions_count, v_prize_1st);
    
    -- Record transaction
    INSERT INTO transactions (user_id, type, amount, points, status, description)
    VALUES (v_winner_1st.user_id, 'prize', 0, v_prize_1st, 'completed', 'Contest 1st place prize');
    
    -- Send notification
    INSERT INTO notifications (user_id, type, title, message, contest_id, entry_id)
    VALUES (v_winner_1st.user_id, 'winner', '🏆 Congratulations!', 
            'You won 1st place and earned ' || v_prize_1st || ' points!', 
            p_contest_id, v_winner_1st.id);
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
    VALUES (v_winner_2nd.user_id, 'winner', '🥈 Congratulations!', 
            'You won 2nd place and earned ' || v_prize_2nd || ' points!', 
            p_contest_id, v_winner_2nd.id);
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
    VALUES (v_winner_3rd.user_id, 'winner', '🥉 Congratulations!', 
            'You won 3rd place and earned ' || v_prize_3rd || ' points!', 
            p_contest_id, v_winner_3rd.id);
  END IF;
  
  -- Update contest as finalized
  UPDATE contests SET
    winner_1st_entry_id = v_winner_1st.id,
    winner_2nd_entry_id = v_winner_2nd.id,
    winner_3rd_entry_id = v_winner_3rd.id,
    prize_pool = v_prize_pool,
    prize_pool_distributed = true,
    finalized_at = NOW()
  WHERE id = p_contest_id;
  
  -- Return results
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
-- This function checks all contests and finalizes any that have ended
-- Should be called by a cron job every minute/hour
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
  -- Find all contests that:
  -- 1. Have ended (end_date < NOW())
  -- 2. Are NOT yet finalized (finalized_at IS NULL)
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

-- =====================================================
-- CRON JOB SETUP (Supabase pg_cron)
-- Run auto-finalize every 5 minutes
-- =====================================================

-- Enable pg_cron extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule the auto-finalize job to run every 5 minutes
-- This will automatically finalize any contests that have ended
SELECT cron.schedule(
  'auto-finalize-contests',           -- Job name
  '*/5 * * * *',                      -- Every 5 minutes
  $$SELECT * FROM auto_finalize_ended_contests()$$
);

-- =====================================================
-- ALTERNATIVE: Manual trigger for testing
-- Call this to manually finalize all ended contests
-- =====================================================

-- SELECT * FROM auto_finalize_ended_contests();

-- =====================================================
-- GRANT PERMISSIONS
-- =====================================================

GRANT EXECUTE ON FUNCTION finalize_contest_and_select_winners TO authenticated;
GRANT EXECUTE ON FUNCTION auto_finalize_ended_contests TO authenticated;

-- =====================================================
-- DONE!
-- =====================================================
SELECT '✅ Auto-finalization system installed!' as status;
SELECT 'Contests will auto-finalize every 5 minutes after end_date' as info;
