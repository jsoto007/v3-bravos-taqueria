import React, { useState } from 'react'
import { api } from '../lib/api'

export default function InventoryDashboard(){
  const [itemName, setItemName] = useState('')
  const [baseUnit, setBaseUnit] = useState('lb')
  const [sku, setSku] = useState('')
  const [createdItem, setCreatedItem] = useState(null)

  const createItem = async ()=>{
    const res = await api.adminCreateInventoryItem({ name:itemName, base_unit:baseUnit, sku })
    setCreatedItem(res)
  }

  const [batch, setBatch] = useState({ inventory_item_id:'', supplier:'', qty:'', unit_cost:'', expiration_date:'' })
  const [batchRes, setBatchRes] = useState(null)

  const createBatch = async ()=>{
    const res = await api.adminCreateBatch({ ...batch, qty: Number(batch.qty), unit_cost: Number(batch.unit_cost) })
    setBatchRes(res)
  }

  return (
    <div className="space-y-6">
      <section className="bg-white rounded-2xl shadow p-6">
        <h3 className="font-semibold">Create Inventory Item</h3>
        <div className="mt-3 grid sm:grid-cols-3 gap-3">
          <input value={itemName} onChange={e=> setItemName(e.target.value)} placeholder="Name" className="border rounded px-3 py-2" />
          <input value={sku} onChange={e=> setSku(e.target.value)} placeholder="SKU (optional)" className="border rounded px-3 py-2" />
          <input value={baseUnit} onChange={e=> setBaseUnit(e.target.value)} placeholder="Base unit (e.g., lb, ea)" className="border rounded px-3 py-2" />
        </div>
        <button onClick={createItem} className="mt-3 px-4 py-2 rounded bg-indigo-600 text-white">Save Item</button>
        {createdItem && <div className="text-sm text-slate-600 mt-2">Created/Found item #{createdItem.id}: {createdItem.name} ({createdItem.base_unit})</div>}
      </section>

      <section className="bg-white rounded-2xl shadow p-6">
        <h3 className="font-semibold">Receive Batch</h3>
        <div className="grid sm:grid-cols-3 gap-3 mt-3">
          <input value={batch.inventory_item_id} onChange={e=> setBatch(b=>({...b, inventory_item_id:e.target.value}))} placeholder="Inventory Item ID" className="border rounded px-3 py-2" />
          <input value={batch.supplier} onChange={e=> setBatch(b=>({...b, supplier:e.target.value}))} placeholder="Supplier" className="border rounded px-3 py-2" />
          <input value={batch.qty} onChange={e=> setBatch(b=>({...b, qty:e.target.value}))} placeholder="Qty" className="border rounded px-3 py-2" />
          <input value={batch.unit_cost} onChange={e=> setBatch(b=>({...b, unit_cost:e.target.value}))} placeholder="Unit Cost" className="border rounded px-3 py-2" />
          <input value={batch.expiration_date} onChange={e=> setBatch(b=>({...b, expiration_date:e.target.value}))} placeholder="Expiration YYYY-MM-DD" className="border rounded px-3 py-2" />
        </div>
        <button onClick={createBatch} className="mt-3 px-4 py-2 rounded bg-indigo-600 text-white">Save Batch</button>
        {batchRes && <div className="text-sm text-slate-600 mt-2">Batch created #{batchRes.id}</div>}
      </section>
    </div>
  )
}
