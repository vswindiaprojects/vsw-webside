import { useEffect, useState } from 'react'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import AuthLayout from '../components/AuthLayout'
import { api } from '../services/api'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [step, setStep] = useState('request')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => { document.title = 'Reset Password | VSW Solutions' }, [])

  const requestOtp = async (event) => {
    event.preventDefault()
    setBusy(true); setError(''); setMessage('')
    try {
      const result = await api.requestPasswordResetOtp({ email })
      setMessage(result.message)
      setStep('reset')
    } catch (requestError) { setError(requestError.message) } finally { setBusy(false) }
  }

  const resetPassword = async (event) => {
    event.preventDefault()
    setError(''); setMessage('')
    if (password !== confirmPassword) { setError('The passwords do not match.'); return }
    setBusy(true)
    try {
      await api.resetPasswordWithOtp({ email, otp, password })
      window.location.assign('/login?password-reset=1')
    } catch (requestError) { setError(requestError.message) } finally { setBusy(false) }
  }

  return <AuthLayout eyebrow="ACCOUNT RECOVERY" title={<>A secure way<br />to <em>start again.</em></>} description="Verify your email with a one-time code, then choose a new password for your VSW account.">
    <h2 id="account-title">{step === 'request' ? 'Reset your password.' : 'Enter your code.'}</h2>
    <p className="account-muted">{step === 'request' ? 'We will send a verification code to your account email.' : `Enter the six-digit code sent to ${email}. It expires in 10 minutes.`}</p>
    {message && <p className="account-success-message" role="status">{message}</p>}
    {error && <p className="account-error" role="alert">{error}</p>}
    {step === 'request' ? <form className="account-form" onSubmit={requestOtp}>
      <label>Email address<input type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@company.com" required /></label>
      <button className="account-submit" type="submit" disabled={busy}>{busy ? 'Sending code…' : 'Send verification code'} <ArrowRight size={17} /></button>
    </form> : <form className="account-form" onSubmit={resetPassword}>
      <label>Six-digit code<input type="text" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} value={otp} onChange={(event) => setOtp(event.target.value.replace(/\D/g, '').slice(0, 6))} placeholder="000000" required /></label>
      <label>New password<input type="password" autoComplete="new-password" minLength={12} maxLength={72} value={password} onChange={(event) => setPassword(event.target.value)} placeholder="At least 12 characters" required /></label>
      <label>Confirm new password<input type="password" autoComplete="new-password" minLength={12} maxLength={72} value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} placeholder="Enter it again" required /></label>
      <button className="account-submit" type="submit" disabled={busy}>{busy ? 'Updating password…' : 'Update password'} <ArrowRight size={17} /></button>
      <button className="account-back-link" type="button" onClick={() => { setStep('request'); setOtp(''); setMessage(''); setError('') }}><ArrowLeft size={14} /> Change email or request another code</button>
    </form>}
    <p className="account-switch"><a href="/login">Back to sign in</a></p>
  </AuthLayout>
}
