const axios = require('axios')

const BASE_URL = 'http://localhost:3001'

// Test configuration
const testConfig = {
  timeout: 5000,
  validateStatus: () => true // Don't throw on any status code
}

// Test cases
const tests = [
  {
    name: 'Health Check',
    method: 'GET',
    url: '/health',
    expectedStatus: 200
  },
  {
    name: 'Get NFTs (No auth)',
    method: 'GET',
    url: '/api/nfts',
    expectedStatus: 200
  },
  {
    name: 'Get Trending NFTs',
    method: 'GET',
    url: '/api/nfts/trending',
    expectedStatus: 200
  },
  {
    name: 'Invalid Endpoint',
    method: 'GET',
    url: '/api/invalid-endpoint',
    expectedStatus: 404
  },
  {
    name: 'Auth Required Endpoint',
    method: 'GET',
    url: '/api/auth/session',
    expectedStatus: 401
  }
]

async function runTests() {
  console.log('🧪 Starting API Tests...\n')
  
  let passed = 0
  let failed = 0
  
  for (const test of tests) {
    try {
      const response = await axios({
        method: test.method,
        url: `${BASE_URL}${test.url}`,
        ...testConfig
      })
      
      const statusMatch = response.status === test.expectedStatus
      
      if (statusMatch) {
        console.log(`✅ ${test.name} - Status: ${response.status}`)
        passed++
      } else {
        console.log(`❌ ${test.name} - Expected: ${test.expectedStatus}, Got: ${response.status}`)
        failed++
      }
      
    } catch (error) {
      console.log(`❌ ${test.name} - Error: ${error.message}`)
      failed++
    }
  }
  
  console.log(`\n📊 Test Results: ${passed} passed, ${failed} failed`)
  
  if (failed === 0) {
    console.log('🎉 All tests passed!')
  } else {
    console.log('⚠️  Some tests failed. Check the output above.')
  }
}

// Check if server is running
async function checkServer() {
  try {
    await axios.get(`${BASE_URL}/health`, { timeout: 3000 })
    return true
  } catch (error) {
    return false
  }
}

async function main() {
  console.log('🔍 Checking if server is running...')
  
  const serverRunning = await checkServer()
  
  if (!serverRunning) {
    console.log('❌ Server is not running on port 3001')
    console.log('Please start the server with: npm run dev')
    process.exit(1)
  }
  
  console.log('✅ Server is running\n')
  await runTests()
}

main().catch(console.error)