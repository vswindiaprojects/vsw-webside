import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { api } from './api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('vsw_user_token')
    if (!token) { setLoading(false); return }
    api.userProfile(token).then(({ data }) => setUser(data)).catch(() => localStorage.removeItem('vsw_user_token')).finally(() => setLoading(false))
  }, [])

  const login = async (credentials) => {
    const result = await api.userLogin(credentials)
    localStorage.setItem('vsw_user_token', result.token)
    setUser(result.data)
    return result
  }

  const register = (details) => api.userRegister(details)

  const logout = async () => {
    const token = localStorage.getItem('vsw_user_token')
    try { if (token) await api.userLogout(token) } catch { /* Always clear the local session even if the API is unavailable. */ }
    localStorage.removeItem('vsw_user_token')
    setUser(null)
  }

  const value = useMemo(() => ({ user, loading, login, register, logout }), [user, loading])
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider.')
  return context
}
