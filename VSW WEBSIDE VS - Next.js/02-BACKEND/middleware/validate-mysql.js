import { validationResult } from 'express-validator'

export const handleValidation = (req, res, next) => {
  const result = validationResult(req)
  if (!result.isEmpty()) {
    const errors = result.array().map(({ msg, path, param, location }) => ({ field: path || param, location, message: msg }))
    return res.status(400).json({ success: false, message: errors[0].message, errors })
  }
  next()
}
