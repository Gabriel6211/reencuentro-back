import { Response } from 'express'
import { getProfile as getProfileService, updateProfile as updateProfileService } from '../services/profileService'
import type { User } from '../types'
import type { AuthenticatedRequest } from '../middleware/auth'

function formatUser(
  profile: { id: string; name?: string | null; avatar_url?: string | null; location?: string | null; phone?: string | null },
  email: string
): User {
  return {
    id: profile.id,
    email,
    name: profile.name ?? undefined,
    avatar_url: profile.avatar_url ?? undefined,
    location: profile.location ?? undefined,
    phone: profile.phone ?? undefined,
  }
}

/**
 * GET /api/profile – get current user's profile (requires auth).
 */
export async function getProfileController(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user?.id
    const email = req.user?.email ?? ''
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' })
      return
    }
    const profile = await getProfileService(userId)
    if (!profile) {
      res.status(404).json({ error: 'Profile not found' })
      return
    }
    res.status(200).json(formatUser(profile, email))
  } catch (err) {
    console.error('getProfile', err)
    res.status(500).json({ error: 'Failed to get profile' })
  }
}

/**
 * PATCH /api/profile – update current user's profile (requires auth).
 */
export async function updateProfileController(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user?.id
    const email = req.user?.email ?? ''
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' })
      return
    }
    const profile = req.body as Partial<{ name: string; avatar_url: string; location: string; phone: string }>
    const updated = await updateProfileService(userId, profile)
    res.status(200).json({
      message: 'Profile updated successfully',
      user: formatUser(updated, email),
    })
  } catch (err: unknown) {
    const e = err as Error
    console.error('updateProfile', e)
    res.status(500).json({ error: 'An error occurred while updating profile', message: e.message })
  }
}
