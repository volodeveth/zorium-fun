// Smart contract configuration for Zorium.fun platform v2.0
// New Factory + Collection architecture with ERC-1155

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
} as const;

// Legacy contracts mapping (for backward compatibility)
export const NFT_CONTRACTS = {
  // Base mainnet
  8453: {
    chainId: 8453,
    name: 'Base',
    nftContract: CONTRACTS.BASE.legacyNFT,
    marketplaceContract: '0x8044F0C974A2F67f7C4F3B416B849a4B25b76C5E',
    rpcUrl: CONTRACTS.BASE.rpcUrl,
    blockExplorer: CONTRACTS.BASE.blockExplorer,
    isMainNetwork: CONTRACTS.BASE.isMainNetwork
  },
  // Zora mainnet
  7777777: {
    chainId: 7777777,
    name: 'Zora',
    nftContract: CONTRACTS.ZORA.legacyNFT,
    marketplaceContract: '0x43968b11Fd35b1F8c44c1dE27C4054D198Ce366F',
    rpcUrl: CONTRACTS.ZORA.rpcUrl,
    blockExplorer: CONTRACTS.ZORA.blockExplorer,
    isMainNetwork: CONTRACTS.ZORA.isMainNetwork
  }
} as const

// ABI for Factory Contract
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
] as const;

// ABI for Collection Contract (ERC-1155)
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
] as const;

// Legacy NFT ABI (for backward compatibility)
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

// Fee Configuration (updated with new logic)
export const FEE_CONFIG = {
  // Default mint price fees (0.000111 ETH)
  defaultMint: {
    price: '0.000111', // ETH
    withReferrer: {
      creatorPercentage: 0.50,     // 50%
      firstMinterPercentage: 0.10, // 10%
      referralPercentage: 0.20,    // 20%
      platformPercentage: 0.20     // 20%
    },
    noReferrer: {
      creatorPercentage: 0.50,     // 50%
      firstMinterPercentage: 0.10, // 10%
      referralPercentage: 0.00,    // 0%
      platformPercentage: 0.40     // 40% (20% + 20% referral)
    }
  },
  
  // Custom mint price fees
  customMint: {
    creatorPercentage: 0.95, // 95%
    platformPercentage: 0.05 // 5%
  },
  
  // Marketplace sale fees
  marketplace: {
    royaltyPercentage: 0.025,  // 2.5% to creator
    platformPercentage: 0.025  // 2.5% to platform
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
} as const;

// Token status enum (matching contract)
export enum TokenStatus {
  Created = 0,
  FirstMinted = 1,
  CountdownActive = 2,
  Finalized = 3
}

// Type definitions
export interface CollectionInfo {
  creator: string;
  name: string;
  symbol: string;
  isPersonal: boolean;
  createdAt: number;
  totalTokens: number;
}

export interface TokenInfo {
  creator: string;
  firstMinter: string;
  mintPrice: string;
  isCustomPrice: boolean;
  mintEndTime: number;
  totalMinted: number;
  finalCountdownStart: number;
  status: TokenStatus;
  referrer: string;
  tokenURI: string;
}

export interface MintParams {
  to: string;
  tokenId: number;
  amount: number;
  referrer: string;
}

export interface CreateTokenParams {
  tokenURI: string;
  customPrice: string;
  mintEndTime: number;
}

// Helper functions
export function getNetworkConfig(chainId: number) {
  switch (chainId) {
    case 8453:
      return CONTRACTS.BASE;
    case 7777777:
      return CONTRACTS.ZORA;
    default:
      throw new Error(`Unsupported chain ID: ${chainId}`);
  }
}

export function getFactoryAddress(chainId: number): string {
  return getNetworkConfig(chainId).factory.proxy;
}

export function getCollectionTemplate(chainId: number): string {
  return getNetworkConfig(chainId).collectionTemplate;
}

// Legacy helper functions (for backward compatibility)
export function getContractConfig(chainId: number) {
  return NFT_CONTRACTS[chainId as keyof typeof NFT_CONTRACTS]
}

export function getSupportedChainIds(): number[] {
  return Object.keys(NFT_CONTRACTS).map(Number)
}

export function isValidChainId(chainId: number): boolean {
  return chainId in NFT_CONTRACTS
}

export function getDefaultChainId(): number {
  // Base is the default/primary network
  return 8453
}

export function getNFTContractAddress(chainId: number): string | undefined {
  const config = getContractConfig(chainId)
  return config?.nftContract
}

export function getMarketplaceContractAddress(chainId: number): string | undefined {
  const config = getContractConfig(chainId)
  return config?.marketplaceContract
}

export function getRpcUrl(chainId: number): string | undefined {
  const config = getContractConfig(chainId)
  return config?.rpcUrl
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
      collectionTemplate: CONTRACTS.BASE.collectionTemplate,
      legacy: {
        nft: {
          proxy: '0xF422E7F6DF90e7296813eE12Bd3eBc631aA8FFde',
          implementation: '0xB98deFCA7a5FE909d80918637dF656D2be7841a3'
        },
        marketplace: {
          proxy: '0x8044F0C974A2F67f7C4F3B416B849a4B25b76C5E',
          implementation: '0x11E32d4e20C9b817d27f09b8448808901F95985C'
        }
      }
    },
    zora: {
      network: 'Zora Mainnet',
      chainId: 7777777,
      factory: {
        proxy: CONTRACTS.ZORA.factory.proxy,
        implementation: CONTRACTS.ZORA.factory.implementation
      },
      collectionTemplate: CONTRACTS.ZORA.collectionTemplate,
      legacy: {
        nft: {
          proxy: '0x72fD543e13450cb4D07E088c63D9596d6D084D29',
          implementation: '0xe066b7a1Ac135ce49a80fee532C2c87bD2569185'
        },
        marketplace: {
          proxy: '0x43968b11Fd35b1F8c44c1dE27C4054D198Ce366F',
          implementation: '0x77554A8AdD43d5c21e704CAa7b1076980b4C8588'
        }
      }
    }
  }
} as const