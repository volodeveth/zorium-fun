import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import compression from 'compression'
import dotenv from 'dotenv'
import { corsConfig } from './middleware/cors'
import uploadRoutes from './routes/upload'

// Load environment variables
dotenv.config()

const app = express()
const PORT = process.env.PORT || 3001

// Middleware
app.use(helmet())
app.use(cors(corsConfig))
app.use(compression())
app.use(morgan('combined'))
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    message: 'Zorium Backend API is running',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    version: '1.0.0'
  })
})

// Auth endpoints (mock)
app.get('/api/auth/nonce/:address', (req, res) => {
  const { address } = req.params
  res.json({
    nonce: Math.random().toString(36).substring(7),
    address: address.toLowerCase(),
    message: 'Mock nonce for development'
  })
})

app.post('/api/auth/login', (req, res) => {
  res.json({
    success: true,
    token: 'mock_token_' + Date.now(),
    user: {
      id: 'mock_user_1',
      address: req.body.address?.toLowerCase() || '',
      username: null,
      email: null
    },
    message: 'Mock login for development'
  })
})

app.get('/api/auth/session', (req, res) => {
  res.json({
    success: true,
    user: {
      id: 'mock_user_1',
      address: '0x0000000000000000000000000000000000000000',
      username: null,
      email: null
    },
    message: 'Mock session for development'
  })
})

// User endpoints (mock)
app.get('/api/users/balance/:address', (req, res) => {
  res.json({
    balance: '0',
    address: req.params.address.toLowerCase(),
    message: 'Mock balance for development'
  })
})

// Real IPFS upload routes
app.post('/api/upload/nft-metadata', async (req, res) => {
  try {
    console.log('NFT metadata upload request received')
    
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
    const { ipfsService } = await import('./services/ipfsService')
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
    
    // Upload to IPFS
    const result = await ipfsService.createNFTMetadata({
      name,
      description: description || '',
      imageBuffer,
      imageFilename: filename,
      imageMimeType: mimeType,
      creator: creatorAddress,
      attributes: attributes && attributes.length > 0 ? attributes : undefined,
      collection,
      external_url
    })
    
    console.log('IPFS upload successful:', result.metadataURI)
    
    res.status(201).json({
      success: true,
      metadata: {
        name,
        description,
        creator: creatorAddress,
        imageURI: result.imageURI,
        metadataURI: result.metadataURI,
        imageUrl: ipfsService.ipfsToHttp(result.imageURI),
        metadataUrl: ipfsService.ipfsToHttp(result.metadataURI),
        attributes,
        collection,
        external_url
      },
      // Legacy compatibility
      ipfsHash: result.metadataURI.replace('ipfs://', ''),
      ipfsUrl: ipfsService.ipfsToHttp(result.metadataURI),
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

// API endpoints (simplified)
app.get('/api/v1/analytics/stats', (req, res) => {
  res.json({
    stats: {
      totalUsers: 0,
      totalNFTs: 0,
      totalTransactions: 0,
      message: 'Database not connected yet'
    }
  })
})

app.get('/api/v1/nfts', (req, res) => {
  res.json({
    nfts: [],
    message: 'NFT endpoints available but database not connected yet',
    pagination: {
      page: 1,
      limit: 20,
      total: 0
    }
  })
})

app.get('/api/nfts/trending', (req, res) => {
  res.json({
    nfts: [],
    message: 'Trending NFTs endpoint available but database not connected yet'
  })
})

app.get('/api/users', (req, res) => {
  res.json({
    users: [],
    message: 'User endpoints available but database not connected yet'
  })
})

// ============ ERC-1155 MOCK ENDPOINTS (v2.0) ============

// Collections blockchain stats - REAL BLOCKCHAIN DATA
app.get('/api/collections/blockchain/stats', async (req, res) => {
  try {
    const { chainId = 8453 } = req.query
    
    // Import ethers and contract config
    const { ethers } = await import('ethers')
    
    // Contract addresses
    const FACTORY_ABI = [
      "function totalCollections() external view returns (uint256)"
    ]
    
    const CONTRACTS = {
      8453: {
        name: 'Base',
        rpcUrl: 'https://mainnet.base.org',
        blockExplorer: 'https://basescan.org',
        isMainNetwork: true,
        factory: '0x8ec96033C74Eec29a4D45bA86986922Ede69C27d'
      },
      7777777: {
        name: 'Zora', 
        rpcUrl: 'https://rpc.zora.energy',
        blockExplorer: 'https://explorer.zora.energy',
        isMainNetwork: false,
        factory: '0x0De8482fA3b9ba69D7A0d139c7c8a6FC82951fcd'
      }
    }
    
    const networkConfig = CONTRACTS[Number(chainId)]
    if (!networkConfig) {
      return res.status(400).json({
        error: 'Unsupported chain ID',
        supportedChains: Object.keys(CONTRACTS)
      })
    }
    
    // Try to get real data from blockchain
    try {
      const provider = new ethers.JsonRpcProvider(networkConfig.rpcUrl)
      const factoryContract = new ethers.Contract(
        networkConfig.factory, 
        FACTORY_ABI, 
        provider
      )
      
      const totalCollections = await factoryContract.totalCollections()
      
      res.json({
        chainId: Number(chainId),
        totalCollections: Number(totalCollections),
        networkConfig: {
          chainId: Number(chainId),
          name: networkConfig.name,
          rpcUrl: networkConfig.rpcUrl,
          blockExplorer: networkConfig.blockExplorer,
          isMainNetwork: networkConfig.isMainNetwork
        },
        factory: networkConfig.factory,
        message: 'Real blockchain data - Factory contract connected!'
      })
      
    } catch (blockchainError) {
      console.error('Blockchain call failed:', blockchainError)
      
      // Fallback to mock data if blockchain call fails
      res.json({
        chainId: Number(chainId),
        totalCollections: 0,
        networkConfig: {
          chainId: Number(chainId),
          name: networkConfig.name,
          rpcUrl: networkConfig.rpcUrl,
          blockExplorer: networkConfig.blockExplorer,
          isMainNetwork: networkConfig.isMainNetwork
        },
        factory: networkConfig.factory,
        message: 'Factory contract not responding - using fallback data',
        error: blockchainError.message
      })
    }
    
  } catch (error) {
    console.error('Stats endpoint error:', error)
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    })
  }
})

// Create ERC-1155 collection
app.post('/api/collections/create', (req, res) => {
  try {
    const { name, symbol, description, chainId, isPersonal = false } = req.body
    
    if (!name || !symbol || !chainId) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'name, symbol, and chainId are required'
      })
    }
    
    // Mock collection creation response
    res.status(201).json({
      success: true,
      message: 'Collection created successfully (mock)',
      collection: {
        id: `mock-${Date.now()}`,
        name,
        symbol,
        description: description || null,
        contractAddress: `0x${Math.random().toString(16).substring(2, 42)}`,
        chainId: Number(chainId),
        isPersonal,
        createdAt: new Date().toISOString(),
        creator: '0x0000000000000000000000000000000000000000'
      }
    })
    
  } catch (error) {
    console.error('Collection creation error:', error)
    res.status(500).json({
      success: false,
      error: 'Collection creation failed',
      message: error.message
    })
  }
})

// Create ERC-1155 token
app.post('/api/nfts/tokens', (req, res) => {
  try {
    const { collectionAddress, chainId, name, tokenURI, customPrice } = req.body
    
    if (!collectionAddress || !chainId || !name || !tokenURI) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'collectionAddress, chainId, name, and tokenURI are required'
      })
    }
    
    // Mock token creation response
    res.status(201).json({
      success: true,
      message: 'Token created successfully (mock)',
      token: {
        id: `token-${Date.now()}`,
        tokenId: '1',
        collectionAddress,
        chainId: Number(chainId),
        name,
        tokenURI,
        mintPrice: customPrice ? parseFloat(customPrice) : 0.000111,
        isCustomPrice: !!customPrice,
        totalMinted: 1,
        status: 'Created',
        createdAt: new Date().toISOString()
      }
    })
    
  } catch (error) {
    console.error('Token creation error:', error)
    res.status(500).json({
      success: false,
      error: 'Token creation failed',
      message: error.message
    })
  }
})

// Get token info
app.get('/api/nfts/tokens/:collectionAddress/:tokenId/info', (req, res) => {
  const { collectionAddress, tokenId } = req.params
  
  res.json({
    tokenId: Number(tokenId),
    totalSupply: 1500,
    isMintingActive: true,
    countdownTimeLeft: 172800, // 48 hours
    status: 'FirstMinted',
    mintPrice: '0.000111',
    isCustomPrice: false,
    finalCountdownStart: 0,
    creator: '0x1234567890123456789012345678901234567890',
    firstMinter: '0x0987654321098765432109876543210987654321',
    referrer: '0x0000000000000000000000000000000000000000',
    message: 'Mock token info - ERC-1155 integration ready'
  })
})

// Get collections by creator - REAL BLOCKCHAIN DATA
app.get('/api/collections/user/:address', async (req, res) => {
  try {
    const { address } = req.params
    const { chainId = 8453 } = req.query
    
    if (!address.match(/^0x[a-fA-F0-9]{40}$/)) {
      return res.status(400).json({
        error: 'Invalid Ethereum address',
        address
      })
    }
    
    // Import ethers and contract config  
    const { ethers } = await import('ethers')
    
    const FACTORY_ABI = [
      "function getCollectionsByCreator(address creator) external view returns (address[])",
      "function getCollectionInfo(address collection) external view returns (tuple(address creator, string name, string symbol, bool isPersonal, uint256 createdAt, uint256 totalTokens))"
    ]
    
    const CONTRACTS = {
      8453: {
        name: 'Base',
        rpcUrl: 'https://mainnet.base.org', 
        factory: '0x8ec96033C74Eec29a4D45bA86986922Ede69C27d'
      },
      7777777: {
        name: 'Zora',
        rpcUrl: 'https://rpc.zora.energy',
        factory: '0x0De8482fA3b9ba69D7A0d139c7c8a6FC82951fcd'
      }
    }
    
    const networkConfig = CONTRACTS[Number(chainId)]
    if (!networkConfig) {
      return res.status(400).json({
        error: 'Unsupported chain ID',
        supportedChains: Object.keys(CONTRACTS)
      })
    }
    
    try {
      const provider = new ethers.JsonRpcProvider(networkConfig.rpcUrl)
      const factoryContract = new ethers.Contract(
        networkConfig.factory,
        FACTORY_ABI,
        provider
      )
      
      // Get collections addresses for this creator
      const collectionAddresses = await factoryContract.getCollectionsByCreator(address)
      
      // Get detailed info for each collection
      const collections = []
      for (const collectionAddress of collectionAddresses) {
        try {
          const info = await factoryContract.getCollectionInfo(collectionAddress)
          collections.push({
            contractAddress: collectionAddress,
            creator: info[0],
            name: info[1], 
            symbol: info[2],
            isPersonal: info[3],
            createdAt: Number(info[4]),
            totalTokens: Number(info[5])
          })
        } catch (infoError) {
          console.error(`Failed to get info for collection ${collectionAddress}:`, infoError)
        }
      }
      
      res.json({
        address,
        chainId: Number(chainId),
        totalCollections: collections.length,
        collections,
        message: 'Real blockchain data - Collections retrieved successfully!'
      })
      
    } catch (blockchainError) {
      console.error('Blockchain call failed:', blockchainError)
      
      res.json({
        address,
        chainId: Number(chainId), 
        totalCollections: 0,
        collections: [],
        message: 'Factory contract not responding - no collections found',
        error: blockchainError.message
      })
    }
    
  } catch (error) {
    console.error('Collections endpoint error:', error)
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    })
  }
})

app.get('/api/search', (req, res) => {
  res.json({
    results: {
      users: [],
      nfts: [],
      collections: []
    },
    message: 'Search endpoints available but database not connected yet'
  })
})

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.originalUrl} not found`,
    timestamp: new Date().toISOString(),
    availableEndpoints: [
      'GET /health',
      'GET /api/stats',
      'GET /api/nfts',
      'GET /api/nfts/trending',
      'GET /api/users',
      'GET /api/search'
    ]
  })
})

// Error handling
app.use((error: any, req: any, res: any, next: any) => {
  console.error('Error:', error)
  res.status(500).json({
    error: 'Internal Server Error',
    message: error.message,
    timestamp: new Date().toISOString()
  })
})

// Export for Vercel
export default app

// Start server locally if not in serverless environment
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`)
    console.log(`📊 Health check: http://localhost:${PORT}/health`)
  })
}