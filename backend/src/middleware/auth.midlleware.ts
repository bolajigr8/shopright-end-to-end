import { Request, Response, NextFunction, RequestHandler } from 'express'
import { requireAuth } from '@clerk/express'
import { User, UserDocument } from '../models/user.model.js'
import { ENV } from '../config/env.js'

// Extend Express Request type globally
declare global {
  namespace Express {
    interface Request {
      auth: () => { userId: string | null }
      user?: UserDocument
    }
  }
}

export const protectRoute: RequestHandler[] = [
  requireAuth() as RequestHandler,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const clerkId = req.auth().userId
      if (!clerkId) {
        res.status(401).json({ message: 'Unauthorized - invalid token' })
        return
      }

      const user = await User.findOne({ clerkId })
      if (!user) {
        res.status(404).json({ message: 'User not found' })
        return
      }

      req.user = user

      next()
    } catch (error) {
      console.error('Error in protectRoute middleware', error)
      res.status(500).json({ message: 'Internal server error' })
    }
  },
]

export const adminOnly: RequestHandler = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user) {
    res.status(401).json({ message: 'Unauthorized - user not found' })
    return
  }

  if (req.user.email !== ENV.ADMIN_EMAIL) {
    res.status(403).json({ message: 'Forbidden - admin access only' })
    return
  }

  next()
}
