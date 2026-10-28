import { query } from '../config/db.js'

export const recordAdminEvent = async (adminId, eventType, route, method, statusCode, ipAddress = '') => {
  try {
    await query(
      'INSERT INTO admin_activity_logs (admin_id,event_type,route,method,status_code,ip_address) VALUES (?,?,?,?,?,?)',
      [adminId || null, eventType, route.slice(0, 255), method.slice(0, 10), statusCode, String(ipAddress).slice(0, 45)],
    )
  } catch (error) {
    console.error('[admin-audit] Could not write activity record:', { code: error.code })
  }
}

const mutatingMethods = new Set(['POST', 'PUT', 'PATCH', 'DELETE'])
export const auditAdminMutation = (req, res, next) => {
  if (mutatingMethods.has(req.method) && req.user?.id) {
    res.once('finish', () => {
      if (res.statusCode < 400) {
        const route = `${req.baseUrl}${req.path}`
        void recordAdminEvent(req.user.id, `${req.method.toLowerCase()}_success`, route, req.method, res.statusCode, req.ip)
      }
    })
  }
  next()
}
