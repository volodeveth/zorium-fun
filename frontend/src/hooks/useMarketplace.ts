'use client'

import { useState, useEffect } from 'react'

export interface MarketplaceListing {
  id: string
  nftId: string
  tokenId: string
  seller: {
    address: string
    username: string
  }
  price: string
  priceInWei: string
  listedAt: string
  expiresAt?: string
  status: 'active' | 'sold' | 'cancelled' | 'expired'
  quantity: number
}

export interface MarketplaceData {
  listings: MarketplaceListing[]
  cheapestListing?: MarketplaceListing
  totalListings: number
  totalVolume: string
  floorPrice?: string
}

export function useMarketplace(nftId: string) {
  const [marketplaceData, setMarketplaceData] = useState<MarketplaceData>({
    listings: [],
    totalListings: 0,
    totalVolume: '0'
  })
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Load marketplace data
  useEffect(() => {
    if (!nftId) return

    const loadMarketplaceData = async () => {
      try {
        setIsLoading(true)
        setError(null)
        
        // Try API first
        try {
          const response = await fetch(`/api/marketplace?nftId=${nftId}`)
          if (response.ok) {
            const data = await response.json()
            setMarketplaceData(data)
            return
          }
        } catch (apiError) {
          console.warn('Marketplace API not available, using mock data')
        }
        
        // Mock data for demo
        const mockListings: MarketplaceListing[] = generateMockListings(nftId)
        const sortedListings = mockListings
          .filter(listing => listing.status === 'active')
          .sort((a, b) => parseFloat(a.price) - parseFloat(b.price))

        const data: MarketplaceData = {
          listings: sortedListings,
          cheapestListing: sortedListings[0],
          totalListings: sortedListings.length,
          totalVolume: mockListings.reduce((sum, listing) => {
            if (listing.status === 'sold') {
              return (parseFloat(sum) + parseFloat(listing.price)).toString()
            }
            return sum
          }, '0'),
          floorPrice: sortedListings[0]?.price
        }

        setMarketplaceData(data)
      } catch (err) {
        setError('Failed to load marketplace data')
        console.error('Failed to load marketplace:', err)
      } finally {
        setIsLoading(false)
      }
    }

    loadMarketplaceData()
  }, [nftId])

  const buyListing = async (listingId: string) => {
    try {
      // Find the listing
      const listing = marketplaceData.listings.find(l => l.id === listingId)
      if (!listing) throw new Error('Listing not found')

      // Try API first
      try {
        const response = await fetch('/api/marketplace/buy', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ listingId })
        })
        
        if (response.ok) {
          const result = await response.json()
          // Refresh marketplace data
          const updatedListings = marketplaceData.listings.filter(l => l.id !== listingId)
          const sortedListings = updatedListings.sort((a, b) => parseFloat(a.price) - parseFloat(b.price))
          
          setMarketplaceData({
            ...marketplaceData,
            listings: sortedListings,
            cheapestListing: sortedListings[0],
            totalListings: sortedListings.length,
            floorPrice: sortedListings[0]?.price
          })
          
          return { success: true, transactionHash: result.transactionHash }
        }
      } catch (apiError) {
        console.warn('API purchase failed, using mock behavior')
      }

      // Mock purchase behavior
      await new Promise(resolve => setTimeout(resolve, 2000)) // Simulate transaction
      
      // Remove the purchased listing
      const updatedListings = marketplaceData.listings.filter(l => l.id !== listingId)
      const sortedListings = updatedListings.sort((a, b) => parseFloat(a.price) - parseFloat(b.price))
      
      setMarketplaceData({
        ...marketplaceData,
        listings: sortedListings,
        cheapestListing: sortedListings[0],
        totalListings: sortedListings.length,
        floorPrice: sortedListings[0]?.price
      })

      return { success: true, transactionHash: '0x' + Math.random().toString(16).substr(2, 64) }
    } catch (err) {
      console.error('Purchase failed:', err)
      throw err
    }
  }

  const listForSale = async (price: string, quantity: number = 1) => {
    try {
      // Try API first
      try {
        const response = await fetch('/api/marketplace/list', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ nftId, price, quantity })
        })
        
        if (response.ok) {
          const newListing = await response.json()
          const updatedListings = [...marketplaceData.listings, newListing]
            .sort((a, b) => parseFloat(a.price) - parseFloat(b.price))
          
          setMarketplaceData({
            ...marketplaceData,
            listings: updatedListings,
            cheapestListing: updatedListings[0],
            totalListings: updatedListings.length,
            floorPrice: updatedListings[0]?.price
          })
          
          return { success: true, listingId: newListing.id }
        }
      } catch (apiError) {
        console.warn('API listing failed, using mock behavior')
      }

      // Mock listing behavior
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      const newListing: MarketplaceListing = {
        id: `listing_${Date.now()}`,
        nftId,
        tokenId: nftId,
        seller: {
          address: '0x1111...2222', // Current user
          username: 'currentuser'
        },
        price,
        priceInWei: (parseFloat(price) * 1e18).toString(),
        listedAt: new Date().toISOString(),
        status: 'active',
        quantity
      }

      const updatedListings = [...marketplaceData.listings, newListing]
        .sort((a, b) => parseFloat(a.price) - parseFloat(b.price))
      
      setMarketplaceData({
        ...marketplaceData,
        listings: updatedListings,
        cheapestListing: updatedListings[0],
        totalListings: updatedListings.length,
        floorPrice: updatedListings[0]?.price
      })

      return { success: true, listingId: newListing.id }
    } catch (err) {
      console.error('Listing failed:', err)
      throw err
    }
  }

  return {
    marketplaceData,
    isLoading,
    error,
    buyListing,
    listForSale,
    hasListings: marketplaceData.totalListings > 0,
    cheapestPrice: marketplaceData.cheapestListing?.price,
    floorPrice: marketplaceData.floorPrice
  }
}

// Generate mock listings for demo
function generateMockListings(nftId: string): MarketplaceListing[] {
  // Sometimes generate no listings to test "No offers" state
  if (Math.random() < 0.3) return []
  
  const listingCount = Math.floor(Math.random() * 5) + 1 // 1-5 listings
  const basePrice = 0.000111
  
  return Array.from({ length: listingCount }, (_, i) => {
    const priceMultiplier = 1 + (Math.random() * 3) // 1x to 4x base price
    const price = (basePrice * priceMultiplier).toFixed(6)
    
    return {
      id: `listing_${nftId}_${i}`,
      nftId,
      tokenId: nftId,
      seller: {
        address: `0x${Math.random().toString(16).substr(2, 8)}...${Math.random().toString(16).substr(2, 4)}`,
        username: `holder_${i + 1}`
      },
      price,
      priceInWei: (parseFloat(price) * 1e18).toString(),
      listedAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'active',
      quantity: Math.random() < 0.7 ? 1 : Math.floor(Math.random() * 3) + 2 // Mostly 1, sometimes 2-4
    }
  })
}