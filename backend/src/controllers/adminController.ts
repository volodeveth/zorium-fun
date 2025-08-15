import { Request, Response, NextFunction } from 'express'
import { prisma } from '../config/database'
import { NotFoundError, ForbiddenError, ValidationError } from '../middleware/errorHandler'
import { logger } from '../utils/logger'
import { 
  isValidEthereumAddress, 
  getZRMPlatformStats, 
  verifyZRMDepositTransaction,
  verifyZRMAllocationTransaction,
  getUserAllocatedBalance
} from '../utils/web3'

// Platform owner addresses
const PLATFORM_OWNERS = [
  '0xe894a9E110ef27320Ae58F1E4A70ACfD07DE3705'.toLowerCase(),
  // Add more admin addresses here if needed
]

class AdminController {
  // Check if user is platform admin
  private isAdmin(userAddress: string): boolean {
    return PLATFORM_OWNERS.includes(userAddress.toLowerCase())
  }

  // Get available ZRM for allocation (deposits - allocations)
  private async getAvailableZRM(): Promise<number> {
    const [deposits, allocations] = await Promise.all([
      prisma.transaction.aggregate({
        where: { type: 'ZRM_DEPOSIT' },
        _sum: { value: true }
      }),
      prisma.transaction.aggregate({
        where: { type: 'ZRM_ALLOCATION' },
        _sum: { value: true }
      })
    ])

    return Number(deposits._sum.value || 0) - Number(allocations._sum.value || 0)
  }

  // Get platform statistics
  getStats = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const adminAddress = req.headers['x-admin-address'] as string

      if (!adminAddress) {
        throw new ForbiddenError('Admin address required in x-admin-address header')
      }

      if (!this.isAdmin(adminAddress)) {
        throw new ForbiddenError('Admin access required - invalid admin address')
        
      }

      // Get user statistics
      const [
        totalUsers,
        verifiedUsers,
        earlyBirdUsers,
        totalNFTs,
        totalCollections
      ] = await Promise.all([
        prisma.user.count(),
        prisma.user.count({ where: { isVerified: true } }),
        prisma.user.count({ where: { isEarlyBird: true } }),
        prisma.nFT.count(),
        prisma.collection.count()
      ])

      // Get platform stats (if exists)
      const platformStats = await prisma.platformStats.findFirst({
        orderBy: { date: 'desc' }
      })

      // Calculate active users (users who were active in last 30 days)
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

      const activeUsers = await prisma.user.count({
        where: {
          lastActiveAt: {
            gte: thirtyDaysAgo
          }
        }
      })

      // Calculate total ZRM balances
      const zrmStats = await prisma.user.aggregate({
        _sum: {
          zrmBalance: true
        }
      })

      // Calculate total transaction volume and fees (exclude ZRM operations)
      const transactionStats = await prisma.transaction.aggregate({
        where: {
          type: {
            in: ['MINT', 'SALE', 'FEE_COLLECTION', 'PROMOTION_PAYMENT'] // Only revenue-generating transactions
          }
        },
        _sum: {
          value: true,
          platformFee: true,
          creatorFee: true,
          referralFee: true,
          firstMinterFee: true
        }
      })

      // Calculate monthly revenue (exclude ZRM operations)
      const monthlyTransactions = await prisma.transaction.aggregate({
        where: {
          createdAt: {
            gte: thirtyDaysAgo
          },
          type: {
            in: ['MINT', 'SALE', 'FEE_COLLECTION'] // Only fee-generating transactions
          }
        },
        _sum: {
          value: true,
          platformFee: true
        }
      })

      // Calculate promotion revenue in ZRM (users spending ZRM on promotion)
      const monthlyPromotionRevenue = await prisma.transaction.aggregate({
        where: {
          createdAt: {
            gte: thirtyDaysAgo
          },
          type: 'PROMOTION_PAYMENT' // Users paying ZRM for promotions
        },
        _sum: {
          value: true
        }
      })

      // Get real ZRM stats from blockchain
      let blockchainZRMStats;
      try {
        blockchainZRMStats = await getZRMPlatformStats()
        logger.info('Retrieved ZRM stats from blockchain:', blockchainZRMStats)
      } catch (error) {
        logger.error('Failed to get ZRM stats from blockchain, using fallback values:', error)
        blockchainZRMStats = {
          treasuryBalance: '0',
          totalAllocated: '0',
          accumulatedFees: '0',
          totalSupply: '0'
        }
      }

      // Calculate real ZRM balance: deposits - allocations (fallback for database tracking)
      const totalZRMDeposits = await prisma.transaction.aggregate({
        where: {
          type: 'ZRM_DEPOSIT'
        },
        _sum: {
          value: true
        }
      })

      const totalZRMAllocations = await prisma.transaction.aggregate({
        where: {
          type: 'ZRM_ALLOCATION'
        },
        _sum: {
          value: true
        }
      })

      // Use blockchain data as primary source, database as fallback
      const stats = {
        totalFees: Number(transactionStats._sum.platformFee || 0),
        platformFees: Number(transactionStats._sum.platformFee || 0),
        creatorFees: Number(transactionStats._sum.creatorFee || 0),
        
        // ZRM stats from blockchain (primary source)
        zrmTotalSupply: Number(blockchainZRMStats.totalSupply), // Total supply from blockchain
        zrmCirculating: Number(zrmStats._sum.zrmBalance || 0), // ZRM allocated to users (database tracking)
        zrmTreasury: Number(blockchainZRMStats.treasuryBalance), // Treasury balance from blockchain
        availableZRM: Number(blockchainZRMStats.treasuryBalance), // Available for allocation = treasury balance
        accumulatedZRM: Number(blockchainZRMStats.accumulatedFees), // Fees accumulated from promotions
        totalZRMDeposited: Number(blockchainZRMStats.totalSupply), // Total deposited = total supply
        totalZRMAllocated: Number(blockchainZRMStats.totalAllocated), // Total allocated from blockchain
        
        // User stats
        totalUsers,
        verifiedUsers,
        activeUsers,
        earlyBirdUsers,
        dailyActiveUsers: Math.floor(activeUsers / 30),
        
        // NFT stats
        totalNFTs,
        totalMints: totalNFTs, // All NFTs are minted
        totalSales: Number(transactionStats._sum.value || 0),
        totalCollections,
        
        // Revenue calculations
        monthlyRevenue: Number(monthlyTransactions._sum.platformFee || 0), // Only platform fees from real transactions
        monthlyRevenueZRM: Number(monthlyPromotionRevenue._sum.value || 0), // ZRM spent on promotions
        totalVolume: Number(transactionStats._sum.value || 0), // Total transaction volume (excluding allocations)
        totalSalesVolume: Number(transactionStats._sum.value || 0) // Real sales volume
      }

      res.json({
        success: true,
        stats
      })

    } catch (error) {
      next(error)
    }
  }

  // Get fee collection history
  getFeeHistory = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const adminAddress = req.headers['x-admin-address'] as string
      const { limit = 50 } = req.query

      if (!adminAddress) {
        throw new ForbiddenError('Admin address required in x-admin-address header')
      }

      if (!this.isAdmin(adminAddress)) {
        throw new ForbiddenError('Admin access required - invalid admin address')
      }

      // Get transaction history related to fees
      const transactions = await prisma.transaction.findMany({
        where: {
          type: {
            in: ['MINT', 'SALE', 'FEE_COLLECTION']
          }
        },
        take: Number(limit),
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          type: true,
          createdAt: true,
          platformFee: true,
          creatorFee: true,
          referralFee: true,
          firstMinterFee: true,
          from: true,
          to: true,
          value: true
        }
      })

      // Format fee history
      const feeHistory = transactions.map(tx => ({
        id: tx.id,
        date: tx.createdAt.toISOString(),
        amount: Number(tx.platformFee || 0),
        type: 'platform',
        source: tx.type === 'MINT' ? 'NFT Minting' : 
                tx.type === 'SALE' ? 'NFT Sale' : 
                'Fee Collection',
        transactionType: tx.type,
        totalValue: Number(tx.value),
        creatorFee: Number(tx.creatorFee || 0),
        referralFee: Number(tx.referralFee || 0),
        firstMinterFee: Number(tx.firstMinterFee || 0)
      }))

      res.json({
        success: true,
        feeHistory,
        total: feeHistory.length
      })

    } catch (error) {
      next(error)
    }
  }

  // Allocate ZRM to a user (for tracking blockchain allocations)
  allocateZRM = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const adminAddress = req.headers['x-admin-address'] as string
      const { toAddress, amount, reason, transactionHash } = req.body

      if (!adminAddress) {
        throw new ForbiddenError('Admin address required in x-admin-address header')
      }

      if (!this.isAdmin(adminAddress)) {
        throw new ForbiddenError('Admin access required - invalid admin address')
      }

      if (!toAddress || !amount) {
        throw new ValidationError('Recipient address and amount are required')
      }

      if (!isValidEthereumAddress(toAddress)) {
        throw new ValidationError('Invalid Ethereum address')
      }

      if (amount <= 0) {
        throw new ValidationError('Amount must be positive')
      }

      // If transaction hash is provided, verify the blockchain transaction
      if (transactionHash) {
        logger.info('🔍 Verifying ZRM allocation transaction on blockchain...', {
          transactionHash,
          adminAddress,
          toAddress,
          amount
        })

        const verification = await verifyZRMAllocationTransaction(
          transactionHash,
          adminAddress,
          toAddress,
          amount.toString()
        )

        if (!verification.valid) {
          logger.error('❌ ZRM allocation verification failed:', verification.error)
          throw new ValidationError(`Blockchain verification failed: ${verification.error}`)
        }

        logger.info('✅ ZRM allocation transaction verified successfully', {
          transactionHash,
          verifiedAmount: verification.actualAmount,
          verifiedRecipient: verification.actualRecipient,
          reason: verification.reason
        })

        // Check if transaction hash already exists
        const existingTx = await prisma.transaction.findUnique({
          where: { hash: transactionHash }
        })

        if (existingTx) {
          throw new ValidationError('Transaction hash already exists')
        }
      } else {
        // For manual allocations without blockchain transaction
        logger.warn('⚠️  Manual ZRM allocation without blockchain verification', {
          adminAddress,
          toAddress,
          amount
        })
      }

      // Find or create user
      let user = await prisma.user.findUnique({
        where: { address: toAddress.toLowerCase() }
      })

      if (!user) {
        // Create user if doesn't exist
        user = await prisma.user.create({
          data: {
            address: toAddress.toLowerCase(),
            zrmBalance: amount
          }
        })
      } else {
        // Update existing user's balance
        user = await prisma.user.update({
          where: { id: user.id },
          data: {
            zrmBalance: {
              increment: amount
            }
          }
        })
      }

      // Create transaction record
      await prisma.transaction.create({
        data: {
          hash: transactionHash || `manual_allocation_${Date.now()}`,
          blockNumber: 0,
          chainId: 7777777, // Zora Network
          type: 'ZRM_ALLOCATION',
          from: adminAddress.toLowerCase(),
          to: toAddress.toLowerCase(),
          value: amount,
          gasUsed: 0,
          gasPrice: 0,
          userId: user.id,
          // Note: In a real implementation, you might want to add a field to track blockchain verification status
        }
      })

      // Create notification for user
      try {
        await prisma.notification.create({
          data: {
            userId: user.id,
            type: 'ZRM_ALLOCATION',
            title: 'ZRM Tokens Allocated',
            message: `You have received ${amount.toLocaleString()} ZRM tokens from the platform admin.`,
            data: {
              amount,
              reason: reason || 'Admin allocation',
              allocatedBy: adminAddress
            }
          }
        })
      } catch (notificationError) {
        logger.warn('Failed to create ZRM allocation notification:', notificationError)
      }

      logger.info('ZRM allocated:', { 
        admin: adminAddress, 
        recipient: toAddress, 
        amount, 
        reason 
      })

      res.json({
        success: true,
        message: 'ZRM allocated successfully',
        allocation: {
          recipient: toAddress,
          amount,
          newBalance: Number(user.zrmBalance),
          reason: reason || 'Admin allocation'
        }
      })

    } catch (error) {
      next(error)
    }
  }

  // Deposit ZRM to platform treasury
  depositZRM = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const adminAddress = req.headers['x-admin-address'] as string
      const { amount, transactionHash } = req.body

      if (!adminAddress) {
        throw new ForbiddenError('Admin address required in x-admin-address header')
      }

      if (!this.isAdmin(adminAddress)) {
        throw new ForbiddenError('Admin access required - invalid admin address')
      }

      if (!amount || !transactionHash) {
        throw new ValidationError('Amount and transaction hash are required')
      }

      if (amount <= 0) {
        throw new ValidationError('Amount must be positive')
      }

      // Verify the transaction on Zora blockchain
      logger.info('🔍 Verifying ZRM deposit transaction on blockchain...', {
        transactionHash,
        adminAddress,
        amount
      })

      const verification = await verifyZRMDepositTransaction(
        transactionHash,
        adminAddress,
        amount.toString()
      )

      if (!verification.valid) {
        logger.error('❌ ZRM deposit verification failed:', verification.error)
        throw new ValidationError(`Blockchain verification failed: ${verification.error}`)
      }

      logger.info('✅ ZRM deposit transaction verified successfully', {
        transactionHash,
        verifiedAmount: verification.actualAmount
      })

      // Check if transaction hash already exists
      const existingTx = await prisma.transaction.findUnique({
        where: { hash: transactionHash }
      })

      if (existingTx) {
        throw new ValidationError('Transaction hash already exists')
      }

      // Create transaction record for real blockchain deposit
      await prisma.transaction.create({
        data: {
          hash: transactionHash,
          blockNumber: 0,
          chainId: 7777777, // Zora Network
          type: 'ZRM_DEPOSIT', // Real deposit from blockchain
          from: adminAddress.toLowerCase(),
          to: 'platform_treasury',
          value: amount,
          gasUsed: 0,
          gasPrice: 0
        }
      })

      // Update platform stats
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      await prisma.platformStats.upsert({
        where: { date: today },
        create: {
          date: today,
          zrmTreasury: amount,
          zrmTotalSupply: amount
        },
        update: {
          zrmTreasury: {
            increment: amount
          },
          zrmTotalSupply: {
            increment: amount
          }
        }
      })

      logger.info('ZRM deposited to treasury:', { 
        admin: adminAddress, 
        amount, 
        transactionHash 
      })

      res.json({
        success: true,
        message: 'ZRM deposited to platform treasury successfully',
        deposit: {
          amount,
          transactionHash,
          depositedBy: adminAddress
        }
      })

    } catch (error) {
      next(error)
    }
  }

  // Withdraw funds (ETH or ZRM)
  withdraw = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const currentUser = req.user
      const adminAddress = req.headers['x-admin-address'] as string
      const { type, amount, recipientAddress } = req.body

      if (!currentUser || !adminAddress) {
        throw new ForbiddenError('Authentication required')
      }

      if (!this.isAdmin(adminAddress)) {
        throw new ForbiddenError('Admin access required')
      }

      if (!type || !amount || !recipientAddress) {
        throw new ValidationError('Type, amount, and recipient address are required')
      }

      if (!['ETH', 'ZRM'].includes(type)) {
        throw new ValidationError('Type must be ETH or ZRM')
      }

      if (!isValidEthereumAddress(recipientAddress)) {
        throw new ValidationError('Invalid recipient address')
      }

      if (amount <= 0) {
        throw new ValidationError('Amount must be positive')
      }

      // Create withdrawal transaction record
      const withdrawalHash = `admin_withdrawal_${type}_${Date.now()}`
      
      await prisma.transaction.create({
        data: {
          hash: withdrawalHash,
          blockNumber: 0,
          chainId: 8453,
          type: 'FEE_COLLECTION',
          from: 'platform_treasury',
          to: recipientAddress.toLowerCase(),
          value: amount,
          gasUsed: 0,
          gasPrice: 0
        }
      })

      // TODO: Implement actual blockchain withdrawal logic here
      // This would involve calling smart contract functions to transfer funds

      logger.info('Withdrawal executed:', { 
        admin: adminAddress, 
        type, 
        amount, 
        recipient: recipientAddress 
      })

      res.json({
        success: true,
        message: `${type} withdrawal executed successfully`,
        withdrawal: {
          type,
          amount,
          recipient: recipientAddress,
          transactionHash: withdrawalHash,
          executedBy: adminAddress
        }
      })

    } catch (error) {
      next(error)
    }
  }

  // Get platform users (for admin management)
  getUsers = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const currentUser = req.user
      const adminAddress = req.headers['x-admin-address'] as string
      const { page = 1, limit = 50, search, verified, earlyBird } = req.query

      if (!currentUser || !adminAddress) {
        throw new ForbiddenError('Authentication required')
      }

      if (!this.isAdmin(adminAddress)) {
        throw new ForbiddenError('Admin access required')
      }

      const offset = (Number(page) - 1) * Number(limit)

      // Build where clause
      const whereClause: any = {}

      if (search) {
        whereClause.OR = [
          { address: { contains: search as string, mode: 'insensitive' } },
          { username: { contains: search as string, mode: 'insensitive' } },
          { displayName: { contains: search as string, mode: 'insensitive' } },
          { email: { contains: search as string, mode: 'insensitive' } }
        ]
      }

      if (verified === 'true') {
        whereClause.isVerified = true
      }

      if (earlyBird === 'true') {
        whereClause.isEarlyBird = true
      }

      const [users, total] = await Promise.all([
        prisma.user.findMany({
          where: whereClause,
          skip: offset,
          take: Number(limit),
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            address: true,
            email: true,
            username: true,
            displayName: true,
            bio: true,
            avatar: true,
            zrmBalance: true,
            isVerified: true,
            isEarlyBird: true,
            earlyBirdNumber: true,
            createdAt: true,
            lastActiveAt: true,
            _count: {
              select: {
                createdNFTs: true,
                ownedNFTs: true,
                collections: true
              }
            }
          }
        }),
        prisma.user.count({ where: whereClause })
      ])

      res.json({
        success: true,
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

  // Update user verification status
  updateUserVerification = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const currentUser = req.user
      const adminAddress = req.headers['x-admin-address'] as string
      const { userId } = req.params
      const { isVerified } = req.body

      if (!currentUser || !adminAddress) {
        throw new ForbiddenError('Authentication required')
      }

      if (!this.isAdmin(adminAddress)) {
        throw new ForbiddenError('Admin access required')
      }

      const user = await prisma.user.update({
        where: { id: userId },
        data: { isVerified: Boolean(isVerified) }
      })

      // Create notification for user
      try {
        await prisma.notification.create({
          data: {
            userId: user.id,
            type: 'EMAIL_VERIFICATION',
            title: isVerified ? 'Account Verified' : 'Verification Removed',
            message: isVerified 
              ? 'Your account has been verified by the platform admin.'
              : 'Your account verification has been removed by the platform admin.',
            data: {
              isVerified,
              verifiedBy: adminAddress
            }
          }
        })
      } catch (notificationError) {
        logger.warn('Failed to create verification notification:', notificationError)
      }

      res.json({
        success: true,
        message: `User verification ${isVerified ? 'granted' : 'removed'} successfully`,
        user: {
          id: user.id,
          address: user.address,
          isVerified: user.isVerified
        }
      })

    } catch (error) {
      next(error)
    }
  }

  // Clean up incorrect ZRM data (one-time admin operation)
  cleanZRMData = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const adminAddress = req.headers['x-admin-address'] as string

      if (!adminAddress) {
        throw new ForbiddenError('Admin address required in x-admin-address header')
      }

      if (!this.isAdmin(adminAddress)) {
        throw new ForbiddenError('Admin access required - invalid admin address')
      }

      // Delete all old platform stats (they contain wrong data)
      const deletedStats = await prisma.platformStats.deleteMany({})
      
      // Delete all old ZRM transactions that were created without real blockchain verification
      const deletedTransactions = await prisma.transaction.deleteMany({
        where: {
          type: {
            in: ['ZRM_ALLOCATION', 'ZRM_DEPOSIT']
          },
          // Only delete transactions with fake/test hashes
          hash: {
            startsWith: 'admin_'
          }
        }
      })

      logger.info('ZRM data cleanup completed', { 
        deletedStats: deletedStats.count,
        deletedTransactions: deletedTransactions.count,
        cleanedBy: adminAddress 
      })

      res.json({
        success: true,
        message: 'ZRM data cleaned successfully',
        cleanup: {
          deletedStats: deletedStats.count,
          deletedTransactions: deletedTransactions.count
        }
      })

    } catch (error) {
      next(error)
    }
  }
}

export const adminController = new AdminController()