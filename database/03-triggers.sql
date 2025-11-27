-- =====================================================
-- AFC v2.0 DATABASE TRIGGERS
-- All database triggers
-- 
-- Run this THIRD in Supabase SQL Editor
-- =====================================================

-- =====================================================
-- AUTO-CREATE USER PROFILE
-- When a new auth user is created
-- =====================================================
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_user_profile();

-- =====================================================
-- UPDATE TIMESTAMPS
-- Auto-update updated_at on all tables
-- =====================================================
CREATE TRIGGER update_users_timestamp
  BEFORE UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_contests_timestamp
  BEFORE UPDATE ON public.contests
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_entries_timestamp
  BEFORE UPDATE ON public.entries
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_comments_timestamp
  BEFORE UPDATE ON public.comments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- =====================================================
-- REACTIONS TRIGGERS
-- Update counts when reactions change
-- =====================================================
CREATE TRIGGER on_reaction_insert
  AFTER INSERT ON public.reactions
  FOR EACH ROW
  EXECUTE FUNCTION update_entry_reactions_count();

CREATE TRIGGER on_reaction_delete
  AFTER DELETE ON public.reactions
  FOR EACH ROW
  EXECUTE FUNCTION update_entry_reactions_count();

-- =====================================================
-- COMMENTS TRIGGERS
-- Update counts when comments change
-- =====================================================
CREATE TRIGGER on_comment_insert
  AFTER INSERT ON public.comments
  FOR EACH ROW
  EXECUTE FUNCTION update_entry_comments_count();

CREATE TRIGGER on_comment_delete
  AFTER DELETE ON public.comments
  FOR EACH ROW
  EXECUTE FUNCTION update_entry_comments_count();

-- =====================================================
-- COMMENT LIKES TRIGGERS
-- Update counts when comment likes change
-- =====================================================
CREATE TRIGGER on_comment_like_insert
  AFTER INSERT ON public.comment_likes
  FOR EACH ROW
  EXECUTE FUNCTION update_comment_likes_count();

CREATE TRIGGER on_comment_like_delete
  AFTER DELETE ON public.comment_likes
  FOR EACH ROW
  EXECUTE FUNCTION update_comment_likes_count();

-- =====================================================
-- FOLLOWS TRIGGERS
-- Update follower/following counts
-- =====================================================
CREATE TRIGGER on_follow_insert
  AFTER INSERT ON public.follows
  FOR EACH ROW
  EXECUTE FUNCTION update_follow_counts();

CREATE TRIGGER on_follow_delete
  AFTER DELETE ON public.follows
  FOR EACH ROW
  EXECUTE FUNCTION update_follow_counts();

-- =====================================================
-- ENTRY STATUS TRIGGERS
-- Update user entry count when approved
-- =====================================================
CREATE TRIGGER on_entry_status_change
  AFTER UPDATE OF status ON public.entries
  FOR EACH ROW
  EXECUTE FUNCTION update_user_entries_count();

-- =====================================================
-- NOTIFICATION TRIGGERS
-- Auto-create notifications for actions
-- =====================================================

-- Notify on new reaction
CREATE OR REPLACE FUNCTION notify_on_reaction()
RETURNS TRIGGER AS $$
DECLARE
  v_entry_owner_id UUID;
  v_actor_username TEXT;
  v_entry_title TEXT;
BEGIN
  -- Get entry owner
  SELECT e.user_id, e.title INTO v_entry_owner_id, v_entry_title
  FROM entries e WHERE e.id = NEW.entry_id;
  
  -- Don't notify if reacting to own entry
  IF v_entry_owner_id = NEW.user_id THEN
    RETURN NEW;
  END IF;
  
  -- Check if user wants notifications
  IF NOT (SELECT notify_reactions FROM users WHERE id = v_entry_owner_id) THEN
    RETURN NEW;
  END IF;
  
  -- Get actor username
  SELECT username INTO v_actor_username FROM users WHERE id = NEW.user_id;
  
  -- Create notification
  INSERT INTO notifications (user_id, type, title, message, actor_id, entry_id, link)
  VALUES (
    v_entry_owner_id,
    'reaction',
    'New Reaction',
    v_actor_username || ' reacted to your entry',
    NEW.user_id,
    NEW.entry_id,
    '/entry/' || NEW.entry_id
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_reaction_notify
  AFTER INSERT ON public.reactions
  FOR EACH ROW
  EXECUTE FUNCTION notify_on_reaction();

-- Notify on new comment
CREATE OR REPLACE FUNCTION notify_on_comment()
RETURNS TRIGGER AS $$
DECLARE
  v_entry_owner_id UUID;
  v_parent_comment_owner_id UUID;
  v_actor_username TEXT;
BEGIN
  -- Get actor username
  SELECT username INTO v_actor_username FROM users WHERE id = NEW.user_id;
  
  -- If this is a reply, notify parent comment owner
  IF NEW.parent_id IS NOT NULL THEN
    SELECT user_id INTO v_parent_comment_owner_id FROM comments WHERE id = NEW.parent_id;
    
    IF v_parent_comment_owner_id != NEW.user_id THEN
      IF (SELECT notify_comments FROM users WHERE id = v_parent_comment_owner_id) THEN
        INSERT INTO notifications (user_id, type, title, message, actor_id, entry_id, link)
        VALUES (
          v_parent_comment_owner_id,
          'reply',
          'New Reply',
          v_actor_username || ' replied to your comment',
          NEW.user_id,
          NEW.entry_id,
          '/entry/' || NEW.entry_id
        );
      END IF;
    END IF;
  END IF;
  
  -- Notify entry owner
  SELECT user_id INTO v_entry_owner_id FROM entries WHERE id = NEW.entry_id;
  
  IF v_entry_owner_id != NEW.user_id THEN
    IF (SELECT notify_comments FROM users WHERE id = v_entry_owner_id) THEN
      INSERT INTO notifications (user_id, type, title, message, actor_id, entry_id, link)
      VALUES (
        v_entry_owner_id,
        'comment',
        'New Comment',
        v_actor_username || ' commented on your entry',
        NEW.user_id,
        NEW.entry_id,
        '/entry/' || NEW.entry_id
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_comment_notify
  AFTER INSERT ON public.comments
  FOR EACH ROW
  EXECUTE FUNCTION notify_on_comment();

-- Notify on new follow
CREATE OR REPLACE FUNCTION notify_on_follow()
RETURNS TRIGGER AS $$
DECLARE
  v_actor_username TEXT;
BEGIN
  -- Check if user wants notifications
  IF NOT (SELECT notify_follows FROM users WHERE id = NEW.following_id) THEN
    RETURN NEW;
  END IF;
  
  -- Get actor username
  SELECT username INTO v_actor_username FROM users WHERE id = NEW.follower_id;
  
  -- Create notification
  INSERT INTO notifications (user_id, type, title, message, actor_id, link)
  VALUES (
    NEW.following_id,
    'follow',
    'New Follower',
    v_actor_username || ' started following you',
    NEW.follower_id,
    '/profile/' || (SELECT username FROM users WHERE id = NEW.follower_id)
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_follow_notify
  AFTER INSERT ON public.follows
  FOR EACH ROW
  EXECUTE FUNCTION notify_on_follow();

-- =====================================================
-- TRIGGERS COMPLETE
-- Next: Run 04-policies.sql
-- =====================================================
