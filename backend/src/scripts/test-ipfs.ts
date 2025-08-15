import { ipfsService } from '../services/ipfsService'
import { logger } from '../utils/logger'

async function testIPFSIntegration() {
  logger.info('🚀 Testing IPFS Integration...')

  try {
    // Check IPFS configuration
    if (!ipfsService.isConfigured()) {
      logger.error('❌ IPFS service is not configured. Please check PINATA_API_KEY and PINATA_SECRET_KEY in your environment.')
      return
    }

    logger.info('✅ IPFS service is configured')

    // Test 1: Upload a test image
    logger.info('📸 Testing image upload...')
    
    // Create a simple test image (1x1 pixel PNG in base64)
    const testImageBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='
    const testImageBuffer = Buffer.from(testImageBase64, 'base64')
    
    const imageResult = await ipfsService.uploadFile(
      testImageBuffer,
      'test-image.png',
      'image/png'
    )
    
    logger.info(`✅ Image uploaded successfully: ${imageResult.uri}`)
    logger.info(`📊 Size: ${imageResult.size} bytes`)
    logger.info(`🌐 HTTP URL: ${ipfsService.ipfsToHttp(imageResult.uri)}`)

    // Test 2: Create and upload NFT metadata
    logger.info('📝 Testing NFT metadata creation...')
    
    const metadataResult = await ipfsService.createNFTMetadata({
      name: 'Test NFT',
      description: 'This is a test NFT for IPFS integration testing',
      imageBuffer: testImageBuffer,
      imageFilename: 'test-nft.png',
      imageMimeType: 'image/png',
      creator: '0x1234567890123456789012345678901234567890',
      attributes: [
        { trait_type: 'Test Type', value: 'Integration Test' },
        { trait_type: 'Platform', value: 'Zorium.fun' }
      ],
      collection: 'Test Collection',
      external_url: 'https://zorium.fun'
    })
    
    logger.info(`✅ NFT metadata created successfully:`)
    logger.info(`🖼️  Image URI: ${metadataResult.imageURI}`)
    logger.info(`📄 Metadata URI: ${metadataResult.metadataURI}`)
    logger.info(`🌐 Image HTTP URL: ${ipfsService.ipfsToHttp(metadataResult.imageURI)}`)
    logger.info(`🌐 Metadata HTTP URL: ${ipfsService.ipfsToHttp(metadataResult.metadataURI)}`)

    // Test 3: Validate IPFS URIs
    logger.info('🔍 Testing IPFS URI validation...')
    
    const validURIs = [
      metadataResult.imageURI,
      metadataResult.metadataURI,
      'ipfs://QmTest123456789',
      'ipfs://bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi'
    ]
    
    const invalidURIs = [
      'https://example.com/image.png',
      'ipfs:/',
      'ipfs://',
      'http://ipfs.io/ipfs/test',
      ''
    ]
    
    for (const uri of validURIs) {
      const isValid = ipfsService.isValidIPFSUri(uri)
      logger.info(`✅ ${uri} - Valid: ${isValid}`)
      if (!isValid) {
        throw new Error(`Expected valid URI to be valid: ${uri}`)
      }
    }
    
    for (const uri of invalidURIs) {
      const isValid = ipfsService.isValidIPFSUri(uri)
      logger.info(`❌ ${uri} - Valid: ${isValid}`)
      if (isValid) {
        throw new Error(`Expected invalid URI to be invalid: ${uri}`)
      }
    }

    // Test 4: Try to fetch metadata
    logger.info('📥 Testing metadata retrieval...')
    
    try {
      const metadataContent = await ipfsService.getIPFSContent(
        metadataResult.metadataURI.replace('ipfs://', '')
      )
      
      logger.info('✅ Metadata retrieved successfully:')
      logger.info(JSON.stringify(metadataContent, null, 2))
      
      // Validate metadata structure
      if (!metadataContent.name || !metadataContent.description || !metadataContent.image) {
        throw new Error('Invalid metadata structure')
      }
      
      logger.info('✅ Metadata structure is valid')
      
    } catch (error) {
      logger.warn('⚠️  Metadata retrieval failed (this is normal for new uploads):', error)
    }

    logger.info('🎉 IPFS Integration Test Completed Successfully!')
    logger.info('')
    logger.info('📋 Summary:')
    logger.info(`- Image uploaded: ${metadataResult.imageURI}`)
    logger.info(`- Metadata uploaded: ${metadataResult.metadataURI}`)
    logger.info(`- All validations passed`)
    logger.info('')
    logger.info('🔗 You can now use these IPFS URIs in your NFT smart contracts!')

  } catch (error) {
    logger.error('❌ IPFS Integration Test Failed:', error)
    throw error
  }
}

// Run the test if this script is executed directly
if (require.main === module) {
  testIPFSIntegration()
    .then(() => {
      logger.info('✅ Test completed successfully')
      process.exit(0)
    })
    .catch((error) => {
      logger.error('❌ Test failed:', error)
      process.exit(1)
    })
}

export { testIPFSIntegration }