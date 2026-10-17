import { Router } from 'express'
import { asyncHandler } from '../middleware/errors-mysql.js'
import { getPublicContent } from '../controllers/admin-mysql.js'
import { getPublishedTheme } from '../controllers/theme-mysql.js'
const router=Router()
router.get('/',asyncHandler(getPublicContent))
router.get('/theme',asyncHandler(getPublishedTheme))
export default router
