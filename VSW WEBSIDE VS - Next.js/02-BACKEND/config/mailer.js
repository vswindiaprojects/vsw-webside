import nodemailer from 'nodemailer'

export const sendMail = async (message) => {
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
