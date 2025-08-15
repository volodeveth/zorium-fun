import { Router } from 'express'
import { body, param } from 'express-validator'
import { authController } from '../controllers/authController'
import { validateRequest } from '../middleware/validation'
import { authenticateToken } from '../middleware/auth'

const router = Router()

// Get nonce for wallet signature
router.get('/nonce/:address', 
  param('address').isEthereumAddress().withMessage('Invalid Ethereum address'),
  validateRequest,
  authController.getNonce
)

// Register new user with wallet signature
router.post('/register',
  [
    body('address').isEthereumAddress().withMessage('Invalid Ethereum address'),
    body('signature').notEmpty().withMessage('Signature is required'),
    body('email').optional().isEmail().withMessage('Invalid email format'),
    body('username').optional()
      .isLength({ min: 3, max: 20 }).withMessage('Username must be 3-20 characters')
      .matches(/^[a-zA-Z0-9_]+$/).withMessage('Username can only contain letters, numbers and underscore')
  ],
  validateRequest,
  authController.register
)

// Login with wallet signature
router.post('/login',
  [
    body('address').isEthereumAddress().withMessage('Invalid Ethereum address'),
    body('signature').notEmpty().withMessage('Signature is required')
  ],
  validateRequest,
  authController.login
)

// Get current user session
router.get('/session',
  authenticateToken,
  authController.getSession
)

// Refresh access token
router.post('/refresh',
  [
    body('refreshToken').notEmpty().withMessage('Refresh token is required')
  ],
  validateRequest,
  authController.refreshToken
)

// Logout
router.post('/logout',
  authenticateToken,
  authController.logout
)

export default router