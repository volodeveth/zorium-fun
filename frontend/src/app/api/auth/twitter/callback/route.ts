import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const state = searchParams.get('state')
  const error = searchParams.get('error')

  if (error) {
    console.error('Twitter OAuth error:', error)
    return NextResponse.redirect(new URL('/profile/settings?error=twitter_auth_failed', request.url))
  }

  if (!code || !state) {
    return NextResponse.redirect(new URL('/profile/settings?error=missing_parameters', request.url))
  }

  try {
    // Parse state to get wallet address
    const stateData = JSON.parse(decodeURIComponent(state))
    const walletAddress = stateData.wallet

    // Exchange code for access token
    const tokenResponse = await fetch('https://api.twitter.com/2/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${Buffer.from(`${process.env.TWITTER_CLIENT_ID}:${process.env.TWITTER_CLIENT_SECRET}`).toString('base64')}`,
      },
      body: new URLSearchParams({
        code,
        grant_type: 'authorization_code',
        client_id: process.env.TWITTER_CLIENT_ID!,
        redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/twitter/callback`,
        code_verifier: 'challenge', // In production, use proper PKCE
      }),
    })

    if (!tokenResponse.ok) {
      throw new Error('Failed to exchange code for token')
    }

    const tokenData = await tokenResponse.json()
    const accessToken = tokenData.access_token

    // Get user info from Twitter
    const userResponse = await fetch('https://api.twitter.com/2/users/me', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    })

    if (!userResponse.ok) {
      throw new Error('Failed to get user info')
    }

    const userData = await userResponse.json()
    const twitterUser = userData.data

    // Store the connection in database (mock for now)
    console.log('Connecting Twitter account:', {
      walletAddress,
      twitterId: twitterUser.id,
      username: twitterUser.username,
      name: twitterUser.name,
    })

    // In a real app, you would:
    // 1. Save the connection to your database
    // 2. Store the access token securely
    // 3. Set up verification status

    // Redirect back to profile settings with success
    return NextResponse.redirect(new URL('/profile/settings?twitter_connected=true', request.url))

  } catch (error) {
    console.error('Twitter OAuth callback error:', error)
    return NextResponse.redirect(new URL('/profile/settings?error=twitter_connection_failed', request.url))
  }
}