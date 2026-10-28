import { query } from '../config/db.js'

const MAX_STATS = 6
const cleanText = (value, max) => String(value ?? '').replace(/[\u0000-\u001f\u007f]/g, ' ').trim().slice(0, max)

const booleanValue = (value, fallback) => {
  if (typeof value === 'boolean') return value
  if (value === 'true') return true
  if (value === 'false') return false
  return fallback
}

const integerValue = (value, min, max, fallback) => {
  const number = Number(value)
  if (!Number.isFinite(number)) return fallback
  return Math.min(max, Math.max(min, Math.round(number)))
}

const colorValue = (value) => {
  const color = cleanText(value, 9).toLowerCase()
  return /^#([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/.test(color) ? color : ''
}

const safeStatId = (value, index) => {
  const id = cleanText(value, 64)
  return /^[A-Za-z0-9_-]{1,64}$/.test(id) ? id : `stat-${index + 1}`
}

const parseJson = (value) => {
  if (value && typeof value === 'object') return value
  try {
    return JSON.parse(value)
  } catch {
    return {}
  }
}

const normalizeStat = (entry, index, usedIds, fallbackLabel = '') => {
  const stat = entry && typeof entry === 'object' && !Array.isArray(entry) ? entry : {}
  let id = safeStatId(stat.id, index)
  while (usedIds.has(id)) id = `${id}-${index + 1}`
  usedIds.add(id)
  return {
    id,
    value: integerValue(stat.value, 0, 1000000, 0),
    suffix: stat.suffix === undefined ? '+' : cleanText(stat.suffix, 4),
    label: cleanText(stat.label, 60) || fallbackLabel || `Metric ${index + 1}`,
    enabled: booleanValue(stat.enabled, false),
  }
}

export const defaultProjectCounterConfig = () => ({
  visible: true,
  eyebrow: 'Our work in numbers',
  heading: 'Delivering with certainty.',
  subheading: 'A growing record of projects delivered across India with accurate data, coordinated execution and dependable follow-through.',
  animationEnabled: true,
  loop: true,
  duration: 2400,
  pause: 2600,
  backgroundStyle: 'navy',
  backgroundColor: '',
  textColor: '',
  accentColor: '',
  decorativeLines: true,
  hoverEffect: true,
  mainStat: { value: 300, suffix: '+', label: 'Projects Completed' },
  stats: [
    { id: 'clients', value: 0, suffix: '+', label: 'Clients Served', enabled: false },
    { id: 'years', value: 0, suffix: '+', label: 'Years of Experience', enabled: false },
    { id: 'cities', value: 0, suffix: '+', label: 'Cities Covered', enabled: false },
  ],
})

export const normalizeProjectCounterConfig = (value) => {
  const source = value && typeof value === 'object' && !Array.isArray(value) ? value : {}
  const fallback = defaultProjectCounterConfig()
  const usedIds = new Set()

  const mainSource = source.mainStat && typeof source.mainStat === 'object' ? source.mainStat : {}
  const mainStat = normalizeStat(
    { ...mainSource, id: 'main', enabled: true },
    0,
    usedIds,
    fallback.mainStat.label,
  )
  const mainSuffix = mainSource.suffix === undefined ? '+' : cleanText(mainSource.suffix, 4)

  const rawStats = Array.isArray(source.stats) ? source.stats.slice(0, MAX_STATS) : fallback.stats
  const stats = rawStats.map((entry, index) => normalizeStat(entry, index, usedIds))

  return {
    visible: booleanValue(source.visible, fallback.visible),
    eyebrow: cleanText(source.eyebrow, 60),
    heading: cleanText(source.heading, 120),
    subheading: cleanText(source.subheading, 240),
    animationEnabled: booleanValue(source.animationEnabled, fallback.animationEnabled),
    loop: booleanValue(source.loop, fallback.loop),
    duration: integerValue(source.duration, 600, 12000, fallback.duration),
    pause: integerValue(source.pause, 0, 20000, fallback.pause),
    backgroundStyle: ['navy', 'light', 'custom'].includes(source.backgroundStyle) ? source.backgroundStyle : fallback.backgroundStyle,
    backgroundColor: colorValue(source.backgroundColor),
    textColor: colorValue(source.textColor),
    accentColor: colorValue(source.accentColor),
    decorativeLines: booleanValue(source.decorativeLines, fallback.decorativeLines),
    hoverEffect: booleanValue(source.hoverEffect, fallback.hoverEffect),
    mainStat: {
      value: mainStat.value,
      suffix: mainSuffix,
      label: cleanText(mainSource.label, 60) || fallback.mainStat.label,
    },
    stats,
  }
}

const readRow = async () => {
  const [[row]] = await query(
    'SELECT draft_config AS draft, published_config AS published, draft_revision AS draftRevision, published_revision AS publishedRevision, updated_by AS updatedBy, updated_at AS updatedAt, published_at AS publishedAt FROM project_counter_configuration WHERE id=1',
  )
  return row || null
}

export const getPublicProjectCounter = async (_req, res) => {
  const [[row]] = await query('SELECT published_config AS published FROM project_counter_configuration WHERE id=1')
  res.set('Cache-Control', 'no-store')
  res.json({ success: true, data: normalizeProjectCounterConfig(parseJson(row?.published)) })
}

export const getAdminProjectCounter = async (_req, res) => {
  const row = await readRow()
  if (!row) {
    const fallback = defaultProjectCounterConfig()
    return res.json({
      success: true,
      data: { draft: fallback, published: fallback, draftRevision: 0, publishedRevision: 0, initialized: false },
    })
  }
  res.json({
    success: true,
    data: {
      draft: normalizeProjectCounterConfig(parseJson(row.draft)),
      published: normalizeProjectCounterConfig(parseJson(row.published)),
      draftRevision: row.draftRevision,
      publishedRevision: row.publishedRevision,
      updatedBy: row.updatedBy,
      updatedAt: row.updatedAt,
      publishedAt: row.publishedAt,
    },
  })
}

export const saveProjectCounterDraft = async (req, res) => {
  const configuration = normalizeProjectCounterConfig(req.body?.configuration ?? req.body)
  const [result] = await query(
    'UPDATE project_counter_configuration SET draft_config=?, draft_revision=draft_revision+1, updated_by=? WHERE id=1',
    [JSON.stringify(configuration), req.user.id],
  )
  if (!result.affectedRows) {
    await query(
      'INSERT INTO project_counter_configuration(id,draft_config,published_config,draft_revision,published_revision,updated_by) VALUES(1,?,?,1,1,?)',
      [JSON.stringify(configuration), JSON.stringify(configuration), req.user.id],
    )
  }
  const [[row]] = await query('SELECT draft_revision AS draftRevision FROM project_counter_configuration WHERE id=1')
  res.json({
    success: true,
    message: 'Project counter draft saved. Preview it, then publish when ready.',
    data: { configuration, draftRevision: row?.draftRevision ?? 1 },
  })
}

export const publishProjectCounter = async (req, res) => {
  const [[row]] = await query(
    'SELECT draft_config AS draft, draft_revision AS draftRevision FROM project_counter_configuration WHERE id=1',
  )
  if (!row) return res.status(503).json({ success: false, message: 'Project counter settings are not initialized. Apply database migration 16.' })
  const configuration = normalizeProjectCounterConfig(parseJson(row.draft))
  const revision = Number(row.draftRevision) || 1
  await query(
    'UPDATE project_counter_configuration SET published_config=?, published_revision=?, published_at=NOW(), updated_by=? WHERE id=1',
    [JSON.stringify(configuration), revision, req.user.id],
  )
  res.json({ success: true, message: 'Project counter published to the live website.', data: { publishedRevision: revision } })
}
