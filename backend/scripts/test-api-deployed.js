// Test deployed API endpoints
const https = require('https')

const BASE_URL = 'https://backend-1rscypucx-volodeveths-projects.vercel.app'

const endpoints = [
  '/health',
  '/api/analytics/stats',
  '/api/nfts',
  '/api/nfts/trending',
  '/api/search'
]

function makeRequest(path) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'backend-1rscypucx-volodeveths-projects.vercel.app',
      port: 443,
      path: path,
      method: 'GET',
      headers: {
        'User-Agent': 'Node.js Test Script'
      }
    }

    const req = https.request(options, (res) => {
      let data = ''
      
      res.on('data', (chunk) => {
        data += chunk
      })
      
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          headers: res.headers,
          data: data
        })
      })
    })

    req.on('error', (error) => {
      reject(error)
    })

    req.end()
  })
}

async function testAPI() {
  console.log('🧪 Testing deployed API endpoints...\n')
  
  for (const endpoint of endpoints) {
    try {
      console.log(`Testing ${endpoint}...`)
      const response = await makeRequest(endpoint)
      
      if (response.status === 200) {
        console.log(`✅ ${endpoint} - Status: ${response.status}`)
        
        // Try to parse JSON
        try {
          const json = JSON.parse(response.data)
          if (json.status || json.message) {
            console.log(`   Response: ${json.message || json.status}`)
          }
          if (json.features) {
            console.log(`   Database: ${json.features.database ? 'Connected' : 'Disconnected'}`)
          }
        } catch (e) {
          console.log(`   Response: ${response.data.substring(0, 100)}...`)
        }
      } else {
        console.log(`❌ ${endpoint} - Status: ${response.status}`)
        console.log(`   Response: ${response.data.substring(0, 200)}...`)
      }
      
    } catch (error) {
      console.log(`❌ ${endpoint} - Error: ${error.message}`)
    }
    
    console.log('') // Empty line
  }
}

testAPI().catch(console.error)