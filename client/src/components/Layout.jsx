import { Outlet, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import Navbar from './Navbar'
import Footer from './Footer'

export default function Layout() {
  const { pathname } = useLocation()

  // Router keeps scroll position across navigations; without this, clicking
  // "Menu" from halfway down the home page lands you halfway down the menu.
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])

  return (
    <div className="flex min-h-screen flex-col">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-amber-brand focus:px-4 focus:py-2 focus:font-semibold focus:text-charcoal-900"
      >
        Skip to content
      </a>
      <Navbar />
      <main id="main" className="flex-1 pt-16">
        <Outlet />
      </main>
      <Footer />
    </div>
  )
}
