import express from 'express'
import { loginUser, registerUser } from '../controllers/authController'

const router = express.Router()

/**
 * POST /api/auth/register
 * Register a new user (creates auth user + profile row).
 */
router.post('/register', registerUser)

/**
 * POST /api/auth/login
 * Login and return user (with profile from DB) and tokens.
 */
router.post('/login', loginUser)

export default router
