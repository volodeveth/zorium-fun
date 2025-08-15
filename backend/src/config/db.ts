import { PrismaClient } from '@prisma/client'
import { logger } from '../utils/logger'

declare global {
  var __prisma: PrismaClient | undefined
}

let prisma: PrismaClient

if (process.env.NODE_ENV === 'production') {
  prisma = new PrismaClient({
    log: ['error'],
  })
} else {
  if (!global.__prisma) {
    global.__prisma = new PrismaClient({
      log: ['query', 'info', 'warn', 'error'],
    })
  }
  prisma = global.__prisma
}

export { prisma }

export async function connectDatabase() {
  try {
    // Check if DATABASE_URL is available
    if (!process.env.DATABASE_URL) {
      logger.warn('DATABASE_URL not found, running without database')
      return false
    }

    await prisma.$connect()
    
    // Test connection with a simple query
    await prisma.$queryRaw`SELECT 1 as test`
    
    logger.info('Database connected successfully')
    return true
  } catch (error) {
    logger.error('Database connection failed:', error)
    logger.warn('Running without database connection')
    return false
  }
}

export async function disconnectDatabase() {
  try {
    await prisma.$disconnect()
    logger.info('Database disconnected')
  } catch (error) {
    logger.error('Database disconnection failed:', error)
    throw error
  }
}

// Database health check
export async function checkDatabaseHealth() {
  try {
    await prisma.$queryRaw`SELECT 1`
    return { status: 'healthy', timestamp: new Date().toISOString() }
  } catch (error) {
    logger.error('Database health check failed:', error)
    return { status: 'unhealthy', error: error.message, timestamp: new Date().toISOString() }
  }
}

// Initialize database connection for serverless
export async function initDatabase() {
  if (!process.env.DATABASE_URL) {
    logger.warn('No DATABASE_URL found, skipping database initialization')
    return false
  }

  try {
    await connectDatabase()
    return true
  } catch (error) {
    logger.error('Database initialization failed:', error)
    return false
  }
}