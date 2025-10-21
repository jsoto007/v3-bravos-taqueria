import React, { useMemo, useState, useCallback, useEffect } from 'react'
import { useCart } from '../context/CartContext'
import FadeIn from '../utils/FadeIn'
import DeleteBtn from '../components/ui/DeleteBtn'
import { api } from '../lib/api'

export default function Cart(){
  const { cart, totals, updateQty, removeItem } = useCart()
  const items = useMemo(() => cart?.items || [], [cart?.items])

  const [removingIds, setRemovingIds] = useState(new Set())
  const [removeErrors, setRemoveErrors] = useState({})
  const [qtyOverrides, setQtyOverrides] = useState({}) // { [itemId]: number }
  const [qtyErrors, setQtyErrors] = useState({})       // { [itemId]: string }
  const getDisplayQty = useCallback((item) => {
    return qtyOverrides[item.id] ?? item.qty
  }, [qtyOverrides])

  const handleRemoveOptimistic = useCallback((id) => {
    setRemoveErrors((e) => ({ ...e, [id]: undefined }))
    setRemovingIds(prev => new Set(prev).add(id))
    Promise.resolve(removeItem(id))
      .then(() => {
        setRemovingIds(prev => {
          const next = new Set(prev)
          next.delete(id)
          return next
        })
      })
      .catch((err) => {
        setRemovingIds(prev => {
          const next = new Set(prev)
          next.delete(id)
          return next
        })
        setRemoveErrors((e) => ({ ...e, [id]: err?.message || 'Failed to remove item. Try again.' }))
      })
  }, [removeItem])

  // Items shown locally (hide ones being removed optimistically)
  const visibleItems = useMemo(() => items.filter(i => !removingIds.has(i.id)), [items, removingIds])

  // Build a quick lookup for modifier option meta pulled from /api/menu
  const [modifierLookup, setModifierLookup] = useState({})
  useEffect(() => {
    let active = true
    async function loadMenu() {
      try {
        const menuItems = await api.menu()
        if (!active) return
        const lookup = {}
        for (const item of menuItems || []) {
          for (const group of item.modifier_groups || []) {
            for (const opt of group.options || []) {
              lookup[String(opt.id)] = {
                name: opt.name,
                price_delta: Number(opt.price_delta || 0)
              }
            }
          }
        }
        setModifierLookup(lookup)
      } catch (err) {
        console.error('Failed to load menu for modifier details', err)
      }
    }
    loadMenu()
    return () => { active = false }
  }, [])

  const getItemModifiers = useCallback((item) => {
    const results = []
    if (Array.isArray(item?.modifiers) && item.modifiers.length > 0) {
      for (const mod of item.modifiers) {
        const optionId = mod.option_id ?? mod.modifier_option_id ?? mod.id
        const meta = modifierLookup[String(optionId)] || {}
        const priceDeltaRaw = mod.price_delta ?? meta.price_delta ?? 0
        results.push({
          key: `${item.id}-${optionId}`,
          name: meta.name || `Add-on ${optionId}`,
          price_delta: Number(priceDeltaRaw || 0)
        })
      }
    } else if (Array.isArray(item?.modifier_option_ids) && item.modifier_option_ids.length > 0) {
      for (const optionId of item.modifier_option_ids) {
        const meta = modifierLookup[String(optionId)] || {}
        results.push({
          key: `${item.id}-${optionId}`,
          name: meta.name || `Add-on ${optionId}`,
          price_delta: Number(meta.price_delta || 0)
        })
      }
    }
    return results
  }, [modifierLookup])

  // Derive a base price like in the mock: unit_price - sum(modifiers)
  const getBasePrice = useCallback((item) => {
    const mods = getItemModifiers(item)
    const modSum = mods.reduce((s, m) => s + Number(m.price_delta || 0), 0)
    const perUnit = Number(item.unit_price || 0)
    const base = Math.max(0, perUnit - modSum)
    return base
  }, [getItemModifiers])

  // Recompute totals locally so UI updates immediately
  const localTotals = useMemo(() => {
    const currency = cart?.currency || 'USD'
    const subtotal = visibleItems.reduce((sum, i) => {
      const q = qtyOverrides[i.id] ?? i.qty
      return sum + Number(i.unit_price) * Number(q)
    }, 0)
    const tax = +(subtotal * 0.08).toFixed(2)
    const total = +(subtotal + tax).toFixed(2)
    return { currency, subtotal, tax, total }
  }, [visibleItems, cart?.currency, qtyOverrides])

  const formatModifierPrice = useCallback((value) => {
    if (value > 0) return `+${totals.fmt(value)}`
    if (value < 0) return `-${totals.fmt(Math.abs(value))}`
    return 'Included'
  }, [totals])

  const adjustQty = useCallback((itemId, currentQty, delta) => {
    const desired = Math.max(1, Number(currentQty || 1) + delta)
    if (desired === currentQty) return

    // optimistic local override
    setQtyErrors((e) => ({ ...e, [itemId]: undefined }))
    setQtyOverrides((m) => ({ ...m, [itemId]: desired }))

    Promise.resolve(updateQty(itemId, desired))
      .then(() => {
        // server success -> clear override (context will have the true qty)
        setQtyOverrides((m) => {
          const { [itemId]: _, ...rest } = m
          return rest
        })
      })
      .catch((err) => {
        // server failed -> revert to context qty and surface error
        setQtyOverrides((m) => {
          const { [itemId]: _, ...rest } = m
          return rest
        })
        setQtyErrors((e) => ({ ...e, [itemId]: err?.message || 'Could not update quantity. Try again.' }))
      })
  }, [updateQty])

  const setQtyFromInput = useCallback((itemId, value, currentQty) => {
    const numeric = Number(value)
    if (!Number.isFinite(numeric)) return
    const desired = Math.max(1, Math.round(numeric))
    if (desired === currentQty) return

    setQtyErrors((e) => ({ ...e, [itemId]: undefined }))
    setQtyOverrides((m) => ({ ...m, [itemId]: desired }))

    Promise.resolve(updateQty(itemId, desired))
      .then(() => {
        setQtyOverrides((m) => {
          const { [itemId]: _, ...rest } = m
          return rest
        })
      })
      .catch((err) => {
        setQtyOverrides((m) => {
          const { [itemId]: _, ...rest } = m
          return rest
        })
        setQtyErrors((e) => ({ ...e, [itemId]: err?.message || 'Could not update quantity. Check your connection and retry.' }))
      })
  }, [updateQty])

  return (
    <FadeIn>
      <div className="mt-20 min-h-screen bg-neutral-50/80 py-6 md:px-4 lg:px-8">
        <div className="mx-auto w-full">
          <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
            {/* Cart list */}
            <div className="overflow-hidden rounded-2xl border border-amber-100 bg-white shadow-sm">
              <div className="flex items-center gap-3 bg-neutral-950 px-6 py-5 text-white">
                <span className="text-xl">🛒</span>
                <h1 className="text-2xl font-bold tracking-tight">Your Cart</h1>
                <span className="ml-auto rounded-full bg-white/15 px-3 py-1 text-sm font-semibold">
                  {visibleItems.length} {visibleItems.length === 1 ? 'item' : 'items'}
                </span>
              </div>

              <ul className="divide-y divide-neutral-100">
                {visibleItems.length === 0 && (
                  <li className="grid place-items-center gap-2 p-12 text-center text-neutral-500">
                    <div className="text-5xl">🛒</div>
                    <p className="text-sm">Your cart is empty. Add something tasty! 🌮</p>
                  </li>
                )}

                {visibleItems.map((i) => {
                  const modifiers = getItemModifiers(i)
                  const basePrice = getBasePrice(i)
                  const displayQty = getDisplayQty(i)
                  const lineTotal = (Number(i.unit_price) * Number(displayQty)).toFixed(2)

                  return (
                    <li
                      key={i.id}
                      className={`p-6 transition-colors hover:bg-amber-50/40 ${
                        removingIds.has(i.id) ? 'opacity-60' : ''
                      }`}
                    >
                      <div className="flex items-start gap-4">
                        <div className="flex-1">
                          <div className="font-semibold tracking-tight text-neutral-900">
                            {i.name}
                            {removingIds.has(i.id) && (
                              <span className="ml-2 align-middle rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-semibold text-rose-800 animate-pulse">Removing…</span>
                            )}
                          </div>
                          <p className="mb-3 mt-0.5 text-sm text-neutral-600">Base price: {totals.fmt(basePrice)}</p>

                          {modifiers.length > 0 && (
                            <div className="mb-4">
                              <p className="text-[11px] font-semibold uppercase tracking-wide text-neutral-700">Customizations</p>
                              <div className="mt-1 rounded-xl border border-neutral-200 bg-neutral-50 p-3">
                                <ul className="space-y-1 text-sm">
                                  {modifiers.map((mod) => (
                                    <li key={mod.key} className="flex items-center justify-between">
                                      <span className="text-neutral-700">{mod.name}</span>
                                      <span className="font-medium text-neutral-900">{formatModifierPrice(mod.price_delta)}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            </div>
                          )}

                          {(i._error || removeErrors[i.id]) && (
                            <div className="mt-1 text-xs text-rose-700">
                              {i._error ? (
                                <>Couldn't save your change. <button onClick={() => updateQty(i.id, i.qty)} className="underline underline-offset-2">Retry</button></>
                              ) : (
                                <>
                                  {removeErrors[i.id]} <button onClick={() => handleRemoveOptimistic(i.id)} className="underline underline-offset-2">Retry</button>
                                </>
                              )}
                            </div>
                          )}

                          {qtyErrors[i.id] && (
                            <div className="mt-1 text-xs text-rose-700">{qtyErrors[i.id]}</div>
                          )}

                          {/* Quantity + actions */}
                          <div className="mt-2 flex items-center gap-3">
                            <div className="inline-flex items-center overflow-hidden rounded-xl border border-neutral-300 bg-white">
                              <button
                                type="button"
                                onClick={() => adjustQty(i.id, getDisplayQty(i), -1)}
                                disabled={removingIds.has(i.id) || getDisplayQty(i) <= 1}
                                className="px-3 py-2 text-neutral-800 transition hover:bg-neutral-100 disabled:opacity-50"
                                aria-label="Decrease quantity"
                              >
                                −
                              </button>
                              <input
                                id={`qty-${i.id}`}
                                type="number"
                                inputMode="numeric"
                                min={1}
                                value={getDisplayQty(i)}
                                onChange={(e) => setQtyFromInput(i.id, e.target.value, i.qty)}
                                disabled={removingIds.has(i.id)}
                                className="min-w-[3rem] border-none bg-transparent text-center text-sm font-semibold text-neutral-900 outline-none"
                                aria-label={`${i.name} quantity`}
                              />
                              <button
                                type="button"
                                onClick={() => adjustQty(i.id, getDisplayQty(i), 1)}
                                disabled={removingIds.has(i.id)}
                                className="px-3 py-2 text-neutral-800 transition hover:bg-neutral-100 disabled:opacity-50"
                                aria-label="Increase quantity"
                              >
                                +
                              </button>
                            </div>

                            <DeleteBtn
                              onClick={() => handleRemoveOptimistic(i.id)}
                              title="Remove item"
                              className="shrink-0"
                              disabled={removingIds.has(i.id)}
                            />
                          </div>
                        </div>

                        <div className="ml-auto min-w-0 text-right pr-2 sm:pr-0">
                          {(() => {
                            const [whole, cents] = String(lineTotal).split('.')
                            return (
                              <span className="tabular-nums whitespace-nowrap font-bold text-neutral-900 text-lg sm:text-2xl leading-none">
                                ${whole}
                                <span className="align-top font-bold text-neutral-500 text-[10px] sm:text-sm leading-none">.{cents}</span>
                              </span>
                            )
                          })()}
                        </div>
                      </div>
                    </li>
                  )
                })}
              </ul>
            </div>

            {/* Summary */}
            <aside className="h-fit overflow-hidden rounded-2xl border border-amber-100 bg-white shadow-sm lg:sticky lg:top-8">
              <div className="bg-neutral-950 px-6 py-5">
                <div className="text-xl font-bold tracking-tight text-white">Order Summary</div>
              </div>
              <div className="p-6">
                <div className="mb-2 flex items-center justify-between text-sm text-neutral-700">
                  <span>Subtotal</span>
                  <span className="font-semibold">{totals.fmt(localTotals.subtotal)}</span>
                </div>
                <div className="mb-4 flex items-center justify-between text-sm text-neutral-700">
                  <span>Tax</span>
                  <span className="font-semibold">{totals.fmt(localTotals.tax)}</span>
                </div>
                <div className="border-t border-amber-200 pt-4">
                  <div className="mb-6 flex items-center justify-between">
                    <span className="text-lg font-semibold text-neutral-900">Total</span>
                    {(() => {
                      const [w, c] = String(localTotals.total.toFixed(2)).split('.')
                      return (
                        <span className="tabular-nums text-3xl font-bold text-neutral-900 whitespace-nowrap">
                          ${w}
                          <span className="align-top text-sm font-bold text-neutral-500">.{c}</span>
                        </span>
                      )
                    })()}
                  </div>
                  <a
                    href="/checkout"
                    className="block w-full rounded-xl bg-amber-400 px-5 py-4 text-center font-bold text-black shadow-[0_8px_30px_rgba(251,191,36,0.35)] transition hover:scale-[1.02] hover:shadow-[0_12px_36px_rgba(251,191,36,0.45)]"
                  >
                    Secure Checkout
                  </a>
                  <p className="mt-3 text-center text-xs text-neutral-600">Safe & fast • No extra fees</p>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </div>
    </FadeIn>
  )
}
