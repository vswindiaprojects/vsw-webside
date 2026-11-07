import { Router } from 'express'
import { body } from 'express-validator'
import rateLimit from 'express-rate-limit'
import { createReview, listPublicReviews } from '../controllers/reviews-mysql.js'
import { handleValidation } from '../middleware/validate-mysql.js'
import { asyncHandler } from '../middleware/errors-mysql.js'

const router = Router()

const reviewLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 6,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many reviews were submitted from this network. Please wait a few minutes and try again.' },
})

const rules = [
  body('name').trim().isLength({ min: 2, max: 120 }).matches(/^[^\r\n\u0000-\u001F\u007F]+$/).withMessage('Enter your name (2 to 120 characters).'),
  body('company').optional({ values: 'falsy' }).trim().isLength({ max: 190 }),
  body('rating').isInt({ min: 1, max: 5 }).withMessage('Choose a rating between 1 and 5 stars.'),
  body('message').trim().isLength({ min: 10, max: 1500 }).withMessage('Your review must be between 10 and 1,500 characters.'),
]

router.get('/', asyncHandler(listPublicReviews))
router.post('/', reviewLimiter, rules, handleValidation, asyncHandler(createReview))

export default router
