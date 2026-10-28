import 'dotenv/config'
import jwt from 'jsonwebtoken'
import { closePool, query } from '../config/db.js'

const baseUrl = process.env.SECURITY_SMOKE_API || 'http://localhost:5001/api'
const passed = []
const assertStatus = async (label, url, expected, options = {}) => {
  const response = await fetch(`${baseUrl}${url}`, options)
  if (response.status !== expected) throw new Error(`${label}: expected HTTP ${expected}, got ${response.status}`)
  return response
}
const bearer = (claims) => ({ headers: { Authorization: `Bearer ${jwt.sign(claims, process.env.JWT_SECRET, { expiresIn: '2m' })}` } })

try {
  await assertStatus('Unauthenticated account request is rejected', '/users/me', 401)
  passed.push('Unauthenticated account request returns 401')
  await assertStatus('Unauthenticated admin request is rejected', '/admin/dashboard', 401)
  passed.push('Unauthenticated admin request returns 401')
  await assertStatus('Customer token cannot access admin API', '/admin/dashboard', 403, bearer({ id: 0, role: 'USER', sessionVersion: 0 }))
  passed.push('Customer token cannot access admin API (403)')

  const fakeEmail = `security-audit-${Date.now()}@example.com`
  const invalidLogin = await assertStatus('Unknown-user login has generic error', '/users/login', 401, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: fakeEmail, password: 'this-is-not-a-real-password' }),
  })
  const loginBody = await invalidLogin.json()
  if (loginBody.message !== 'Invalid email or password.' || /not found|does not exist/i.test(loginBody.message)) throw new Error('Login error reveals account existence.')
  passed.push('Login failure uses a generic message')

  const injection = await assertStatus('Malformed email input is rejected', '/users/login', 400, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: "' OR 1=1 --@example.com", password: 'PasswordLeakProbe-OnlyForAudit' }),
  })
  if (injection.status !== 400) throw new Error('Malformed email validation was not enforced.')
  const validationBody = await injection.text()
  if (validationBody.includes('PasswordLeakProbe-OnlyForAudit') || validationBody.includes('"value"')) throw new Error('Validation response exposed a submitted password.')
  passed.push('Malformed SQL-like login input is rejected by validation')

  const resetRequest = await assertStatus('Password-reset request avoids account enumeration', '/users/password/reset/request', 200, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: fakeEmail }),
  })
  const resetBody = await resetRequest.json()
  if (!/if an active account matches/i.test(resetBody.message || '')) throw new Error('Password-reset response reveals whether an account exists.')
  passed.push('Password-reset request uses a generic response for unknown email')

  const loginBurst = await Promise.all(Array.from({ length: 15 }, () => fetch(`${baseUrl}/users/login`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'not-an-email', password: 'x' }),
  })))
  if (!loginBurst.some((response) => response.status === 429)) throw new Error('Login rate limiting did not return HTTP 429.')
  passed.push('Login rate limiter returns HTTP 429 after repeated failures')

  const [users] = await query('SELECT id, session_version AS sessionVersion FROM users ORDER BY id LIMIT 1')
  if (users[0]) {
    const user = users[0]
    const token = bearer({ id: user.id, role: 'USER', sessionVersion: Number(user.sessionVersion) })
    const dashboard = await assertStatus('Own account dashboard is available', '/users/me/dashboard?page=1&limit=10', 200, token)
    const dashboardBody = await dashboard.json()
    if (Number(dashboardBody.data?.profile?.id) !== Number(user.id) || !Array.isArray(dashboardBody.data?.inquiries)) throw new Error('Account dashboard returned an unexpected response shape.')
    passed.push('Authenticated account dashboard returns the token owner profile')

    const stale = bearer({ id: user.id, role: 'USER', sessionVersion: Number(user.sessionVersion) + 1 })
    await assertStatus('Stale session version is rejected', '/users/me', 401, stale)
    passed.push('Stale/revoked session version returns 401')

    const [otherUsers] = await query('SELECT id FROM users WHERE id <> ? ORDER BY id LIMIT 1', [user.id])
    if (otherUsers[0]) {
      const [otherInquiries] = await query('SELECT id FROM contact_inquiries WHERE user_id = ? ORDER BY id LIMIT 1', [otherUsers[0].id])
      if (otherInquiries[0]) {
        await assertStatus('Cross-user inquiry ID is hidden', `/users/me/inquiries/${otherInquiries[0].id}`, 404, token)
        passed.push('Cross-user inquiry lookup returns 404')
      } else passed.push('Cross-user inquiry check skipped: no other user inquiry exists')
    } else passed.push('Cross-user inquiry check skipped: only one customer exists')
  } else passed.push('Account dashboard/session checks skipped: no customer account exists')

  console.log(passed.map((item) => `PASS ${item}`).join('\n'))
} finally {
  await closePool()
}
