import React from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'

export default function Navbar(){
  const { user, logout } = useAuth()
  const { cart } = useCart()
  const navigate = useNavigate()
  const itemsCount = (cart?.items||[]).reduce((s,i)=> s+i.qty, 0)

  const baseLink = ({ isActive }) => (
    `px-2 py-1 rounded transition-colors duration-150 ` +
    `text-white/90 hover:text-amber-400 ` +
    (isActive ? 'text-amber-400' : '')
  )

  return (
    <header className="bg-neutral-950 border-b border-neutral-800 sticky top-0 z-40">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" className="font-bold text-lg text-amber-400 hover:text-white transition-colors">
          Bravo's Taqueria
        </Link>
        <nav className="flex items-center gap-4">
          <NavLink to="/menu" className={baseLink}>Menu</NavLink>
          <NavLink to="/orders" className={baseLink}>My Orders</NavLink>
          <NavLink to="/cart" className={baseLink}>
            Cart
            <span className="ml-1 inline-flex items-center justify-center text-xs font-semibold bg-amber-400 text-black px-2 py-0.5 rounded-full min-w-5">
              {itemsCount}
            </span>
          </NavLink>
          {user ? (
            <div className="flex items-center gap-2">
              {user.admin && (
                <NavLink to="/admin" className={({isActive}) => (
                  `text-xs px-2 py-1 rounded bg-amber-50 text-rose-800 ` +
                  (isActive ? 'ring-1 ring-amber-400' : '')
                )}>
                  Admin
                </NavLink>
              )}
              {user.is_owner_admin && (
                <NavLink to="/owner" className={({isActive}) => (
                  `text-xs px-2 py-1 rounded bg-amber-50 text-rose-800 ` +
                  (isActive ? 'ring-1 ring-amber-400' : '')
                )}>
                  Owner
                </NavLink>
              )}
              <button
                onClick={async()=>{ await logout(); navigate('/') }}
                className="px-3 py-1 rounded bg-amber-400 text-black font-medium hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-amber-400/60"
              >
                Logout
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <NavLink
                to="/auth/login"
                className={({isActive}) => (
                  `px-3 py-1 rounded border border-amber-400 text-amber-400 hover:bg-amber-400 hover:text-black transition-colors ` +
                  (isActive ? 'bg-amber-400 text-black' : '')
                )}
              >
                Login
              </NavLink>
              <NavLink
                to="/auth/signup"
                className={({isActive}) => (
                  `px-3 py-1 rounded bg-amber-400 text-black font-medium hover:opacity-90 transition-colors ` +
                  (isActive ? 'ring-2 ring-amber-400/60' : '')
                )}
              >
                Sign up
              </NavLink>
            </div>
          )}
        </nav>
      </div>
    </header>
  )
}
