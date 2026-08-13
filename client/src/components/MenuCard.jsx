import { fmtCurrency } from '../lib/seo'
import { getMenuItemEmoji } from '../utils/menuPlaceholders'

/**
 * Featured-dish card for the home page. Purely presentational now that there
 * is no cart — the whole card links through to that section of the menu.
 */
export default function MenuCard({ item }) {
  return (
    <a
      href={`/menu#${item.slug}`}
      className="group flex flex-col overflow-hidden rounded-[var(--radius-card)] border border-charcoal-900/8 bg-white shadow-sm transition hover:-translate-y-1 hover:border-amber-brand/40 hover:shadow-[0_20px_45px_rgba(20,18,15,0.12)]"
    >
      <div className="grid h-44 w-full place-items-center bg-gradient-to-br from-amber-brand/15 to-chile-600/10 text-6xl">
        <span aria-hidden="true">{getMenuItemEmoji(item)}</span>
      </div>

      <div className="flex flex-1 flex-col p-5">
        <div className="mb-2 flex items-start justify-between gap-3">
          <h3 className="font-display text-lg font-bold leading-snug text-charcoal-900">
            {item.name}
          </h3>
          <span className="whitespace-nowrap font-display text-lg font-bold text-chile-600">
            {fmtCurrency(item.price)}
          </span>
        </div>

        {item.description && (
          <p className="text-sm leading-relaxed text-charcoal-700/75">{item.description}</p>
        )}

        <span className="mt-4 pt-1 text-sm font-semibold text-amber-brand opacity-0 transition group-hover:opacity-100">
          See in menu &rarr;
        </span>
      </div>
    </a>
  )
}
