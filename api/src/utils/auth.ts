import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.NEXTAUTH_SECRET || 'dev_secret'

export interface AuthedRequest extends Request {
  auth?: { userId: number; email: string; role: string }
}

export function requireAdmin(req: AuthedRequest, res: Response, next: NextFunction) {
  const authHeader = (req.headers.authorization || '') as string
  if (!authHeader.startsWith('Bearer ')) return res.status(401).json({ error: 'missing token' })
  const token = authHeader.replace('Bearer ', '')
  try {
    const payload = jwt.verify(token, JWT_SECRET) as any
    if (payload.role !== 'admin') return res.status(403).json({ error: 'admin required' })
    req.auth = { userId: payload.userId, email: payload.email, role: payload.role }
    next()
  } catch (e) {
    return res.status(401).json({ error: 'invalid token' })
  }
}
