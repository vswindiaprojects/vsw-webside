import { Phone } from 'lucide-react'
import '../styles/call-button.css'

const DEFAULT_PHONE = '+91 91365 14351'

export default function CallButton({ phone = DEFAULT_PHONE }) {
  const label = String(phone || DEFAULT_PHONE).trim()
  const tel = label.replace(/[^\d+]/g, '')
  if (!tel) return null
  return (
    <a className="call-fab" href={`tel:${tel}`} aria-label={`Call VSW Solutions on ${label}`}>
      <span className="call-fab__icon" aria-hidden="true"><Phone size={20} strokeWidth={2} /></span>
      <span className="call-fab__text"><small>Call us now</small><strong>{label}</strong></span>
    </a>
  )
}
