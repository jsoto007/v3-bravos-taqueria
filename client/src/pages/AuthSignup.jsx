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
    <div className="max-w-md mx-auto bg-white rounded-2xl shadow p-6">
      <h2 className="text-xl font-semibold">Create your account</h2>
      <form onSubmit={submit} className="mt-4 grid grid-cols-2 gap-3">
        <input value={form.first_name} onChange={e=> setForm(f=>({...f, first_name:e.target.value}))} placeholder="First name" className="border rounded px-3 py-2 col-span-1" />
        <input value={form.last_name} onChange={e=> setForm(f=>({...f, last_name:e.target.value}))} placeholder="Last name" className="border rounded px-3 py-2 col-span-1" />
        <input value={form.email} onChange={e=> setForm(f=>({...f, email:e.target.value}))} placeholder="Email" className="border rounded px-3 py-2 col-span-2" />
        <input type="password" value={form.password} onChange={e=> setForm(f=>({...f, password:e.target.value}))} placeholder="Password" className="border rounded px-3 py-2 col-span-2" />
        {error && <div className="text-sm text-rose-600 col-span-2">{error}</div>}
        <button disabled={loading} className="col-span-2 px-4 py-2 rounded bg-slate-900 text-white">{loading? 'Creating…':'Create account'}</button>
      </form>
      <div className="text-sm text-slate-600 mt-3">Already have an account? <Link to="/auth/login" className="text-indigo-600">Sign in</Link></div>
    </div>
  )
}
