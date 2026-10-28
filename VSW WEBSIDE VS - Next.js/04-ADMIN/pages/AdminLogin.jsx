import { useState } from 'react'
import { ArrowLeft, ArrowRight, Eye, EyeOff, ShieldCheck } from 'lucide-react'

export default function AdminLogin({ email, password, error, isSigningIn, onEmailChange, onPasswordChange, onSubmit }) {
  const [showPassword, setShowPassword] = useState(false)
  return <div className="admin-login">
    <a href="/" className="admin-back"><ArrowLeft size={16} /> Back to website</a>
    <main className="admin-login-card">
      <div className="admin-login-mark"><ShieldCheck size={25} /></div>
      <p className="eyebrow">VSW SOLUTIONS / ADMIN</p>
      <h1>Welcome back.</h1>
      <p>Sign in to manage website content and enquiries.</p>
      <form onSubmit={onSubmit}>
        <label htmlFor="admin-email">Email address</label>
        <input id="admin-email" type="email" autoComplete="username" value={email} onChange={(event) => onEmailChange(event.target.value)} placeholder="admin@example.com" required />
        <label htmlFor="admin-password">Password</label>
        <div className="admin-password-field">
          <input id="admin-password" type={showPassword ? 'text' : 'password'} autoComplete="current-password" value={password} onChange={(event) => onPasswordChange(event.target.value)} placeholder="Enter your password" required />
          <button type="button" className="admin-password-toggle" aria-label={showPassword ? 'Hide password' : 'Show password'} onClick={() => setShowPassword(!showPassword)}>{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button>
        </div>
        {error && <p className="admin-login-error" role="alert">{error}</p>}
        <button type="submit" disabled={isSigningIn}>{isSigningIn ? 'Signing in...' : 'Sign in'} <ArrowRight size={16} /></button>
      </form>
      <p className="admin-login-note">Admin accounts are created by the site owner.</p>
    </main>
  </div>
}
