import { Link } from 'react-router-dom'
import PhotoSlot from '../components/PhotoSlot'
import { GALLERY_PHOTOS } from '../data/photos'
import { SITE } from '../data/site'
import { useSeo } from '../lib/seo'

const STORY = [
  {
    title: 'Real ingredients',
    body: 'Every dish begins with real, natural ingredients and time-honored Mexican techniques. Nothing arrives pre-made; the kitchen builds bold, vibrant flavors from scratch, every day, starting early.',
  },
  {
    title: 'Marinated in house',
    body: 'The meats marinate in house — chicken, steak, chorizo, and pork three ways: enchilada, al pastor, carnitas. The salsas are made fresh each morning and finished by taste, not by clock.',
  },
  {
    title: 'Pressed to order',
    body: 'Tortillas are pressed the moment you order, so every bite captures the warmth and aroma of Mexico. It is slower this way, and better this way, and we are at peace with the trade.',
  },
]

export default function About() {
  useSeo('about')

  return (
    <>
      <section className="container-page pb-[70px] pt-[84px]">
        <span className="kicker mb-3.5 tabular-nums">
          Est. 2025 &middot; {SITE.address.locality}, New York
        </span>
        <h1 className="font-display text-[clamp(42px,5.4vw,68px)] font-bold leading-[1.05] tracking-[-0.02em]">
          <span className="block">Recipes that shaped</span>
          <span className="block text-accent">generations.</span>
        </h1>
        <p className="mt-8 max-w-[58ch] text-lg">
          Bravo&rsquo;s Taqueria brings the food we grew up on to the Bronx &mdash;
          unhurried, unfussy, and made the way it has always been made.
        </p>
      </section>

      <div className="container-page">
        <hr className="h-px border-0 bg-divider" />
      </div>

      <section className="container-page py-[70px]">
        <span className="kicker mb-3.5">Our story</span>
        <div className="mt-3.5 grid grid-cols-[repeat(auto-fit,minmax(min(100%,300px),1fr))] gap-x-[clamp(32px,4vw,84px)] gap-y-10">
          {STORY.map((block) => (
            <div key={block.title}>
              <h2 className="text-2xl font-semibold leading-[30px] tracking-[-0.01em]">
                {block.title}
              </h2>
              <p className="mt-[18px] text-base leading-7 text-ink/78">{block.body}</p>
            </div>
          ))}
        </div>
      </section>

      <div className="container-page">
        <hr className="h-px border-0 bg-divider" />
      </div>

      <section className="container-page pb-[84px] pt-[70px]">
        <span className="kicker mb-3.5">The gallery</span>
        <h2 className="mb-10 text-[32px] font-bold leading-[38px] tracking-[-0.01em]">
          From the counter
        </h2>
        <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,280px),1fr))] gap-[clamp(20px,3vw,42px)]">
          {GALLERY_PHOTOS.map((photo) => (
            <PhotoSlot key={photo.alt} photo={photo} aspect="4 / 5" />
          ))}
        </div>
      </section>

      <div className="bg-espresso py-[70px] pb-[84px] text-cream">
        <div className="container-page">
          <h2 className="text-[30px] font-bold leading-9">Hungry yet?</h2>
          <p className="mt-[18px] max-w-[58ch] text-base leading-7 text-cream/78">
            The menu runs from $4 tacos to $13 nachos, and everything is made when you
            order it.
          </p>
          <div className="mt-7 flex flex-wrap gap-3.5">
            <Link to="/menu" className="btn btn-primary">
              See the menu
            </Link>
            <a href={`tel:${SITE.tel}`} className="btn btn-ghost-dark">
              Call {SITE.phone}
            </a>
          </div>
        </div>
      </div>
    </>
  )
}
