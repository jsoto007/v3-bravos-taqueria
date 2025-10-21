import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function AuthSignup(){
  const { signup } = useAuth()
  const [form, setForm] = useState({ first_name:'', last_name:'', email:'', password:'' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const submit = async (e)=>{
    e.preventDefault()
    try { setLoading(true); setError(''); await signup(form); navigate('/') }
    catch(e){ setError(e.message) } finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen bg-amber-50/20 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="bg-amber-50 rounded-2xl shadow-xl p-6 sm:p-8">
          <h2 className="text-2xl font-semibold text-slate-900">Create your account</h2>
          <p className="mt-1 text-sm text-rose-800">Welcome! Let's get you set up.</p>

          <form onSubmit={submit} className="mt-5 grid grid-cols-2 gap-3">
            <input
              value={form.first_name}
              onChange={e=> setForm(f=>({...f, first_name:e.target.value}))}
              placeholder="First name"
              className="col-span-1 block w-full rounded-xl border border-amber-200 bg-white/90 px-4 py-2.5 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400 transition"
            />
            <input
              value={form.last_name}
              onChange={e=> setForm(f=>({...f, last_name:e.target.value}))}
              placeholder="Last name"
              className="col-span-1 block w-full rounded-xl border border-amber-200 bg-white/90 px-4 py-2.5 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400 transition"
            />
            <input
              value={form.email}
              onChange={e=> setForm(f=>({...f, email:e.target.value}))}
              placeholder="Email"
              className="col-span-2 block w-full rounded-xl border border-amber-200 bg-white/90 px-4 py-2.5 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400 transition"
            />
            <input
              type="password"
              value={form.password}
              onChange={e=> setForm(f=>({...f, password:e.target.value}))}
              placeholder="Password"
              className="col-span-2 block w-full rounded-xl border border-amber-200 bg-white/90 px-4 py-2.5 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400 transition"
            />

            {error && (
              <div className="col-span-2 text-sm text-rose-800 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2">
                {error}
              </div>
            )}

            <button
              disabled={loading}
              className="col-span-2 inline-flex items-center justify-center rounded-xl bg-amber-400 px-4 py-2.5 font-medium text-black shadow hover:bg-amber-300 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-2 focus:ring-offset-amber-50 disabled:opacity-60 disabled:cursor-not-allowed transition"
            >
              {loading ? 'Creating…' : 'Create account'}
            </button>
          </form>

          <div className="text-sm text-slate-700 mt-4">
            Already have an account?{' '}
            <Link to="/auth/login" className="text-rose-800 underline-offset-4 hover:underline">
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
