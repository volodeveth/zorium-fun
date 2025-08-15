import emailService from '../src/services/emailService'
import nodemailer from 'nodemailer'

// Mock nodemailer
jest.mock('nodemailer')
const mockedNodemailer = nodemailer as jest.Mocked<typeof nodemailer>

describe('EmailService Unit Tests', () => {
  let mockTransporter: any

  beforeEach(() => {
    // Reset environment variables
    process.env.SMTP_USER = 'test@zorium.fun'
    process.env.SMTP_PASS = 'test-password'
    process.env.SMTP_HOST = 'mail.privateemail.com'
    process.env.SMTP_PORT = '587'
    process.env.SMTP_SECURE = 'false'
    process.env.FROM_EMAIL = 'test@zorium.fun'
    process.env.FROM_NAME = 'Zorium Test'
    process.env.FRONTEND_URL = 'https://test.zorium.fun'

    mockTransporter = {
      sendMail: jest.fn(),
      verify: jest.fn()
    }

    mockedNodemailer.createTransport.mockReturnValue(mockTransporter)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('Email Service Configuration', () => {
    test('should configure SMTP settings correctly', () => {
      expect(mockedNodemailer.createTransport).toHaveBeenCalledWith(
        expect.objectContaining({
          host: 'mail.privateemail.com',
          port: 587,
          secure: false,
          auth: {
            user: 'test@zorium.fun',
            pass: 'test-password'
          }
        })
      )
    })

    test('should handle SSL configuration for port 465', () => {
      process.env.SMTP_PORT = '465'
      process.env.SMTP_SECURE = 'true'
      
      // Create new instance to test SSL config
      const EmailService = require('../src/services/emailService').default
      
      expect(mockedNodemailer.createTransport).toHaveBeenCalledWith(
        expect.objectContaining({
          port: 465,
          secure: true,
          tls: {
            rejectUnauthorized: false
          }
        })
      )
    })
  })

  describe('sendEmailVerification', () => {
    test('should send verification email successfully', async () => {
      mockTransporter.sendMail.mockResolvedValue({ messageId: 'test-id' })

      const result = await emailService.sendEmailVerification(
        'test@example.com',
        'test-token',
        'TestUser'
      )

      expect(result).toBe(true)
      expect(mockTransporter.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          from: 'Zorium Test <test@zorium.fun>',
          to: 'test@example.com',
          subject: 'Verify your email address - Zorium',
          html: expect.stringContaining('TestUser')
        })
      )
    })

    test('should return false when SMTP not configured', async () => {
      delete process.env.SMTP_USER
      delete process.env.SMTP_PASS

      const result = await emailService.sendEmailVerification(
        'test@example.com',
        'test-token'
      )

      expect(result).toBe(false)
      expect(mockTransporter.sendMail).not.toHaveBeenCalled()
    })

    test('should handle sendMail errors gracefully', async () => {
      mockTransporter.sendMail.mockRejectedValue(new Error('SMTP Error'))
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation()

      const result = await emailService.sendEmailVerification(
        'test@example.com',
        'test-token'
      )

      expect(result).toBe(false)
      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to send email verification:',
        expect.any(Error)
      )

      consoleSpy.mockRestore()
    })

    test('should include verification URL in email template', async () => {
      mockTransporter.sendMail.mockResolvedValue({ messageId: 'test-id' })

      await emailService.sendEmailVerification(
        'test@example.com',
        'test-token-123'
      )

      const call = mockTransporter.sendMail.mock.calls[0][0]
      expect(call.html).toContain('https://test.zorium.fun/verify-email?token=test-token-123')
    })
  })

  describe('sendWelcomeEmail', () => {
    test('should send welcome email successfully', async () => {
      mockTransporter.sendMail.mockResolvedValue({ messageId: 'test-id' })

      const result = await emailService.sendWelcomeEmail(
        'test@example.com',
        'TestUser'
      )

      expect(result).toBe(true)
      expect(mockTransporter.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          from: 'Zorium Test <test@zorium.fun>',
          to: 'test@example.com',
          subject: 'Welcome to Zorium! 🎉',
          html: expect.stringContaining('TestUser')
        })
      )
    })

    test('should return false when SMTP not configured', async () => {
      delete process.env.SMTP_USER

      const result = await emailService.sendWelcomeEmail(
        'test@example.com',
        'TestUser'
      )

      expect(result).toBe(false)
      expect(mockTransporter.sendMail).not.toHaveBeenCalled()
    })

    test('should handle sendMail errors gracefully', async () => {
      mockTransporter.sendMail.mockRejectedValue(new Error('Network error'))
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation()

      const result = await emailService.sendWelcomeEmail(
        'test@example.com',
        'TestUser'
      )

      expect(result).toBe(false)
      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to send welcome email:',
        expect.any(Error)
      )

      consoleSpy.mockRestore()
    })
  })

  describe('generateVerificationToken', () => {
    test('should generate 64-character hex token', () => {
      const token = emailService.generateVerificationToken()
      
      expect(token).toHaveLength(64)
      expect(token).toMatch(/^[a-f0-9]{64}$/)
    })

    test('should generate unique tokens', () => {
      const token1 = emailService.generateVerificationToken()
      const token2 = emailService.generateVerificationToken()
      
      expect(token1).not.toBe(token2)
    })
  })

  describe('testConnection', () => {
    test('should return success when connection works', async () => {
      mockTransporter.verify.mockResolvedValue(true)

      const result = await emailService.testConnection()

      expect(result).toEqual({
        success: true,
        configured: true
      })
      expect(mockTransporter.verify).toHaveBeenCalled()
    })

    test('should return error when connection fails', async () => {
      const error = new Error('Connection failed')
      mockTransporter.verify.mockRejectedValue(error)

      const result = await emailService.testConnection()

      expect(result).toEqual({
        success: false,
        configured: true,
        error: 'Connection failed'
      })
    })

    test('should return not configured when credentials missing', async () => {
      delete process.env.SMTP_USER
      delete process.env.SMTP_PASS

      const result = await emailService.testConnection()

      expect(result).toEqual({
        success: false,
        configured: false,
        error: 'SMTP credentials not configured. Please set SMTP_USER and SMTP_PASS environment variables.'
      })
      expect(mockTransporter.verify).not.toHaveBeenCalled()
    })

    test('should handle unknown errors', async () => {
      mockTransporter.verify.mockRejectedValue('String error')

      const result = await emailService.testConnection()

      expect(result).toEqual({
        success: false,
        configured: true,
        error: 'Unknown error'
      })
    })
  })

  describe('Email Templates', () => {
    test('verification email should contain all required elements', async () => {
      mockTransporter.sendMail.mockResolvedValue({ messageId: 'test-id' })

      await emailService.sendEmailVerification(
        'test@example.com',
        'test-token',
        'TestUser'
      )

      const call = mockTransporter.sendMail.mock.calls[0][0]
      const html = call.html

      // Check for key elements
      expect(html).toContain('TestUser')
      expect(html).toContain('Verify Your Email')
      expect(html).toContain('verify-email?token=test-token')
      expect(html).toContain('💎 ZORIUM')
      expect(html).toContain('24 hours')
      expect(html).toContain('Verify Email Address')
    })

    test('welcome email should contain all required elements', async () => {
      mockTransporter.sendMail.mockResolvedValue({ messageId: 'test-id' })

      await emailService.sendWelcomeEmail('test@example.com', 'TestUser')

      const call = mockTransporter.sendMail.mock.calls[0][0]
      const html = call.html

      // Check for key elements
      expect(html).toContain('TestUser')
      expect(html).toContain('Welcome to Zorium!')
      expect(html).toContain('Create NFTs')
      expect(html).toContain('Buy & Sell')
      expect(html).toContain('Earn ZRM')
      expect(html).toContain('Start Exploring')
      expect(html).toContain('/explore')
    })
  })
})