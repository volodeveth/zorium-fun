import { Router } from 'express'
import { adminController } from '../controllers/adminController'
import { authenticateToken } from '../middleware/auth'
import { body, param, query } from 'express-validator'
import { validateRequest } from '../middleware/validation'

const router = Router()

// Admin routes check x-admin-address header instead of JWT token
// This allows admin access without requiring wallet connection/JWT

// Validation rules
const zrmAllocationValidation = [
  body('toAddress')
    .isString()
    .notEmpty()
    .withMessage('Recipient address is required'),
  body('amount')
    .isNumeric()
    .isFloat({ min: 0.000001 })
    .withMessage('Amount must be a positive number'),
  body('reason')
    .optional()
    .isString()
    .withMessage('Reason must be a string')
]

const depositValidation = [
  body('amount')
    .isNumeric()
    .isFloat({ min: 0.000001 })
    .withMessage('Amount must be a positive number'),
  body('transactionHash')
    .isString()
    .notEmpty()
    .withMessage('Transaction hash is required')
]

const withdrawalValidation = [
  body('type')
    .isIn(['ETH', 'ZRM'])
    .withMessage('Type must be ETH or ZRM'),
  body('amount')
    .isNumeric()
    .isFloat({ min: 0.000001 })
    .withMessage('Amount must be a positive number'),
  body('recipientAddress')
    .isString()
    .notEmpty()
    .withMessage('Recipient address is required')
]

const userVerificationValidation = [
  param('userId')
    .isString()
    .notEmpty()
    .withMessage('User ID is required'),
  body('isVerified')
    .isBoolean()
    .withMessage('isVerified must be a boolean')
]

const paginationValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100')
]

// Routes

// Get platform statistics
router.get(
  '/stats',
  adminController.getStats
)

// Get fee collection history
router.get(
  '/fee-history',
  query('limit')
    .optional()
    .isInt({ min: 1, max: 200 })
    .withMessage('Limit must be between 1 and 200'),
  validateRequest,
  adminController.getFeeHistory
)

// Allocate ZRM to user
router.post(
  '/zrm/allocate',
  zrmAllocationValidation,
  validateRequest,
  adminController.allocateZRM
)

// Deposit ZRM to platform treasury
router.post(
  '/zrm/deposit',
  depositValidation,
  validateRequest,
  adminController.depositZRM
)

// Withdraw funds (ETH or ZRM)
router.post(
  '/withdraw',
  withdrawalValidation,
  validateRequest,
  adminController.withdraw
)

// Get platform users (admin view)
router.get(
  '/users',
  paginationValidation,
  query('search')
    .optional()
    .isString()
    .withMessage('Search must be a string'),
  query('verified')
    .optional()
    .isBoolean()
    .withMessage('Verified filter must be a boolean'),
  query('earlyBird')
    .optional()
    .isBoolean()
    .withMessage('Early bird filter must be a boolean'),
  validateRequest,
  adminController.getUsers
)

// Update user verification status
router.put(
  '/users/:userId/verification',
  userVerificationValidation,
  validateRequest,
  adminController.updateUserVerification
)

// Clean up incorrect ZRM data (one-time operation)
router.post(
  '/zrm/cleanup',
  adminController.cleanZRMData
)

export default router