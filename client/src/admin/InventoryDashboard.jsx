import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { api } from '../lib/api'
import Modal from '../components/Modal'
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
  const [auditSession, setAuditSession] = useState(null)
  const [auditSessions, setAuditSessions] = useState([])
  const [auditNote, setAuditNote] = useState('')
  const [auditModalItem, setAuditModalItem] = useState(null)
  const [auditForm, setAuditForm] = useState({ qty: '', expiration_date: '', note: '', unit: '' })
  const [auditLoading, setAuditLoading] = useState(false)

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

  const fetchAuditSessions = useCallback(async () => {
    try {
      const response = await api.adminInventoryAuditSessions()
      setAuditSessions(response.sessions || [])
      if (!auditSession && response.sessions?.length) {
        const active = response.sessions.find((s) => !s.completed_at)
        if (active) setAuditSession(active)
      }
    } catch (err) {
      addToast('error', err.message || 'Unable to load audit sessions')
    }
  }, [auditSession])

  useEffect(() => {
    fetchInventory()
    fetchAuditSessions()
  }, [fetchInventory, fetchAuditSessions])

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

  const startAuditSession = async (event) => {
    event?.preventDefault()
    if (auditSession && !auditSession.completed_at) {
      addToast('error', 'Finish the active session before starting a new one')
      return
    }
    let sessionTab
    try {
      sessionTab = window.open('', '_blank')
    } catch (err) {
      console.warn('Unable to pre-open session tab', err)
    }
    setAuditLoading(true)
    try {
      const session = await api.adminInventoryAuditCreate({ note: auditNote })
      setAuditSession(session)
      setAuditNote('')
      addToast('success', 'Inventory session started')
      fetchAuditSessions()
      const sessionUrl = `/admin/inventory/session/${session.id}`
      if (sessionTab && !sessionTab.closed) {
        sessionTab.location.href = sessionUrl
        sessionTab.focus()
      } else {
        window.open(sessionUrl, '_blank')
      }
    } catch (err) {
      if (sessionTab && !sessionTab.closed) sessionTab.close()
      addToast('error', err.message || 'Unable to start session')
    } finally {
      setAuditLoading(false)
    }
  }

  const completeAuditSession = async () => {
    if (!auditSession) return
    setAuditLoading(true)
    try {
      const updated = await api.adminInventoryAuditUpdate(auditSession.id, { complete: true, note: auditSession.note })
      setAuditSession(updated)
      addToast('success', 'Session completed')
      fetchAuditSessions()
    } catch (err) {
      addToast('error', err.message || 'Unable to close session')
    } finally {
      setAuditLoading(false)
    }
  }

  const saveAuditNote = async () => {
    if (!auditSession) return
    setAuditLoading(true)
    try {
      const updated = await api.adminInventoryAuditUpdate(auditSession.id, { note: auditSession.note })
      setAuditSession(updated)
      addToast('success', 'Session details saved')
      fetchAuditSessions()
    } catch (err) {
      addToast('error', err.message || 'Unable to save session note')
    } finally {
      setAuditLoading(false)
    }
  }

  const openAuditModal = (item) => {
    if (!auditSession) {
      addToast('error', 'Start a session to conduct inventory')
      return
    }
    setAuditModalItem(item)
    setAuditForm({
      qty: item.quantity?.toString() || '0',
      expiration_date: item.expiration_date || '',
      note: '',
      unit: item.base_unit || '',
    })
  }

  const closeAuditModal = () => setAuditModalItem(null)

  const saveAuditItem = async (event) => {
    event.preventDefault()
    if (!auditSession || !auditModalItem) return
    setAuditLoading(true)
    try {
      const response = await api.adminInventoryAuditAddItem(auditSession.id, {
        inventory_item_id: auditModalItem.id,
        new_qty: auditForm.qty,
        unit: auditForm.unit || auditModalItem.base_unit,
        expiration_date: auditForm.expiration_date || undefined,
        note: auditForm.note,
      })
      setAuditSession(response.session)
      addToast('success', 'Inventory updated for this session')
      closeAuditModal()
      fetchInventory()
      fetchAuditSessions()
    } catch (err) {
      addToast('error', err.message || 'Unable to save inventory audit')
    } finally {
      setAuditLoading(false)
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
      <section className="rounded-2xl border border-slate-200 bg-white/90 p-5 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-900/80">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-2">
            <div className="text-xs uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">Inventory sessions</div>
            <div className="text-lg font-semibold text-slate-900 dark:text-white">Conduct Inventory</div>
            <p className="max-w-3xl text-sm text-slate-500 dark:text-slate-400">
              Launch a new audit to review every item, update on-hand quantities, and capture expiration changes with your name and timestamp for traceability.
            </p>
          </div>
          <form onSubmit={startAuditSession} className="flex w-full max-w-xl flex-col gap-2 lg:flex-row lg:items-center">
            <input
              value={auditSession && !auditSession.completed_at ? auditSession.note || '' : auditNote}
              onChange={(event) => {
                const value = event.target.value
                if (auditSession && !auditSession.completed_at) {
                  setAuditSession((prev) => (prev ? { ...prev, note: value } : prev))
                } else {
                  setAuditNote(value)
                }
              }}
              placeholder="Session note or location (optional)"
              className="flex-1 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-blue-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:ring-blue-800"
              disabled={auditSession?.completed_at}
            />
            <div className="flex items-center gap-2">
              <button
                type="submit"
                className="rounded-2xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-emerald-500 dark:text-slate-900 dark:hover:bg-emerald-400"
                disabled={auditLoading || (auditSession && !auditSession.completed_at)}
              >
                {auditSession && !auditSession.completed_at ? 'Session active' : 'Conduct Inventory'}
              </button>
              {auditSession && !auditSession.completed_at && (
                <button
                  type="button"
                  onClick={saveAuditNote}
                  className="rounded-2xl border border-blue-200 px-4 py-2 text-sm font-semibold text-blue-700 shadow-sm transition hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-100 dark:border-blue-800 dark:bg-blue-900/30 dark:text-blue-100 dark:hover:bg-blue-900/50 dark:focus:ring-blue-900"
                  disabled={auditLoading}
                >
                  Save note
                </button>
              )}
              {auditSession && !auditSession.completed_at && (
                <button
                  type="button"
                  onClick={completeAuditSession}
                  className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800 dark:focus:ring-slate-700"
                  disabled={auditLoading}
                >
                  Complete session
                </button>
              )}
            </div>
          </form>
        </div>
        {auditSession && (
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600 shadow-sm dark:bg-slate-800/80 dark:text-slate-200">
              <div className="text-xs uppercase tracking-wide text-slate-400 dark:text-slate-500">Status</div>
              <div className="font-semibold text-slate-900 dark:text-white">{auditSession.completed_at ? 'Completed' : 'Active'}</div>
            </div>
            <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600 shadow-sm dark:bg-slate-800/80 dark:text-slate-200">
              <div className="text-xs uppercase tracking-wide text-slate-400 dark:text-slate-500">Started</div>
              <div className="font-semibold text-slate-900 dark:text-white">{new Date(auditSession.started_at).toLocaleString()}</div>
            </div>
            <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600 shadow-sm dark:bg-slate-800/80 dark:text-slate-200">
              <div className="text-xs uppercase tracking-wide text-slate-400 dark:text-slate-500">Entries</div>
              <div className="font-semibold text-slate-900 dark:text-white">{auditSession.count ?? auditSession.items?.length ?? 0}</div>
            </div>
          </div>
        )}
      </section>
      <section className="rounded-2xl border border-slate-200 bg-white/90 p-5 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-900/80">
        <div className="flex flex-wrap items-center gap-3">
          <input
            className="flex-1 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-blue-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:ring-blue-800"
            placeholder="Search items or suppliers"
            value={filters.search}
            onChange={(event) => handleFilter('search', event.target.value)}
          />
          <select
            className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-blue-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:ring-blue-800"
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
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6 text-center text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-300">Loading inventory…</div>
          ) : inventory.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-300">No inventory items yet.</div>
          ) : (
            <div className="space-y-3">
              {inventory.map((item) => (
                <article key={item.id} className="rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-slate-800 dark:bg-slate-900/80">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-xs uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">Item</div>
                      <div className="text-lg font-semibold text-slate-900 dark:text-white">{item.name}</div>
                      <div className="text-sm text-slate-500 dark:text-slate-400">SKU {item.sku || '—'}</div>
                    </div>
                    <div className="text-right text-sm text-slate-500 dark:text-slate-400">
                      <div>Qty: {item.quantity.toFixed(2)}</div>
                      <div>Unit: {item.base_unit || '—'}</div>
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    {item.low_stock && <span className="rounded-full bg-rose-100 px-3 py-1 text-rose-700 dark:bg-rose-900/40 dark:text-rose-100">Low stock</span>}
                    {item.expiring_soon && <span className="rounded-full bg-amber-100 px-3 py-1 text-amber-700 dark:bg-amber-900/40 dark:text-amber-100">Expiring soon</span>}
                    {!item.low_stock && !item.expiring_soon && <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-600 dark:bg-slate-800/70 dark:text-slate-200">Healthy</span>}
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <button className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 shadow-sm transition hover:bg-emerald-100 focus:outline-none focus:ring-2 focus:ring-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-100 dark:hover:bg-emerald-900/60 dark:focus:ring-emerald-900" onClick={() => openAuditModal(item)}>
                      Update qty / exp
                    </button>
                    <button className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800 dark:focus:ring-slate-700" onClick={() => startEdit(item)}>
                      Edit
                    </button>
                    <button className="rounded-full border border-rose-200 px-3 py-1 text-xs font-semibold text-rose-600 shadow-sm hover:bg-rose-50 focus:outline-none focus:ring-2 focus:ring-rose-100 dark:border-rose-800 dark:bg-rose-900/40 dark:text-rose-100 dark:hover:bg-rose-900/60 dark:focus:ring-rose-900" onClick={() => handleDelete(item.id)}>
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
                          className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-blue-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:ring-blue-800"
                        />
                        <select
                          value={editValues.base_unit}
                          onChange={(event) => setEditValues((prev) => ({ ...prev, base_unit: event.target.value }))}
                          className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-blue-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:ring-blue-800"
                        >
                          {meta.units.map((unit) => (
                            <option key={unit.code} value={unit.code}>
                              {unit.code}
                            </option>
                          ))}
                        </select>
                        <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-200">
                          <input
                            type="checkbox"
                            checked={editValues.is_active}
                            onChange={(event) => setEditValues((prev) => ({ ...prev, is_active: event.target.checked }))}
                          />
                          Active
                        </label>
                      </div>
                      <div className="flex gap-3">
                        <button className="rounded-2xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-200 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200 dark:focus:ring-slate-700" onClick={() => saveEdit(item)}>
                          Save
                        </button>
                        <button className="rounded-2xl border border-slate-300 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-200 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800 dark:focus:ring-slate-700" onClick={cancelEdit}>
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
          <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900/80">
            <div className="text-sm font-semibold text-slate-900 dark:text-white">Alerts</div>
            <p className="text-xs text-slate-500 dark:text-slate-400">Low stock & expiring soon</p>
            <div className="mt-3 space-y-2">
              {alerts.low_stock.length === 0 && alerts.expiring.length === 0 ? (
                <div className="text-xs text-slate-500 dark:text-slate-400">All items look healthy.</div>
              ) : (
                <>
                  {alerts.low_stock.map((item) => (
                    <div key={`low-${item.id}`} className="rounded-2xl bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700 dark:bg-rose-900/30 dark:text-rose-100">
                      {item.name} — {item.quantity.toFixed(2)} left
                    </div>
                  ))}
                  {alerts.expiring.map((item) => (
                    <div key={`exp-${item.id}`} className="rounded-2xl bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-800 dark:bg-amber-900/30 dark:text-amber-100">
                      {item.name} — {item.days_to_expiration}d to exp.
                    </div>
                  ))}
                </>
              )}
            </div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900/80">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Audit history</h3>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                Last 25
              </span>
            </div>
            <div className="mt-3 space-y-2 text-sm">
              {auditSessions.length === 0 ? (
                <div className="text-xs text-slate-500 dark:text-slate-400">No prior inventory audits.</div>
              ) : (
                auditSessions.map((session) => (
                  <div key={session.id} className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 shadow-sm dark:border-slate-700 dark:bg-slate-900/50">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-[11px] uppercase tracking-wide text-slate-500 dark:text-slate-400">{session.user?.name || 'Unknown user'}</div>
                        <div className="font-semibold text-slate-900 dark:text-white">{new Date(session.started_at).toLocaleString()}</div>
                      </div>
                      <div className="flex flex-col items-end gap-1 text-xs font-semibold uppercase tracking-wide">
                        <span className={`rounded-full px-3 py-1 ${session.completed_at ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-100' : 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-100'}`}>
                          {session.completed_at ? 'Done' : 'Active'}
                        </span>
                        <span className="text-slate-500 dark:text-slate-400">{session.count ?? session.items?.length ?? 0} entries</span>
                      </div>
                    </div>
                    {session.note && <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">Note: {session.note}</div>}
                  </div>
                ))
              )}
            </div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900/80">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Add inventory item</h3>
            <form onSubmit={handleItemCreate} className="space-y-3 mt-3 text-sm">
              <input
                value={newItem.name}
                onChange={(event) => setNewItem((prev) => ({ ...prev, name: event.target.value }))}
                placeholder="Name"
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-slate-900 outline-none focus:ring-2 focus:ring-blue-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:ring-blue-800"
              />
              <input
                value={newItem.sku}
                onChange={(event) => setNewItem((prev) => ({ ...prev, sku: event.target.value }))}
                placeholder="SKU"
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-slate-900 outline-none focus:ring-2 focus:ring-blue-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:ring-blue-800"
              />
              <div className="grid gap-3 md:grid-cols-2">
                <select
                  value={newItem.base_unit}
                  onChange={(event) => setNewItem((prev) => ({ ...prev, base_unit: event.target.value }))}
                  className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-slate-900 outline-none focus:ring-2 focus:ring-blue-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:ring-blue-800"
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
                  className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-slate-900 outline-none focus:ring-2 focus:ring-blue-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:ring-blue-800"
                />
              </div>
              <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-200">
                <input
                  type="checkbox"
                  checked={newItem.is_active}
                  onChange={(event) => setNewItem((prev) => ({ ...prev, is_active: event.target.checked }))}
                />
                Active
              </label>
              <button type="submit" className="w-full rounded-2xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-200 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200 dark:focus:ring-slate-700">
                Create item
              </button>
            </form>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900/80">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Receive batch</h3>
            <form onSubmit={handleBatchCreate} className="space-y-3 mt-3 text-sm">
              <select
                value={batchForm.inventory_item_id}
                onChange={(event) => setBatchForm((prev) => ({ ...prev, inventory_item_id: event.target.value }))}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-slate-900 outline-none focus:ring-2 focus:ring-blue-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:ring-blue-800"
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
                  className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-slate-900 outline-none focus:ring-2 focus:ring-blue-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:ring-blue-800"
                />
                <select
                  value={batchForm.unit}
                  onChange={(event) => setBatchForm((prev) => ({ ...prev, unit: event.target.value }))}
                  className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-slate-900 outline-none focus:ring-2 focus:ring-blue-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:ring-blue-800"
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
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-slate-900 outline-none focus:ring-2 focus:ring-blue-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:ring-blue-800"
              />
              <input
                value={batchForm.supplier}
                onChange={(event) => setBatchForm((prev) => ({ ...prev, supplier: event.target.value }))}
                placeholder="Supplier"
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-slate-900 outline-none focus:ring-2 focus:ring-blue-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:ring-blue-800"
              />
              <input
                type="date"
                value={batchForm.expiration_date}
                onChange={(event) => setBatchForm((prev) => ({ ...prev, expiration_date: event.target.value }))}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-slate-900 outline-none focus:ring-2 focus:ring-blue-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:ring-blue-800"
              />
              <button type="submit" className="w-full rounded-2xl bg-amber-500 px-4 py-2 text-center text-sm font-semibold text-slate-900 shadow-sm hover:bg-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-200 dark:bg-amber-400 dark:text-slate-900 dark:hover:bg-amber-300 dark:focus:ring-amber-700">
                Save batch
              </button>
            </form>
          </div>
        </aside>
      </section>
      <Modal
        open={!!auditModalItem}
        title={auditModalItem ? `Update ${auditModalItem.name}` : 'Conduct inventory'}
        onClose={closeAuditModal}
        footer={(
          <>
            <button
              type="button"
              onClick={closeAuditModal}
              className="rounded-2xl border border-slate-300 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-200 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800 dark:focus:ring-slate-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="audit-form"
              className="rounded-2xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-emerald-500 dark:text-slate-900 dark:hover:bg-emerald-400"
              disabled={auditLoading}
            >
              Save update
            </button>
          </>
        )}
      >
        <form id="audit-form" onSubmit={saveAuditItem} className="space-y-3 text-sm">
          <p className="text-slate-600 dark:text-slate-300">
            Record the counted quantity and expiration date for <span className="font-semibold">{auditModalItem?.name}</span>. The update will be saved to your active inventory session.
          </p>
          <label className="space-y-1 text-slate-700 dark:text-slate-200">
            <span className="text-xs font-semibold uppercase tracking-wide">Quantity on hand</span>
            <input
              value={auditForm.qty}
              onChange={(event) => setAuditForm((prev) => ({ ...prev, qty: event.target.value }))}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-slate-900 outline-none focus:ring-2 focus:ring-emerald-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:ring-emerald-800"
              placeholder="0"
              required
            />
          </label>
          <label className="space-y-1 text-slate-700 dark:text-slate-200">
            <span className="text-xs font-semibold uppercase tracking-wide">Unit of measure</span>
            <select
              value={auditForm.unit}
              onChange={(event) => setAuditForm((prev) => ({ ...prev, unit: event.target.value }))}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-slate-900 outline-none focus:ring-2 focus:ring-emerald-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:ring-emerald-800"
            >
              {meta.units.map((unit) => (
                <option key={unit.code} value={unit.code}>
                  {unit.code} — {unit.name}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-1 text-slate-700 dark:text-slate-200">
            <span className="text-xs font-semibold uppercase tracking-wide">Expiration date</span>
            <input
              type="date"
              value={auditForm.expiration_date}
              onChange={(event) => setAuditForm((prev) => ({ ...prev, expiration_date: event.target.value }))}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-slate-900 outline-none focus:ring-2 focus:ring-emerald-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:ring-emerald-800"
            />
          </label>
          <label className="space-y-1 text-slate-700 dark:text-slate-200">
            <span className="text-xs font-semibold uppercase tracking-wide">Notes</span>
            <textarea
              value={auditForm.note}
              onChange={(event) => setAuditForm((prev) => ({ ...prev, note: event.target.value }))}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-slate-900 outline-none focus:ring-2 focus:ring-emerald-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:ring-emerald-800"
              rows="3"
              placeholder="Add context for this adjustment"
            />
          </label>
          <div className="rounded-xl bg-slate-50 px-3 py-2 text-xs text-slate-600 dark:bg-slate-800/60 dark:text-slate-300">
            {auditSession?.completed_at
              ? 'This session is already completed.'
              : 'Changes are logged with your user, timestamp, and saved for audit history.'}
          </div>
        </form>
      </Modal>
    </div>
  )
}
