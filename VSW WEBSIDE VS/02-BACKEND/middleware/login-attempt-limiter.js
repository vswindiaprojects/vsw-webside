import rateLimit from 'express-rate-limit'

// Tuneable so local development and production can use different thresholds.
// Defaults keep the production-friendly 5 failures / 15 minutes.
const attemptWindowMs = () => Number(process.env.LOGIN_ATTEMPT_WINDOW_MS) || 15 * 60 * 1000
const attemptLimit = () => Number(process.env.LOGIN_ATTEMPT_LIMIT) || 5

export const createLoginAttemptLimiter = () => {
  const windowMs = attemptWindowMs()
  return rateLimit({
    windowMs,
    limit: attemptLimit(),
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: true,
    message: {
      success: false,
      message: `Too many failed sign-in attempts. Please wait ${Math.ceil(windowMs / 60000)} minutes and try again.`,
    },
  })
}
