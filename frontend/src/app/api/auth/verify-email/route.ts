import { NextRequest, NextResponse } from 'next/server'
import { getEmailToken, removeEmailToken, addUser } from '@/lib/mock-database'

export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json()
    
    if (!token) {
      return NextResponse.json(
        { message: 'Verification token is required' },
        { status: 400 }
      )
    }
    
    // Find token in storage
    const tokenData = getEmailToken(token)
    if (!tokenData) {
      return NextResponse.json(
        { message: 'Invalid or expired verification token' },
        { status: 400 }
      )
    }
    
    // Add user to main users array
    const verifiedUser = {
      ...tokenData.userData,
      isEmailVerified: true,
      registrationStep: 'email_verified',
      verifiedAt: new Date().toISOString()
    }
    
    addUser(verifiedUser)
    
    // Remove the token as it's been used
    removeEmailToken(token)
    
    return NextResponse.json({
      success: true,
      message: 'Email verified successfully',
      user: {
        address: verifiedUser.address,
        email: verifiedUser.email,
        username: verifiedUser.username,
        nickname: verifiedUser.nickname,
        isEmailVerified: true,
        registrationStep: 'email_verified'
      }
    })
  } catch (error) {
    console.error('Email verification error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token')
    
    if (!token) {
      return NextResponse.redirect(new URL('/login?error=missing-token', request.url))
    }
    
    // Find token in storage
    const tokenData = getEmailToken(token)
    if (!tokenData) {
      return NextResponse.redirect(new URL('/login?error=invalid-token', request.url))
    }
    
    // Add user to main users array
    const verifiedUser = {
      ...tokenData.userData,
      isEmailVerified: true,
      registrationStep: 'email_verified',
      verifiedAt: new Date().toISOString()
    }
    
    addUser(verifiedUser)
    
    // Remove the token as it's been used
    removeEmailToken(token)
    
    // Redirect to success page or dashboard
    return NextResponse.redirect(new URL('/?verified=true', request.url))
  } catch (error) {
    console.error('Email verification error:', error)
    return NextResponse.redirect(new URL('/login?error=server-error', request.url))
  }
}