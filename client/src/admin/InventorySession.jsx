import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { api } from '../lib/api'
import ToastStack from '../components/ui/ToastStack'

const FILTER_LABELS = {
  all: 'All',
  low_stock: 'Low stock',
  expiring: 'Expiring',
  active: 'Active',
  inactive: 'Inactive',
}

const genId = () => (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}`)

export default function InventorySession() {
  const { sessionId } = useParams()
  const [session, setSession] = useState(null)
  const [inventory, setInventory] = useState([])
  const [meta, setMeta] = useState({ units: [], suppliers: [] })
  const [filters, setFilters] = useState({ search: '', filter: 'all', unit: '' })
  const [counts, setCounts] = useState({})
  const [loading, setLoading] = useState(true)
  const [savingId, setSavingId] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [toasts, setToasts] = useState([])

  const addToast = (type, message) => {
    const id = genId()
    setToasts((prev) => [...prev, { id, type, message }])
    window.setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000)
  }

  const fetchSession = useCallback(async () => {
    try {
      const data = await api.adminInventoryAuditDetail(sessionId)
      setSession(data)
    } catch (err) {
      addToast('error', err.message || 'Unable to load session')
      setSession(null)
    }
  }, [sessionId])

  const fetchInventory = useCallback(async () => {
    setLoading(true)
    try {
      const response = await api.adminInventoryList(filters)
      setInventory(response.items || [])
      setMeta(response.meta || { units: [], suppliers: [] })
    } catch (err) {
      addToast('error', err.message || 'Unable to load items')
    } finally {
      setLoading(false)
    }
  }, [filters])

  useEffect(() => {
    fetchSession()
  }, [fetchSession])

  useEffect(() => {
    fetchInventory()
  }, [fetchInventory])

  useEffect(() => {
    setCounts((prev) => {
      const next = { ...prev }
      inventory.forEach((item) => {
        if (!next[item.id]) {
          next[item.id] = {
            qty: item.quantity?.toString() || '',
            unit: item.base_unit || meta.units?.[0]?.code || '',
            expiration_date: item.expiration_date || '',
            note: '',
          }
        }
      })
      return next
    })
  }, [inventory, meta.units])

  const filterButtons = useMemo(
    () =>
      Object.entries(FILTER_LABELS).map(([key, label]) => (
        <button
          key={key}
          onClick={() => setFilters((prev) => ({ ...prev, filter: key }))}
          className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide transition ${filters.filter === key ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900' : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'}`}
        >
          {label}
        </button>
      )),
    [filters.filter]
  )

  const recordCount = async (item) => {
    const form = counts[item.id] || {}
    if (!form.qty) {
      addToast('error', 'Enter a quantity to record')
      return
    }
    setSavingId(item.id)
    try {
      const response = await api.adminInventoryAuditAddItem(sessionId, {
        inventory_item_id: item.id,
        new_qty: form.qty,
        unit: form.unit || item.base_unit,
        expiration_date: form.expiration_date || undefined,
        note: form.note,
      })
      setSession(response.session)
      addToast('success', `${item.name} saved to session`)
      fetchInventory()
    } catch (err) {
      addToast('error', err.message || 'Unable to save count')
    } finally {
      setSavingId(null)
    }
  }

  const submitSession = async () => {
    if (!session) return
    setSubmitting(true)
    try {
      const updated = await api.adminInventoryAuditUpdate(session.id, { complete: true, note: session.note })
      setSession(updated)
      addToast('success', 'Inventory submitted')
    } catch (err) {
      addToast('error', err.message || 'Unable to submit inventory')
    } finally {
      setSubmitting(false)
    }
  }

  const sessionStatus = session?.completed_at ? 'Completed' : 'In progress'

  return (
    <div className="space-y-5">
      <ToastStack toasts={toasts} />
      <header className="rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-900/80">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="space-y-1">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">Inventory session</p>
            <h1 className="text-xl font-semibold text-slate-900 dark:text-white">Session #{sessionId}</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {session?.user?.name ? `Inventory taker: ${session.user.name}` : 'Inventory taker active'} — {sessionStatus}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              to="/admin/inventory"
              className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-200 dark:border-slate-700 dark:text-slate-100 dark:hover:bg-slate-800 dark:focus:ring-slate-700"
            >
              Back to dashboard
            </Link>
            <button
              onClick={submitSession}
              className="rounded-2xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-emerald-500 dark:text-slate-900 dark:hover:bg-emerald-400"
              disabled={submitting || session?.completed_at}
            >
              {session?.completed_at ? 'Submitted' : submitting ? 'Submitting…' : 'Submit inventory'}
            </button>
          </div>
        </div>
        {session && (
          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl bg-slate-50 px-3 py-2 text-sm text-slate-600 shadow-sm dark:bg-slate-800/80 dark:text-slate-200">
              <div className="text-[11px] uppercase tracking-wide text-slate-500 dark:text-slate-400">Status</div>
              <div className="font-semibold text-slate-900 dark:text-white">{sessionStatus}</div>
            </div>
            <div className="rounded-xl bg-slate-50 px-3 py-2 text-sm text-slate-600 shadow-sm dark:bg-slate-800/80 dark:text-slate-200">
              <div className="text-[11px] uppercase tracking-wide text-slate-500 dark:text-slate-400">Started</div>
              <div className="font-semibold text-slate-900 dark:text-white">{session.started_at ? new Date(session.started_at).toLocaleString() : '—'}</div>
            </div>
            <div className="rounded-xl bg-slate-50 px-3 py-2 text-sm text-slate-600 shadow-sm dark:bg-slate-800/80 dark:text-slate-200">
              <div className="text-[11px] uppercase tracking-wide text-slate-500 dark:text-slate-400">Entries</div>
              <div className="font-semibold text-slate-900 dark:text-white">{session.count ?? session.items?.length ?? 0}</div>
            </div>
          </div>
        )}
      </header>

      <section className="rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-900/80">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:gap-4">
          <input
            value={filters.search}
            onChange={(event) => setFilters((prev) => ({ ...prev, search: event.target.value }))}
            placeholder="Search ingredients or suppliers"
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-blue-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:ring-blue-800"
          />
          <select
            value={filters.unit}
            onChange={(event) => setFilters((prev) => ({ ...prev, unit: event.target.value }))}
            className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-blue-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:ring-blue-800"
          >
            <option value="">Any unit</option>
            {meta.units.map((unit) => (
              <option key={unit.code} value={unit.code}>
                {unit.code} — {unit.name}
              </option>
            ))}
          </select>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">{filterButtons}</div>
      </section>

      <section className="space-y-3">
        {loading ? (
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6 text-center text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-900/70 dark:text-slate-300">Loading items…</div>
        ) : inventory.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-300">
            No items match your filters.
          </div>
        ) : (
          inventory.map((item) => {
            const form = counts[item.id] || {}
            return (
              <article
                key={item.id}
                className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-blue-200 focus-within:ring-2 focus-within:ring-blue-200 dark:border-slate-800 dark:bg-slate-900/80 dark:hover:border-blue-900/60"
              >
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <div className="text-sm font-semibold text-slate-900 dark:text-white">{item.name}</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">SKU {item.sku || '—'} · Base unit {item.base_unit || '—'}</div>
                    <div className="mt-1 flex flex-wrap gap-2 text-xs text-slate-500 dark:text-slate-400">
                      <span className="rounded-full bg-slate-100 px-2 py-1 dark:bg-slate-800">On hand: {item.quantity?.toFixed ? item.quantity.toFixed(2) : item.quantity}</span>
                      {item.low_stock && <span className="rounded-full bg-amber-100 px-2 py-1 text-amber-700 dark:bg-amber-900/40 dark:text-amber-100">Low</span>}
                      {item.expiring_soon && <span className="rounded-full bg-rose-100 px-2 py-1 text-rose-700 dark:bg-rose-900/40 dark:text-rose-100">Expiring</span>}
                    </div>
                  </div>
                  <div className="text-right text-xs text-slate-500 dark:text-slate-400">
                    {item.supplier?.name ? <span className="rounded-full bg-slate-100 px-2 py-1 dark:bg-slate-800">{item.supplier.name}</span> : null}
                  </div>
                </div>
                <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  <label className="space-y-1 text-sm text-slate-700 dark:text-slate-200">
                    <span className="text-xs font-semibold uppercase tracking-wide">Quantity counted</span>
                    <input
                      value={form.qty || ''}
                      onChange={(event) => setCounts((prev) => ({ ...prev, [item.id]: { ...prev[item.id], qty: event.target.value } }))}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-slate-900 outline-none focus:ring-2 focus:ring-emerald-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:ring-emerald-800"
                      placeholder="0"
                      inputMode="decimal"
                    />
                  </label>
                  <label className="space-y-1 text-sm text-slate-700 dark:text-slate-200">
                    <span className="text-xs font-semibold uppercase tracking-wide">Unit of measure</span>
                    <select
                      value={form.unit || ''}
                      onChange={(event) => setCounts((prev) => ({ ...prev, [item.id]: { ...prev[item.id], unit: event.target.value } }))}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-slate-900 outline-none focus:ring-2 focus:ring-emerald-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:ring-emerald-800"
                    >
                      {meta.units.map((unit) => (
                        <option key={unit.code} value={unit.code}>
                          {unit.code} — {unit.name}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="space-y-1 text-sm text-slate-700 dark:text-slate-200">
                    <span className="text-xs font-semibold uppercase tracking-wide">Expiration date</span>
                    <input
                      type="date"
                      value={form.expiration_date || ''}
                      onChange={(event) => setCounts((prev) => ({ ...prev, [item.id]: { ...prev[item.id], expiration_date: event.target.value } }))}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-slate-900 outline-none focus:ring-2 focus:ring-emerald-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:ring-emerald-800"
                    />
                  </label>
                  <label className="space-y-1 text-sm text-slate-700 dark:text-slate-200">
                    <span className="text-xs font-semibold uppercase tracking-wide">Notes</span>
                    <input
                      value={form.note || ''}
                      onChange={(event) => setCounts((prev) => ({ ...prev, [item.id]: { ...prev[item.id], note: event.target.value } }))}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-slate-900 outline-none focus:ring-2 focus:ring-emerald-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:ring-emerald-800"
                      placeholder="Optional note"
                    />
                  </label>
                </div>
                <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                  <div className="text-xs text-slate-500 dark:text-slate-400">Tap save after entering the count for this item.</div>
                  <button
                    onClick={() => recordCount(item)}
                    className="rounded-2xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-blue-500 dark:text-slate-900 dark:hover:bg-blue-400"
                    disabled={savingId === item.id || session?.completed_at}
                  >
                    {savingId === item.id ? 'Saving…' : 'Save count'}
                  </button>
                </div>
              </article>
            )
          })
        )}
      </section>
    </div>
  )
}

