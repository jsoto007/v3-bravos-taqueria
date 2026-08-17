import { Link, NavLink } from 'react-router-dom'
import { SITE } from '../data/site'

const NAV_LINKS = [
  { to: '/menu', label: 'Menu' },
  { to: '/about', label: 'About' },
  { to: '/visit', label: 'Visit' },
]

/**
 * Top bar from the redesign: logo + wordmark, three links, filled call CTA.
 * It scrolls away with the page (not fixed) — on the menu page the category
 * rail is what sticks. The links are short enough to stay visible on phones,
 * so there is no hamburger drawer to maintain.
 */
export default function Navbar() {
  const linkClass = ({ isActive }) =>
    `whitespace-nowrap text-sm font-medium transition-colors ${
      isActive ? 'text-accent' : 'text-ink hover:text-accent'
    }`

  return (
    <header className="border-b border-divider bg-cream">
      <div className="container-page flex h-[68px] items-center gap-4 sm:gap-6">
        <Link
          to="/"
          className="mr-auto flex min-w-0 items-center gap-2.5"
          aria-label={`${SITE.name} — home`}
        >
          <img
            src="/logo.svg"
            alt=""
            width="44"
            height="46"
            className="h-11 w-auto shrink-0"
            decoding="async"
          />
          <span className="hidden truncate font-display text-lg font-bold sm:block">
            Bravo&rsquo;s Taqueria
          </span>
        </Link>

        <nav className="flex items-center gap-4 sm:gap-6" aria-label="Main">
          {NAV_LINKS.map((link) => (
            <NavLink key={link.to} to={link.to} className={linkClass}>
              {link.label}
            </NavLink>
          ))}
        </nav>

        <a href={`tel:${SITE.tel}`} className="btn btn-primary whitespace-nowrap">
          <span className="hidden sm:inline">Call ahead</span>
          <span className="sm:hidden">Call</span>
        </a>
      </div>
    </header>
  )
}
