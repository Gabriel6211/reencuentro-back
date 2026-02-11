import { getSupabaseClient } from '../lib/supabase/client'
import type { UserProfile } from '../types'

export interface ProfileRow {
  id: string
  name?: string | null
  avatar_url?: string | null
  location?: string | null
  phone?: string | null
}

/**
 * Get profile from profiles table by user id.
 */
export async function getProfile(userId: string): Promise<ProfileRow | null> {
  const supabase = getSupabaseClient()
  const { data, error } = await supabase
    .from('profiles')
    .select('id, name, avatar_url, location, phone')
    .eq('id', userId)
    .single()
  if (error) {
    if (error.code === 'PGRST116') return null
    throw error
  }
  return data as ProfileRow
}

/**
 * Create or replace profile row (used on register).
 */
export async function createProfile(
  userId: string,
  data: Partial<UserProfile>
): Promise<ProfileRow> {
  const supabase = getSupabaseClient()
  const { data: row, error } = await (supabase.from('profiles') as any)
    .upsert(
      {
        id: userId,
        name: data.name ?? null,
        avatar_url: data.avatar_url ?? null,
        location: data.location ?? null,
        phone: data.phone ?? null,
      },
      { onConflict: 'id' }
    )
    .select('id, name, avatar_url, location, phone')
    .single()
  if (error) throw new Error(error.message)
  return row as ProfileRow
}

/**
 * Update the authenticated user's profile. Upserts so it works if row was missing.
 */
export async function updateProfile(
  userId: string,
  profile: Partial<UserProfile>
): Promise<ProfileRow> {
  const supabase = getSupabaseClient()
  const updates: Record<string, string | null> = { updated_at: new Date().toISOString() }
  if (profile.name !== undefined) updates.name = profile.name || null
  if (profile.avatar_url !== undefined) updates.avatar_url = profile.avatar_url || null
  if (profile.location !== undefined) updates.location = profile.location || null
  if (profile.phone !== undefined) updates.phone = profile.phone || null

  const { data, error } = await (supabase.from('profiles') as any)
    .upsert({ id: userId, ...updates }, { onConflict: 'id' })
    .select('id, name, avatar_url, location, phone')
    .single()
  if (error) throw new Error(error.message)
  if (!data) throw new Error('Failed to update profile')
  return data as ProfileRow
}
