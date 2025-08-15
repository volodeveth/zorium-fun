// ==============================================
// NEW FACTORY + COLLECTION ARCHITECTURE (v2.0)
// ==============================================

// Platform Admin Address (VoloDev.eth)
export const PLATFORM_ADMIN_ADDRESS = '0xe894a9E110ef27320Ae58F1E4A70ACfD07DE3705'

// ZRM Token Address (deployed on Zora)
export const ZRM_TOKEN_ADDRESS = '0x538D6F4fb9598dC74e15e6974049B109ae0AbC6a'

// New Factory + Collection Contracts (v2.0)
export const CONTRACTS = {
  // Base Mainnet (Chain ID: 8453)
  BASE: {
    chainId: 8453,
    name: 'Base',
    rpcUrl: 'https://mainnet.base.org',
    blockExplorer: 'https://basescan.org',
    isMainNetwork: true,
    factory: {
      proxy: '0x8ec96033C74Eec29a4D45bA86986922Ede69C27d',
      implementation: '0xbF5Fa37C912C70D2B523028E4bF6D9872233Aa96'
    },
    collectionTemplate: '0x96b1692A40EaDa0efDA957be62AF520541b3B5df',
    // Legacy contract (for migration reference only)
    legacyNFT: '0xF422E7F6DF90e7296813eE12Bd3eBc631aA8FFde'
  },
  
  // Zora Mainnet (Chain ID: 7777777)  
  ZORA: {
    chainId: 7777777,
    name: 'Zora',
    rpcUrl: 'https://rpc.zora.energy',
    blockExplorer: 'https://explorer.zora.energy',
    isMainNetwork: false,
    factory: {
      proxy: '0x0De8482fA3b9ba69D7A0d139c7c8a6FC82951fcd',
      implementation: '0xef180550301CCdD4334aC3c9A2E6B4059481eA8A'
    },
    collectionTemplate: '0xb4E0B737a5D365a1e05B50f3ef1ceA61d68DD496',
    // Legacy contract (for migration reference only)
    legacyNFT: '0x72fD543e13450cb4D07E088c63D9596d6D084D29'
  }
} as const

// Contract constants (mirroring smart contract values)
export const CONTRACT_CONSTANTS = {
  DEFAULT_MINT_PRICE: '111000000000000', // 0.000111 ETH in wei
  TRIGGER_SUPPLY: 1000,
  FINAL_COUNTDOWN_DURATION: 48 * 60 * 60, // 48 hours in seconds
  
  // Fee percentages (basis points)
  CREATOR_FEE_BP: 5000,      // 50%
  FIRST_MINTER_FEE_BP: 1000, // 10%
  REFERRAL_FEE_BP: 2000,     // 20%
  PLATFORM_FEE_BP: 2000,     // 20%
  PLATFORM_NO_REF_FEE_BP: 4000, // 40% when no referrer
  
  CUSTOM_CREATOR_FEE_BP: 9500, // 95%
  CUSTOM_PLATFORM_FEE_BP: 500, // 5%
  
  ROYALTY_FEE_BP: 250,       // 2.5%
  MARKETPLACE_FEE_BP: 250    // 2.5%
} as const

// Token status enum (matching contract)
export enum TokenStatus {
  Created = 0,
  FirstMinted = 1,
  CountdownActive = 2,
  Finalized = 3
}

// ==============================================
// FACTORY CONTRACT ABI
// ==============================================

export const FACTORY_ABI = [
  // Factory functions
  "function createCollection((string,string,string,bool)) external returns (address)",
  "function createPersonalCollection(string,string) external returns (address,uint256)",
  "function getCollectionsByCreator(address) external view returns (address[])",
  "function getCollectionInfo(address) external view returns ((address,string,string,bool,uint256,uint256))",
  "function totalCollections() external view returns (uint256)",
  "function isValidCollection(address) external view returns (bool)",
  
  // Constants
  "function DEFAULT_MINT_PRICE() external view returns (uint256)",
  "function TRIGGER_SUPPLY() external view returns (uint256)",
  "function FINAL_COUNTDOWN_DURATION() external view returns (uint256)",
  
  // Fee calculation
  "function calculateMintFees(uint256,bool,bool) external pure returns (uint256,uint256,uint256,uint256)",
  "function calculateSaleFees(uint256) external pure returns (uint256,uint256,uint256)",
  
  // Events
  "event CollectionCreated(address indexed,address indexed,string,string,bool,uint256)",
  "event PersonalCollectionCreated(address indexed,address indexed,string,string,uint256)"
] as const

// ==============================================
// COLLECTION CONTRACT ABI (ERC-1155)
// ==============================================

export const COLLECTION_ABI = [
  // Collection info
  "function name() external view returns (string)",
  "function symbol() external view returns (string)",
  "function creator() external view returns (address)",
  
  // Token management
  "function createToken((string,uint256,uint256)) external returns (uint256)",
  "function createTokenSimple(string,uint256,uint256) external returns (uint256)",
  "function mint((address,uint256,uint256,address)) external payable",
  
  // Token info
  "function getTokenInfo(uint256) external view returns ((address,address,uint256,bool,uint256,uint256,uint256,uint8,address,string))",
  "function isMintingActive(uint256) external view returns (bool)",
  "function getCountdownTimeLeft(uint256) external view returns (uint256)",
  
  // ERC-1155 functions
  "function balanceOf(address,uint256) external view returns (uint256)",
  "function totalSupply(uint256) external view returns (uint256)",
  "function uri(uint256) external view returns (string)",
  
  // Marketplace
  "function listForSale(uint256,uint256,uint256) external",
  "function buyNFT(uint256,uint256) external payable",
  "function delistNFT(uint256) external",
  
  // Fee management
  "function accumulatedFees(address) external view returns (uint256)",
  "function withdrawFees() external",
  
  // Events
  "event TokenCreated(uint256 indexed,address indexed,string,bool,uint256,uint256)",
  "event TokenMinted(uint256 indexed,address indexed,address indexed,uint256,uint256,bool)",
  "event FirstMinterSet(uint256 indexed,address indexed,address indexed)",
  "event CountdownActivated(uint256 indexed,uint256)",
  "event TokenListed(uint256 indexed,address indexed,uint256,uint256)",
  "event TokenSold(uint256 indexed,address indexed,address indexed,uint256,uint256,uint256,uint256)"
] as const

// ==============================================
// LEGACY NFT ABI (ERC-721) - For backward compatibility
// ==============================================

export const NFT_ABI = [
  // Mint function
  {
    "type": "function",
    "name": "mint",
    "inputs": [
      {
        "name": "params",
        "type": "tuple",
        "components": [
          {"name": "to", "type": "address"},
          {"name": "tokenURI", "type": "string"},
          {"name": "isCreatorFirstMint", "type": "bool"},
          {"name": "referrer", "type": "address"},
          {"name": "customPrice", "type": "uint256"}
        ]
      }
    ],
    "outputs": [],
    "stateMutability": "payable"
  },
  
  // Marketplace functions
  {
    "type": "function",
    "name": "listForSale",
    "inputs": [
      {"name": "tokenId", "type": "uint256"},
      {"name": "price", "type": "uint256"}
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  
  {
    "type": "function",
    "name": "buyNFT",
    "inputs": [{"name": "tokenId", "type": "uint256"}],
    "outputs": [],
    "stateMutability": "payable"
  },
  
  // View functions
  {
    "type": "function",
    "name": "ownerOf",
    "inputs": [{"name": "tokenId", "type": "uint256"}],
    "outputs": [{"name": "", "type": "address"}],
    "stateMutability": "view"
  },
  
  {
    "type": "function",
    "name": "tokenURI",
    "inputs": [{"name": "tokenId", "type": "uint256"}],
    "outputs": [{"name": "", "type": "string"}],
    "stateMutability": "view"
  },
  
  {
    "type": "function",
    "name": "getCurrentTokenId",
    "inputs": [],
    "outputs": [{"name": "", "type": "uint256"}],
    "stateMutability": "view"
  },
  
  {
    "type": "function",
    "name": "hasCreatorMinted",
    "inputs": [{"name": "creator", "type": "address"}],
    "outputs": [{"name": "", "type": "bool"}],
    "stateMutability": "view"
  },
  
  {
    "type": "function",
    "name": "getTokenInfo",
    "inputs": [{"name": "tokenId", "type": "uint256"}],
    "outputs": [
      {
        "name": "",
        "type": "tuple",
        "components": [
          {"name": "creator", "type": "address"},
          {"name": "firstMinter", "type": "address"},
          {"name": "mintPrice", "type": "uint256"},
          {"name": "isCreatorFirstMint", "type": "bool"},
          {"name": "hasReferrer", "type": "bool"},
          {"name": "referrer", "type": "address"}
        ]
      }
    ],
    "stateMutability": "view"
  },
  
  {
    "type": "function",
    "name": "calculateMintFees",
    "inputs": [
      {"name": "price", "type": "uint256"},
      {"name": "hasReferrer", "type": "bool"},
      {"name": "isCustomPrice", "type": "bool"}
    ],
    "outputs": [
      {"name": "creatorFee", "type": "uint256"},
      {"name": "firstMinterFee", "type": "uint256"},
      {"name": "referralFee", "type": "uint256"},
      {"name": "platformFee", "type": "uint256"}
    ],
    "stateMutability": "pure"
  },
  
  // Events
  {
    "type": "event",
    "name": "TokenMinted",
    "inputs": [
      {"name": "tokenId", "type": "uint256", "indexed": true},
      {"name": "creator", "type": "address", "indexed": true},
      {"name": "to", "type": "address", "indexed": true},
      {"name": "price", "type": "uint256", "indexed": false},
      {"name": "isCreatorFirstMint", "type": "bool", "indexed": false},
      {"name": "referrer", "type": "address", "indexed": false}
    ]
  },
  
  {
    "type": "event",
    "name": "TokenSold",
    "inputs": [
      {"name": "tokenId", "type": "uint256", "indexed": true},
      {"name": "seller", "type": "address", "indexed": true},
      {"name": "buyer", "type": "address", "indexed": true},
      {"name": "price", "type": "uint256", "indexed": false},
      {"name": "royalty", "type": "uint256", "indexed": false},
      {"name": "platformFee", "type": "uint256", "indexed": false}
    ]
  }
] as const

// ==============================================
// HELPER FUNCTIONS
// ==============================================

export function getNetworkConfig(chainId: number) {
  switch (chainId) {
    case 8453:
      return CONTRACTS.BASE
    case 7777777:
      return CONTRACTS.ZORA
    default:
      throw new Error(`Unsupported chain ID: ${chainId}`)
  }
}

export function getFactoryAddress(chainId: number): string {
  return getNetworkConfig(chainId).factory.proxy
}

export function getCollectionTemplate(chainId: number): string {
  return getNetworkConfig(chainId).collectionTemplate
}

export function getSupportedChainIds(): number[] {
  return [8453, 7777777] // Base and Zora
}

export function isValidChainId(chainId: number): boolean {
  return getSupportedChainIds().includes(chainId)
}

export function getDefaultChainId(): number {
  // Base is the default/primary network
  return 8453
}

// Legacy support functions
export function getNFTContractAddress(chainId: number): string | undefined {
  const config = getNetworkConfig(chainId)
  return config?.legacyNFT
}

export function getRpcUrl(chainId: number): string | undefined {
  const config = getNetworkConfig(chainId)
  return config?.rpcUrl
}

// Fee calculation helpers
export function calculateMintFees(
  price: bigint,
  hasReferrer: boolean,
  isCustomPrice: boolean
): {
  creatorFee: bigint
  firstMinterFee: bigint
  referralFee: bigint
  platformFee: bigint
} {
  if (isCustomPrice) {
    return {
      creatorFee: (price * BigInt(CONTRACT_CONSTANTS.CUSTOM_CREATOR_FEE_BP)) / BigInt(10000),
      platformFee: (price * BigInt(CONTRACT_CONSTANTS.CUSTOM_PLATFORM_FEE_BP)) / BigInt(10000),
      firstMinterFee: BigInt(0),
      referralFee: BigInt(0)
    }
  } else {
    const creatorFee = (price * BigInt(CONTRACT_CONSTANTS.CREATOR_FEE_BP)) / BigInt(10000)
    const firstMinterFee = (price * BigInt(CONTRACT_CONSTANTS.FIRST_MINTER_FEE_BP)) / BigInt(10000)
    
    if (hasReferrer) {
      return {
        creatorFee,
        firstMinterFee,
        referralFee: (price * BigInt(CONTRACT_CONSTANTS.REFERRAL_FEE_BP)) / BigInt(10000),
        platformFee: (price * BigInt(CONTRACT_CONSTANTS.PLATFORM_FEE_BP)) / BigInt(10000)
      }
    } else {
      return {
        creatorFee,
        firstMinterFee,
        referralFee: BigInt(0),
        platformFee: (price * BigInt(CONTRACT_CONSTANTS.PLATFORM_NO_REF_FEE_BP)) / BigInt(10000) // 40% when no referrer
      }
    }
  }
}

export function calculateSaleFees(price: bigint): {
  royalty: bigint
  marketplaceFee: bigint
  sellerAmount: bigint
} {
  const royalty = (price * BigInt(CONTRACT_CONSTANTS.ROYALTY_FEE_BP)) / BigInt(10000)
  const marketplaceFee = (price * BigInt(CONTRACT_CONSTANTS.MARKETPLACE_FEE_BP)) / BigInt(10000)
  const sellerAmount = price - royalty - marketplaceFee
  
  return { royalty, marketplaceFee, sellerAmount }
}

// Contract deployment info (updated for v2.0)
export const DEPLOYMENT_INFO = {
  version: '2.0.0',
  deployedAt: '2025-08-05T07:00:00Z',
  deployer: PLATFORM_ADMIN_ADDRESS,
  isUpgradeable: true,
  architecture: 'Factory + Collection (ERC-1155)',
  contracts: {
    base: {
      network: 'Base Mainnet',
      chainId: 8453,
      factory: {
        proxy: CONTRACTS.BASE.factory.proxy,
        implementation: CONTRACTS.BASE.factory.implementation
      },
      collectionTemplate: CONTRACTS.BASE.collectionTemplate
    },
    zora: {
      network: 'Zora Mainnet',
      chainid: 7777777,
      factory: {
        proxy: CONTRACTS.ZORA.factory.proxy,
        implementation: CONTRACTS.ZORA.factory.implementation
      },
      collectionTemplate: CONTRACTS.ZORA.collectionTemplate
    }
  }
} as const

// Type definitions
export interface CollectionInfo {
  creator: string
  name: string
  symbol: string
  isPersonal: boolean
  createdAt: number
  totalTokens: number
}

export interface TokenInfo {
  creator: string
  firstMinter: string
  mintPrice: string
  isCustomPrice: boolean
  mintEndTime: number
  totalMinted: number
  finalCountdownStart: number
  status: TokenStatus
  referrer: string
  tokenURI: string
}

export interface MintParams {
  to: string
  tokenId: number
  amount: number
  referrer: string
}

export interface CreateTokenParams {
  tokenURI: string
  customPrice: string
  mintEndTime: number
}

export interface CreateCollectionParams {
  name: string
  symbol: string
  baseURI: string
  isPersonal: boolean
}