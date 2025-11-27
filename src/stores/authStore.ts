import { create } from 'zustand'
import { supabase } from '@/lib/supabase'
import type { User } from '@/types'

interface AuthState {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  isAdmin: boolean
  error: string | null

  // Actions
  initialize: () => Promise<void>
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  register: (email: string, username: string, password: string) => Promise<{ success: boolean; error?: string }>
  logout: () => Promise<void>
  resetPassword: (email: string) => Promise<{ success: boolean; error?: string }>
  updateProfile: (data: Partial<User>) => Promise<{ success: boolean; error?: string }>
  refreshUser: () => Promise<void>
  clearError: () => void
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isLoading: true,
  isAuthenticated: false,
  isAdmin: false,
  error: null,

  initialize: async () => {
    try {
      set({ isLoading: true, error: null })

      // Get current session
      const { data: { session } } = await supabase.auth.getSession()

      if (session?.user) {
        // Fetch user profile from public.users
        const { data: profile, error } = await supabase
          .from('users')
          .select('*')
          .eq('id', session.user.id)
          .single()

        if (error) throw error

        set({
          user: profile,
          isAuthenticated: true,
          isAdmin: profile.role === 'admin',
          isLoading: false,
        })
      } else {
        set({
          user: null,
          isAuthenticated: false,
          isAdmin: false,
          isLoading: false,
        })
      }

      // Listen for auth changes
      supabase.auth.onAuthStateChange(async (event, session) => {
        console.log('Auth state change:', event)
        
        if (event === 'SIGNED_IN' && session?.user) {
          const { data: profile } = await supabase
            .from('users')
            .select('*')
            .eq('id', session.user.id)
            .single()

          if (profile) {
            set({
              user: profile,
              isAuthenticated: true,
              isAdmin: profile.role === 'admin',
            })
          }
        } else if (event === 'SIGNED_OUT') {
          set({
            user: null,
            isAuthenticated: false,
            isAdmin: false,
          })
        } else if (event === 'TOKEN_REFRESHED') {
          // Token was refreshed, session is still valid
          console.log('Token refreshed successfully')
        } else if (event === 'USER_UPDATED') {
          // User data was updated
          if (session?.user) {
            const { data: profile } = await supabase
              .from('users')
              .select('*')
              .eq('id', session.user.id)
              .single()

            if (profile) {
              set({
                user: profile,
                isAdmin: profile.role === 'admin',
              })
            }
          }
        }
      })
    } catch (error) {
      console.error('Auth initialization error:', error)
      set({
        user: null,
        isAuthenticated: false,
        isAdmin: false,
        isLoading: false,
        error: 'Failed to initialize authentication',
      })
    }
  },

  login: async (email: string, password: string) => {
    try {
      set({ isLoading: true, error: null })

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) throw error

      if (data.user) {
        const { data: profile, error: profileError } = await supabase
          .from('users')
          .select('*')
          .eq('id', data.user.id)
          .single()

        if (profileError) throw profileError

        set({
          user: profile,
          isAuthenticated: true,
          isAdmin: profile.role === 'admin',
          isLoading: false,
        })

        return { success: true }
      }

      return { success: false, error: 'Login failed' }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Login failed'
      set({ isLoading: false, error: message })
      return { success: false, error: message }
    }
  },

  register: async (email: string, username: string, password: string) => {
    try {
      set({ isLoading: true, error: null })

      // Check if username is taken
      const { data: existingUser } = await supabase
        .from('users')
        .select('username')
        .eq('username', username)
        .single()

      if (existingUser) {
        set({ isLoading: false })
        return { success: false, error: 'Username is already taken' }
      }

      // Create auth user
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username,
          },
        },
      })

      if (error) throw error

      if (data.user) {
        // Wait a moment for the trigger to create the profile
        await new Promise(resolve => setTimeout(resolve, 1000))

        const { data: profile } = await supabase
          .from('users')
          .select('*')
          .eq('id', data.user.id)
          .single()

        if (profile) {
          set({
            user: profile,
            isAuthenticated: true,
            isAdmin: false,
            isLoading: false,
          })
        }

        return { success: true }
      }

      return { success: false, error: 'Registration failed' }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Registration failed'
      set({ isLoading: false, error: message })
      return { success: false, error: message }
    }
  },

  logout: async () => {
    try {
      set({ isLoading: true })
      await supabase.auth.signOut()
      set({
        user: null,
        isAuthenticated: false,
        isAdmin: false,
        isLoading: false,
        error: null,
      })
    } catch (error) {
      console.error('Logout error:', error)
      set({ isLoading: false })
    }
  },

  resetPassword: async (email: string) => {
    try {
      set({ isLoading: true, error: null })

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      })

      if (error) throw error

      set({ isLoading: false })
      return { success: true }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Password reset failed'
      set({ isLoading: false, error: message })
      return { success: false, error: message }
    }
  },

  updateProfile: async (data: Partial<User>) => {
    try {
      const { user } = get()
      if (!user) return { success: false, error: 'Not authenticated' }

      set({ isLoading: true, error: null })

      const { data: updatedProfile, error } = await supabase
        .from('users')
        .update(data)
        .eq('id', user.id)
        .select()
        .single()

      if (error) throw error

      set({
        user: updatedProfile,
        isLoading: false,
      })

      return { success: true }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Profile update failed'
      set({ isLoading: false, error: message })
      return { success: false, error: message }
    }
  },

  refreshUser: async () => {
    try {
      const { user } = get()
      if (!user) return

      const { data: profile, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single()

      if (error) throw error

      set({
        user: profile,
        isAdmin: profile.role === 'admin',
      })
    } catch (error) {
      console.error('Refresh user error:', error)
    }
  },

  clearError: () => set({ error: null }),
}))
