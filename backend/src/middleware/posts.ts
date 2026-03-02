import { Request, Response, NextFunction } from 'express'
import { Post, PostType, PostStatus } from '../types'

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

const POST_TYPES: PostType[] = ['lost', 'found', 'adoption']
const STATUS_TYPES: PostStatus[] = ['active', 'found', 'reunited', 'adopted']
const CREATE_STATUS: PostStatus = 'active'
const RESOLVED_STATUSES: PostStatus[] = ['found', 'reunited', 'adopted']

const MAX_TITLE_LENGTH = 200
const MAX_CONTENT_LENGTH = 5000
const MAX_STRING_FIELD = 500
const MAX_IMAGE_URLS = 10
const MIN_PET_AGE = 0
const MAX_PET_AGE = 30

function isValidUrl(s: string): boolean {
  try {
    const u = new URL(s)
    return u.protocol === 'http:' || u.protocol === 'https:'
  } catch {
    return false
  }
}

function isValidDate(value: unknown): value is string {
  if (typeof value !== 'string') return false
  const d = new Date(value)
  return !Number.isNaN(d.getTime())
}

/**
 * Validates required and optional post fields for create/update.
 * Create: post_type, status (default active), title, content, image_urls, location; date_lost_or_found required for lost/found.
 */
function validatePostBody(
  body: unknown,
  isUpdate: boolean
): { valid: true; data: Post } | { valid: false; status: number; message: string } {
  if (body === null || typeof body !== 'object' || Array.isArray(body)) {
    return { valid: false, status: 400, message: 'Body must be a JSON object' }
  }

  const b = body as Record<string, unknown>

  if (!isUpdate) {
    if (typeof b.title !== 'string' || !b.title.trim()) {
      return { valid: false, status: 400, message: 'title is required and must be a non-empty string' }
    }
    if (b.title.length > MAX_TITLE_LENGTH) {
      return { valid: false, status: 400, message: `title must be at most ${MAX_TITLE_LENGTH} characters` }
    }

    if (typeof b.content !== 'string' || !b.content.trim()) {
      return { valid: false, status: 400, message: 'content is required and must be a non-empty string' }
    }
    if (b.content.length > MAX_CONTENT_LENGTH) {
      return { valid: false, status: 400, message: `content must be at most ${MAX_CONTENT_LENGTH} characters` }
    }

    if (!Array.isArray(b.image_urls)) {
      return { valid: false, status: 400, message: 'image_urls is required and must be an array' }
    }
    if (b.image_urls.length > MAX_IMAGE_URLS) {
      return { valid: false, status: 400, message: `image_urls must have at most ${MAX_IMAGE_URLS} items` }
    }
    for (let i = 0; i < b.image_urls.length; i++) {
      if (typeof b.image_urls[i] !== 'string' || !isValidUrl(b.image_urls[i])) {
        return { valid: false, status: 400, message: `image_urls[${i}] must be a valid HTTP(S) URL` }
      }
    }

    if (typeof b.location !== 'string' || !b.location.trim()) {
      return { valid: false, status: 400, message: 'location is required and must be a non-empty string' }
    }
    if (b.location.length > MAX_STRING_FIELD) {
      return { valid: false, status: 400, message: `location must be at most ${MAX_STRING_FIELD} characters` }
    }

    if (!POST_TYPES.includes(b.post_type as PostType)) {
      return { valid: false, status: 400, message: `post_type is required and must be one of: ${POST_TYPES.join(', ')}` }
    }
    const postType = b.post_type as PostType
    const status = (b.status as PostStatus) ?? CREATE_STATUS
    if (status !== 'active') {
      return { valid: false, status: 400, message: 'New posts must have status "active"' }
    }

    if (postType !== 'adoption' && (b.date_lost_or_found === undefined || !isValidDate(b.date_lost_or_found))) {
      return { valid: false, status: 400, message: 'date_lost_or_found is required for lost and found posts (ISO date string)' }
    }
    if (b.date_lost_or_found !== undefined && !isValidDate(b.date_lost_or_found)) {
      return { valid: false, status: 400, message: 'date_lost_or_found must be a valid ISO date string' }
    }
  } else {
    if (b.title !== undefined) {
      if (typeof b.title !== 'string' || !b.title.trim()) {
        return { valid: false, status: 400, message: 'title must be a non-empty string' }
      }
      if (b.title.length > MAX_TITLE_LENGTH) {
        return { valid: false, status: 400, message: `title must be at most ${MAX_TITLE_LENGTH} characters` }
      }
    }
    if (b.content !== undefined) {
      if (typeof b.content !== 'string' || !b.content.trim()) {
        return { valid: false, status: 400, message: 'content must be a non-empty string' }
      }
      if (b.content.length > MAX_CONTENT_LENGTH) {
        return { valid: false, status: 400, message: `content must be at most ${MAX_CONTENT_LENGTH} characters` }
      }
    }
    if (b.image_urls !== undefined) {
      if (!Array.isArray(b.image_urls)) {
        return { valid: false, status: 400, message: 'image_urls must be an array' }
      }
      if (b.image_urls.length > MAX_IMAGE_URLS) {
        return { valid: false, status: 400, message: `image_urls must have at most ${MAX_IMAGE_URLS} items` }
      }
      for (let i = 0; i < b.image_urls.length; i++) {
        if (typeof b.image_urls[i] !== 'string' || !isValidUrl(b.image_urls[i])) {
          return { valid: false, status: 400, message: `image_urls[${i}] must be a valid HTTP(S) URL` }
        }
      }
    }
    if (b.location !== undefined) {
      if (typeof b.location !== 'string' || !b.location.trim()) {
        return { valid: false, status: 400, message: 'location must be a non-empty string' }
      }
      if (b.location.length > MAX_STRING_FIELD) {
        return { valid: false, status: 400, message: `location must be at most ${MAX_STRING_FIELD} characters` }
      }
    }
    if (b.post_type !== undefined && !POST_TYPES.includes(b.post_type as PostType)) {
      return { valid: false, status: 400, message: `post_type must be one of: ${POST_TYPES.join(', ')}` }
    }
    if (b.status !== undefined && !['active', ...RESOLVED_STATUSES].includes(b.status as PostStatus)) {
      return { valid: false, status: 400, message: `status must be one of: active, ${RESOLVED_STATUSES.join(', ')}` }
    }
    if (b.date_lost_or_found !== undefined && !isValidDate(b.date_lost_or_found)) {
      return { valid: false, status: 400, message: 'date_lost_or_found must be a valid ISO date string' }
    }
  }

  if (b.pet_name !== undefined) {
    if (typeof b.pet_name !== 'string' || b.pet_name.length > MAX_STRING_FIELD) {
      return { valid: false, status: 400, message: `pet_name must be a string at most ${MAX_STRING_FIELD} characters` }
    }
  }
  if (b.pet_age !== undefined) {
    const n = Number(b.pet_age)
    if (!Number.isFinite(n) || n < MIN_PET_AGE || n > MAX_PET_AGE || Math.floor(n) !== n) {
      return { valid: false, status: 400, message: `pet_age must be an integer between ${MIN_PET_AGE} and ${MAX_PET_AGE}` }
    }
  }
  if (b.pet_breed !== undefined) {
    if (typeof b.pet_breed !== 'string' || b.pet_breed.length > MAX_STRING_FIELD) {
      return { valid: false, status: 400, message: `pet_breed must be a string at most ${MAX_STRING_FIELD} characters` }
    }
  }
  if (b.pet_gender !== undefined) {
    if (typeof b.pet_gender !== 'string' || b.pet_gender.length > MAX_STRING_FIELD) {
      return { valid: false, status: 400, message: `pet_gender must be a string at most ${MAX_STRING_FIELD} characters` }
    }
  }
  if (b.pet_color !== undefined) {
    if (typeof b.pet_color !== 'string' || b.pet_color.length > MAX_STRING_FIELD) {
      return { valid: false, status: 400, message: `pet_color must be a string at most ${MAX_STRING_FIELD} characters` }
    }
  }
  if (b.pet_size !== undefined) {
    if (typeof b.pet_size !== 'string' || b.pet_size.length > MAX_STRING_FIELD) {
      return { valid: false, status: 400, message: `pet_size must be a string at most ${MAX_STRING_FIELD} characters` }
    }
  }

  if (isUpdate) {
    const partial: Partial<Post> = {}
    if (b.title !== undefined) partial.title = b.title as string
    if (b.content !== undefined) partial.content = b.content as string
    if (b.image_urls !== undefined) partial.image_urls = b.image_urls as string[]
    if (b.location !== undefined) partial.location = b.location as string
    if (b.post_type !== undefined) partial.post_type = b.post_type as PostType
    if (b.status !== undefined) partial.status = b.status as PostStatus
    if (b.date_lost_or_found !== undefined) partial.date_lost_or_found = b.date_lost_or_found as string
    if (b.pet_name !== undefined) partial.pet_name = b.pet_name as string
    if (b.pet_age !== undefined) partial.pet_age = Number(b.pet_age)
    if (b.pet_breed !== undefined) partial.pet_breed = b.pet_breed as string
    if (b.pet_gender !== undefined) partial.pet_gender = b.pet_gender as string
    if (b.pet_color !== undefined) partial.pet_color = b.pet_color as string
    if (b.pet_size !== undefined) partial.pet_size = b.pet_size as string
    const hasAny = Object.keys(partial).length > 0
    if (!hasAny) {
      return { valid: false, status: 400, message: 'Provide at least one field to update' }
    }
    return { valid: true, data: partial as Post }
  }

  const data: Post = {
    title: (b.title as string) ?? '',
    content: (b.content as string) ?? '',
    image_urls: (b.image_urls as string[]) ?? [],
    location: (b.location as string) ?? '',
    post_type: (b.post_type as PostType) ?? 'lost',
    status: ((b.status as PostStatus) ?? CREATE_STATUS) as PostStatus,
  }
  if (b.date_lost_or_found !== undefined) data.date_lost_or_found = b.date_lost_or_found as string
  if (b.pet_name !== undefined) data.pet_name = b.pet_name as string
  if (b.pet_age !== undefined) data.pet_age = Number(b.pet_age)
  if (b.pet_breed !== undefined) data.pet_breed = b.pet_breed as string
  if (b.pet_gender !== undefined) data.pet_gender = b.pet_gender as string
  if (b.pet_color !== undefined) data.pet_color = b.pet_color as string
  if (b.pet_size !== undefined) data.pet_size = b.pet_size as string

  return { valid: true, data }
}

/**
 * Validates post body for POST /api/posts (create).
 */
export function validateCreatePost(req: Request, res: Response, next: NextFunction): void {
  const result = validatePostBody(req.body, false)
  if (!result.valid) {
    res.status(result.status).json({ error: result.message })
    return
  }
  req.body = result.data
  next()
}

/**
 * Validates post body for PUT/PATCH /api/posts/:id (update).
 */
export function validateUpdatePost(req: Request, res: Response, next: NextFunction): void {
  const result = validatePostBody(req.body, true)
  if (!result.valid) {
    res.status(result.status).json({ error: result.message })
    return
  }
  req.body = result.data
  next()
}

export function validateGetPosts(req: Request, res: Response, next: NextFunction): void {
  const postType = req.query.post_type as string | undefined
  const status = req.query.status as string | undefined
  const page = Number(req.query.page) || 1
  const limit = Number(req.query.limit) || 10
  if (postType && !POST_TYPES.includes(postType as PostType)) {
    res.status(400).json({ error: `Post type must be one of: ${POST_TYPES.join(', ')}` })
    return
  }
  if (status && !STATUS_TYPES.includes(status as PostStatus)) {
    res.status(400).json({ error: `Status must be one of: active, found, reunited, adopted` })
    return
  }
  if (page < 1) {
    res.status(400).json({ error: 'Page must be at least 1' })
    return
  }
  if (limit < 1 || limit > 20) {
    res.status(400).json({ error: 'Limit must be between 1 and 20' })
    return
  }
  next()
}

/**
 * Validates :id param (non-empty, UUID format for Supabase).
 */
export function validatePostId(req: Request, res: Response, next: NextFunction): void {
  const id = req.params.id
  if (typeof id !== 'string' || !id.trim()) {
    res.status(400).json({ error: 'Post id is required' })
    return
  }
  if (!UUID_REGEX.test(id)) {
    res.status(400).json({ error: 'Post id must be a valid UUID' })
    return
  }
  next()
}

/**
 * Validates body for PATCH /api/posts/:id/status. Expects { status: 'found' | 'reunited' | 'adopted' }.
 */
export function validateUpdatePostStatus(req: Request, res: Response, next: NextFunction): void {
  const body = req.body
  if (body === null || typeof body !== 'object' || Array.isArray(body)) {
    res.status(400).json({ error: 'Body must be a JSON object with "status" field' })
    return
  }
  const status = (body as Record<string, unknown>).status
  if (!RESOLVED_STATUSES.includes(status as PostStatus)) {
    res.status(400).json({
      error: `status must be one of: ${RESOLVED_STATUSES.join(', ')} (to mark post as resolved)`,
    })
    return
  }
  next()
}
