import { NextRequest, NextResponse } from 'next/server'

// Import the same storage from parent route
const marketplaceStorage = new Map<string, Array<{
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
}>>()

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { listingId } = body
    
    if (!listingId) {
      return NextResponse.json(
        { error: 'listingId is required' },
        { status: 400 }
      )
    }

    // Find the listing across all NFTs
    let foundListing = null
    let nftId = null
    
    for (const [key, listings] of marketplaceStorage.entries()) {
      const listing = listings.find(l => l.id === listingId && l.status === 'active')
      if (listing) {
        foundListing = listing
        nftId = key
        break
      }
    }

    if (!foundListing || !nftId) {
      return NextResponse.json(
        { error: 'Listing not found or no longer available' },
        { status: 404 }
      )
    }

    // Simulate purchase validation
    await new Promise(resolve => setTimeout(resolve, 1000))

    // Mark listing as sold
    const listings = marketplaceStorage.get(nftId) || []
    const updatedListings = listings.map(listing => 
      listing.id === listingId 
        ? { ...listing, status: 'sold' as const, soldAt: new Date().toISOString() }
        : listing
    )
    
    marketplaceStorage.set(nftId, updatedListings)

    // Generate mock transaction hash
    const transactionHash = '0x' + Math.random().toString(16).substr(2, 64)

    return NextResponse.json({
      success: true,
      transactionHash,
      listing: foundListing,
      message: 'NFT purchased successfully'
    })
  } catch (error) {
    console.error('Error processing purchase:', error)
    return NextResponse.json(
      { error: 'Failed to process purchase' },
      { status: 500 }
    )
  }
}