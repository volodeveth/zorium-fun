import { NextResponse } from 'next/server'

export async function GET() {
  console.log('🚀 Test NFT endpoint called!')
  
  // Mock NFT data
  const mockNFT = {
    nft: {
      id: 'test-id',
      tokenId: '1',
      contractAddress: '0x1234567890123456789012345678901234567890',
      chainId: 8453,
      name: 'Test NFT',
      description: 'This is a test NFT',
      image: 'https://via.placeholder.com/400x400?text=Test+NFT',
      creator: {
        address: '0xtest',
        username: 'testuser',
        displayName: 'Test User'
      },
      owner: {
        address: '0xtest',
        username: 'testuser',
        displayName: 'Test User'
      },
      createdAt: new Date().toISOString()
    }
  }
  
  return NextResponse.json(mockNFT)
}