import React, { useEffect, useMemo, useState } from 'react'
import ToastStack from '../components/ui/ToastStack'
import { useAdminSettings } from '../context/AdminSettingsContext'

const notificationSchema = [
  { key: 'low_inventory', label: 'Low inventory' },
  { key: 'new_orders', label: 'New orders' },
  { key: 'status_changes', label: 'Status changes' },
]

const roleSchema = [
  { key: 'orders', label: 'Orders' },
  { key: 'inventory', label: 'Inventory' },
  { key: 'food_cost', label: 'Food cost' },
  { key: 'settings', label: 'Settings' },
]

const themes = [
  { value: 'system', label: 'System' },
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
]

export default function Settings() {
  const { settings, loading, error, updateSettings } = useAdminSettings()
  const [formState, setFormState] = useState({
    theme_preference: 'system',
    notifications: {},
    role_access: {},
  })
  const [saving, setSaving] = useState(false)
  const [toasts, setToasts] = useState([])

  useEffect(() => {
    if (settings) {
      setFormState({
        theme_preference: settings.theme_preference || 'system',
        notifications: settings.notifications || {},
        role_access: settings.role_access || {},
      })
    }
  }, [settings])

  const pushToast = (type, message) => {
    const id = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}`
    setToasts((prev) => [...prev, { id, type, message }])
    window.setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000)
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await updateSettings(formState)
      pushToast('success', 'Settings saved')
    } catch (err) {
      pushToast('error', err.message || 'Unable to save settings')
    } finally {
      setSaving(false)
    }
  }

  const notifications = useMemo(() => ({ ...formState.notifications }), [formState.notifications])
  const roleAccess = useMemo(() => ({ ...formState.role_access }), [formState.role_access])

  if (loading) {
    return <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center text-sm text-slate-500">Loading admin preferences…</div>
  }

  if (error) {
    return <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-700">{error}</div>
  }

  return (
    <div className="space-y-6">
      <ToastStack toasts={toasts} />
      <section className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Theme & notifications</h2>
          <button
            onClick={() => setFormState((prev) => ({
              ...prev,
              theme_preference: 'system',
            }))}
            className="text-sm text-slate-500"
          >
            Reset theme
          </button>
        </div>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <div className="text-xs uppercase tracking-[0.4em] text-slate-400">Theme</div>
            <select
              className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm"
              value={formState.theme_preference}
              onChange={(event) => setFormState((prev) => ({ ...prev, theme_preference: event.target.value }))}
            >
              {themes.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2 md:col-span-2">
            <div className="text-xs uppercase tracking-[0.4em] text-slate-400">Notifications</div>
            <div className="grid gap-3 sm:grid-cols-3">
              {notificationSchema.map((option) => (
                <label key={option.key} className="flex items-center gap-2 rounded-2xl border border-slate-200 px-3 py-2 text-sm">
                  <input
                    type="checkbox"
                    checked={!!notifications[option.key]}
                    onChange={(event) =>
                      setFormState((prev) => ({
                        ...prev,
                        notifications: { ...prev.notifications, [option.key]: event.target.checked },
                      }))
                    }
                  />
                  {option.label}
                </label>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Role access</h2>
          <span className="text-xs text-slate-500">Controls who can see each section</span>
        </div>
        <div className="mt-4 space-y-3">
          {roleSchema.map((role) => (
            <div key={role.key} className="grid gap-3 md:grid-cols-2">
              <div>
                <p className="text-sm font-semibold text-slate-900 dark:text-white">{role.label}</p>
                <p className="text-xs text-slate-500">Select role that can manage this area.</p>
              </div>
              <select
                value={roleAccess[role.key] || 'admin'}
                onChange={(event) =>
                  setFormState((prev) => ({
                    ...prev,
                    role_access: { ...prev.role_access, [role.key]: event.target.value },
                  }))
                }
                className="rounded-2xl border border-slate-200 px-3 py-2 text-sm"
              >
                <option value="admin">Admin</option>
                <option value="owner">Owner</option>
              </select>
            </div>
          ))}
        </div>
      </section>

      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="rounded-2xl bg-indigo-600 px-5 py-2 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-60"
        >
          {saving ? 'Saving…' : 'Save settings'}
        </button>
      </div>
    </div>
  )
}
