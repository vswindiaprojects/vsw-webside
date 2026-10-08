import { Router } from 'express'
import { asyncHandler } from '../middleware/errors-mysql.js'
import { getPublicContent } from '../controllers/admin-mysql.js'
const router=Router()
router.get('/',asyncHandler(getPublicContent))
export default router
