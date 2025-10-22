import React, { useEffect, useMemo, useState } from 'react'
import { api, fmtCurrency } from '../lib/api'
import StatCard from '../components/StatCard'

const STATUS_LABELS = {
  in_progress: 'In Progress',
  ready_for_pickup: 'Ready for Pickup',
  out_for_delivery: 'Out for Delivery',
  completed: 'Completed',
  canceled: 'Canceled',
  pending: 'Pending',
  failed: 'Payment Failed',
}

const STATUS_ORDER = ['in_progress', 'ready_for_pickup', 'out_for_delivery', 'completed', 'canceled']
const EXTRA_STATUSES = ['pending', 'failed']

function StatusBadge({ status }) {
  const label = STATUS_LABELS[status] || status
  const colorMap = {
    in_progress: 'bg-amber-100 text-amber-800',
    ready_for_pickup: 'bg-blue-100 text-blue-800',
    out_for_delivery: 'bg-indigo-100 text-indigo-800',
    completed: 'bg-emerald-100 text-emerald-700',
    canceled: 'bg-rose-100 text-rose-700',
    pending: 'bg-amber-100 text-amber-800',
    failed: 'bg-rose-100 text-rose-700',
  }
  return (
    <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${colorMap[status] || 'bg-slate-100 text-slate-700'}`}>
      {label}
    </span>
  )
}

export default function OrdersDashboard(){
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState('in_progress')
  const [updatingId, setUpdatingId] = useState(null)

  useEffect(() => {
    let active = true
    async function fetchOrders() {
      setLoading(true)
      setError('')
      try {
        const payload = filter ? { status: filter } : {}
        const data = await api.adminOrders(payload)
        if (active) setOrders(Array.isArray(data) ? data : [])
      } catch (err) {
        if (active) setError(err.message || 'Failed to load orders')
      } finally {
        if (active) setLoading(false)
      }
    }
    fetchOrders()
    return () => { active = false }
  }, [filter])

  const stats = useMemo(() => {
    const counts = STATUS_ORDER.reduce((acc, status) => ({ ...acc, [status]: 0 }), {})
    for (const order of orders) {
      const key = order.status
      if (key in counts) counts[key] += 1
    }
    return counts
  }, [orders])

  const updateStatus = async (orderId, nextStatus) => {
    try {
      setUpdatingId(orderId)
      await api.adminUpdateOrderStatus(orderId, nextStatus)
      setOrders((prev) =>
        prev.map((order) =>
          order.id === orderId ? { ...order, status: nextStatus } : order
        )
      )
    } catch (err) {
      setError(err.message || 'Unable to update order status')
    } finally {
      setUpdatingId(null)
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {STATUS_ORDER.slice(0, 4).map((status) => (
          <StatCard
            key={status}
            label={STATUS_LABELS[status]}
            value={stats[status] ?? 0}
            hint={status === filter ? 'Showing below' : undefined}
          />
        ))}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Order queue</h2>
          <p className="text-xs text-slate-500">Update order statuses and monitor the kitchen workload.</p>
        </div>
        <div className="flex items-center gap-2">
          <label htmlFor="status-filter" className="text-xs font-medium text-slate-600">Filter</label>
          <select
            id="status-filter"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-400"
          >
            <option value="">All statuses</option>
            {STATUS_ORDER.map((status) => (
              <option key={status} value={status}>{STATUS_LABELS[status]}</option>
            ))}
            {EXTRA_STATUSES.map((status) => (
              <option key={status} value={status}>{STATUS_LABELS[status]}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow">
        {loading ? (
          <div className="p-6 text-sm text-slate-600">Loading orders…</div>
        ) : error ? (
          <div className="p-6 text-sm text-rose-600">{error}</div>
        ) : orders.length === 0 ? (
          <div className="p-6 text-sm text-slate-600">No orders found for this filter.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                <tr>
                  <th className="px-4 py-3">Order</th>
                  <th className="px-4 py-3">Customer</th>
                  <th className="px-4 py-3">Items</th>
                  <th className="px-4 py-3">Total</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Update</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {orders.map((order) => (
                  <tr key={order.id} className="hover:bg-amber-50/30">
                    <td className="px-4 py-3 align-top">
                      <div className="font-semibold text-slate-900">#{order.id}</div>
                      <div className="text-xs text-slate-500">{order.placed_at ? new Date(order.placed_at).toLocaleString() : '—'}</div>
                      <div className="text-xs text-slate-500 capitalize">{order.fulfillment}</div>
                    </td>
                    <td className="px-4 py-3 align-top">
                      {order.customer?.email ? (
                        <>
                          <div className="font-medium text-slate-800">{order.customer.name || 'Account user'}</div>
                          <div className="text-xs text-slate-500">{order.customer.email}</div>
                        </>
                      ) : (
                        <>
                          <div className="font-medium text-slate-800">Guest checkout</div>
                          <div className="text-xs text-slate-500 break-all">Session: {order.customer?.guest_session_id || '—'}</div>
                        </>
                      )}
                    </td>
                    <td className="px-4 py-3 align-top">
                      <ul className="space-y-1">
                        {(order.items || []).map((item, idx) => (
                          <li key={idx} className="text-xs text-slate-600">
                            <span className="font-medium text-slate-800">{item.qty}× {item.name}</span>
                            <span className="ml-1 text-slate-500">{fmtCurrency(item.line_total)}</span>
                          </li>
                        ))}
                      </ul>
                    </td>
                    <td className="px-4 py-3 align-top">
                      <div className="text-sm font-semibold text-slate-900">{fmtCurrency(order.grand_total)}</div>
                    </td>
                    <td className="px-4 py-3 align-top">
                      <StatusBadge status={order.status} />
                    </td>
                    <td className="px-4 py-3 align-top">
                      <div className="flex flex-wrap gap-2">
                        {STATUS_ORDER.filter((status) => status !== order.status).map((status) => (
                          <button
                            key={status}
                            type="button"
                            onClick={() => updateStatus(order.id, status)}
                            disabled={updatingId === order.id}
                            className="rounded-lg border border-slate-300 px-3 py-1 text-xs font-semibold text-slate-700 transition hover:border-amber-300 hover:text-amber-600 disabled:opacity-40"
                          >
                            {STATUS_LABELS[status]}
                          </button>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
