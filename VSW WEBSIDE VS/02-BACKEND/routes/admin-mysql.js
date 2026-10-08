import { Router } from 'express'
import multer from 'multer'
import { randomUUID } from 'node:crypto'
import path from 'node:path'
import { mkdir } from 'node:fs/promises'
import { body, param, query as queryRule } from 'express-validator'
import { requireAuth, requirePermission } from '../middleware/auth-mysql.js'
import { auditAdminMutation } from '../middleware/admin-audit.js'
import { asyncHandler } from '../middleware/errors-mysql.js'
import {
  addInquiryNote, createAdminAccount, createAdminProject, createAdminService, dashboard,
  deleteAdminProject, deleteAdminService, deleteAdminUser, getAdminCompany, getAdminInquiry,
  getAdminProject, getAdminUser, listAdminAccounts, listAdminInquiries, listAdminNotifications,
  listAdminProjects, listAdminServices, listAdminUsers, listContacts, listContent, markAdminNotification,
  putContent, report, updateAdminAccount, updateAdminCompany, updateAdminInquiry, updateAdminProject,
  updateAdminService, updateAdminUser, updateContact, deleteContact,
  listMedia, uploadMediaRecord, updateMedia, deleteMedia, listDocuments, createDocument, updateDocument, deleteDocument, deleteAdminAccount,
  markAllAdminNotifications, deleteAdminNotification, changeAdminPassword,
} from '../controllers/admin-mysql.js'
import { handleValidation } from '../middleware/validate-mysql.js'

const router = Router()
router.use(requireAuth)
router.use(auditAdminMutation)
const id = param('id').isInt({ min: 1 })
const projectRules = [body('title').trim().isLength({min:1,max:190}), body('location').optional().trim().isLength({max:190}), body('category').optional().trim().isLength({max:100}), body('status').optional().isIn(['Upcoming','Ongoing','Completed','On Hold'])]
const serviceRules = [body('title').trim().isLength({min:1,max:190}), body('slug').trim().matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/), body('description').trim().notEmpty(), body('status').optional().isIn(['active','inactive'])]

router.get('/dashboard',requirePermission('dashboard'),asyncHandler(dashboard))
router.get('/users',requirePermission('users'),asyncHandler(listAdminUsers))
router.get('/users/:id',requirePermission('users'),id,handleValidation,asyncHandler(getAdminUser))
router.put('/users/:id',requirePermission('users'),id,[body('name').trim().notEmpty(),body('email').isEmail().normalizeEmail(),body('phone').trim().notEmpty(),body('status').isIn(['active','disabled'])],handleValidation,asyncHandler(updateAdminUser))
router.delete('/users/:id',requirePermission('users'),id,handleValidation,asyncHandler(deleteAdminUser))

router.get('/inquiries',requirePermission('inquiries'),asyncHandler(listAdminInquiries))
router.get('/inquiries/:id',requirePermission('inquiries'),id,handleValidation,asyncHandler(getAdminInquiry))
router.put('/inquiries/:id',requirePermission('inquiries'),id,[body('status').optional().isIn(['New','Contacted','In Discussion','Quoted','Follow-up','Converted','Rejected','Closed','Pending','In Progress','Responded','Resolved','Cancelled']),body('budget').optional({values:'null'}).isFloat({min:0}),body('followUpDate').optional({values:'falsy'}).isISO8601(),body('assignedAdminId').optional({values:'null'}).isInt({min:1}),body('archived').optional().isBoolean()],handleValidation,asyncHandler(updateAdminInquiry))
router.post('/inquiries/:id/notes',requirePermission('inquiries'),id,body('note').trim().isLength({min:1,max:5000}),handleValidation,asyncHandler(addInquiryNote))

router.get('/projects',requirePermission('projects'),asyncHandler(listAdminProjects))
router.get('/projects/:id',requirePermission('projects'),id,handleValidation,asyncHandler(getAdminProject))
router.post('/projects',requirePermission('projects'),projectRules,handleValidation,asyncHandler(createAdminProject))
router.put('/projects/:id',requirePermission('projects'),id,projectRules,handleValidation,asyncHandler(updateAdminProject))
router.delete('/projects/:id',requirePermission('projects'),id,handleValidation,asyncHandler(deleteAdminProject))

router.get('/services',requirePermission('services'),asyncHandler(listAdminServices))
router.post('/services',requirePermission('services'),serviceRules,handleValidation,asyncHandler(createAdminService))
router.put('/services/:id',requirePermission('services'),id,serviceRules,handleValidation,asyncHandler(updateAdminService))
router.delete('/services/:id',requirePermission('services'),id,handleValidation,asyncHandler(deleteAdminService))

router.get('/company',requirePermission('company'),asyncHandler(getAdminCompany))
router.put('/company',requirePermission('company'),[body('companyName').optional().trim().isLength({max:190}),body('email').optional({values:'falsy'}).isEmail()],handleValidation,asyncHandler(updateAdminCompany))
router.get('/content',requirePermission('content'),asyncHandler(listContent))
router.put('/content',requirePermission('content'),[body('page').isIn(['home','about','services','projects','contact','footer']),body('section').trim().isLength({min:1,max:100}),body('content').exists()],handleValidation,asyncHandler(putContent))

router.get('/contacts',requirePermission('contactMessages'),asyncHandler(listContacts))
router.patch('/contacts/:id',requirePermission('contactMessages'),id,body('status').isIn(['Unread','Read','Replied','Closed']),handleValidation,asyncHandler(updateContact))
router.delete('/contacts/:id',requirePermission('contactMessages'),id,handleValidation,asyncHandler(deleteContact))

router.get('/media',requirePermission('media'),asyncHandler(listMedia))
const uploadRoot=path.resolve(process.cwd(),'uploads')
await mkdir(uploadRoot,{recursive:true})
const storage=multer.diskStorage({destination:(_req,_file,cb)=>cb(null,uploadRoot),filename:(_req,file,cb)=>cb(null,`${Date.now()}-${randomUUID()}${path.extname(file.originalname).toLowerCase()}`)})
const uploader=multer({storage,limits:{fileSize:15*1024*1024},fileFilter:(_req,file,cb)=>{const ext=path.extname(file.originalname).toLowerCase();const allowed=['.jpg','.jpeg','.png','.webp','.gif','.pdf'];cb(null,allowed.includes(ext)&&(/^(image\/(jpeg|png|webp|gif)|application\/pdf)$/.test(file.mimetype)))}}).single('file')
router.post('/media',requirePermission('media'),(req,res,next)=>uploader(req,res,error=>error?res.status(400).json({success:false,message:error.code==='LIMIT_FILE_SIZE'?'File size must be 15 MB or less.':'Only JPG, PNG, WEBP, GIF, and PDF files are allowed.'}):next()),asyncHandler(uploadMediaRecord))
router.patch('/media/:id',requirePermission('media'),id,[body('originalName').optional().trim().isLength({min:1,max:255}),body('altText').optional().trim().isLength({max:255}),body('relatedType').optional().isIn(['project','service','banner','gallery','general']),body('relatedId').optional({values:'null'}).isInt({min:1})],handleValidation,asyncHandler(updateMedia))
router.delete('/media/:id',requirePermission('media'),id,handleValidation,asyncHandler(deleteMedia))
router.get('/documents',requirePermission('documents'),asyncHandler(listDocuments))
router.post('/documents',requirePermission('documents'),[body('name').trim().notEmpty(),body('mediaId').isInt({min:1}),body('relatedProjectId').optional({values:'null'}).isInt({min:1})],handleValidation,asyncHandler(createDocument))
router.patch('/documents/:id',requirePermission('documents'),id,body('status').isIn(['active','archived']),handleValidation,asyncHandler(updateDocument))
router.delete('/documents/:id',requirePermission('documents'),id,handleValidation,asyncHandler(deleteDocument))

router.get('/admins',requirePermission('adminUsers'),asyncHandler(listAdminAccounts))
router.post('/admins',requirePermission('adminUsers'),[body('name').trim().notEmpty(),body('email').isEmail().normalizeEmail(),body('password').isLength({min:12,max:72}),body('role').isIn(['super_admin','admin','manager','editor','support_staff'])],handleValidation,asyncHandler(createAdminAccount))
router.put('/admins/:id',requirePermission('adminUsers'),id,[body('name').trim().notEmpty(),body('email').isEmail().normalizeEmail(),body('role').isIn(['super_admin','admin','manager','editor','support_staff']),body('password').optional({values:'falsy'}).isLength({min:12,max:72})],handleValidation,asyncHandler(updateAdminAccount))
router.delete('/admins/:id',requirePermission('adminUsers'),id,handleValidation,asyncHandler(deleteAdminAccount))
router.get('/notifications',requirePermission('notifications'),asyncHandler(listAdminNotifications))
router.patch('/notifications/:id/read',requirePermission('notifications'),id,handleValidation,asyncHandler(markAdminNotification))
router.patch('/notifications/read-all',requirePermission('notifications'),asyncHandler(markAllAdminNotifications))
router.delete('/notifications/:id',requirePermission('notifications'),id,handleValidation,asyncHandler(deleteAdminNotification))
router.put('/security/password',requirePermission('settings'),[body('currentPassword').notEmpty(),body('newPassword').isLength({min:12,max:72})],handleValidation,asyncHandler(changeAdminPassword))
router.get('/reports',requirePermission('reports'),asyncHandler(report))
router.get('/settings',requirePermission('settings'),(req,res)=>res.json({success:true,data:{inquiryReceiverEmail:process.env.INQUIRY_RECEIVER_EMAIL||'vswindiaprojects@gmail.com',smtpConfigured:Boolean(process.env.SMTP_HOST&&process.env.SMTP_USER&&process.env.SMTP_PASSWORD),smtpHost:process.env.SMTP_HOST||'',smtpPort:process.env.SMTP_PORT||'',rateLimit:Number(process.env.INQUIRY_RATE_LIMIT)||100}}))

export default router
