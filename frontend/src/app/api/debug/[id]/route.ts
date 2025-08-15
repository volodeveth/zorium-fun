import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    
    // Get backend API URL from environment - hard-coded to fix environment variable issue
    const backendUrl = 'https://backend-2gclejjwp-volodeveths-projects.vercel.app'
    
    console.log(`🔍 DEBUG: Fetching NFT ${id} from backend: ${backendUrl}`)
    
    // Test backend connectivity
    let backendResponse
    let backendError
    
    try {
      const response = await fetch(`${backendUrl}/api/nfts/${id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        cache: 'no-store'
      })
      
      backendResponse = {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
        body: await response.text()
      }
    } catch (error) {
      backendError = error instanceof Error ? error.message : 'Unknown error'
    }
    
    const debugInfo = {
      timestamp: new Date().toISOString(),
      requestId: id,
      backendUrl,
      environment: {
        NODE_ENV: process.env.NODE_ENV,
        NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL
      },
      backendResponse,
      backendError,
      params,
      headers: Object.fromEntries(request.headers.entries())
    }
    
    console.log('🔍 DEBUG INFO:', JSON.stringify(debugInfo, null, 2))
    
    return NextResponse.json(debugInfo)
    
  } catch (error) {
    console.error('❌ Debug endpoint error:', error)
    return NextResponse.json(
      { 
        error: 'Debug endpoint failed', 
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      }, 
      { status: 500 }
    )
  }
}