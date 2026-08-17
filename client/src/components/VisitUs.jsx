import { Link } from 'react-router-dom'
import { SITE, formattedAddress, mapsUrl } from '../data/site'
import HoursTable from './HoursTable'

/**
 * Home page visit summary — address and CTAs beside the hours table. The full
 * detail lives on /visit; this section keeps the long-standing /#visit anchor
 * working.
 */
export default function VisitUs() {
  return (
    <section
      id="visit"
      className="container-page grid scroll-mt-16 grid-cols-1 gap-x-[clamp(24px,5vw,96px)] gap-y-10 pb-14 pt-[84px] min-[760px]:grid-cols-2"
    >
      <div>
        <span className="kicker mb-3.5">Find us</span>
        <h2 className="text-[26px] font-bold leading-[30px]">Come visit the taqueria</h2>
        <p className="mt-5 max-w-[48ch] text-base text-ink/78">
          {formattedAddress}. We&rsquo;re a pickup and dine-in spot &mdash; call ahead
          and your order will be ready when you arrive.
        </p>
        <div className="mt-7 flex flex-wrap gap-3.5">
          <a href={`tel:${SITE.tel}`} className="btn btn-primary">
            {SITE.phone}
          </a>
          <a
            href={mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-ghost"
          >
            Get directions
          </a>
          <Link to="/visit" className="btn btn-ghost">
            Hours &amp; location
          </Link>
        </div>
      </div>

      <div>
        <span className="kicker mb-3.5">Hours</span>
        <HoursTable />
      </div>
    </section>
  )
}
