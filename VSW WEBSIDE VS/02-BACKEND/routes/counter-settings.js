// Compatibility API for the compact counter-settings shape.
// GET is public and mirrors the published snapshot; PUT saves a private draft,
// and POST /publish promotes that draft (same rules as /api/admin/counter).
import { Router } from 'express'
import { query } from '../config/db.js'
import { asyncHandler } from '../middleware/errors-mysql.js'
import { requireAuth, requirePermission } from '../middleware/auth-mysql.js'
import {
  normalizeProjectCounterConfig,
  publishProjectCounter,
} from '../controllers/project-counter-mysql.js'

const parseJson = (value) => {
  if (value && typeof value === 'object') return value
  try {
    return JSON.parse(value)
  } catch {
    return {}
  }
}

const palette = (config) => {
  if (config.backgroundStyle === 'light') {
    return {
      accent: config.accentColor || '#c2a36b',
      bg: config.backgroundColor || '#ffffff',
      text: config.textColor || '#12202a',
    }
  }
  return {
    accent: config.accentColor || '#c9a45c',
    bg: config.backgroundColor || '#07131f',
    text: config.textColor || '#ffffff',
  }
}

// Internal admin configuration -> compact `settingsUrl` shape.
const toCompact = (config) => ({
  visible: config.visible,
  eyebrow: config.eyebrow,
  title: config.heading,
  subtitle: config.subheading,
  loop: config.loop,
  duration: config.duration,
  pause: config.pause,
  colors: palette(config),
  primary: {
    value: config.mainStat.value,
    suffix: config.mainStat.suffix,
    label: config.mainStat.label,
  },
  stats: config.stats
    .filter((stat) => stat.enabled)
    .map(({ value, suffix, label }) => ({ value, suffix, label })),
})

// Compact `settingsUrl` shape -> internal admin configuration.
const fromCompact = (body = {}) => {
  const colors = body.colors && typeof body.colors === 'object' ? body.colors : {}
  return {
    visible: body.visible,
    eyebrow: body.eyebrow,
    heading: body.title,
    subheading: body.subtitle,
    loop: body.loop,
    duration: body.duration,
    pause: body.pause,
    accentColor: colors.accent,
    backgroundColor: colors.bg,
    textColor: colors.text,
    backgroundStyle: colors.bg || colors.text ? 'custom' : undefined,
    mainStat: body.primary,
    stats: Array.isArray(body.stats) && body.stats.length
      ? body.stats.map((stat, index) => ({
        id: stat?.id,
        value: stat?.value,
        suffix: stat?.suffix,
        label: stat?.label,
        enabled: stat?.enabled !== false,
      }))
      : undefined,
  }
}

const readPublished = async () => {
  const [[row]] = await query('SELECT published_config AS published FROM project_counter_configuration WHERE id=1')
  return normalizeProjectCounterConfig(parseJson(row?.published))
}

const router = Router()

router.get('/', asyncHandler(async (_req, res) => {
  res.set('Cache-Control', 'no-store')
  res.json(toCompact(await readPublished()))
}))

router.put('/', requireAuth, requirePermission('content'), asyncHandler(async (req, res) => {
  const [[row]] = await query(
    'SELECT draft_config AS draft FROM project_counter_configuration WHERE id=1',
  )
  const current = normalizeProjectCounterConfig(parseJson(row?.draft))
  const patch = fromCompact(req.body)

  // A full compact payload echoes the current palette. Keep the existing theme
  // choice in that case so a GET -> PUT round-trip does not switch to "custom".
  const currentColors = palette(current)
  if (
    patch.backgroundStyle === 'custom'
    && patch.accentColor === currentColors.accent
    && patch.backgroundColor === currentColors.bg
    && patch.textColor === currentColors.text
  ) {
    delete patch.backgroundStyle
    delete patch.accentColor
    delete patch.backgroundColor
    delete patch.textColor
  }

  const defined = Object.fromEntries(Object.entries(patch).filter(([, value]) => value !== undefined))
  const configuration = normalizeProjectCounterConfig({ ...current, ...defined })
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
  const [[saved]] = await query('SELECT draft_revision AS draftRevision FROM project_counter_configuration WHERE id=1')
  res.json({
    ok: true,
    message: 'Counter draft saved. Publish it from the admin workspace to update the live website.',
    draftRevision: saved?.draftRevision ?? 1,
    data: toCompact(configuration),
  })
}))

router.post('/publish', requireAuth, requirePermission('themePublish'), asyncHandler(publishProjectCounter))

export default router
