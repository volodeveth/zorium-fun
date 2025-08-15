import axios from 'axios'
import FormData from 'form-data'
import { logger } from '../utils/logger'

interface IPFSUploadResult {
  hash: string
  name: string
  size: number
  uri: string
}

interface PinataResponse {
  IpfsHash: string
  PinSize: number
  Timestamp: string
}

interface NFTMetadata {
  name: string
  description: string
  image: string
  animation_url?: string
  external_url?: string
  attributes?: Array<{
    trait_type: string
    value: string | number
  }>
  // Custom properties (not part of ERC-721 standard but commonly used)
  creator?: string
  collection?: string
}

class IPFSService {
  private pinataJWT: string
  private pinataApiKey: string
  private pinataSecretKey: string
  private ipfsGateway: string

  constructor() {
    this.pinataJWT = process.env.PINATA_JWT || ''
    this.pinataApiKey = process.env.PINATA_API_KEY || ''
    this.pinataSecretKey = process.env.PINATA_SECRET_KEY || ''
    this.ipfsGateway = process.env.IPFS_GATEWAY || 'https://gateway.pinata.cloud/ipfs/'

    if (!this.pinataJWT && (!this.pinataApiKey || !this.pinataSecretKey)) {
      logger.warn('IPFS Service: Pinata credentials not configured. Files will be stored locally.')
    }
  }

  /**
   * Upload file buffer to IPFS via Pinata
   */
  async uploadFile(buffer: Buffer, filename: string, mimeType: string): Promise<IPFSUploadResult> {
    if (!this.pinataJWT && (!this.pinataApiKey || !this.pinataSecretKey)) {
      throw new Error('IPFS credentials not configured')
    }

    try {
      const formData = new FormData()
      formData.append('file', buffer, {
        filename,
        contentType: mimeType
      })

      const metadata = JSON.stringify({
        name: filename,
        keyvalues: {
          uploadedBy: 'zorium-platform',
          timestamp: new Date().toISOString(),
          mimeType
        }
      })
      formData.append('pinataMetadata', metadata)

      const options = JSON.stringify({
        cidVersion: 1
      })
      formData.append('pinataOptions', options)

      const headers: any = {
        ...formData.getHeaders()
      }

      // Use JWT if available, otherwise fall back to API keys
      if (this.pinataJWT) {
        headers['Authorization'] = `Bearer ${this.pinataJWT}`
      } else {
        headers['pinata_api_key'] = this.pinataApiKey
        headers['pinata_secret_api_key'] = this.pinataSecretKey
      }

      const response = await axios.post<PinataResponse>(
        'https://api.pinata.cloud/pinning/pinFileToIPFS',
        formData,
        {
          headers,
          maxContentLength: Infinity,
          maxBodyLength: Infinity
        }
      )

      const result: IPFSUploadResult = {
        hash: response.data.IpfsHash,
        name: filename,
        size: response.data.PinSize,
        uri: `ipfs://${response.data.IpfsHash}`
      }

      logger.info(`File uploaded to IPFS: ${result.uri}`)
      return result

    } catch (error) {
      logger.error('IPFS upload error:', error)
      throw new Error(`Failed to upload file to IPFS: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Upload JSON metadata to IPFS
   */
  async uploadMetadata(metadata: NFTMetadata): Promise<IPFSUploadResult> {
    if (!this.pinataJWT && (!this.pinataApiKey || !this.pinataSecretKey)) {
      throw new Error('IPFS credentials not configured')
    }

    try {
      const jsonString = JSON.stringify(metadata, null, 2)
      const buffer = Buffer.from(jsonString, 'utf-8')

      const formData = new FormData()
      formData.append('file', buffer, {
        filename: 'metadata.json',
        contentType: 'application/json'
      })

      const pinataMetadata = JSON.stringify({
        name: `NFT Metadata - ${metadata.name}`,
        keyvalues: {
          uploadedBy: 'zorium-platform',
          timestamp: new Date().toISOString(),
          type: 'nft-metadata',
          creator: metadata.creator
        }
      })
      formData.append('pinataMetadata', pinataMetadata)

      const options = JSON.stringify({
        cidVersion: 1
      })
      formData.append('pinataOptions', options)

      const headers: any = {
        ...formData.getHeaders()
      }

      // Use JWT if available, otherwise fall back to API keys
      if (this.pinataJWT) {
        headers['Authorization'] = `Bearer ${this.pinataJWT}`
      } else {
        headers['pinata_api_key'] = this.pinataApiKey
        headers['pinata_secret_api_key'] = this.pinataSecretKey
      }

      const response = await axios.post<PinataResponse>(
        'https://api.pinata.cloud/pinning/pinFileToIPFS',
        formData,
        {
          headers
        }
      )

      const result: IPFSUploadResult = {
        hash: response.data.IpfsHash,
        name: 'metadata.json',
        size: response.data.PinSize,
        uri: `ipfs://${response.data.IpfsHash}`
      }

      logger.info(`Metadata uploaded to IPFS: ${result.uri}`)
      return result

    } catch (error) {
      logger.error('IPFS metadata upload error:', error)
      throw new Error(`Failed to upload metadata to IPFS: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Create complete NFT metadata with IPFS image and upload to IPFS
   */
  async createNFTMetadata(params: {
    name: string
    description: string
    imageBuffer: Buffer
    imageFilename: string
    imageMimeType: string
    creator: string
    attributes?: Array<{ trait_type: string; value: string | number }>
    collection?: string
    external_url?: string
  }): Promise<{ imageURI: string; metadataURI: string }> {
    
    // First upload the image
    const imageResult = await this.uploadFile(
      params.imageBuffer,
      params.imageFilename,
      params.imageMimeType
    )

    // Create ERC-721 compliant metadata with IPFS image URI
    const metadata: NFTMetadata = {
      name: params.name,
      description: params.description,
      image: imageResult.uri,
      external_url: params.external_url,
      attributes: params.attributes,
      // Custom properties for platform features
      creator: params.creator,
      collection: params.collection
    }

    // Upload metadata
    const metadataResult = await this.uploadMetadata(metadata)

    return {
      imageURI: imageResult.uri,
      metadataURI: metadataResult.uri
    }
  }

  /**
   * Get IPFS content via HTTP gateway
   */
  async getIPFSContent(hash: string): Promise<any> {
    try {
      const response = await axios.get(`${this.ipfsGateway}${hash}`)
      return response.data
    } catch (error) {
      logger.error(`Failed to fetch IPFS content ${hash}:`, error)
      throw new Error(`Failed to fetch IPFS content: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Convert IPFS URI to HTTP URL
   */
  ipfsToHttp(ipfsUri: string): string {
    if (ipfsUri.startsWith('ipfs://')) {
      const hash = ipfsUri.replace('ipfs://', '')
      return `${this.ipfsGateway}${hash}`
    }
    return ipfsUri
  }

  /**
   * Validate IPFS URI format
   */
  isValidIPFSUri(uri: string): boolean {
    return uri.startsWith('ipfs://') && uri.length > 7
  }

  /**
   * Check if IPFS service is properly configured
   */
  isConfigured(): boolean {
    return !!(this.pinataJWT || (this.pinataApiKey && this.pinataSecretKey))
  }

  /**
   * Test IPFS connectivity
   */
  async testConnection(): Promise<boolean> {
    if (!this.isConfigured()) {
      return false
    }

    try {
      // Test with a simple metadata upload
      const testMetadata = {
        name: 'IPFS Test',
        description: 'Testing IPFS connection',
        image: 'ipfs://test',
        creator: 'system-test'
      }

      await this.uploadMetadata(testMetadata)
      return true
    } catch (error) {
      logger.error('IPFS connection test failed:', error)
      return false
    }
  }
}

export const ipfsService = new IPFSService()
export { IPFSUploadResult, NFTMetadata }