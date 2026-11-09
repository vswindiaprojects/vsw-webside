import '../styles/skeleton.css'

const range = (count) => Array.from({ length: count }, (_, index) => index)

/** Placeholder for the client-logo strip and the full "Our Brands" grid. */
export function ClientLogosSkeleton() {
  return <>
    <section className="client-logos-section client-logos-skeleton" aria-hidden="true">
      <div className="shell clients-marquee-heading">
        <span className="skeleton skeleton-line skeleton-eyebrow" />
        <span className="skeleton skeleton-line skeleton-title" />
      </div>
      <div className="skeleton-marquee">
        {range(6).map((index) => <span className="skeleton skeleton-logo-card" key={index} />)}
      </div>
    </section>

    <section className="all-clients all-clients-skeleton" aria-hidden="true">
      <div className="shell">
        <header className="all-clients__head">
          <span className="skeleton skeleton-line skeleton-eyebrow" />
          <span className="skeleton skeleton-line skeleton-title" />
          <span className="skeleton skeleton-line skeleton-sub" />
        </header>
        <ul className="all-clients__grid">
          {range(12).map((index) => <li className="all-clients__item" key={index}><span className="skeleton skeleton-tile" /></li>)}
        </ul>
      </div>
    </section>
  </>
}

/** Placeholder for the navy "Our work in numbers" board. */
export function CounterSkeleton() {
  return <section className="counter-skeleton" aria-hidden="true">
    <div className="shell">
      <div className="counter-skeleton-head">
        <span className="skeleton skeleton-dark skeleton-line skeleton-eyebrow" />
        <span className="skeleton skeleton-dark skeleton-line skeleton-title" />
      </div>
      <div className="counter-skeleton-body">
        <div className="counter-skeleton-primary">
          <span className="skeleton skeleton-dark counter-skeleton-number" />
          <span className="skeleton skeleton-dark skeleton-line skeleton-label" />
        </div>
        <div className="counter-skeleton-grid">
          {range(8).map((index) => <span className="skeleton skeleton-dark skeleton-stat" key={index} />)}
        </div>
      </div>
    </div>
  </section>
}
