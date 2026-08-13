import { useEffect, useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { SITE } from '../data/site'
import logo from '/logo.svg'

const NAV_LINKS = [
  { to: '/', label: 'Home', end: true },
  { to: '/menu', label: 'Menu' },
  { to: '/#visit', label: 'Visit' },
]

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false)
  const { pathname } = useLocation()

  useEffect(() => setIsOpen(false), [pathname])

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && setIsOpen(false)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  // The slide-over sits above the page; letting the page scroll behind it on
  // mobile is the classic "menu closes and you're somewhere else" bug.
  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  const linkClass = ({ isActive }) =>
    `relative px-1 py-1 text-sm font-medium transition-colors ${
      isActive ? 'text-amber-brand' : 'text-masa-100/80 hover:text-amber-brand'
    }`

  return (
    <header className="fixed inset-x-0 top-0 z-40 border-b border-white/10 bg-charcoal-950/95 backdrop-blur supports-[backdrop-filter]:bg-charcoal-950/80">
      <div className="container-page flex h-16 items-center justify-between gap-4">
        <Link to="/" className="flex items-center gap-2.5" aria-label={`${SITE.name} — home`}>
          <img
            src={logo}
            alt=""
            width="36"
            height="36"
            className="h-9 w-9 rounded-md bg-amber-brand p-1"
            decoding="async"
          />
          <span className="font-display text-lg font-bold tracking-tight text-masa-50">
            Bravo&rsquo;s <span className="text-amber-brand">Taqueria</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-7 md:flex" aria-label="Main">
          {NAV_LINKS.map((link) =>
            link.to.includes('#') ? (
              <a
                key={link.to}
                href={link.to}
                className="px-1 py-1 text-sm font-medium text-masa-100/80 transition-colors hover:text-amber-brand"
              >
                {link.label}
              </a>
            ) : (
              <NavLink key={link.to} to={link.to} end={link.end} className={linkClass}>
                {link.label}
              </NavLink>
            )
          )}
          <a
            href={`tel:${SITE.tel}`}
            className="rounded-full bg-amber-brand px-4 py-2 text-sm font-semibold text-charcoal-900 transition hover:brightness-105"
          >
            Call to order
          </a>
        </nav>

        <div className="flex items-center gap-2 md:hidden">
          <a
            href={`tel:${SITE.tel}`}
            className="rounded-full bg-amber-brand px-3.5 py-1.5 text-sm font-semibold text-charcoal-900"
          >
            Call
          </a>
          <button
            type="button"
            aria-label={isOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={isOpen}
            aria-controls="mobile-menu"
            onClick={() => setIsOpen((v) => !v)}
            className="rounded-lg border border-white/15 p-2 text-masa-100 transition hover:border-amber-brand hover:text-amber-brand"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              {isOpen ? (
                <path d="M6.225 4.811 4.811 6.225 10.586 12l-5.775 5.775 1.414 1.414L12 13.414l5.775 5.775 1.414-1.414L13.414 12l5.775-5.775-1.414-1.414L12 10.586z" />
              ) : (
                <path d="M3 6h18v2H3V6zm0 5h18v2H3v-2zm0 5h18v2H3v-2z" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {isOpen && (
        <div className="fixed inset-0 z-50 md:hidden" role="dialog" aria-modal="true">
          <button
            className="absolute inset-0 w-full bg-black/60 backdrop-blur-sm"
            aria-label="Close menu"
            onClick={() => setIsOpen(false)}
          />
          <div
            id="mobile-menu"
            className="absolute right-0 top-0 flex h-full w-72 max-w-[85%] flex-col gap-1 border-l border-white/10 bg-charcoal-950 p-5 pt-6"
          >
            <span className="mb-4 font-display text-lg font-bold text-masa-50">
              Bravo&rsquo;s <span className="text-amber-brand">Taqueria</span>
            </span>
            {NAV_LINKS.map((link) =>
              link.to.includes('#') ? (
                <a
                  key={link.to}
                  href={link.to}
                  onClick={() => setIsOpen(false)}
                  className="rounded-lg px-3 py-3 text-base font-medium text-masa-100/90 transition hover:bg-white/5 hover:text-amber-brand"
                >
                  {link.label}
                </a>
              ) : (
                <NavLink
                  key={link.to}
                  to={link.to}
                  end={link.end}
                  className={({ isActive }) =>
                    `rounded-lg px-3 py-3 text-base font-medium transition hover:bg-white/5 ${
                      isActive ? 'text-amber-brand' : 'text-masa-100/90 hover:text-amber-brand'
                    }`
                  }
                >
                  {link.label}
                </NavLink>
              )
            )}
            <a
              href={`tel:${SITE.tel}`}
              className="mt-4 rounded-full bg-amber-brand px-4 py-3 text-center font-semibold text-charcoal-900"
            >
              Call {SITE.phone}
            </a>
          </div>
        </div>
      )}
    </header>
  )
}
