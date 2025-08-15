// Test IPFS upload functionality
const fetch = require('node-fetch')

async function testIPFSUpload() {
  try {
    // Create a small test image (1x1 red pixel PNG base64)
    const testImageBase64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='
    
    const testData = {
      name: 'Test NFT',
      description: 'Testing IPFS upload',
      imageFile: testImageBase64,
      creatorAddress: '0x1234567890123456789012345678901234567890',
      attributes: [
        { trait_type: 'Test', value: 'True' }
      ]
    }
    
    console.log('🧪 Testing IPFS upload...')
    console.log('🌐 Backend URL: https://backend-pcv0ewy66-volodeveths-projects.vercel.app')
    
    const response = await fetch('https://backend-pcv0ewy66-volodeveths-projects.vercel.app/api/upload/nft-metadata', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData)
    })
    
    const result = await response.json()
    
    console.log('\n📊 Response Status:', response.status)
    console.log('📋 Response:', JSON.stringify(result, null, 2))
    
    if (result.success) {
      console.log('\n✅ IPFS Upload Successful!')
      console.log('🖼️  Image URI:', result.metadata.imageURI)
      console.log('📄 Metadata URI:', result.metadata.metadataURI)
      console.log('🌐 Image URL:', result.metadata.imageUrl)
      console.log('🌐 Metadata URL:', result.metadata.metadataUrl)
    } else {
      console.log('\n❌ IPFS Upload Failed!')
      console.log('🔍 Error:', result.error || result.message)
    }
    
  } catch (error) {
    console.error('\n💥 Test Error:', error.message)
  }
}

testIPFSUpload()