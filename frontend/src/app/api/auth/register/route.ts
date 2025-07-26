import { NextRequest, NextResponse } from 'next/server'
import { findUserByEmail, findUserByUsername, findUserByAddress, addEmailToken } from '@/lib/mock-database'

export async function POST(request: NextRequest) {
  try {
    const { address, email, username, nickname, message, signature } = await request.json()
    
    if (!address || !email || !username || !nickname || !message || !signature) {
      return NextResponse.json(
        { message: 'Missing required fields' },
        { status: 400 }
      )
    }
    
    // Check if email already exists
    const existingEmailUser = findUserByEmail(email)
    if (existingEmailUser) {
      return NextResponse.json(
        { message: 'Email address is already registered' },
        { status: 409 }
      )
    }
    
    // Check if username already exists
    const existingUsernameUser = findUserByUsername(username)
    if (existingUsernameUser) {
      return NextResponse.json(
        { message: 'Username is already taken' },
        { status: 409 }
      )
    }
    
    // Check if wallet address already exists
    const existingWalletUser = findUserByAddress(address)
    if (existingWalletUser) {
      return NextResponse.json(
        { message: 'Wallet address is already registered' },
        { status: 409 }
      )
    }
    
    // TODO: Verify signature
    
    // Generate verification token
    const verificationToken = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
    
    // Store user data temporarily
    const userData = {
      id: Date.now().toString(),
      address: address.toLowerCase(),
      email: email.toLowerCase(),
      username: username.toLowerCase(),
      nickname,
      isEmailVerified: false,
      registrationStep: 'email_pending',
      createdAt: new Date().toISOString()
    }
    
    // Store verification token
    addEmailToken(verificationToken, {
      email: email.toLowerCase(),
      address: address.toLowerCase(),
      userData
    })
    
    // TODO: Send verification email
    console.log(`Verification email would be sent to ${email} with token: ${verificationToken}`)
    console.log(`Verification link: ${process.env.NEXT_PUBLIC_APP_URL}/verify-email?token=${verificationToken}`)
    
    return NextResponse.json({
      success: true,
      message: 'Registration successful. Please check your email for verification.',
      user: {
        address: userData.address,
        email: userData.email,
        username: userData.username,
        nickname: userData.nickname,
        isEmailVerified: false,
        registrationStep: 'email_pending'
      }
    })
  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Note: In production, these would be stored in a proper database
// For now, using module-level variables for demo purposes