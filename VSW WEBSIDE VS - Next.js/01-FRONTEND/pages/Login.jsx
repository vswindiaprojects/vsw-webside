import { useEffect, useState } from 'react'
import { ArrowRight } from 'lucide-react'
import AuthLayout from '../components/AuthLayout'
import { useAuth } from '../services/AuthContext'

const safeReturnPath = () => {
  const destination = new URLSearchParams(window.location.search).get('returnTo')
  return destination?.startsWith('/') && !destination.startsWith('//') ? destination : '/'
}

export default function Login() {
  const { user, login, loading } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const registered = new URLSearchParams(window.location.search).get('registered') === '1'
  const passwordReset = new URLSearchParams(window.location.search).get('password-reset') === '1'
  const passwordChanged = new URLSearchParams(window.location.search).get('password-changed') === '1'
  const accountDeactivated = new URLSearchParams(window.location.search).get('account-deactivated') === '1'

  useEffect(() => { document.title = 'Client Login | VSW Solutions' }, [])
  useEffect(() => { if (!loading && user) window.location.replace(safeReturnPath()) }, [loading, user])

  const submit = async (event) => {
    event.preventDefault()
    setError('')
    setBusy(true)
    try {
      await login({ email, password })
      window.location.assign(safeReturnPath())
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setBusy(false)
    }
  }

  return <AuthLayout eyebrow="WELCOME BACK" title={<>A clearer way<br />to <em>move forward.</em></>} description="Sign in to manage your profile and follow your VSW project enquiries.">
    <h2 id="account-title">Client sign in.</h2>
    <p className="account-muted">Enter your email and password to continue.</p>
    {registered && <p className="account-success-message" role="status">Registration successful. Please sign in to continue.</p>}
    {(passwordReset || passwordChanged) && <p className="account-success-message" role="status">Password updated. Sign in with your new password.</p>}
    {accountDeactivated && <p className="account-success-message" role="status">Your account was deactivated. Contact VSW if you need help with retained inquiry records.</p>}
    <form className="account-form" onSubmit={submit}>
      <label>Email address<input type="email" autoComplete="username" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@company.com" required /></label>
      <label>Password<input type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Enter your password" required /></label>
      <p className="account-forgot-link"><a href="/forgot-password">Forgot your password?</a></p>
      {error && <p className="account-error" role="alert">{error}</p>}
      <button className="account-submit" type="submit" disabled={busy}>{busy ? 'Signing in…' : 'Sign in'} <ArrowRight size={17} /></button>
    </form>
    <p className="account-switch">New to VSW? <a href={`/register?returnTo=${encodeURIComponent(new URLSearchParams(window.location.search).get('returnTo') || '/')}`}>Create an account</a></p>
    <p className="account-admin-note">Administrator access is separate. <a href="/admin">Admin sign in</a></p>
  </AuthLayout>
}
