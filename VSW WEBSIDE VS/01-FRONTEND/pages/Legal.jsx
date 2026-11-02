import { ArrowLeft } from 'lucide-react'

const COMPANY = 'VSW Solutions'
const CONTACT_EMAIL = 'vswindiaprojects@gmail.com'
const UPDATED = '2 November 2026'

const privacySections = [
  {
    title: 'Information we collect',
    body: [
      'When you contact us through this website, register an account, or sign in with Google, we collect the details you provide: your name, email address, phone number, company name, and the project brief you submit.',
      'If you sign in with Google, we receive your name, email address, and profile picture from Google. We do not receive or store your Google password.',
      'We also record basic technical information such as the pages you visit and the date and time of your requests, so we can keep the site secure and reliable.',
    ],
  },
  {
    title: 'How we use your information',
    body: [
      'We use your information to respond to project enquiries, prepare proposals, provide client portal access, and send service emails such as verification codes and password reset codes.',
      'We do not sell your personal information, and we do not use it for third-party advertising.',
    ],
  },
  {
    title: 'Cookies and local storage',
    body: [
      'We use your browser’s local storage to keep you signed in to your account and to remember basic preferences. We do not use advertising cookies.',
    ],
  },
  {
    title: 'Sharing with service providers',
    body: [
      'We share limited information with the providers that run this website: our hosting and database providers, our email delivery provider, and Google (when you choose Google sign-in). These providers process data only to deliver their service to us.',
    ],
  },
  {
    title: 'Data retention and security',
    body: [
      'Enquiry and account records are kept for as long as needed to serve your project and to meet legal and accounting requirements. Data is transmitted over encrypted connections and access is limited to authorised staff.',
    ],
  },
  {
    title: 'Your choices',
    body: [
      'You may ask us to access, correct, or delete your personal information, or to stop sending you service emails, by writing to ' + CONTACT_EMAIL + '. We will respond within a reasonable period.',
    ],
  },
  {
    title: 'Changes to this policy',
    body: [
      'We may update this policy from time to time. The latest version is always available on this page, with the revision date shown above.',
    ],
  },
]

const termsSections = [
  {
    title: 'Acceptance of these terms',
    body: [
      'By using this website you agree to these terms. If you do not agree, please do not use the site.',
    ],
  },
  {
    title: 'Website content',
    body: [
      'Project descriptions, images, and service information on this site are provided for general information. They do not constitute a quotation, offer, or professional advice, and project scope, fees, and timelines are confirmed only in a signed agreement.',
    ],
  },
  {
    title: 'Accounts and sign-in',
    body: [
      'You are responsible for keeping your login credentials confidential and for activity under your account. Notify us promptly at ' + CONTACT_EMAIL + ' if you believe your account has been used without your permission.',
      'When you use Google sign-in, you also agree to Google’s own terms for your Google account.',
    ],
  },
  {
    title: 'Acceptable use',
    body: [
      'You agree not to misuse the site, attempt to gain unauthorised access to any account or system, submit false information, or interfere with the normal operation of the site.',
    ],
  },
  {
    title: 'Intellectual property',
    body: [
      `The ${COMPANY} name, logo, and the design and content of this website are owned by us or used with permission. You may not copy or reuse them without written consent.`,
    ],
  },
  {
    title: 'Limitation of liability',
    body: [
      'The site is provided on an “as is” basis. To the extent permitted by law, we are not liable for indirect or consequential loss arising from use of the site or reliance on its content.',
    ],
  },
  {
    title: 'Governing law',
    body: [
      'These terms are governed by the laws of India, and the courts at Mumbai, Maharashtra have jurisdiction over any dispute relating to the site.',
    ],
  },
]

export default function Legal({ page }) {
  const isPrivacy = page === 'privacy'
  const title = isPrivacy ? 'Privacy Policy' : 'Terms of Service'
  const intro = isPrivacy
    ? 'How VSW Solutions collects, uses, and protects the information you share with us.'
    : 'The rules that apply when you use the VSW Solutions website and client portal.'
  const sections = isPrivacy ? privacySections : termsSections

  return (
    <main className="legal-page">
      <header className="account-header">
        <a href="/" className="brand"><img className="brand-logo" src="/assets/images/vsw-logo.png" alt="VSW Solutions - A Total Solution" /></a>
        <a className="account-back" href="/"><ArrowLeft size={15} /> Back to website</a>
      </header>
      <article className="legal-document shell">
        <p className="eyebrow">VSW SOLUTIONS / LEGAL</p>
        <h1>{title}</h1>
        <p className="legal-meta">Last updated: {UPDATED}</p>
        <p className="legal-intro">{intro}</p>
        {sections.map((section) => (
          <section key={section.title}>
            <h2>{section.title}</h2>
            {section.body.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
          </section>
        ))}
        <section>
          <h2>Contact us</h2>
          <p>Questions about this {isPrivacy ? 'policy' : 'agreement'}? Write to <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.</p>
        </section>
      </article>
      <footer className="account-footer"><span>© 2026 {COMPANY}</span><span>Project clarity, from the first conversation.</span></footer>
    </main>
  )
}
