import { Request, Response, NextFunction } from 'express'
import { prisma } from '../config/database'
import { generateToken, generateRefreshToken, verifyRefreshToken } from '../middleware/auth'
import { NotFoundError, ValidationError, UnauthorizedError } from '../middleware/errorHandler'
import { logger } from '../utils/logger'
import { 
  storeNonce, 
  getNonce, 
  consumeNonce, 
  verifySignature, 
  generateAuthMessage,
  isValidEthereumAddress 
} from '../utils/web3'

class AuthController {
  // Get nonce for wallet signature
  async getNonce(req: Request, res: Response, next: NextFunction) {
    try {
      const { address } = req.params
      
      if (!isValidEthereumAddress(address)) {
        throw new ValidationError('Invalid Ethereum address')
      }
      
      const nonce = storeNonce(address)
      const message = generateAuthMessage(nonce)
      
      res.json({
        nonce,
        message,
        address: address.toLowerCase()
      })
      
    } catch (error) {
      next(error)
    }
  }
  
  // Register new user
  async register(req: Request, res: Response, next: NextFunction) {
    try {
      const { address, signature, email, username } = req.body
      
      if (!isValidEthereumAddress(address)) {
        throw new ValidationError('Invalid Ethereum address')
      }
      
      // Get stored nonce
      const storedNonce = getNonce(address)
      if (!storedNonce) {
        throw new ValidationError('Nonce not found or expired. Please request a new nonce.')
      }
      
      // Verify signature
      const isValidSignature = await verifySignature(address, signature, storedNonce)
      if (!isValidSignature) {
        throw new UnauthorizedError('Invalid signature')
      }
      
      // Consume nonce
      consumeNonce(address)
      
      // Check if user already exists
      const existingUser = await prisma.user.findFirst({
        where: {
          OR: [
            { address: address.toLowerCase() },
            ...(email ? [{ email: email.toLowerCase() }] : []),
            ...(username ? [{ username: username.toLowerCase() }] : [])
          ]
        }
      })
      
      if (existingUser) {
        throw new ValidationError('User with this address, email, or username already exists')
      }
      
      // Check if user is eligible for early bird reward
      const userCount = await prisma.user.count()
      const isEarlyBird = userCount < 10000
      const earlyBirdNumber = isEarlyBird ? userCount + 1 : null
      
      // Create user
      const user = await prisma.user.create({
        data: {
          address: address.toLowerCase(),
          email: email?.toLowerCase(),
          username: username?.toLowerCase(),
          isVerified: false,
          isEarlyBird,
          earlyBirdNumber,
          zrmBalance: isEarlyBird ? 10000 : 0
        }
      })
      
      // Generate tokens
      const token = generateToken({ userId: user.id, address: user.address })
      const refreshToken = generateRefreshToken({ userId: user.id })
      
      logger.info('User registered:', { 
        userId: user.id, 
        address: user.address,
        isEarlyBird,
        earlyBirdNumber
      })
      
      res.status(201).json({
        message: 'User registered successfully',
        user: {
          id: user.id,
          address: user.address,
          email: user.email,
          username: user.username,
          isVerified: user.isVerified,
          isEarlyBird: user.isEarlyBird,
          earlyBirdNumber: user.earlyBirdNumber,
          zrmBalance: user.zrmBalance
        },
        token,
        refreshToken
      })
      
    } catch (error) {
      next(error)
    }
  }
  
  // Login with wallet
  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { address, signature } = req.body
      
      if (!isValidEthereumAddress(address)) {
        throw new ValidationError('Invalid Ethereum address')
      }
      
      // Get stored nonce
      const storedNonce = getNonce(address)
      if (!storedNonce) {
        throw new ValidationError('Nonce not found or expired. Please request a new nonce.')
      }
      
      // Verify signature
      const isValidSignature = await verifySignature(address, signature, storedNonce)
      if (!isValidSignature) {
        throw new UnauthorizedError('Invalid signature')
      }
      
      // Consume nonce
      consumeNonce(address)
      
      // Find user
      const user = await prisma.user.findUnique({
        where: { address: address.toLowerCase() }
      })
      
      if (!user) {
        throw new NotFoundError('User not found. Please register first.')
      }
      
      // Update last active
      await prisma.user.update({
        where: { id: user.id },
        data: { lastActiveAt: new Date() }
      })
      
      // Generate tokens
      const token = generateToken({ userId: user.id, address: user.address })
      const refreshToken = generateRefreshToken({ userId: user.id })
      
      logger.info('User logged in:', { userId: user.id, address: user.address })
      
      res.json({
        message: 'Login successful',
        user: {
          id: user.id,
          address: user.address,
          email: user.email,
          username: user.username,
          displayName: user.displayName,
          isVerified: user.isVerified,
          isEarlyBird: user.isEarlyBird,
          zrmBalance: user.zrmBalance
        },
        token,
        refreshToken
      })
      
    } catch (error) {
      next(error)
    }
  }
  
  // Get current session
  async getSession(req: Request, res: Response, next: NextFunction) {
    try {
      const user = req.user
      
      if (!user) {
        throw new UnauthorizedError('Not authenticated')
      }
      
      // Get full user data
      const fullUser = await prisma.user.findUnique({
        where: { id: user.id }
      })
      
      if (!fullUser) {
        throw new NotFoundError('User not found')
      }
      
      res.json({
        user: fullUser
      })
      
    } catch (error) {
      next(error)
    }
  }
}

export const authController = new AuthController()