import { useEffect, useRef, useState } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { ArrowDown, ArrowUpRight, Check, ChevronRight, ExternalLink, Menu, MoveRight, X } from 'lucide-react'
import { projects as fallbackProjects, projectCategories, services as fallbackServices, strengths, workflow, billingExpertise, billingProcess, billingBenefits } from '../services/data'
import { api } from '../services/api'
import Admin from '../../04-ADMIN/pages/Admin'
import Login from './Login'
import Register from './Register'
import UserDashboard from './UserDashboard'
import ForgotPassword from './ForgotPassword'
import ChangePassword from './ChangePassword'
import ContactInquiry from '../components/ContactInquiry'
import { useAuth } from '../services/AuthContext'

gsap.registerPlugin(ScrollTrigger)

const navItems = [['About', 'about'], ['Services', 'services'], ['Projects', 'projects'], ['Workflow', 'workflow'], ['Why VSW', 'why-vsw'], ['Contact', 'contact']]
const categories = projectCategories
const normalizeProjectName = (name = '') => name.toLowerCase().replace(/[^a-z0-9]/g, '')
const projectAliases = { tcs: 'TCS Project', wework: 'We Work', dypatilcollege: 'D. Y. Patil College Hall', hiveicon67: 'Hive Icon 67, Office space', newgovernmentmedicalcollege: 'New Government Medical College Hall', kanakiyahighschool: 'Kanakiya High School Hall', lionsclubchemberhospital: 'Lions Club – Chembur – Hospital' }
const serviceIcons = { Compass: fallbackServices[0].icon, DraftingCompass: fallbackServices[1].icon, ClipboardList: fallbackServices[2].icon, Construction: fallbackServices[3].icon, FileText: fallbackServices[4].icon }
const mergePortfolioProjects = (records) => {
  const canonical = new Set(fallbackProjects.map((project) => normalizeProjectName(project.name)))
  const aliases = new Set(Object.keys(projectAliases))
  const additional = records.map((project) => {
    const name = project.title ?? project['Project Name'] ?? project.name ?? ''
    const key = normalizeProjectName(name)
    if (canonical.has(key) || aliases.has(key)) return null
    const location = project.location || project.Location || 'Not specified'
    const scope = project.scope || project.description || 'Scope not specified in source'
    const category = projectCategories.includes(project.category) ? project.category : 'Earlier Projects'
    return { id: `db-${project.id ?? project.ID ?? key}`, name, location, scope, category, status: 'Earlier', image: project.image || project.Image || fallbackProjects.find((fallback) => fallback.category === category)?.image || fallbackProjects.at(-1).image, imageAlt: `${category} illustrative visual for ${name}` }
  }).filter(Boolean)
  return [...fallbackProjects, ...additional]
}

function Button({ children, href, variant = 'primary', onClick, type = 'button' }) {
  const Component = href ? 'a' : 'button'
  const targetHref = href?.startsWith('https://wa.me/') ? 'https://wa.me/919136514351' : href
  return <Component type={type} href={targetHref} onClick={onClick} className={`button button-${variant}`}>{children}<ArrowUpRight size={16} strokeWidth={1.7} /></Component>
}

function SectionIntro({ eyebrow, title, text, light = false }) {
  return <div className={`section-intro reveal ${light ? 'section-intro-light' : ''}`}><p className="eyebrow">{eyebrow}</p><h2>{title}</h2>{text && <p className="intro-copy">{text}</p>}</div>
}

function Navbar({ theme = {} }) {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)
  const { user, loading: authLoading, logout } = useAuth()
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])
  const branding = theme.branding || {}
  const header = theme.header || {}
  const links = theme.menus?.main?.filter((item) => item.visible).map((item) => [item.label, item.url]) || navItems.map(([label, id]) => [label, `#${id}`])
  const logo = branding.primaryLogo || '/assets/images/vsw-logo.svg'
  return <header className={`navbar ${scrolled ? 'navbar-scrolled' : ''} ${header.sticky === false ? 'navbar-not-sticky' : ''}`} style={{ height: header.height || undefined, '--theme-logo-width': `${branding.logoWidth || 220}px`, '--theme-mobile-logo-width': `${branding.mobileLogoWidth || branding.logoWidth || 220}px` }}>
    <a href={branding.logoHref || '#home'} className="brand" onClick={() => setOpen(false)}><picture><source media="(max-width: 600px)" srcSet={branding.mobileLogo || logo}/><img className="brand-logo" src={logo} alt={branding.logoAlt || 'VSW Solutions - A Total Solution'}/></picture></a>
    <nav className={`nav-links nav-align-${header.navAlignment || 'right'} ${open ? 'nav-links-open' : ''}`}>{links.map(([label, href]) => <a key={`${label}-${href}`} href={href} onClick={() => setOpen(false)}>{label}</a>)}{header.showAccount !== false && ((authLoading ? Boolean(localStorage.getItem('vsw_user_token')) : Boolean(user)) ? <><a className="nav-auth-link" href="/account" onClick={() => setOpen(false)}>My Account</a><button className="nav-auth-link nav-auth-button" onClick={() => { logout(); setOpen(false) }}>Logout</button></> : <><a className="nav-auth-link" href="/login" onClick={() => setOpen(false)}>Login</a><a className="nav-auth-link nav-auth-register" href="/register" onClick={() => setOpen(false)}>Register</a></>)}<Button href="#contact">Start a Project</Button></nav>
    <button className="menu-button" aria-label="Toggle navigation" onClick={() => setOpen(!open)}>{open ? <X size={22} /> : <Menu size={22} />}</button>
  </header>
}

function Hero({ content = {} }) {
  const heading = content.heading || 'Showcasing our expertise. Delivering excellence.'
  return <section className="hero" id="home">
    <div className="hero-image" data-theme-image-field="heroImage" style={content.heroImage ? { backgroundImage: `linear-gradient(90deg, rgba(7,19,31,.8), rgba(7,19,31,.1)), url("${content.heroImage}")` } : undefined} />
    <div className="hero-grid" />
    <div className="hero-content shell">
      <p className="eyebrow hero-eyebrow hero-reveal">{content.eyebrow || 'VSW SOLUTIONS'} <span>•</span> PROJECT SOLUTIONS</p>
      <h1 className="hero-reveal">{heading.split('\n').map((line,index)=><span key={`${index}-${line}`}>{index>0&&<br/>}{line}</span>)}</h1>
      <p className="hero-lede hero-reveal">{content.tagline || 'Accurate Data. Innovative Design. Efficient Execution.'}</p>
      <p className="hero-copy hero-reveal">{content.description || 'VSW Solutions provides integrated project solutions combining site surveying, design, project management, turnkey execution and contracts billing services.'}</p>
      <div className="hero-actions hero-reveal"><Button href={content.buttonLink || '#services'}>{content.buttonText || 'Explore Our Services'}</Button><Button href={content.secondaryButtonLink || '#projects'} variant="ghost">{content.secondaryButtonText || 'View Our Projects'}</Button></div>
    </div>
    <div className="hero-bottom shell"><span>Scroll to explore</span><ArrowDown size={17} /><span className="hero-line" /></div>
  </section>
}

function StrengthBar({ content = {} }) {
  const defaults = ['ONE PARTNER', 'ONE INTEGRATED SOLUTION', 'BETTER RESULTS', 'Delivering Complete Project Solutions with Excellence.']
  const entries = ['itemOne', 'itemTwo', 'itemThree', 'itemFour'].map((key, index) => content[key] || defaults[index])
  return <section className="strength-bar"><div className="shell strength-grid">{entries.map((item, i) => <div className="strength-item reveal" key={`${i}-${item}`}><span>0{i + 1}</span><strong>{item}</strong><ArrowUpRight size={17} /></div>)}</div></section>
}

function About({ company = {}, content = {} }) {
  return <section className="section about-section" id="about"><div className="shell about-layout"><SectionIntro eyebrow="01 / About VSW" title={content.heading || <>Project thinking,<br /><em>made practical.</em></>} text={content.description || company.aboutCompany || "An integrated project-solutions company built around the details that make ambitious work possible."} /><div className="about-body reveal"><p className="body-large">{content.intro || company.aboutCompany || 'VSW Solutions brings together accurate data, professional surveying, thoughtful design and disciplined execution to help projects move forward with clarity.'}</p><div className="about-columns"><p>{content.paragraphOne || 'From the first site measurement to the final billing document, our work connects the practical requirements of a project across one coordinated process.'}</p><p>{content.paragraphTwo || 'We support design and planning, project coordination, management, turnkey execution and quality documentation with a focus on the work that needs to get done.'}</p></div>{(content.mission||content.vision)&&<div className="about-purpose-grid">{content.mission&&<p><b>Our mission</b>{content.mission}</p>}{content.vision&&<p><b>Our vision</b>{content.vision}</p>}</div>}<a className="text-link" href="#contact">{content.buttonText || 'Discuss your next project'} <MoveRight size={17} /></a></div><div className="about-image reveal"><img data-theme-image-field="image" src={content.image || 'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?auto=format&fit=crop&w=1600&q=85'} alt={content.imageAlt || 'Architectural construction detail'} loading="lazy" /><span className="image-caption">{content.caption || 'Built on accurate information.'}</span></div></div></section>
}

function Services({ services, content = {} }) {
  return <section className="section services-section" id="services"><div className="shell"><SectionIntro eyebrow={content.eyebrow || '02 / What we do'} title={content.heading || <>The intelligence<br /><em>behind the build.</em></>} text={content.description || 'A connected set of capabilities that keeps projects considered, coordinated and moving.'} /><div className="services-list">{services.map(({ number, title, short, description, icon: Icon, image }) => <article className="service-card reveal" key={number}><div className="service-top"><span className="service-number">{number}</span>{image?<img className="service-custom-image" src={image} alt="" loading="lazy"/>:<Icon size={28} strokeWidth={1.25} />}</div><h3>{title}</h3><p className="service-short">{short}</p><div className="service-details"><p>{description}</p><a href="#contact" aria-label={`Learn more about ${title}`}>Learn more <ChevronRight size={16} /></a></div></article>)}</div>
    <div className="billing-promo reveal"><div><p className="eyebrow">Commercial billing expertise</p><h3>Clear quantities.<br /><em>Confident billing.</em></h3><p>Explore our dedicated contracts billing and quantity surveying services.</p></div><a className="button button-primary" href="#billing-solutions">Explore Our Billing Solutions <ArrowUpRight size={16} /></a></div>
    <section className="billing-section" id="billing-solutions" aria-labelledby="billing-title"><div className="billing-heading"><p className="eyebrow">Dedicated commercial support</p><p className="billing-tagline">Your Commercial Billing Partner</p><h2 id="billing-title">VSW CONTRACTS<br /><em>BILLING SOLUTION</em></h2><p className="billing-intro">We specialize in end-to-end Contract Billing and Quantity Surveying services that help contractors maximize recoverable revenue, accelerate payments, and maintain complete commercial control throughout every stage of a project.</p><p className="billing-intro billing-intro-secondary">We ensure every executed quantity is accurately measured, documented, certified, and billed—reducing revenue leakage, minimizing disputes and improving project profitability.</p><a className="button button-outline" href="#contact">Contact Us <ArrowUpRight size={16} /></a></div>
      <div className="billing-subheading"><span>01 / Core expertise</span><h3>Commercial detail,<br /><em>managed end to end.</em></h3></div><div className="billing-expertise-grid">{billingExpertise.map(({ title, description, icon: Icon }, index) => <article className="billing-expertise-card reveal" key={title}><div className="billing-card-top"><span>0{index + 1}</span><Icon size={23} strokeWidth={1.5} aria-hidden="true" /></div><h4>{title}</h4><p>{description}</p></article>)}</div>
      <div className="billing-process"><div className="billing-subheading"><span>02 / Commercial billing process</span><h3>From project award<br /><em>to commercial closure.</em></h3></div><ol className="billing-process-grid">{billingProcess.map(({ title, icon: Icon }, index) => <li className="billing-process-step" key={title}><span className="billing-step-icon"><Icon size={20} strokeWidth={1.5} aria-hidden="true" /></span><span className="billing-step-number">{String(index + 1).padStart(2, '0')}</span><h4>{title}</h4></li>)}</ol></div>
      <div className="billing-benefits"><p className="eyebrow">Value for contractors</p><div className="billing-benefits-row">{billingBenefits.map(({ title, icon: Icon }) => <div className="billing-benefit" key={title}><Icon size={19} aria-hidden="true" /><span>{title}</span></div>)}</div></div>
    </section></div></section>
}

function Projects({ projects, content = {} }) {
  const [filter, setFilter] = useState('All Projects')
  const [selected, setSelected] = useState(null)
  const filtered = filter === 'All Projects' ? projects : filter === 'Earlier Projects' ? projects.filter((project) => project.status === 'Earlier') : projects.filter((project) => project.category === filter)
  const recentCount = projects.filter((project) => project.status === 'Recent').length
  return <section className="section projects-section" id="projects"><div className="shell"><div className="projects-heading"><SectionIntro eyebrow={content.eyebrow || '03 / Selected work'} title={content.heading || <>Recently executed<br /><em>projects.</em></>} text={content.description || 'Selected projects showcasing our expertise across surveying, billing, design, project management and turnkey solutions.'} /><a className="text-link desktop-link" href="#contact">{content.buttonText || 'Start a conversation'} <MoveRight size={17} /></a></div><div className="portfolio-summary"><span>{String(recentCount).padStart(2, '0')}</span><p>Current / recently executed projects</p><span className="portfolio-divider" /><span>{String(projects.filter((project) => project.status === 'Earlier').length).padStart(2, '0')}</span><p>Earlier / additional projects</p></div><div className="filters" role="tablist" aria-label="Project categories">{categories.map((category) => <button key={category} className={filter === category ? 'filter-active' : ''} onClick={() => setFilter(category)}>{category}</button>)}</div><div className="project-grid">{filtered.map((project) => <button className="project-card reveal" key={project.id} onClick={() => setSelected(project)}><div className="project-image"><img src={project.image} alt={project.imageAlt || `${project.category} illustrative image for ${project.name}`} loading="lazy" /><span className="project-open"><ExternalLink size={17} /><span>View Details</span></span><span className={`project-status ${project.status === 'Earlier' ? 'project-status-earlier' : ''}`}>{project.status === 'Earlier' ? 'Earlier / Additional' : 'Recently Executed'}</span></div><div className="project-meta"><div><h3>{project.name}</h3><p>{project.location}</p><p className="project-scope">{project.scope}</p></div><span>{project.category}</span></div></button>)}</div></div>{selected && <div className="modal-backdrop" role="presentation" onClick={() => setSelected(null)}><div className="project-modal" role="dialog" aria-modal="true" aria-label={selected.name} onClick={(event) => event.stopPropagation()}><button className="modal-close" onClick={() => setSelected(null)} aria-label="Close project details"><X size={20} /></button><img src={selected.image} alt={selected.imageAlt || `${selected.category} illustrative image for ${selected.name}`} /><div className="modal-copy"><p className="eyebrow">{selected.status === 'Earlier' ? 'Earlier / Additional Project' : 'Recently Executed Project'}</p><h2>{selected.name}</h2><p>{selected.location}</p><span className="modal-tag">{selected.category}</span><div className="modal-note"><span>Scope</span><strong>{selected.scope}</strong></div></div></div></div>}</section>
}

function Workflow({ content = {} }) {
  const [active, setActive] = useState(0)
  return <section className="section workflow-section" id="workflow"><div className="shell"><SectionIntro eyebrow={content.eyebrow || '04 / Project workflow'} title={content.heading || <>A clear path from<br /><em>brief to build.</em></>} text={content.description || 'Eight connected stages. One considered approach to moving a project forward.'} light /><div className="workflow-layout"><div className="workflow-steps">{workflow.map((step, i) => <button className={`workflow-step ${active === i ? 'workflow-step-active' : ''}`} key={step.number} onClick={() => setActive(i)}><span>{step.number}</span><strong>{step.title}</strong><ChevronRight size={17} /></button>)}</div><div className="workflow-feature"><span className="workflow-index">{workflow[active].number} / {String(workflow.length).padStart(2, '0')}</span><div><h3>{workflow[active].title}</h3><p>{workflow[active].text}</p></div><div className="workflow-progress"><span style={{ width: `${((active + 1) / workflow.length) * 100}%` }} /></div></div></div></div></section>
}

function WhyVsw({ content = {} }) {
  return <section className="section why-section" id="why-vsw"><div className="shell why-layout"><SectionIntro eyebrow={content.eyebrow || '05 / Why VSW'} title={content.heading || <>The way we<br /><em>work matters.</em></>} text={content.description || 'Good project outcomes are built through the habits behind the visible work: clear information, coordination and follow-through.'} /><div className="strengths-grid">{strengths.map((strength, i) => <div className="strength-card reveal" key={strength}><span>0{i + 1}</span><Check size={17} /><h3>{strength}</h3><p>Considered, practical and connected to the project at hand.</p></div>)}</div></div></section>
}

function ThemeTestimonials({ content = {} }) {
  const quotes = [content.quoteOne, content.quoteTwo, content.quoteThree].filter(Boolean)
  return <section className="section theme-testimonials" id="testimonials"><div className="shell"><SectionIntro eyebrow={content.eyebrow || 'Client feedback'} title={content.heading || 'Testimonials'} text={content.description}/>{quotes.length > 0 && <div className="theme-testimonial-grid">{quotes.map((quote, index) => <blockquote key={`${index}-${quote}`}><span>0{index + 1}</span><p>{quote}</p></blockquote>)}</div>}</div></section>
}

function ThemeFaq({ content = {} }) {
  const questions = [
    { question: content.questionOne, answer: content.answerOne },
    { question: content.questionTwo, answer: content.answerTwo },
    { question: content.questionThree, answer: content.answerThree },
  ].filter((item) => item.question || item.answer)
  return <section className="section theme-faq" id="faq"><div className="shell"><SectionIntro eyebrow={content.eyebrow || 'Information'} title={content.heading || 'Frequently asked questions'} text={content.description}/><div className="theme-faq-list">{questions.map((item, index) => <details key={`${index}-${item.question}`}><summary>{item.question || 'Question'}</summary><p>{item.answer}</p></details>)}</div></div></section>
}

function ThemeCallToAction({ content = {} }) {
  return <section className="section theme-cta" id="call-to-action"><div className="shell"><p className="eyebrow">{content.eyebrow || 'Ready to get started?'}</p><h2>{content.heading || "Let's plan your next project."}</h2>{content.description && <p>{content.description}</p>}<Button href={content.buttonLink || '#contact'}>{content.buttonText || 'Start a project'}</Button></div></section>
}

function Footer({ company = {}, content = {}, theme = {} }) {
  const phone1=company.phone1||'+91 98672 67499', phone2=company.phone2||'+91 91365 14351', email=company.email||'vswindiaprojects@gmail.com', website=company.website||'https://vswsolutions.com'
  const branding = theme.branding || {}
  const footer = theme.footer || {}
  const footerLinks = theme.menus?.footer?.filter((item) => item.visible) || navItems.slice(0,4).map(([label,id]) => ({ label, url: `#${id}` }))
  const logo = branding.footerLogo || branding.primaryLogo || '/assets/images/vsw-logo.svg'
  return <footer className="footer"><div className="shell footer-main"><div><a href={branding.logoHref||'#home'} className="brand footer-brand"><img className="brand-logo" src={logo} alt={branding.logoAlt || 'VSW Solutions - A Total Solution'} style={{ '--theme-logo-width': `${branding.logoWidth || 220}px`, '--theme-footer-logo-width': `${branding.footerLogoWidth || branding.logoWidth || 220}px` }}/></a>{(footer.description||content.tagline||content.subTagline)&&<p className="footer-tagline">{footer.description||content.tagline||company.tagline}{!footer.description&&content.subTagline&&<><br/><em>{content.subTagline}</em></>}</p>}</div><div className="footer-links"><span>Explore</span>{footerLinks.map((item)=><a key={`${item.label}-${item.url}`} href={item.url}>{item.label}</a>)}</div><div className="footer-links"><span>Connect</span><a href={'tel:'+(footer.phone||phone1).replace(/[^+\d]/g,'')}>{footer.phone||phone1}</a><a href={'tel:'+phone2.replace(/[^+\d]/g,'')}>{phone2}</a><a href={'mailto:'+(footer.email||email)}>{footer.email||email}</a><a href={footer.website|| (website.startsWith('http')?website:'https://'+website)}>{(footer.website||website).replace(/^https?:\/\//,'')}</a><a href="/login">Client Login</a></div></div><div className="shell footer-bottom"><span>{footer.copyright||`© 2026 ${company.companyName||'VSW Solutions'}. All Rights Reserved.`}</span><span>{content.copyrightTagline||'Showcasing our expertise. Delivering excellence.'}</span></div></footer>
}

function ThankYou() {
  const { user } = useAuth()
  const isMessage = new URLSearchParams(window.location.search).get('type') === 'message'
  useEffect(() => { document.title = 'Thank You | VSW Solutions' }, [])
  return <main className="thank-you-page"><header className="thank-you-header"><a href="/" className="brand"><img className="brand-logo" src="/assets/images/vsw-logo.svg" alt="VSW Solutions - A Total Solution" /></a></header><section className="thank-you-card"><span className="thank-you-check"><Check size={28} strokeWidth={1.8} /></span><p className="eyebrow">{isMessage?'MESSAGE RECEIVED':'ENQUIRY RECEIVED'}</p><h1>Thank you.</h1><p className="thank-you-copy">{isMessage?'Your message has been sent successfully. VSW Solutions will get back to you soon.':'Your enquiry has been submitted successfully. Thank you for reaching out to VSW Solutions.'}</p><div className="thank-you-actions">{!isMessage&&user && <a className="button button-outline" href="/account">View inquiry status <ArrowUpRight size={16} strokeWidth={1.7} /></a>}<a className="button button-primary" href="/">Return to website <ArrowUpRight size={16} strokeWidth={1.7} /></a></div><p className="thank-you-tagline">Accurate Data. Innovative Design. Efficient Execution.</p></section></main>
}

export default function App() {
  if (['/admin', '/admin/login'].includes(window.location.pathname)) return <Admin />
  if (window.location.pathname === '/login') return <Login />
  if (window.location.pathname === '/register') return <Register />
  if (window.location.pathname === '/forgot-password') return <ForgotPassword />
  if (window.location.pathname === '/change-password') return <ChangePassword />
  if (window.location.pathname === '/account') return <UserDashboard />
  if (window.location.pathname === '/thank-you' || window.location.hash === '#thank-you') return <ThankYou />
  const isThemePreview = new URLSearchParams(window.location.search).get('themePreview') === 'admin'
  const appRef = useRef(null)
  const [projects, setProjects] = useState(fallbackProjects)
  const [services, setServices] = useState(fallbackServices)
  const [company, setCompany] = useState({})
  const [websiteContent, setWebsiteContent] = useState({})
  const [theme, setTheme] = useState({})
  useEffect(() => {
    const previewing = isThemePreview
    const adminToken = previewing ? localStorage.getItem('vsw_admin_token') : null
    const themeRequest = adminToken ? api.adminTheme(adminToken).then((result) => ({ data: { theme: result.data.draft } })) : api.publicTheme()
    Promise.allSettled([api.projects(), api.services(), api.company(), api.publicContent(), themeRequest]).then(([projectResult, serviceResult, companyResult, contentResult, themeResult]) => {
      if (projectResult.status === 'fulfilled') setProjects(mergePortfolioProjects(projectResult.value.data))
      if (serviceResult.status === 'fulfilled' && serviceResult.value.data.length) { setServices(serviceResult.value.data.map((service, position) => { const fallback = fallbackServices.find((item) => item.title === service.title) || fallbackServices[Number(service.displayOrder || position + 1) - 1] || fallbackServices[0]; return { number: String(service.displayOrder || position + 1).padStart(2, '0'), title: service.title ?? service['Service Name'] ?? fallback.title, short: fallback.short ?? service.description ?? service['Short Description'], description: service.description ?? service['Full Description'] ?? fallback.description, image: service.image || fallback.image, icon: serviceIcons[service.icon ?? service.Icon] || fallback.icon } })) }
      if (companyResult.status === 'fulfilled') setCompany(companyResult.value.data)
      if (contentResult.status === 'fulfilled') setWebsiteContent(contentResult.value.data)
      if (themeResult.status === 'fulfilled') setTheme(themeResult.value.data.theme || {})
    })
  }, [isThemePreview])
  useEffect(() => {
    if (!isThemePreview) return
    const onPreview = (event) => {
      if (event.origin !== window.location.origin || event.data?.type !== 'vsw-theme-preview' || !event.data.theme || typeof event.data.theme !== 'object') return
      setTheme(event.data.theme)
    }
    window.addEventListener('message', onPreview)
    return () => window.removeEventListener('message', onPreview)
  }, [isThemePreview])
  useEffect(() => {
    if (!isThemePreview) return
    const selectSection = (event) => {
      const section = event.target.closest('[data-theme-section]')
      if (!section) return
      event.preventDefault()
      event.stopPropagation()
      const imageField = event.target.closest('[data-theme-image-field]')?.dataset.themeImageField
      window.parent.postMessage({ type: 'vsw-theme-section-select', sectionId: section.dataset.themeSection, imageField: imageField || null }, window.location.origin)
    }
    document.addEventListener('click', selectSection, true)
    return () => document.removeEventListener('click', selectSection, true)
  }, [isThemePreview])
  useEffect(() => {
    const root = document.documentElement
    const themeColors = theme.colors || {}
    const typography = theme.typography || {}
    const responsive = typography.responsive || {}
    const headingScale = typography.headingSize || 1
    const values = {
      '--navy': themeColors.primary || '#07131f',
      '--navy-2': themeColors.secondary || '#0b1e2e',
      '--gold': themeColors.accent || '#c2a36b',
      '--paper': themeColors.background || '#f4f6f4',
      '--ink': themeColors.text || '#12202a',
      '--theme-heading': themeColors.heading || themeColors.text || '#12202a',
      '--theme-link': themeColors.link || themeColors.accent || '#c2a36b',
      '--theme-button-bg': themeColors.buttonBackground || themeColors.accent || '#c2a36b',
      '--theme-button-text': themeColors.buttonText || themeColors.primary || '#07131f',
      '--line': themeColors.border || '#d9e0e1',
      '--theme-header-bg': themeColors.headerBackground || themeColors.primary || '#07131f',
      '--theme-footer-bg': themeColors.footerBackground || themeColors.primary || '#07131f',
      '--theme-card-bg': themeColors.cardBackground || '#ffffff',
      '--theme-body-font': typography.bodyFont || 'DM Sans',
      '--theme-heading-font': typography.headingFont || 'Space Grotesk',
      '--theme-body-size': `${typography.bodySize || 16}px`,
      '--theme-heading-scale': typography.headingSize || 1,
      '--theme-h1-size': typography.h1Size ? `${typography.h1Size}px` : headingScale !== 1 ? `${76 * headingScale}px` : undefined,
      '--theme-h2-size': typography.h2Size ? `${typography.h2Size}px` : headingScale !== 1 ? `${55 * headingScale}px` : undefined,
      '--theme-h3-size': typography.h3Size ? `${typography.h3Size}px` : undefined,
      '--theme-h4-size': typography.h4Size ? `${typography.h4Size}px` : undefined,
      '--theme-h5-size': typography.h5Size ? `${typography.h5Size}px` : undefined,
      '--theme-h6-size': typography.h6Size ? `${typography.h6Size}px` : undefined,
      '--theme-nav-size': typography.navSize ? `${typography.navSize}px` : undefined,
      '--theme-button-size': typography.buttonSize ? `${typography.buttonSize}px` : undefined,
      '--theme-footer-size': typography.footerSize ? `${typography.footerSize}px` : undefined,
      '--theme-button-radius': `${theme.components?.buttonRadius ?? 0}px`,
      '--theme-button-padding': `${theme.components?.buttonPadding ?? 14}px`,
      '--theme-card-radius': `${theme.components?.cardRadius ?? 0}px`,
      '--theme-container-width': `${theme.components?.containerWidth ?? 1220}px`,
      '--theme-section-spacing': `${theme.components?.sectionSpacing ?? 140}px`,
      '--theme-tablet-body-size': responsive.tablet?.bodySize ? `${responsive.tablet.bodySize}px` : undefined,
      '--theme-tablet-h1-size': responsive.tablet?.h1Size ? `${responsive.tablet.h1Size}px` : undefined,
      '--theme-tablet-h2-size': responsive.tablet?.h2Size ? `${responsive.tablet.h2Size}px` : undefined,
      '--theme-tablet-h3-size': responsive.tablet?.h3Size ? `${responsive.tablet.h3Size}px` : undefined,
      '--theme-mobile-body-size': responsive.mobile?.bodySize ? `${responsive.mobile.bodySize}px` : undefined,
      '--theme-mobile-h1-size': responsive.mobile?.h1Size ? `${responsive.mobile.h1Size}px` : undefined,
      '--theme-mobile-h2-size': responsive.mobile?.h2Size ? `${responsive.mobile.h2Size}px` : undefined,
      '--theme-mobile-h3-size': responsive.mobile?.h3Size ? `${responsive.mobile.h3Size}px` : undefined,
    }
    for (const [key, value] of Object.entries(values)) {
      if (value !== undefined) root.style.setProperty(key, value)
    }
  }, [theme])
  useEffect(() => {
    const favicon = theme.branding?.favicon
    if (!favicon) return
    if (!/^(\/(?!\/)|https?:\/\/)/i.test(favicon)) return
    let link = document.querySelector('link[rel="icon"]')
    if (!link) {
      link = document.createElement('link')
      link.rel = 'icon'
      document.head.appendChild(link)
    }
    link.href = favicon
  }, [theme.branding?.favicon])
  useEffect(() => {
    const page = theme.pages?.home
    if (!page) return
    if (page.seoTitle || page.title) document.title = page.seoTitle || page.title
    if (page.metaDescription) {
      let meta = document.querySelector('meta[name="description"]')
      if (!meta) {
        meta = document.createElement('meta')
        meta.name = 'description'
        document.head.appendChild(meta)
      }
      meta.content = page.metaDescription
    }
  }, [theme.pages?.home])
  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.utils.toArray('.reveal').forEach((element) => gsap.fromTo(element, { y: 24, opacity: 0 }, { y: 0, opacity: 1, duration: 0.75, ease: 'power2.out', scrollTrigger: { trigger: element, start: 'top 88%', once: true } }))
    }, appRef)
    return () => ctx.revert()
  }, [])
  const themeColors = theme.colors || {}
  const typography = theme.typography || {}
  const responsive = typography.responsive || {}
  const headingScale = typography.headingSize || 1
  const themedSection = (id, base = {}) => ({ ...base, ...(theme.sections?.find((section) => section.id === id)?.settings || {}) })
  const sectionComponents = {
    hero: <Hero content={themedSection('hero', websiteContent.home?.hero||{})}/>,
    strengths: <StrengthBar content={themedSection('strengths')}/>,
    about: <About company={company} content={themedSection('about', websiteContent.about?.main||{})}/>,
    services: <Services services={services} content={themedSection('services', websiteContent.services?.main||{})}/>,
    projects: <Projects projects={projects} content={themedSection('projects', websiteContent.projects?.main||{})}/>,
    workflow: <Workflow content={themedSection('workflow')}/>,
    'why-vsw': <WhyVsw content={themedSection('why-vsw')}/>,
    testimonials: <ThemeTestimonials content={themedSection('testimonials')}/>,
    faq: <ThemeFaq content={themedSection('faq')}/>,
    'call-to-action': <ThemeCallToAction content={themedSection('call-to-action')}/>,
    contact: <ContactInquiry services={services} company={company} content={themedSection('contact', websiteContent.contact?.main||{})}/>,
  }
  const defaultSections = ['hero', 'strengths', 'about', 'services', 'projects', 'workflow', 'why-vsw', 'contact'].map((id, order) => ({ id, order, visible: true }))
  const sections = [...(theme.sections !== undefined ? theme.sections : defaultSections)].filter((section) => section.visible && sectionComponents[section.id] && (isThemePreview || theme.pages?.[section.id]?.status !== 'draft')).sort((a, b) => a.order - b.order)
  const themeStyle = {
    '--navy': themeColors.primary || '#07131f',
    '--navy-2': themeColors.secondary || '#0b1e2e',
    '--gold': themeColors.accent || '#c2a36b',
    '--paper': themeColors.background || '#f4f6f4',
    '--ink': themeColors.text || '#12202a',
    '--theme-heading': themeColors.heading || themeColors.text || '#12202a',
    '--theme-link': themeColors.link || themeColors.accent || '#c2a36b',
    '--theme-button-bg': themeColors.buttonBackground || themeColors.accent || '#c2a36b',
    '--theme-button-text': themeColors.buttonText || themeColors.primary || '#07131f',
    '--line': themeColors.border || '#d9e0e1',
    '--theme-header-bg': themeColors.headerBackground || themeColors.primary || '#07131f',
    '--theme-footer-bg': themeColors.footerBackground || themeColors.primary || '#07131f',
    '--theme-card-bg': themeColors.cardBackground || '#ffffff',
    '--theme-body-font': typography.bodyFont || 'DM Sans',
    '--theme-heading-font': typography.headingFont || 'Space Grotesk',
    '--theme-body-size': `${typography.bodySize || 16}px`,
    '--theme-heading-scale': typography.headingSize || 1,
    '--theme-h1-size': typography.h1Size ? `${typography.h1Size}px` : headingScale !== 1 ? `${76 * headingScale}px` : undefined,
    '--theme-h2-size': typography.h2Size ? `${typography.h2Size}px` : headingScale !== 1 ? `${55 * headingScale}px` : undefined,
    '--theme-h3-size': typography.h3Size ? `${typography.h3Size}px` : undefined,
    '--theme-h4-size': typography.h4Size ? `${typography.h4Size}px` : undefined,
    '--theme-h5-size': typography.h5Size ? `${typography.h5Size}px` : undefined,
    '--theme-h6-size': typography.h6Size ? `${typography.h6Size}px` : undefined,
    '--theme-nav-size': typography.navSize ? `${typography.navSize}px` : undefined,
    '--theme-button-size': typography.buttonSize ? `${typography.buttonSize}px` : undefined,
    '--theme-footer-size': typography.footerSize ? `${typography.footerSize}px` : undefined,
    '--theme-button-radius': `${theme.components?.buttonRadius ?? 0}px`,
    '--theme-button-padding': `${theme.components?.buttonPadding ?? 14}px`,
    '--theme-card-radius': `${theme.components?.cardRadius ?? 0}px`,
    '--theme-container-width': `${theme.components?.containerWidth ?? 1220}px`,
    '--theme-section-spacing': `${theme.components?.sectionSpacing ?? 140}px`,
    '--theme-tablet-body-size': responsive.tablet?.bodySize ? `${responsive.tablet.bodySize}px` : undefined,
    '--theme-tablet-h1-size': responsive.tablet?.h1Size ? `${responsive.tablet.h1Size}px` : undefined,
    '--theme-tablet-h2-size': responsive.tablet?.h2Size ? `${responsive.tablet.h2Size}px` : undefined,
    '--theme-tablet-h3-size': responsive.tablet?.h3Size ? `${responsive.tablet.h3Size}px` : undefined,
    '--theme-mobile-body-size': responsive.mobile?.bodySize ? `${responsive.mobile.bodySize}px` : undefined,
    '--theme-mobile-h1-size': responsive.mobile?.h1Size ? `${responsive.mobile.h1Size}px` : undefined,
    '--theme-mobile-h2-size': responsive.mobile?.h2Size ? `${responsive.mobile.h2Size}px` : undefined,
    '--theme-mobile-h3-size': responsive.mobile?.h3Size ? `${responsive.mobile.h3Size}px` : undefined,
  }
  const homeDraft = !isThemePreview && theme.pages?.home?.status === 'draft'
  return <div ref={appRef} className={isThemePreview ? 'theme-preview-mode' : undefined} style={themeStyle}><Navbar theme={theme}/><main>{homeDraft ? <div className="theme-unpublished-page">This page is not published.</div> : sections.map((section) => <div key={section.id} id={theme.pages?.[section.id]?.slug !== section.id ? theme.pages?.[section.id]?.slug : undefined} data-theme-section={section.id} className="theme-page-section">{sectionComponents[section.id]}</div>)}</main><Footer company={company} content={{...(websiteContent.footer?.main||{}),...(theme.footer||{})}} theme={theme}/></div>
}
