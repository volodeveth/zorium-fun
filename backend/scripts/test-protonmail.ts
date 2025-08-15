import nodemailer from 'nodemailer'
import dotenv from 'dotenv'
import path from 'path'

dotenv.config({ path: path.join(__dirname, '../.env.production') })

console.log('📧 ProtonMail SMTP Test')
console.log('=======================')

const protonConfigs = [
  {
    name: 'ProtonMail Bridge (Local)',
    host: '127.0.0.1',
    port: 1025,
    secure: false,
    auth: {
      user: process.env.SMTP_USER!,
      pass: process.env.SMTP_PASS!
    },
    tls: {
      rejectUnauthorized: false
    }
  },
  {
    name: 'ProtonMail Bridge (Alternative Port)',
    host: '127.0.0.1', 
    port: 1143,
    secure: false,
    auth: {
      user: process.env.SMTP_USER!,
      pass: process.env.SMTP_PASS!
    },
    tls: {
      rejectUnauthorized: false
    }
  }
]

console.log(`🔑 Using ProtonMail credentials:`)
console.log(`   Email: ${process.env.SMTP_USER}`)
console.log(`   Password: ${process.env.SMTP_PASS ? '[SET]' : '[NOT SET]'}`)

async function testProtonConfig(config: any) {
  console.log(`\n🧪 Testing: ${config.name}`)
  console.log(`   Host: ${config.host}:${config.port}`)
  
  try {
    const transporter = nodemailer.createTransport(config)
    
    console.log('   ⏳ Verifying connection...')
    await transporter.verify()
    
    console.log('   ✅ SUCCESS! ProtonMail connection verified')
    
    // Try sending a test email
    console.log('   ⏳ Sending test email...')
    const info = await transporter.sendMail({
      from: `"Zorium Platform" <${process.env.SMTP_USER}>`,
      to: 'test@example.com',
      subject: 'Test Email from Zorium via ProtonMail',
      text: 'This is a test email sent through ProtonMail SMTP.',
      html: '<p>This is a test email sent through <strong>ProtonMail SMTP</strong>.</p>'
    })
    
    console.log('   ✅ Test email sent successfully!')
    console.log('   📧 Message ID:', info.messageId)
    
    return true
    
  } catch (error: any) {
    console.log('   ❌ FAILED:', error.message)
    console.log('   🔍 Error code:', error.code)
    
    if (error.code === 'ECONNREFUSED') {
      console.log('   🔌 Connection refused - ProtonMail Bridge not running?')
      console.log('   💡 Make sure ProtonMail Bridge is installed and running')
    } else if (error.code === 'EAUTH') {
      console.log('   🔐 Authentication failed - check ProtonMail credentials')
    } else if (error.message.includes('getaddrinfo ENOTFOUND')) {
      console.log('   🌐 Host not found - check SMTP host configuration')
    }
    
    return false
  }
}

async function checkProtonMailBridge() {
  console.log('\n🔍 Checking ProtonMail Bridge status...')
  
  // Try to connect to common ProtonMail Bridge ports
  const bridgePorts = [1025, 1143]
  
  for (const port of bridgePorts) {
    try {
      const net = require('net')
      const socket = new net.Socket()
      
      await new Promise((resolve, reject) => {
        socket.setTimeout(3000)
        socket.on('connect', () => {
          console.log(`   ✅ Port ${port} is open - Bridge might be running`)
          socket.destroy()
          resolve(true)
        })
        socket.on('timeout', () => {
          console.log(`   ❌ Port ${port} timeout`)
          socket.destroy()
          reject(new Error('Timeout'))
        })
        socket.on('error', (err) => {
          console.log(`   ❌ Port ${port} error: ${err.message}`)
          reject(err)
        })
        socket.connect(port, '127.0.0.1')
      })
      
    } catch (error) {
      // Port not available
    }
  }
}

async function main() {
  await checkProtonMailBridge()
  
  let successCount = 0
  
  for (const config of protonConfigs) {
    const success = await testProtonConfig(config)
    if (success) {
      successCount++
      console.log(`\n🎉 Found working ProtonMail config: ${config.name}`)
      break
    }
  }
  
  console.log('\n📊 Summary:')
  console.log(`   Working configs: ${successCount}/${protonConfigs.length}`)
  
  if (successCount === 0) {
    console.log('\n💡 ProtonMail SMTP Setup Instructions:')
    console.log('   1. Download and install ProtonMail Bridge')
    console.log('   2. Login to Bridge with your ProtonMail account')
    console.log('   3. Configure Bridge to allow SMTP access')
    console.log('   4. Use Bridge-generated password, not your ProtonMail password')
    console.log('   5. Default Bridge SMTP: 127.0.0.1:1025')
    console.log('\n   Alternative approach:')
    console.log('   - Consider using a different email provider (Gmail, SendGrid, etc.)')
    console.log('   - ProtonMail is designed for security, not for automated sending')
  }
}

main().catch(console.error)