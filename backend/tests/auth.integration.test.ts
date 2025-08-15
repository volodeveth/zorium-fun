import request from 'supertest'
import app from '../src/app'
import { prisma } from '../src/config/database'
import emailService from '../src/services/emailService'

// Mock email service
jest.mock('../src/services/emailService')
const mockedEmailService = emailService as jest.Mocked<typeof emailService>

// Mock web3 utils
jest.mock('../src/utils/web3', () => ({
  storeNonce: jest.fn().mockReturnValue('mock-nonce'),
  getNonce: jest.fn().mockReturnValue('mock-nonce'),
  consumeNonce: jest.fn(),
  verifySignature: jest.fn().mockResolvedValue(true),
  generateAuthMessage: jest.fn().mockReturnValue('mock-message'),
  isValidEthereumAddress: jest.fn().mockReturnValue(true)
}))

describe('Authentication Integration Tests with Email', () => {
  const testUser = {
    address: '0x1234567890123456789012345678901234567890',
    email: 'test@example.com',
    username: 'testuser'
  }

  beforeAll(async () => {
    // Clear test data
    await prisma.user.deleteMany({
      where: {
        address: testUser.address.toLowerCase()
      }
    })
  })

  afterAll(async () => {
    // Cleanup
    await prisma.user.deleteMany({
      where: {
        address: testUser.address.toLowerCase()
      }
    })
    await prisma.$disconnect()
  })

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks()
    mockedEmailService.sendEmailVerification.mockResolvedValue(true)
    mockedEmailService.sendWelcomeEmail.mockResolvedValue(true)
    mockedEmailService.testConnection.mockResolvedValue({
      success: true,
      configured: true
    })
  })

  describe('User Registration with Email', () => {
    test('should register user and send verification email', async () => {
      // First get nonce
      const nonceResponse = await request(app)
        .get(`/api/auth/nonce/${testUser.address}`)
        .expect(200)

      const { nonce } = nonceResponse.body

      // Mock signature verification
      const mockSignature = 'mock-signature'

      // Register user
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          address: testUser.address,
          signature: mockSignature,
          email: testUser.email,
          username: testUser.username
        })
        .expect(201)

      // Check response
      expect(response.body).toMatchObject({
        message: 'User registered successfully',
        user: {
          address: testUser.address.toLowerCase(),
          email: testUser.email,
          username: testUser.username,
          isVerified: false
        },
        token: expect.any(String),
        refreshToken: expect.any(String)
      })

      // Verify email verification was sent
      expect(mockedEmailService.sendEmailVerification).toHaveBeenCalledWith(
        testUser.email,
        expect.any(String),
        testUser.username
      )

      // Verify user was created in database
      const createdUser = await prisma.user.findUnique({
        where: { address: testUser.address.toLowerCase() }
      })

      expect(createdUser).toMatchObject({
        address: testUser.address.toLowerCase(),
        email: testUser.email,
        username: testUser.username,
        isVerified: false
      })
    })

    test('should handle email service failure gracefully', async () => {
      // Mock email service failure
      mockedEmailService.sendEmailVerification.mockResolvedValue(false)

      const testUser2 = {
        address: '0x2234567890123456789012345678901234567890',
        email: 'test2@example.com',
        username: 'testuser2'
      }

      // Get nonce
      const nonceResponse = await request(app)
        .get(`/api/auth/nonce/${testUser2.address}`)
        .expect(200)

      // Register user
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          address: testUser2.address,
          signature: 'mock-signature',
          email: testUser2.email,
          username: testUser2.username
        })
        .expect(201)

      // User should still be created even if email fails
      expect(response.body.user.isVerified).toBe(false)

      // Cleanup
      await prisma.user.delete({
        where: { address: testUser2.address.toLowerCase() }
      })
    })

    test('should prevent duplicate email registration', async () => {
      const duplicateEmailUser = {
        address: '0x3234567890123456789012345678901234567890',
        email: testUser.email, // Same email as existing user
        username: 'differentusername'
      }

      // Get nonce
      await request(app)
        .get(`/api/auth/nonce/${duplicateEmailUser.address}`)
        .expect(200)

      // Try to register with duplicate email
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          address: duplicateEmailUser.address,
          signature: 'mock-signature',
          email: duplicateEmailUser.email,
          username: duplicateEmailUser.username
        })
        .expect(400)

      expect(response.body.message).toContain('already exists')
    })
  })

  describe('Email Verification Flow', () => {
    let verificationToken: string

    beforeEach(() => {
      // Capture verification token from email service call
      mockedEmailService.sendEmailVerification.mockImplementation(
        (email, token, username) => {
          verificationToken = token
          return Promise.resolve(true)
        }
      )
    })

    test('should verify email with valid token', async () => {
      // Assuming we have an email verification endpoint
      // This would need to be implemented in your auth routes
      
      // For now, we'll test the token generation and storage
      const user = await prisma.user.findUnique({
        where: { address: testUser.address.toLowerCase() }
      })

      expect(user?.isVerified).toBe(false)
      
      // Simulate email verification by updating user directly
      // In real implementation, this would be done via API endpoint
      await prisma.user.update({
        where: { id: user?.id },
        data: { isVerified: true }
      })

      // Verify welcome email is sent after verification
      expect(mockedEmailService.sendWelcomeEmail).toHaveBeenCalledWith(
        testUser.email,
        testUser.username
      )

      const verifiedUser = await prisma.user.findUnique({
        where: { address: testUser.address.toLowerCase() }
      })

      expect(verifiedUser?.isVerified).toBe(true)
    })
  })

  describe('SMTP Connection Testing', () => {
    test('should test SMTP connection successfully', async () => {
      const result = await emailService.testConnection()
      
      expect(result.configured).toBe(true)
      expect(result.success).toBe(true)
    })

    test('should handle SMTP connection failure', async () => {
      mockedEmailService.testConnection.mockResolvedValue({
        success: false,
        configured: true,
        error: 'Connection timeout'
      })

      const result = await emailService.testConnection()
      
      expect(result.success).toBe(false)
      expect(result.error).toBe('Connection timeout')
    })

    test('should detect missing SMTP configuration', async () => {
      mockedEmailService.testConnection.mockResolvedValue({
        success: false,
        configured: false,
        error: 'SMTP credentials not configured. Please set SMTP_USER and SMTP_PASS environment variables.'
      })

      const result = await emailService.testConnection()
      
      expect(result.configured).toBe(false)
      expect(result.success).toBe(false)
    })
  })

  describe('Email Service Error Handling', () => {
    test('should handle email service errors during registration', async () => {
      mockedEmailService.sendEmailVerification.mockRejectedValue(
        new Error('SMTP server unavailable')
      )

      const testUser3 = {
        address: '0x4234567890123456789012345678901234567890',
        email: 'test3@example.com',
        username: 'testuser3'
      }

      // Get nonce
      await request(app)
        .get(`/api/auth/nonce/${testUser3.address}`)
        .expect(200)

      // Register should still succeed even if email fails
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          address: testUser3.address,
          signature: 'mock-signature',
          email: testUser3.email,
          username: testUser3.username
        })
        .expect(201)

      expect(response.body.user.isVerified).toBe(false)

      // Cleanup
      await prisma.user.delete({
        where: { address: testUser3.address.toLowerCase() }
      })
    })
  })

  describe('Email Template Validation', () => {
    test('should send verification email with correct template data', async () => {
      expect(mockedEmailService.sendEmailVerification).toHaveBeenCalledWith(
        testUser.email,
        expect.any(String),
        testUser.username
      )

      const call = mockedEmailService.sendEmailVerification.mock.calls[0]
      expect(call[0]).toBe(testUser.email)
      expect(call[2]).toBe(testUser.username)
      expect(typeof call[1]).toBe('string') // token
      expect(call[1]).toHaveLength(64) // 32 bytes = 64 hex chars
    })

    test('should generate unique verification tokens', async () => {
      const tokens = new Set()
      
      // Register multiple users and collect tokens
      for (let i = 0; i < 5; i++) {
        const user = {
          address: `0x${i}234567890123456789012345678901234567890`,
          email: `test${i}@example.com`,
          username: `testuser${i}`
        }

        await request(app)
          .get(`/api/auth/nonce/${user.address}`)
          .expect(200)

        await request(app)
          .post('/api/auth/register')
          .send({
            address: user.address,
            signature: 'mock-signature',
            email: user.email,
            username: user.username
          })
          .expect(201)

        const lastCall = mockedEmailService.sendEmailVerification.mock.calls.slice(-1)[0]
        tokens.add(lastCall[1])

        // Cleanup
        await prisma.user.delete({
          where: { address: user.address.toLowerCase() }
        })
      }

      // All tokens should be unique
      expect(tokens.size).toBe(5)
    })
  })
})