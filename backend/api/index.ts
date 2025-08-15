// Vercel API entry point with lazy loading
import { VercelRequest, VercelResponse } from '@vercel/node'
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import compression from 'compression'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config()

const app = express()

// Middleware
app.use(helmet({
  crossOriginEmbedderPolicy: false,
  contentSecurityPolicy: false,
}))
app.use(cors({
  origin: [
    'http://localhost:3000',
    'https://zorium.fun',
    'https://frontend-*.vercel.app',
    'https://*.vercel.app'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-admin-address']
}))
app.use(compression())
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

// Health check endpoint
app.get('/health', (req, res) => {
  try {
    res.status(200).json({
      status: 'OK',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV,
      database: process.env.DATABASE_URL ? 'configured' : 'missing',
      vercel: !!process.env.VERCEL,
      ipfs: !!process.env.PINATA_JWT || (!!process.env.PINATA_API_KEY && !!process.env.PINATA_SECRET_KEY)
    })
  } catch (error) {
    res.status(500).json({
      status: 'ERROR',
      error: error.message,
      timestamp: new Date().toISOString()
    })
  }
})

// Test IPFS endpoint without authentication
app.post('/api/test/ipfs-upload', async (req, res) => {
  try {
    console.log('Test IPFS upload request received')
    
    const {
      name,
      description,
      imageFile,
      attributes = [],
      collection,
      external_url,
      creatorAddress
    } = req.body
    
    // Validate required fields
    if (!name || !imageFile || !creatorAddress) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'Name, image, and creator address are required',
        details: {
          hasName: !!name,
          hasImageFile: !!imageFile,
          hasCreatorAddress: !!creatorAddress
        }
      })
    }
    
    // Import IPFS service
    const { ipfsService } = await import('../src/services/ipfsService')
    const crypto = await import('crypto')
    
    // Check IPFS configuration
    if (!ipfsService.isConfigured()) {
      console.error('IPFS not configured')
      return res.status(503).json({
        error: 'Service Unavailable', 
        message: 'IPFS service is not configured',
        timestamp: new Date().toISOString()
      })
    }
    
    // Process image file
    let base64Data: string
    let mimeType: string = 'application/octet-stream'
    
    if (imageFile.startsWith('data:')) {
      const matches = imageFile.match(/^data:([^;]+);base64,(.+)$/)
      if (!matches) {
        return res.status(400).json({
          error: 'Invalid image format',
          message: 'Image must be in base64 or data URL format'
        })
      }
      mimeType = matches[1]
      base64Data = matches[2]
    } else {
      base64Data = imageFile
    }
    
    if (!mimeType.startsWith('image/')) {
      return res.status(400).json({
        error: 'Invalid file type',
        message: 'Only image files are allowed'
      })
    }
    
    const imageBuffer = Buffer.from(base64Data, 'base64')
    const fileHash = crypto.default.createHash('sha256').update(imageBuffer).digest('hex').substring(0, 16)
    const timestamp = Date.now()
    const extension = mimeType === 'image/png' ? '.png' : mimeType === 'image/jpeg' ? '.jpg' : '.jpg'
    const filename = `nft_${creatorAddress}_${timestamp}_${fileHash}${extension}`
    
    // Upload to IPFS directly with fetch (bypass axios header issues)
    let result: { imageURI: string; metadataURI: string }
    try {
      // Upload image first
      const formData1 = new (await import('form-data')).default()
      formData1.append('file', imageBuffer, {
        filename,
        contentType: mimeType
      })
      
      const pinataMetadata1 = JSON.stringify({
        name: filename,
        keyvalues: {
          uploadedBy: 'zorium-platform',
          timestamp: new Date().toISOString(),
          mimeType
        }
      })
      formData1.append('pinataMetadata', pinataMetadata1)
      
      const pinataOptions1 = JSON.stringify({ cidVersion: 1 })
      formData1.append('pinataOptions', pinataOptions1)
      
      const imageResponse = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
        method: 'POST',
        headers: {
          'pinata_api_key': process.env.PINATA_API_KEY,
          'pinata_secret_api_key': process.env.PINATA_SECRET_KEY,
          ...formData1.getHeaders()
        },
        body: formData1
      })
      
      const imageResult: any = await imageResponse.json()
      console.log('Image upload result:', imageResult)
      
      if (!imageResponse.ok || !imageResult.IpfsHash) {
        throw new Error(`Image upload failed: ${JSON.stringify(imageResult)}`)
      }
      
      // Create metadata
      const nftMetadata = {
        name,
        description: description || '',
        image: `ipfs://${imageResult.IpfsHash}`,
        external_url,
        attributes,
        creator: creatorAddress,
        collection
      }
      
      // Upload metadata
      const formData2 = new (await import('form-data')).default()
      const metadataBuffer = Buffer.from(JSON.stringify(nftMetadata, null, 2), 'utf-8')
      formData2.append('file', metadataBuffer, {
        filename: 'metadata.json',
        contentType: 'application/json'
      })
      
      const pinataMetadata2 = JSON.stringify({
        name: `NFT Metadata - ${name}`,
        keyvalues: {
          uploadedBy: 'zorium-platform',
          timestamp: new Date().toISOString(),
          type: 'nft-metadata',
          creator: creatorAddress
        }
      })
      formData2.append('pinataMetadata', pinataMetadata2)
      
      const pinataOptions2 = JSON.stringify({ cidVersion: 1 })
      formData2.append('pinataOptions', pinataOptions2)
      
      const metadataResponse = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
        method: 'POST',
        headers: {
          'pinata_api_key': process.env.PINATA_API_KEY,
          'pinata_secret_api_key': process.env.PINATA_SECRET_KEY,
          ...formData2.getHeaders()
        },
        body: formData2
      })
      
      const metadataResult: any = await metadataResponse.json()
      console.log('Metadata upload result:', metadataResult)
      
      if (!metadataResponse.ok || !metadataResult.IpfsHash) {
        throw new Error(`Metadata upload failed: ${JSON.stringify(metadataResult)}`)
      }
      
      result = {
        imageURI: `ipfs://${imageResult.IpfsHash}`,
        metadataURI: `ipfs://${metadataResult.IpfsHash}`
      }
      
      console.log('IPFS upload successful:', result.metadataURI)
      
    } catch (directError) {
      console.error('Direct IPFS upload error:', directError)
      throw directError
    }
    
    console.log('IPFS upload successful:', result.metadataURI)
    
    const ipfsGateway = process.env.IPFS_GATEWAY || 'https://gateway.pinata.cloud/ipfs/'
    const ipfsToHttp = (uri: string) => {
      if (uri.startsWith('ipfs://')) {
        return ipfsGateway + uri.replace('ipfs://', '')
      }
      return uri
    }
    
    res.status(201).json({
      success: true,
      metadata: {
        name,
        description,
        creator: creatorAddress,
        imageURI: result.imageURI,
        metadataURI: result.metadataURI,
        imageUrl: ipfsToHttp(result.imageURI),
        metadataUrl: ipfsToHttp(result.metadataURI),
        attributes,
        collection,
        external_url
      },
      // Legacy compatibility
      ipfsHash: result.metadataURI.replace('ipfs://', ''),
      ipfsUrl: ipfsToHttp(result.metadataURI),
      message: 'NFT metadata uploaded to IPFS successfully'
    })
    
  } catch (error) {
    console.error('IPFS upload error:', error)
    res.status(503).json({
      success: false,
      error: 'IPFS upload failed',
      message: error.message || 'Unknown error',
      timestamp: new Date().toISOString()
    })
  }
})

// Lazy load routes to avoid initialization issues
app.use('/api/auth', (req, res, next) => {
  import('../src/routes/auth').then(module => {
    const router = module.default
    router(req, res, next)
  }).catch(next)
})

app.use('/api/users', (req, res, next) => {
  import('../src/routes/users').then(module => {
    const router = module.default
    router(req, res, next)
  }).catch(next)
})

app.use('/api/upload', (req, res, next) => {
  import('../src/routes/upload').then(module => {
    const router = module.default
    router(req, res, next)
  }).catch(next)
})

app.use('/api/collections', (req, res, next) => {
  import('../src/routes/collections').then(module => {
    const router = module.default
    router(req, res, next)
  }).catch(next)
})

app.use('/api/nfts', (req, res, next) => {
  import('../src/routes/nfts').then(module => {
    const router = module.default
    router(req, res, next)
  }).catch(next)
})

app.use('/api/analytics', (req, res, next) => {
  import('../src/routes/analytics').then(module => {
    const router = module.default
    router(req, res, next)
  }).catch(next)
})

app.use('/api/search', (req, res, next) => {
  import('../src/routes/search').then(module => {
    const router = module.default
    router(req, res, next)
  }).catch(next)
})

// v1 prefixed routes
app.use('/api/v1/auth', (req, res, next) => {
  import('../src/routes/auth').then(module => {
    const router = module.default
    router(req, res, next)
  }).catch(next)
})

app.use('/api/v1/users', (req, res, next) => {
  import('../src/routes/users').then(module => {
    const router = module.default
    router(req, res, next)
  }).catch(next)
})

app.use('/api/v1/upload', (req, res, next) => {
  import('../src/routes/upload').then(module => {
    const router = module.default
    router(req, res, next)
  }).catch(next)
})

app.use('/api/v1/collections', (req, res, next) => {
  import('../src/routes/collections').then(module => {
    const router = module.default
    router(req, res, next)
  }).catch(next)
})

app.use('/api/v1/nfts', (req, res, next) => {
  import('../src/routes/nfts').then(module => {
    const router = module.default
    router(req, res, next)
  }).catch(next)
})

app.use('/api/v1/analytics', (req, res, next) => {
  import('../src/routes/analytics').then(module => {
    const router = module.default
    router(req, res, next)
  }).catch(next)
})

app.use('/api/v1/search', (req, res, next) => {
  import('../src/routes/search').then(module => {
    const router = module.default
    router(req, res, next)
  }).catch(next)
})

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.originalUrl} not found`,
    timestamp: new Date().toISOString(),
    availableEndpoints: [
      'GET /health',
      'GET /api/auth/nonce/:address',
      'POST /api/auth/login',
      'GET /api/auth/session',
      'GET /api/users/balance/:address',
      'POST /api/upload/nft-metadata',
      'GET /api/v1/analytics/stats',
      'GET /api/v1/nfts',
      'GET /api/collections/user/:address',
      'GET /api/collections/blockchain/stats'
    ]
  })
})

// Error handling middleware
app.use((error: any, req: any, res: any, next: any) => {
  console.error('API Error:', error)
  res.status(500).json({
    error: 'Internal Server Error',
    message: error.message,
    timestamp: new Date().toISOString()
  })
})

export default app