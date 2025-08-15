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

// Import services
import { logger } from './utils/logger'
import { initDatabase, checkDatabaseHealth } from './config/db'
import { connectRedis } from './config/redis'

// Load environment variables
dotenv.config()

const app = express()
const PORT = process.env.PORT || 3001

// Global database status
let isDatabaseConnected = false

// Middleware
app.use(helmet())
app.use(cors(corsConfig))
app.use(compression())
app.use(morgan('combined', { stream: { write: (message) => logger.info(message.trim()) } }))
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

// Rate limiting
app.use(rateLimiter)

// Health check endpoint
app.get('/health', async (req, res) => {
  const dbHealth = isDatabaseConnected ? await checkDatabaseHealth() : { status: 'disabled' }
  
  res.status(200).json({
    status: 'OK',
    message: 'Zorium Backend API is running',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    version: '1.0.0',
    database: dbHealth,
    features: {
      database: isDatabaseConnected,
      redis: false, // TODO: implement Redis health check
      auth: true,
      nfts: isDatabaseConnected,
      analytics: isDatabaseConnected
    }
  })
})

// API routes
app.use('/api/auth', authRoutes)
app.use('/api/users', userRoutes)
app.use('/api/nfts', nftRoutes)
app.use('/api/collections', collectionRoutes)
app.use('/api/analytics', analyticsRoutes)
app.use('/api/search', searchRoutes)

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.originalUrl} not found`,
    timestamp: new Date().toISOString(),
    availableEndpoints: [
      'GET /health',
      'GET /api/analytics/stats',
      'GET /api/nfts',
      'GET /api/nfts/trending',
      'GET /api/users',
      'GET /api/search',
      'POST /api/auth/register',
      'POST /api/auth/login'
    ]
  })
})

// Error handling middleware (must be last)
app.use(errorHandler)

// Initialize services
async function initializeServices() {
  try {
    // Try to connect to database
    isDatabaseConnected = await initDatabase()
    
    if (isDatabaseConnected) {
      logger.info('Database initialized successfully')
    } else {
      logger.warn('Running without database connection')
    }
    
    // TODO: Try to connect to Redis
    // try {
    //   await connectRedis()
    //   logger.info('Redis connected successfully')
    // } catch (error) {
    //   logger.warn('Running without Redis connection')
    // }
    
    return true
  } catch (error) {
    logger.error('Service initialization failed:', error)
    return false
  }
}

// Graceful shutdown
process.on('SIGTERM', gracefulShutdown)
process.on('SIGINT', gracefulShutdown)

function gracefulShutdown(signal: string) {
  logger.info(`Received ${signal}. Starting graceful shutdown...`)
  
  // Close server
  if (global.server) {
    global.server.close(() => {
      logger.info('HTTP server closed.')
      process.exit(0)
    })
  } else {
    process.exit(0)
  }
  
  // Force close after 30 seconds
  setTimeout(() => {
    logger.error('Could not close connections in time, forcefully shutting down')
    process.exit(1)
  }, 30000)
}

// Start server
async function startServer() {
  try {
    // Initialize services (database, redis, etc.)
    await initializeServices()
    
    // Start HTTP server
    const server = app.listen(PORT, () => {
      logger.info(`Server running on port ${PORT}`)
      logger.info(`Environment: ${process.env.NODE_ENV}`)
      logger.info(`Health check: http://localhost:${PORT}/health`)
      logger.info(`Database: ${isDatabaseConnected ? 'Connected' : 'Disabled'}`)
    })
    
    global.server = server
    return server
  } catch (error) {
    logger.error('Failed to start server:', error)
    process.exit(1)
  }
}

// Export for testing and Vercel
export default app

// Start server if not in test environment
if (process.env.NODE_ENV !== 'test') {
  startServer()
}

declare global {
  var server: any
}