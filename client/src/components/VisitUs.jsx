import { SITE, formattedAddress, mapsUrl } from '../data/site'

function Card({ title, icon, children }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
      <div className="mb-4 flex items-center gap-2.5 text-amber-brand">
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          {icon}
        </svg>
        <h3 className="font-display text-lg font-bold text-masa-50">{title}</h3>
      </div>
      {children}
    </div>
  )
}

export default function VisitUs() {
  return (
    <section id="visit" className="scroll-mt-24 bg-charcoal-950 py-20 sm:py-24">
      <div className="container-page">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-amber-brand">
            Find us
          </p>
          <h2 className="mt-3 text-3xl font-bold text-masa-50 sm:text-4xl">
            Come visit the taqueria
          </h2>
          <p className="mt-4 text-masa-100/60">
            We&rsquo;re a pickup and dine-in spot. Call ahead and your order will be ready
            when you arrive.
          </p>
        </div>

        <div className="mt-12 grid gap-5 md:grid-cols-3">
          <Card
            title="Location"
            icon={
              <path d="M12 2a7 7 0 0 0-7 7c0 5.25 7 13 7 13s7-7.75 7-13a7 7 0 0 0-7-7zm0 9.5A2.5 2.5 0 1 1 12 6.5a2.5 2.5 0 0 1 0 5z" />
            }
          >
            <address className="not-italic leading-relaxed text-masa-100/70">
              {SITE.address.street}
              <br />
              {SITE.address.locality}, {SITE.address.region} {SITE.address.postalCode}
            </address>
            <a
              href={mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-amber-brand hover:underline"
            >
              Get directions
              <span aria-hidden="true">&rarr;</span>
              <span className="sr-only">to {formattedAddress} (opens in a new tab)</span>
            </a>
          </Card>

          <Card
            title="Hours"
            icon={
              <path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm1 10.59V6h-2v7.41l4.3 4.3 1.4-1.42L13 12.59z" />
            }
          >
            <dl className="space-y-2 text-sm">
              {SITE.hours.map((h) => (
                <div key={h.label} className="flex justify-between gap-4">
                  <dt className="text-masa-100/70">{h.label}</dt>
                  <dd className="whitespace-nowrap font-medium text-masa-50">
                    {formatTime(h.opens)} &ndash; {formatTime(h.closes)}
                  </dd>
                </div>
              ))}
            </dl>
          </Card>

          <Card
            title="Order by phone"
            icon={
              <path d="M6.62 10.79a15.05 15.05 0 0 0 6.59 6.59l2.2-2.2a1 1 0 0 1 1.02-.24c1.12.37 2.33.57 3.57.57a1 1 0 0 1 1 1V20a1 1 0 0 1-1 1A17 17 0 0 1 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1c0 1.24.2 2.45.57 3.57a1 1 0 0 1-.25 1.02l-2.2 2.2z" />
            }
          >
            <p className="text-masa-100/70">
              Call us and we&rsquo;ll have it hot and ready for pickup.
            </p>
            <a
              href={`tel:${SITE.tel}`}
              className="mt-4 inline-flex w-full items-center justify-center rounded-full bg-amber-brand px-5 py-3 font-semibold text-charcoal-900 transition hover:brightness-105"
            >
              {SITE.phone}
            </a>
          </Card>
        </div>
      </div>
    </section>
  )
}

/** "21:00" -> "9:00 PM" — hours are stored in 24h form for schema.org. */
function formatTime(value) {
  const [hour, minute] = value.split(':').map(Number)
  const suffix = hour >= 12 ? 'PM' : 'AM'
  const display = hour % 12 === 0 ? 12 : hour % 12
  return `${display}:${String(minute).padStart(2, '0')} ${suffix}`
}
