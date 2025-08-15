import { Request, Response, NextFunction } from 'express'
import { prisma } from '../config/database'
import { NotFoundError, ForbiddenError, ValidationError } from '../middleware/errorHandler'
import { logger } from '../utils/logger'
import { isValidEthereumAddress } from '../utils/web3'

class CollectionController {
  // Create collection
  async createCollection(req: Request, res: Response, next: NextFunction) {
    try {
      const {
        name,
        description,
        image,
        banner,
        website,
        discord,
        twitter
      } = req.body
      
      const currentUser = req.user
      
      if (!currentUser) {
        throw new ForbiddenError('Authentication required')
      }
      
      // Validate required fields
      if (!name || !description) {
        throw new ValidationError('Name and description are required')
      }
      
      if (name.length > 100) {
        throw new ValidationError('Name must be less than 100 characters')
      }
      
      if (description.length > 1000) {
        throw new ValidationError('Description must be less than 1000 characters')
      }
      
      // Note: Contract address validation moved to where it's actually used
      
      // Check if collection with same name exists for this user
      const existingCollection = await prisma.collection.findFirst({
        where: {
          name: { equals: name, mode: 'insensitive' },
          creatorId: currentUser.id
        }
      })
      
      if (existingCollection) {
        throw new ValidationError('You already have a collection with this name')
      }
      
      
      // Create collection
      const collection = await prisma.collection.create({
        data: {
          name,
          description,
          image,
          banner,
          website,
          discord,
          twitter,
          creatorId: currentUser.id
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
        }
      })
      
      logger.info('Collection created:', { collectionId: collection.id, userId: currentUser.id })
      
      res.status(201).json({
        message: 'Collection created successfully',
        collection
      })
      
    } catch (error) {
      next(error)
    }
  }
  
  // Get collection by ID
  async getCollectionById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params
      
      const collection = await prisma.collection.findUnique({
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
          _count: {
            select: {
              nfts: true
            }
          }
        }
      })
      
      if (!collection) {
        throw new NotFoundError('Collection not found')
      }
      
      // Get collection stats
      const stats = await prisma.nFT.aggregate({
        where: { collectionId: id },
        _count: { id: true },
        _min: { price: true },
        _avg: { price: true },
        _sum: { price: true }
      })
      
      // Get featured NFTs (first 6)
      const featuredNFTs = await prisma.nFT.findMany({
        where: { collectionId: id },
        take: 6,
        orderBy: { createdAt: 'desc' },
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
          }
        }
      })
      
      res.json({
        collection: {
          ...collection,
          nftCount: stats._count.id,
          floorPrice: stats._min.price,
          averagePrice: stats._avg.price,
          totalVolume: stats._sum.price || 0,
          featuredNFTs
        }
      })
      
    } catch (error) {
      next(error)
    }
  }
  
  // Update collection
  async updateCollection(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params
      const {
        name,
        description,
        image,
        banner,
        website,
        discord,
        twitter
      } = req.body
      
      const currentUser = req.user
      
      if (!currentUser) {
        throw new ForbiddenError('Authentication required')
      }
      
      // Find collection
      const collection = await prisma.collection.findUnique({
        where: { id }
      })
      
      if (!collection) {
        throw new NotFoundError('Collection not found')
      }
      
      // Check ownership
      if (collection.creatorId !== currentUser.id) {
        throw new ForbiddenError('You can only update your own collections')
      }
      
      // Validate inputs
      if (name && name.length > 100) {
        throw new ValidationError('Name must be less than 100 characters')
      }
      
      if (description && description.length > 1000) {
        throw new ValidationError('Description must be less than 1000 characters')
      }
      
      
      // Check if new name conflicts with existing collections
      if (name && name !== collection.name) {
        const existingCollection = await prisma.collection.findFirst({
          where: {
            name: { equals: name, mode: 'insensitive' },
            creatorId: currentUser.id,
            id: { not: id }
          }
        })
        
        if (existingCollection) {
          throw new ValidationError('You already have a collection with this name')
        }
      }
      
      // Update collection
      const updatedCollection = await prisma.collection.update({
        where: { id },
        data: {
          name,
          description,
          image,
          banner,
          website,
          discord,
          twitter,
          updatedAt: new Date()
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
        }
      })
      
      logger.info('Collection updated:', { collectionId: id, userId: currentUser.id })
      
      res.json({
        message: 'Collection updated successfully',
        collection: updatedCollection
      })
      
    } catch (error) {
      next(error)
    }
  }
  
  // Delete collection
  async deleteCollection(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params
      const currentUser = req.user
      
      if (!currentUser) {
        throw new ForbiddenError('Authentication required')
      }
      
      // Find collection
      const collection = await prisma.collection.findUnique({
        where: { id },
        include: {
          _count: {
            select: {
              nfts: true
            }
          }
        }
      })
      
      if (!collection) {
        throw new NotFoundError('Collection not found')
      }
      
      // Check ownership
      if (collection.creatorId !== currentUser.id) {
        throw new ForbiddenError('You can only delete your own collections')
      }
      
      // Check if collection has NFTs
      if (collection._count.nfts > 0) {
        throw new ValidationError('Cannot delete collection that contains NFTs. Remove all NFTs first.')
      }
      
      // Delete collection
      await prisma.collection.delete({
        where: { id }
      })
      
      logger.info('Collection deleted:', { collectionId: id, userId: currentUser.id })
      
      res.json({
        message: 'Collection deleted successfully'
      })
      
    } catch (error) {
      next(error)
    }
  }
  
  // List collections with filtering and pagination
  async listCollections(req: Request, res: Response, next: NextFunction) {
    try {
      const {
        page = 1,
        limit = 20,
        creator,
        verified,
        sortBy = 'createdAt',
        sortOrder = 'desc',
        search
      } = req.query
      
      const offset = (Number(page) - 1) * Number(limit)
      
      // Build where clause
      const whereClause: any = {}
      
      
      if (creator) {
        whereClause.creator = { address: { contains: creator as string, mode: 'insensitive' } }
      }
      
      if (verified === 'true') {
        whereClause.isVerified = true
      }
      
      if (search) {
        whereClause.OR = [
          { name: { contains: search as string, mode: 'insensitive' } },
          { description: { contains: search as string, mode: 'insensitive' } }
        ]
      }
      
      // Build order by clause
      const orderBy: any = {}
      if (sortBy === 'itemCount') {
        orderBy.itemCount = sortOrder
      } else if (sortBy === 'floorPrice') {
        orderBy.floorPrice = sortOrder
      } else if (sortBy === 'volume') {
        orderBy.volume = sortOrder
      } else {
        orderBy.createdAt = sortOrder
      }
      
      // Execute query
      const [collections, total] = await Promise.all([
        prisma.collection.findMany({
          where: whereClause,
          skip: offset,
          take: Number(limit),
          orderBy,
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
          }
        }),
        prisma.collection.count({ where: whereClause })
      ])
      
      res.json({
        collections,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit))
        },
        filters: {
            creator,
          verified,
          search
        }
      })
      
    } catch (error) {
      next(error)
    }
  }
  
  // Get collection NFTs
  async getCollectionNFTs(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params
      const {
        page = 1,
        limit = 20,
        isForSale,
        minPrice,
        maxPrice,
        sortBy = 'createdAt',
        sortOrder = 'desc'
      } = req.query
      
      const offset = (Number(page) - 1) * Number(limit)
      
      // Check if collection exists
      const collection = await prisma.collection.findUnique({
        where: { id }
      })
      
      if (!collection) {
        throw new NotFoundError('Collection not found')
      }
      
      // Build where clause
      const whereClause: any = {
        collectionId: id
      }
      
      if (isForSale === 'true') {
        whereClause.isListed = true
      }
      
      if (minPrice || maxPrice) {
        whereClause.price = {}
        if (minPrice) whereClause.price.gte = parseFloat(minPrice as string)
        if (maxPrice) whereClause.price.lte = parseFloat(maxPrice as string)
      }
      
      // Build order by clause
      const orderBy: any = {}
      if (sortBy === 'price') {
        orderBy.price = sortOrder
      } else if (sortBy === 'likes') {
        orderBy.likeCount = sortOrder
      } else if (sortBy === 'views') {
        orderBy.viewCount = sortOrder
      } else {
        orderBy.createdAt = sortOrder
      }
      
      // Execute query
      const [nfts, total] = await Promise.all([
        prisma.nFT.findMany({
          where: whereClause,
          skip: offset,
          take: Number(limit),
          orderBy,
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
            _count: {
              select: {
                likes: true,
                comments: true
              }
            }
          }
        }),
        prisma.nFT.count({ where: whereClause })
      ])
      
      // Parse attributes for each NFT
      const nftsWithParsedAttributes = nfts.map(nft => ({
        ...nft,
        attributes: nft.attributes ? JSON.parse(String(nft.attributes)) : null,
        likeCount: nft._count.likes,
        commentCount: nft._count.comments
      }))
      
      res.json({
        collection,
        nfts: nftsWithParsedAttributes,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit))
        },
        filters: {
          isForSale,
          minPrice,
          maxPrice
        }
      })
      
    } catch (error) {
      next(error)
    }
  }
  
  // Get collection statistics
  async getCollectionStats(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params
      
      // Check if collection exists
      const collection = await prisma.collection.findUnique({
        where: { id }
      })
      
      if (!collection) {
        throw new NotFoundError('Collection not found')
      }
      
      // Get detailed statistics
      const [
        nftStats,
        ownerCount,
        listedCount,
        totalLikes,
        totalViews
      ] = await Promise.all([
        prisma.nFT.aggregate({
          where: { collectionId: id },
          _count: { id: true },
          _min: { price: true },
          _max: { price: true },
          _avg: { price: true },
          _sum: { price: true }
        }),
        prisma.nFT.findMany({
          where: { collectionId: id },
          select: { ownerId: true },
          distinct: ['ownerId']
        }).then(owners => owners.length),
        prisma.nFT.count({
          where: {
            collectionId: id,
            isListed: true
          }
        }),
        prisma.nFT.aggregate({
          where: { collectionId: id },
          _sum: { likeCount: true }
        }),
        prisma.nFT.aggregate({
          where: { collectionId: id },
          _sum: { viewCount: true }
        })
      ])
      
      // Get recent sales (placeholder - implement with actual transaction data)
      const recentActivity = await prisma.nFT.findMany({
        where: { collectionId: id },
        orderBy: { updatedAt: 'desc' },
        take: 10,
        select: {
          id: true,
          name: true,
          image: true,
          price: true,
          updatedAt: true,
          owner: {
            select: {
              address: true,
              username: true,
              displayName: true,
              avatar: true
            }
          }
        }
      })
      
      res.json({
        stats: {
          totalNFTs: nftStats._count.id,
          uniqueOwners: ownerCount,
          listedNFTs: listedCount,
          floorPrice: nftStats._min.price,
          ceilingPrice: nftStats._max.price,
          averagePrice: nftStats._avg.price,
          totalVolume: nftStats._sum.price || 0,
          totalLikes: totalLikes._sum.likeCount || 0,
          totalViews: totalViews._sum.viewCount || 0
        },
        recentActivity
      })
      
    } catch (error) {
      next(error)
    }
  }
  
  // Get trending collections
  async getTrendingCollections(req: Request, res: Response, next: NextFunction) {
    try {
      const { limit = 10, period = '7d' } = req.query
      
      // Calculate date range for trending
      const now = new Date()
      let dateFrom: Date
      
      switch (period) {
        case '24h':
          dateFrom = new Date(now.getTime() - 24 * 60 * 60 * 1000)
          break
        case '7d':
          dateFrom = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
          break
        case '30d':
          dateFrom = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
          break
        default:
          dateFrom = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      }
      
      // Get collections with recent activity
      const collections = await prisma.collection.findMany({
        take: Number(limit),
        orderBy: [
          { volume: 'desc' },
          { itemCount: 'desc' },
          { createdAt: 'desc' }
        ],
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
        }
      })
      
      // Get activity stats for each collection
      const collectionsWithStats = await Promise.all(
        collections.map(async (collection) => {
          const recentStats = await prisma.nFT.aggregate({
            where: {
              collectionId: collection.id,
              updatedAt: {
                gte: dateFrom
              }
            },
            _sum: {
              likeCount: true,
              viewCount: true
            },
            _count: {
              id: true
            }
          })
          
          return {
            ...collection,
            recentActivity: {
              newNFTs: recentStats._count.id,
              totalLikes: recentStats._sum.likeCount || 0,
              totalViews: recentStats._sum.viewCount || 0
            }
          }
        })
      )
      
      // Sort by recent activity
      collectionsWithStats.sort((a, b) => {
        const aScore = a.recentActivity.totalLikes + a.recentActivity.totalViews + a.recentActivity.newNFTs * 10
        const bScore = b.recentActivity.totalLikes + b.recentActivity.totalViews + b.recentActivity.newNFTs * 10
        return bScore - aScore
      })
      
      res.json({
        trending: collectionsWithStats,
        period,
        total: collectionsWithStats.length
      })
      
    } catch (error) {
      next(error)
    }
  }
  
  // Search collections
  async searchCollections(req: Request, res: Response, next: NextFunction) {
    try {
      const { q, page = 1, limit = 20 } = req.query
      
      if (!q || typeof q !== 'string' || q.trim().length === 0) {
        return res.json({
          collections: [],
          pagination: {
            page: Number(page),
            limit: Number(limit),
            total: 0,
            pages: 0
          },
          message: 'Search query is required'
        })
      }
      
      const searchTerm = q.trim()
      const offset = (Number(page) - 1) * Number(limit)
      
      const [collections, total] = await Promise.all([
        prisma.collection.findMany({
          where: {
            OR: [
              { name: { contains: searchTerm, mode: 'insensitive' } },
              { description: { contains: searchTerm, mode: 'insensitive' } },
            ]
          },
          skip: offset,
          take: Number(limit),
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
          orderBy: [
            { itemCount: 'desc' },
            { createdAt: 'desc' }
          ]
        }),
        prisma.collection.count({
          where: {
            OR: [
              { name: { contains: searchTerm, mode: 'insensitive' } },
              { description: { contains: searchTerm, mode: 'insensitive' } },
            ]
          }
        })
      ])
      
      res.json({
        collections,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit))
        },
        query: searchTerm
      })
      
    } catch (error) {
      next(error)
    }
  }
}

export const collectionController = new CollectionController()