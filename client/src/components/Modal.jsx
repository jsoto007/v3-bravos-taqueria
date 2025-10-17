import React from 'react'
export default function Modal({ open, title, onClose, children, footer }){
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4" onClick={onClose}>
      <div className="bg-white w-full max-w-lg rounded-2xl shadow" onClick={e=>e.stopPropagation()}>
        <div className="p-4 border-b font-semibold">{title}</div>
        <div className="p-4">{children}</div>
        <div className="p-4 border-t flex justify-end gap-2">{footer}</div>
      </div>
    </div>
  )
}
