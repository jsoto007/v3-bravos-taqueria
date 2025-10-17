import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function AuthLogin(){
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const submit = async (e)=>{
    e.preventDefault()
    try { setLoading(true); setError(''); await login(email, password); navigate('/') }
    catch(e){ setError(e.message) } finally { setLoading(false) }
  }

  return (
    <div className="max-w-md mx-auto bg-white rounded-2xl shadow p-6">
      <h2 className="text-xl font-semibold">Welcome back</h2>
      <form onSubmit={submit} className="mt-4 space-y-3">
        <input value={email} onChange={e=>setEmail(e.target.value)} placeholder="Email" className="w-full border rounded px-3 py-2" />
        <input type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="Password" className="w-full border rounded px-3 py-2" />
        {error && <div className="text-sm text-rose-600">{error}</div>}
        <button disabled={loading} className="w-full px-4 py-2 rounded bg-slate-900 text-white">{loading? 'Signing in…':'Sign in'}</button>
      </form>
      <div className="text-sm text-slate-600 mt-3">No account? <Link to="/auth/signup" className="text-indigo-600">Create one</Link></div>
    </div>
  )
}
