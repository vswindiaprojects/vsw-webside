import { Router } from 'express'
import { body, param } from 'express-validator'
import rateLimit from 'express-rate-limit'
import { createMessage, listInquiryStatuses, listMessages, updateMessage } from '../controllers/contact-mysql.js'
import { requireAuth, requireCustomer, requirePermission } from '../middleware/auth-mysql.js'
import { handleValidation } from '../middleware/validate-mysql.js'
import { asyncHandler } from '../middleware/errors-mysql.js'
import { getUserInquiryMessages, getAdminInquiryMessages, replyAsAdmin, replyAsCustomer } from '../controllers/inquiry-conversation.js'
import { createPublicContactMessage } from '../controllers/public-contact.js'

const router = Router()
// Keep legitimate retries from exhausting a shared browser/IP counter.
const inquiryLimit = Number(process.env.INQUIRY_RATE_LIMIT) || 100
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: inquiryLimit,
  keyGenerator: (req) => `customer:${req.user.id}`,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    const resetAt = req.rateLimit?.resetTime
    const seconds = resetAt ? Math.max(1, Math.ceil((resetAt.getTime() - Date.now()) / 1000)) : 900
    res.set('Retry-After', String(seconds))
    const minutes = Math.max(1, Math.ceil(seconds / 60))
    res.status(429).json({ success: false, retryAfterSeconds: seconds, message: `Too many inquiries were submitted from this account. Please wait about ${minutes} minute${minutes === 1 ? '' : 's'} and try again.` })
  },
})
const publicContactLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 10, standardHeaders: true, legacyHeaders: false, message: { success: false, message: 'Too many messages were sent from this network. Please wait and try again.' } })
const rules = [body('company').optional({ values: 'falsy' }).trim().isLength({ max: 190 }), body('service').trim().notEmpty().withMessage('Choose a service.'), body('project_brief').trim().isLength({ min: 10, max: 10000 }).withMessage('Your inquiry must be between 10 and 10,000 characters.')]
const replyRules = [body('message').trim().isLength({ min: 1, max: 5000 }).withMessage('A reply must be between 1 and 5,000 characters.')]
router.post('/', requireCustomer, limiter, rules, handleValidation, asyncHandler(createMessage))
router.post('/message', publicContactLimiter, [body('name').trim().isLength({min:2,max:120}).matches(/^[^\r\n\u0000-\u001F\u007F]+$/),body('email').isEmail().normalizeEmail(),body('phone').optional().trim().isLength({max:50}).matches(/^[^\r\n\u0000-\u001F\u007F]*$/),body('subject').optional().trim().isLength({max:190}).matches(/^[^\r\n\u0000-\u001F\u007F]*$/),body('message').trim().isLength({min:10,max:10000})], handleValidation, asyncHandler(createPublicContactMessage))
router.get('/statuses', asyncHandler(listInquiryStatuses))
router.get('/:id/messages/admin', requireAuth, requirePermission('inquiries'), param('id').isInt(), handleValidation, asyncHandler(getAdminInquiryMessages))
router.post('/:id/messages/admin', requireAuth, requirePermission('inquiries'), param('id').isInt(), replyRules, handleValidation, asyncHandler(replyAsAdmin))
router.get('/:id/messages', requireCustomer, param('id').isInt(), handleValidation, asyncHandler(getUserInquiryMessages))
router.post('/:id/messages', requireCustomer, param('id').isInt(), replyRules, handleValidation, asyncHandler(replyAsCustomer))
router.get('/', requireAuth, requirePermission('inquiries'), asyncHandler(listMessages))
router.patch('/:id', requireAuth, requirePermission('inquiries'), param('id').isInt(), body('status').trim().notEmpty(), handleValidation, asyncHandler(updateMessage))
export default router
