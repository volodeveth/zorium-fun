import { Request, Response, NextFunction } from 'express'
import { prisma } from '../config/database'
import { NotFoundError, ValidationError } from '../middleware/errorHandler'
import { logger } from '../utils/logger'
import emailService from '../services/emailService'
import crypto from 'crypto'

class EmailController {
  // Send email verification
  async sendVerification(req: Request, res: Response, next: NextFunction) {
    try {
      const { email } = req.body
      const currentUser = req.user

      if (!currentUser) {
        throw new ValidationError('User not authenticated')
      }

      if (!email || !email.includes('@')) {
        throw new ValidationError('Valid email address is required')
      }

      // Check if email is already verified by another user
      const existingUser = await prisma.user.findFirst({
        where: {
          email: email.toLowerCase(),
          emailVerified: true,
          id: { not: currentUser.id }
        }
      })

      if (existingUser) {
        throw new ValidationError('This email is already verified by another user')
      }

      // Generate verification token
      const token = crypto.randomBytes(32).toString('hex')
      const expiresAt = new Date()
      expiresAt.setHours(expiresAt.getHours() + 24) // 24 hours expiry

      // Delete existing verification tokens for this user
      await prisma.emailVerificationToken.deleteMany({
        where: { userId: currentUser.id }
      })

      // Create new verification token
      await prisma.emailVerificationToken.create({
        data: {
          token,
          userId: currentUser.id,
          email: email.toLowerCase(),
          expiresAt
        }
      })

      // Send verification email
      try {
        await emailService.sendEmailVerification(email, token, currentUser.username || currentUser.address)
        
        logger.info('Verification email sent:', { 
          userId: currentUser.id, 
          email: email.toLowerCase() 
        })

        res.json({
          success: true,
          message: 'Verification email sent successfully',
          email: email.toLowerCase()
        })
      } catch (emailError) {
        logger.error('Failed to send verification email:', emailError)
        
        // Delete the token if email sending failed
        await prisma.emailVerificationToken.deleteMany({
          where: { userId: currentUser.id, token }
        })

        throw new ValidationError('Failed to send verification email. Please try again.')
      }

    } catch (error) {
      next(error)
    }
  }

  // Verify email with token
  async verifyEmail(req: Request, res: Response, next: NextFunction) {
    try {
      const { token } = req.body

      if (!token) {
        throw new ValidationError('Verification token is required')
      }

      // Find verification token
      const verificationToken = await prisma.emailVerificationToken.findUnique({
        where: { token },
        include: {
          user: true
        }
      })

      if (!verificationToken) {
        throw new NotFoundError('Invalid verification token')
      }

      // Check if token has expired
      if (verificationToken.expiresAt < new Date()) {
        throw new ValidationError('Verification token has expired')
      }

      // Check if token has already been used
      if (verificationToken.usedAt) {
        throw new ValidationError('Verification token has already been used')
      }

      // Check if email is already verified by another user
      const existingUser = await prisma.user.findFirst({
        where: {
          email: verificationToken.email,
          emailVerified: true,
          id: { not: verificationToken.userId }
        }
      })

      if (existingUser) {
        throw new ValidationError('This email is already verified by another user')
      }

      // Update user with verified email
      const updatedUser = await prisma.user.update({
        where: { id: verificationToken.userId },
        data: {
          email: verificationToken.email,
          emailVerified: true,
          emailVerifiedAt: new Date()
        }
      })

      // Mark token as used
      await prisma.emailVerificationToken.update({
        where: { id: verificationToken.id },
        data: { usedAt: new Date() }
      })

      // Create success notification
      try {
        await prisma.notification.create({
          data: {
            userId: updatedUser.id,
            type: 'EMAIL_VERIFICATION',
            title: 'Email Verified',
            message: 'Your email has been successfully verified!',
            data: {
              email: verificationToken.email,
              verifiedAt: new Date().toISOString()
            }
          }
        })
      } catch (notificationError) {
        logger.warn('Failed to create verification notification:', notificationError)
      }

      logger.info('Email verified successfully:', { 
        userId: updatedUser.id, 
        email: verificationToken.email 
      })

      res.json({
        success: true,
        message: 'Email verified successfully',
        user: {
          id: updatedUser.id,
          address: updatedUser.address,
          email: updatedUser.email,
          emailVerified: updatedUser.emailVerified,
          emailVerifiedAt: updatedUser.emailVerifiedAt
        }
      })

    } catch (error) {
      next(error)
    }
  }

  // Resend verification email
  async resendVerification(req: Request, res: Response, next: NextFunction) {
    try {
      const currentUser = req.user

      if (!currentUser) {
        throw new ValidationError('User not authenticated')
      }

      // Find the most recent verification token
      const latestToken = await prisma.emailVerificationToken.findFirst({
        where: { userId: currentUser.id },
        orderBy: { createdAt: 'desc' }
      })

      if (!latestToken) {
        throw new NotFoundError('No pending email verification found')
      }

      if (latestToken.usedAt) {
        throw new ValidationError('Email is already verified')
      }

      // Check if we can resend (rate limiting - max 1 per 5 minutes)
      const fiveMinutesAgo = new Date()
      fiveMinutesAgo.setMinutes(fiveMinutesAgo.getMinutes() - 5)

      if (latestToken.createdAt > fiveMinutesAgo) {
        const remainingTime = Math.ceil((latestToken.createdAt.getTime() + 5 * 60 * 1000 - Date.now()) / 1000 / 60)
        throw new ValidationError(`Please wait ${remainingTime} minutes before requesting another verification email`)
      }

      // Generate new token
      const newToken = crypto.randomBytes(32).toString('hex')
      const expiresAt = new Date()
      expiresAt.setHours(expiresAt.getHours() + 24)

      // Update existing token
      const updatedToken = await prisma.emailVerificationToken.update({
        where: { id: latestToken.id },
        data: {
          token: newToken,
          expiresAt,
          createdAt: new Date()
        }
      })

      // Send verification email
      try {
        await emailService.sendEmailVerification(
          updatedToken.email, 
          newToken, 
          currentUser.username || currentUser.address
        )
        
        logger.info('Verification email resent:', { 
          userId: currentUser.id, 
          email: updatedToken.email 
        })

        res.json({
          success: true,
          message: 'Verification email resent successfully',
          email: updatedToken.email
        })
      } catch (emailError) {
        logger.error('Failed to resend verification email:', emailError)
        throw new ValidationError('Failed to send verification email. Please try again.')
      }

    } catch (error) {
      next(error)
    }
  }

  // Get verification status
  async getVerificationStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const currentUser = req.user

      if (!currentUser) {
        throw new ValidationError('User not authenticated')
      }

      // Get user with email verification status
      const user = await prisma.user.findUnique({
        where: { id: currentUser.id },
        select: {
          id: true,
          email: true,
          emailVerified: true,
          emailVerifiedAt: true
        }
      })

      if (!user) {
        throw new NotFoundError('User not found')
      }

      // Get pending verification token if exists
      let pendingVerification = null
      if (!user.emailVerified) {
        const token = await prisma.emailVerificationToken.findFirst({
          where: { 
            userId: user.id,
            usedAt: null,
            expiresAt: { gt: new Date() }
          },
          select: {
            email: true,
            createdAt: true,
            expiresAt: true
          }
        })

        if (token) {
          pendingVerification = {
            email: token.email,
            sentAt: token.createdAt,
            expiresAt: token.expiresAt
          }
        }
      }

      res.json({
        success: true,
        verification: {
          email: user.email,
          isVerified: user.emailVerified,
          verifiedAt: user.emailVerifiedAt,
          pendingVerification
        }
      })

    } catch (error) {
      next(error)
    }
  }

  // Update email (requires re-verification)
  async updateEmail(req: Request, res: Response, next: NextFunction) {
    try {
      const { email } = req.body
      const currentUser = req.user

      if (!currentUser) {
        throw new ValidationError('User not authenticated')
      }

      if (!email || !email.includes('@')) {
        throw new ValidationError('Valid email address is required')
      }

      // Check if email is already used by another user
      const existingUser = await prisma.user.findFirst({
        where: {
          email: email.toLowerCase(),
          id: { not: currentUser.id }
        }
      })

      if (existingUser) {
        throw new ValidationError('This email is already in use by another user')
      }

      // Update user email and mark as not verified
      await prisma.user.update({
        where: { id: currentUser.id },
        data: {
          email: email.toLowerCase(),
          emailVerified: false,
          emailVerifiedAt: null
        }
      })

      // Delete old verification tokens
      await prisma.emailVerificationToken.deleteMany({
        where: { userId: currentUser.id }
      })

      res.json({
        success: true,
        message: 'Email updated successfully. Please verify your new email address.',
        email: email.toLowerCase()
      })

    } catch (error) {
      next(error)
    }
  }
}

export const emailController = new EmailController()