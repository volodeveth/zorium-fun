'use client'

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { useAccount } from 'wagmi'

const REFERRAL_STORAGE_KEY = 'zorium_referral'
const REFERRAL_PARAM = 'ref'

export function useReferral() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { address: connectedAddress } = useAccount()
  const [referralAddress, setReferralAddress] = useState<string | null>(null)

  // Get referral address from URL or localStorage
  useEffect(() => {
    const urlReferral = searchParams.get(REFERRAL_PARAM)
    
    if (urlReferral && isValidAddress(urlReferral)) {
      // Save referral to localStorage for future use
      localStorage.setItem(REFERRAL_STORAGE_KEY, urlReferral)
      setReferralAddress(urlReferral)
    } else {
      // Try to get from localStorage if not in URL
      const storedReferral = localStorage.getItem(REFERRAL_STORAGE_KEY)
      if (storedReferral && isValidAddress(storedReferral)) {
        setReferralAddress(storedReferral)
      }
    }
  }, [searchParams])

  // Generate referral link for sharing
  const generateReferralLink = (path: string, address?: string) => {
    const referrer = address || connectedAddress
    if (!referrer) return path

    const url = new URL(path, window.location.origin)
    url.searchParams.set(REFERRAL_PARAM, referrer)
    return url.toString()
  }

  // Add referral to current URL only for specific contexts (not automatic)
  const addReferralToCurrentURL = () => {
    // This function is now disabled - referrals should only be added via sharing
    return
  }

  // Generate NFT share link with referral (only if user owns the NFT)
  const generateNFTShareLink = (nftId: string | number, userOwnsNFT: boolean = false) => {
    // Only generate referral links if user has minted/owns this NFT
    if (userOwnsNFT && connectedAddress) {
      return generateReferralLink(`/nft/${nftId}`)
    }
    // Return regular link without referral if user doesn't own NFT
    return `${window.location.origin}/nft/${nftId}`
  }

  // Share functions for social media (with ownership check)
  const shareToTwitter = (nftId: string | number, title: string, userOwnsNFT: boolean = false) => {
    const url = generateNFTShareLink(nftId, userOwnsNFT)
    const text = `Check out this amazing NFT: ${title} on @ZoriumFun`
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`
    window.open(twitterUrl, '_blank', 'width=600,height=400')
  }

  const shareToTelegram = (nftId: string | number, title: string, userOwnsNFT: boolean = false) => {
    const url = generateNFTShareLink(nftId, userOwnsNFT)
    const text = `Check out this amazing NFT: ${title} on Zorium.fun`
    const telegramUrl = `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`
    window.open(telegramUrl, '_blank', 'width=600,height=400')
  }

  const shareToFarcaster = (nftId: string | number, title: string, userOwnsNFT: boolean = false) => {
    const url = generateNFTShareLink(nftId, userOwnsNFT)
    const text = `Just discovered this incredible NFT: ${title} on @zorium! 🎨✨\n\nMint it now and join the community!`
    const farcasterUrl = `https://warpcast.com/~/compose?text=${encodeURIComponent(text)}&embeds[]=${encodeURIComponent(url)}`
    window.open(farcasterUrl, '_blank', 'width=600,height=500')
  }

  const copyReferralLink = async (nftId: string | number, userOwnsNFT: boolean = false) => {
    const url = generateNFTShareLink(nftId, userOwnsNFT)
    try {
      await navigator.clipboard.writeText(url)
      return true
    } catch (error) {
      console.error('Failed to copy link:', error)
      return false
    }
  }

  // Clear referral (useful for testing)
  const clearReferral = () => {
    localStorage.removeItem(REFERRAL_STORAGE_KEY)
    setReferralAddress(null)
  }

  return {
    referralAddress,
    generateReferralLink,
    generateNFTShareLink,
    addReferralToCurrentURL,
    shareToTwitter,
    shareToTelegram,
    shareToFarcaster,
    copyReferralLink,
    clearReferral,
    hasReferral: !!referralAddress
  }
}

// Helper function to validate Ethereum address
function isValidAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(address)
}

// Custom hook for automatic referral URL management (disabled)
export function useAutoReferral() {
  // Auto-referral is now disabled - referrals only work through sharing
  return
}