import { Router } from 'express'
import { asyncHandler } from '../middleware/errors-mysql.js'
import { getPublicContent } from '../controllers/admin-mysql.js'
import { getPublishedTheme } from '../controllers/theme-mysql.js'
import { getPublicClientLogos } from '../controllers/client-logos-mysql.js'
import { getPublicProjectCounter } from '../controllers/project-counter-mysql.js'
const router=Router()
router.get('/',asyncHandler(getPublicContent))
router.get('/theme',asyncHandler(getPublishedTheme))
router.get('/clients',asyncHandler(getPublicClientLogos))
router.get('/counter',asyncHandler(getPublicProjectCounter))
export default router
