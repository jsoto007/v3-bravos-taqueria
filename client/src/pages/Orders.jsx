import React, { useEffect, useState } from 'react'
import { api } from '../lib/api'
import OrderCard from '../components/OrderCard'

export default function Orders(){
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(()=>{
    (async()=>{
      try { setOrders(await api.myOrders()) }
      catch(e){ setError(e.message) }
      finally { setLoading(false) }
    })()
  }, [])

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
    <div className="mt-10 space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-neutral-900">Your Orders</h1>
        <p className="mt-1 text-sm text-neutral-600">Track your recent orders and reorder your favorites.</p>
      </div>

      {orders.length === 0 ? (
        <div className="grid place-items-center rounded-3xl border border-neutral-200 bg-amber-50 p-10 text-center text-neutral-700">
          <div className="mb-2 text-3xl">📦</div>
          <p className="text-sm">No orders yet. Start your first order and we’ll list it here.</p>
          <a
            href="/#menu"
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
    </div>
  )
}
