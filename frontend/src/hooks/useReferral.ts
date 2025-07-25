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

  // Add referral to current URL if user is connected and no existing referral
  const addReferralToCurrentURL = () => {
    if (!connectedAddress || referralAddress) return

    const currentUrl = new URL(window.location.href)
    if (!currentUrl.searchParams.has(REFERRAL_PARAM)) {
      currentUrl.searchParams.set(REFERRAL_PARAM, connectedAddress)
      router.replace(currentUrl.pathname + currentUrl.search)
    }
  }

  // Generate NFT share link with referral
  const generateNFTShareLink = (nftId: string | number) => {
    return generateReferralLink(`/nft/${nftId}`)
  }

  // Share functions for social media
  const shareToTwitter = (nftId: string | number, title: string) => {
    const url = generateNFTShareLink(nftId)
    const text = `Check out this amazing NFT: ${title} on @ZoriumFun`
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`
    window.open(twitterUrl, '_blank', 'width=600,height=400')
  }

  const shareToTelegram = (nftId: string | number, title: string) => {
    const url = generateNFTShareLink(nftId)
    const text = `Check out this amazing NFT: ${title} on Zorium.fun`
    const telegramUrl = `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`
    window.open(telegramUrl, '_blank', 'width=600,height=400')
  }

  const shareToFarcaster = (nftId: string | number, title: string) => {
    const url = generateNFTShareLink(nftId)
    const text = `Just discovered this incredible NFT: ${title} on @zorium! 🎨✨\n\nMint it now and join the community!`
    const farcasterUrl = `https://warpcast.com/~/compose?text=${encodeURIComponent(text)}&embeds[]=${encodeURIComponent(url)}`
    window.open(farcasterUrl, '_blank', 'width=600,height=500')
  }

  const copyReferralLink = async (nftId: string | number) => {
    const url = generateNFTShareLink(nftId)
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

// Custom hook for automatic referral URL management
export function useAutoReferral() {
  const { addReferralToCurrentURL } = useReferral()
  const { isConnected } = useAccount()

  useEffect(() => {
    if (isConnected) {
      // Add small delay to ensure address is available
      setTimeout(addReferralToCurrentURL, 100)
    }
  }, [isConnected, addReferralToCurrentURL])
}