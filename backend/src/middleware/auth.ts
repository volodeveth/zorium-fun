import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { prisma } from '../config/database'
import { UnauthorizedError, ForbiddenError } from './errorHandler'
import { logger } from '../utils/logger'

interface JWTPayload {
  userId: string
  address: string
  iat?: number
  exp?: number
}

// Extend Express Request to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string
        address: string
        email?: string
        username?: string
        isVerified: boolean
      }
    }
  }
}

// Generate JWT token
export function generateToken(payload: { userId: string; address: string }): string {
  const secret = process.env.JWT_SECRET
  if (!secret) {
    throw new Error('JWT_SECRET environment variable is not set')
  }
  
  return jwt.sign(
    payload,
    secret,
    { 
      expiresIn: process.env.JWT_EXPIRES_IN || '7d',
      issuer: 'zorium-api',
      audience: 'zorium-client'
    } as jwt.SignOptions
  )
}

// Verify JWT token
export function verifyToken(token: string): JWTPayload {
  const secret = process.env.JWT_SECRET
  if (!secret) {
    throw new Error('JWT_SECRET environment variable is not set')
  }
  
  try {
    return jwt.verify(token, secret, {
      issuer: 'zorium-api',
      audience: 'zorium-client'
    }) as JWTPayload
  } catch (error) {
    throw new UnauthorizedError('Invalid token')
  }
}

// Extract token from request
function extractToken(req: Request): string | null {
  const authHeader = req.headers.authorization
  
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7)
  }
  
  // Also check for token in cookies
  if (req.cookies?.token) {
    return req.cookies.token
  }
  
  return null
}

// Authenticate token middleware
export async function authenticateToken(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const token = extractToken(req)
    
    if (!token) {
      throw new UnauthorizedError('Access token is required')
    }
    
    const decoded = verifyToken(token)
    
    // Get user from database
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        address: true,
        email: true,
        username: true,
        isVerified: true
      }
    })
    
    if (!user) {
      throw new UnauthorizedError('User not found')
    }
    
    req.user = user
    next()
    
  } catch (error) {
    logger.warn('Authentication failed:', {
      error: error.message,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      path: req.path
    })
    
    next(error)
  }
}

// Optional authentication middleware
export async function optionalAuth(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const token = extractToken(req)
    
    if (token) {
      const decoded = verifyToken(token)
      
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: {
          id: true,
          address: true,
          email: true,
          username: true,
          isVerified: true
        }
      })
      
      if (user) {
        req.user = user
      }
    }
    
    next()
    
  } catch (error) {
    // Ignore authentication errors for optional auth
    next()
  }
}

// Check if user is platform owner
export function requirePlatformOwner(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const platformOwnerAddress = process.env.PLATFORM_OWNER_ADDRESS
  
  if (!req.user) {
    throw new UnauthorizedError('Authentication required')
  }
  
  if (!platformOwnerAddress) {
    throw new Error('PLATFORM_OWNER_ADDRESS environment variable is not set')
  }
  
  if (req.user.address.toLowerCase() !== platformOwnerAddress.toLowerCase()) {
    throw new ForbiddenError('Platform owner access required')
  }
  
  next()
}

// Check if user owns the resource (based on address parameter)
export function requireOwnership(
  req: Request,
  res: Response,
  next: NextFunction
) {
  if (!req.user) {
    throw new UnauthorizedError('Authentication required')
  }
  
  const addressParam = req.params.address
  
  if (!addressParam) {
    throw new Error('Address parameter is required')
  }
  
  if (req.user.address.toLowerCase() !== addressParam.toLowerCase()) {
    throw new ForbiddenError('You can only access your own resources')
  }
  
  next()
}

// Refresh token generation
export function generateRefreshToken(payload: { userId: string }): string {
  const secret = process.env.JWT_SECRET
  if (!secret) {
    throw new Error('JWT_SECRET environment variable is not set')
  }
  
  return jwt.sign(
    payload,
    secret + 'refresh',
    { 
      expiresIn: '30d',
      issuer: 'zorium-api',
      audience: 'zorium-client'
    } as jwt.SignOptions
  )
}

// Verify refresh token
export function verifyRefreshToken(token: string): { userId: string } {
  const secret = process.env.JWT_SECRET
  if (!secret) {
    throw new Error('JWT_SECRET environment variable is not set')
  }
  
  try {
    return jwt.verify(token, secret + 'refresh', {
      issuer: 'zorium-api',
      audience: 'zorium-client'
    }) as { userId: string }
  } catch (error) {
    throw new UnauthorizedError('Invalid refresh token')
  }
}