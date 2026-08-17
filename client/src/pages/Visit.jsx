import { Link } from 'react-router-dom'
import HoursTable from '../components/HoursTable'
import PhotoSlot from '../components/PhotoSlot'
import { STOREFRONT_PHOTO } from '../data/photos'
import { SITE, mapsUrl } from '../data/site'
import { useSeo } from '../lib/seo'

export default function Visit() {
  useSeo('visit')

  return (
    <>
      <section className="container-page pb-14 pt-[84px]">
        <span className="kicker mb-3.5">Find us</span>
        <h1 className="font-display text-[clamp(42px,5.4vw,68px)] font-bold leading-[1.05] tracking-[-0.02em]">
          Come visit the taqueria.
        </h1>
        <p className="mt-8 max-w-[58ch] text-lg">
          We&rsquo;re a pickup and dine-in spot. Call ahead and your order will be
          ready when you arrive.
        </p>
      </section>

      <div className="container-page">
        <hr className="h-px border-0 bg-divider" />
      </div>

      <section className="container-page grid grid-cols-[repeat(auto-fit,minmax(min(100%,280px),1fr))] gap-x-[clamp(32px,4vw,84px)] gap-y-10 py-[70px]">
        <div>
          <span className="kicker mb-3.5">Location</span>
          <h2 className="text-2xl font-semibold leading-[30px]">
            {SITE.address.street}
            <br />
            {SITE.address.locality}, {SITE.address.region} {SITE.address.postalCode}
          </h2>
          <p className="mt-[18px] text-base leading-7 text-ink/78">
            A short walk from the 2/5 at 149th St&ndash;Grand Concourse.
          </p>
          <div className="mt-6">
            <a
              href={mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-ghost"
            >
              Get directions
            </a>
          </div>
        </div>

        <div>
          <span className="kicker mb-3.5">Hours</span>
          <HoursTable />
          <p className="mt-3.5 text-xs text-ink/60">Open seven days a week.</p>
        </div>

        <div>
          <span className="kicker mb-3.5">Order by phone</span>
          <h2 className="text-2xl font-semibold leading-[30px] tabular-nums">
            {SITE.phone}
          </h2>
          <p className="mt-[18px] text-base leading-7 text-ink/78">
            Call us and we&rsquo;ll have it hot and ready for pickup. Or build your
            order on the menu page.
          </p>
          <div className="mt-6 flex flex-wrap gap-3.5">
            <a href={`tel:${SITE.tel}`} className="btn btn-primary">
              Call now
            </a>
            <Link to="/menu" className="btn btn-ghost">
              Order online
            </Link>
          </div>
        </div>
      </section>

      <div className="container-page">
        <hr className="h-px border-0 bg-divider" />
      </div>

      <section className="container-page pb-[84px] pt-[70px]">
        <span className="kicker mb-3.5">The storefront</span>
        <PhotoSlot photo={STOREFRONT_PHOTO} aspect="21 / 9" />
      </section>
    </>
  )
}
