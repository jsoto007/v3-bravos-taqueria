import React from 'react'
import { NavLink, Outlet } from 'react-router-dom'

export default function AdminLayout(){
  return (
    <div className="grid lg:grid-cols-[220px_1fr] gap-6">
      <aside className="bg-white rounded-2xl shadow h-fit sticky top-24">
        <nav className="p-4 space-y-2">
          <NavLink to="/admin" end className={({isActive})=>`block px-3 py-2 rounded ${isActive? 'bg-indigo-50 text-indigo-700':'hover:bg-slate-50'}`}>Orders</NavLink>
          <NavLink to="/admin/inventory" className={({isActive})=>`block px-3 py-2 rounded ${isActive? 'bg-indigo-50 text-indigo-700':'hover:bg-slate-50'}`}>Inventory</NavLink>
          <NavLink to="/admin/food-cost" className={({isActive})=>`block px-3 py-2 rounded ${isActive? 'bg-indigo-50 text-indigo-700':'hover:bg-slate-50'}`}>Food Cost</NavLink>
        </nav>
      </aside>
      <div>
        <Outlet />
      </div>
    </div>
  )
}
