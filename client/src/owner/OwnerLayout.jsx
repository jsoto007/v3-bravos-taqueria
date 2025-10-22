import React from 'react'
import { NavLink, Outlet } from 'react-router-dom'

export default function OwnerLayout(){
  return (
    <div className="grid lg:grid-cols-[220px_1fr] gap-6">
      <aside className="sticky top-24 h-fit rounded-2xl border border-amber-100 bg-amber-50/80 shadow-sm backdrop-blur">
        <nav className="p-4 space-y-2">
          <NavLink
            to="/owner"
            end
            className={({ isActive }) =>
              [
                'block rounded-md px-3 py-2 text-sm transition',
                isActive
                  ? 'bg-amber-100/80 text-amber-800 border border-amber-200'
                  : 'text-slate-700 hover:bg-white/70 hover:text-slate-900'
              ].join(' ')
            }
          >
            Reports
          </NavLink>
          <NavLink
            to="/owner/menu"
            className={({ isActive }) =>
              [
                'block rounded-md px-3 py-2 text-sm transition',
                isActive
                  ? 'bg-amber-100/80 text-amber-800 border border-amber-200'
                  : 'text-slate-700 hover:bg-white/70 hover:text-slate-900'
              ].join(' ')
            }
          >
            Menu Manager
          </NavLink>
          <NavLink
            to="/owner/settings"
            className={({ isActive }) =>
              [
                'block rounded-md px-3 py-2 text-sm transition',
                isActive
                  ? 'bg-amber-100/80 text-amber-800 border border-amber-200'
                  : 'text-slate-700 hover:bg-white/70 hover:text-slate-900'
              ].join(' ')
            }
          >
            Settings
          </NavLink>
        </nav>
      </aside>
      <div>
        <Outlet />
      </div>
    </div>
  )
}
