import { Router } from 'express'
import { body, param, query } from 'express-validator'
import rateLimit from 'express-rate-limit'
import { getMyProfile, listMyInquiries, listUsers, loginUser, logoutUser, registerUser, updateUserStatus } from '../controllers/users-mysql.js'
import { changePasswordWithOtp, requestChangeOtp, requestResetOtp, resetPasswordWithOtp } from '../controllers/password-otp.js'
import { deactivateMyAccount, getDashboardSummary, getMyAccountDashboard, getMySettings, listMyActivity, listMyNotifications, markAllNotificationsRead, markNotificationRead, updateMyProfile, updateMySettings } from '../controllers/dashboard-mysql.js'
import { getUserInquiryDetails, getUserInquiryMessages } from '../controllers/inquiry-conversation.js'
import { requireAuth, requireCustomer, requirePermission } from '../middleware/auth-mysql.js'
import { handleValidation } from '../middleware/validate-mysql.js'
import { asyncHandler } from '../middleware/errors-mysql.js'

const router = Router()
const loginLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 15, standardHeaders: true, legacyHeaders: false })
const registerLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 5, standardHeaders: true, legacyHeaders: false })
const otpRequestLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 5, standardHeaders: true, legacyHeaders: false, message: { success: false, message: 'Too many code requests. Please wait 15 minutes and try again.' } })
const otpVerifyLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 10, standardHeaders: true, legacyHeaders: false, message: { success: false, message: 'Too many code attempts. Please wait 15 minutes and request a new code.' } })
const inquiryStatuses = ['New','Contacted','In Discussion','Quoted','Follow-up','Converted','Rejected','Closed','Pending','In Progress','Responded','Resolved','Cancelled']

router.post('/register', registerLimiter, [
  body('name').trim().isLength({ min: 2, max: 120 }).matches(/^[^\r\n\u0000-\u001F\u007F]+$/).withMessage('Enter your full name.'),
  body('email').isEmail().normalizeEmail().withMessage('Enter a valid email address.'),
  body('phone').trim().isMobilePhone('any').withMessage('Enter a valid mobile number.'),
  body('password').isLength({ min: 12, max: 72 }).withMessage('Password must be between 12 and 72 characters.'),
], handleValidation, asyncHandler(registerUser))
router.post('/login', loginLimiter, [body('email').isEmail().normalizeEmail(), body('password').isLength({ min: 1, max: 72 })], handleValidation, asyncHandler(loginUser))
router.post('/logout', requireCustomer, asyncHandler(logoutUser))
router.post('/password/reset/request', otpRequestLimiter, [body('email').isEmail().normalizeEmail()], handleValidation, asyncHandler(requestResetOtp))
router.post('/password/reset', otpVerifyLimiter, [body('email').isEmail().normalizeEmail(), body('otp').matches(/^\d{6}$/), body('password').isLength({ min: 12, max: 72 }).withMessage('Password must be between 12 and 72 characters.')], handleValidation, asyncHandler(resetPasswordWithOtp))
router.post('/password/change/request', requireCustomer, otpRequestLimiter, asyncHandler(requestChangeOtp))
router.post('/password/change', requireCustomer, otpVerifyLimiter, [body('currentPassword').notEmpty(), body('otp').matches(/^\d{6}$/), body('password').isLength({ min: 12, max: 72 }).withMessage('Password must be between 12 and 72 characters.')], handleValidation, asyncHandler(changePasswordWithOtp))
router.get('/me/dashboard', requireCustomer, [query('page').optional().isInt({ min: 1, max: 10000 }), query('limit').optional().isInt({ min: 1, max: 50 }), query('search').optional().isString().isLength({ max: 120 }), query('status').optional().isIn(inquiryStatuses)], handleValidation, asyncHandler(getMyAccountDashboard))
router.get('/me', requireCustomer, asyncHandler(getMyProfile))
router.patch('/me', requireCustomer, [body('name').trim().isLength({ min: 2, max: 120 }).matches(/^[^\r\n\u0000-\u001F\u007F]+$/), body('phone').trim().isMobilePhone('any'), body('companyName').optional().trim().isLength({ max: 190 }), body('address').optional().trim().isLength({ max: 255 }), body('city').optional().trim().isLength({ max: 120 }), body('state').optional().trim().isLength({ max: 120 }), body('country').optional().trim().isLength({ max: 120 }), body('postalCode').optional().trim().isLength({ max: 20 }), body('profileImage').optional({ values: 'falsy' }).isURL({ protocols: ['https'], require_protocol: true }).isLength({ max: 500 })], handleValidation, asyncHandler(updateMyProfile))
router.get('/me/summary', requireCustomer, asyncHandler(getDashboardSummary))
router.get('/me/settings', requireCustomer, asyncHandler(getMySettings))
router.patch('/me/settings', requireCustomer, [body('emailNotifications').isBoolean(), body('inquiryNotifications').isBoolean(), body('replyNotifications').isBoolean(), body('marketingEmails').isBoolean()], handleValidation, asyncHandler(updateMySettings))
router.get('/me/notifications', requireCustomer, asyncHandler(listMyNotifications))
router.patch('/me/notifications/read-all', requireCustomer, asyncHandler(markAllNotificationsRead))
router.patch('/me/notifications/:id/read', requireCustomer, param('id').isInt(), handleValidation, asyncHandler(markNotificationRead))
router.get('/me/activity', requireCustomer, asyncHandler(listMyActivity))
router.delete('/me', requireCustomer, asyncHandler(deactivateMyAccount))
router.get('/me/inquiries', requireCustomer, [query('status').optional().isIn(inquiryStatuses)], handleValidation, asyncHandler(listMyInquiries))
router.get('/me/inquiries/:id', requireCustomer, param('id').isInt(), handleValidation, asyncHandler(getUserInquiryDetails))
router.get('/me/inquiries/:id/messages', requireCustomer, param('id').isInt(), handleValidation, asyncHandler(getUserInquiryMessages))
router.get('/', requireAuth, requirePermission('users'), asyncHandler(listUsers))
router.patch('/:id/status', requireAuth, requirePermission('users'), param('id').isInt(), body('status').isIn(['active', 'disabled']), handleValidation, asyncHandler(updateUserStatus))

export default router
