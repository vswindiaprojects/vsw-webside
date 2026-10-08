import { Router } from 'express'
import { body } from 'express-validator'
import { getSettings, updateSettings } from '../controllers/settings-mysql.js'
import { requireAuth, requirePermission } from '../middleware/auth-mysql.js'
import { handleValidation } from '../middleware/validate-mysql.js'
import { asyncHandler } from '../middleware/errors-mysql.js'

const router = Router()
router.get('/', asyncHandler(getSettings))
router.put('/', requireAuth, requirePermission('company'), [body('companyName').trim().notEmpty(), body('email').isEmail(), body('phone1').trim().notEmpty()], handleValidation, asyncHandler(updateSettings))
export default router
