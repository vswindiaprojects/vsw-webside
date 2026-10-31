import 'dotenv/config'
import express from 'express'
import path from 'node:path'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import projects from './routes/projects-mysql.js'
import services from './routes/services-mysql.js'
import contact from './routes/contact-mysql.js'
import settings from './routes/settings-mysql.js'
import auth from './routes/auth-mysql.js'
import users from './routes/users-mysql.js'
import admin from './routes/admin-mysql.js'
import content from './routes/content-mysql.js'
import counterSettings from './routes/counter-settings.js'
import { query } from './config/db.js'
import { errorHandler, notFound } from './middleware/errors-mysql.js'

const app = express()
const port = Number(process.env.PORT) || 5000
const allowedOrigins = (process.env.FRONTEND_URL || 'http://localhost:5173').split(',').map((origin) => origin.trim())
const corsOptions = {
	origin(origin, callback) {
		const isLocalDevOrigin = process.env.NODE_ENV !== 'production' && /^https?:\/\/localhost:\d+$/.test(origin || '')
		callback(null, !origin || allowedOrigins.includes(origin) || isLocalDevOrigin)
	},
}

app.use(helmet())
app.use(cors(corsOptions))
app.use(morgan(':remote-addr :method :status :response-time ms'))
app.use(express.json({ limit: '100kb' }))
app.use(express.urlencoded({ extended: true, limit: '100kb' }))
app.get('/api/health', async (req, res) => {
	const payload = { success: true, service: 'vsw-api', uptime: Math.round(process.uptime()), database: 'unknown', message: 'VSW API is running.' }
	try {
		await query('SELECT 1 AS connected')
		payload.database = 'connected'
	} catch (error) {
		payload.database = 'unreachable'
		if (process.env.NODE_ENV !== 'production') payload.databaseError = error.code || error.message
	}
	res.status(200).json(payload)
})
app.use('/api/projects', projects)
app.use('/api/services', services)
app.use('/api/contact', contact)
app.use('/api/settings', settings)
app.use('/api/company', settings)
app.use('/api/auth', auth)
app.use('/api/users', users)
app.use('/api/admin', admin)
app.use('/api/content', content)
app.use('/api/counter-settings', counterSettings)
app.use('/uploads', express.static(path.resolve(process.env.UPLOADS_DIR||path.join(process.cwd(),'uploads'))))
app.use(notFound)
app.use(errorHandler)

const server = app.listen(port, '0.0.0.0', () => console.log(`VSW MySQL API listening on 0.0.0.0:${port}`))
server.on('error', (error) => {
	console.error(`HTTP server failed to start on port ${port}: ${error.code || error.message}`)
	process.exit(1)
})
