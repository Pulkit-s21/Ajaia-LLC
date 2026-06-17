import { Request, Response, NextFunction } from "express"
import jwt from "jsonwebtoken"

export interface AuthRequest extends Request {
  userId?: string
  userEmail?: string
}

const JWT_SECRET = process.env.JWT_SECRET

if (!JWT_SECRET) {
  throw new Error("JWT Secret not defined")
}

const secret: string = JWT_SECRET

export function authenticate(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) {
  const header = req.headers.authorization
  if (!header?.startsWith("Bearer ")) {
    res.status(401).json({ error: "Missing or invalid token" })
    return
  }

  const token = header.slice(7)
  try {
    const payload = jwt.verify(token, secret) as {
      userId: string
      email: string
    }
    req.userId = payload.userId
    req.userEmail = payload.email
    next()
  } catch {
    res.status(401).json({ error: "Invalid or expired token" })
  }
}

export function signToken(userId: string, email: string): string {
  return jwt.sign({ userId, email }, secret, { expiresIn: "7d" })
}
