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
    <div className="min-h-screen bg-amber-50/20 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl p-6 sm:p-8">
          <h2 className="text-2xl font-semibold text-slate-900">Welcome back</h2>
          <p className="mt-1 text-sm text-rose-800">Sign in to continue your order.</p>

          <form onSubmit={submit} className="mt-5 space-y-3">
            <input
              value={email}
              onChange={e=>setEmail(e.target.value)}
              placeholder="Email"
              className="w-full rounded-xl border border-amber-200 bg-white/90 px-4 py-2.5 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400 transition"
            />
            <input
              type="password"
              value={password}
              onChange={e=>setPassword(e.target.value)}
              placeholder="Password"
              className="w-full rounded-xl border border-amber-200 bg-white/90 px-4 py-2.5 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400 transition"
            />

            {error && (
              <div className="text-sm text-rose-800 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2">
                {error}
              </div>
            )}

            <button
              disabled={loading}
              className="w-full inline-flex items-center justify-center rounded-xl bg-amber-400 px-4 py-2.5 font-medium text-black shadow hover:bg-amber-300 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-2 focus:ring-offset-amber-50 disabled:opacity-60 disabled:cursor-not-allowed transition"
            >
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          <div className="text-sm text-slate-700 mt-4">
            No account?{' '}
            <Link to="/auth/signup" className="text-rose-800 underline-offset-4 hover:underline">
              Create one
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
