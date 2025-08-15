import { Request, Response, NextFunction } from 'express'
import { prisma } from '../config/db'
import { NotFoundError, ForbiddenError, ValidationError } from '../middleware/errorHandler'
import { logger } from '../utils/logger'
import { isValidEthereumAddress } from '../utils/web3'

class NFTController {
  // Create NFT
  async createNFT(req: Request, res: Response, next: NextFunction) {
    try {
      const {
        name,
        description,
        image,
        animationUrl,
        externalUrl,
        price,
        contractAddress,
        tokenId,
        collectionId,
        attributes,
        isNSFW
      } = req.body
      
      const currentUser = req.user
      
      if (!currentUser) {
        throw new ForbiddenError('Authentication required')
      }
      
      // Validate required fields
      if (!name || !description || !image) {
        throw new ValidationError('Name, description, and image are required')
      }
      
      if (name.length > 100) {
        throw new ValidationError('Name must be less than 100 characters')
      }
      
      if (description.length > 1000) {
        throw new ValidationError('Description must be less than 1000 characters')
      }
      
      // Validate collection if provided
      let collection = null
      if (collectionId) {
        collection = await prisma.collection.findUnique({
          where: { id: collectionId }
        })
        
        if (!collection) {
          throw new NotFoundError('Collection not found')
        }
        
        // Check if user owns the collection
        if (collection.creatorId !== currentUser.id) {
          throw new ForbiddenError('You can only add NFTs to your own collections')
        }
      }
      
      // Validate contract address if provided
      if (contractAddress && !isValidEthereumAddress(contractAddress)) {
        throw new ValidationError('Invalid contract address')
      }
      
      // Create NFT
      const nft = await prisma.nFT.create({
        data: {
          name,
          description,
          image,
          animationUrl,
          externalUrl,
          price: price ? parseFloat(price) : null,
          contractAddress: contractAddress?.toLowerCase() || "0x0000000000000000000000000000000000000000",
          chainId: 1,
          tokenId: tokenId ? String(tokenId) : "0",
          creatorId: currentUser.id,
          ownerId: currentUser.id,
          collectionId,
          attributes: attributes ? JSON.stringify(attributes) : null,
          viewCount: 0,
          likeCount: 0
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
              image: true
            }
          }
        }
      })
      
      logger.info('NFT created:', { nftId: nft.id, userId: currentUser.id })
      
      res.status(201).json({
        message: 'NFT created successfully',
        nft
      })
      
    } catch (error) {
      next(error)
    }
  }
  
  // Get NFT by ID
  async getNFTById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params
      const currentUser = req.user
      
      const nft = await prisma.nFT.findUnique({
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
              image: true,
              description: true
            }
          },
          _count: {
            select: {
              likes: true,
              comments: true
            }
          }
        }
      })
      
      if (!nft) {
        throw new NotFoundError('NFT not found')
      }
      
      // Increment view count (async, don't wait)
      prisma.nFT.update({
        where: { id },
        data: { viewCount: { increment: 1 } }
      }).catch(() => {})
      
      // Check if current user liked this NFT
      let isLiked = false
      if (currentUser) {
        const like = await prisma.like.findUnique({
          where: {
            userId_nftId: {
              userId: currentUser.id,
              nftId: nft.id
            }
          }
        })
        isLiked = !!like
      }
      
      // Parse attributes
      let parsedAttributes = null
      if (nft.attributes) {
        try {
          parsedAttributes = JSON.parse(String(nft.attributes))
        } catch (e) {
          logger.warn('Failed to parse NFT attributes:', { nftId: id })
        }
      }
      
      res.json({
        nft: {
          ...nft,
          attributes: parsedAttributes,
          isLiked,
          likeCount: nft._count.likes,
          commentCount: nft._count.comments
        }
      })
      
    } catch (error) {
      next(error)
    }
  }
  
  // Update NFT
  async updateNFT(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params
      const {
        name,
        description,
        externalUrl,
        price,
        attributes,
        isNSFW
      } = req.body
      
      const currentUser = req.user
      
      if (!currentUser) {
        throw new ForbiddenError('Authentication required')
      }
      
      // Find NFT
      const nft = await prisma.nFT.findUnique({
        where: { id }
      })
      
      if (!nft) {
        throw new NotFoundError('NFT not found')
      }
      
      // Check ownership
      if (nft.ownerId !== currentUser.id) {
        throw new ForbiddenError('You can only update your own NFTs')
      }
      
      // Validate inputs
      if (name && name.length > 100) {
        throw new ValidationError('Name must be less than 100 characters')
      }
      
      if (description && description.length > 1000) {
        throw new ValidationError('Description must be less than 1000 characters')
      }
      
      // Update NFT
      const updatedNFT = await prisma.nFT.update({
        where: { id },
        data: {
          name,
          description,
          externalUrl,
          price: price !== undefined ? parseFloat(price) : undefined,
          attributes: attributes ? JSON.stringify(attributes) : undefined,
            updatedAt: new Date()
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
              image: true
            }
          }
        }
      })
      
      logger.info('NFT updated:', { nftId: id, userId: currentUser.id })
      
      res.json({
        message: 'NFT updated successfully',
        nft: {
          ...updatedNFT,
          attributes: updatedNFT.attributes ? JSON.parse(String(updatedNFT.attributes)) : null
        }
      })
      
    } catch (error) {
      next(error)
    }
  }
  
  // Delete NFT
  async deleteNFT(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params
      const currentUser = req.user
      
      if (!currentUser) {
        throw new ForbiddenError('Authentication required')
      }
      
      // Find NFT
      const nft = await prisma.nFT.findUnique({
        where: { id }
      })
      
      if (!nft) {
        throw new NotFoundError('NFT not found')
      }
      
      // Check ownership
      if (nft.ownerId !== currentUser.id) {
        throw new ForbiddenError('You can only delete your own NFTs')
      }
      
      // Delete NFT (cascade delete will handle related records)
      await prisma.nFT.delete({
        where: { id }
      })
      
      logger.info('NFT deleted:', { nftId: id, userId: currentUser.id })
      
      res.json({
        message: 'NFT deleted successfully'
      })
      
    } catch (error) {
      next(error)
    }
  }
  
  // List NFTs with filtering and pagination
  async listNFTs(req: Request, res: Response, next: NextFunction) {
    try {
      const {
        page = 1,
        limit = 20,
        collection,
        creator,
        owner,
        minPrice,
        maxPrice,
        sortBy = 'createdAt',
        sortOrder = 'desc',
        search
      } = req.query
      
      const offset = (Number(page) - 1) * Number(limit)
      
      // Build where clause
      const whereClause: any = {}
      
      // Category filtering removed - not available in current schema
      
      if (collection) {
        whereClause.collectionId = collection
      }
      
      if (creator) {
        whereClause.creator = { address: { contains: creator as string, mode: 'insensitive' } }
      }
      
      if (owner) {
        whereClause.owner = { address: { contains: owner as string, mode: 'insensitive' } }
      }
      
      
      if (minPrice || maxPrice) {
        whereClause.price = {}
        if (minPrice) whereClause.price.gte = parseFloat(minPrice as string)
        if (maxPrice) whereClause.price.lte = parseFloat(maxPrice as string)
      }
      
      if (search) {
        whereClause.OR = [
          { name: { contains: search as string, mode: 'insensitive' } },
          { description: { contains: search as string, mode: 'insensitive' } }
        ]
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
      
      // Parse attributes for each NFT
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
        filters: {
            collection,
          creator,
          owner,
            minPrice,
          maxPrice,
          search
        }
      })
      
    } catch (error) {
      next(error)
    }
  }
  
  // Toggle like/unlike NFT
  async toggleLike(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params
      const currentUser = req.user
      
      if (!currentUser) {
        throw new ForbiddenError('Authentication required')
      }
      
      // Check if NFT exists
      const nft = await prisma.nFT.findUnique({
        where: { id }
      })
      
      if (!nft) {
        throw new NotFoundError('NFT not found')
      }
      
      // Check if user already liked this NFT
      const existingLike = await prisma.like.findUnique({
        where: {
          userId_nftId: {
            userId: currentUser.id,
            nftId: id
          }
        }
      })
      
      if (existingLike) {
        // Unlike
        await Promise.all([
          prisma.like.delete({
            where: { id: existingLike.id }
          }),
          prisma.nFT.update({
            where: { id },
            data: { likeCount: { decrement: 1 } }
          })
        ])
        
        logger.info('NFT unliked:', { nftId: id, userId: currentUser.id })
        
        res.json({
          message: 'NFT unliked successfully',
          isLiked: false
        })
      } else {
        // Like
        await Promise.all([
          prisma.like.create({
            data: {
              userId: currentUser.id,
              nftId: id
            }
          }),
          prisma.nFT.update({
            where: { id },
            data: { likeCount: { increment: 1 } }
          })
        ])
        
        logger.info('NFT liked:', { nftId: id, userId: currentUser.id })
        
        res.json({
          message: 'NFT liked successfully',
          isLiked: true
        })
      }
      
    } catch (error) {
      next(error)
    }
  }
  
  // Get NFT comments
  async getNFTComments(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params
      const { page = 1, limit = 20 } = req.query
      
      const offset = (Number(page) - 1) * Number(limit)
      
      // Check if NFT exists
      const nft = await prisma.nFT.findUnique({
        where: { id }
      })
      
      if (!nft) {
        throw new NotFoundError('NFT not found')
      }
      
      const [comments, total] = await Promise.all([
        prisma.comment.findMany({
          where: { nftId: id },
          skip: offset,
          take: Number(limit),
          orderBy: { createdAt: 'desc' },
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
        }),
        prisma.comment.count({ where: { nftId: id } })
      ])
      
      res.json({
        comments,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit))
        }
      })
      
    } catch (error) {
      next(error)
    }
  }
  
  // Add comment to NFT
  async addComment(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params
      const { content } = req.body
      const currentUser = req.user
      
      if (!currentUser) {
        throw new ForbiddenError('Authentication required')
      }
      
      if (!content || content.trim().length === 0) {
        throw new ValidationError('Comment content is required')
      }
      
      if (content.length > 500) {
        throw new ValidationError('Comment must be less than 500 characters')
      }
      
      // Check if NFT exists
      const nft = await prisma.nFT.findUnique({
        where: { id }
      })
      
      if (!nft) {
        throw new NotFoundError('NFT not found')
      }
      
      const comment = await prisma.comment.create({
        data: {
          content: content.trim(),
          userId: currentUser.id,
          nftId: id
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
      
      logger.info('Comment added:', { commentId: comment.id, nftId: id, userId: currentUser.id })
      
      res.status(201).json({
        message: 'Comment added successfully',
        comment
      })
      
    } catch (error) {
      next(error)
    }
  }
  
  // Update comment
  async updateComment(req: Request, res: Response, next: NextFunction) {
    try {
      const { commentId } = req.params
      const { content } = req.body
      const currentUser = req.user
      
      if (!currentUser) {
        throw new ForbiddenError('Authentication required')
      }
      
      if (!content || content.trim().length === 0) {
        throw new ValidationError('Comment content is required')
      }
      
      if (content.length > 500) {
        throw new ValidationError('Comment must be less than 500 characters')
      }
      
      const comment = await prisma.comment.findUnique({
        where: { id: commentId }
      })
      
      if (!comment) {
        throw new NotFoundError('Comment not found')
      }
      
      if (comment.userId !== currentUser.id) {
        throw new ForbiddenError('You can only update your own comments')
      }
      
      const updatedComment = await prisma.comment.update({
        where: { id: commentId },
        data: {
          content: content.trim(),
          updatedAt: new Date()
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
      
      logger.info('Comment updated:', { commentId, userId: currentUser.id })
      
      res.json({
        message: 'Comment updated successfully',
        comment: updatedComment
      })
      
    } catch (error) {
      next(error)
    }
  }
  
  // Delete comment
  async deleteComment(req: Request, res: Response, next: NextFunction) {
    try {
      const { commentId } = req.params
      const currentUser = req.user
      
      if (!currentUser) {
        throw new ForbiddenError('Authentication required')
      }
      
      const comment = await prisma.comment.findUnique({
        where: { id: commentId }
      })
      
      if (!comment) {
        throw new NotFoundError('Comment not found')
      }
      
      if (comment.userId !== currentUser.id) {
        throw new ForbiddenError('You can only delete your own comments')
      }
      
      await prisma.comment.delete({
        where: { id: commentId }
      })
      
      logger.info('Comment deleted:', { commentId, userId: currentUser.id })
      
      res.json({
        message: 'Comment deleted successfully'
      })
      
    } catch (error) {
      next(error)
    }
  }
  
  // Transfer NFT ownership
  async transferNFT(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params
      const { newOwnerAddress } = req.body
      const currentUser = req.user
      
      if (!currentUser) {
        throw new ForbiddenError('Authentication required')
      }
      
      if (!isValidEthereumAddress(newOwnerAddress)) {
        throw new ValidationError('Invalid new owner address')
      }
      
      // Find NFT
      const nft = await prisma.nFT.findUnique({
        where: { id }
      })
      
      if (!nft) {
        throw new NotFoundError('NFT not found')
      }
      
      if (nft.ownerId !== currentUser.id) {
        throw new ForbiddenError('You can only transfer your own NFTs')
      }
      
      // Find new owner
      const newOwner = await prisma.user.findUnique({
        where: { address: newOwnerAddress.toLowerCase() }
      })
      
      if (!newOwner) {
        throw new NotFoundError('New owner not found')
      }
      
      if (newOwner.id === currentUser.id) {
        throw new ValidationError('Cannot transfer NFT to yourself')
      }
      
      // Transfer ownership
      const updatedNFT = await prisma.nFT.update({
        where: { id },
        data: {
          ownerId: newOwner.id,
          price: null, // Remove from sale when transferred
          updatedAt: new Date()
        },
        include: {
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
      
      logger.info('NFT transferred:', {
        nftId: id,
        fromUserId: currentUser.id,
        toUserId: newOwner.id
      })
      
      res.json({
        message: 'NFT transferred successfully',
        nft: updatedNFT
      })
      
    } catch (error) {
      next(error)
    }
  }
  
  // Get trending NFTs
  async getTrendingNFTs(req: Request, res: Response, next: NextFunction) {
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
      
      const trendingNFTs = await prisma.nFT.findMany({
        take: Number(limit),
        orderBy: [
          { likeCount: 'desc' },
          { viewCount: 'desc' },
          { createdAt: 'desc' }
        ],
        where: {
          createdAt: {
            gte: dateFrom
          }
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
      })
      
      const nftsWithParsedAttributes = trendingNFTs.map(nft => ({
        ...nft,
        attributes: nft.attributes ? JSON.parse(String(nft.attributes)) : null,
        likeCount: nft._count.likes,
        commentCount: nft._count.comments
      }))
      
      res.json({
        trending: nftsWithParsedAttributes,
        period,
        total: trendingNFTs.length
      })
      
    } catch (error) {
      next(error)
    }
  }
}

export const nftController = new NFTController()