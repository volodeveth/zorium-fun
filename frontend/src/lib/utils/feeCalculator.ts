// Fee calculation utilities for ZORIUM.FUN platform

export interface FeeBreakdown {
  total: string
  creator: string
  firstMinter: string
  referral: string
  platform: string
  hasReferral: boolean
}

export interface FeeAmounts {
  total: number
  creator: number
  firstMinter: number
  referral: number
  platform: number
}

// Default fee structure in ETH
export const DEFAULT_FEE_STRUCTURE = {
  TOTAL: 0.000111,
  CREATOR_PERCENTAGE: 50, // 50%
  FIRST_MINTER_PERCENTAGE: 10, // 10%
  REFERRAL_PERCENTAGE: 20, // 20%
  PLATFORM_PERCENTAGE: 20, // 20%
} as const

/**
 * Calculate fee breakdown based on whether referral is present
 * @param hasReferral - Whether a referral address is provided
 * @param customTotal - Custom total fee (optional, defaults to 0.000111 ETH)
 * @returns FeeBreakdown object with all calculated fees
 */
export function calculateFeeBreakdown(
  hasReferral: boolean = false,
  customTotal?: number
): FeeBreakdown {
  const total = customTotal || DEFAULT_FEE_STRUCTURE.TOTAL
  
  // Calculate base amounts
  const creator = (total * DEFAULT_FEE_STRUCTURE.CREATOR_PERCENTAGE) / 100
  const firstMinter = (total * DEFAULT_FEE_STRUCTURE.FIRST_MINTER_PERCENTAGE) / 100
  
  let referral = 0
  let platform = 0
  
  if (hasReferral) {
    // With referral: standard distribution
    referral = (total * DEFAULT_FEE_STRUCTURE.REFERRAL_PERCENTAGE) / 100
    platform = (total * DEFAULT_FEE_STRUCTURE.PLATFORM_PERCENTAGE) / 100
  } else {
    // Without referral: referral fee goes to platform
    referral = 0
    platform = (total * (DEFAULT_FEE_STRUCTURE.PLATFORM_PERCENTAGE + DEFAULT_FEE_STRUCTURE.REFERRAL_PERCENTAGE)) / 100
  }
  
  return {
    total: total.toFixed(6),
    creator: creator.toFixed(6),
    firstMinter: firstMinter.toFixed(6),
    referral: referral.toFixed(6),
    platform: platform.toFixed(6),
    hasReferral
  }
}

/**
 * Get fee amounts as numbers for calculations
 * @param hasReferral - Whether a referral address is provided
 * @param customTotal - Custom total fee (optional)
 * @returns FeeAmounts object with numeric values
 */
export function getFeeAmounts(
  hasReferral: boolean = false,
  customTotal?: number
): FeeAmounts {
  const breakdown = calculateFeeBreakdown(hasReferral, customTotal)
  
  return {
    total: parseFloat(breakdown.total),
    creator: parseFloat(breakdown.creator),
    firstMinter: parseFloat(breakdown.firstMinter),
    referral: parseFloat(breakdown.referral),
    platform: parseFloat(breakdown.platform)
  }
}

/**
 * Format fee for display with currency symbol
 * @param amount - Fee amount as string or number
 * @param currency - Currency symbol (default: ETH)
 * @returns Formatted fee string
 */
export function formatFee(amount: string | number, currency: string = 'ETH'): string {
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount
  return `${numAmount.toFixed(6)} ${currency}`
}

/**
 * Get fee percentage for display
 * @param amount - Fee amount
 * @param total - Total amount
 * @returns Percentage as string
 */
export function getFeePercentage(amount: string | number, total: string | number): string {
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount
  const numTotal = typeof total === 'string' ? parseFloat(total) : total
  
  if (numTotal === 0) return '0%'
  
  const percentage = (numAmount / numTotal) * 100
  return `${percentage.toFixed(0)}%`
}

/**
 * Validate if referral address is provided in mint transaction
 * @param referralAddress - Referral wallet address
 * @returns boolean indicating if referral is valid
 */
export function isValidReferral(referralAddress?: string): boolean {
  if (!referralAddress) return false
  
  // Basic validation for Ethereum address format
  const ethAddressRegex = /^0x[a-fA-F0-9]{40}$/
  return ethAddressRegex.test(referralAddress)
}

/**
 * Extract referral address from URL parameters
 * @param url - Current URL or search params
 * @returns Referral address if valid, undefined otherwise
 */
export function extractReferralFromUrl(url?: string): string | undefined {
  if (typeof window === 'undefined' && !url) return undefined
  
  const searchParams = url 
    ? new URL(url).searchParams 
    : new URLSearchParams(window.location.search)
  
  const referral = searchParams.get('ref')
  return isValidReferral(referral || '') ? referral || undefined : undefined
}