import jwt from 'jsonwebtoken'
import { query } from '../config/db.js'

export const requireAuth = async (req, res, next) => {
  const token = req.headers.authorization?.startsWith('Bearer ') ? req.headers.authorization.slice(7) : null
  if (!token) return res.status(401).json({ success: false, message: 'Authentication required.' })
  let claims
  try {
    claims = jwt.verify(token, process.env.JWT_SECRET)
  } catch {
    return res.status(401).json({ success: false, message: 'Invalid or expired token.' })
  }
  if (!['admin','super_admin','manager','editor','support_staff'].includes(String(claims.role || '').toLowerCase())) return res.status(403).json({ success: false, message: 'Administrator access required.' })
  try {
    const [[admin]] = await query('SELECT id,name,email,role,session_version AS sessionVersion,(updated_at > FROM_UNIXTIME(?)) AS sessionInvalidated FROM admins WHERE id=?', [Number(claims.iat || 0), claims.id])
    if (!admin) return res.status(401).json({ success: false, message: 'Administrator account is no longer available. Sign in again.' })
    if (Number(admin.sessionInvalidated) || Number(claims.sessionVersion) !== Number(admin.sessionVersion)) return res.status(401).json({ success: false, message: 'Administrator session is no longer valid. Sign in again.' })
    const role = String(admin.role || '').toLowerCase()
    if (!['admin','super_admin','manager','editor','support_staff'].includes(role)) return res.status(403).json({ success: false, message: 'Administrator access required.' })
    req.user = admin
    next()
  } catch (error) {
    next(error)
  }
}

const permissions = {
  super_admin: ['*'],
  admin: ['dashboard','users','inquiries','projects','services','company','content','media','documents','contactMessages','notifications','reports','settings'],
  manager: ['inquiries','projects'],
  editor: ['services','content','media'],
  support_staff: ['inquiries','contactMessages'],
}
export const requirePermission = (permission) => (req,res,next) => {
  const role=String(req.user?.role||'').toLowerCase()
  if (!(permissions[role]||[]).some((item)=>item==='*'||item===permission)) return res.status(403).json({success:false,message:'Your admin role does not have permission for this action.'})
  next()
}

export const requireCustomer = async (req, res, next) => {
  const token = req.headers.authorization?.startsWith('Bearer ') ? req.headers.authorization.slice(7) : null
  if (!token) return res.status(401).json({ success: false, message: 'Authentication required.' })
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET)
  } catch {
    return res.status(401).json({ success: false, message: 'Invalid or expired token.' })
  }
  if (req.user.role !== 'USER') return res.status(403).json({ success: false, message: 'Customer access required.' })
  try {
    const [users] = await query('SELECT id,email,name,session_version AS sessionVersion FROM users WHERE id = ? AND status = \'active\'', [req.user.id])
    if (!users[0]) return res.status(401).json({ success: false, message: 'Your session is no longer valid. Please sign in again.' })
    if (Number(req.user.sessionVersion) !== Number(users[0].sessionVersion)) return res.status(401).json({ success: false, message: 'Your session is no longer valid. Please sign in again.' })
    req.user.email = users[0].email
    req.user.name = users[0].name
    return next()
  } catch (error) { return next(error) }
}
