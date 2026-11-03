export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ success: false, message: 'Method not allowed.' })

  const { to, subject, text = '', html = '' } = req.body || {}
  if (!to || !subject) return res.status(400).json({ success: false, message: 'Missing to or subject.' })

  // Verify shared relay secret
  const expectedKey = process.env.MAIL_RELAY_SECRET
  const providedKey = req.headers['x-vsw-relay-key']
  if (!expectedKey || providedKey !== expectedKey) {
    return res.status(401).json({ success: false, message: 'Unauthorized relay access.' })
  }

  // Use Gmail SMTP (credentials from Vercel env vars)
  const nodemailer = await import('nodemailer')
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: Number(process.env.SMTP_PORT) || 465,
    secure: process.env.SMTP_SECURE !== 'false',
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD },
  })

  try {
    const info = await transporter.sendMail({
      from: { name: 'VSW Solutions Website', address: process.env.SMTP_FROM_EMAIL || 'vswindiaprojects@gmail.com' },
      to,
      subject,
      text: String(text).slice(0, 20000),
      html: String(html).slice(0, 60000),
    })
    return res.json({ success: true, messageId: info.messageId })
  } catch (error) {
    console.error('[relay] sendMail error', { code: error.code, message: error.message?.slice(0, 200) })
    return res.status(502).json({ success: false, message: 'Could not send email.', code: error.code })
  }
}