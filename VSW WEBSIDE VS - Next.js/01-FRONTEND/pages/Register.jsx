import { useEffect, useState } from 'react'
import { ArrowRight } from 'lucide-react'
import AuthLayout from '../components/AuthLayout'
import { useAuth } from '../services/AuthContext'

export default function Register() {
  const { register } = useAuth()
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', confirmPassword: '' })
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const returnTo = new URLSearchParams(window.location.search).get('returnTo') || '/'

  useEffect(() => { document.title = 'Create Account | VSW Solutions' }, [])
  const update = (field) => (event) => setForm((current) => ({ ...current, [field]: event.target.value }))
  const submit = async (event) => {
    event.preventDefault()
    setError('')
    if (form.password !== form.confirmPassword) { setError('Your passwords do not match.'); return }
    setBusy(true)
    try {
      const { confirmPassword, ...details } = form
      await register(details)
      window.location.assign(`/login?registered=1&returnTo=${encodeURIComponent(returnTo)}`)
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setBusy(false)
    }
  }

  return <AuthLayout eyebrow="GET STARTED" title={<>Build with<br /><em>confidence.</em></>} description="Create your client account to connect your project conversations with our team.">
    <h2 id="account-title">Create your account.</h2>
    <p className="account-muted">All fields are required to register.</p>
    <form className="account-form" onSubmit={submit}>
      <label>Full name<input autoComplete="name" value={form.name} onChange={update('name')} placeholder="Your full name" minLength={2} maxLength={120} required /></label>
      <label>Email address<input type="email" autoComplete="email" value={form.email} onChange={update('email')} placeholder="you@company.com" required /></label>
      <label>Mobile number<input type="tel" autoComplete="tel" value={form.phone} onChange={update('phone')} placeholder="+91 98765 43210" required /></label>
      <label>Password<input type="password" autoComplete="new-password" value={form.password} onChange={update('password')} placeholder="At least 12 characters" minLength={12} maxLength={72} required /></label>
      <label>Confirm password<input type="password" autoComplete="new-password" value={form.confirmPassword} onChange={update('confirmPassword')} placeholder="Re-enter your password" minLength={12} maxLength={72} required /></label>
      {error && <p className="account-error" role="alert">{error}</p>}
      <button className="account-submit" type="submit" disabled={busy}>{busy ? 'Creating account…' : 'Create account'} <ArrowRight size={17} /></button>
    </form>
    <p className="account-switch">Already have an account? <a href={`/login?returnTo=${encodeURIComponent(returnTo)}`}>Sign in</a></p>
    <p className="account-admin-note">Administrator access is separate. <a href="/admin">Admin sign in</a></p>
  </AuthLayout>
}
