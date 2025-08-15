import { Request, Response, NextFunction } from 'express'
import { prisma } from '../config/db'
import { ValidationError } from '../middleware/errorHandler'
import { logger } from '../utils/logger'

class SearchController {
  // Global search across all content types
  async globalSearch(req: Request, res: Response, next: NextFunction) {
    try {
      const { 
        q, 
        type = 'all', 
        page = 1, 
        limit = 20,
        category,
        priceMin,
        priceMax,
        verified,
        sortBy = 'relevance'
      } = req.query

      if (!q || typeof q !== 'string' || q.trim().length === 0) {
        return res.json({
          results: {
            nfts: [],
            collections: [],
            users: []
          },
          pagination: {
            page: Number(page),
            limit: Number(limit),
            total: 0,
            pages: 0
          },
          message: 'Search query is required'
        })
      }

      if (q.length < 2) {
        return res.json({
          results: {
            nfts: [],
            collections: [],
            users: []
          },
          pagination: {
            page: Number(page),
            limit: Number(limit),
            total: 0,
            pages: 0
          },
          message: 'Search query must be at least 2 characters'
        })
      }

      const searchTerm = q.trim()
      const offset = (Number(page) - 1) * Number(limit)

      // Search results object
      let results: any = {
        nfts: [],
        collections: [],
        users: []
      }

      let totalResults = 0

      // Search NFTs
      if (type === 'all' || type === 'nfts') {
        const nftWhereClause: any = {
          OR: [
            { name: { contains: searchTerm, mode: 'insensitive' } },
            { description: { contains: searchTerm, mode: 'insensitive' } },
            { creator: { 
              OR: [
                { username: { contains: searchTerm, mode: 'insensitive' } },
                { displayName: { contains: searchTerm, mode: 'insensitive' } }
              ]
            }}
          ]
        }

        // Add filters
        if (category) {
          nftWhereClause.category = category
        }

        if (priceMin || priceMax) {
          nftWhereClause.price = {}
          if (priceMin) nftWhereClause.price.gte = parseFloat(priceMin as string)
          if (priceMax) nftWhereClause.price.lte = parseFloat(priceMax as string)
        }

        if (verified === 'true') {
          nftWhereClause.creator = {
            ...nftWhereClause.creator,
            isVerified: true
          }
        }

        // Build order clause
        let nftOrderBy: any = { createdAt: 'desc' }
        if (sortBy === 'price_low') {
          nftOrderBy = { price: 'asc' }
        } else if (sortBy === 'price_high') {
          nftOrderBy = { price: 'desc' }
        } else if (sortBy === 'likes') {
          nftOrderBy = { likeCount: 'desc' }
        } else if (sortBy === 'views') {
          nftOrderBy = { viewCount: 'desc' }
        }

        const [nfts, nftCount] = await Promise.all([
          prisma.nFT.findMany({
            where: nftWhereClause,
            skip: type === 'nfts' ? offset : 0,
            take: type === 'nfts' ? Number(limit) : 10,
            orderBy: nftOrderBy,
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
                  image: true
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
          prisma.nFT.count({ where: nftWhereClause })
        ])

        results.nfts = nfts.map(nft => ({
          ...nft,
          attributes: nft.attributes ? JSON.parse(String(nft.attributes)) : null,
          likeCount: nft._count.likes,
          commentCount: nft._count.comments
        }))

        if (type === 'nfts') {
          totalResults = nftCount
        }
      }

      // Search Collections  
      if (type === 'all' || type === 'collections') {
        const collectionWhereClause: any = {
          OR: [
            { name: { contains: searchTerm, mode: 'insensitive' } },
            { description: { contains: searchTerm, mode: 'insensitive' } },
            { creator: {
              OR: [
                { username: { contains: searchTerm, mode: 'insensitive' } },
                { displayName: { contains: searchTerm, mode: 'insensitive' } }
              ]
            }}
          ]
        }

        if (category) {
          collectionWhereClause.category = category
        }

        if (verified === 'true') {
          collectionWhereClause.isVerified = true
        }

        let collectionOrderBy: any = { createdAt: 'desc' }
        if (sortBy === 'volume') {
          collectionOrderBy = { totalVolume: 'desc' }
        } else if (sortBy === 'items') {
          collectionOrderBy = { createdAt: 'desc' }
        }

        const [collections, collectionCount] = await Promise.all([
          prisma.collection.findMany({
            where: collectionWhereClause,
            skip: type === 'collections' ? offset : 0,
            take: type === 'collections' ? Number(limit) : 10,
            orderBy: collectionOrderBy,
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
          prisma.collection.count({ where: collectionWhereClause })
        ])

        results.collections = collections

        if (type === 'collections') {
          totalResults = collectionCount
        }
      }

      // Search Users
      if (type === 'all' || type === 'users') {
        const userWhereClause: any = {
          OR: [
            { username: { contains: searchTerm, mode: 'insensitive' } },
            { displayName: { contains: searchTerm, mode: 'insensitive' } },
            { address: { contains: searchTerm, mode: 'insensitive' } }
          ]
        }

        if (verified === 'true') {
          userWhereClause.isVerified = true
        }

        let userOrderBy: any = { createdAt: 'desc' }
        if (sortBy === 'followers') {
          userOrderBy = { followers: { _count: 'desc' } }
        } else if (sortBy === 'nfts') {
          userOrderBy = { createdNFTs: { _count: 'desc' } }
        }

        const [users, userCount] = await Promise.all([
          prisma.user.findMany({
            where: userWhereClause,
            skip: type === 'users' ? offset : 0,
            take: type === 'users' ? Number(limit) : 10,
            orderBy: userOrderBy,
            select: {
              id: true,
              address: true,
              username: true,
              displayName: true,
              bio: true,
              avatar: true,
              isVerified: true,
              isEarlyBird: true,
              createdAt: true,
              _count: {
                select: {
                  createdNFTs: true,
                  ownedNFTs: true,
                  followers: true,
                  follows: true
                }
              }
            }
          }),
          prisma.user.count({ where: userWhereClause })
        ])

        results.users = users

        if (type === 'users') {
          totalResults = userCount
        }
      }

      // For global search, calculate total across all types
      if (type === 'all') {
        totalResults = results.nfts.length + results.collections.length + results.users.length
      }

      // Log search query for analytics
      logger.info('Search performed:', {
        query: searchTerm,
        type,
        resultsCount: totalResults,
        filters: { category, priceMin, priceMax, verified, sortBy }
      })

      res.json({
        results,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total: totalResults,
          pages: Math.ceil(totalResults / Number(limit))
        },
        query: searchTerm,
        type,
        filters: {
          category,
          priceMin,
          priceMax,
          verified,
          sortBy
        }
      })

    } catch (error) {
      next(error)
    }
  }

  // Advanced NFT search with multiple filters
  async searchNFTs(req: Request, res: Response, next: NextFunction) {
    try {
      const {
        q,
        page = 1,
        limit = 20,
        category,
        collection,
        creator,
        owner,
        priceMin,
        priceMax,
        isForSale,
        hasAttributes,
        sortBy = 'createdAt',
        sortOrder = 'desc'
      } = req.query

      const offset = (Number(page) - 1) * Number(limit)
      
      // Build complex where clause
      const whereClause: any = {}

      // Text search
      if (q && typeof q === 'string' && q.trim().length > 0) {
        whereClause.OR = [
          { name: { contains: q.trim(), mode: 'insensitive' } },
          { description: { contains: q.trim(), mode: 'insensitive' } }
        ]
      }

      // Category filter
      if (category) {
        whereClause.category = category
      }

      // Collection filter
      if (collection) {
        whereClause.collectionId = collection
      }

      // Creator filter
      if (creator) {
        whereClause.creator = {
          OR: [
            { address: { contains: creator as string, mode: 'insensitive' } },
            { username: { contains: creator as string, mode: 'insensitive' } },
            { displayName: { contains: creator as string, mode: 'insensitive' } }
          ]
        }
      }

      // Owner filter
      if (owner) {
        whereClause.owner = {
          OR: [
            { address: { contains: owner as string, mode: 'insensitive' } },
            { username: { contains: owner as string, mode: 'insensitive' } },
            { displayName: { contains: owner as string, mode: 'insensitive' } }
          ]
        }
      }

      // Price range filter
      if (priceMin || priceMax) {
        whereClause.price = {}
        if (priceMin) whereClause.price.gte = parseFloat(priceMin as string)
        if (priceMax) whereClause.price.lte = parseFloat(priceMax as string)
      }

      // For sale filter
      if (isForSale === 'true') {
        whereClause.isForSale = true
      } else if (isForSale === 'false') {
        whereClause.isForSale = false
      }

      // Has attributes filter
      if (hasAttributes === 'true') {
        whereClause.attributes = { not: null }
      }

      // Build order clause
      const orderBy: any = {}
      if (sortBy === 'price') {
        orderBy.price = sortOrder
      } else if (sortBy === 'likes') {
        orderBy.likeCount = sortOrder
      } else if (sortBy === 'views') {
        orderBy.viewCount = sortOrder
      } else if (sortBy === 'name') {
        orderBy.name = sortOrder
      } else {
        orderBy.createdAt = sortOrder
      }

      // Execute search
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
            collection: {
              select: {
                id: true,
                name: true,
                image: true
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

      // Parse attributes
      const nftsWithParsedAttributes = nfts.map(nft => ({
        ...nft,
        attributes: nft.attributes ? JSON.parse(String(nft.attributes)) : null,
        likeCount: nft._count.likes,
        commentCount: nft._count.comments
      }))

      res.json({
        nfts: nftsWithParsedAttributes,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit))
        },
        query: q,
        filters: {
          category,
          collection,
          creator,
          owner,
          priceMin,
          priceMax,
          isForSale,
          hasAttributes,
          sortBy,
          sortOrder
        }
      })

    } catch (error) {
      next(error)
    }
  }

  // Search suggestions/autocomplete
  async getSearchSuggestions(req: Request, res: Response, next: NextFunction) {
    try {
      const { q, type = 'all', limit = 10 } = req.query

      if (!q || typeof q !== 'string' || q.trim().length < 2) {
        return res.json({
          suggestions: []
        })
      }

      const searchTerm = q.trim()
      const suggestions: any[] = []

      // NFT suggestions
      if (type === 'all' || type === 'nfts') {
        const nftSuggestions = await prisma.nFT.findMany({
          where: {
            OR: [
              { name: { startsWith: searchTerm, mode: 'insensitive' } },
              { name: { contains: searchTerm, mode: 'insensitive' } }
            ]
          },
          take: Number(limit),
          select: {
            id: true,
            name: true,
            image: true
          },
          orderBy: { likeCount: 'desc' }
        })

        suggestions.push(...nftSuggestions.map(nft => ({
          type: 'nft',
          id: nft.id,
          title: nft.name,
          image: nft.image
        })))
      }

      // Collection suggestions
      if (type === 'all' || type === 'collections') {
        const collectionSuggestions = await prisma.collection.findMany({
          where: {
            OR: [
              { name: { startsWith: searchTerm, mode: 'insensitive' } },
              { name: { contains: searchTerm, mode: 'insensitive' } }
            ]
          },
          take: Number(limit),
          select: {
            id: true,
            name: true,
            image: true
          },
          orderBy: { createdAt: 'desc' }
        })

        suggestions.push(...collectionSuggestions.map(collection => ({
          type: 'collection',
          id: collection.id,
          title: collection.name,
          image: collection.image
        })))
      }

      // User suggestions
      if (type === 'all' || type === 'users') {
        const userSuggestions = await prisma.user.findMany({
          where: {
            OR: [
              { username: { startsWith: searchTerm, mode: 'insensitive' } },
              { displayName: { startsWith: searchTerm, mode: 'insensitive' } },
              { username: { contains: searchTerm, mode: 'insensitive' } },
              { displayName: { contains: searchTerm, mode: 'insensitive' } }
            ]
          },
          take: Number(limit),
          select: {
            id: true,
            username: true,
            displayName: true,
            avatar: true,
            isVerified: true
          },
          orderBy: { followers: { _count: 'desc' } }
        })

        suggestions.push(...userSuggestions.map(user => ({
          type: 'user',
          id: user.id,
          title: user.displayName || user.username,
          subtitle: user.username,
          image: user.avatar,
          verified: user.isVerified
        })))
      }

      // Limit total suggestions and sort by relevance
      const limitedSuggestions = suggestions
        .slice(0, Number(limit))
        .sort((a, b) => {
          // Prioritize exact matches at the beginning
          const aExact = a.title.toLowerCase().startsWith(searchTerm.toLowerCase())
          const bExact = b.title.toLowerCase().startsWith(searchTerm.toLowerCase())
          
          if (aExact && !bExact) return -1
          if (!aExact && bExact) return 1
          
          return 0
        })

      res.json({
        suggestions: limitedSuggestions,
        query: searchTerm
      })

    } catch (error) {
      next(error)
    }
  }

  // Get popular search terms
  async getPopularSearches(req: Request, res: Response, next: NextFunction) {
    try {
      // In a real implementation, you would track search queries
      // For now, return popular categories and collections
      
      const [
        popularCategories,
        popularCollections,
        popularCreators
      ] = await Promise.all([
        // Categories removed - not available in current schema
        Promise.resolve([]),
        // Most popular collections by NFT count
        prisma.collection.findMany({
          orderBy: { createdAt: 'desc' },
          take: 8,
          select: {
            id: true,
            name: true,
            image: true,
            _count: {
              select: {
                nfts: true
              }
            }
          }
        }),
        // Most followed creators
        prisma.user.findMany({
          orderBy: { followers: { _count: 'desc' } },
          take: 8,
          select: {
            id: true,
            username: true,
            displayName: true,
            avatar: true,
            isVerified: true
          }
        })
      ])

      res.json({
        popular: {
          categories: popularCategories.map(cat => ({
            name: cat.category,
            count: cat._count.category
          })),
          collections: popularCollections,
          creators: popularCreators
        }
      })

    } catch (error) {
      next(error)
    }
  }

  // Search by attributes (for NFTs with metadata)
  async searchByAttributes(req: Request, res: Response, next: NextFunction) {
    try {
      const { attributes, collection, page = 1, limit = 20 } = req.body

      if (!attributes || !Array.isArray(attributes) || attributes.length === 0) {
        throw new ValidationError('Attributes array is required')
      }

      const offset = (Number(page) - 1) * Number(limit)

      // Build attribute search conditions
      const attributeConditions = attributes.map(attr => {
        if (!attr.trait_type || !attr.value) {
          throw new ValidationError('Each attribute must have trait_type and value')
        }
        
        return {
          attributes: {
            contains: `"${attr.trait_type}"`
          },
          AND: {
            attributes: {
              contains: `"${attr.value}"`
            }
          }
        }
      })

      const whereClause: any = {
        AND: attributeConditions
      }

      if (collection) {
        whereClause.collectionId = collection
      }

      const [nfts, total] = await Promise.all([
        prisma.nFT.findMany({
          where: whereClause,
          skip: offset,
          take: Number(limit),
          orderBy: { createdAt: 'desc' },
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
                image: true
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

      // Parse attributes for display
      const nftsWithParsedAttributes = nfts.map(nft => ({
        ...nft,
        attributes: nft.attributes ? JSON.parse(String(nft.attributes)) : null,
        likeCount: nft._count.likes,
        commentCount: nft._count.comments
      }))

      res.json({
        nfts: nftsWithParsedAttributes,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit))
        },
        searchAttributes: attributes,
        collection
      })

    } catch (error) {
      next(error)
    }
  }
}

export const searchController = new SearchController()