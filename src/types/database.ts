// =====================================================
// Supabase Database Types (Auto-generated style)
// =====================================================

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          username: string
          display_name: string | null
          avatar_url: string | null
          cover_photo_url: string | null
          bio: string | null
          location: string | null
          website: string | null
          instagram_url: string | null
          twitter_url: string | null
          portfolio_url: string | null
          skills: string[] | null
          available_for_work: boolean
          role: 'user' | 'admin'
          xp: number
          level: number
          points_balance: number
          entries_count: number
          wins_count: number
          total_reactions_received: number
          followers_count: number
          following_count: number
          profile_visibility: 'public' | 'private'
          notification_reactions: boolean
          notification_comments: boolean
          notification_follows: boolean
          notification_contests: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          username: string
          display_name?: string | null
          avatar_url?: string | null
          cover_photo_url?: string | null
          bio?: string | null
          location?: string | null
          website?: string | null
          instagram_url?: string | null
          twitter_url?: string | null
          portfolio_url?: string | null
          skills?: string[] | null
          available_for_work?: boolean
          role?: 'user' | 'admin'
          xp?: number
          level?: number
          points_balance?: number
          entries_count?: number
          wins_count?: number
          total_reactions_received?: number
          followers_count?: number
          following_count?: number
          profile_visibility?: 'public' | 'private'
          notification_reactions?: boolean
          notification_comments?: boolean
          notification_follows?: boolean
          notification_contests?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          username?: string
          display_name?: string | null
          avatar_url?: string | null
          cover_photo_url?: string | null
          bio?: string | null
          location?: string | null
          website?: string | null
          instagram_url?: string | null
          twitter_url?: string | null
          portfolio_url?: string | null
          skills?: string[] | null
          available_for_work?: boolean
          role?: 'user' | 'admin'
          xp?: number
          level?: number
          points_balance?: number
          entries_count?: number
          wins_count?: number
          total_reactions_received?: number
          followers_count?: number
          following_count?: number
          profile_visibility?: 'public' | 'private'
          notification_reactions?: boolean
          notification_comments?: boolean
          notification_follows?: boolean
          notification_contests?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      contests: {
        Row: {
          id: string
          title: string
          description: string | null
          category: 'art' | 'cosplay' | 'photography' | 'music' | 'video'
          thumbnail_url: string | null
          start_date: string
          end_date: string
          prize_pool: number
          prize_pool_distributed: boolean
          has_sponsor: boolean
          sponsor_name: string | null
          sponsor_logo_url: string | null
          sponsor_url: string | null
          winner_1st_entry_id: string | null
          winner_2nd_entry_id: string | null
          winner_3rd_entry_id: string | null
          entries_count: number
          finalized_at: string | null
          created_by: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          category: 'art' | 'cosplay' | 'photography' | 'music' | 'video'
          thumbnail_url?: string | null
          start_date: string
          end_date: string
          prize_pool?: number
          prize_pool_distributed?: boolean
          has_sponsor?: boolean
          sponsor_name?: string | null
          sponsor_logo_url?: string | null
          sponsor_url?: string | null
          winner_1st_entry_id?: string | null
          winner_2nd_entry_id?: string | null
          winner_3rd_entry_id?: string | null
          entries_count?: number
          finalized_at?: string | null
          created_by: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          category?: 'art' | 'cosplay' | 'photography' | 'music' | 'video'
          thumbnail_url?: string | null
          start_date?: string
          end_date?: string
          prize_pool?: number
          prize_pool_distributed?: boolean
          has_sponsor?: boolean
          sponsor_name?: string | null
          sponsor_logo_url?: string | null
          sponsor_url?: string | null
          winner_1st_entry_id?: string | null
          winner_2nd_entry_id?: string | null
          winner_3rd_entry_id?: string | null
          entries_count?: number
          finalized_at?: string | null
          created_by?: string
          created_at?: string
          updated_at?: string
        }
      }
      entries: {
        Row: {
          id: string
          contest_id: string
          user_id: string
          title: string | null
          description: string | null
          phase_1_url: string
          phase_2_url: string | null
          phase_3_url: string | null
          phase_4_url: string | null
          status: 'draft' | 'pending' | 'approved' | 'rejected'
          rejection_reason: string | null
          reactions_count: number
          comments_count: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          contest_id: string
          user_id: string
          title?: string | null
          description?: string | null
          phase_1_url: string
          phase_2_url?: string | null
          phase_3_url?: string | null
          phase_4_url?: string | null
          status?: 'draft' | 'pending' | 'approved' | 'rejected'
          rejection_reason?: string | null
          reactions_count?: number
          comments_count?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          contest_id?: string
          user_id?: string
          title?: string | null
          description?: string | null
          phase_1_url?: string
          phase_2_url?: string | null
          phase_3_url?: string | null
          phase_4_url?: string | null
          status?: 'draft' | 'pending' | 'approved' | 'rejected'
          rejection_reason?: string | null
          reactions_count?: number
          comments_count?: number
          created_at?: string
          updated_at?: string
        }
      }
      reactions: {
        Row: {
          id: string
          entry_id: string
          user_id: string
          type: 'like' | 'love' | 'fire' | 'clap' | 'star'
          created_at: string
        }
        Insert: {
          id?: string
          entry_id: string
          user_id: string
          type: 'like' | 'love' | 'fire' | 'clap' | 'star'
          created_at?: string
        }
        Update: {
          id?: string
          entry_id?: string
          user_id?: string
          type?: 'like' | 'love' | 'fire' | 'clap' | 'star'
          created_at?: string
        }
      }
      comments: {
        Row: {
          id: string
          entry_id: string
          user_id: string
          parent_id: string | null
          content: string
          likes_count: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          entry_id: string
          user_id: string
          parent_id?: string | null
          content: string
          likes_count?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          entry_id?: string
          user_id?: string
          parent_id?: string | null
          content?: string
          likes_count?: number
          created_at?: string
          updated_at?: string
        }
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          type: 'reaction' | 'comment' | 'reply' | 'follow' | 'winner' | 'contest' | 'system'
          title: string
          message: string
          is_read: boolean
          actor_id: string | null
          contest_id: string | null
          entry_id: string | null
          comment_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          type: 'reaction' | 'comment' | 'reply' | 'follow' | 'winner' | 'contest' | 'system'
          title: string
          message: string
          is_read?: boolean
          actor_id?: string | null
          contest_id?: string | null
          entry_id?: string | null
          comment_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          type?: 'reaction' | 'comment' | 'reply' | 'follow' | 'winner' | 'contest' | 'system'
          title?: string
          message?: string
          is_read?: boolean
          actor_id?: string | null
          contest_id?: string | null
          entry_id?: string | null
          comment_id?: string | null
          created_at?: string
        }
      }
      follows: {
        Row: {
          id: string
          follower_id: string
          following_id: string
          created_at: string
        }
        Insert: {
          id?: string
          follower_id: string
          following_id: string
          created_at?: string
        }
        Update: {
          id?: string
          follower_id?: string
          following_id?: string
          created_at?: string
        }
      }
      contest_winners: {
        Row: {
          id: string
          contest_id: string
          entry_id: string
          user_id: string
          placement: number
          reactions_count: number
          prize_amount: number
          created_at: string
        }
        Insert: {
          id?: string
          contest_id: string
          entry_id: string
          user_id: string
          placement: number
          reactions_count: number
          prize_amount: number
          created_at?: string
        }
        Update: {
          id?: string
          contest_id?: string
          entry_id?: string
          user_id?: string
          placement?: number
          reactions_count?: number
          prize_amount?: number
          created_at?: string
        }
      }
      transactions: {
        Row: {
          id: string
          user_id: string
          type: 'prize' | 'purchase' | 'refund' | 'bonus' | 'transfer'
          amount: number
          points: number
          status: 'pending' | 'completed' | 'failed'
          description: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          type: 'prize' | 'purchase' | 'refund' | 'bonus' | 'transfer'
          amount?: number
          points?: number
          status?: 'pending' | 'completed' | 'failed'
          description?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          type?: 'prize' | 'purchase' | 'refund' | 'bonus' | 'transfer'
          amount?: number
          points?: number
          status?: 'pending' | 'completed' | 'failed'
          description?: string | null
          created_at?: string
        }
      }
    }
    Functions: {
      get_contest_status: {
        Args: {
          p_start_date: string
          p_end_date: string
          p_finalized_at: string | null
        }
        Returns: string
      }
      finalize_contest_and_select_winners: {
        Args: {
          p_contest_id: string
        }
        Returns: {
          success: boolean
          message: string
          winner_1st_user_id: string | null
          winner_2nd_user_id: string | null
          winner_3rd_user_id: string | null
          prize_1st: number
          prize_2nd: number
          prize_3rd: number
          total_prize_pool: number
        }[]
      }
      auto_finalize_ended_contests: {
        Args: Record<string, never>
        Returns: {
          contest_id: string
          contest_title: string
          finalized: boolean
          message: string
        }[]
      }
    }
  }
}
