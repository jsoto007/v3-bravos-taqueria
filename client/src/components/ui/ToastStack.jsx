import React from 'react'

export default function ToastStack({ toasts = [] }) {
  if (!toasts.length) return null
  return (
    <div className="pointer-events-none fixed top-24 right-4 z-50 flex flex-col gap-3">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`pointer-events-auto rounded-2xl px-4 py-3 shadow-xl shadow-slate-900/20 transition ${toast.type === 'error' ? 'bg-rose-600 text-white' : 'bg-emerald-600 text-white'}`}
        >
          {toast.message}
        </div>
      ))}
    </div>
  )
}
