import { query } from '../config/db.js'

const pageInfo = (page, limit, total) => ({ page, limit, total })

export const listProjects = async (req, res) => {
  const { category, location, featured, search, status = 'active' } = req.query
  const page = Math.max(Number(req.query.page) || 1, 1)
  const limit = Math.min(Math.max(Number(req.query.limit) || 10, 1), 100)
  const where = status === 'active' ? ["p.status IN ('active','Upcoming','Ongoing','Completed')", 'p.archived_at IS NULL'] : ['p.status = ?']
  const params = status === 'active' ? [] : [status]
  if (category) { where.push('p.category = ?'); params.push(category) }
  if (location) { where.push('p.location LIKE ?'); params.push(`%${location}%`) }
  if (featured === 'true') where.push('p.display_order <= 6')
  if (search) { where.push('(p.title LIKE ? OR p.location LIKE ? OR p.client_name LIKE ? OR p.description LIKE ?)'); params.push(...Array(4).fill(`%${search}%`)) }
  const whereSql = where.join(' AND ')
  const [countRows] = await query(`SELECT COUNT(*) AS total FROM projects p WHERE ${whereSql}`, params)
  const [rows] = await query(`SELECT p.id, p.title, p.client_name AS clientName, p.location, p.category, p.description, p.image, p.status, p.display_order AS displayOrder, p.created_at AS createdAt, p.updated_at AS updatedAt FROM projects p WHERE ${whereSql} ORDER BY p.display_order ASC, p.id ASC LIMIT ? OFFSET ?`, [...params, limit, (page - 1) * limit])
  let imagesByProject = new Map()
  if (rows.length) {
    const placeholders = rows.map(() => '?').join(',')
    const [images] = await query(`SELECT id, project_id AS projectId, image_url AS imageUrl, alt_text AS altText, display_order AS displayOrder FROM project_images WHERE project_id IN (${placeholders}) ORDER BY display_order, id`, rows.map((row) => row.id))
    imagesByProject = images.reduce((grouped, image) => {
      const projectImages = grouped.get(image.projectId) || []
      projectImages.push({ id: image.id, imageUrl: image.imageUrl, altText: image.altText, displayOrder: image.displayOrder })
      grouped.set(image.projectId, projectImages)
      return grouped
    }, new Map())
  }
  const data = rows.map((row) => ({ ...row, images: imagesByProject.get(row.id) || [] }))
  res.json({ success: true, data, ...pageInfo(page, limit, countRows[0].total) })
}

export const getProject = async (req, res) => {
  const [rows] = await query('SELECT id, title, client_name AS clientName, location, category, description, image, status, display_order AS displayOrder, created_at AS createdAt, updated_at AS updatedAt FROM projects WHERE id = ?', [req.params.id])
  if (!rows[0]) return res.status(404).json({ success: false, message: 'Project not found.' })
  const [images] = await query('SELECT id, image_url AS imageUrl, alt_text AS altText, display_order AS displayOrder FROM project_images WHERE project_id = ? ORDER BY display_order, id', [req.params.id])
  res.json({ success: true, data: { ...rows[0], images } })
}

export const listByCategory = (req, res) => { req.query.category = req.params.category; return listProjects(req, res) }
export const createProject = async (req, res) => { const { title, clientName = '', location, category = 'Other', description = '', image = '', status = 'active', displayOrder = 0 } = req.body; const [result] = await query('INSERT INTO projects (title, client_name, location, category, description, image, status, display_order) VALUES (?, ?, ?, ?, ?, ?, ?, ?)', [title, clientName, location, category, description, image, status, displayOrder]); res.status(201).json({ success: true, data: { id: result.insertId, ...req.body } }) }
export const updateProject = async (req, res) => { const { title, clientName = '', location, category = 'Other', description = '', image = '', status = 'active', displayOrder = 0 } = req.body; const [result] = await query('UPDATE projects SET title = ?, client_name = ?, location = ?, category = ?, description = ?, image = ?, status = ?, display_order = ? WHERE id = ?', [title, clientName, location, category, description, image, status, displayOrder, req.params.id]); if (!result.affectedRows) return res.status(404).json({ success: false, message: 'Project not found.' }); res.json({ success: true, data: { id: Number(req.params.id), ...req.body } }) }
export const deleteProject = async (req, res) => { const [result] = await query('DELETE FROM projects WHERE id = ?', [req.params.id]); if (!result.affectedRows) return res.status(404).json({ success: false, message: 'Project not found.' }); res.json({ success: true, message: 'Project deleted.' }) }
