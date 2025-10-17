import React from 'react'
import { fmtCurrency } from '../lib/api'

const STATUS_STYLES = {
  pending:   'bg-amber-100 text-amber-800 border border-amber-200',
  preparing: 'bg-amber-100 text-amber-800 border border-amber-200',
  ready:     'bg-green-100 text-green-800 border border-green-200',
  completed: 'bg-green-50 text-green-700 border border-green-200',
  cancelled: 'bg-rose-50 text-rose-700 border border-rose-200',
}

export default function OrderCard({ order }){
  const d = order?.placed_at ? new Date(order.placed_at) : null
  const status = String(order?.status || '').toLowerCase()
  const pill = STATUS_STYLES[status] || 'bg-neutral-100 text-neutral-700 border border-neutral-200'

  const dateText = d
    ? d.toLocaleDateString(undefined, {
        year: 'numeric', month: 'short', day: 'numeric',
        hour: '2-digit', minute: '2-digit'
      })
    : '—'

  return (
    <div className="mt-10 rounded-3xl border border-neutral-200 bg-white p-5 text-neutral-900 shadow-sm transition hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-sm font-semibold tracking-tight text-neutral-600">Order</div>
          <div className="text-xl font-extrabold tracking-tight">#{order.id}</div>
        </div>
        <span className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide ${pill}`}>
          {order.status}
        </span>
      </div>

      <div className="mt-2 text-sm text-neutral-600">
        Placed on <span className="font-medium text-neutral-800">{dateText}</span>
      </div>

      <div className="mt-3 flex items-center justify-between">
        <div className="text-sm text-neutral-600">Total</div>
        <div className="bg-gradient-to-br from-amber-500 to-amber-300 bg-clip-text text-lg font-extrabold text-transparent">
          {fmtCurrency(order.grand_total)}
        </div>
      </div>

      <div className="mt-4 flex items-center gap-2">
        <a
          href={`/orders/${order.id}`}
          className="flex-1 rounded-2xl border border-neutral-300 bg-white px-4 py-2.5 text-center text-sm font-semibold text-neutral-800 transition hover:border-neutral-400 hover:bg-neutral-50"
        >
          Details
        </a>
        <a
          href={`/reorder/${order.id}`}
          className="flex-1 rounded-2xl bg-green-600 px-4 py-2.5 text-center text-sm font-bold text-white transition hover:scale-[1.02] hover:shadow-[0_8px_30px_rgba(22,163,74,0.35)]"
        >
          Reorder
        </a>
      </div>
    </div>
  )
}
