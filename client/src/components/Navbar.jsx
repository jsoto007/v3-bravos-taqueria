import React, { useEffect, useRef, useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'
import viteLogo from '/vite.svg'

export default function Navbar(){
  const { user, logout } = useAuth()
  const { cart } = useCart()
  const navigate = useNavigate()
  const itemsCount = (cart?.items||[]).reduce((s,i)=> s+i.qty, 0)

  const [isOpen, setIsOpen] = useState(false)
  const panelRef = useRef(null)

  // Close on Escape
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') setIsOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const baseLink = ({ isActive }) => (
    `px-2 py-1 rounded transition-colors duration-150 ` +
    `text-white/90 hover:text-amber-400 ` +
    (isActive ? 'text-amber-400' : '')
  )

  const authButtons = (
    <>
      <NavLink
        to="/auth/login"
        className={({isActive}) => (
          `px-3 py-1 rounded border border-amber-400 text-amber-400 hover:bg-amber-400 hover:text-black transition-colors ` +
          (isActive ? 'bg-amber-400 text-black' : '')
        )}
        onClick={() => setIsOpen(false)}
      >
        Login
      </NavLink>
      <NavLink
        to="/auth/signup"
        className={({isActive}) => (
          `px-3 py-1 rounded bg-amber-400 text-black font-medium hover:opacity-90 transition-colors ` +
          (isActive ? 'ring-2 ring-amber-400/60' : '')
        )}
        onClick={() => setIsOpen(false)}
      >
        Sign up
      </NavLink>
    </>
  )

  const adminButtons = (
    <>
      {user?.admin && (
        <NavLink to="/admin" className={({isActive}) => (
          `text-xs px-2 py-1 rounded bg-amber-50 text-rose-800 ` +
          (isActive ? 'ring-1 ring-amber-400' : '')
        )} onClick={() => setIsOpen(false)}>
          Admin
        </NavLink>
      )}
      {user?.is_owner_admin && (
        <NavLink to="/owner" className={({isActive}) => (
          `text-xs px-2 py-1 rounded bg-amber-50 text-rose-800 ` +
          (isActive ? 'ring-1 ring-amber-400' : '')
        )} onClick={() => setIsOpen(false)}>
          Owner
        </NavLink>
      )}
      <button
        onClick={async()=>{
          await logout()
          setIsOpen(false)
          navigate('/')
        }}
        className="px-3 py-1 rounded bg-amber-400 text-black font-medium hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-amber-400/60"
      >
        Logout
      </button>
    </>
  )

  return (
    <header className="bg-neutral-950 border-b border-neutral-800 fixed top-0 inset-x-0 z-40">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        {/* Brand — ensure visible on mobile */}
        <Link to="/" className="font-bold text-lg text-amber-400 hover:text-white transition-colors">
          <span className="inline-flex items-center gap-2">
            <img src={viteLogo} alt="Bravo's Taqueria logo" className="h-10 w-10" loading="eager" decoding="async" />
            <span>Bravo&apos;s Taqueria</span>
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-4">
          <NavLink to="/menu" className={baseLink}>Menu</NavLink>
          <NavLink to="/orders" className={baseLink}>My Orders</NavLink>
          <NavLink to="/cart" className={baseLink}>
            <span className="inline-flex items-center">
              Cart
              <span className="ml-0.5 inline-flex items-center justify-center text-xs font-semibold bg-amber-400 text-black px-2 py-0.5 rounded-full min-w-5">
                {itemsCount}
              </span>
            </span>
          </NavLink>
          {user ? (
            <div className="flex items-center gap-2">
              {adminButtons}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              {authButtons}
            </div>
          )}
        </nav>

        {/* Mobile actions */}
        <div className="md:hidden flex items-center gap-3">
          <Link to="/cart" className="relative px-2 py-1 text-white/90 hover:text-amber-400 transition-colors" aria-label="Open cart">
            <span className="inline-flex items-center">
              Cart
              <span className="ml-0.5 inline-flex items-center justify-center text-xs font-semibold bg-amber-400 text-black px-2 py-0.5 rounded-full min-w-5">
                {itemsCount}
              </span>
            </span>
          </Link>
          <button
            type="button"
            aria-label={isOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={isOpen}
            aria-controls="mobile-menu"
            onClick={() => setIsOpen((v)=>!v)}
            className="p-2 rounded border border-neutral-700 text-white/90 hover:text-amber-400 hover:border-amber-400 transition"
          >
            {isOpen ? (
              // X icon
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M6.225 4.811 4.811 6.225 10.586 12l-5.775 5.775 1.414 1.414L12 13.414l5.775 5.775 1.414-1.414L13.414 12l5.775-5.775-1.414-1.414L12 10.586z"/>
              </svg>
            ) : (
              // Hamburger icon
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M3 6h18v2H3V6zm0 5h18v2H3v-2zm0 5h18v2H3v-2z"/>
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile slide-over menu */}
      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex justify-end"
          role="dialog"
          aria-modal="true"
          onClick={(e) => {
            // close when clicking on the overlay
            if (e.target === e.currentTarget) setIsOpen(false)
          }}
        >
          {/* Overlay */}
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

          {/* Panel */}
          <div
            id="mobile-menu"
            ref={panelRef}
            className="relative h-full w-72 max-w-full bg-neutral-950 border-l border-neutral-800 p-4 flex flex-col gap-4 animate-[slideIn_.2s_ease-out]"
          >
            {/* Panel header */}
            <div className="flex items-center justify-between">
              <Link to="/" className="font-bold text-lg text-amber-400" onClick={() => setIsOpen(false)}>
                <span className="inline-flex items-center gap-2">
                  <img src={viteLogo} alt="Bravo's Taqueria logo" className="h-14 w-14" loading="eager" decoding="async" />
                  <span>Bravo&apos;s Taqueria</span>
                </span>
              </Link>
              <button
                type="button"
                aria-label="Close menu"
                onClick={() => setIsOpen(false)}
                className="p-2 rounded text-white/90 hover:text-amber-400 transition"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M6.225 4.811 4.811 6.225 10.586 12l-5.775 5.775 1.414 1.414L12 13.414l5.775 5.775 1.414-1.414L13.414 12l5.775-5.775-1.414-1.414L12 10.586z"/>
                </svg>
              </button>
            </div>

            <div className="h-px bg-neutral-800" />

            {/* Links */}
            <nav className="flex flex-col gap-2">
              <NavLink to="/menu" className={baseLink} onClick={() => setIsOpen(false)}>Menu</NavLink>
              <NavLink to="/orders" className={baseLink} onClick={() => setIsOpen(false)}>My Orders</NavLink>
              <NavLink to="/cart" className={baseLink} onClick={() => setIsOpen(false)}>
                Cart
                <span className="ml-0.5 inline-flex items-center justify-center text-xs font-semibold bg-amber-400 text-black px-2 py-0.5 rounded-full min-w-5">
                  {itemsCount}
                </span>
              </NavLink>
            </nav>

            <div className="h-px bg-neutral-800" />

            {/* Auth/Admin */}
            <div className="flex flex-col gap-2">
              {user ? (
                <div className="flex flex-wrap gap-2">
                  {adminButtons}
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {authButtons}
                </div>
              )}
            </div>

            <div className="mt-auto text-[10px] text-white/40">
              Press Esc to close
            </div>
          </div>
        </div>
      )}
    </header>
  )
}