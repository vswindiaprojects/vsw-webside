import 'dotenv/config'
import { query, closePool } from './config/db.js'

const [tables] = await query(
  "SELECT table_name AS t FROM information_schema.tables WHERE table_schema = DATABASE() ORDER BY table_name"
)
for (const { t } of tables) {
  const [cols] = await query(
    "SELECT column_name AS c FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = ? AND (column_name LIKE '%email%' OR column_name LIKE '%mail%')",
    [t]
  )
  if (!cols.length) continue
  const select = cols.map((x) => `\`${x.c}\``).join(', ')
  const [rows] = await query(`SELECT id, ${select} FROM \`${t}\` LIMIT 5`).catch(() => [[]])
  console.log(`\n${t} (${cols.map((x) => x.c).join(', ')}):`)
  for (const r of rows) console.log('  ', JSON.stringify(r))
}
await closePool()
