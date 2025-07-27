// Network configuration with logos and explorer URLs
export const NETWORK_CONFIG = {
  1: {
    name: 'Ethereum',
    symbol: 'ETH',
    logo: '/images/ethereum-logo.png',
    estimatedGas: '~$3-15',
    explorerUrl: 'https://etherscan.io',
    explorerName: 'Etherscan'
  },
  8453: {
    name: 'Base',
    symbol: 'ETH',
    logo: '/images/base-logo.png',
    estimatedGas: '~$0.01',
    isDefault: true,
    explorerUrl: 'https://basescan.org',
    explorerName: 'BaseScan'
  },
  7777777: {
    name: 'Zora',
    symbol: 'ETH',
    logo: '/images/zora-logo.png',
    estimatedGas: '~$0.005',
    explorerUrl: 'https://explorer.zora.energy',
    explorerName: 'Zora Explorer'
  },
  137: {
    name: 'Polygon',
    symbol: 'MATIC',
    logo: '/images/polygon-logo.png',
    estimatedGas: '~$0.01',
    explorerUrl: 'https://polygonscan.com',
    explorerName: 'PolygonScan'
  },
  10: {
    name: 'Optimism',
    symbol: 'ETH',
    logo: '/images/optimism-logo.png',
    estimatedGas: '~$0.02',
    explorerUrl: 'https://optimistic.etherscan.io',
    explorerName: 'Optimism Explorer'
  },
  42161: {
    name: 'Arbitrum',
    symbol: 'ETH',
    logo: '/images/arbitrum-logo.png',
    estimatedGas: '~$0.01',
    explorerUrl: 'https://arbiscan.io',
    explorerName: 'Arbiscan'
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

export function getExplorerUrl(networkId: number, contractAddress?: string, tokenId?: string) {
  const network = getNetworkInfo(networkId)
  
  if (!contractAddress) {
    return network.explorerUrl
  }
  
  if (tokenId) {
    // NFT-specific URL (some explorers support this)
    return `${network.explorerUrl}/token/${contractAddress}?a=${tokenId}`
  }
  
  // Contract URL
  return `${network.explorerUrl}/address/${contractAddress}`
}

export function getExplorerName(networkId: number) {
  const network = getNetworkInfo(networkId)
  return network.explorerName
}