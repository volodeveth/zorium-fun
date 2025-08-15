import { Request, Response, NextFunction } from 'express'
import { logger } from '../utils/logger'

export interface CustomError extends Error {
  statusCode?: number
  code?: string
  details?: any
}

export function errorHandler(
  error: CustomError,
  req: Request,
  res: Response,
  next: NextFunction
) {
  let statusCode = error.statusCode || 500
  let message = error.message || 'Internal Server Error'
  
  // Log error details
  logger.error('Error occurred:', {
    message: error.message,
    stack: error.stack,
    statusCode,
    method: req.method,
    url: req.url,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  })
  
  // Handle specific error types
  if (error.name === 'ValidationError') {
    statusCode = 400
    message = 'Validation Error'
  } else if (error.name === 'UnauthorizedError') {
    statusCode = 401
    message = 'Unauthorized'
  } else if (error.name === 'JsonWebTokenError') {
    statusCode = 401
    message = 'Invalid token'
  } else if (error.name === 'TokenExpiredError') {
    statusCode = 401
    message = 'Token expired'
  } else if (error.name === 'CastError') {
    statusCode = 400
    message = 'Invalid ID format'
  } else if (error.code === '11000') {
    statusCode = 409
    message = 'Duplicate field value'
  } else if (error.name === 'PrismaClientKnownRequestError') {
    // Handle Prisma errors
    if (error.code === 'P2002') {
      statusCode = 409
      message = 'Unique constraint violation'
    } else if (error.code === 'P2025') {
      statusCode = 404
      message = 'Record not found'
    }
  }
  
  // Don't leak error details in production
  const response: any = {
    error: {
      message,
      statusCode,
      timestamp: new Date().toISOString(),
      path: req.url,
      method: req.method
    }
  }
  
  // Include stack trace in development
  if (process.env.NODE_ENV === 'development') {
    response.error.stack = error.stack
    response.error.details = error.details
  }
  
  res.status(statusCode).json(response)
}

// Custom error classes
export class ApiError extends Error {
  statusCode: number
  code?: string
  details?: any
  
  constructor(message: string, statusCode: number = 500, code?: string, details?: any) {
    super(message)
    this.name = this.constructor.name
    this.statusCode = statusCode
    this.code = code
    this.details = details
    
    Error.captureStackTrace(this, this.constructor)
  }
}

export class ValidationError extends ApiError {
  constructor(message: string, details?: any) {
    super(message, 400, 'VALIDATION_ERROR', details)
  }
}

export class NotFoundError extends ApiError {
  constructor(message: string = 'Resource not found') {
    super(message, 404, 'NOT_FOUND')
  }
}

export class UnauthorizedError extends ApiError {
  constructor(message: string = 'Unauthorized') {
    super(message, 401, 'UNAUTHORIZED')
  }
}

export class ForbiddenError extends ApiError {
  constructor(message: string = 'Forbidden') {
    super(message, 403, 'FORBIDDEN')
  }
}

export class ConflictError extends ApiError {
  constructor(message: string = 'Conflict') {
    super(message, 409, 'CONFLICT')
  }
}