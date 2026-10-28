import { useEffect, useId, useMemo, useRef, useState } from 'react'
import '../styles/project-counter.css'

export const DEFAULT_SETTINGS = {
  visible: true,
  eyebrow: 'Our work in numbers',
  title: 'Delivering with certainty.',
  subtitle:
    'A growing record of projects delivered across India with accurate data, coordinated execution and dependable follow-through.',
  primary: { value: 300, suffix: '+', label: 'Projects Completed' },
  stats: [], // e.g. { value: 150, suffix: '+', label: 'Clients Served' } (max 6)
  loop: true, // continuous looping ON/OFF
  duration: 2600, // ms to count 0 -> value
  pause: 2200, // ms to hold the final value before looping
  colors: { accent: '#c9a45c', bg: '#07131f', text: '#ffffff' },
}

const RING = 1131 // circumference of r=180
const FADE = 350 // soft fade at loop edges so 300 -> 0 never "snaps"
const ease = (t) => 1 - Math.pow(1 - t, 4) // easeOutQuart
const num = (n, min, max, d) => (Number.isFinite(+n) ? Math.min(max, Math.max(min, +n)) : d)
const NUMBER_FORMAT = new Intl.NumberFormat('en-IN')
const formatNumber = (value) => NUMBER_FORMAT.format(Math.round(value))
const normaliseSuffix = (value) => String(value ?? '').replace(/[\u0000-\u001f\u007f]/g, '').slice(0, 4)

// Accept the compact settings shape used by `settingsUrl`/`settings` as well as
// the admin configuration shape. Both resolve to the same internal config.
const isCompactSettings = (value) => Boolean(value && typeof value === 'object' && ('primary' in value || 'colors' in value))

const fromCompactSettings = (value) => {
  if (!value || typeof value !== 'object') return {}
  const settings = {
    visible: value.visible,
    eyebrow: value.eyebrow,
    heading: value.title,
    subheading: value.subtitle,
    loop: value.loop,
    duration: value.duration,
    pause: value.pause,
    accentColor: value.colors?.accent,
    backgroundColor: value.colors?.bg,
    textColor: value.colors?.text,
    backgroundStyle: value.colors?.bg || value.colors?.text ? 'custom' : undefined,
    mainStat: value.primary && {
      value: value.primary.value,
      suffix: value.primary.suffix,
      label: value.primary.label,
    },
    stats: Array.isArray(value.stats)
      ? value.stats.map((stat, index) => ({
        id: stat?.id || `stat-${index + 1}`,
        value: stat?.value,
        suffix: stat?.suffix,
        label: stat?.label,
        enabled: true,
      }))
      : undefined,
  }
  return Object.fromEntries(Object.entries(settings).filter(([, entry]) => entry !== undefined))
}

const mergeSettings = (base, override) => {
  if (!override) return base
  return { ...base, ...(isCompactSettings(override) ? fromCompactSettings(override) : override) }
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

function normalize(s = {}) {
  const d = DEFAULT_SETTINGS
  const item = (x, f) => ({
    value: Math.round(num(x?.value, 0, 1e6, f.value)), // never exceeds the configured value
    suffix: normaliseSuffix(x?.suffix ?? f.suffix),
    label: String(x?.label || f.label).slice(0, 60),
  })

  const backgroundStyle = ['navy', 'light', 'custom'].includes(s.backgroundStyle) ? s.backgroundStyle : 'navy'
  const palette = backgroundStyle === 'light'
    ? { bg: '#f4f5f2', text: '#12202a' }
    : { bg: d.colors.bg, text: d.colors.text }

  return {
    visible: s.visible !== false,
    eyebrow: s.eyebrow ?? d.eyebrow,
    title: s.heading ?? s.title ?? d.title,
    subtitle: s.subheading ?? s.subtitle ?? d.subtitle,
    loop: s.loop !== false,
    animationEnabled: s.animationEnabled !== false,
    decorativeLines: s.decorativeLines !== false,
    hoverEffect: s.hoverEffect !== false,
    animationDuration: num(s.duration, 500, 15000, d.duration),
    pause: num(s.pause, 0, 30000, d.pause),
    colors: {
      accent: String(s.accentColor || s.colors?.accent || d.colors.accent),
      bg: backgroundStyle === 'custom'
        ? String(s.backgroundColor || s.colors?.bg || d.colors.bg)
        : String(s.colors?.bg || palette.bg),
      text: backgroundStyle === 'custom'
        ? String(s.textColor || s.colors?.text || d.colors.text)
        : String(s.colors?.text || palette.text),
    },
    primary: s.mainStat ? item(s.mainStat, d.primary) : item(s.primary, d.primary),
    stats: (Array.isArray(s.stats) ? s.stats : [])
      .filter((stat) => stat && stat.enabled !== false && String(stat.label || '').trim())
      .slice(0, 6)
      .map((stat, index) => ({
        id: String(stat.id || `stat-${index + 1}`),
        ...item(stat, { value: 0, suffix: '+', label: '' }),
      })),
  }
}

/**
 * <ProjectCounter />                                      -> uses defaults above
 * <ProjectCounter settings={{ loop: false }} />           -> local overrides
 * <ProjectCounter settingsUrl="/api/counter-settings" />  -> loaded from admin/DB
 */
export default function ProjectCounter({
  config: providedConfig = {},
  settings,
  settingsUrl = '',
  preview = false,
  id = 'projects-counter',
}) {
  const headingId = useId()
  const reducedMotion = useReducedMotion()
  const [remoteSettings, setRemoteSettings] = useState(null)

  useEffect(() => {
    if (!settingsUrl) return undefined
    const controller = new AbortController()
    fetch(settingsUrl, { signal: controller.signal, headers: { Accept: 'application/json' } })
      .then((response) => (response.ok ? response.json() : null))
      .then((payload) => {
        const data = payload && typeof payload === 'object' && payload.data && typeof payload.data === 'object'
          ? payload.data
          : payload
        if (data && typeof data === 'object') setRemoteSettings(data)
      })
      .catch(() => {}) // Fall back to defaults/local overrides silently.
    return () => controller.abort()
  }, [settingsUrl])

  const merged = useMemo(() => {
    let next = providedConfig || {}
    if (settings) next = mergeSettings(next, settings)
    if (remoteSettings) next = mergeSettings(next, remoteSettings)
    return next
  }, [providedConfig, settings, remoteSettings])

  const cfg = useMemo(() => normalize(merged), [merged])
  const items = useMemo(() => [cfg.primary, ...cfg.stats], [cfg])
  const key = JSON.stringify([
    items.map((i) => i.value),
    items.map((i) => i.suffix),
    cfg.loop,
    cfg.animationEnabled,
    cfg.animationDuration,
    cfg.pause,
    cfg.visible,
    reducedMotion,
  ])

  const root = useRef(null)
  const nums = useRef([])
  const groups = useRef([])
  const ring = useRef(null)

  // One rAF loop drives every counter by writing straight to the DOM (zero re-renders).
  useEffect(() => {
    const el = root.current
    if (!el || !cfg.visible) return undefined
    el.classList.remove('is-in')
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const staticMode = mq.matches || !cfg.animationEnabled
    const values = items.map((i) => i.value)
    const { loop, animationDuration: duration, pause } = cfg
    const cycle = duration + pause
    let raf = 0, t0 = 0, running = false, inView = false, lastOp = -1

    const paint = (p, op) => {
      const rounded = Math.round(op * 100) / 100
      nums.current.forEach((node, i) => {
        if (!node || values[i] === undefined) return
        const value = formatNumber(values[i] * p)
        if (node.textContent !== value) node.textContent = value
        const group = groups.current[i]
        if (rounded !== lastOp && group) group.style.opacity = String(rounded)
        group?.classList.toggle('is-complete', p >= 1)
      })
      lastOp = rounded
      ring.current?.setAttribute('stroke-dashoffset', String(RING * (1 - 0.85 * p)))
    }

    const frame = (now) => {
      if (!running) return
      let t = now - t0
      t = loop ? t % cycle : Math.min(t, duration)
      const p = ease(Math.min(t / duration, 1))
      let op = 1
      if (loop) {
        if (t < FADE) op = 0.25 + 0.75 * (t / FADE)
        else if (cycle - t < FADE) op = 0.25 + 0.75 * ((cycle - t) / FADE)
      }
      paint(p, op)
      if (loop || now - t0 < duration) raf = requestAnimationFrame(frame)
      else running = false
    }

    const start = () => {
      if (running) return
      running = true
      t0 = performance.now()
      raf = requestAnimationFrame(frame)
    }
    const stop = () => {
      running = false
      cancelAnimationFrame(raf)
    }
    const showFinal = () => paint(1, 1)

    paint(staticMode ? 1 : 0, 1)

    const onEnter = () => {
      el.classList.add('is-in')
      if (staticMode) showFinal()
      else start()
    }

    let observer = null
    if (typeof IntersectionObserver === 'undefined') {
      inView = true
      onEnter()
    } else {
      observer = new IntersectionObserver(([entry]) => {
        inView = entry.isIntersecting
        if (inView) onEnter()
        else stop() // save resources off-screen
      }, { threshold: 0.25 })
      observer.observe(el)
    }

    const onVis = () => {
      if (document.hidden) stop()
      else if (inView && !staticMode) start()
    }
    document.addEventListener('visibilitychange', onVis)

    return () => {
      stop()
      observer?.disconnect()
      document.removeEventListener('visibilitychange', onVis)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])

  if (!cfg.visible && !preview) return null

  const c = cfg.colors
  const w = (v) => ({ minWidth: `${String(v).length}ch` })
  const classes = [
    'project-counter-section',
    'pc',
    cfg.decorativeLines ? '' : 'pc-no-lines',
    cfg.hoverEffect ? 'pc-hover' : 'pc-no-hover',
    reducedMotion || !cfg.animationEnabled ? 'pc-static' : '',
    preview ? 'pc-preview' : '',
  ].filter(Boolean).join(' ')

  return (
    <section
      id={id}
      ref={root}
      className={classes}
      style={{ '--pc-accent': c.accent, '--pc-bg': c.bg, '--pc-text': c.text }}
      aria-labelledby={cfg.title ? headingId : undefined}
      aria-label={cfg.title ? undefined : 'Company statistics'}
    >
      <div className="pc__card">
        <span className="pc__lines" aria-hidden="true" />

        {(cfg.eyebrow || cfg.title || cfg.subtitle) && (
          <header className="pc__head">
            {cfg.eyebrow && <p className="pc__eyebrow">{cfg.eyebrow}</p>}
            {cfg.title && <h2 className="pc__title" id={headingId}>{cfg.title}</h2>}
            {cfg.subtitle && <p className="pc__sub">{cfg.subtitle}</p>}
          </header>
        )}

        <div className="pc__hero">
          <div className="pc__ring">
            <svg viewBox="0 0 400 400" aria-hidden="true">
              <circle className="pc__track" cx="200" cy="200" r="180" />
              <circle className="pc__orbit" cx="200" cy="200" r="192" />
              <circle
                ref={ring}
                className="pc__arc"
                cx="200"
                cy="200"
                r="180"
                strokeDasharray={RING}
                strokeDashoffset={RING}
              />
            </svg>
            <div
              ref={(node) => { groups.current[0] = node }}
              className="pc__num"
              role="img"
              aria-label={`${cfg.primary.value}${cfg.primary.suffix} ${cfg.primary.label}`}
            >
              <span ref={(node) => { nums.current[0] = node }} className="pc__count" style={w(cfg.primary.value)}>0</span>
              <sup>{cfg.primary.suffix}</sup>
            </div>
          </div>
          <p className="pc__label">{cfg.primary.label}</p>
        </div>

        {cfg.stats.length > 0 && (
          <div className="pc__stats">
            {cfg.stats.map((stat, index) => (
              <div className="pc__stat" key={stat.id}>
                <div
                  ref={(node) => { groups.current[index + 1] = node }}
                  className="pc__snum"
                  role="img"
                  aria-label={`${stat.value}${stat.suffix} ${stat.label}`}
                >
                  <span ref={(node) => { nums.current[index + 1] = node }} className="pc__count" style={w(stat.value)}>0</span>
                  <span className="pc__ssuf">{stat.suffix}</span>
                </div>
                <p className="pc__slabel">{stat.label}</p>
              </div>
            ))}
          </div>
        )}

        {preview && !cfg.visible && (
          <p className="pc__preview-note">This counter is currently hidden on the live website.</p>
        )}
      </div>
    </section>
  )
}
