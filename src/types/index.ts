// =====================================================
// AFC v2.0 TypeScript Types
// =====================================================

// User Types
export interface User {
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

// Contest Types
export interface Contest {
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
  // Computed
  status?: 'upcoming' | 'active' | 'ended' | 'finalized'
}

// Entry Types
export interface Entry {
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
  // Relations
  user?: User
  contest?: Contest
}

// Reaction Types
export type ReactionType = 'like' | 'love' | 'fire' | 'clap' | 'star'

export interface Reaction {
  id: string
  entry_id: string
  user_id: string
  type: ReactionType
  created_at: string
  // Relations
  user?: User
}

// Comment Types
export interface Comment {
  id: string
  entry_id: string
  user_id: string
  parent_id: string | null
  content: string
  likes_count: number
  created_at: string
  updated_at: string
  // Relations
  user?: User
  replies?: Comment[]
  isLiked?: boolean
}

// Notification Types
export type NotificationType = 'reaction' | 'comment' | 'reply' | 'follow' | 'winner' | 'contest' | 'system'

export interface Notification {
  id: string
  user_id: string
  type: NotificationType
  title: string
  message: string
  is_read: boolean
  actor_id: string | null
  contest_id: string | null
  entry_id: string | null
  comment_id: string | null
  created_at: string
  // Relations
  actor?: User
}

// Contest Winner Types
export interface ContestWinner {
  id: string
  contest_id: string
  entry_id: string
  user_id: string
  placement: 1 | 2 | 3
  reactions_count: number
  prize_amount: number
  created_at: string
  // Relations
  entry?: Entry
  user?: User
  contest?: Contest
}

// Transaction Types
export type TransactionType = 'prize' | 'purchase' | 'refund' | 'bonus' | 'transfer'

export interface Transaction {
  id: string
  user_id: string
  type: TransactionType
  amount: number
  points: number
  status: 'pending' | 'completed' | 'failed'
  description: string | null
  created_at: string
}

// Follow Types
export interface Follow {
  id: string
  follower_id: string
  following_id: string
  created_at: string
  // Relations
  follower?: User
  following?: User
}

// XP History Types
export interface XPHistory {
  id: string
  user_id: string
  action: string
  xp_earned: number
  reference_id: string | null
  description: string | null
  created_at: string
}

// Level Types
export interface Level {
  level: number
  xp_required: number
  title: string
  badge_url: string | null
  bonus_points: number
}

// Share Types
export interface Share {
  id: string
  entry_id: string
  user_id: string
  platform: 'facebook' | 'twitter' | 'instagram' | 'copy_link' | 'other'
  created_at: string
}

// API Response Types
export interface ApiResponse<T> {
  data: T | null
  error: string | null
}

export interface PaginatedResponse<T> {
  data: T[]
  count: number
  page: number
  pageSize: number
  totalPages: number
}

// Form Types
export interface LoginForm {
  email: string
  password: string
}

export interface RegisterForm {
  email: string
  username: string
  password: string
  confirmPassword: string
}

export interface ContestForm {
  title: string
  description: string
  category: Contest['category']
  start_date: string
  end_date: string
  thumbnail?: File
  has_sponsor: boolean
  sponsor_name?: string
  sponsor_logo?: File
  sponsor_url?: string
}

export interface EntryForm {
  title?: string
  description?: string
  phase_1?: File
  phase_2?: File
  phase_3?: File
  phase_4?: File
}

export interface ProfileForm {
  display_name?: string
  bio?: string
  location?: string
  website?: string
  instagram_url?: string
  twitter_url?: string
  portfolio_url?: string
  skills?: string[]
  available_for_work?: boolean
  profile_visibility?: 'public' | 'private'
}

// Filter Types
export interface ContestFilters {
  status?: 'all' | 'upcoming' | 'active' | 'ended' | 'finalized'
  category?: Contest['category'] | 'all'
  search?: string
}

export interface EntryFilters {
  status?: 'all' | 'draft' | 'pending' | 'approved' | 'rejected'
  contestId?: string
  userId?: string
  search?: string
}

// Sort Types
export type SortOrder = 'asc' | 'desc'

export interface SortOption {
  field: string
  order: SortOrder
  label: string
}

// UI State Types
export interface Toast {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  title: string
  message?: string
  duration?: number
}

export interface ModalState {
  isOpen: boolean
  type: string | null
  data?: unknown
}
