import 'dotenv/config'
import bcrypt from 'bcryptjs'
import { query, closePool } from './config/db.js'

const KEEP = 1
const MERGE = 13
const TARGET_EMAIL = 'vswindiaprojects@gmail.com'
const PASSWORD = 'VswAdmin@2026!'

const refs = [
  ['admin_activity_logs', 'admin_id'],
  ['admin_notifications', 'admin_id'],
  ['client_logo_configuration', 'updated_by'],
  ['contact_inquiries', 'assigned_admin_id'],
  ['documents', 'uploaded_by'],
  ['inquiry_admin_notes', 'admin_id'],
  ['media_library', 'uploaded_by'],
  ['project_counter_configuration', 'updated_by'],
  ['theme_configuration', 'updated_by'],
  ['theme_presets', 'created_by'],
  ['theme_versions', 'changed_by'],
  ['website_content', 'updated_by'],
]

const [keeper] = await query('SELECT id, email FROM admins WHERE id = ?', [KEEP])
if (!keeper[0]) throw new Error(`Admin id ${KEEP} not found`)
console.log('keeping:', JSON.stringify(keeper[0]))

const [merger] = await query('SELECT id, email FROM admins WHERE id = ?', [MERGE])
console.log('merging:', merger[0] ? JSON.stringify(merger[0]) : 'not present')

if (merger[0]) {
  for (const [table, column] of refs) {
    const [result] = await query(`UPDATE \`${table}\` SET \`${column}\` = ? WHERE \`${column}\` = ?`, [KEEP, MERGE])
    if (result.affectedRows) console.log(`  ${table}.${column}: ${result.affectedRows} row(s) reassigned`)
  }
  const [del] = await query('DELETE FROM admins WHERE id = ?', [MERGE])
  console.log('deleted old admin rows:', del.affectedRows)
}

const hash = await bcrypt.hash(PASSWORD, 12)
const [upd] = await query('UPDATE admins SET email = ?, password = ?, name = ? WHERE id = ?', [TARGET_EMAIL, hash, 'VSW Admin', KEEP])
console.log('updated keeper rows:', upd.affectedRows)

const [final] = await query('SELECT id, name, email, role FROM admins ORDER BY id')
console.log('final admins:', JSON.stringify(final, null, 1))

const [check] = await query('SELECT password FROM admins WHERE email = ?', [TARGET_EMAIL])
console.log('password verify:', await bcrypt.compare(PASSWORD, check[0].password) ? 'OK' : 'FAILED')

await closePool()
