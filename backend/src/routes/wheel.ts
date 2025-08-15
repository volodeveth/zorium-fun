import { Router } from 'express'
import { body, param } from 'express-validator'
import { authenticateToken } from '../middleware/auth'
import { validateRequest } from '../middleware/validation'
import { wheelController } from '../controllers/wheelController'

const router = Router()

// Get wheel status for user
router.get('/:address/status',
  [
    param('address')
      .isEthereumAddress()
      .withMessage('Invalid Ethereum address')
  ],
  validateRequest,
  wheelController.getWheelStatus
)

// Spin wheel (requires wallet signature)
router.post('/:address/spin',
  authenticateToken,
  [
    param('address')
      .isEthereumAddress()
      .withMessage('Invalid Ethereum address'),
    body('signature')
      .notEmpty()
      .withMessage('Signature is required'),
    body('nonce')
      .notEmpty()
      .withMessage('Nonce is required')
  ],
  validateRequest,
  wheelController.spinWheel
)

// Verify wheel spin transaction
router.post('/:address/verify-spin',
  [
    param('address')
      .isEthereumAddress()
      .withMessage('Invalid Ethereum address'),
    body('transactionHash')
      .isHexadecimal()
      .isLength({ min: 66, max: 66 })
      .withMessage('Invalid transaction hash'),
    body('expectedReward')
      .isDecimal()
      .withMessage('Expected reward must be a valid decimal')
  ],
  validateRequest,
  wheelController.verifyWheelSpin
)

export default router