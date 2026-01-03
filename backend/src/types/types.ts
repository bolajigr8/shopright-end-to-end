import { Request } from 'express'
import { UserDocument } from '../models/user.model.js'

// Extend the Express Request interface to include user property
export interface AuthRequest extends Request {
  user: UserDocument
}

// Fix: Update MulterRequest to match Multer's actual type definition
export interface MulterRequest extends Request {
  files?: Express.Multer.File[] | { [fieldname: string]: Express.Multer.File[] }
  user?: UserDocument
}
