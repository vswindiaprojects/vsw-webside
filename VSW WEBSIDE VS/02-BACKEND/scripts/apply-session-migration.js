import 'dotenv/config'
import { closePool, query } from '../config/db.js'

const sessionColumns = [
  ['users', 'last_login_at'],
  ['admins', 'updated_at'],
]

try {
  for (const [table, afterColumn] of sessionColumns) {
    const [rows] = await query(
      `SELECT COUNT(*) AS columnCount FROM information_schema.COLUMNS
       WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = 'session_version'`,
      [table],
    )
    if (Number(rows[0].columnCount) === 0) {
      await query(`ALTER TABLE ${table} ADD COLUMN session_version INT UNSIGNED NOT NULL DEFAULT 0 AFTER ${afterColumn}`)
      console.log(`Added ${table}.session_version.`)
    } else {
      console.log(`${table}.session_version already exists.`)
    }
  }
  const inquiryIndexes = [
    ['idx_inquiries_user_created', 'user_id, created_at'],
    ['idx_inquiries_user_status_created', 'user_id, status, created_at'],
  ]
  for (const [indexName, columns] of inquiryIndexes) {
    const [rows] = await query(
      `SELECT COUNT(*) AS indexCount FROM information_schema.STATISTICS
       WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'contact_inquiries' AND INDEX_NAME = ?`,
      [indexName],
    )
    if (Number(rows[0].indexCount) === 0) {
      await query(`ALTER TABLE contact_inquiries ADD INDEX ${indexName} (${columns})`)
      console.log(`Added ${indexName}.`)
    } else {
      console.log(`${indexName} already exists.`)
    }
  }
} finally {
  await closePool()
}
