import React from 'react'
import { fmtCurrency } from '../lib/api'

export default function MenuCard({ item, onAdd }){
  return (
    <div className="bg-white rounded-2xl shadow overflow-hidden flex flex-col">
      {item.image_url && <img loading="lazy" src={item.image_url} alt={item.name} className="h-40 w-full object-cover" />}
      <div className="p-4 flex-1 flex flex-col">
        <div className="font-semibold">{item.name}</div>
        {item.description && <p className="text-sm text-slate-600 line-clamp-3 mt-1">{item.description}</p>}
        <div className="mt-auto flex items-center justify-between pt-3">
          <div className="text-lg font-semibold">{fmtCurrency(item.price)}</div>
          <button onClick={()=> onAdd(item)} className="px-3 py-1.5 rounded bg-indigo-600 text-white hover:bg-indigo-700">Add</button>
        </div>
      </div>
    </div>
  )
}
