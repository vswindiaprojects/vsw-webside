import 'dotenv/config'
import { query, closePool } from './config/db.js'

const [rows] = await query('SELECT id, draft_config, published_config FROM client_logo_configuration WHERE id = 1')
const cfg = rows[0]
const parse = (v) => (typeof v === 'string' ? JSON.parse(v) : v)
const draft = parse(cfg.draft_config)
const list = Array.isArray(draft?.clients) ? draft.clients : (draft?.logos || draft?.items || [])
console.log('keys:', Object.keys(draft || {}))
console.log('count:', Array.isArray(list) ? list.length : 'n/a')
const matches = (Array.isArray(list) ? list : []).filter((c) => /anj/i.test(JSON.stringify(c)))
console.log('matches anj:', JSON.stringify(matches, null, 1))
console.log('first 3:', JSON.stringify((Array.isArray(list) ? list : []).slice(0, 3), null, 1))
await closePool()
