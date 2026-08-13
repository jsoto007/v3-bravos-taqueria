import { Link } from 'react-router-dom'
import { SITE } from '../data/site'

export default function Hero() {
  return (
    <section className="relative isolate overflow-hidden bg-charcoal-950">
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div className="absolute left-[15%] top-1/3 size-[45vmax] -translate-x-1/2 -translate-y-1/2 rounded-full bg-amber-brand/12 blur-3xl" />
        <div className="absolute bottom-0 right-[5%] size-[40vmax] translate-x-1/3 translate-y-1/3 rounded-full bg-chile-600/15 blur-3xl" />
      </div>

      <div className="container-page relative z-10 flex flex-col items-center py-24 text-center sm:py-32 lg:py-36">
        <span className="inline-flex items-center rounded-full border border-amber-brand/30 bg-amber-brand/10 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.18em] text-amber-brand">
          Est. 2025 &middot; {SITE.address.locality}, {SITE.address.region}
        </span>

        <h1 className="mt-7 max-w-4xl text-balance text-5xl font-black leading-[1.05] text-masa-50 sm:text-6xl lg:text-7xl">
          Authentic{' '}
          <span className="bg-gradient-to-br from-amber-brand to-amber-200 bg-clip-text text-transparent">
            Mexican
          </span>{' '}
          flavor, made fresh daily
        </h1>

        <p className="mt-6 max-w-xl text-pretty text-base leading-relaxed text-masa-100/70 sm:text-lg">
          Tortillas pressed to order, meats marinated in house, and salsas built fresh
          every morning. Come taste the difference.
        </p>

        <div className="mt-9 flex flex-col items-center gap-3 sm:flex-row">
          <Link
            to="/menu"
            className="inline-flex items-center justify-center rounded-full bg-amber-brand px-8 py-3.5 font-semibold text-charcoal-900 shadow-[0_10px_35px_rgba(245,165,36,0.35)] transition hover:-translate-y-0.5 hover:brightness-105"
          >
            View our menu
          </Link>
          <a
            href={`tel:${SITE.tel}`}
            className="inline-flex items-center justify-center gap-2 rounded-full border border-white/20 px-8 py-3.5 font-semibold text-masa-100/90 transition hover:-translate-y-0.5 hover:border-amber-brand hover:bg-amber-brand/10"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M6.62 10.79a15.05 15.05 0 0 0 6.59 6.59l2.2-2.2a1 1 0 0 1 1.02-.24c1.12.37 2.33.57 3.57.57a1 1 0 0 1 1 1V20a1 1 0 0 1-1 1A17 17 0 0 1 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1c0 1.24.2 2.45.57 3.57a1 1 0 0 1-.25 1.02l-2.2 2.2z" />
            </svg>
            Call {SITE.phone}
          </a>
        </div>

        <p className="mt-6 text-sm text-masa-100/50">
          Order by phone or stop by &mdash; pickup only, no online ordering.
        </p>
      </div>
    </section>
  )
}
