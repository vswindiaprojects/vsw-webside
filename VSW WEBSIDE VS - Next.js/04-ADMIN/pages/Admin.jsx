import { useEffect, useState } from 'react'
import { api } from '../../01-FRONTEND/services/api'
import AdminLogin from './AdminLogin'
import AdminWorkspace from './AdminWorkspace'

export default function Admin() {
  const [token,setToken]=useState(()=>localStorage.getItem('vsw_admin_token'))
  const [email,setEmail]=useState('')
  const [password,setPassword]=useState('')
  const [error,setError]=useState('')
  const [isSigningIn,setIsSigningIn]=useState(false)
  const [admin,setAdmin]=useState(null)
  const [isCheckingSession,setIsCheckingSession]=useState(Boolean(token))
  const logout=async()=>{const currentToken=localStorage.getItem('vsw_admin_token');try{if(currentToken)await api.logout(currentToken)}catch{}finally{localStorage.removeItem('vsw_admin_token');localStorage.removeItem('vsw_admin_user');setAdmin(null);setToken(null)}}
  useEffect(()=>{if(!token)return;let current=true;api.adminMe(token).then(result=>{if(current){setAdmin(result.data);localStorage.setItem('vsw_admin_user',JSON.stringify(result.data))}}).catch(()=>{if(current)logout()}).finally(()=>{if(current)setIsCheckingSession(false)});return()=>{current=false}},[token])
  const signIn=async(event)=>{event.preventDefault();setError('');setIsSigningIn(true);try{const result=await api.login({email,password});localStorage.setItem('vsw_admin_token',result.token);localStorage.setItem('vsw_admin_user',JSON.stringify(result.data));setAdmin(result.data);setPassword('');setToken(result.token);setIsCheckingSession(false)}catch(e){setError(e.message)}finally{setIsSigningIn(false)}}
  if(!token)return <AdminLogin email={email} password={password} error={error||(localStorage.getItem('vsw_user_token')?'Admin access is separate from client accounts. Sign in with administrator credentials.':'')} isSigningIn={isSigningIn} onEmailChange={setEmail} onPasswordChange={setPassword} onSubmit={signIn}/>
  if(isCheckingSession||!admin)return <div className="admin-session-loading" role="status">Checking administrator session…</div>
  return <AdminWorkspace token={token} admin={admin} onLogout={logout}/>
}
