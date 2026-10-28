import 'dotenv/config'
import { query, closePool } from './config/db.js'

const [fks] = await query(
  `SELECT table_name AS t, column_name AS c, constraint_name AS n, referenced_table_name AS ref
   FROM information_schema.key_column_usage
   WHERE table_schema = DATABASE() AND referenced_table_name = 'admins'`
)
console.log('FKs referencing admins:', JSON.stringify(fks, null, 1))

const [counts] = await query('SELECT (SELECT COUNT(*) FROM project_revisions) AS pr').catch(() => [null])
console.log('probe:', JSON.stringify(counts))

const [admins] = await query('SELECT id, name, email, role, created_at FROM admins ORDER BY id')
console.log('admins:', JSON.stringify(admins, null, 1))
await closePool()
