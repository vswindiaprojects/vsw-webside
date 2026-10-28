import fs from 'node:fs/promises'
import path from 'node:path'
import { randomUUID } from 'node:crypto'
import { query } from '../config/db.js'
import { getImageDimensions, isValidMediaFile } from './admin-mysql.js'

const MAX_LOGOS = 150
const cleanText = (value, max) => String(value ?? '').replace(/[\u0000-\u001f\u007f]/g, ' ').trim().slice(0, max)

const booleanValue = (value, fallback) => {
  if (typeof value === 'boolean') return value
  if (value === 'true') return true
  if (value === 'false') return false
  return fallback
}

const numberValue = (value, min, max, fallback) => {
  const number = Number(value)
  if (!Number.isFinite(number)) return fallback
  return Math.min(max, Math.max(min, Math.round(number)))
}

const localImagePath = (value) => {
  const url = cleanText(value, 500)
  if (!url || !url.startsWith('/') || url.startsWith('//') || url.includes('\\')) return ''
  return url
}

const safeLink = (value) => {
  const link = cleanText(value, 500)
  if (!link) return ''
  if (link.startsWith('/') && !link.startsWith('//') && !link.includes('\\')) return link
  if (link.startsWith('#')) return link
  try {
    const url = new URL(link)
    return ['http:', 'https:'].includes(url.protocol) ? url.toString() : ''
  } catch {
    return ''
  }
}

const safeId = (value, index) => {
  const id = cleanText(value, 64)
  return /^[A-Za-z0-9_-]{1,64}$/.test(id) ? id : `logo-${index + 1}`
}

const parseJson = (value) => {
  if (value && typeof value === 'object') return value
  try {
    return JSON.parse(value)
  } catch {
    return {}
  }
}

export const defaultClientLogoConfig = () => ({
  visible: true,
  eyebrow: 'Clients & Partners',
  heading: 'Our Trusted Clients',
  subheading: 'Trusted by leading brands and project partners across India.',
  speed: 55,
  direction: 'left',
  animationEnabled: true,
  pauseOnHover: true,
  logoSize: 64,
  gap: 56,
  cardStyle: 'card',
  grayscale: false,
  logos: [],
})

export const normalizeClientLogoConfig = (value) => {
  const source = value && typeof value === 'object' && !Array.isArray(value) ? value : {}
  const fallback = defaultClientLogoConfig()
  const rawLogos = Array.isArray(source.logos) ? source.logos.slice(0, MAX_LOGOS) : []
  const usedIds = new Set()
  const logos = rawLogos.map((entry, index) => {
    const logo = entry && typeof entry === 'object' && !Array.isArray(entry) ? entry : {}
    let id = safeId(logo.id, index)
    while (usedIds.has(id)) id = `${id}-${index + 1}`
    usedIds.add(id)
    return {
      id,
      name: cleanText(logo.name, 80) || 'Client',
      imageUrl: localImagePath(logo.imageUrl),
      alt: cleanText(logo.alt, 160),
      link: safeLink(logo.link),
      enabled: booleanValue(logo.enabled, true),
    }
  })
  return {
    visible: booleanValue(source.visible, fallback.visible),
    eyebrow: cleanText(source.eyebrow, 60),
    heading: cleanText(source.heading, 120),
    subheading: cleanText(source.subheading, 240),
    speed: numberValue(source.speed, 20, 140, fallback.speed),
    direction: source.direction === 'right' ? 'right' : 'left',
    animationEnabled: booleanValue(source.animationEnabled, fallback.animationEnabled),
    pauseOnHover: booleanValue(source.pauseOnHover, fallback.pauseOnHover),
    logoSize: numberValue(source.logoSize, 36, 110, fallback.logoSize),
    gap: numberValue(source.gap, 20, 100, fallback.gap),
    cardStyle: source.cardStyle === 'plain' ? 'plain' : 'card',
    grayscale: booleanValue(source.grayscale, false),
    layout: ['auto', 'grid', 'marquee'].includes(source.layout) ? source.layout : 'auto',
    showAllClients: booleanValue(source.showAllClients, true),
    // Optional shortlist of logo ids for the top strip. Empty/absent shows every client.
    marqueeIds: Array.isArray(source.marqueeIds)
      ? source.marqueeIds.map((id) => cleanText(id, 64)).filter((id) => /^[A-Za-z0-9_-]{1,64}$/.test(id)).slice(0, MAX_LOGOS)
      : [],
    logos,
  }
}

const readRow = async () => {
  const [[row]] = await query(
    'SELECT draft_config AS draft, published_config AS published, draft_revision AS draftRevision, published_revision AS publishedRevision, updated_by AS updatedBy, updated_at AS updatedAt, published_at AS publishedAt FROM client_logo_configuration WHERE id=1',
  )
  return row || null
}

export const getPublicClientLogos = async (_req, res) => {
  const [[row]] = await query('SELECT published_config AS published FROM client_logo_configuration WHERE id=1')
  res.set('Cache-Control', 'no-store')
  res.json({ success: true, data: normalizeClientLogoConfig(parseJson(row?.published)) })
}

export const getAdminClientLogos = async (_req, res) => {
  const row = await readRow()
  if (!row) {
    const fallback = defaultClientLogoConfig()
    return res.json({
      success: true,
      data: { draft: fallback, published: fallback, draftRevision: 0, publishedRevision: 0, initialized: false },
    })
  }
  res.json({
    success: true,
    data: {
      draft: normalizeClientLogoConfig(parseJson(row.draft)),
      published: normalizeClientLogoConfig(parseJson(row.published)),
      draftRevision: row.draftRevision,
      publishedRevision: row.publishedRevision,
      updatedBy: row.updatedBy,
      updatedAt: row.updatedAt,
      publishedAt: row.publishedAt,
    },
  })
}

export const saveClientLogosDraft = async (req, res) => {
  const configuration = normalizeClientLogoConfig(req.body?.configuration ?? req.body)
  const [result] = await query(
    'UPDATE client_logo_configuration SET draft_config=?, draft_revision=draft_revision+1, updated_by=? WHERE id=1',
    [JSON.stringify(configuration), req.user.id],
  )
  if (!result.affectedRows) {
    await query(
      'INSERT INTO client_logo_configuration(id,draft_config,published_config,draft_revision,published_revision,updated_by) VALUES(1,?,?,1,1,?)',
      [JSON.stringify(configuration), JSON.stringify(configuration), req.user.id],
    )
  }
  const [[row]] = await query('SELECT draft_revision AS draftRevision FROM client_logo_configuration WHERE id=1')
  res.json({
    success: true,
    message: 'Client logo draft saved. Preview it, then publish when ready.',
    data: { configuration, draftRevision: row?.draftRevision ?? 1 },
  })
}

export const publishClientLogos = async (req, res) => {
  const [[row]] = await query(
    'SELECT draft_config AS draft, draft_revision AS draftRevision FROM client_logo_configuration WHERE id=1',
  )
  if (!row) return res.status(503).json({ success: false, message: 'Client logo settings are not initialized. Apply database migration 15.' })
  const configuration = normalizeClientLogoConfig(parseJson(row.draft))
  const revision = Number(row.draftRevision) || 1
  await query(
    'UPDATE client_logo_configuration SET published_config=?, published_revision=?, published_at=NOW(), updated_by=? WHERE id=1',
    [JSON.stringify(configuration), revision, req.user.id],
  )
  res.json({ success: true, message: 'Client logo board published to the live website.', data: { publishedRevision: revision } })
}

export const uploadClientLogo = async (req, res) => {
  if (!req.file) return res.status(400).json({ success: false, message: 'Choose a logo image to upload.' })
  if (req.file.mimetype === 'application/pdf' || !(await isValidMediaFile(req.file))) {
    await fs.rm(req.file.path, { force: true })
    return res.status(415).json({ success: false, message: 'The logo must be a valid JPG, PNG, WEBP, or GIF image.' })
  }
  const dimensions = await getImageDimensions(req.file)
  if (!dimensions) {
    await fs.rm(req.file.path, { force: true })
    return res.status(415).json({ success: false, message: 'The logo image is incomplete or its dimensions could not be read.' })
  }
  res.status(201).json({
    success: true,
    message: 'Logo uploaded. Save the draft to keep it.',
    data: {
      url: `/uploads/clients/${path.basename(req.file.filename)}`,
      width: dimensions.width,
      height: dimensions.height,
      mimeType: req.file.mimetype,
      fileSize: req.file.size,
    },
  })
}

// Kept for future cleanup tools. Files are intentionally not deleted automatically
// because one uploaded image can be referenced by more than one logo entry.
export const removeUploadedLogoFile = async (url) => {
  const safe = localImagePath(url)
  if (!safe.startsWith('/uploads/clients/')) return false
  const filename = path.basename(safe)
  if (!filename || filename !== safe.slice('/uploads/clients/'.length)) return false
  const root = path.resolve(process.env.UPLOADS_DIR || path.join(process.cwd(), 'uploads'), 'clients')
  await fs.rm(path.resolve(root, filename), { force: true })
  return true
}

export const newClientLogoId = () => `logo-${randomUUID()}`
