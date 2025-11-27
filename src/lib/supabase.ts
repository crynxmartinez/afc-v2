import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    storageKey: 'afc-auth',
  },
  global: {
    headers: {
      'x-application-name': 'afc-v2',
    },
  },
})

// Check if session is valid, refresh if needed
export const ensureValidSession = async () => {
  const { data: { session }, error } = await supabase.auth.getSession()
  
  if (error || !session) {
    // Session is invalid, try to refresh
    const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession()
    
    if (refreshError || !refreshData.session) {
      // Refresh failed, user needs to login again
      console.warn('Session expired, please login again')
      return null
    }
    
    return refreshData.session
  }
  
  return session
}

// Helper to get current user
export const getCurrentUser = async () => {
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

// Helper to get current session
export const getCurrentSession = async () => {
  const { data: { session } } = await supabase.auth.getSession()
  return session
}
