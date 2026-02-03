import { getSupabasePublicClient } from '../lib/supabase/client'

export interface RegisterData {
  email: string
  password: string
  metadata?: Record<string, any>
}

export interface LoginData {
  email: string
  password: string
}

export interface AuthResponse {
  user: any
  session: any
}

/**
 * Register a new user
 */
export async function registerUser(data: RegisterData): Promise<AuthResponse> {
  const supabase = getSupabasePublicClient()

  const { data: authData, error } = await supabase.auth.signUp({
    email: data.email,
    password: data.password,
    options: {
      data: data.metadata || {},
      emailRedirectTo: undefined, // Optional: set redirect URL for email confirmation
    },
  })

  if (error) {
    throw new Error(error.message)
  }

  if (!authData.user) {
    throw new Error('Failed to create user')
  }

  // Note: session might be null if email confirmation is required
  return {
    user: authData.user,
    session: authData.session,
  }
}

/**
 * Login a user
 */
export async function loginUser(data: LoginData): Promise<AuthResponse> {
  const supabase = getSupabasePublicClient()

  const { data: authData, error } = await supabase.auth.signInWithPassword({
    email: data.email,
    password: data.password,
  })

  if (error) {
    throw new Error(error.message)
  }

  if (!authData.user || !authData.session) {
    throw new Error('Invalid credentials or user not found')
  }

  return {
    user: authData.user,
    session: authData.session,
  }
}
