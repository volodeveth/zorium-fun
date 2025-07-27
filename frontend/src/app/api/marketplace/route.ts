import { NextRequest, NextResponse } from 'next/server'

// In-memory storage for demo (in production, use database)
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

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const nftId = searchParams.get('nftId')
    
    if (!nftId) {
      return NextResponse.json(
        { error: 'nftId is required' },
        { status: 400 }
      )
    }
    
    const listings = marketplaceStorage.get(nftId) || []
    const activeListings = listings.filter(listing => listing.status === 'active')
      .sort((a, b) => parseFloat(a.price) - parseFloat(b.price))

    const soldListings = listings.filter(listing => listing.status === 'sold')
    const totalVolume = soldListings.reduce((sum, listing) => sum + parseFloat(listing.price), 0)

    return NextResponse.json({
      listings: activeListings,
      cheapestListing: activeListings[0],
      totalListings: activeListings.length,
      totalVolume: totalVolume.toString(),
      floorPrice: activeListings[0]?.price
    })
  } catch (error) {
    console.error('Error fetching marketplace data:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}