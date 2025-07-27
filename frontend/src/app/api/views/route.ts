import { NextRequest, NextResponse } from 'next/server'

// In-memory storage for demo (in production, use database)
const viewStorage = new Map<string, {
  count: number
  history: Array<{
    timestamp: string
    userAgent?: string
    ip?: string
    referrer?: string
    timeSpent?: number
  }>
}>()

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const resourceId = searchParams.get('resourceId')
    const resourceType = searchParams.get('resourceType')
    
    if (!resourceId || !resourceType) {
      return NextResponse.json(
        { error: 'resourceId and resourceType are required' },
        { status: 400 }
      )
    }
    
    const key = `${resourceType}:${resourceId}`
    const data = viewStorage.get(key) || { count: Math.floor(Math.random() * 2000) + 500, history: [] }
    
    return NextResponse.json({
      resourceId,
      resourceType,
      views: data.count,
      history: data.history.slice(-10) // Return last 10 views
    })
  } catch (error) {
    console.error('Error fetching views:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { resourceId, resourceType, timeSpent, referrer } = body
    
    if (!resourceId || !resourceType) {
      return NextResponse.json(
        { error: 'resourceId and resourceType are required' },
        { status: 400 }
      )
    }
    
    // Get client info
    const userAgent = request.headers.get('user-agent') || 'Unknown'
    const forwardedFor = request.headers.get('x-forwarded-for')
    const ip = forwardedFor ? forwardedFor.split(',')[0] : request.ip || 'Unknown'
    
    const key = `${resourceType}:${resourceId}`
    const currentData = viewStorage.get(key) || { count: 0, history: [] }
    
    // Check for duplicate views from same IP within 1 hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()
    const recentViewFromIP = currentData.history.find(
      view => view.ip === ip && view.timestamp > oneHourAgo
    )
    
    // Don't count duplicate views from same IP within 1 hour
    if (recentViewFromIP) {
      return NextResponse.json({
        message: 'View already counted recently',
        views: currentData.count,
        counted: false
      })
    }
    
    // Add new view
    const newView = {
      timestamp: new Date().toISOString(),
      userAgent,
      ip,
      referrer,
      timeSpent
    }
    
    currentData.count += 1
    currentData.history.push(newView)
    
    // Keep only last 100 views for memory efficiency
    if (currentData.history.length > 100) {
      currentData.history = currentData.history.slice(-100)
    }
    
    viewStorage.set(key, currentData)
    
    return NextResponse.json({
      message: 'View tracked successfully',
      views: currentData.count,
      counted: true
    })
  } catch (error) {
    console.error('Error tracking view:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const resourceId = searchParams.get('resourceId')
    const resourceType = searchParams.get('resourceType')
    
    if (!resourceId || !resourceType) {
      return NextResponse.json(
        { error: 'resourceId and resourceType are required' },
        { status: 400 }
      )
    }
    
    const key = `${resourceType}:${resourceId}`
    viewStorage.delete(key)
    
    return NextResponse.json({
      message: 'Views reset successfully'
    })
  } catch (error) {
    console.error('Error resetting views:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}