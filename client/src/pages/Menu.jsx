import { useEffect, useRef, useState } from 'react'
import { ADDON_OPTIONS, CATEGORIES, CHOICES, MEAT_OPTIONS, ORDERING } from '../data/menu'
import { SITE, formattedAddress } from '../data/site'
import { useSeo } from '../lib/seo'
import { fmtCurrency } from '../lib/format'

/** Stable module-level identity — a fresh array here would re-run the
 *  observer effect on every render. */
const SLUGS = CATEGORIES.map((c) => c.slug)

const eligibleNames = CATEGORIES.filter((c) => c.meatEligible)
  .map((c) => c.name.toLowerCase())
  .join(', ')
  .replace(/, ([^,]*)$/, ' and $1')

/**
 * Menu + build-a-pickup-order flow from the redesign handoff.
 *
 * The order lives entirely in the browser: identical builds merge into one
 * line (keyed by name + customization), totals are always recomputed from the
 * cart, and placing the order just shows the pickup estimate — nothing is
 * transmitted anywhere, so the phone remains the real ordering channel.
 */
export default function Menu() {
  useSeo('menu')
  const activeSlug = useScrollSpy(SLUGS)
  const railRef = useRef(null)

  const [cart, setCart] = useState([])
  // null | 'item' | 'cart' | 'placed' — which overlay is open.
  const [view, setView] = useState(null)
  // In-progress build while the item dialog is open.
  const [sel, setSel] = useState(null)

  const count = cart.reduce((sum, line) => sum + line.qty, 0)
  const subtotal = cart.reduce((sum, line) => sum + line.unit * line.qty, 0)
  const tax = subtotal * ORDERING.taxRate

  // Keep the highlighted rail link in view as the reader scrolls past sections.
  useEffect(() => {
    const chip = railRef.current?.querySelector(`[data-slug="${activeSlug}"]`)
    if (!chip) return
    const { left, right } = chip.getBoundingClientRect()
    const rail = railRef.current.getBoundingClientRect()
    if (left < rail.left || right > rail.right) {
      chip.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' })
    }
  }, [activeSlug])

  const addLine = (item, meat, addons, qty) => {
    const unit =
      item.price + (meat ? meat.price : 0) + addons.reduce((sum, a) => sum + a.price, 0)
    const meta = [
      meat && meat.name !== 'No meat' ? meat.name : null,
      ...addons.map((a) => `+ ${a.name}`),
    ]
      .filter(Boolean)
      .join(' · ')
    const sig = `${item.name}|${meta}`
    setCart((prev) => {
      const found = prev.find((line) => line.sig === sig)
      if (found) {
        return prev.map((line) =>
          line.sig === sig ? { ...line, qty: line.qty + qty } : line
        )
      }
      return [...prev, { sig, name: item.name, meta, unit, qty }]
    })
  }

  const openItem = (ci, ii) => {
    if (CATEGORIES[ci].meatEligible) {
      // Chicken preselected — the most common order at the counter.
      setSel({ ci, ii, meat: 1, addons: ADDON_OPTIONS.map(() => false), qty: 1 })
      setView('item')
    } else {
      addLine(CATEGORIES[ci].items[ii], null, [], 1)
    }
  }

  const closeDialog = () => {
    setView(null)
    setSel(null)
  }

  const confirmAdd = () => {
    const item = CATEGORIES[sel.ci].items[sel.ii]
    addLine(
      item,
      MEAT_OPTIONS[sel.meat],
      ADDON_OPTIONS.filter((_, i) => sel.addons[i]),
      sel.qty
    )
    closeDialog()
  }

  const setLineQty = (sig, delta) => {
    setCart((prev) =>
      prev
        .map((line) => (line.sig === sig ? { ...line, qty: line.qty + delta } : line))
        .filter((line) => line.qty > 0)
    )
  }

  // Removing the last line from the review dialog leaves nothing to review.
  useEffect(() => {
    if (view === 'cart' && cart.length === 0) setView(null)
  }, [view, cart])

  const finishOrder = () => {
    setCart([])
    closeDialog()
  }

  return (
    <>
      <header className="container-page pb-14 pt-[84px]">
        <span className="kicker mb-3.5">
          {SITE.address.locality}, {SITE.address.region} &middot; Pickup &amp; dine-in
        </span>
        <h1 className="font-display text-[clamp(42px,5.4vw,68px)] font-bold leading-[1.05] tracking-[-0.02em]">
          Our Menu.
        </h1>
        <p className="mt-8 max-w-[58ch] text-lg">
          Everything made to order &mdash; build your order below, or call ahead and
          we&rsquo;ll have it ready for pickup.
        </p>
        <div className="mt-7">
          <a href={`tel:${SITE.tel}`} className="btn btn-ghost">
            Call {SITE.phone}
          </a>
        </div>
      </header>

      <nav
        aria-label="Menu categories"
        className="sticky top-0 z-30 border-y border-divider bg-cream"
      >
        <div
          ref={railRef}
          className="container-page flex gap-6 overflow-x-auto py-3 text-[13px] uppercase leading-[18px] tracking-[0.08em]"
        >
          {CATEGORIES.map((c) => (
            <a
              key={c.slug}
              data-slug={c.slug}
              href={`#${c.slug}`}
              aria-current={activeSlug === c.slug ? 'true' : undefined}
              className="shrink-0 whitespace-nowrap text-accent-700 transition-colors hover:text-accent aria-[current]:text-accent aria-[current]:underline aria-[current]:underline-offset-4"
            >
              {c.name}
            </a>
          ))}
        </div>
      </nav>

      <div className="container-page pb-16">
        {CATEGORIES.map((category, ci) => (
          <section key={category.slug} id={category.slug} className="pb-3.5 pt-14">
            <h2 className="mb-1.5 text-[32px] font-bold leading-[38px] tracking-[-0.01em]">
              {category.name}
            </h2>
            {category.blurb && (
              <p className="mb-2 text-base text-ink/70">{category.blurb}</p>
            )}

            <ul className="mt-4">
              {category.items.map((item, ii) => (
                <li
                  key={item.name}
                  className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-x-8 gap-y-1.5 border-t border-divider pb-6 pt-5"
                >
                  <div>
                    <h3 className="text-[22px] font-semibold leading-7">
                      {item.name}
                      {item.nameEs && (
                        <span className="ml-2 font-sans text-base font-normal italic text-ink/60">
                          {item.nameEs}
                        </span>
                      )}
                    </h3>
                    {item.portion && (
                      <p className="mt-1.5 text-[13px] uppercase leading-5 tracking-[0.08em] text-ink/60 tabular-nums">
                        {item.portion}
                      </p>
                    )}
                    {item.description && (
                      <p className="mt-2 max-w-[52ch] text-base text-ink/78">
                        {item.description}
                        {item.descriptionEs && (
                          <span className="italic text-ink/55"> {item.descriptionEs}</span>
                        )}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-col items-end gap-3">
                    <span className="text-lg text-accent-700 tabular-nums">
                      {fmtCurrency(item.price)}
                    </span>
                    <button
                      type="button"
                      className="btn btn-ghost"
                      onClick={() => openItem(ci, ii)}
                      aria-label={`Add ${item.name} to order`}
                    >
                      Add
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        ))}

        <section className="mt-[70px] rounded bg-accent-100 p-[clamp(24px,4vw,56px)]">
          <span className="kicker mb-3.5">Make it yours</span>
          <h2 className="mb-2 text-[32px] font-bold leading-[38px] tracking-[-0.01em]">
            Choices &amp; add-ons
          </h2>
          <p className="max-w-[58ch] text-base text-ink/78">
            Available on {eligibleNames} &mdash; when you order here, when you call, or
            at the counter.
          </p>

          <div className="mt-9 grid grid-cols-[repeat(auto-fit,minmax(min(100%,320px),1fr))] gap-x-[84px] gap-y-7">
            {CHOICES.map((group) => (
              <div key={group.name}>
                <h3 className="mb-2.5 text-[22px] font-semibold leading-7">
                  {group.name}
                  {group.nameEs && (
                    <span className="ml-2 font-sans text-base font-normal italic text-ink/60">
                      {group.nameEs}
                    </span>
                  )}
                </h3>
                {group.options.map((opt, i) => (
                  <div
                    key={opt.name}
                    className={`flex justify-between gap-4 border-t border-divider py-2.5 text-base ${
                      i === group.options.length - 1 ? 'border-b' : ''
                    }`}
                  >
                    <span>
                      {opt.name}
                      {opt.nameEs && (
                        <span className="ml-1.5 text-[13px] italic text-ink/60">
                          {opt.nameEs}
                        </span>
                      )}
                      {opt.detail && (
                        <span className="block text-[13px] text-ink/60">{opt.detail}</span>
                      )}
                    </span>
                    <span className="whitespace-nowrap text-accent-700 tabular-nums">
                      +{fmtCurrency(opt.price)}
                    </span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </section>

        <p className="mt-10 text-center text-xs text-ink/60">
          Prices subject to change. Please let us know about any allergies when
          ordering.
        </p>
      </div>

      {count > 0 && view === null && (
        <div className="sticky bottom-0 z-40 border-t border-divider bg-cream shadow-bar">
          <div className="container-page flex flex-wrap items-center justify-between gap-x-5 gap-y-2 py-3.5">
            <p aria-live="polite" className="text-base">
              <span className="font-display text-[19px] font-bold">Your order</span>
              <span className="ml-3 text-ink/70 tabular-nums">
                {count} {count === 1 ? 'item' : 'items'} &mdash; {fmtCurrency(subtotal)}
              </span>
            </p>
            <button type="button" className="btn btn-primary" onClick={() => setView('cart')}>
              Review order
            </button>
          </div>
        </div>
      )}

      {view === 'item' && sel && (
        <ItemDialog
          item={CATEGORIES[sel.ci].items[sel.ii]}
          sel={sel}
          setSel={setSel}
          onCancel={closeDialog}
          onConfirm={confirmAdd}
        />
      )}

      {view === 'cart' && (
        <CartDialog
          cart={cart}
          subtotal={subtotal}
          tax={tax}
          onQty={setLineQty}
          onClose={closeDialog}
          onPlace={() => setView('placed')}
        />
      )}

      {view === 'placed' && <PlacedDialog onDone={finishOrder} />}
    </>
  )
}

/* ————— overlays ————— */

/** Backdrop + panel: backdrop click and Escape close, page scroll locks. */
function Dialog({ labelledBy, onClose, maxWidth, className = '', children }) {
  const panelRef = useRef(null)

  useEffect(() => {
    panelRef.current?.focus()
    const onKey = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-ink/50 p-5"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        ref={panelRef}
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
        className={`max-h-[min(82vh,760px)] w-full overflow-auto rounded-[7px] border border-divider bg-cream p-8 shadow-dialog ${className}`}
        style={{ maxWidth }}
      >
        {children}
      </div>
    </div>
  )
}

/** Radio-style (round) or checkbox-style (square) pick row. */
function OptionRow({ role, checked, onPick, label, labelEs, detail, price }) {
  return (
    <button
      type="button"
      role={role}
      aria-checked={checked}
      onClick={onPick}
      className="row-hover flex w-full cursor-pointer items-center gap-3 border-t border-divider py-2.5 text-left"
    >
      <span
        aria-hidden="true"
        className={`size-[11px] shrink-0 border border-accent-700 ${
          role === 'radio' ? 'rounded-full' : 'rounded-[2px]'
        } ${checked ? 'bg-accent' : 'bg-transparent'}`}
      />
      <span className="flex-1 text-base leading-6">
        {label}
        {labelEs && <span className="ml-1.5 text-[13px] italic text-ink/60">{labelEs}</span>}
        {detail && <span className="block text-[13px] text-ink/60">{detail}</span>}
      </span>
      <span className="text-sm text-accent-700 tabular-nums">{price}</span>
    </button>
  )
}

function ItemDialog({ item, sel, setSel, onCancel, onConfirm }) {
  const chosenAddons = ADDON_OPTIONS.filter((_, i) => sel.addons[i])
  const unit =
    item.price +
    MEAT_OPTIONS[sel.meat].price +
    chosenAddons.reduce((sum, a) => sum + a.price, 0)

  return (
    <Dialog labelledBy="item-dialog-title" onClose={onCancel} maxWidth={540}>
      <span className="kicker mb-2.5">Build it</span>
      <h2 id="item-dialog-title" className="text-[28px] font-bold leading-[34px]">
        {item.name}
      </h2>
      {item.description && (
        <p className="mt-2.5 text-base text-ink/78">{item.description}</p>
      )}

      <p className="kicker mb-1.5 mt-7" id="meat-options-label">
        Choice of meat
      </p>
      <div role="radiogroup" aria-labelledby="meat-options-label">
        {MEAT_OPTIONS.map((m, i) => (
          <OptionRow
            key={m.name}
            role="radio"
            checked={sel.meat === i}
            onPick={() => setSel((s) => ({ ...s, meat: i }))}
            label={m.name}
            labelEs={m.nameEs}
            detail={m.detail}
            price={m.price ? `+${fmtCurrency(m.price)}` : '—'}
          />
        ))}
      </div>

      <p className="kicker mb-1.5 mt-7" id="addon-options-label">
        Add-ons
      </p>
      <div role="group" aria-labelledby="addon-options-label">
        {ADDON_OPTIONS.map((a, i) => (
          <OptionRow
            key={a.name}
            role="checkbox"
            checked={sel.addons[i]}
            onPick={() =>
              setSel((s) => {
                const addons = s.addons.slice()
                addons[i] = !addons[i]
                return { ...s, addons }
              })
            }
            label={a.name}
            labelEs={a.nameEs}
            price={`+${fmtCurrency(a.price)}`}
          />
        ))}
      </div>

      <div className="mt-5 flex items-center justify-between gap-4 border-t border-divider pt-5">
        <div className="flex items-center gap-3.5">
          <button
            type="button"
            className="btn btn-ghost btn-icon"
            onClick={() => setSel((s) => ({ ...s, qty: Math.max(1, s.qty - 1) }))}
            aria-label="Fewer"
          >
            &minus;
          </button>
          <span className="min-w-5 text-center text-lg tabular-nums">{sel.qty}</span>
          <button
            type="button"
            className="btn btn-ghost btn-icon"
            onClick={() => setSel((s) => ({ ...s, qty: s.qty + 1 }))}
            aria-label="More"
          >
            +
          </button>
        </div>
        <span className="text-lg tabular-nums">{fmtCurrency(unit * sel.qty)}</span>
      </div>

      <div className="mt-6 flex justify-end gap-3.5">
        <button type="button" className="btn btn-ghost" onClick={onCancel}>
          Cancel
        </button>
        <button type="button" className="btn btn-primary" onClick={onConfirm}>
          Add to order
        </button>
      </div>
    </Dialog>
  )
}

function CartDialog({ cart, subtotal, tax, onQty, onClose, onPlace }) {
  return (
    <Dialog labelledBy="cart-dialog-title" onClose={onClose} maxWidth={560}>
      <span className="kicker mb-2.5">Pickup order</span>
      <h2 id="cart-dialog-title" className="mb-3 text-[28px] font-bold leading-[34px]">
        Your order
      </h2>

      <div>
        {cart.map((line) => (
          <div
            key={line.sig}
            className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-5 gap-y-1 border-t border-divider py-3.5"
          >
            <div>
              <p className="text-base leading-6">{line.name}</p>
              {line.meta && (
                <p className="mt-0.5 text-[13px] leading-5 text-ink/60">{line.meta}</p>
              )}
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                className="btn btn-ghost btn-icon"
                onClick={() => onQty(line.sig, -1)}
                aria-label={`Fewer ${line.name}`}
              >
                &minus;
              </button>
              <span className="min-w-4 text-center text-base tabular-nums">{line.qty}</span>
              <button
                type="button"
                className="btn btn-ghost btn-icon"
                onClick={() => onQty(line.sig, 1)}
                aria-label={`More ${line.name}`}
              >
                +
              </button>
              <span className="min-w-16 text-right text-base tabular-nums">
                {fmtCurrency(line.unit * line.qty)}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-1.5 grid gap-1.5 border-t border-divider pt-4 text-base tabular-nums">
        <div className="flex justify-between gap-4 text-ink/70">
          <span>Subtotal</span>
          <span>{fmtCurrency(subtotal)}</span>
        </div>
        <div className="flex justify-between gap-4 text-ink/70">
          <span>Tax</span>
          <span>{fmtCurrency(tax)}</span>
        </div>
        <div className="flex justify-between gap-4 text-lg">
          <span>Total</span>
          <span className="text-accent-700">{fmtCurrency(subtotal + tax)}</span>
        </div>
      </div>

      <div className="mt-6 flex justify-end gap-3.5">
        <button type="button" className="btn btn-ghost" onClick={onClose}>
          Keep browsing
        </button>
        <button type="button" className="btn btn-primary" onClick={onPlace}>
          Place pickup order
        </button>
      </div>
    </Dialog>
  )
}

function PlacedDialog({ onDone }) {
  return (
    <Dialog
      labelledBy="placed-dialog-title"
      onClose={onDone}
      maxWidth={480}
      className="p-10 text-center"
    >
      <p className="font-display text-[clamp(34px,4vw,48px)] font-bold leading-[1.1] text-accent tabular-nums">
        &#8776;{ORDERING.pickupMinutes} min
      </p>
      <h2 id="placed-dialog-title" className="mt-5 text-[28px] font-bold leading-[34px]">
        Thank you! Your order is in.
      </h2>
      <p className="mt-3.5 text-base text-ink/78">
        We&rsquo;ll have it hot and ready for pickup at {formattedAddress}. Questions?
        Call{' '}
        <a href={`tel:${SITE.tel}`} className="text-accent-700 hover:text-accent">
          {SITE.phone}
        </a>
        .
      </p>
      <div className="mt-7 flex justify-center">
        <button type="button" className="btn btn-primary" onClick={onDone}>
          Done
        </button>
      </div>
    </Dialog>
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
      // takes the whole page down with it. 64px clears the sticky category
      // rail; the -60% bottom means a section stops counting once it's mostly
      // scrolled past.
      { rootMargin: '-64px 0px -60% 0px', threshold: 0 }
    )

    slugs.forEach((slug) => {
      const el = document.getElementById(slug)
      if (el) observer.observe(el)
    })
    return () => observer.disconnect()
  }, [slugs])

  return active
}
