import { Link } from 'react-router-dom'
import PhotoSlot from './PhotoSlot'
import { KITCHEN_PHOTO } from '../data/photos'

/** Home page kitchen teaser — copy left, matted plate photo right. */
export default function LandingHighlight() {
  return (
    <section className="container-page grid grid-cols-1 items-center gap-x-[clamp(24px,5vw,96px)] gap-y-7 pb-[84px] pt-14 min-[760px]:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]">
      <div>
        <span className="kicker mb-3.5">The kitchen</span>
        <h2 className="text-[34px] font-bold leading-10 tracking-[-0.01em]">
          Fresh ingredients, true tradition
        </h2>
        <p className="mt-5 max-w-[48ch] text-base text-ink/78">
          Every dish begins with real, natural ingredients and the recipes that shaped
          generations. Meats marinate in house, salsas are built fresh each morning,
          and every tortilla is pressed the moment you order it &mdash; so every bite
          carries the warmth and aroma of Mexico.
        </p>
        <p className="mt-5 text-base">
          <Link to="/about" className="text-accent-700 hover:text-accent">
            Read our story &rarr;
          </Link>
        </p>
      </div>

      <PhotoSlot
        photo={KITCHEN_PHOTO}
        aspect="1093 / 1600"
        className="order-first w-full max-w-[420px] justify-self-start min-[760px]:order-none min-[760px]:justify-self-end"
      />
    </section>
  )
}
