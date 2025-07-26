import { NextRequest, NextResponse } from 'next/server'
import { findUserByAddress, updateUser } from '@/lib/mock-database'

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
    const user = findUserByAddress(address)
    if (!user) {
      return NextResponse.json(
        { message: 'User not found' },
        { status: 404 }
      )
    }
    
    // Check if user has verified email
    if (!user.isEmailVerified || user.registrationStep !== 'email_verified') {
      return NextResponse.json(
        { message: 'Email must be verified before completing onboarding' },
        { status: 400 }
      )
    }
    
    // Update user with onboarding completion
    const updatedUser = updateUser(address, {
      registrationStep: 'completed',
      isVerified: true,
      followedUsers: followedUsers,
      onboardingCompletedAt: new Date().toISOString()
    })
    
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