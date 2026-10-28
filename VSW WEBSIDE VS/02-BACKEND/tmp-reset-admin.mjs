import 'dotenv/config'
import bcrypt from 'bcryptjs'
import { query, closePool } from './config/db.js'

const password = 'VswAdmin@2026!'
const hash = await bcrypt.hash(password, 12)
const emails = ['vswindiaprojects@gmail.com', 'admin@vswsolutions.com']

for (const email of emails) {
  const [result] = await query('UPDATE admins SET password = ? WHERE email = ?', [hash, email])
  console.log(`${email} -> ${result.affectedRows} row(s) updated`)
}

// verify
for (const email of emails) {
  const [rows] = await query('SELECT password FROM admins WHERE email = ?', [email])
  const ok = rows[0] ? await bcrypt.compare(password, rows[0].password) : false
  console.log(`${email} verify: ${ok ? 'OK' : 'FAILED'}`)
}

await closePool()
