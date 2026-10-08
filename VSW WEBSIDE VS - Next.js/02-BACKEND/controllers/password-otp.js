import bcrypt from 'bcryptjs'
import { createHmac, randomInt, timingSafeEqual } from 'node:crypto'
import { getConnection, query } from '../config/db.js'
import { sendMail } from '../config/mailer.js'
import { createUserNotification, recordActivity } from './dashboard-mysql.js'

const OTP_LIFETIME_MINUTES = 10
const OTP_MAX_ATTEMPTS = 5
const genericRequestMessage = 'If an active account matches that email, a verification code will be sent shortly.'
const invalidCodeMessage = 'The verification code is invalid or expired. Request a new code and try again.'
const otpDigest = (userId, otp) => createHmac('sha256', process.env.JWT_SECRET).update(`${userId}:${otp}`).digest()

const issueOtp = async (user) => {
  const otp = String(randomInt(0, 1_000_000)).padStart(6, '0')
  const digest = otpDigest(user.id, otp).toString('hex')
  await query(`INSERT INTO password_reset_otps (user_id, code_hash, attempts, expires_at, created_at)
    VALUES (?, ?, 0, DATE_ADD(UTC_TIMESTAMP(), INTERVAL ${OTP_LIFETIME_MINUTES} MINUTE), UTC_TIMESTAMP())
    ON DUPLICATE KEY UPDATE code_hash = VALUES(code_hash), attempts = 0,
      expires_at = DATE_ADD(UTC_TIMESTAMP(), INTERVAL ${OTP_LIFETIME_MINUTES} MINUTE), created_at = UTC_TIMESTAMP()`, [user.id, digest])
  const name = String(user.name || 'VSW client').replace(/[&<>"']/g, (c) => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' })[c])
  await sendMail({
    to: user.email,
    subject: 'Your VSW password verification code',
    text: `Hello ${user.name},\n\nYour VSW verification code is ${otp}. It expires in ${OTP_LIFETIME_MINUTES} minutes. If you did not request a password change, you can ignore this email.`,
    html: `<div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;padding:28px;color:#142333;border:1px solid #e3e7e6"><p style="color:#9a7942;font-size:11px;letter-spacing:2px;font-weight:bold">VSW SOLUTIONS</p><h1 style="font-size:23px">Password verification</h1><p>Hello ${name},</p><p>Use this one-time code to continue:</p><p style="margin:26px 0;padding:18px;background:#f4f6f4;text-align:center;font-size:30px;font-weight:bold;letter-spacing:9px;color:#07131f">${otp}</p><p>This code expires in ${OTP_LIFETIME_MINUTES} minutes and can be used once. If you did not request this, ignore this email.</p></div>`,
  })
}

const findActiveUserByEmail = async (email) => {
  const [users] = await query('SELECT id, name, email FROM users WHERE email = ? AND status = \'active\' LIMIT 1', [email])
  return users[0]
}

export const requestResetOtp = async (req, res) => {
  let user
  try { user = await findActiveUserByEmail(req.body.email) }
  catch (error) { console.error('[password-otp] Could not look up reset request:', { code: error.code || 'UNEXPECTED_ERROR' }) }
  if (user) setImmediate(() => { void issueOtp(user).catch((error) => console.error('[password-otp] Could not send reset code:', { code: error.code || 'MAIL_OR_DATABASE_ERROR' })) })
  return res.json({ success: true, message: genericRequestMessage })
}

export const resetPasswordWithOtp = async (req, res) => {
  const { email, otp, password } = req.body
  const user = await findActiveUserByEmail(email)
  if (!user) return res.status(400).json({ success: false, message: invalidCodeMessage })
  return updatePasswordUsingOtp(user.id, otp, password, res)
}

export const requestChangeOtp = async (req, res) => {
  const user = await findActiveUserByEmail(req.user.email)
  if (!user || user.id !== req.user.id) return res.status(401).json({ success: false, message: 'Please sign in again.' })
  try {
    await issueOtp(user)
    return res.json({ success: true, message: `A verification code was sent to ${maskEmail(user.email)}.` })
  } catch (error) {
    console.error('[password-otp] Could not send password change code:', { code: error.code || 'MAIL_ERROR' })
    return res.status(503).json({ success: false, message: 'We could not send the verification code right now. Please try again later.' })
  }
}

export const changePasswordWithOtp = async (req, res) => {
  const [rows] = await query('SELECT password_hash FROM users WHERE id = ? AND status = \'active\'', [req.user.id])
  if (!rows[0] || !(await bcrypt.compare(req.body.currentPassword, rows[0].password_hash))) {
    return res.status(400).json({ success: false, message: 'Current password is incorrect.' })
  }
  return updatePasswordUsingOtp(req.user.id, req.body.otp, req.body.password, res)
}

const updatePasswordUsingOtp = async (userId, otp, password, res) => {
  const connection = await getConnection()
  try {
    await connection.beginTransaction()
    const [rows] = await connection.execute(`SELECT code_hash, attempts, expires_at,
      (expires_at > UTC_TIMESTAMP()) AS is_valid_time
      FROM password_reset_otps WHERE user_id = ? FOR UPDATE`, [userId])
    const record = rows[0]
    const submittedDigest = otpDigest(userId, otp)
    const savedDigest = record?.code_hash ? Buffer.from(record.code_hash, 'hex') : Buffer.alloc(32)
    const codeMatches = record && savedDigest.length === submittedDigest.length && timingSafeEqual(savedDigest, submittedDigest)
    if (!record || !record.is_valid_time || record.attempts >= OTP_MAX_ATTEMPTS || !codeMatches) {
      if (record && (record.attempts >= OTP_MAX_ATTEMPTS || !record.is_valid_time)) {
        await connection.execute('DELETE FROM password_reset_otps WHERE user_id = ?', [userId])
      } else if (record) {
        await connection.execute('UPDATE password_reset_otps SET attempts = attempts + 1 WHERE user_id = ?', [userId])
      }
      await connection.commit()
      return res.status(400).json({ success: false, message: invalidCodeMessage })
    }
    const passwordHash = await bcrypt.hash(password, 12)
    const [result] = await connection.execute('UPDATE users SET password_hash = ?, session_version = session_version + 1, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND status = \'active\'', [passwordHash, userId])
    if (!result.affectedRows) throw new Error('Active account not found while changing password.')
    await connection.execute('DELETE FROM password_reset_otps WHERE user_id = ?', [userId])
    await connection.commit()
    await recordActivity(userId, null, 'password_changed', 'You changed your account password.')
    await createUserNotification(userId, null, 'password_changed', 'Password changed', 'Your account password was updated successfully.')
    return res.json({ success: true, message: 'Password updated successfully. Please sign in with your new password.' })
  } catch (error) {
    await connection.rollback()
    throw error
  } finally {
    connection.release()
  }
}

const maskEmail = (email) => {
  const [name, domain] = email.split('@')
  return `${name.slice(0, 1)}${'*'.repeat(Math.max(2, name.length - 1))}@${domain}`
}
