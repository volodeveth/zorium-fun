// Simple database connection test
const { PrismaClient } = require('@prisma/client')

async function testDatabase() {
  console.log('🧪 Testing database connection...')
  
  if (!process.env.DATABASE_URL) {
    console.log('❌ DATABASE_URL not found in environment variables')
    console.log('Available env vars:', Object.keys(process.env).filter(key => key.includes('DATA')))
    return
  }
  
  console.log('✅ DATABASE_URL found')
  console.log('Connection string:', process.env.DATABASE_URL.replace(/\/\/.*@/, '//***:***@'))
  
  const prisma = new PrismaClient()
  
  try {
    // Test basic connection
    await prisma.$connect()
    console.log('✅ Database connection successful')
    
    // Test query
    const result = await prisma.$queryRaw`SELECT 1 as test`
    console.log('✅ Database query successful:', result)
    
    // Check if tables exist
    try {
      const userCount = await prisma.user.count()
      console.log(`✅ Users table exists with ${userCount} records`)
    } catch (error) {
      console.log('⚠️ Users table does not exist or schema not applied')
      console.log('Run: npx prisma db push')
    }
    
  } catch (error) {
    console.log('❌ Database connection failed:')
    console.log(error.message)
  } finally {
    await prisma.$disconnect()
    console.log('🔌 Database disconnected')
  }
}

testDatabase().catch(console.error)