import React from 'react'
import { fmtCurrency } from '../lib/api'

const STATUS_STYLES = {
  in_progress: 'bg-amber-100 text-amber-800 border border-amber-200',
  ready_for_pickup: 'bg-blue-100 text-blue-800 border border-blue-200',
  out_for_delivery: 'bg-indigo-100 text-indigo-800 border border-indigo-200',
  completed: 'bg-emerald-100 text-emerald-700 border border-emerald-200',
  canceled: 'bg-rose-100 text-rose-700 border border-rose-200',
  pending: 'bg-amber-100 text-amber-800 border border-amber-200',
  failed: 'bg-rose-100 text-rose-700 border border-rose-200',
}

const STATUS_LABELS = {
  in_progress: 'In Progress',
  ready_for_pickup: 'Ready for Pickup',
  out_for_delivery: 'Out for Delivery',
  completed: 'Completed',
  canceled: 'Canceled',
  pending: 'Pending',
  failed: 'Payment Failed',
}

export default function OrderCard({ order }){
  const d = order?.placed_at ? new Date(order.placed_at) : null
  const status = String(order?.status || '').toLowerCase()
  const pill = STATUS_STYLES[status] || 'bg-neutral-100 text-neutral-700 border border-neutral-200'
  const statusLabel = STATUS_LABELS[status] || order.status
  const detailsHref = order?.guest_session_id
    ? `/orders/${order.id}?guest_session_id=${encodeURIComponent(order.guest_session_id)}`
    : `/orders/${order.id}`

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
          {statusLabel}
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
          href={detailsHref}
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
