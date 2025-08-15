import { Request, Response, NextFunction } from 'express'
import { ethers } from 'ethers'
import { prisma } from '../config/database'
import { NotFoundError, ValidationError, ConflictError } from '../middleware/errorHandler'
import { getNetworkConfig, getFactoryAddress, FACTORY_ABI, COLLECTION_ABI } from '../config/contracts'
import {
  getCollectionsByCreator,
  getCollectionInfoFromFactory,
  isValidCollection,
  getTotalCollections,
  getCollectionBasicInfo
} from '../utils/web3'
import { logger } from '../utils/logger'
// Types will be loaded from types/express.d.ts globally

interface CreateCollectionRequest extends Request {
  body: {
    name: string
    symbol: string
    description?: string
    chainId: number
    isPersonal?: boolean
  }
}

interface CreatePersonalCollectionRequest extends Request {
  body: {
    nftName: string
    tokenURI: string
    chainId: number
    customPrice?: string
    mintEndTime?: number
  }
}

class CollectionController {
  // ==============================================
  // COLLECTION CREATION (v2.0)
  // ==============================================
  
  /**
   * Create a new collection via factory contract
   */
  async createCollection(req: CreateCollectionRequest, res: Response, next: NextFunction) {
    try {
      const { name, symbol, description, chainId, isPersonal = false } = req.body
      const userAddress = req.user?.address
      
      if (!userAddress) {
        throw new ValidationError('User address is required')
      }
      
      // Validate chain ID
      const networkConfig = getNetworkConfig(chainId)
      if (!networkConfig) {
        throw new ValidationError('Unsupported chain ID')
      }
      
      // Check if collection name is already taken by this user
      const existingCollection = await prisma.collection.findFirst({
        where: {
          name,
          creatorAddress: userAddress,
          chainId
        }
      })
      
      if (existingCollection) {
        throw new ConflictError('Collection name already exists for this user')
      }
      
      // For development: generate mock collection address
      // In production: this will be the address returned from factory.createCollection()
      const mockCollectionAddress = ethers.getAddress(ethers.hexlify(ethers.randomBytes(20)))
      
      // TODO: Uncomment when ready to integrate with real Factory contract
      // const factory = getFactoryContract(chainId)
      // const tx = await factory.createCollection([name, symbol, description || '', isPersonal])
      // const receipt = await tx.wait()
      // const collectionAddress = receipt.logs[0].args.collection
      
      // Create collection in database
      const collection = await prisma.collection.create({
        data: {
          name,
          symbol,
          description,
          contractAddress: mockCollectionAddress,
          creatorAddress: userAddress,
          chainId,
          isPersonal,
          isActive: true,
          totalNFTs: 0,
          itemCount: 0,
          ownerCount: 0,
          volume: 0
        }
      })
      
      res.status(201).json({
        message: 'Collection created successfully',
        collection: {
          id: collection.id,
          name: collection.name,
          symbol: collection.symbol,
          description: collection.description,
          contractAddress: collection.contractAddress,
          creatorAddress: collection.creatorAddress,
          chainId: collection.chainId,
          isPersonal: collection.isPersonal,
          createdAt: collection.createdAt
        }
      })
      
    } catch (error) {
      next(error)
    }
  }
  
  /**
   * Create a personal collection with first NFT
   */
  async createPersonalCollection(req: CreatePersonalCollectionRequest, res: Response, next: NextFunction) {
    try {
      const { nftName, tokenURI, chainId, customPrice, mintEndTime } = req.body
      const userAddress = req.user?.address
      
      if (!userAddress) {
        throw new ValidationError('User address is required')
      }
      
      // Validate chain ID
      const networkConfig = getNetworkConfig(chainId)
      if (!networkConfig) {
        throw new ValidationError('Unsupported chain ID')
      }
      
      // Validate IPFS URI
      if (!tokenURI.startsWith('ipfs://')) {
        throw new ValidationError('Token URI must be an IPFS URL')
      }
      
      // Here we would interact with the factory contract to create personal collection
      // For now, mock the response
      const mockCollectionAddress = ethers.getAddress(ethers.hexlify(ethers.randomBytes(20)))
      const mockTokenId = 1
      
      // Create collection in database
      const collection = await prisma.collection.create({
        data: {
          name: nftName,
          symbol: 'ZORIUM',
          contractAddress: mockCollectionAddress,
          creatorAddress: userAddress,
          chainId,
          isPersonal: true,
          isActive: true,
          totalNFTs: 1,
          itemCount: 1,
          ownerCount: 1,
          volume: 0
        }
      })
      
      // Create the NFT token
      const nftToken = await prisma.nFTToken.create({
        data: {
          tokenId: mockTokenId.toString(),
          collectionId: collection.id,
          contractAddress: mockCollectionAddress,
          chainId,
          name: nftName,
          tokenURI,
          creatorAddress: userAddress,
          mintPrice: customPrice ? parseFloat(customPrice) : 0.000111,
          isCustomPrice: !!customPrice,
          mintEndTime: mintEndTime ? BigInt(mintEndTime) : null,
          totalMinted: 1, // Creator's free mint
          status: 'Created'
        }
      })
      
      res.status(201).json({
        message: 'Personal collection created successfully',
        collection: {
          id: collection.id,
          name: collection.name,
          contractAddress: collection.contractAddress,
          creatorAddress: collection.creatorAddress,
          chainId: collection.chainId,
          isPersonal: collection.isPersonal,
          createdAt: collection.createdAt
        },
        token: {
          id: nftToken.id,
          tokenId: nftToken.tokenId,
          name: nftToken.name,
          tokenURI: nftToken.tokenURI,
          mintPrice: nftToken.mintPrice,
          isCustomPrice: nftToken.isCustomPrice,
          status: nftToken.status
        }
      })
      
    } catch (error) {
      next(error)
    }
  }
  
  // ==============================================
  // COLLECTION RETRIEVAL (Updated for v2.0)
  // ==============================================
  
  /**
   * Get all collections with filters
   */
  async getCollections(req: Request, res: Response, next: NextFunction) {
    try {
      const { 
        page = 1, 
        limit = 20, 
        chainId, 
        creator, 
        isPersonal, 
        sort = 'newest' 
      } = req.query
      
      const offset = (Number(page) - 1) * Number(limit)
      
      // Build where clause
      const where: any = {
        isActive: true
      }
      
      if (chainId) {
        where.chainId = Number(chainId)
      }
      
      if (creator) {
        where.creatorAddress = creator as string
      }
      
      if (isPersonal !== undefined) {
        where.isPersonal = isPersonal === 'true'
      }
      
      // Build order by clause
      let orderBy: any = { createdAt: 'desc' }
      
      switch (sort) {
        case 'oldest':
          orderBy = { createdAt: 'asc' }
          break
        case 'name':
          orderBy = { name: 'asc' }
          break
        case 'activity':
          orderBy = { volume: 'desc' }
          break
        default:
          orderBy = { createdAt: 'desc' }
      }
      
      const [collections, total] = await Promise.all([
        prisma.collection.findMany({
          where,
          skip: offset,
          take: Number(limit),
          orderBy,
          include: {
            nftTokens: {
              take: 4, // Preview of first 4 tokens
              orderBy: { createdAt: 'desc' }
            },
            _count: {
              select: {
                nftTokens: true
              }
            }
          }
        }),
        prisma.collection.count({ where })
      ])
      
      res.json({
        collections: collections.map(collection => ({
          id: collection.id,
          name: collection.name,
          symbol: collection.symbol,
          description: collection.description,
          image: collection.image,
          banner: collection.banner,
          contractAddress: collection.contractAddress,
          creatorAddress: collection.creatorAddress,
          chainId: collection.chainId,
          isPersonal: collection.isPersonal,
          floorPrice: collection.floorPrice,
          volume: collection.volume,
          itemCount: collection.itemCount,
          ownerCount: collection.ownerCount,
          totalNFTs: collection.totalNFTs,
          createdAt: collection.createdAt,
          previewTokens: collection.nftTokens.map(token => ({
            id: token.id,
            tokenId: token.tokenId,
            name: token.name,
            image: token.image,
            tokenURI: token.tokenURI
          })),
          tokenCount: collection._count.nftTokens
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
  
  /**
   * Get collection by contract address
   */
  async getCollectionByAddress(req: Request, res: Response, next: NextFunction) {
    try {
      const { contractAddress } = req.params
      
      if (!ethers.isAddress(contractAddress)) {
        throw new ValidationError('Invalid contract address')
      }
      
      const collection = await prisma.collection.findUnique({
        where: { contractAddress },
        include: {
          nftTokens: {
            orderBy: { createdAt: 'desc' },
            take: 20 // First 20 tokens
          },
          _count: {
            select: {
              nftTokens: true
            }
          }
        }
      })
      
      if (!collection) {
        throw new NotFoundError('Collection not found')
      }
      
      res.json({
        collection: {
          id: collection.id,
          name: collection.name,
          symbol: collection.symbol,
          description: collection.description,
          image: collection.image,
          banner: collection.banner,
          contractAddress: collection.contractAddress,
          creatorAddress: collection.creatorAddress,
          chainId: collection.chainId,
          isPersonal: collection.isPersonal,
          website: collection.website,
          discord: collection.discord,
          twitter: collection.twitter,
          floorPrice: collection.floorPrice,
          volume: collection.volume,
          itemCount: collection.itemCount,
          ownerCount: collection.ownerCount,
          totalNFTs: collection.totalNFTs,
          createdAt: collection.createdAt,
          updatedAt: collection.updatedAt,
          tokens: collection.nftTokens.map(token => ({
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
            createdAt: token.createdAt
          })),
          tokenCount: collection._count.nftTokens
        }
      })
      
    } catch (error) {
      next(error)
    }
  }
  
  /**
   * Get collections by creator address
   */
  async getCollectionsByCreator(req: Request, res: Response, next: NextFunction) {
    try {
      const { address } = req.params
      const { page = 1, limit = 20 } = req.query
      
      if (!ethers.isAddress(address)) {
        throw new ValidationError('Invalid creator address')
      }
      
      const offset = (Number(page) - 1) * Number(limit)
      
      const [collections, total] = await Promise.all([
        prisma.collection.findMany({
          where: { 
            creatorAddress: address,
            isActive: true
          },
          skip: offset,
          take: Number(limit),
          orderBy: { createdAt: 'desc' },
          include: {
            nftTokens: {
              take: 1, // Just first token for preview
              orderBy: { createdAt: 'desc' }
            },
            _count: {
              select: {
                nftTokens: true
              }
            }
          }
        }),
        prisma.collection.count({ 
          where: { 
            creatorAddress: address,
            isActive: true
          }
        })
      ])
      
      res.json({
        collections: collections.map(collection => ({
          id: collection.id,
          name: collection.name,
          symbol: collection.symbol,
          description: collection.description,
          image: collection.image || collection.nftTokens[0]?.image,
          contractAddress: collection.contractAddress,
          creatorAddress: collection.creatorAddress,
          chainId: collection.chainId,
          isPersonal: collection.isPersonal,
          floorPrice: collection.floorPrice,
          volume: collection.volume,
          itemCount: collection.itemCount,
          totalNFTs: collection.totalNFTs,
          createdAt: collection.createdAt,
          tokenCount: collection._count.nftTokens
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
  
  // ==============================================
  // LEGACY SUPPORT (Backward compatibility)
  // ==============================================
  
  /**
   * Get collection by UUID (legacy)
   */
  async getCollectionById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params
      
      const collection = await prisma.collection.findUnique({
        where: { id },
        include: {
          nftTokens: {
            orderBy: { createdAt: 'desc' },
            take: 20
          },
          _count: {
            select: {
              nftTokens: true,
              nfts: true // Legacy NFTs count
            }
          }
        }
      })
      
      if (!collection) {
        throw new NotFoundError('Collection not found')
      }
      
      res.json({ 
        collection: {
          ...collection,
          tokenCount: collection._count.nftTokens,
          legacyNFTCount: collection._count.nfts
        }
      })
      
    } catch (error) {
      next(error)
    }
  }
  
  /**
   * Update collection metadata
   */
  async updateCollection(req: Request, res: Response, next: NextFunction) {
    try {
      const { contractAddress } = req.params
      const { description, image, banner, website, discord, twitter } = req.body
      const userAddress = req.user?.address
      
      if (!userAddress) {
        throw new ValidationError('User address is required')
      }
      
      if (!ethers.isAddress(contractAddress)) {
        throw new ValidationError('Invalid contract address')
      }
      
      const collection = await prisma.collection.findUnique({
        where: { contractAddress }
      })
      
      if (!collection) {
        throw new NotFoundError('Collection not found')
      }
      
      if (collection.creatorAddress !== userAddress) {
        throw new ValidationError('Only collection creator can update metadata')
      }
      
      const updatedCollection = await prisma.collection.update({
        where: { contractAddress },
        data: {
          description,
          image,
          banner,
          website,
          discord,
          twitter,
          updatedAt: new Date()
        }
      })
      
      res.json({
        message: 'Collection updated successfully',
        collection: updatedCollection
      })
      
    } catch (error) {
      next(error)
    }
  }
  
  /**
   * Update collection by UUID (legacy)
   */
  async updateCollectionById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params
      const { description, image, banner, website, discord, twitter } = req.body
      const userAddress = req.user?.address
      
      if (!userAddress) {
        throw new ValidationError('User address is required')
      }
      
      const collection = await prisma.collection.findUnique({
        where: { id }
      })
      
      if (!collection) {
        throw new NotFoundError('Collection not found')
      }
      
      // Check if user is creator (either by FK or direct address)
      if (collection.creatorAddress !== userAddress && collection.creatorId) {
        const creator = await prisma.user.findUnique({
          where: { id: collection.creatorId }
        })
        if (!creator || creator.address !== userAddress) {
          throw new ValidationError('Only collection creator can update metadata')
        }
      }
      
      const updatedCollection = await prisma.collection.update({
        where: { id },
        data: {
          description,
          image,
          banner,
          website,
          discord,
          twitter,
          updatedAt: new Date()
        }
      })
      
      res.json({
        message: 'Collection updated successfully',
        collection: updatedCollection
      })
      
    } catch (error) {
      next(error)
    }
  }
  
  /**
   * Get collection NFTs (legacy - supports both old NFTs and new tokens)
   */
  async getCollectionNFTs(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params
      const { page = 1, limit = 20 } = req.query
      const offset = (Number(page) - 1) * Number(limit)
      
      const collection = await prisma.collection.findUnique({
        where: { id }
      })
      
      if (!collection) {
        throw new NotFoundError('Collection not found')
      }
      
      // Get both legacy NFTs and new tokens
      const [legacyNFTs, newTokens, legacyTotal, newTotal] = await Promise.all([
        prisma.nFT.findMany({
          where: { collectionId: id },
          skip: offset,
          take: Number(limit),
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
        }),
        prisma.nFTToken.findMany({
          where: { collectionId: id },
          skip: offset,
          take: Number(limit),
          orderBy: { createdAt: 'desc' }
        }),
        prisma.nFT.count({ where: { collectionId: id } }),
        prisma.nFTToken.count({ where: { collectionId: id } })
      ])
      
      // Combine and format results
      const combinedNFTs = [
        ...legacyNFTs.map(nft => ({
          ...nft,
          type: 'legacy',
          tokenStandard: 'ERC-721'
        })),
        ...newTokens.map(token => ({
          ...token,
          type: 'token',
          tokenStandard: 'ERC-1155'
        }))
      ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      
      res.json({
        nfts: combinedNFTs,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total: legacyTotal + newTotal,
          pages: Math.ceil((legacyTotal + newTotal) / Number(limit)),
          legacyCount: legacyTotal,
          tokenCount: newTotal
        }
      })
      
    } catch (error) {
      next(error)
    }
  }

  // ============ BLOCKCHAIN SYNCHRONIZATION METHODS ============

  /**
   * Sync collections from blockchain for a creator
   */
  async syncCollectionsFromBlockchain(req: Request, res: Response, next: NextFunction) {
    try {
      const { address } = req.params
      const { chainId = 8453 } = req.query // Default to Base

      if (!ethers.isAddress(address)) {
        throw new ValidationError('Invalid creator address')
      }

      // Get collections from blockchain
      const blockchainCollections = await getCollectionsByCreator(Number(chainId), address)

      const syncedCollections = []

      for (const collectionAddress of blockchainCollections) {
        try {
          // Check if collection exists in database
          let collection = await prisma.collection.findUnique({
            where: { contractAddress: collectionAddress }
          })

          if (!collection) {
            // Get collection info from factory
            const factoryInfo = await getCollectionInfoFromFactory(Number(chainId), collectionAddress)
            
            // Get additional info from collection contract
            const basicInfo = await getCollectionBasicInfo(Number(chainId), collectionAddress)

            // Create collection in database
            collection = await prisma.collection.create({
              data: {
                name: basicInfo.name,
                symbol: basicInfo.symbol,
                contractAddress: collectionAddress,
                creatorAddress: factoryInfo.creator.toLowerCase(),
                chainId: Number(chainId),
                isPersonal: factoryInfo.isPersonal,
                isActive: true,
                totalNFTs: factoryInfo.totalTokens,
                itemCount: factoryInfo.totalTokens,
                ownerCount: 0,
                volume: 0,
                createdAt: new Date(factoryInfo.createdAt * 1000)
              }
            })

            syncedCollections.push({
              ...collection,
              status: 'created'
            })
          } else {
            // Update existing collection with latest blockchain data
            const factoryInfo = await getCollectionInfoFromFactory(Number(chainId), collectionAddress)

            await prisma.collection.update({
              where: { id: collection.id },
              data: {
                totalNFTs: factoryInfo.totalTokens,
                itemCount: factoryInfo.totalTokens,
                updatedAt: new Date()
              }
            })

            syncedCollections.push({
              ...collection,
              status: 'updated'
            })
          }
        } catch (error) {
          logger.error(`Failed to sync collection ${collectionAddress}:`, error)
          syncedCollections.push({
            contractAddress: collectionAddress,
            status: 'error',
            error: error.message
          })
        }
      }

      res.json({
        message: 'Collections synced successfully',
        chainId: Number(chainId),
        creatorAddress: address,
        totalFound: blockchainCollections.length,
        syncedCollections
      })

    } catch (error) {
      next(error)
    }
  }

  /**
   * Validate collection exists on blockchain
   */
  async validateCollection(req: Request, res: Response, next: NextFunction) {
    try {
      const { contractAddress } = req.params
      const { chainId = 8453 } = req.query

      if (!ethers.isAddress(contractAddress)) {
        throw new ValidationError('Invalid contract address')
      }

      const isValid = await isValidCollection(Number(chainId), contractAddress)

      if (!isValid) {
        return res.json({
          isValid: false,
          message: 'Collection not found on blockchain or not created by our factory'
        })
      }

      // Get collection info from factory
      const factoryInfo = await getCollectionInfoFromFactory(Number(chainId), contractAddress)
      const basicInfo = await getCollectionBasicInfo(Number(chainId), contractAddress)

      res.json({
        isValid: true,
        collection: {
          contractAddress,
          chainId: Number(chainId),
          name: basicInfo.name,
          symbol: basicInfo.symbol,
          creator: factoryInfo.creator,
          isPersonal: factoryInfo.isPersonal,
          createdAt: factoryInfo.createdAt,
          totalTokens: factoryInfo.totalTokens
        }
      })

    } catch (error) {
      next(error)
    }
  }

  /**
   * Get blockchain statistics
   */
  async getBlockchainStats(req: Request, res: Response, next: NextFunction) {
    try {
      const { chainId = 8453 } = req.query

      const totalCollections = await getTotalCollections(Number(chainId))

      res.json({
        chainId: Number(chainId),
        totalCollections,
        networkConfig: getNetworkConfig(Number(chainId))
      })

    } catch (error) {
      next(error)
    }
  }
}

export const collectionController = new CollectionController()