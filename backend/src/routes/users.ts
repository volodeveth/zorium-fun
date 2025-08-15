import { Router } from 'express'
import { body, param, query } from 'express-validator'
import { userController } from '../controllers/user'
import { authenticateToken, optionalAuth } from '../middleware/auth'
import { validateRequest } from '../middleware/validation'
import { rateLimiter } from '../middleware/rateLimiter'

const router = Router()

// Early Bird bonus endpoint (must be before parameterized routes)
router.post('/early-bird-bonus',
  rateLimiter, // Apply rate limiting
  [
    body('address')
      .isEthereumAddress()
      .withMessage('Invalid Ethereum address'),
    body('transactionHash')
      .isLength({ min: 66, max: 66 })
      .withMessage('Invalid transaction hash'),
    body('amount')
      .isInt({ min: 1000, max: 15000 })
      .withMessage('Amount must be between 1000 and 15000')
  ],
  validateRequest,
  userController.claimEarlyBirdBonus
)

// Get user by address
router.get('/:address',
  optionalAuth,
  [
    param('address')
      .isEthereumAddress()
      .withMessage('Invalid Ethereum address')
  ],
  validateRequest,
  userController.getUserByAddress
)

// Update user profile
router.put('/:address',
  authenticateToken,
  [
    param('address')
      .isEthereumAddress()
      .withMessage('Invalid Ethereum address'),
    body('displayName')
      .optional()
      .isLength({ max: 50 })
      .withMessage('Display name must be less than 50 characters'),
    body('bio')
      .optional()
      .isLength({ max: 500 })
      .withMessage('Bio must be less than 500 characters'),
    body('website')
      .optional()
      .isURL()
      .withMessage('Invalid website URL'),
    body('avatar')
      .optional()
      .isURL()
      .withMessage('Invalid avatar URL'),
    body('banner')
      .optional()
      .isURL()
      .withMessage('Invalid banner URL')
  ],
  validateRequest,
  userController.updateProfile
)

// Get user's NFTs
router.get('/:address/nfts',
  optionalAuth,
  [
    param('address')
      .isEthereumAddress()
      .withMessage('Invalid Ethereum address'),
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Page must be a positive integer'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be between 1 and 100'),
    query('type')
      .optional()
      .isIn(['created', 'owned', 'liked'])
      .withMessage('Type must be created, owned, or liked')
  ],
  validateRequest,
  userController.getUserNFTs
)

// Get user's collections
router.get('/:address/collections',
  optionalAuth,
  [
    param('address')
      .isEthereumAddress()
      .withMessage('Invalid Ethereum address'),
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Page must be a positive integer'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be between 1 and 100')
  ],
  validateRequest,
  userController.getUserCollections
)

// Follow/unfollow user
router.post('/:address/follow',
  authenticateToken,
  [
    param('address')
      .isEthereumAddress()
      .withMessage('Invalid Ethereum address')
  ],
  validateRequest,
  userController.toggleFollow
)

// Get user's followers
router.get('/:address/followers',
  optionalAuth,
  [
    param('address')
      .isEthereumAddress()
      .withMessage('Invalid Ethereum address'),
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Page must be a positive integer'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be between 1 and 100')
  ],
  validateRequest,
  userController.getFollowers
)

// Get users following
router.get('/:address/following',
  optionalAuth,
  [
    param('address')
      .isEthereumAddress()
      .withMessage('Invalid Ethereum address'),
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Page must be a positive integer'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be between 1 and 100')
  ],
  validateRequest,
  userController.getFollowing
)

// Get user's activity feed
router.get('/:address/activity',
  optionalAuth,
  [
    param('address')
      .isEthereumAddress()
      .withMessage('Invalid Ethereum address'),
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Page must be a positive integer'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 50 })
      .withMessage('Limit must be between 1 and 50'),
    query('type')
      .optional()
      .isIn(['mint', 'transfer', 'sale', 'like', 'follow'])
      .withMessage('Invalid activity type')
  ],
  validateRequest,
  userController.getUserActivity
)

// Get user stats
router.get('/:address/stats',
  [
    param('address')
      .isEthereumAddress()
      .withMessage('Invalid Ethereum address')
  ],
  validateRequest,
  userController.getUserStats
)

// Update ZRM balance (admin only)
router.post('/:address/zrm',
  authenticateToken,
  [
    param('address')
      .isEthereumAddress()
      .withMessage('Invalid Ethereum address'),
    body('amount')
      .isDecimal()
      .withMessage('Amount must be a valid decimal'),
    body('type')
      .isIn(['add', 'subtract', 'set'])
      .withMessage('Type must be add, subtract, or set'),
    body('reason')
      .notEmpty()
      .withMessage('Reason is required')
  ],
  validateRequest,
  userController.updateZRMBalance
)


// Search users
router.get('/',
  [
    query('q')
      .isLength({ min: 1, max: 100 })
      .withMessage('Search query must be 1-100 characters'),
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Page must be a positive integer'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 50 })
      .withMessage('Limit must be between 1 and 50')
  ],
  validateRequest,
  userController.searchUsers
)

// ZRM Balance endpoint (for /api/zrm/balance/:address)
router.get('/balance/:address',
  [
    param('address')
      .isEthereumAddress()
      .withMessage('Invalid Ethereum address')
  ],
  validateRequest,
  userController.getZrmBalance
)

// Get user's ZRM balance from blockchain (verified)
router.get('/:address/zrm-balance',
  [
    param('address')
      .isEthereumAddress()
      .withMessage('Invalid Ethereum address')
  ],
  validateRequest,
  userController.getZrmBalance
)


export default router