import { Request, Response, NextFunction } from 'express'
import { verifyUserToken } from '../lib/supabase/client'

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string
    email?: string
  }
}

/**
 * Middleware to authenticate requests using Supabase JWT token
 */
export async function authenticateUser(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Unauthorized. Please provide a valid authentication token.',
      })
    }

    const token = authHeader.substring(7) // Remove 'Bearer ' prefix
    const user = await verifyUserToken(token)

    if (!user) {
      return res.status(401).json({
        error: 'Unauthorized. Invalid or expired token.',
      })
    }

    // Attach user to request object
    req.user = {
      id: user.id,
      email: user.email,
    }

    next()
  } catch (error) {
    console.error('Authentication error:', error)
    return res.status(500).json({
      error: 'Internal server error during authentication.',
    })
  }
}
