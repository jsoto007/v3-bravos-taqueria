import { Link } from 'react-router-dom'
import Hero from '../components/Hero'
import LandingHighlight from '../components/LandingHighlight'
import VisitUs from '../components/VisitUs'
import { ALL_ITEMS, CATEGORIES, CHOICES, FEATURED } from '../data/menu'
import { fmtCurrency } from '../lib/format'
import { useSeo } from '../lib/seo'

const startingTacoPrice = CATEGORIES.find((c) => c.slug === 'tacos').items[0].price

// Chicken, steak and chorizo count once; pork counts once per style listed in
// its detail line (enchilada · al pastor · carnitas).
const meatPreparations = CHOICES[0].options.reduce(
  (sum, opt) => sum + (opt.detail ? opt.detail.split('·').length : 1),
  0
)

const STATS = [
  { value: `$${startingTacoPrice.toFixed(0)}`, label: 'Tacos, to start', accent: true },
  { value: String(meatPreparations), label: 'Preparations of meat', accent: false },
  { value: String(ALL_ITEMS.length), label: 'Things on the menu', accent: true },
  { value: '7', label: 'Days a week', accent: false },
]

export default function Home() {
  useSeo('home')

  return (
    <>
      <Hero />

      <div className="bg-accent-100 py-[70px]">
        <div className="container-page">
          <dl className="grid grid-cols-[repeat(auto-fit,minmax(200px,auto))] justify-between gap-x-7 gap-y-10">
            {STATS.map((stat) => (
              <div key={stat.label}>
                <dd
                  className={`font-display text-[clamp(36px,3.6vw,52px)] font-bold leading-[56px] tabular-nums ${
                    stat.accent ? 'text-accent-700' : 'text-ink'
                  }`}
                >
                  {stat.value}
                </dd>
                <dt className="mt-3.5 text-[13px] uppercase leading-[18px] tracking-[0.06em] text-ink/70">
                  {stat.label}
                </dt>
              </div>
            ))}
          </dl>
        </div>
      </div>

      <section className="container-page pb-14 pt-[84px]">
        <span className="kicker mb-3.5">Best sellers</span>
        <h2 className="mb-10 text-[34px] font-bold leading-10 tracking-[-0.01em]">
          What the counter sells most
        </h2>

        <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,320px),1fr))] gap-x-[84px]">
          {FEATURED.map((item) => (
            <Link
              key={item.slug}
              to={`/menu#${item.slug}`}
              className="row-hover block border-t border-divider pb-6 pt-[22px] text-inherit no-underline"
            >
              <div className="flex items-baseline justify-between gap-4">
                <h3 className="text-2xl font-semibold leading-7">{item.name}</h3>
                <span className="text-base text-accent-700 tabular-nums">
                  {fmtCurrency(item.price)}
                </span>
              </div>
              {item.description && (
                <p className="mt-2.5 text-base leading-7 text-ink/78">{item.description}</p>
              )}
            </Link>
          ))}
        </div>

        <div className="mt-10">
          <Link to="/menu" className="btn btn-ghost">
            The full menu
          </Link>
        </div>
      </section>

      <LandingHighlight />

      <div className="bg-espresso py-[84px] pb-[98px] text-cream">
        <figure className="container-page">
          <blockquote className="max-w-[32ch] font-display text-[clamp(28px,2.8vw,38px)] font-bold leading-[1.3] tracking-[-0.01em]">
            &ldquo;Tortillas pressed to order. Nothing waits under a lamp.&rdquo;
          </blockquote>
          <figcaption className="mt-10 text-base text-cream/70">
            &mdash; the whole trick, since 2025
          </figcaption>
        </figure>
      </div>

      <VisitUs />
    </>
  )
}
