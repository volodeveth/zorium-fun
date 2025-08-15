import { Router } from 'express'
import { query } from 'express-validator'
import { searchController } from '../controllers/searchController'
import { validateRequest } from '../middleware/validation'

const router = Router()

// Global search
router.get('/',
  [
    query('q')
      .optional()
      .isLength({ min: 1, max: 100 })
      .withMessage('Search query must be 1-100 characters'),
    query('type')
      .optional()
      .isIn(['users', 'nfts', 'collections'])
      .withMessage('Type must be users, nfts, or collections'),
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
  searchController.search
)

// Search suggestions
router.get('/suggestions',
  [
    query('q')
      .isLength({ min: 2, max: 50 })
      .withMessage('Query must be 2-50 characters for suggestions')
  ],
  validateRequest,
  searchController.suggestions
)

export default router