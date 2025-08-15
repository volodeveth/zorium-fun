import Redis from 'ioredis'
import { logger } from '../utils/logger'

let redis: Redis

export function createRedisClient() {
  const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379'
  
  redis = new Redis(redisUrl, {
    maxRetriesPerRequest: 3,
    lazyConnect: true,
    keepAlive: 30000,
    connectTimeout: 10000,
    commandTimeout: 5000
  })
  
  redis.on('connect', () => {
    logger.info(' Redis connected successfully')
  })
  
  redis.on('ready', () => {
    logger.info('=� Redis ready to accept commands')
  })
  
  redis.on('error', (error) => {
    logger.error('L Redis connection error:', error)
  })
  
  redis.on('close', () => {
    logger.warn('= Redis connection closed')
  })
  
  redis.on('reconnecting', () => {
    logger.info('= Redis reconnecting...')
  })
  
  return redis
}

export async function connectRedis() {
  try {
    if (!redis) {
      redis = createRedisClient()
    }
    
    await redis.connect()
    logger.info(' Redis connected and ready')
    return redis
  } catch (error) {
    logger.error('L Redis connection failed:', error)
    throw error
  }
}

export function getRedisClient(): Redis {
  if (!redis) {
    throw new Error('Redis client not initialized. Call connectRedis() first.')
  }
  return redis
}

export async function disconnectRedis() {
  try {
    if (redis) {
      await redis.quit()
      logger.info('= Redis disconnected')
    }
  } catch (error) {
    logger.error('L Redis disconnection failed:', error)
    throw error
  }
}

// Cache helper functions
export const cache = {
  async get(key: string) {
    try {
      const result = await redis.get(key)
      return result ? JSON.parse(result) : null
    } catch (error) {
      logger.error(`Cache get error for key ${key}:`, error)
      return null
    }
  },
  
  async set(key: string, value: any, ttl: number = 3600) {
    try {
      await redis.setex(key, ttl, JSON.stringify(value))
      return true
    } catch (error) {
      logger.error(`Cache set error for key ${key}:`, error)
      return false
    }
  },
  
  async del(key: string) {
    try {
      await redis.del(key)
      return true
    } catch (error) {
      logger.error(`Cache delete error for key ${key}:`, error)
      return false
    }
  },
  
  async exists(key: string) {
    try {
      const result = await redis.exists(key)
      return result === 1
    } catch (error) {
      logger.error(`Cache exists error for key ${key}:`, error)
      return false
    }
  }
}

export { redis }