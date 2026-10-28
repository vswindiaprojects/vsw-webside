import { useId, useMemo, useState } from 'react'
import '../styles/all-clients.css'

const sortByName = (a, b) => a.name.localeCompare(b.name, 'en', { sensitivity: 'base' })

/** One client tile: shows the logo artwork, or the name when there is no artwork. */
function ClientTile({ logo }) {
  const [failed, setFailed] = useState(false)
  const showImage = Boolean(logo.imageUrl) && !failed
  return (
    <li className="all-clients__item" title={logo.name}>
      <span className="all-clients__media">
        {showImage
          ? <img src={logo.imageUrl} alt={`${logo.name} logo`} loading="eager" decoding="async" onError={() => setFailed(true)} />
          : <span className="all-clients__name">{logo.name}</span>}
      </span>
      {logo.imageUrl && <span className="all-clients__label">{logo.name}</span>}
    </li>
  )
}

/**
 * Standalone "all clients" section. Shows every enabled client from the same
 * client-logo config, so the complete list is visible in one place.
 */
export default function AllClients({ config = {} }) {
  const headingId = useId()
  const logos = useMemo(() => (Array.isArray(config.logos) ? config.logos.filter((logo) => logo && logo.enabled !== false) : []), [config.logos])

  if (!logos.length || config.visible === false || config.showAllClients === false) return null

  const sorted = [...logos].sort(sortByName)
  const heading = config.allClientsHeading || 'Our Clients'
  const eyebrow = config.allClientsEyebrow || ''
  const subheading = config.allClientsSubheading
    || `${sorted.length} clients and project partners across India — global brands, developers, hospitality groups and institutions.`

  return (
    <section className="all-clients" aria-labelledby={headingId}>
      <div className="shell">
        <header className="all-clients__head">
          {eyebrow && <p className="eyebrow">{eyebrow}</p>}
          <h2 id={headingId}>{heading}</h2>
          <p className="all-clients__sub">{subheading}</p>
        </header>

        <ul className="all-clients__grid">
          {sorted.map((logo, index) => (
            <ClientTile logo={logo} key={`${logo.id || logo.name}-${index}`} />
          ))}
        </ul>
      </div>
    </section>
  )
}
