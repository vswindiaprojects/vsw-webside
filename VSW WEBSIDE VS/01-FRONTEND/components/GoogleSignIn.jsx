import { useEffect, useRef, useState } from 'react'

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID
const GOOGLE_SCRIPT = 'https://accounts.google.com/gsi/client'

export default function GoogleSignIn({ mode = 'signin', onCredential }) {
  const host = useRef(null)
  const credentialHandler = useRef(onCredential)
  const [error, setError] = useState('')
  credentialHandler.current = onCredential

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID || !host.current) return undefined
    let cancelled = false
    const renderButton = () => {
      if (cancelled || !host.current || !window.google?.accounts?.id) return
      window.__vswGoogleCredentialHandler = (credential) => {
        if (!credential) { setError('Google did not return a sign-in credential. Please try again.'); return }
        Promise.resolve(credentialHandler.current(credential)).catch((requestError) => setError(requestError.message || 'Google sign-in failed. Please try again.'))
      }
      if (window.__vswGoogleInitializedFor !== GOOGLE_CLIENT_ID) {
        window.google.accounts.id.initialize({ client_id: GOOGLE_CLIENT_ID, callback: ({ credential }) => window.__vswGoogleCredentialHandler?.(credential), ux_mode: 'popup' })
        window.__vswGoogleInitializedFor = GOOGLE_CLIENT_ID
      }
      window.google.accounts.id.renderButton(host.current, {
        theme: 'outline',
        size: 'large',
        shape: 'rectangular',
        text: mode === 'signup' ? 'signup_with' : 'signin_with',
        width: Math.min(host.current.clientWidth || 340, 420),
        logo_alignment: 'left',
      })
    }
    const existing = document.querySelector(`script[src="${GOOGLE_SCRIPT}"]`)
    if (window.google?.accounts?.id) renderButton()
    else if (existing) {
      existing.addEventListener('load', renderButton, { once: true })
      existing.addEventListener('error', () => setError('Google sign-in could not load. Check your connection and try again.'), { once: true })
    } else {
      const script = document.createElement('script')
      script.src = GOOGLE_SCRIPT
      script.async = true
      script.defer = true
      script.onload = renderButton
      script.onerror = () => setError('Google sign-in could not load. Check your connection and try again.')
      document.head.appendChild(script)
    }
    return () => { cancelled = true; if (host.current) host.current.replaceChildren() }
  }, [mode])

  if (!GOOGLE_CLIENT_ID) return <div className="google-signin-unconfigured"><button className="google-signin-disabled" type="button" disabled><GoogleG />Continue with Google</button><small>Google sign-in needs a Google OAuth client ID.</small></div>
  return <div className="google-signin-wrap"><div className="google-signin-button" ref={host} />{error && <p className="account-error" role="alert">{error}</p>}</div>
}

function GoogleG() {
  return <svg aria-hidden="true" viewBox="0 0 48 48"><path fill="#4285F4" d="M43.6 24.5c0-1.4-.1-2.8-.4-4.1H24v7.8h11a9.4 9.4 0 0 1-4.1 6.1v5h6.7c3.9-3.6 6-8.8 6-14.8Z"/><path fill="#34A853" d="M24 44c5.5 0 10.1-1.8 13.5-4.8l-6.7-5c-1.8 1.2-4.1 2-6.8 2-5.3 0-9.8-3.6-11.4-8.5H5.7v5.1A20 20 0 0 0 24 44Z"/><path fill="#FBBC05" d="M12.6 27.7a12 12 0 0 1 0-7.4v-5.1H5.7a20 20 0 0 0 0 17.6l6.9-5.1Z"/><path fill="#EA4335" d="M24 11.8c3 0 5.7 1 7.8 3.1l5.9-5.9A19.7 19.7 0 0 0 24 4 20 20 0 0 0 5.7 15.2l6.9 5.1c1.6-4.9 6.1-8.5 11.4-8.5Z"/></svg>
}
