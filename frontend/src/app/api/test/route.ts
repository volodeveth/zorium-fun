import { NextResponse } from 'next/server'

export async function GET() {
  const backendUrl = 'https://backend-2gclejjwp-volodeveths-projects.vercel.app'
  
  return NextResponse.json({ 
    message: 'API is working!', 
    backendUrl,
    timestamp: new Date().toISOString()
  })
}