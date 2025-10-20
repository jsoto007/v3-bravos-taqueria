import React from 'react'
import { useCart } from '../context/CartContext'
import FadeIn from '../utils/FadeIn'
import DeleteBtn from '../components/ui/DeleteBtn'

export default function Cart(){
  const { cart, totals, updateQty, removeItem } = useCart()
  const items = cart?.items || []

  return (
    <FadeIn>
        <div className="mt-20 grid gap-6 lg:grid-cols-[1fr_360px] w-screen -mx-[calc(50vw-50%)] sm:w-auto sm:mx-0">
        {/* Cart list */}
            <div className="rounded-3xl border border-neutral-200 bg-white text-neutral-900 shadow-sm">
                <div className="border-b border-neutral-200 p-5 text-lg font-extrabold tracking-tight">Your Cart</div>
                <ul className="divide-y divide-neutral-100">
                {items.length === 0 && (
                    <li className="grid place-items-center gap-2 p-10 text-center text-neutral-500">
                    <div className="text-3xl">🛒</div>
                    <p className="text-sm">Your cart is empty. Add something tasty! 🌮</p>
                    </li>
                )}

                {items.map((i) => (
                    <li key={i.id} className="flex items-center gap-4 p-4">
                    <div className="flex-1">
                        <div className="font-bold tracking-tight text-neutral-900">{i.name}</div>
                        {Boolean(i.notes) && (
                        <div className="text-sm text-neutral-600">{i.notes}</div>
                        )}
                    </div>

                    <label className="sr-only" htmlFor={`qty-${i.id}`}>Quantity</label>
                    <input
                        id={`qty-${i.id}`}
                        type="number"
                        min={1}
                        value={i.qty}
                        onChange={(e) => updateQty(i.id, Number(e.target.value || 1))}
                        className="w-20 rounded-xl border-2 border-neutral-300 bg-white px-3 py-2 text-center text-neutral-900 outline-none transition focus:border-amber-400 focus:ring-4 focus:ring-amber-400/20"
                    />

                    <div className="w-28 text-right">
                        <span className="bg-gradient-to-br from-amber-500 to-amber-300 bg-clip-text text-lg font-extrabold text-transparent">
                        ${(Number(i.unit_price) * i.qty).toFixed(2)}
                        </span>
                    </div>

                    <DeleteBtn
                      onClick={() => removeItem(i.id)}
                      title="Remove item"
                      className="shrink-0"
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
                <span>{totals.fmt(totals.subtotal)}</span>
                </div>
                <div className="mb-2 flex items-center justify-between text-sm text-neutral-700">
                <span>Tax</span>
                <span>{totals.fmt(totals.tax)}</span>
                </div>
                <div className="mt-2 border-t border-amber-200 pt-3">
                <div className="flex items-center justify-between text-xl font-extrabold text-neutral-900">
                    <span>Total</span>
                    <span>{totals.fmt(totals.total)}</span>
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
