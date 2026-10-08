import 'dotenv/config'
import bcrypt from 'bcryptjs'
import { query, closePool } from '../config/db.js'

const email = process.env.ADMIN_EMAIL
const password = process.env.ADMIN_PASSWORD
if (!email || !password) throw new Error('ADMIN_EMAIL and ADMIN_PASSWORD are required in backend/.env')
const hash = await bcrypt.hash(password, 12)
await query('INSERT INTO admins (name, email, password, role) VALUES (?, ?, ?, \'super_admin\') ON DUPLICATE KEY UPDATE name = VALUES(name), password = VALUES(password), role = \'super_admin\'', ['VSW Admin', email, hash])
console.log(`Admin seeded for ${email}`)
await closePool()
