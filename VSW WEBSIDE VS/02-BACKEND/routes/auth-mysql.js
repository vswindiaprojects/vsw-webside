import { Router } from 'express'
import { body } from 'express-validator'
import rateLimit from 'express-rate-limit'
import { login, logout, me } from '../controllers/auth-mysql.js'
import { requireAuth } from '../middleware/auth-mysql.js'
import { handleValidation } from '../middleware/validate-mysql.js'
import { asyncHandler } from '../middleware/errors-mysql.js'

const router = Router()
const limiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 15, standardHeaders: true, legacyHeaders: false })
router.post('/login', limiter, [body('email').isEmail().normalizeEmail(), body('password').isLength({ min: 1, max: 72 })], handleValidation, asyncHandler(login))
router.post('/logout', requireAuth, asyncHandler(logout))
router.get('/me', requireAuth, asyncHandler(me))
export default router
