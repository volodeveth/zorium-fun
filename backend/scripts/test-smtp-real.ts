#!/usr/bin/env ts-node

import dotenv from 'dotenv'
import nodemailer from 'nodemailer'

// Load environment variables
dotenv.config()

interface SMTPConfig {
  host: string
  port: number
  secure: boolean
  auth: {
    user: string
    pass: string
  }
  tls?: any
}

async function testSMTPConnection() {
  console.log('🧪 Starting SMTP connection tests...\n')

  // Test with alternative credentials - login as ZORIUMFUNAPP
  const testCredentials = {
    host: 'mail.privateemail.com',
    user: 'ZORIUMFUNAPP',
    pass: 'xupi-ejxx-jlit-nrgb'
  }

  // Also test with alternative server names
  const alternativeHosts = [
    'mail.privateemail.com',
    'privateemail.com',
    'smtp.privateemail.com'
  ]

  console.log('📧 Testing with credentials:')
  console.log(`   Host: ${testCredentials.host}`)
  console.log(`   User: ${testCredentials.user}`)
  console.log(`   Pass: ${'*'.repeat(testCredentials.pass.length)}`)
  console.log()

  // Test configurations for each host
  const configs: Array<{name: string, config: SMTPConfig}> = []
  
  for (const host of alternativeHosts) {
    configs.push(
      {
        name: `STARTTLS (Port 587) - ${host}`,
        config: {
          host: host,
          port: 587,
          secure: false,
          auth: {
            user: testCredentials.user,
            pass: testCredentials.pass
          },
          tls: {
            rejectUnauthorized: false,
            servername: host
          }
        }
      },
      {
        name: `SSL (Port 465) - ${host}`,
        config: {
          host: host,
          port: 465,
          secure: true,
          auth: {
            user: testCredentials.user,
            pass: testCredentials.pass
          },
          tls: {
            rejectUnauthorized: false,
            servername: host
          }
        }
      }
    )
  }

  for (const {name, config} of configs) {
    console.log(`\n🔧 Testing: ${name}`)
    console.log(`   Port: ${config.port}`)
    console.log(`   Secure: ${config.secure}`)
    
    try {
      const transporter = nodemailer.createTransport(config)
      
      // Test connection
      console.log('   Verifying connection...')
      await transporter.verify()
      console.log('   ✅ Connection successful!')
      
      // Test sending email - use noreply@zorium.fun as from/to
      console.log('   Sending test email...')
      const info = await transporter.sendMail({
        from: `Zorium Test <noreply@zorium.fun>`,
        to: 'noreply@zorium.fun', // Send to the actual email address
        subject: `SMTP Test - ${name} - ${new Date().toISOString()}`,
        html: `
          <h2>✅ SMTP Test Successful</h2>
          <p><strong>Configuration:</strong> ${name}</p>
          <p><strong>Port:</strong> ${config.port}</p>
          <p><strong>Secure:</strong> ${config.secure}</p>
          <p><strong>Time:</strong> ${new Date().toISOString()}</p>
          <p>This email confirms that your SMTP configuration is working correctly!</p>
        `
      })
      
      console.log('   ✅ Email sent successfully!')
      console.log(`   📧 Message ID: ${info.messageId}`)
      console.log(`   📬 Response: ${info.response}`)
      
      return { success: true, config: name, messageId: info.messageId }
      
    } catch (error: any) {
      console.log('   ❌ Failed:')
      console.log(`      Error: ${error.message}`)
      if (error.code) {
        console.log(`      Code: ${error.code}`)
      }
      if (error.command) {
        console.log(`      Command: ${error.command}`)
      }
    }
  }
  
  console.log('\n❌ All configurations failed!')
  return { success: false }
}

async function main() {
  try {
    const result = await testSMTPConnection()
    
    if (result.success) {
      console.log('\n🎉 SUCCESS! SMTP is working correctly.')
      console.log(`Best configuration: ${result.config}`)
      console.log('\n📝 Update your .env file with:')
      console.log('SMTP_HOST=mail.privateemail.com')
      console.log('SMTP_PORT=587')
      console.log('SMTP_SECURE=false')
      console.log('SMTP_USER=noreply@zorium.fun')
      console.log('SMTP_PASS=xupi-ejxx-jlit-nrgb')
    } else {
      console.log('\n💔 All SMTP tests failed. Please check:')
      console.log('1. Credentials are correct')
      console.log('2. Email account is active')
      console.log('3. Network connectivity')
      console.log('4. Firewall settings')
    }
    
  } catch (error: any) {
    console.error('💥 Unexpected error:', error.message)
    process.exit(1)
  }
}

// Run if called directly
if (require.main === module) {
  main()
}

export { testSMTPConnection }