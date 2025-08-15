import { Router } from 'express'
import { body } from 'express-validator'
import { uploadController } from '../controllers/uploadController'
import { authenticateToken } from '../middleware/auth'
import { validateRequest } from '../middleware/validation'
import { rateLimiter } from '../middleware/rateLimiter'
import { ipfsService } from '../services/ipfsService'
import { logger } from '../utils/logger'

const router = Router()

// Health check endpoint for upload service
router.get('/health', (req, res) => {
  const ipfsConfigured = !!(process.env.PINATA_JWT || (process.env.PINATA_API_KEY && process.env.PINATA_SECRET_KEY))
  
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    ipfs: {
      configured: ipfsConfigured,
      hasJWT: !!process.env.PINATA_JWT,
      hasApiKeys: !!(process.env.PINATA_API_KEY && process.env.PINATA_SECRET_KEY),
      gateway: process.env.IPFS_GATEWAY || 'https://ipfs.io/ipfs/'
    },
    uploadPath: process.env.UPLOAD_PATH || './uploads'
  })
})

// Upload file endpoint (expects base64 data from frontend)
router.post('/',
  authenticateToken,
  rateLimiter,
  [
    body('file')
      .notEmpty()
      .withMessage('File data is required'),
    body('name')
      .optional()
      .isLength({ min: 1, max: 255 })
      .withMessage('File name must be between 1 and 255 characters'),
    body('type')
      .optional()
      .isIn(['image', 'video', 'audio', 'document'])
      .withMessage('File type must be image, video, audio, or document'),
    body('useIPFS')
      .optional()
      .isBoolean()
      .withMessage('useIPFS must be a boolean value')
  ],
  validateRequest,
  uploadController.uploadFile
)

// Upload NFT metadata with image to IPFS
router.post('/nft-metadata',
  authenticateToken,
  rateLimiter,
  [
    body('name')
      .notEmpty()
      .isLength({ min: 1, max: 255 })
      .withMessage('NFT name is required and must be between 1 and 255 characters'),
    body('description')
      .optional()
      .isLength({ max: 2000 })
      .withMessage('NFT description must be less than 2000 characters'),
    body('imageFile')
      .notEmpty()
      .withMessage('NFT image is required'),
    body('attributes')
      .optional()
      .isArray()
      .withMessage('Attributes must be an array'),
    body('attributes.*.trait_type')
      .optional()
      .notEmpty()
      .withMessage('Attribute trait_type is required'),
    body('attributes.*.value')
      .optional()
      .notEmpty()
      .withMessage('Attribute value is required'),
    body('collection')
      .optional()
      .isLength({ min: 1, max: 255 })
      .withMessage('Collection name must be between 1 and 255 characters'),
    body('external_url')
      .optional()
      .isURL()
      .withMessage('External URL must be a valid URL'),
    body('creatorAddress')
      .notEmpty()
      .matches(/^0x[a-fA-F0-9]{40}$/)
      .withMessage('Valid creator Ethereum address is required')
  ],
  validateRequest,
  uploadController.uploadNFTMetadata
)


export default router