import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { api } from '../lib/api'

const AuthCtx = createContext(null)
export const useAuth = ()=> useContext(AuthCtx)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async ()=>{
    try {
      const me = await api.me()
      setUser(me)
    } catch {
      setUser(null)
    } finally { setLoading(false) }
  }, [])

  useEffect(()=>{ refresh() }, [refresh])

  const login = async (email, password) => { const u = await api.login({ email, password }); setUser(u); return u }
  const signup = async (payload) => { const u = await api.signup(payload); setUser(u); return u }
  const logout = async () => { await api.logout(); setUser(null) }

  return (
    <AuthCtx.Provider value={{ user, loading, login, signup, logout, refresh }}>
      {children}
    </AuthCtx.Provider>
  )
}
