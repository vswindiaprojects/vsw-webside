import { Router } from 'express'
import { body, param } from 'express-validator'
import { createService, deleteService, listServices, updateService } from '../controllers/services-mysql.js'
import { requireAuth, requirePermission } from '../middleware/auth-mysql.js'
import { handleValidation } from '../middleware/validate-mysql.js'
import { asyncHandler } from '../middleware/errors-mysql.js'

const router = Router()
const rules = [body('title').trim().notEmpty().withMessage('Title is required.'), body('slug').trim().notEmpty().withMessage('Slug is required.'), body('description').trim().notEmpty().withMessage('Description is required.')]
router.get('/', asyncHandler(listServices))
router.post('/', requireAuth, requirePermission('services'), rules, handleValidation, asyncHandler(createService))
router.put('/:id', requireAuth, requirePermission('services'), param('id').isInt(), rules, handleValidation, asyncHandler(updateService))
router.delete('/:id', requireAuth, requirePermission('services'), param('id').isInt(), handleValidation, asyncHandler(deleteService))
export default router
