import { query } from '../config/db.js'

export const recordActivity = (userId, inquiryId, activityType, summary) => query(
  'INSERT INTO user_activity (user_id, inquiry_id, activity_type, summary) VALUES (?, ?, ?, ?)',
  [userId, inquiryId || null, activityType, summary],
)

export const createUserNotification = (userId, inquiryId, type, title, message) => query(
  'INSERT INTO user_notifications (user_id, inquiry_id, type, title, message) VALUES (?, ?, ?, ?, ?)',
  [userId, inquiryId || null, type, title, message],
)

export const getDashboardSummary = async (req, res) => {
  const [[summary]] = await query(`SELECT
    COUNT(*) AS total,
    COALESCE(SUM(status = 'Pending'), 0) AS pending,
    COALESCE(SUM(status = 'In Progress'), 0) AS inProgress,
    COALESCE(SUM(status IN ('Responded','Resolved')), 0) AS responded,
    COALESCE(SUM(status = 'Closed'), 0) AS closed,
    COALESCE(SUM(status = 'Cancelled'), 0) AS cancelled
    FROM contact_inquiries WHERE user_id = ?`, [req.user.id])
  return res.json({ success: true, data: summary })
}

export const getMyAccountDashboard = async (req, res) => {
  const userId = req.user.id
  const page = Math.min(Math.max(Number(req.query.page) || 1, 1), 10000)
  const limit = Math.min(Math.max(Number(req.query.limit) || 10, 1), 50)
  const search = String(req.query.search || '').trim().slice(0, 120)
  const filters = ['user_id = ?']
  const inquiryParams = [userId]
  if (search) {
    filters.push('(service LIKE ? OR project_brief LIKE ? OR CONCAT(\'INQ-\', LPAD(id, 5, \'0\')) LIKE ?)')
    inquiryParams.push(`%${search}%`, `%${search}%`, `%${search}%`)
  }
  if (req.query.status) { filters.push('status = ?'); inquiryParams.push(req.query.status) }
  const where = filters.join(' AND ')
  await query('INSERT IGNORE INTO user_settings (user_id) VALUES (?)', [userId])
  const results = await Promise.all([
    query(`SELECT id,name,email,phone,company_name AS companyName,address,city,state,country,postal_code AS postalCode,profile_image AS profileImage,role,status,created_at AS createdAt,last_login_at AS lastLoginAt FROM users WHERE id=? AND status='active'`, [userId]),
    query(`SELECT COUNT(*) AS total,COALESCE(SUM(status='Pending'),0) AS pending,COALESCE(SUM(status='In Progress'),0) AS inProgress,COALESCE(SUM(status IN ('Responded','Resolved')),0) AS responded,COALESCE(SUM(status='Closed'),0) AS closed,COALESCE(SUM(status='Cancelled'),0) AS cancelled FROM contact_inquiries WHERE user_id=?`, [userId]),
    query(`SELECT COUNT(*) AS total FROM contact_inquiries WHERE ${where}`, inquiryParams),
    query(`SELECT id,service AS subject,service,project_brief AS message,project_brief AS originalMessage,status,created_at AS createdAt,updated_at AS updatedAt FROM contact_inquiries WHERE ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`, [...inquiryParams, limit, (page - 1) * limit]),
    query('SELECT id,inquiry_id AS inquiryId,type,title,message,is_read AS isRead,created_at AS createdAt FROM user_notifications WHERE user_id=? ORDER BY created_at DESC LIMIT 20', [userId]),
    query('SELECT id,inquiry_id AS inquiryId,activity_type AS type,summary,created_at AS createdAt FROM user_activity WHERE user_id=? ORDER BY created_at DESC LIMIT 30', [userId]),
    query('SELECT email_notifications AS emailNotifications,inquiry_notifications AS inquiryNotifications,reply_notifications AS replyNotifications,marketing_emails AS marketingEmails FROM user_settings WHERE user_id=?', [userId]),
    query("SHOW COLUMNS FROM contact_inquiries LIKE 'status'"),
  ])
  const profile = results[0][0][0]
  if (!profile) return res.status(401).json({ success: false, message: 'Your session is no longer valid. Please sign in again.' })
  const statusColumn = results[7][0][0]
  const statuses = [...String(statusColumn?.Type || '').matchAll(/'([^']+)'/g)].map((match) => match[1])
  return res.json({ success: true, data: {
    profile,
    summary: results[1][0][0],
    inquiries: results[3][0],
    totalInquiries: Number(results[2][0][0]?.total || 0),
    notifications: results[4][0],
    activity: results[5][0],
    settings: results[6][0][0],
    statuses,
  }, page, limit })
}

export const updateMyProfile = async (req, res) => {
  const { name, phone, companyName = '', address = '', city = '', state = '', country = '', postalCode = '', profileImage = null } = req.body
  const [result] = await query(`UPDATE users SET name = ?, phone = ?, company_name = ?, address = ?, city = ?, state = ?, country = ?, postal_code = ?, profile_image = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ? AND status = 'active'`, [name, phone, companyName, address, city, state, country, postalCode, profileImage || null, req.user.id])
  if (!result.affectedRows) return res.status(401).json({ success: false, message: 'Your account is unavailable. Please sign in again.' })
  await recordActivity(req.user.id, null, 'profile_updated', 'You updated your profile.')
  await createUserNotification(req.user.id, null, 'profile_updated', 'Profile updated', 'Your profile information was updated successfully.')
  return res.json({ success: true, message: 'Profile updated successfully.' })
}

export const getMySettings = async (req, res) => {
  await query('INSERT IGNORE INTO user_settings (user_id) VALUES (?)', [req.user.id])
  const [[settings]] = await query(`SELECT email_notifications AS emailNotifications, inquiry_notifications AS inquiryNotifications,
    reply_notifications AS replyNotifications, marketing_emails AS marketingEmails FROM user_settings WHERE user_id = ?`, [req.user.id])
  return res.json({ success: true, data: settings })
}

export const updateMySettings = async (req, res) => {
  const { emailNotifications, inquiryNotifications, replyNotifications, marketingEmails } = req.body
  await query(`INSERT INTO user_settings (user_id, email_notifications, inquiry_notifications, reply_notifications, marketing_emails)
    VALUES (?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE email_notifications = VALUES(email_notifications), inquiry_notifications = VALUES(inquiry_notifications),
    reply_notifications = VALUES(reply_notifications), marketing_emails = VALUES(marketing_emails)`,
  [req.user.id, emailNotifications, inquiryNotifications, replyNotifications, marketingEmails])
  await recordActivity(req.user.id, null, 'settings_updated', 'You updated your notification preferences.')
  return res.json({ success: true, message: 'Notification preferences saved.' })
}

export const listMyNotifications = async (req, res) => {
  const page = Math.min(Math.max(Number(req.query.page) || 1, 1), 10000)
  const limit = Math.min(Math.max(Number(req.query.limit) || 20, 1), 100)
  const [[{ total }]] = await query('SELECT COUNT(*) AS total FROM user_notifications WHERE user_id = ?', [req.user.id])
  const [rows] = await query(`SELECT id, inquiry_id AS inquiryId, type, title, message, is_read AS isRead, created_at AS createdAt
    FROM user_notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?`, [req.user.id, limit, (page - 1) * limit])
  return res.json({ success: true, data: rows, page, limit, total })
}

export const markNotificationRead = async (req, res) => {
  const [result] = await query('UPDATE user_notifications SET is_read = 1 WHERE id = ? AND user_id = ?', [req.params.id, req.user.id])
  if (!result.affectedRows) return res.status(404).json({ success: false, message: 'Notification not found.' })
  return res.json({ success: true, message: 'Notification marked as read.' })
}

export const markAllNotificationsRead = async (req, res) => {
  await query('UPDATE user_notifications SET is_read = 1 WHERE user_id = ? AND is_read = 0', [req.user.id])
  return res.json({ success: true, message: 'All notifications marked as read.' })
}

export const listMyActivity = async (req, res) => {
  const [rows] = await query(`SELECT id, inquiry_id AS inquiryId, activity_type AS type, summary, created_at AS createdAt
    FROM user_activity WHERE user_id = ? ORDER BY created_at DESC LIMIT 30`, [req.user.id])
  return res.json({ success: true, data: rows })
}

export const deactivateMyAccount = async (req, res) => {
  const [result] = await query(`UPDATE users SET status = 'disabled', session_version = session_version + 1, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND status = 'active'`, [req.user.id])
  if (!result.affectedRows) return res.status(404).json({ success: false, message: 'Account not found or already disabled.' })
  return res.json({ success: true, message: 'Your account has been deactivated. Existing inquiry records have been retained.' })
}
