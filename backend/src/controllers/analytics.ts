import { Request, Response, NextFunction } from 'express'
import { prisma } from '../config/db'
import { ForbiddenError } from '../middleware/errorHandler'
import { logger } from '../utils/logger'

class AnalyticsController {
  // Get platform overview statistics
  async getPlatformStats(req: Request, res: Response, next: NextFunction) {
    try {
      const [
        userStats,
        nftStats,
        collectionStats
      ] = await Promise.all([
        // User statistics
        prisma.user.aggregate({
          _count: { id: true }
        }),
        // NFT statistics  
        prisma.nFT.aggregate({
          _count: { id: true },
          _sum: { 
            likeCount: true,
            viewCount: true
          },
          _avg: { price: true }
        }),
        // Collection statistics
        prisma.collection.aggregate({
          _count: { id: true }
        })
      ])

      res.json({
        success: true,
        data: {
          users: {
            total: userStats._count.id,
            active30d: 0 // Placeholder
          },
          nfts: {
            total: nftStats._count.id,
            totalLikes: nftStats._sum.likeCount || 0,
            totalViews: nftStats._sum.viewCount || 0,
            averagePrice: nftStats._avg.price || 0
          },
          collections: {
            total: collectionStats._count.id
          },
          transactions: {
            total: 0, // Placeholder
            volume: 0 // Placeholder
          }
        }
      })
    } catch (error) {
      next(error)
    }
  }

  // Get trending data
  async getTrendingData(req: Request, res: Response, next: NextFunction) {
    try {
      const [
        trendingNFTs,
        trendingCollections,
        trendingCreators
      ] = await Promise.all([
        // Trending NFTs (by recent likes and views)
        prisma.nFT.findMany({
          where: {
            createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
          },
          orderBy: [
            { likeCount: 'desc' },
            { viewCount: 'desc' }
          ],
          take: 10,
          include: {
            creator: {
              select: {
                id: true,
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
                contractAddress: true
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
        // Trending Collections
        prisma.collection.findMany({
          orderBy: { createdAt: 'desc' },
          take: 10,
          include: {
            creator: {
              select: {
                id: true,
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
        // Trending Creators
        prisma.user.findMany({
          where: {
            createdNFTs: {
              some: {
                createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
              }
            }
          },
          orderBy: { displayName: 'asc' },
          take: 10,
          select: {
            id: true,
            username: true,
            displayName: true,
            avatar: true,
            isVerified: true,
            _count: {
              select: {
                createdNFTs: true
              }
            }
          }
        })
      ])

      // Parse attributes for trending NFTs
      const nftsWithParsedAttributes = trendingNFTs.map(nft => ({
        ...nft,
        attributes: nft.attributes ? JSON.parse(String(nft.attributes)) : null,
        likeCount: nft._count.likes,
        commentCount: nft._count.comments
      }))

      res.json({
        success: true,
        data: {
          nfts: nftsWithParsedAttributes,
          collections: trendingCollections.map(collection => ({
            ...collection,
            nftCount: collection._count.nfts
          })),
          creators: trendingCreators.map(creator => ({
            ...creator,
            nftCount: creator._count.createdNFTs,
            followerCount: 0 // Placeholder
          }))
        }
      })
    } catch (error) {
      next(error)
    }
  }

  // Get marketplace statistics
  async getMarketplaceStats(req: Request, res: Response, next: NextFunction) {
    try {
      const [
        listedNFTs,
        avgPrice
      ] = await Promise.all([
        prisma.nFT.count({ where: { price: { not: null } } }),
        prisma.nFT.aggregate({
          where: { price: { not: null } },
          _avg: { price: true }
        })
      ])

      res.json({
        success: true,
        data: {
          listedNFTs: listedNFTs,
          averagePrice: avgPrice._avg.price || 0,
          totalVolume: 0, // Placeholder
          transactions24h: 0 // Placeholder
        }
      })
    } catch (error) {
      next(error)
    }
  }

  // Admin only - get detailed analytics
  async getDetailedAnalytics(req: Request, res: Response, next: NextFunction) {
    try {
      // Check if user is admin
      const userId = req.user?.id
      if (!userId) {
        throw new ForbiddenError('Authentication required')
      }

      // For now, skip admin check - placeholder functionality
      // TODO: Add admin field to user model

      const stats = await prisma.nFT.aggregate({
        _count: { id: true },
        _sum: { 
          likeCount: true,
          viewCount: true
        }
      })

      res.json({
        success: true,
        data: {
          totalNFTs: stats._count.id,
          totalLikes: stats._sum.likeCount || 0,
          totalViews: stats._sum.viewCount || 0
        }
      })
    } catch (error) {
      next(error)
    }
  }
}

export default new AnalyticsController()