import React, { useMemo, useState, useCallback } from 'react'
import { useCart } from '../context/CartContext'
import FadeIn from '../utils/FadeIn'
import DeleteBtn from '../components/ui/DeleteBtn'

export default function Cart(){
  const { cart, totals, updateQty, removeItem } = useCart()
  const items = cart?.items || []

  const [removingIds, setRemovingIds] = useState(new Set())
  const [removeErrors, setRemoveErrors] = useState({})

  const handleRemoveOptimistic = useCallback((id) => {
    setRemoveErrors((e) => ({ ...e, [id]: undefined }))
    setRemovingIds(prev => new Set(prev).add(id))
    // fire-and-forget server call; if it fails, restore visibility
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

  // Recompute totals locally so UI updates immediately
  const localTotals = useMemo(() => {
    const currency = cart?.currency || 'USD'
    const subtotal = visibleItems.reduce((sum, i) => sum + Number(i.unit_price) * i.qty, 0)
    const tax = +(subtotal * 0.08).toFixed(2)
    const total = +(subtotal + tax).toFixed(2)
    return { currency, subtotal, tax, total }
  }, [visibleItems, cart?.currency])

  
  return (
    <FadeIn>
        <div className="mt-20 grid gap-6 lg:grid-cols-[1fr_360px] w-screen -mx-[calc(50vw-50%)] sm:w-auto sm:mx-0">
        {/* Cart list */}
            <div className="rounded-3xl border border-neutral-200 bg-white text-neutral-900 shadow-sm">
                <div className="border-b border-neutral-200 p-5 text-lg font-extrabold tracking-tight">Your Cart</div>
                <ul className="divide-y divide-neutral-100">
                {visibleItems.length === 0 && (
                    <li className="grid place-items-center gap-2 p-10 text-center text-neutral-500">
                    <div className="text-3xl">🛒</div>
                    <p className="text-sm">Your cart is empty. Add something tasty! 🌮</p>
                    </li>
                )}

                {visibleItems.map((i) => (
                    <li
                      key={i.id}
                      className={`flex items-center gap-4 p-4 ${(i._pending || removingIds.has(i.id)) ? 'opacity-60' : ''}`}
                    >
                    <div className="flex-1">
                        <div className="font-bold tracking-tight text-neutral-900">
                          {i.name}
                          {i._pending && (
                            <span className="ml-2 align-middle rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-800 animate-pulse">Saving…</span>
                          )}
                          {removingIds.has(i.id) && (
                            <span className="ml-2 align-middle rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-semibold text-rose-800 animate-pulse">Removing…</span>
                          )}
                        </div>
                        {Boolean(i.notes) && (
                        <div className="text-sm text-neutral-600">{i.notes}</div>
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
                    </div>

                    <label className="sr-only" htmlFor={`qty-${i.id}`}>Quantity</label>
                    <input
                        id={`qty-${i.id}`}
                        type="number"
                        min={1}
                        value={i.qty}
                        onChange={(e) => updateQty(i.id, Number(e.target.value || 1))}
                        disabled={!!i._pending || removingIds.has(i.id)}
                        aria-busy={(i._pending || removingIds.has(i.id)) ? 'true' : 'false'}
                        className="w-20 rounded-xl border-2 border-neutral-300 bg-white px-3 py-2 text-center text-neutral-900 outline-none transition focus:border-amber-400 focus:ring-4 focus:ring-amber-400/20"
                    />

                    <div className="w-28 text-right">
                        <span className="bg-gradient-to-br from-amber-500 to-amber-300 bg-clip-text text-lg font-extrabold text-transparent">
                        ${(Number(i.unit_price) * i.qty).toFixed(2)}
                        </span>
                    </div>

                    <DeleteBtn
                      onClick={() => handleRemoveOptimistic(i.id)}
                      title="Remove item"
                      className="shrink-0"
                      disabled={!!i._pending || removingIds.has(i.id)}
                    />
                    </li>
                ))}
                </ul>
            </div>

        {/* Summary */}
            <aside className="sticky top-24 h-fit rounded-3xl border border-neutral-200 bg-amber-50 p-6 text-neutral-900">
                <div className="mb-3 text-lg font-extrabold tracking-tight">Summary</div>
                <div className="mb-1 flex items-center justify-between text-sm text-neutral-700">
                <span>Subtotal</span>
                <span>{totals.fmt(localTotals.subtotal)}</span>
                </div>
                <div className="mb-2 flex items-center justify-between text-sm text-neutral-700">
                <span>Tax</span>
                <span>{totals.fmt(localTotals.tax)}</span>
                </div>
                <div className="mt-2 border-t border-amber-200 pt-3">
                <div className="flex items-center justify-between text-xl font-extrabold text-neutral-900">
                    <span>Total</span>
                    <span>{totals.fmt(localTotals.total)}</span>
                </div>
                </div>

                <a
                href="/checkout"
                className="mt-4 block rounded-2xl bg-green-600 px-4 py-3 text-center font-bold text-white transition hover:scale-[1.02] hover:shadow-[0_8px_30px_rgba(22,163,74,0.35)]"
                >
                Secure Checkout
                </a>
                <p className="mt-2 text-center text-xs text-neutral-600">Safe & fast • No extra fees</p>
            </aside>
        </div>
    </FadeIn>
  )
}
