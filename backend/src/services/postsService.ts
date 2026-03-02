import { getSupabaseClient } from '../lib/supabase/client'
import { Post, PostRow, PostStatus, PostType } from '../types'

/** Filters for listing posts (optional) */
export interface GetPostsFilters {
  post_type?: PostType
  status?: PostStatus
}

/**
 * Create a new post. Sets user_id from the authenticated user.
 */
export async function createPost(post: Post, userId: string): Promise<PostRow | null> {
  const supabase = getSupabaseClient()
  const row = {
    ...post,
    user_id: userId,
    status: post.status ?? 'active',
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase.from('posts') as any).insert(row).select().single()
  if (error) throw error
  return data as PostRow
}

/**
 * Get posts, optionally filtered by post_type and/or status.
 */
export async function getPosts(filters?: GetPostsFilters, offset?: number, limit?: number): Promise<PostRow[]> {
  const supabase = getSupabaseClient()
  let query = supabase.from('posts').select('*').order('created_at', { ascending: false })
  if (filters?.post_type) {
    query = query.eq('post_type', filters.post_type)
  }
  if (filters?.status) {
    query = query.eq('status', filters.status)
  }
  if (offset && limit) {
    query = query.range(offset, offset + (limit! - 1))
  }
  const { data, error } = await query
  if (error) throw error
  return (data ?? []) as PostRow[]
}

/**
 * Get a single post by id. Returns null if not found.
 */
export async function getPostById(id: string): Promise<PostRow | null> {
  const supabase = getSupabaseClient()
  const { data, error } = await supabase.from('posts').select('*').eq('id', id).single()
  if (error) {
    if (error.code === 'PGRST116') return null // no rows
    throw error
  }
  return data as PostRow
}

/**
 * Update post fields (partial update). Only provided fields are updated.
 */
export async function updatePost(id: string, updates: Partial<Post>): Promise<PostRow | null> {
  const post = await getPostById(id)
  if (!post) return null
  const supabase = getSupabaseClient()
  const payload: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if (updates.title !== undefined) payload.title = updates.title
  if (updates.content !== undefined) payload.content = updates.content
  if (updates.image_urls !== undefined) payload.image_urls = updates.image_urls
  if (updates.location !== undefined) payload.location = updates.location
  if (updates.date_lost_or_found !== undefined) payload.date_lost_or_found = updates.date_lost_or_found
  if (updates.pet_name !== undefined) payload.pet_name = updates.pet_name
  if (updates.pet_age !== undefined) payload.pet_age = updates.pet_age
  if (updates.pet_breed !== undefined) payload.pet_breed = updates.pet_breed
  if (updates.pet_gender !== undefined) payload.pet_gender = updates.pet_gender
  if (updates.pet_color !== undefined) payload.pet_color = updates.pet_color
  if (updates.pet_size !== undefined) payload.pet_size = updates.pet_size
  const { data, error } = await (supabase.from('posts') as any).update(payload).eq('id', id).select().single()
  if (error) throw error
  return data as PostRow
}

/**
 * Delete a post by id. Returns true if a row was deleted.
 */
export async function deletePost(id: string): Promise<boolean> {
  const supabase = getSupabaseClient()
  const { data, error } = await supabase.from('posts').delete().eq('id', id).select('id')
  if (error) throw error
  return Array.isArray(data) && data.length > 0
}

/**
 * Allowed status transitions:
 * - lost + active → found
 * - found + active → reunited
 * - adoption + active → adopted
 */
const ALLOWED_TRANSITIONS: Record<PostType, PostStatus[]> = {
  lost: ['found'],
  found: ['reunited'],
  adoption: ['adopted'],
}

/**
 * Update post status (mark as resolved). Validates transition by post_type.
 * Throws an error with message if transition is not allowed or post not found.
 */
export async function updatePostStatus(
  id: string,
  newStatus: PostStatus
): Promise<PostRow> {
  const post = await getPostById(id)
  if (!post) {
    const err = new Error('Post not found') as Error & { statusCode?: number }
    err.statusCode = 404
    throw err
  }
  if (post.status !== 'active') {
    const err = new Error(`Post is already resolved (status: ${post.status})`) as Error & {
      statusCode?: number
    }
    err.statusCode = 400
    throw err
  }
  const allowed = ALLOWED_TRANSITIONS[post.post_type as PostType]
  if (!allowed?.includes(newStatus)) {
    const err = new Error(
      `Invalid status transition: post_type "${post.post_type}" can only transition to: ${allowed?.join(', ') ?? 'none'}`
    ) as Error & { statusCode?: number }
    err.statusCode = 400
    throw err
  }

  const supabase = getSupabaseClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase.from('posts') as any)
    .update({ status: newStatus, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data as PostRow
}
