import nodemailer from 'nodemailer'
import dotenv from 'dotenv'
import path from 'path'

// Load production environment
dotenv.config({ path: path.join(__dirname, '../.env.production') })

console.log('🔍 SMTP Debug Tool')
console.log('================')

const smtpConfigs = [
  {
    name: 'Current Config (STARTTLS 587)',
    host: 'mail.privateemail.com',
    port: 587,
    secure: false,
    requireTLS: true,
    auth: {
      user: process.env.SMTP_USER!,
      pass: process.env.SMTP_PASS!
    },
    tls: {
      rejectUnauthorized: false,
      servername: 'mail.privateemail.com'
    }
  },
  {
    name: 'SSL Config (465)',
    host: 'mail.privateemail.com',
    port: 465,
    secure: true,
    auth: {
      user: process.env.SMTP_USER!,
      pass: process.env.SMTP_PASS!
    },
    tls: {
      rejectUnauthorized: false,
      servername: 'mail.privateemail.com'
    }
  },
  {
    name: 'Alternative STARTTLS',
    host: 'mail.privateemail.com',
    port: 587,
    secure: false,
    requireTLS: true,
    auth: {
      user: process.env.SMTP_USER!,
      pass: process.env.SMTP_PASS!
    },
    tls: {
      rejectUnauthorized: false
    }
  },
  {
    name: 'Gmail-style Config',
    host: 'mail.privateemail.com',
    port: 587,
    secure: false,
    auth: {
      user: process.env.SMTP_USER!,
      pass: process.env.SMTP_PASS!
    },
    tls: {
      rejectUnauthorized: false,
      ciphers: 'SSLv3'
    }
  }
]

async function testConfig(config: any) {
  console.log(`\n🧪 Testing: ${config.name}`)
  console.log(`   Host: ${config.host}:${config.port}`)
  console.log(`   Secure: ${config.secure}`)
  console.log(`   User: ${config.auth.user}`)
  
  try {
    const transporter = nodemailer.createTransport(config)
    
    console.log('   ⏳ Verifying connection...')
    await transporter.verify()
    
    console.log('   ✅ SUCCESS! Connection verified')
    
    // Try sending a test email
    console.log('   ⏳ Sending test email...')
    const info = await transporter.sendMail({
      from: `"Zorium Test" <${process.env.SMTP_USER}>`,
      to: 'test@example.com', // This will fail but we'll see the auth result
      subject: 'SMTP Test',
      text: 'Test email'
    })
    
    console.log('   ✅ Email sent successfully!')
    console.log('   📧 Message ID:', info.messageId)
    
    return true
    
  } catch (error: any) {
    console.log('   ❌ FAILED:', error.message)
    if (error.code === 'EAUTH') {
      console.log('   🔐 Authentication failed - check credentials')
    } else if (error.code === 'ECONNECTION') {
      console.log('   🔌 Connection failed - check host/port')
    } else if (error.code === 'ETLS') {
      console.log('   🔒 TLS/SSL error - check encryption settings')
    }
    return false
  }
}

async function main() {
  console.log('\n📋 Environment Variables:')
  console.log(`SMTP_HOST: ${process.env.SMTP_HOST}`)
  console.log(`SMTP_PORT: ${process.env.SMTP_PORT}`)
  console.log(`SMTP_USER: ${process.env.SMTP_USER}`)
  console.log(`SMTP_PASS: ${process.env.SMTP_PASS ? '✅ SET' : '❌ NOT SET'}`)
  console.log(`SMTP_SECURE: ${process.env.SMTP_SECURE}`)
  
  let successCount = 0
  
  for (const config of smtpConfigs) {
    const success = await testConfig(config)
    if (success) {
      successCount++
      console.log(`\n🎉 Found working configuration: ${config.name}`)
      break // Stop at first working config
    }
  }
  
  console.log('\n📊 Summary:')
  console.log(`   Working configs: ${successCount}/${smtpConfigs.length}`)
  
  if (successCount === 0) {
    console.log('\n💡 Suggestions:')
    console.log('   1. Verify SMTP credentials in Namecheap control panel')
    console.log('   2. Check if 2FA is enabled (may need app password)')
    console.log('   3. Ensure email account is fully activated')
    console.log('   4. Try using the full email address as username')
    console.log('   5. Check if IP is whitelisted (if required)')
  }
}

main().catch(console.error)