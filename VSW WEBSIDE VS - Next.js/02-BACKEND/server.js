import 'dotenv/config'
import express from 'express'
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
app.get('/api/health', async (req, res, next) => { try { await query('SELECT 1 AS connected'); res.json({ success: true, database: 'mysql', message: 'VSW API is running.' }) } catch (error) { next(error) } })
app.use('/api/projects', projects)
app.use('/api/services', services)
app.use('/api/contact', contact)
app.use('/api/settings', settings)
app.use('/api/company', settings)
app.use('/api/auth', auth)
app.use('/api/users', users)
app.use('/api/admin', admin)
app.use('/api/content', content)
app.use('/uploads', express.static('uploads'))
app.use(notFound)
app.use(errorHandler)

app.listen(port, () => console.log(`VSW MySQL API listening on http://localhost:${port}`))
