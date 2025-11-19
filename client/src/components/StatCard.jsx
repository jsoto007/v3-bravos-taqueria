import React from 'react'
export default function StatCard({ label, value, hint }){
  return (
    <div className="mt-10 p-4 bg-white/90 rounded-2xl border border-slate-200 shadow-sm backdrop-blur dark:bg-slate-900/80 dark:border-slate-800">
      <div className="text-slate-600 text-sm font-semibold tracking-wide uppercase dark:text-slate-400">{label}</div>
      <div className="text-2xl font-semibold text-slate-900 dark:text-white">{value}</div>
      {hint && <div className="text-xs text-slate-500 mt-1 dark:text-slate-400">{hint}</div>}
    </div>
  )
}
