import { prisma } from '../src/config/database'
import { connectRedis, disconnectRedis } from '../src/config/redis'

// Setup test environment
beforeAll(async () => {
  // Set test environment
  process.env.NODE_ENV = 'test'
  process.env.DATABASE_URL = process.env.TEST_DATABASE_URL || 'postgresql://test:test@localhost:5432/zorium_test'
  
  try {
    // Connect to test database
    await prisma.$connect()
    console.log('Test database connected')
    
    // Connect to Redis
    await connectRedis()
    console.log('Test Redis connected')
    
  } catch (error) {
    console.error('Test setup failed:', error)
    process.exit(1)
  }
})

// Cleanup after all tests
afterAll(async () => {
  try {
    // Clean up database
    await prisma.$executeRaw`TRUNCATE TABLE "users", "nfts", "collections", "transactions", "promotions", "notifications", "comments", "likes", "follows", "early_bird_rewards", "platform_stats" RESTART IDENTITY CASCADE`
    
    // Disconnect from database
    await prisma.$disconnect()
    console.log('Test database disconnected')
    
    // Disconnect from Redis
    await disconnectRedis()
    console.log('Test Redis disconnected')
    
  } catch (error) {
    console.error('Test cleanup failed:', error)
  }
})

// Clean database before each test
beforeEach(async () => {
  try {
    // Clean all tables
    await prisma.$executeRaw`TRUNCATE TABLE "users", "nfts", "collections", "transactions", "promotions", "notifications", "comments", "likes", "follows", "early_bird_rewards", "platform_stats" RESTART IDENTITY CASCADE`
  } catch (error) {
    console.error('Database cleanup failed:', error)
  }
})