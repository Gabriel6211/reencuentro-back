export interface UploadOptions {
    key: string
    body: Buffer | Uint8Array | string
    contentType?: string
    metadata?: Record<string, string>
}

/** User profile fields stored in Supabase Auth user_metadata (and optionally in a profiles table) */
export interface UserProfile {
  name?: string
  avatar_url?: string
  location?: string
  phone?: string
}

/** Full user shape as returned by API (auth fields + profile from metadata) */
export interface User {
  id: string
  email: string
  name?: string
  avatar_url?: string
  location?: string
  phone?: string
}

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
    user: any
    session: any
}

export interface UploadFileData {
    buffer: Buffer
    originalname: string
    mimetype: string
    size: number
}

export interface UploadResult {
    url: string
    key: string
    size: number
    type: string
}

/** Post category: lost pet, found pet, or pet in adoption */
export type PostType = 'lost' | 'found' | 'adoption'

/** Post status: active = issue not solved; found/reunited/adopted = resolved */
export type PostStatus = 'active' | 'found' | 'reunited' | 'adopted'

/**
 * Post model (pet report).
 * Maps to your list: Type, Name?, Location, Age?, Breed?, Images[], Description,
 * Active (→ status), Date (last seen), Gender?, Color, Size, User (→ user_id).
 */
export interface Post {
  title: string
  content: string
  image_urls: string[]
  location: string
  post_type: PostType
  /** active = not solved; found/reunited/adopted = solved */
  status: PostStatus
  /** Last date seen / date lost or found */
  date_lost_or_found?: string
  pet_name?: string
  pet_age?: number
  pet_breed?: string
  pet_gender?: string
  pet_color?: string
  pet_size?: string
}

/** Row from DB may include id, user_id, created_at */
export interface PostRow extends Post {
  id: string
  user_id: string
  created_at?: string
  updated_at?: string
}