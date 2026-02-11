import { Request, Response, NextFunction } from 'express'
import type { UserProfile } from '../types'

const MAX_NAME_LENGTH = 200
const MAX_URL_LENGTH = 2048
const MAX_LOCATION_LENGTH = 500
const MAX_PHONE_LENGTH = 30

/**
 * Validates body for PATCH /api/profile.
 * Expects at least one of: name, avatar_url, location, phone.
 */
export function validateProfileUpdate(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const body = req.body
  if (body === null || typeof body !== 'object' || Array.isArray(body)) {
    res.status(400).json({ error: 'Body must be a JSON object' })
    return
  }
  const b = body as Record<string, unknown>
  const hasName = b.name !== undefined
  const hasAvatar = b.avatar_url !== undefined
  const hasLocation = b.location !== undefined
  const hasPhone = b.phone !== undefined
  if (!hasName && !hasAvatar && !hasLocation && !hasPhone) {
    res.status(400).json({
      error: 'Provide at least one field to update: name, avatar_url, location, phone',
    })
    return
  }
  if (hasName && (typeof b.name !== 'string' || b.name.length > MAX_NAME_LENGTH)) {
    res.status(400).json({ error: `name must be a string at most ${MAX_NAME_LENGTH} characters` })
    return
  }
  if (hasAvatar && (typeof b.avatar_url !== 'string' || b.avatar_url.length > MAX_URL_LENGTH)) {
    res.status(400).json({ error: `avatar_url must be a string (URL) at most ${MAX_URL_LENGTH} characters` })
    return
  }
  if (hasLocation && (typeof b.location !== 'string' || b.location.length > MAX_LOCATION_LENGTH)) {
    res.status(400).json({ error: `location must be a string at most ${MAX_LOCATION_LENGTH} characters` })
    return
  }
  if (hasPhone && (typeof b.phone !== 'string' || b.phone.length > MAX_PHONE_LENGTH)) {
    res.status(400).json({ error: `phone must be a string at most ${MAX_PHONE_LENGTH} characters` })
    return
  }
  const profile: Partial<UserProfile> = {}
  if (hasName) profile.name = b.name as string
  if (hasAvatar) profile.avatar_url = b.avatar_url as string
  if (hasLocation) profile.location = b.location as string
  if (hasPhone) profile.phone = b.phone as string
  req.body = profile
  next()
}
