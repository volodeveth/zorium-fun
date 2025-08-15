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
    await prisma.$connect()
    logger.info(' Database connected successfully')
  } catch (error) {
    logger.error('L Database connection failed:', error)
    throw error
  }
}

export async function disconnectDatabase() {
  try {
    await prisma.$disconnect()
    logger.info('= Database disconnected')
  } catch (error) {
    logger.error('L Database disconnection failed:', error)
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