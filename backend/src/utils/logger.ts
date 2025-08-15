import winston from 'winston'

const { combine, timestamp, errors, json, printf, colorize } = winston.format

// Custom format for console output
const consoleFormat = printf(({ level, message, timestamp, stack }) => {
  return `${timestamp} [${level}]: ${stack || message}`
})

// Create logger with different configs for different environments
const isProduction = process.env.NODE_ENV === 'production'
const isVercel = process.env.VERCEL === '1'

// Create logger instance
export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: combine(
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    errors({ stack: true }),
    isProduction ? json() : printf(({ timestamp, level, message, stack }) => {
      return `${timestamp} [${level}]: ${stack || message}`
    })
  ),
  defaultMeta: { service: 'zorium-backend' },
  transports: []
})

// Add transports based on environment
if (isProduction || isVercel) {
  // Production/Vercel: Only console logging (no file system operations)
  logger.add(new winston.transports.Console({
    format: combine(
      timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
      json()
    )
  }))
} else {
  // Development: File logging + colorized console
  const { mkdirSync } = require('fs')
  try {
    mkdirSync('logs', { recursive: true })
  } catch (error) {
    // Directory already exists or creation failed
  }

  logger.add(new winston.transports.File({ 
    filename: 'logs/error.log', 
    level: 'error',
    maxsize: 5242880, // 5MB
    maxFiles: 10
  }))
  
  logger.add(new winston.transports.File({ 
    filename: 'logs/combined.log',
    maxsize: 5242880, // 5MB
    maxFiles: 10
  }))

  logger.add(new winston.transports.Console({
    format: combine(
      colorize(),
      timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
      consoleFormat
    )
  }))
}

export default logger