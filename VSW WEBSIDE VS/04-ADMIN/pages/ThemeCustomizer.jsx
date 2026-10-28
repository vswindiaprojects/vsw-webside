import { useEffect, useMemo, useRef, useState } from 'react'
import { ArrowDown, ArrowUp, Eye, History, Monitor, Palette, Save, Smartphone, Tablet, Upload } from 'lucide-react'
import { api } from '../../01-FRONTEND/services/api'
import './ThemeCustomizer.css'

const sectionLabels = {
  hero: 'Hero banner',
  strengths: 'Highlights',
  about: 'About the company',
  services: 'Services',
  projects: 'Projects',
  workflow: 'Workflow',
  'why-vsw': 'Why VSW',
  testimonials: 'Testimonials',
  faq: 'Frequently asked questions',
  'call-to-action': 'Call to action',
  contact: 'Contact',
}
const sectionFields = {
  hero: [['eyebrow', 'Small heading'], ['heading', 'Main heading'], ['tagline', 'Tagline'], ['description', 'Description'], ['buttonText', 'Button text'], ['buttonLink', 'Button link'], ['secondaryButtonText', 'Second button'], ['secondaryButtonLink', 'Second button link'], ['heroImage', 'Background image URL']],
  strengths: [['itemOne', 'Highlight 1'], ['itemTwo', 'Highlight 2'], ['itemThree', 'Highlight 3'], ['itemFour', 'Highlight 4']],
  about: [['eyebrow', 'Small heading'], ['heading', 'Section heading'], ['description', 'Description'], ['intro', 'Introduction'], ['paragraphOne', 'Paragraph 1'], ['paragraphTwo', 'Paragraph 2'], ['image', 'Image URL'], ['imageAlt', 'Image alt text'], ['caption', 'Image caption'], ['buttonText', 'Button text']],
  services: [['eyebrow', 'Small heading'], ['heading', 'Section heading'], ['description', 'Description']],
  projects: [['eyebrow', 'Small heading'], ['heading', 'Section heading'], ['description', 'Description'], ['buttonText', 'Button text']],
  workflow: [['eyebrow', 'Small heading'], ['heading', 'Section heading'], ['description', 'Description']],
  'why-vsw': [['eyebrow', 'Small heading'], ['heading', 'Section heading'], ['description', 'Description']],
  testimonials: [['eyebrow', 'Small heading'], ['heading', 'Section heading'], ['description', 'Description'], ['quoteOne', 'Client quote 1'], ['quoteTwo', 'Client quote 2'], ['quoteThree', 'Client quote 3']],
  faq: [['eyebrow', 'Small heading'], ['heading', 'Section heading'], ['questionOne', 'Question 1'], ['answerOne', 'Answer 1'], ['questionTwo', 'Question 2'], ['answerTwo', 'Answer 2'], ['questionThree', 'Question 3'], ['answerThree', 'Answer 3']],
  'call-to-action': [['eyebrow', 'Small heading'], ['heading', 'Section heading'], ['description', 'Description'], ['buttonText', 'Button text'], ['buttonLink', 'Button link']],
  contact: [['eyebrow', 'Small heading'], ['heading', 'Section heading'], ['description', 'Description']],
}
const defaultMainMenu = [['about', 'About', '#about'], ['services', 'Services', '#services'], ['projects', 'Projects', '#projects'], ['workflow', 'Workflow', '#workflow'], ['why-vsw', 'Why VSW', '#why-vsw'], ['contact', 'Contact', '#contact']]
const defaultFooterMenu = defaultMainMenu.slice(0, 4)
const colorLabels = {
  primary: 'Primary',
  secondary: 'Secondary',
  accent: 'Accent',
  background: 'Page background',
  text: 'Body text',
  heading: 'Heading text',
  link: 'Links',
  buttonBackground: 'Button background',
  buttonText: 'Button text',
  border: 'Borders',
  headerBackground: 'Header',
  footerBackground: 'Footer',
  cardBackground: 'Cards',
}
const clone = (value) => JSON.parse(JSON.stringify(value))

export default function ThemeCustomizer({ theme, token, admin, onSave, onRefresh }) {
  const previewRef = useRef(null)
  const sectionEditorsRef = useRef(new Map())
  const [configuration, setConfiguration] = useState(theme?.draft || {})
  const configurationRef = useRef(configuration)
  const [past, setPast] = useState([])
  const [future, setFuture] = useState([])
  const [versions, setVersions] = useState([])
  const [presets, setPresets] = useState([])
  const [mediaItems, setMediaItems] = useState([])
  const [device, setDevice] = useState('desktop')
  const [notice, setNotice] = useState('')
  const [uploading, setUploading] = useState(false)
  const [sectionToAdd, setSectionToAdd] = useState('')
  const [draggedSection, setDraggedSection] = useState(null)
  const [selectedSection, setSelectedSection] = useState(null)
  const [selectedImageField, setSelectedImageField] = useState(null)
  const [activeTab, setActiveTab] = useState('sections')
  const canPublish = ['admin', 'super_admin'].includes(String(admin?.role || '').toLowerCase())
  const dirty = useMemo(() => JSON.stringify(configuration) !== JSON.stringify(theme?.draft || {}), [configuration, theme?.draft])

  useEffect(() => {
    const next = theme?.draft ? clone(theme.draft) : {}
    configurationRef.current = next
    setConfiguration(next)
    setPast([])
    setFuture([])
  }, [theme?.draft])
  useEffect(() => {
    const sendPreview = () => previewRef.current?.contentWindow?.postMessage({ type: 'vsw-theme-preview', theme: configuration }, window.location.origin)
    sendPreview()
    const timer = window.setTimeout(sendPreview, 100)
    return () => window.clearTimeout(timer)
  }, [configuration])
  useEffect(() => {
    const onPreviewSectionSelect = (event) => {
      if (event.origin !== window.location.origin || event.source !== previewRef.current?.contentWindow || event.data?.type !== 'vsw-theme-section-select') return
      const sectionId = event.data.sectionId
      if (typeof sectionId !== 'string' || !sectionLabels[sectionId]) return
      const imageField = typeof event.data.imageField === 'string'
        && sectionFields[sectionId]?.some(([field]) => field === event.data.imageField && (field === 'image' || field.endsWith('Image')))
        ? event.data.imageField
        : null
      setSelectedSection(sectionId)
      setSelectedImageField(imageField)
      setActiveTab('sections')
    }
    window.addEventListener('message', onPreviewSectionSelect)
    return () => window.removeEventListener('message', onPreviewSectionSelect)
  }, [])
  useEffect(() => {
    if (!selectedSection) return
    const editor = sectionEditorsRef.current.get(selectedSection)
    if (!editor) return
    editor.open = true
    editor.scrollIntoView({ behavior: 'smooth', block: 'center' })
    window.setTimeout(() => {
      const controls = [...editor.querySelectorAll('[data-section-field]')]
      const target = controls.find((control) => control.dataset.sectionField === selectedImageField)
      ;(target || editor.querySelector('input:not([type="checkbox"]), textarea, select'))?.focus({ preventScroll: true })
    }, 250)
  }, [selectedSection, selectedImageField])
  useEffect(() => {
    let active = true
    Promise.allSettled([api.themeVersions(token), api.themePresets(token), api.adminMediaPage(token)]).then(([versionResult, presetResult, mediaResult]) => {
      if (!active) return
      if (versionResult.status === 'fulfilled') setVersions(versionResult.value.data || [])
      else setNotice(versionResult.reason.message)
      if (presetResult.status === 'fulfilled') setPresets(presetResult.value.data || [])
      else setNotice(presetResult.reason.message)
      if (mediaResult.status === 'fulfilled') setMediaItems(mediaResult.value.data || [])
    })
    return () => { active = false }
  }, [token, theme?.publishedRevision])

  const applyConfiguration = (update) => {
    const current = configurationRef.current
    const next = update(current)
    if (next === current) return
    setPast((items) => [...items, clone(current)].slice(-30))
    setFuture([])
    configurationRef.current = next
    setConfiguration(next)
  }
  const undo = () => {
    if (!past.length) return
    const previous = past[past.length - 1]
    setPast(past.slice(0, -1))
    setFuture([...future, clone(configuration)])
    configurationRef.current = previous
    setConfiguration(previous)
  }
  const redo = () => {
    if (!future.length) return
    const next = future[future.length - 1]
    setFuture(future.slice(0, -1))
    setPast([...past, clone(configuration)].slice(-30))
    configurationRef.current = next
    setConfiguration(next)
  }
  const updateGroup = (group, key, value) => applyConfiguration((current) => {
    const next = { ...current, [group]: { ...(current[group] || {}), [key]: value } }
    if (group !== 'pages' || !value?.slug) return next
    const oldSlug = current.pages?.[key]?.slug || key
    if (oldSlug === value.slug) return next
    const menus = { ...(current.menus || {}) }
    for (const menuName of ['main', 'footer']) {
      const defaults = (menuName === 'main' ? defaultMainMenu : defaultFooterMenu).map(([id, label, url]) => ({ id, label, url, visible: true }))
      menus[menuName] = (menus[menuName] || defaults).map((item) => item.url === `#${oldSlug}` ? { ...item, url: `#${value.slug}` } : item)
    }
    return { ...next, menus }
  })
  const updateSection = (id, changes) => applyConfiguration((current) => {
    const sections = current.sections || []
    return { ...current, sections: sections.map((section) => section.id === id ? { ...section, ...changes, ...(changes.settings ? { settings: { ...(section.settings || {}), ...changes.settings } } : {}) } : section) }
  })
  const updateMenu = (menuName, index, key, value) => applyConfiguration((current) => {
    const defaults = (menuName === 'main' ? defaultMainMenu : defaultFooterMenu).map(([id,label,url]) => ({ id, label, url, visible: true }))
    const menu = [...(current.menus?.[menuName] || defaults)]
    menu[index] = { ...menu[index], [key]: value }
    return { ...current, menus: { ...(current.menus || {}), [menuName]: menu } }
  })
  const addMenuItem = (menuName) => applyConfiguration((current) => {
    const defaults = (menuName === 'main' ? defaultMainMenu : defaultFooterMenu).map(([id,label,url]) => ({ id, label, url, visible: true }))
    const menu = [...(current.menus?.[menuName] || defaults)]
    menu.push({ id: `custom-${Date.now()}`, label: 'New link', url: '#home', visible: true })
    return { ...current, menus: { ...(current.menus || {}), [menuName]: menu } }
  })
  const removeMenuItem = (menuName, index) => applyConfiguration((current) => {
    const defaults = (menuName === 'main' ? defaultMainMenu : defaultFooterMenu).map(([id,label,url]) => ({ id, label, url, visible: true }))
    const menu = [...(current.menus?.[menuName] || defaults)].filter((_, itemIndex) => itemIndex !== index)
    return { ...current, menus: { ...(current.menus || {}), [menuName]: menu } }
  })
  const moveMenuItem = (menuName, index, direction) => applyConfiguration((current) => {
    const defaults = (menuName === 'main' ? defaultMainMenu : defaultFooterMenu).map(([id,label,url]) => ({ id, label, url, visible: true }))
    const menu = [...(current.menus?.[menuName] || defaults)]
    const target = index + direction
    if (target < 0 || target >= menu.length) return current
    ;[menu[index], menu[target]] = [menu[target], menu[index]]
    return { ...current, menus: { ...(current.menus || {}), [menuName]: menu } }
  })
  const moveSection = (index, direction) => applyConfiguration((current) => {
    const sections = [...(current.sections || [])].sort((a, b) => a.order - b.order)
    const target = index + direction
    if (target < 0 || target >= sections.length) return current
    const reordered = [...sections]
    ;[reordered[index], reordered[target]] = [reordered[target], reordered[index]]
    return { ...current, sections: reordered.map((section, order) => ({ ...section, order })) }
  })
  const reorderSection = (from, to) => applyConfiguration((current) => {
    const sections = [...(current.sections || [])].sort((a, b) => a.order - b.order)
    if (from === null || from === to || from < 0 || to < 0 || from >= sections.length || to >= sections.length) return current
    const [moved] = sections.splice(from, 1)
    sections.splice(to, 0, moved)
    return { ...current, sections: sections.map((section, order) => ({ ...section, order })) }
  })
  const removeSection = (id) => applyConfiguration((current) => ({
    ...current,
    sections: (current.sections || []).filter((section) => section.id !== id).map((section, order) => ({ ...section, order })),
  }))
  const addSection = () => {
    if (!sectionToAdd) return
    applyConfiguration((current) => {
      const sections = current.sections || []
      if (sections.some((section) => section.id === sectionToAdd)) return current
      return { ...current, sections: [...sections, { id: sectionToAdd, visible: true, order: sections.length }] }
    })
    setSectionToAdd('')
  }
  const saveDraft = async () => {
    try {
      const result = await onSave(() => api.saveThemeDraft(token, configuration))
      setNotice(`Draft saved (revision ${result.data?.draftRevision ?? 'updated'}).`)
      onRefresh()
    } catch (error) {
      setNotice(error.message)
    }
  }
  const publish = async () => {
    if (!window.confirm('Publish these theme settings to the live website?')) return
    try {
      if (dirty) await onSave(() => api.saveThemeDraft(token, configuration))
      const result = await onSave(() => api.publishTheme(token))
      setNotice(`Theme published as version ${result.data?.revision}.`)
      onRefresh()
    } catch (error) {
      setNotice(error.message)
    }
  }
  const restore = async (version) => {
    if (!window.confirm(`Restore version ${version.revision} as a draft? It will not be public until you publish it.`)) return
    try {
      await onSave(() => api.restoreThemeVersion(token, version.id))
      setNotice('Version restored to draft. Review it, then publish when ready.')
      onRefresh()
    } catch (error) {
      setNotice(error.message)
    }
  }
  const resetTheme = async () => {
    const initialVersion = versions.find((version) => Number(version.revision) === 1)
    if (!initialVersion) return setNotice('The original theme snapshot is not available.')
    await restore(initialVersion)
  }
  const savePreset = async () => {
    const name = window.prompt('Name this theme preset')
    if (!name) return
    try {
      const result = await onSave(() => api.saveThemePreset(token, name, configuration))
      setPresets((current) => [...current, result.data].sort((a, b) => a.name.localeCompare(b.name)))
      setNotice('Preset saved. The current draft was not published.')
    } catch (error) {
      setNotice(error.message)
    }
  }
  const applyPreset = async (preset) => {
    if (!window.confirm(`Apply "${preset.name}" to the current draft? You can review it before publishing.`)) return
    try {
      await onSave(() => api.applyThemePreset(token, preset.id))
      setNotice(`Preset "${preset.name}" applied to the draft.`)
      onRefresh()
    } catch (error) {
      setNotice(error.message)
    }
  }
  const deletePreset = async (preset) => {
    if (!window.confirm(`Delete the "${preset.name}" preset?`)) return
    try {
      await onSave(() => api.deleteThemePreset(token, preset.id))
      setPresets((current) => current.filter((item) => item.id !== preset.id))
    } catch (error) {
      setNotice(error.message)
    }
  }
  const uploadLogo = async (event, field) => {
    const input = event.target
    const file = input.files?.[0]
    if (!file) return
    setUploading(true)
    setNotice('')
    try {
      const form = new FormData()
      form.append('file', file)
      form.append('altText', configuration.branding?.logoAlt || 'Website logo')
      form.append('relatedType', 'general')
      const result = await api.uploadAdminMedia(token, form)
      updateGroup('branding', field, result.data.url)
      setMediaItems((items) => [result.data, ...items])
      setNotice('Logo uploaded. Save the theme draft to keep this setting.')
    } catch (error) {
      setNotice(error.message)
    } finally {
      setUploading(false)
      input.value = ''
    }
  }
  const uploadSectionImage = async (event, sectionId, field) => {
    const input = event.target
    const file = input.files?.[0]
    if (!file) return
    setUploading(true)
    setNotice('')
    try {
      const form = new FormData()
      form.append('file', file)
      form.append('altText', configuration.sections?.find((section) => section.id === sectionId)?.settings?.imageAlt || `${sectionLabels[sectionId]} image`)
      form.append('relatedType', 'general')
      const result = await api.uploadAdminMedia(token, form)
      updateSection(sectionId, { settings: { [field]: result.data.url } })
      setMediaItems((items) => [result.data, ...items.filter((item) => item.id !== result.data.id)])
      setNotice(`${sectionLabels[sectionId]} image uploaded. Save the draft to keep this setting.`)
    } catch (error) {
      setNotice(error.message)
    } finally {
      setUploading(false)
      input.value = ''
    }
  }

  const sections = [...(configuration.sections || [])].sort((a, b) => a.order - b.order)
  return <div className="theme-customizer">
    <div className="theme-customizer-toolbar">
      <div><h2>Easy website editor</h2><p>Step 1: click a section or image in Preview. Step 2: edit it here. Step 3: save your changes.</p></div>
      <div className="theme-toolbar-actions">
        {dirty && <span className="theme-unsaved">Unsaved changes</span>}
        <button type="button" className="admin-tool-button" onClick={undo} disabled={!past.length}>Undo</button>
        <button type="button" className="admin-tool-button" onClick={redo} disabled={!future.length}>Redo</button>
        <button type="button" className="theme-save-button" onClick={saveDraft} disabled={!dirty}><Save size={16}/> Save changes</button>
        {canPublish && <button type="button" className="theme-publish-button" onClick={publish}><Eye size={16}/> Publish website</button>}
      </div>
    </div>
    {notice && <p className="theme-notice" role="status">{notice}</p>}
    <div className="theme-status-row"><span>Draft v{theme?.draftRevision ?? '—'}</span><span>Live v{theme?.publishedRevision ?? '—'}</span>{theme?.publishedAt && <span>Last published {new Date(theme.publishedAt).toLocaleString()}</span>}</div>
    <div className="theme-editor-layout">
      <section className="theme-editor-settings">
        <nav className="theme-editor-tabs" aria-label="Editor options">
          <button type="button" aria-pressed={activeTab === 'sections'} className={activeTab === 'sections' ? 'active' : ''} onClick={() => setActiveTab('sections')}>1. Edit sections</button>
          <button type="button" aria-pressed={activeTab === 'design'} className={activeTab === 'design' ? 'active' : ''} onClick={() => setActiveTab('design')}>2. Colors & logo</button>
          <button type="button" aria-pressed={activeTab === 'more'} className={activeTab === 'more' ? 'active' : ''} onClick={() => setActiveTab('more')}>More settings</button>
        </nav>
        {activeTab === 'sections' && <p className="theme-tab-help">Click any section or image in the preview to open its editing options.</p>}
        {activeTab === 'design' && <>
        <details open>
          <summary><Palette size={16}/> Global colors</summary>
          <div className="theme-field-grid">{Object.entries(colorLabels).map(([key, label]) => <label key={key} className="theme-color-field"><span>{label}</span><input type="color" value={configuration.colors?.[key] || '#000000'} onChange={(event) => updateGroup('colors', key, event.target.value)}/><code>{configuration.colors?.[key] || '#000000'}</code></label>)}</div>
        </details>
        <details open>
          <summary>Typography</summary>
          <div className="theme-control-grid">
            <label>Body font<select value={configuration.typography?.bodyFont || 'DM Sans'} onChange={(event) => updateGroup('typography', 'bodyFont', event.target.value)}>{['DM Sans','Space Grotesk','Arial','Georgia','system-ui'].map((font) => <option key={font}>{font}</option>)}</select></label>
            <label>Heading font<select value={configuration.typography?.headingFont || 'Space Grotesk'} onChange={(event) => updateGroup('typography', 'headingFont', event.target.value)}>{['DM Sans','Space Grotesk','Arial','Georgia','system-ui'].map((font) => <option key={font}>{font}</option>)}</select></label>
            <label>Body font size<input type="number" min="10" max="32" value={configuration.typography?.bodySize || 16} onChange={(event) => updateGroup('typography', 'bodySize', Number(event.target.value))}/></label>
            {['h1Size','h2Size','h3Size','h4Size','h5Size','h6Size','navSize','buttonSize','footerSize'].map((key) => <label key={key}>{key.replace('Size','').toUpperCase()} font size<input type="number" min="8" max={key==='h1Size'?120:80} value={configuration.typography?.[key] || ''} onChange={(event) => updateGroup('typography', key, Number(event.target.value))}/></label>)}
            <label>Heading scale<input type="number" min="0.7" max="1.5" step="0.05" value={configuration.typography?.headingSize || 1} onChange={(event) => updateGroup('typography', 'headingSize', Number(event.target.value))}/></label>
            {['tablet','mobile'].map((device) => <div className="theme-responsive-type" key={device}><b>{device[0].toUpperCase()+device.slice(1)} type sizes</b><div className="theme-responsive-fields">{['bodySize','h1Size','h2Size','h3Size'].map((key) => <label key={key}>{key.replace('Size','')}<input type="number" min={key==='bodySize'?10:8} max={key==='bodySize'?32:key==='h1Size'?120:80} value={configuration.typography?.responsive?.[device]?.[key] || ''} onChange={(event) => applyConfiguration((current) => ({...current,typography:{...(current.typography||{}),responsive:{...(current.typography?.responsive||{}),[device]:{...(current.typography?.responsive?.[device]||{}),[key]:Number(event.target.value)}}}}))}/></label>)}</div></div>)}
          </div>
        </details>
        <details open>
          <summary>Branding</summary>
          <div className="theme-control-grid">
            {['primaryLogo', 'footerLogo', 'mobileLogo'].map((field) => <label key={field}>{field === 'primaryLogo' ? 'Main logo' : field === 'footerLogo' ? 'Footer logo' : 'Mobile logo'}
              <input value={configuration.branding?.[field] || ''} onChange={(event) => updateGroup('branding', field, event.target.value)} placeholder="Paste image URL or /uploads/..."/>
              <select aria-label={`Choose ${field} from media library`} value={configuration.branding?.[field] || ''} onChange={(event) => updateGroup('branding', field, event.target.value)}><option value="">Choose from media library</option>{mediaItems.filter((item) => item.mediaType === 'image').map((item) => <option key={item.id} value={`/uploads/${item.storedName}`}>{item.originalName}</option>)}</select>
              <span className="theme-upload-control"><Upload size={14}/><input type="file" accept="image/png,image/jpeg,image/webp" onChange={(event) => uploadLogo(event, field)} disabled={uploading}/></span>
            </label>)}
            <label>Logo alt text<input value={configuration.branding?.logoAlt || ''} onChange={(event) => updateGroup('branding', 'logoAlt', event.target.value)}/></label>
            <label>Main logo width (px)<input type="number" min="40" max="500" value={configuration.branding?.logoWidth || 220} onChange={(event) => updateGroup('branding', 'logoWidth', Number(event.target.value))}/></label>
            <label>Mobile logo width (px)<input type="number" min="40" max="500" value={configuration.branding?.mobileLogoWidth || configuration.branding?.logoWidth || 220} onChange={(event) => updateGroup('branding', 'mobileLogoWidth', Number(event.target.value))}/></label>
            <label>Footer logo width (px)<input type="number" min="40" max="500" value={configuration.branding?.footerLogoWidth || configuration.branding?.logoWidth || 220} onChange={(event) => updateGroup('branding', 'footerLogoWidth', Number(event.target.value))}/></label>
            <label>Logo destination<input value={configuration.branding?.logoHref || '#home'} onChange={(event) => updateGroup('branding', 'logoHref', event.target.value)}/></label>
            <label>Favicon URL<input value={configuration.branding?.favicon || ''} onChange={(event) => updateGroup('branding', 'favicon', event.target.value)} placeholder="Favicon URL"/>
              <select aria-label="Choose favicon from media library" value={configuration.branding?.favicon || ''} onChange={(event) => updateGroup('branding', 'favicon', event.target.value)}><option value="">Choose from media library</option>{mediaItems.filter((item) => item.mediaType === 'image').map((item) => <option key={item.id} value={`/uploads/${item.storedName}`}>{item.originalName}</option>)}</select>
              <span className="theme-upload-control"><Upload size={14}/><input type="file" accept="image/png,image/jpeg,image/webp" aria-label="Upload favicon" onChange={(event) => uploadLogo(event, 'favicon')} disabled={uploading}/></span>
            </label>
          </div>
        </details>
        </>}
        {activeTab === 'more' && <>
        <details>
          <summary>Header and footer</summary>
          <div className="theme-control-grid">
            <label>Header height (px)<input type="number" min="48" max="180" value={configuration.header?.height || 92} onChange={(event) => updateGroup('header', 'height', Number(event.target.value))}/></label>
            <label>Navigation alignment<select value={configuration.header?.navAlignment || 'right'} onChange={(event) => updateGroup('header', 'navAlignment', event.target.value)}><option value="left">Left</option><option value="center">Center</option><option value="right">Right</option></select></label>
            <label className="theme-toggle"><input type="checkbox" checked={configuration.header?.sticky ?? true} onChange={(event) => updateGroup('header', 'sticky', event.target.checked)}/> Sticky header</label>
            <label className="theme-toggle"><input type="checkbox" checked={configuration.header?.showAccount ?? true} onChange={(event) => updateGroup('header', 'showAccount', event.target.checked)}/> Show account links</label>
            <label className="theme-wide">Footer description<textarea rows="3" value={configuration.footer?.description || ''} onChange={(event) => updateGroup('footer', 'description', event.target.value)}/></label>
            <label className="theme-wide">Copyright text<input value={configuration.footer?.copyright || ''} onChange={(event) => updateGroup('footer', 'copyright', event.target.value)}/></label>
            <label>Footer phone<input value={configuration.footer?.phone || ''} onChange={(event) => updateGroup('footer', 'phone', event.target.value)}/></label>
            <label>Footer email<input type="email" value={configuration.footer?.email || ''} onChange={(event) => updateGroup('footer', 'email', event.target.value)}/></label>
            <label>Footer website<input type="url" value={configuration.footer?.website || ''} onChange={(event) => updateGroup('footer', 'website', event.target.value)}/></label>
          </div>
        </details>
        <details>
          <summary>Buttons and layout</summary>
          <div className="theme-control-grid">
            {Object.entries({buttonRadius:'Button roundness (px)',buttonPadding:'Button padding (px)',cardRadius:'Card roundness (px)',containerWidth:'Content width (px)',sectionSpacing:'Section spacing (px)'}).map(([key,label]) => <label key={key}>{label}<input type="number" min={key==='containerWidth'?800:0} max={key==='containerWidth'?1600:key==='sectionSpacing'?240:40} value={configuration.components?.[key] ?? ({buttonRadius:0,buttonPadding:14,cardRadius:0,containerWidth:1220,sectionSpacing:140}[key])} onChange={(event) => updateGroup('components', key, Number(event.target.value))}/></label>)}
          </div>
        </details>
        <details>
          <summary>Navigation menus</summary>
          {['main','footer'].map((menuName) => {
            const defaults = (menuName === 'main' ? defaultMainMenu : defaultFooterMenu).map(([id,label,url]) => ({ id, label, url, visible: true }))
            const menu = configuration.menus?.[menuName] || defaults
            return <div className="theme-menu-editor" key={menuName}><h3>{menuName === 'main' ? 'Header menu' : 'Footer links'}</h3>{menu.map((item,index) => <div className="theme-menu-item" key={`${item.id}-${index}`}>
              <input aria-label="Menu label" value={item.label} onChange={(event) => updateMenu(menuName,index,'label',event.target.value)}/>
              <input aria-label="Menu URL" value={item.url} onChange={(event) => updateMenu(menuName,index,'url',event.target.value)}/>
              <label className="theme-toggle"><input type="checkbox" checked={item.visible} onChange={(event) => updateMenu(menuName,index,'visible',event.target.checked)}/> Show</label>
              <div className="theme-menu-order"><button type="button" disabled={index===0} onClick={() => moveMenuItem(menuName,index,-1)} aria-label="Move menu link up">↑</button><button type="button" disabled={index===menu.length-1} onClick={() => moveMenuItem(menuName,index,1)} aria-label="Move menu link down">↓</button></div>
              <button type="button" className="theme-remove-button" onClick={() => removeMenuItem(menuName,index)}>Remove</button>
            </div>)}<button type="button" className="admin-tool-button" onClick={() => addMenuItem(menuName)}>Add menu link</button></div>
          })}
        </details>
        <details>
          <summary>Homepage SEO and section anchors</summary>
          {['home','about','services','projects','contact'].map((pageName) => {
            const page = configuration.pages?.[pageName] || {}
            const label = pageName === 'home' ? 'Homepage' : `${pageName[0].toUpperCase()+pageName.slice(1)} section`
            return <div className="theme-page-editor" key={pageName}>
              <h3>{label}</h3>
              <div className="theme-control-grid">
                {pageName === 'home' ? <>
                  <label>Homepage title<input value={page.title || ''} onChange={(event) => updateGroup('pages', pageName, { ...page, title:event.target.value })}/></label>
                  <label>SEO title<input value={page.seoTitle || ''} onChange={(event) => updateGroup('pages', pageName, { ...page, seoTitle:event.target.value })}/></label>
                  <label className="theme-wide">Meta description<textarea rows="2" value={page.metaDescription || ''} onChange={(event) => updateGroup('pages', pageName, { ...page, metaDescription:event.target.value })}/></label>
                </> : <label>Section anchor ID<input value={page.slug || pageName} onChange={(event) => updateGroup('pages', pageName, { ...page, slug:event.target.value })}/></label>}
                <label>{pageName === 'home' ? 'Homepage status' : 'Section status'}<select value={page.status || 'published'} onChange={(event) => updateGroup('pages', pageName, { ...page, status:event.target.value })}><option value="draft">Draft</option><option value="published">Published</option></select></label>
              </div>
            </div>
          })}
        </details>
        </>}
        {activeTab === 'sections' && <>
        <details open>
          <summary>Homepage sections</summary>
          <p className="theme-helper">Hide a section or change its position. Click any section in the preview to open its editing controls here.</p>
          <div className="theme-add-section"><select value={sectionToAdd} onChange={(event) => setSectionToAdd(event.target.value)}><option value="">Choose a removed section</option>{Object.entries(sectionLabels).filter(([id]) => !sections.some((section) => section.id === id)).map(([id,label]) => <option key={id} value={id}>{label}</option>)}</select><button type="button" className="admin-tool-button" disabled={!sectionToAdd} onClick={addSection}>Add section</button></div>
          <ol className="theme-section-list">{sections.map((section, index) => <li key={section.id} draggable onDragStart={() => setDraggedSection(index)} onDragOver={(event) => event.preventDefault()} onDrop={() => { reorderSection(draggedSection,index); setDraggedSection(null) }} onDragEnd={() => setDraggedSection(null)}>
            <label><input type="checkbox" checked={section.visible} onChange={(event) => updateSection(section.id, { visible: event.target.checked })}/><span>{sectionLabels[section.id] || section.id}</span></label>
            <div><button type="button" title="Move up" disabled={index === 0} onClick={() => moveSection(index, -1)}><ArrowUp size={15}/></button><button type="button" title="Move down" disabled={index === sections.length - 1} onClick={() => moveSection(index, 1)}><ArrowDown size={15}/></button><button type="button" title="Remove section" onClick={() => removeSection(section.id)}>×</button></div>
            <details ref={(element) => { if (element) sectionEditorsRef.current.set(section.id, element); else sectionEditorsRef.current.delete(section.id) }} open={selectedSection === section.id} className={`theme-section-fields${selectedSection === section.id ? ' is-preview-selected' : ''}`}><summary>Edit section text and images</summary><div className="theme-control-grid">{(sectionFields[section.id] || []).map(([key,label]) => {
              const isImageField = key === 'image' || key.endsWith('Image')
              const fieldValue = section.settings?.[key] || ''
              const changeField = (value) => updateSection(section.id, { settings: { [key]: value } })
              return <label className={['heading','description','intro','paragraphOne','paragraphTwo'].includes(key) ? 'theme-wide' : ''} key={key}>{label}{key.toLowerCase().includes('link') || isImageField ? <>
                <input data-section-field={key} value={fieldValue} onChange={(event) => changeField(event.target.value)} placeholder={isImageField ? 'Paste image URL or choose/upload an image below' : ''}/>
                {isImageField && <>
                  <select aria-label={`Choose ${label} from media library`} value={fieldValue} onChange={(event) => changeField(event.target.value)}><option value="">Choose from media library</option>{mediaItems.filter((item) => item.mediaType === 'image').map((item) => <option key={item.id} value={`/uploads/${item.storedName}`}>{item.originalName}</option>)}</select>
                  <span className="theme-upload-control"><Upload size={14}/><input type="file" accept="image/png,image/jpeg,image/webp,image/gif" aria-label={`Upload ${label}`} onChange={(event) => uploadSectionImage(event, section.id, key)} disabled={uploading}/></span>
                </>}
              </> : <textarea data-section-field={key} rows={key==='heading'?2:3} value={fieldValue} onChange={(event) => changeField(event.target.value)}/>}</label>
            })}</div><button type="button" className="admin-tool-button" onClick={() => updateSection(section.id,{settings:{}})}>Reset section text</button></details>
          </li>)}</ol>
        </details>
        </>}
        {activeTab === 'more' && <>
        <div className="theme-utility-actions">
          <h3>Other actions</h3>
          <button type="button" className="admin-tool-button" onClick={savePreset}>Save current design</button>
          <button type="button" className="admin-tool-button" onClick={resetTheme}>Restore original design</button>
          <button type="button" className="admin-tool-button" onClick={undo} disabled={!past.length}>Undo last change</button>
          <button type="button" className="admin-tool-button" onClick={redo} disabled={!future.length}>Redo change</button>
        </div>
        <details>
          <summary>Theme presets</summary>
          {!presets.length && <p className="theme-helper">No presets saved. Save the current draft to reuse its design settings later.</p>}
          <ol className="theme-version-list">{presets.map((preset) => <li key={preset.id}><span><b>{preset.name}</b></span><div className="theme-preset-actions"><button type="button" className="admin-tool-button" onClick={() => applyPreset(preset)}>Apply to draft</button><button type="button" className="theme-remove-button" onClick={() => deletePreset(preset)}>Delete</button></div></li>)}</ol>
        </details>
        <details>
          <summary><History size={16}/> Version history</summary>
          {!versions.length && <p className="theme-helper">No published versions yet. Your first Publish creates one.</p>}
          <ol className="theme-version-list">{versions.map((version) => <li key={version.id}><span><b>Version {version.revision}</b><small>{version.changedBy || 'Admin'} · {new Date(version.createdAt).toLocaleString()}</small></span><button type="button" className="admin-tool-button" onClick={() => restore(version)}>Restore draft</button></li>)}</ol>
        </details>
        </>}
      </section>
      <section className="theme-preview-panel">
        <div className="theme-preview-toolbar"><span>Preview</span><div>
          <button type="button" aria-label="Desktop preview" className={device === 'desktop' ? 'active' : ''} onClick={() => setDevice('desktop')}><Monitor size={16}/></button>
          <button type="button" aria-label="Tablet preview" className={device === 'tablet' ? 'active' : ''} onClick={() => setDevice('tablet')}><Tablet size={16}/></button>
          <button type="button" aria-label="Mobile preview" className={device === 'mobile' ? 'active' : ''} onClick={() => setDevice('mobile')}><Smartphone size={16}/></button>
        </div></div>
        <div className={`theme-preview-frame theme-preview-${device}`}>
          <iframe ref={previewRef} title="Website draft preview" src="/?themePreview=admin" onLoad={() => previewRef.current?.contentWindow?.postMessage({ type: 'vsw-theme-preview', theme: configuration }, window.location.origin)}/>
        </div>
        <p className="theme-helper">Click a section to edit its text. Click the hero or About image to replace it from the Media Library or upload a new image. Changes go public only after Publish.</p>
      </section>
    </div>
  </div>
}
