import nodemailer from 'nodemailer'

const relayUrl = () => process.env.MAIL_RELAY_URL
const relayKey = () => process.env.MAIL_RELAY_SECRET

const sendViaRelay = async ({ to, subject, text = '', html = '' }) => {
  const url = relayUrl()
  const key = relayKey()
  if (!url || !key) return null
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 25000)
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-vsw-relay-key': key },
      body: JSON.stringify({ to, subject, text, html }),
      signal: controller.signal,
    })
    clearTimeout(timer)
    if (!response.ok) {
      const detail = await response.text().catch(() => '')
      const error = new Error(`Mail relay rejected (${response.status}): ${detail.slice(0, 200)}`)
      error.code = 'MAIL_RELAY_ERROR'
      throw error
    }
    return await response.json()
  } catch (error) {
    clearTimeout(timer)
    throw error
  }
}

const sendViaSmtp = async (message) => {
  const { SMTP_HOST, SMTP_PORT, SMTP_SECURE, SMTP_USER, SMTP_PASSWORD, SMTP_FROM_EMAIL } = process.env
  const missingConfig = ['SMTP_HOST', 'SMTP_USER', 'SMTP_PASSWORD', 'SMTP_FROM_EMAIL'].filter((key) => !process.env[key])
  if (missingConfig.length) throw new Error(`SMTP is not configured. Missing: ${missingConfig.join(', ')}`)

  const transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT) || 587,
    secure: SMTP_SECURE === 'true',
    auth: { user: SMTP_USER, pass: SMTP_PASSWORD },
  })
  return transporter.sendMail({ from: { name: 'VSW Solutions Website', address: SMTP_FROM_EMAIL }, ...message })
}

export const sendMail = async (message) => {
  if (relayUrl() && relayKey()) return sendViaRelay(message)
  return sendViaSmtp(message)
}