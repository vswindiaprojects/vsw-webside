import 'dotenv/config'
import bcrypt from 'bcryptjs'
import { query, closePool } from './config/db.js'

const email = 'vswindiaprojects@gmail.com'
const password = 'Vswindia@2026!'

const hash = await bcrypt.hash(password, 12)
const [result] = await query('UPDATE admins SET password=?, session_version=session_version+1 WHERE email=?', [hash, email])
console.log('rows updated:', result.affectedRows)

const [rows] = await query('SELECT id, name, email, role, session_version, password FROM admins WHERE email=?', [email])
for (const row of rows) {
  console.log(JSON.stringify({ id: row.id, email: row.email, role: row.role, sessionVersion: row.session_version }))
  console.log('matches new password:', await bcrypt.compare(password, row.password))
  console.log('matches old password:', await bcrypt.compare('VswAdmin@2026!', row.password))
}

const [others] = await query('SELECT id, email, role FROM admins ORDER BY id')
console.log('admin accounts:', JSON.stringify(others))

await closePool()
