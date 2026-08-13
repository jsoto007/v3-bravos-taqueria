import { Link } from 'react-router-dom'
import { SITE, formattedAddress, mapsUrl } from '../data/site'

export default function Footer() {
  return (
    <footer className="border-t border-charcoal-900/10 bg-masa-100">
      <div className="container-page py-12">
        <div className="flex flex-col gap-8 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <span className="font-display text-lg font-bold text-charcoal-900">
              Bravo&rsquo;s <span className="text-chile-600">Taqueria</span>
            </span>
            <p className="mt-2 max-w-xs text-sm leading-relaxed text-charcoal-700/80">
              {SITE.tagline}
            </p>
          </div>

          <div className="text-sm">
            <h2 className="mb-2 font-semibold text-charcoal-900">Visit</h2>
            <a
              href={mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="block text-charcoal-700/80 hover:text-chile-600"
            >
              {formattedAddress}
            </a>
            <a
              href={`tel:${SITE.tel}`}
              className="mt-1 block text-charcoal-700/80 hover:text-chile-600"
            >
              {SITE.phone}
            </a>
            {SITE.email && (
              <a
                href={`mailto:${SITE.email}`}
                className="mt-1 block text-charcoal-700/80 hover:text-chile-600"
              >
                {SITE.email}
              </a>
            )}
          </div>

          <nav className="text-sm" aria-label="Footer">
            <h2 className="mb-2 font-semibold text-charcoal-900">Explore</h2>
            <Link to="/" className="block text-charcoal-700/80 hover:text-chile-600">
              Home
            </Link>
            <Link to="/menu" className="mt-1 block text-charcoal-700/80 hover:text-chile-600">
              Menu
            </Link>
            <a href="/#visit" className="mt-1 block text-charcoal-700/80 hover:text-chile-600">
              Hours &amp; location
            </a>
          </nav>

          {SITE.social.length > 0 && (
            <div className="text-sm">
              <h2 className="mb-2 font-semibold text-charcoal-900">Follow</h2>
              {SITE.social.map((s) => (
                <a
                  key={s.url}
                  href={s.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1 block text-charcoal-700/80 hover:text-chile-600"
                >
                  {s.name}
                </a>
              ))}
            </div>
          )}
        </div>

        <div className="mt-10 flex flex-col gap-1 border-t border-charcoal-900/10 pt-6 text-xs text-charcoal-700/60 sm:flex-row sm:justify-between">
          <p>
            &copy; {new Date().getFullYear()} {SITE.legalName}. All rights reserved.
          </p>
          <p>
            Developed by{' '}
            <a
              href="https://sotodev.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-chile-600 hover:underline"
            >
              Soto Dev, LLC
            </a>
          </p>
        </div>
      </div>
    </footer>
  )
}
