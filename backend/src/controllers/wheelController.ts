import { Request, Response, NextFunction } from 'express'
import { prisma } from '../config/database'
import { ValidationError, NotFoundError } from '../middleware/errorHandler'
import { logger } from '../utils/logger'
import { 
  canUserSpinWheel, 
  getWheelCooldownTime, 
  getUserAllocatedBalance,
  verifySignature,
  getNonce,
  consumeNonce,
  isValidEthereumAddress
} from '../utils/web3'

class WheelController {
  // Get wheel status for user
  getWheelStatus = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { address } = req.params

      if (!isValidEthereumAddress(address)) {
        throw new ValidationError('Invalid Ethereum address')
      }

      // Get wheel status from blockchain
      const [canSpin, cooldownTime, allocatedBalance] = await Promise.all([
        canUserSpinWheel(address),
        getWheelCooldownTime(address),
        getUserAllocatedBalance(address)
      ])

      // Calculate cooldown expiry time
      const cooldownExpires = cooldownTime > 0 
        ? new Date(Date.now() + cooldownTime * 1000).toISOString()
        : null

      res.json({
        success: true,
        address: address.toLowerCase(),
        wheel: {
          canSpin,
          cooldownTime,
          cooldownExpires
        },
        currentBalance: {
          allocated: allocatedBalance
        },
        blockchainVerified: true
      })

    } catch (error) {
      logger.error('Failed to get wheel status:', error)
      next(error)
    }
  }

  // Spin wheel (this endpoint prepares for blockchain transaction)
  spinWheel = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { address } = req.params
      const { signature, nonce } = req.body
      const currentUser = req.user

      if (!currentUser) {
        throw new ValidationError('User not authenticated')
      }

      if (currentUser.address.toLowerCase() !== address.toLowerCase()) {
        throw new ValidationError('Address mismatch with authenticated user')
      }

      // Verify signature and nonce
      const storedNonce = getNonce(address)
      if (!storedNonce || storedNonce !== nonce) {
        throw new ValidationError('Invalid or expired nonce')
      }

      const isValidSignature = await verifySignature(address, signature, nonce)
      if (!isValidSignature) {
        throw new ValidationError('Invalid signature')
      }

      // Consume nonce to prevent replay attacks
      consumeNonce(address)

      // Check if user can spin wheel on blockchain
      const canSpin = await canUserSpinWheel(address)
      if (!canSpin) {
        throw new ValidationError('Cannot spin wheel: cooldown not finished or insufficient treasury')
      }

      // Return success - frontend should now call smart contract
      res.json({
        success: true,
        message: 'Wheel spin authorized - proceed with smart contract transaction',
        canProceed: true,
        instructions: {
          contractAddress: process.env.ZRM_CONTRACT_ADDRESS || '0x79127d3cB558E2fd765858759b144833FBb09837',
          method: 'spinWheel',
          estimatedReward: '100', // Default daily reward
          chainId: 7777777 // Zora Network
        }
      })

    } catch (error) {
      logger.error('Failed to authorize wheel spin:', error)
      next(error)
    }
  }

  // Verify wheel spin transaction after it's completed on blockchain
  verifyWheelSpin = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { address } = req.params
      const { transactionHash, expectedReward } = req.body

      if (!isValidEthereumAddress(address)) {
        throw new ValidationError('Invalid Ethereum address')
      }

      // Import verification function
      const { verifyTransaction } = await import('../utils/web3')
      
      // Verify transaction exists and was successful
      const verification = await verifyTransaction(transactionHash)
      
      if (!verification.exists || !verification.receipt) {
        throw new ValidationError('Transaction not found or not confirmed')
      }

      if (verification.receipt.status !== 1) {
        throw new ValidationError('Transaction failed')
      }

      // Check if transaction was sent from the correct address
      if (verification.transaction.from.toLowerCase() !== address.toLowerCase()) {
        throw new ValidationError('Transaction sender does not match user address')
      }

      // Parse logs to find WheelSpun event
      const { platformContract } = await import('../utils/web3')
      
      const wheelEvent = verification.receipt.logs.find((log: any) => {
        try {
          const parsedLog = platformContract.interface.parseLog(log)
          return parsedLog.name === 'WheelSpun'
        } catch {
          return false
        }
      })

      if (!wheelEvent) {
        throw new ValidationError('No WheelSpun event found in transaction')
      }

      const parsedEvent = platformContract.interface.parseLog(wheelEvent)
      const actualReward = parsedEvent.args.reward.toString()
      const eventUser = parsedEvent.args.user.toLowerCase()

      // Verify event data
      if (eventUser !== address.toLowerCase()) {
        throw new ValidationError('Wheel spin user does not match request')
      }

      // Check if transaction already recorded
      const existingTx = await prisma.transaction.findUnique({
        where: { hash: transactionHash }
      })

      if (existingTx) {
        return res.json({
          success: true,
          message: 'Wheel spin already recorded',
          reward: actualReward,
          alreadyRecorded: true
        })
      }

      // Find or create user
      let user = await prisma.user.findUnique({
        where: { address: address.toLowerCase() }
      })

      if (!user) {
        user = await prisma.user.create({
          data: {
            address: address.toLowerCase(),
            zrmBalance: parseFloat(actualReward)
          }
        })
      } else {
        // Update user balance
        user = await prisma.user.update({
          where: { id: user.id },
          data: {
            zrmBalance: {
              increment: parseFloat(actualReward)
            }
          }
        })
      }

      // Record transaction
      await prisma.transaction.create({
        data: {
          hash: transactionHash,
          blockNumber: verification.receipt.blockNumber || 0,
          chainId: 7777777, // Zora Network
          type: 'WHEEL_REWARD',
          from: 'platform_treasury',
          to: address.toLowerCase(),
          value: parseFloat(actualReward),
          gasUsed: parseInt(verification.receipt.gasUsed?.toString() || '0'),
          gasPrice: parseInt(verification.transaction.gasPrice?.toString() || '0'),
          userId: user.id
        }
      })

      // Create notification
      await prisma.notification.create({
        data: {
          userId: user.id,
          type: 'WHEEL_REWARD',
          title: 'Wheel Reward!',
          message: `Congratulations! You spun the wheel and received ${actualReward} ZRM tokens!`,
          data: {
            reward: parseFloat(actualReward),
            transactionHash,
            blockchainVerified: true
          }
        }
      })

      logger.info('Wheel spin transaction verified and recorded', {
        address,
        transactionHash,
        reward: actualReward
      })

      res.json({
        success: true,
        message: 'Wheel spin verified and recorded successfully',
        reward: actualReward,
        transactionHash,
        newBalance: user.zrmBalance?.toString()
      })

    } catch (error) {
      logger.error('Failed to verify wheel spin:', error)
      next(error)
    }
  }
}

export const wheelController = new WheelController()