import rateLimit from 'express-rate-limit'

const options = {
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  message: {
    success: false,
    message: 'Too many failed sign-in attempts. Please wait 15 minutes and try again.',
  },
}

export const createLoginAttemptLimiter = () => rateLimit(options)
