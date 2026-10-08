import { useRef, useState } from 'react'
import { ArrowRight, ArrowUpRight } from 'lucide-react'
import { api } from '../services/api'
import { useAuth } from '../services/AuthContext'

export default function ContactInquiry({ services, company, content = {} }) {
  const { user } = useAuth()
  const [status, setStatus] = useState('')
  const [messageMode, setMessageMode] = useState(false)
  const [loginRequired, setLoginRequired] = useState(false)
  const [visitor, setVisitor] = useState({ name: '', email: '', phone: '' })
  const [sending, setSending] = useState(false)
  const submitting = useRef(false)
  const headOfficeText = company.headOffice || 'Shop No. 6, Makkesh Apartment Co-op. HSG. SOC. LTD., Building No. 1 & 2, Near D-Mart Ready, Navghar Road, Bhayander East, Maharashtra, India.'
  const branchOfficeText = company.branchOffice || 'Shop No. 1, Mauli Chhaya CHS, Konkani Pada, Kurar Village, Malad (East), Mumbai - 400097, Maharashtra, India.'
  const mapQuery = (text) => `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(text)}`
  const authLink = (path) => `${path}?returnTo=${encodeURIComponent('/#contact')}`
  const submit = async (event) => {
    event.preventDefault()
    if (submitting.current) return
    const formElement = event.currentTarget
    const token = localStorage.getItem('vsw_user_token')
    if (!token) { setStatus(''); setLoginRequired(true); return }
    setLoginRequired(false)
    setStatus('Sending…')
    submitting.current = true
    setSending(true)
    const form = new FormData(formElement)
    try {
      await api.contact(token, Object.fromEntries(form.entries()))
      window.location.assign('/thank-you')
    } catch (error) {
      if (error.status === 401 || error.status === 403) {
        localStorage.removeItem('vsw_user_token')
        window.location.assign(authLink('/login'))
        return
      }
      setStatus(error.message)
    } finally {
      submitting.current = false
      setSending(false)
    }
  }
  const submitMessage = async (event) => {
    event.preventDefault()
    const formElement = event.currentTarget
    setStatus('Sending message…')
    setSending(true)
    try {
      await api.contactMessage(Object.fromEntries(new FormData(formElement).entries()))
      window.location.assign('/thank-you?type=message')
    } catch (error) {
      setStatus(error.message || 'Unable to send your message. Please try again.')
    } finally {
      setSending(false)
    }
  }

  return <>
    <section className="section contact-section" id="contact">
      <div className="shell contact-layout">
        <div className="contact-lead">
          <div className="section-intro reveal"><p className="eyebrow">{content.eyebrow || '06 / Contact'}</p><h2>{content.heading || <>Let's make the<br /><em>next move.</em></>}</h2><p className="intro-copy">{content.description || 'Tell us what you are working on. We will bring the right project conversation to the table.'}</p></div>
          <div className="contact-actions"><a className="button button-primary" href={`tel:${(company.phone1 || '+91 98672 67499').replace(/[^+\d]/g,'')}`}>Call VSW <ArrowUpRight size={16} /></a><a className="button button-outline" href={`https://wa.me/${(company.whatsapp || company.phone2 || '+91 91365 14351').replace(/\D/g,'')}`}>WhatsApp <ArrowUpRight size={16} /></a><a className="button button-outline" href={`mailto:${company.email || 'vswindiaprojects@gmail.com'}`}>Email us <ArrowUpRight size={16} /></a></div>
        </div>
        <div className="contact-panel">
          {!messageMode ? <form onSubmit={submit}>
            <div className="form-row"><label>Name<input name="name" value={user?.name ?? visitor.name} onChange={e=>setVisitor(current=>({...current,name:e.target.value}))} readOnly={Boolean(user)} aria-readonly={Boolean(user)} autoComplete="name" required /></label><label>Email<input name="email" type="email" value={user?.email ?? visitor.email} onChange={e=>setVisitor(current=>({...current,email:e.target.value}))} readOnly={Boolean(user)} aria-readonly={Boolean(user)} autoComplete="email" required /></label></div>
            <div className="form-row"><label>Phone<input name="phone" type="tel" value={user?.phone ?? visitor.phone} onChange={e=>setVisitor(current=>({...current,phone:e.target.value}))} readOnly={Boolean(user)} aria-readonly={Boolean(user)} autoComplete="tel" required /></label><label>Company<input name="company" type="text" placeholder="Company name (optional)" /></label></div>
            <label>Subject / Service<select name="service" defaultValue="" required><option value="" disabled>Select a service</option>{services.map((service) => <option key={service.number} value={service.title}>{service.title}</option>)}</select></label>
            <label>Inquiry / Project brief<textarea name="project_brief" placeholder="A little about your project..." rows="4" minLength="10" required /></label>
            <button className="form-submit" type="submit" disabled={sending} formNoValidate={!user}>{sending ? 'Sending…' : 'Send enquiry'} <ArrowUpRight size={17} /></button>
            {status && <p className="form-status" role="status">{status}</p>}
            {loginRequired && <div className="contact-auth-prompt"><p>Please sign in or create an account to submit this project inquiry.</p><div><a className="button button-primary" href={authLink('/login')}>Login <ArrowRight size={16} /></a><a className="button button-outline" href={authLink('/register')}>Register <ArrowUpRight size={16} /></a></div></div>}
            <div className="contact-message-switch"><button type="button" onClick={() => { setStatus(''); setLoginRequired(false); setMessageMode(true) }}>Send a general contact message</button></div>
          </form> : <><form onSubmit={submitMessage}>
            <label>Name<input name="name" autoComplete="name" minLength="2" maxLength="120" required /></label>
            <div className="form-row"><label>Email<input name="email" type="email" autoComplete="email" maxLength="190" required /></label><label>Phone<input name="phone" type="tel" autoComplete="tel" maxLength="50" /></label></div>
            <label>Subject / Service<select name="subject" defaultValue=""><option value="">General message</option>{services.map((service) => <option key={service.number} value={service.title}>{service.title}</option>)}</select></label>
            <label>Message<textarea name="message" placeholder="How can we help?" rows="4" minLength="10" maxLength="10000" required /></label>
            <button className="form-submit" type="submit" disabled={sending}>{sending ? 'Sending…' : 'Send message'} <ArrowUpRight size={17} /></button>
            {status && <p className="form-status" role="status">{status}</p>}
          </form><div className="contact-message-switch"><button type="button" onClick={() => { setStatus(''); setMessageMode(false) }}>Back to project inquiry</button></div></>}
        </div>
      </div>
      <div className="shell offices"><div className="office"><span>Head Office</span><a href={company.googleMapUrl || mapQuery(headOfficeText)} target="_blank" rel="noreferrer"><p>{headOfficeText}</p></a></div><div className="office"><span>Branch Office</span><a href={mapQuery(branchOfficeText)} target="_blank" rel="noreferrer"><p>{branchOfficeText}</p></a></div><div className="office"><span>Get in touch</span><p>Mobile: {company.phone1 || '+91 98672 67499'}<br />{company.phone2 || '+91 91365 14351'}{company.officeHours ? <><br />{company.officeHours}</> : null}</p><a href={`mailto:${company.email || 'vswindiaprojects@gmail.com'}`}>{company.email || 'vswindiaprojects@gmail.com'}</a><a href={`https://${(company.website || 'vswsolutions.com').replace(/^https?:\/\//, '')}`} target="_blank" rel="noreferrer">{(company.website || 'https://vswsolutions.com').replace(/^https?:\/\//, '')}</a></div></div>
      <div className="map-wrap"><iframe title="VSW Solutions office area map" src={company.googleMapUrl || `https://www.google.com/maps?q=${encodeURIComponent(headOfficeText)}&output=embed`} loading="lazy" /></div>
    </section>
  </>
}
