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
    const { nftId, price, quantity = 1 } = body
    
    if (!nftId || !price) {
      return NextResponse.json(
        { error: 'nftId and price are required' },
        { status: 400 }
      )
    }

    if (parseFloat(price) <= 0) {
      return NextResponse.json(
        { error: 'Price must be greater than 0' },
        { status: 400 }
      )
    }

    // Get user info (in real app, this would come from authentication)
    const seller = {
      address: '0x1111...2222', // Mock current user
      username: 'currentuser'
    }

    // Simulate listing validation
    await new Promise(resolve => setTimeout(resolve, 800))

    const newListing = {
      id: `listing_${Date.now()}_${Math.random().toString(16).substr(2, 8)}`,
      nftId,
      tokenId: nftId,
      seller,
      price: parseFloat(price).toFixed(6),
      priceInWei: (parseFloat(price) * 1e18).toString(),
      listedAt: new Date().toISOString(),
      status: 'active' as const,
      quantity: parseInt(quantity.toString()) || 1
    }

    // Add to storage
    const existingListings = marketplaceStorage.get(nftId) || []
    existingListings.push(newListing)
    marketplaceStorage.set(nftId, existingListings)

    return NextResponse.json({
      success: true,
      listing: newListing,
      message: 'NFT listed successfully'
    })
  } catch (error) {
    console.error('Error processing listing:', error)
    return NextResponse.json(
      { error: 'Failed to create listing' },
      { status: 500 }
    )
  }
}