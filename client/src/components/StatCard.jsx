import React from 'react'
export default function StatCard({ label, value, hint }){
  return (
    <div className="mt-10 p-4 bg-white rounded-2xl shadow">
      <div className="text-slate-500 text-sm">{label}</div>
      <div className="text-2xl font-semibold">{value}</div>
      {hint && <div className="text-xs text-slate-400 mt-1">{hint}</div>}
    </div>
  )
}
