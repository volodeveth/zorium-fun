import { NextRequest, NextResponse } from 'next/server'

// Mock database - in real app this would be a proper database
let users: any[] = []

export async function POST(request: NextRequest) {
  try {
    const { address, followedUsers = [] } = await request.json()
    
    if (!address) {
      return NextResponse.json(
        { message: 'Wallet address is required' },
        { status: 400 }
      )
    }
    
    // Find user by address
    const userIndex = users.findIndex(user => user.address.toLowerCase() === address.toLowerCase())
    if (userIndex === -1) {
      return NextResponse.json(
        { message: 'User not found' },
        { status: 404 }
      )
    }
    
    const user = users[userIndex]
    
    // Check if user has verified email
    if (!user.isEmailVerified || user.registrationStep !== 'email_verified') {
      return NextResponse.json(
        { message: 'Email must be verified before completing onboarding' },
        { status: 400 }
      )
    }
    
    // Update user with onboarding completion
    const updatedUser = {
      ...user,
      registrationStep: 'completed',
      isVerified: true,
      followedUsers: followedUsers,
      onboardingCompletedAt: new Date().toISOString()
    }
    
    users[userIndex] = updatedUser
    
    // TODO: Process follow relationships in database
    if (followedUsers.length > 0) {
      console.log(`User ${address} followed ${followedUsers.length} users during onboarding:`, followedUsers)
    }
    
    return NextResponse.json({
      success: true,
      message: 'Onboarding completed successfully',
      user: {
        address: updatedUser.address,
        email: updatedUser.email,
        username: updatedUser.username,
        nickname: updatedUser.nickname,
        isEmailVerified: true,
        isVerified: true,
        registrationStep: 'completed',
        followedUsersCount: followedUsers.length
      }
    })
  } catch (error) {
    console.error('Onboarding completion error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}