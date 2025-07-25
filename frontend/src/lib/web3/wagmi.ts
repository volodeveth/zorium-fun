import { getDefaultConfig } from '@rainbow-me/rainbowkit'
import { mainnet, polygon, optimism, arbitrum, base, zora } from 'wagmi/chains'

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
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'your-project-id',
  chains: [base, zora, zoraNetwork, mainnet, polygon, optimism, arbitrum], // Base as default (first)
  ssr: true, // If your dApp uses server side rendering (SSR)
})

// Supported networks for NFT creation with Base as default
export const SUPPORTED_NETWORKS = [
  { id: 8453, name: 'Base', symbol: 'ETH', isDefault: true },
  { id: 7777777, name: 'Zora', symbol: 'ETH', isDefault: false },
  { id: 1, name: 'Ethereum', symbol: 'ETH', isDefault: false },
  { id: 137, name: 'Polygon', symbol: 'MATIC', isDefault: false },
  { id: 10, name: 'Optimism', symbol: 'ETH', isDefault: false },
  { id: 42161, name: 'Arbitrum', symbol: 'ETH', isDefault: false },
] as const

// ZORIUM Token Contract Address on Zora Network
export const ZORIUM_TOKEN_ADDRESS = '0x538D6F4fb9598dC74e15e6974049B109ae0AbC6a'

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