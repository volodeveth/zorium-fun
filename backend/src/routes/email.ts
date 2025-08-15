import { Router } from 'express'
import { emailController } from '../controllers/emailController'
import { authenticateToken } from '../middleware/auth'
import { body } from 'express-validator'
import { validateRequest } from '../middleware/validation'

const router = Router()

// All email routes require authentication
router.use(authenticateToken)

// Validation rules
const emailValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email address is required')
]

const tokenValidation = [
  body('token')
    .isString()
    .notEmpty()
    .withMessage('Verification token is required')
]

// Routes

// Send email verification
router.post(
  '/send-verification',
  emailValidation,
  validateRequest,
  emailController.sendVerification
)

// Verify email with token
router.post(
  '/verify',
  tokenValidation,
  validateRequest,
  emailController.verifyEmail
)

// Resend verification email
router.post(
  '/resend-verification',
  emailController.resendVerification
)

// Get verification status
router.get(
  '/verification-status',
  emailController.getVerificationStatus
)

// Update email (requires re-verification)
router.put(
  '/update',
  emailValidation,
  validateRequest,
  emailController.updateEmail
)

export default router