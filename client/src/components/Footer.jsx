import { Link } from 'react-router-dom'
import { SITE, formattedAddress, mapsUrl } from '../data/site'

export default function Footer() {
  return (
    <footer className="border-t border-divider">
      <div className="container-page py-14">
        <div className="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-x-[clamp(24px,4vw,84px)] gap-y-10">
          <div>
            <img
              src="/logo.svg"
              alt=""
              width="72"
              height="76"
              loading="lazy"
              decoding="async"
              className="mb-3 h-[76px] w-auto"
            />
            <span className="font-display text-[22px] font-bold leading-7">
              Bravo&rsquo;s Taqueria
            </span>
            <p className="mt-2.5 max-w-[32ch] text-xs text-ink/70">{SITE.tagline}</p>
          </div>

          <div className="text-xs leading-6">
            <span className="kicker mb-2">Visit</span>
            <a
              href={mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="block text-accent-700 hover:text-accent"
            >
              {formattedAddress}
            </a>
            <a href={`tel:${SITE.tel}`} className="block text-accent-700 hover:text-accent">
              {SITE.phone}
            </a>
            {SITE.email && (
              <a
                href={`mailto:${SITE.email}`}
                className="block text-accent-700 hover:text-accent"
              >
                {SITE.email}
              </a>
            )}
          </div>

          <nav className="text-xs leading-6" aria-label="Footer">
            <span className="kicker mb-2">Explore</span>
            <Link to="/menu" className="block text-accent-700 hover:text-accent">
              Menu
            </Link>
            <Link to="/about" className="block text-accent-700 hover:text-accent">
              About
            </Link>
            <Link to="/visit" className="block text-accent-700 hover:text-accent">
              Hours &amp; location
            </Link>
          </nav>

          {SITE.social.length > 0 && (
            <div className="text-xs leading-6">
              <span className="kicker mb-2">Follow</span>
              {SITE.social.map((s) => (
                <a
                  key={s.url}
                  href={s.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block text-accent-700 hover:text-accent"
                >
                  {s.name}
                </a>
              ))}
            </div>
          )}
        </div>

        <div className="mt-10 flex flex-wrap justify-between gap-4 border-t border-divider pt-5 text-xs text-ink/70">
          <span>
            &copy; {new Date().getFullYear()} {SITE.legalName}. All rights reserved.
          </span>
          <span>
            Developed by{' '}
            <a
              href="https://sotodev.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent-700 hover:text-accent hover:underline"
            >
              Soto Dev, LLC
            </a>
          </span>
        </div>
      </div>
    </footer>
  )
}
