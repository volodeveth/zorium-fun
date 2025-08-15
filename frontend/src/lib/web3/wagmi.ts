import { getDefaultConfig } from '@rainbow-me/rainbowkit'
import { mainnet, polygon, optimism, arbitrum, base } from 'wagmi/chains'
import { http, fallback } from 'wagmi'

// Zora Network configuration
export const zoraNetwork = {
  id: 7777777,
  name: 'Zora',
  network: 'zora',
  nativeCurrency: {
    decimals: 18,
    name: 'Ether',
    symbol: 'ETH',
  },
  rpcUrls: {
    default: {
      http: ['https://rpc.zora.energy'],
      webSocket: ['wss://rpc.zora.energy'],
    },
    public: {
      http: ['https://rpc.zora.energy'],
      webSocket: ['wss://rpc.zora.energy'],
    },
  },
  blockExplorers: {
    default: { name: 'Explorer', url: 'https://explorer.zora.energy' },
  },
  contracts: {
    multicall3: {
      address: '0xcA11bde05977b3631167028862bE2a173976CA11',
      blockCreated: 5882,
    },
  },
} as const

export const config = getDefaultConfig({
  appName: 'zorium.fun',
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'a1b2c3d4e5f6g7h8i9j0',
  chains: [base, zoraNetwork], // Base as primary + Zora for specialized NFT features
  ssr: true, // If your dApp uses server side rendering (SSR)
  transports: {
    [base.id]: http('https://mainnet.base.org', {
      // Configure for better performance and gas estimation
      batch: {
        batchSize: 1024,
        wait: 16,
      },
      retryCount: 3,
      timeout: 10000,
    }),
    [zoraNetwork.id]: http('https://rpc.zora.energy', {
      batch: {
        batchSize: 1024,
        wait: 16,
      },
      retryCount: 3,
      timeout: 10000,
    }),
  },
})

// Supported networks for NFT creation with Base as default
export const SUPPORTED_NETWORKS = [
  { id: 8453, name: 'Base', symbol: 'ETH', isDefault: true, estimatedGas: '~$0.01' },
  { id: 7777777, name: 'Zora', symbol: 'ETH', isDefault: false, estimatedGas: '~$0.005' },
  { id: 1, name: 'Ethereum', symbol: 'ETH', isDefault: false, estimatedGas: '~$3-15' },
  { id: 137, name: 'Polygon', symbol: 'MATIC', isDefault: false, estimatedGas: '~$0.01' },
  { id: 10, name: 'Optimism', symbol: 'ETH', isDefault: false, estimatedGas: '~$0.02' },
  { id: 42161, name: 'Arbitrum', symbol: 'ETH', isDefault: false, estimatedGas: '~$0.01' },
] as const

// ZORIUM Token Contract Address on Zora Network
export const ZORIUM_TOKEN_ADDRESS = '0x538D6F4fb9598dC74e15e6974049B109ae0AbC6a'

// NFT Contract Addresses (Upgradeable Proxies)
export const NFT_CONTRACT_ADDRESSES = {
  [8453]: '0xF422E7F6DF90e7296813eE12Bd3eBc631aA8FFde', // Base
  [7777777]: '0x72fD543e13450cb4D07E088c63D9596d6D084D29', // Zora
} as const

// Marketplace Contract Addresses (Upgradeable Proxies)
export const MARKETPLACE_CONTRACT_ADDRESSES = {
  [8453]: '0x8044F0C974A2F67f7C4F3B416B849a4B25b76C5E', // Base
  [7777777]: '0x43968b11Fd35b1F8c44c1dE27C4054D198Ce366F', // Zora
} as const

// Platform Admin Address
export const PLATFORM_ADMIN_ADDRESS = '0xe894a9E110ef27320Ae58F1E4A70ACfD07DE3705'

// Default mint price in ETH (0.000111 ETH)
export const DEFAULT_MINT_PRICE = '0.000111'

// Fee breakdown for default price (0.000111 ETH)
export const DEFAULT_FEE_BREAKDOWN = {
  CREATOR: '0.000055', // 50% to creator
  FIRST_MINTER: '0.000011', // 10% to first minter
  REFERRAL: '0.000022', // 20% to referral (if applicable)
  PLATFORM: '0.000022', // 20% to platform
} as const

// Fee breakdown for custom prices
export const CUSTOM_FEE_BREAKDOWN = {
  CREATOR_PERCENTAGE: 0.95, // 95% to creator
  PLATFORM_PERCENTAGE: 0.05, // 5% to platform
} as const

// Marketplace sale fees
export const MARKETPLACE_FEES = {
  ROYALTY_PERCENTAGE: 0.025, // 2.5% to creator
  PLATFORM_PERCENTAGE: 0.025, // 2.5% to platform
} as const

// Helper functions
export function getNFTContractAddress(chainId: number): string | undefined {
  return NFT_CONTRACT_ADDRESSES[chainId as keyof typeof NFT_CONTRACT_ADDRESSES]
}

export function getMarketplaceContractAddress(chainId: number): string | undefined {
  return MARKETPLACE_CONTRACT_ADDRESSES[chainId as keyof typeof MARKETPLACE_CONTRACT_ADDRESSES]
}

export function isSupportedNetwork(chainId: number): boolean {
  return chainId in NFT_CONTRACT_ADDRESSES
}