import React, { useEffect, useState, useRef, useLayoutEffect } from 'react'
import { api } from '../lib/api'
import Modal from '../components/Modal'
import { useCart } from '../context/CartContext'
import FadeIn from '../utils/FadeIn'
import CheckmarkOverlay from '../components/ui/CheckmarkOverlay'

export default function Menu(){
  const [cats, setCats] = useState([])
  const [loading, setLoading] = useState(true)
  const [active, setActive] = useState(null) // for modifiers modal
  const [pendingAdd, setPendingAdd] = useState(false)
  const { addItem } = useCart()
  const [activeCatId, setActiveCatId] = useState(null)
  const [showCheck, setShowCheck] = useState(false)
  const suppressUntilRef = useRef(0)

  const catBarRef = useRef(null)
  const [catBarH, setCatBarH] = useState(0)
  const [headerH, setHeaderH] = useState(0)
  const catListRef = useRef(null)
  const sectionScrollMargin = headerH + catBarH + 12

  useLayoutEffect(() => {
    if (!catBarRef.current) return
    const el = catBarRef.current
    const measure = () => {
      setCatBarH(el.offsetHeight || 0)
      const header = document.querySelector('header')
      setHeaderH(header ? header.offsetHeight || 0 : 0)
    }
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    window.addEventListener('resize', measure)
    return () => {
      ro.disconnect()
      window.removeEventListener('resize', measure)
    }
  }, [])

  useEffect(() => {
    if (!cats?.length) return

    const observer = new IntersectionObserver(
      (entries) => {
        // Ignore observer updates while we're doing a programmatic smooth scroll
        if (Date.now() < suppressUntilRef.current) return

        // Choose the entry with the largest intersection ratio that is intersecting
        const visible = entries
          .filter(e => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)

        if (visible.length) {
          const id = visible[0].target.getAttribute('id')
          if (id && id.startsWith('cat-')) {
            const num = Number(id.replace('cat-', ''))
            if (!Number.isNaN(num)) setActiveCatId(num)
          }
        }
      },
      {
        // Offset the top by the fixed header + categories bar so we don't "advance" to the next section
        rootMargin: `${-(headerH + catBarH + 8)}px 0px -55% 0px`,
        threshold: [0, 0.25, 0.5, 0.75, 1],
      }
    )

    cats.forEach((c) => {
      const el = document.getElementById(`cat-${c.id}`)
      if (el) observer.observe(el)
    })

    return () => observer.disconnect()
  }, [cats, catBarH, headerH])

  useEffect(() => {
    if (activeCatId == null) return
    const list = catListRef.current
    if (!list) return
    const el = list.querySelector(`a[data-cat-id="${activeCatId}"]`)
    if (!el) return
    // Only scroll if it's outside the visible bounds to avoid jitter
    const elRect = el.getBoundingClientRect()
    const listRect = list.getBoundingClientRect()
    const isLeftOverflow = elRect.left < listRect.left
    const isRightOverflow = elRect.right > listRect.right
    if (isLeftOverflow || isRightOverflow) {
      el.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' })
    }
  }, [activeCatId])

  const scrollToCategory = (id) => {
    const el = document.getElementById(`cat-${id}`)
    if (!el) return
    // Measure fixed header + fixed categories bar
    const header = document.querySelector('header')
    const navH = header ? header.offsetHeight : 0
    const offset = navH + catBarH + 16 // extra room to ensure the title is not tucked under bars
    const targetY = el.getBoundingClientRect().top + window.scrollY - offset
    // Immediately mark as active for instant UI feedback
    setActiveCatId(id)
    // Suppress observer updates briefly while smooth scrolling to prevent it from flipping to the next section
    suppressUntilRef.current = Date.now() + 800
    window.scrollTo({ top: Math.max(0, targetY), behavior: 'smooth' })
  }

  useEffect(()=>{
    (async()=>{
      try { setCats(await api.categories()) }
      finally { setLoading(false) }
    })()
  }, [])

  const startAdd = (item) => {
    // Always open the modal so the user can review/modify options and quantity
    setActive({ item, qty: 1, notes: '', options: [] })
  }

  const commitAdd = () => {
    if (!active?.item) return

    // Block submit if any required group has no selected option
    const missingRequired = (active.item.modifier_groups || []).some(g =>
      g.required && !(active.options || []).some(optId => (g.options || []).some(o => o.id === optId))
    )
    if (missingRequired) {
      alert('Please select the required options.')
      return
    }

    // Fire-and-forget: trigger optimistic update immediately; close modal without awaiting network
    setPendingAdd(true)
    const p = addItem(active.item, {
      qty: active.qty,
      notes: active.notes,
      modifier_option_ids: active.options,
    })

    // Close modal right away so the app feels snappy; reconciliation/rollback will still occur in context
    setActive(null)
    setShowCheck(true)

    // Clear pending flag when the async work completes
    p.finally(() => setPendingAdd(false))
  }

  const fmt = (n)=> `$${Number(n).toFixed(2)}`

  return (
    <div className="w-screen -mx-[calc(50vw-50%)] -mt-px">
        <FadeIn>
            {/* Top Categories */}
            <div
              ref={catBarRef}
              className="fixed top-16 inset-x-0 z-30 border-b border-neutral-200 bg-white supports-[backdrop-filter]:bg-white transform-gpu will-change-[transform]"
              style={{ backfaceVisibility: 'hidden', transform: 'translateZ(0)' }}
            >
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-3">
                <div className="mb-2 text-sm font-extrabold tracking-tight text-neutral-900">Categories</div>
                <div ref={catListRef} className="flex gap-2 overflow-x-auto">
                    {cats.map(c => (
                    <a
                        key={c.id}
                        data-cat-id={c.id}
                        href={`#cat-${c.id}`}
                        onClick={(e) => { e.preventDefault(); scrollToCategory(c.id) }}
                        aria-current={activeCatId === c.id}
                        className="shrink-0 rounded-lg px-3 py-1.5 text-sm font-semibold text-neutral-700 transition border-b-2 border-transparent hover:bg-amber-50 hover:text-amber-700 aria-[current=true]:text-amber-700 aria-[current=true]:border-amber-500 aria-[current=true]:underline aria-[current=true]:underline-offset-8"
                    >
                        {c.name}
                    </a>
                    ))}
                </div>
                </div>
            </div>
            <div style={{ height: catBarH + 12 }} />

            {/* Main */}
            <div className="mt-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
                {loading ? (
                    <div className="mt-10 rounded-2xl border border-neutral-200 bg-white p-6 text-neutral-800 shadow-sm">Loading menu…</div>
                ) : (
                    cats.map(c=> (
                        <section
                          id={`cat-${c.id}`}
                          key={c.id}
                          className="mb-10"
                          style={{ scrollMarginTop: sectionScrollMargin }}
                        >
                    <h3 className="mb-4 text-2xl font-extrabold tracking-tight text-neutral-900">{c.name}</h3>
                    <div className="space-y-4">
                      {c.items.map(it => (
                        <div
                          key={it.id}
                          className="group relative flex items-stretch justify-between rounded-2xl border border-neutral-200 bg-white p-4 transition hover:shadow-md"
                        >
                          {/* LEFT: name, price, description */}
                          <button
                            type="button"
                            onClick={() => startAdd(it)}
                            className="flex-1 text-left"
                          >
                            <div className="mb-1 text-base font-extrabold tracking-tight text-neutral-900">
                              {it.name}
                            </div>
                            <div className="mb-1 text-sm font-semibold text-neutral-800">
                              {typeof it.price !== 'undefined' ? fmt(it.price) : null}
                            </div>
                            {it.description ? (
                              <p className="line-clamp-2 max-w-prose text-sm text-neutral-600">
                                {it.description}
                              </p>
                            ) : null}
                          </button>

                          {/* RIGHT: image with + button */}
                          <div className="relative ml-4 h-28 w-28 shrink-0 overflow-hidden rounded-xl border border-neutral-200 bg-neutral-50">
                            {(it.photo_url || it.image_url) ? (
                              <img
                                src={it.photo_url || it.image_url}
                                alt={it.name}
                                className="h-full w-full object-cover"
                                onError={(e) => { e.currentTarget.style.display = 'none' }}
                              />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center text-5xl">
                                {/burrito/i.test(it.name) ? '🌯' : '🌮'}
                              </div>
                            )}
                            <button
                              type="button"
                              onClick={() => startAdd(it)}
                              className="absolute bottom-2 right-2 inline-flex size-8 items-center justify-center rounded-full bg-amber-400 font-bold text-black shadow transition hover:scale-105"
                              aria-label={`Add ${it.name}`}
                              title="Add"
                              disabled={pendingAdd}
                            >
                              +
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                    </section>
                ))
                )}
            </div>

            <Modal
                open={!!active}
                title={active? active.item.name: ''}
                onClose={()=> setActive(null)}
                footer={
                  <div className="fixed inset-x-0 bottom-0 z-[60] flex flex-col gap-3 border-t bg-white/95 px-4 py-4 pb-[calc(env(safe-area-inset-bottom)+1rem)] shadow-[0_-6px_24px_rgba(0,0,0,0.08)] backdrop-blur supports-[backdrop-filter]:bg-white/70 sm:flex-row sm:items-center sm:justify-end sm:px-6">
                    <button
                      type="button"
                      className="w-full rounded-2xl border border-neutral-300 bg-white px-4 py-2.5 font-semibold text-neutral-800 transition hover:border-neutral-400 hover:bg-neutral-50 sm:w-auto"
                      onClick={() => setActive(null)}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      className="w-full rounded-2xl bg-green-600 px-4 py-2.5 font-bold text-white transition hover:scale-[1.02] hover:shadow-[0_8px_30px_rgba(22,163,74,0.35)] sm:w-auto"
                      onClick={commitAdd}
                      disabled={pendingAdd}
                    >
                      Add to cart
                    </button>
                  </div>
                }
            >
                {active && (
                <div className="space-y-5 pb-40 sm:pb-8 max-h-[70vh] overflow-y-auto pr-2">
                    {active.item.modifier_groups?.map(g=> (
                    <div key={g.id}>
                        <div className="text-base font-bold text-neutral-900">
                        {g.name}{' '}
                        {g.required && <span className="align-middle text-xs font-semibold text-rose-700">(required)</span>}
                        </div>
                        <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                        {g.options.map(o=>{
                            const checked = active.options.includes(o.id)
                            const toggle = ()=> setActive(prev=> ({...prev, options: checked? prev.options.filter(x=>x!==o.id) : [...prev.options, o.id]}))
                            return (
                            <label
                                key={o.id}
                                className={`flex cursor-pointer items-center gap-3 rounded-xl border px-3 py-2 transition ${checked ? 'border-amber-300 bg-amber-50 ring-2 ring-amber-200' : 'border-neutral-300 bg-white hover:bg-neutral-50'}`}
                            >
                                <input type="checkbox" checked={checked} onChange={toggle} className="size-4 accent-amber-500" />
                                <span className="text-sm font-medium text-neutral-800">
                                {o.name}{' '}
                                {Number(o.price_delta)>0 && (
                                    <span className="text-neutral-500">(+${Number(o.price_delta).toFixed(2)})</span>
                                )}
                                </span>
                            </label>
                            )
                        })}
                        </div>
                    </div>
                    ))}

                    <div className="flex items-center gap-3">
                    <label className="text-sm font-semibold text-neutral-800">Qty</label>
                    <input
                        type="number"
                        min={1}
                        value={active.qty}
                        onChange={e=> setActive(prev=> ({...prev, qty: Math.max(1, Number(e.target.value||1))}))}
                        className="w-24 rounded-xl border-2 border-neutral-300 bg-white px-3 py-2 text-center text-neutral-900 outline-none transition focus:border-amber-400 focus:ring-4 focus:ring-amber-400/20"
                    />
                    </div>

                    <div>
                    <label className="mb-1 block text-sm font-semibold text-neutral-800">Notes</label>
                    <textarea
                        value={active.notes}
                        onChange={e=> setActive(prev=> ({...prev, notes: e.target.value.slice(0,300)}))}
                        className="min-h-28 w-full rounded-2xl border-2 border-neutral-300 bg-white px-3 py-2 text-neutral-900 outline-none transition placeholder:text-neutral-400 focus:border-amber-400 focus:ring-4 focus:ring-amber-400/20"
                        placeholder="No onions, allergies... (max 300)"
                    />
                    </div>
                </div>
                )}
            </Modal>
            <CheckmarkOverlay
              open={showCheck}
              onClosed={() => setShowCheck(false)}
              durationMs={800}
              message="Added to cart!"
              backdropClass="bg-black/30"
              bubbleClass="bg-amber-400"
              ringClass="bg-amber-400/40"
              showRing
              sizePx={96}
            />
      </FadeIn>
    </div>
  )
}
