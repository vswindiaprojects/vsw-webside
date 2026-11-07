import { useEffect, useRef, useState } from 'react'
import { ArrowUpRight, Star, X } from 'lucide-react'
import { api } from '../services/api'
import '../styles/reviews.css'

function Stars({ value = 5, interactive = false, onChange }) {
  return (
    <span className={`reviews-stars${interactive ? ' reviews-stars-interactive' : ''}`} role={interactive ? 'radiogroup' : undefined} aria-label={interactive ? 'Choose a rating' : `${value} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((star) => (
        interactive
          ? <button key={star} type="button" role="radio" aria-checked={value === star} aria-label={`${star} star${star === 1 ? '' : 's'}`} className={star <= value ? 'is-filled' : ''} onClick={() => onChange?.(star)}><Star size={26} strokeWidth={1.6} /></button>
          : <Star key={star} size={14} strokeWidth={1.6} className={star <= Math.round(value) ? 'is-filled' : ''} />
      ))}
    </span>
  )
}

export default function ReviewButton() {
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({ name: '', company: '', rating: 5, message: '' })
  const [status, setStatus] = useState({ type: '', text: '' })
  const [sending, setSending] = useState(false)
  const [thanks, setThanks] = useState(false)
  const dialogRef = useRef(null)

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
      await api.submitReview({
        name: form.name.trim(),
        company: form.company.trim(),
        rating: Number(form.rating),
        message: form.message.trim(),
      })
      setThanks(true)
      setForm({ name: '', company: '', rating: 5, message: '' })
    } catch (error) {
      setStatus({ type: 'error', text: error.message || 'Could not submit your review. Please try again.' })
    } finally {
      setSending(false)
    }
  }

  return <>
    <button type="button" className="review-fab" onClick={openForm} aria-label="Write a client review">
      <span className="review-fab__icon" aria-hidden="true"><Star size={20} strokeWidth={1.8} /></span>
      <span className="review-fab__text"><small>Client feedback</small><strong>Write a review</strong></span>
    </button>

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
          <p className="reviews-thanks">Your review has been submitted. We really appreciate you taking the time to share your experience with us.</p>
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
          <button type="submit" className="reviews-submit" disabled={sending}>{sending ? 'Submitting…' : 'Submit review'} <ArrowUpRight size={16} /></button>
          <p className="reviews-form-note">Your feedback goes directly to the VSW team.</p>
        </form>}
      </section>
    </div>}
  </>
}
