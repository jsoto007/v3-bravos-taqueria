import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { api } from '../lib/api'
import ToastStack from '../components/ui/ToastStack'

const genId = () => (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}`)
const FILTER_LABELS = {
  all: 'All',
  low_stock: 'Low stock',
  expiring: 'Expiring soon',
  active: 'Active',
  inactive: 'Inactive',
}

export default function InventoryDashboard() {
  const [inventory, setInventory] = useState([])
  const [meta, setMeta] = useState({ units: [], suppliers: [] })
  const [alerts, setAlerts] = useState({ low_stock: [], expiring: [] })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filters, setFilters] = useState({ search: '', filter: 'all', unit: '' })
  const [newItem, setNewItem] = useState({ name: '', sku: '', base_unit: 'lb', par_level: '0', is_active: true })
  const [batchForm, setBatchForm] = useState({ inventory_item_id: '', qty: '0', unit_cost: '0', unit: 'lb', supplier: '', expiration_date: '' })
  const [editingId, setEditingId] = useState(null)
  const [editValues, setEditValues] = useState({ par_level: '', base_unit: '', is_active: true })
  const [toasts, setToasts] = useState([])

  const addToast = (type, message) => {
    const id = genId()
    setToasts((prev) => [...prev, { id, type, message }])
    window.setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000)
  }

  const fetchInventory = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const response = await api.adminInventoryList(filters)
      setInventory(response.items || [])
      setMeta(response.meta || { units: [], suppliers: [] })
      setAlerts(response.alerts || { low_stock: [], expiring: [] })
    } catch (err) {
      setError(err.message || 'Unable to load inventory')
    } finally {
      setLoading(false)
    }
  }, [filters])

  useEffect(() => {
    fetchInventory()
  }, [fetchInventory])

  const handleFilter = (key, value) => setFilters((prev) => ({ ...prev, [key]: value }))

  const handleItemCreate = async (event) => {
    event.preventDefault()
    if (!newItem.name.trim()) {
      addToast('error', 'Name is required for inventory item')
      return
    }
    try {
      await api.adminInventoryCreate({
        name: newItem.name.trim(),
        sku: newItem.sku.trim() || undefined,
        base_unit: newItem.base_unit,
        par_level: Number(newItem.par_level) || 0,
        is_active: Boolean(newItem.is_active),
      })
      addToast('success', 'Item created')
      setNewItem({ name: '', sku: '', base_unit: newItem.base_unit, par_level: '0', is_active: true })
      fetchInventory()
    } catch (err) {
      addToast('error', err.message || 'Failed to create item')
    }
  }

  const handleBatchCreate = async (event) => {
    event.preventDefault()
    if (!batchForm.inventory_item_id) {
      addToast('error', 'Select an item to receive stock')
      return
    }
    try {
      await api.adminInventoryAddBatch(batchForm.inventory_item_id, {
        qty: batchForm.qty,
        unit_cost: batchForm.unit_cost,
        unit: batchForm.unit,
        supplier: batchForm.supplier,
        expiration_date: batchForm.expiration_date,
      })
      addToast('success', 'Batch received')
      setBatchForm((prev) => ({ ...prev, qty: '0', unit_cost: '0', supplier: '', expiration_date: '' }))
      fetchInventory()
    } catch (err) {
      addToast('error', err.message || 'Unable to receive batch')
    }
  }

  const startEdit = (item) => {
    setEditingId(item.id)
    setEditValues({
      par_level: item.par_level?.toString() || '0',
      base_unit: item.base_unit || meta.units[0]?.code || 'lb',
      is_active: item.is_active,
    })
  }

  const cancelEdit = () => {
    setEditingId(null)
  }

  const saveEdit = async (item) => {
    try {
      await api.adminInventoryUpdate(item.id, {
        par_level: Number(editValues.par_level) || 0,
        base_unit: editValues.base_unit,
        is_active: editValues.is_active,
      })
      addToast('success', 'Item updated')
      setEditingId(null)
      fetchInventory()
    } catch (err) {
      addToast('error', err.message || 'Unable to update item')
    }
  }

  const handleDelete = async (itemId) => {
    if (!window.confirm('Delete this inventory item?')) return
    try {
      await api.adminInventoryDelete(itemId)
      addToast('success', 'Item deleted')
      fetchInventory()
    } catch (err) {
      addToast('error', err.message || 'Unable to delete item')
    }
  }

  const filterButtons = useMemo(
    () =>
      Object.entries(FILTER_LABELS).map(([key, label]) => (
        <button
          key={key}
          onClick={() => handleFilter('filter', key)}
          className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide transition ${filters.filter === key ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900' : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'}`}
        >
          {label}
        </button>
      )),
    [filters.filter]
  )

  return (
    <div className="space-y-6">
      <ToastStack toasts={toasts} />
      <section className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-wrap items-center gap-3">
          <input
            className="flex-1 rounded-2xl border border-slate-200 px-4 py-2 text-sm"
            placeholder="Search items or suppliers"
            value={filters.search}
            onChange={(event) => handleFilter('search', event.target.value)}
          />
          <select
            className="rounded-2xl border border-slate-200 px-4 py-2 text-sm"
            value={filters.unit}
            onChange={(event) => handleFilter('unit', event.target.value)}
          >
            <option value="">Any unit</option>
            {meta.units.map((unit) => (
              <option key={unit.code} value={unit.code}>
                {unit.code} — {unit.name}
              </option>
            ))}
          </select>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">{filterButtons}</div>
      </section>

      <section className="grid gap-4 lg:grid-cols-[1fr_320px]">
        <div className="space-y-4">
          {loading ? (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6 text-center text-sm text-slate-500">Loading inventory…</div>
          ) : inventory.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-sm text-slate-500">No inventory items yet.</div>
          ) : (
            <div className="space-y-3">
              {inventory.map((item) => (
                <article key={item.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-xs uppercase tracking-[0.2em] text-slate-400">Item</div>
                      <div className="text-lg font-semibold text-slate-900 dark:text-white">{item.name}</div>
                      <div className="text-sm text-slate-500">SKU {item.sku || '—'}</div>
                    </div>
                    <div className="text-right text-sm text-slate-500">
                      <div>Qty: {item.quantity.toFixed(2)}</div>
                      <div>Unit: {item.base_unit || '—'}</div>
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    {item.low_stock && <span className="rounded-full bg-rose-100 px-3 py-1 text-rose-700">Low stock</span>}
                    {item.expiring_soon && <span className="rounded-full bg-amber-100 px-3 py-1 text-amber-700">Expiring soon</span>}
                    {!item.low_stock && !item.expiring_soon && <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-600">Healthy</span>}
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <button className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold" onClick={() => startEdit(item)}>
                      Edit
                    </button>
                    <button className="rounded-full border border-rose-200 px-3 py-1 text-xs font-semibold text-rose-600" onClick={() => handleDelete(item.id)}>
                      Delete
                    </button>
                  </div>
                  {editingId === item.id && (
                    <div className="mt-4 space-y-3 border-t border-slate-200 pt-3 dark:border-slate-800">
                      <div className="grid gap-3 md:grid-cols-3">
                        <input
                          value={editValues.par_level}
                          onChange={(event) => setEditValues((prev) => ({ ...prev, par_level: event.target.value }))}
                          placeholder="Par level"
                          className="rounded-2xl border border-slate-200 px-4 py-2 text-sm"
                        />
                        <select
                          value={editValues.base_unit}
                          onChange={(event) => setEditValues((prev) => ({ ...prev, base_unit: event.target.value }))}
                          className="rounded-2xl border border-slate-200 px-4 py-2 text-sm"
                        >
                          {meta.units.map((unit) => (
                            <option key={unit.code} value={unit.code}>
                              {unit.code}
                            </option>
                          ))}
                        </select>
                        <label className="flex items-center gap-2 text-sm">
                          <input
                            type="checkbox"
                            checked={editValues.is_active}
                            onChange={(event) => setEditValues((prev) => ({ ...prev, is_active: event.target.checked }))}
                          />
                          Active
                        </label>
                      </div>
                      <div className="flex gap-3">
                        <button className="rounded-2xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white" onClick={() => saveEdit(item)}>
                          Save
                        </button>
                        <button className="rounded-2xl border border-slate-300 px-4 py-2 text-sm text-slate-600" onClick={cancelEdit}>
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </article>
              ))}
            </div>
          )}
        </div>
        <aside className="space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900">
            <div className="text-sm font-semibold">Alerts</div>
            <p className="text-xs text-slate-500">Low stock & expiring soon</p>
            <div className="mt-3 space-y-2">
              {alerts.low_stock.length === 0 && alerts.expiring.length === 0 ? (
                <div className="text-xs text-slate-500">All items look healthy.</div>
              ) : (
                <>
                  {alerts.low_stock.map((item) => (
                    <div key={`low-${item.id}`} className="rounded-2xl bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700">
                      {item.name} — {item.quantity.toFixed(2)} left
                    </div>
                  ))}
                  {alerts.expiring.map((item) => (
                    <div key={`exp-${item.id}`} className="rounded-2xl bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-800">
                      {item.name} — {item.days_to_expiration}d to exp.
                    </div>
                  ))}
                </>
              )}
            </div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
            <h3 className="text-sm font-semibold">Add inventory item</h3>
            <form onSubmit={handleItemCreate} className="space-y-3 mt-3 text-sm">
              <input
                value={newItem.name}
                onChange={(event) => setNewItem((prev) => ({ ...prev, name: event.target.value }))}
                placeholder="Name"
                className="w-full rounded-2xl border border-slate-200 px-3 py-2"
              />
              <input
                value={newItem.sku}
                onChange={(event) => setNewItem((prev) => ({ ...prev, sku: event.target.value }))}
                placeholder="SKU"
                className="w-full rounded-2xl border border-slate-200 px-3 py-2"
              />
              <div className="grid gap-3 md:grid-cols-2">
                <select
                  value={newItem.base_unit}
                  onChange={(event) => setNewItem((prev) => ({ ...prev, base_unit: event.target.value }))}
                  className="rounded-2xl border border-slate-200 px-3 py-2"
                >
                  {meta.units.map((unit) => (
                    <option key={unit.code} value={unit.code}>
                      {unit.code}
                    </option>
                  ))}
                </select>
                <input
                  value={newItem.par_level}
                  onChange={(event) => setNewItem((prev) => ({ ...prev, par_level: event.target.value }))}
                  placeholder="Par level"
                  className="rounded-2xl border border-slate-200 px-3 py-2"
                />
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={newItem.is_active}
                  onChange={(event) => setNewItem((prev) => ({ ...prev, is_active: event.target.checked }))}
                />
                Active
              </label>
              <button type="submit" className="w-full rounded-2xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white">
                Create item
              </button>
            </form>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
            <h3 className="text-sm font-semibold">Receive batch</h3>
            <form onSubmit={handleBatchCreate} className="space-y-3 mt-3 text-sm">
              <select
                value={batchForm.inventory_item_id}
                onChange={(event) => setBatchForm((prev) => ({ ...prev, inventory_item_id: event.target.value }))}
                className="w-full rounded-2xl border border-slate-200 px-3 py-2"
              >
                <option value="">Select item</option>
                {inventory.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
              <div className="grid gap-3 md:grid-cols-2">
                <input
                  value={batchForm.qty}
                  onChange={(event) => setBatchForm((prev) => ({ ...prev, qty: event.target.value }))}
                  placeholder="Qty"
                  className="rounded-2xl border border-slate-200 px-3 py-2"
                />
                <select
                  value={batchForm.unit}
                  onChange={(event) => setBatchForm((prev) => ({ ...prev, unit: event.target.value }))}
                  className="rounded-2xl border border-slate-200 px-3 py-2"
                >
                  {meta.units.map((unit) => (
                    <option key={unit.code} value={unit.code}>
                      {unit.code}
                    </option>
                  ))}
                </select>
              </div>
              <input
                value={batchForm.unit_cost}
                onChange={(event) => setBatchForm((prev) => ({ ...prev, unit_cost: event.target.value }))}
                placeholder="Unit cost"
                className="w-full rounded-2xl border border-slate-200 px-3 py-2"
              />
              <input
                value={batchForm.supplier}
                onChange={(event) => setBatchForm((prev) => ({ ...prev, supplier: event.target.value }))}
                placeholder="Supplier"
                className="w-full rounded-2xl border border-slate-200 px-3 py-2"
              />
              <input
                type="date"
                value={batchForm.expiration_date}
                onChange={(event) => setBatchForm((prev) => ({ ...prev, expiration_date: event.target.value }))}
                className="w-full rounded-2xl border border-slate-200 px-3 py-2"
              />
              <button type="submit" className="w-full rounded-2xl bg-amber-500 px-4 py-2 text-center text-sm font-semibold text-slate-900">
                Save batch
              </button>
            </form>
          </div>
        </aside>
      </section>
    </div>
  )
}
