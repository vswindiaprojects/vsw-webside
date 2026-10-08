import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './pages/App'
import { AuthProvider } from './services/AuthContext'
import './styles/styles.css'
import './styles/account.css'

createRoot(document.getElementById('root')).render(<React.StrictMode><AuthProvider><App /></AuthProvider></React.StrictMode>)
