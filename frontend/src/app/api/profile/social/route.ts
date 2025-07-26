import { NextRequest, NextResponse } from 'next/server'

// Mock data for demonstration
const mockSocialConnections: Record<string, any> = {
  '0x123...abc': {
    twitter: {
      id: 'tw_789012',
      username: 'golumdexter',
      isVerified: true,
      connectedAt: '2025-01-15T10:30:00Z',
      profileUrl: 'https://x.com/golumdexter'
    },
    farcaster: null // Not connected
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const address = searchParams.get('address')

  if (!address) {
    return NextResponse.json({ error: 'Address is required' }, { status: 400 })
  }

  // In a real app, you would query your database
  const connections = mockSocialConnections[address] || {
    twitter: null,
    farcaster: null
  }

  return NextResponse.json(connections)
}

export async function POST(request: NextRequest) {
  try {
    const { address, platform, action } = await request.json()

    if (!address || !platform || !action) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    if (action === 'disconnect') {
      // In a real app, you would remove the connection from your database
      if (mockSocialConnections[address]) {
        mockSocialConnections[address][platform] = null
      }

      return NextResponse.json({ success: true, message: `${platform} disconnected` })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })

  } catch (error) {
    console.error('Social API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Verify social media account
export async function PUT(request: NextRequest) {
  try {
    const { address, platform, verificationData } = await request.json()

    if (!address || !platform || !verificationData) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Mock verification process
    // In a real app, you would:
    // 1. Verify the social media account ownership
    // 2. Check if the account meets verification criteria
    // 3. Update the database with verified status

    const socialAccount = {
      id: `${platform}_${Date.now()}`,
      username: verificationData.username,
      isVerified: true,
      connectedAt: new Date().toISOString(),
      profileUrl: verificationData.profileUrl
    }

    // Store in mock data
    if (!mockSocialConnections[address]) {
      mockSocialConnections[address] = {}
    }
    mockSocialConnections[address][platform] = socialAccount

    return NextResponse.json({
      success: true,
      account: socialAccount
    })

  } catch (error) {
    console.error('Social verification error:', error)
    return NextResponse.json({ error: 'Verification failed' }, { status: 500 })
  }
}