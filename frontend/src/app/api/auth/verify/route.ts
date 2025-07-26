import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { address, message, signature } = await request.json()
    
    if (!address || !message || !signature) {
      return NextResponse.json(
        { message: 'Missing required fields' },
        { status: 400 }
      )
    }
    
    // TODO: Implement signature verification
    // For now, return mock response
    const mockUser = {
      id: '1',
      address,
      username: 'user123',
      nickname: 'User Name',
      email: 'user@example.com',
      isEmailVerified: true,
      registrationStep: 'completed'
    }
    
    return NextResponse.json({
      success: true,
      user: mockUser,
      message: 'Signature verified successfully'
    })
  } catch (error) {
    console.error('Verification error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}