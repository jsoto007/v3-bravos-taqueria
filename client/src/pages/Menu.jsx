import { useEffect, useRef, useState } from 'react'
import { CATEGORIES, CHOICES } from '../data/menu'
import { SITE } from '../data/site'
import { useSeo, fmtCurrency } from '../lib/seo'
import { getMenuItemEmoji } from '../utils/menuPlaceholders'

/** Stable module-level identity — a fresh array here would re-run the
 *  observer effect on every render. */
const SLUGS = CATEGORIES.map((c) => c.slug)

export default function Menu() {
  useSeo('menu')
  const activeSlug = useScrollSpy(SLUGS)
  const railRef = useRef(null)

  // Keep the highlighted chip in view as the reader scrolls past sections.
  useEffect(() => {
    const chip = railRef.current?.querySelector(`[data-slug="${activeSlug}"]`)
    if (!chip) return
    const { left, right } = chip.getBoundingClientRect()
    const rail = railRef.current.getBoundingClientRect()
    if (left < rail.left || right > rail.right) {
      chip.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' })
    }
  }, [activeSlug])

  return (
    <>
      <header className="bg-charcoal-950 py-14 text-center sm:py-20">
        <div className="container-page">
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-amber-brand">
            {SITE.address.locality}, {SITE.address.region}
          </p>
          <h1 className="mt-3 text-4xl font-black text-masa-50 sm:text-5xl">Our Menu</h1>
          <p className="mx-auto mt-4 max-w-lg text-pretty text-masa-100/60">
            Everything made to order. Call ahead and we&rsquo;ll have it ready for pickup.
          </p>
          <a
            href={`tel:${SITE.tel}`}
            className="mt-7 inline-flex rounded-full bg-amber-brand px-7 py-3 font-semibold text-charcoal-900 transition hover:brightness-105"
          >
            Call {SITE.phone}
          </a>
        </div>
      </header>

      {/* Sticky rather than fixed: the browser handles the offset, which
          removes the header/bar height measuring the old version needed. */}
      <nav
        aria-label="Menu categories"
        className="sticky top-16 z-30 border-b border-charcoal-900/10 bg-masa-50/95 backdrop-blur supports-[backdrop-filter]:bg-masa-50/85"
      >
        <div ref={railRef} className="container-page flex gap-1.5 overflow-x-auto py-3">
          {CATEGORIES.map((c) => (
            <a
              key={c.slug}
              data-slug={c.slug}
              href={`#${c.slug}`}
              aria-current={activeSlug === c.slug ? 'true' : undefined}
              className="shrink-0 rounded-full border border-transparent px-3.5 py-1.5 text-sm font-semibold text-charcoal-700/70 transition hover:bg-amber-brand/10 hover:text-chile-600 aria-[current]:border-amber-brand/40 aria-[current]:bg-amber-brand/15 aria-[current]:text-chile-600"
            >
              {c.name}
            </a>
          ))}
        </div>
      </nav>

      <div className="container-page py-12 sm:py-16">
        {CATEGORIES.map((category) => (
          <section key={category.slug} id={category.slug} className="mb-14 scroll-mt-32">
            <div className="mb-6 border-b border-charcoal-900/10 pb-3">
              <h2 className="text-2xl font-bold text-charcoal-900 sm:text-3xl">
                {category.name}
              </h2>
              {category.blurb && (
                <p className="mt-1.5 text-sm text-charcoal-700/70">{category.blurb}</p>
              )}
            </div>

            {/* Only go two-up when there's more than one dish — most
                categories hold a single item, and a 2-column grid leaves a
                dangling empty cell next to it. */}
            <ul className={category.items.length > 1 ? 'grid gap-4 sm:grid-cols-2' : 'grid gap-4'}>
              {category.items.map((item) => {
                // Nine of twelve categories contain one dish named after the
                // category ("Tortas" under "Tortas"). Repeating it is noise.
                const isEponymous =
                  category.items.length === 1 && item.name === category.name

                return (
                  <li
                    key={item.name}
                    className="flex items-start gap-4 rounded-[var(--radius-card)] border border-charcoal-900/8 bg-white p-4 shadow-sm transition hover:border-amber-brand/40 hover:shadow-md"
                  >
                    <span
                      className="grid size-16 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-amber-brand/15 to-chile-600/10 text-3xl"
                      aria-hidden="true"
                    >
                      {getMenuItemEmoji(item)}
                    </span>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline justify-between gap-3">
                        {/* Kept in the DOM for screen readers and for the
                            heading outline even when visually redundant. */}
                        <h3
                          className={`font-display text-base font-bold text-charcoal-900 ${
                            isEponymous ? 'sr-only' : ''
                          }`}
                        >
                          {item.name}
                          {item.nameEs && (
                            <span className="ml-1.5 font-sans text-sm font-normal italic text-charcoal-700/60">
                              {item.nameEs}
                            </span>
                          )}
                        </h3>

                        {item.portion && (
                          <p className="text-xs font-semibold uppercase tracking-wide text-amber-brand">
                            {item.portion}
                          </p>
                        )}

                        <span className="ml-auto whitespace-nowrap font-display text-base font-bold text-chile-600">
                          {fmtCurrency(item.price)}
                        </span>
                      </div>

                      {item.description && (
                        <p className="mt-1 text-sm leading-relaxed text-charcoal-700/75">
                          {item.description}
                        </p>
                      )}
                      {item.descriptionEs && (
                        <p className="mt-0.5 text-sm italic leading-relaxed text-charcoal-700/50">
                          {item.descriptionEs}
                        </p>
                      )}
                    </div>
                  </li>
                )
              })}
            </ul>
          </section>
        ))}

        {/* Meat and add-on pricing. These used to be checkboxes inside the
            add-to-cart modal; on a menu you read, they belong on the page. */}
        <section className="rounded-[2rem] bg-charcoal-950 p-7 sm:p-10">
          <h2 className="text-2xl font-bold text-masa-50 sm:text-3xl">
            Make it yours
          </h2>
          <p className="mt-2 text-masa-100/60">
            Add any of these to your order when you call or order at the counter.
          </p>

          <div className="mt-8 grid gap-8 sm:grid-cols-2">
            {CHOICES.map((group) => (
              <div key={group.name}>
                <h3 className="font-display text-lg font-bold text-amber-brand">
                  {group.name}
                  {group.nameEs && (
                    <span className="ml-2 font-sans text-sm font-normal italic text-masa-100/50">
                      {group.nameEs}
                    </span>
                  )}
                </h3>
                {group.note && (
                  <p className="mt-1.5 text-xs leading-relaxed text-masa-100/45">
                    {group.note}
                  </p>
                )}
                <dl className="mt-4 space-y-2.5">
                  {group.options.map((opt) => (
                    <div
                      key={opt.name}
                      className="flex items-baseline justify-between gap-4 border-b border-white/8 pb-2.5"
                    >
                      <dt className="text-masa-100/85">
                        {opt.name}
                        {opt.nameEs && (
                          <span className="ml-1.5 text-sm italic text-masa-100/45">
                            {opt.nameEs}
                          </span>
                        )}
                        {opt.detail && (
                          <span className="block text-xs text-masa-100/40">{opt.detail}</span>
                        )}
                      </dt>
                      <dd className="whitespace-nowrap font-semibold text-amber-brand">
                        +{fmtCurrency(opt.price)}
                      </dd>
                    </div>
                  ))}
                </dl>
              </div>
            ))}
          </div>
        </section>

        <p className="mt-10 text-center text-sm text-charcoal-700/60">
          Prices subject to change. Please let us know about any allergies when ordering.
        </p>
      </div>
    </>
  )
}

/** Highlights whichever category section is currently nearest the top. */
function useScrollSpy(slugs) {
  const [active, setActive] = useState(slugs[0])

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)
        if (visible.length) setActive(visible[0].target.id)
      },
      // rootMargin only accepts px or %, never rem — a rem value throws and
      // takes the whole page down with it. 128px clears the fixed header
      // (64px) plus the sticky category rail (~56px); the -60% bottom means a
      // section stops counting once it's mostly scrolled past.
      { rootMargin: '-128px 0px -60% 0px', threshold: 0 }
    )

    slugs.forEach((slug) => {
      const el = document.getElementById(slug)
      if (el) observer.observe(el)
    })
    return () => observer.disconnect()
  }, [slugs])

  return active
}
