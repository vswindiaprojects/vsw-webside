import { useEffect, useState } from 'react'
import { ArrowUpRight, Quote, Star } from 'lucide-react'
import { api } from '../services/api'
import '../styles/reviews.css'

const formatDate = (value) => {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })
}

function Stars({ value = 5, size = 14 }) {
  return (
    <span className="reviews-stars" aria-label={`${value} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <Star key={star} size={size} strokeWidth={1.6} className={star <= Math.round(value) ? 'is-filled' : ''} />
      ))}
    </span>
  )
}

export default function ReviewsSection() {
  const [data, setData] = useState({ reviews: [], total: 0, average: 0 })
  const [loading, setLoading] = useState(true)

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

  useEffect(() => {
    load()
    const onSubmitted = () => load()
    window.addEventListener('vsw:review-submitted', onSubmitted)
    return () => window.removeEventListener('vsw:review-submitted', onSubmitted)
  }, [])

  const openForm = () => window.dispatchEvent(new Event('vsw:open-review'))
  const reviews = data.reviews || []

  return <section className="section reviews-section" id="reviews">
    <div className="shell">
      <div className="reviews-head">
        <div>
          <p className="eyebrow">Client reviews</p>
          <h2>What our<br /><em>clients say.</em></h2>
          <p className="reviews-subheading">Real feedback from clients we have worked with across India.</p>
        </div>
        <div className="reviews-summary">
          <strong>{data.average ? data.average.toFixed(1) : '—'}<span>/5</span></strong>
          <Stars value={data.average || 0} size={16} />
          <small>{data.total ? `${data.total} review${data.total === 1 ? '' : 's'}` : 'No reviews yet'}</small>
          <button type="button" className="reviews-cta" onClick={openForm}>Write a review <ArrowUpRight size={16} /></button>
        </div>
      </div>

      {loading ? (
        <ul className="reviews-grid reviews-grid-loading" aria-busy="true" aria-label="Loading reviews">
          {[0, 1, 2].map((index) => (
            <li className="reviews-skeleton-card" key={index}>
              <span className="skeleton skeleton-icon" />
              <span className="skeleton skeleton-stars" />
              <span className="skeleton skeleton-line" />
              <span className="skeleton skeleton-line" />
              <span className="skeleton skeleton-line skeleton-line-short" />
              <div className="reviews-skeleton-author">
                <span className="skeleton skeleton-avatar" />
                <div>
                  <span className="skeleton skeleton-line skeleton-name" />
                  <span className="skeleton skeleton-line skeleton-meta" />
                </div>
              </div>
            </li>
          ))}
        </ul>
      ) : reviews.length ? (
        <ul className="reviews-grid">
          {reviews.slice(0, 6).map((review) => (
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
          <p>No reviews yet — be the first to share your experience with VSW.</p>
          <button type="button" className="reviews-cta" onClick={openForm}>Write a review <ArrowUpRight size={16} /></button>
        </div>
      )}

      {reviews.length > 0 && <div className="reviews-footer"><button type="button" className="reviews-cta reviews-cta-outline" onClick={openForm}>Share your experience <ArrowUpRight size={16} /></button></div>}
    </div>
  </section>
}
