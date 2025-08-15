#!/usr/bin/env ts-node

import { config } from 'dotenv'
import { existsSync } from 'fs'

// Load environment variables based on NODE_ENV BEFORE importing emailService
const env = process.env.NODE_ENV || 'development'
const envFile = env === 'production' ? '.env.production' : '.env'

if (existsSync(envFile)) {
  config({ path: envFile })
  console.log(`📄 Loaded environment from: ${envFile}`)
} else {
  console.log(`⚠️  Environment file not found: ${envFile}`)
  config() // Fallback to default .env
}

// Import emailService AFTER loading environment variables
import emailService from '../src/services/emailService'

async function testEmailFunctionality() {
  console.log('🧪 Testing Zorium Email Service')
  console.log('=' .repeat(50))

  // Test 1: Check configuration
  console.log('\n📋 1. Checking Email Configuration...')
  console.log({
    SMTP_HOST: process.env.SMTP_HOST || 'NOT SET',
    SMTP_PORT: process.env.SMTP_PORT || 'NOT SET',
    SMTP_SECURE: process.env.SMTP_SECURE || 'NOT SET',
    SMTP_USER: process.env.SMTP_USER ? '✅ SET' : '❌ NOT SET',
    SMTP_PASS: process.env.SMTP_PASS ? '✅ SET' : '❌ NOT SET',
    FROM_EMAIL: process.env.FROM_EMAIL || 'NOT SET',
    FROM_NAME: process.env.FROM_NAME || 'Zorium',
    FRONTEND_URL: process.env.FRONTEND_URL || 'NOT SET'
  })

  // Test 2: Test SMTP connection
  console.log('\n🔌 2. Testing SMTP Connection...')
  try {
    const connectionResult = await emailService.testConnection()
    
    if (connectionResult.success) {
      console.log('✅ SMTP Connection: SUCCESS')
    } else {
      console.log('❌ SMTP Connection: FAILED')
      console.log('Error:', connectionResult.error)
      
      if (!connectionResult.configured) {
        console.log('💡 Please check your SMTP environment variables')
        return
      }
    }
  } catch (error) {
    console.error('❌ SMTP Connection Test Error:', error)
    return
  }

  // Test 3: Test token generation
  console.log('\n🔑 3. Testing Token Generation...')
  try {
    const token1 = emailService.generateVerificationToken()
    const token2 = emailService.generateVerificationToken()
    
    console.log('Token 1:', token1)
    console.log('Token 2:', token2)
    console.log('✅ Tokens are unique:', token1 !== token2)
    console.log('✅ Token length correct:', token1.length === 64)
  } catch (error) {
    console.error('❌ Token Generation Error:', error)
  }

  // Test 4: Test verification email
  console.log('\n📧 4. Testing Verification Email...')
  const testEmail = process.argv[2] || 'test@example.com'
  const testUsername = process.argv[3] || 'TestUser'
  
  try {
    const token = emailService.generateVerificationToken()
    const result = await emailService.sendEmailVerification(testEmail, token, testUsername)
    
    if (result) {
      console.log(`✅ Verification email sent to: ${testEmail}`)
      console.log(`📋 Verification token: ${token}`)
      console.log(`🔗 Verification URL: ${process.env.FRONTEND_URL}/verify-email?token=${token}`)
    } else {
      console.log(`❌ Failed to send verification email to: ${testEmail}`)
    }
  } catch (error) {
    console.error('❌ Verification Email Error:', error)
  }

  // Test 5: Test welcome email
  console.log('\n🎉 5. Testing Welcome Email...')
  try {
    const result = await emailService.sendWelcomeEmail(testEmail, testUsername)
    
    if (result) {
      console.log(`✅ Welcome email sent to: ${testEmail}`)
    } else {
      console.log(`❌ Failed to send welcome email to: ${testEmail}`)
    }
  } catch (error) {
    console.error('❌ Welcome Email Error:', error)
  }

  // Test 6: Performance test
  console.log('\n⚡ 6. Testing Email Performance...')
  try {
    const startTime = Date.now()
    const testPromises = []
    
    for (let i = 0; i < 3; i++) {
      testPromises.push(
        emailService.sendEmailVerification(
          `test${i}@example.com`,
          emailService.generateVerificationToken(),
          `TestUser${i}`
        )
      )
    }
    
    const results = await Promise.all(testPromises)
    const endTime = Date.now()
    const duration = endTime - startTime
    
    console.log(`✅ Sent ${results.filter(r => r).length}/${results.length} emails`)
    console.log(`⏱️ Total time: ${duration}ms (avg: ${Math.round(duration / results.length)}ms per email)`)
  } catch (error) {
    console.error('❌ Performance Test Error:', error)
  }

  console.log('\n✨ Email Testing Complete!')
  console.log('=' .repeat(50))
}

// Error handling for the script
async function main() {
  try {
    await testEmailFunctionality()
  } catch (error) {
    console.error('💥 Script Error:', error)
    process.exit(1)
  }
}

// Run if called directly
if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('💥 Unhandled Error:', error)
      process.exit(1)
    })
}

export default testEmailFunctionality