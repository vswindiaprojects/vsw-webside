import { useEffect, useState } from 'react'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import AuthLayout from '../components/AuthLayout'
import { api } from '../services/api'
import { useAuth } from '../services/AuthContext'

export default function ChangePassword() {
  const { user, loading, logout } = useAuth()
  const [step, setStep] = useState('request')
  const [otp, setOtp] = useState('')
  const [currentPassword, setCurrentPassword] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => { document.title = 'Change Password | VSW Solutions' }, [])
  useEffect(() => { if (!loading && !user) window.location.replace(`/login?returnTo=${encodeURIComponent('/change-password')}`) }, [loading, user])

  const requestOtp = async () => {
    setBusy(true); setError(''); setMessage('')
    try {
      const result = await api.requestPasswordChangeOtp(localStorage.getItem('vsw_user_token'))
      setMessage(result.message)
      setStep('change')
    } catch (requestError) { setError(requestError.message) } finally { setBusy(false) }
  }

  const changePassword = async (event) => {
    event.preventDefault()
    setError('')
    if (password !== confirmPassword) { setError('The passwords do not match.'); return }
    setBusy(true)
    try {
      await api.changePasswordWithOtp(localStorage.getItem('vsw_user_token'), { currentPassword, otp, password })
      logout()
      window.location.assign('/login?password-changed=1')
    } catch (requestError) { setError(requestError.message) } finally { setBusy(false) }
  }

  if (loading || !user) return <main className="account-page account-loading">Loading your account…</main>
  return <AuthLayout eyebrow="ACCOUNT SECURITY" title={<>Keep your account<br /><em>protected.</em></>} description="We will verify the change with a one-time code sent to your registered email address.">
    <h2 id="account-title">Change password.</h2>
    <p className="account-muted">{step === 'request' ? `Send a verification code to ${user.email}.` : `Enter the six-digit code sent to ${user.email}. It expires in 10 minutes.`}</p>
    {message && <p className="account-success-message" role="status">{message}</p>}
    {error && <p className="account-error" role="alert">{error}</p>}
    {step === 'request' ? <div className="account-form"><button className="account-submit" type="button" onClick={requestOtp} disabled={busy}>{busy ? 'Sending code…' : 'Send verification code'} <ArrowRight size={17} /></button></div> : <form className="account-form" onSubmit={changePassword}>
      <label>Six-digit code<input type="text" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} value={otp} onChange={(event) => setOtp(event.target.value.replace(/\D/g, '').slice(0, 6))} placeholder="000000" required /></label>
      <label>Current password<input type="password" autoComplete="current-password" value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} required /></label>
      <label>New password<input type="password" autoComplete="new-password" minLength={12} maxLength={72} value={password} onChange={(event) => setPassword(event.target.value)} placeholder="At least 12 characters" required /></label>
      <label>Confirm new password<input type="password" autoComplete="new-password" minLength={12} maxLength={72} value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} placeholder="Enter it again" required /></label>
      <button className="account-submit" type="submit" disabled={busy}>{busy ? 'Updating password…' : 'Update password'} <ArrowRight size={17} /></button>
      <button className="account-back-link" type="button" onClick={requestOtp} disabled={busy}><ArrowLeft size={14} /> Send a new code</button>
    </form>}
    <p className="account-switch"><a href="/account">Back to my account</a></p>
  </AuthLayout>
}
