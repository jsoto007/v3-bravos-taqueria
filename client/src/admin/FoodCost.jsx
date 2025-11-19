import React, { useEffect, useState } from 'react'
import StatCard from '../components/StatCard'
import { api, fmtCurrency } from '../lib/api'

const PERIODS = [
  { key: 'day', label: '24h' },
  { key: 'week', label: '7d' },
  { key: 'month', label: '30d' },
]

export default function FoodCost() {
  const [summary, setSummary] = useState(null)
  const [items, setItems] = useState([])
  const [period, setPeriod] = useState('week')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const load = async () => {
    setLoading(true)
    setError('')
    try {
      const data = await api.adminFoodCostSummary({ period })
      setSummary(data.summary)
      setItems(data.items || [])
    } catch (err) {
      setError(err.message || 'Unable to load food cost data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [period])

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">Food Cost snapshot</h2>
            <p className="text-sm text-slate-500">Based on recent orders</p>
          </div>
          <div className="flex items-center gap-2">
            {PERIODS.map((p) => (
              <button
                key={p.key}
                className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide ${period === p.key ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900' : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'}`}
                onClick={() => setPeriod(p.key)}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
        {error && <div className="mt-4 text-sm text-rose-600">{error}</div>}
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <StatCard label="Revenue" value={summary ? fmtCurrency(summary.total_revenue) : loading ? 'Loading…' : '—'} />
          <StatCard label="COGS" value={summary ? fmtCurrency(summary.total_cogs) : '—'} />
          <StatCard label="Food cost %" value={summary && summary.food_cost_pct ? `${summary.food_cost_pct}%` : '—'} />
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {loading ? (
          <div className="col-span-full rounded-2xl border border-slate-200 bg-slate-50 p-6 text-center text-sm text-slate-500">Loading…</div>
        ) : (
          items.map((item) => (
            <article key={item.name} className="rounded-2xl border border-slate-200 bg-white p-4 text-sm dark:border-slate-800 dark:bg-slate-900">
              <div className="text-xs uppercase tracking-[0.3em] text-slate-400">{item.qty_sold ? `${item.qty_sold} sold` : 'No sales'}</div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{item.name}</h3>
              <p className="text-slate-500">Ingredient cost: {fmtCurrency(item.ingredient_cost)}</p>
              <p className="text-slate-500">Sale price: {fmtCurrency(item.sale_price)}</p>
              <p className="text-slate-500">Food cost: {item.food_cost_pct ? `${item.food_cost_pct}%` : '—'}</p>
            </article>
          ))
        )}
      </section>
    </div>
  )
}
