import { Request, Response, NextFunction } from 'express'
import { prisma } from '../config/database'
import { NotFoundError, ForbiddenError, ValidationError } from '../middleware/errorHandler'
import { logger } from '../utils/logger'
import {
  getTokenInfo,
  getTokenBalance,
  getTokenTotalSupply,
  getTokenURI,
  isMintingActive,
  getCountdownTimeLeft,
  calculateMintFees,
  getAccumulatedFees
} from '../utils/web3'

class NFTController {
  // Get all NFTs with filters
  async getNFTs(req: Request, res: Response, next: NextFunction) {
    try {
      const { 
        page = 1, 
        limit = 20, 
        chainId, 
        collection, 
        owner, 
        creator,
        priceMin,
        priceMax,
        sortBy = 'createdAt',
        sortOrder = 'desc'
      } = req.query
      
      const offset = (Number(page) - 1) * Number(limit)
      
      // Build where clause
      const where: any = {}
      
      if (chainId) where.chainId = Number(chainId)
      if (collection) where.contractAddress = collection
      if (owner) where.owner = { address: String(owner).toLowerCase() }
      if (creator) where.creator = { address: String(creator).toLowerCase() }
      
      if (priceMin || priceMax) {
        where.price = {}
        if (priceMin) where.price.gte = priceMin
        if (priceMax) where.price.lte = priceMax
      }
      
      // Build order by
      const orderBy: any = {}
      orderBy[String(sortBy)] = sortOrder
      
      const [nfts, total] = await Promise.all([
        prisma.nFT.findMany({
          where,
          skip: offset,
          take: Number(limit),
          orderBy,
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
        }),
        prisma.nFT.count({ where })
      ])
      
      res.json({
        nfts,
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
  
  // Get trending NFTs
  async getTrendingNFTs(req: Request, res: Response, next: NextFunction) {
    try {
      const { page = 1, limit = 20 } = req.query
      const offset = (Number(page) - 1) * Number(limit)
      
      // Get NFTs sorted by views and likes (trending algorithm)
      const nfts = await prisma.nFT.findMany({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
          }
        },
        skip: offset,
        take: Number(limit),
        orderBy: [
          { viewCount: 'desc' },
          { likeCount: 'desc' },
          { createdAt: 'desc' }
        ],
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
              name: true
            }
          }
        }
      })
      
      res.json({
        nfts,
        pagination: {
          page: Number(page),
          limit: Number(limit)
        }
      })
      
    } catch (error) {
      next(error)
    }
  }
  
  // Get NFT by ID
  async getNFTById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params
      
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
              description: true,
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
      
      if (!nft) {
        throw new NotFoundError('NFT not found')
      }
      
      res.json({ nft })
      
    } catch (error) {
      next(error)
    }
  }
  
  // Create/mint NFT
  async createNFT(req: Request, res: Response, next: NextFunction) {
    try {
      const {
        tokenId,
        contractAddress,
        chainId,
        name,
        description,
        image,
        animationUrl,
        attributes,
        creatorAddress,
        ownerAddress,
        collectionId,
        price,
        currency = 'ETH',
        maxSupply,
        mintPrice
      } = req.body

      const userId = req.user?.id
      if (!userId) {
        return res.status(401).json({
          error: 'Authentication required',
          message: 'User must be authenticated to create NFT'
        })
      }

      // Validate required fields
      if (!tokenId || !contractAddress || !chainId || !name || !image) {
        return res.status(400).json({
          error: 'Missing required fields',
          message: 'tokenId, contractAddress, chainId, name, and image are required'
        })
      }

      // Find or create creator
      let creator = await prisma.user.findUnique({
        where: { address: String(creatorAddress).toLowerCase() }
      })

      if (!creator) {
        // Auto-create user if doesn't exist
        creator = await prisma.user.create({
          data: {
            address: String(creatorAddress).toLowerCase(),
            isVerified: true,
            zrmBalance: 0
          }
        })
      }

      // Find or create owner (if different from creator)
      let owner = creator
      if (ownerAddress && ownerAddress !== creatorAddress) {
        owner = await prisma.user.findUnique({
          where: { address: String(ownerAddress).toLowerCase() }
        })

        if (!owner) {
          owner = await prisma.user.create({
            data: {
              address: String(ownerAddress).toLowerCase(),
              isVerified: true,
              zrmBalance: 0
            }
          })
        }
      }

      // Check if NFT already exists
      const existingNFT = await prisma.nFT.findUnique({
        where: {
          contractAddress_tokenId: {
            contractAddress: String(contractAddress).toLowerCase(),
            tokenId: String(tokenId)
          }
        }
      })

      if (existingNFT) {
        return res.status(409).json({
          error: 'NFT already exists',
          message: `NFT with tokenId ${tokenId} already exists on contract ${contractAddress}`
        })
      }

      // Create NFT
      const nft = await prisma.nFT.create({
        data: {
          tokenId: String(tokenId),
          contractAddress: String(contractAddress).toLowerCase(),
          chainId: Number(chainId),
          name: String(name),
          description: description ? String(description) : '',
          image: String(image),
          animationUrl: animationUrl ? String(animationUrl) : null,
          attributes: attributes ? JSON.stringify(attributes) : null,
          creatorId: creator.id,
          ownerId: owner.id,
          collectionId: collectionId || null,
          price: price ? parseFloat(String(price)) : null,
          currency: String(currency),
          maxSupply: maxSupply ? Number(maxSupply) : null,
          mintPrice: mintPrice ? parseFloat(String(mintPrice)) : null,
          isListed: price ? true : false,
          viewCount: 0,
          likeCount: 0
        },
        include: {
          creator: {
            select: {
              id: true,
              address: true,
              username: true,
              displayName: true,
              avatar: true
            }
          },
          owner: {
            select: {
              id: true,
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

      logger.info(`NFT created successfully: ${nft.id}`, {
        tokenId: nft.tokenId,
        contractAddress: nft.contractAddress,
        creator: creator.address,
        owner: owner.address
      })

      res.status(201).json({
        success: true,
        nft: {
          id: nft.id,
          tokenId: nft.tokenId,
          contractAddress: nft.contractAddress,
          chainId: nft.chainId,
          name: nft.name,
          description: nft.description,
          image: nft.image,
          animationUrl: nft.animationUrl,
          attributes: nft.attributes ? JSON.parse(String(nft.attributes)) : null,
          creator: nft.creator,
          owner: nft.owner,
          collection: nft.collection,
          price: nft.price ? Number(nft.price) : null,
          currency: nft.currency,
          maxSupply: nft.maxSupply,
          mintPrice: nft.mintPrice ? Number(nft.mintPrice) : null,
          isListed: nft.isListed,
          viewCount: nft.viewCount,
          likeCount: nft.likeCount,
          createdAt: nft.createdAt,
          updatedAt: nft.updatedAt
        },
        message: 'NFT created successfully'
      })

    } catch (error) {
      logger.error('NFT creation error:', error)
      next(error)
    }
  }
  
  // Update NFT
  async updateNFT(req: Request, res: Response, next: NextFunction) {
    try {
      res.json({
        message: 'NFT update not implemented yet'
      })
    } catch (error) {
      next(error)
    }
  }
  
  // List NFT for sale
  async listNFT(req: Request, res: Response, next: NextFunction) {
    try {
      res.json({
        message: 'NFT listing not implemented yet'
      })
    } catch (error) {
      next(error)
    }
  }
  
  // Delist NFT
  async delistNFT(req: Request, res: Response, next: NextFunction) {
    try {
      res.json({
        message: 'NFT delisting not implemented yet'
      })
    } catch (error) {
      next(error)
    }
  }
  
  // Buy NFT
  async buyNFT(req: Request, res: Response, next: NextFunction) {
    try {
      res.json({
        message: 'NFT purchase not implemented yet'
      })
    } catch (error) {
      next(error)
    }
  }
  
  // Toggle like/unlike
  async toggleLike(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params
      const currentUser = req.user
      
      if (!currentUser) {
        throw new NotFoundError('User not authenticated')
      }
      
      // Check if NFT exists
      const nft = await prisma.nFT.findUnique({ where: { id } })
      if (!nft) {
        throw new NotFoundError('NFT not found')
      }
      
      // Check if already liked
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
        await prisma.like.delete({ where: { id: existingLike.id } })
        
        res.json({
          message: 'NFT unliked',
          isLiked: false
        })
      } else {
        // Like
        await prisma.like.create({
          data: {
            userId: currentUser.id,
            nftId: id
          }
        })
        
        res.json({
          message: 'NFT liked',
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
            },
            replies: {
              take: 3,
              orderBy: { createdAt: 'asc' },
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
            },
            _count: {
              select: {
                replies: true
              }
            }
          }
        }),
        prisma.comment.count({ where: { nftId: id, parentId: null } })
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
  
  // Add comment
  async addComment(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params
      const { content, parentId } = req.body
      const currentUser = req.user
      
      if (!currentUser) {
        throw new NotFoundError('User not authenticated')
      }
      
      // Check if NFT exists
      const nft = await prisma.nFT.findUnique({ where: { id } })
      if (!nft) {
        throw new NotFoundError('NFT not found')
      }
      
      // If parentId provided, check if parent comment exists
      if (parentId) {
        const parentComment = await prisma.comment.findUnique({ where: { id: parentId } })
        if (!parentComment) {
          throw new NotFoundError('Parent comment not found')
        }
      }
      
      // Create comment
      const comment = await prisma.comment.create({
        data: {
          content,
          nftId: id,
          userId: currentUser.id,
          parentId: parentId || null
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
          _count: {
            select: {
              replies: true
            }
          }
        }
      })
      
      res.status(201).json({
        success: true,
        message: 'Comment added successfully',
        comment
      })
      
    } catch (error) {
      next(error)
    }
  }
  
  // Promote NFT
  async promoteNFT(req: Request, res: Response, next: NextFunction) {
    try {
      res.json({
        message: 'NFT promotion not implemented yet'
      })
    } catch (error) {
      next(error)
    }
  }
  
  // Get NFT analytics
  async getNFTAnalytics(req: Request, res: Response, next: NextFunction) {
    try {
      res.json({
        analytics: {},
        message: 'Analytics not implemented yet'
      })
    } catch (error) {
      next(error)
    }
  }
  
  // Track view
  async trackView(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params
      
      // Update view count
      await prisma.nFT.update({
        where: { id },
        data: {
          viewCount: {
            increment: 1
          }
        }
      })
      
      res.json({
        message: 'View tracked successfully'
      })
      
    } catch (error) {
      next(error)
    }
  }

  // ============ ERC-1155 TOKEN METHODS (v2.0) ============

  // Create token in existing collection
  async createToken(req: Request, res: Response, next: NextFunction) {
    try {
      const {
        collectionAddress,
        chainId,
        name,
        description,
        tokenURI,
        customPrice,
        mintEndTime,
        attributes
      } = req.body

      const userAddress = req.user?.address

      if (!userAddress) {
        throw new ValidationError('User address is required')
      }

      if (!collectionAddress || !chainId || !name || !tokenURI) {
        throw new ValidationError('Missing required fields: collectionAddress, chainId, name, tokenURI')
      }

      // Validate IPFS URI
      if (!tokenURI.startsWith('ipfs://')) {
        throw new ValidationError('Token URI must be an IPFS URL')
      }

      // Find collection in database
      const collection = await prisma.collection.findUnique({
        where: { contractAddress: collectionAddress }
      })

      if (!collection) {
        throw new NotFoundError('Collection not found in database')
      }

      // Check if user is collection creator
      if (collection.creatorAddress !== userAddress.toLowerCase()) {
        throw new ForbiddenError('Only collection creator can add tokens')
      }

      // Create token in database (will be synced with blockchain later)
      const token = await prisma.nFTToken.create({
        data: {
          tokenId: '0', // Will be updated after blockchain creation
          collectionId: collection.id,
          contractAddress: collectionAddress,
          chainId: Number(chainId),
          name: String(name),
          description: description ? String(description) : null,
          tokenURI: String(tokenURI),
          image: null, // Will be extracted from tokenURI metadata
          creatorAddress: userAddress.toLowerCase(),
          mintPrice: customPrice ? parseFloat(String(customPrice)) : 0.000111,
          isCustomPrice: !!customPrice,
          mintEndTime: mintEndTime ? BigInt(mintEndTime) : null,
          totalMinted: 0,
          status: 'Created',
          attributes: attributes ? JSON.stringify(attributes) : null,
          isListed: false,
          floorPrice: null
        }
      })

      logger.info(`Token created in database: ${token.id}`, {
        collectionAddress,
        creator: userAddress,
        tokenURI
      })

      res.status(201).json({
        success: true,
        message: 'Token created successfully',
        token: {
          id: token.id,
          tokenId: token.tokenId,
          collectionId: token.collectionId,
          contractAddress: token.contractAddress,
          chainId: token.chainId,
          name: token.name,
          description: token.description,
          tokenURI: token.tokenURI,
          creatorAddress: token.creatorAddress,
          mintPrice: token.mintPrice,
          isCustomPrice: token.isCustomPrice,
          mintEndTime: token.mintEndTime ? Number(token.mintEndTime) : null,
          totalMinted: token.totalMinted,
          status: token.status,
          createdAt: token.createdAt
        }
      })

    } catch (error) {
      logger.error('Token creation error:', error)
      next(error)
    }
  }

  // Get token by ID (ERC-1155)
  async getTokenById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params

      const token = await prisma.nFTToken.findUnique({
        where: { id },
        include: {
          collection: {
            select: {
              id: true,
              name: true,
              symbol: true,
              contractAddress: true,
              creatorAddress: true,
              chainId: true
            }
          }
        }
      })

      if (!token) {
        throw new NotFoundError('Token not found')
      }

      // Get blockchain data if token is minted
      let blockchainData = null
      if (token.tokenId !== '0' && token.collection) {
        try {
          blockchainData = await getTokenInfo(
            token.collection.chainId,
            token.collection.contractAddress,
            Number(token.tokenId)
          )
        } catch (error) {
          logger.warn(`Failed to get blockchain data for token ${id}:`, error)
        }
      }

      res.json({
        token: {
          id: token.id,
          tokenId: token.tokenId,
          collectionId: token.collectionId,
          contractAddress: token.contractAddress,
          chainId: token.chainId,
          name: token.name,
          description: token.description,
          image: token.image,
          tokenURI: token.tokenURI,
          creatorAddress: token.creatorAddress,
          firstMinter: token.firstMinter,
          mintPrice: token.mintPrice,
          isCustomPrice: token.isCustomPrice,
          mintEndTime: token.mintEndTime ? Number(token.mintEndTime) : null,
          totalMinted: token.totalMinted,
          finalCountdownStart: token.finalCountdownStart ? Number(token.finalCountdownStart) : null,
          status: token.status,
          referrer: token.referrer,
          attributes: token.attributes ? JSON.parse(String(token.attributes)) : null,
          isListed: token.isListed,
          floorPrice: token.floorPrice,
          createdAt: token.createdAt,
          updatedAt: token.updatedAt,
          collection: token.collection,
          blockchainData
        }
      })

    } catch (error) {
      next(error)
    }
  }

  // Get token balance for user
  async getTokenBalance(req: Request, res: Response, next: NextFunction) {
    try {
      const { collectionAddress, tokenId } = req.params
      const { address } = req.query

      if (!address) {
        throw new ValidationError('Address parameter is required')
      }

      // Get collection to determine chain ID
      const collection = await prisma.collection.findUnique({
        where: { contractAddress: collectionAddress }
      })

      if (!collection) {
        throw new NotFoundError('Collection not found')
      }

      const balance = await getTokenBalance(
        collection.chainId,
        collectionAddress,
        String(address),
        Number(tokenId)
      )

      res.json({
        balance,
        address: String(address),
        collectionAddress,
        tokenId: Number(tokenId),
        chainId: collection.chainId
      })

    } catch (error) {
      next(error)
    }
  }

  // Get token supply and minting status
  async getTokenSupplyInfo(req: Request, res: Response, next: NextFunction) {
    try {
      const { collectionAddress, tokenId } = req.params

      // Get collection to determine chain ID
      const collection = await prisma.collection.findUnique({
        where: { contractAddress: collectionAddress }
      })

      if (!collection) {
        throw new NotFoundError('Collection not found')
      }

      const [totalSupply, isMinting, countdownTime, tokenInfo] = await Promise.all([
        getTokenTotalSupply(collection.chainId, collectionAddress, Number(tokenId)),
        isMintingActive(collection.chainId, collectionAddress, Number(tokenId)),
        getCountdownTimeLeft(collection.chainId, collectionAddress, Number(tokenId)),
        getTokenInfo(collection.chainId, collectionAddress, Number(tokenId))
      ])

      res.json({
        tokenId: Number(tokenId),
        totalSupply,
        isMintingActive: isMinting,
        countdownTimeLeft: countdownTime,
        status: tokenInfo.status,
        mintPrice: tokenInfo.mintPrice,
        isCustomPrice: tokenInfo.isCustomPrice,
        finalCountdownStart: tokenInfo.finalCountdownStart,
        creator: tokenInfo.creator,
        firstMinter: tokenInfo.firstMinter,
        referrer: tokenInfo.referrer
      })

    } catch (error) {
      next(error)
    }
  }

  // Calculate mint fees for token
  async calculateTokenMintFees(req: Request, res: Response, next: NextFunction) {
    try {
      const { collectionAddress, tokenId } = req.params
      const { hasReferrer = false } = req.query

      // Get collection and token info
      const collection = await prisma.collection.findUnique({
        where: { contractAddress: collectionAddress }
      })

      if (!collection) {
        throw new NotFoundError('Collection not found')
      }

      const tokenInfo = await getTokenInfo(
        collection.chainId,
        collectionAddress,
        Number(tokenId)
      )

      const fees = await calculateMintFees(
        collection.chainId,
        tokenInfo.mintPrice,
        hasReferrer === 'true',
        tokenInfo.isCustomPrice
      )

      res.json({
        tokenId: Number(tokenId),
        mintPrice: tokenInfo.mintPrice,
        isCustomPrice: tokenInfo.isCustomPrice,
        hasReferrer: hasReferrer === 'true',
        fees: {
          creatorFee: fees.creatorFee,
          firstMinterFee: fees.firstMinterFee,
          referralFee: fees.referralFee,
          platformFee: fees.platformFee
        },
        total: tokenInfo.mintPrice
      })

    } catch (error) {
      next(error)
    }
  }

  // Get accumulated fees for creator
  async getCreatorFees(req: Request, res: Response, next: NextFunction) {
    try {
      const { collectionAddress } = req.params
      const userAddress = req.user?.address

      if (!userAddress) {
        throw new ValidationError('User address is required')
      }

      // Get collection to determine chain ID
      const collection = await prisma.collection.findUnique({
        where: { contractAddress: collectionAddress }
      })

      if (!collection) {
        throw new NotFoundError('Collection not found')
      }

      // Check if user is collection creator
      if (collection.creatorAddress !== userAddress.toLowerCase()) {
        throw new ForbiddenError('Only collection creator can view fees')
      }

      const accumulatedFees = await getAccumulatedFees(
        collection.chainId,
        collectionAddress,
        userAddress
      )

      res.json({
        collectionAddress,
        creatorAddress: userAddress,
        accumulatedFees,
        chainId: collection.chainId
      })

    } catch (error) {
      next(error)
    }
  }

  // Get all tokens in collection
  async getCollectionTokens(req: Request, res: Response, next: NextFunction) {
    try {
      const { collectionAddress } = req.params
      const { page = 1, limit = 20, status } = req.query

      const offset = (Number(page) - 1) * Number(limit)

      // Build where clause
      const where: any = {
        contractAddress: collectionAddress
      }

      if (status) {
        where.status = status
      }

      const [tokens, total] = await Promise.all([
        prisma.nFTToken.findMany({
          where,
          skip: offset,
          take: Number(limit),
          orderBy: { createdAt: 'desc' },
          include: {
            collection: {
              select: {
                id: true,
                name: true,
                symbol: true,
                creatorAddress: true
              }
            }
          }
        }),
        prisma.nFTToken.count({ where })
      ])

      res.json({
        tokens: tokens.map(token => ({
          id: token.id,
          tokenId: token.tokenId,
          name: token.name,
          description: token.description,
          image: token.image,
          tokenURI: token.tokenURI,
          creatorAddress: token.creatorAddress,
          firstMinter: token.firstMinter,
          mintPrice: token.mintPrice,
          isCustomPrice: token.isCustomPrice,
          totalMinted: token.totalMinted,
          status: token.status,
          isListed: token.isListed,
          floorPrice: token.floorPrice,
          attributes: token.attributes ? JSON.parse(String(token.attributes)) : null,
          createdAt: token.createdAt,
          collection: token.collection
        })),
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

  // Update token metadata (creator only)
  async updateToken(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params
      const { description, attributes } = req.body
      const userAddress = req.user?.address

      if (!userAddress) {
        throw new ValidationError('User address is required')
      }

      const token = await prisma.nFTToken.findUnique({
        where: { id }
      })

      if (!token) {
        throw new NotFoundError('Token not found')
      }

      // Check if user is token creator
      if (token.creatorAddress !== userAddress.toLowerCase()) {
        throw new ForbiddenError('Only token creator can update metadata')
      }

      const updatedToken = await prisma.nFTToken.update({
        where: { id },
        data: {
          description: description !== undefined ? description : token.description,
          attributes: attributes !== undefined ? JSON.stringify(attributes) : token.attributes,
          updatedAt: new Date()
        }
      })

      res.json({
        success: true,
        message: 'Token updated successfully',
        token: {
          id: updatedToken.id,
          tokenId: updatedToken.tokenId,
          description: updatedToken.description,
          attributes: updatedToken.attributes ? JSON.parse(String(updatedToken.attributes)) : null,
          updatedAt: updatedToken.updatedAt
        }
      })

    } catch (error) {
      next(error)
    }
  }
}

export const nftController = new NFTController()