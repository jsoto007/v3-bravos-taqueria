import React, { useEffect, useState, useRef, useLayoutEffect } from 'react'
import { api } from '../lib/api'
import Modal from '../components/Modal'
import { useCart } from '../context/CartContext'
import FadeIn from '../utils/FadeIn'

export default function Menu(){
  const [cats, setCats] = useState([])
  const [loading, setLoading] = useState(true)
  const [active, setActive] = useState(null) // for modifiers modal
  const { addItem } = useCart()
  const [activeCatId, setActiveCatId] = useState(null)

  const catBarRef = useRef(null)
  const [catBarH, setCatBarH] = useState(0)
  const catListRef = useRef(null)

  useLayoutEffect(() => {
    if (!catBarRef.current) return
    const el = catBarRef.current
    const measure = () => setCatBarH(el.offsetHeight || 0)
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
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const id = entry.target.getAttribute('id')
            if (id && id.startsWith('cat-')) {
              const num = Number(id.replace('cat-', ''))
              if (!Number.isNaN(num)) setActiveCatId(num)
            }
          }
        })
      },
      {
        // Trigger when the section's top comes into the upper half of the viewport
        rootMargin: '0px 0px -60% 0px',
        threshold: 0.1,
      }
    )

    cats.forEach((c) => {
      const el = document.getElementById(`cat-${c.id}`)
      if (el) observer.observe(el)
    })

    return () => observer.disconnect()
  }, [cats])

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
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    setActiveCatId(id)
  }

  useEffect(()=>{
    (async()=>{
      try { setCats(await api.categories()) }
      finally { setLoading(false) }
    })()
  }, [])

  const startAdd = (item)=> setActive({ item, qty:1, notes:'', options:[] })
  const commitAdd = async ()=>{
    await addItem(active.item.id, { qty: active.qty, notes: active.notes, modifier_option_ids: active.options })
    setActive(null)
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
            <div style={{ height: catBarH }} />

            {/* Main */}
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
                {loading ? (
                    <div className="rounded-2xl border border-neutral-200 bg-white p-6 text-neutral-800 shadow-sm">Loading menu…</div>
                ) : (
                    cats.map(c=> (
                        <section id={`cat-${c.id}`} key={c.id} className="mb-10 scroll-mt-24">
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
      </FadeIn>
    </div>
  )
}
