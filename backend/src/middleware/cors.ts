import { CorsOptions } from 'cors'

const allowedOrigins = [
  process.env.FRONTEND_URL || 'http://localhost:3000',
  'http://localhost:3000',
  'http://localhost:3001',
  'https://zorium.fun',
  'https://www.zorium.fun',
  // Allow all Vercel frontend URLs with regex pattern
  /^https:\/\/frontend-[a-z0-9]+-volodeveths-projects\.vercel\.app$/
]

export const corsConfig: CorsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true)
    
    // Check exact matches first
    const stringOrigins = allowedOrigins.filter(o => typeof o === 'string') as string[]
    if (stringOrigins.includes(origin)) {
      callback(null, true)
      return
    }
    
    // Check regex patterns
    const regexOrigins = allowedOrigins.filter(o => o instanceof RegExp) as RegExp[]
    for (const regex of regexOrigins) {
      if (regex.test(origin)) {
        callback(null, true)
        return
      }
    }
    
    console.log('CORS blocked origin:', origin)
    callback(new Error('Not allowed by CORS'))
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: [
    'Origin',
    'X-Requested-With',
    'Content-Type',
    'Accept',
    'Authorization',
    'Cache-Control',
    'Pragma',
    'X-API-Key',
    'x-admin-address'
  ],
  exposedHeaders: [
    'X-RateLimit-Limit',
    'X-RateLimit-Remaining',
    'X-RateLimit-Reset'
  ],
  maxAge: 86400 // 24 hours
}