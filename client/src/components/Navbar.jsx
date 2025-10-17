import React from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'

export default function Navbar(){
  const { user, logout } = useAuth()
  const { cart } = useCart()
  const navigate = useNavigate()
  const itemsCount = (cart?.items||[]).reduce((s,i)=> s+i.qty, 0)

  return (
    <header className="bg-white border-b sticky top-0 z-40">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" className="font-bold text-lg">Bravo's Taqueria</Link>
        <nav className="flex items-center gap-4">
          <NavLink to="/menu" className={({isActive})=>`hover:text-indigo-600 ${isActive?'text-indigo-600':''}`}>Menu</NavLink>
          <NavLink to="/orders" className={({isActive})=>`hover:text-indigo-600 ${isActive?'text-indigo-600':''}`}>My Orders</NavLink>
          <NavLink to="/cart" className={({isActive})=>`hover:text-indigo-600 ${isActive?'text-indigo-600':''}`}>
            Cart <span className="text-sm bg-slate-100 px-2 py-0.5 rounded">{itemsCount}</span>
          </NavLink>
          {user ? (
            <div className="flex items-center gap-2">
              {user.admin && <NavLink to="/admin" className="text-sm px-2 py-1 rounded bg-slate-100">Admin</NavLink>}
              {user.is_owner_admin && <NavLink to="/owner" className="text-sm px-2 py-1 rounded bg-slate-100">Owner</NavLink>}
              <button onClick={async()=>{ await logout(); navigate('/') }} className="px-3 py-1 rounded bg-slate-900 text-white">Logout</button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <NavLink to="/auth/login" className="px-3 py-1 rounded border">Login</NavLink>
              <NavLink to="/auth/signup" className="px-3 py-1 rounded bg-slate-900 text-white">Sign up</NavLink>
            </div>
          )}
        </nav>
      </div>
    </header>
  )
}
