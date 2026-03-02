import { Request, Response } from 'express'
import { loginUser as loginUserService, registerUser as registerUserService } from '../services/authService'
import { getProfile as getProfileService, createProfile as createProfileService } from '../services/profileService'
import type { User } from '../types'

function formatUserFromAuth(user: { id: string; email?: string; user_metadata?: Record<string, unknown> }): User {
  const meta = user.user_metadata ?? {}
  return {
    id: user.id,
    email: user.email ?? '',
    name: (meta.name as string) ?? (meta.full_name as string),
    avatar_url: meta.avatar_url as string | undefined,
    location: meta.location as string | undefined,
    phone: meta.phone as string | undefined,
  }
}

function formatUserFromProfile(
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

export const loginUser = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({
        error: 'Email and password are required',
      })
    }

    const { user, session } = await loginUserService({ email, password })
    const profile = await getProfileService(user.id)
    const userPayload = profile
      ? formatUserFromProfile(profile, user.email ?? '')
      : formatUserFromAuth(user)

    return res.status(200).json({
      message: 'Login successful',
      user: userPayload,
      access_token: session?.access_token ?? null,
      refresh_token: session?.refresh_token ?? null,
    })
  } catch (error: unknown) {
    const err = error as Error
    console.error('Login error:', err)
    if (err.message === 'Invalid credentials' || err.message.includes('Invalid login credentials')) {
      return res.status(401).json({ error: 'Invalid email or password' })
    }
    return res.status(500).json({
      error: 'An error occurred during login',
      message: err.message,
    })
  }
}

export const registerUser = async (req: Request, res: Response) => {
  try {
    const { email, password, metadata } = req.body

    if (!email || !password) {
      return res.status(400).json({
        error: 'Email and password are required',
      })
    }

    if (password.length < 6) {
      return res.status(400).json({
        error: 'Password must be at least 6 characters long',
      })
    }

    const { user, session } = await registerUserService({
      email,
      password,
      metadata,
    })

    const profile = await createProfileService(user.id, metadata || {})

    const userPayload = profile
      ? formatUserFromProfile(profile, user.email ?? '')
      : formatUserFromAuth(user)

    return res.status(201).json({
      message: 'User registered successfully',
      user: userPayload,
      access_token: session?.access_token ?? null,
      refresh_token: session?.refresh_token ?? null,
    })
  } catch (error: unknown) {
    const err = error as Error
    console.error('Registration error:', err)
    if (err.message.includes('User already registered') || err.message.includes('already registered')) {
      return res.status(409).json({ error: 'A user with this email already exists' })
    }
    if (err.message.includes('Password')) {
      return res.status(400).json({ error: err.message })
    }
    return res.status(500).json({
      error: 'An error occurred during registration',
      message: err.message,
    })
  }
}
