import { useEffect, useId, useMemo, useRef, useState } from 'react'
import '../styles/client-logo-marquee.css'

const safeHref = (value) => {
  const link = String(value || '').trim()
  if (!link) return ''
  if (link.startsWith('/') && !link.startsWith('//') && !link.includes('\\')) return link
  if (link.startsWith('#')) return link
  try {
    const url = new URL(link)
    return ['http:', 'https:'].includes(url.protocol) ? url.toString() : ''
  } catch {
    return ''
  }
}

const useReducedMotion = () => {
  const [reduced, setReduced] = useState(() => (
    typeof window !== 'undefined' && window.matchMedia
      ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
      : false
  ))
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return undefined
    const query = window.matchMedia('(prefers-reduced-motion: reduce)')
    const update = () => setReduced(query.matches)
    update()
    query.addEventListener?.('change', update)
    query.addListener?.(update)
    return () => {
      query.removeEventListener?.('change', update)
      query.removeListener?.(update)
    }
  }, [])
  return reduced
}

function LogoCard({ logo, ariaHidden, preview, itemClass = 'clients-marquee-item' }) {
  const [failed, setFailed] = useState(false)
  useEffect(() => setFailed(false), [logo.imageUrl])
  const href = preview ? '' : safeHref(logo.link)
  const external = /^https?:\/\//i.test(href)
  const showImage = Boolean(logo.imageUrl) && !failed
  const fallback = <span className="clients-logo-fallback" aria-hidden={ariaHidden || undefined}>{logo.name || 'Client'}</span>
  const content = (
    <span className="clients-logo-media">
      {showImage
        ? <img src={logo.imageUrl} alt={ariaHidden ? '' : (logo.alt || `${logo.name || 'Client'} logo`)} loading="eager" decoding="async" draggable="false" onError={() => setFailed(true)} />
        : fallback}
    </span>
  )
  const label = `${logo.name || 'Client'}${external ? ' website (opens in a new tab)' : ''}`
  if (href && !ariaHidden) {
    return <a className={itemClass} href={href} target={external ? '_blank' : undefined} rel={external ? 'noopener noreferrer' : undefined} aria-label={label}>{content}</a>
  }
  if (href && ariaHidden) {
    return <a className={itemClass} href={href} target={external ? '_blank' : undefined} rel={external ? 'noopener noreferrer' : undefined} tabIndex={-1} aria-hidden="true">{content}</a>
  }
  return <div className={itemClass} aria-hidden={ariaHidden || undefined} title={logo.name || 'Client'}>{content}</div>
}

function LogoSequence({ logos, ariaHidden, groupRef, preview }) {
  return (
    <div className={`clients-marquee-group${ariaHidden ? ' clients-marquee-group-duplicate' : ''}`} ref={groupRef} aria-hidden={ariaHidden || undefined} data-duplicate={ariaHidden ? 'true' : 'false'}>
      {logos.map((logo, index) => <LogoCard key={`${logo.id}-${index}`} logo={logo} ariaHidden={ariaHidden} preview={preview} />)}
    </div>
  )
}

export default function ClientLogoMarquee({ config = {}, preview = false }) {
  const headingId = useId()
  const viewportRef = useRef(null)
  const measureRef = useRef(null)
  const [sequenceWidth, setSequenceWidth] = useState(0)
  const [viewportWidth, setViewportWidth] = useState(0)
  const reducedMotion = useReducedMotion()

  // The top strip can be curated with `marqueeIds` (managed in the client logo
  // config) so it shows a short trusted-brands shortlist while the full "Our
  // Clients" directory below still lists every enabled client.
  const stripIds = useMemo(() => (
    Array.isArray(config.marqueeIds) ? config.marqueeIds.map((id) => String(id)) : []
  ), [config.marqueeIds])
  const logos = useMemo(() => {
    const enabled = Array.isArray(config.logos) ? config.logos.filter((logo) => logo && logo.enabled !== false) : []
    if (!stripIds.length) return enabled
    const shortlist = new Set(stripIds)
    return enabled.filter((logo) => shortlist.has(String(logo.id)))
  }, [config.logos, stripIds])
  const animationEnabled = config.animationEnabled !== false
  const staticMode = !animationEnabled || reducedMotion
  const speed = Math.min(140, Math.max(20, Number(config.speed) || 55))
  const logoSize = Math.min(110, Math.max(36, Number(config.logoSize) || 64))
  const gap = Math.min(100, Math.max(20, Number(config.gap) || 56))
  // A marquee hides most clients: with a long roster we show a full logo wall instead
  // so every client is visible at once. `layout` can force either mode from the admin.
  const useGrid = logos.length > 0 && (
    config.layout === 'grid' || (config.layout !== 'marquee' && logos.length > 24)
  )
  // In the scrolling strip, keep only clients that actually have logo artwork so the
  // bar never looks like a list of missing images. Text-only clients still appear in
  // the full "All our clients" directory below.
  const marqueeLogos = useMemo(() => {
    const withArtwork = logos.filter((logo) => logo.imageUrl)
    return withArtwork.length >= 8 ? withArtwork : logos
  }, [logos])

  useEffect(() => {
    const measure = measureRef.current
    const viewport = viewportRef.current
    if (!measure || !viewport) return undefined
    const update = () => {
      setSequenceWidth(measure.getBoundingClientRect().width)
      setViewportWidth(viewport.getBoundingClientRect().width)
    }
    update()
    let observer = null
    if (typeof ResizeObserver !== 'undefined') {
      observer = new ResizeObserver(update)
      observer.observe(measure)
      observer.observe(viewport)
    }
    window.addEventListener('resize', update, { passive: true })
    return () => {
      observer?.disconnect()
      window.removeEventListener('resize', update)
    }
  }, [marqueeLogos, logoSize, gap, config.cardStyle, config.direction])

  if (config.visible === false && !preview) return null
  if (!logos.length && !preview) return null

  const repeat = staticMode || sequenceWidth <= 0
    ? 1
    : Math.max(1, Math.ceil((viewportWidth + 1) / sequenceWidth))
  const groupLogos = Array.from({ length: repeat }, () => marqueeLogos).flat()
  const groupWidth = sequenceWidth * repeat
  // Keep one full loop under ~70s so every client logo is seen quickly.
  const duration = groupWidth > 0 ? Math.min(70, Math.max(8, groupWidth / speed)) : 30
  const style = {
    '--config-logo-size': `${logoSize}px`,
    '--config-gap': `${gap}px`,
    '--marquee-duration': `${duration}s`,
  }
  const classes = [
    'client-logos-section',
    `client-logos-${config.cardStyle === 'plain' ? 'plain' : 'card'}`,
    config.direction === 'right' ? 'client-logos-right' : 'client-logos-left',
    staticMode ? 'client-logos-static' : '',
    config.grayscale ? 'client-logos-grayscale' : '',
    config.pauseOnHover !== false ? 'client-logos-pause-hover' : '',
    animationEnabled ? '' : 'client-logos-animation-off',
    preview ? 'client-logos-preview' : '',
  ].filter(Boolean).join(' ')

  return (
    <section className={classes} style={style} aria-labelledby={config.heading ? headingId : undefined} aria-label={config.heading ? undefined : 'Client and partner logos'}>
      <div className="shell clients-marquee-heading">
        {config.eyebrow && <p className="eyebrow">{config.eyebrow}</p>}
        {config.heading && <h2 id={headingId}>{config.heading}</h2>}
        {config.subheading && <p className="clients-marquee-subheading">{config.subheading}</p>}
      </div>
      {!logos.length ? (
        <div className="shell clients-marquee-empty">
          <strong>No client logos yet.</strong>
          <span>Add a logo in the admin panel and publish the draft to show it here.</span>
        </div>
      ) : useGrid ? (
        <div className="shell">
          <div className="client-logos-grid" aria-label="Client and partner logos">
            {logos.map((logo, index) => (
              <LogoCard key={`${logo.id}-${index}`} logo={logo} preview={preview} itemClass="client-logos-grid-item" />
            ))}
          </div>
        </div>
      ) : (
        <div className={`clients-marquee-viewport${staticMode ? ' is-static' : ''}`} ref={viewportRef} tabIndex={staticMode ? undefined : 0} role="group" aria-label="Client logos. The animation pauses when this area is hovered or focused.">
          <div className="clients-marquee-track">
            <LogoSequence logos={groupLogos} ariaHidden={false} preview={preview} />
            {!staticMode && <LogoSequence logos={groupLogos} ariaHidden preview={preview} groupRef={null} />}
          </div>
          <div className="clients-marquee-measure" ref={measureRef} aria-hidden="true">
            <LogoSequence logos={marqueeLogos} ariaHidden preview />
          </div>
        </div>
      )}
      {preview && config.visible === false && <p className="clients-marquee-preview-note">The board is currently hidden on the live website.</p>}
    </section>
  )
}
