import '../01-FRONTEND/styles/styles.css'
import '../01-FRONTEND/styles/account.css'

/* eslint-disable @next/next/no-page-custom-font -- The App Router root layout intentionally loads the original global fonts once. */
export const metadata = {
  title: 'VSW Solutions | Project Management, Surveying & Turnkey Solutions',
  description: 'VSW Solutions provides integrated project solutions including site surveying, design and space solutions, project management, turnkey project solutions and contracts billing services.',
  openGraph: {
    title: 'VSW Solutions | Project Management, Surveying & Turnkey Solutions',
    description: 'Showcasing our expertise. Delivering excellence through accurate data, innovative design and efficient execution.',
    type: 'website',
    url: 'https://vswsolutions.com',
  },
}

export const viewport = { themeColor: '#07131f' }

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Space+Grotesk:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body>{children}</body>
    </html>
  )
}
