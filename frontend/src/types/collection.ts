// ==============================================
// COLLECTION TYPES (Updated for Factory v2.0)
// ==============================================

export interface Collection {
  id: string
  name: string
  symbol: string
  description?: string
  image?: string
  banner?: string
  
  // Contract info (v2.0)
  contractAddress: string
  creatorAddress: string
  chainId: number
  
  // Collection type
  isPersonal: boolean
  isActive: boolean
  
  // Social metadata
  website?: string
  discord?: string
  twitter?: string
  
  // Stats
  floorPrice?: number
  volume: number
  itemCount: number
  ownerCount: number
  totalNFTs: number
  
  // Timestamps
  createdAt: string
  updatedAt: string
  
  // Relations
  previewTokens?: NFTToken[]
  tokens?: NFTToken[]
  tokenCount?: number
  
  // Legacy support
  legacyNFTCount?: number
}

// NFT Token (ERC-1155) - new structure
export interface NFTToken {
  id: string
  tokenId: string
  
  // Collection reference
  collectionId: string
  collection?: Collection
  contractAddress: string
  chainId: number
  
  // Token metadata
  name: string
  description?: string
  tokenURI: string
  image?: string
  animationUrl?: string
  attributes?: Record<string, any>
  
  // Creator info
  creatorAddress: string
  firstMinter?: string
  referrer?: string
  
  // Pricing and minting
  mintPrice: number
  isCustomPrice: boolean
  mintEndTime?: number
  
  // Supply and status
  totalMinted: number
  maxSupply?: number
  status: TokenStatus
  
  // Timer logic (for default price)
  finalCountdownStart?: number
  
  // Stats
  viewCount: number
  likeCount: number
  
  // Marketplace
  isListed: boolean
  floorPrice?: number
  
  // Timestamps
  createdAt: string
  updatedAt: string
  
  // Type identifier
  type?: 'token'
  tokenStandard?: 'ERC-1155'
}

// Token status enum (v2.0)
export enum TokenStatus {
  Created = 'Created',         // Creator's free mint done
  FirstMinted = 'FirstMinted', // First paid mint done
  CountdownActive = 'CountdownActive', // 48-hour countdown active
  Finalized = 'Finalized'     // Minting finished
}

// Collection creation interfaces
export interface CreateCollectionRequest {
  name: string
  symbol: string
  description?: string
  chainId: number
  isPersonal?: boolean
}

export interface CreatePersonalCollectionRequest {
  nftName: string
  tokenURI: string
  chainId: number
  customPrice?: string
  mintEndTime?: number
}

// API Response interfaces
export interface CollectionResponse {
  collection: Collection
}

export interface CollectionsResponse {
  collections: Collection[]
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
}

export interface CreateCollectionResponse {
  message: string
  collection: {
    id: string
    name: string
    symbol: string
    description?: string
    contractAddress: string
    creatorAddress: string
    chainId: number
    isPersonal: boolean
    createdAt: string
  }
}

export interface CreatePersonalCollectionResponse {
  message: string
  collection: {
    id: string
    name: string
    contractAddress: string
    creatorAddress: string
    chainId: number
    isPersonal: boolean
    createdAt: string
  }
  token: {
    id: string
    tokenId: string
    name: string
    tokenURI: string
    mintPrice: number
    isCustomPrice: boolean
    status: TokenStatus
  }
}

// Marketplace listing interface (ERC-1155)
export interface Listing {
  id: string
  listingId: string
  
  // Token reference
  nftTokenId: string
  nftToken?: NFTToken
  contractAddress: string
  tokenId: string
  
  // Seller info
  sellerAddress: string
  
  // Listing details
  amount: number
  pricePerToken: number
  totalPrice: number
  
  // Status
  isActive: boolean
  soldAmount: number
  
  // Timestamps
  listedAt: string
  updatedAt: string
}

// Collection filters and sorting
export interface CollectionFilters {
  chainId?: number
  creator?: string
  isPersonal?: boolean
  sort?: 'newest' | 'oldest' | 'name' | 'activity'
  page?: number
  limit?: number
}

// Factory contract interaction interfaces
export interface CreateCollectionParams {
  name: string
  symbol: string
  baseURI: string
  isPersonal: boolean
}

export interface CreateTokenParams {
  tokenURI: string
  customPrice: string
  mintEndTime: number
}

export interface MintParams {
  to: string
  tokenId: number
  amount: number
  referrer: string
}

// Collection statistics
export interface CollectionStats {
  totalCollections: number
  totalTokens: number
  totalVolume: number
  totalMints: number
  activeCollections: number
  personalCollections: number
}

// Contract info from factory
export interface ContractCollectionInfo {
  creator: string
  name: string
  symbol: string
  isPersonal: boolean
  createdAt: number
  totalTokens: number
}

// Token info from collection contract
export interface ContractTokenInfo {
  creator: string
  firstMinter: string
  mintPrice: string
  isCustomPrice: boolean
  mintEndTime: number
  totalMinted: number
  finalCountdownStart: number
  status: number // TokenStatus as number
  referrer: string
  tokenURI: string
}

// Legacy NFT interface for backward compatibility
export interface LegacyNFT {
  id: string
  tokenId: string
  contractAddress: string
  chainId: number
  
  // Metadata
  name: string
  description?: string
  image: string
  animationUrl?: string
  externalUrl?: string
  attributes?: Record<string, any>
  
  // Ownership
  creatorId: string
  creator?: any
  ownerId: string
  owner?: any
  
  // Collection
  collectionId?: string
  collection?: Collection
  
  // Marketplace
  isListed: boolean
  price?: number
  currency?: string
  
  // Platform data
  viewCount: number
  likeCount: number
  isPromoted: boolean
  promotionEnds?: string
  
  // Mint data
  mintPrice?: number
  maxSupply?: number
  currentSupply: number
  hasCreatorMinted: boolean
  firstMinterAddress?: string
  
  // Timestamps
  createdAt: string
  updatedAt: string
  
  // Type identifier
  type?: 'legacy'
  tokenStandard?: 'ERC-721'
}

// Combined NFT type for backward compatibility
export type NFTItem = NFTToken | LegacyNFT

// Collection with mixed NFTs (legacy + tokens)
export interface CollectionWithNFTs extends Collection {
  nfts: NFTItem[]
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
    legacyCount: number
    tokenCount: number
  }
}