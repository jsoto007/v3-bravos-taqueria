import React, { useEffect, useState } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import { useAdminSettings } from '../context/AdminSettingsContext'

const NAV_ITEMS = [
  { label: 'Orders', to: '/admin', description: 'Incoming orders & status' },
  { label: 'Inventory', to: '/admin/inventory', description: 'Track stock & receive batches' },
  { label: 'Food Cost', to: '/admin/food-cost', description: 'Margin insights' },
  { label: 'Settings', to: '/admin/settings', description: 'Panel preferences' },
]

const navClass = ({ isActive }) =>
  `px-3 py-2 rounded-full text-sm font-semibold transition shadow-sm ${
    isActive
      ? 'bg-slate-900 text-white shadow-md dark:bg-slate-100 dark:text-slate-900'
      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70 dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-800/80'
  }`

export default function AdminLayout() {
  const { settings } = useAdminSettings()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [prefersDark, setPrefersDark] = useState(() => {
    if (typeof window === 'undefined') return false
    return window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false
  })

  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const handler = (event) => setPrefersDark(event.matches)
    media.addEventListener ? media.addEventListener('change', handler) : media.addListener(handler)
    return () => {
      media.removeEventListener ? media.removeEventListener('change', handler) : media.removeListener(handler)
    }
  }, [])

  const themePreference = settings?.theme_preference || 'system'
  const isDark = themePreference === 'dark' || (themePreference === 'system' && prefersDark)

  return (
    <div className={`${isDark ? 'dark' : ''} min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-100 text-slate-900 transition-colors duration-200 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 dark:text-slate-50`}>
      <header className="border-b border-slate-200/80 bg-white/80 backdrop-blur-lg dark:border-slate-800/80 dark:bg-slate-900/80">
        <div className="container mx-auto flex items-center justify-between px-4 py-4">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-slate-500 dark:text-slate-400">Admin</p>
            <h1 className="text-xl font-semibold text-slate-900 dark:text-white">Bravo&apos;s Taqueria</h1>
          </div>
          <nav className="hidden lg:flex items-center gap-3">
            {NAV_ITEMS.map((item) => (
              <NavLink key={item.to} to={item.to} end={item.to === '/admin'} className={navClass}>
                {item.label}
              </NavLink>
            ))}
          </nav>
          <button
            className="inline-flex items-center gap-2 rounded-full border border-slate-200/80 px-3 py-1 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800 lg:hidden"
            onClick={() => setMobileOpen(true)}
            aria-label="Open admin navigation"
          >
            Menu
            <span aria-hidden="true">▾</span>
          </button>
        </div>
      </header>

      {mobileOpen && (
        <div
          className="fixed inset-0 z-50 flex"
          role="dialog"
          aria-modal="true"
          onClick={(event) => {
            if (event.target === event.currentTarget) setMobileOpen(false)
          }}
        >
          <div className="flex-1 bg-black/30 backdrop-blur" />
          <div className="w-64 bg-white shadow-xl ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800 p-4">
            <div className="mb-4 flex items-center justify-between">
              <span className="text-lg font-semibold text-slate-900 dark:text-white">Navigation</span>
              <button onClick={() => setMobileOpen(false)} className="text-slate-500 hover:text-slate-900 dark:text-slate-400 hover:dark:text-white">
                Close
              </button>
            </div>
            <div className="space-y-2">
              {NAV_ITEMS.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === '/admin'}
                  className={({ isActive }) => (
                    `block rounded-xl px-3 py-2 text-sm font-semibold shadow-sm transition ${
                      isActive
                        ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
                        : 'text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800/80'
                    }`
                  )}
                  onClick={() => setMobileOpen(false)}
                >
                  {item.label}
                </NavLink>
              ))}
            </div>
          </div>
        </div>
      )}

      <main className="container mx-auto px-4 py-8 lg:py-10">
        <Outlet />
      </main>
    </div>
  )
}
