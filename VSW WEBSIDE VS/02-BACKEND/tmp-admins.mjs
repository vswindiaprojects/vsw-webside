import 'dotenv/config'
import { query, closePool } from './config/db.js'

const [rows] = await query('SELECT id, name, email, role, LENGTH(password) AS hashLen, session_version, created_at FROM admins ORDER BY id')
console.log(JSON.stringify(rows, null, 1))
const [users] = await query('SELECT COUNT(*) AS c FROM users')
console.log('client users:', users[0].c)
await closePool()
