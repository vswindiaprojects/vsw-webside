'use client'

import dynamic from 'next/dynamic'
import { AuthProvider } from '../../01-FRONTEND/services/AuthContext'

// Existing pages read browser state during render. Keep the unchanged React app
// client-rendered while Next owns URL routing, metadata, and asset serving.
const ExistingApp = dynamic(() => import('../../01-FRONTEND/pages/App'), { ssr: false })

export default function Page() {
  return <AuthProvider><ExistingApp /></AuthProvider>
}
