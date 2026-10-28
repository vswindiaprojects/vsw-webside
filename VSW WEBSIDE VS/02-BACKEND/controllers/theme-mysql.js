import { getConnection, query } from '../config/db.js'

const colorKeys = new Set([
  'primary', 'secondary', 'accent', 'background', 'text', 'heading', 'link',
  'buttonBackground', 'buttonText', 'border', 'headerBackground',
  'footerBackground', 'cardBackground',
])
const fontKeys = new Set(['bodyFont', 'headingFont'])
const sizeKeys = new Set(['bodySize', 'h1Size', 'h2Size', 'h3Size', 'h4Size', 'h5Size', 'h6Size', 'navSize', 'buttonSize', 'footerSize'])
const responsiveSizeKeys = new Set(['bodySize', 'h1Size', 'h2Size', 'h3Size'])
const sectionIds = new Set(['hero', 'strengths', 'about', 'services', 'projects', 'workflow', 'why-vsw', 'testimonials', 'faq', 'call-to-action', 'contact'])
const sectionFields = {
  hero: new Set(['eyebrow', 'heading', 'tagline', 'description', 'buttonText', 'buttonLink', 'secondaryButtonText', 'secondaryButtonLink', 'heroImage']),
  strengths: new Set(['itemOne', 'itemTwo', 'itemThree', 'itemFour']),
  about: new Set(['eyebrow', 'heading', 'description', 'intro', 'paragraphOne', 'paragraphTwo', 'mission', 'vision', 'image', 'imageAlt', 'caption', 'buttonText']),
  services: new Set(['eyebrow', 'heading', 'description']),
  projects: new Set(['eyebrow', 'heading', 'description', 'buttonText']),
  workflow: new Set(['eyebrow', 'heading', 'description']),
  'why-vsw': new Set(['eyebrow', 'heading', 'description']),
  testimonials: new Set(['eyebrow', 'heading', 'description', 'quoteOne', 'quoteTwo', 'quoteThree']),
  faq: new Set(['eyebrow', 'heading', 'questionOne', 'answerOne', 'questionTwo', 'answerTwo', 'questionThree', 'answerThree']),
  'call-to-action': new Set(['eyebrow', 'heading', 'description', 'buttonText', 'buttonLink']),
  contact: new Set(['eyebrow', 'heading', 'description']),
}
const pageKeys = new Set(['home', 'about', 'services', 'projects', 'contact'])
const plainObject = (value) => value !== null && typeof value === 'object' && !Array.isArray(value)
const fail = (message) => ({ valid: false, message })
const validText = (value, max = 2000) => typeof value === 'string' && value.length <= max && !/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/.test(value)

const validateUrl = (value) => {
  if (typeof value !== 'string' || value.length > 2048 || /[\u0000-\u0020"'()\\<>]/.test(value)) return false
  if (/^(\/|#)/.test(value)) return !value.startsWith('//')
  try {
    const url = new URL(value)
    return url.protocol === 'https:' || url.protocol === 'http:'
  } catch {
    return false
  }
}

export const validateThemeConfiguration = (theme) => {
  if (!plainObject(theme)) return fail('Theme configuration must be a JSON object.')
  const allowed = new Set(['colors', 'typography', 'branding', 'header', 'footer', 'sections', 'menus', 'pages', 'components'])
  if (Object.keys(theme).some((key) => !allowed.has(key))) return fail('Theme configuration contains unsupported settings.')
  if (theme.colors !== undefined) {
    if (!plainObject(theme.colors) || Object.keys(theme.colors).some((key) => !colorKeys.has(key))) return fail('Theme colors contain unsupported settings.')
    if (Object.values(theme.colors).some((value) => typeof value !== 'string' || !/^#[0-9a-fA-F]{6}$/.test(value))) return fail('Colors must use six-digit hexadecimal values.')
  }
  if (theme.typography !== undefined) {
    if (!plainObject(theme.typography) || Object.keys(theme.typography).some((key) => !fontKeys.has(key) && !sizeKeys.has(key) && !['headingSize', 'responsive'].includes(key))) return fail('Typography contains unsupported settings.')
    for (const key of fontKeys) {
      const value = theme.typography[key]
      if (value !== undefined && (typeof value !== 'string' || !/^[A-Za-z0-9 ,'-]{1,80}$/.test(value))) return fail('Font names contain unsupported characters.')
    }
    for (const key of sizeKeys) {
      const value = theme.typography[key]
      const min = key === 'bodySize' ? 10 : 8
      const max = key === 'bodySize' ? 32 : key === 'h1Size' ? 120 : 80
      if (value !== undefined && (!Number.isFinite(value) || value < min || value > max)) return fail(`${key} must be between ${min} and ${max} pixels.`)
    }
    if (theme.typography.headingSize !== undefined && (!Number.isFinite(theme.typography.headingSize) || theme.typography.headingSize < 0.7 || theme.typography.headingSize > 1.5)) return fail('Heading scale must be between 0.7 and 1.5.')
    if (theme.typography.responsive !== undefined) {
      const responsive = theme.typography.responsive
      if (!plainObject(responsive) || Object.keys(responsive).some((device) => !['tablet', 'mobile'].includes(device))) return fail('Responsive typography may only define tablet and mobile settings.')
      for (const device of Object.values(responsive)) {
        if (!plainObject(device) || Object.keys(device).some((key) => !responsiveSizeKeys.has(key))) return fail('Responsive typography contains unsupported settings.')
        for (const [key, value] of Object.entries(device)) {
          const min = key === 'bodySize' ? 10 : 8
          const max = key === 'bodySize' ? 32 : key === 'h1Size' ? 120 : 80
          if (!Number.isFinite(value) || value < min || value > max) return fail(`${key} must be between ${min} and ${max} pixels.`)
        }
      }
    }
  }
  for (const key of ['branding', 'header', 'footer']) {
    if (theme[key] !== undefined && !plainObject(theme[key])) return fail(`${key} settings must be an object.`)
  }
  if (theme.branding) {
    const allowedBranding = new Set(['primaryLogo', 'footerLogo', 'mobileLogo', 'favicon', 'logoAlt', 'logoWidth', 'footerLogoWidth', 'mobileLogoWidth', 'logoHref'])
    if (Object.keys(theme.branding).some((key) => !allowedBranding.has(key))) return fail('Branding contains unsupported settings.')
    for (const key of ['primaryLogo', 'footerLogo', 'mobileLogo', 'favicon', 'logoHref']) {
      const value = theme.branding[key]
      if (value !== undefined && value !== '' && !validateUrl(value)) return fail(`${key} must be a local path or an HTTP(S) URL.`)
    }
    if (theme.branding.logoAlt !== undefined && (typeof theme.branding.logoAlt !== 'string' || theme.branding.logoAlt.length > 255)) return fail('Logo alternative text must be 255 characters or fewer.')
    for (const key of ['logoWidth', 'footerLogoWidth', 'mobileLogoWidth']) {
      if (theme.branding[key] !== undefined && (!Number.isInteger(theme.branding[key]) || theme.branding[key] < 40 || theme.branding[key] > 500)) return fail(`${key} must be between 40 and 500 pixels.`)
    }
  }
  if (theme.header) {
    const allowedHeader = new Set(['height', 'sticky', 'showAccount', 'navAlignment'])
    if (Object.keys(theme.header).some((key) => !allowedHeader.has(key))) return fail('Header contains unsupported settings.')
    if (theme.header.height !== undefined && (!Number.isInteger(theme.header.height) || theme.header.height < 48 || theme.header.height > 180)) return fail('Header height must be between 48 and 180 pixels.')
    for (const key of ['sticky', 'showAccount']) if (theme.header[key] !== undefined && typeof theme.header[key] !== 'boolean') return fail(`Header ${key} must be true or false.`)
    if (theme.header.navAlignment !== undefined && !['left', 'center', 'right'].includes(theme.header.navAlignment)) return fail('Header alignment must be left, center, or right.')
  }
  if (theme.footer) {
    const allowedFooter = new Set(['description', 'copyright', 'phone', 'email', 'website', 'tagline', 'subTagline', 'copyrightTagline'])
    if (Object.keys(theme.footer).some((key) => !allowedFooter.has(key))) return fail('Footer contains unsupported settings.')
    for (const value of Object.values(theme.footer)) if (typeof value !== 'string' || value.length > 1000) return fail('Footer text must be 1000 characters or fewer.')
    if (theme.footer.website && !validateUrl(theme.footer.website)) return fail('Footer website must use HTTP(S).')
    if (theme.footer.email && (typeof theme.footer.email !== 'string' || theme.footer.email.length > 190 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(theme.footer.email))) return fail('Footer email address is invalid.')
  }
  if (theme.sections !== undefined) {
    if (!Array.isArray(theme.sections) || theme.sections.length > sectionIds.size) return fail('Sections must be a list of supported homepage sections.')
    const seen = new Set()
    for (const section of theme.sections) {
      if (!plainObject(section) || Object.keys(section).some((key) => !['id', 'visible', 'order', 'settings'].includes(key))) return fail('A homepage section contains unsupported settings.')
      if (!sectionIds.has(section.id) || seen.has(section.id)) return fail('Homepage section IDs must be supported and unique.')
      if (typeof section.visible !== 'boolean' || !Number.isInteger(section.order) || section.order < 0 || section.order >= sectionIds.size) return fail('Homepage section visibility or order is invalid.')
      if (section.settings !== undefined) {
        if (!plainObject(section.settings) || Object.keys(section.settings).some((key) => !sectionFields[section.id].has(key))) return fail(`The ${section.id} section contains unsupported content fields.`)
        for (const [key, value] of Object.entries(section.settings)) {
          if (key.endsWith('Link') || key === 'heroImage' || key === 'image') {
            if (value !== '' && !validateUrl(value)) return fail(`${key} must be a local path or an HTTP(S) URL.`)
          } else if (!validText(value)) return fail(`Section text must be plain text with at most 2000 characters.`)
        }
      }
      seen.add(section.id)
    }
  }
  if (theme.menus !== undefined) {
    if (!plainObject(theme.menus) || Object.keys(theme.menus).some((key) => !['main', 'footer'].includes(key))) return fail('Navigation menus contain unsupported settings.')
    for (const menuName of ['main', 'footer']) {
      const menu = theme.menus[menuName]
      if (menu === undefined) continue
      if (!Array.isArray(menu) || menu.length > 20) return fail('Each menu can contain up to 20 links.')
      const ids = new Set()
      for (const item of menu) {
        if (!plainObject(item) || Object.keys(item).some((key) => !['id', 'label', 'url', 'visible'].includes(key))) return fail('A menu item contains unsupported settings.')
        if (typeof item.id !== 'string' || !/^[a-z0-9-]{1,60}$/.test(item.id) || ids.has(item.id)) return fail('Menu item IDs must be unique lowercase slugs.')
        if (!validText(item.label, 60) || !item.label.trim()) return fail('Menu labels must contain 1 to 60 characters.')
        if (!validateUrl(item.url)) return fail('Menu links must use a local path, a page anchor, or HTTP(S).')
        if (typeof item.visible !== 'boolean') return fail('Menu item visibility must be true or false.')
        ids.add(item.id)
      }
    }
  }
  if (theme.pages !== undefined) {
    if (!plainObject(theme.pages) || Object.keys(theme.pages).some((key) => !pageKeys.has(key))) return fail('Page settings contain unsupported pages.')
    for (const [key, page] of Object.entries(theme.pages)) {
      if (!plainObject(page) || Object.keys(page).some((field) => !['title', 'seoTitle', 'metaDescription', 'slug', 'status'].includes(field))) return fail(`The ${key} page contains unsupported settings.`)
      for (const field of ['title', 'seoTitle', 'metaDescription']) if (page[field] !== undefined && !validText(page[field], field === 'metaDescription' ? 320 : 160)) return fail('Page titles and SEO descriptions must be plain text within their length limit.')
      if (page.slug !== undefined && (typeof page.slug !== 'string' || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(page.slug))) return fail('Page URL slugs may contain lowercase letters, numbers, and hyphens.')
      if (page.status !== undefined && !['draft', 'published'].includes(page.status)) return fail('Page status must be draft or published.')
    }
  }
  if (theme.components !== undefined) {
    if (!plainObject(theme.components) || Object.keys(theme.components).some((key) => !['buttonRadius', 'buttonPadding', 'cardRadius', 'containerWidth', 'sectionSpacing'].includes(key))) return fail('Component styles contain unsupported settings.')
    const limits = { buttonRadius: [0, 40], buttonPadding: [4, 40], cardRadius: [0, 40], containerWidth: [800, 1600], sectionSpacing: [40, 240] }
    for (const [key, [min, max]] of Object.entries(limits)) {
      const value = theme.components[key]
      if (value !== undefined && (!Number.isInteger(value) || value < min || value > max)) return fail(`${key} must be between ${min} and ${max}.`)
    }
  }
  return { valid: true }
}

const parseJson = (value) => typeof value === 'string' ? JSON.parse(value) : value

export const getPublishedTheme = async (_req, res) => {
  const [[row]] = await query('SELECT published_config AS theme, published_revision AS revision, published_at AS publishedAt FROM theme_configuration WHERE id=1')
  if (!row) return res.status(503).json({ success: false, message: 'Theme configuration has not been initialized. Apply database migration 13.' })
  res.set('Cache-Control', 'no-store')
  res.json({ success: true, data: { theme: parseJson(row.theme), revision: row.revision, publishedAt: row.publishedAt } })
}

export const getAdminTheme = async (_req, res) => {
  const [[row]] = await query('SELECT draft_config AS draft, published_config AS published, draft_revision AS draftRevision, published_revision AS publishedRevision, published_at AS publishedAt, updated_at AS updatedAt FROM theme_configuration WHERE id=1')
  if (!row) return res.status(503).json({ success: false, message: 'Theme configuration has not been initialized. Apply database migration 13.' })
  res.json({ success: true, data: { draft: parseJson(row.draft), published: parseJson(row.published), draftRevision: row.draftRevision, publishedRevision: row.publishedRevision, publishedAt: row.publishedAt, updatedAt: row.updatedAt } })
}

export const saveThemeDraft = async (req, res) => {
  const { configuration } = req.body
  const validation = validateThemeConfiguration(configuration)
  if (!validation.valid) return res.status(400).json({ success: false, message: validation.message })
  const serialized = JSON.stringify(configuration)
  if (Buffer.byteLength(serialized, 'utf8') > 65536) return res.status(413).json({ success: false, message: 'Theme configuration must be 64 KB or smaller.' })
  const [result] = await query('UPDATE theme_configuration SET draft_config=?, draft_revision=draft_revision+1, updated_by=? WHERE id=1', [serialized, req.user.id])
  if (!result.affectedRows) return res.status(503).json({ success: false, message: 'Theme configuration has not been initialized. Apply database migration 13.' })
  const [[row]] = await query('SELECT draft_revision AS draftRevision FROM theme_configuration WHERE id=1')
  res.json({ success: true, message: 'Theme draft saved.', data: { draftRevision: row.draftRevision } })
}

export const publishTheme = async (req, res) => {
  const connection = await getConnection()
  try {
    await connection.beginTransaction()
    const [rows] = await connection.execute('SELECT draft_config AS draft, published_revision AS publishedRevision FROM theme_configuration WHERE id=1 FOR UPDATE')
    if (!rows[0]) {
      await connection.rollback()
      return res.status(503).json({ success: false, message: 'Theme configuration has not been initialized. Apply database migration 13.' })
    }
    const configuration = parseJson(rows[0].draft)
    const validation = validateThemeConfiguration(configuration)
    if (!validation.valid) {
      await connection.rollback()
      return res.status(400).json({ success: false, message: validation.message })
    }
    const revision = Number(rows[0].publishedRevision) + 1
    const serialized = JSON.stringify(configuration)
    await connection.execute('INSERT INTO theme_versions(revision,configuration,change_type,changed_by) VALUES(?,?,?,?)', [revision, serialized, 'published', req.user.id])
    await connection.execute('UPDATE theme_configuration SET published_config=?, published_revision=?, published_at=CURRENT_TIMESTAMP WHERE id=1', [serialized, revision])
    await connection.commit()
    res.json({ success: true, message: 'Theme published successfully.', data: { revision } })
  } catch (error) {
    await connection.rollback()
    throw error
  } finally {
    connection.release()
  }
}

export const listThemeVersions = async (_req, res) => {
  const [rows] = await query('SELECT v.id,v.revision,v.change_type AS changeType,v.created_at AS createdAt,a.name AS changedBy FROM theme_versions v LEFT JOIN admins a ON a.id=v.changed_by ORDER BY v.revision DESC LIMIT 50')
  res.json({ success: true, data: rows })
}

export const restoreThemeVersion = async (req, res) => {
  const connection = await getConnection()
  try {
    await connection.beginTransaction()
    const [versions] = await connection.execute('SELECT configuration FROM theme_versions WHERE id=? FOR UPDATE', [req.params.id])
    if (!versions[0]) {
      await connection.rollback()
      return res.status(404).json({ success: false, message: 'Theme version not found.' })
    }
    const configuration = parseJson(versions[0].configuration)
    const validation = validateThemeConfiguration(configuration)
    if (!validation.valid) {
      await connection.rollback()
      return res.status(409).json({ success: false, message: 'This saved theme version is invalid and cannot be restored.' })
    }
    await connection.execute('UPDATE theme_configuration SET draft_config=?,draft_revision=draft_revision+1,updated_by=? WHERE id=1', [JSON.stringify(configuration), req.user.id])
    await connection.commit()
    res.json({ success: true, message: 'Theme version restored as a draft. Publish it to make it public.' })
  } catch (error) {
    await connection.rollback()
    throw error
  } finally {
    connection.release()
  }
}

export const listThemePresets = async (_req, res) => {
  const [rows] = await query('SELECT id,name,created_at AS createdAt,updated_at AS updatedAt FROM theme_presets ORDER BY name')
  res.json({ success: true, data: rows })
}

export const saveThemePreset = async (req, res) => {
  const name = String(req.body.name || '').trim()
  const validation = validateThemeConfiguration(req.body.configuration)
  if (!/^[\p{L}\p{N}][\p{L}\p{N} ._-]{0,79}$/u.test(name)) return res.status(400).json({ success: false, message: 'Preset name must be 1 to 80 characters and may contain letters, numbers, spaces, dots, underscores, and hyphens.' })
  if (!validation.valid) return res.status(400).json({ success: false, message: validation.message })
  try {
    const [result] = await query('INSERT INTO theme_presets(name,configuration,created_by) VALUES(?,?,?)', [name, JSON.stringify(req.body.configuration), req.user.id])
    res.status(201).json({ success: true, message: 'Theme preset saved.', data: { id: result.insertId, name } })
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') return res.status(409).json({ success: false, message: 'A preset with this name already exists.' })
    throw error
  }
}

export const applyThemePreset = async (req, res) => {
  const [[preset]] = await query('SELECT configuration FROM theme_presets WHERE id=?', [req.params.id])
  if (!preset) return res.status(404).json({ success: false, message: 'Theme preset not found.' })
  const configuration = parseJson(preset.configuration)
  const validation = validateThemeConfiguration(configuration)
  if (!validation.valid) return res.status(409).json({ success: false, message: 'This preset is invalid and cannot be applied.' })
  const [result] = await query('UPDATE theme_configuration SET draft_config=?,draft_revision=draft_revision+1,updated_by=? WHERE id=1', [JSON.stringify(configuration), req.user.id])
  if (!result.affectedRows) return res.status(503).json({ success: false, message: 'Theme configuration has not been initialized. Apply database migration 13.' })
  res.json({ success: true, message: 'Preset applied to the draft. Publish it when ready.' })
}

export const deleteThemePreset = async (req, res) => {
  const [result] = await query('DELETE FROM theme_presets WHERE id=?', [req.params.id])
  if (!result.affectedRows) return res.status(404).json({ success: false, message: 'Theme preset not found.' })
  res.json({ success: true, message: 'Theme preset deleted.' })
}
