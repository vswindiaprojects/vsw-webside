import { useEffect, useRef, useState } from 'react'
import { ArrowUpRight, Quote, Star, X } from 'lucide-react'
import { api } from '../services/api'
import '../styles/reviews.css'

const formatDate = (value) => {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })
}

function Stars({ value = 5, size = 14, interactive = false, onChange }) {
  return (
    <span className={`reviews-stars${interactive ? ' reviews-stars-interactive' : ''}`} role={interactive ? 'radiogroup' : undefined} aria-label={interactive ? 'Choose a rating' : `${value} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((star) => (
        interactive
          ? <button key={star} type="button" role="radio" aria-checked={value === star} aria-label={`${star} star${star === 1 ? '' : 's'}`} className={star <= value ? 'is-filled' : ''} onClick={() => onChange?.(star)}><Star size={26} strokeWidth={1.6} /></button>
          : <Star key={star} size={size} strokeWidth={1.6} className={star <= Math.round(value) ? 'is-filled' : ''} />
      ))}
    </span>
  )
}

export default function Reviews() {
  const [data, setData] = useState({ reviews: [], total: 0, average: 0 })
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({ name: '', company: '', rating: 5, message: '' })
  const [status, setStatus] = useState({ type: '', text: '' })
  const [sending, setSending] = useState(false)
  const [thanks, setThanks] = useState(false)
  const dialogRef = useRef(null)

  const load = async () => {
    try {
      const result = await api.reviews()
      setData(result.data || { reviews: [], total: 0, average: 0 })
    } catch {
      setData((current) => current)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  useEffect(() => {
    if (!open) return undefined
    const onKey = (event) => { if (event.key === 'Escape') setOpen(false) }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    dialogRef.current?.focus()
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open])

  const openForm = () => {
    setStatus({ type: '', text: '' })
    setThanks(false)
    setOpen(true)
  }

  const submit = async (event) => {
    event.preventDefault()
    if (sending) return
    setSending(true)
    setStatus({ type: '', text: '' })
    try {
      const result = await api.submitReview({
        name: form.name.trim(),
        company: form.company.trim(),
        rating: Number(form.rating),
        message: form.message.trim(),
      })
      const review = result.data
      setData((current) => {
        const reviews = review ? [review, ...current.reviews] : current.reviews
        const total = reviews.length
        const average = total ? Math.round((reviews.reduce((sum, item) => sum + (Number(item.rating) || 0), 0) / total) * 10) / 10 : 0
        return { reviews, total, average }
      })
      setThanks(true)
      setForm({ name: '', company: '', rating: 5, message: '' })
    } catch (error) {
      setStatus({ type: 'error', text: error.message || 'Could not publish your review. Please try again.' })
    } finally {
      setSending(false)
    }
  }

  const reviews = data.reviews || []

  return <>
    <section className="section reviews-section" id="reviews">
      <div className="shell">
        <div className="reviews-head">
          <div>
            <p className="eyebrow">Client reviews</p>
            <h2>Trusted words from<br /><em>our clients.</em></h2>
          </div>
          <div className="reviews-summary">
            <strong>{data.average ? data.average.toFixed(1) : '—'}<span>/5</span></strong>
            <Stars value={data.average || 0} size={16} />
            <small>{data.total ? `${data.total} review${data.total === 1 ? '' : 's'}` : 'No reviews yet'}</small>
            <button type="button" className="reviews-cta" onClick={openForm}>Write a review <ArrowUpRight size={16} /></button>
          </div>
        </div>

        {loading ? (
          <p className="reviews-loading">Loading reviews…</p>
        ) : reviews.length ? (
          <ul className="reviews-grid">
            {reviews.slice(0, 9).map((review) => (
              <li key={review.id}>
                <Quote size={20} strokeWidth={1.4} className="reviews-quote-icon" />
                <Stars value={review.rating} />
                <p>{review.message}</p>
                <div className="reviews-author">
                  <span>{review.name?.trim()?.charAt(0)?.toUpperCase() || 'C'}</span>
                  <div>
                    <strong>{review.name}</strong>
                    <small>{review.company || 'Client'}{formatDate(review.createdAt) ? ` · ${formatDate(review.createdAt)}` : ''}</small>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="reviews-empty">
            <p>No reviews yet — be the first to share your experience.</p>
            <button type="button" className="reviews-cta" onClick={openForm}>Write a review <ArrowUpRight size={16} /></button>
          </div>
        )}

        {reviews.length > 0 && <div className="reviews-footer"><button type="button" className="reviews-cta reviews-cta-outline" onClick={openForm}>Share your experience <ArrowUpRight size={16} /></button></div>}
      </div>
    </section>

    {open && <div className="reviews-modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setOpen(false) }}>
      <section className="reviews-modal" role="dialog" aria-modal="true" aria-labelledby="reviews-modal-title" tabIndex={-1} ref={dialogRef}>
        <header>
          <div>
            <p className="eyebrow">Your feedback</p>
            <h3 id="reviews-modal-title">{thanks ? 'Thank you!' : 'Write a review'}</h3>
          </div>
          <button type="button" className="reviews-modal-close" onClick={() => setOpen(false)} aria-label="Close review form"><X size={18} /></button>
        </header>

        {thanks ? <>
          <p className="reviews-thanks">Your review is now live on the website. We really appreciate you taking the time.</p>
          <button type="button" className="reviews-submit" onClick={() => setOpen(false)}>Done</button>
        </> : <form onSubmit={submit} className="reviews-form">
          <div className="reviews-form-stars">
            <span>Your rating</span>
            <Stars value={Number(form.rating)} interactive onChange={(rating) => setForm((current) => ({ ...current, rating }))} />
          </div>
          <div className="reviews-form-row">
            <label>Your name<input value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} minLength="2" maxLength="120" autoComplete="name" required /></label>
            <label>Company <span>(optional)</span><input value={form.company} onChange={(event) => setForm((current) => ({ ...current, company: event.target.value }))} maxLength="190" autoComplete="organization" /></label>
          </div>
          <label>Your review<textarea value={form.message} onChange={(event) => setForm((current) => ({ ...current, message: event.target.value }))} rows="4" minLength="10" maxLength="1500" placeholder="Tell us about your experience working with VSW…" required /></label>
          {status.text && <p className={`reviews-status${status.type === 'error' ? ' is-error' : ''}`} role="status">{status.text}</p>}
          <button type="submit" className="reviews-submit" disabled={sending}>{sending ? 'Publishing…' : 'Publish review'} <ArrowUpRight size={16} /></button>
          <p className="reviews-form-note">Your review appears on this page immediately.</p>
        </form>}
      </section>
    </div>}
  </>
}
