import { Request, Response } from 'express'
import { loginUser as loginUserService, registerUser as registerUserService } from "../services/authService"

export const loginUser = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body

    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        error: 'Email and password are required',
      })
    }

    // Call service to login user
    const { user, session } = await loginUserService({ email, password })

    // Return user and session token
    return res.status(200).json({
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        metadata: user.user_metadata,
      },
      access_token: session.access_token,
      refresh_token: session.refresh_token,
    })
  } catch (error: any) {
    console.error('Login error:', error)
    
    // Handle specific error cases
    if (error.message === 'Invalid credentials' || error.message.includes('Invalid login credentials')) {
      return res.status(401).json({
        error: 'Invalid email or password',
      })
    }

    return res.status(500).json({
      error: 'An error occurred during login',
      message: error.message,
    })
  }
}

export const registerUser = async (req: Request, res: Response) => {
  try {
    const { email, password, metadata } = req.body

    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        error: 'Email and password are required',
      })
    }

    // Validate password length
    if (password.length < 6) {
      return res.status(400).json({
        error: 'Password must be at least 6 characters long',
      })
    }

    // Call service to register user
    const { user, session } = await registerUserService({
      email,
      password,
      metadata,
    })

    // Return user and session token
    return res.status(201).json({
      message: 'User registered successfully',
      user: {
        id: user.id,
        email: user.email,
        metadata: user.user_metadata,
      },
      access_token: session?.access_token || null,
      refresh_token: session?.refresh_token || null,
    })
  } catch (error: any) {
    console.error('Registration error:', error)

    // Handle specific error cases
    if (error.message.includes('User already registered') || error.message.includes('already registered')) {
      return res.status(409).json({
        error: 'A user with this email already exists',
      })
    }

    if (error.message.includes('Password')) {
      return res.status(400).json({
        error: error.message,
      })
    }

    return res.status(500).json({
      error: 'An error occurred during registration',
      message: error.message,
    })
  }
}
