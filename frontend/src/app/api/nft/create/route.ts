import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Get backend API URL from environment
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'https://backend-33rk07w6m-volodeveths-projects.vercel.app'
    
    console.log('Creating NFT record in backend:', body)
    
    // Forward request to backend
    const response = await fetch(`${backendUrl}/api/nfts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Forward any auth headers if needed
        ...(request.headers.get('authorization') && {
          'authorization': request.headers.get('authorization')!
        })
      },
      body: JSON.stringify(body)
    })
    
    if (!response.ok) {
      console.error(`Backend responded with status: ${response.status}`)
      const errorText = await response.text()
      console.error('Backend error:', errorText)
      
      return NextResponse.json(
        { error: 'Failed to create NFT record' }, 
        { status: response.status }
      )
    }
    
    const data = await response.json()
    
    console.log('NFT created successfully:', data)
    
    return NextResponse.json(data)
    
  } catch (error) {
    console.error('Error creating NFT:', error)
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    )
  }
}