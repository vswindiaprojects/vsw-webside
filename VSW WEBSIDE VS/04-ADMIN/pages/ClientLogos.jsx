import { useEffect, useMemo, useRef, useState } from 'react'
import { ArrowDown, ArrowUp, Eye, Image as ImageIcon, Plus, RefreshCw, Save, Send, Trash2, Upload } from 'lucide-react'
import { api } from '../../01-FRONTEND/services/api'
import ClientLogoMarquee from '../../01-FRONTEND/components/ClientLogoMarquee'
import AllClients from '../../01-FRONTEND/components/AllClients'
import './ClientLogos.css'

const MAX_LOGO_BYTES = 3 * 1024 * 1024

const initials = (name) => String(name || 'Client').trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase() || 'CL'

const emptyNewLogo = () => ({ name: '', imageUrl: '', alt: '', link: '' })

const makeLogoId = () => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') return `logo-${crypto.randomUUID()}`
  return `logo-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
}

function LogoThumb({ logo }) {
  const [failed, setFailed] = useState(false)
  useEffect(() => setFailed(false), [logo.imageUrl])
  if (logo.imageUrl && !failed) {
    return <img src={logo.imageUrl} alt="" onError={() => setFailed(true)} />
  }
  return <span className="client-admin-logo-fallback">{initials(logo.name)}</span>
}

export default function ClientLogos({ data, token, admin, onRefresh }) {
  const [config, setConfig] = useState(() => data?.draft || null)
  const [dirty, setDirty] = useState(false)
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState('')
  const [problem, setProblem] = useState('')
  const [newLogo, setNewLogo] = useState(emptyNewLogo)
  const addFileRef = useRef(null)
  const canPublish = ['super_admin', 'admin'].includes(String(admin?.role || '').toLowerCase())

  useEffect(() => {
    if (!data?.draft) return
    setConfig(data.draft)
    setDirty(false)
  }, [data])

  const placeholders = useMemo(() => (config?.logos || []).filter((logo) => logo.imageUrl?.includes('/placeholder-')).length, [config?.logos])

  if (!config) return <div className="admin-empty">Loading client logo settings…</div>

  const updateSetting = (key, value) => {
    setConfig((current) => ({ ...current, [key]: value }))
    setDirty(true)
    setNotice('')
    setProblem('')
  }

  // The top strip ("Trusted by leading brands") can show a shortlist of logos while
  // the full "Our Clients" directory below keeps every enabled client. An empty
  // shortlist means "show every logo in the strip".
  const stripIds = Array.isArray(config.marqueeIds) ? config.marqueeIds : []
  const inStrip = (id) => (stripIds.length === 0 ? true : stripIds.includes(id))
  const toggleStrip = (id) => {
    const current = stripIds.length ? stripIds : config.logos.filter((logo) => logo.enabled !== false).map((logo) => logo.id)
    const next = current.includes(id) ? current.filter((item) => item !== id) : [...current, id]
    if (!next.length) {
      setProblem('The strip needs at least one logo. Select another logo for the strip first.')
      return
    }
    updateSetting('marqueeIds', next)
  }

  const updateLogo = (id, changes) => {
    setConfig((current) => ({
      ...current,
      logos: current.logos.map((logo) => logo.id === id ? { ...logo, ...changes } : logo),
    }))
    setDirty(true)
    setNotice('')
  }

  const moveLogo = (index, direction) => {
    const target = index + direction
    if (target < 0 || target >= config.logos.length) return
    setConfig((current) => {
      const logos = [...current.logos]
      ;[logos[index], logos[target]] = [logos[target], logos[index]]
      return { ...current, logos }
    })
    setDirty(true)
  }

  const deleteLogo = (logo) => {
    if (!window.confirm(`Remove ${logo.name || 'this logo'} from the board? Uploaded files are kept in the media folder.`)) return
    setConfig((current) => ({ ...current, logos: current.logos.filter((item) => item.id !== logo.id) }))
    setDirty(true)
    setNotice('')
  }

  const removePlaceholders = () => {
    if (!placeholders) return
    if (!window.confirm(`Remove ${placeholders} development placeholder logo${placeholders === 1 ? '' : 's'}?`)) return
    setConfig((current) => ({ ...current, logos: current.logos.filter((logo) => !logo.imageUrl?.includes('/placeholder-')) }))
    setDirty(true)
    setNotice('Placeholders removed from the draft. Save the draft to keep this change.')
  }

  const uploadFile = async (file) => {
    if (!file) return ''
    if (file.size > MAX_LOGO_BYTES) {
      setProblem('Logo images must be 3 MB or smaller.')
      return ''
    }
    const formData = new FormData()
    formData.append('file', file)
    setBusy(true)
    setProblem('')
    setNotice('')
    try {
      const result = await api.uploadClientLogo(token, formData)
      return result.data?.url || ''
    } catch (error) {
      setProblem(error.message || 'Unable to upload the logo.')
      return ''
    } finally {
      setBusy(false)
    }
  }

  const replaceLogoFile = async (logo, event) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    const url = await uploadFile(file)
    if (url) {
      updateLogo(logo.id, { imageUrl: url })
      setNotice('Logo uploaded. Save the draft to keep it.')
    }
  }

  const uploadNewLogo = async (event) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    const url = await uploadFile(file)
    if (url) setNewLogo((current) => ({ ...current, imageUrl: url }))
  }

  const addLogo = (event) => {
    event.preventDefault()
    const name = newLogo.name.trim()
    if (!name) {
      setProblem('Enter a company name before adding a logo.')
      return
    }
    setConfig((current) => ({
      ...current,
      logos: [...current.logos, {
        id: makeLogoId(),
        name,
        imageUrl: newLogo.imageUrl.trim(),
        alt: newLogo.alt.trim(),
        link: newLogo.link.trim(),
        enabled: true,
      }],
    }))
    setNewLogo(emptyNewLogo())
    if (addFileRef.current) addFileRef.current.value = ''
    setDirty(true)
    setNotice('Logo added to the draft. Save the draft, then publish when ready.')
    setProblem('')
  }

  const saveDraft = async ({ silent = false } = {}) => {
    setBusy(true)
    setProblem('')
    if (!silent) setNotice('')
    try {
      const result = await api.saveClientLogosDraft(token, config)
      setDirty(false)
      setNotice(result.message || 'Client logo draft saved.')
      onRefresh()
      return true
    } catch (error) {
      setProblem(error.message || 'Unable to save the draft.')
      return false
    } finally {
      setBusy(false)
    }
  }

  const publish = async () => {
    if (!window.confirm('Publish the client logo board to the live website?')) return
    setBusy(true)
    setProblem('')
    setNotice('')
    try {
      if (dirty) {
        await api.saveClientLogosDraft(token, config)
        setDirty(false)
      }
      const result = await api.publishClientLogos(token)
      setNotice(result.message || 'Client logo board published.')
      onRefresh()
    } catch (error) {
      setProblem(error.message || 'Unable to publish the client logo board.')
    } finally {
      setBusy(false)
    }
  }

  const openPreview = async () => {
    const previewWindow = window.open('', '_blank')
    if (dirty) {
      const saved = await saveDraft({ silent: true })
      if (!saved) {
        previewWindow?.close()
        return
      }
    }
    if (previewWindow) {
      previewWindow.opener = null
      previewWindow.location.replace('/?themePreview=admin')
    } else {
      const fallback = window.open('/?themePreview=admin', '_blank', 'noopener')
      if (!fallback) setProblem('Your browser blocked the preview window. Allow pop-ups for this site, then try again.')
    }
  }

  const discard = () => {
    if (!window.confirm('Discard your unsaved changes?')) return
    setConfig(data?.draft || config)
    setDirty(false)
    setNotice('Unsaved changes discarded.')
    setProblem('')
  }

  const placeholderCount = placeholders

  return (
    <div className="client-admin">
      <div className="client-admin-intro">
        <div>
          <h2>Client logo board</h2>
          <p>Edit the draft, preview it here, then publish. The public website only shows the published version.</p>
          <p className="client-admin-meta">
            Draft revision {data?.draftRevision ?? '—'} · Published revision {data?.publishedRevision ?? '—'}
            {data?.publishedAt ? ` · Last published ${new Date(data.publishedAt).toLocaleString()}` : ''}
          </p>
        </div>
        <div className="client-admin-actions">
          <button type="button" className="admin-tool-button" onClick={() => saveDraft()} disabled={busy || !dirty}><Save size={15} /> Save draft</button>
          <button type="button" className="admin-tool-button" onClick={openPreview} disabled={busy}><Eye size={15} /> Open preview</button>
          {canPublish && <button type="button" className="client-admin-publish" onClick={publish} disabled={busy}><Send size={15} /> {busy ? 'Working…' : 'Publish'}</button>}
          {dirty && <button type="button" className="admin-link-button" onClick={discard}>Discard changes</button>}
        </div>
      </div>

      {notice && <p className="admin-success" role="status">{notice}</p>}
      {problem && <p className="admin-error" role="alert">{problem}</p>}

      <section className="client-admin-preview" aria-label="Client logo board preview">
        <div className="client-admin-preview-head">
          <span>Live preview of the draft</span>
          <small>{dirty ? 'Unsaved changes are included in this preview.' : 'This preview matches the saved draft.'}</small>
        </div>
        <ClientLogoMarquee config={config} preview />
        <div className="client-admin-directory">
          <p className="client-admin-directory-head">Below the strip — the full “Our Clients” section on the website</p>
          <AllClients config={config} />
        </div>
      </section>

      <form className="admin-data-form" onSubmit={(event) => { event.preventDefault(); saveDraft() }}>
        <div className="client-admin-section-head">
          <div>
            <h3>Board settings</h3>
            <p>These settings control the heading, motion, size, spacing, and card style.</p>
          </div>
          <span className={`client-admin-dirty ${dirty ? 'is-dirty' : ''}`}>{dirty ? 'Unsaved changes' : 'Saved'}</span>
        </div>
        <div className="admin-edit-grid">
          <label className="admin-field"><span>Small heading (eyebrow)</span><input maxLength="60" value={config.eyebrow ?? ''} onChange={(event) => updateSetting('eyebrow', event.target.value)} placeholder="Clients & Partners" /></label>
          <label className="admin-field"><span>Board heading</span><input maxLength="120" value={config.heading ?? ''} onChange={(event) => updateSetting('heading', event.target.value)} placeholder="Our Trusted Clients" /></label>
          <label className="admin-field admin-field-wide"><span>Short introduction (optional)</span><input maxLength="240" value={config.subheading ?? ''} onChange={(event) => updateSetting('subheading', event.target.value)} placeholder="Trusted by leading brands and project partners." /></label>
          <label className="admin-field"><span>Layout</span><select value={config.layout ?? 'auto'} onChange={(event) => updateSetting('layout', event.target.value)}><option value="auto">Auto (logo wall for long lists)</option><option value="grid">Logo wall — all visible</option><option value="marquee">Scrolling marquee</option></select></label>
          <label className="admin-field"><span>Movement direction</span><select value={config.direction} onChange={(event) => updateSetting('direction', event.target.value)}><option value="left">Right to left</option><option value="right">Left to right</option></select></label>
          <label className="admin-field"><span>Logo card style</span><select value={config.cardStyle} onChange={(event) => updateSetting('cardStyle', event.target.value)}><option value="card">Light card</option><option value="plain">Plain (no card)</option></select></label>
          <label className="admin-field"><span>Animation speed — {config.speed} px / second</span><input type="range" min="20" max="140" step="5" value={config.speed} onChange={(event) => updateSetting('speed', Number(event.target.value))} /></label>
          <label className="admin-field"><span>Logo height — {config.logoSize} px</span><input type="range" min="36" max="110" step="2" value={config.logoSize} onChange={(event) => updateSetting('logoSize', Number(event.target.value))} /></label>
          <label className="admin-field"><span>Spacing between logos — {config.gap} px</span><input type="range" min="20" max="100" step="2" value={config.gap} onChange={(event) => updateSetting('gap', Number(event.target.value))} /></label>
          <div className="client-admin-toggles admin-field-wide">
            <label><input type="checkbox" checked={config.visible !== false} onChange={(event) => updateSetting('visible', event.target.checked)} /> Show this board on the website</label>
            <label><input type="checkbox" checked={config.animationEnabled !== false} onChange={(event) => updateSetting('animationEnabled', event.target.checked)} /> Enable the moving animation</label>
            <label><input type="checkbox" checked={config.pauseOnHover !== false} onChange={(event) => updateSetting('pauseOnHover', event.target.checked)} /> Pause when the pointer is over the board</label>
            <label><input type="checkbox" checked={config.grayscale === true} onChange={(event) => updateSetting('grayscale', event.target.checked)} /> Show logos in greyscale (optional)</label>
            <label><input type="checkbox" checked={config.showAllClients !== false} onChange={(event) => updateSetting('showAllClients', event.target.checked)} /> Show the full "All our clients" section before Contact</label>
          </div>
        </div>
        <button type="submit" disabled={busy || !dirty}>{busy ? 'Saving…' : 'Save draft'}</button>
      </form>

      <section className="client-admin-logos">
        <div className="client-admin-section-head">
          <div>
            <h3>Client logos <span>({config.logos.length})</span></h3>
            <p>Use the arrows to change the display order. Disabled logos stay in the draft but are hidden on the website. “Top strip” picks the shortlist shown in “Trusted by leading brands”; every enabled client stays in the full “Our Clients” list below.</p>
          </div>
          {placeholderCount > 0 && <button type="button" className="admin-link-button" onClick={removePlaceholders}>Remove {placeholderCount} development placeholder{placeholderCount === 1 ? '' : 's'}</button>}
        </div>

        {config.logos.length > 0 ? (
          <div className="client-admin-logo-list">
            {config.logos.map((logo, index) => (
              <article className={`client-admin-logo ${logo.enabled === false ? 'is-disabled' : ''}`} key={logo.id}>
                <div className="client-admin-logo-thumb">
                  <LogoThumb logo={logo} />
                  {logo.imageUrl?.includes('/placeholder-') && <em>Placeholder</em>}
                </div>
                <div className="client-admin-logo-body">
                  <div className="client-admin-logo-grid">
                    <label className="admin-field"><span>Company name</span><input maxLength="80" value={logo.name} onChange={(event) => updateLogo(logo.id, { name: event.target.value })} placeholder="Company name" /></label>
                    <label className="admin-field"><span>Destination link (optional)</span><input maxLength="500" value={logo.link} onChange={(event) => updateLogo(logo.id, { link: event.target.value })} placeholder="https://example.com or /page" /></label>
                    <label className="admin-field admin-field-wide"><span>Image URL or uploaded path</span><input maxLength="500" value={logo.imageUrl} onChange={(event) => updateLogo(logo.id, { imageUrl: event.target.value })} placeholder="/images/clients/company.svg" /></label>
                    <label className="admin-field admin-field-wide"><span>Image alt text (optional)</span><input maxLength="160" value={logo.alt ?? ''} onChange={(event) => updateLogo(logo.id, { alt: event.target.value })} placeholder="Accessible description of the logo" /></label>
                  </div>
                  <div className="client-admin-logo-actions">
                    <label className="admin-link-button client-admin-upload"><Upload size={14} /> Upload / replace<input type="file" accept="image/png,image/jpeg,image/webp,image/gif" hidden onChange={(event) => replaceLogoFile(logo, event)} /></label>
                    <label className="client-admin-visible"><input type="checkbox" checked={logo.enabled !== false} onChange={(event) => updateLogo(logo.id, { enabled: event.target.checked })} /> Show on website</label>
                    <label className="client-admin-visible"><input type="checkbox" checked={inStrip(logo.id)} onChange={() => toggleStrip(logo.id)} /> Top strip</label>
                    <span className="client-admin-order">
                      <button type="button" onClick={() => moveLogo(index, -1)} disabled={index === 0} title="Move up"><ArrowUp size={14} /></button>
                      <button type="button" onClick={() => moveLogo(index, 1)} disabled={index === config.logos.length - 1} title="Move down"><ArrowDown size={14} /></button>
                    </span>
                    <button type="button" className="admin-link-button danger" onClick={() => deleteLogo(logo)}><Trash2 size={14} /> Delete</button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : <div className="admin-empty">No logos in the draft. Add your first client logo below.</div>}
      </section>

      <form className="admin-data-form client-admin-add" onSubmit={addLogo}>
        <div className="client-admin-section-head">
          <div>
            <h3>Add a client logo</h3>
            <p>Upload a PNG, JPG, WEBP, or GIF up to 3 MB. For SVG, put the file in <code>public/images/clients/</code> and enter its path.</p>
          </div>
          <Plus size={20} />
        </div>
        <div className="admin-edit-grid">
          <label className="admin-field"><span>Company name</span><input maxLength="80" value={newLogo.name} onChange={(event) => setNewLogo((current) => ({ ...current, name: event.target.value }))} placeholder="Company name" required /></label>
          <label className="admin-field"><span>Destination link (optional)</span><input maxLength="500" value={newLogo.link} onChange={(event) => setNewLogo((current) => ({ ...current, link: event.target.value }))} placeholder="https://example.com" /></label>
          <label className="admin-field"><span>Upload logo image</span><input ref={addFileRef} type="file" accept="image/png,image/jpeg,image/webp,image/gif" onChange={uploadNewLogo} /></label>
          <label className="admin-field"><span>Or enter a local image path</span><input maxLength="500" value={newLogo.imageUrl} onChange={(event) => setNewLogo((current) => ({ ...current, imageUrl: event.target.value }))} placeholder="/images/clients/company.svg" /></label>
          <label className="admin-field admin-field-wide"><span>Image alt text (optional)</span><input maxLength="160" value={newLogo.alt} onChange={(event) => setNewLogo((current) => ({ ...current, alt: event.target.value }))} placeholder="Accessible description of the logo" /></label>
        </div>
        {newLogo.imageUrl && <div className="client-admin-new-preview"><ImageIcon size={16} /><span>{newLogo.imageUrl}</span><LogoThumb logo={{ name: newLogo.name, imageUrl: newLogo.imageUrl }} /></div>}
        <button type="submit" disabled={busy || !newLogo.name.trim()}><Plus size={15} /> Add logo to draft</button>
        <button type="button" className="admin-link-button" onClick={() => { setNewLogo(emptyNewLogo()); if (addFileRef.current) addFileRef.current.value = '' }}><RefreshCw size={14} /> Clear</button>
      </form>
    </div>
  )
}
