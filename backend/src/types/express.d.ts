// Extend Express Request to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string
        address: string
        email?: string
        username?: string
        isVerified: boolean
        adminLevel?: number
      }
    }
  }
}

export {}