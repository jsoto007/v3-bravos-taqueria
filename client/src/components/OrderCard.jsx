import React from 'react'
import { fmtCurrency } from '../lib/api'

export default function OrderCard({ order }){
  const d = order.placed_at ? new Date(order.placed_at) : null
  return (
    <div className="bg-white rounded-2xl shadow p-4">
      <div className="flex items-center justify-between">
        <div className="font-semibold">Order #{order.id}</div>
        <span className="text-xs px-2 py-0.5 rounded bg-slate-100">{order.status}</span>
      </div>
      <div className="text-sm text-slate-500 mt-1">{d? d.toLocaleString(): '—'}</div>
      <div className="mt-2 font-semibold">Total: {fmtCurrency(order.grand_total)}</div>
    </div>
  )
}
