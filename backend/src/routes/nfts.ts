import { Router } from 'express'
import { body, param, query } from 'express-validator'
import { nftController } from '../controllers/nftController'
import { authenticateToken, optionalAuth } from '../middleware/auth'
import { validateRequest, validatePagination } from '../middleware/validation'

const router = Router()

// Get all NFTs with filters
router.get('/',
  optionalAuth,
  validatePagination,
  [
    query('chainId')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Chain ID must be a positive integer'),
    query('collection')
      .optional()
      .isEthereumAddress()
      .withMessage('Invalid collection address'),
    query('owner')
      .optional()
      .isEthereumAddress()
      .withMessage('Invalid owner address'),
    query('creator')
      .optional()
      .isEthereumAddress()
      .withMessage('Invalid creator address'),
    query('priceMin')
      .optional()
      .isDecimal()
      .withMessage('Invalid minimum price'),
    query('priceMax')
      .optional()
      .isDecimal()
      .withMessage('Invalid maximum price'),
    query('sortBy')
      .optional()
      .isIn(['createdAt', 'price', 'likeCount', 'viewCount'])
      .withMessage('Invalid sort field'),
    query('sortOrder')
      .optional()
      .isIn(['asc', 'desc'])
      .withMessage('Sort order must be asc or desc')
  ],
  validateRequest,
  nftController.getNFTs
)

// Get trending NFTs
router.get('/trending',
  optionalAuth,
  validatePagination,
  nftController.getTrendingNFTs
)

// Get NFT by ID
router.get('/:id',
  optionalAuth,
  [
    param('id')
      .isLength({ min: 1, max: 50 })
      .withMessage('Invalid NFT ID')
  ],
  validateRequest,
  nftController.getNFTById
)

// Create/mint new NFT
router.post('/',
  authenticateToken,
  [
    body('name')
      .isLength({ min: 1, max: 100 })
      .withMessage('Name must be 1-100 characters'),
    body('description')
      .optional()
      .isLength({ max: 1000 })
      .withMessage('Description must be less than 1000 characters'),
    body('image')
      .isURL()
      .withMessage('Invalid image URL'),
    body('animationUrl')
      .optional()
      .isURL()
      .withMessage('Invalid animation URL'),
    body('attributes')
      .optional()
      .isArray()
      .withMessage('Attributes must be an array'),
    body('tokenId')
      .notEmpty()
      .withMessage('Token ID is required'),
    body('contractAddress')
      .isEthereumAddress()
      .withMessage('Invalid contract address'),
    body('chainId')
      .isInt({ min: 1 })
      .withMessage('Invalid chain ID'),
    body('collectionId')
      .optional()
      .isLength({ min: 1, max: 50 })
      .withMessage('Invalid collection ID'),
    body('mintPrice')
      .optional()
      .isDecimal()
      .withMessage('Invalid mint price'),
    body('maxSupply')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Max supply must be positive')
  ],
  validateRequest,
  nftController.createNFT
)

// Update NFT
router.put('/:id',
  authenticateToken,
  [
    param('id')
      .isLength({ min: 1, max: 50 })
      .withMessage('Invalid NFT ID'),
    body('name')
      .optional()
      .isLength({ min: 1, max: 100 })
      .withMessage('Name must be 1-100 characters'),
    body('description')
      .optional()
      .isLength({ max: 1000 })
      .withMessage('Description must be less than 1000 characters'),
    body('externalUrl')
      .optional()
      .isURL()
      .withMessage('Invalid external URL')
  ],
  validateRequest,
  nftController.updateNFT
)

// List NFT for sale
router.post('/:id/list',
  authenticateToken,
  [
    param('id')
      .isLength({ min: 1, max: 50 })
      .withMessage('Invalid NFT ID'),
    body('price')
      .isDecimal({ decimal_digits: '0,18' })
      .withMessage('Invalid price'),
    body('currency')
      .isIn(['ETH', 'WETH', 'USDC'])
      .withMessage('Invalid currency')
  ],
  validateRequest,
  nftController.listNFT
)

// Delist NFT
router.post('/:id/delist',
  authenticateToken,
  [
    param('id')
      .isLength({ min: 1, max: 50 })
      .withMessage('Invalid NFT ID')
  ],
  validateRequest,
  nftController.delistNFT
)

// Buy NFT
router.post('/:id/buy',
  authenticateToken,
  [
    param('id')
      .isLength({ min: 1, max: 50 })
      .withMessage('Invalid NFT ID'),
    body('txHash')
      .isHexadecimal()
      .isLength({ min: 66, max: 66 })
      .withMessage('Invalid transaction hash')
  ],
  validateRequest,
  nftController.buyNFT
)

// Like/unlike NFT
router.post('/:id/like',
  authenticateToken,
  [
    param('id')
      .isLength({ min: 1, max: 50 })
      .withMessage('Invalid NFT ID')
  ],
  validateRequest,
  nftController.toggleLike
)

// Get NFT comments
router.get('/:id/comments',
  optionalAuth,
  validatePagination,
  [
    param('id')
      .isLength({ min: 1, max: 50 })
      .withMessage('Invalid NFT ID')
  ],
  validateRequest,
  nftController.getNFTComments
)

// Add comment to NFT
router.post('/:id/comments',
  authenticateToken,
  [
    param('id')
      .isLength({ min: 1, max: 50 })
      .withMessage('Invalid NFT ID'),
    body('content')
      .isLength({ min: 1, max: 1000 })
      .withMessage('Comment must be 1-1000 characters'),
    body('parentId')
      .optional()
      .isLength({ min: 1, max: 50 })
      .withMessage('Invalid parent comment ID')
  ],
  validateRequest,
  nftController.addComment
)

// Promote NFT
router.post('/:id/promote',
  authenticateToken,
  [
    param('id')
      .isLength({ min: 1, max: 50 })
      .withMessage('Invalid NFT ID'),
    body('duration')
      .isInt({ min: 1, max: 168 })
      .withMessage('Duration must be 1-168 hours'),
    body('cost')
      .isDecimal()
      .withMessage('Invalid cost amount')
  ],
  validateRequest,
  nftController.promoteNFT
)

// Get NFT analytics
router.get('/:id/analytics',
  authenticateToken,
  [
    param('id')
      .isLength({ min: 1, max: 50 })
      .withMessage('Invalid NFT ID')
  ],
  validateRequest,
  nftController.getNFTAnalytics
)

// Track NFT view
router.post('/:id/view',
  optionalAuth,
  [
    param('id')
      .isLength({ min: 1, max: 50 })
      .withMessage('Invalid NFT ID')
  ],
  validateRequest,
  nftController.trackView
)

// Mint NFT (alias for POST /)
router.post('/mint',
  authenticateToken,
  [
    body('name')
      .isLength({ min: 1, max: 100 })
      .withMessage('Name must be 1-100 characters'),
    body('description')
      .optional()
      .isLength({ max: 1000 })
      .withMessage('Description must be less than 1000 characters'),
    body('image')
      .notEmpty()
      .withMessage('Image is required'),
    body('tokenId')
      .notEmpty()
      .withMessage('Token ID is required'),
    body('contractAddress')
      .isEthereumAddress()
      .withMessage('Invalid contract address'),
    body('chainId')
      .isInt({ min: 1 })
      .withMessage('Chain ID must be a positive integer'),
    body('creatorAddress')
      .isEthereumAddress()
      .withMessage('Invalid creator address')
  ],
  validateRequest,
  nftController.createNFT
)

// ============ ERC-1155 TOKEN ROUTES (v2.0) ============

// Create token in existing collection
router.post('/tokens',
  authenticateToken,
  [
    body('collectionAddress')
      .isEthereumAddress()
      .withMessage('Invalid collection address'),
    body('chainId')
      .isInt({ min: 1 })
      .withMessage('Invalid chain ID'),
    body('name')
      .isLength({ min: 1, max: 100 })
      .withMessage('Name must be 1-100 characters'),
    body('description')
      .optional()
      .isLength({ max: 1000 })
      .withMessage('Description must be less than 1000 characters'),
    body('tokenURI')
      .matches(/^ipfs:\/\//)
      .withMessage('Token URI must be a valid IPFS URL'),
    body('customPrice')
      .optional()
      .isDecimal()
      .withMessage('Invalid custom price'),
    body('mintEndTime')
      .optional()
      .isInt({ min: 0 })
      .withMessage('Invalid mint end time'),
    body('attributes')
      .optional()
      .isArray()
      .withMessage('Attributes must be an array')
  ],
  validateRequest,
  nftController.createToken
)

// Get token by ID
router.get('/tokens/:id',
  optionalAuth,
  [
    param('id')
      .isLength({ min: 1, max: 50 })
      .withMessage('Invalid token ID')
  ],
  validateRequest,
  nftController.getTokenById
)

// Get token balance for user
router.get('/tokens/:collectionAddress/:tokenId/balance',
  optionalAuth,
  [
    param('collectionAddress')
      .isEthereumAddress()
      .withMessage('Invalid collection address'),
    param('tokenId')
      .isInt({ min: 0 })
      .withMessage('Invalid token ID'),
    query('address')
      .isEthereumAddress()
      .withMessage('Invalid user address')
  ],
  validateRequest,
  nftController.getTokenBalance
)

// Get token supply and minting status
router.get('/tokens/:collectionAddress/:tokenId/info',
  optionalAuth,
  [
    param('collectionAddress')
      .isEthereumAddress()
      .withMessage('Invalid collection address'),
    param('tokenId')
      .isInt({ min: 0 })
      .withMessage('Invalid token ID')
  ],
  validateRequest,
  nftController.getTokenSupplyInfo
)

// Calculate mint fees for token
router.get('/tokens/:collectionAddress/:tokenId/fees',
  optionalAuth,
  [
    param('collectionAddress')
      .isEthereumAddress()
      .withMessage('Invalid collection address'),
    param('tokenId')
      .isInt({ min: 0 })
      .withMessage('Invalid token ID'),
    query('hasReferrer')
      .optional()
      .isBoolean()
      .withMessage('hasReferrer must be boolean')
  ],
  validateRequest,
  nftController.calculateTokenMintFees
)

// Get accumulated fees for creator
router.get('/tokens/:collectionAddress/fees',
  authenticateToken,
  [
    param('collectionAddress')
      .isEthereumAddress()
      .withMessage('Invalid collection address')
  ],
  validateRequest,
  nftController.getCreatorFees
)

// Get all tokens in collection
router.get('/tokens/:collectionAddress',
  optionalAuth,
  validatePagination,
  [
    param('collectionAddress')
      .isEthereumAddress()
      .withMessage('Invalid collection address'),
    query('status')
      .optional()
      .isIn(['Created', 'FirstMinted', 'CountdownActive', 'Finalized'])
      .withMessage('Invalid status filter')
  ],
  validateRequest,
  nftController.getCollectionTokens
)

// Update token metadata (creator only)
router.put('/tokens/:id',
  authenticateToken,
  [
    param('id')
      .isLength({ min: 1, max: 50 })
      .withMessage('Invalid token ID'),
    body('description')
      .optional()
      .isLength({ max: 1000 })
      .withMessage('Description must be less than 1000 characters'),
    body('attributes')
      .optional()
      .isArray()
      .withMessage('Attributes must be an array')
  ],
  validateRequest,
  nftController.updateToken
)

export default router