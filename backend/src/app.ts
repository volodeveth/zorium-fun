import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import compression from 'compression'
import dotenv from 'dotenv'

// Import middleware
import { errorHandler } from './middleware/errorHandler'
import { rateLimiter } from './middleware/rateLimiter'
import { corsConfig } from './middleware/cors'

// Import routes
import authRoutes from './routes/auth'
import userRoutes from './routes/users'
import nftRoutes from './routes/nfts'
import collectionRoutes from './routes/collections'
import analyticsRoutes from './routes/analytics'
import searchRoutes from './routes/search'
import uploadRoutes from './routes/upload'
import commentRoutes from './routes/comments'
import adminRoutes from './routes/admin'
import emailRoutes from './routes/email'
import wheelRoutes from './routes/wheel'
import metadataRoutes from './routes/metadata'

// Import services
import { logger } from './utils/logger'
import { setupZRMEventListeners, ZRMEventHandlers } from './utils/web3'
import { connectDatabase } from './config/database'
// import { connectRedis } from './config/redis'

// Load environment variables
dotenv.config()

const app = express()
const PORT = process.env.PORT || 3001

// Middleware
app.use(helmet())
app.use(cors(corsConfig))
app.use(compression())
app.use(morgan('combined', { stream: { write: (message) => logger.info(message.trim()) } }))
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

// Rate limiting
app.use(rateLimiter)

// Serve uploaded files statically
app.use('/uploads', express.static(process.env.UPLOAD_PATH || './uploads'))

// Health check endpoint
app.get('/health', (req, res) => {
  try {
    logger.info('Health check requested')
    res.status(200).json({
      status: 'OK',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV,
      database: process.env.DATABASE_URL ? 'configured' : 'missing',
      vercel: !!process.env.VERCEL
    })
  } catch (error) {
    logger.error('Health check failed:', error)
    res.status(500).json({
      status: 'ERROR',
      error: error.message,
      timestamp: new Date().toISOString()
    })
  }
})

// API routes with v1 prefix
app.use('/api/v1/auth', authRoutes)
app.use('/api/v1/users', userRoutes)
app.use('/api/v1/nfts', nftRoutes)
app.use('/api/v1/collections', collectionRoutes)
app.use('/api/v1/analytics', analyticsRoutes)
app.use('/api/v1/search', searchRoutes)
app.use('/api/v1/upload', uploadRoutes)
app.use('/api/v1/comments', commentRoutes)
app.use('/api/v1/email', emailRoutes)
app.use('/api/v1/wheel', wheelRoutes)
app.use('/api/v1/metadata', metadataRoutes)

// Additional routes expected by frontend
app.use('/api/v1/zrm', userRoutes) // ZRM balance will be handled by user routes for now
app.use('/api/v1/admin', adminRoutes) // Admin endpoints

// Legacy API routes (without v1 prefix for backward compatibility)
app.use('/api/auth', authRoutes)
app.use('/api/users', userRoutes)
app.use('/api/nfts', nftRoutes)
app.use('/api/collections', collectionRoutes)
app.use('/api/analytics', analyticsRoutes)
app.use('/api/search', searchRoutes)
app.use('/api/upload', uploadRoutes)
app.use('/api/comments', commentRoutes)
app.use('/api/email', emailRoutes)
app.use('/api/wheel', wheelRoutes)
app.use('/api/metadata', metadataRoutes)
app.use('/api/zrm', userRoutes) 
app.use('/api/admin', adminRoutes)

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.originalUrl} not found`,
    timestamp: new Date().toISOString()
  })
})

// Error handling middleware (must be last)
app.use(errorHandler)

// Graceful shutdown
process.on('SIGTERM', gracefulShutdown)
process.on('SIGINT', gracefulShutdown)

function gracefulShutdown(signal: string) {
  logger.info(`Received ${signal}. Starting graceful shutdown...`)
  
  // Close server
  server.close(() => {
    logger.info('HTTP server closed.')
    
    // Close database connections
    // Additional cleanup can be added here
    
    process.exit(0)
  })
  
  // Force close after 30 seconds
  setTimeout(() => {
    logger.error('Could not close connections in time, forcefully shutting down')
    process.exit(1)
  }, 30000)
}

// ZRM Blockchain Event Handlers
const zrmEventHandlers: ZRMEventHandlers = {
  onTreasuryDeposit: async (admin: string, amount: string) => {
    logger.info(`Admin ${admin} deposited ${amount} ZRM to treasury`)
  },

  onUserAllocation: async (user: string, amount: string, reason: string) => {
    logger.info(`${amount} ZRM allocated to ${user} - Reason: ${reason}`)
    
    try {
      const { prisma } = await import('./config/database')
      let userRecord = await prisma.user.findUnique({
        where: { address: user.toLowerCase() }
      })

      if (!userRecord) {
        userRecord = await prisma.user.create({
          data: {
            address: user.toLowerCase(),
            zrmBalance: parseFloat(amount)
          }
        })
      } else {
        userRecord = await prisma.user.update({
          where: { id: userRecord.id },
          data: {
            zrmBalance: { increment: parseFloat(amount) }
          }
        })
      }

      await prisma.notification.create({
        data: {
          userId: userRecord.id,
          type: 'ZRM_ALLOCATION',
          title: 'ZRM Tokens Allocated',
          message: `You have received ${amount} ZRM tokens. Reason: ${reason}`,
          data: {
            amount: parseFloat(amount),
            reason,
            blockchainVerified: true
          }
        }
      })

      logger.info(`Database updated for ZRM allocation to ${user}`)
    } catch (error) {
      logger.error(`Failed to update database for ZRM allocation:`, error)
    }
  },

  onPromotionSpent: async (user: string, amount: string) => {
    logger.info(`User ${user} spent ${amount} ZRM on promotion`)
    
    try {
      const { prisma } = await import('./config/database')
      const userData = await prisma.user.findUnique({
        where: { address: user.toLowerCase() }
      })

      if (userData) {
        await prisma.transaction.create({
          data: {
            hash: `blockchain_promotion_${Date.now()}_${user}`,
            blockNumber: 0,
            chainId: 7777777,
            type: 'PROMOTION_PAYMENT',
            from: user.toLowerCase(),
            to: 'platform_treasury',
            value: parseFloat(amount),
            gasUsed: 0,
            gasPrice: 0,
            userId: userData.id
          }
        })
      }
    } catch (error) {
      logger.error(`Failed to record promotion payment:`, error)
    }
  },

  onWheelSpun: async (user: string, reward: string) => {
    logger.info(`User ${user} spun wheel and received ${reward} ZRM`)
    
    try {
      const { prisma } = await import('./config/database')
      let userData = await prisma.user.findUnique({
        where: { address: user.toLowerCase() }
      })

      if (!userData) {
        userData = await prisma.user.create({
          data: {
            address: user.toLowerCase(),
            zrmBalance: parseFloat(reward)
          }
        })
      } else {
        userData = await prisma.user.update({
          where: { id: userData.id },
          data: {
            zrmBalance: { increment: parseFloat(reward) }
          }
        })
      }

      await prisma.notification.create({
        data: {
          userId: userData.id,
          type: 'WHEEL_REWARD',
          title: 'Wheel Reward!',
          message: `You spun the wheel and received ${reward} ZRM tokens!`,
          data: {
            reward: parseFloat(reward),
            blockchainVerified: true
          }
        }
      })
    } catch (error) {
      logger.error(`Failed to record wheel reward:`, error)
    }
  },

  onFeesWithdrawn: async (admin: string, amount: string, to: string) => {
    logger.info(`Admin ${admin} withdrew ${amount} ZRM fees`)
  }
}

// Start server
async function startServer() {
  try {
    // Connect to database
    const { connectDatabase } = await import('./config/database')
    await connectDatabase()
    logger.info('Database connected successfully')
    
    // Connect to Redis (optional)
    try {
      const { connectRedis } = await import('./config/redis')
      await connectRedis()
      logger.info('Redis connected successfully')
    } catch (error) {
      logger.warn('Redis connection failed (optional):', error)
    }

    // Set up blockchain event listeners
    try {
      setupZRMEventListeners(zrmEventHandlers)
      logger.info('ZRM blockchain event listeners started successfully')
    } catch (error) {
      logger.error('Failed to set up blockchain event listeners:', error)
      // Don't exit, continue without blockchain listeners
    }
    
    // Start HTTP server
    const server = app.listen(PORT, () => {
      logger.info(`=� Server running on port ${PORT}`)
      logger.info(`< Environment: ${process.env.NODE_ENV}`)
      logger.info(`=� Health check: http://localhost:${PORT}/health`)
    })
    
    return server
  } catch (error) {
    logger.error('Failed to start server:', error)
    process.exit(1)
  }
}

// Export for testing
export default app

declare global {
  var server: any
}

// Initialize for Vercel environment (async initialization)
if (process.env.VERCEL) {
  (async () => {
    try {
      logger.info('Starting Vercel initialization...')
      
      // Connect to database
      logger.info('Attempting database connection...')
      const { connectDatabase } = await import('./config/database')
      await connectDatabase()
      logger.info('Database connected successfully for Vercel')
      
      // Connect to Redis (optional)
      try {
        logger.info('Attempting Redis connection...')
        const { connectRedis } = await import('./config/redis')
        await connectRedis()
        logger.info('Redis connected successfully for Vercel')
      } catch (error) {
        logger.warn('Redis connection failed (optional):', error)
      }
      
      // Set up blockchain event listeners
      try {
        logger.info('Setting up blockchain event listeners...')
        setupZRMEventListeners(zrmEventHandlers)
        logger.info('ZRM blockchain event listeners started successfully for Vercel')
      } catch (error) {
        logger.error('Failed to set up blockchain event listeners:', error)
        // Don't exit, continue without blockchain listeners
      }
      
      logger.info('Vercel initialization completed successfully')
    } catch (error) {
      logger.error('Failed to initialize for Vercel:', error)
      logger.error('Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      })
      // Don't exit in Vercel, just log the error
    }
  })()
}

// Only start server in local development
if (!process.env.VERCEL && process.env.NODE_ENV !== 'test') {
  startServer().then((server) => {
    global.server = server
  })
}