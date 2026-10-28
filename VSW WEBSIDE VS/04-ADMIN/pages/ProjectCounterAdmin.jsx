import { useEffect, useState } from 'react'
import { ArrowDown, ArrowUp, Eye, Plus, RefreshCw, Save, Send, Trash2 } from 'lucide-react'
import { api } from '../../01-FRONTEND/services/api'
import ProjectCounter from '../../01-FRONTEND/components/ProjectCounter'
import './ProjectCounterAdmin.css'

const makeStatId = () => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') return `stat-${crypto.randomUUID()}`
  return `stat-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
}

const clamp = (value, min, max, fallback = 0) => {
  const number = Number(value)
  if (!Number.isFinite(number)) return fallback
  return Math.min(max, Math.max(min, Math.round(number)))
}

const emptyNewStat = () => ({ value: '', suffix: '+', label: '' })

export default function ProjectCounterAdmin({ data, token, admin, onRefresh }) {
  const [config, setConfig] = useState(() => data?.draft || null)
  const [dirty, setDirty] = useState(false)
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState('')
  const [problem, setProblem] = useState('')
  const [newStat, setNewStat] = useState(emptyNewStat)
  const [previewKey, setPreviewKey] = useState(0)
  const canPublish = ['super_admin', 'admin'].includes(String(admin?.role || '').toLowerCase())

  useEffect(() => {
    if (!data?.draft) return
    setConfig(data.draft)
    setDirty(false)
  }, [data])

  if (!config) return <div className="admin-empty">Loading project counter settings…</div>

  const stats = Array.isArray(config.stats) ? config.stats : []
  const enabledStats = stats.filter((stat) => stat.enabled !== false).length

  const change = (next) => {
    setConfig(next)
    setDirty(true)
    setNotice('')
    setProblem('')
  }

  const updateSetting = (key, value) => change({ ...config, [key]: value })

  const updateMain = (key, value) => change({
    ...config,
    mainStat: {
      ...(config.mainStat || {}),
      [key]: key === 'value' ? clamp(value, 0, 1000000, 0) : value,
    },
  })

  const updateStat = (id, changes) => change({
    ...config,
    stats: stats.map((stat) => stat.id === id ? { ...stat, ...changes } : stat),
  })

  const moveStat = (index, direction) => {
    const target = index + direction
    if (target < 0 || target >= stats.length) return
    const next = [...stats]
    ;[next[index], next[target]] = [next[target], next[index]]
    change({ ...config, stats: next })
  }

  const removeStat = (stat) => {
    if (!window.confirm(`Remove the "${stat.label || 'metric'}" counter? This only affects the draft until you save.`)) return
    change({ ...config, stats: stats.filter((item) => item.id !== stat.id) })
  }

  const addStat = (event) => {
    event.preventDefault()
    const label = newStat.label.trim()
    if (!label) {
      setProblem('Enter a label before adding a statistic.')
      return
    }
    if (stats.length >= 6) {
      setProblem('You can add up to six additional statistics.')
      return
    }
    change({
      ...config,
      stats: [...stats, {
        id: makeStatId(),
        value: clamp(newStat.value, 0, 1000000, 0),
        suffix: newStat.suffix.slice(0, 4),
        label: label.slice(0, 60),
        enabled: true,
      }],
    })
    setNewStat(emptyNewStat())
    setNotice('Statistic added to the draft. Save the draft, then publish when ready.')
    setProblem('')
  }

  const saveDraft = async ({ silent = false } = {}) => {
    setBusy(true)
    setProblem('')
    if (!silent) setNotice('')
    try {
      const result = await api.saveProjectCounterDraft(token, config)
      setDirty(false)
      setNotice(result.message || 'Project counter draft saved.')
      onRefresh()
      return true
    } catch (error) {
      setProblem(error.message || 'Unable to save the project counter draft.')
      return false
    } finally {
      setBusy(false)
    }
  }

  const publish = async () => {
    if (!window.confirm('Publish the project counter to the live website?')) return
    setBusy(true)
    setProblem('')
    setNotice('')
    try {
      if (dirty) {
        await api.saveProjectCounterDraft(token, config)
        setDirty(false)
      }
      const result = await api.publishProjectCounter(token)
      setNotice(result.message || 'Project counter published.')
      onRefresh()
    } catch (error) {
      setProblem(error.message || 'Unable to publish the project counter.')
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

  const swatch = (color, fallback) => ({ background: color || fallback })

  return (
    <div className="counter-admin">
      <div className="counter-admin-intro">
        <div>
          <h2>Project counter board</h2>
          <p>The homepage shows the published counter directly below Projects. Edit the draft, preview it here, then publish when the numbers are verified.</p>
          <p className="counter-admin-meta">
            Draft revision {data?.draftRevision ?? '—'} · Published revision {data?.publishedRevision ?? '—'}
            {data?.publishedAt ? ` · Last published ${new Date(data.publishedAt).toLocaleString()}` : ''}
          </p>
        </div>
        <div className="counter-admin-actions">
          <button type="button" className="admin-tool-button" onClick={() => setPreviewKey((value) => value + 1)}><RefreshCw size={15} /> Replay preview</button>
          <button type="button" className="admin-tool-button" onClick={() => saveDraft()} disabled={busy || !dirty}><Save size={15} /> Save draft</button>
          <button type="button" className="admin-tool-button" onClick={openPreview} disabled={busy}><Eye size={15} /> Open preview</button>
          {canPublish && <button type="button" className="counter-admin-publish" onClick={publish} disabled={busy}><Send size={15} /> {busy ? 'Working…' : 'Publish'}</button>}
          {dirty && <button type="button" className="admin-link-button" onClick={discard}>Discard changes</button>}
        </div>
      </div>

      {notice && <p className="admin-success" role="status">{notice}</p>}
      {problem && <p className="admin-error" role="alert">{problem}</p>}

      <section className="counter-admin-preview" aria-label="Project counter preview">
        <div className="counter-admin-preview-head">
          <span>Live preview of the draft</span>
          <small>{dirty ? 'Unsaved changes are included in this preview.' : 'This preview matches the saved draft.'}</small>
        </div>
        <ProjectCounter key={previewKey} config={config} preview />
      </section>

      <form className="admin-data-form" onSubmit={(event) => { event.preventDefault(); saveDraft() }}>
        <div className="counter-admin-section-head">
          <div>
            <h3>Board settings</h3>
            <p>Control the heading, colours, timing and visibility. Leave a colour blank to use the website theme colours.</p>
          </div>
          <span className={`counter-admin-dirty ${dirty ? 'is-dirty' : ''}`}>{dirty ? 'Unsaved changes' : 'Saved'}</span>
        </div>
        <div className="admin-edit-grid">
          <label className="admin-field"><span>Small heading (eyebrow)</span><input maxLength="60" value={config.eyebrow ?? ''} onChange={(event) => updateSetting('eyebrow', event.target.value)} placeholder="Our work in numbers" /></label>
          <label className="admin-field"><span>Board heading</span><input maxLength="120" value={config.heading ?? ''} onChange={(event) => updateSetting('heading', event.target.value)} placeholder="Delivering with certainty." /></label>
          <label className="admin-field admin-field-wide"><span>Short introduction (optional)</span><input maxLength="240" value={config.subheading ?? ''} onChange={(event) => updateSetting('subheading', event.target.value)} placeholder="A short line about the delivery record." /></label>
          <label className="admin-field"><span>Background style</span><select value={config.backgroundStyle || 'navy'} onChange={(event) => updateSetting('backgroundStyle', event.target.value)}><option value="navy">Dark navy (theme)</option><option value="light">Light (content card)</option><option value="custom">Custom colours</option></select></label>
          <label className="admin-field"><span>Accent colour (optional)</span><span className="counter-admin-color"><i style={swatch(config.accentColor, 'var(--gold, #c2a36b)')} /><input maxLength="9" value={config.accentColor ?? ''} onChange={(event) => updateSetting('accentColor', event.target.value)} placeholder="#c2a36b" /></span></label>
          <label className="admin-field"><span>Text colour (optional)</span><span className="counter-admin-color"><i style={swatch(config.textColor, '#ffffff')} /><input maxLength="9" value={config.textColor ?? ''} onChange={(event) => updateSetting('textColor', event.target.value)} placeholder="#ffffff" /></span></label>
          {config.backgroundStyle === 'custom' && <label className="admin-field"><span>Custom background colour</span><span className="counter-admin-color"><i style={swatch(config.backgroundColor, '#07131f')} /><input maxLength="9" value={config.backgroundColor ?? ''} onChange={(event) => updateSetting('backgroundColor', event.target.value)} placeholder="#07131f" /></span></label>}
          <label className="admin-field"><span>Counting duration — {(Number(config.duration) / 1000).toFixed(1)} seconds</span><input type="range" min="600" max="8000" step="100" value={config.duration ?? 2400} onChange={(event) => updateSetting('duration', Number(event.target.value))} /></label>
          <label className="admin-field"><span>Pause between loops — {(Number(config.pause) / 1000).toFixed(1)} seconds</span><input type="range" min="0" max="10000" step="100" value={config.pause ?? 2600} onChange={(event) => updateSetting('pause', Number(event.target.value))} /></label>
          <div className="counter-admin-toggles admin-field-wide">
            <label><input type="checkbox" checked={config.visible !== false} onChange={(event) => updateSetting('visible', event.target.checked)} /> Show this board on the website</label>
            <label><input type="checkbox" checked={config.animationEnabled !== false} onChange={(event) => updateSetting('animationEnabled', event.target.checked)} /> Animate the numbers when visible</label>
            <label><input type="checkbox" checked={config.loop !== false} onChange={(event) => updateSetting('loop', event.target.checked)} /> Repeat the count after the pause</label>
            <label><input type="checkbox" checked={config.decorativeLines !== false} onChange={(event) => updateSetting('decorativeLines', event.target.checked)} /> Show the subtle moving lines</label>
            <label><input type="checkbox" checked={config.hoverEffect !== false} onChange={(event) => updateSetting('hoverEffect', event.target.checked)} /> Enable the hover effect</label>
          </div>
        </div>
        <p className="counter-admin-hint counter-admin-hint-spaced">Leave a colour blank to inherit the website theme. For a custom background, choose a text colour with strong contrast.</p>
        <button type="submit" disabled={busy || !dirty}>{busy ? 'Saving…' : 'Save draft'}</button>
      </form>

      <section className="counter-admin-main-stat">
        <div className="counter-admin-section-head">
          <div>
            <h3>Main statistic</h3>
            <p>This is the large figure on the board. The animation stops at exactly this value and never counts past it.</p>
          </div>
        </div>
        <div className="admin-edit-grid">
          <label className="admin-field"><span>Final value</span><input type="number" min="0" max="1000000" step="1" value={config.mainStat?.value ?? 0} onChange={(event) => updateMain('value', event.target.value)} /></label>
          <label className="admin-field"><span>Suffix after the number</span><input maxLength="4" value={config.mainStat?.suffix ?? ''} onChange={(event) => updateMain('suffix', event.target.value)} placeholder="+" /></label>
          <label className="admin-field admin-field-wide"><span>Label under the number</span><input maxLength="60" value={config.mainStat?.label ?? ''} onChange={(event) => updateMain('label', event.target.value)} placeholder="Projects Completed" /></label>
        </div>
        <p className="counter-admin-hint">Only keep 300 if the company can substantiate that figure. Set the real verified total here.</p>
      </section>

      <section className="counter-admin-stats">
        <div className="counter-admin-section-head">
          <div>
            <h3>Additional statistics <span>({enabledStats} shown)</span></h3>
            <p>Optional supporting figures. Disabled statistics stay in the draft but are not shown on the website.</p>
          </div>
        </div>

        {stats.length > 0 ? (
          <div className="counter-admin-stat-list">
            {stats.map((stat, index) => (
              <article className={`counter-admin-stat ${stat.enabled === false ? 'is-disabled' : ''}`} key={stat.id}>
                <div className="counter-admin-stat-head">
                  <span>{stat.label || `Metric ${index + 1}`}</span>
                  <span className={`counter-admin-badge ${stat.enabled === false ? '' : 'is-on'}`}>{stat.enabled === false ? 'Hidden' : 'Visible'}</span>
                </div>
                <div className="admin-edit-grid">
                  <label className="admin-field"><span>Final value</span><input type="number" min="0" max="1000000" step="1" value={stat.value ?? 0} onChange={(event) => updateStat(stat.id, { value: clamp(event.target.value, 0, 1000000, 0) })} /></label>
                  <label className="admin-field"><span>Suffix</span><input maxLength="4" value={stat.suffix ?? ''} onChange={(event) => updateStat(stat.id, { suffix: event.target.value })} placeholder="+" /></label>
                  <label className="admin-field admin-field-wide"><span>Label</span><input maxLength="60" value={stat.label ?? ''} onChange={(event) => updateStat(stat.id, { label: event.target.value })} placeholder="Clients Served" /></label>
                </div>
                <div className="counter-admin-stat-actions">
                  <label className="counter-admin-visible"><input type="checkbox" checked={stat.enabled !== false} onChange={(event) => updateStat(stat.id, { enabled: event.target.checked })} /> Show on website</label>
                  <span className="counter-admin-order">
                    <button type="button" onClick={() => moveStat(index, -1)} disabled={index === 0} title="Move up"><ArrowUp size={14} /></button>
                    <button type="button" onClick={() => moveStat(index, 1)} disabled={index === stats.length - 1} title="Move down"><ArrowDown size={14} /></button>
                  </span>
                  <button type="button" className="admin-link-button danger" onClick={() => removeStat(stat)}><Trash2 size={14} /> Delete</button>
                </div>
              </article>
            ))}
          </div>
        ) : <div className="admin-empty">No additional statistics. The board will show only the main counter.</div>}
        <p className="counter-admin-hint">Enable a statistic only when you have a verified figure. A value of zero still counts as zero.</p>
      </section>

      <form className="admin-data-form counter-admin-add" onSubmit={addStat}>
        <div className="counter-admin-section-head">
          <div>
            <h3>Add an additional statistic</h3>
            <p>For example: Clients Served, Years of Experience, or Cities Covered.</p>
          </div>
          <Plus size={20} />
        </div>
        <div className="admin-edit-grid">
          <label className="admin-field"><span>Label</span><input maxLength="60" value={newStat.label} onChange={(event) => setNewStat((current) => ({ ...current, label: event.target.value }))} placeholder="Clients Served" required /></label>
          <label className="admin-field"><span>Final value</span><input type="number" min="0" max="1000000" step="1" value={newStat.value} onChange={(event) => setNewStat((current) => ({ ...current, value: event.target.value }))} placeholder="120" /></label>
          <label className="admin-field"><span>Suffix</span><input maxLength="4" value={newStat.suffix} onChange={(event) => setNewStat((current) => ({ ...current, suffix: event.target.value }))} placeholder="+" /></label>
        </div>
        <button type="submit" disabled={busy || !newStat.label.trim() || stats.length >= 6}><Plus size={15} /> Add statistic to draft</button>
        <button type="button" className="admin-link-button" onClick={() => { setNewStat(emptyNewStat()); setProblem('') }}><RefreshCw size={14} /> Clear</button>
      </form>
    </div>
  )
}
