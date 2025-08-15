import { Request, Response, NextFunction } from 'express'
import { prisma } from '../config/database'
import { NotFoundError, ForbiddenError, ValidationError } from '../middleware/errorHandler'
import { logger } from '../utils/logger'
import { isValidEthereumAddress } from '../utils/web3'

class UserController {
  // Get user by address
  async getUserByAddress(req: Request, res: Response, next: NextFunction) {
    try {
      const { address } = req.params
      
      if (!isValidEthereumAddress(address)) {
        throw new ValidationError('Invalid Ethereum address')
      }
      
      const user = await prisma.user.findUnique({
        where: { address: address.toLowerCase() },
        select: {
          id: true,
          address: true,
          username: true,
          displayName: true,
          bio: true,
          avatar: true,
          banner: true,
          website: true,
          twitterUsername: true,
          isVerified: true,
          isEarlyBird: true,
          earlyBirdNumber: true,
          createdAt: true,
          _count: {
            select: {
              createdNFTs: true,
              ownedNFTs: true,
              followers: true,
              follows: true,
              likes: true
            }
          }
        }
      })
      
      if (!user) {
        throw new NotFoundError('User not found')
      }
      
      res.json({ user })
      
    } catch (error) {
      next(error)
    }
  }
  
  // Update user profile
  async updateProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const { address } = req.params
      const { displayName, bio, website, avatar, banner } = req.body
      const currentUser = req.user
      
      if (!currentUser) {
        throw new ForbiddenError('Authentication required')
      }
      
      // Check if user owns this profile
      if (currentUser.address.toLowerCase() !== address.toLowerCase()) {
        throw new ForbiddenError('You can only update your own profile')
      }
      
      const updatedUser = await prisma.user.update({
        where: { address: address.toLowerCase() },
        data: {
          displayName,
          bio,
          website,
          avatar,
          banner,
          updatedAt: new Date()
        }
      })
      
      res.json({
        message: 'Profile updated successfully',
        user: updatedUser
      })
      
    } catch (error) {
      next(error)
    }
  }
  
  // Get user's NFTs
  async getUserNFTs(req: Request, res: Response, next: NextFunction) {
    try {
      const { address } = req.params
      const { page = 1, limit = 20, type = 'owned' } = req.query
      
      if (!isValidEthereumAddress(address)) {
        throw new ValidationError('Invalid Ethereum address')
      }
      
      const offset = (Number(page) - 1) * Number(limit)
      
      let whereClause: any
      if (type === 'created') {
        whereClause = {
          creator: { address: address.toLowerCase() }
        }
      } else {
        whereClause = {
          owner: { address: address.toLowerCase() }
        }
      }
      
      const [nfts, total] = await Promise.all([
        prisma.nFT.findMany({
          where: whereClause,
          skip: offset,
          take: Number(limit),
          orderBy: { createdAt: 'desc' },
          include: {
            creator: {
              select: {
                address: true,
                username: true,
                displayName: true,
                avatar: true
              }
            },
            owner: {
              select: {
                address: true,
                username: true,
                displayName: true,
                avatar: true
              }
            }
          }
        }),
        prisma.nFT.count({ where: whereClause })
      ])
      
      res.json({
        nfts,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit))
        }
      })
      
    } catch (error) {
      next(error)
    }
  }

  // Get ZRM balance for frontend API compatibility
  async getZrmBalance(req: Request, res: Response, next: NextFunction) {
    try {
      const { address } = req.params
      
      // Find user by address
      const user = await prisma.user.findUnique({
        where: { address: address.toLowerCase() },
        select: {
          id: true,
          address: true,
          username: true,
          displayName: true,
          email: true,
          zrmBalance: true,
          isVerified: true,
          isEarlyBird: true,
          earlyBirdNumber: true,
          createdAt: true
        }
      })
      
      if (!user) {
        // Return default structure for non-existent users
        return res.json({
          balance: 0,
          user: null,
          earlyBird: {
            isEligible: false,
            number: null,
            claimed: false
          }
        })
      }

      // Return ZRM balance and user info
      res.json({
        balance: Number(user.zrmBalance),
        user: {
          id: user.id,
          address: user.address,
          username: user.username,
          displayName: user.displayName,
          email: user.email,
          isVerified: user.isVerified,
          isEarlyBird: user.isEarlyBird,
          earlyBirdNumber: user.earlyBirdNumber,
          createdAt: user.createdAt
        },
        earlyBird: {
          isEligible: user.isEarlyBird,
          number: user.earlyBirdNumber,
          claimed: user.isEarlyBird
        }
      })
      
    } catch (error) {
      next(error)
    }
  }

  // Get user's collections
  async getUserCollections(req: Request, res: Response, next: NextFunction) {
    try {
      const { address } = req.params
      const { page = 1, limit = 20 } = req.query

      if (!isValidEthereumAddress(address)) {
        throw new ValidationError('Invalid Ethereum address')
      }

      // Find user
      const user = await prisma.user.findUnique({
        where: { address: address.toLowerCase() }
      })

      if (!user) {
        throw new NotFoundError('User not found')
      }

      const offset = (Number(page) - 1) * Number(limit)

      const [collections, total] = await Promise.all([
        prisma.collection.findMany({
          where: { creatorId: user.id },
          skip: offset,
          take: Number(limit),
          orderBy: { createdAt: 'desc' },
          include: {
            creator: {
              select: {
                address: true,
                username: true,
                displayName: true,
                avatar: true,
                isVerified: true
              }
            },
            _count: {
              select: {
                nfts: true
              }
            }
          }
        }),
        prisma.collection.count({ where: { creatorId: user.id } })
      ])

      res.json({
        collections,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit))
        }
      })

    } catch (error) {
      next(error)
    }
  }

  async toggleFollow(req: Request, res: Response, next: NextFunction) {
    try {
      res.json({
        success: false,
        message: 'Follow functionality not implemented yet'
      })
    } catch (error) {
      next(error)
    }
  }

  async getFollowers(req: Request, res: Response, next: NextFunction) {
    try {
      res.json({
        followers: [],
        message: 'Followers not implemented yet'
      })
    } catch (error) {
      next(error)
    }
  }

  async getFollowing(req: Request, res: Response, next: NextFunction) {
    try {
      res.json({
        following: [],
        message: 'Following not implemented yet'
      })
    } catch (error) {
      next(error)
    }
  }

  async getUserActivity(req: Request, res: Response, next: NextFunction) {
    try {
      res.json({
        activity: [],
        message: 'User activity not implemented yet'
      })
    } catch (error) {
      next(error)
    }
  }

  async getUserStats(req: Request, res: Response, next: NextFunction) {
    try {
      const { address } = req.params
      
      if (!isValidEthereumAddress(address)) {
        throw new ValidationError('Invalid Ethereum address')
      }
      
      const user = await prisma.user.findUnique({
        where: { address: address.toLowerCase() },
        include: {
          _count: {
            select: {
              createdNFTs: true,
              ownedNFTs: true,
              followers: true,
              follows: true,
              likes: true,
              comments: true
            }
          }
        }
      })
      
      if (!user) {
        throw new NotFoundError('User not found')
      }
      
      // Calculate additional stats
      const [totalViews, totalLikes] = await Promise.all([
        prisma.nFT.aggregate({
          where: { creatorId: user.id },
          _sum: { viewCount: true }
        }),
        prisma.nFT.aggregate({
          where: { creatorId: user.id },
          _sum: { likeCount: true }
        })
      ])
      
      res.json({
        stats: {
          nftsCreated: user._count.createdNFTs,
          nftsOwned: user._count.ownedNFTs,
          followers: user._count.followers,
          following: user._count.follows,
          likes: user._count.likes,
          comments: user._count.comments,
          totalViews: totalViews._sum.viewCount || 0,
          totalLikes: totalLikes._sum.likeCount || 0,
          zrmBalance: Number(user.zrmBalance),
          isVerified: user.isVerified,
          isEarlyBird: user.isEarlyBird,
          memberSince: user.createdAt
        }
      })
      
    } catch (error) {
      next(error)
    }
  }

  async updateZRMBalance(req: Request, res: Response, next: NextFunction) {
    try {
      res.json({
        success: false,
        message: 'ZRM balance update not implemented yet'
      })
    } catch (error) {
      next(error)
    }
  }

  async searchUsers(req: Request, res: Response, next: NextFunction) {
    try {
      res.json({
        users: [],
        total: 0,
        message: 'User search not implemented yet'
      })
    } catch (error) {
      next(error)
    }
  }

  async claimEarlyBirdBonus(req: Request, res: Response, next: NextFunction) {
    try {
      const { address, transactionHash, amount } = req.body
      
      logger.info('Early Bird bonus claim attempt', {
        address,
        transactionHash,
        amount
      })
      
      // Validate amount (should be 10000 for Early Bird)
      if (amount !== 10000) {
        throw new ValidationError('Invalid Early Bird bonus amount')
      }
      
      // Check if user already received Early Bird bonus
      const existingUser = await prisma.user.findUnique({
        where: { address: address.toLowerCase() },
        select: { isEarlyBird: true, earlyBirdNumber: true, zrmBalance: true }
      })
      
      if (existingUser?.isEarlyBird) {
        return res.status(400).json({
          success: false,
          message: 'User has already claimed Early Bird bonus'
        })
      }
      
      // Check if transaction hash was already used
      const existingClaim = await prisma.user.findFirst({
        where: { 
          earlyBirdTransactionHash: transactionHash 
        }
      })
      
      if (existingClaim) {
        return res.status(400).json({
          success: false,
          message: 'Transaction hash already used for Early Bird claim'
        })
      }
      
      // Get current Early Bird count
      const earlyBirdCount = await prisma.user.count({
        where: { isEarlyBird: true }
      })
      
      if (earlyBirdCount >= 10000) {
        return res.status(400).json({
          success: false,
          message: 'Early Bird program has reached maximum participants (10,000)'
        })
      }
      
      // Create or update user with Early Bird bonus
      const user = await prisma.user.upsert({
        where: { address: address.toLowerCase() },
        update: {
          isEarlyBird: true,
          earlyBirdNumber: earlyBirdCount + 1,
          earlyBirdTransactionHash: transactionHash,
          zrmBalance: {
            increment: amount
          }
        },
        create: {
          address: address.toLowerCase(),
          username: `user_${address.slice(-8)}`,
          isEarlyBird: true,
          earlyBirdNumber: earlyBirdCount + 1,
          earlyBirdTransactionHash: transactionHash,
          zrmBalance: amount
        },
        select: {
          address: true,
          zrmBalance: true,
          isEarlyBird: true,
          earlyBirdNumber: true
        }
      })
      
      logger.info('Early Bird bonus granted successfully', {
        address,
        earlyBirdNumber: user.earlyBirdNumber,
        newBalance: Number(user.zrmBalance),
        transactionHash
      })
      
      res.json({
        success: true,
        message: 'Early Bird bonus granted successfully',
        data: {
          address: user.address,
          earlyBirdNumber: user.earlyBirdNumber,
          bonusAmount: amount,
          newBalance: Number(user.zrmBalance),
          transactionHash
        }
      })
      
    } catch (error) {
      logger.error('Early Bird bonus claim failed', {
        error: error.message,
        address: req.body?.address,
        transactionHash: req.body?.transactionHash
      })
      next(error)
    }
  }
}

export const userController = new UserController()