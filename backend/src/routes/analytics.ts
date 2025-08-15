import { Router } from 'express'
import { query } from 'express-validator'
import { analyticsController } from '../controllers/analyticsController'
import { authenticateToken, requirePlatformOwner } from '../middleware/auth'
import { validateRequest } from '../middleware/validation'

const router = Router()

// Get platform statistics (public)
router.get('/stats',
  analyticsController.getPlatformStats
)

// Get Early Bird statistics (public)
router.get('/early-bird-stats',
  analyticsController.getEarlyBirdStats
)

// Get platform overview (admin only)
router.get('/overview',
  authenticateToken,
  requirePlatformOwner,
  analyticsController.getPlatformOverview
)

// Get revenue analytics (admin only)
router.get('/revenue',
  authenticateToken,
  requirePlatformOwner,
  [
    query('period')
      .optional()
      .isIn(['7d', '30d', '90d', '1y'])
      .withMessage('Period must be 7d, 30d, 90d, or 1y'),
    query('granularity')
      .optional()
      .isIn(['hour', 'day', 'week', 'month'])
      .withMessage('Granularity must be hour, day, week, or month')
  ],
  validateRequest,
  analyticsController.getRevenueAnalytics
)

// Get user analytics (admin only)
router.get('/users',
  authenticateToken,
  requirePlatformOwner,
  [
    query('period')
      .optional()
      .isIn(['7d', '30d', '90d', '1y'])
      .withMessage('Period must be 7d, 30d, 90d, or 1y')
  ],
  validateRequest,
  analyticsController.getUserAnalytics
)

// Get NFT analytics (admin only)
router.get('/nfts',
  authenticateToken,
  requirePlatformOwner,
  [
    query('period')
      .optional()
      .isIn(['7d', '30d', '90d', '1y'])
      .withMessage('Period must be 7d, 30d, 90d, or 1y')
  ],
  validateRequest,
  analyticsController.getNFTAnalytics
)

// Get transaction analytics (admin only)
router.get('/transactions',
  authenticateToken,
  requirePlatformOwner,
  [
    query('period')
      .optional()
      .isIn(['7d', '30d', '90d', '1y'])
      .withMessage('Period must be 7d, 30d, 90d, or 1y'),
    query('type')
      .optional()
      .isIn(['MINT', 'TRANSFER', 'SALE', 'PROMOTION'])
      .withMessage('Invalid transaction type')
  ],
  validateRequest,
  analyticsController.getTransactionAnalytics
)

// Get ZRM analytics (admin only)
router.get('/zrm',
  authenticateToken,
  requirePlatformOwner,
  [
    query('period')
      .optional()
      .isIn(['7d', '30d', '90d', '1y'])
      .withMessage('Period must be 7d, 30d, 90d, or 1y')
  ],
  validateRequest,
  analyticsController.getZRMAnalytics
)

// Get promotion analytics (admin only)
router.get('/promotions',
  authenticateToken,
  requirePlatformOwner,
  [
    query('period')
      .optional()
      .isIn(['7d', '30d', '90d', '1y'])
      .withMessage('Period must be 7d, 30d, 90d, or 1y')
  ],
  validateRequest,
  analyticsController.getPromotionAnalytics
)

// Get top performers
router.get('/top-performers',
  authenticateToken,
  requirePlatformOwner,
  [
    query('type')
      .isIn(['creators', 'collectors', 'nfts'])
      .withMessage('Type must be creators, collectors, or nfts'),
    query('metric')
      .isIn(['revenue', 'volume', 'count'])
      .withMessage('Metric must be revenue, volume, or count'),
    query('period')
      .optional()
      .isIn(['7d', '30d', '90d', '1y'])
      .withMessage('Period must be 7d, 30d, 90d, or 1y'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be between 1 and 100')
  ],
  validateRequest,
  analyticsController.getTopPerformers
)

// Export analytics data (admin only)
router.get('/export',
  authenticateToken,
  requirePlatformOwner,
  [
    query('type')
      .isIn(['users', 'nfts', 'transactions', 'revenue'])
      .withMessage('Export type must be users, nfts, transactions, or revenue'),
    query('format')
      .optional()
      .isIn(['csv', 'json'])
      .withMessage('Format must be csv or json'),
    query('startDate')
      .optional()
      .isISO8601()
      .withMessage('Invalid start date format'),
    query('endDate')
      .optional()
      .isISO8601()
      .withMessage('Invalid end date format')
  ],
  validateRequest,
  analyticsController.exportAnalytics
)

export default router