import express from 'express'
import { authenticateUser } from '../middleware/auth'
import { validateProfileUpdate } from '../middleware/profile'
import { getProfileController, updateProfileController } from '../controllers/profileController'

const router = express.Router()

/**
 * GET /api/profile
 * Get current user's profile (auth required).
 */
router.get('/', authenticateUser, getProfileController)

/**
 * PATCH /api/profile
 * Update current user's profile. Body: at least one of { name?, avatar_url?, location?, phone? } (auth required).
 */
router.patch('/', authenticateUser, validateProfileUpdate, updateProfileController)

export default router
