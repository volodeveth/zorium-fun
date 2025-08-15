import { Request, Response, NextFunction } from 'express'
import { writeFile, mkdir } from 'fs/promises'
import { existsSync } from 'fs'
import path from 'path'
import crypto from 'crypto'
import { logger } from '../utils/logger'
import { ipfsService, IPFSUploadResult, NFTMetadata } from '../services/ipfsService'

class UploadController {
  private uploadDir: string

  constructor() {
    this.uploadDir = process.env.UPLOAD_PATH || './uploads'
    this.ensureUploadDir()
  }

  private async ensureUploadDir() {
    if (!existsSync(this.uploadDir)) {
      try {
        await mkdir(this.uploadDir, { recursive: true })
        logger.info(`Created upload directory: ${this.uploadDir}`)
      } catch (error) {
        logger.error('Failed to create upload directory:', error)
      }
    }
  }

  async uploadFile(req: Request, res: Response, next: NextFunction) {
    try {
      const { file, name = 'file', type = 'image', useIPFS = true } = req.body
      const userId = req.user?.id

      if (!userId) {
        return res.status(401).json({
          error: 'Authentication required',
          message: 'User must be authenticated to upload files'
        })
      }

      // Validate base64 data
      if (!file || typeof file !== 'string') {
        return res.status(400).json({
          error: 'Invalid file data',
          message: 'File must be provided as base64 string'
        })
      }

      // Extract base64 data and mime type
      let base64Data: string
      let mimeType: string = 'application/octet-stream'
      
      if (file.startsWith('data:')) {
        // Handle data URL format
        const matches = file.match(/^data:([^;]+);base64,(.+)$/)
        if (!matches) {
          return res.status(400).json({
            error: 'Invalid file format',
            message: 'File must be in base64 or data URL format'
          })
        }
        mimeType = matches[1]
        base64Data = matches[2]
      } else {
        // Assume raw base64
        base64Data = file
      }

      // Validate file size (max 10MB as configured in express)
      const buffer = Buffer.from(base64Data, 'base64')
      const maxSize = parseInt(process.env.MAX_FILE_SIZE || '10485760') // 10MB
      
      if (buffer.length > maxSize) {
        return res.status(413).json({
          error: 'File too large',
          message: `File size exceeds maximum allowed size of ${maxSize} bytes`
        })
      }

      // Generate unique filename
      const fileHash = crypto.createHash('sha256').update(buffer).digest('hex').substring(0, 16)
      const timestamp = Date.now()
      const extension = this.getExtensionFromMimeType(mimeType)
      const filename = `${userId}_${timestamp}_${fileHash}${extension}`

      // Try IPFS upload first if configured and requested
      if (useIPFS && ipfsService.isConfigured()) {
        try {
          const ipfsResult = await ipfsService.uploadFile(buffer, filename, mimeType)
          
          logger.info(`File uploaded to IPFS: ${ipfsResult.uri}`)
          
          return res.status(201).json({
            success: true,
            file: {
              filename: ipfsResult.name,
              originalName: name,
              size: ipfsResult.size,
              mimeType,
              type,
              url: ipfsService.ipfsToHttp(ipfsResult.uri),
              ipfsUri: ipfsResult.uri,
              ipfsHash: ipfsResult.hash,
              storage: 'ipfs'
            },
            message: 'File uploaded to IPFS successfully'
          })
        } catch (ipfsError) {
          logger.warn('IPFS upload failed, falling back to local storage:', ipfsError)
          // Continue with local storage as fallback
        }
      }

      // Fallback to local storage
      const userDir = path.join(this.uploadDir, userId)
      if (!existsSync(userDir)) {
        await mkdir(userDir, { recursive: true })
      }

      const filePath = path.join(userDir, filename)
      await writeFile(filePath, buffer)

      logger.info(`File uploaded locally: ${filePath}`)

      const fileUrl = `/uploads/${userId}/${filename}`
      
      res.status(201).json({
        success: true,
        file: {
          filename,
          originalName: name,
          size: buffer.length,
          mimeType,
          type,
          url: fileUrl,
          path: filePath,
          storage: 'local'
        },
        message: 'File uploaded successfully'
      })

    } catch (error) {
      logger.error('File upload error:', error)
      next(error)
    }
  }

  async uploadNFTMetadata(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id
      
      // Check authentication first
      if (!userId) {
        return res.status(401).json({
          error: 'Authentication required',
          message: 'User must be authenticated to upload NFT metadata'
        })
      }
      
      logger.info('uploadNFTMetadata called:', { 
        hasName: !!req.body.name,
        name: req.body.name,
        hasDescription: !!req.body.description,
        description: req.body.description?.substring(0, 100),
        hasImageFile: !!req.body.imageFile,
        imageFileLength: req.body.imageFile?.length,
        hasCreatorAddress: !!req.body.creatorAddress,
        creatorAddress: req.body.creatorAddress,
        userId,
        userAgent: req.get('User-Agent'),
        contentType: req.get('Content-Type'),
        origin: req.get('Origin')
      })
      
      const {
        name,
        description,
        imageFile,
        attributes = [],
        collection,
        external_url,
        creatorAddress
      } = req.body
      
      if (!creatorAddress) {
        logger.error('Creator address not provided in uploadNFTMetadata')
        return res.status(400).json({
          error: 'Creator address required',
          message: 'Creator address must be provided for NFT metadata'
        })
      }

      // Validate required fields
      if (!name || !imageFile) {
        logger.error('Validation failed - missing required fields:', {
          hasName: !!name,
          name,
          hasImageFile: !!imageFile,
          imageFileType: typeof imageFile,
          bodyKeys: Object.keys(req.body)
        })
        return res.status(400).json({
          error: 'Missing required fields',
          message: 'Name and image are required',
          details: {
            hasName: !!name,
            hasImageFile: !!imageFile
          }
        })
      }

      // Validate image file
      if (!imageFile || typeof imageFile !== 'string') {
        return res.status(400).json({
          error: 'Invalid image data',
          message: 'Image must be provided as base64 string'
        })
      }

      // Extract image data
      let base64Data: string
      let mimeType: string = 'application/octet-stream'
      
      if (imageFile.startsWith('data:')) {
        const matches = imageFile.match(/^data:([^;]+);base64,(.+)$/)
        if (!matches) {
          return res.status(400).json({
            error: 'Invalid image format',
            message: 'Image must be in base64 or data URL format'
          })
        }
        mimeType = matches[1]
        base64Data = matches[2]
      } else {
        base64Data = imageFile
      }

      // Validate image type
      if (!mimeType.startsWith('image/')) {
        return res.status(400).json({
          error: 'Invalid file type',
          message: 'Only image files are allowed for NFT metadata'
        })
      }

      const imageBuffer = Buffer.from(base64Data, 'base64')
      const fileHash = crypto.createHash('sha256').update(imageBuffer).digest('hex').substring(0, 16)
      const timestamp = Date.now()
      const extension = this.getExtensionFromMimeType(mimeType)
      const filename = `nft_${creatorAddress}_${timestamp}_${fileHash}${extension}`

      // Verify IPFS is configured
      if (!ipfsService.isConfigured()) {
        logger.error('IPFS not configured properly')
        logger.info('Available environment variables:', {
          hasPinataJWT: !!process.env.PINATA_JWT,
          hasPinataApiKey: !!process.env.PINATA_API_KEY,
          hasPinataSecret: !!process.env.PINATA_SECRET_KEY
        })
        return res.status(503).json({
          error: 'Service Unavailable',
          message: 'IPFS service is not configured. Please contact support.',
          timestamp: new Date().toISOString()
        })
      }

      // Upload to IPFS with additional error handling
      let result
      try {
        logger.info('Attempting to upload NFT metadata to IPFS', {
          name,
          imageSize: imageBuffer.length,
          creator: creatorAddress
        })
        
        result = await ipfsService.createNFTMetadata({
          name,
          description: description || '',
          imageBuffer,
          imageFilename: filename,
          imageMimeType: mimeType,
          creator: creatorAddress,
          attributes: attributes && attributes.length > 0 ? attributes : undefined,
          collection,
          external_url
        })
      } catch (ipfsError) {
        logger.error('IPFS upload failed:', ipfsError)
        
        return res.status(503).json({
          error: 'Service Unavailable',
          message: 'IPFS upload failed. Please try again later.',
          details: ipfsError instanceof Error ? ipfsError.message : 'Unknown IPFS error',
          timestamp: new Date().toISOString()
        })
      }

      logger.info(`NFT metadata uploaded: ${result.metadataURI}`)

      res.status(201).json({
        success: true,
        metadata: {
          name,
          description,
          creator: creatorAddress,
          imageURI: result.imageURI,
          metadataURI: result.metadataURI,
          imageUrl: ipfsService.ipfsToHttp(result.imageURI),
          metadataUrl: ipfsService.ipfsToHttp(result.metadataURI),
          attributes,
          collection,
          external_url
        },
        message: 'NFT metadata uploaded to IPFS successfully'
      })

    } catch (error) {
      logger.error('NFT metadata upload error:', error)
      
      // Check if this is a validation error that should return 400
      if (error instanceof Error && error.message.includes('validation')) {
        return res.status(400).json({
          error: 'Validation Error',
          message: error.message,
          timestamp: new Date().toISOString()
        })
      }
      
      // IPFS errors are now handled by fallback in the try block above
      
      // Use the error handler middleware instead
      next(error)
    }
  }

  private getExtensionFromMimeType(mimeType: string): string {
    const mimeToExt: { [key: string]: string } = {
      'image/jpeg': '.jpg',
      'image/jpg': '.jpg',
      'image/png': '.png',
      'image/gif': '.gif',
      'image/webp': '.webp',
      'image/svg+xml': '.svg',
      'video/mp4': '.mp4',
      'video/webm': '.webm',
      'video/ogg': '.ogv',
      'audio/mp3': '.mp3',
      'audio/wav': '.wav',
      'audio/ogg': '.ogg',
      'application/pdf': '.pdf',
      'text/plain': '.txt'
    }

    return mimeToExt[mimeType] || '.bin'
  }
}

const controller = new UploadController()

export const uploadController = {
  uploadFile: controller.uploadFile.bind(controller),
  uploadNFTMetadata: controller.uploadNFTMetadata.bind(controller)
}