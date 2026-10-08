import { query } from '../config/db.js'
import { sendMail } from '../config/mailer.js'
import { createUserNotification, recordActivity } from './dashboard-mysql.js'

const inquiryNumber = (id) => `INQ-${String(id).padStart(5, '0')}`
const escapeHtml = (value = '') => String(value).replace(/[&<>"']/g, (character) => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' })[character])

export const getUserInquiryDetails = async (req, res) => {
  const [[inquiry]] = await query(`SELECT id, service, project_brief AS message, status, created_at AS createdAt, updated_at AS updatedAt
    FROM contact_inquiries WHERE id = ? AND user_id = ?`, [req.params.id, req.user.id])
  if (!inquiry) return res.status(404).json({ success: false, message: 'Inquiry not found.' })
  inquiry.inquiryNumber = inquiryNumber(inquiry.id)
  return res.json({ success: true, data: inquiry })
}

export const getUserInquiryMessages = async (req, res) => {
  const [[owned]] = await query('SELECT id FROM contact_inquiries WHERE id = ? AND user_id = ?', [req.params.id, req.user.id])
  if (!owned) return res.status(404).json({ success: false, message: 'Inquiry not found.' })
  const [rows] = await query(`SELECT id, sender_type AS senderType, sender_name AS senderName, message, created_at AS createdAt
    FROM inquiry_messages WHERE inquiry_id = ? ORDER BY created_at ASC, id ASC`, [req.params.id])
  return res.json({ success: true, data: rows })
}

export const getAdminInquiryMessages = async (req, res) => {
  const [[inquiry]] = await query('SELECT id FROM contact_inquiries WHERE id = ?', [req.params.id])
  if (!inquiry) return res.status(404).json({ success: false, message: 'Inquiry not found.' })
  const [rows] = await query(`SELECT id, sender_type AS senderType, sender_name AS senderName, message, created_at AS createdAt
    FROM inquiry_messages WHERE inquiry_id = ? ORDER BY created_at ASC, id ASC`, [req.params.id])
  return res.json({ success: true, data: rows })
}

export const replyAsCustomer = async (req, res) => {
  const [[inquiry]] = await query(`SELECT c.id, c.status, u.name, u.email FROM contact_inquiries c
    JOIN users u ON u.id = c.user_id WHERE c.id = ? AND c.user_id = ? AND u.status = 'active'`, [req.params.id, req.user.id])
  if (!inquiry) return res.status(404).json({ success: false, message: 'Inquiry not found.' })
  if (['Closed', 'Cancelled'].includes(inquiry.status)) return res.status(409).json({ success: false, message: 'This inquiry is closed and cannot receive new replies.' })
  const message = req.body.message.trim()
  const [result] = await query(`INSERT INTO inquiry_messages (inquiry_id, sender_user_id, sender_type, sender_name, message)
    VALUES (?, ?, 'User', ?, ?)`, [inquiry.id, req.user.id, inquiry.name, message])
  await query('UPDATE contact_inquiries SET updated_at = CURRENT_TIMESTAMP WHERE id = ?', [inquiry.id])
  const ref = inquiryNumber(inquiry.id)
  await recordActivity(req.user.id, inquiry.id, 'user_reply', `You replied to inquiry ${ref}.`)
  return res.status(201).json({ success: true, message: 'Reply sent.', data: { id: result.insertId } })
}

export const replyAsAdmin = async (req, res) => {
  const [[inquiry]] = await query(`SELECT c.id, c.user_id AS userId, c.status, u.name AS userName, u.email AS userEmail,
      COALESCE(s.email_notifications, 1) AS emailNotifications, COALESCE(s.reply_notifications, 1) AS replyNotifications,
      a.name AS adminName
    FROM contact_inquiries c LEFT JOIN users u ON u.id = c.user_id
    LEFT JOIN user_settings s ON s.user_id = u.id
    LEFT JOIN admins a ON a.id = ?
    WHERE c.id = ?`, [req.user.id, req.params.id])
  if (!inquiry) return res.status(404).json({ success: false, message: 'Inquiry not found.' })
  if (!inquiry.userId || !inquiry.userEmail) return res.status(409).json({ success: false, message: 'This legacy inquiry is not linked to an active customer account.' })
  if (['Closed', 'Cancelled'].includes(inquiry.status)) return res.status(409).json({ success: false, message: 'This inquiry is closed and cannot receive new replies.' })
  const message = req.body.message.trim()
  const senderName = inquiry.adminName || req.user.email || 'VSW Admin'
  await query(`INSERT INTO inquiry_messages (inquiry_id, sender_type, sender_name, message)
    VALUES (?, 'Admin', ?, ?)`, [inquiry.id, senderName, message])
  await query(`UPDATE contact_inquiries SET status = 'Responded', updated_at = CURRENT_TIMESTAMP WHERE id = ?`, [inquiry.id])
  const ref = inquiryNumber(inquiry.id)
  await createUserNotification(inquiry.userId, inquiry.id, 'admin_reply', 'New reply to your inquiry', `VSW replied to ${ref}. Sign in to view the conversation.`)
  await recordActivity(inquiry.userId, inquiry.id, 'admin_reply', `VSW replied to inquiry ${ref}.`)
  if (inquiry.emailNotifications && inquiry.replyNotifications) {
    try {
      const link = `${process.env.FRONTEND_URL?.split(',')[0] || 'http://localhost:5173'}/account`
      await sendMail({ to: inquiry.userEmail, subject: `New Reply to Your Inquiry ${ref}`, text: `VSW has replied to your inquiry ${ref}. Sign in to your account to read the reply: ${link}`, html: `<div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;padding:28px;color:#142333"><p style="color:#9a7942;font-weight:bold">VSW SOLUTIONS</p><h2>There is a new reply for you</h2><p>Our team has replied to inquiry <b>${ref}</b>.</p><p>Sign in to your account to view the conversation.</p><p><a href="${escapeHtml(link)}" style="display:inline-block;padding:13px 18px;background:#07131f;color:white;text-decoration:none">View my inquiry</a></p></div>` })
    } catch (error) { console.error('[inquiry-reply-email] Could not send customer notification:', { code: error.code || 'MAIL_ERROR' }) }
  }
  return res.status(201).json({ success: true, message: 'Reply sent and the customer was notified in their account.' })
}
