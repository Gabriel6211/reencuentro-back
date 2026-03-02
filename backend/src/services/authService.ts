import { getSupabasePublicClient } from '../lib/supabase/client'
import type { UserProfile } from '../types'

export interface RegisterData {
  email: string
  password: string
  metadata?: UserProfile
}

export interface LoginData {
  email: string
  password: string
}

export interface AuthResponse {
  user: { id: string; email?: string }
  session: { access_token: string; refresh_token: string } | null
}

/**
 * Register a new user (auth only). Caller should create profile via profileService.createProfile.
 */
export async function registerUser(data: RegisterData): Promise<AuthResponse> {
  const supabase = getSupabasePublicClient()

  const { data: authData, error } = await supabase.auth.signUp({
    email: data.email,
    password: data.password,
    options: {
      data: data.metadata || {},
      emailRedirectTo: undefined,
    },
  })

  if (error) throw new Error(error.message)
  if (!authData.user) throw new Error('Failed to create user')

  return {
    user: authData.user,
    session: authData.session,
  }
}

/**
 * Login a user.
 */
export async function loginUser(data: LoginData): Promise<AuthResponse> {
  const supabase = getSupabasePublicClient()

  const { data: authData, error } = await supabase.auth.signInWithPassword({
    email: data.email,
    password: data.password,
  })

  if (error) throw new Error(error.message)
  if (!authData.user || !authData.session) {
    throw new Error('Invalid credentials or user not found')
  }

  return {
    user: authData.user,
    session: authData.session,
  }
}
