import { Router } from 'express'
import { body } from 'express-validator'
import { login, logout, me } from '../controllers/auth-mysql.js'
import { requireAuth } from '../middleware/auth-mysql.js'
import { createLoginAttemptLimiter } from '../middleware/login-attempt-limiter.js'
import { handleValidation } from '../middleware/validate-mysql.js'
import { asyncHandler } from '../middleware/errors-mysql.js'

const router = Router()
const loginAttemptLimiter = createLoginAttemptLimiter()
router.post('/login', loginAttemptLimiter, [body('email').isEmail().normalizeEmail(), body('password').isLength({ min: 1, max: 72 })], handleValidation, asyncHandler(login))
router.post('/logout', requireAuth, asyncHandler(logout))
router.get('/me', requireAuth, asyncHandler(me))
export default router
