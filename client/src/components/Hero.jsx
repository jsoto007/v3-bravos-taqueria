import { Link } from 'react-router-dom'
import { SITE } from '../data/site'

export default function Hero() {
  return (
    <section className="container-page pb-[84px] pt-20 sm:pt-[112px]">
      <h1 className="font-display text-[clamp(44px,6.4vw,88px)] font-bold leading-[1.04] tracking-[-0.02em]">
        <span className="block">Fresh, made-to-order</span>
        <span className="block text-accent">Mexican food.</span>
      </h1>

      <p className="mt-8 max-w-[58ch] text-lg sm:mt-[42px]">
        Bravo&rsquo;s Taqueria is an authentic Mexican taqueria in the Bronx: tacos,
        tortas, quesadillas, burritos, sopes and gorditas made to order, with
        house-marinated meats, salsas built fresh every morning, and tortillas pressed
        when you order. Pickup and dine-in.
      </p>

      <div className="mt-7 flex flex-wrap gap-3.5">
        <Link to="/menu" className="btn btn-primary">
          See the menu
        </Link>
        <a href={`tel:${SITE.tel}`} className="btn btn-ghost">
          Call {SITE.phone}
        </a>
      </div>
    </section>
  )
}
