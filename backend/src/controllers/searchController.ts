import { Request, Response, NextFunction } from 'express'
import { prisma } from '../config/database'

class SearchController {
  // Global search
  async search(req: Request, res: Response, next: NextFunction) {
    try {
      const { q, type, page = 1, limit = 20 } = req.query
      
      if (!q || typeof q !== 'string' || q.trim().length === 0) {
        return res.json({
          results: {
            users: [],
            nfts: [],
            collections: []
          },
          pagination: {
            page: Number(page),
            limit: Number(limit),
            total: 0
          }
        })
      }
      
      const searchTerm = q.trim()
      const offset = (Number(page) - 1) * Number(limit)
      
      if (type === 'users' || !type) {
        const [users, userCount] = await Promise.all([
          prisma.user.findMany({
            where: {
              OR: [
                { username: { contains: searchTerm, mode: 'insensitive' } },
                { displayName: { contains: searchTerm, mode: 'insensitive' } },
                { address: { contains: searchTerm, mode: 'insensitive' } }
              ]
            },
            skip: type === 'users' ? offset : 0,
            take: type === 'users' ? Number(limit) : 5,
            select: {
              id: true,
              address: true,
              username: true,
              displayName: true,
              avatar: true,
              isVerified: true,
              _count: {
                select: {
                  followers: true
                }
              }
            },
            orderBy: {
              followers: {
                _count: 'desc'
              }
            }
          }),
          type === 'users' ? prisma.user.count({
            where: {
              OR: [
                { username: { contains: searchTerm, mode: 'insensitive' } },
                { displayName: { contains: searchTerm, mode: 'insensitive' } },
                { address: { contains: searchTerm, mode: 'insensitive' } }
              ]
            }
          }) : 0
        ])
        
        if (type === 'users') {
          return res.json({
            users,
            pagination: {
              page: Number(page),
              limit: Number(limit),
              total: userCount,
              pages: Math.ceil(userCount / Number(limit))
            }
          })
        }
      }
      
      if (type === 'nfts' || !type) {
        const [nfts, nftCount] = await Promise.all([
          prisma.nFT.findMany({
            where: {
              OR: [
                { name: { contains: searchTerm, mode: 'insensitive' } },
                { description: { contains: searchTerm, mode: 'insensitive' } },
                { tokenId: { contains: searchTerm, mode: 'insensitive' } }
              ]
            },
            skip: type === 'nfts' ? offset : 0,
            take: type === 'nfts' ? Number(limit) : 5,
            include: {
              creator: {
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
                  name: true
                }
              }
            },
            orderBy: [
              { viewCount: 'desc' },
              { likeCount: 'desc' },
              { createdAt: 'desc' }
            ]
          }),
          type === 'nfts' ? prisma.nFT.count({
            where: {
              OR: [
                { name: { contains: searchTerm, mode: 'insensitive' } },
                { description: { contains: searchTerm, mode: 'insensitive' } },
                { tokenId: { contains: searchTerm, mode: 'insensitive' } }
              ]
            }
          }) : 0
        ])
        
        if (type === 'nfts') {
          return res.json({
            nfts,
            pagination: {
              page: Number(page),
              limit: Number(limit),
              total: nftCount,
              pages: Math.ceil(nftCount / Number(limit))
            }
          })
        }
      }
      
      if (type === 'collections' || !type) {
        const [collections, collectionCount] = await Promise.all([
          prisma.collection.findMany({
            where: {
              OR: [
                { name: { contains: searchTerm, mode: 'insensitive' } },
                { description: { contains: searchTerm, mode: 'insensitive' } }
              ]
            },
            skip: type === 'collections' ? offset : 0,
            take: type === 'collections' ? Number(limit) : 5,
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
            orderBy: [
              { itemCount: 'desc' },
              { createdAt: 'desc' }
            ]
          }),
          type === 'collections' ? prisma.collection.count({
            where: {
              OR: [
                { name: { contains: searchTerm, mode: 'insensitive' } },
                { description: { contains: searchTerm, mode: 'insensitive' } }
              ]
            }
          }) : 0
        ])
        
        if (type === 'collections') {
          return res.json({
            collections,
            pagination: {
              page: Number(page),
              limit: Number(limit),
              total: collectionCount,
              pages: Math.ceil(collectionCount / Number(limit))
            }
          })
        }
      }
      
      // Return all results for global search
      if (!type) {
        const [users, nfts, collections] = await Promise.all([
          prisma.user.findMany({
            where: {
              OR: [
                { username: { contains: searchTerm, mode: 'insensitive' } },
                { displayName: { contains: searchTerm, mode: 'insensitive' } }
              ]
            },
            take: 5,
            select: {
              id: true,
              address: true,
              username: true,
              displayName: true,
              avatar: true,
              isVerified: true
            }
          }),
          prisma.nFT.findMany({
            where: {
              OR: [
                { name: { contains: searchTerm, mode: 'insensitive' } },
                { description: { contains: searchTerm, mode: 'insensitive' } }
              ]
            },
            take: 5,
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
          }),
          prisma.collection.findMany({
            where: {
              OR: [
                { name: { contains: searchTerm, mode: 'insensitive' } },
                { description: { contains: searchTerm, mode: 'insensitive' } }
              ]
            },
            take: 5,
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
        ])
        
        res.json({
          results: {
            users,
            nfts,
            collections
          },
          query: searchTerm
        })
      }
      
    } catch (error) {
      next(error)
    }
  }
  
  // Search suggestions
  async suggestions(req: Request, res: Response, next: NextFunction) {
    try {
      const { q } = req.query
      
      if (!q || typeof q !== 'string' || q.trim().length < 2) {
        return res.json({ suggestions: [] })
      }
      
      const searchTerm = q.trim()
      
      // Get top suggestions
      const [userSuggestions, nftSuggestions, collectionSuggestions] = await Promise.all([
        prisma.user.findMany({
          where: {
            OR: [
              { username: { startsWith: searchTerm, mode: 'insensitive' } },
              { displayName: { startsWith: searchTerm, mode: 'insensitive' } }
            ]
          },
          take: 3,
          select: {
            username: true,
            displayName: true,
            avatar: true
          }
        }),
        prisma.nFT.findMany({
          where: {
            name: { startsWith: searchTerm, mode: 'insensitive' }
          },
          take: 3,
          select: {
            name: true,
            image: true
          }
        }),
        prisma.collection.findMany({
          where: {
            name: { startsWith: searchTerm, mode: 'insensitive' }
          },
          take: 2,
          select: {
            name: true,
            image: true
          }
        })
      ])
      
      const suggestions = [
        ...userSuggestions.map(user => ({
          type: 'user',
          text: user.displayName || user.username,
          image: user.avatar
        })),
        ...nftSuggestions.map(nft => ({
          type: 'nft',
          text: nft.name,
          image: nft.image
        })),
        ...collectionSuggestions.map(collection => ({
          type: 'collection',
          text: collection.name,
          image: collection.image
        }))
      ]
      
      res.json({ suggestions })
      
    } catch (error) {
      next(error)
    }
  }
}

export const searchController = new SearchController()