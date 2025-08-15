import { Request, Response, NextFunction } from 'express'
import { validationResult, ValidationError } from 'express-validator'
import { ValidationError as CustomValidationError } from './errorHandler'

// Middleware to handle validation errors
export function validateRequest(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const errors = validationResult(req)
  
  if (!errors.isEmpty()) {
    const errorDetails = errors.array().map((error: any) => ({
      field: error.path || error.param,
      message: error.msg,
      value: error.value
    }))
    
    throw new CustomValidationError(
      'Validation failed',
      errorDetails
    )
  }
  
  next()
}

// Custom validators
export const customValidators = {
  // Ethereum address validator
  isEthereumAddress: (value: string) => {
    const regex = /^0x[a-fA-F0-9]{40}$/
    if (!regex.test(value)) {
      throw new Error('Invalid Ethereum address format')
    }
    return true
  },
  
  // IPFS hash validator
  isIPFSHash: (value: string) => {
    const regex = /^Qm[1-9A-HJ-NP-Za-km-z]{44}$/
    if (!regex.test(value)) {
      throw new Error('Invalid IPFS hash format')
    }
    return true
  },
  
  // Token ID validator
  isTokenId: (value: string) => {
    const num = parseInt(value)
    if (isNaN(num) || num < 0) {
      throw new Error('Token ID must be a non-negative integer')
    }
    return true
  },
  
  // Chain ID validator
  isValidChainId: (value: number) => {
    const validChainIds = [1, 8453, 137, 42161, 10] // Ethereum, Base, Polygon, Arbitrum, Optimism
    if (!validChainIds.includes(value)) {
      throw new Error('Invalid chain ID')
    }
    return true
  },
  
  // Decimal amount validator
  isDecimalAmount: (value: string) => {
    const regex = /^\d+(\.\d{1,18})?$/
    if (!regex.test(value)) {
      throw new Error('Invalid decimal amount format')
    }
    return true
  },
  
  // Username validator
  isValidUsername: (value: string) => {
    const regex = /^[a-zA-Z0-9_]{3,30}$/
    if (!regex.test(value)) {
      throw new Error('Username must be 3-30 characters and contain only letters, numbers, and underscores')
    }
    return true
  },
  
  // Bio validator
  isValidBio: (value: string) => {
    if (value && value.length > 500) {
      throw new Error('Bio must be less than 500 characters')
    }
    return true
  },
  
  // Social media URL validator
  isTwitterUrl: (value: string) => {
    const regex = /^https?:\/\/(www\.)?(twitter\.com|x\.com)\/[a-zA-Z0-9_]+$/
    if (!regex.test(value)) {
      throw new Error('Invalid Twitter URL format')
    }
    return true
  },
  
  isFarcasterUrl: (value: string) => {
    const regex = /^https?:\/\/(www\.)?warpcast\.com\/[a-zA-Z0-9_]+$/
    if (!regex.test(value)) {
      throw new Error('Invalid Farcaster URL format')
    }
    return true
  },
  
  // NFT metadata validator
  isValidNFTMetadata: (value: any) => {
    if (typeof value !== 'object' || value === null) {
      throw new Error('Metadata must be a valid JSON object')
    }
    
    const required = ['name', 'description', 'image']
    for (const field of required) {
      if (!value[field]) {
        throw new Error(`Metadata must include ${field}`)
      }
    }
    
    if (value.attributes && !Array.isArray(value.attributes)) {
      throw new Error('Attributes must be an array')
    }
    
    return true
  },
  
  // File size validator
  isValidFileSize: (size: number, maxSize: number = 10 * 1024 * 1024) => { // 10MB default
    if (size > maxSize) {
      throw new Error(`File size must be less than ${maxSize / 1024 / 1024}MB`)
    }
    return true
  },
  
  // Image file type validator
  isValidImageType: (mimetype: string) => {
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
    if (!validTypes.includes(mimetype)) {
      throw new Error('Invalid image type. Supported: JPEG, PNG, GIF, WebP')
    }
    return true
  },
  
  // Video file type validator
  isValidVideoType: (mimetype: string) => {
    const validTypes = ['video/mp4', 'video/webm', 'video/ogg']
    if (!validTypes.includes(mimetype)) {
      throw new Error('Invalid video type. Supported: MP4, WebM, OGG')
    }
    return true
  }
}

// Pagination validator
export function validatePagination(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const page = parseInt(req.query.page as string) || 1
  const limit = parseInt(req.query.limit as string) || 20
  
  if (page < 1) {
    throw new CustomValidationError('Page must be a positive integer')
  }
  
  if (limit < 1 || limit > 100) {
    throw new CustomValidationError('Limit must be between 1 and 100')
  }
  
  // Add pagination to request
  req.pagination = {
    page,
    limit,
    offset: (page - 1) * limit
  }
  
  next()
}

// Extend Express Request to include pagination
declare global {
  namespace Express {
    interface Request {
      pagination?: {
        page: number
        limit: number
        offset: number
      }
    }
  }
}