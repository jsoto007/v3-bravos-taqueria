import React, { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { api } from '../lib/api'

const AdminSettingsCtx = createContext(null)
export const useAdminSettings = () => useContext(AdminSettingsCtx)

export function AdminSettingsProvider({ children }) {
  const [settings, setSettings] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const refresh = useCallback(async () => {
    try {
      setLoading(true)
      const data = await api.adminSettings()
      setSettings(data)
      setError('')
    } catch (err) {
      setError(err.message || 'Unable to load settings')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  const updateSettings = useCallback(async (payload) => {
    const updated = await api.adminUpdateSettings(payload)
    setSettings(prev => ({ ...prev, ...updated }))
    return updated
  }, [])

  return (
    <AdminSettingsCtx.Provider value={{ settings, loading, error, refresh, updateSettings }}>
      {children}
    </AdminSettingsCtx.Provider>
  )
}
