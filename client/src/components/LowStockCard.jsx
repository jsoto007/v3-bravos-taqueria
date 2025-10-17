import React from 'react'
export default function LowStockCard({ name, qty, par }){
  const low = qty < par
  return (
    <div className={`p-4 rounded-2xl shadow ${low? 'bg-amber-50 border border-amber-200':'bg-white'}`}>
      <div className="font-medium">{name}</div>
      <div className="text-sm text-slate-600">On hand: {qty} / Par: {par}</div>
    </div>
  )
}
