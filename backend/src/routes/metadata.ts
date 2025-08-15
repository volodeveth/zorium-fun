import { Router } from 'express'
import { param } from 'express-validator'
import { validateRequest } from '../middleware/validation'
import { logger } from '../utils/logger'

const router = Router()

// Store for mock metadata (in production should use database)
const mockMetadataStore = new Map<string, any>()
const mockImageStore = new Map<string, Buffer>()

// Store mock metadata
export function storeMockMetadata(hash: string, metadata: any) {
  if (Buffer.isBuffer(metadata)) {
    mockImageStore.set(hash, metadata)
    logger.info(`Stored mock image for hash: ${hash}`)
  } else {
    mockMetadataStore.set(hash, metadata)
    logger.info(`Stored mock metadata for hash: ${hash}`)
  }
}

// Get metadata by IPFS hash (for mock URIs)
router.get('/ipfs/:hash', 
  [
    param('hash')
      .notEmpty()
      .isLength({ min: 32, max: 64 })
      .matches(/^[a-fA-F0-9]+$/)
      .withMessage('Valid IPFS hash is required')
  ],
  validateRequest,
  (req, res) => {
    try {
      const { hash } = req.params
      
      // Check if it's a mock image hash
      const imageBuffer = mockImageStore.get(hash)
      if (imageBuffer) {
        logger.info(`Serving mock image for hash: ${hash}`)
        res.setHeader('Content-Type', 'image/jpeg') // Default to JPEG
        return res.send(imageBuffer)
      }
      
      // Check if it's a mock metadata hash
      const metadata = mockMetadataStore.get(hash)
      if (metadata) {
        logger.info(`Serving mock metadata for hash: ${hash}`)
        return res.json(metadata)
      }
      
      // If not found in mock store, return 404
      res.status(404).json({
        error: 'Metadata not found',
        message: `No metadata found for hash: ${hash}`,
        timestamp: new Date().toISOString()
      })
      
    } catch (error) {
      logger.error('Error serving metadata:', error)
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to retrieve metadata',
        timestamp: new Date().toISOString()
      })
    }
  }
)

export default router