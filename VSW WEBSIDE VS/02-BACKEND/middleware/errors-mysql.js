export const notFound = (_req, res) => res.status(404).json({ success: false, message: 'Route not found.' })

export const asyncHandler = (handler) => (req, res, next) => Promise.resolve().then(() => handler(req, res, next)).catch(next)

export const errorHandler = (error, req, res, next) => {
  const logContext = { method: req.method, path: req.path, code: error.code || 'UNEXPECTED_ERROR' }
  if (process.env.NODE_ENV === 'production') console.error('[API ERROR]', logContext)
  else console.error('[API ERROR]', logContext, error)
  if (error.code === 'ER_DUP_ENTRY') return res.status(409).json({ success: false, message: 'A record with that value already exists.' })
  if (error.code === 'ER_NO_REFERENCED_ROW_2') return res.status(400).json({ success: false, message: 'Referenced record does not exist.' })
  const message = error.statusCode ? error.message : 'Something went wrong. Please try again.'
  res.status(error.statusCode || 500).json({ success: false, message })
}
