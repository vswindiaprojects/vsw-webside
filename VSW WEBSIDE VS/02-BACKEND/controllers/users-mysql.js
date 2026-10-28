import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { randomBytes } from 'node:crypto'
import { query } from '../config/db.js'
import { OAuth2Client } from 'google-auth-library'

const publicUser = ({ id, name, email, phone, company_name: companyName = '', address = '', city = '', state = '', country = '', postal_code: postalCode = '', profile_image: profileImage = null, role, status, created_at: createdAt, last_login_at: lastLoginAt = null }) => ({ id, name, email, phone, companyName, address, city, state, country, postalCode, profileImage, role, status, createdAt, lastLoginAt })
const dummyPasswordHash = bcrypt.hash(randomBytes(32).toString('hex'), 12)
const issueUserToken = (user) => jwt.sign({ id: user.id, role: user.role, sessionVersion: Number(user.session_version) || 0 }, process.env.JWT_SECRET, { expiresIn: '8h' })
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID)

export const loginUserWithGoogle = async (req, res) => {
  const clientId = process.env.GOOGLE_CLIENT_ID
  if (!clientId) return res.status(503).json({ success: false, message: 'Google sign-in is not configured. Set GOOGLE_CLIENT_ID on the backend and VITE_GOOGLE_CLIENT_ID on the frontend.' })
  let profile
  try {
    const ticket = await googleClient.verifyIdToken({ idToken: req.body.credential, audience: clientId })
    profile = ticket.getPayload()
  } catch {
    return res.status(401).json({ success: false, message: 'Google could not verify this sign-in. Please try again.' })
  }
  const googleSub = String(profile?.sub || '')
  const email = String(profile?.email || '').trim().toLowerCase()
  const name = String(profile?.name || '').trim().slice(0, 120)
  if (!googleSub || !email || !name || profile.email_verified !== true) return res.status(401).json({ success: false, message: 'Use a Google account with a verified email address.' })

  let [[user]] = await query('SELECT id,name,email,phone,profile_image,role,status,created_at,last_login_at,session_version,google_sub AS googleSub FROM users WHERE google_sub=? OR email=? LIMIT 1', [googleSub, email])
  if (user?.googleSub && user.googleSub !== googleSub) return res.status(409).json({ success: false, message: 'This email is already linked to a different Google account. Sign in using the original method.' })
  if (user && !user.googleSub) {
    try {
      await query('UPDATE users SET google_sub=? WHERE id=? AND google_sub IS NULL', [googleSub, user.id])
      user.googleSub = googleSub
    } catch (error) {
      if (error.code === 'ER_DUP_ENTRY') return res.status(409).json({ success: false, message: 'This Google account is already linked to another user.' })
      throw error
    }
  }
  if (user?.status === 'disabled') return res.status(403).json({ success: false, message: 'This account is disabled. Contact VSW Solutions for help.' })

  if (!user) {
    try {
      const randomPasswordHash = await bcrypt.hash(randomBytes(48).toString('base64url'), 12)
      const [created] = await query("INSERT INTO users (name,email,phone,password_hash,profile_image,google_sub,role,status,last_login_at) VALUES (?,?, '', ?, ?, ?, 'USER','active',UTC_TIMESTAMP())", [name, email, randomPasswordHash, String(profile.picture || '').slice(0, 500) || null, googleSub])
      const [rows] = await query('SELECT id,name,email,phone,profile_image,role,status,created_at,last_login_at,session_version FROM users WHERE id=?', [created.insertId])
      user = rows[0]
      await query('INSERT IGNORE INTO user_settings (user_id) VALUES (?)', [user.id])
      await query("INSERT INTO admin_notifications(admin_id,type,title,message,entity_type,entity_id) VALUES(NULL,'user_registered','New user registered',CONCAT(?, ' created an account with Google.'),'user',?)", [name, user.id])
    } catch (error) {
      if (error.code !== 'ER_DUP_ENTRY') throw error
      ;[[user]] = await query('SELECT id,name,email,phone,profile_image,role,status,created_at,last_login_at,session_version,google_sub AS googleSub FROM users WHERE google_sub=? OR email=? LIMIT 1', [googleSub, email])
      if (!user || (user.googleSub && user.googleSub !== googleSub)) return res.status(409).json({ success: false, message: 'This email is already linked to a different Google account. Sign in using the original method.' })
      if (!user.googleSub) {
        await query('UPDATE users SET google_sub=? WHERE id=? AND google_sub IS NULL', [googleSub, user.id])
        user.googleSub = googleSub
      }
    }
  } else {
    await query('UPDATE users SET last_login_at=UTC_TIMESTAMP(), profile_image=COALESCE(profile_image, ?) WHERE id=?', [String(profile.picture || '').slice(0, 500) || null, user.id])
    user.last_login_at = new Date()
  }
  if (user.status !== 'active') return res.status(403).json({ success: false, message: 'This account is unavailable. Contact VSW Solutions for help.' })
  return res.json({ success: true, data: publicUser(user), token: issueUserToken(user) })
}

export const registerUser = async (req, res) => {
  const { name, email, phone, password } = req.body
  const passwordHash = await bcrypt.hash(password, 12)
  try {
    const [result] = await query('INSERT INTO users (name, email, phone, password_hash, role) VALUES (?, ?, ?, ?, \'USER\')', [name, email, phone, passwordHash])
    await query('INSERT INTO user_settings (user_id) VALUES (?)', [result.insertId])
    await query("INSERT INTO admin_notifications(admin_id,type,title,message,entity_type,entity_id) VALUES(NULL,'user_registered','New user registered',CONCAT(?, ' created a website account.'),'user',?)", [name, result.insertId])
    const [rows] = await query('SELECT id, name, email, phone, role, status, created_at, last_login_at FROM users WHERE id = ?', [result.insertId])
    return res.status(201).json({ success: true, message: 'Registration successful. Please sign in.', data: publicUser(rows[0]) })
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') return res.status(409).json({ success: false, message: 'An account with this email already exists. Please sign in.' })
    throw error
  }
}

export const loginUser = async (req, res) => {
  const [rows] = await query('SELECT id, name, email, phone, password_hash, role, status, created_at, session_version FROM users WHERE email = ?', [req.body.email])
  const user = rows[0]
  const hash = user?.password_hash || await dummyPasswordHash
  const passwordMatches = await bcrypt.compare(req.body.password, hash)
  if (!user || user.status !== 'active' || !passwordMatches) {
    return res.status(401).json({ success: false, message: 'Invalid email or password.' })
  }
  await query('UPDATE users SET last_login_at = UTC_TIMESTAMP() WHERE id = ?', [user.id])
  user.last_login_at = new Date()
  return res.json({ success: true, data: publicUser(user), token: issueUserToken(user) })
}

export const getMyProfile = async (req, res) => {
  const [rows] = await query(`SELECT id, name, email, phone, company_name, address, city, state, country, postal_code, profile_image, role, status, created_at, last_login_at
    FROM users WHERE id = ? AND status = 'active'`, [req.user.id])
  if (!rows[0]) return res.status(401).json({ success: false, message: 'Your session is no longer valid. Please sign in again.' })
  return res.json({ success: true, data: publicUser(rows[0]) })
}

export const logoutUser = async (req, res) => {
  await query('UPDATE users SET session_version = session_version + 1 WHERE id = ?', [req.user.id])
  return res.json({ success: true, message: 'Logged out successfully.' })
}

export const listMyInquiries = async (req, res) => {
  const page = Math.min(Math.max(Number(req.query.page) || 1, 1), 10000)
  const limit = Math.min(Math.max(Number(req.query.limit) || 10, 1), 50)
  const search = String(req.query.search || '').trim().slice(0, 120)
  const status = String(req.query.status || '').trim()
  const filters = ['user_id = ?']
  const params = [req.user.id]
  if (search) { filters.push('(service LIKE ? OR project_brief LIKE ? OR CONCAT(\'INQ-\', LPAD(id, 5, \'0\')) LIKE ?)'); params.push(`%${search}%`, `%${search}%`, `%${search}%`) }
  if (status) { filters.push('status = ?'); params.push(status) }
  const where = filters.join(' AND ')
  const [[{ total }]] = await query(`SELECT COUNT(*) AS total FROM contact_inquiries WHERE ${where}`, params)
  const [rows] = await query(`SELECT id, service AS subject, service, project_brief AS message, project_brief AS originalMessage,
    status, created_at AS createdAt, updated_at AS updatedAt FROM contact_inquiries WHERE ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`, [...params, limit, (page - 1) * limit])
  return res.json({ success: true, data: rows, page, limit, total })
}

export const listUsers = async (req, res) => {
  const page = Math.min(Math.max(Number(req.query.page) || 1, 1), 10000)
  const limit = Math.min(Math.max(Number(req.query.limit) || 100, 1), 100)
  const [count] = await query('SELECT COUNT(*) AS total FROM users')
  const [rows] = await query('SELECT id, name, email, phone, role, status, created_at AS createdAt FROM users ORDER BY created_at DESC LIMIT ? OFFSET ?', [limit, (page - 1) * limit])
  return res.json({ success: true, data: rows, page, limit, total: count[0].total })
}

export const updateUserStatus = async (req, res) => {
  const [result] = await query('UPDATE users SET status = ?, session_version = session_version + 1, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [req.body.status, req.params.id])
  if (!result.affectedRows) return res.status(404).json({ success: false, message: 'User not found.' })
  return res.json({ success: true, message: 'User status updated.' })
}
