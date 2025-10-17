import React, { useState } from 'react'
import { api } from '../lib/api'

export default function FoodCost(){
  const [menuItemId, setMenuItemId] = useState('')
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')

  const fetchCost = async ()=>{
    try { setError(''); setResult(await api.adminFoodCost(Number(menuItemId))) }
    catch(e){ setError(e.message); setResult(null) }
  }

  return (
    <div className="bg-white rounded-2xl shadow p-6">
      <h3 className="font-semibold">Food Cost</h3>
      <div className="mt-3 flex gap-2">
        <input value={menuItemId} onChange={e=> setMenuItemId(e.target.value)} placeholder="Menu Item ID" className="border rounded px-3 py-2" />
        <button onClick={fetchCost} className="px-4 py-2 rounded bg-indigo-600 text-white">Calculate</button>
      </div>
      {error && <div className="text-rose-600 text-sm mt-2">{error}</div>}
      {result && (
        <div className="mt-4">
          <div className="font-medium">Total: ${Number(result.food_cost).toFixed(2)}</div>
          <ul className="mt-2 text-sm space-y-1">
            {result.breakdown.map((b, idx)=> (
              <li key={idx} className="flex justify-between">
                <span>{b.ingredient} — {b.qty}</span>
                <span>${Number(b.extended).toFixed(2)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

