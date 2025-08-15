import { NextRequest, NextResponse } from 'next/server'

// Add CORS headers for debugging
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    
    // Get backend API URL from environment - hard-coded to fix environment variable issue
    const backendUrl = 'https://backend-2gclejjwp-volodeveths-projects.vercel.app'
    
    console.log(`🔍 Frontend API: Fetching NFT ${id} from backend: ${backendUrl}`)
    console.log(`🔗 Full URL: ${backendUrl}/api/nfts/${id}`)
    console.log(`📋 Request params:`, params)
    console.log(`📋 NFT ID:`, id)
    console.log(`🕐 Timestamp:`, new Date().toISOString())
    
    // Fetch NFT data from backend
    const response = await fetch(`${backendUrl}/api/nfts/${id}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        // Forward any auth headers if needed
        ...(request.headers.get('authorization') && {
          'authorization': request.headers.get('authorization')!
        })
      },
      cache: 'no-store' // Always fetch fresh data
    })
    
    if (!response.ok) {
      console.error(`❌ Backend responded with status: ${response.status}`)
      console.error(`❌ Response headers:`, Object.fromEntries(response.headers.entries()))
      const errorText = await response.text()
      console.error('❌ Backend error details:', errorText)
      
      if (response.status === 404) {
        return NextResponse.json({ error: 'NFT not found' }, { status: 404, headers: corsHeaders })
      }
      
      return NextResponse.json(
        { error: 'Failed to fetch NFT data' }, 
        { status: response.status, headers: corsHeaders }
      )
    }
    
    const data = await response.json()
    
    console.log('NFT data received from backend:', data)
    
    return NextResponse.json(data, { headers: corsHeaders })
    
  } catch (error) {
    console.error('Error fetching NFT:', error)
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500, headers: corsHeaders }
    )
  }
}

export async function OPTIONS() {
  console.log('🔧 CORS preflight request')
  return new Response(null, { status: 200, headers: corsHeaders })
}