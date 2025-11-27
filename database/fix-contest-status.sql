-- =====================================================
-- FIX CONTEST STATUS
-- Run this in Supabase SQL Editor to un-finalize a contest
-- =====================================================

-- First, check the contest status
SELECT id, title, start_date, end_date, finalized_at,
  CASE 
    WHEN finalized_at IS NOT NULL THEN 'finalized'
    WHEN NOW() < start_date THEN 'upcoming'
    WHEN NOW() > end_date THEN 'ended'
    ELSE 'active'
  END as calculated_status
FROM contests
ORDER BY created_at DESC
LIMIT 5;

-- To un-finalize a specific contest, uncomment and run:
-- UPDATE contests 
-- SET finalized_at = NULL,
--     winner_1st_entry_id = NULL,
--     winner_2nd_entry_id = NULL,
--     winner_3rd_entry_id = NULL,
--     prize_pool_distributed = false
-- WHERE id = 'YOUR_CONTEST_ID_HERE';

-- Or to un-finalize ALL contests that haven't actually ended:
-- UPDATE contests 
-- SET finalized_at = NULL,
--     winner_1st_entry_id = NULL,
--     winner_2nd_entry_id = NULL,
--     winner_3rd_entry_id = NULL,
--     prize_pool_distributed = false
-- WHERE finalized_at IS NOT NULL 
--   AND end_date > NOW();
