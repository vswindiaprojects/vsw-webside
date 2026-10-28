import { Router } from 'express'
import { body, param } from 'express-validator'
import { createProject, deleteProject, getProject, listByCategory, listProjects, updateProject } from '../controllers/projects-mysql.js'
import { requireAuth, requirePermission } from '../middleware/auth-mysql.js'
import { handleValidation } from '../middleware/validate-mysql.js'
import { asyncHandler } from '../middleware/errors-mysql.js'

const router = Router()
const rules = [body('title').trim().notEmpty().withMessage('Title is required.'), body('location').trim().notEmpty().withMessage('Location is required.'), body('category').optional().isIn(['Corporate','Commercial','Hospitality','Education','Healthcare','Residential','Other']).withMessage('Invalid category.')]
router.get('/', asyncHandler(listProjects))
router.get('/category/:category', asyncHandler(listByCategory))
router.get('/:id', param('id').isInt(), handleValidation, asyncHandler(getProject))
router.post('/', requireAuth, requirePermission('projects'), rules, handleValidation, asyncHandler(createProject))
router.put('/:id', requireAuth, requirePermission('projects'), param('id').isInt(), rules, handleValidation, asyncHandler(updateProject))
router.delete('/:id', requireAuth, requirePermission('projects'), param('id').isInt(), handleValidation, asyncHandler(deleteProject))
export default router
