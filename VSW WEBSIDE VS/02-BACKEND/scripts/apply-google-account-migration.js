import 'dotenv/config'
import { closePool, query } from '../config/db.js'

try {
  const [columns] = await query("SELECT COUNT(*) AS total FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='users' AND COLUMN_NAME='google_sub'")
  if (Number(columns[0].total) === 0) {
    await query('ALTER TABLE users ADD COLUMN google_sub VARCHAR(255) NULL AFTER profile_image')
    console.log('Added users.google_sub.')
  } else console.log('users.google_sub already exists.')
  const [indexes] = await query("SELECT COUNT(*) AS total FROM information_schema.STATISTICS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='users' AND INDEX_NAME='uq_users_google_sub'")
  if (Number(indexes[0].total) === 0) {
    await query('ALTER TABLE users ADD UNIQUE INDEX uq_users_google_sub (google_sub)')
    console.log('Added unique Google account index.')
  } else console.log('Google subject index already exists.')
} finally {
  await closePool()
}
