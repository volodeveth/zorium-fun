import express from 'express';
import { body, param, query, validationResult } from 'express-validator';
import { optionalAuth, authenticateToken } from '../middleware/auth';
import { validateRequest, validatePagination } from '../middleware/validation';
import { collectionController } from '../controllers/collectionController';

const router = express.Router();

// ==============================================
// VALIDATION MIDDLEWARE (Updated for v2.0)
// ==============================================

const createCollectionValidation = [
  body('name')
    .isLength({ min: 1, max: 100 })
    .withMessage('Collection name must be 1-100 characters'),
  body('symbol')
    .isLength({ min: 1, max: 10 })
    .withMessage('Collection symbol must be 1-10 characters'),
  body('description')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Description must be max 1000 characters'),
  body('chainId')
    .isInt({ min: 1 })
    .withMessage('Chain ID must be a positive integer'),
  body('isPersonal')
    .optional()
    .isBoolean()
    .withMessage('isPersonal must be a boolean')
];

const createPersonalCollectionValidation = [
  body('nftName')
    .isLength({ min: 1, max: 100 })
    .withMessage('NFT name must be 1-100 characters'),
  body('tokenURI')
    .isURL()
    .withMessage('Token URI must be a valid URL')
    .matches(/^ipfs:\/\//)
    .withMessage('Token URI must be an IPFS URL'),
  body('chainId')
    .isInt({ min: 1 })
    .withMessage('Chain ID must be a positive integer'),
  body('customPrice')
    .optional()
    .isNumeric()
    .withMessage('Custom price must be numeric'),
  body('mintEndTime')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Mint end time must be a valid timestamp')
];

const addressValidation = [
  param('address')
    .isEthereumAddress()
    .withMessage('Invalid Ethereum address')
];

const collectionValidation = [
  param('contractAddress')
    .isEthereumAddress()
    .withMessage('Invalid collection address')
];

// ==============================================
// ROUTES (Updated for Factory + Collection v2.0)
// ==============================================

/**
 * @route POST /api/collections/create
 * @desc Create a new collection via factory
 * @access Private
 */
router.post('/create', 
  authenticateToken, 
  createCollectionValidation,
  validateRequest,
  collectionController.createCollection
);

/**
 * @route POST /api/collections/create-personal
 * @desc Create a personal collection with first NFT
 * @access Private
 */
router.post('/create-personal',
  authenticateToken,
  createPersonalCollectionValidation,
  validateRequest,
  collectionController.createPersonalCollection
);

/**
 * @route GET /api/collections/user/:address
 * @desc Get collections created by a user
 * @access Public
 */
router.get('/user/:address',
  optionalAuth,
  addressValidation,
  validateRequest,
  collectionController.getCollectionsByCreator
);

/**
 * @route GET /api/collections/:contractAddress
 * @desc Get collection details by contract address
 * @access Public
 */
router.get('/contract/:contractAddress',
  optionalAuth,
  collectionValidation,
  validateRequest,
  collectionController.getCollectionByAddress
);

/**
 * @route PUT /api/collections/:contractAddress
 * @desc Update collection metadata
 * @access Private (only creator)
 */
router.put('/contract/:contractAddress',
  authenticateToken,
  collectionValidation,
  [
    body('description')
      .optional()
      .isLength({ max: 1000 })
      .withMessage('Description must be max 1000 characters')
  ],
  validateRequest,
  collectionController.updateCollection
);

/**
 * @route GET /api/collections
 * @desc Get all collections with filters
 * @access Public
 */
router.get('/',
  optionalAuth,
  [
    query('chainId').optional().isInt({ min: 1 }),
    query('creator').optional().isEthereumAddress(),
    query('isPersonal').optional().isBoolean(),
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('sort').optional().isIn(['newest', 'oldest', 'name', 'activity'])
  ],
  validateRequest,
  collectionController.getCollections
);

// ==============================================
// LEGACY ROUTES (Backward compatibility)
// ==============================================

/**
 * @route GET /api/collections/:id
 * @desc Get collection by UUID (legacy)
 * @access Public
 */
router.get('/:id',
  optionalAuth,
  [
    param('id')
      .isLength({ min: 1, max: 50 })
      .withMessage('Invalid collection ID')
  ],
  validateRequest,
  collectionController.getCollectionById
);

/**
 * @route PUT /api/collections/:id
 * @desc Update collection by UUID (legacy)
 * @access Private
 */
router.put('/:id',
  authenticateToken,
  [
    param('id')
      .isLength({ min: 1, max: 50 })
      .withMessage('Invalid collection ID')
  ],
  validateRequest,
  collectionController.updateCollectionById
);

/**
 * @route GET /api/collections/:id/nfts
 * @desc Get collection NFTs by UUID (legacy)
 * @access Public
 */
router.get('/:id/nfts',
  optionalAuth,
  validatePagination,
  [
    param('id')
      .isLength({ min: 1, max: 50 })
      .withMessage('Invalid collection ID')
  ],
  validateRequest,
  collectionController.getCollectionNFTs
);

// ==============================================
// BLOCKCHAIN SYNC ROUTES (v2.0)
// ==============================================

/**
 * @route POST /api/collections/sync/:address
 * @desc Sync collections from blockchain for creator
 * @access Public
 */
router.post('/sync/:address',
  optionalAuth,
  addressValidation,
  [
    query('chainId')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Chain ID must be positive integer')
  ],
  validateRequest,
  collectionController.syncCollectionsFromBlockchain
);

/**
 * @route GET /api/collections/validate/:contractAddress
 * @desc Validate collection exists on blockchain
 * @access Public
 */
router.get('/validate/:contractAddress',
  optionalAuth,
  collectionValidation,
  [
    query('chainId')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Chain ID must be positive integer')
  ],
  validateRequest,
  collectionController.validateCollection
);

/**
 * @route GET /api/collections/blockchain/stats
 * @desc Get blockchain statistics
 * @access Public
 */
router.get('/blockchain/stats',
  optionalAuth,
  [
    query('chainId')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Chain ID must be positive integer')
  ],
  validateRequest,
  collectionController.getBlockchainStats
);

export default router;