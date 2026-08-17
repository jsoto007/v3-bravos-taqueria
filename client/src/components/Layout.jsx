import { Outlet, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import Navbar from './Navbar'
import Footer from './Footer'

export default function Layout() {
  const { pathname, hash } = useLocation()

  // Router keeps scroll position across navigations; without this, clicking
  // "Menu" from halfway down the home page lands you halfway down the menu.
  // A hash wins over top-of-page: the target only exists after React renders,
  // so the browser's own anchor jump has already come up empty by now (e.g.
  // home's best-seller rows → /menu#tacos). Instant, like a native page load;
  // scroll-padding-top on <html> keeps the target clear of the sticky rail.
  useEffect(() => {
    const target = hash && document.getElementById(hash.slice(1))
    if (target) {
      target.scrollIntoView({ behavior: 'instant', block: 'start' })
    } else {
      window.scrollTo(0, 0)
    }
  }, [pathname, hash])

  return (
    <div className="flex min-h-screen flex-col">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded focus:bg-accent focus:px-4 focus:py-2 focus:font-semibold focus:text-white"
      >
        Skip to content
      </a>
      <Navbar />
      <main id="main" className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  )
}
