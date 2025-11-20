import React, { useCallback, useMemo, useState } from 'react'

const initialOrders = [
  {
    id: '#ORD-1847',
    customer: 'Sarah Johnson',
    status: 'in_progress',
    type: 'pickup',
    items: ['Chicken Taco x3', 'Chips & Guac'],
    total: 19.5,
    placed: '10 mins ago',
    promiseTime: '12:15 PM',
    note: 'No cilantro',
  },
  {
    id: '#ORD-1846',
    customer: 'Michael Chen',
    status: 'in_progress',
    type: 'delivery',
    items: ['Beef Burrito x2', 'Horchata x2', 'Churros'],
    total: 31,
    placed: '25 mins ago',
    promiseTime: '12:05 PM',
    courier: 'Carlos',
  },
  {
    id: '#ORD-1845',
    customer: 'Emma Rodriguez',
    status: 'completed',
    type: 'pickup',
    items: ['Fish Taco x4', 'Mexican Rice x2', 'Refried Beans x2'],
    total: 34,
    placed: '35 mins ago',
    promiseTime: '11:55 AM',
  },
  {
    id: '#ORD-1844',
    customer: 'James Wilson',
    status: 'fulfilled',
    type: 'pickup',
    items: ['Quesadilla x2', 'Jarritos x2'],
    total: 20,
    placed: '1 hour ago',
    promiseTime: '11:20 AM',
    fulfilledAt: '11:18 AM',
  },
  {
    id: '#ORD-1843',
    customer: 'Olivia Martinez',
    status: 'fulfilled',
    type: 'delivery',
    items: ['Carnitas Plate', 'Street Corn x2', 'Margarita (NA)'],
    total: 26.5,
    placed: '1.5 hours ago',
    promiseTime: '11:10 AM',
    fulfilledAt: '11:06 AM',
  },
  {
    id: '#ORD-1842',
    customer: 'David Lee',
    status: 'completed',
    type: 'dine_in',
    items: ['Enchiladas x2', 'Sopapillas'],
    total: 26.5,
    placed: '2 hours ago',
    promiseTime: '11:00 AM',
  },
  {
    id: '#ORD-1841',
    customer: 'Sophie Anderson',
    status: 'in_progress',
    type: 'delivery',
    items: ['Veggie Burrito Bowl'],
    total: 9,
    placed: '3 hours ago',
    promiseTime: '11:20 AM',
    courier: 'Luis',
    note: 'Leave at front desk',
  },
  {
    id: '#ORD-1840',
    customer: 'Marcus Bell',
    status: 'in_progress',
    type: 'pickup',
    items: ['Carne Asada Fries', 'Horchata'],
    total: 18,
    placed: 'just now',
    promiseTime: '12:25 PM',
  },
]

const statusColumns = [
  {
    id: 'in_progress',
    label: 'In Progress',
    description: 'In the kitchen',
    accent: 'blue',
  },
  {
    id: 'completed',
    label: 'Completed',
    description: 'Ready to hand off',
    accent: 'emerald',
  },
  {
    id: 'fulfilled',
    label: 'Delivered / Picked Up',
    description: 'Customer received',
    accent: 'slate',
  },
]

const badgeClass = {
  amber: 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/30 dark:text-amber-100 dark:border-amber-700',
  blue: 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-100 dark:border-blue-700',
  emerald: 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-100 dark:border-emerald-700',
  slate: 'bg-slate-100 text-slate-800 border-slate-200 dark:bg-slate-900/40 dark:text-slate-100 dark:border-slate-700',
}

const ringClass = {
  amber: 'ring-1 ring-amber-200 dark:ring-amber-800/70',
  blue: 'ring-1 ring-blue-200 dark:ring-blue-800/70',
  emerald: 'ring-1 ring-emerald-200 dark:ring-emerald-800/70',
  slate: 'ring-1 ring-slate-200 dark:ring-slate-700/80',
}

const orderTypeLabel = {
  pickup: 'Pickup',
  delivery: 'Delivery',
  dine_in: 'Dine-in',
}

const nextStep = {
  in_progress: {
    next: 'completed',
    label: 'Mark ready',
    className:
      'bg-emerald-600 text-white shadow-sm hover:bg-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200 dark:bg-emerald-500 dark:hover:bg-emerald-400 dark:focus:ring-emerald-800',
  },
  completed: {
    next: 'fulfilled',
    label: 'Hand off',
    className:
      'bg-slate-900 text-white shadow-sm hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-200 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200 dark:focus:ring-slate-700',
  },
  fulfilled: {
    next: 'completed',
    label: 'Reopen',
    className:
      'bg-white text-slate-700 border border-slate-200 shadow-sm hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-200 dark:bg-slate-900 dark:text-slate-100 dark:border-slate-700 dark:hover:bg-slate-800 dark:focus:ring-slate-700',
  },
}

export default function OrdersDashboard() {
  const [orders, setOrders] = useState(initialOrders)
  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState('all')
  const [activeOrder, setActiveOrder] = useState(null)
  const closeModal = useCallback(() => setActiveOrder(null), [])

  const filteredOrders = useMemo(() => {
    const term = search.trim().toLowerCase()
    return orders.filter((order) => {
      const matchesType = filterType === 'all' || order.type === filterType
      const matchesSearch =
        !term || order.id.toLowerCase().includes(term) || order.customer.toLowerCase().includes(term)
      return matchesType && matchesSearch
    })
  }, [orders, filterType, search])

  const groupedOrders = useMemo(
    () =>
      statusColumns.map((column) => ({
        ...column,
        orders: filteredOrders.filter((order) => order.status === column.id),
      })),
    [filteredOrders]
  )

  const metrics = useMemo(() => {
    const inProgress = orders.filter((order) => order.status === 'in_progress').length
    const ready = orders.filter((order) => order.status === 'completed').length
    const fulfilled = orders.filter((order) => order.status === 'fulfilled').length
    const active = inProgress + ready

    return { active, inProgress, ready, fulfilled }
  }, [orders])

  const advanceOrder = (id, status) => {
    setOrders((prev) => prev.map((order) => (order.id === id ? { ...order, status } : order)))
  }

  return (
    <div className="space-y-6 text-slate-900 dark:text-slate-100">
      <header className="grid gap-3 md:grid-cols-4">
        <SummaryCard label="Active" value={metrics.active} hint="In progress + ready" accent="blue" />
        <SummaryCard label="In kitchen" value={metrics.inProgress} hint="Currently being prepared" accent="amber" />
        <SummaryCard label="Ready" value={metrics.ready} hint="Waiting for pickup / delivery" accent="emerald" />
        <SummaryCard label="Delivered / picked up" value={metrics.fulfilled} hint="Completed today" accent="slate" />
      </header>

      <section className="bg-white/90 backdrop-blur rounded-2xl p-4 lg:p-6 border border-slate-200 shadow-sm dark:border-slate-800 dark:bg-slate-900/80">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm text-slate-500 dark:text-slate-400">Orders</p>
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Live queue</h2>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative sm:w-72">
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by ID or customer"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:ring-2 focus:ring-blue-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:ring-blue-700"
              />
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">⌘ K</span>
            </div>
            <div className="flex rounded-xl border border-slate-200 bg-slate-50 p-1 text-sm font-medium text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200">
              {['all', 'pickup', 'delivery', 'dine_in'].map((type) => (
                <button
                  key={type}
                  onClick={() => setFilterType(type)}
                  className={`px-3 py-2 rounded-lg transition ${
                    filterType === type
                      ? 'bg-white shadow-sm text-slate-900 dark:bg-slate-800 dark:text-white'
                      : 'hover:bg-white/70 dark:hover:bg-slate-800/70'
                  }`}
                >
                  {type === 'all' ? 'All' : orderTypeLabel[type]}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-3">
        {groupedOrders.map((column) => (
          <div
            key={column.id}
            className={`bg-white/90 rounded-2xl shadow-sm border border-slate-200 p-4 lg:p-5 flex flex-col dark:border-slate-800 dark:bg-slate-900/80 ${ringClass[column.accent]}`}
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">{column.label}</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">{column.description}</p>
              </div>
              <span
                className={`inline-flex h-9 w-9 items-center justify-center rounded-full border text-sm font-semibold ${
                  badgeClass[column.accent]
                }`}
              >
                {column.orders.length}
              </span>
            </div>

            <div className="mt-4 space-y-3 overflow-y-auto pr-1" style={{ maxHeight: '640px' }}>
              {column.orders.length ? (
                column.orders.map((order) => (
                  <article key={order.id} className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-slate-800 dark:bg-slate-800/80">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-xs text-slate-500 dark:text-slate-400">{order.placed}</p>
                        <h3 className="text-base font-semibold text-slate-900 dark:text-white">{order.id}</h3>
                        <p className="text-sm text-slate-700 dark:text-slate-300">{order.customer}</p>
                      </div>
                      <div className="text-right space-y-1">
                        <span className="inline-flex items-center rounded-full bg-white px-3 py-1 text-xs font-medium text-slate-700 border border-slate-200 dark:bg-slate-900 dark:text-slate-200 dark:border-slate-700">
                          {orderTypeLabel[order.type]}
                        </span>
                        <div className="text-lg font-semibold text-slate-900 dark:text-white">${order.total.toFixed(2)}</div>
                      </div>
                    </div>

                    <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
                      <span className="rounded-full bg-white px-3 py-1 border border-slate-200 dark:bg-slate-900 dark:border-slate-700">Due {order.promiseTime}</span>
                      {order.courier && (
                        <span className="rounded-full bg-white px-3 py-1 border border-slate-200 dark:bg-slate-900 dark:border-slate-700">Driver: {order.courier}</span>
                      )}
                      {order.note && (
                        <span className="rounded-full bg-amber-50 px-3 py-1 border border-amber-200 text-amber-800 dark:bg-amber-900/40 dark:text-amber-100 dark:border-amber-800">{order.note}</span>
                      )}
                    </div>

                    <ul className="mt-3 space-y-1 text-sm text-slate-700 dark:text-slate-200">
                      {order.items.map((item) => (
                        <li key={item} className="flex items-center gap-2">
                          <span className="h-1.5 w-1.5 rounded-full bg-slate-400 dark:bg-slate-500" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>

                    <div className="mt-4 flex items-center gap-2">
                      {nextStep[order.status] ? (
                        <button
                          onClick={() => advanceOrder(order.id, nextStep[order.status].next)}
                          className={`flex-1 rounded-xl px-3 py-2 text-sm font-semibold transition ${nextStep[order.status].className}`}
                        >
                          {nextStep[order.status].label}
                        </button>
                      ) : (
                        <span className="flex-1 text-xs text-slate-500 dark:text-slate-400">Completed</span>
                      )}
                      <button
                        onClick={() => setActiveOrder(order)}
                        className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800 dark:focus:ring-slate-700"
                      >
                        Details
                      </button>
                    </div>
                  </article>
                ))
              ) : (
                <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-400">
                  No orders in this stage
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <OrderDetailsModal order={activeOrder} onClose={closeModal} />
    </div>
  )
}

function SummaryCard({ label, value, hint, accent }) {
  const border = {
    blue: 'border-blue-200 bg-blue-50/80 text-blue-900 shadow-blue-100/60 dark:border-blue-800 dark:bg-blue-900/20 dark:text-blue-50',
    amber: 'border-amber-200 bg-amber-50/80 text-amber-900 shadow-amber-100/60 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-50',
    emerald: 'border-emerald-200 bg-emerald-50/80 text-emerald-900 shadow-emerald-100/60 dark:border-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-50',
    slate: 'border-slate-200 bg-slate-50 text-slate-900 shadow-slate-100/60 dark:border-slate-700 dark:bg-slate-900/30 dark:text-slate-100',
  }[accent]

  return (
    <div className={`rounded-2xl border shadow-sm p-4 ${border}`}>
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-400">{label}</p>
      <p className="text-3xl font-semibold leading-tight mt-1">{value}</p>
      <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">{hint}</p>
    </div>
  )
}

function OrderDetailsModal({ order, onClose }) {
  const statusLabel = {
    in_progress: 'In Progress',
    completed: 'Completed',
    fulfilled: 'Delivered / Picked Up',
  }

  React.useEffect(() => {
    if (!order) return
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [order, onClose])

  if (!order) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-slate-900/60 p-4 pt-10 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="order-details-title"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-slate-200 transition-all dark:bg-slate-900 dark:ring-slate-800"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between border-b border-slate-200 px-5 py-4 dark:border-slate-800">
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Order</p>
            <h3 id="order-details-title" className="text-lg font-semibold text-slate-900 dark:text-white">
              {order.id} · {order.customer}
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">{order.placed}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close order details"
            className="rounded-full p-2 text-slate-500 transition hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-200 dark:text-slate-300 dark:hover:bg-slate-800 dark:focus:ring-slate-700"
          >
            <span aria-hidden>✕</span>
          </button>
        </div>

        <div className="max-h-[80vh] overflow-y-auto px-5 py-4 sm:px-6 sm:py-5 space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-200">
              <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Status</p>
              <p className="mt-1 text-base font-semibold text-slate-900 dark:text-white">{statusLabel[order.status]}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">Due {order.promiseTime}</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-200">
              <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Type</p>
              <p className="mt-1 text-base font-semibold text-slate-900 dark:text-white">{orderTypeLabel[order.type]}</p>
              {order.courier && <p className="text-xs text-slate-500 dark:text-slate-400">Driver: {order.courier}</p>}
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-700 shadow-sm dark:border-slate-800 dark:bg-slate-900/70 dark:text-slate-200">
              <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Payment</p>
              <p className="mt-1 text-base font-semibold text-slate-900 dark:text-white">${order.total.toFixed(2)}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">Paid online</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-700 shadow-sm dark:border-slate-800 dark:bg-slate-900/70 dark:text-slate-200">
              <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Timestamps</p>
              <p className="mt-1 text-sm text-slate-700 dark:text-slate-200">Promised: {order.promiseTime}</p>
              {order.fulfilledAt && (
                <p className="text-sm text-slate-700 dark:text-slate-200">Fulfilled: {order.fulfilledAt}</p>
              )}
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900/70">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-slate-900 dark:text-white">Items</p>
              <span className="text-xs text-slate-500 dark:text-slate-400">{order.items.length} items</span>
            </div>
            <ul className="mt-3 space-y-2 text-sm text-slate-700 dark:text-slate-200">
              {order.items.map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <span className="mt-1 h-2 w-2 rounded-full bg-blue-400" aria-hidden />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {(order.note || order.customer) && (
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-200">
              <p className="text-sm font-semibold text-slate-900 dark:text-white">Customer</p>
              <p className="mt-1 text-sm text-slate-700 dark:text-slate-200">{order.customer}</p>
              {order.note && <p className="mt-2 text-sm text-amber-700 dark:text-amber-200">Note: {order.note}</p>}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
