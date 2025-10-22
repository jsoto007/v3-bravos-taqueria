import React, { useEffect, useMemo, useState } from 'react'
import { api } from '../lib/api'
import OrderCard from '../components/OrderCard'
import FadeIn from '../utils/FadeIn'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'
import { useSearchParams } from 'react-router-dom'

export default function Orders(){
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const { user } = useAuth()
  const { sessionId } = useCart()
  const [searchParams] = useSearchParams()
  const checkoutSessionParam = searchParams.get('session_id')
  const guestSessionParam = searchParams.get('guest_session_id') || ''

  const guestToken = useMemo(() => guestSessionParam || sessionId || '', [guestSessionParam, sessionId])
  const viewingAsGuest = !user && Boolean(guestToken)

  useEffect(()=>{
    (async()=>{
      const token = user ? undefined : (guestToken || undefined)
      if (!user && !token) { setLoading(false); return }
      try { setOrders(await api.myOrders(token)) }
      catch(e){ setError(e.message) }
      finally { setLoading(false) }
    })()
  }, [user, guestToken])
  

  if (!user && !guestToken) {
    return (
      <div className="mt-20">
        <div className="rounded-3xl border border-neutral-200 bg-amber-50 p-8 text-neutral-800 shadow-sm">
          <h1 className="text-2xl font-extrabold tracking-tight text-neutral-900">Please log in</h1>
          <p className="mt-2 text-sm text-neutral-700">
            If you don’t have an account, create one to unlock a better ordering experience.
          </p>
          <ul className="mt-4 list-disc pl-5 space-y-2 text-sm text-neutral-800">
            <li>Track your orders in real time</li>
            <li>Reorder favorites in one tap</li>
            <li>Save delivery details for faster checkout</li>
            <li>Exclusive promos and rewards</li>
            <li>View receipts and order history</li>
          </ul>
          <div className="mt-6 flex flex-col sm:flex-row gap-3">
            <a
              href="/auth/login"
              className="inline-flex items-center justify-center rounded-2xl border border-amber-400 px-5 py-2.5 font-semibold text-amber-600 hover:bg-amber-400 hover:text-black transition"
            >
              Log in
            </a>
            <a
              href="/auth/signup"
              className="inline-flex items-center justify-center rounded-2xl bg-green-600 px-5 py-2.5 font-bold text-white transition hover:scale-[1.02] hover:shadow-[0_8px_30px_rgba(22,163,74,0.35)]"
            >
              Create account
            </a>
            <a
              href="/menu"
              className="inline-flex items-center justify-center rounded-2xl px-5 py-2.5 text-sm text-neutral-700 hover:text-neutral-900 underline underline-offset-4"
            >
              Continue as guest →
            </a>
          </div>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="rounded-3xl border border-neutral-200 bg-white p-6 text-neutral-700 shadow-sm">
        Loading orders…
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-rose-800">
        {error}
      </div>
    )
  }

  return (
    <div className="mt-20 space-y-6">
        <FadeIn>
            <div>
                <h1 className="text-2xl font-extrabold tracking-tight text-neutral-900">Your Orders</h1>
                <p className="mt-1 text-sm text-neutral-600">
                  {viewingAsGuest
                    ? 'Thanks for ordering! Save this page to track your order status.'
                    : 'Track your recent orders and reorder your favorites.'}
                </p>
                {checkoutSessionParam && (
                  <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                    Payment confirmed! We’re getting started on your order. Refresh this page to see live status updates.
                  </div>
                )}
            </div>

            {orders.length === 0 ? (
                <div className="grid place-items-center rounded-3xl border border-neutral-200 bg-amber-50 p-10 text-center text-neutral-700">
                <div className="mb-2 text-3xl">📦</div>
                <p className="text-sm">No orders yet. Start your first order and we’ll list it here.</p>
                <a
                    href="/menu"
                    className="mt-4 inline-block rounded-2xl bg-green-600 px-5 py-2.5 font-bold text-white transition hover:scale-[1.02] hover:shadow-[0_8px_30px_rgba(22,163,74,0.35)]"
                >
                    Browse Menu
                </a>
                </div>
            ) : (
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {orders.map((o) => (
                    <OrderCard key={o.id} order={o} />
                ))}
                </div>
            )}
        </FadeIn>
    </div>
  )
}
