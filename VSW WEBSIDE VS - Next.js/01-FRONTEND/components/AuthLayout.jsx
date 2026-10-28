import { ArrowLeft } from 'lucide-react'

export default function AuthLayout({ eyebrow, title, description, children }) {
  return (
    <main className="account-page">
      <header className="account-header">
        <a href="/" className="brand"><span className="brand-mark">VSW</span><span className="brand-name">SOLUTIONS</span></a>
        <a className="account-back" href="/"><ArrowLeft size={15} /> Back to website</a>
      </header>
      <div className="account-layout">
        <section className="account-intro">
          <p className="eyebrow">VSW SOLUTIONS / CLIENT PORTAL</p>
          <h1>{title}</h1>
          <p>{description}</p>
          <div className="account-promise"><span>✓</span><span>Connected project support from first conversation to closeout.</span></div>
        </section>
        <section className="account-card" aria-labelledby="account-title">
          <div className="account-card-heading"><div className="account-icon">{eyebrow.slice(0, 1)}</div><p className="eyebrow">{eyebrow}</p></div>
          {children}
        </section>
      </div>
      <footer className="account-footer"><span>© 2026 VSW Solutions</span><span>Project clarity, from the first conversation.</span></footer>
    </main>
  )
}
