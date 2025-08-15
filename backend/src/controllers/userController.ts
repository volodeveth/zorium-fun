import { Request, Response, NextFunction } from 'express'
import { prisma } from '../config/database'
import { NotFoundError, ForbiddenError, ValidationError } from '../middleware/errorHandler'
import { logger } from '../utils/logger'
import { 
  getUserAllocatedBalance, 
  canUserSpinWheel, 
  getWheelCooldownTime,
  getUserZRMBalance,
  isValidEthereumAddress
} from '../utils/web3'

class UserController {
  // Get user by address
  async getUserByAddress(req: Request, res: Response, next: NextFunction) {
    try {
      const { address } = req.params
      
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
          createdAt: true,
          _count: {
            select: {
              createdNFTs: true,
              ownedNFTs: true,
              followers: true,
              follows: true
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
      
      // Check if user owns this profile
      if (currentUser?.address.toLowerCase() !== address.toLowerCase()) {
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
        },
        select: {
          id: true,
          address: true,
          username: true,
          displayName: true,
          bio: true,
          avatar: true,
          banner: true,
          website: true,
          updatedAt: true
        }
      })
      
      logger.info('Profile updated:', { userId: updatedUser.id })
      
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
      
      const offset = (Number(page) - 1) * Number(limit)
      
      let nfts
      let total
      
      if (type === 'created') {
        [nfts, total] = await Promise.all([
          prisma.nFT.findMany({
            where: {
              creator: { address: address.toLowerCase() }
            },
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
              collection: {
                select: {
                  id: true,
                  name: true
                }
              }
            }
          }),
          prisma.nFT.count({
            where: {
              creator: { address: address.toLowerCase() }
            }
          })
        ])
      } else {
        [nfts, total] = await Promise.all([
          prisma.nFT.findMany({
            where: {
              owner: { address: address.toLowerCase() }
            },
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
              collection: {
                select: {
                  id: true,
                  name: true
                }
              }
            }
          }),
          prisma.nFT.count({
            where: {
              owner: { address: address.toLowerCase() }
            }
          })
        ])
      }
      
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
  
  // Get user's collections (placeholder)
  async getUserCollections(req: Request, res: Response, next: NextFunction) {
    try {
      res.json({
        collections: [],
        message: 'Collections endpoint not fully implemented'
      })
    } catch (error) {
      next(error)
    }
  }
  
  // Toggle follow/unfollow
  async toggleFollow(req: Request, res: Response, next: NextFunction) {
    try {
      const { address } = req.params
      const currentUser = req.user
      
      if (!currentUser) {
        throw new NotFoundError('User not authenticated')
      }
      
      if (currentUser.address.toLowerCase() === address.toLowerCase()) {
        throw new ForbiddenError('Cannot follow yourself')
      }
      
      // Check if target user exists
      const targetUser = await prisma.user.findUnique({
        where: { address: address.toLowerCase() }
      })
      
      if (!targetUser) {
        throw new NotFoundError('Target user not found')
      }
      
      // Check if already following
      const existingFollow = await prisma.follow.findUnique({
        where: {
          followerId_followingId: {
            followerId: currentUser.id,
            followingId: targetUser.id
          }
        }
      })
      
      if (existingFollow) {
        // Unfollow
        await prisma.follow.delete({
          where: { id: existingFollow.id }
        })
        
        res.json({
          message: 'Unfollowed successfully',
          isFollowing: false
        })
      } else {
        // Follow
        await prisma.follow.create({
          data: {
            followerId: currentUser.id,
            followingId: targetUser.id
          }
        })
        
        res.json({
          message: 'Followed successfully',
          isFollowing: true
        })
      }
      
    } catch (error) {
      next(error)
    }
  }
  
  // Get followers (placeholder)
  async getFollowers(req: Request, res: Response, next: NextFunction) {
    try {
      res.json({
        followers: [],
        message: 'Followers endpoint not fully implemented'
      })
    } catch (error) {
      next(error)
    }
  }
  
  // Get following (placeholder)
  async getFollowing(req: Request, res: Response, next: NextFunction) {
    try {
      res.json({
        following: [],
        message: 'Following endpoint not fully implemented'
      })
    } catch (error) {
      next(error)
    }
  }
  
  // Get user activity (placeholder)
  async getUserActivity(req: Request, res: Response, next: NextFunction) {
    try {
      res.json({
        activity: [],
        message: 'Activity endpoint not fully implemented'
      })
    } catch (error) {
      next(error)
    }
  }
  
  // Get user stats
  async getUserStats(req: Request, res: Response, next: NextFunction) {
    try {
      const { address } = req.params
      
      const user = await prisma.user.findUnique({
        where: { address: address.toLowerCase() },
        include: {
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
      
      res.json({
        stats: {
          nftsCreated: user._count.createdNFTs,
          nftsOwned: user._count.ownedNFTs,
          followers: user._count.followers,
          following: user._count.follows,
          likes: user._count.likes,
          zrmBalance: user.zrmBalance
        }
      })
      
    } catch (error) {
      next(error)
    }
  }
  
  // Update ZRM balance (admin only)
  async updateZRMBalance(req: Request, res: Response, next: NextFunction) {
    try {
      res.json({
        message: 'ZRM balance update not implemented yet'
      })
    } catch (error) {
      next(error)
    }
  }
  
  // Search users
  async searchUsers(req: Request, res: Response, next: NextFunction) {
    try {
      const { q, page = 1, limit = 20 } = req.query
      
      const offset = (Number(page) - 1) * Number(limit)
      
      const [users, total] = await Promise.all([
        prisma.user.findMany({
          where: {
            OR: [
              { username: { contains: q as string, mode: 'insensitive' } },
              { displayName: { contains: q as string, mode: 'insensitive' } }
            ]
          },
          skip: offset,
          take: Number(limit),
          select: {
            id: true,
            address: true,
            username: true,
            displayName: true,
            avatar: true,
            isVerified: true,
            _count: {
              select: {
                followers: true
              }
            }
          },
          orderBy: {
            followers: {
              _count: 'desc'
            }
          }
        }),
        prisma.user.count({
          where: {
            OR: [
              { username: { contains: q as string, mode: 'insensitive' } },
              { displayName: { contains: q as string, mode: 'insensitive' } }
            ]
          }
        })
      ])
      
      res.json({
        users,
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

  // Get user's ZRM balance from blockchain
  async getZRMBalance(req: Request, res: Response, next: NextFunction) {
    try {
      const { address } = req.params

      if (!address) {
        throw new ValidationError('Address parameter is required')
      }

      if (!isValidEthereumAddress(address)) {
        throw new ValidationError('Invalid Ethereum address')
      }

      // Get balances from blockchain
      const [allocatedBalance, transferableBalance, canSpin, cooldownTime] = await Promise.all([
        getUserAllocatedBalance(address),
        getUserZRMBalance(address),
        canUserSpinWheel(address),
        getWheelCooldownTime(address)
      ])

      logger.info('Retrieved ZRM balance from blockchain', {
        address,
        allocatedBalance,
        transferableBalance,
        canSpin,
        cooldownTime
      })

      res.json({
        success: true,
        address: address.toLowerCase(),
        zrmBalance: {
          allocated: allocatedBalance,        // Non-transferable ZRM for promotions
          transferable: transferableBalance, // Regular ZRM tokens
          total: (parseFloat(allocatedBalance) + parseFloat(transferableBalance)).toString()
        },
        wheel: {
          canSpin,
          cooldownTime,
          cooldownExpires: cooldownTime > 0 ? new Date(Date.now() + cooldownTime * 1000).toISOString() : null
        },
        blockchainVerified: true
      })

    } catch (error) {
      logger.error('Failed to get ZRM balance from blockchain:', error)
      next(error)
    }
  }

  // Get ZRM platform statistics
  async getZRMStats(req: Request, res: Response, next: NextFunction) {
    try {
      const { getZRMPlatformStats } = await import('../utils/web3')
      
      const stats = await getZRMPlatformStats()
      
      res.json({
        success: true,
        platformStats: stats,
        blockchainVerified: true
      })

    } catch (error) {
      logger.error('Failed to get ZRM platform stats:', error)
      next(error)
    }
  }

  // Aliases for backward compatibility
  getZrmBalance = this.getZRMBalance
}

export const userController = new UserController()