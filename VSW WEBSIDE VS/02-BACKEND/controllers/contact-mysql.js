import { query } from '../config/db.js'
import { sendMail } from '../config/mailer.js'
import { createUserNotification, recordActivity } from './dashboard-mysql.js'

const contactTable = process.env.CONTACT_TABLE || 'contact_inquiries'

if (!/^[A-Za-z0-9_]+$/.test(contactTable)) throw new Error('CONTACT_TABLE must contain only letters, numbers, and underscores.')

const escapeHtml = (value = '') => String(value).replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character])

const sendInquiryNotification = async ({ inquiryId, user, company, service, projectBrief, submittedAt }) => {
  const receiver = process.env.INQUIRY_RECEIVER_EMAIL || 'vswindiaprojects@gmail.com'
  const emailName = String(user.name || 'VSW client').replace(/[\r\n\u0000-\u001F\u007F]+/g, ' ').trim().slice(0, 120)
  const safe = { name: escapeHtml(user.name), email: escapeHtml(user.email), phone: escapeHtml(user.phone), company: escapeHtml(company || '—'), service: escapeHtml(service), message: escapeHtml(projectBrief).replace(/\r?\n/g, '<br>'), id: escapeHtml(inquiryId), date: escapeHtml(submittedAt) }
  await sendMail({
    to: receiver,
    replyTo: user.email,
    subject: `New Website Inquiry - ${emailName}`,
    text: `New Website Inquiry\n\nUser Information\nName: ${user.name}\nEmail: ${user.email}\nPhone: ${user.phone}\nCompany: ${company || '—'}\n\nInquiry Information\nService: ${service}\nMessage:\n${projectBrief}\n\nSubmission Information\nInquiry ID: ${inquiryId}\nSubmitted On: ${submittedAt}\nStatus: Pending\n\nSubmitted through the VSW Solutions website.`,
    html: `<div style="font-family:Arial,sans-serif;color:#142333;max-width:680px;margin:auto;border:1px solid #e2e7e8"><div style="background:#071522;color:#fff;padding:22px 28px"><h1 style="font-size:20px;margin:0">New Website Inquiry</h1></div><div style="padding:24px 28px"><h2 style="font-size:15px">User Information</h2><table style="border-collapse:collapse;width:100%"><tr><td style="padding:8px;border-bottom:1px solid #eee">Name</td><td style="padding:8px;border-bottom:1px solid #eee">${safe.name}</td></tr><tr><td style="padding:8px;border-bottom:1px solid #eee">Email</td><td style="padding:8px;border-bottom:1px solid #eee">${safe.email}</td></tr><tr><td style="padding:8px;border-bottom:1px solid #eee">Phone</td><td style="padding:8px;border-bottom:1px solid #eee">${safe.phone}</td></tr><tr><td style="padding:8px;border-bottom:1px solid #eee">Company</td><td style="padding:8px;border-bottom:1px solid #eee">${safe.company}</td></tr></table><h2 style="font-size:15px;margin-top:24px">Inquiry Information</h2><p><strong>Service:</strong> ${safe.service}</p><div style="padding:14px;background:#f5f7f7;line-height:1.6">${safe.message}</div><h2 style="font-size:15px;margin-top:24px">Submission Information</h2><p>Inquiry ID: ${safe.id}<br>Submitted: ${safe.date}<br>Status: Pending</p><p style="color:#687782;font-size:12px">Submitted through the VSW Solutions website.</p></div></div>`,
  })
}

export const createMessage = async (req, res) => {
  const { company = '', service, project_brief } = req.body
  const [users] = await query('SELECT name, email, phone FROM users WHERE id = ? AND status = \'active\'', [req.user.id])
  if (!users[0]) return res.status(401).json({ success: false, message: 'Please sign in again before sending an inquiry.' })
  const user = users[0]
  const [result] = await query(`INSERT INTO \`${contactTable}\` (user_id, name, email, phone, company, service, project_brief, status) VALUES (?, ?, ?, ?, ?, ?, ?, 'Pending')`, [req.user.id, user.name, user.email, user.phone, company, service, project_brief])
  await query("INSERT INTO admin_notifications(admin_id,type,title,message,entity_type,entity_id) VALUES(NULL,'inquiry_received','New inquiry received',CONCAT('New inquiry from ', ? , ' for ', ? , '.'),'inquiry',?)", [user.name, service, result.insertId])
  await recordActivity(req.user.id, result.insertId, 'inquiry_submitted', `You submitted inquiry INQ-${String(result.insertId).padStart(5, '0')}.`)
  let emailNotification = 'sent'
  try {
    const [[savedInquiry]] = await query(`SELECT created_at FROM \`${contactTable}\` WHERE id = ?`, [result.insertId])
    const submittedAt = savedInquiry?.created_at ? new Date(savedInquiry.created_at).toISOString() : new Date().toISOString()
    await sendInquiryNotification({ inquiryId: result.insertId, user, company, service, projectBrief: project_brief, submittedAt })
  } catch (error) {
    emailNotification = 'failed'
    console.error('[inquiry-email] Could not send inquiry notification:', { code: error.code || 'MAIL_ERROR' })
  }
  res.status(201).json({ success: true, message: 'Your enquiry has been submitted successfully.', data: { id: result.insertId, status: 'Pending', emailNotification } })
}
export const listMessages = async (req, res) => { const page = Math.max(Number(req.query.page) || 1, 1); const limit = Math.min(Math.max(Number(req.query.limit) || 10, 1), 100); const [count] = await query(`SELECT COUNT(*) AS total FROM \`${contactTable}\``); const [rows] = await query(`SELECT id, user_id AS userId, name, email, phone, company, service, project_brief, status, created_at AS createdAt FROM \`${contactTable}\` ORDER BY created_at DESC LIMIT ? OFFSET ?`, [limit, (page - 1) * limit]); res.json({ success: true, data: rows, page, limit, total: count[0].total }) }
export const listInquiryStatuses = async (req, res) => {
  const [[column]] = await query(`SHOW COLUMNS FROM \`${contactTable}\` LIKE 'status'`)
  const statuses = [...String(column?.Type || '').matchAll(/'([^']+)'/g)].map((match) => match[1])
  return res.json({ success: true, data: statuses })
}

export const updateMessage = async (req, res) => {
  const statuses = await listStatuses()
  if (!statuses.includes(req.body.status)) return res.status(400).json({ success: false, message: 'Choose a valid inquiry status.' })
  const [[inquiry]] = await query(`SELECT c.user_id AS userId, c.status, COALESCE(s.inquiry_notifications, 1) AS inquiryNotifications
    FROM \`${contactTable}\` c LEFT JOIN user_settings s ON s.user_id = c.user_id WHERE c.id = ?`, [req.params.id])
  if (!inquiry) return res.status(404).json({ success: false, message: 'Inquiry not found.' })
  await query(`UPDATE \`${contactTable}\` SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`, [req.body.status, req.params.id])
  if (inquiry.userId && inquiry.status !== req.body.status) {
    const number = `INQ-${String(req.params.id).padStart(5, '0')}`
    if (inquiry.inquiryNotifications) await createUserNotification(inquiry.userId, req.params.id, 'status_changed', 'Inquiry status updated', `${number} is now ${req.body.status}.`)
    await recordActivity(inquiry.userId, req.params.id, 'status_changed', `Inquiry ${number} status changed to ${req.body.status}.`)
  }
  return res.json({ success: true, message: 'Inquiry status updated.' })
}

const listStatuses = async () => {
  const [[column]] = await query(`SHOW COLUMNS FROM \`${contactTable}\` LIKE 'status'`)
  return [...String(column?.Type || '').matchAll(/'([^']+)'/g)].map((match) => match[1])
}
