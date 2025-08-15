// Admin configuration for Zorium.fun platform

// Platform owner wallet address (VoloDev.eth)
export const PLATFORM_OWNER_ADDRESS = '0xe894a9E110ef27320Ae58F1E4A70ACfD07DE3705'

// Instructions for setting up admin access:
// 1. Get the actual wallet address for VoloDev.eth from the owner
// 2. Replace the placeholder above with the real address
// 3. Only this address will have access to the admin dashboard
// 4. This address can withdraw platform fees and allocate ZRM tokens

// Platform configuration
export const PLATFORM_CONFIG = {
  // Platform fee structure
  fees: {
    total: 0.000111, // ETH
    creator: 0.000055, // 50%
    firstMinter: 0.000011, // 10%
    referral: 0.000022, // 20%
    platform: 0.000022, // 20%
  },
  
  // ZRM token configuration
  zrm: {
    tokenAddress: '0x538D6F4fb9598dC74e15e6974049B109ae0AbC6a', // ZRM token on Zora
    decimals: 18,
    symbol: 'ZRM',
    name: 'Zorium'
  },
  
  // Admin dashboard settings
  admin: {
    ownerAddress: PLATFORM_OWNER_ADDRESS,
    redirectDelay: 2000, // ms to wait before redirecting non-owners
  }
} as const

// Utility function to check if address is platform owner
export function isPlatformOwner(address?: string): boolean {
  if (!address || !PLATFORM_OWNER_ADDRESS) return false
  return address.toLowerCase() === PLATFORM_OWNER_ADDRESS.toLowerCase()
}

// Get formatted fee breakdown for display
export function getFormattedFees() {
  const { fees } = PLATFORM_CONFIG
  return {
    total: `${fees.total.toFixed(6)} ETH`,
    creator: `${fees.creator.toFixed(6)} ETH (50%)`,
    firstMinter: `${fees.firstMinter.toFixed(6)} ETH (10%)`,
    referral: `${fees.referral.toFixed(6)} ETH (20%)`,
    platform: `${fees.platform.toFixed(6)} ETH (20%)`,
  }
}