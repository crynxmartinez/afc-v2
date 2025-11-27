-- =====================================================
-- AFC v2.0 DATABASE SCHEMA
-- Arena for Creatives - Complete Database Schema
-- 
-- Run this FIRST in Supabase SQL Editor
-- =====================================================

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- 1. USERS TABLE
-- Core user data, extends Supabase auth.users
-- =====================================================
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

-- =====================================================
-- 2. CONTESTS TABLE
-- Contest information and configuration
-- =====================================================
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
  prize_pool INTEGER DEFAULT 0,  -- Set during finalization
  prize_pool_distributed BOOLEAN DEFAULT false,
  finalized_at TIMESTAMPTZ,
  
  -- Meta
  created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_dates CHECK (end_date > start_date)
);

-- =====================================================
-- 3. ENTRIES TABLE
-- Contest submissions with 4-phase artwork
-- =====================================================
CREATE TABLE public.entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contest_id UUID NOT NULL REFERENCES public.contests(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  
  -- Content
  title TEXT,
  description TEXT,
  
  -- 4-Phase Artwork URLs
  phase_1_url TEXT,  -- Sketch / Raw Photo / Concept
  phase_2_url TEXT,  -- Line Art / Props Ready / Draft
  phase_3_url TEXT,  -- Base Colors / WIP / Refinement
  phase_4_url TEXT,  -- Final Artwork
  
  -- Status
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'pending', 'approved', 'rejected')),
  rejection_reason TEXT,
  
  -- Denormalized Stats (updated by triggers)
  reactions_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  
  -- Timestamps
  submitted_at TIMESTAMPTZ,
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- One entry per user per contest
  UNIQUE(contest_id, user_id)
);

-- =====================================================
-- 4. REACTIONS TABLE
-- User reactions on entries (like, love, fire, clap, star)
-- =====================================================
CREATE TABLE public.reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_id UUID NOT NULL REFERENCES public.entries(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  reaction_type TEXT NOT NULL CHECK (reaction_type IN ('like', 'love', 'fire', 'clap', 'star')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- One reaction per user per entry
  UNIQUE(entry_id, user_id)
);

-- =====================================================
-- 5. COMMENTS TABLE
-- Comments on entries with reply support
-- =====================================================
CREATE TABLE public.comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_id UUID NOT NULL REFERENCES public.entries(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES public.comments(id) ON DELETE CASCADE,  -- For replies
  
  content TEXT NOT NULL CHECK (LENGTH(content) <= 500),
  is_pinned BOOLEAN DEFAULT false,
  
  -- Denormalized Stats
  likes_count INTEGER DEFAULT 0,
  
  -- Timestamps
  edited_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 6. COMMENT LIKES TABLE
-- Likes on comments
-- =====================================================
CREATE TABLE public.comment_likes (
  comment_id UUID NOT NULL REFERENCES public.comments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  PRIMARY KEY (comment_id, user_id)
);

-- =====================================================
-- 7. FOLLOWS TABLE
-- User follow relationships
-- =====================================================
CREATE TABLE public.follows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  following_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(follower_id, following_id),
  CHECK (follower_id != following_id)
);

-- =====================================================
-- 8. NOTIFICATIONS TABLE
-- User notifications
-- =====================================================
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  
  type TEXT NOT NULL CHECK (type IN ('reaction', 'comment', 'reply', 'follow', 'winner', 'contest', 'system')),
  title TEXT NOT NULL,
  message TEXT,
  link TEXT,
  read BOOLEAN DEFAULT false,
  
  -- References (optional, for context)
  actor_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  entry_id UUID REFERENCES public.entries(id) ON DELETE CASCADE,
  contest_id UUID REFERENCES public.contests(id) ON DELETE CASCADE,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 9. CONTEST WINNERS TABLE
-- Records of contest winners and prizes
-- =====================================================
CREATE TABLE public.contest_winners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contest_id UUID NOT NULL REFERENCES public.contests(id) ON DELETE CASCADE,
  entry_id UUID NOT NULL REFERENCES public.entries(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  
  placement INTEGER NOT NULL CHECK (placement IN (1, 2, 3)),
  reactions_count INTEGER NOT NULL DEFAULT 0,
  prize_amount INTEGER NOT NULL DEFAULT 0,
  
  awarded_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- One winner per placement per contest
  UNIQUE(contest_id, placement)
);

-- =====================================================
-- 10. TRANSACTIONS TABLE
-- Points purchases and prize payouts
-- =====================================================
CREATE TABLE public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  
  type TEXT NOT NULL CHECK (type IN ('purchase', 'prize', 'refund', 'bonus')),
  amount NUMERIC NOT NULL,  -- PHP amount (for purchases)
  points INTEGER NOT NULL,  -- Points amount
  
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed')),
  payment_method TEXT,
  reference_id TEXT,
  description TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 11. XP CONFIG TABLE
-- XP rewards configuration
-- =====================================================
CREATE TABLE public.xp_config (
  action TEXT PRIMARY KEY,
  xp_amount INTEGER NOT NULL,
  description TEXT,
  enabled BOOLEAN DEFAULT true,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 12. XP HISTORY TABLE
-- XP transaction history
-- =====================================================
CREATE TABLE public.xp_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  
  action TEXT NOT NULL,
  xp_amount INTEGER NOT NULL,
  description TEXT,
  reference_id UUID,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 13. LEVELS TABLE
-- Level configuration
-- =====================================================
CREATE TABLE public.levels (
  level INTEGER PRIMARY KEY,
  xp_required INTEGER NOT NULL,
  title TEXT NOT NULL,
  rewards JSONB DEFAULT '{}'
);

-- =====================================================
-- 14. SHARES TABLE
-- Social sharing tracking
-- =====================================================
CREATE TABLE public.shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  entry_id UUID REFERENCES public.entries(id) ON DELETE CASCADE,
  contest_id UUID REFERENCES public.contests(id) ON DELETE CASCADE,
  
  platform TEXT NOT NULL CHECK (platform IN ('facebook', 'twitter', 'instagram', 'copy_link', 'other')),
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 15. CONTACT SUBMISSIONS TABLE
-- Contact form submissions
-- =====================================================
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
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Users
CREATE INDEX idx_users_username ON public.users(username);
CREATE INDEX idx_users_role ON public.users(role);
CREATE INDEX idx_users_level ON public.users(level);

-- Contests
CREATE INDEX idx_contests_category ON public.contests(category);
CREATE INDEX idx_contests_dates ON public.contests(start_date, end_date);
CREATE INDEX idx_contests_created_by ON public.contests(created_by);

-- Entries
CREATE INDEX idx_entries_contest ON public.entries(contest_id);
CREATE INDEX idx_entries_user ON public.entries(user_id);
CREATE INDEX idx_entries_status ON public.entries(status);
CREATE INDEX idx_entries_reactions ON public.entries(reactions_count DESC);

-- Reactions
CREATE INDEX idx_reactions_entry ON public.reactions(entry_id);
CREATE INDEX idx_reactions_user ON public.reactions(user_id);

-- Comments
CREATE INDEX idx_comments_entry ON public.comments(entry_id);
CREATE INDEX idx_comments_user ON public.comments(user_id);
CREATE INDEX idx_comments_parent ON public.comments(parent_id);

-- Follows
CREATE INDEX idx_follows_follower ON public.follows(follower_id);
CREATE INDEX idx_follows_following ON public.follows(following_id);

-- Notifications
CREATE INDEX idx_notifications_user ON public.notifications(user_id);
CREATE INDEX idx_notifications_read ON public.notifications(user_id, read);
CREATE INDEX idx_notifications_created ON public.notifications(created_at DESC);

-- Contest Winners
CREATE INDEX idx_winners_contest ON public.contest_winners(contest_id);
CREATE INDEX idx_winners_user ON public.contest_winners(user_id);

-- Transactions
CREATE INDEX idx_transactions_user ON public.transactions(user_id);
CREATE INDEX idx_transactions_status ON public.transactions(status);

-- XP History
CREATE INDEX idx_xp_history_user ON public.xp_history(user_id);

-- Shares
CREATE INDEX idx_shares_user ON public.shares(user_id);
CREATE INDEX idx_shares_entry ON public.shares(entry_id);

-- =====================================================
-- SCHEMA COMPLETE
-- Next: Run 02-functions.sql
-- =====================================================
