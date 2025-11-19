import React, { useMemo, useState } from 'react'

const initialOrders = [
  {
    id: '#ORD-1847',
    customer: 'Sarah Johnson',
    status: 'new',
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
    status: 'new',
    type: 'pickup',
    items: ['Carne Asada Fries', 'Horchata'],
    total: 18,
    placed: 'just now',
    promiseTime: '12:25 PM',
  },
]

const statusColumns = [
  {
    id: 'new',
    label: 'New',
    description: 'Awaiting confirmation',
    accent: 'amber',
  },
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
  amber: 'bg-amber-100 text-amber-800 border-amber-200',
  blue: 'bg-blue-100 text-blue-800 border-blue-200',
  emerald: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  slate: 'bg-slate-100 text-slate-800 border-slate-200',
}

const ringClass = {
  amber: 'ring-1 ring-amber-200',
  blue: 'ring-1 ring-blue-200',
  emerald: 'ring-1 ring-emerald-200',
  slate: 'ring-1 ring-slate-200',
}

const orderTypeLabel = {
  pickup: 'Pickup',
  delivery: 'Delivery',
  dine_in: 'Dine-in',
}

const nextStep = {
  new: { next: 'in_progress', label: 'Start order', className: 'bg-blue-600 text-white hover:bg-blue-500' },
  in_progress: { next: 'completed', label: 'Mark ready', className: 'bg-emerald-600 text-white hover:bg-emerald-500' },
  completed: { next: 'fulfilled', label: 'Hand off', className: 'bg-slate-900 text-white hover:bg-slate-800' },
  fulfilled: { next: 'completed', label: 'Reopen', className: 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50' },
}

export default function OrdersDashboard() {
  const [orders, setOrders] = useState(initialOrders)
  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState('all')

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
    const open = orders.filter((order) => ['new', 'in_progress'].includes(order.status)).length
    const inProgress = orders.filter((order) => order.status === 'in_progress').length
    const ready = orders.filter((order) => order.status === 'completed').length
    const fulfilled = orders.filter((order) => order.status === 'fulfilled').length

    return { open, inProgress, ready, fulfilled }
  }, [orders])

  const advanceOrder = (id, status) => {
    setOrders((prev) => prev.map((order) => (order.id === id ? { ...order, status } : order)))
  }

  return (
    <div className="space-y-6">
      <header className="grid gap-3 md:grid-cols-4">
        <SummaryCard label="Active" value={metrics.open} hint="New + in progress" accent="blue" />
        <SummaryCard label="In kitchen" value={metrics.inProgress} hint="Currently being prepared" accent="amber" />
        <SummaryCard label="Ready" value={metrics.ready} hint="Waiting for pickup / delivery" accent="emerald" />
        <SummaryCard label="Delivered / picked up" value={metrics.fulfilled} hint="Completed today" accent="slate" />
      </header>

      <section className="bg-white shadow rounded-2xl p-4 lg:p-6 border border-slate-100">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm text-slate-500">Orders</p>
            <h2 className="text-xl font-semibold text-slate-900">Live queue</h2>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative sm:w-72">
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by ID or customer"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-200"
              />
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">⌘ K</span>
            </div>
            <div className="flex rounded-xl border border-slate-200 bg-slate-50 p-1 text-sm font-medium text-slate-600">
              {['all', 'pickup', 'delivery', 'dine_in'].map((type) => (
                <button
                  key={type}
                  onClick={() => setFilterType(type)}
                  className={`px-3 py-2 rounded-lg transition ${
                    filterType === type ? 'bg-white shadow-sm text-slate-900' : 'hover:bg-white/70'
                  }`}
                >
                  {type === 'all' ? 'All' : orderTypeLabel[type]}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-4">
        {groupedOrders.map((column) => (
          <div
            key={column.id}
            className={`bg-white rounded-2xl shadow border border-slate-100 p-4 lg:p-5 flex flex-col ${ringClass[column.accent]}`}
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-500">{column.label}</p>
                <p className="text-sm text-slate-500">{column.description}</p>
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
                  <article key={order.id} className="rounded-2xl border border-slate-100 bg-slate-50/60 p-4 shadow-sm">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-xs text-slate-500">{order.placed}</p>
                        <h3 className="text-base font-semibold text-slate-900">{order.id}</h3>
                        <p className="text-sm text-slate-700">{order.customer}</p>
                      </div>
                      <div className="text-right space-y-1">
                        <span className="inline-flex items-center rounded-full bg-white px-3 py-1 text-xs font-medium text-slate-700 border border-slate-200">
                          {orderTypeLabel[order.type]}
                        </span>
                        <div className="text-lg font-semibold text-slate-900">${order.total.toFixed(2)}</div>
                      </div>
                    </div>

                    <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-600">
                      <span className="rounded-full bg-white px-3 py-1 border border-slate-200">Due {order.promiseTime}</span>
                      {order.courier && (
                        <span className="rounded-full bg-white px-3 py-1 border border-slate-200">Driver: {order.courier}</span>
                      )}
                      {order.note && (
                        <span className="rounded-full bg-amber-50 px-3 py-1 border border-amber-200 text-amber-800">{order.note}</span>
                      )}
                    </div>

                    <ul className="mt-3 space-y-1 text-sm text-slate-700">
                      {order.items.map((item) => (
                        <li key={item} className="flex items-center gap-2">
                          <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
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
                        <span className="flex-1 text-xs text-slate-500">Completed</span>
                      )}
                      <button className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
                        Details
                      </button>
                    </div>
                  </article>
                ))
              ) : (
                <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-sm text-slate-500">
                  No orders in this stage
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function SummaryCard({ label, value, hint, accent }) {
  const border = {
    blue: 'border-blue-200 bg-blue-50/60 text-blue-900',
    amber: 'border-amber-200 bg-amber-50/60 text-amber-900',
    emerald: 'border-emerald-200 bg-emerald-50/60 text-emerald-900',
    slate: 'border-slate-200 bg-slate-50 text-slate-900',
  }[accent]

  return (
    <div className={`rounded-2xl border shadow-sm p-4 ${border}`}>
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">{label}</p>
      <p className="text-3xl font-semibold leading-tight mt-1">{value}</p>
      <p className="text-sm text-slate-600 mt-1">{hint}</p>
    </div>
  )
}
