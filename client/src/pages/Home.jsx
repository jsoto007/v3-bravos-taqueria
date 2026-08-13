import { Link } from 'react-router-dom'
import Hero from '../components/Hero'
import LandingHighlight from '../components/LandingHighlight'
import VisitUs from '../components/VisitUs'
import MenuCard from '../components/MenuCard'
import Reveal from '../utils/Reveal'
import { FEATURED } from '../data/menu'
import { useSeo } from '../lib/seo'

export default function Home() {
  useSeo('home')

  return (
    <>
      <Hero />
      <LandingHighlight />

      <section className="container-page pb-20 sm:pb-24">
        <div className="flex flex-col gap-3 border-b border-charcoal-900/10 pb-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-chile-600">
              Our menu
            </p>
            <h2 className="mt-2 text-3xl font-bold text-charcoal-900 sm:text-4xl">
              Best sellers
            </h2>
          </div>
          <p className="text-sm text-charcoal-700/70 sm:text-right">
            Handcrafted favorites that keep people coming back.
          </p>
        </div>

        <Reveal className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURED.map((item) => (
            <MenuCard key={item.slug} item={item} />
          ))}
        </Reveal>

        <div className="mt-10 flex justify-center">
          <Link
            to="/menu"
            className="inline-flex items-center gap-2 rounded-full bg-charcoal-900 px-8 py-3.5 font-semibold text-masa-50 transition hover:-translate-y-0.5 hover:bg-charcoal-800"
          >
            Explore the full menu
            <span aria-hidden="true">&rarr;</span>
          </Link>
        </div>
      </section>

      <VisitUs />
    </>
  )
}
