import { useEffect, useMemo, useState } from 'react'
import { ArrowRight, ArrowUpRight, Bell, Check, ChevronLeft, ChevronRight, CircleUserRound, ClipboardList, Clock3, KeyRound, LogOut, RefreshCw, Search, Settings2, ShieldCheck, UserRound, X } from 'lucide-react'
import { api } from '../services/api'
import { useAuth } from '../services/AuthContext'

const emptySettings = { emailNotifications: true, inquiryNotifications: true, replyNotifications: true, marketingEmails: false }
const dateTime = (value) => value ? new Date(value).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' }) : '—'
const dateOnly = (value) => value ? new Date(value).toLocaleDateString(undefined, { day: '2-digit', month: 'long', year: 'numeric' }) : '—'
const inquiryRef = (id) => `INQ-${String(id).padStart(5, '0')}`
const statusClass = (status) => `dashboard-status status-${String(status).toLowerCase().replace(/[^a-z]+/g, '-')}`

export default function UserDashboard() {
  const { user: authUser, loading, logout } = useAuth()
  const [profile, setProfile] = useState(null)
  const [summary, setSummary] = useState({})
  const [inquiries, setInquiries] = useState([])
  const [notifications, setNotifications] = useState([])
  const [activity, setActivity] = useState([])
  const [settings, setSettings] = useState(emptySettings)
  const [statuses, setStatuses] = useState([])
  const [activeSection, setActiveSection] = useState('dashboard')
  const [editingProfile, setEditingProfile] = useState(false)
  const [profileDraft, setProfileDraft] = useState(null)
  const [search, setSearch] = useState('')
  const [searchDraft, setSearchDraft] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [page, setPage] = useState(1)
  const [totalInquiries, setTotalInquiries] = useState(0)
  const [selectedInquiry, setSelectedInquiry] = useState(null)
  const [conversation, setConversation] = useState([])
  const [replyDraft, setReplyDraft] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const token = () => localStorage.getItem('vsw_user_token')
  const totalPages = Math.max(1, Math.ceil(totalInquiries / 10))
  const unreadCount = useMemo(() => notifications.filter((item) => !item.isRead).length, [notifications])

  useEffect(() => { document.title = 'My Account | VSW Solutions' }, [])
  useEffect(() => { if (!loading && !authUser) window.location.replace(`/login?returnTo=${encodeURIComponent('/account')}`) }, [loading, authUser])

  const loadDashboard = async (nextPage = page, nextSearch = search, nextStatus = statusFilter) => {
    const authToken = token()
    if (!authToken) return
    setBusy(true)
    setError('')
    const params = { page: String(nextPage), limit: '10', ...(nextSearch ? { search: nextSearch } : {}), ...(nextStatus ? { status: nextStatus } : {}) }
    try {
      const { data } = await api.accountDashboard(authToken, params)
      setProfile(data.profile)
      setSummary(data.summary)
      setInquiries(data.inquiries)
      setTotalInquiries(data.totalInquiries)
      setNotifications(data.notifications)
      setActivity(data.activity)
      setSettings(Object.fromEntries(Object.entries(data.settings).map(([key, value]) => [key, Boolean(value)])))
      setStatuses(data.statuses)
    } catch (requestError) {
      if ([401, 403].includes(requestError.status)) { await logout(); window.location.replace(`/login?returnTo=${encodeURIComponent('/account')}`); return }
      setError(requestError.message)
    } finally { setBusy(false) }
  }

  useEffect(() => { if (authUser) loadDashboard(1, '', '') }, [authUser])

  const jumpTo = (section) => { setActiveSection(section); document.getElementById(section)?.scrollIntoView({ behavior: 'smooth', block: 'start' }) }
  const performSearch = (event) => { event.preventDefault(); setSearch(searchDraft.trim()); setPage(1); loadDashboard(1, searchDraft.trim(), statusFilter) }
  const changeStatusFilter = (value) => { setStatusFilter(value); setPage(1); loadDashboard(1, search, value) }

  const saveProfile = async (event) => {
    event.preventDefault(); setBusy(true); setError(''); setSuccess('')
    try {
      await api.updateProfile(token(), profileDraft)
      setEditingProfile(false); setSuccess('Your profile was updated.'); await loadDashboard(page, search, statusFilter)
    } catch (requestError) { setError(requestError.message) } finally { setBusy(false) }
  }

  const saveSettings = async (event) => {
    event.preventDefault(); setBusy(true); setError(''); setSuccess('')
    try { await api.updateAccountSettings(token(), settings); setSuccess('Notification preferences saved.') }
    catch (requestError) { setError(requestError.message) } finally { setBusy(false) }
  }

  const openInquiry = async (item) => {
    setSelectedInquiry(item); setConversation([]); setReplyDraft(''); setError('')
    try {
      const result = await api.inquiryMessages(token(), item.id)
      setConversation(result.data)
    } catch (requestError) { setError(requestError.message) }
  }

  const sendReply = async (event) => {
    event.preventDefault()
    if (!selectedInquiry || !replyDraft.trim()) return
    setBusy(true); setError('')
    try {
      await api.replyToInquiry(token(), selectedInquiry.id, replyDraft.trim())
      setReplyDraft('')
      const result = await api.inquiryMessages(token(), selectedInquiry.id)
      setConversation(result.data)
      setSuccess('Your reply was sent to the VSW team.')
      await loadDashboard(page, search, statusFilter)
    } catch (requestError) { setError(requestError.message) } finally { setBusy(false) }
  }

  const markRead = async (id) => {
    try { await api.markNotificationRead(token(), id); setNotifications((old) => old.map((item) => item.id === id ? { ...item, isRead: 1 } : item)) }
    catch (requestError) { setError(requestError.message) }
  }
  const markAllRead = async () => {
    try { await api.markAllNotificationsRead(token()); setNotifications((old) => old.map((item) => ({ ...item, isRead: 1 }))) }
    catch (requestError) { setError(requestError.message) }
  }
  const deleteAccount = async () => {
    if (!window.confirm('Are you sure you want to deactivate your account? Your inquiry records will be retained for business records.')) return
    try { await api.deactivateAccount(token()); await logout(); window.location.assign('/login?account-deactivated=1') }
    catch (requestError) { setError(requestError.message) }
  }

  if (loading || !authUser || !profile) return <main className="account-page account-loading">Loading your account…</main>
  const initials = profile.name.split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase()
  const nav = [['dashboard','Dashboard',CircleUserRound],['profile','My Profile',UserRound],['inquiries','My Inquiries',ClipboardList],['notifications','Notifications',Bell],['activity','Recent Activity',Clock3],['settings','Account Settings',Settings2]]
  const statCards = [['Total Inquiries', summary.total, 'total'],['Pending', summary.pending, 'pending'],['In Progress', summary.inProgress, 'in-progress'],['Responded', summary.responded, 'responded'],['Closed', summary.closed, 'closed']]

  return <main className="account-page dashboard-page">
    <header className="account-header"><a href="/" className="brand"><span className="brand-mark">VSW</span><span className="brand-name">SOLUTIONS</span></a><div className="dashboard-header-actions"><a href="/#contact">Send New Inquiry <ArrowUpRight size={15} /></a><button type="button" onClick={async() => { await logout(); window.location.assign('/login') }}><LogOut size={15} /> Log out</button></div></header>
    <div className="dashboard-shell">
      <aside className="dashboard-sidebar"><div className="dashboard-user-mini"><span className="dashboard-avatar">{initials}</span><div><strong>{profile.name}</strong><span>{profile.email}</span></div></div><nav aria-label="Account sections">{nav.map(([id,label,Icon]) => <button key={id} className={activeSection === id ? 'active' : ''} onClick={() => jumpTo(id)}><Icon size={17} />{label}{id === 'notifications' && unreadCount > 0 && <span className="dashboard-nav-count">{unreadCount}</span>}</button>)}</nav><a className="dashboard-sidebar-password" href="/change-password"><KeyRound size={16} /> Change password</a></aside>
      <div className="dashboard-main">
        {(error || success) && <div className={error ? 'dashboard-flash is-error' : 'dashboard-flash is-success'} role={error ? 'alert' : 'status'}>{error || success}<button type="button" aria-label="Dismiss message" onClick={() => { setError(''); setSuccess('') }}><X size={15} /></button></div>}
        <section id="dashboard" className="dashboard-section dashboard-welcome"><div><p className="eyebrow">CLIENT DASHBOARD</p><h1>Welcome back, <em>{profile.name.split(' ')[0]}.</em></h1><p>Your VSW account, project enquiries and updates at a glance.</p></div><button className="dashboard-refresh" type="button" onClick={() => loadDashboard(page, search, statusFilter)} disabled={busy}><RefreshCw size={16} className={busy ? 'refreshing' : ''} /> Refresh</button></section>
        <div className="dashboard-profile-strip"><div className="dashboard-avatar dashboard-avatar-large">{profile.profileImage ? <img src={profile.profileImage} alt="Profile" /> : initials}</div><div className="dashboard-identity"><h2>{profile.name}</h2><span>{profile.email}</span><span>{profile.phone}</span></div><div className="dashboard-account-meta"><span className={`account-state state-${profile.status}`}>{profile.status}</span><small>Member since {dateOnly(profile.createdAt)}</small><small>Last login {dateTime(profile.lastLoginAt)}</small></div></div>
        <section className="dashboard-section" aria-label="Inquiry summary"><div className="dashboard-stats">{statCards.map(([label,value,key]) => <article className={`dashboard-stat stat-${key}`} key={key}><span>{label}</span><strong>{Number(value || 0)}</strong></article>)}</div></section>

        <section id="profile" className="dashboard-section dashboard-panel"><div className="dashboard-panel-heading"><div><p className="eyebrow">PROFILE</p><h2>Profile information</h2></div>{!editingProfile && <button type="button" className="dashboard-text-button" onClick={() => { setProfileDraft({ name:profile.name, phone:profile.phone || '', companyName:profile.companyName || '', address:profile.address || '', city:profile.city || '', state:profile.state || '', country:profile.country || '', postalCode:profile.postalCode || '', profileImage:profile.profileImage || '' }); setEditingProfile(true) }}>Edit profile <ArrowUpRight size={15} /></button>}</div>
          {editingProfile ? <form className="dashboard-profile-form" onSubmit={saveProfile}><label>Full name<input value={profileDraft.name} onChange={(e) => setProfileDraft({...profileDraft,name:e.target.value})} minLength="2" maxLength="120" required /></label><label>Email address<input value={profile.email} readOnly disabled /></label><label>Mobile number<input type="tel" value={profileDraft.phone} onChange={(e) => setProfileDraft({...profileDraft,phone:e.target.value})} required /></label><label>Company / organization<input value={profileDraft.companyName} onChange={(e) => setProfileDraft({...profileDraft,companyName:e.target.value})} maxLength="190" /></label><label>Address<input value={profileDraft.address} onChange={(e) => setProfileDraft({...profileDraft,address:e.target.value})} maxLength="255" /></label><label>City<input value={profileDraft.city} onChange={(e) => setProfileDraft({...profileDraft,city:e.target.value})} maxLength="120" /></label><label>State<input value={profileDraft.state} onChange={(e) => setProfileDraft({...profileDraft,state:e.target.value})} maxLength="120" /></label><label>Country<input value={profileDraft.country} onChange={(e) => setProfileDraft({...profileDraft,country:e.target.value})} maxLength="120" /></label><label>PIN / ZIP code<input value={profileDraft.postalCode} onChange={(e) => setProfileDraft({...profileDraft,postalCode:e.target.value})} maxLength="20" /></label><label className="profile-photo-url">Profile photo URL (HTTPS)<input type="url" value={profileDraft.profileImage} onChange={(e) => setProfileDraft({...profileDraft,profileImage:e.target.value})} placeholder="https://example.com/photo.jpg" maxLength="500" /></label><div className="dashboard-form-actions"><button className="dashboard-primary-button" type="submit" disabled={busy}>Save profile <Check size={15} /></button><button className="dashboard-secondary-button" type="button" onClick={() => setEditingProfile(false)}>Cancel</button></div></form> : <dl className="dashboard-profile-grid"><div><dt>Full name</dt><dd>{profile.name}</dd></div><div><dt>Email address</dt><dd>{profile.email}<small>Email is your account sign-in and cannot be changed here.</small></dd></div><div><dt>Mobile number</dt><dd>{profile.phone}</dd></div><div><dt>Company / organization</dt><dd>{profile.companyName || 'Not provided'}</dd></div><div className="profile-address"><dt>Address</dt><dd>{[profile.address,profile.city,profile.state,profile.postalCode,profile.country].filter(Boolean).join(', ') || 'Not provided'}</dd></div><div><dt>Account created</dt><dd>{dateOnly(profile.createdAt)}</dd></div></dl>}
        </section>

        <section id="inquiries" className="dashboard-section dashboard-panel"><div className="dashboard-panel-heading"><div><p className="eyebrow">PROJECT CONVERSATIONS</p><h2>My inquiries</h2></div><a className="dashboard-text-button" href="/#contact">Send new inquiry <ArrowUpRight size={15} /></a></div>
          <form className="dashboard-inquiry-tools" onSubmit={performSearch}><label className="dashboard-search"><Search size={16} /><input value={searchDraft} onChange={(e) => setSearchDraft(e.target.value)} placeholder="Search inquiries" aria-label="Search inquiries" /></label><select value={statusFilter} onChange={(e) => changeStatusFilter(e.target.value)} aria-label="Filter inquiries by status"><option value="">All statuses</option>{statuses.map((status) => <option key={status} value={status}>{status}</option>)}</select><button type="submit">Search</button></form>
          {inquiries.length === 0 ? <div className="dashboard-empty"><ClipboardList size={27} /><strong>No inquiries found.</strong><span>Submit an inquiry to start a project conversation with VSW.</span></div> : <div className="dashboard-inquiry-list">{inquiries.map((item) => <article className="dashboard-inquiry-card" key={item.id}><div className="inquiry-card-top"><span>{inquiryRef(item.id)}</span><span className={statusClass(item.status)}>{item.status}</span></div><h3>{item.subject}</h3><p className="inquiry-service-label">{item.service}</p><p className="inquiry-message-preview">{item.message}</p><div className="inquiry-card-bottom"><time dateTime={item.createdAt}>Submitted {dateOnly(item.createdAt)} · Updated {dateOnly(item.updatedAt)}</time><button type="button" onClick={() => openInquiry(item)}>View details <ArrowRight size={14} /></button></div></article>)}</div>}
          {totalPages > 1 && <div className="dashboard-pagination"><span>{totalInquiries} inquiries</span><div><button type="button" disabled={page <= 1 || busy} onClick={() => { const p=page-1; setPage(p); loadDashboard(p,search,statusFilter) }} aria-label="Previous page"><ChevronLeft size={17} /></button><span>Page {page} of {totalPages}</span><button type="button" disabled={page >= totalPages || busy} onClick={() => { const p=page+1; setPage(p); loadDashboard(p,search,statusFilter) }} aria-label="Next page"><ChevronRight size={17} /></button></div></div>}
        </section>

        <section id="notifications" className="dashboard-section dashboard-panel"><div className="dashboard-panel-heading"><div><p className="eyebrow">UPDATES</p><h2>Notifications {unreadCount > 0 && <span className="dashboard-unread-pill">{unreadCount} new</span>}</h2></div>{unreadCount > 0 && <button className="dashboard-text-button" type="button" onClick={markAllRead}>Mark all as read</button>}</div>{notifications.length === 0 ? <div className="dashboard-empty compact"><Bell size={24} /><strong>You’re all caught up.</strong></div> : <div className="dashboard-notifications">{notifications.map((item) => <article key={item.id} className={`dashboard-notification ${item.isRead ? '' : 'unread'}`}><span className="notification-dot" /><div><h3>{item.title}</h3><p>{item.message}</p><time>{dateTime(item.createdAt)}</time>{item.inquiryId && <button type="button" onClick={() => { const itemToOpen=inquiries.find((x)=>x.id===item.inquiryId); if(itemToOpen) openInquiry(itemToOpen); else jumpTo('inquiries') }}>View inquiry</button>}</div>{!item.isRead && <button className="mark-read-button" type="button" onClick={() => markRead(item.id)}>Mark read</button>}</article>)}</div>}</section>

        <section id="activity" className="dashboard-section dashboard-panel"><div className="dashboard-panel-heading"><div><p className="eyebrow">ACCOUNT TIMELINE</p><h2>Recent activity</h2></div></div>{activity.length === 0 ? <div className="dashboard-empty compact"><Clock3 size={24} /><strong>No recent activity.</strong></div> : <ol className="dashboard-activity-list">{activity.map((item) => <li key={item.id}><span className="activity-marker" /><div><p>{item.summary}</p><time>{dateTime(item.createdAt)}</time></div>{item.inquiryId && <span>{inquiryRef(item.inquiryId)}</span>}</li>)}</ol>}</section>

        <section id="settings" className="dashboard-section dashboard-panel"><div className="dashboard-panel-heading"><div><p className="eyebrow">PREFERENCES & SECURITY</p><h2>Account settings</h2></div></div><form className="dashboard-settings-form" onSubmit={saveSettings}><p>Choose which account updates you would like to receive by email.</p>{[['emailNotifications','Email notifications'],['inquiryNotifications','Inquiry status updates'],['replyNotifications','Admin reply notifications'],['marketingEmails','Occasional VSW news and marketing']].map(([key,label])=><label className="dashboard-toggle" key={key}><span>{label}</span><input type="checkbox" checked={Boolean(settings[key])} onChange={(e)=>setSettings({...settings,[key]:e.target.checked})}/><i aria-hidden="true" /></label>)}<button className="dashboard-primary-button" type="submit" disabled={busy}>Save preferences <Check size={15}/></button></form><div className="dashboard-security-actions"><div><ShieldCheck size={18}/><span><strong>Account security</strong><small>Password was last updated using verified account access.</small></span></div><a href="/change-password">Change password <ArrowUpRight size={15}/></a></div><div className="dashboard-delete-account"><div><strong>Deactivate account</strong><p>Your inquiry history will be retained for business records.</p></div><button type="button" onClick={deleteAccount}>Deactivate</button></div></section>

        <footer className="dashboard-footer"><a href="/">VSW SOLUTIONS</a><span>Accurate Data. Innovative Design. Efficient Execution.</span></footer>
      </div>
    </div>

    {selectedInquiry && <div className="inquiry-modal-backdrop" role="presentation" onMouseDown={(e)=>{if(e.target===e.currentTarget)setSelectedInquiry(null)}}><section className="inquiry-modal" role="dialog" aria-modal="true" aria-labelledby="inquiry-modal-title"><header><div><p className="eyebrow">{inquiryRef(selectedInquiry.id)}</p><h2 id="inquiry-modal-title">{selectedInquiry.subject}</h2></div><button type="button" onClick={()=>setSelectedInquiry(null)} aria-label="Close inquiry"><X size={19}/></button></header><div className="inquiry-modal-meta"><span>Service<strong>{selectedInquiry.service}</strong></span><span>Status<strong className={statusClass(selectedInquiry.status)}>{selectedInquiry.status}</strong></span><span>Submitted<strong>{dateTime(selectedInquiry.createdAt)}</strong></span><span>Last updated<strong>{dateTime(selectedInquiry.updatedAt)}</strong></span></div><div className="inquiry-original-message"><span>YOUR MESSAGE</span><p>{selectedInquiry.originalMessage || selectedInquiry.message}</p></div><div className="inquiry-conversation"><h3>Conversation</h3>{conversation.length === 0 ? <p className="conversation-empty">No replies yet. The VSW team will respond here.</p> : conversation.map((entry)=><article key={entry.id} className={`conversation-message ${entry.senderType === 'User' ? 'from-user' : 'from-admin'}`}><div><strong>{entry.senderType === 'User' ? 'You' : entry.senderName}</strong><time>{dateTime(entry.createdAt)}</time></div><p>{entry.message}</p></article>)}</div>{!['Closed','Cancelled'].includes(selectedInquiry.status) && <form className="inquiry-reply-form" onSubmit={sendReply}><label htmlFor="reply-message">Write a reply</label><textarea id="reply-message" value={replyDraft} onChange={(e)=>setReplyDraft(e.target.value)} maxLength={5000} placeholder="Write a reply…" required/><div><small>{replyDraft.length}/5000</small><button className="dashboard-primary-button" type="submit" disabled={busy || !replyDraft.trim()}>Send reply <ArrowRight size={15}/></button></div></form>}{['Closed','Cancelled'].includes(selectedInquiry.status) && <p className="conversation-closed">This inquiry is closed. Contact VSW to discuss reopening it.</p>}</section></div>}
  </main>
}
