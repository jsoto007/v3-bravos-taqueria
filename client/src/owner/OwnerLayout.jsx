import React from 'react'
import { NavLink, Outlet } from 'react-router-dom'

export default function OwnerLayout(){
  return (
    <div className="grid lg:grid-cols-[220px_1fr] gap-6">
      <aside className="bg-white rounded-2xl shadow h-fit sticky top-24">
        <nav className="p-4 space-y-2">
          <NavLink to="/owner" end className={({isActive})=>`block px-3 py-2 rounded ${isActive? 'bg-indigo-50 text-indigo-700':'hover:bg-slate-50'}`}>Reports</NavLink>
          <NavLink to="/owner/menu" className={({isActive})=>`block px-3 py-2 rounded ${isActive? 'bg-indigo-50 text-indigo-700':'hover:bg-slate-50'}`}>Menu Manager</NavLink>
          <NavLink to="/owner/settings" className={({isActive})=>`block px-3 py-2 rounded ${isActive? 'bg-indigo-50 text-indigo-700':'hover:bg-slate-50'}`}>Settings</NavLink>
        </nav>
      </aside>
      <div>
        <Outlet />
      </div>
    </div>
  )
}
