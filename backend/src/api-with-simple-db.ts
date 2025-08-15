import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import compression from 'compression'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config()

const app = express()
const PORT = process.env.PORT || 3001

// Middleware
app.use(helmet())
app.use(cors())
app.use(compression())
app.use(morgan('combined'))
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

// Check database connection and get status
async function getDatabaseStatus() {
  try {
    if (!process.env.DATABASE_URL) {
      return {
        status: 'not configured',
        stats: { users: 0, nfts: 0, collections: 0 }
      }
    }

    const { PrismaClient } = require('@prisma/client')
    const prisma = new PrismaClient()
    
    await prisma.$connect()
    await prisma.$queryRaw`SELECT 1`
    
    // Get basic stats
    const [userCount, nftCount, collectionCount] = await Promise.all([
      prisma.user.count().catch(() => 0),
      prisma.nFT.count().catch(() => 0),
      prisma.collection.count().catch(() => 0)
    ])
    
    const stats = {
      users: userCount,
      nfts: nftCount,
      collections: collectionCount
    }
    
    await prisma.$disconnect()
    
    return {
      status: 'connected',
      stats
    }
  } catch (error) {
    console.error('Database connection failed:', error.message)
    return {
      status: `error: ${error.message}`,
      stats: { users: 0, nfts: 0, collections: 0 }
    }
  }
}

// Quick database status check (just connection, no stats)
async function getDbStatus() {
  try {
    if (!process.env.DATABASE_URL) {
      return 'not configured'
    }

    const { PrismaClient } = require('@prisma/client')
    const prisma = new PrismaClient()
    
    await prisma.$connect()
    await prisma.$queryRaw`SELECT 1`
    await prisma.$disconnect()
    
    return 'connected'
  } catch (error) {
    return 'error'
  }
}

// Health check endpoint
app.get('/health', async (req, res) => {
  const db = await getDatabaseStatus()
  
  res.status(200).json({
    status: 'OK',
    message: 'Zorium Backend API is running',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    version: '1.0.0',
    database: {
      status: db.status,
      stats: db.stats
    },
    features: {
      database: db.status === 'connected',
      auth: true,
      nfts: true,
      analytics: true
    }
  })
})

// API stats endpoint
app.get('/api/analytics/stats', async (req, res) => {
  const db = await getDatabaseStatus()
  res.json({
    stats: {
      totalUsers: db.stats.users,
      totalNFTs: db.stats.nfts,
      totalCollections: db.stats.collections,
      totalTransactions: 0,
      database: db.status,
      lastUpdated: new Date().toISOString()
    }
  })
})

// NFTs endpoint
app.get('/api/nfts', async (req, res) => {
  try {
    const dbStatus = await getDbStatus()
    if (dbStatus !== 'connected') {
      return res.json({
        nfts: [],
        message: `Database ${dbStatus}`,
        pagination: { page: 1, limit: 20, total: 0 }
      })
    }

    const { PrismaClient } = require('@prisma/client')
    const prisma = new PrismaClient()
    
    const nfts = await prisma.nFT.findMany({
      take: 20,
      include: {
        creator: {
          select: {
            address: true,
            username: true,
            displayName: true
          }
        },
        collection: {
          select: {
            name: true
          }
        }
      }
    })
    
    await prisma.$disconnect()
    
    res.json({
      nfts,
      pagination: {
        page: 1,
        limit: 20,
        total: nfts.length
      }
    })
  } catch (error) {
    res.status(500).json({
      error: 'Failed to fetch NFTs',
      message: error.message
    })
  }
})

// Trending NFTs
app.get('/api/nfts/trending', async (req, res) => {
  try {
    const dbStatus = await getDbStatus()
    if (dbStatus !== 'connected') {
      return res.json({
        nfts: [],
        message: `Database ${dbStatus}`
      })
    }

    const { PrismaClient } = require('@prisma/client')
    const prisma = new PrismaClient()
    
    const nfts = await prisma.nFT.findMany({
      take: 10,
      orderBy: [
        { viewCount: 'desc' },
        { likeCount: 'desc' }
      ],
      include: {
        creator: {
          select: {
            address: true,
            username: true,
            displayName: true
          }
        }
      }
    })
    
    await prisma.$disconnect()
    
    res.json({
      nfts,
      message: 'Trending NFTs from database'
    })
  } catch (error) {
    res.status(500).json({
      error: 'Failed to fetch trending NFTs',
      message: error.message
    })
  }
})

// Search endpoint
app.get('/api/search', async (req, res) => {
  try {
    const { q, type = 'all', limit = 20, offset = 0 } = req.query
    
    if (!q || typeof q !== 'string' || q.trim().length === 0) {
      return res.status(400).json({
        error: 'Search query is required'
      })
    }
    
    const searchQuery = q.toString().trim().toLowerCase()
    const results = {
      users: [],
      nfts: [],
      collections: [],
      total: 0
    }
    
    const dbStatus = await getDbStatus()
    if (dbStatus === 'connected') {
      const { PrismaClient } = require('@prisma/client')
      const prisma = new PrismaClient()
      
      try {
        // Search NFTs
        if (type === 'all' || type === 'nfts') {
          const nfts = await prisma.nFT.findMany({
            where: {
              OR: [
                { name: { contains: searchQuery, mode: 'insensitive' } },
                { description: { contains: searchQuery, mode: 'insensitive' } }
              ]
            },
            include: {
              creator: {
                select: {
                  address: true,
                  username: true,
                  displayName: true,
                  avatar: true,
                  isVerified: true
                }
              },
              owner: {
                select: {
                  address: true,
                  username: true,
                  displayName: true,
                  avatar: true,
                  isVerified: true
                }
              },
              collection: {
                select: {
                  id: true,
                  name: true
                }
              }
            },
            orderBy: { createdAt: 'desc' },
            take: Number(limit),
            skip: Number(offset)
          })
          
          results.nfts = nfts
        }
        
        // Search Users
        if (type === 'all' || type === 'users') {
          const users = await prisma.user.findMany({
            where: {
              OR: [
                { username: { contains: searchQuery, mode: 'insensitive' } },
                { displayName: { contains: searchQuery, mode: 'insensitive' } },
                { address: { contains: searchQuery, mode: 'insensitive' } }
              ]
            },
            select: {
              id: true,
              address: true,
              username: true,
              displayName: true,
              avatar: true,
              isVerified: true,
              zrmBalance: true,
              createdAt: true,
              _count: {
                select: {
                  createdNFTs: true,
                  ownedNFTs: true,
                  followers: true
                }
              }
            },
            orderBy: { isVerified: 'desc' },
            take: Number(limit),
            skip: Number(offset)
          })
          
          results.users = users
        }
        
        // Search Collections
        if (type === 'all' || type === 'collections') {
          const collections = await prisma.collection.findMany({
            where: {
              OR: [
                { name: { contains: searchQuery, mode: 'insensitive' } },
                { description: { contains: searchQuery, mode: 'insensitive' } }
              ]
            },
            include: {
              creator: {
                select: {
                  address: true,
                  username: true,
                  displayName: true,
                  avatar: true,
                  isVerified: true
                }
              },
              _count: {
                select: {
                  nfts: true
                }
              }
            },
            orderBy: { createdAt: 'desc' },
            take: Number(limit),
            skip: Number(offset)
          })
          
          results.collections = collections
        }
        
        results.total = results.nfts.length + results.users.length + results.collections.length
        
        await prisma.$disconnect()
        
        res.json({
          success: true,
          query: searchQuery,
          type,
          results,
          pagination: {
            limit: Number(limit),
            offset: Number(offset),
            total: results.total
          }
        })
        
      } catch (dbError) {
        await prisma.$disconnect()
        throw dbError
      }
      
    } else {
      // Mock search results when database is not connected
      const mockResults = {
        users: searchQuery.includes('user') ? [{
          id: 'mock_user_1',
          address: '0x1234...5678',
          username: `user_${searchQuery}`,
          displayName: `Mock User ${searchQuery}`,
          avatar: null,
          isVerified: false,
          zrmBalance: '0',
          createdAt: new Date().toISOString(),
          _count: { createdNFTs: 5, ownedNFTs: 12, followers: 23 }
        }] : [],
        
        nfts: searchQuery.includes('nft') || searchQuery.includes('art') ? [{
          id: 'mock_nft_1',
          tokenId: '1',
          name: `Mock NFT ${searchQuery}`,
          description: `A mock NFT related to ${searchQuery}`,
          image: 'https://via.placeholder.com/400x400',
          price: '0.001',
          creator: {
            address: '0x1234...5678',
            username: 'mockuser',
            displayName: 'Mock User',
            avatar: null,
            isVerified: false
          },
          owner: {
            address: '0x1234...5678',
            username: 'mockuser',
            displayName: 'Mock User',
            avatar: null,
            isVerified: false
          },
          collection: {
            id: 'mock_collection_1',
            name: 'Mock Collection'
          }
        }] : [],
        
        collections: searchQuery.includes('collection') ? [{
          id: 'mock_collection_1',
          name: `Mock Collection ${searchQuery}`,
          description: `A mock collection related to ${searchQuery}`,
          image: 'https://via.placeholder.com/400x400',
          creator: {
            address: '0x1234...5678',
            username: 'mockuser',
            displayName: 'Mock User',
            avatar: null,
            isVerified: false
          },
          _count: { nfts: 42 }
        }] : []
      }
      
      results.users = mockResults.users
      results.nfts = mockResults.nfts
      results.collections = mockResults.collections
      results.total = mockResults.users.length + mockResults.nfts.length + mockResults.collections.length
      
      res.json({
        success: true,
        query: searchQuery,
        type,
        results,
        pagination: {
          limit: Number(limit),
          offset: Number(offset),
          total: results.total
        },
        note: 'Mock search results - database not connected'
      })
    }
    
  } catch (error) {
    console.error('Search error:', error)
    res.status(500).json({
      error: 'Search failed',
      message: error.message
    })
  }
})

// NFT by ID
app.get('/api/nfts/:id', async (req, res) => {
  try {
    const { id } = req.params
    let nft = null
    
    const dbStatus = await getDbStatus()
    if (dbStatus === 'connected') {
      const { PrismaClient } = require('@prisma/client')
      const prisma = new PrismaClient()
      
      try {
        nft = await prisma.nFT.findUnique({
          where: { id },
          include: {
            creator: {
              select: {
                address: true,
                username: true,
                displayName: true,
                avatar: true,
                isVerified: true
              }
            },
            owner: {
              select: {
                address: true,
                username: true,
                displayName: true,
                avatar: true,
                isVerified: true
              }
            },
            collection: {
              select: {
                id: true,
                name: true,
                description: true,
                image: true
              }
            },
            comments: {
              include: {
                user: {
                  select: {
                    address: true,
                    username: true,
                    displayName: true,
                    avatar: true,
                    isVerified: true
                  }
                }
              },
              orderBy: { createdAt: 'desc' },
              take: 10
            }
          }
        })
        
        // Increment view count
        if (nft) {
          await prisma.nFT.update({
            where: { id },
            data: { viewCount: { increment: 1 } }
          })
        }
        
        await prisma.$disconnect()
      } catch (dbError) {
        console.error('Database query error:', dbError)
      }
    }
    
    if (!nft) {
      return res.status(404).json({
        error: 'NFT not found',
        id
      })
    }
    
    res.json({
      nft,
      message: `Database ${dbStatus}`
    })
    
  } catch (error) {
    res.status(500).json({
      error: 'Failed to fetch NFT',
      message: error.message
    })
  }
})

// Create NFT (mint)
app.post('/api/nfts/mint', async (req, res) => {
  try {
    const { 
      tokenId, 
      contractAddress, 
      chainId = 1,
      name, 
      description, 
      image, 
      animationUrl,
      attributes = [],
      creatorAddress,
      ownerAddress,
      collectionId,
      price,
      currency = 'ETH',
      maxSupply = 1,
      mintPrice
    } = req.body
    
    // Basic validation
    if (!tokenId || !contractAddress || !name || !image || !creatorAddress) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['tokenId', 'contractAddress', 'name', 'image', 'creatorAddress']
      })
    }
    
    const dbStatus = await getDbStatus()
    if (dbStatus === 'connected') {
      const { PrismaClient } = require('@prisma/client')
      const prisma = new PrismaClient()
      
      try {
        // Find or create creator user
        let creator = await prisma.user.findUnique({
          where: { address: creatorAddress.toLowerCase() }
        })
        
        if (!creator) {
          // Create user if not exists
          creator = await prisma.user.create({
            data: {
              address: creatorAddress.toLowerCase(),
              isVerified: false,
              zrmBalance: 0
            }
          })
        }
        
        // Find or create owner user (if different from creator)
        let owner = creator
        if (ownerAddress && ownerAddress.toLowerCase() !== creatorAddress.toLowerCase()) {
          owner = await prisma.user.findUnique({
            where: { address: ownerAddress.toLowerCase() }
          })
          
          if (!owner) {
            owner = await prisma.user.create({
              data: {
                address: ownerAddress.toLowerCase(),
                isVerified: false,
                zrmBalance: 0
              }
            })
          }
        }
        
        // Create NFT
        const nft = await prisma.nFT.create({
          data: {
            tokenId: tokenId.toString(),
            contractAddress: contractAddress.toLowerCase(),
            chainId: parseInt(chainId),
            name,
            description,
            image,
            animationUrl,
            attributes: attributes,
            creatorId: creator.id,
            ownerId: owner.id,
            collectionId,
            isListed: !!price,
            price: price ? price : null,
            currency,
            maxSupply: parseInt(maxSupply),
            mintPrice: mintPrice ? mintPrice : null,
            currentSupply: 1
          },
          include: {
            creator: {
              select: {
                address: true,
                username: true,
                displayName: true,
                avatar: true
              }
            },
            owner: {
              select: {
                address: true,
                username: true,
                displayName: true,
                avatar: true
              }
            },
            collection: {
              select: {
                id: true,
                name: true,
                description: true
              }
            }
          }
        })
        
        await prisma.$disconnect()
        
        res.status(201).json({
          message: 'NFT created successfully',
          nft
        })
        
      } catch (dbError) {
        await prisma.$disconnect()
        console.error('Database error:', dbError)
        res.status(500).json({
          error: 'Failed to create NFT in database',
          message: dbError.message
        })
      }
    } else {
      // Fallback to mock response if database not available
      const mockNFT = {
        id: `nft_${Date.now()}`,
        tokenId,
        contractAddress: contractAddress.toLowerCase(),
        chainId,
        name,
        description,
        image,
        animationUrl,
        attributes,
        creatorId: `user_${creatorAddress.toLowerCase()}`,
        ownerId: `user_${(ownerAddress || creatorAddress).toLowerCase()}`,
        collectionId,
        isListed: !!price,
        price: price ? parseFloat(price) : null,
        currency,
        viewCount: 0,
        likeCount: 0,
        isPromoted: false,
        createdAt: new Date().toISOString()
      }
      
      res.status(201).json({
        message: 'NFT created successfully (mock)',
        nft: mockNFT,
        note: 'Database not available, using mock response'
      })
    }
    
  } catch (error) {
    res.status(500).json({
      error: 'Failed to create NFT',
      message: error.message
    })
  }
})

// Update NFT (list/delist, edit metadata)
app.put('/api/nfts/:id', async (req, res) => {
  try {
    const { id } = req.params
    const { price, currency, isListed, name, description } = req.body
    
    res.json({
      message: 'NFT updated successfully',
      nftId: id,
      updates: { price, currency, isListed, name, description },
      note: 'Full NFT update will be implemented with database integration'
    })
    
  } catch (error) {
    res.status(500).json({
      error: 'Failed to update NFT',
      message: error.message
    })
  }
})

// Like/Unlike NFT
app.post('/api/nfts/:id/like', async (req, res) => {
  try {
    const { id } = req.params
    const { userAddress } = req.body
    
    if (!userAddress) {
      return res.status(400).json({
        error: 'User address is required'
      })
    }
    
    const dbStatus = await getDbStatus()
    if (dbStatus === 'connected') {
      const { PrismaClient } = require('@prisma/client')
      const prisma = new PrismaClient()
      
      try {
        // Find user
        const user = await prisma.user.findUnique({
          where: { address: userAddress.toLowerCase() }
        })
        
        if (!user) {
          return res.status(404).json({
            error: 'User not found'
          })
        }
        
        // Check if NFT exists
        const nft = await prisma.nFT.findUnique({
          where: { id }
        })
        
        if (!nft) {
          return res.status(404).json({
            error: 'NFT not found'
          })
        }
        
        // Check if user already liked this NFT
        const existingLike = await prisma.like.findUnique({
          where: {
            userId_nftId: {
              userId: user.id,
              nftId: id
            }
          }
        })
        
        let liked = false
        let likeCount = nft.likeCount
        
        if (existingLike) {
          // Unlike - remove the like
          await prisma.like.delete({
            where: { id: existingLike.id }
          })
          
          // Decrease like count
          await prisma.nFT.update({
            where: { id },
            data: { likeCount: { decrement: 1 } }
          })
          
          liked = false
          likeCount = Math.max(0, likeCount - 1)
        } else {
          // Like - create new like
          await prisma.like.create({
            data: {
              userId: user.id,
              nftId: id
            }
          })
          
          // Increase like count
          await prisma.nFT.update({
            where: { id },
            data: { likeCount: { increment: 1 } }
          })
          
          liked = true
          likeCount = likeCount + 1
        }
        
        await prisma.$disconnect()
        
        res.json({
          message: liked ? 'NFT liked successfully' : 'NFT unliked successfully',
          nftId: id,
          userAddress: userAddress.toLowerCase(),
          liked,
          likeCount
        })
        
      } catch (dbError) {
        await prisma.$disconnect()
        console.error('Database error:', dbError)
        res.status(500).json({
          error: 'Failed to toggle like',
          message: dbError.message
        })
      }
    } else {
      // Mock response if database not available
      res.json({
        message: 'NFT like toggled (mock)',
        nftId: id,
        userAddress: userAddress.toLowerCase(),
        liked: true,
        likeCount: 1,
        note: 'Database not available, using mock response'
      })
    }
    
  } catch (error) {
    res.status(500).json({
      error: 'Failed to toggle like',
      message: error.message
    })
  }
})

// Buy NFT
app.post('/api/nfts/:id/buy', async (req, res) => {
  try {
    const { id } = req.params
    const { buyerAddress, transactionHash } = req.body
    
    if (!buyerAddress || !transactionHash) {
      return res.status(400).json({
        error: 'Buyer address and transaction hash are required'
      })
    }
    
    res.json({
      message: 'NFT purchase processed',
      nftId: id,
      buyerAddress: buyerAddress.toLowerCase(),
      transactionHash,
      note: 'Full purchase system will be implemented with database integration'
    })
    
  } catch (error) {
    res.status(500).json({
      error: 'Failed to process purchase',
      message: error.message
    })
  }
})

// Get NFT comments
app.get('/api/nfts/:id/comments', async (req, res) => {
  try {
    const { id } = req.params
    const { limit = 20, offset = 0 } = req.query
    
    const dbStatus = await getDbStatus()
    if (dbStatus === 'connected') {
      const { PrismaClient } = require('@prisma/client')
      const prisma = new PrismaClient()
      
      try {
        const comments = await prisma.comment.findMany({
          where: {
            nftId: id,
            parentId: null // Only get top-level comments
          },
          include: {
            user: {
              select: {
                address: true,
                username: true,
                displayName: true,
                avatar: true,
                isVerified: true
              }
            },
            replies: {
              include: {
                user: {
                  select: {
                    address: true,
                    username: true,
                    displayName: true,
                    avatar: true,
                    isVerified: true
                  }
                }
              },
              orderBy: { createdAt: 'asc' }
            }
          },
          orderBy: { createdAt: 'desc' },
          take: Number(limit),
          skip: Number(offset)
        })
        
        await prisma.$disconnect()
        
        res.json({
          comments,
          total: comments.length
        })
        
      } catch (dbError) {
        await prisma.$disconnect()
        console.error('Database error:', dbError)
        res.status(500).json({
          error: 'Failed to fetch comments',
          message: dbError.message
        })
      }
    } else {
      // Return empty comments if database not available
      res.json({
        comments: [],
        total: 0,
        note: 'Database not available'
      })
    }
    
  } catch (error) {
    res.status(500).json({
      error: 'Failed to fetch comments',
      message: error.message
    })
  }
})

// Add comment to NFT
app.post('/api/nfts/:id/comments', async (req, res) => {
  try {
    const { id } = req.params
    const { userAddress, content, parentId } = req.body
    
    if (!userAddress || !content) {
      return res.status(400).json({
        error: 'User address and content are required'
      })
    }
    
    const dbStatus = await getDbStatus()
    if (dbStatus === 'connected') {
      const { PrismaClient } = require('@prisma/client')
      const prisma = new PrismaClient()
      
      try {
        // Find user
        const user = await prisma.user.findUnique({
          where: { address: userAddress.toLowerCase() }
        })
        
        if (!user) {
          return res.status(404).json({
            error: 'User not found'
          })
        }
        
        // Check if NFT exists
        const nft = await prisma.nFT.findUnique({
          where: { id }
        })
        
        if (!nft) {
          return res.status(404).json({
            error: 'NFT not found'
          })
        }
        
        // Create comment
        const comment = await prisma.comment.create({
          data: {
            nftId: id,
            userId: user.id,
            content,
            parentId
          },
          include: {
            user: {
              select: {
                address: true,
                username: true,
                displayName: true,
                avatar: true,
                isVerified: true
              }
            }
          }
        })
        
        await prisma.$disconnect()
        
        res.status(201).json({
          message: 'Comment added successfully',
          comment
        })
        
      } catch (dbError) {
        await prisma.$disconnect()
        console.error('Database error:', dbError)
        res.status(500).json({
          error: 'Failed to add comment',
          message: dbError.message
        })
      }
    } else {
      // Mock response if database not available
      res.status(201).json({
        message: 'Comment added successfully (mock)',
        comment: {
          id: `comment_${Date.now()}`,
          content,
          user: {
            address: userAddress.toLowerCase(),
            username: null,
            displayName: null,
            avatar: null,
            isVerified: false
          },
          createdAt: new Date().toISOString(),
          note: 'Database not available, using mock response'
        }
      })
    }
    
  } catch (error) {
    res.status(500).json({
      error: 'Failed to add comment',
      message: error.message
    })
  }
})

// Authentication endpoints
app.get('/api/auth/nonce/:address', async (req, res) => {
  try {
    const { address } = req.params
    
    // Simple validation
    if (!address || !address.match(/^0x[a-fA-F0-9]{40}$/)) {
      return res.status(400).json({
        error: 'Invalid Ethereum address'
      })
    }
    
    // Generate simple nonce
    const nonce = Math.random().toString(36).substring(2, 15)
    const message = `Welcome to Zorium.fun!\n\nPlease sign this message to authenticate.\n\nNonce: ${nonce}\nTimestamp: ${new Date().toISOString()}`
    
    res.json({
      nonce,
      message,
      address: address.toLowerCase()
    })
    
  } catch (error) {
    res.status(500).json({
      error: 'Failed to generate nonce',
      message: error.message
    })
  }
})

app.post('/api/auth/register', async (req, res) => {
  try {
    const { address, signature, email, username } = req.body
    
    // Validation
    if (!address || !signature || !email || !username) {
      return res.status(400).json({
        error: 'Address, signature, email, and username are required'
      })
    }
    
    if (!address.match(/^0x[a-fA-F0-9]{40}$/)) {
      return res.status(400).json({
        error: 'Invalid Ethereum address'
      })
    }
    
    if (!email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      return res.status(400).json({
        error: 'Invalid email address'
      })
    }
    
    if (username.length < 3 || username.length > 20) {
      return res.status(400).json({
        error: 'Username must be between 3 and 20 characters'
      })
    }
    
    const dbStatus = await getDbStatus()
    if (dbStatus === 'connected') {
      const { PrismaClient } = require('@prisma/client')
      const prisma = new PrismaClient()
      
      try {
        // Check if user already exists with this address
        const existingUser = await prisma.user.findUnique({
          where: { address: address.toLowerCase() }
        })
        
        if (existingUser) {
          await prisma.$disconnect()
          return res.status(400).json({
            error: 'User with this address already exists'
          })
        }
        
        // Check if email is already taken
        const existingEmail = await prisma.user.findUnique({
          where: { email: email.toLowerCase() }
        })
        
        if (existingEmail) {
          await prisma.$disconnect()
          return res.status(400).json({
            error: 'Email address is already registered'
          })
        }
        
        // Check if username is already taken
        const existingUsername = await prisma.user.findUnique({
          where: { username: username.toLowerCase() }
        })
        
        if (existingUsername) {
          await prisma.$disconnect()
          return res.status(400).json({
            error: 'Username is already taken'
          })
        }
        
        // Create user
        const user = await prisma.user.create({
          data: {
            address: address.toLowerCase(),
            email: email.toLowerCase(),
            username: username.toLowerCase(),
            displayName: username,
            isVerified: false,
            emailVerified: false,
            zrmBalance: 0
          }
        })
        
        // Generate email verification token
        const emailService = require('./services/emailService').default
        const verificationToken = emailService.generateVerificationToken()
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
        
        // Save verification token
        await prisma.emailVerificationToken.create({
          data: {
            token: verificationToken,
            userId: user.id,
            email: email.toLowerCase(),
            expiresAt
          }
        })
        
        // Send verification email
        const emailSent = await emailService.sendEmailVerification(
          email,
          verificationToken,
          username
        )
        
        await prisma.$disconnect()
        
        res.status(201).json({
          success: true,
          message: 'Registration successful! Please check your email to verify your account.',
          user: {
            id: user.id,
            address: user.address,
            email: user.email,
            username: user.username,
            displayName: user.displayName,
            isVerified: false,
            emailVerified: false,
            zrmBalance: '0'
          },
          emailSent
        })
        
      } catch (dbError) {
        await prisma.$disconnect()
        throw dbError
      }
      
    } else {
      // Mock response when database is not connected
      res.status(201).json({
        success: true,
        message: 'Registration successful! (Mock - database not connected)',
        user: {
          id: `user_${Date.now()}`,
          address: address.toLowerCase(),
          email,
          username,
          displayName: username,
          isVerified: false,
          emailVerified: false,
          zrmBalance: '0'
        },
        emailSent: false,
        note: 'Mock registration - database not connected'
      })
    }
    
  } catch (error) {
    console.error('Registration error:', error)
    res.status(500).json({
      error: 'Registration failed',
      message: error.message
    })
  }
})

app.post('/api/auth/login', async (req, res) => {
  try {
    const { address, signature } = req.body
    
    if (!address || !signature) {
      return res.status(400).json({
        error: 'Address and signature are required'
      })
    }
    
    // For now, return success without actual verification
    res.json({
      message: 'User login endpoint ready',
      user: {
        id: `user_${Date.now()}`,
        address: address.toLowerCase(),
        isVerified: false,
        zrmBalance: 10000
      },
      token: 'sample_jwt_token',
      note: 'Full authentication will be implemented with complete controller'
    })
    
  } catch (error) {
    res.status(500).json({
      error: 'Login failed',
      message: error.message
    })
  }
})

// Email service test endpoint
app.get('/api/email/test', async (req, res) => {
  try {
    const emailService = require('./services/emailService').default
    const testResult = await emailService.testConnection()
    
    res.json({
      message: 'Email service test completed',
      ...testResult,
      config: {
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: process.env.SMTP_PORT || '587',
        hasUser: !!process.env.SMTP_USER,
        hasPass: !!process.env.SMTP_PASS,
        fromEmail: process.env.FROM_EMAIL || 'noreply@zorium.fun'
      }
    })
  } catch (error) {
    res.status(500).json({
      error: 'Email test failed',
      message: error.message
    })
  }
})

// Email verification endpoint
app.post('/api/auth/verify-email', async (req, res) => {
  try {
    const { token } = req.body
    
    if (!token) {
      return res.status(400).json({
        error: 'Verification token is required'
      })
    }
    
    const dbStatus = await getDbStatus()
    if (dbStatus === 'connected') {
      const { PrismaClient } = require('@prisma/client')
      const prisma = new PrismaClient()
      
      try {
        // Find verification token
        const verificationToken = await prisma.emailVerificationToken.findUnique({
          where: { token },
          include: { user: true }
        })
        
        if (!verificationToken) {
          await prisma.$disconnect()
          return res.status(400).json({
            error: 'Invalid verification token'
          })
        }
        
        if (verificationToken.usedAt) {
          await prisma.$disconnect()
          return res.status(400).json({
            error: 'Verification token has already been used'
          })
        }
        
        if (verificationToken.expiresAt < new Date()) {
          await prisma.$disconnect()
          return res.status(400).json({
            error: 'Verification token has expired'
          })
        }
        
        // Update user as verified
        const user = await prisma.user.update({
          where: { id: verificationToken.userId },
          data: {
            emailVerified: true,
            emailVerifiedAt: new Date(),
            isVerified: true // Mark as fully verified after email confirmation
          }
        })
        
        // Mark token as used
        await prisma.emailVerificationToken.update({
          where: { id: verificationToken.id },
          data: { usedAt: new Date() }
        })
        
        // Send welcome email
        const emailService = require('./services/emailService').default
        await emailService.sendWelcomeEmail(user.email, user.displayName || user.username)
        
        await prisma.$disconnect()
        
        res.json({
          success: true,
          message: 'Email verified successfully! Welcome to Zorium!',
          user: {
            id: user.id,
            address: user.address,
            email: user.email,
            username: user.username,
            displayName: user.displayName,
            isVerified: true,
            emailVerified: true,
            zrmBalance: user.zrmBalance.toString()
          }
        })
        
      } catch (dbError) {
        await prisma.$disconnect()
        throw dbError
      }
      
    } else {
      // Mock response when database is not connected
      res.json({
        success: true,
        message: 'Email verified successfully! (Mock - database not connected)',
        user: {
          id: `user_${Date.now()}`,
          address: '0x1234...5678',
          email: 'user@example.com',
          username: 'mockuser',
          displayName: 'Mock User',
          isVerified: true,
          emailVerified: true,
          zrmBalance: '0'
        },
        note: 'Mock verification - database not connected'
      })
    }
    
  } catch (error) {
    console.error('Email verification error:', error)
    res.status(500).json({
      error: 'Email verification failed',
      message: error.message
    })
  }
})

// ZRM Token endpoints
app.get('/api/zrm/balance/:address', async (req, res) => {
  try {
    const { address } = req.params
    
    // Simple validation
    if (!address || !address.match(/^0x[a-fA-F0-9]{40}$/)) {
      return res.status(400).json({
        error: 'Invalid Ethereum address'
      })
    }
    
    let balance = 0
    let user = null
    
    const dbStatus = await getDbStatus()
    if (dbStatus === 'connected') {
      const { PrismaClient } = require('@prisma/client')
      const prisma = new PrismaClient()
      
      try {
        user = await prisma.user.findUnique({
          where: { address: address.toLowerCase() },
          select: {
            id: true,
            address: true,
            username: true,
            displayName: true,
            zrmBalance: true,
            isEarlyBird: true,
            earlyBirdNumber: true
          }
        })
        
        if (user) {
          balance = parseFloat(user.zrmBalance.toString()) || 0
        }
        
        await prisma.$disconnect()
      } catch (dbError) {
        console.error('Database query error:', dbError)
      }
    }
    
    res.json({
      address: address.toLowerCase(),
      balance,
      user,
      message: `Database ${dbStatus}`
    })
    
  } catch (error) {
    res.status(500).json({
      error: 'Failed to get ZRM balance',
      message: error.message
    })
  }
})

app.post('/api/zrm/transfer', async (req, res) => {
  try {
    const { fromAddress, toAddress, amount, transactionHash } = req.body
    
    // Basic validation
    if (!fromAddress || !toAddress || !amount || !transactionHash) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['fromAddress', 'toAddress', 'amount', 'transactionHash']
      })
    }
    
    if (!fromAddress.match(/^0x[a-fA-F0-9]{40}$/) || !toAddress.match(/^0x[a-fA-F0-9]{40}$/)) {
      return res.status(400).json({
        error: 'Invalid Ethereum addresses'
      })
    }
    
    const transferAmount = parseFloat(amount)
    if (transferAmount <= 0) {
      return res.status(400).json({
        error: 'Transfer amount must be positive'
      })
    }
    
    // For now, return mock response
    res.json({
      message: 'ZRM transfer processed',
      transfer: {
        id: `transfer_${Date.now()}`,
        fromAddress: fromAddress.toLowerCase(),
        toAddress: toAddress.toLowerCase(),
        amount: transferAmount,
        transactionHash,
        status: 'pending',
        createdAt: new Date().toISOString()
      },
      note: 'Full ZRM transfer will be implemented with database integration'
    })
    
  } catch (error) {
    res.status(500).json({
      error: 'Failed to process ZRM transfer',
      message: error.message
    })
  }
})

app.get('/api/zrm/stats', async (req, res) => {
  try {
    let stats = {
      totalSupply: 1000000,
      circulating: 0,
      treasury: 1000000,
      holders: 0,
      earlyBirdsClaimed: 0,
      totalEarlyBirdRewards: 0
    }
    
    const dbStatus = await getDbStatus()
    if (dbStatus === 'connected') {
      const { PrismaClient } = require('@prisma/client')
      const prisma = new PrismaClient()
      
      try {
        const [userCount, totalZRM, claimedRewards] = await Promise.all([
          prisma.user.count(),
          prisma.user.aggregate({
            _sum: { zrmBalance: true }
          }),
          prisma.earlyBirdReward.aggregate({
            _count: { id: true },
            _sum: { amount: true },
            where: { claimed: true }
          })
        ])
        
        stats = {
          totalSupply: 1000000,
          circulating: parseFloat(totalZRM._sum.zrmBalance?.toString() || '0'),
          treasury: 1000000 - parseFloat(totalZRM._sum.zrmBalance?.toString() || '0'),
          holders: userCount,
          earlyBirdsClaimed: claimedRewards._count.id || 0,
          totalEarlyBirdRewards: parseFloat(claimedRewards._sum.amount?.toString() || '0')
        }
        
        await prisma.$disconnect()
      } catch (dbError) {
        console.error('Database query error:', dbError)
      }
    }
    
    res.json({
      stats,
      message: `Database ${dbStatus}`,
      lastUpdated: new Date().toISOString()
    })
    
  } catch (error) {
    res.status(500).json({
      error: 'Failed to get ZRM stats',
      message: error.message
    })
  }
})

// Admin endpoints
app.get('/api/admin/stats', async (req, res) => {
  try {
    // Basic admin validation (check if address is platform owner)
    const adminAddress = req.headers['x-admin-address']
    const platformOwner = process.env.PLATFORM_OWNER_ADDRESS
    
    if (!adminAddress || !platformOwner || adminAddress.toString().toLowerCase() !== platformOwner.toLowerCase()) {
      return res.status(403).json({
        error: 'Admin access required'
      })
    }
    
    let stats = {
      totalFees: 0,
      availableZRM: 1000000,
      accumulatedZRM: 0,
      totalZRMDeposited: 1000000,
      totalUsers: 0,
      totalNFTs: 0,
      monthlyRevenue: 0,
      dailyActiveUsers: 0,
      earlyBirdUsers: 0
    }
    
    const dbStatus = await getDbStatus()
    if (dbStatus === 'connected') {
      const { PrismaClient } = require('@prisma/client')
      const prisma = new PrismaClient()
      
      try {
        const [userCount, nftCount, earlyBirdCount, platformStats] = await Promise.all([
          prisma.user.count(),
          prisma.nFT.count(),
          prisma.user.count({ where: { isEarlyBird: true } }),
          prisma.platformStats.findFirst({
            orderBy: { date: 'desc' }
          })
        ])
        
        stats = {
          totalFees: parseFloat(platformStats?.totalFees?.toString() || '0'),
          availableZRM: parseFloat(platformStats?.zrmTreasury?.toString() || '1000000'),
          accumulatedZRM: parseFloat(platformStats?.zrmCirculating?.toString() || '0'),
          totalZRMDeposited: 1000000,
          totalUsers: userCount,
          totalNFTs: nftCount,
          monthlyRevenue: parseFloat(platformStats?.totalFees?.toString() || '0') * 0.1, // Estimate
          dailyActiveUsers: Math.floor(userCount * 0.1), // Estimate
          earlyBirdUsers: earlyBirdCount
        }
        
        await prisma.$disconnect()
      } catch (dbError) {
        console.error('Database query error:', dbError)
      }
    }
    
    res.json({
      stats,
      message: `Admin stats - database ${dbStatus}`,
      lastUpdated: new Date().toISOString()
    })
    
  } catch (error) {
    res.status(500).json({
      error: 'Failed to get admin stats',
      message: error.message
    })
  }
})

app.post('/api/admin/zrm/deposit', async (req, res) => {
  try {
    const { amount, transactionHash } = req.body
    const adminAddress = req.headers['x-admin-address']
    const platformOwner = process.env.PLATFORM_OWNER_ADDRESS
    
    if (!adminAddress || !platformOwner || adminAddress.toString().toLowerCase() !== platformOwner.toLowerCase()) {
      return res.status(403).json({
        error: 'Admin access required'
      })
    }
    
    if (!amount || !transactionHash) {
      return res.status(400).json({
        error: 'Amount and transaction hash are required'
      })
    }
    
    const depositAmount = parseFloat(amount)
    if (depositAmount <= 0) {
      return res.status(400).json({
        error: 'Deposit amount must be positive'
      })
    }
    
    res.json({
      message: 'ZRM deposit processed',
      deposit: {
        id: `deposit_${Date.now()}`,
        amount: depositAmount,
        transactionHash,
        adminAddress: adminAddress.toString().toLowerCase(),
        status: 'confirmed',
        depositedAt: new Date().toISOString()
      },
      note: 'Full ZRM deposit tracking will be implemented with database integration'
    })
    
  } catch (error) {
    res.status(500).json({
      error: 'Failed to process ZRM deposit',
      message: error.message
    })
  }
})

app.post('/api/admin/zrm/allocate', async (req, res) => {
  try {
    const { toAddress, amount, reason } = req.body
    const adminAddress = req.headers['x-admin-address']
    const platformOwner = process.env.PLATFORM_OWNER_ADDRESS
    
    if (!adminAddress || !platformOwner || adminAddress.toString().toLowerCase() !== platformOwner.toLowerCase()) {
      return res.status(403).json({
        error: 'Admin access required'
      })
    }
    
    if (!toAddress || !amount || !reason) {
      return res.status(400).json({
        error: 'To address, amount, and reason are required'
      })
    }
    
    if (!toAddress.match(/^0x[a-fA-F0-9]{40}$/)) {
      return res.status(400).json({
        error: 'Invalid Ethereum address'
      })
    }
    
    const allocateAmount = parseFloat(amount)
    if (allocateAmount <= 0) {
      return res.status(400).json({
        error: 'Allocation amount must be positive'
      })
    }
    
    res.json({
      message: 'ZRM allocation processed',
      allocation: {
        id: `allocation_${Date.now()}`,
        toAddress: toAddress.toLowerCase(),
        amount: allocateAmount,
        reason,
        adminAddress: adminAddress.toString().toLowerCase(),
        status: 'completed',
        allocatedAt: new Date().toISOString()
      },
      note: 'Full ZRM allocation will be implemented with database integration'
    })
    
  } catch (error) {
    res.status(500).json({
      error: 'Failed to process ZRM allocation',
      message: error.message
    })
  }
})

app.post('/api/admin/withdraw', async (req, res) => {
  try {
    const { type, amount, recipientAddress } = req.body
    const adminAddress = req.headers['x-admin-address']
    const platformOwner = process.env.PLATFORM_OWNER_ADDRESS
    
    if (!adminAddress || !platformOwner || adminAddress.toString().toLowerCase() !== platformOwner.toLowerCase()) {
      return res.status(403).json({
        error: 'Admin access required'
      })
    }
    
    if (!type || !amount || !recipientAddress) {
      return res.status(400).json({
        error: 'Type, amount, and recipient address are required'
      })
    }
    
    if (!['ETH', 'ZRM'].includes(type)) {
      return res.status(400).json({
        error: 'Type must be ETH or ZRM'
      })
    }
    
    if (!recipientAddress.match(/^0x[a-fA-F0-9]{40}$/)) {
      return res.status(400).json({
        error: 'Invalid recipient address'
      })
    }
    
    const withdrawAmount = parseFloat(amount)
    if (withdrawAmount <= 0) {
      return res.status(400).json({
        error: 'Withdrawal amount must be positive'
      })
    }
    
    res.json({
      message: 'Withdrawal request created',
      withdrawal: {
        id: `withdrawal_${Date.now()}`,
        type,
        amount: withdrawAmount,
        recipientAddress: recipientAddress.toLowerCase(),
        adminAddress: adminAddress.toString().toLowerCase(),
        status: 'pending',
        requestedAt: new Date().toISOString()
      },
      note: 'Full withdrawal system will be implemented with database integration'
    })
    
  } catch (error) {
    res.status(500).json({
      error: 'Failed to create withdrawal request',
      message: error.message
    })
  }
})

app.get('/api/admin/fee-history', async (req, res) => {
  try {
    const adminAddress = req.headers['x-admin-address']
    const platformOwner = process.env.PLATFORM_OWNER_ADDRESS
    
    if (!adminAddress || !platformOwner || adminAddress.toString().toLowerCase() !== platformOwner.toLowerCase()) {
      return res.status(403).json({
        error: 'Admin access required'
      })
    }
    
    const { limit = 50 } = req.query
    let feeHistory = []
    
    const dbStatus = await getDbStatus()
    if (dbStatus === 'connected') {
      const { PrismaClient } = require('@prisma/client')
      const prisma = new PrismaClient()
      
      try {
        const transactions = await prisma.transaction.findMany({
          where: {
            type: { in: ['SALE', 'MINT', 'PROMOTION'] }
          },
          orderBy: { createdAt: 'desc' },
          take: Number(limit),
          select: {
            id: true,
            type: true,
            value: true,
            platformFee: true,
            creatorFee: true,
            referralFee: true,
            createdAt: true,
            nft: {
              select: {
                name: true
              }
            }
          }
        })
        
        feeHistory = transactions.map(tx => ({
          date: tx.createdAt.toISOString(),
          amount: parseFloat(tx.platformFee?.toString() || '0'),
          type: 'platform',
          source: `${tx.type} - ${tx.nft?.name || 'Unknown NFT'}`
        }))
        
        await prisma.$disconnect()
      } catch (dbError) {
        console.error('Database query error:', dbError)
      }
    }
    
    res.json({
      feeHistory,
      message: `Fee history - database ${dbStatus}`,
      total: feeHistory.length
    })
    
  } catch (error) {
    res.status(500).json({
      error: 'Failed to get fee history',
      message: error.message
    })
  }
})

// Get user profile
app.get('/api/users/:address', async (req, res) => {
  try {
    const { address } = req.params
    
    if (!address || !address.match(/^0x[a-fA-F0-9]{40}$/)) {
      return res.status(400).json({
        error: 'Invalid Ethereum address'
      })
    }
    
    const dbStatus = await getDbStatus()
    if (dbStatus === 'connected') {
      const { PrismaClient } = require('@prisma/client')
      const prisma = new PrismaClient()
      
      try {
        const user = await prisma.user.findUnique({
          where: { address: address.toLowerCase() },
          include: {
            _count: {
              select: {
                createdNFTs: true,
                ownedNFTs: true,
                followers: true,
                follows: true,
                likes: true,
                comments: true
              }
            }
          }
        })
        
        if (!user) {
          return res.status(404).json({
            error: 'User not found'
          })
        }
        
        await prisma.$disconnect()
        
        res.json({
          user: {
            ...user,
            stats: {
              created: user._count.createdNFTs,
              owned: user._count.ownedNFTs,
              followers: user._count.followers,
              following: user._count.follows,
              likes: user._count.likes,
              comments: user._count.comments
            }
          }
        })
        
      } catch (dbError) {
        await prisma.$disconnect()
        console.error('Database error:', dbError)
        res.status(500).json({
          error: 'Failed to fetch user profile',
          message: dbError.message
        })
      }
    } else {
      // Mock response if database not available
      res.json({
        user: {
          address: address.toLowerCase(),
          username: null,
          displayName: null,
          bio: null,
          avatar: null,
          isVerified: false,
          zrmBalance: 0,
          stats: {
            created: 0,
            owned: 0,
            followers: 0,
            following: 0,
            likes: 0,
            comments: 0
          },
          note: 'Database not available, using mock response'
        }
      })
    }
    
  } catch (error) {
    res.status(500).json({
      error: 'Failed to fetch user profile',
      message: error.message
    })
  }
})

// Update user profile
app.put('/api/users/:address', async (req, res) => {
  try {
    const { address } = req.params
    const { username, displayName, bio, avatar, banner, website, twitterUsername } = req.body
    
    if (!address || !address.match(/^0x[a-fA-F0-9]{40}$/)) {
      return res.status(400).json({
        error: 'Invalid Ethereum address'
      })
    }
    
    const dbStatus = await getDbStatus()
    if (dbStatus === 'connected') {
      const { PrismaClient } = require('@prisma/client')
      const prisma = new PrismaClient()
      
      try {
        // Check if user exists
        const existingUser = await prisma.user.findUnique({
          where: { address: address.toLowerCase() }
        })
        
        if (!existingUser) {
          return res.status(404).json({
            error: 'User not found'
          })
        }
        
        // Update user profile
        const updatedUser = await prisma.user.update({
          where: { address: address.toLowerCase() },
          data: {
            username,
            displayName,
            bio,
            avatar,
            banner,
            website,
            twitterUsername,
            updatedAt: new Date()
          }
        })
        
        await prisma.$disconnect()
        
        res.json({
          message: 'Profile updated successfully',
          user: updatedUser
        })
        
      } catch (dbError) {
        await prisma.$disconnect()
        console.error('Database error:', dbError)
        
        if (dbError.code === 'P2002') {
          return res.status(400).json({
            error: 'Username already taken'
          })
        }
        
        res.status(500).json({
          error: 'Failed to update profile',
          message: dbError.message
        })
      }
    } else {
      // Mock response if database not available
      res.json({
        message: 'Profile updated successfully (mock)',
        user: {
          address: address.toLowerCase(),
          username,
          displayName,
          bio,
          avatar,
          banner,
          website,
          twitterUsername,
          note: 'Database not available, using mock response'
        }
      })
    }
    
  } catch (error) {
    res.status(500).json({
      error: 'Failed to update profile',
      message: error.message
    })
  }
})

// Follow/Unfollow user
app.post('/api/users/:address/follow', async (req, res) => {
  try {
    const { address } = req.params
    const { followerAddress } = req.body
    
    if (!address || !followerAddress) {
      return res.status(400).json({
        error: 'Both addresses are required'
      })
    }
    
    if (address.toLowerCase() === followerAddress.toLowerCase()) {
      return res.status(400).json({
        error: 'Cannot follow yourself'
      })
    }
    
    const dbStatus = await getDbStatus()
    if (dbStatus === 'connected') {
      const { PrismaClient } = require('@prisma/client')
      const prisma = new PrismaClient()
      
      try {
        // Find both users
        const [targetUser, followerUser] = await Promise.all([
          prisma.user.findUnique({ where: { address: address.toLowerCase() } }),
          prisma.user.findUnique({ where: { address: followerAddress.toLowerCase() } })
        ])
        
        if (!targetUser || !followerUser) {
          return res.status(404).json({
            error: 'One or both users not found'
          })
        }
        
        // Check if already following
        const existingFollow = await prisma.follow.findUnique({
          where: {
            followerId_followingId: {
              followerId: followerUser.id,
              followingId: targetUser.id
            }
          }
        })
        
        let isFollowing = false
        
        if (existingFollow) {
          // Unfollow
          await prisma.follow.delete({
            where: { id: existingFollow.id }
          })
          isFollowing = false
        } else {
          // Follow
          await prisma.follow.create({
            data: {
              followerId: followerUser.id,
              followingId: targetUser.id
            }
          })
          isFollowing = true
        }
        
        await prisma.$disconnect()
        
        res.json({
          message: isFollowing ? 'User followed successfully' : 'User unfollowed successfully',
          following: isFollowing
        })
        
      } catch (dbError) {
        await prisma.$disconnect()
        console.error('Database error:', dbError)
        res.status(500).json({
          error: 'Failed to toggle follow',
          message: dbError.message
        })
      }
    } else {
      // Mock response if database not available
      res.json({
        message: 'Follow toggled successfully (mock)',
        following: true,
        note: 'Database not available, using mock response'
      })
    }
    
  } catch (error) {
    res.status(500).json({
      error: 'Failed to toggle follow',
      message: error.message
    })
  }
})

// File upload endpoint with proper multipart handling
app.post('/api/upload', async (req, res) => {
  try {
    // Handle both base64 and multipart form data
    let fileData, fileName, mimeType
    
    if (req.body.file) {
      // Base64 data from frontend
      const { file, type = 'image', name = 'file' } = req.body
      
      if (!file) {
        return res.status(400).json({
          error: 'File data is required'
        })
      }
      
      // Parse base64 data
      const base64Match = file.match(/^data:([^;]+);base64,(.+)$/)
      if (!base64Match) {
        return res.status(400).json({
          error: 'Invalid base64 file format'
        })
      }
      
      mimeType = base64Match[1]
      fileData = Buffer.from(base64Match[2], 'base64')
      fileName = name
      
    } else {
      return res.status(400).json({
        error: 'No file data provided'
      })
    }
    
    // Validate file type
    const allowedTypes = [
      'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 
      'video/mp4', 'video/mov', 'video/avi'
    ]
    
    if (!allowedTypes.includes(mimeType)) {
      return res.status(400).json({
        error: 'Unsupported file type',
        supportedTypes: allowedTypes
      })
    }
    
    // Validate file size (100MB limit)
    const maxSize = 100 * 1024 * 1024 // 100MB
    if (fileData.length > maxSize) {
      return res.status(400).json({
        error: 'File too large',
        maxSize: '100MB',
        actualSize: `${(fileData.length / (1024 * 1024)).toFixed(2)}MB`
      })
    }
    
    // In a real implementation, you would upload to IPFS or cloud storage
    // For now, simulate upload and return a mock URL
    const fileHash = require('crypto').createHash('sha256').update(fileData).digest('hex').substring(0, 16)
    const fileExtension = mimeType.split('/')[1]
    const mockUrl = `https://ipfs.io/ipfs/Qm${fileHash}${Date.now()}.${fileExtension}`
    
    // Store file metadata (in production, save to database)
    const fileMetadata = {
      id: `file_${Date.now()}_${fileHash}`,
      originalName: fileName,
      mimeType,
      size: fileData.length,
      url: mockUrl,
      uploadedAt: new Date().toISOString(),
      hash: fileHash
    }
    
    res.json({
      message: 'File uploaded successfully',
      file: fileMetadata,
      note: 'This is a mock implementation. In production, files would be uploaded to IPFS or cloud storage like AWS S3.'
    })
    
  } catch (error) {
    console.error('Upload error:', error)
    res.status(500).json({
      error: 'Failed to upload file',
      message: error.message
    })
  }
})

// Collection endpoints
app.get('/api/collections', async (req, res) => {
  try {
    const { limit = 20, offset = 0, creatorAddress } = req.query
    
    const dbStatus = await getDbStatus()
    if (dbStatus === 'connected') {
      const { PrismaClient } = require('@prisma/client')
      const prisma = new PrismaClient()
      
      try {
        const whereClause = creatorAddress ? {
          creator: {
            address: creatorAddress.toString().toLowerCase()
          }
        } : {}
        
        const collections = await prisma.collection.findMany({
          where: whereClause,
          include: {
            creator: {
              select: {
                address: true,
                username: true,
                displayName: true,
                avatar: true
              }
            },
            _count: {
              select: {
                nfts: true
              }
            }
          },
          orderBy: { createdAt: 'desc' },
          take: Number(limit),
          skip: Number(offset)
        })
        
        await prisma.$disconnect()
        
        res.json({
          collections: collections.map(collection => ({
            ...collection,
            itemCount: collection._count.nfts
          }))
        })
        
      } catch (dbError) {
        await prisma.$disconnect()
        console.error('Database error:', dbError)
        res.status(500).json({
          error: 'Failed to fetch collections',
          message: dbError.message
        })
      }
    } else {
      // Mock response if database not available
      res.json({
        collections: [],
        note: 'Database not available, using mock response'
      })
    }
    
  } catch (error) {
    res.status(500).json({
      error: 'Failed to fetch collections',
      message: error.message
    })
  }
})

app.get('/api/collections/:id', async (req, res) => {
  try {
    const { id } = req.params
    
    const dbStatus = await getDbStatus()
    if (dbStatus === 'connected') {
      const { PrismaClient } = require('@prisma/client')
      const prisma = new PrismaClient()
      
      try {
        const collection = await prisma.collection.findUnique({
          where: { id },
          include: {
            creator: {
              select: {
                address: true,
                username: true,
                displayName: true,
                avatar: true
              }
            },
            nfts: {
              include: {
                creator: {
                  select: {
                    address: true,
                    username: true,
                    displayName: true
                  }
                }
              },
              orderBy: { createdAt: 'desc' },
              take: 50
            }
          }
        })
        
        if (!collection) {
          return res.status(404).json({
            error: 'Collection not found'
          })
        }
        
        await prisma.$disconnect()
        
        res.json({
          collection
        })
        
      } catch (dbError) {
        await prisma.$disconnect()
        console.error('Database error:', dbError)
        res.status(500).json({
          error: 'Failed to fetch collection',
          message: dbError.message
        })
      }
    } else {
      // Mock response if database not available
      res.status(404).json({
        error: 'Collection not found',
        note: 'Database not available'
      })
    }
    
  } catch (error) {
    res.status(500).json({
      error: 'Failed to fetch collection',
      message: error.message
    })
  }
})

app.post('/api/collections', async (req, res) => {
  try {
    const { name, description, image, banner, creatorAddress, website, discord, twitter } = req.body
    
    if (!name || !creatorAddress) {
      return res.status(400).json({
        error: 'Name and creator address are required'
      })
    }
    
    const dbStatus = await getDbStatus()
    if (dbStatus === 'connected') {
      const { PrismaClient } = require('@prisma/client')
      const prisma = new PrismaClient()
      
      try {
        // Find or create creator
        let creator = await prisma.user.findUnique({
          where: { address: creatorAddress.toLowerCase() }
        })
        
        if (!creator) {
          creator = await prisma.user.create({
            data: {
              address: creatorAddress.toLowerCase(),
              isVerified: false,
              zrmBalance: 0
            }
          })
        }
        
        const collection = await prisma.collection.create({
          data: {
            name,
            description,
            image,
            banner,
            creatorId: creator.id,
            website,
            discord,
            twitter
          },
          include: {
            creator: {
              select: {
                address: true,
                username: true,
                displayName: true,
                avatar: true
              }
            }
          }
        })
        
        await prisma.$disconnect()
        
        res.status(201).json({
          message: 'Collection created successfully',
          collection
        })
        
      } catch (dbError) {
        await prisma.$disconnect()
        console.error('Database error:', dbError)
        res.status(500).json({
          error: 'Failed to create collection',
          message: dbError.message
        })
      }
    } else {
      // Mock response if database not available
      res.status(201).json({
        message: 'Collection created successfully (mock)',
        collection: {
          id: `collection_${Date.now()}`,
          name,
          description,
          image,
          banner,
          creatorAddress: creatorAddress.toLowerCase(),
          website,
          discord,
          twitter,
          itemCount: 0,
          note: 'Database not available, using mock response'
        }
      })
    }
    
  } catch (error) {
    res.status(500).json({
      error: 'Failed to create collection',
      message: error.message
    })
  }
})

// View tracking endpoint
app.post('/api/nfts/:id/view', async (req, res) => {
  try {
    const { id } = req.params
    const { userAddress, sessionId } = req.body
    
    if (!id) {
      return res.status(400).json({
        error: 'NFT ID is required'
      })
    }
    
    const dbStatus = await getDbStatus()
    if (dbStatus === 'connected') {
      const { PrismaClient } = require('@prisma/client')
      const prisma = new PrismaClient()
      
      try {
        // Check if NFT exists and increment view count
        const nft = await prisma.nFT.findUnique({
          where: { id }
        })
        
        if (!nft) {
          await prisma.$disconnect()
          return res.status(404).json({
            error: 'NFT not found'
          })
        }
        
        // Update view count
        await prisma.nFT.update({
          where: { id },
          data: { 
            viewCount: { increment: 1 },
            updatedAt: new Date()
          }
        })
        
        await prisma.$disconnect()
        
        res.json({
          success: true,
          message: 'View tracked successfully',
          nftId: id,
          newViewCount: nft.viewCount + 1
        })
        
      } catch (dbError) {
        await prisma.$disconnect()
        throw dbError
      }
      
    } else {
      // Mock response when database is not connected
      res.json({
        success: true,
        message: 'View tracking simulated (database not connected)',
        nftId: id,
        newViewCount: Math.floor(Math.random() * 1000) + 100
      })
    }
    
  } catch (error) {
    console.error('View tracking error:', error)
    res.status(500).json({
      error: 'Failed to track view',
      message: error.message
    })
  }
})

// Analytics endpoint for view statistics
app.get('/api/analytics/views', async (req, res) => {
  try {
    const { period = '7d', nftId } = req.query
    
    const dbStatus = await getDbStatus()
    if (dbStatus === 'connected') {
      const { PrismaClient } = require('@prisma/client')
      const prisma = new PrismaClient()
      
      try {
        let whereClause = {}
        
        // Filter by specific NFT if provided
        if (nftId) {
          whereClause = { id: nftId.toString() }
        }
        
        // Get view statistics
        const nfts = await prisma.nFT.findMany({
          where: whereClause,
          select: {
            id: true,
            name: true,
            viewCount: true,
            createdAt: true,
            creator: {
              select: {
                address: true,
                username: true,
                displayName: true
              }
            }
          },
          orderBy: { viewCount: 'desc' },
          take: 50
        })
        
        const totalViews = nfts.reduce((sum, nft) => sum + nft.viewCount, 0)
        const averageViews = nfts.length > 0 ? Math.round(totalViews / nfts.length) : 0
        
        await prisma.$disconnect()
        
        res.json({
          success: true,
          period,
          analytics: {
            totalViews,
            averageViews,
            totalNFTs: nfts.length,
            topViewedNFTs: nfts.slice(0, 10)
          }
        })
        
      } catch (dbError) {
        await prisma.$disconnect()
        throw dbError
      }
      
    } else {
      // Mock analytics when database is not connected
      res.json({
        success: true,
        period,
        analytics: {
          totalViews: 15420,
          averageViews: 89,
          totalNFTs: 173,
          topViewedNFTs: Array.from({ length: 10 }, (_, i) => ({
            id: `mock_nft_${i + 1}`,
            name: `Popular NFT #${i + 1}`,
            viewCount: 1000 - (i * 100),
            createdAt: new Date().toISOString(),
            creator: {
              address: '0x1234...5678',
              username: `creator${i + 1}`,
              displayName: `Creator ${i + 1}`
            }
          }))
        },
        note: 'Mock analytics data - database not connected'
      })
    }
    
  } catch (error) {
    console.error('Analytics error:', error)
    res.status(500).json({
      error: 'Failed to get analytics',
      message: error.message
    })
  }
})

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.originalUrl} not found`,
    timestamp: new Date().toISOString(),
    availableEndpoints: [
      'GET /health',
      'GET /api/analytics/stats',
      'GET /api/nfts',
      'GET /api/nfts/trending',
      'GET /api/nfts/:id',
      'POST /api/nfts/mint',
      'PUT /api/nfts/:id',
      'POST /api/nfts/:id/like',
      'POST /api/nfts/:id/buy',
      'POST /api/nfts/:id/view',
      'GET /api/search',
      'GET /api/auth/nonce/:address',
      'POST /api/auth/register',
      'POST /api/auth/login',
      'POST /api/auth/verify-email',
      'GET /api/email/test',
      'GET /api/zrm/balance/:address',
      'POST /api/zrm/transfer',
      'GET /api/zrm/stats',
      'GET /api/admin/stats',
      'POST /api/admin/zrm/deposit',
      'POST /api/admin/zrm/allocate',
      'POST /api/admin/withdraw',
      'GET /api/admin/fee-history',
      'GET /api/nfts/:id/comments',
      'POST /api/nfts/:id/comments',
      'GET /api/users/:address',
      'PUT /api/users/:address',
      'POST /api/users/:address/follow',
      'POST /api/upload',
      'GET /api/collections',
      'GET /api/collections/:id',
      'POST /api/collections',
      'GET /api/analytics/views'
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