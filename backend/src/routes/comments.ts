import { Router } from 'express'
import { commentController } from '../controllers/commentController'
import { authenticateToken } from '../middleware/auth'
import { body, param, query } from 'express-validator'
import { validateRequest } from '../middleware/validation'

const router = Router()

// Validation rules
const commentIdValidation = [
  param('commentId').isString().notEmpty().withMessage('Comment ID is required')
]

const nftIdValidation = [
  param('nftId').isString().notEmpty().withMessage('NFT ID is required')
]

const createCommentValidation = [
  ...nftIdValidation,
  body('content')
    .isString()
    .trim()
    .isLength({ min: 1, max: 1000 })
    .withMessage('Comment content must be between 1 and 1000 characters'),
  body('parentId')
    .optional()
    .isString()
    .withMessage('Parent ID must be a string')
]

const updateCommentValidation = [
  ...commentIdValidation,
  body('content')
    .isString()
    .trim()
    .isLength({ min: 1, max: 1000 })
    .withMessage('Comment content must be between 1 and 1000 characters')
]

const paginationValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  query('parentId')
    .optional()
    .isString()
    .withMessage('Parent ID must be a string')
]

// Routes

// Get comments for an NFT
router.get(
  '/nft/:nftId',
  nftIdValidation,
  paginationValidation,
  validateRequest,
  commentController.getNFTComments
)

// Create a new comment (requires authentication)
router.post(
  '/nft/:nftId',
  authenticateToken,
  createCommentValidation,
  validateRequest,
  commentController.createComment
)

// Update a comment (requires authentication)
router.put(
  '/:commentId',
  authenticateToken,
  updateCommentValidation,
  validateRequest,
  commentController.updateComment
)

// Delete a comment (requires authentication)
router.delete(
  '/:commentId',
  authenticateToken,
  commentIdValidation,
  validateRequest,
  commentController.deleteComment
)

// Get replies for a comment
router.get(
  '/:commentId/replies',
  commentIdValidation,
  paginationValidation,
  validateRequest,
  commentController.getCommentReplies
)

export default router