import { useState } from 'react'
import { ArrowRight, X } from 'lucide-react'
import { api } from '../../01-FRONTEND/services/api'

const inquiryRef = (id) => `INQ-${String(id).padStart(5, '0')}`
const dateTime = (date) => new Date(date).toLocaleString()

export default function AdminInquiries({ inquiries, token, statuses = [], onUpdate, onError, onView, onArchive }) {
  const [selected, setSelected] = useState(null)
  const [messages, setMessages] = useState([])
  const [reply, setReply] = useState('')
  const [busy, setBusy] = useState(false)
  if (!inquiries.length) return <p className="admin-empty">No inquiries have been submitted yet.</p>
  const update = async (id, status) => {
    try { await api.updateMessage(token, id, status); await onUpdate() } catch (error) { onError(error.message) }
  }
  const openConversation = async (inquiry) => {
    setSelected(inquiry); setMessages([]); setReply('')
    try { const result = await api.adminInquiryMessages(token, inquiry.id); setMessages(result.data) } catch (error) { onError(error.message) }
  }
  const sendReply = async (event) => {
    event.preventDefault()
    if (!reply.trim() || !selected) return
    setBusy(true)
    try {
      await api.adminReplyToInquiry(token, selected.id, reply.trim())
      setReply('')
      const result = await api.adminInquiryMessages(token, selected.id)
      setMessages(result.data)
      await onUpdate()
    } catch (error) { onError(error.message) } finally { setBusy(false) }
  }
  return <>
    <div className="admin-table-wrap"><table><thead><tr><th>ID</th><th>User</th><th>Email</th><th>Phone</th><th>Subject / Service</th><th>Message</th><th>Date</th><th>Status</th><th>Actions</th></tr></thead><tbody>{inquiries.map((item) => <tr key={item.id}><td>{inquiryRef(item.id)}</td><td>{item.name}</td><td>{item.email}</td><td>{item.phone}</td><td>{item.service}</td><td>{item.message ?? item.project_brief}</td><td>{new Date(item.createdAt).toLocaleDateString()}</td><td><select className="admin-status-select" aria-label={`Inquiry ${item.id} status`} value={item.status} onChange={(event) => update(item.id, event.target.value)}>{statuses.map((status) => <option key={status} value={status}>{status}</option>)}</select></td><td>{onView&&<button className="admin-reply-button" type="button" onClick={()=>onView(item)}>Details</button>} <button className="admin-reply-button" type="button" onClick={() => openConversation(item)}>Conversation</button>{onArchive&&<button className="admin-reply-button" type="button" onClick={()=>onArchive(item)}>Archive</button>}</td></tr>)}</tbody></table></div>
    {selected && <div className="admin-conversation-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setSelected(null) }}><section className="admin-conversation" role="dialog" aria-modal="true" aria-labelledby="admin-conversation-title"><header><div><p className="eyebrow">{inquiryRef(selected.id)} · {selected.email}</p><h2 id="admin-conversation-title">{selected.name} — {selected.service}</h2></div><button type="button" aria-label="Close conversation" onClick={() => setSelected(null)}><X size={18} /></button></header><div className="admin-conversation-original"><strong>Original inquiry</strong><p>{selected.project_brief}</p></div><div className="admin-conversation-messages">{messages.length === 0 ? <p>No replies yet.</p> : messages.map((message) => <article key={message.id} className={message.senderType === 'Admin' ? 'admin-message' : 'customer-message'}><div><strong>{message.senderName}</strong><time>{dateTime(message.createdAt)}</time></div><p>{message.message}</p></article>)}</div>{!['Closed','Cancelled'].includes(selected.status) ? <form onSubmit={sendReply} className="admin-conversation-form"><label htmlFor="admin-reply">Reply to customer</label><textarea id="admin-reply" value={reply} onChange={(event) => setReply(event.target.value)} maxLength={5000} required placeholder="Write a reply…"/><button type="submit" disabled={busy || !reply.trim()}>{busy ? 'Sending…' : 'Send reply'} <ArrowRight size={15}/></button></form> : <p className="admin-conversation-closed">This inquiry is closed or cancelled. Reopen it using the status selector to reply.</p>}</section></div>}
  </>
}
