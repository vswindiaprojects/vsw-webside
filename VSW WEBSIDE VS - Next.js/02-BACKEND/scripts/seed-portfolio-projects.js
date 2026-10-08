import 'dotenv/config'
import { existsSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { projects } from '../../01-FRONTEND/services/data.js'
import { closePool, getConnection } from '../config/db.js'

const scriptDir = path.dirname(fileURLToPath(import.meta.url))
const workspaceRoot = path.resolve(scriptDir, '../..')

const run = async () => {
  const connection = await getConnection()
  let inserted = 0
  let skipped = 0

  try {
    await connection.beginTransaction()
    const [existingRows] = await connection.execute('SELECT title FROM projects')
    const existingTitles = new Set(existingRows.map(({ title }) => title.trim().toLocaleLowerCase()))

    for (const project of projects) {
      const title = project.name.trim()
      if (existingTitles.has(title.toLocaleLowerCase())) {
        skipped += 1
        continue
      }

      const image = project.image || ''
      if (image.startsWith('/assets/')) {
        const imagePath = path.resolve(workspaceRoot, 'public', image.slice(1))
        if (!existsSync(imagePath)) throw new Error(`Project image is missing for ${title}`)
      }

      await connection.execute(
        `INSERT INTO projects
          (title, location, category, description, client_name, status, image, display_order)
         VALUES (?, ?, ?, ?, '', 'Completed', ?, ?)`,
        [title, project.location || 'Not specified', project.category || 'Other', project.scope || '', image, project.id],
      )
      existingTitles.add(title.toLocaleLowerCase())
      inserted += 1
    }

    await connection.commit()
    console.log(`Portfolio import complete: ${inserted} projects added, ${skipped} existing projects kept.`)
  } catch (error) {
    await connection.rollback()
    throw error
  } finally {
    connection.release()
  }
}

try {
  await run()
} catch (error) {
  console.error(`Portfolio import failed: ${error.message}`)
  process.exitCode = 1
} finally {
  await closePool()
}
