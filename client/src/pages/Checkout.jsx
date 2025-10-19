import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import { api } from '../lib/api'

export default function Checkout(){
  const { cartId, totals } = useCart()
  const [fulfillment, setFulfillment] = useState('pickup')
  const [tip, setTip] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const tipPercents = [0, 0.1, 0.15, 0.2];
  const setTipPercent = (p) => {
    const val = Math.max(0, Math.round((totals.subtotal * p) * 100) / 100);
    setTip(val.toFixed(2));
  };
  const grandTotal = totals.tax + totals.subtotal + Number(tip || 0);

  const placeOrder = async ()=>{
    try {
      setLoading(true); setError('')
      const res = await api.checkout(cartId, { fulfillment, tip: Number(tip||0) })
      navigate(`/orders`)
    } catch (e) { setError(e.message) } finally { setLoading(false) }
  }

  return (
    <section className="min-h-[calc(100dvh-4rem)] bg-white py-8 px-4">
      <div className="max-w-2xl mx-auto bg-amber-50 text-slate-900 rounded-2xl shadow-lg p-6 md:p-8">
        <header className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-2xl font-semibold text-amber-400">Checkout</h2>
            <p className="mt-1 text-sm text-slate-700">You’re almost there—review your details and place your order with confidence.</p>
          </div>
          <div className="hidden sm:flex items-center gap-2 text-xs px-2 py-1 rounded-full border border-green-200 bg-white">
            <span role="img" aria-label="secure">🔒</span>
            <span className="text-green-700">Secure &amp; private</span>
          </div>
        </header>

        <div className="mt-6 grid sm:grid-cols-2 gap-4">
          <label className="block">
            <span className="text-sm text-slate-700">Fulfillment</span>
            <select
              value={fulfillment}
              onChange={e => setFulfillment(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400"
            >
              <option value="pickup">Pickup</option>
              <option value="delivery">Delivery</option>
            </select>
            <span className="mt-1 block text-xs text-slate-600">
              {fulfillment === 'pickup' ? 'We’ll text you when it’s ready.' : 'Add your delivery details on the next step.'}
            </span>
          </label>

          <div className="block">
            <label className="block">
              <span className="text-sm text-slate-700">Tip</span>
              <input
                type="number"
                min={0}
                value={tip}
                onChange={e => setTip(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400"
              />
            </label>
            <div className="mt-2 grid grid-cols-4 gap-2">
              {tipPercents.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setTipPercent(p)}
                  className={`rounded-lg border px-2 py-1.5 text-sm ${
                    Number(tip || 0) === Math.round((totals.subtotal * p) * 100) / 100
                      ? 'border-amber-400 bg-white font-semibold'
                      : 'border-slate-300 bg-white hover:border-amber-300'
                  }`}
                  aria-label={`Set tip to ${Math.round(p * 100)} percent`}
                >
                  {p === 0 ? 'No tip' : `${Math.round(p * 100)}%`}
                </button>
              ))}
            </div>
            <span className="mt-1 block text-xs text-slate-600">Tips go 100% to the team. Thank you! 🫶</span>
          </div>
        </div>

        {error && (
          <div
            className="mt-4 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800"
            aria-live="polite"
            role="alert"
          >
            {error}
          </div>
        )}

        <div className="mt-6 border-t border-slate-200 pt-4">
          <div className="flex justify-between text-sm text-slate-700">
            <span>Subtotal</span>
            <span className="text-slate-900 font-medium">{totals.fmt(totals.subtotal)}</span>
          </div>
          <div className="mt-1 flex justify-between text-sm text-slate-700">
            <span>Tax</span>
            <span className="text-slate-900 font-medium">{totals.fmt(totals.tax)}</span>
          </div>
          <div className="mt-1 flex justify-between text-sm text-slate-700">
            <span>Tip</span>
            <span className="text-slate-900 font-medium">{totals.fmt(tip)}</span>
          </div>

          <div className="mt-3 pt-3 flex justify-between items-baseline border-t border-slate-200">
            <span className="font-semibold text-slate-900">Grand Total</span>
            <span className="font-semibold text-slate-900" aria-live="polite">
              {totals.fmt(grandTotal)}
            </span>
          </div>

          <div className="mt-6 flex items-center justify-between gap-3">
            <div className="hidden sm:flex items-center gap-2 text-xs text-slate-600">
              <span role="img" aria-label="guarantee">✅</span>
              <span>No surprise fees at checkout.</span>
            </div>
            <button
              disabled={loading}
              onClick={placeOrder}
              className="flex-1 rounded-lg bg-amber-400 text-black font-semibold py-3 shadow hover:brightness-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label={`Place order, total ${totals.fmt(grandTotal)}`}
            >
              {loading ? 'Placing…' : `Place Order • ${totals.fmt(grandTotal)}`}
            </button>
          </div>
        </div>

        <div className="mt-4 flex sm:hidden items-center justify-center gap-2 text-[11px] text-slate-600">
          <span role="img" aria-label="secure">🔒</span>
          <span>Secure &amp; private • No surprise fees</span>
        </div>
      </div>
    </section>
  )
}
