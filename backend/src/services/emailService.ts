import nodemailer from 'nodemailer'
import { randomBytes } from 'crypto'

interface EmailConfig {
  host: string
  port: number
  secure: boolean
  requireTLS?: boolean
  auth: {
    user: string
    pass: string
  }
}

class EmailService {
  private transporter: nodemailer.Transporter
  private fromEmail: string
  private fromName: string
  private frontendUrl: string

  constructor() {
    this.fromEmail = process.env.FROM_EMAIL || 'noreply@zorium.fun'
    this.fromName = process.env.FROM_NAME || 'Zorium'
    this.frontendUrl = process.env.FRONTEND_URL || 'https://zorium.fun'

    const smtpUser = process.env.SMTP_USER || ''
    const smtpPass = process.env.SMTP_PASS || ''

    // Check if SMTP credentials are configured
    if (!smtpUser || !smtpPass) {
      console.warn('SMTP credentials not configured. Email service will not work.')
      console.log('Please set SMTP_USER and SMTP_PASS environment variables.')
    }

    const config: EmailConfig = {
      host: process.env.SMTP_HOST || 'mail.privateemail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      requireTLS: process.env.SMTP_SECURE !== 'true', // Only for STARTTLS (port 587)
      auth: {
        user: smtpUser,
        pass: smtpPass
      }
    }

    // Add specific settings based on SMTP provider and port
    if (config.host === 'smtp.gmail.com') {
      // Gmail-specific settings
      (config as any).tls = {
        rejectUnauthorized: false
      }
    } else if (config.host === 'mail.privateemail.com') {
      // Namecheap Private Email settings
      if (config.secure && config.port === 465) {
        // SSL/TLS on port 465
        (config as any).tls = {
          rejectUnauthorized: false,
          servername: 'mail.privateemail.com'
        }
      } else if (!config.secure && config.port === 587) {
        // STARTTLS on port 587
        (config as any).tls = {
          rejectUnauthorized: false,
          servername: 'mail.privateemail.com'
        }
      }
    } else {
      // Generic SMTP settings
      (config as any).tls = {
        rejectUnauthorized: false
      }
    }

    // Log email configuration (without sensitive data)
    console.log('Email service initialized:', {
      host: config.host,
      port: config.port,
      secure: config.secure,
      hasUser: !!config.auth.user,
      hasPass: !!config.auth.pass,
      fromEmail: this.fromEmail,
      frontendUrl: this.frontendUrl,
      configured: !!(smtpUser && smtpPass)
    })

    this.transporter = nodemailer.createTransport(config)
  }

  async sendEmailVerification(email: string, token: string, username?: string): Promise<boolean> {
    try {
      // Check if SMTP is configured
      if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
        console.warn(`Email verification not sent to ${email}: SMTP not configured`)
        return false
      }

      const verificationUrl = `${this.frontendUrl}/verify-email?token=${token}`
      
      const mailOptions = {
        from: `${this.fromName} <${this.fromEmail}>`,
        to: email,
        subject: 'Verify your email address - Zorium',
        html: this.getVerificationEmailTemplate(verificationUrl, username || 'User')
      }

      await this.transporter.sendMail(mailOptions)
      console.log(`Email verification sent to: ${email}`)
      return true
    } catch (error) {
      console.error('Failed to send email verification:', error)
      return false
    }
  }

  async sendWelcomeEmail(email: string, username: string): Promise<boolean> {
    try {
      // Check if SMTP is configured
      if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
        console.warn(`Welcome email not sent to ${email}: SMTP not configured`)
        return false
      }

      const mailOptions = {
        from: `${this.fromName} <${this.fromEmail}>`,
        to: email,
        subject: 'Welcome to Zorium! 🎉',
        html: this.getWelcomeEmailTemplate(username)
      }

      await this.transporter.sendMail(mailOptions)
      console.log(`Welcome email sent to: ${email}`)
      return true
    } catch (error) {
      console.error('Failed to send welcome email:', error)
      return false
    }
  }

  generateVerificationToken(): string {
    return randomBytes(32).toString('hex')
  }

  async testConnection(): Promise<{ success: boolean; error?: string; configured: boolean }> {
    const isConfigured = !!(process.env.SMTP_USER && process.env.SMTP_PASS)
    
    if (!isConfigured) {
      console.log('SMTP connection test: SKIPPED - No credentials configured')
      return { 
        success: false, 
        configured: false,
        error: 'SMTP credentials not configured. Please set SMTP_USER and SMTP_PASS environment variables.' 
      }
    }

    try {
      await this.transporter.verify()
      console.log('SMTP connection test: SUCCESS')
      return { success: true, configured: true }
    } catch (error) {
      console.error('SMTP connection test: FAILED', error)
      return { 
        success: false, 
        configured: true,
        error: error instanceof Error ? error.message : 'Unknown error' 
      }
    }
  }

  private getVerificationEmailTemplate(verificationUrl: string, username: string): string {
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Verify Your Email - Zorium</title>
        <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f4f4f4; }
            .container { max-width: 600px; margin: 0 auto; background: white; padding: 40px; border-radius: 8px; margin-top: 20px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
            .header { text-align: center; margin-bottom: 30px; }
            .logo { font-size: 24px; font-weight: bold; color: #8B5CF6; margin-bottom: 10px; }
            .title { font-size: 28px; color: #1F2937; margin: 0; }
            .subtitle { color: #6B7280; margin: 10px 0 0 0; }
            .content { margin: 30px 0; }
            .button { display: inline-block; background: linear-gradient(135deg, #8B5CF6 0%, #3B82F6 100%); color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 20px 0; }
            .button:hover { opacity: 0.9; }
            .info-box { background: #F3F4F6; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #8B5CF6; }
            .footer { text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #E5E7EB; color: #6B7280; font-size: 14px; }
            .footer a { color: #8B5CF6; text-decoration: none; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <div class="logo">💎 ZORIUM</div>
                <h1 class="title">Verify Your Email</h1>
                <p class="subtitle">Welcome to the future of NFTs</p>
            </div>
            
            <div class="content">
                <p>Hi <strong>${username}</strong>,</p>
                
                <p>Thank you for joining Zorium! To complete your registration and start creating, collecting, and trading NFTs, please verify your email address.</p>
                
                <div style="text-align: center; margin: 30px 0;">
                    <a href="${verificationUrl}" class="button">Verify Email Address</a>
                </div>
                
                <div class="info-box">
                    <strong>🚀 What's next after verification?</strong><br>
                    ✅ Complete your profile setup<br>
                    ✅ Start creating and minting NFTs<br>
                    ✅ Explore trending collections<br>
                    ✅ Earn ZRM tokens through platform activities
                </div>
                
                <p>If the button doesn't work, copy and paste this link into your browser:</p>
                <p style="word-break: break-all; color: #8B5CF6; font-family: monospace; background: #F3F4F6; padding: 10px; border-radius: 4px;">${verificationUrl}</p>
                
                <p><strong>This verification link expires in 24 hours.</strong></p>
            </div>
            
            <div class="footer">
                <p>If you didn't create an account on Zorium, you can safely ignore this email.</p>
                <p>
                    <a href="${this.frontendUrl}">Visit Zorium</a> | 
                    <a href="${this.frontendUrl}/terms">Terms</a> | 
                    <a href="${this.frontendUrl}/privacy">Privacy</a>
                </p>
            </div>
        </div>
    </body>
    </html>
    `
  }

  private getWelcomeEmailTemplate(username: string): string {
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to Zorium! 🎉</title>
        <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f4f4f4; }
            .container { max-width: 600px; margin: 0 auto; background: white; padding: 40px; border-radius: 8px; margin-top: 20px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
            .header { text-align: center; margin-bottom: 30px; }
            .logo { font-size: 24px; font-weight: bold; color: #8B5CF6; margin-bottom: 10px; }
            .title { font-size: 28px; color: #1F2937; margin: 0; }
            .subtitle { color: #6B7280; margin: 10px 0 0 0; }
            .content { margin: 30px 0; }
            .button { display: inline-block; background: linear-gradient(135deg, #8B5CF6 0%, #3B82F6 100%); color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 20px 0; }
            .feature-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin: 30px 0; }
            .feature { background: #F8FAFC; padding: 20px; border-radius: 8px; text-align: center; }
            .feature-icon { font-size: 32px; margin-bottom: 10px; }
            .footer { text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #E5E7EB; color: #6B7280; font-size: 14px; }
            .footer a { color: #8B5CF6; text-decoration: none; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <div class="logo">💎 ZORIUM</div>
                <h1 class="title">Welcome to Zorium!</h1>
                <p class="subtitle">Your journey in the NFT world begins now</p>
            </div>
            
            <div class="content">
                <p>Hi <strong>${username}</strong>,</p>
                
                <p>🎉 Congratulations! Your email has been verified and your Zorium account is now active. You're all set to explore the exciting world of NFTs on our platform.</p>
                
                <div style="text-align: center; margin: 30px 0;">
                    <a href="${this.frontendUrl}/explore" class="button">Start Exploring</a>
                </div>
                
                <div class="feature-grid">
                    <div class="feature">
                        <div class="feature-icon">🎨</div>
                        <h3>Create NFTs</h3>
                        <p>Turn your digital art into unique NFTs</p>
                    </div>
                    <div class="feature">
                        <div class="feature-icon">💰</div>
                        <h3>Buy & Sell</h3>
                        <p>Trade NFTs on our marketplace</p>
                    </div>
                    <div class="feature">
                        <div class="feature-icon">🪙</div>
                        <h3>Earn ZRM</h3>
                        <p>Get rewarded for platform activities</p>
                    </div>
                    <div class="feature">
                        <div class="feature-icon">🔍</div>
                        <h3>Discover</h3>
                        <p>Find trending collections and artists</p>
                    </div>
                </div>
                
                <p><strong>Ready to get started?</strong> Complete your profile and start your NFT journey today!</p>
            </div>
            
            <div class="footer">
                <p>Need help? Check out our <a href="${this.frontendUrl}/help">Help Center</a> or contact support.</p>
                <p>
                    <a href="${this.frontendUrl}">Visit Zorium</a> | 
                    <a href="${this.frontendUrl}/terms">Terms</a> | 
                    <a href="${this.frontendUrl}/privacy">Privacy</a>
                </p>
            </div>
        </div>
    </body>
    </html>
    `
  }
}

export default new EmailService()