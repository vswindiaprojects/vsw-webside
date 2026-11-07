import { query } from '../config/db.js'

const MAX_REVIEWS = 60

const publicReview = (row) => ({
  id: row.id,
  name: row.name,
  company: row.company || '',
  rating: Number(row.rating) || 5,
  message: row.message,
  createdAt: row.createdAt,
})

export const listPublicReviews = async (_req, res) => {
  const [rows] = await query(
    "SELECT id,name,company,rating,message,created_at AS createdAt FROM reviews WHERE status='approved' ORDER BY created_at DESC, id DESC LIMIT ?",
    [MAX_REVIEWS],
  )
  const total = rows.length
  const average = total ? Math.round((rows.reduce((sum, row) => sum + (Number(row.rating) || 0), 0) / total) * 10) / 10 : 0
  res.set('Cache-Control', 'no-store')
  res.json({ success: true, data: { reviews: rows.map(publicReview), total, average } })
}

export const createReview = async (req, res) => {
  const { name, company = '', rating, message } = req.body
  const [saved] = await query(
    "INSERT INTO reviews(name,company,rating,message,status) VALUES(?,?,?,?,'approved')",
    [name.trim(), String(company || '').trim(), Number(rating), message.trim()],
  )
  const [rows] = await query(
    'SELECT id,name,company,rating,message,created_at AS createdAt FROM reviews WHERE id=?',
    [saved.insertId],
  )
  res.status(201).json({ success: true, message: 'Thank you! Your review has been published.', data: publicReview(rows[0]) })
}
