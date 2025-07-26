import { NextRequest, NextResponse } from 'next/server'

// Mock database - in real app this would be a proper database
let users: any[] = []

export async function GET(
  request: NextRequest,
  { params }: { params: { address: string } }
) {
  try {
    const { address } = params
    
    if (!address) {
      return NextResponse.json(
        { message: 'Address parameter is required' },
        { status: 400 }
      )
    }
    
    // Find user by address
    const user = users.find(user => user.address.toLowerCase() === address.toLowerCase())
    
    if (!user) {
      return NextResponse.json(
        { message: 'User not found' },
        { status: 404 }
      )
    }
    
    // Return user data (excluding sensitive information)
    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        address: user.address,
        email: user.email,
        username: user.username,
        nickname: user.nickname,
        avatar: user.avatar,
        isEmailVerified: user.isEmailVerified,
        isVerified: user.isVerified,
        registrationStep: user.registrationStep,
        createdAt: user.createdAt,
        verifiedAt: user.verifiedAt,
        onboardingCompletedAt: user.onboardingCompletedAt
      }
    })
  } catch (error) {
    console.error('User lookup error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}