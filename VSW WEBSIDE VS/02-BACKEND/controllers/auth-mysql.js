import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { randomBytes } from 'node:crypto'
import { query } from '../config/db.js'
import { recordAdminEvent } from '../middleware/admin-audit.js'

const safeUser = ({ id, name, email, role, created_at: createdAt }) => ({ id, name, email, role, createdAt })
const dummyPasswordHash = bcrypt.hash(randomBytes(32).toString('hex'), 12)
const issueToken = (user) => jwt.sign({ id: user.id, role: user.role, sessionVersion: Number(user.session_version) || 0 }, process.env.JWT_SECRET, { expiresIn: '8h' })

export const login = async (req, res) => { const [rows] = await query('SELECT id, name, email, password, role, created_at, session_version FROM admins WHERE email = ?', [req.body.email]); const user = rows[0]; const hash = user?.password || await dummyPasswordHash; const passwordMatches = await bcrypt.compare(req.body.password, hash); if (!user || !passwordMatches) return res.status(401).json({ success: false, message: 'Invalid email or password.' }); await recordAdminEvent(user.id, 'login_success', '/api/auth/login', 'POST', 200, req.ip); res.json({ success: true, data: safeUser(user), token: issueToken(user) }) }
export const logout = async (req, res) => { await query('UPDATE admins SET session_version = session_version + 1 WHERE id = ?', [req.user.id]); await recordAdminEvent(req.user.id, 'logout_success', '/api/auth/logout', 'POST', 200, req.ip); res.json({ success: true, message: 'Logged out successfully.' }) }
export const me = async (req, res) => { const [rows] = await query('SELECT id, name, email, role, created_at FROM admins WHERE id = ?', [req.user.id]); if (!rows[0]) return res.status(404).json({ success: false, message: 'Admin not found.' }); res.json({ success: true, data: safeUser(rows[0]) }) }
