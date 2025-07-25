// Network configuration with logos
export const NETWORK_CONFIG = {
  1: {
    name: 'Ethereum',
    symbol: 'ETH',
    logo: '/images/ethereum-logo.png',
    estimatedGas: '~$3-15'
  },
  8453: {
    name: 'Base',
    symbol: 'ETH',
    logo: '/images/base-logo.png',
    estimatedGas: '~$0.01',
    isDefault: true
  },
  7777777: {
    name: 'Zora',
    symbol: 'ETH',
    logo: '/images/zora-logo.png',
    estimatedGas: '~$0.005'
  },
  137: {
    name: 'Polygon',
    symbol: 'MATIC',
    logo: '/images/polygon-logo.png',
    estimatedGas: '~$0.01'
  },
  10: {
    name: 'Optimism',
    symbol: 'ETH',
    logo: '/images/optimism-logo.png',
    estimatedGas: '~$0.02'
  },
  42161: {
    name: 'Arbitrum',
    symbol: 'ETH',
    logo: '/images/arbitrum-logo.png',
    estimatedGas: '~$0.01'
  }
} as const

export type NetworkId = keyof typeof NETWORK_CONFIG

export function getNetworkInfo(networkId: number) {
  return NETWORK_CONFIG[networkId as NetworkId] || NETWORK_CONFIG[8453] // Default to Base
}

export function getNetworkLogo(networkId: number) {
  const network = getNetworkInfo(networkId)
  return network.logo
}

export function getNetworkName(networkId: number) {
  const network = getNetworkInfo(networkId)
  return network.name
}